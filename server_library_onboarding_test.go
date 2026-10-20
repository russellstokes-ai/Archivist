package main

import (
	"archive/zip"
	"bytes"
	"image"
	"image/png"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestLibraryComicNamesKeepUsefulIdentity(t *testing.T) {
	cases := []struct {
		name, title, series string
		issue               float64
		year                int
	}{
		{"Black.Widow.003.(2010).(Bchry-DCP).cbz", "Black Widow #3", "Black Widow", 3, 2010},
		{"[comic][Chinese][Halo.Helljumper.002][2009_Starr].cbr", "Halo Helljumper #2", "Halo Helljumper", 2, 2009},
		{"Example 001A (2001).cbz", "Example 001A", "Example", 0, 2001},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			m := pathMetadata("Collection/"+c.name, "Comic")
			if m.Title != c.title || m.Series != c.series || m.SeriesNumber != c.issue || m.PublishedYear != c.year || m.Author != "" {
				t.Fatalf("identity: %+v", m)
			}
		})
	}
	for _, name := range []string{"0009-0017 Robots (9 eps).cbz", "Example Annual 2001.cbz", "Example Volume 2.cbz", "2000AD Free Gifts.cbz"} {
		m := pathMetadata("Collection/"+name, "Comic")
		if m.SeriesNumber != 0 || m.PublishedYear != 0 {
			t.Fatalf("invented issue/year for %s: %+v", name, m)
		}
	}
}

func TestLibraryMetadataFieldsFailIndependently(t *testing.T) {
	m := metadataFromMap(map[string]any{"Title": "Example", "Writer": []any{"Jane Doe", "Sam Doe"}, "Genre": []any{"Science Fiction", "Adventure"}, "Year": "1999", "Volume": 2})
	if m.Title != "Example" || m.Author != "Jane Doe; Sam Doe" || m.Genre != "Science Fiction; Adventure" || m.PublishedYear != 1999 || m.SeriesNumber != 0 {
		t.Fatalf("schema: %+v", m)
	}
	m = metadataFromMap(map[string]any{"title": "Example", "author": map[string]any{"broken": true}, "year": -10})
	if m.Author != "" || m.Title != "Example" || m.PublishedYear != 0 {
		t.Fatalf("invalid field contaminated other evidence: %+v", m)
	}
}

func TestLibraryComicInfoCaseAndInvalidYear(t *testing.T) {
	p := filepath.Join(t.TempDir(), "Example.cbz")
	writeZipFixture(t, p, map[string]string{"comicinfo.XML": `<ComicInfo><Title>Example</Title><Genre>Adventure</Genre><Year>unknown</Year><Number>1A</Number></ComicInfo>`})
	side := filepath.Join(filepath.Dir(p), "ComicInfo.xml")
	os.WriteFile(side, []byte(`<ComicInfo><Title>Example</Title><Genre>Adventure</Genre><Year>unknown</Year></ComicInfo>`), 0600)
	sm := parseSidecarFile(side)
	if sm.Genre != "Adventure" {
		t.Fatalf("sidecar fields lost: %+v", sm)
	}
	m := comicMetadata(p)
	if m.Title != "Example" || m.Genre != "Adventure" || m.PublishedYear != 0 {
		t.Fatalf("valid fields lost: %+v", m)
	}
}

func TestLibraryComicBookLoverArchiveComment(t *testing.T) {
	p := filepath.Join(t.TempDir(), "Example.cbz")
	f, err := os.Create(p)
	if err != nil {
		t.Fatal(err)
	}
	z := zip.NewWriter(f)
	z.SetComment(`{"ComicBookInfo/1.0":{"title":"Example","series":"Examples","issue":"2","publicationYear":2002,"genre":"Adventure"}}`)
	w, _ := z.Create("001.jpg")
	w.Write([]byte("fixture"))
	z.Close()
	f.Close()
	m := comicMetadata(p)
	if m.Title != "Example" || m.Genre != "Adventure" || m.PublishedYear != 2002 || m.SeriesNumber != 2 {
		t.Fatalf("archive comment ignored: %+v", m)
	}
}

