package main

import (
	"archive/zip"
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestDurableJobs(t *testing.T) {
	a := fixture(t)
	if e := a.initJobs(); e != nil {
		t.Fatal(e)
	}
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "Test.pdf"), []byte("pdf"), 0600)
	a.addSource("Main", root)
	id, e := a.enqueue(1)
	if e != nil {
		t.Fatal(e)
	}
	again, e := a.enqueue(1)
	if e != nil || again != id {
		t.Fatal("duplicate job")
	}
	a.db.Exec("UPDATE jobs SET state='running'")
	a.initJobs()
	var state string
	a.db.QueryRow("SELECT state FROM jobs").Scan(&state)
	if state != "queued" {
		t.Fatal("interrupted job not requeued")
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go a.worker(ctx)
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		a.db.QueryRow("SELECT state FROM jobs WHERE id=?", id).Scan(&state)
		if state == "complete" {
			return
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatal("worker did not complete")
}
func TestEPUBMetadata(t *testing.T) {
	p := filepath.Join(t.TempDir(), "untitled.epub")
	f, e := os.Create(p)
	if e != nil {
		t.Fatal(e)
	}
	z := zip.NewWriter(f)
	c, _ := z.Create("META-INF/container.xml")
	c.Write([]byte(`<container><rootfiles><rootfile full-path="OPS/book.opf"/></rootfiles></container>`))
	m, _ := z.Create("OPS/book.opf")
	m.Write([]byte(`<package xmlns:dc="http://purl.org/dc/elements/1.1/"><metadata><dc:title>The Real Title</dc:title></metadata></package>`))
	z.Close()
	f.Close()
	if title := epubTitle(p); title != "The Real Title" {
		t.Fatalf("title %q", title)
	}
	os.WriteFile(p, []byte("broken zip"), 0600)
	if epubTitle(p) != "" {
		t.Fatal("corrupt archive accepted")
	}
}
