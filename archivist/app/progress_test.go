package main

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestProgressRevisionResumeAndIsolation(t *testing.T) {
	a := fixture(t)
	a.initCatalogue()
	a.initProgress()
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "1.mp3"), []byte("a"), 0600)
	os.WriteFile(filepath.Join(root, "2.mp3"), []byte("b"), 0600)
	os.WriteFile(filepath.Join(root, "3.epub"), []byte("c"), 0600)
	a.addSource("Main", root)
	a.scan(1)
	_, e := a.group("Book", []int64{1, 2, 3})
	if e != nil {
		t.Fatal(e)
	}
	var edition int64
	a.db.QueryRow("SELECT id FROM editions WHERE format='Audio'").Scan(&edition)
	p, e := a.saveProgress(edition, progress{Asset: 2, Seconds: 123.5})
	if e != nil || p.Revision != 1 {
		t.Fatalf("save: %+v %v", p, e)
	}
	read, e := a.readProgress(edition)
	if e != nil || read.Asset != 2 || read.Seconds != 123.5 {
		t.Fatal("resume failed")
	}
	if _, e = a.saveProgress(edition, progress{Asset: 1, Seconds: 5}); !errors.Is(e, errConflict) {
		t.Fatal("stale revision accepted")
	}
	p, e = a.saveProgress(edition, progress{Asset: 1, Seconds: 5, Revision: 1})
	if e != nil || p.Seconds != 5 {
		t.Fatal("deliberate rewind rejected")
	}
	if _, e = a.saveProgress(edition, progress{Asset: 3, Revision: 2}); e == nil {
		t.Fatal("ebook position accepted for audio")
	}
	if _, e = a.saveProgress(edition, progress{Asset: 1, Seconds: -1, Revision: 2}); e == nil {
		t.Fatal("negative position accepted")
	}
	a.scan(1)
	read, e = a.readProgress(edition)
	if e != nil || read.Seconds != 5 {
		t.Fatal("scan lost progress")
	}
}