func TestLibraryDiscoveryExplainsSkippedAndRecoversMalformedComic(t *testing.T) {
	root := t.TempDir()
	p := filepath.Join(root, "Example]cbz")
	writeZipFixture(t, p, map[string]string{"001.jpg": "image"})
	if format, reason := discoverMedia(p); format != "Comic" || reason != "recovered comic filename" {
		t.Fatalf("missed comic: %s %s", format, reason)
	}
	pack := filepath.Join(root, "Books.zip")
	writeZipFixture(t, pack, map[string]string{"Book.epub": "book", "cover.jpg": "cover"})
	if format, reason := discoverMedia(pack); format != "" || reason != "archive contains books; unpack into a library folder" {
		t.Fatalf("pack mistaken for comic: %s %s", format, reason)
	}
	for name, want := range map[string]string{"Book.json": "supporting metadata", "cover.jpg": "image or cover", "Book.mobi": "reader format not supported", "notes.txt": "other file"} {
		if _, reason := discoverMedia(filepath.Join(root, name)); reason != want {
			t.Fatalf("%s: %s", name, reason)
		}
	}
}

func TestUnchangedScanDoesNotRewriteCatalogue(t *testing.T) {
	a := fixture(t)
	root := t.TempDir()
	p := filepath.Join(root, "Example.pdf")
	if err := os.WriteFile(p, []byte("%PDF-1.4 synthetic"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := a.addSource("Library", root); err != nil {
		t.Fatal(err)
	}
	if err := a.scan(1); err != nil {
		t.Fatal(err)
	}
	if _, err := a.db.Exec(`CREATE TRIGGER forbid_asset_update BEFORE UPDATE ON assets BEGIN SELECT RAISE(ABORT,'unchanged asset rewritten');END; CREATE TRIGGER forbid_work_update BEFORE UPDATE ON works BEGIN SELECT RAISE(ABORT,'unchanged work rewritten');END;`); err != nil {
		t.Fatal(err)
	}
	if err := a.scan(1); err != nil {
		t.Fatal(err)
	}
}

func TestLibraryRecoveredComicReadsRealPage(t *testing.T) {
	a := fixture(t)
	root := t.TempDir()
	var picture bytes.Buffer
	if err := png.Encode(&picture, image.NewRGBA(image.Rect(0, 0, 2, 2))); err != nil {
		t.Fatal(err)
	}
	writeZipFixture(t, filepath.Join(root, "Recovered]cbz"), map[string]string{"001.png": picture.String()})
	if err := a.addSource("Comics", root); err != nil {
		t.Fatal(err)
	}
	if err := a.scan(1); err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest("GET", "/api/assets/1/reader/0", nil)
	req.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
	res := httptest.NewRecorder()
	a.routes().ServeHTTP(res, req)
	if res.Code != 200 || res.Header().Get("Content-Type") != "image/png" || !bytes.Equal(res.Body.Bytes(), picture.Bytes()) {
		t.Fatalf("recovered comic unreadable: %d", res.Code)
	}
}

func TestLibraryComicQualifiersAndDecimalIssues(t *testing.T) {
	m := pathMetadata("Example #1.5.cbz", "Comic")
	if m.Series != "Example" || m.SeriesNumber != 1.5 || m.Title != "Example #1.5" {
		t.Fatalf("decimal corrupted: %+v", m)
	}
	for _, name := range []string{"Example 001 (Annual) (2001).cbz", "Example 001 (Volume 2) (2001).cbz", "Example #1 (Special).cbz"} {
		m := pathMetadata(name, "Comic")
		if m.SeriesNumber != 0 {
			t.Fatalf("qualifier lost: %s %+v", name, m)
		}
	}
}
