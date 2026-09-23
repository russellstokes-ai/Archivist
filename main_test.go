package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func fixture(t *testing.T) *app {
	t.Helper()
	db, e := openDB(filepath.Join(t.TempDir(), "test.db"))
	if e != nil {
		t.Fatal(e)
	}
	t.Cleanup(func() { db.Close() })
	a := &app{db: db, token: "test-key"}
	if e := a.initHousehold(); e != nil {
		t.Fatal(e)
	}
	a.initSessions()
	a.db.Exec("INSERT INTO sessions(token_hash,profile_id,credential_hash,expires,created) VALUES(?,0,?,9999999999,0)", keyHash("test-key"), keyHash("test-key"))
	return a
}
func TestSourcesAndRescan(t *testing.T) {
	a := fixture(t)
	one, two := t.TempDir(), t.TempDir()
	os.WriteFile(filepath.Join(one, "A.mp3"), []byte("audio"), 0600)
	os.WriteFile(filepath.Join(two, "B.epub"), []byte("book"), 0600)
	if e := a.addSource("Combined", one); e != nil {
		t.Fatal(e)
	}
	if e := a.addSource("Combined", two); e != nil {
		t.Fatal(e)
	}
	if e := a.addSource("Other", one); e == nil {
		t.Fatal("overlap accepted")
	}
	for _, id := range []int64{1, 2, 1} {
		if e := a.scan(id); e != nil {
			t.Fatal(e)
		}
	}
	var n int
	a.db.QueryRow("SELECT count(*) FROM assets").Scan(&n)
	if n != 2 {
		t.Fatalf("duplicates: %d", n)
	}
	os.Remove(filepath.Join(one, "A.mp3"))
	a.scan(1)
	a.db.QueryRow("SELECT available FROM assets WHERE source_id=1").Scan(&n)
	if n != 0 {
		t.Fatal("missing asset still available")
	}
	a.db.Exec("DELETE FROM sources WHERE id=2")
	if _, e := os.Stat(filepath.Join(two, "B.epub")); e != nil {
		t.Fatal("original removed")
	}
}
func TestDisconnectedSourceRetainsCatalogue(t *testing.T) {
	a := fixture(t)
	root := filepath.Join(t.TempDir(), "mount")
	os.Mkdir(root, 0700)
	os.WriteFile(filepath.Join(root, "Book.pdf"), []byte("pdf"), 0600)
	a.addSource("Space", root)
	a.scan(1)
	os.Rename(root, root+"-offline")
	if a.scan(1) == nil {
		t.Fatal("missing source accepted")
	}
	var n int
	a.db.QueryRow("SELECT count(*) FROM assets").Scan(&n)
	if n != 1 {
		t.Fatal("catalogue lost")
	}
}
func TestStreamAuthRangesAndSymlinkEscape(t *testing.T) {
	a := fixture(t)
	root := t.TempDir()
	p := filepath.Join(root, "Book.mp3")
	os.WriteFile(p, []byte("0123456789"), 0600)
	a.addSource("Space", root)
	a.scan(1)
	handler := a.routes()
	req := httptest.NewRequest("GET", "/api/assets/1", nil)
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	if res.Code != 401 {
		t.Fatal("unauthenticated stream")
	}
	req.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
	req.Header.Set("Range", "bytes=2-5")
	res = httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	if res.Code != 206 || res.Body.String() != "2345" {
		t.Fatalf("range: %d %q", res.Code, res.Body.String())
	}
	outside := filepath.Join(t.TempDir(), "secret.mp3")
	os.WriteFile(outside, []byte("secret"), 0600)
	os.Remove(p)
	if e := os.Symlink(outside, p); e != nil {
		t.Skip(e)
	}
	res = httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	if res.Code != 404 {
		t.Fatal("symlink escape")
	}
}
func TestCSRFAndPersistence(t *testing.T) {
	a := fixture(t)
	r := httptest.NewRequest("POST", "/api/sources", strings.NewReader(`{}`))
	r.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
	w := httptest.NewRecorder()
	a.routes().ServeHTTP(w, r)
	if w.Code != 403 {
		t.Fatal("missing request marker accepted")
	}
	dir := t.TempDir()
	dbpath := filepath.Join(dir, "persistent.db")
	db, e := openDB(dbpath)
	if e != nil {
		t.Fatal(e)
	}
	b := &app{db: db}
	if e = b.addSource("Separate", t.TempDir()); e != nil {
		t.Fatal(e)
	}
	db.Close()
	db, e = openDB(dbpath)
	if e != nil {
		t.Fatal(e)
	}
	defer db.Close()
	var name string
	db.QueryRow("SELECT space FROM sources").Scan(&name)
	if name != "Separate" {
		t.Fatal("source not persistent")
	}
	req := httptest.NewRequest("GET", "/", nil)
	res := httptest.NewRecorder()
	a.routes().ServeHTTP(res, req)
	body, _ := io.ReadAll(res.Result().Body)
	if !strings.Contains(string(body), "Source folders") {
		t.Fatal("UI not embedded")
	}
	req = httptest.NewRequest("GET", "/healthz", nil)
	res = httptest.NewRecorder()
	a.routes().ServeHTTP(res, req)
	if res.Code != 200 || !strings.Contains(res.Body.String(), `"ok":true`) {
		t.Fatalf("health endpoint: %d %q", res.Code, res.Body.String())
	}
}
