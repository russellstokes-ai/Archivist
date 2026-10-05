package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestLookupTitleUsesParentForWeakPartName(t *testing.T) {
	target := metadataEnrichTarget{Title:"Part 36", Relative:"Ursula K Le Guin/Earthsea/A Wizard of Earthsea/Part 36.pdf"}
	if got := lookupTitleForTarget(target); got != "A Wizard of Earthsea" {
		t.Fatalf("lookup title = %q", got)
	}
}

func TestCandidateScoreRewardsStrongTitleAndAuthor(t *testing.T) {
	target := metadataEnrichTarget{Title:"A Wizard of Earthsea", Author:"Ursula K Le Guin", Format:"Ebook"}
	good := onlineMetadataCandidate{Title:"A Wizard of Earthsea", Author:"Ursula K. Le Guin"}
	bad := onlineMetadataCandidate{Title:"The Left Hand of Darkness", Author:"Ursula K. Le Guin"}
	if candidateScore(target,good) <= candidateScore(target,bad) {
		t.Fatal("expected matching title to score higher")
	}
	if candidateScore(target,good) < 80 {
		t.Fatalf("good candidate score too low: %d", candidateScore(target,good))
	}
}

func TestOpenLibraryCandidates(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("title") != "A Wizard of Earthsea" {
			t.Fatalf("unexpected title query: %q", r.URL.Query().Get("title"))
		}
		w.Header().Set("Content-Type","application/json")
		w.Write([]byte(`{"docs":[{"title":"A Wizard of Earthsea","author_name":["Ursula K. Le Guin"],"subject":["Fantasy"]}]}`))
	}))
	defer server.Close()
	old := openLibrarySearchURL
	openLibrarySearchURL = server.URL
	defer func(){ openLibrarySearchURL = old }()
	items, err := openLibraryCandidates(context.Background(), metadataHTTPClient(), metadataEnrichTarget{Title:"A Wizard of Earthsea",Author:"Ursula K Le Guin"})
	if err != nil { t.Fatal(err) }
	if len(items) != 1 || items[0].Author != "Ursula K. Le Guin" || items[0].Genre != "Fantasy" {
		t.Fatalf("unexpected candidates: %#v", items)
	}
}

func TestGoogleBooksCandidates(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type","application/json")
		w.Write([]byte(`{"items":[{"volumeInfo":{"title":"Watchmen","authors":["Alan Moore","Dave Gibbons"],"categories":["Comics & Graphic Novels"]}}]}`))
	}))
	defer server.Close()
	old := googleBooksSearchURL
	googleBooksSearchURL = server.URL
	defer func(){ googleBooksSearchURL = old }()
	items, err := googleBooksCandidates(context.Background(), metadataHTTPClient(), metadataEnrichTarget{Title:"Watchmen",Format:"Comic"})
	if err != nil { t.Fatal(err) }
	if len(items) != 1 || items[0].Title != "Watchmen" || items[0].Genre != "Comics & Graphic Novels" {
		t.Fatalf("unexpected candidates: %#v", items)
	}
}

func TestAppendMetadataSourceIsStable(t *testing.T) {
	got := appendMetadataSource("path+embedded","Google Books")
	if got != "path+embedded+online:google-books" { t.Fatalf("got %q",got) }
	if again := appendMetadataSource(got,"Google Books"); again != got { t.Fatalf("duplicated provider: %q",again) }
}
