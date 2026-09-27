package main

import (
	"crypto/rand"
	"encoding/hex"
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
			return identity{ID: 0, Name: "Admin", Role: "admin", Admin: true, Owner: true}, credential == hash
		}
		return identity{ID: 0, Name: "Admin", Role: "admin", Admin: true, Owner: true}, credential == keyHash(a.token)
	}
	var p identity
	e := a.db.QueryRow("SELECT id,name FROM profiles WHERE id=? AND key_hash=? AND revoked=0", id, credential).Scan(&p.ID, &p.Name)
	if e == nil {
		p.Role = "user"
	}
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
		// Compatibility route for older clients. Archivist Users now always see
		// the whole library, so a legacy "space selection" simply restores all spaces.
		id, e := strconv.ParseInt(r.PathValue("id"), 10, 64)
		if e != nil { fail(w,400,e); return }
		var n int
		if e=a.db.QueryRow("SELECT count(*) FROM profiles WHERE id=? AND revoked=0",id).Scan(&n);e!=nil||n!=1 {
			fail(w,404,errors.New("active user not found"));return
		}
		tx,e:=a.db.Begin()
		if e!=nil{fail(w,500,e);return}
		defer tx.Rollback()
		if _,e=tx.Exec("DELETE FROM grants WHERE profile_id=?",id);e!=nil{fail(w,500,e);return}
		if _,e=tx.Exec(`INSERT OR IGNORE INTO grants(profile_id,space) SELECT ?,space FROM sources GROUP BY space`,id);e!=nil{fail(w,500,e);return}
		if e=tx.Commit();e!=nil{fail(w,500,e);return}
		reply(w,map[string]bool{"ok":true})
	})
	mux.HandleFunc("GET /api/profiles/{id}/spaces", func(w http.ResponseWriter, r *http.Request) {
		rows,e:=a.db.Query("SELECT DISTINCT space FROM sources ORDER BY space")
		if e!=nil{fail(w,500,e);return}
		defer rows.Close()
		out:=[]string{}
		for rows.Next(){var space string;if e=rows.Scan(&space);e!=nil{fail(w,500,e);return};out=append(out,space)}
		reply(w,out)
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
