package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

type noNetwork struct{ calls int }

func (n *noNetwork) RoundTrip(r *http.Request) (*http.Response, error) {
	n.calls++
	return nil, fmt.Errorf("unexpected network request")
}
func TestRecommendationsLocalAccessibleAndUnstarted(t *testing.T) {
	a := fixture(t)
	a.initCatalogue()
	a.initProgress()
	a.initReader()
	for _, space := range []string{"Private", "Allowed"} {
		root := t.TempDir()
		os.WriteFile(filepath.Join(root, space+".epub"), []byte("x"), 0600)
		a.addSource(space, root)
	}
	a.scan(1)
	a.scan(2)
	a.db.Exec("INSERT INTO profiles(id,name,key_hash) VALUES(1,'Member',?)", keyHash("member"))
	a.db.Exec("INSERT INTO grants VALUES(1,'Allowed')")
	token, _ := a.newSession("member")
	trap := &noNetwork{}
	old := http.DefaultTransport
	http.DefaultTransport = trap
	defer func() { http.DefaultTransport = old }()
	call := func() string {
		r := httptest.NewRequest("GET", "/api/recommendations", nil)
		r.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		a.routes().ServeHTTP(w, r)
		if w.Code != 200 {
			t.Fatal(w.Body.String())
		}
		return w.Body.String()
	}
	s := call()
	if strings.Contains(s, "Private") || !strings.Contains(s, "Allowed") {
		t.Fatal(s)
	}
	a.db.Exec("INSERT INTO reading_progress VALUES(1,2,0,0,1)")
	if s = call(); strings.Contains(s, "Allowed") {
		t.Fatal("started title recommended")
	}
	a.db.Exec("DELETE FROM reading_progress")
	a.db.Exec("DELETE FROM grants")
	if s = call(); strings.Contains(s, "Allowed") {
		t.Fatal("revoked title recommended")
	}
	if trap.calls != 0 {
		t.Fatal("recommendations contacted network")
	}
}
