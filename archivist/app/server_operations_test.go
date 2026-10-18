package main

import (
 "encoding/json"
 "net/http"
 "net/http/httptest"
 "os"
 "strings"
 "testing"
)

func operationsCall(a *app,method,path string,owner,action bool)*httptest.ResponseRecorder{
 req:=httptest.NewRequest(method,path,nil)
 if owner{req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})}
 if action{req.Header.Set("X-Archivist-Action","1")}
 rec:=httptest.NewRecorder()
 a.routes().ServeHTTP(rec,req)
 return rec
}
func TestOperationsOverviewReportsOnlyIndexedStateAndLocalBackupFlags(t *testing.T){
 a:=fixture(t)
 if _,err:=a.db.Exec("INSERT INTO sources(id,space,path,status,watched) VALUES(1,'Books','/offline/synthetic','Storage offline',1)");err!=nil{t.Fatal(err)}
 for _,item:=range []struct{id int;available,review int}{
  {1,1,0},{2,0,1},
 }{
  if _,err:=a.db.Exec("INSERT INTO assets(id,source_id,relative_path,title,format,available,needs_review) VALUES(?,1,?,'Work','Ebook',?,?)",
   item.id,"book"+string(rune('a'+item.id))+".epub",item.available,item.review);err!=nil{t.Fatal(err)}
 }
 if _,err:=a.db.Exec("INSERT INTO works(id,title,space,author) VALUES(1,'One','Books','A'),(2,'Two','Books','B')");err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("INSERT INTO editions(id,work_id,format) VALUES(1,1,'Ebook'),(2,2,'Ebook')");err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(1,1,0),(2,2,0)");err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("INSERT INTO work_publication(work_id,state,revision,published_at) VALUES(1,'published',1,0)");err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("CREATE TABLE IF NOT EXISTS jobs(state TEXT NOT NULL, source_id INTEGER NOT NULL)");err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("INSERT INTO jobs(state,source_id) VALUES('queued',1),('running',1),('failed',1)");err!=nil{t.Fatal(err)}
 for _,suffix:=range []string{".restore.pending",".before-restore"}{
  if err:=os.WriteFile(a.dbPath+suffix,[]byte("synthetic marker only"),0600);err!=nil{t.Fatal(err)}
 }
 if anonymous:=operationsCall(a,"GET","/api/manage/operations",false,false);anonymous.Code!=401{
  t.Fatalf("anonymous health disclosed %d",anonymous.Code)
 }
 response:=operationsCall(a,"GET","/api/manage/operations",true,false)
 if response.Code!=200{t.Fatalf("operation health request: %d %s",response.Code,response.Body.String())}
 var got operationsOverview
 if err:=json.Unmarshal(response.Body.Bytes(),&got);err!=nil{t.Fatal(err)}
 if got.IndexedSources!=1||got.WatchedSources!=1||got.IndexedFiles!=2||
  got.IndexedWorks!=2||got.PublishedWorks!=2||got.StagedWorks!=0||
  got.ReviewFiles!=1||got.UnavailableFileFlags!=1||got.Jobs.Running!=1||
  got.Jobs.Failed!=1||got.Jobs.Queued!=1||!got.Backup.StagedRestore||
  !got.Backup.RecoverySnapshot||got.Backup.RestoreInFlight||
  got.Backup.DatabaseBytes==0||!got.Backup.DatabasePresent||!got.Backup.LocalOnly{
  t.Fatalf("operations metrics mismatch: %+v",got)
 }
 if len(got.Caveats)<3{t.Fatalf("false assurances instead of caveats: %+v",got.Caveats)}
 if strings.Contains(response.Body.String(),"/offline/synthetic"){
  t.Fatal("an operations summary leaked actual source path")
 }
}
func TestOperationsOverviewHandlesMissingJobsAndUnknownBackupState(t *testing.T){
 a:=fixture(t)
 result:=operationsCall(a,"GET","/api/manage/operations",true,false)
 if result.Code!=200{t.Fatalf("initial setup diagnostics %d %s",result.Code,result.Body.String())}
 var got operationsOverview
 if err:=json.Unmarshal(result.Body.Bytes(),&got);err!=nil{t.Fatal(err)}
 if got.Jobs!=(operationsJobs{})||len(got.Caveats)<3{
  t.Fatalf("missing jobs table must not imply a checked scanner: %+v",got)
 }
}
func TestOperationsIntegrityCheckRequiresExplicitOwnerAction(t *testing.T){
 a:=fixture(t)
 for _,test:=range []struct{method string;owner,action bool;expected int}{
  {"POST",false,true,401},{"POST",true,false,403},{"POST",true,true,200},
 }{
  response:=operationsCall(a,test.method,"/api/manage/operations/integrity",test.owner,test.action)
  if response.Code!=test.expected{
   t.Fatalf("integrity %v: HTTP %d: %s",test,response.Code,response.Body.String())
  }
  if response.Code==200{
   var output operationsIntegrityResult
   if err:=json.Unmarshal(response.Body.Bytes(),&output);err!=nil{t.Fatal(err)}
   if output.Result!="ok"||output.PerformedAt<=0||
    !strings.Contains(output.Scope,"no media")||output.DurationMillis<0{
    t.Fatalf("invalid SQLite verification disclosure: %+v",output)
   }
  }
 }
 // No persistent integrity score, scan or automatic repair is written.
 var count int
 if err:=a.db.QueryRow("SELECT count(*) FROM works").Scan(&count);err!=nil||count!=0{
  t.Fatalf("check wrote to the catalogue: %d %v",count,err)
 }
}

func TestOperationsIntegrityCheckRejectsConcurrentCostlyRequests(t *testing.T){
 a:=fixture(t)
 operationsIntegrityMu.Lock()
 defer operationsIntegrityMu.Unlock()
 response:=operationsCall(a,"POST","/api/manage/operations/integrity",true,true)
 if response.Code!=http.StatusConflict{
  t.Fatalf("parallel expensive check was accepted: %d %s",response.Code,response.Body.String())
 }
}
