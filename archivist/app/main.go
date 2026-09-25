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
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

//go:embed web/*
var web embed.FS

type app struct {
	db     *sql.DB
	token  string
	scanMu sync.Mutex
}
type source struct {
	ID         int64  `json:"id"`
	Space      string `json:"space"`
	Path       string `json:"path"`
	Status     string `json:"status"`
	Files      int64  `json:"files"`
	Works      int64  `json:"works"`
	Audiobooks int64  `json:"audiobooks"`
	Comics     int64  `json:"comics"`
	Ebooks     int64  `json:"ebooks"`
	PDFs       int64  `json:"pdfs"`
}
type book struct {
	ID        int64  `json:"id"`
	Title     string `json:"title"`
	Author    string `json:"author"`
	Series    string `json:"series"`
	Format    string `json:"format"`
	Space     string `json:"space"`
	Available bool   `json:"available"`
}

func openDB(path string) (*sql.DB, error) {
	db, e := sql.Open("sqlite", path)
	if e != nil {
		return nil, e
	}
	db.SetMaxOpenConns(1)
	_, e = db.Exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS sources(id INTEGER PRIMARY KEY,space TEXT NOT NULL,path TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'Not scanned');
 CREATE TABLE IF NOT EXISTS assets(id INTEGER PRIMARY KEY,source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,relative_path TEXT NOT NULL,title TEXT NOT NULL,format TEXT NOT NULL,available INTEGER NOT NULL DEFAULT 1,UNIQUE(source_id,relative_path));
 PRAGMA user_version=1;`)
	if e != nil {
		db.Close()
		return nil, e
	}
	for _, stmt := range []string{
		"ALTER TABLE assets ADD COLUMN author TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE assets ADD COLUMN series TEXT NOT NULL DEFAULT ''",
	} {
		if _, alterErr := db.Exec(stmt); alterErr != nil && !strings.Contains(strings.ToLower(alterErr.Error()), "duplicate column") {
			db.Close()
			return nil, alterErr
		}
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
	_, e = a.db.Exec("INSERT INTO sources(space,path) VALUES(?,?)", space, p)
	return e
}
func kind(path string) string {
	switch strings.ToLower(filepath.Ext(path)) {
	case ".mp3", ".m4b", ".m4a", ".ogg", ".flac", ".wav":
		return "Audio"
	case ".epub":
		return "Ebook"
	case ".pdf":
		return "PDF"
	case ".cbz", ".zip", ".cbt":
		return "Comic"
	}
	return ""
}
func (a *app) scanWithProgress(id int64, progress func(int, int)) error {
	a.scanMu.Lock()
	defer a.scanMu.Unlock()
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
	type entry struct{ Relative, Title, Author, Series, Format string }
	count := 0
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
		meta := metadataFor(path, rel, format)
		count++
		if progress != nil && (count == total || count%10 == 0) { progress(count, total) }
		return encoder.Encode(entry{rel, meta.Title, meta.Author, meta.Series, format})
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
		if _, e = tx.Exec(`INSERT INTO assets(source_id,relative_path,title,author,series,format,available) VALUES(?,?,?,?,?,?,1) ON CONFLICT(source_id,relative_path) DO UPDATE SET title=excluded.title,author=CASE WHEN assets.author='' THEN excluded.author ELSE assets.author END,series=CASE WHEN assets.series='' THEN excluded.series ELSE assets.series END,format=excluded.format,available=1`, id, item.Relative, item.Title, item.Author, item.Series, item.Format); e != nil {
			return e
		}
	}
	if _, e = tx.Exec("UPDATE sources SET status=? WHERE id=?", fmt.Sprintf("%d files · %s", count, time.Now().Format("2 Jan 15:04")), id); e != nil {
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
func (a *app) routes() http.Handler {
	mux := http.NewServeMux()
	a.backgroundRoutes(mux)
	a.catalogueRoutes(mux)
	a.coverRoutes(mux)
	a.progressRoutes(mux)
	a.householdRoutes(mux)
	a.accountRoutes(mux)
	a.readerRoutes(mux)
	a.recommendationRoutes(mux)
	a.organisationRoutes(mux)
	a.moveRoutes(mux)
	static, _ := fs.Sub(web, "web")
	mux.Handle("GET /", http.FileServer(http.FS(static)))
	mux.HandleFunc("GET /api/sources", func(w http.ResponseWriter, r *http.Request) {
		rows, e := a.db.Query(`SELECT s.id,s.space,s.path,s.status,
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
			if e = rows.Scan(&s.ID, &s.Space, &s.Path, &s.Status, &s.Files, &s.Works, &s.Audiobooks, &s.Comics, &s.Ebooks, &s.PDFs); e != nil {
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
		var sources, jobs, sessions int
		a.db.QueryRow("SELECT count(*) FROM sources").Scan(&sources)
		a.db.QueryRow("SELECT count(*) FROM jobs WHERE state IN ('queued','running')").Scan(&jobs)
		a.db.QueryRow("SELECT count(*) FROM sessions WHERE expires>?", time.Now().Unix()).Scan(&sessions)
		reply(w, map[string]any{
			"address":    publicURL(r),
			"configured": a.ownerConfigured(),
			"sources":    sources,
			"activeJobs": jobs,
			"sessions":   sessions,
			"roots":      browseRoots(),
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
		rows, e := a.db.Query(`SELECT a.id,a.title,a.author,a.series,a.format,s.space,a.available FROM assets a JOIN sources s ON s.id=a.source_id WHERE a.title LIKE ? AND (?='' OR s.space=?) AND (? OR s.space IN (SELECT space FROM grants WHERE profile_id=?)) ORDER BY a.title,a.id LIMIT 500`, q, space, space, who(r).Owner, who(r).ID)
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer rows.Close()
		out := []book{}
		for rows.Next() {
			var b book
			if e = rows.Scan(&b.ID, &b.Title, &b.Author, &b.Series, &b.Format, &b.Space, &b.Available); e != nil {
				fail(w, 500, e)
				return
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
			http.SetCookie(w, &http.Cookie{Name: "archivist_session", Value: session, HttpOnly: true, SameSite: http.SameSiteStrictMode, Path: "/"})
			reply(w, map[string]string{"token": session})
			return
		}
		if strings.HasPrefix(r.URL.Path, "/api/") {
			profile := identity{}
			valid := false
			if r.Header.Get("X-Ingress-Path") != "" {
				profile = identity{ID: 0, Name: "Owner", Owner: true, Ingress: true}
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
				profile, valid = a.sessionIdentity(key)
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
			http.SetCookie(w, &http.Cookie{Name: "archivist_session", Value: session, HttpOnly: true, SameSite: http.SameSiteStrictMode, Path: "/"})
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
			http.SetCookie(w, &http.Cookie{Name: "archivist_session", Value: "", MaxAge: -1, HttpOnly: true, SameSite: http.SameSiteStrictMode, Path: "/"})
			reply(w, map[string]bool{"ok": true})
			return
		}
		if r.URL.Path == "/reader.html" {
			bearer := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
			if _, ok := a.sessionIdentity(bearer); ok {
				http.SetCookie(w, &http.Cookie{Name: "archivist_session", Value: bearer, HttpOnly: true, SameSite: http.SameSiteStrictMode, Secure: r.TLS != nil, Path: "/"})
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
	addr := flag.String("listen", "127.0.0.1:5056", "Loopback listen address")
	allowLAN := flag.Bool("allow-lan", false, "Allow non-loopback bind for trusted reverse proxies or Home Assistant add-on containers")
	flag.Parse()
	host, _, e := net.SplitHostPort(*addr)
	ip := net.ParseIP(host)
	if e != nil || ip == nil || (!*allowLAN && !ip.IsLoopback()) {
		log.Fatal("This internal milestone accepts loopback addresses only unless -allow-lan is set")
	}
	if e = os.MkdirAll(*data, 0700); e != nil {
		log.Fatal(e)
	}
	db, e := openDB(filepath.Join(*data, "archivist.db"))
	if e != nil {
		log.Fatal(e)
	}
	defer db.Close()
	raw := make([]byte, 32)
	if _, e = rand.Read(raw); e != nil {
		log.Fatal(e)
	}
	a := &app{db: db, token: hex.EncodeToString(raw)}
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
	if e = a.initProgress(); e != nil {
		log.Fatal(e)
	}
	if e = a.initReader(); e != nil {
		log.Fatal(e)
	}
	if e = a.initJobs(); e != nil {
		log.Fatal(e)
	}
	if e = a.initMoves(); e != nil {
		log.Fatal(e)
	}
	go a.worker(context.Background())
	fmt.Printf("Archivist server: http://%s\n", *addr)
	server := &http.Server{Addr: *addr, Handler: a.routes(), ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 60 * time.Second}
	log.Fatal(server.ListenAndServe())
}
