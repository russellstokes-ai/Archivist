package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"math"
	"net/http"
	"strconv"
)

type progress struct {
	Asset    int64   `json:"asset"`
	Seconds  float64 `json:"seconds"`
	Revision int64   `json:"revision"`
	Complete bool    `json:"complete"`
}

var errConflict = errors.New("progress changed in another session; reopen the audiobook to load that position")

func (a *app) initProgress() error {
	_, e := a.db.Exec(`CREATE TABLE IF NOT EXISTS progress(edition_id INTEGER PRIMARY KEY REFERENCES editions(id) ON DELETE CASCADE,asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,seconds REAL NOT NULL,revision INTEGER NOT NULL,complete INTEGER NOT NULL DEFAULT 0);`)
	if e != nil {
		return e
	}
	_, e = a.db.Exec(`CREATE TABLE IF NOT EXISTS profile_progress(profile_id INTEGER NOT NULL,edition_id INTEGER NOT NULL REFERENCES editions(id) ON DELETE CASCADE,asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,seconds REAL NOT NULL,revision INTEGER NOT NULL,complete INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(profile_id,edition_id));
 INSERT OR IGNORE INTO profile_progress SELECT 0,edition_id,asset_id,seconds,revision,complete FROM progress;`)
	return e
}
func (a *app) readProgress(edition int64) (progress, error) { return a.readProfileProgress(0, edition) }
func (a *app) readProfileProgress(profile, edition int64) (progress, error) {
	var p progress
	e := a.db.QueryRow("SELECT asset_id,seconds,revision,complete FROM profile_progress WHERE profile_id=? AND edition_id=?", profile, edition).Scan(&p.Asset, &p.Seconds, &p.Revision, &p.Complete)
	if e == sql.ErrNoRows {
		return p, nil
	}
	return p, e
}
func (a *app) saveProgress(edition int64, p progress) (progress, error) {
	return a.saveProfileProgress(0, edition, p)
}
func (a *app) saveProfileProgress(profile, edition int64, p progress) (progress, error) {
	if p.Seconds < 0 || p.Seconds > 31536000 || math.IsNaN(p.Seconds) || math.IsInf(p.Seconds, 0) || p.Revision < 0 {
		return p, errors.New("invalid playback position")
	}
	tx, e := a.db.Begin()
	if e != nil {
		return p, e
	}
	defer tx.Rollback()
	var n int
	if e = tx.QueryRow("SELECT count(*) FROM edition_assets ea JOIN editions e ON e.id=ea.edition_id WHERE ea.edition_id=? AND ea.asset_id=? AND e.format='Audio'", edition, p.Asset).Scan(&n); e != nil {
		return p, e
	}
	if n != 1 {
		return p, errors.New("track does not belong to this audio edition")
	}
	var revision int64
	e = tx.QueryRow("SELECT revision FROM profile_progress WHERE profile_id=? AND edition_id=?", profile, edition).Scan(&revision)
	if e != nil && e != sql.ErrNoRows {
		return p, e
	}
	if revision != p.Revision {
		return p, errConflict
	}
	p.Revision++
	_, e = tx.Exec(`INSERT INTO profile_progress(profile_id,edition_id,asset_id,seconds,revision,complete) VALUES(?,?,?,?,?,?) ON CONFLICT(profile_id,edition_id) DO UPDATE SET asset_id=excluded.asset_id,seconds=excluded.seconds,revision=excluded.revision,complete=excluded.complete`, profile, edition, p.Asset, p.Seconds, p.Revision, p.Complete)
	if e != nil {
		return p, e
	}
	return p, tx.Commit()
}
func (a *app) progressRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/editions/{id}/progress", func(w http.ResponseWriter, r *http.Request) {
		id, e := strconv.ParseInt(r.PathValue("id"), 10, 64)
		if e != nil {
			fail(w, 400, e)
			return
		}
		p, e := a.readProfileProgress(who(r).ID, id)
		if e != nil {
			fail(w, 500, e)
			return
		}
		reply(w, p)
	})
	mux.HandleFunc("PUT /api/editions/{id}/progress", func(w http.ResponseWriter, r *http.Request) {
		id, e := strconv.ParseInt(r.PathValue("id"), 10, 64)
		if e != nil {
			fail(w, 400, e)
			return
		}
		var p progress
		if e = json.NewDecoder(http.MaxBytesReader(w, r.Body, 2048)).Decode(&p); e != nil {
			fail(w, 400, errors.New("invalid progress payload"))
			return
		}
		p, e = a.saveProfileProgress(who(r).ID, id, p)
		if e != nil {
			code := 400
			if errors.Is(e, errConflict) {
				code = 409
			}
			fail(w, code, e)
			return
		}
		reply(w, p)
	})
}
