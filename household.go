package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
 "database/sql"
 "strconv"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

type identity struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	Role    string `json:"role"`
	Admin   bool   `json:"admin"`
	Owner   bool   `json:"owner"` // compatibility alias for older clients
	Ingress bool   `json:"ingress,omitempty"`
}
type identityKey struct{}

func who(r *http.Request) identity { p, _ := r.Context().Value(identityKey{}).(identity); return p }
func keyHash(key string) string    { v := sha256.Sum256([]byte(key)); return hex.EncodeToString(v[:]) }
func (a *app) initHousehold() error {
	if _, e := a.db.Exec(`CREATE TABLE IF NOT EXISTS profiles(id INTEGER PRIMARY KEY,name TEXT NOT NULL,key_hash TEXT NOT NULL UNIQUE,revoked INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS grants(profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,space TEXT NOT NULL,PRIMARY KEY(profile_id,space));`); e != nil {
		return e
	}
	return nil
}
func (a *app) identify(key string) (identity, bool) {
	var p identity
	if key == "" {
		return p, false
	}
	if hash, ok := a.ownerCredentialHash(); ok && keyHash(key) == hash {
		return identity{ID: 0, Name: "Admin", Role: "admin", Admin: true, Owner: true}, true
	}
	if !a.ownerConfigured() && key == a.token {
		return identity{ID: 0, Name: "Admin", Role: "admin", Admin: true, Owner: true}, true
	}
	e := a.db.QueryRow("SELECT id,name FROM profiles WHERE key_hash=? AND revoked=0", keyHash(key)).Scan(&p.ID, &p.Name)
	if e == nil {
		p.Role = "user"
	}
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
			out = append(out, map[string]any{"id": id, "name": name, "role": "user", "revoked": revoked, "spaces": spaces})
		}
		reply(w, out)
	})
	mux.HandleFunc("POST /api/profiles", func(w http.ResponseWriter, r *http.Request) {
		var p struct {
			Name string `json:"name"`
			Spaces json.RawMessage `json:"spaces"`
		}
		if e := json.NewDecoder(http.MaxBytesReader(w, r.Body, 8192)).Decode(&p); e != nil {
			fail(w, 400, e)
			return
		}
		p.Name = strings.TrimSpace(p.Name)
		if p.Name == "" || len(p.Name) > 100 {
			fail(w, 400, errors.New("enter a user name up to 100 characters"))
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
        spaces, e := requestedSpaces(tx, p.Spaces, true)
        if e != nil { fail(w,400,e); return }
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
        if e = replaceProfileGrants(tx,id,spaces); e != nil { fail(w,500,e); return }

		if e = tx.Commit(); e != nil {
			fail(w, 500, e)
			return
		}
		reply(w, map[string]any{"id": id, "name": p.Name, "role": "user", "key": key, "spaces": spaces})
	})
	mux.HandleFunc("PUT /api/profiles/{id}/grants", a.updateProfileGrants)
	mux.HandleFunc("DELETE /api/profiles/{id}", func(w http.ResponseWriter, r *http.Request) {
		tx,e:=a.db.Begin()
		if e!=nil{fail(w,500,e);return}
		defer tx.Rollback()
		res,e:=tx.Exec("UPDATE profiles SET revoked=1 WHERE id=? AND revoked=0",r.PathValue("id"))
		if e!=nil{fail(w,500,e);return}
		n,_:=res.RowsAffected()
		if n!=1{fail(w,404,errors.New("active profile not found"));return}
		if _,e=tx.Exec("DELETE FROM sessions WHERE profile_id=?",r.PathValue("id"));e!=nil{fail(w,500,e);return}
		if e=tx.Commit();e!=nil{fail(w,500,e);return}
		reply(w,map[string]bool{"ok":true})
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
	if path == "/api/me" || path == "/api/recommendations" || path == "/api/continue" || path == "/api/profile-stats" || path == "/api/activity" || path == "/api/opds" || path == "/api/atlas-relationships" || path == "/api/preferences" || path == "/api/sync/progress" {
		return r.Method == "GET"
	}
	if path == "/api/books" || path == "/api/works" || path == "/api/sources" || path == "/api/library-summary" {
		return r.Method == "GET"
	}
	if path == "/api/queue" {
		return r.Method == "GET" || r.Method == "PUT"
	}
	parts := strings.Split(strings.Trim(path, "/"), "/")
	var query string
	if len(parts) >= 3 && parts[1] == "assets" && (
		(len(parts) == 3 && r.Method == "GET") ||
		(len(parts) == 4 && parts[3] == "cover" && r.Method == "GET") ||
		((len(parts) == 4 || len(parts) == 5) && parts[3] == "reader" && r.Method == "GET") ||
		(len(parts) == 4 && parts[3] == "resources" && r.Method == "GET") ||
		(len(parts) == 4 && parts[3] == "reading-progress" && (r.Method == "GET" || r.Method == "PUT")) ||
		(len(parts) == 4 && parts[3] == "listening" && r.Method == "GET") ||
		(len(parts) == 4 && parts[3] == "listening-progress" && (r.Method == "GET" || r.Method == "PUT")) ||
		(len(parts) == 4 && parts[3] == "chapters" && r.Method == "GET")) {
		query = `SELECT s.space FROM assets a JOIN sources s ON s.id=a.source_id
          WHERE a.id=? AND EXISTS (
            SELECT 1 FROM published_works w JOIN editions ed ON ed.work_id=w.id
            JOIN edition_assets ea ON ea.edition_id=ed.id WHERE ea.asset_id=a.id
          )`
	}
	if len(parts) == 4 && parts[1] == "works" && (
		((parts[3] == "tracks" || parts[3] == "cover") && r.Method == "GET") ||
		(parts[3] == "preference" && r.Method == "PUT")) {
		query = `SELECT space FROM published_works WHERE id=?`
	}
	if len(parts) == 4 && parts[1] == "editions" && parts[3] == "progress" && (r.Method == "GET" || r.Method == "PUT") {
		query = `SELECT w.space FROM editions e JOIN published_works w ON w.id=e.work_id WHERE e.id=?`
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

// An omitted create selection preserves old APK behaviour. Explicit [] denies all.
func requestedSpaces(tx *sql.Tx, raw json.RawMessage, legacyDefault bool) ([]string,error) {
 spaces:=[]string{}
 if len(raw)==0 && legacyDefault {
  rows,err:=tx.Query("SELECT DISTINCT space FROM sources ORDER BY space")
  if err!=nil{return nil,err};defer rows.Close()
  for rows.Next(){var space string;if err=rows.Scan(&space);err!=nil{return nil,err};spaces=append(spaces,space)}
  return spaces,rows.Err()
 }
 if len(raw)==0 || strings.TrimSpace(string(raw))=="null" {return nil,errors.New("spaces must be an explicit array")}
 if err:=json.Unmarshal(raw,&spaces);err!=nil{return nil,errors.New("spaces must be an array of library names")}
 unique:=[]string{};seen:=map[string]bool{}
 for _,space:=range spaces {
  if seen[space]{continue};seen[space]=true
  var n int
  if err:=tx.QueryRow("SELECT count(*) FROM sources WHERE space=?",space).Scan(&n);err!=nil{return nil,err}
  if n==0{return nil,errors.New("unknown library space: "+space)}
  unique=append(unique,space)
 }
 return unique,nil
}
func replaceProfileGrants(tx *sql.Tx,id int64,spaces []string) error {
 if _,err:=tx.Exec("DELETE FROM grants WHERE profile_id=?",id);err!=nil{return err}
 for _,space:=range spaces {if _,err:=tx.Exec("INSERT INTO grants(profile_id,space) VALUES(?,?)",id,space);err!=nil{return err}}
 return nil
}
func (a *app) updateProfileGrants(w http.ResponseWriter,r *http.Request) {
 if !who(r).Owner {fail(w,403,errors.New("admin access required"));return}
 id,err:=strconv.ParseInt(r.PathValue("id"),10,64)
 if err!=nil||id<=0{fail(w,400,errors.New("invalid profile id"));return}
 var body struct{Spaces json.RawMessage `json:"spaces"`}
 if err=json.NewDecoder(http.MaxBytesReader(w,r.Body,8192)).Decode(&body);err!=nil{fail(w,400,err);return}
 tx,err:=a.db.Begin();if err!=nil{fail(w,500,err);return};defer tx.Rollback()
 var n int
 if err=tx.QueryRow("SELECT count(*) FROM profiles WHERE id=? AND revoked=0",id).Scan(&n);err!=nil{fail(w,500,err);return}
 if n!=1{fail(w,404,errors.New("active profile not found"));return}
 spaces,err:=requestedSpaces(tx,body.Spaces,false);if err!=nil{fail(w,400,err);return}
 if err=replaceProfileGrants(tx,id,spaces);err!=nil{fail(w,500,err);return}
 if err=tx.Commit();err!=nil{fail(w,500,err);return}
 // Sync continuations compare the live grants digest before returning cached rows.
 reply(w,map[string]any{"ok":true,"spaces":spaces})
}
