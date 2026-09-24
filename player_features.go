package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"math"
	"net/http"
	"os/exec"
	"sort"
	"strconv"
	"strings"
	"time"
)

type chapter struct {
	Title string  `json:"title"`
	Start float64 `json:"start"`
	End   float64 `json:"end"`
}
type limitedProbeOutput struct{ bytes.Buffer }

func (b *limitedProbeOutput) Write(p []byte) (int, error) {
	if b.Len()+len(p) > 1<<20 {
		return 0, errors.New("chapter metadata too large")
	}
	return b.Buffer.Write(p)
}

var chapterSlots = make(chan struct{}, 2)

func parseChapters(data []byte) ([]chapter, error) {
	var input struct {
		Chapters []struct {
			Start string            `json:"start_time"`
			End   string            `json:"end_time"`
			Tags  map[string]string `json:"tags"`
		} `json:"chapters"`
	}
	if e := json.Unmarshal(data, &input); e != nil {
		return nil, e
	}
	if len(input.Chapters) > 5000 {
		return nil, errors.New("too many chapters")
	}
	out := []chapter{}
	for i, c := range input.Chapters {
		start, e1 := strconv.ParseFloat(c.Start, 64)
		end, e2 := strconv.ParseFloat(c.End, 64)
		if e1 != nil || e2 != nil || math.IsNaN(start) || math.IsNaN(end) || math.IsInf(start, 0) || math.IsInf(end, 0) || start < 0 || end < start || end > 31536000 {
			return nil, errors.New("invalid chapter timing")
		}
		title := strings.TrimSpace(c.Tags["title"])
		if title == "" {
			title = "Chapter " + strconv.Itoa(i+1)
		}
		if len(title) > 1000 {
			title = title[:1000]
		}
		out = append(out, chapter{title, start, end})
	}
	sort.SliceStable(out, func(i, j int) bool { return out[i].Start < out[j].Start })
	return out, nil
}
func (a *app) initPlayerFeatures() error {
	_, e := a.db.Exec(`CREATE TABLE IF NOT EXISTS playback_queue(profile_id INTEGER PRIMARY KEY,ids TEXT NOT NULL,revision INTEGER NOT NULL)`)
	return e
}
func (a *app) playerFeatureRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/assets/{id}/chapters", func(w http.ResponseWriter, r *http.Request) {
		f, format, e := a.openAsset(r.PathValue("id"))
		if e != nil {
			fail(w, 404, errors.New("audio unavailable"))
			return
		}
		defer f.Close()
		if format != "Audio" {
			fail(w, 400, errors.New("not an audiobook"))
			return
		}
		info, e := f.Stat()
		if e != nil || !info.Mode().IsRegular() {
			fail(w, 400, errors.New("invalid audio file"))
			return
		}
		select {
		case chapterSlots <- struct{}{}:
			defer func() { <-chapterSlots }()
		default:
			fail(w, 429, errors.New("chapter reader busy; try again"))
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
		defer cancel()
		cmd := exec.CommandContext(ctx, "ffprobe", "-v", "error", "-protocol_whitelist", "file", "-format_whitelist", "mov,mp3,ogg,flac,wav,aac,matroska,asf", "-show_entries", "chapter=start_time,end_time:chapter_tags=title", "-of", "json", "/proc/self/fd/3")
		cmd.ExtraFiles = append(cmd.ExtraFiles, f)
		var output limitedProbeOutput
		cmd.Stdout = &output
		if e = cmd.Run(); e != nil {
			if errors.Is(e, exec.ErrNotFound) {
				fail(w, 501, errors.New("server chapter decoder is not installed"))
			} else {
				fail(w, 422, errors.New("chapter metadata could not be read within resource limits"))
			}
			return
		}
		chapters, e := parseChapters(output.Bytes())
		if e != nil {
			fail(w, 422, e)
			return
		}
		reply(w, chapters)
	})
	mux.HandleFunc("GET /api/queue", func(w http.ResponseWriter, r *http.Request) {
		var encoded string
		var revision int64
		e := a.db.QueryRow("SELECT ids,revision FROM playback_queue WHERE profile_id=?", who(r).ID).Scan(&encoded, &revision)
		if e != nil && e != sql.ErrNoRows {
			fail(w, 500, e)
			return
		}
		ids := []int64{}
		if encoded != "" {
			if e = json.Unmarshal([]byte(encoded), &ids); e != nil {
				fail(w, 500, e)
				return
			}
		}
		items := []book{}
		for _, id := range ids {
			var b book
			e = a.db.QueryRow(`SELECT a.id,a.title,a.format,s.space,a.available FROM assets a JOIN sources s ON s.id=a.source_id WHERE a.id=? AND a.format='Audio' AND (? OR s.space IN (SELECT space FROM grants WHERE profile_id=?))`, id, who(r).Owner, who(r).ID).Scan(&b.ID, &b.Title, &b.Format, &b.Space, &b.Available)
			if e == sql.ErrNoRows {
				continue
			}
			if e != nil {
				fail(w, 500, e)
				return
			}
			items = append(items, b)
		}
		reply(w, map[string]any{"items": items, "revision": revision})
	})
	mux.HandleFunc("PUT /api/queue", func(w http.ResponseWriter, r *http.Request) {
		var in struct {
			IDs      []int64 `json:"ids"`
			Revision int64   `json:"revision"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&in) != nil || len(in.IDs) > 100 || in.Revision < 0 {
			fail(w, 400, errors.New("invalid queue; maximum 100 books"))
			return
		}
		tx, e := a.db.Begin()
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer tx.Rollback()
		var revision int64
		e = tx.QueryRow("SELECT revision FROM playback_queue WHERE profile_id=?", who(r).ID).Scan(&revision)
		if e != nil && e != sql.ErrNoRows {
			fail(w, 500, e)
			return
		}
		if revision != in.Revision {
			fail(w, 409, errors.New("queue changed on another device; reload it"))
			return
		}
		seen := map[int64]bool{}
		for _, id := range in.IDs {
			if seen[id] {
				fail(w, 400, errors.New("duplicate queue entry"))
				return
			}
			seen[id] = true
			var n int
			e = tx.QueryRow(`SELECT count(*) FROM assets a JOIN sources s ON s.id=a.source_id WHERE a.id=? AND a.format='Audio' AND (? OR s.space IN (SELECT space FROM grants WHERE profile_id=?))`, id, who(r).Owner, who(r).ID).Scan(&n)
			if e != nil {
				fail(w, 500, e)
				return
			}
			if n != 1 {
				fail(w, 403, errors.New("queue contains inaccessible audio"))
				return
			}
		}
		b, _ := json.Marshal(in.IDs)
		if _, e = tx.Exec("INSERT INTO playback_queue VALUES(?,?,?) ON CONFLICT(profile_id) DO UPDATE SET ids=excluded.ids,revision=excluded.revision", who(r).ID, string(b), revision+1); e != nil {
			fail(w, 500, e)
			return
		}
		if e = tx.Commit(); e != nil {
			fail(w, 500, e)
			return
		}
		reply(w, map[string]int64{"revision": revision + 1})
	})
}
