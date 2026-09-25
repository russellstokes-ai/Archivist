package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func (a *app) initSessions() error {
	_, e := a.db.Exec(`CREATE TABLE IF NOT EXISTS sessions(id INTEGER PRIMARY KEY,token_hash TEXT NOT NULL UNIQUE,profile_id INTEGER NOT NULL,credential_hash TEXT NOT NULL,expires INTEGER NOT NULL,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS owner_credentials(id INTEGER PRIMARY KEY CHECK(id=1),key_hash TEXT NOT NULL,created INTEGER NOT NULL);`)
	return e
}
func (a *app) ownerCredentialHash() (string, bool) {
	var hash string
	e := a.db.QueryRow("SELECT key_hash FROM owner_credentials WHERE id=1").Scan(&hash)
	return hash, e == nil
}
func (a *app) ownerConfigured() bool {
	_, ok := a.ownerCredentialHash()
	return ok
}
func (a *app) setOwnerCredential(key string) error {
	key = strings.TrimSpace(key)
	if len(key) < 8 || len(key) > 256 {
		return errors.New("create an access key with at least 8 characters")
	}
	_, e := a.db.Exec("INSERT INTO owner_credentials(id,key_hash,created) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET key_hash=excluded.key_hash", keyHash(key), time.Now().Unix())
	if e == nil {
		a.db.Exec("DELETE FROM sessions WHERE profile_id=0")
	}
	return e
}
func (a *app) newSession(key string) (string, error) {
	p, ok := a.identify(key)
	if !ok {
		return "", errors.New("incorrect access key")
	}
	raw := make([]byte, 32)
	if _, e := rand.Read(raw); e != nil {
		return "", e
	}
	token := hex.EncodeToString(raw)
	_, e := a.db.Exec("INSERT INTO sessions(token_hash,profile_id,credential_hash,expires,created) VALUES(?,?,?,?,?)", keyHash(token), p.ID, keyHash(key), time.Now().Add(30*24*time.Hour).Unix(), time.Now().Unix())
	return token, e
}
func (a *app) sessionIdentity(token string) (identity, bool) {
	var id int64
	var credential string
	if token == "" {
		return identity{}, false
	}
	if e := a.db.QueryRow("SELECT profile_id,credential_hash FROM sessions WHERE token_hash=? AND expires>?", keyHash(token), time.Now().Unix()).Scan(&id, &credential); e != nil {
		return identity{}, false
	}
	if id == 0 {
		if hash, ok := a.ownerCredentialHash(); ok {
			return identity{0, "Owner", true}, credential == hash
		}
		return identity{0, "Owner", true}, credential == keyHash(a.token)
	}
	var p identity
	e := a.db.QueryRow("SELECT id,name FROM profiles WHERE id=? AND key_hash=? AND revoked=0", id, credential).Scan(&p.ID, &p.Name)
	return p, e == nil
}
func (a *app) accountRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/sessions", func(w http.ResponseWriter, r *http.Request) {
		rows, e := a.db.Query("SELECT id,created,expires FROM sessions WHERE profile_id=? AND expires>? ORDER BY created DESC", who(r).ID, time.Now().Unix())
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer rows.Close()
		out := []map[string]int64{}
		for rows.Next() {
			var id, created, expires int64
			if e = rows.Scan(&id, &created, &expires); e != nil {
				fail(w, 500, e)
				return
			}
			out = append(out, map[string]int64{"id": id, "created": created, "expires": expires})
		}
		reply(w, out)
	})
	mux.HandleFunc("DELETE /api/sessions/{id}", func(w http.ResponseWriter, r *http.Request) {
		res, e := a.db.Exec("DELETE FROM sessions WHERE id=? AND profile_id=?", r.PathValue("id"), who(r).ID)
		if e != nil {
			fail(w, 500, e)
			return
		}
		n, _ := res.RowsAffected()
		if n == 0 {
			fail(w, 404, errors.New("session not found"))
			return
		}
		reply(w, map[string]bool{"ok": true})
	})
	mux.HandleFunc("PUT /api/profiles/{id}/spaces", func(w http.ResponseWriter, r *http.Request) {
		id, e := strconv.ParseInt(r.PathValue("id"), 10, 64)
		if e != nil {
			fail(w, 400, e)
			return
		}
		var body struct {
			Spaces []string `json:"spaces"`
		}
		if e = json.NewDecoder(http.MaxBytesReader(w, r.Body, 8192)).Decode(&body); e != nil || len(body.Spaces) > 100 {
			fail(w, 400, errors.New("invalid space selection"))
			return
		}
		tx, e := a.db.Begin()
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer tx.Rollback()
		var n int
		if e = tx.QueryRow("SELECT count(*) FROM profiles WHERE id=? AND revoked=0", id).Scan(&n); e != nil || n != 1 {
			fail(w, 404, errors.New("active profile not found"))
			return
		}
		if _, e = tx.Exec("DELETE FROM grants WHERE profile_id=?", id); e != nil {
			fail(w, 500, e)
			return
		}
		for _, space := range body.Spaces {
			if e = tx.QueryRow("SELECT count(*) FROM sources WHERE space=?", space).Scan(&n); e != nil || n == 0 {
				fail(w, 400, errors.New("choose existing spaces"))
				return
			}
			if _, e = tx.Exec("INSERT OR IGNORE INTO grants VALUES(?,?)", id, space); e != nil {
				fail(w, 500, e)
				return
			}
		}
		if e = tx.Commit(); e != nil {
			fail(w, 500, e)
			return
		}
		reply(w, map[string]bool{"ok": true})
	})
	mux.HandleFunc("GET /api/profiles/{id}/spaces", func(w http.ResponseWriter, r *http.Request) {
		rows, e := a.db.Query("SELECT space FROM grants WHERE profile_id=? ORDER BY space", r.PathValue("id"))
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer rows.Close()
		out := []string{}
		for rows.Next() {
			var s string
			if e = rows.Scan(&s); e != nil {
				fail(w, 500, e)
				return
			}
			out = append(out, s)
		}
		reply(w, out)
	})
	mux.HandleFunc("POST /api/profiles/{id}/rotate-key", func(w http.ResponseWriter, r *http.Request) {
		raw := make([]byte, 32)
		if _, e := rand.Read(raw); e != nil {
			fail(w, 500, e)
			return
		}
		key := hex.EncodeToString(raw)
		res, e := a.db.Exec("UPDATE profiles SET key_hash=? WHERE id=? AND revoked=0", keyHash(key), r.PathValue("id"))
		if e != nil {
			fail(w, 500, e)
			return
		}
		n, _ := res.RowsAffected()
		if n != 1 {
			fail(w, 404, errors.New("active profile not found"))
			return
		}
		reply(w, map[string]string{"key": key})
	})
}
func sessionRoute(r *http.Request) bool {
	return r.URL.Path == "/api/sessions" && r.Method == "GET" || strings.HasPrefix(r.URL.Path, "/api/sessions/") && r.Method == "DELETE"
}
