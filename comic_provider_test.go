package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestMetronMatchingRequiresUniqueSeriesAndIssue(t *testing.T) {
	q := multiMetadataQuery{Series: "Example", IssueNumber: "2", MediaFormat: "Comic"}
	body := `{"count":1,"next":null,"results":[{"id":7,"series":{"id":3,"name":"Example"},"number":"2"}]}`
	var result metronIssueList
	json.Unmarshal([]byte(body), &result)
	if id := uniqueMetronIssue(result, q); id != 7 {
		t.Fatalf("unique: %d", id)
	}
	result.Count = 2
	if id := uniqueMetronIssue(result, q); id != 0 {
		t.Fatal("partial/ambiguous result accepted")
	}
	result.Count = 1
	result.Results[0].Series.Name = "Example Returns"
	if uniqueMetronIssue(result, q) != 0 {
		t.Fatal("different series accepted")
	}
}
func TestMetronLookupBoundedAuthenticatedAndNoRedirects(t *testing.T) {
	calls := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		if r.Header.Get("Authorization") != "Bearer private-test-token" {
			t.Error("missing auth header")
		}
		if strings.Contains(r.URL.String(), "private-test-token") {
			t.Error("token in URL")
		}
		w.Header().Set("Content-Type", "application/json")
		if strings.HasSuffix(r.URL.Path, "/7/") {
			w.Write([]byte(`{"id":7,"number":"2","series":{"id":3,"name":"Example","genres":[{"name":"Adventure"}]},"cover_date":"2001-01-01","credits":[]}`))
			return
		}
		w.Write([]byte(`{"count":1,"next":null,"results":[{"id":7,"number":"2","series":{"id":3,"name":"Example"}}]}`))
	}))
	defer srv.Close()
	c, status := lookupMetron(context.Background(), srv.Client(), srv.URL, "private-test-token", multiMetadataQuery{Series: "Example", IssueNumber: "2", MediaFormat: "Comic"})
	if status != "matched" || c.Genre != "Adventure" || c.PublishedYear != 2001 || calls != 2 {
		t.Fatalf("%s %+v calls=%d", status, c, calls)
	}
}
func TestMetronTokenNeverReturnedAndOwnerRequired(t *testing.T) {
	a := fixture(t)
	req := httptest.NewRequest("PUT", "/api/manage/comic-provider", strings.NewReader(`{"token":"private-test-token"}`))
	req.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
	req.Header.Set("X-Archivist-Action", "1")
	res := httptest.NewRecorder()
	a.routes().ServeHTTP(res, req)
	if res.Code != 200 || strings.Contains(res.Body.String(), "private-test-token") {
		t.Fatalf("save: %d %s", res.Code, res.Body.String())
	}
	req = httptest.NewRequest("GET", "/api/manage/comic-provider", nil)
	req.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
	res = httptest.NewRecorder()
	a.routes().ServeHTTP(res, req)
	if res.Code != 200 || strings.Contains(res.Body.String(), "private-test-token") {
		t.Fatal("token exposed")
	}
}

func TestMetronRedirectDoesNotForwardCredentials(t *testing.T) {
	reached := false
	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { reached = true }))
	defer target.Close()
	source := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { http.Redirect(w, r, target.URL, 302) }))
	defer source.Close()
	_, status := lookupMetron(context.Background(), source.Client(), source.URL, "secret", multiMetadataQuery{Series: "Example", IssueNumber: "1"})
	if reached || status != "provider unavailable" {
		t.Fatalf("redirect followed: %v %s", reached, status)
	}
}
