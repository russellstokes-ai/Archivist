package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestRecoverableFileMoves(t *testing.T) {
	a := fixture(t)
	a.initMoves()
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "Book.mp3"), []byte("private audio"), 0600)
	a.addSource("Books", root)
	a.scan(1)
	for _, target := range []string{"../escape.mp3", "/tmp/escape.mp3", "Book.mp3", "Other.pdf"} {
		if _, e := a.previewMove(1, target); e == nil {
			t.Fatal("unsafe preview", target)
		}
	}
	m, e := a.previewMove(1, "Author/Book.mp3")
	if e != nil {
		t.Fatal(e)
	}
	if _, e = os.Stat(filepath.Join(root, "Author")); !os.IsNotExist(e) {
		t.Fatal("preview modified files")
	}
	os.Mkdir(filepath.Join(root, "Author"), 0750)
	os.WriteFile(filepath.Join(root, "Author/Book.mp3"), []byte("collision"), 0600)
	if _, e = a.applyMove(m.ID); e == nil {
		t.Fatal("overwrote collision")
	}
	os.Remove(filepath.Join(root, "Author/Book.mp3"))
	// Simulate power loss after destination link, before catalogue commit.
	a.db.Exec("UPDATE file_moves SET state='applying' WHERE id=?", m.ID)
	os.Link(filepath.Join(root, "Book.mp3"), filepath.Join(root, "Author/Book.mp3"))
	if e = a.scan(1); e == nil {
		t.Fatal("scan permitted during recovery")
	}
	if m, e = a.applyMove(m.ID); e != nil || m.State != "done" {
		t.Fatal(m, e)
	}
	if _, e = os.Stat(filepath.Join(root, "Book.mp3")); !os.IsNotExist(e) {
		t.Fatal("old file remains")
	}
	if b, e := os.ReadFile(filepath.Join(root, "Author/Book.mp3")); e != nil || string(b) != "private audio" {
		t.Fatal("data loss")
	}
	if _, e = a.applyMove(m.ID); e != nil {
		t.Fatal("retry not idempotent", e)
	}
	undo, e := a.previewMove(1, "Book.mp3")
	if e != nil {
		t.Fatal(e)
	}
	if _, e = a.applyMove(undo.ID); e != nil {
		t.Fatal(e)
	}
	if e = a.scan(1); e != nil {
		t.Fatal(e)
	}
	var n int
	a.db.QueryRow("SELECT count(*) FROM assets").Scan(&n)
	if n != 1 {
		t.Fatal("asset duplicated")
	}
	m, e = a.previewMove(1, "Changed.mp3")
	if e != nil {
		t.Fatal(e)
	}
	os.WriteFile(filepath.Join(root, "Book.mp3"), []byte("changed"), 0600)
	if _, e = a.applyMove(m.ID); e == nil {
		t.Fatal("stale preview accepted")
	}
}

func TestSortTemplatePaths(t *testing.T) {
	got, e := sortTemplatePath("author-series-title", "Dune: Messiah?", "Frank/Herbert", "Dune <Cycle>", "EPUB", "uploads/dune.epub")
	if e != nil {
		t.Fatal(e)
	}
	want := filepath.Join("Frank Herbert", "Dune Cycle", "Dune Messiah.epub")
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
	got, e = sortTemplatePath("format-author-title", "Book", "", "", "Audio", "Book.m4b")
	if e != nil {
		t.Fatal(e)
	}
	want = filepath.Join("Audio", "Unknown", "Book.m4b")
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
	if _, e = sortTemplatePath("bad", "Book", "Author", "", "Audio", "Book.m4b"); e == nil {
		t.Fatal("unknown template accepted")
	}
}

func TestBatchTemplatePreviewAndApply(t *testing.T) {
	a := fixture(t)
	a.initMoves()
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "One.mp3"), []byte("one"), 0600)
	os.WriteFile(filepath.Join(root, "Two.mp3"), []byte("two"), 0600)
	if e := a.addSource("Audio", root); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}
	a.db.Exec("UPDATE assets SET author='Ada',needs_review=0,metadata_source='manual',metadata_confidence=100 WHERE id IN (1,2)")
	out := a.previewMoveTemplateBatch([]int64{1, 2}, "author-title")
	if out.OK != 2 || out.Failed != 0 {
		t.Fatalf("preview batch: %+v", out)
	}
	out = a.applyMoveBatch(nil)
	if out.OK != 2 || out.Failed != 0 {
		t.Fatalf("apply batch: %+v", out)
	}
	for _, name := range []string{filepath.Join("Ada", "One.mp3"), filepath.Join("Ada", "Two.mp3")} {
		if _, e := os.Stat(filepath.Join(root, name)); e != nil {
			t.Fatal(name, e)
		}
	}
}

