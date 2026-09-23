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

func TestHouseholdPermissionsAndProgress(t *testing.T) {
	a := fixture(t)
	a.initCatalogue()
	a.initProgress()
	a.initJobs()
	for _, s := range []string{"Adult", "Family"} {
		root := t.TempDir()
		os.WriteFile(filepath.Join(root, s+".mp3"), []byte("audio"), 0600)
		a.addSource(s, root)
	}
	a.scan(1)
	a.scan(2)
	a.group("Adult", []int64{1})
	a.group("Family", []int64{2})
	a.db.Exec("INSERT INTO profiles(id,name,key_hash) VALUES(1,'Child',?)", keyHash("child-key"))
	a.db.Exec("INSERT INTO grants(profile_id,space) VALUES(1,'Family')")
	memberSession, e := a.newSession("child-key")
	if e != nil {
		t.Fatal(e)
	}
	call := func(method, path, body string) *httptest.ResponseRecorder {
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		r.AddCookie(&http.Cookie{Name: "archivist_session", Value: memberSession})
		r.Header.Set("X-Archivist-Action", "1")
		w := httptest.NewRecorder()
		a.routes().ServeHTTP(w, r)
		return w
	}
	for _, path := range []string{"/api/books", "/api/works", "/api/sources"} {
		w := call("GET", path, "")
		if w.Code != 200 || strings.Contains(w.Body.String(), "Adult") {
			t.Fatalf("list leak %s: %d %s", path, w.Code, w.Body.String())
		}
	}
	for _, path := range []string{"/api/assets/1", "/api/works/1/tracks", "/api/editions/1/progress", "/api/folders", "/api/profiles", "/api/jobs"} {
		if w := call("GET", path, ""); w.Code != 403 {
			t.Fatalf("access %s: %d", path, w.Code)
		}
	}
	if w := call("GET", "/api/assets/2", ""); w.Code != 200 {
		t.Fatal("allowed media blocked")
	}
	if w := call("DELETE", "/api/sources/2", ""); w.Code != 403 {
		t.Fatal("member deleted source")
	}
	a.saveProgress(2, progress{Asset: 2, Seconds: 80})
	if w := call("GET", "/api/editions/2/progress", ""); strings.Contains(w.Body.String(), "80") {
		t.Fatal("owner progress leaked")
	}
	w := call("PUT", "/api/editions/2/progress", `{"asset":2,"seconds":20,"revision":0}`)
	if w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	p, _ := a.readProgress(2)
	if p.Seconds != 80 {
		t.Fatal("owner progress overwritten")
	}
	var member progress
	json.Unmarshal(w.Body.Bytes(), &member)
	if member.Seconds != 20 {
		t.Fatal("member save failed")
	}
	a.db.Exec("UPDATE profiles SET revoked=1 WHERE id=1")
	if w := call("GET", "/api/assets/2", ""); w.Code != 401 {
		t.Fatal("revoked key accepted")
	}
}
func TestLegacyProgressMigration(t *testing.T) {
	a := fixture(t)
	a.initCatalogue()
	a.initProgress()
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "One.mp3"), []byte("x"), 0600)
	a.addSource("Main", root)
	a.scan(1)
	a.group("One", []int64{1})
	a.db.Exec("INSERT INTO progress VALUES(1,1,42,1,0)")
	if e := a.initProgress(); e != nil {
		t.Fatal(e)
	}
	p, _ := a.readProgress(1)
	if p.Seconds != 42 {
		t.Fatal("legacy owner progress missing")
	}
	a.saveProgress(1, progress{Asset: 1, Seconds: 50, Revision: 1})
	a.initProgress()
	p, _ = a.readProgress(1)
	if p.Seconds != 50 {
		t.Fatal("migration overwrote newer progress")
	}
}
