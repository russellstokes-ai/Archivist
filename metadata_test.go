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
	if meta.Title != "Dune" {
		t.Fatalf("generic track became title: %q", meta.Title)
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
	if cache.statChecks != 7 {
		t.Fatalf("generic sidecars stat'd %d times; want one check for each of seven generic candidates", cache.statChecks)
	}
	if cache.parseReads != 1 {
		t.Fatalf("generic sidecar parsed %d times; want once per scan", cache.parseReads)
	}
}


func TestRichMetadataFieldsAndJSONSidecar(t *testing.T) {
	root := t.TempDir()
	book := filepath.Join(root, "Dune.epub")
	if err := os.WriteFile(book, []byte("not an epub"), 0600); err != nil { t.Fatal(err) }
	body := "{\"metadata\":{\"title\":\"Dune\",\"author\":\"Herbert, Frank\",\"series\":\"Dune\",\"seriesNumber\":1,\"genre\":\"Science Fiction\",\"publishedYear\":1965,\"narrator\":\"Simon Vance\",\"publisher\":\"Chilton\",\"isbn\":\"978-0-441-17271-9\",\"asin\":\"B000000001\",\"language\":\"en\",\"description\":\"Arrakis.\"}}"
	if err := os.WriteFile(filepath.Join(root, "Dune.json"), []byte(body), 0600); err != nil { t.Fatal(err) }
	meta := metadataFor(book, "Dune.epub", "Ebook")
	if meta.Title != "Dune" || meta.Author != "Frank Herbert" || meta.Series != "Dune" || meta.SeriesNumber != 1 {
		t.Fatalf("identity=%+v", meta)
	}
	if meta.PublishedYear != 1965 || meta.Narrator != "Simon Vance" || meta.Publisher != "Chilton" {
		t.Fatalf("publication/audio=%+v", meta)
	}
	if meta.ISBN != "9780441172719" || meta.ASIN != "B000000001" || meta.Language != "en" || meta.Description != "Arrakis." {
		t.Fatalf("identifiers/details=%+v", meta)
	}
	if !strings.Contains(meta.Source, "sidecar") || meta.Confidence < 90 || meta.NeedsReview {
		t.Fatalf("provenance=%+v", meta)
	}
}

func TestEmbeddedSeriesPositionPublisherLanguageAndDescription(t *testing.T) {
	root := t.TempDir()
	book := filepath.Join(root, "book.epub")
	writeZipFixture(t, book, map[string]string{
		"META-INF/container.xml": "<container><rootfiles><rootfile full-path=\"OPS/content.opf\"/></rootfiles></container>",
		"OPS/content.opf": "<package><metadata><title>Dune Messiah</title><creator>Herbert, Frank</creator><subject>Science Fiction</subject><publisher>Putnam</publisher><language>en</language><description>Second Dune novel.</description><date>1969-01-01</date><identifier>ISBN 9780441172696</identifier><meta name=\"calibre:series\" content=\"Dune\"/><meta name=\"calibre:series_index\" content=\"2\"/></metadata></package>",
	})
	meta := metadataFor(book, "Herbert/Dune/Dune Messiah.epub", "Ebook")
	if meta.Author != "Frank Herbert" || meta.Series != "Dune" || meta.SeriesNumber != 2 {
		t.Fatalf("series metadata=%+v", meta)
	}
	if meta.Publisher != "Putnam" || meta.Language != "en" || meta.Description != "Second Dune novel." || meta.PublishedYear != 1969 {
		t.Fatalf("details=%+v", meta)
	}
	if meta.ISBN != "9780441172696" { t.Fatalf("isbn=%q", meta.ISBN) }
}

func TestComicInfoRichFields(t *testing.T) {
	root := t.TempDir()
	comic := filepath.Join(root, "Sandman.cbz")
	writeZipFixture(t, comic, map[string]string{
		"ComicInfo.xml": "<ComicInfo><Title>Preludes &amp; Nocturnes</Title><Series>Sandman</Series><Number>1</Number><Writer>Neil Gaiman</Writer><Genre>Fantasy</Genre><Publisher>DC</Publisher><LanguageISO>en</LanguageISO><Summary>Dream returns.</Summary><Year>1989</Year></ComicInfo>",
		"001.jpg": "image",
	})
	meta := metadataFor(comic, "Gaiman/Sandman/Sandman 01.cbz", "Comic")
	if meta.Title != "Preludes & Nocturnes" || meta.Author != "Neil Gaiman" || meta.Series != "Sandman" || meta.SeriesNumber != 1 {
		t.Fatalf("comic identity=%+v", meta)
	}
	if meta.Publisher != "DC" || meta.Language != "en" || meta.Description != "Dream returns." || meta.PublishedYear != 1989 {
		t.Fatalf("comic details=%+v", meta)
	}
}


func TestPathMetadataInfersSeriesPositions(t *testing.T) {
	meta := metadataFor("/missing/02 - Dune Messiah.epub", filepath.Join("Frank Herbert", "Dune", "02 - Dune Messiah.epub"), "Ebook")
	if meta.Author != "Frank Herbert" || meta.Series != "Dune" || meta.SeriesNumber != 2 || meta.Title != "Dune Messiah" {
		t.Fatalf("numbered ebook path=%+v", meta)
	}
	audio := metadataFor("/missing/01 - Opening.mp3", filepath.Join("Frank Herbert", "Dune", "02 - Dune Messiah", "01 - Opening.mp3"), "Audio")
	if audio.Author != "Frank Herbert" || audio.Series != "Dune" || audio.SeriesNumber != 2 {
		t.Fatalf("numbered audiobook folder=%+v", audio)
	}
}

func TestAudioMetadataRejectsGenericEmbeddedTrackTitle(t *testing.T) {
	root:=t.TempDir()
	bookDir:=filepath.Join(root,"Frank Herbert","Dune")
	if err:=os.MkdirAll(bookDir,0700);err!=nil{t.Fatal(err)}
	frames:=bytes.Join([][]byte{
		id3TextFrame("TIT2","Part 36"),
		id3TextFrame("TPE1","Frank Herbert"),
	},nil)
	tag:=append([]byte{'I','D','3',3,0,0},id3Syncsafe(len(frames))...)
	tag=append(tag,frames...)
	filename:=filepath.Join(bookDir,"Part 36.mp3")
	if err:=os.WriteFile(filename,tag,0600);err!=nil{t.Fatal(err)}
	meta:=metadataFor(filename,filepath.Join("Frank Herbert","Dune","Part 36.mp3"),"Audio")
	if meta.Title!="Dune"||meta.Author!="Frank Herbert" {
		t.Fatalf("resolved audiobook=%+v",meta)
	}
}
