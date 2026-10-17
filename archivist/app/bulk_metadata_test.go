package main

import (
  "encoding/json"
  "net/http/httptest"
  "os"
  "path/filepath"
  "strconv"
  "strings"
  "testing"
)

type bulkPreviewOutput struct {
  Items []bulkItem `json:"items"`
  Changes bulkMetadataFields `json:"changes"`
  Receipt string `json:"receipt"`
  Ready int `json:"ready"`
  Blocked int `json:"blocked"`
}
func TestBulkMetadataPreviewApplyAndIsolation(t *testing.T){
  a:=fixture(t)
  root:=t.TempDir()
  for _,name:=range []string{"First.epub","Second.epub","Unreviewed.epub"}{
    if err:=os.WriteFile(filepath.Join(root,name),[]byte("synthetic"),0600);err!=nil{t.Fatal(err)}
  }
  if err:=a.addSource("Books",root);err!=nil{t.Fatal(err)}
  if err:=a.scan(1);err!=nil{t.Fatal(err)}
  var ids []int64
  rows,err:=a.db.Query("SELECT id FROM assets ORDER BY relative_path")
  if err!=nil{t.Fatal(err)}
  for rows.Next(){var id int64;if err=rows.Scan(&id);err!=nil{rows.Close();t.Fatal(err)};ids=append(ids,id)}
  rows.Close()
  if len(ids)!=3{t.Fatalf("fixture IDs=%v",ids)}
  call:=func(method,path,body,key string,marker bool)*httptest.ResponseRecorder{
    return publicationCall(t,a,method,path,body,key,marker)
  }
  for _,id:=range ids[:2]{
    res:=call("PATCH","/api/assets/"+strconv.FormatInt(id,10)+"/metadata",`{"author":"Verified Writer"}`,"test-key",true)
    if res.Code!=200{t.Fatalf("review file %d: %d %s",id,res.Code,res.Body.String())}
  }
  previewURL:="/api/manage/bulk-metadata/preview"
  applyURL:="/api/manage/bulk-metadata/apply"
  payload:=func(selected []int64,stringPatch string)string{
    raw,_:=json.Marshal(struct{IDs []int64 `json:"ids"`;Changes json.RawMessage `json:"changes"`}{selected,json.RawMessage(stringPatch)})
    return string(raw)
  }
  changes:=`{"publisher":"Archive Press","isbn":"9780300000001"}`
  if got:=call("POST",previewURL,payload(ids[:2],changes),"",true);got.Code!=401{t.Fatalf("anonymous preview allowed: %d",got.Code)}
  if got:=call("POST",previewURL,payload(ids[:2],changes),"test-key",false);got.Code!=403{t.Fatalf("CSRF preview allowed: %d",got.Code)}
  if _,err:=a.db.Exec("INSERT INTO profiles(name,key_hash) VALUES('Reader',?)",keyHash("reader"));err!=nil{t.Fatal(err)}
  member,err:=a.newSession("reader");if err!=nil{t.Fatal(err)}
  if got:=call("POST",previewURL,payload(ids[:2],changes),member,true);got.Code!=403{t.Fatalf("member preview allowed: %d",got.Code)}
  for _,raw:=range []string{
    payload([]int64{ids[0],ids[0]},changes),
    payload(ids[:2],`{"title":"Cannot mass rename works"}`),
    payload(ids[:2],`{"narrator":"X","publisher":"Y","isbn":"A","asin":"B","language":"en"}`),
    payload(ids[:2],`{"publishedYear":3023}`),
    payload(nil,changes),
  }{
    if got:=call("POST",previewURL,raw,"test-key",true);got.Code!=400{
      t.Fatalf("invalid preview accepted: %d %s",got.Code,got.Body.String())
    }
  }
  if got:=call("POST",previewURL,payload(ids,changes),"test-key",true);got.Code!=200||!strings.Contains(got.Body.String(),`"blocked":1`){
    t.Fatalf("unreviewed file not blocked: %d %s",got.Code,got.Body.String())
  }
  fetchPreview:=func()bulkPreviewOutput{
    t.Helper()
    result:=call("POST",previewURL,payload(ids[:2],changes),"test-key",true)
    if result.Code!=200{t.Fatalf("preview=%d %s",result.Code,result.Body.String())}
    var out bulkPreviewOutput
    if err:=json.Unmarshal(result.Body.Bytes(),&out);err!=nil{t.Fatal(err)}
    return out
  }
  plan:=fetchPreview()
  if plan.Ready!=2||plan.Blocked!=0||len(plan.Receipt)!=64||len(plan.Items)!=2||len(plan.Items[0].Diff)!=2{
    t.Fatalf("preview not ready: %+v",plan)
  }
  applyBody:=func(plan bulkPreviewOutput,confirm bool)string{
    v,_:=json.Marshal(bulkApplyRequest{Items:plan.Items,Changes:plan.Changes,Receipt:plan.Receipt,Confirm:confirm})
    return string(v)
  }
  if got:=call("POST",applyURL,applyBody(plan,false),"test-key",true);got.Code!=400{t.Fatalf("apply without confirmation=%d",got.Code)}
  if got:=call("POST",applyURL,applyBody(plan,true),member,true);got.Code!=403{t.Fatalf("member applied bulk metadata=%d",got.Code)}
  tampered:=plan
  tampered.Items=append([]bulkItem(nil),plan.Items...)
  tampered.Items[0].Diff=nil
  if got:=call("POST",applyURL,applyBody(tampered,true),"test-key",true);got.Code!=409{t.Fatalf("altered preview receipt accepted=%d",got.Code)}
  if got:=call("PATCH","/api/assets/"+strconv.FormatInt(ids[0],10)+"/metadata",`{"publisher":"Concurrent manual edit"}`,"test-key",true);got.Code!=200{t.Fatalf("concurrent revision: %d %s",got.Code,got.Body.String())}
  if got:=call("POST",applyURL,applyBody(plan,true),"test-key",true);got.Code!=409{
    t.Fatalf("stale bulk edit accepted=%d %s",got.Code,got.Body.String())
  }
  var unchanged string
  if err:=a.db.QueryRow("SELECT publisher FROM assets WHERE id=?",ids[1]).Scan(&unchanged);err!=nil||unchanged=="Archive Press"{
    t.Fatalf("failed preview partially applied: %q %v",unchanged,err)
  }
  // Locking only one target blocks the entire batch.
  lock:=call("PUT","/api/manage/assets/"+strconv.FormatInt(ids[0],10)+"/fields/publisher",
    `{"locked":true,"expectedRevision":2}`,"test-key",true)
  if lock.Code!=200{t.Fatalf("lock after correction: %d %s",lock.Code,lock.Body.String())}
  blocked:=fetchPreview()
  if blocked.Blocked!=1||blocked.Receipt!=""||blocked.Ready!=1{t.Fatalf("locked plan was executable: %+v",blocked)}
  unlock:=call("PUT","/api/manage/assets/"+strconv.FormatInt(ids[0],10)+"/fields/publisher",
    `{"locked":false,"expectedRevision":3}`,"test-key",true)
  if unlock.Code!=200{t.Fatalf("unlock field failed: %d %s",unlock.Code,unlock.Body.String())}
  plan=fetchPreview()
  if plan.Blocked!=0||plan.Ready!=2{t.Fatalf("fresh preview not ready: %+v",plan)}
  result:=call("POST",applyURL,applyBody(plan,true),"test-key",true)
  if result.Code!=200||!strings.Contains(result.Body.String(),`"updated":2`){
    t.Fatalf("apply rejected: %d %s",result.Code,result.Body.String())
  }
  if got:=call("POST",applyURL,applyBody(plan,true),"test-key",true);got.Code!=409{
    t.Fatalf("replayed bulk plan accepted=%d",got.Code)
  }
  for _,id:=range ids[:2]{
    var pub,isbn,author,source string
    var needsReview bool
    if err:=a.db.QueryRow("SELECT publisher,isbn,author,metadata_source,needs_review FROM assets WHERE id=?",id).Scan(&pub,&isbn,&author,&source,&needsReview);err!=nil{t.Fatal(err)}
    if pub!="Archive Press"||isbn!="9780300000001"||author!="Verified Writer"||source!="manual"||needsReview{
      t.Fatalf("bulk mutated identity/review: %d %q %q %q %q %v",id,pub,isbn,author,source,needsReview)
    }
    state,err:=a.metadataControlState(id)
    if err!=nil{t.Fatal(err)}
    sources:=map[string]string{}
    for _,field:=range state.Fields{sources[field.Name]=field.Source}
    if sources["publisher"]!="manual"||sources["isbn"]!="manual"{t.Fatalf("bulk field provenance lost: %+v",state)}
  }
  var raw string
  if err:=a.db.QueryRow("SELECT metadata_source FROM assets WHERE id=?",ids[2]).Scan(&raw);err!=nil{t.Fatal(err)}
  if raw=="manual"{t.Fatal("unreviewed unrelated book was modified")}
  // Database survives reopen and does not need a rescan after Apply.
  reopened,err:=openDB(a.dbPath);if err!=nil{t.Fatal(err)}
  defer reopened.Close()
  var saved string
  if err:=reopened.QueryRow("SELECT publisher FROM assets WHERE id=?",ids[1]).Scan(&saved);err!=nil||saved!="Archive Press"{
    t.Fatalf("bulk edit not durable: %q %v",saved,err)
  }
}

