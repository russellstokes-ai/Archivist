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


func TestFailedBackgroundScanRetainsCatalogueAndReportsFailure(t *testing.T) {
	a:=fixture(t)
	if err:=a.initJobs();err!=nil{t.Fatal(err)}
	root:=filepath.Join(t.TempDir(),"library")
	if err:=os.Mkdir(root,0700);err!=nil{t.Fatal(err)}
	if err:=os.WriteFile(filepath.Join(root,"Book.pdf"),[]byte("pdf"),0600);err!=nil{t.Fatal(err)}
	if err:=a.addSource("Main",root);err!=nil{t.Fatal(err)}
	if err:=a.scan(1);err!=nil{t.Fatal(err)}

	var before int
	if err:=a.db.QueryRow("SELECT count(*) FROM assets WHERE source_id=1").Scan(&before);err!=nil{t.Fatal(err)}
	if before!=1{t.Fatalf("initial catalogue=%d",before)}

	job,err:=a.enqueue(1)
	if err!=nil{t.Fatal(err)}
	if err=os.Rename(root,root+"-offline");err!=nil{t.Fatal(err)}

	ctx,cancel:=context.WithCancel(context.Background())
	defer cancel()
	go a.worker(ctx)
	deadline:=time.Now().Add(4*time.Second)
	for time.Now().Before(deadline){
		var state,message string
		if err=a.db.QueryRow("SELECT state,message FROM jobs WHERE id=?",job).Scan(&state,&message);err!=nil{t.Fatal(err)}
		if state=="failed"{
			if message=="Scan complete" || message==""{t.Fatalf("failed scan message=%q",message)}
			var after int
			if err=a.db.QueryRow("SELECT count(*) FROM assets WHERE source_id=1").Scan(&after);err!=nil{t.Fatal(err)}
			if after!=before{t.Fatalf("failed scan changed catalogue before=%d after=%d",before,after)}
			var status string
			if err=a.db.QueryRow("SELECT status FROM sources WHERE id=1").Scan(&status);err!=nil{t.Fatal(err)}
			if status!="Unavailable"{t.Fatalf("source status=%q",status)}
			return
		}
		if state=="complete"{t.Fatalf("missing source reported complete: %q",message)}
		time.Sleep(20*time.Millisecond)
	}
	t.Fatal("failed scan job did not settle")
}
