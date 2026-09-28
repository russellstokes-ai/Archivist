package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDuplicateCandidatesRequireHashVerification(t *testing.T) {
	a := fixture(t)
	root := t.TempDir()
	if e := os.WriteFile(filepath.Join(root, "One.epub"), []byte("same-content"), 0600); e != nil {
		t.Fatal(e)
	}
	if e := os.WriteFile(filepath.Join(root, "Two.epub"), []byte("same-content"), 0600); e != nil {
		t.Fatal(e)
	}
	if e := os.WriteFile(filepath.Join(root, "Three.epub"), []byte("other-data!!"), 0600); e != nil {
		t.Fatal(e)
	}
	if e := a.addSource("Main", root); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}

	handler := a.routes()
	req := httptest.NewRequest("GET", "/api/duplicate-candidates", nil)
	req.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	if res.Code != 200 {
		t.Fatalf("candidate list: %d %s", res.Code, res.Body.String())
	}
	if !strings.Contains(res.Body.String(), "same byte size; verify before treating as duplicates") {
		t.Fatalf("candidate explanation missing: %s", res.Body.String())
	}

	req = httptest.NewRequest("POST", "/api/duplicate-candidates/verify", strings.NewReader(`{"ids":[1,2,3]}`))
	req.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
	req.Header.Set("X-Archivist-Action", "1")
	res = httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	if res.Code != 200 {
		t.Fatalf("duplicate verify: %d %s", res.Code, res.Body.String())
	}
	body := res.Body.String()
	if !strings.Contains(body, `"exact"`) || !strings.Contains(body, `"id":1`) || !strings.Contains(body, `"id":2`) {
		t.Fatalf("exact duplicate pair missing: %s", body)
	}
	if strings.Count(body, `"id":3`) != 1 || !strings.Contains(body, `"unique"`) {
		t.Fatalf("same-size different-content item not kept unique: %s", body)
	}
}

func TestDuplicateVerificationRejectsRepeatedIDs(t *testing.T) {
	a := fixture(t)
	root := t.TempDir()
	if e := os.WriteFile(filepath.Join(root, "One.pdf"), []byte("x"), 0600); e != nil {
		t.Fatal(e)
	}
	if e := a.addSource("Main", root); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}
	req := httptest.NewRequest("POST", "/api/duplicate-candidates/verify", strings.NewReader(`{"ids":[1,1]}`))
	req.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
	req.Header.Set("X-Archivist-Action", "1")
	res := httptest.NewRecorder()
	a.routes().ServeHTTP(res, req)
	if res.Code != 400 {
		t.Fatalf("repeated IDs accepted: %d %s", res.Code, res.Body.String())
	}
}
