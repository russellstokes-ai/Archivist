package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSessionRotationLogoutAndExpiry(t *testing.T) {
	a := fixture(t)
	a.db.Exec("INSERT INTO profiles(id,name,key_hash) VALUES(1,'Member',?)", keyHash("member-key"))
	token, e := a.newSession("member-key")
	if e != nil {
		t.Fatal(e)
	}
	if token == "member-key" {
		t.Fatal("credential reused as session")
	}
	if _, ok := a.sessionIdentity("member-key"); ok {
		t.Fatal("raw key accepted as session")
	}
	if _, ok := a.sessionIdentity(token); !ok {
		t.Fatal("valid session denied")
	}
	a.db.Exec("UPDATE sessions SET expires=0 WHERE token_hash=?", keyHash(token))
	if _, ok := a.sessionIdentity(token); ok {
		t.Fatal("expired session accepted")
	}
	token, _ = a.newSession("member-key")
	r := httptest.NewRequest("POST", "/api/profiles/1/rotate-key", nil)
	r.Header.Set("X-Archivist-Action", "1")
	r.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
	w := httptest.NewRecorder()
	a.routes().ServeHTTP(w, r)
	if w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	if _, ok := a.sessionIdentity(token); ok {
		t.Fatal("rotation retained old session")
	}
	var result map[string]string
	json.Unmarshal(w.Body.Bytes(), &result)
	if _, ok := a.identify("member-key"); ok {
		t.Fatal("old key accepted")
	}
	token, e = a.newSession(result["key"])
	if e != nil {
		t.Fatal(e)
	}
	r = httptest.NewRequest("POST", "/logout", nil)
	r.Header.Set("X-Archivist-Action", "1")
	r.AddCookie(&http.Cookie{Name: "archivist_session", Value: token})
	w = httptest.NewRecorder()
	a.routes().ServeHTTP(w, r)
	if _, ok := a.sessionIdentity(token); ok {
		t.Fatal("logout did not revoke server session")
	}
}
func TestGrantEditsAtomicAndImmediate(t *testing.T) {
	a := fixture(t)
	a.db.Exec("INSERT INTO profiles(id,name,key_hash) VALUES(1,'Member',?)", keyHash("key"))
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "a.mp3"), []byte("a"), 0600)
	a.addSource("Family", root)
	a.scan(1)
	a.db.Exec("INSERT INTO grants VALUES(1,'Family')")
	token, _ := a.newSession("key")
	call := func(method, path, body, key string) *httptest.ResponseRecorder {
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		r.Header.Set("X-Archivist-Action", "1")
		r.AddCookie(&http.Cookie{Name: "archivist_session", Value: key})
		w := httptest.NewRecorder()
		a.routes().ServeHTTP(w, r)
		return w
	}
	if w := call("PUT", "/api/profiles/1/spaces", `{"spaces":["Missing"]}`, "test-key"); w.Code != 400 {
		t.Fatal("invalid grant accepted")
	}
	if w := call("GET", "/api/assets/1", "", token); w.Code != 200 {
		t.Fatal("rollback lost original grant")
	}
	if w := call("PUT", "/api/profiles/1/spaces", `{"spaces":[]}`, "test-key"); w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	if w := call("GET", "/api/assets/1", "", token); w.Code != 403 {
		t.Fatal("removed grant still permits media")
	}
	if w := call("PUT", "/api/profiles/1/spaces", `{"spaces":["Family"]}`, token); w.Code != 403 {
		t.Fatal("member self-escalated")
	}
}
