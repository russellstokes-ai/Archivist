package main

import (
	"fmt"
	"archive/zip"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeZipFixture(t *testing.T, filename string, files map[string]string) {
	t.Helper()
	f, err := os.Create(filename)
	if err != nil {
		t.Fatal(err)
	}
	z := zip.NewWriter(f)
	for name, body := range files {
		w, err := z.Create(name)
		if err != nil {
			t.Fatal(err)
		}
		if _, err = w.Write([]byte(body)); err != nil {
			t.Fatal(err)
		}
	}
	if err = z.Close(); err != nil {
		t.Fatal(err)
	}
	if err = f.Close(); err != nil {
		t.Fatal(err)
	}
}

func TestMetadataPrefersSidecarAndTracksConfidence(t *testing.T) {
	root := t.TempDir()
	book := filepath.Join(root, "rough-name.epub")
	if err := os.WriteFile(book, []byte("not an epub"), 0600); err != nil {
		t.Fatal(err)
	}
	_jsii := `<?xml version="1.0"?><package><metadata>
		<title>Clean Title</title>
		<creator>Ursula Le Guin</creator>
		<meta name="calibre:series" content="Earthsea"/>
	</metadata></package>`
	if err := os.WriteFile(filepath.Join(root, "rough-name.opf"), []byte(_jsii), 0600); err != nil {
		t.Fatal(err)
	}
	meta := metadataFor(book, "rough-name.epub", "Ebook")
	if meta.Title != "Clean Title" || meta.Author != "Ursula Le Guin" || meta.Series != "Earthsea" {
		t.Fatalf("metadata=%+v", meta)
	}
	if meta.Confidence < 90 || meta.NeedsReview || !strings.Contains(meta.Source, "sidecar") {
		t.Fatalf("confidence/provenance=%+v", meta)
	}
}

func TestMetadataReadsBoundedEmbeddedEpub(t *testing.T) {
	root := t.TempDir()
	book := filepath.Join(root, "book.epub")
	writeZipFixture(t, book, map[string]string{
		"META-INF/container.xml": `<?xml version="1.0"?><container><rootfiles><rootfile full-path="OPS/content.opf"/></rootfiles></container>`,
		"OPS/content.opf": `<?xml version="1.0"?><package><metadata>
			<title>The Left Hand of Darkness</title>
			<creator>Ursula K. Le Guin</creator>
			<subject>Science Fiction</subject>
			<meta property="belongs-to-collection">Hainish Cycle</meta>
		</metadata></package>`,
	})
	meta := metadataFor(book, "Le Guin/Hainish/The Left Hand of Darkness.epub", "Ebook")
	if meta.Title != "The Left Hand of Darkness" || meta.Author != "Ursula K. Le Guin" || meta.Series != "Hainish Cycle" || meta.Genre != "Science Fiction" {
		t.Fatalf("embedded metadata=%+v", meta)
	}
	if meta.Confidence < 90 || meta.NeedsReview {
		t.Fatalf("embedded confidence=%+v", meta)
	}
}

func TestAudioPathMetadataAvoidsTreatingBookAsSeries(t *testing.T) {
	meta := metadataFor("/missing/01 - Opening.mp3", filepath.Join("Frank Herbert", "Dune", "01 - Opening.mp3"), "Audio")
	if meta.Author != "Frank Herbert" {
		t.Fatalf("author=%q", meta.Author)
	}
	if meta.Series != "" {
		t.Fatalf("book folder incorrectly treated as series: %q", meta.Series)
	}
	if meta.NeedsReview {
		t.Fatalf("reasonable audiobook path should not require review: %+v", meta)
	}
}

func TestMetadataSignatureIncludesSidecars(t *testing.T) {
	root := t.TempDir()
	book := filepath.Join(root, "Book.epub")
	if err := os.WriteFile(book, []byte("book"), 0600); err != nil {
		t.Fatal(err)
	}
	info, err := os.Stat(book)
	if err != nil {
		t.Fatal(err)
	}
	before := metadataSignature(book, info)
	sidecar := filepath.Join(root, "Book.opf")
	if err = os.WriteFile(sidecar, []byte("<package/>"), 0600); err != nil {
		t.Fatal(err)
	}
	after := metadataSignature(book, info)
	if before == after || !strings.Contains(after, "Book.opf") {
		t.Fatalf("signature did not include sidecar: before=%q after=%q", before, after)
	}
}


func TestGenericSidecarsAreCachedAcrossMultiTrackScan(t *testing.T) {
	root := t.TempDir()
	sidecar := filepath.Join(root, "metadata.opf")
	if err := os.WriteFile(sidecar, []byte(`<?xml version="1.0"?><package><metadata>
		<title>Dune</title><creator>Frank Herbert</creator>
	</metadata></package>`), 0600); err != nil {
		t.Fatal(err)
	}
	cache := newSidecarScanCache()
	for i := 0; i < 100; i++ {
		filename := filepath.Join(root, fmt.Sprintf("%03d - Track.mp3", i))
		if err := os.WriteFile(filename, []byte("audio"), 0600); err != nil {
			t.Fatal(err)
		}
		info, err := os.Stat(filename)
		if err != nil {
			t.Fatal(err)
		}
		_ = metadataSignatureWithCache(filename, info, cache)
		meta := metadataForWithCache(filename, filepath.Base(filename), "Audio", cache)
		if meta.Title != "Dune" || meta.Author != "Frank Herbert" {
			t.Fatalf("cached sidecar metadata=%+v", meta)
		}
	}
	if cache.statChecks != 4 {
		t.Fatalf("generic sidecars stat'd %d times; want one check for each of four generic candidates", cache.statChecks)
	}
	if cache.parseReads != 1 {
		t.Fatalf("generic sidecar parsed %d times; want once per scan", cache.parseReads)
	}
}