func TestBulkMetadataApplyIsAllOrNothingOnSQLiteFailure(t *testing.T){
  a:=fixture(t)
  root:=t.TempDir()
  for _,name:=range []string{"A.epub","B.epub"}{
    if err:=os.WriteFile(filepath.Join(root,name),[]byte("synthetic"),0600);err!=nil{t.Fatal(err)}
  }
  if err:=a.addSource("Books",root);err!=nil{t.Fatal(err)}
  if err:=a.scan(1);err!=nil{t.Fatal(err)}
  for i:=1;i<=2;i++{
    if res:=publicationCall(t,a,"PATCH","/api/assets/"+strconv.Itoa(i)+"/metadata",`{"author":"Known"}`,"test-key",true);res.Code!=200{
      t.Fatalf("review %d failed: %d %s",i,res.Code,res.Body.String())
    }
  }
  preview:=publicationCall(t,a,"POST","/api/manage/bulk-metadata/preview",
    `{"ids":[1,2],"changes":{"publisher":"Fault"}}`,"test-key",true)
  if preview.Code!=200{t.Fatalf("preview failed %d %s",preview.Code,preview.Body.String())}
  var plan bulkPreviewOutput
  if err:=json.Unmarshal(preview.Body.Bytes(),&plan);err!=nil{t.Fatal(err)}
  if _,err:=a.db.Exec(`CREATE TRIGGER fail_second_bulk AFTER UPDATE OF publisher ON assets
    WHEN NEW.id=2 AND NEW.publisher='Fault'
    BEGIN SELECT RAISE(ABORT,'synthetic IO failure');END`);err!=nil{t.Fatal(err)}
  payload,_:=json.Marshal(bulkApplyRequest{Items:plan.Items,Changes:plan.Changes,Receipt:plan.Receipt,Confirm:true})
  res:=publicationCall(t,a,"POST","/api/manage/bulk-metadata/apply",string(payload),"test-key",true)
  if res.Code!=500{t.Fatalf("failed backend update not surfaced: %d %s",res.Code,res.Body.String())}
  for i:=1;i<=2;i++{
    var publisher string
    var revision int64
    if err:=a.db.QueryRow("SELECT publisher FROM assets WHERE id=?",i).Scan(&publisher);err!=nil{t.Fatal(err)}
    if err:=a.db.QueryRow("SELECT revision FROM asset_metadata_revisions WHERE asset_id=?",i).Scan(&revision);err!=nil{t.Fatal(err)}
    if publisher=="Fault"||revision!=1{t.Fatalf("partial batch persisted: id=%d publisher=%q revision=%d",i,publisher,revision)}
  }
}
