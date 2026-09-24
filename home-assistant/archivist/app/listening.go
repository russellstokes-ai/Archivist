package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
)

func (a *app) initListening() error {
	_, err := a.db.Exec(`CREATE TABLE IF NOT EXISTS asset_progress(profile_id INTEGER NOT NULL,asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,seconds REAL NOT NULL,revision INTEGER NOT NULL,complete INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(profile_id,asset_id))`)
	return err
}

func (a *app) listeningRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/assets/{id}/listening", func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
		var title, format string
		var available bool
		if err != nil {
			fail(w, 400, errors.New("invalid asset"))
			return
		}
		if err = a.db.QueryRow("SELECT title,format,available FROM assets WHERE id=?", id).Scan(&title, &format, &available); err != nil || format != "Audio" {
			fail(w, 404, errors.New("audiobook unavailable"))
			return
		}
		type track struct {
			ID        int64  `json:"id"`
			Title     string `json:"title"`
			Available bool   `json:"available"`
		}
		tracks := []track{{id, title, available}}
		progressURL := "/api/assets/" + strconv.FormatInt(id, 10) + "/listening-progress"
		var edition int64
		err = a.db.QueryRow("SELECT edition_id FROM edition_assets WHERE asset_id=?", id).Scan(&edition)
		if err != nil && err != sql.ErrNoRows {
			fail(w, 500, err)
			return
		}
		if err == nil {
			rows, e := a.db.Query(`SELECT a.id,a.title,a.available FROM edition_assets ea JOIN assets a ON a.id=ea.asset_id WHERE ea.edition_id=? ORDER BY ea.position`, edition)
			if e != nil {
				fail(w, 500, e)
				return
			}
			tracks = []track{}
			for rows.Next() {
				var t track
				if e = rows.Scan(&t.ID, &t.Title, &t.Available); e != nil {
					rows.Close()
					fail(w, 500, e)
					return
				}
				tracks = append(tracks, t)
			}
			e = rows.Err()
			rows.Close()
			if e != nil {
				fail(w, 500, e)
				return
			}
			progressURL = "/api/editions/" + strconv.FormatInt(edition, 10) + "/progress"
		}
		reply(w, map[string]any{"tracks": tracks, "progressURL": progressURL})
	})
	mux.HandleFunc("GET /api/assets/{id}/listening-progress", func(w http.ResponseWriter, r *http.Request) {
		var p progress
		err := a.db.QueryRow("SELECT asset_id,seconds,revision,complete FROM asset_progress WHERE profile_id=? AND asset_id=?", who(r).ID, r.PathValue("id")).Scan(&p.Asset, &p.Seconds, &p.Revision, &p.Complete)
		if err != nil && err != sql.ErrNoRows {
			fail(w, 500, err)
			return
		}
		reply(w, p)
	})
	mux.HandleFunc("PUT /api/assets/{id}/listening-progress", func(w http.ResponseWriter, r *http.Request) {
		var p progress
		id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
		if err != nil || json.NewDecoder(http.MaxBytesReader(w, r.Body, 2048)).Decode(&p) != nil || p.Asset != id || p.Seconds < 0 || p.Seconds > 31536000 || p.Revision < 0 {
			fail(w, 400, errors.New("invalid position"))
			return
		}
		var format string
		if err = a.db.QueryRow("SELECT format FROM assets WHERE id=?", id).Scan(&format); err != nil || format != "Audio" {
			fail(w, 400, errors.New("not an audiobook"))
			return
		}
		tx, err := a.db.Begin()
		if err != nil {
			fail(w, 500, err)
			return
		}
		defer tx.Rollback()
		var revision int64
		err = tx.QueryRow("SELECT revision FROM asset_progress WHERE profile_id=? AND asset_id=?", who(r).ID, id).Scan(&revision)
		if err != nil && err != sql.ErrNoRows {
			fail(w, 500, err)
			return
		}
		if revision != p.Revision {
			fail(w, 409, errConflict)
			return
		}
		_, err = tx.Exec(`INSERT INTO asset_progress VALUES(?,?,?,?,?) ON CONFLICT(profile_id,asset_id) DO UPDATE SET seconds=excluded.seconds,revision=excluded.revision,complete=excluded.complete`, who(r).ID, id, p.Seconds, p.Revision+1, p.Complete)
		if err != nil {
			fail(w, 500, err)
			return
		}
		if err = tx.Commit(); err != nil {
			fail(w, 500, err)
			return
		}
		p.Revision++
		reply(w, p)
	})
}
