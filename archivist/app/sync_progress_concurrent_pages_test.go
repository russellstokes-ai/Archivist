package main

// Deliberately expected RED against the current LIMIT/OFFSET implementation.
// This is a quarantined contract test for Astra's consistent-snapshot work.
// Never merge this draft before the backend can prove no silent omission.
import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "os"
    "path/filepath"
    "testing"
)

func TestSyncProgressConcurrentPageMutationCannotSilentlyLoseEntry(t *testing.T) {
    a:=fixture(t)
    for _,init:=range []func()error{a.initProgress,a.initListening,a.initReader}{
        if err:=init();err!=nil{t.Fatal(err)}
    }
    media:=t.TempDir()
    names:=[]string{"Page_A.m4b","Page_B.m4b","Page_C.m4b"}
    for _,name:=range names {
        if err:=os.WriteFile(filepath.Join(media,name),[]byte("test-bytes"),0600);err!=nil{t.Fatal(err)}
    }
    if err:=a.addSource("Open",media);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec("INSERT INTO profiles(id,name,key_hash) VALUES(1,'Reader',?)",keyHash("paging-red-test"));err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec("INSERT INTO grants(profile_id,space) VALUES(1,'Open')");err!=nil{t.Fatal(err)}

    ids:=make([]int64,0,3)
    for _,name:=range names {
        var id int64
        if err:=a.db.QueryRow("SELECT id FROM assets WHERE relative_path=?",name).Scan(&id);err!=nil{t.Fatal(err)}
        ids=append(ids,id)
        if _,err:=a.db.Exec(
            "INSERT INTO asset_progress(profile_id,asset_id,seconds,revision,complete) VALUES(?,?,?,?,?)",
            1,id,12.0,1,false);err!=nil{t.Fatal(err)}
    }
    session,err:=a.newSession("paging-red-test")
    if err!=nil{t.Fatal(err)}
    type page struct {
        Items []syncProgressEntry `json:"items"`
        HasMore bool `json:"hasMore"`
        NextOffset int `json:"nextOffset"`
        Snapshot string `json:"snapshot"`
    }
    request:=func(url string)(int,page){
        t.Helper()
        req:=httptest.NewRequest(http.MethodGet,url,nil)
        req.AddCookie(&http.Cookie{Name:"archivist_session",Value:session})
        recorder:=httptest.NewRecorder()
        a.routes().ServeHTTP(recorder,req)
        var body page
        if recorder.Code==200{
            if err:=json.Unmarshal(recorder.Body.Bytes(),&body);err!=nil{t.Fatal(err)}
        }
        return recorder.Code,body
    }
    status,first:=request("/api/sync/progress?limit=2")
    if status!=200||len(first.Items)!=2||!first.HasMore{
        t.Fatalf("first progress page invalid: HTTP %d %+v",status,first)
    }

    // A second device (or a revocation) can alter the authorised set before
    // the next HTTP page. OFFSET advances beyond the missing earlier row.
    if _,err:=a.db.Exec("DELETE FROM asset_progress WHERE profile_id=1 AND asset_id=?",ids[0]);err!=nil{t.Fatal(err)}
    if len(first.Snapshot)!=48{t.Fatalf("first page lacks snapshot token: %+v",first)}
    status,last:=request("/api/sync/progress?limit=2&offset=2&snapshot="+first.Snapshot)
    if status==409{return} // An invalidated snapshot is safely retried.
    if status!=200{t.Fatalf("unexpected page status %d",status)}
    for _,item:=range last.Items {
        if item.Kind=="listening"&&item.ID==ids[2]{return}
    }
    t.Fatalf("SILENT OMISSION: pagination returned HTTP 200 but lost untouched asset %d after concurrent change; first=%+v last=%+v",ids[2],first,last)
}
