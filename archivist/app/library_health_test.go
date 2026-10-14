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

func TestLibraryHealthRetainsOfflineNASCatalogue(t *testing.T) {
    a := fixture(t)
    root := filepath.Join(t.TempDir(), "network-books")
    if err := os.Mkdir(root, 0700); err != nil { t.Fatal(err) }
    if err := os.WriteFile(filepath.Join(root, "Novel.epub"), []byte("synthetic book"), 0600); err != nil { t.Fatal(err) }
    if err := a.addSource("Books",root); err != nil { t.Fatal(err) }
    if err := a.scan(1); err != nil { t.Fatal(err) }
    health := func() (int,libraryHealthSummary,[]librarySourceHealth,string) {
        t.Helper()
        req := httptest.NewRequest(http.MethodGet,"/api/library-health",nil)
        req.AddCookie(&http.Cookie{Name:"archivist_session", Value:"test-key"})
        res := httptest.NewRecorder()
        a.routes().ServeHTTP(res,req)
        var data struct {
            Summary libraryHealthSummary `json:"summary"`
            Sources []librarySourceHealth `json:"sources"`
        }
        if res.Code==200 {
            if err:=json.Unmarshal(res.Body.Bytes(),&data); err!=nil { t.Fatal(err) }
        }
        return res.Code,data.Summary,data.Sources,res.Body.String()
    }
    code,summary,sources,_ := health()
    if code!=200 || summary.SourceCount!=1 || summary.OfflineSources!=0 ||
        summary.IndexedFiles!=1 || summary.AvailableFlags!=1 ||
        len(sources)!=1 || !sources[0].Online {
        t.Fatalf("initial library health: status=%d summary=%+v sources=%+v",code,summary,sources)
    }
    if err:=os.Rename(root,root+"-offline");err!=nil { t.Fatal(err) }
    code,summary,sources,_=health()
    if code!=200 || summary.OfflineSources!=1 || summary.IndexedFiles!=1 ||
        len(sources)!=1 || sources[0].Online || sources[0].Path!=root {
        t.Fatalf("offline source missing diagnostics: status=%d summary=%+v sources=%+v",code,summary,sources)
    }
    var total,available int
    if err:=a.db.QueryRow("SELECT count(*),sum(available) FROM assets").Scan(&total,&available);err!=nil { t.Fatal(err) }
    if total!=1 || available!=1 { t.Fatalf("diagnostic mutated live catalogue: total=%d available=%d",total,available) }
    if err:=os.Rename(root+"-offline",root);err!=nil { t.Fatal(err) }
    code,summary,sources,_=health()
    if code!=200 || summary.OfflineSources!=0 || !sources[0].Online {
        t.Fatalf("restored NAS root not detected: status=%d summary=%+v sources=%+v",code,summary,sources)
    }
}

func TestLibraryHealthIsAdministratorOnly(t *testing.T) {
    a:=fixture(t)
    root:=t.TempDir()
    if err:=a.addSource("Private NAS",root);err!=nil { t.Fatal(err) }
    handler:=a.routes()
    unauth:=httptest.NewRecorder()
    handler.ServeHTTP(unauth,httptest.NewRequest(http.MethodGet,"/api/library-health",nil))
    if unauth.Code!=http.StatusUnauthorized || strings.Contains(unauth.Body.String(),root) {
        t.Fatalf("anonymous data leaked: status=%d",unauth.Code)
    }
    if _,err:=a.db.Exec("INSERT INTO profiles(name,key_hash) VALUES(?,?)","User",keyHash("user-key"));err!=nil { t.Fatal(err) }
    session,err:=a.newSession("user-key")
    if err!=nil { t.Fatal(err) }
    req:=httptest.NewRequest(http.MethodGet,"/api/library-health",nil)
    req.AddCookie(&http.Cookie{Name:"archivist_session",Value:session})
    res:=httptest.NewRecorder()
    handler.ServeHTTP(res,req)
    if res.Code!=http.StatusForbidden || strings.Contains(res.Body.String(),root) {
        t.Fatalf("non-admin retrieved private NAS paths: status=%d body=%q",res.Code,res.Body.String())
    }
}
