package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// Jobs are persisted before acknowledgement. Interrupted scans restart safely:
// scan commits catalogue changes atomically and upserts existing paths.
func (a *app) initJobs() error {
	_, e := a.db.Exec(`CREATE TABLE IF NOT EXISTS jobs(id INTEGER PRIMARY KEY,source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,state TEXT NOT NULL,message TEXT NOT NULL DEFAULT ''); CREATE UNIQUE INDEX IF NOT EXISTS one_active_scan ON jobs(source_id) WHERE state IN ('queued','running'); UPDATE jobs SET state='queued',message='Resuming interrupted scan' WHERE state='running';`)
	return e
}
func (a *app) enqueue(id int64) (int64, error) {
	var found int
	if e := a.db.QueryRow("SELECT id FROM sources WHERE id=?", id).Scan(&found); e != nil {
		return 0, errors.New("source not found")
	}
	var existing int64
	if e := a.db.QueryRow("SELECT id FROM jobs WHERE source_id=? AND state IN ('queued','running')", id).Scan(&existing); e == nil {
		return existing, nil
	}
	res, e := a.db.Exec("INSERT INTO jobs(source_id,state) VALUES(?,'queued')", id)
	if e != nil {
		return 0, e
	}
	return res.LastInsertId()
}
func (a *app) worker(ctx context.Context) {
	ticker := time.NewTicker(300 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			var id, source int64
			if e := a.db.QueryRow("SELECT id,source_id FROM jobs WHERE state='queued' ORDER BY id LIMIT 1").Scan(&id, &source); e != nil {
				continue
			}
			a.db.Exec("UPDATE jobs SET state='running' WHERE id=?", id)
			state, msg := "complete", "Scan complete"
			if e := a.scan(source); e != nil {
				state, msg = "failed", e.Error()
			}
			a.db.Exec("UPDATE jobs SET state=?,message=? WHERE id=?", state, msg, id)
		}
	}
}
func (a *app) backgroundRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/jobs", func(w http.ResponseWriter, r *http.Request) {
		rows, e := a.db.Query("SELECT id,source_id,state,message FROM jobs ORDER BY id DESC LIMIT 50")
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer rows.Close()
		out := []map[string]any{}
		for rows.Next() {
			var id, source int64
			var state, msg string
			if e = rows.Scan(&id, &source, &state, &msg); e != nil {
				fail(w, 500, e)
				return
			}
			out = append(out, map[string]any{"id": id, "source_id": source, "state": state, "message": msg})
		}
		reply(w, out)
	})
	mux.HandleFunc("GET /api/folders", func(w http.ResponseWriter, r *http.Request) {
		p := r.URL.Query().Get("path")
		if p == "" {
			p, _ = os.UserHomeDir()
		}
		root, e := canonical(p)
		if e != nil {
			fail(w, 400, errors.New("folder unavailable"))
			return
		}
		entries, e := os.ReadDir(root)
		if e != nil {
			fail(w, 403, errors.New("cannot read this folder"))
			return
		}
		folders := []map[string]string{}
		for _, d := range entries {
			if d.IsDir() && d.Type()&os.ModeSymlink == 0 {
				folders = append(folders, map[string]string{"name": d.Name(), "path": filepath.Join(root, d.Name())})
			}
		}
		reply(w, map[string]any{"path": root, "parent": filepath.Dir(root), "folders": folders})
	})
}
