package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	_ "modernc.org/sqlite"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

//go:embed web/*
var web embed.FS

type app struct {
	db     *sql.DB
	dbPath string
	token  string
	scanMu sync.Mutex
}
type source struct {
	ID           int64  `json:"id"`
	Space        string `json:"space"`
	Path         string `json:"path"`
	Status       string `json:"status"`
	Watched      bool   `json:"watched"`
	WatchMinutes int    `json:"watchMinutes"`
	LastWatch    int64  `json:"lastWatch,omitempty"`
	Files      int64  `json:"files"`
	Works      int64  `json:"works"`
	Audiobooks int64  `json:"audiobooks"`
	Comics     int64  `json:"comics"`
	Ebooks     int64  `json:"ebooks"`
	PDFs       int64  `json:"pdfs"`
}
type book struct {
	ID                       int64   `json:"id"`
	Title                    string  `json:"title"`
	Author                   string  `json:"author"`
	Series                   string  `json:"series"`
	SeriesNumber             float64 `json:"seriesNumber,omitempty"`
	Genre                    string  `json:"genre"`
	PublishedYear            int     `json:"publishedYear,omitempty"`
	Narrator                 string  `json:"narrator,omitempty"`
	Publisher                string  `json:"publisher,omitempty"`
	ISBN                     string  `json:"isbn,omitempty"`
	ASIN                     string  `json:"asin,omitempty"`
	Language                 string  `json:"language,omitempty"`
	Description              string  `json:"description,omitempty"`
	Format                   string  `json:"format"`
	Space                    string  `json:"space"`
	Available                bool    `json:"available"`
	IdentificationConfidence string  `json:"identificationConfidence,omitempty"`
	NeedsReview              bool    `json:"needsReview,omitempty"`
	ReviewReason             string  `json:"reviewReason,omitempty"`
	MetadataSource           string  `json:"metadataSource,omitempty"`
}

