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
	w := call("PATCH", "/api/assets/1/metadata", `{"title":"Corrected","author":"Ada Lovelace","series":"Engine Notes","seriesNumber":2.5,"genre":"History","publishedYear":1843,"narrator":"Reader","publisher":"Analytical Press","isbn":"9780000000001","asin":"B000000001","language":"en","description":"Protected manual description"}`)
	if w.Code != 200 {
		t.Fatalf("metadata save: %d %s", w.Code, w.Body.String())
	}
	w = call("GET", "/api/books?q=Lovelace&space=", "")
	if w.Code != 200 || !strings.Contains(w.Body.String(), `"author":"Ada Lovelace"`) || !strings.Contains(w.Body.String(), `"series":"Engine Notes"`) ||
		!strings.Contains(w.Body.String(), `"seriesNumber":2.5`) || !strings.Contains(w.Body.String(), `"publishedYear":1843`) ||
		!strings.Contains(w.Body.String(), `"narrator":"Reader"`) || !strings.Contains(w.Body.String(), `"publisher":"Analytical Press"`) ||
		!strings.Contains(w.Body.String(), `"isbn":"9780000000001"`) || !strings.Contains(w.Body.String(), `"asin":"B000000001"`) ||
		!strings.Contains(w.Body.String(), `"language":"en"`) || !strings.Contains(w.Body.String(), `"description":"Protected manual description"`) {
		t.Fatalf("rich metadata search/list: %d %s", w.Code, w.Body.String())
	}
	if !strings.Contains(w.Body.String(), `"metadataSource":"manual"`) || strings.Contains(w.Body.String(), `"needsReview":true`) {
		t.Fatalf("manual metadata provenance/review state missing: %s", w.Body.String())
	}
	w = call("PATCH", "/api/assets/1/metadata", `{"author":"Augusta Ada King"}`)
	if w.Code != 200 {
		t.Fatalf("partial metadata save: %d %s", w.Code, w.Body.String())
	}
	w = call("GET", "/api/books?q=Augusta&space=", "")
	if w.Code != 200 || !strings.Contains(w.Body.String(), `"author":"Augusta Ada King"`) ||
		!strings.Contains(w.Body.String(), `"series":"Engine Notes"`) || !strings.Contains(w.Body.String(), `"seriesNumber":2.5`) ||
		!strings.Contains(w.Body.String(), `"narrator":"Reader"`) || !strings.Contains(w.Body.String(), `"description":"Protected manual description"`) {
		t.Fatalf("partial metadata update overwrote untouched fields: %d %s", w.Code, w.Body.String())
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}
	w = call("GET", "/api/books?q=Engine&space=", "")
	if w.Code != 200 || !strings.Contains(w.Body.String(), `"title":"Corrected"`) || !strings.Contains(w.Body.String(), `"series":"Engine Notes"`) ||
		!strings.Contains(w.Body.String(), `"seriesNumber":2.5`) || !strings.Contains(w.Body.String(), `"narrator":"Reader"`) ||
		!strings.Contains(w.Body.String(), `"description":"Protected manual description"`) {
		t.Fatalf("rescan lost rich manual metadata: %d %s", w.Code, w.Body.String())
	}
	if !strings.Contains(w.Body.String(), `"metadataSource":"manual"`) {
		t.Fatalf("rescan lost manual provenance: %s", w.Body.String())
	}
}


func TestBooksMetadataGapFiltersAndRichSearch(t *testing.T) {
	a := fixture(t)
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "Unknown.epub"), []byte("book"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "Dune.epub"), []byte("book"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "Dune.json"), []byte(`{"title":"Dune","author":"Frank Herbert","series":"Dune","seriesNumber":1,"genre":"Science Fiction","publishedYear":1965,"publisher":"Chilton","isbn":"9780441172719","language":"en","description":"Arrakis."}`), 0600); err != nil {
		t.Fatal(err)
	}
	if err := a.addSource("Family", root); err != nil {
		t.Fatal(err)
	}
	if err := a.scan(1); err != nil {
		t.Fatal(err)
	}
	handler := a.routes()
	get := func(path string) *httptest.ResponseRecorder {
		r := httptest.NewRequest("GET", path, nil)
		r.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, r)
		return w
	}

	w := get("/api/books?q=9780441172719")
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), `"title":"Dune"`) {
		t.Fatalf("identifier search: %d %s", w.Code, w.Body.String())
	}
	w = get("/api/books?metadataGap=author")
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), `"title":"Unknown"`) || strings.Contains(w.Body.String(), `"title":"Dune"`) {
		t.Fatalf("author gap filter: %d %s", w.Code, w.Body.String())
	}
	w = get("/api/books?metadataGap=identifier")
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), `"title":"Unknown"`) || strings.Contains(w.Body.String(), `"title":"Dune"`) {
		t.Fatalf("identifier gap filter: %d %s", w.Code, w.Body.String())
	}
	w = get("/api/books?metadataGap=not-real")
	if w.Code != http.StatusBadRequest {
		t.Fatalf("invalid metadata gap status=%d body=%s", w.Code, w.Body.String())
	}
}


func TestBooksMetadataConflictFilter(t *testing.T) {
	a := fixture(t)
	root := t.TempDir()
	book := filepath.Join(root, "Conflict.epub")
	writeZipFixture(t, book, map[string]string{
		"META-INF/container.xml": "<container><rootfiles><rootfile full-path=\"OPS/content.opf\"/></rootfiles></container>",
		"OPS/content.opf": "<package><metadata><title>Embedded Title</title><creator>Ursula Le Guin</creator></metadata></package>",
	})
	if err := os.WriteFile(filepath.Join(root, "Conflict.opf"), []byte("<package><metadata><title>Sidecar Title</title><creator>Ursula Le Guin</creator></metadata></package>"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := a.addSource("Family", root); err != nil { t.Fatal(err) }
	if err := a.scan(1); err != nil { t.Fatal(err) }
	r := httptest.NewRequest("GET", "/api/books?metadataGap=conflicts", nil)
	r.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
	w := httptest.NewRecorder()
	a.routes().ServeHTTP(w, r)
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), `"needsReview":true`) || !strings.Contains(w.Body.String(), "Metadata sources disagree") {
		t.Fatalf("conflict filter: %d %s", w.Code, w.Body.String())
	}
}
