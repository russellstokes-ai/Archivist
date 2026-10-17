package main

import (
 "net/http"
 "net/http/httptest"
 "os"
 "path/filepath"
 "testing"
)

// Simulates a mounted-but-empty NAS path and a physically absent root in
// different library spaces. Only synthetic files are touched. Real SMB/NFS
// behaviour remains a separate hardware release gate.
func TestMultiSourceNASLossDoesNotCrossContaminateBooksOrBookmarks(t *testing.T){
 a:=fixture(t)
 if err:=a.initProgress();err!=nil{t.Fatal(err)}
 parent:=t.TempDir()
 offlineRoot:=filepath.Join(parent,"nas-collection")
 secondRoot:=filepath.Join(parent,"independent-disk")
 if err:=os.MkdirAll(offlineRoot,0700);err!=nil{t.Fatal(err)}
 if err:=os.MkdirAll(secondRoot,0700);err!=nil{t.Fatal(err)}
 filename:="Book.m4b"
 media:=[]byte("the same audiobook bytes across a mount interruption")
 if err:=os.WriteFile(filepath.Join(offlineRoot,filename),media,0600);err!=nil{t.Fatal(err)}
 if err:=os.WriteFile(filepath.Join(secondRoot,"Other.m4b"),[]byte("independent streaming bytes"),0600);err!=nil{t.Fatal(err)}
 if err:=a.addSource("NAS Audiobooks",offlineRoot);err!=nil{t.Fatal(err)}
 if err:=a.addSource("Second Library",secondRoot);err!=nil{t.Fatal(err)}
 for _,id:=range []int64{1,2}{if err:=a.scan(id);err!=nil{t.Fatal(err)}}
 var oldWork,oldEdition,oldAsset,otherAsset int64
 if err:=a.db.QueryRow(`SELECT w.id,ed.id,ea.asset_id FROM works w
 JOIN editions ed ON ed.work_id=w.id JOIN edition_assets ea ON ea.edition_id=ed.id
 JOIN assets a ON a.id=ea.asset_id WHERE a.source_id=1`).Scan(&oldWork,&oldEdition,&oldAsset);err!=nil{t.Fatal(err)}
 if err:=a.db.QueryRow("SELECT id FROM assets WHERE source_id=2").Scan(&otherAsset);err!=nil{t.Fatal(err)}
 if _,err:=a.saveProgress(oldEdition,progress{Asset:oldAsset,Seconds:511,Revision:0});err!=nil{t.Fatal(err)}
 // NAS client loses its mount, but a valid empty mount directory remains.
 if err:=os.Rename(offlineRoot,offlineRoot+"-disconnected");err!=nil{t.Fatal(err)}
 if err:=os.Mkdir(offlineRoot,0700);err!=nil{t.Fatal(err)}
 if err:=a.scan(1);err!=nil{t.Fatalf("reachable empty mount must remain non-destructive: %v",err)}
 var count,available int
 if err:=a.db.QueryRow("SELECT count(*) FROM works WHERE id=?",oldWork).Scan(&count);err!=nil||count!=1{
  t.Fatalf("source unexpectedly removed work %d: %v",count,err)
 }
 if err:=a.db.QueryRow("SELECT available FROM assets WHERE id=?",oldAsset).Scan(&available);err!=nil||available!=0{
  t.Fatalf("missing original must be unavailable, not deleted: %d %v",available,err)
 }
 if err:=a.db.QueryRow("SELECT available FROM assets WHERE id=?",otherAsset).Scan(&available);err!=nil||available!=1{
  t.Fatalf("other source corrupted by offline mount: %d %v",available,err)
 }
 var seconds float64
 if err:=a.db.QueryRow("SELECT seconds FROM profile_progress WHERE profile_id=0 AND edition_id=?",oldEdition).Scan(&seconds);err!=nil||seconds!=511{
  t.Fatalf("lost chapter resume after empty mount: %v %v",seconds,err)
 }
 // Unmount becomes physically absent; scan must fail but not erase anything.
 if err:=os.Remove(offlineRoot);err!=nil{t.Fatal(err)}
 if err:=a.scan(1);err==nil{t.Fatal("absent NAS mount was treated as a valid scan")}
 if err:=a.db.QueryRow("SELECT count(*) FROM works WHERE id=?",oldWork).Scan(&count);err!=nil||count!=1{
  t.Fatalf("missing mount deleted book %d: %v",count,err)
 }
 // Family data remains visible as unavailable only to authenticated owner.
 req:=httptest.NewRequest("GET","/api/library-health",nil)
 req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
 res:=httptest.NewRecorder();a.routes().ServeHTTP(res,req)
 if res.Code!=http.StatusOK{t.Fatalf("offline diagnostics unavailable: %d %s",res.Code,res.Body.String())}
 if err:=os.Rename(offlineRoot+"-disconnected",offlineRoot);err!=nil{t.Fatal(err)}
 if err:=a.scan(1);err!=nil{t.Fatal(err)}
 if err:=a.db.QueryRow("SELECT available FROM assets WHERE id=?",oldAsset).Scan(&available);err!=nil||available!=1{
  t.Fatalf("remounted file not restored at original identity: %d %v",available,err)
 }
 if err:=a.db.QueryRow("SELECT count(*) FROM profile_progress WHERE profile_id=0 AND edition_id=? AND seconds=511",oldEdition).Scan(&count);err!=nil||count!=1{
  t.Fatalf("resume disappeared on reconnect: %d %v",count,err)
 }
 if err:=a.db.QueryRow("SELECT count(*) FROM works").Scan(&count);err!=nil||count!=2{
  t.Fatalf("rescan spawned duplicate works after NAS reconnect: %d %v",count,err)
 }
}
