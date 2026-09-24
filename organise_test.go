package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestEditMetadataAuthorSeriesSearchAndRescan(t *testing.T) {
	a := fixture(t)
	root := t.TempDir()
	if e := os.WriteFile(filepath.Join(root, "scan-title.epub"), []byte("book"), 0600); e != nil {
		t.Fatal(e)
	}
	if e := a.addSource("Family", root); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}
	handler := a.routes()
	call := func(method, path, body string) *httptest.ResponseRecorder {
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		r.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
		if method != "GET" {
			r.Header.Set("X-Archivist-Action", "1")
		}
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, r)
		return w
	}
	w := call("PATCH", "/api/assets/1/metadata", `{"title":"Corrected","author":"Ada Lovelace","series":"Engine Notes"}`)
	if w.Code != 200 {
		t.Fatalf("metadata save: %d %s", w.Code, w.Body.String())
	}
	w = call("GET", "/api/books?q=Lovelace&space=", "")
	if w.Code != 200 || !strings.Contains(w.Body.String(), `"author":"Ada Lovelace"`) || !strings.Contains(w.Body.String(), `"series":"Engine Notes"`) {
		t.Fatalf("metadata search/list: %d %s", w.Code, w.Body.String())
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}
	w = call("GET", "/api/books?q=Engine&space=", "")
	if w.Code != 200 || !strings.Contains(w.Body.String(), `"title":"Corrected"`) || !strings.Contains(w.Body.String(), `"series":"Engine Notes"`) {
		t.Fatalf("rescan lost metadata: %d %s", w.Code, w.Body.String())
	}
}