func TestBatchTemplateRejectsDuplicateDestinations(t *testing.T) {
	a := fixture(t)
	a.initMoves()
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "a.mp3"), []byte("a"), 0600)
	os.WriteFile(filepath.Join(root, "b.mp3"), []byte("b"), 0600)
	if e := a.addSource("Audio", root); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}
	a.db.Exec("UPDATE assets SET title='Same',author='Ada',needs_review=0,metadata_source='manual',metadata_confidence=100 WHERE id IN (1,2)")
	out := a.previewMoveTemplateBatch([]int64{1, 2}, "author-title")
	if out.OK != 1 || out.Failed != 1 {
		t.Fatalf("duplicate handling: %+v", out)
	}
	var n int
	a.db.QueryRow("SELECT count(*) FROM file_moves WHERE state='preview'").Scan(&n)
	if n != 1 {
		t.Fatalf("created duplicate previews: %d", n)
	}
}

func TestCopyFallbackWhenHardlinkUnavailable(t *testing.T) {
	a := fixture(t)
	a.initMoves()
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "Book.mp3"), []byte("copy fallback"), 0600)
	if e := a.addSource("Audio", root); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}
	m, e := a.previewMove(1, "Sorted/Book.mp3")
	if e != nil {
		t.Fatal(e)
	}
	oldLink := moveLinkFile
	moveLinkFile = func(root *os.Root, from, to string) error { return os.ErrInvalid }
	defer func() { moveLinkFile = oldLink }()
	m, e = a.applyMove(m.ID)
	if e != nil || m.State != "done" {
		t.Fatal(m, e)
	}
	if _, e = os.Stat(filepath.Join(root, "Book.mp3")); !os.IsNotExist(e) {
		t.Fatal("old file remains after copy fallback")
	}
	if b, e := os.ReadFile(filepath.Join(root, "Sorted/Book.mp3")); e != nil || string(b) != "copy fallback" {
		t.Fatal("copied data mismatch")
	}
}

func TestBatchApplyRecoversLinkedJournal(t *testing.T) {
	a := fixture(t)
	a.initMoves()
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "One.mp3"), []byte("one"), 0600)
	os.WriteFile(filepath.Join(root, "Two.mp3"), []byte("two"), 0600)
	if e := a.addSource("Audio", root); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}
	a.db.Exec("UPDATE assets SET author='Ada',needs_review=0,metadata_source='manual',metadata_confidence=100 WHERE id IN (1,2)")
	out := a.previewMoveTemplateBatch([]int64{1, 2}, "author-title")
	if out.OK != 2 || out.Failed != 0 {
		t.Fatalf("preview batch: %+v", out)
	}
	os.Mkdir(filepath.Join(root, "Ada"), 0750)
	os.Link(filepath.Join(root, "One.mp3"), filepath.Join(root, "Ada/One.mp3"))
	a.db.Exec("UPDATE assets SET relative_path=? WHERE id=1", filepath.Join("Ada", "One.mp3"))
	a.db.Exec("UPDATE file_moves SET state='linked' WHERE asset=1")
	out = a.applyMoveBatch(nil)
	if out.OK != 2 || out.Failed != 0 {
		t.Fatalf("apply recovery batch: %+v", out)
	}
	for _, name := range []string{filepath.Join("Ada", "One.mp3"), filepath.Join("Ada", "Two.mp3")} {
		if _, e := os.Stat(filepath.Join(root, name)); e != nil {
			t.Fatal(name, e)
		}
	}
	if _, e := os.Stat(filepath.Join(root, "One.mp3")); !os.IsNotExist(e) {
		t.Fatal("linked recovery did not remove old One.mp3")
	}
}


func TestTemplateOrganisationRequiresReviewedMetadata(t *testing.T) {
	a := fixture(t)
	a.initMoves()
	root := t.TempDir()
	if e := os.WriteFile(filepath.Join(root, "Mystery.epub"), []byte("book"), 0600); e != nil {
		t.Fatal(e)
	}
	if e := a.addSource("Books", root); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}
	out := a.previewMoveTemplateBatch([]int64{1}, "author-title")
	if out.OK != 0 || out.Failed != 1 {
		t.Fatalf("unreviewed metadata organised: %+v", out)
	}
	if len(out.Items) != 1 || out.Items[0].Error != "review metadata before organising this file" {
		t.Fatalf("unexpected review failure: %+v", out)
	}
	a.db.Exec("UPDATE assets SET title='Mystery',author='Known Author',needs_review=0,metadata_source='manual',metadata_confidence=100 WHERE id=1")
	out = a.previewMoveTemplateBatch([]int64{1}, "author-title")
	if out.OK != 1 || out.Failed != 0 {
		t.Fatalf("reviewed metadata not organisable: %+v", out)
	}
}
