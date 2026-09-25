package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

type identity struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	Owner   bool   `json:"owner"`
	Ingress bool   `json:"ingress,omitempty"`
}
type identityKey struct{}

func who(r *http.Request) identity { p, _ := r.Context().Value(identityKey{}).(identity); return p }
func keyHash(key string) string    { v := sha256.Sum256([]byte(key)); return hex.EncodeToString(v[:]) }
func (a *app) initHousehold() error {
	_, e := a.db.Exec(`CREATE TABLE IF NOT EXISTS profiles(id INTEGER PRIMARY KEY,name TEXT NOT NULL,key_hash TEXT NOT NULL UNIQUE,revoked INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS grants(profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,space TEXT NOT NULL,PRIMARY KEY(profile_id,space));`)
	return e
}
func (a *app) identify(key string) (identity, bool) {
	var p identity
	if key == "" {
		return p, false
	}
	if hash, ok := a.ownerCredentialHash(); ok && keyHash(key) == hash {
		return identity{ID: 0, Name: "Owner", Owner: true}, true
	}
	if !a.ownerConfigured() && key == a.token {
		return identity{ID: 0, Name: "Owner", Owner: true}, true
	}
	e := a.db.QueryRow("SELECT id,name FROM profiles WHERE key_hash=? AND revoked=0", keyHash(key)).Scan(&p.ID, &p.Name)
	return p, e == nil
}
func (a *app) householdRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/me", func(w http.ResponseWriter, r *http.Request) { reply(w, who(r)) })
	mux.HandleFunc("GET /api/profiles", func(w http.ResponseWriter, r *http.Request) {
		rows, e := a.db.Query("SELECT id,name,revoked FROM profiles ORDER BY id")
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer rows.Close()
		out := []map[string]any{}
		for rows.Next() {
			var id int64
			var name string
			var revoked bool
			if e = rows.Scan(&id, &name, &revoked); e != nil {
				fail(w, 500, e)
				return
			}
			spaceRows, spaceErr := a.db.Query("SELECT space FROM grants WHERE profile_id=? ORDER BY space", id)
			if spaceErr != nil {
				fail(w, 500, spaceErr)
				return
			}
			spaces := []string{}
			for spaceRows.Next() {
				var space string
				if spaceErr = spaceRows.Scan(&space); spaceErr != nil {
					spaceRows.Close()
					fail(w, 500, spaceErr)
					return
				}
				spaces = append(spaces, space)
			}
			spaceRows.Close()
			out = append(out, map[string]any{"id": id, "name": name, "revoked": revoked, "spaces": spaces})
		}
		reply(w, out)
	})
	mux.HandleFunc("POST /api/profiles", func(w http.ResponseWriter, r *http.Request) {
		var p struct {
			Name   string   `json:"name"`
			Spaces []string `json:"spaces"`
		}
		if e := json.NewDecoder(http.MaxBytesReader(w, r.Body, 8192)).Decode(&p); e != nil {
			fail(w, 400, e)
			return
		}
		p.Name = strings.TrimSpace(p.Name)
		if p.Name == "" || len(p.Name) > 100 || len(p.Spaces) > 100 {
			fail(w, 400, errors.New("enter a name and up to 100 spaces"))
			return
		}
		raw := make([]byte, 32)
		if _, e := rand.Read(raw); e != nil {
			fail(w, 500, e)
			return
		}
		key := hex.EncodeToString(raw)
		tx, e := a.db.Begin()
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer tx.Rollback()
		res, e := tx.Exec("INSERT INTO profiles(name,key_hash) VALUES(?,?)", p.Name, keyHash(key))
		if e != nil {
			fail(w, 500, e)
			return
		}
		id, e := res.LastInsertId()
		if e != nil {
			fail(w, 500, e)
			return
		}
		for _, space := range p.Spaces {
			var n int
			if e = tx.QueryRow("SELECT count(*) FROM sources WHERE space=?", space).Scan(&n); e != nil || n == 0 {
				fail(w, 400, errors.New("choose existing spaces"))
				return
			}
			if _, e = tx.Exec("INSERT OR IGNORE INTO grants(profile_id,space) VALUES(?,?)", id, space); e != nil {
				fail(w, 500, e)
				return
			}
		}
		if e = tx.Commit(); e != nil {
			fail(w, 500, e)
			return
		}
		reply(w, map[string]any{"id": id, "key": key})
	})
	mux.HandleFunc("DELETE /api/profiles/{id}", func(w http.ResponseWriter, r *http.Request) {
		_, e := a.db.Exec("UPDATE profiles SET revoked=1 WHERE id=?", r.PathValue("id"))
		if e != nil {
			fail(w, 500, e)
			return
		}
		reply(w, map[string]bool{"ok": true})
	})
}

// Enforce access before any raw asset, track list or progress handler executes.
func (a *app) authorise(r *http.Request, p identity) bool {
	if p.Owner {
		return true
	}
	if sessionRoute(r) {
		return true
	}
	path := r.URL.Path
	if path == "/api/me" || path == "/api/recommendations" {
		return r.Method == "GET"
	}
	if path == "/api/books" || path == "/api/works" || path == "/api/sources" {
		return r.Method == "GET"
	}
	parts := strings.Split(strings.Trim(path, "/"), "/")
	var query string
	if len(parts) >= 3 && parts[1] == "assets" && ((len(parts) == 3 && r.Method == "GET") || ((len(parts) == 4 || len(parts) == 5) && parts[3] == "reader" && r.Method == "GET") || (len(parts) == 4 && parts[3] == "reading-progress" && (r.Method == "GET" || r.Method == "PUT"))) {
		query = `SELECT s.space FROM assets a JOIN sources s ON s.id=a.source_id WHERE a.id=?`
	}
	if len(parts) == 4 && parts[1] == "works" && parts[3] == "tracks" && r.Method == "GET" {
		query = `SELECT space FROM works WHERE id=?`
	}
	if len(parts) == 4 && parts[1] == "editions" && parts[3] == "progress" && (r.Method == "GET" || r.Method == "PUT") {
		query = `SELECT w.space FROM editions e JOIN works w ON w.id=e.work_id WHERE e.id=?`
	}
	if query == "" {
		return false
	}
	var space string
	if e := a.db.QueryRow(query, parts[2]).Scan(&space); e != nil {
		return false
	}
	var n int
	a.db.QueryRow("SELECT count(*) FROM grants WHERE profile_id=? AND space=?", p.ID, space).Scan(&n)
	return n == 1
}
func withIdentity(r *http.Request, p identity) *http.Request {
	return r.WithContext(context.WithValue(r.Context(), identityKey{}, p))
}
