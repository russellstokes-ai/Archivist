package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestContinueReturnsRealProfileProgressOnly(t *testing.T) {
	a := fixture(t)
	if err := a.initProgress(); err != nil { t.Fatal(err) }
	if err := a.initReader(); err != nil { t.Fatal(err) }

	root := t.TempDir()
	audioDir := filepath.Join(root, "Author", "Long Book")
	if err := os.MkdirAll(audioDir, 0700); err != nil { t.Fatal(err) }
	if err := os.WriteFile(filepath.Join(audioDir, "01.mp3"), []byte("audio"), 0600); err != nil { t.Fatal(err) }
	if err := os.WriteFile(filepath.Join(root, "Novel.epub"), []byte("book"), 0600); err != nil { t.Fatal(err) }
	if err := a.addSource("Main", root); err != nil { t.Fatal(err) }
	if err := a.scan(1); err != nil { t.Fatal(err) }

	var audioEdition, audioAsset, ebookAsset int64
	if err := a.db.QueryRow(`SELECT e.id,a.id FROM editions e
		JOIN edition_assets ea ON ea.edition_id=e.id
		JOIN assets a ON a.id=ea.asset_id WHERE e.format='Audio' LIMIT 1`).Scan(&audioEdition,&audioAsset); err != nil { t.Fatal(err) }
	if err := a.db.QueryRow("SELECT id FROM assets WHERE format='Ebook' LIMIT 1").Scan(&ebookAsset); err != nil { t.Fatal(err) }

	point, err := a.saveProfileProgress(0, audioEdition, progress{Asset:audioAsset,Seconds:42})
	if err != nil { t.Fatal(err) }
	if _, err = a.db.Exec("INSERT INTO reading_progress(profile_id,asset_id,part,fraction,revision) VALUES(0,?,?,?,1)", ebookAsset, 1, 0.25); err != nil { t.Fatal(err) }

	call := func(token string) *httptest.ResponseRecorder {
		req := httptest.NewRequest("GET", "/api/continue", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		res := httptest.NewRecorder()
		a.routes().ServeHTTP(res, req)
		return res
	}

	res := call("test-key")
	if res.Code != http.StatusOK { t.Fatalf("continue status=%d body=%s",res.Code,res.Body.String()) }
	if !strings.Contains(res.Body.String(), "Long Book") || !strings.Contains(res.Body.String(), "Novel") {
		t.Fatalf("continue missing real progress: %s",res.Body.String())
	}

	if _, err = a.saveProfileProgress(0, audioEdition, progress{Asset:audioAsset,Seconds:42,Revision:point.Revision,Complete:true}); err != nil { t.Fatal(err) }
	res = call("test-key")
	if strings.Contains(res.Body.String(), "Long Book") || !strings.Contains(res.Body.String(), "Novel") {
		t.Fatalf("completed audio not removed from Continue: %s",res.Body.String())
	}
}

func TestContinueRespectsHouseholdSpaceGrants(t *testing.T) {
	a := fixture(t)
	if err := a.initProgress(); err != nil { t.Fatal(err) }

	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "Book.mp3"), []byte("audio"), 0600); err != nil { t.Fatal(err) }
	if err := a.addSource("Private", root); err != nil { t.Fatal(err) }
	if err := a.scan(1); err != nil { t.Fatal(err) }

	var edition, asset int64
	if err := a.db.QueryRow(`SELECT e.id,a.id FROM editions e JOIN edition_assets ea ON ea.edition_id=e.id JOIN assets a ON a.id=ea.asset_id LIMIT 1`).Scan(&edition,&asset); err != nil { t.Fatal(err) }

	a.db.Exec("INSERT INTO profiles(id,name,key_hash) VALUES(1,'Member',?)", keyHash("continue-member"))
	token, err := a.newSession("continue-member")
	if err != nil { t.Fatal(err) }
	if _, err = a.saveProfileProgress(1, edition, progress{Asset:asset,Seconds:10}); err != nil { t.Fatal(err) }

	call := func() *httptest.ResponseRecorder {
		req := httptest.NewRequest("GET", "/api/continue", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		res := httptest.NewRecorder()
		a.routes().ServeHTTP(res, req)
		return res
	}

	res := call()
	if res.Code != http.StatusOK || strings.Contains(res.Body.String(), "Book") {
		t.Fatalf("private work leaked into Continue: %d %s",res.Code,res.Body.String())
	}
	a.db.Exec("INSERT INTO grants(profile_id,space) VALUES(1,'Private')")
	res = call()
	if res.Code != http.StatusOK || !strings.Contains(res.Body.String(), "Book") {
		t.Fatalf("granted work missing from Continue: %d %s",res.Code,res.Body.String())
	}
}