func openDB(path string) (*sql.DB, error) {
	// Configure SQLite on every pooled connection. WAL + a small four-connection
	// pool lets the Pi serve readers/streams while a scan or progress save writes.
	u := &url.URL{Scheme: "file", Path: filepath.ToSlash(path)}
	q := u.Query()
	// modernc applies _pragma values to every pooled connection.
	q.Add("_pragma", "foreign_keys(1)")
	q.Add("_pragma", "busy_timeout(5000)")
	q.Add("_pragma", "synchronous(NORMAL)")
	u.RawQuery = q.Encode()
	db, e := sql.Open("sqlite", u.String())
	if e != nil {
		return nil, e
	}
	db.SetMaxOpenConns(4)
	db.SetMaxIdleConns(4)
	// WAL is database-persistent; set it once rather than re-requesting a
	// journal-mode switch whenever the pool opens a new connection.
	if _, e = db.Exec("PRAGMA journal_mode=WAL"); e != nil {
		db.Close()
		return nil, e
	}
	_, e = db.Exec(`CREATE TABLE IF NOT EXISTS sources(id INTEGER PRIMARY KEY,space TEXT NOT NULL,path TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'Not scanned');
 CREATE TABLE IF NOT EXISTS assets(id INTEGER PRIMARY KEY,source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,relative_path TEXT NOT NULL,title TEXT NOT NULL,format TEXT NOT NULL,available INTEGER NOT NULL DEFAULT 1,UNIQUE(source_id,relative_path));
 PRAGMA user_version=1;`)
	if e != nil {
		db.Close()
		return nil, e
	}
	for _, stmt := range []string{
		"ALTER TABLE sources ADD COLUMN watched INTEGER NOT NULL DEFAULT 0",
		"ALTER TABLE sources ADD COLUMN watch_minutes INTEGER NOT NULL DEFAULT 60",
		"ALTER TABLE sources ADD COLUMN last_watch INTEGER NOT NULL DEFAULT 0",
		"ALTER TABLE assets ADD COLUMN author TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE assets ADD COLUMN series TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE assets ADD COLUMN genre TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE assets ADD COLUMN metadata_source TEXT NOT NULL DEFAULT 'legacy'",
		"ALTER TABLE assets ADD COLUMN metadata_confidence INTEGER NOT NULL DEFAULT 0",
		"ALTER TABLE assets ADD COLUMN needs_review INTEGER NOT NULL DEFAULT 1",
		"ALTER TABLE assets ADD COLUMN review_reason TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE assets ADD COLUMN scan_signature TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE assets ADD COLUMN size_bytes INTEGER NOT NULL DEFAULT 0",
		"ALTER TABLE assets ADD COLUMN modified_unix INTEGER NOT NULL DEFAULT 0",
		"ALTER TABLE assets ADD COLUMN series_number REAL NOT NULL DEFAULT 0",
		"ALTER TABLE assets ADD COLUMN published_year INTEGER NOT NULL DEFAULT 0",
		"ALTER TABLE assets ADD COLUMN narrator TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE assets ADD COLUMN publisher TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE assets ADD COLUMN isbn TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE assets ADD COLUMN asin TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE assets ADD COLUMN language TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE assets ADD COLUMN description TEXT NOT NULL DEFAULT ''",
	} {
		if _, alterErr := db.Exec(stmt); alterErr != nil && !strings.Contains(strings.ToLower(alterErr.Error()), "duplicate column") {
			db.Close()
			return nil, alterErr
		}
	}
	// Rows created before provenance tracking may include user corrections.
	// Preserve them as legacy/manual-quality metadata until the user explicitly changes them.
	if _, migrateErr := db.Exec(`UPDATE assets
		SET metadata_source='legacy',metadata_confidence=100,needs_review=0,review_reason=''
		WHERE scan_signature='' AND size_bytes=0 AND modified_unix=0
		AND (title<>'' OR author<>'' OR series<>'' OR genre<>'')`); migrateErr != nil {
		db.Close()
		return nil, migrateErr
	}
	return db, nil
}
func canonical(path string) (string, error) {
	p, e := filepath.Abs(path)
	if e != nil {
		return "", e
	}
	p, e = filepath.EvalSymlinks(p)
	if e != nil {
		return "", e
	}
	s, e := os.Stat(p)
	if e != nil {
		return "", e
	}
	if !s.IsDir() {
		return "", errors.New("choose a directory")
	}
	return p, nil
}
func within(root, path string) bool {
	r, e := filepath.Rel(root, path)
	return e == nil && r != ".." && !strings.HasPrefix(r, ".."+string(filepath.Separator)) && !filepath.IsAbs(r)
}
func (a *app) addSource(space, path string) error {
	a.scanMu.Lock()
	defer a.scanMu.Unlock()
	p, e := canonical(path)
	if e != nil {
		return errors.New("folder is unavailable or is not a directory")
	}
	space = strings.TrimSpace(space)
	if space == "" || len(space) > 100 {
		return errors.New("enter a space name, up to 100 characters")
	}
	rows, e := a.db.Query("SELECT path FROM sources")
	if e != nil {
		return e
	}
	var conflict bool
	for rows.Next() {
		var old string
		if e = rows.Scan(&old); e != nil {
			rows.Close()
			return e
		}
		if within(old, p) || within(p, old) {
			conflict = true
		}
	}
	e = rows.Err()
	rows.Close()
	if e != nil {
		return e
	}
	if conflict {
		return errors.New("folder overlaps an existing source; choose a different folder")
	}
	tx, e := a.db.Begin()
	if e != nil {
		return e
	}
	defer tx.Rollback()
	if _, e = tx.Exec("INSERT INTO sources(space,path) VALUES(?,?)", space, p); e != nil {
		return e
	}
	// Every active User sees every library. Admin remains the only role allowed
	// to add, scan, organise or remove server content.
	if _, e = tx.Exec(`INSERT OR IGNORE INTO grants(profile_id,space)
		SELECT id,? FROM profiles WHERE revoked=0`, space); e != nil {
		return e
	}
	return tx.Commit()
}
func kind(path string) string {
	switch strings.ToLower(filepath.Ext(path)) {
	case ".mp3", ".m4b", ".m4a", ".aac", ".ogg", ".opus", ".flac", ".wav":
		return "Audio"
	case ".epub":
		return "Ebook"
	case ".pdf":
		return "PDF"
	case ".cbz", ".cbr", ".zip", ".cbt":
		return "Comic"
	}
	return ""
}
func (a *app) scanWithProgress(id int64, progress func(int, int)) error {
	a.scanMu.Lock()
	defer a.scanMu.Unlock()
	if a.movesPending() {
		return errors.New("finish or recover pending file moves before scanning")
	}
	var root string
	if e := a.db.QueryRow("SELECT path FROM sources WHERE id=?", id).Scan(&root); e != nil {
		return e
	}
	resolved, e := canonical(root)
	if e != nil || resolved != root {
		a.db.Exec("UPDATE sources SET status='Unavailable' WHERE id=?", id)
		return errors.New("source unavailable; previous catalogue retained")
	}
	total := 0
	_ = filepath.WalkDir(root, func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil || d.IsDir() || d.Type()&os.ModeSymlink != 0 || !d.Type().IsRegular() {
			return nil
		}
		if kind(path) != "" { total++ }
		return nil
	})
	if progress != nil { progress(0, total) }
	stage, e := os.CreateTemp("", "archivist-scan-*.jsonl")
	if e != nil {
		return e
	}
	defer os.Remove(stage.Name())
	defer stage.Close()
	encoder := json.NewEncoder(stage)
	type entry struct {
		Relative, Title, Author, Series, Genre, Format string
		Narrator, Publisher, ISBN, ASIN, Language, Description string
		SeriesNumber float64
		PublishedYear int
		MetadataSource, ReviewReason, ScanSignature string
		MetadataConfidence, SizeBytes, ModifiedUnix int64
		NeedsReview bool
	}
	type cachedEntry struct {
		Title, Author, Series, Genre string
		Narrator, Publisher, ISBN, ASIN, Language, Description string
		SeriesNumber float64
		PublishedYear int
		MetadataSource, ReviewReason, ScanSignature string
		MetadataConfidence, SizeBytes, ModifiedUnix int64
		NeedsReview bool
	}
	cached := map[string]cachedEntry{}
	rows, cacheErr := a.db.Query(`SELECT relative_path,title,author,series,genre,series_number,published_year,narrator,publisher,isbn,asin,language,description,metadata_source,metadata_confidence,needs_review,review_reason,scan_signature,size_bytes,modified_unix FROM assets WHERE source_id=?`, id)
	if cacheErr != nil {
		return cacheErr
	}
	for rows.Next() {
		var rel string
		var item cachedEntry
		var review int
		if cacheErr = rows.Scan(&rel,&item.Title,&item.Author,&item.Series,&item.Genre,&item.SeriesNumber,&item.PublishedYear,&item.Narrator,&item.Publisher,&item.ISBN,&item.ASIN,&item.Language,&item.Description,&item.MetadataSource,&item.MetadataConfidence,&review,&item.ReviewReason,&item.ScanSignature,&item.SizeBytes,&item.ModifiedUnix); cacheErr != nil {
			rows.Close()
			return cacheErr
		}
		item.NeedsReview = review != 0
		cached[rel] = item
	}
	if cacheErr = rows.Err(); cacheErr != nil {
		rows.Close()
		return cacheErr
	}
	rows.Close()

	count := 0
	reused := 0
	reviewCount := 0
	sidecars := newSidecarScanCache()
	e = filepath.WalkDir(root, func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.Type()&os.ModeSymlink != 0 {
			return nil
		}
		if d.IsDir() {
			return nil
		}
		if !d.Type().IsRegular() {
			return nil
		}
		format := kind(path)
		if format == "" {
			return nil
		}
		rel, e := filepath.Rel(root, path)
		if e != nil {
			return e
		}
		info, statErr := d.Info()
		if statErr != nil {
			return statErr
		}
		signature := metadataSignatureWithCache(path, info, sidecars)
		item := entry{
			Relative: rel,
			Format: format,
			ScanSignature: signature,
			SizeBytes: info.Size(),
			ModifiedUnix: info.ModTime().Unix(),
		}
		if existing, ok := cached[rel]; ok && existing.ScanSignature == signature {
			item.Title = existing.Title
			item.Author = existing.Author
			item.Series = existing.Series
			item.Genre = existing.Genre
			item.SeriesNumber = existing.SeriesNumber
			item.PublishedYear = existing.PublishedYear
			item.Narrator = existing.Narrator
			item.Publisher = existing.Publisher
			item.ISBN = existing.ISBN
			item.ASIN = existing.ASIN
			item.Language = existing.Language
			item.Description = existing.Description
			item.MetadataSource = existing.MetadataSource
			item.MetadataConfidence = existing.MetadataConfidence
			item.NeedsReview = existing.NeedsReview
			item.ReviewReason = existing.ReviewReason
			reused++
		} else {
			meta := metadataForWithCache(path, rel, format, sidecars)
			item.Title = meta.Title
			item.Author = meta.Author
			item.Series = meta.Series
			item.Genre = meta.Genre
			item.SeriesNumber = meta.SeriesNumber
			item.PublishedYear = meta.PublishedYear
			item.Narrator = meta.Narrator
			item.Publisher = meta.Publisher
			item.ISBN = meta.ISBN
			item.ASIN = meta.ASIN
			item.Language = meta.Language
			item.Description = meta.Description
			item.MetadataSource = meta.Source
			item.MetadataConfidence = int64(meta.Confidence)
			item.NeedsReview = meta.NeedsReview
			item.ReviewReason = meta.ReviewReason
		}
		if item.NeedsReview {
			reviewCount++
		}
		count++
		if progress != nil && (count == total || count%10 == 0) { progress(count, total) }
		return encoder.Encode(item)
	})
	if e != nil {
		a.db.Exec("UPDATE sources SET status='Scan failed; catalogue retained' WHERE id=?", id)
		return errors.New("scan could not read every folder; previous catalogue retained")
	}
	if _, e = stage.Seek(0, 0); e != nil {
		return e
	}
	tx, e := a.db.Begin()
	if e != nil {
		return e
	}
	defer tx.Rollback()
	if _, e = tx.Exec("UPDATE assets SET available=0 WHERE source_id=?", id); e != nil {
		return e
	}
	decoder := json.NewDecoder(stage)
	for {
		var item entry
		e = decoder.Decode(&item)
		if e == io.EOF {
			break
		}
		if e != nil {
			return e
		}
		if _, e = tx.Exec(`INSERT INTO assets(source_id,relative_path,title,author,series,genre,series_number,published_year,narrator,publisher,isbn,asin,language,description,format,available,metadata_source,metadata_confidence,needs_review,review_reason,scan_signature,size_bytes,modified_unix)
			VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?,?,?)
			ON CONFLICT(source_id,relative_path) DO UPDATE SET
				title=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.title ELSE excluded.title END,
				author=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.author ELSE excluded.author END,
				series=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.series ELSE excluded.series END,
				genre=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.genre ELSE excluded.genre END,
				series_number=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.series_number ELSE excluded.series_number END,
				published_year=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.published_year ELSE excluded.published_year END,
				narrator=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.narrator ELSE excluded.narrator END,
				publisher=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.publisher ELSE excluded.publisher END,
				isbn=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.isbn ELSE excluded.isbn END,
				asin=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.asin ELSE excluded.asin END,
				language=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.language ELSE excluded.language END,
				description=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.description ELSE excluded.description END,
				format=excluded.format,
				available=1,
				metadata_source=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.metadata_source ELSE excluded.metadata_source END,
				metadata_confidence=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.metadata_confidence ELSE excluded.metadata_confidence END,
				needs_review=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.needs_review ELSE excluded.needs_review END,
				review_reason=CASE WHEN assets.metadata_source IN ('manual','legacy') THEN assets.review_reason ELSE excluded.review_reason END,
				scan_signature=excluded.scan_signature,
				size_bytes=excluded.size_bytes,
				modified_unix=excluded.modified_unix`,
			id, item.Relative, item.Title, item.Author, item.Series, item.Genre, item.SeriesNumber, item.PublishedYear, item.Narrator, item.Publisher, item.ISBN, item.ASIN, item.Language, item.Description, item.Format, item.MetadataSource, item.MetadataConfidence, item.NeedsReview, item.ReviewReason, item.ScanSignature, item.SizeBytes, item.ModifiedUnix); e != nil {
			return e
		}
	}
	status := fmt.Sprintf("%d files · %d reused · %d need review · %s", count, reused, reviewCount, time.Now().Format("2 Jan 15:04"))
	if _, e = tx.Exec("UPDATE sources SET status=? WHERE id=?", status, id); e != nil {
		return e
	}
	if e = tx.Commit(); e != nil { return e }
	if e = a.syncAutoCatalogueLocked(id); e != nil {
		a.db.Exec("UPDATE sources SET status=? WHERE id=?", "Scanned; library grouping needs attention", id)
		return e
	}
	if progress != nil { progress(total, total) }
	return nil
}
func (a *app) scan(id int64) error { return a.scanWithProgress(id, nil) }
func reply(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}
func fail(w http.ResponseWriter, s int, e error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(s)
	reply(w, map[string]string{"error": e.Error()})
}
func publicURL(r *http.Request) string {
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	if forwarded := r.Header.Get("X-Forwarded-Proto"); forwarded == "http" || forwarded == "https" {
		scheme = forwarded
	}
	return scheme + "://" + r.Host
}
func requestIsSecure(r *http.Request) bool {
	if r.TLS != nil {
		return true
	}
	forwarded := strings.TrimSpace(strings.Split(r.Header.Get("X-Forwarded-Proto"), ",")[0])
	return strings.EqualFold(forwarded, "https")
}
func (a *app) routes() http.Handler {
	mux := http.NewServeMux()
	a.backgroundRoutes(mux)
	a.catalogueRoutes(mux)
	a.coverRoutes(mux)
	a.progressRoutes(mux)
	a.listeningRoutes(mux)
	a.playerFeatureRoutes(mux)
	a.householdRoutes(mux)
	a.profileRoutes(mux)
	a.activityRoutes(mux)
	a.opdsRoutes(mux)
	a.backupRoutes(mux)
	a.atlasRoutes(mux)
	a.preferenceRoutes(mux)
	a.accountRoutes(mux)
	a.readerRoutes(mux)
	a.epubResourceRoutes(mux)
	a.recommendationRoutes(mux)
	a.organisationRoutes(mux)
	a.duplicateRoutes(mux)
	a.moveRoutes(mux)
	static, _ := fs.Sub(web, "web")
	mux.Handle("GET /", http.FileServer(http.FS(static)))
	mux.HandleFunc("GET /api/sources", func(w http.ResponseWriter, r *http.Request) {
		rows, e := a.db.Query(`SELECT s.id,s.space,s.path,s.status,s.watched,s.watch_minutes,s.last_watch,
			count(DISTINCT a.id),count(DISTINCT e.work_id),
			count(DISTINCT CASE WHEN a.format='Audio' THEN e.work_id END),
			count(DISTINCT CASE WHEN a.format='Comic' THEN e.work_id END),
			count(DISTINCT CASE WHEN a.format='Ebook' THEN e.work_id END),
			count(DISTINCT CASE WHEN a.format='PDF' THEN e.work_id END)
			FROM sources s
			LEFT JOIN assets a ON a.source_id=s.id AND a.available=1
			LEFT JOIN edition_assets ea ON ea.asset_id=a.id
			LEFT JOIN editions e ON e.id=ea.edition_id
			WHERE ? OR s.space IN (SELECT space FROM grants WHERE profile_id=?)
			GROUP BY s.id ORDER BY s.id`, who(r).Owner, who(r).ID)
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer rows.Close()
		out := []source{}
		for rows.Next() {
			var s source
			if e = rows.Scan(&s.ID, &s.Space, &s.Path, &s.Status, &s.Watched, &s.WatchMinutes, &s.LastWatch, &s.Files, &s.Works, &s.Audiobooks, &s.Comics, &s.Ebooks, &s.PDFs); e != nil {
				fail(w, 500, e)
				return
			}
			if !who(r).Owner {
				s.Path = ""
				s.Status = ""
			}
			out = append(out, s)
		}
		reply(w, out)
	})
	mux.HandleFunc("GET /api/server-info", func(w http.ResponseWriter, r *http.Request) {
		var sources, jobs, sessions, watched int
		a.db.QueryRow("SELECT count(*) FROM sources").Scan(&sources)
		a.db.QueryRow("SELECT count(*) FROM sources WHERE watched=1").Scan(&watched)
		a.db.QueryRow("SELECT count(*) FROM jobs WHERE state IN ('queued','running')").Scan(&jobs)
		a.db.QueryRow("SELECT count(*) FROM sessions WHERE expires>?", time.Now().Unix()).Scan(&sessions)
		var databaseBytes int64
		if a.dbPath != "" {
			if info, statErr := os.Stat(a.dbPath); statErr == nil { databaseBytes = info.Size() }
		}
		reply(w, map[string]any{
			"address":       publicURL(r),
			"configured":    a.ownerConfigured(),
			"sources":       sources,
			"watchedSources": watched,
			"activeJobs":    jobs,
			"sessions":      sessions,
			"databaseBytes": databaseBytes,
			"mediaProbe":    false,
		})
	})
	mux.HandleFunc("POST /api/owner-access", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Token string `json:"token"`
		}
		if e := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1024)).Decode(&body); e != nil {
			fail(w, 400, errors.New("invalid owner access key"))
			return
		}
		if e := a.setOwnerCredential(body.Token); e != nil {
			fail(w, 400, e)
			return
		}
		reply(w, map[string]bool{"ok": true})
	})
	mux.HandleFunc("POST /api/sources", func(w http.ResponseWriter, r *http.Request) {
		var s source
		if e := json.NewDecoder(http.MaxBytesReader(w, r.Body, 8192)).Decode(&s); e != nil {
			fail(w, 400, errors.New("invalid source"))
			return
		}
		if e := a.addSource(s.Space, s.Path); e != nil {
			fail(w, 400, e)
			return
		}
		reply(w, map[string]bool{"ok": true})
	})
	mux.HandleFunc("PATCH /api/sources/{id}/watch", func(w http.ResponseWriter, r *http.Request) {
		var in struct {
			Enabled bool `json:"enabled"`
			Minutes int  `json:"minutes"`
		}
		if e := json.NewDecoder(http.MaxBytesReader(w, r.Body, 2048)).Decode(&in); e != nil {
			fail(w, 400, errors.New("invalid watch settings")); return
		}
		if in.Minutes == 0 { in.Minutes = 60 }
		if in.Minutes < 15 || in.Minutes > 10080 {
			fail(w, 400, errors.New("watch interval must be between 15 minutes and 7 days")); return
		}
		res,e:=a.db.Exec("UPDATE sources SET watched=?,watch_minutes=?,last_watch=CASE WHEN ? THEN 0 ELSE last_watch END WHERE id=?",in.Enabled,in.Minutes,in.Enabled,r.PathValue("id"))
		if e!=nil{fail(w,500,e);return}
		n,_:=res.RowsAffected();if n!=1{fail(w,404,errors.New("source not found"));return}
		reply(w,map[string]any{"ok":true,"watched":in.Enabled,"watchMinutes":in.Minutes})
	})
	mux.HandleFunc("POST /api/sources/{id}/scan", func(w http.ResponseWriter, r *http.Request) {
		var id int64
		if _, e := fmt.Sscan(r.PathValue("id"), &id); e != nil {
			fail(w, 400, e)
			return
		}
		job, e := a.enqueue(id)
		if e != nil {
			fail(w, 400, e)
			return
		}
		w.WriteHeader(http.StatusAccepted)
		reply(w, map[string]int64{"job_id": job})
	})
	mux.HandleFunc("DELETE /api/sources/{id}", func(w http.ResponseWriter, r *http.Request) {
		a.scanMu.Lock()
		defer a.scanMu.Unlock()
		tx, e := a.db.Begin()
		if e != nil { fail(w,500,e); return }
		defer tx.Rollback()
		if _, e = tx.Exec("DELETE FROM sources WHERE id=?", r.PathValue("id")); e != nil {
			fail(w, 500, e)
			return
		}
		if e = pruneCatalogue(tx); e != nil { fail(w,500,e); return }
		if e = tx.Commit(); e != nil { fail(w,500,e); return }
		reply(w, map[string]bool{"ok": true})
	})
	mux.HandleFunc("GET /api/books", func(w http.ResponseWriter, r *http.Request) {
		q := "%" + r.URL.Query().Get("q") + "%"
		space := r.URL.Query().Get("space")
		format := r.URL.Query().Get("format")
		author := strings.TrimSpace(r.URL.Query().Get("author"))
		series := strings.TrimSpace(r.URL.Query().Get("series"))
		genre := strings.TrimSpace(r.URL.Query().Get("genre"))
		reviewOnly := r.URL.Query().Get("review") == "1"
		metadataGap := strings.TrimSpace(r.URL.Query().Get("metadataGap"))
		validMetadataGap := map[string]bool{"":true,"review":true,"author":true,"series":true,"genre":true,"seriesNumber":true,"identifier":true,"description":true,"incomplete":true}
		if !validMetadataGap[metadataGap] {
			fail(w,400,errors.New("invalid metadata-gap filter"))
			return
		}
		unknownAuthor := r.URL.Query().Get("unknownAuthor") == "1"
		availability := r.URL.Query().Get("availability")
		if availability != "" && availability != "available" && availability != "unavailable" {
			fail(w,400,errors.New("invalid availability filter"))
			return
		}
		limit := 500
		if n, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && n > 0 && n <= 500 { limit = n }
		offset := 0
		if n, err := strconv.Atoi(r.URL.Query().Get("offset")); err == nil && n >= 0 { offset = n }
		rows, e := a.db.Query(`SELECT a.id,a.title,a.author,a.series,a.series_number,a.genre,a.published_year,a.narrator,a.publisher,a.isbn,a.asin,a.language,a.description,a.format,s.space,a.available,a.metadata_confidence,a.needs_review,a.review_reason,a.metadata_source
			FROM assets a JOIN sources s ON s.id=a.source_id
			WHERE (a.title LIKE ? OR a.author LIKE ? OR a.series LIKE ? OR a.genre LIKE ? OR a.narrator LIKE ? OR a.publisher LIKE ? OR a.isbn LIKE ? OR a.asin LIKE ?)
			AND (?='' OR s.space=?)
			AND (?='' OR a.format=?)
			AND (?='' OR a.author=?)
			AND (?='' OR a.series=?)
			AND (?='' OR a.genre=?)
			AND (?=0 OR trim(a.author)='')
			AND (?=0 OR a.needs_review=1)
			AND (?='' OR
				(?='review' AND a.needs_review=1) OR
				(?='author' AND trim(a.author)='') OR
				(?='series' AND trim(a.series)='') OR
				(?='genre' AND trim(a.genre)='') OR
				(?='seriesNumber' AND trim(a.series)<>'' AND a.series_number=0) OR
				(?='identifier' AND trim(a.isbn)='' AND trim(a.asin)='') OR
				(?='description' AND trim(a.description)='') OR
				(?='incomplete' AND (
					trim(a.title)='' OR trim(a.author)='' OR trim(a.genre)='' OR a.published_year=0 OR
					(a.format='Audio' AND trim(a.narrator)='') OR trim(a.publisher)='' OR
					(trim(a.isbn)='' AND trim(a.asin)='') OR trim(a.language)='' OR trim(a.description)=''
				))
			)
			AND (?='' OR (?='available' AND a.available=1) OR (?='unavailable' AND a.available=0))
			AND (? OR s.space IN (SELECT space FROM grants WHERE profile_id=?))
			ORDER BY a.needs_review DESC,a.title,a.id LIMIT ? OFFSET ?`,
			q, q, q, q, q, q, q, q, space, space, format, format, author, author, series, series, genre, genre, unknownAuthor, reviewOnly,
			metadataGap, metadataGap, metadataGap, metadataGap, metadataGap, metadataGap, metadataGap, metadataGap, metadataGap,
			availability, availability, availability, who(r).Owner, who(r).ID, limit, offset)
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer rows.Close()
		out := []book{}
		for rows.Next() {
			var b book
			var confidence int
			if e = rows.Scan(&b.ID, &b.Title, &b.Author, &b.Series, &b.SeriesNumber, &b.Genre, &b.PublishedYear, &b.Narrator, &b.Publisher, &b.ISBN, &b.ASIN, &b.Language, &b.Description, &b.Format, &b.Space, &b.Available, &confidence, &b.NeedsReview, &b.ReviewReason, &b.MetadataSource); e != nil {
				fail(w, 500, e)
				return
			}
			switch {
			case confidence >= 85:
				b.IdentificationConfidence = "high"
			case confidence >= 60:
				b.IdentificationConfidence = "medium"
			default:
				b.IdentificationConfidence = "low"
			}
			out = append(out, b)
		}
		reply(w, out)
	})
	mux.HandleFunc("GET /api/assets/{id}", func(w http.ResponseWriter, r *http.Request) {
		var root, rel string
		if e := a.db.QueryRow("SELECT s.path,a.relative_path FROM assets a JOIN sources s ON s.id=a.source_id WHERE a.id=?", r.PathValue("id")).Scan(&root, &rel); e != nil {
			http.NotFound(w, r)
			return
		}
		// os.Root restricts path resolution, including concurrent symlink changes, to the selected source.
		dir, e := os.OpenRoot(root)
		if e != nil {
			http.NotFound(w, r)
			return
		}
		defer dir.Close()
		f, e := dir.Open(rel)
		if e != nil {
			http.NotFound(w, r)
			return
		}
		defer f.Close()
		info, e := f.Stat()
		if e != nil || !info.Mode().IsRegular() {
			http.NotFound(w, r)
			return
		}
		http.ServeContent(w, r, info.Name(), info.ModTime(), f)
	})
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		if e := a.db.PingContext(r.Context()); e != nil {
			fail(w, 503, errors.New("database unavailable"))
			return
		}
		reply(w, map[string]bool{"ok": true})
	})
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		base, ingressErr := ingressBase(r)
		if ingressErr != nil {
			http.Error(w, "invalid ingress request", http.StatusForbidden)
			return
		}
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Cache-Control", "no-store")
		frameAncestors := "'none'"
		if r.Header.Get("X-Ingress-Path") != "" {
			frameAncestors = "'self'"
		}
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; media-src 'self'; object-src 'none'; frame-ancestors "+frameAncestors)
		if r.URL.Path == "/setup/status" && r.Method == "GET" {
			reply(w, map[string]bool{"configured": a.ownerConfigured()})
			return
		}
		if r.URL.Path == "/setup" && r.Method == "POST" {
			if r.Header.Get("X-Archivist-Action") != "1" {
				fail(w, 403, errors.New("invalid request"))
				return
			}
			if a.ownerConfigured() {
				fail(w, 409, errors.New("owner access is already configured"))
				return
			}
			var body struct {
				Token string `json:"token"`
			}
			json.NewDecoder(http.MaxBytesReader(w, r.Body, 1024)).Decode(&body)
			if e := a.setOwnerCredential(body.Token); e != nil {
				fail(w, 400, e)
				return
			}
			session, e := a.newSession(body.Token)
			if e != nil {
				fail(w, 500, e)
				return
			}
			http.SetCookie(w, &http.Cookie{Name: "archivist_session", Value: session, HttpOnly: true, Secure: requestIsSecure(r), SameSite: http.SameSiteStrictMode, Path: base})
			reply(w, map[string]string{"token": session})
			return
		}
		if strings.HasPrefix(r.URL.Path, "/api/") {
			profile := identity{}
			valid := false
			if r.Header.Get("X-Ingress-Path") != "" {
				profile = identity{ID: 0, Name: "Admin", Role: "admin", Admin: true, Owner: true, Ingress: true}
				valid = true
			} else {
				c, e := r.Cookie("archivist_session")
				key := ""
				if e == nil {
					key = c.Value
				}
				if bearer := r.Header.Get("Authorization"); strings.HasPrefix(bearer, "Bearer ") {
					key = strings.TrimPrefix(bearer, "Bearer ")
				}
				if _, password, basic := r.BasicAuth(); basic {
					profile, valid = a.identify(password)
				} else {
					profile, valid = a.sessionIdentity(key)
				}
			}
			if !valid {
				fail(w, 401, errors.New("unlock this local session"))
				return
			}
			r = withIdentity(r, profile)
			if !a.authorise(r, profile) {
				fail(w, 403, errors.New("access denied"))
				return
			}
			if r.Method != "GET" && r.Header.Get("X-Archivist-Action") != "1" {
				fail(w, 403, errors.New("invalid request"))
				return
			}
		}
		if (r.URL.Path == "/unlock" || r.URL.Path == "/session") && r.Method == "POST" {
			if r.Header.Get("X-Archivist-Action") != "1" {
				fail(w, 403, errors.New("invalid request"))
				return
			}
			var body struct {
				Token string `json:"token"`
			}
			json.NewDecoder(http.MaxBytesReader(w, r.Body, 1024)).Decode(&body)
			if _, valid := a.identify(body.Token); !valid {
				fail(w, 401, errors.New("incorrect access key"))
				return
			}
			session, e := a.newSession(body.Token)
			if e != nil {
				fail(w, 500, e)
				return
			}
			http.SetCookie(w, &http.Cookie{Name: "archivist_session", Value: session, HttpOnly: true, Secure: requestIsSecure(r), SameSite: http.SameSiteStrictMode, Path: base})
			if r.URL.Path == "/session" {
				reply(w, map[string]string{"token": session})
			} else {
				reply(w, map[string]bool{"ok": true})
			}
			return
		}
		if r.URL.Path == "/logout" && r.Method == "POST" && r.Header.Get("X-Archivist-Action") == "1" {
			key := ""
			if c, e := r.Cookie("archivist_session"); e == nil {
				key = c.Value
			}
			if b := r.Header.Get("Authorization"); strings.HasPrefix(b, "Bearer ") {
				key = strings.TrimPrefix(b, "Bearer ")
			}
			if key != "" {
				a.db.Exec("DELETE FROM sessions WHERE token_hash=?", keyHash(key))
			}
			http.SetCookie(w, &http.Cookie{Name: "archivist_session", Value: "", MaxAge: -1, HttpOnly: true, Secure: requestIsSecure(r), SameSite: http.SameSiteStrictMode, Path: base})
			reply(w, map[string]bool{"ok": true})
			return
		}
		if r.URL.Path == "/reader.html" {
			bearer := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
			if _, ok := a.sessionIdentity(bearer); ok {
				http.SetCookie(w, &http.Cookie{Name: "archivist_session", Value: bearer, HttpOnly: true, Secure: requestIsSecure(r), SameSite: http.SameSiteStrictMode, Path: base})
			}
		}
		if serveEntry(w, r, base) {
			return
		}
		mux.ServeHTTP(w, r)
	})
}
func main() {
	data := flag.String("data", "./data", "Local database directory")
	addr := flag.String("listen", "127.0.0.1:5056", "HTTP listen address")
	allowLAN := flag.Bool("allow-lan", false, "Allow non-loopback bind for trusted reverse proxies or Home Assistant add-on containers")
	tlsAddr := flag.String("tls-listen", "", "Optional HTTPS listen address")
	tlsCert := flag.String("tls-cert", "", "TLS certificate chain file")
	tlsKey := flag.String("tls-key", "", "TLS private key file")
	flag.Parse()
	host, _, e := net.SplitHostPort(*addr)
	ip := net.ParseIP(host)
	if e != nil || ip == nil || (!*allowLAN && !ip.IsLoopback()) {
		log.Fatal("HTTP listener accepts loopback addresses only unless -allow-lan is set")
	}
	if *tlsAddr != "" {
		tlsHost, _, tlsErr := net.SplitHostPort(*tlsAddr)
		tlsIP := net.ParseIP(tlsHost)
		if tlsErr != nil || tlsIP == nil || (!*allowLAN && !tlsIP.IsLoopback()) {
			log.Fatal("HTTPS listener accepts loopback addresses only unless -allow-lan is set")
		}
		if strings.TrimSpace(*tlsCert) == "" || strings.TrimSpace(*tlsKey) == "" {
			log.Fatal("-tls-listen requires -tls-cert and -tls-key")
		}
	}
	if e = os.MkdirAll(*data, 0700); e != nil {
		log.Fatal(e)
	}
	dbPath := filepath.Join(*data, "archivist.db")
	if restored, restoreErr := applyPendingRestore(dbPath); restoreErr != nil {
		log.Fatal(restoreErr)
	} else if restored {
		log.Printf("Archivist: applied staged database restore")
	}
	db, e := openDB(dbPath)
	if e != nil {
		log.Fatal(e)
	}
	defer db.Close()
	raw := make([]byte, 32)
	if _, e = rand.Read(raw); e != nil {
		log.Fatal(e)
	}
	a := &app{db: db, dbPath: dbPath, token: hex.EncodeToString(raw)}
	if e = a.initHousehold(); e != nil {
		log.Fatal(e)
	}
	if e = a.initSessions(); e != nil {
		log.Fatal(e)
	}
	if e = a.initCatalogue(); e != nil {
		log.Fatal(e)
	}
	if e = a.syncExistingCatalogue(); e != nil {
		log.Printf("catalogue migration: %v", e)
	}
	if e = a.initPreferences(); e != nil {
		log.Fatal(e)
	}
	if e = a.initProgress(); e != nil {
		log.Fatal(e)
	}
	if e = a.initListening(); e != nil {
		log.Fatal(e)
	}
	if e = a.initPlayerFeatures(); e != nil {
		log.Fatal(e)
	}
	if e = a.initReader(); e != nil {
		log.Fatal(e)
	}
	if e = a.initCompletions(); e != nil {
		log.Fatal(e)
	}
	if e = a.initActivity(); e != nil {
		log.Fatal(e)
	}
	if e = a.initPerformance(); e != nil {
		log.Fatal(e)
	}
	if e = a.initJobs(); e != nil {
		log.Fatal(e)
	}
	if e = a.initMoves(); e != nil {
		log.Fatal(e)
	}
	go a.worker(context.Background())
	go a.watcher(context.Background())
	handler := a.routes()
	server := &http.Server{Addr: *addr, Handler: handler, ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 60 * time.Second}
	if *tlsAddr != "" {
		tlsServer := &http.Server{Addr: *tlsAddr, Handler: handler, ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 60 * time.Second}
		go func() {
			fmt.Printf("Archivist remote HTTPS: https://%s\n", *tlsAddr)
			if err := tlsServer.ListenAndServeTLS(*tlsCert, *tlsKey); err != nil && !errors.Is(err, http.ErrServerClosed) {
				log.Fatalf("remote HTTPS listener: %v", err)
			}
		}()
	}
	fmt.Printf("Archivist server: http://%s\n", *addr)
	log.Fatal(server.ListenAndServe())
}
