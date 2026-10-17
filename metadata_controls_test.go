package main

import (
  "encoding/json"
  "net/http"
  "net/http/httptest"
  "os"
  "path/filepath"
  "strconv"
  "strings"
  "testing"
)

type fieldStateResponse struct {
  AssetID int64 `json:"assetId"`
  Revision int64 `json:"revision"`
  Fields []metadataFieldDetail `json:"fields"`
}
func TestMetadataFieldProvenanceLocksVersionAndRestart(t *testing.T){
  a:=fixture(t)
  root:=t.TempDir()
  if err:=os.WriteFile(filepath.Join(root,"Book.epub"),[]byte("synthetic book"),0600);err!=nil{t.Fatal(err)}
  if err:=a.addSource("Books",root);err!=nil{t.Fatal(err)}
  if err:=a.scan(1);err!=nil{t.Fatal(err)}
  var asset int64
  if err:=a.db.QueryRow("SELECT id FROM assets LIMIT 1").Scan(&asset);err!=nil{t.Fatal(err)}
  id:=strconv.FormatInt(asset,10)
  call:=func(method,url,body,key string,header bool)*httptest.ResponseRecorder{
    req:=httptest.NewRequest(method,url,strings.NewReader(body))
    if key!=""{req.AddCookie(&http.Cookie{Name:"archivist_session",Value:key})}
    if header{req.Header.Set("X-Archivist-Action","1")}
    res:=httptest.NewRecorder()
    a.routes().ServeHTTP(res,req)
    return res
  }
  route:="/api/manage/assets/"+id+"/fields"
  read:=func()fieldStateResponse{
    res:=call("GET",route,"","test-key",false)
    if res.Code!=200{t.Fatalf("GET fields=%d %s",res.Code,res.Body.String())}
    var state fieldStateResponse
    if err:=json.Unmarshal(res.Body.Bytes(),&state);err!=nil{t.Fatal(err)}
    if state.AssetID!=asset||len(state.Fields)!=len(managedMetadataFields){t.Fatalf("field schema: %+v",state)}
    return state
  }
  field:=func(state fieldStateResponse,name string)metadataFieldDetail{
    for _,f:=range state.Fields{if f.Name==name{return f}}
    t.Fatalf("missing field %s",name);return metadataFieldDetail{}
  }
  start:=read()
  if start.Revision!=0||field(start,"author").Locked{t.Fatalf("initial controls: %+v",start)}
  if code:=call("GET",route,"","",false).Code;code!=401{t.Fatalf("anonymous field detail=%d",code)}
  if _,err:=a.db.Exec("INSERT INTO profiles(name,key_hash) VALUES('Reader',?)",keyHash("reader"));err!=nil{t.Fatal(err)}
  member,err:=a.newSession("reader");if err!=nil{t.Fatal(err)}
  if code:=call("GET",route,"",member,false).Code;code!=403{t.Fatalf("member sees owner controls=%d",code)}
  if code:=call("PUT",route+"/author",`{"locked":true,"expectedRevision":0}`,"test-key",false).Code;code!=403{t.Fatalf("CSRF missing=%d",code)}
  if code:=call("PUT",route+"/author",`{"locked":true,"expectedRevision":0}`,member,true).Code;code!=403{t.Fatalf("member can lock fields=%d",code)}
  for _,bad:=range []string{
    `{}`, `{"locked":true}`, `{"locked":null,"expectedRevision":0}`,
    `{"locked":true,"expectedRevision":-1}`,`{"locked":true,"expectedRevision":0,"ignored":"field"}`,
    `{"locked":true,"expectedRevision":0} {"locked":false}`,
  }{
    if res:=call("PUT",route+"/author",bad,"test-key",true);res.Code!=400{
      t.Fatalf("invalid lock body accepted: %q -> %d %s",bad,res.Code,res.Body.String())
    }
  }
  if res:=call("PUT",route+"/author%3BDROP%20TABLE%20assets",`{"locked":true,"expectedRevision":0}`,"test-key",true);res.Code!=400{
    t.Fatalf("field path injection accepted: %d",res.Code)
  }
  first:=call("PATCH","/api/assets/"+id+"/metadata",`{"title":"Verified title","author":"Verified author","genre":"Science Fiction","expectedRevision":0}`,"test-key",true)
  if first.Code!=200{t.Fatalf("initial save=%d %s",first.Code,first.Body.String())}
  state:=read()
  if state.Revision!=1||field(state,"author").Source!="manual"||field(state,"genre").Source!="manual"||field(state,"author").Value!="Verified author"{
    t.Fatalf("initial field-level attribution: %+v",state)
  }
  lock:=call("PUT",route+"/author",`{"locked":true,"expectedRevision":1}`,"test-key",true)
  if lock.Code!=200{t.Fatalf("lock field: %d %s",lock.Code,lock.Body.String())}
  if state=read();state.Revision!=2||!field(state,"author").Locked{t.Fatalf("lock did not persist: %+v",state)}
  if res:=call("PUT",route+"/author",`{"locked":false,"expectedRevision":1}`,"test-key",true);res.Code!=409{
    t.Fatalf("stale unlock accepted: %d",res.Code)
  }
  if res:=call("PATCH","/api/assets/"+id+"/metadata",`{"author":"Wrong author","expectedRevision":2}`,"test-key",true);res.Code!=409{
    t.Fatalf("locked field PATCH allowed: %d %s",res.Code,res.Body.String())
  }
  // Old mobile/API callers omit expectedRevision but cannot bypass locks.
  if res:=call("PATCH","/api/assets/"+id+"/metadata",`{"author":"Old-client overwrite"}`,"test-key",true);res.Code!=409{
    t.Fatalf("legacy caller bypassed lock: %d",res.Code)
  }
  if res:=call("PATCH","/api/assets/"+id+"/metadata",`{"genre":"Historical Fiction","expectedRevision":1}`,"test-key",true);res.Code!=409{
    t.Fatalf("stale metadata PATCH succeeded: %d",res.Code)
  }
  if res:=call("PATCH","/api/assets/"+id+"/metadata",`{"genre":"Historical Fiction","expectedRevision":2}`,"test-key",true);res.Code!=200{
    t.Fatalf("unlocked different field blocked: %d %s",res.Code,res.Body.String())
  }
  state=read()
  if state.Revision!=3||field(state,"author").Value!="Verified author"||field(state,"genre").Value!="Historical Fiction"{
    t.Fatalf("locked field was corrupted or genre absent: %+v",state)
  }
  // A changed source fingerprint causes scan extraction. Manual edits AND the
  // explicit per-field lock remain durable without changing mobile scanners.
  if err:=os.WriteFile(filepath.Join(root,"Book.epub"),[]byte("synthetic replacement with different size"),0600);err!=nil{t.Fatal(err)}
  if err:=a.scan(1);err!=nil{t.Fatal(err)}
  state=read()
  if state.Revision!=3||!field(state,"author").Locked||field(state,"author").Value!="Verified author"||field(state,"genre").Value!="Historical Fiction"{
    t.Fatalf("rescan lost manual correction or lock: %+v",state)
  }
  if res:=call("PUT",route+"/author",`{"locked":false,"expectedRevision":3}`,"test-key",true);res.Code!=200{
    t.Fatalf("unlock rejected: %d %s",res.Code,res.Body.String())
  }
  if res:=call("PATCH","/api/assets/"+id+"/metadata",`{"author":"Final author","expectedRevision":4}`,"test-key",true);res.Code!=200{
    t.Fatalf("unlocked correction failed: %d %s",res.Code,res.Body.String())
  }
  state=read()
  if state.Revision!=5||field(state,"author").Locked||field(state,"author").Value!="Final author"{
    t.Fatalf("unlock/edit not persisted: %+v",state)
  }
  var auditRows int
  if err:=a.db.QueryRow("SELECT count(*) FROM asset_metadata_audit WHERE asset_id=?",asset).Scan(&auditRows);err!=nil||auditRows!=7{
    t.Fatalf("wrong audit count=%d err=%v",auditRows,err)
  }
  reopened,err:=openDB(a.dbPath);if err!=nil{t.Fatal(err)}
  defer reopened.Close()
  persisted:=&app{db:reopened,dbPath:a.dbPath}
  if err=persisted.initCatalogue();err!=nil{t.Fatal(err)}
  restored,err:=persisted.metadataControlState(asset)
  if err!=nil{t.Fatal(err)}
  if restored.Revision!=5||field(fieldStateResponse(restored),"author").Value!="Final author"||field(fieldStateResponse(restored),"genre").Source!="manual"{
    t.Fatalf("restart lost field metadata: %+v",restored)
  }
}
func TestMetadataFieldControlsRollBackAtomically(t *testing.T){
  a:=fixture(t)
  root:=t.TempDir()
  if err:=os.WriteFile(filepath.Join(root,"Book.epub"),[]byte("test"),0600);err!=nil{t.Fatal(err)}
  if err:=a.addSource("Main",root);err!=nil{t.Fatal(err)}
  if err:=a.scan(1);err!=nil{t.Fatal(err)}
  // Force a database write failure after control/audit upserts. The transaction
  // must not leak a changed field, revision or audit record.
  if _,err:=a.db.Exec(`CREATE TRIGGER fail_bad_genre AFTER UPDATE OF genre ON assets
    WHEN NEW.genre='Invalid' BEGIN SELECT RAISE(ABORT,'synthetic storage failure');END`);err!=nil{t.Fatal(err)}
  res:=httptest.NewRecorder()
  req:=httptest.NewRequest("PATCH","/api/assets/1/metadata",strings.NewReader(`{"genre":"Invalid","expectedRevision":0}`))
  req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
  req.Header.Set("X-Archivist-Action","1")
  a.routes().ServeHTTP(res,req)
  if res.Code!=500{t.Fatalf("synthetic backend failure returned %d %s",res.Code,res.Body.String())}
  controls,err:=a.metadataControlState(1)
  if err!=nil{t.Fatal(err)}
  if controls.Revision!=0{t.Fatalf("failed transaction advanced revision: %+v",controls)}
  var n int
  if err:=a.db.QueryRow("SELECT count(*) FROM asset_metadata_audit").Scan(&n);err!=nil||n!=0{
    t.Fatalf("failed transaction left audit rows: %d %v",n,err)
  }
  var genre string
  if err:=a.db.QueryRow("SELECT genre FROM assets WHERE id=1").Scan(&genre);err!=nil||genre=="Invalid"{
    t.Fatalf("failed transaction changed asset: %q %v",genre,err)
  }
}
