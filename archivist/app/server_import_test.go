package main

import (
 "fmt"
 "os"
 "path/filepath"
 "runtime"
 "testing"
 "time"
)

func TestImportProgressAndUnchangedMetadata(t *testing.T) {
 a:=fixture(t)
 root:=t.TempDir()
 if err:=os.WriteFile(filepath.Join(root,"Book.pdf"),[]byte("synthetic"),0600);err!=nil{t.Fatal(err)}
 if err:=a.addSource("Books",root);err!=nil{t.Fatal(err)}
 calls:=0
 if err:=a.scanWithProgress(1,func(done,total int){
  calls++
  if calls==1&&(done!=0||total!=0){t.Errorf("discovery must start without a counting pass: %d/%d",done,total)}
 });err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("UPDATE assets SET title='My correction',metadata_source='manual'");err!=nil{t.Fatal(err)}
 var lastDone,lastTotal int
 if err:=a.scanWithProgress(1,func(done,total int){lastDone,lastTotal=done,total});err!=nil{t.Fatal(err)}
 if lastDone!=1||lastTotal!=1{t.Fatalf("final count %d/%d",lastDone,lastTotal)}
 var title,status string
 if err:=a.db.QueryRow("SELECT title FROM assets").Scan(&title);err!=nil{t.Fatal(err)}
 if title!="My correction"{t.Fatalf("rescan lost correction: %s",title)}
 if err:=a.db.QueryRow("SELECT status FROM sources").Scan(&status);err!=nil{t.Fatal(err)}
 if status==""{t.Fatal("missing completion status")}
}

// Opt-in: creates disposable synthetic files, never uses a household library.
func TestServerImportTenThousand(t *testing.T) {
 if os.Getenv("ARCHIVIST_IMPORT_BENCHMARK")!="1"{t.Skip("set ARCHIVIST_IMPORT_BENCHMARK=1 for the synthetic import measurement")}
 a:=fixture(t)
 root:=t.TempDir()
 for i:=0;i<10020;i++ {
  if err:=os.WriteFile(filepath.Join(root,fmt.Sprintf("Synthetic Book %05d%s",i,[]string{".CBZ",".cbr",".pdf",".cbt"}[i%4])),[]byte("synthetic PDF placeholder"),0600);err!=nil{t.Fatal(err)}
 }
 if err:=a.addSource("Synthetic import",root);err!=nil{t.Fatal(err)}
 for _,label:=range []string{"first import","unchanged rescan"}{
  runtime.GC()
  var before,after runtime.MemStats
  runtime.ReadMemStats(&before)
  start:=time.Now()
  if err:=a.scan(1);err!=nil{t.Fatal(err)}
  elapsed:=time.Since(start)
  runtime.ReadMemStats(&after)
  var count int
  if err:=a.db.QueryRow("SELECT count(*) FROM assets WHERE available=1").Scan(&count);err!=nil{t.Fatal(err)}
  if count!=10020{t.Fatalf("lost/duplicated assets: %d",count)}
  t.Logf("%s: %d files, elapsed=%s, allocated_bytes=%d (not peak memory)",label,count,elapsed,after.TotalAlloc-before.TotalAlloc)
 }
}
