package main

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "os"
    "path/filepath"
    "strings"
    "testing"
)

func TestProgressSnapshotPrivatePagedAndReadOnly(t *testing.T) {
    a:=fixture(t)
    for _,init:=range []func()error{a.initProgress,a.initListening,a.initReader}{
        if err:=init();err!=nil{t.Fatal(err)}
    }
    openDir,privateDir:=t.TempDir(),t.TempDir()
    for _,entry:=range []struct{dir,name string}{
        {openDir,"A.epub"},{openDir,"B.m4b"},{privateDir,"Secret.m4b"},
    }{
        if err:=os.WriteFile(filepath.Join(entry.dir,entry.name),[]byte("synthetic"),0600);err!=nil{t.Fatal(err)}
    }
    if err:=a.addSource("Open",openDir);err!=nil{t.Fatal(err)}
    if err:=a.addSource("Private",privateDir);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    if err:=a.scan(2);err!=nil{t.Fatal(err)}
    asset:=func(name string)int64{
        t.Helper()
        var id int64
        if err:=a.db.QueryRow("SELECT id FROM assets WHERE relative_path=?",name).Scan(&id);err!=nil{t.Fatal(err)}
        return id
    }
    epub,audio,secret:=asset("A.epub"),asset("B.m4b"),asset("Secret.m4b")
    var edition int64
    if err:=a.db.QueryRow("SELECT edition_id FROM edition_assets WHERE asset_id=?",audio).Scan(&edition);err!=nil{t.Fatal(err)}
    for _,stmt:=range []struct{query string; args []any}{
        {"INSERT INTO profiles(id,name,key_hash) VALUES(1,'Alice',?), (2,'Bob',?)",[]any{keyHash("alice-test-key"),keyHash("bob-test-key")}},
        {"INSERT INTO grants(profile_id,space) VALUES(1,'Open'),(2,'Private')",nil},
        {"INSERT INTO profile_progress(profile_id,edition_id,asset_id,seconds,revision,complete) VALUES(?,?,?,?,?,?)",[]any{int64(1),edition,audio,60.0,4,false}},
        {"INSERT INTO asset_progress(profile_id,asset_id,seconds,revision,complete) VALUES(?,?,?,?,?)",[]any{int64(1),audio,15.0,3,true}},
        {"INSERT INTO reading_progress(profile_id,asset_id,part,fraction,revision,complete) VALUES(?,?,?,?,?,?)",[]any{int64(1),epub,6,0.3,2,false}},
        // A row belonging to Alice but outside her permitted library must not leak.
        {"INSERT INTO asset_progress(profile_id,asset_id,seconds,revision,complete) VALUES(?,?,?,?,?)",[]any{int64(1),secret,20.0,9,false}},
        {"INSERT INTO asset_progress(profile_id,asset_id,seconds,revision,complete) VALUES(?,?,?,?,?)",[]any{int64(2),secret,41.0,10,true}},
    }{
        if _,err:=a.db.Exec(stmt.query,stmt.args...);err!=nil{t.Fatal(err)}
    }
    alice,err:=a.newSession("alice-test-key")
    if err!=nil{t.Fatal(err)}
    bob,err:=a.newSession("bob-test-key")
    if err!=nil{t.Fatal(err)}
    handler:=a.routes()
    type response struct{
        Items []syncProgressEntry `json:"items"`
        HasMore bool `json:"hasMore"`
        NextOffset int `json:"nextOffset"`
        Snapshot string `json:"snapshot"`
    }
    call:=func(token,path,method string)(int,response){
        t.Helper()
        req:=httptest.NewRequest(method,path,nil)
        if token!="" {req.AddCookie(&http.Cookie{Name:"archivist_session",Value:token})}
        res:=httptest.NewRecorder();handler.ServeHTTP(res,req)
        var data response
        if res.Code==200 {if err:=json.Unmarshal(res.Body.Bytes(),&data);err!=nil{t.Fatal(err)}}
        return res.Code,data
    }
    if code,_:=call("","/api/sync/progress","GET");code!=401{
        t.Fatalf("unauthenticated snapshot returned %d",code)
    }
    if code,_:=call(alice,"/api/sync/progress","POST");code!=403{
        t.Fatalf("snapshot unexpectedly allowed writes: %d",code)
    }
    for _,query:=range []string{"?limit=0","?limit=201","?limit=nope","?offset=-1","?offset=1000001"}{
        if code,_:=call(alice,"/api/sync/progress"+query,"GET");code!=400{
            t.Fatalf("invalid query %s accepted: %d",query,code)
        }
    }
    code,page:=call(alice,"/api/sync/progress?limit=2","GET")
    if code!=200||len(page.Items)!=2||!page.HasMore||page.NextOffset!=2{
        t.Fatalf("first page: %d %+v",code,page)
    }
    if len(page.Snapshot)!=48 {t.Fatalf("first page lacks immutable token: %+v",page)}
    if invalid,_:=call(alice,"/api/sync/progress?limit=2&offset=2","GET");invalid!=409 {
        t.Fatalf("unsafe legacy OFFSET without snapshot token accepted: %d",invalid)
    }
    code,last:=call(alice,"/api/sync/progress?limit=2&offset=2&snapshot="+page.Snapshot,"GET")
    if code!=200||len(last.Items)!=1||last.HasMore||last.NextOffset!=3{
        t.Fatalf("last page: %d %+v",code,last)
    }
    all:=append(page.Items,last.Items...)
    kinds:=map[string]bool{}
    for _,item:=range all{
        kinds[item.Kind]=true
        if item.Asset==secret || item.ID==secret && item.Kind!="edition"{
            t.Fatalf("private asset leaked to Alice: %+v",item)
        }
    }
    if !kinds["edition"]||!kinds["listening"]||!kinds["reading"]{t.Fatalf("missing progress types: %+v",all)}
    if code,owner:=call("test-key","/api/sync/progress","GET");code!=200||len(owner.Items)!=0{
        t.Fatalf("owner must not inherit household progress rows: %d %+v",code,owner)
    }
    if code,other:=call(bob,"/api/sync/progress","GET");code!=200||len(other.Items)!=1||other.Items[0].Asset!=secret||other.Items[0].Revision!=10{
        t.Fatalf("other profile leaked or missed progress: %d %+v",code,other)
    }
    // Revision and position rows must not change during reconciliation reads.
    code,again:=call(alice,"/api/sync/progress","GET")
    if code!=200||len(again.Items)!=3{t.Fatalf("repeat snapshot changed: %d %+v",code,again)}
    for _,item:=range again.Items{
        if item.Revision<2 || item.Kind=="reading" && item.Part!=6 ||
           item.Kind=="listening" && item.Seconds!=15{
            t.Fatalf("snapshot lost latest stored position: %+v",item)
        }
    }
}

func TestSyncSnapshotRejectsMalformattedQueryNotFound(t *testing.T) {
    a:=fixture(t)
    for _,init:=range []func()error{a.initProgress,a.initListening,a.initReader}{
        if err:=init();err!=nil{t.Fatal(err)}
    }
    req:=httptest.NewRequest(http.MethodGet,"/api/sync/progress?offset=abc",nil)
    req.Header.Set("Authorization","Bearer test-key")
    res:=httptest.NewRecorder();a.routes().ServeHTTP(res,req)
    if res.Code!=400||!strings.Contains(res.Body.String(),"invalid progress offset"){
        t.Fatalf("invalid pagination not rejected: %d %s",res.Code,res.Body.String())
    }
}
