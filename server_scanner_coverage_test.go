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

func scannerCoverageCall(a *app,url,key string)*httptest.ResponseRecorder{
    request:=httptest.NewRequest(http.MethodGet,url,nil)
    if key!=""{request.AddCookie(&http.Cookie{Name:"archivist_session",Value:key})}
    recorder:=httptest.NewRecorder()
    a.routes().ServeHTTP(recorder,request)
    return recorder
}

func TestScannerCoverageIsRealReadOnlyAndUpdatesAfterReview(t *testing.T){
    a:=fixture(t)
    dir:=t.TempDir()
    for _,name:=range []string{"Alpha.epub","Beta.epub"}{
        if err:=os.WriteFile(filepath.Join(dir,name),[]byte("unreadable EPUB metadata fixture"),0600);err!=nil{t.Fatal(err)}
    }
    if err:=a.addSource("Library",dir);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    health:=func()(libraryHealthSummary,librarySourceHealth){
        t.Helper()
        response:=scannerCoverageCall(a,"/api/library-health","test-key")
        if response.Code!=200{t.Fatalf("coverage response: %d %s",response.Code,response.Body.String())}
        var result struct{
            Summary libraryHealthSummary `json:"summary"`
            Sources []librarySourceHealth `json:"sources"`
        }
        if err:=json.Unmarshal(response.Body.Bytes(),&result);err!=nil{t.Fatal(err)}
        if len(result.Sources)!=1{t.Fatalf("coverage source cardinality %+v",result.Sources)}
        return result.Summary,result.Sources[0]
    }
    first,source:=health()
    if first.IndexedFiles!=2||first.IndexedWorks!=2||first.PublishedWorks!=2||
      first.MissingAuthor!=2||first.MissingGenre!=2||first.MissingYear!=2||
      first.LowConfidence!=2||first.NeedsReview!=2||first.OfflineFiles!=0{
        t.Fatalf("scanner gaps misleading on pristine library: %+v",first)
    }
    if source.IndexedFiles!=2||source.IndexedWorks!=2||source.MissingGenre!=2||!source.Online{
        t.Fatalf("source coverage inaccurate: %+v",source)
    }
    var id int64
    if err:=a.db.QueryRow("SELECT id FROM assets WHERE relative_path='Alpha.epub'").Scan(&id);err!=nil{t.Fatal(err)}
    request:=httptest.NewRequest(http.MethodPatch,"/api/assets/"+strconv.FormatInt(id,10)+"/metadata",
      strings.NewReader(`{"author":"Reviewed Author","genre":"History","publishedYear":2011}`))
    request.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
    request.Header.Set("X-Archivist-Action","1")
    response:=httptest.NewRecorder()
    a.routes().ServeHTTP(response,request)
    if response.Code!=200{t.Fatalf("review failed %d: %s",response.Code,response.Body.String())}
    after,updated:=health()
    if after.IndexedFiles!=2||after.IndexedWorks!=2||
        after.MissingAuthor!=1||after.MissingGenre!=1||after.MissingYear!=1||
        after.LowConfidence!=1||after.NeedsReview!=1||
        updated.MissingGenre!=1||updated.MissingYear!=1{
        t.Fatalf("post-review coverage never reflected corrected metadata: %+v %+v",after,updated)
    }
    for _,category:=range []string{"author","genre","year","confidence","review"}{
        filtered:=scannerCoverageCall(a,"/api/books?metadataGap="+category,"test-key")
        if filtered.Code!=200{t.Fatalf("%s filter failed %d %s",category,filtered.Code,filtered.Body.String())}
        var books []book
        if err:=json.Unmarshal(filtered.Body.Bytes(),&books);err!=nil{t.Fatal(err)}
        if len(books)!=1||books[0].Title!="Beta"{
            t.Fatalf("filter %s not in sync with metadata coverage: %+v",category,books)
        }
    }
    // A media row removed by a successful rescan is reported as unavailable
    // but its work identity and metadata record remain present.
    if err:=os.Remove(filepath.Join(dir,"Beta.epub"));err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    unavailable,_:=health()
    if unavailable.OfflineFiles!=1||unavailable.IndexedFiles!=2||unavailable.IndexedWorks!=2{
        t.Fatalf("offline flags lost indexed works: %+v",unavailable)
    }
    filtered:=scannerCoverageCall(a,"/api/books?metadataGap=unavailable","test-key")
    var books []book
    if err:=json.Unmarshal(filtered.Body.Bytes(),&books);err!=nil{t.Fatal(err)}
    if filtered.Code!=200||len(books)!=1||books[0].Title!="Beta"||books[0].Available{
        t.Fatalf("unavailable filter does not match health: %d %+v",filtered.Code,books)
    }
    // Reporting and filtering have not mutated source media or approved fields.
    var name,genre string
    if err:=a.db.QueryRow("SELECT author,genre FROM assets WHERE id=?",id).Scan(&name,&genre);err!=nil||name!="Reviewed Author"||genre!="History"{
        t.Fatalf("read-only health modified user corrections: name=%q genre=%q err=%v",name,genre,err)
    }
}

func TestScannerCoverageFilteringIsOwnerOnlyAndValidatesInputs(t *testing.T){
    a:=fixture(t)
    if err:=a.addSource("Private",t.TempDir());err!=nil{t.Fatal(err)}
    for _,category:=range []string{"author","genre","year","confidence","review","unavailable"}{
        response:=scannerCoverageCall(a,"/api/books?metadataGap="+category,"test-key")
        if response.Code!=200{t.Fatalf("valid owner category %s rejected: %d %s",category,response.Code,response.Body.String())}
    }
    invalid:=scannerCoverageCall(a,"/api/books?metadataGap=../../../secret","test-key")
    if invalid.Code!=400{t.Fatalf("invalid dynamic filter accepted %d %s",invalid.Code,invalid.Body.String())}
    if _,err:=a.db.Exec("INSERT INTO profiles(name,key_hash) VALUES('Family',?)",keyHash("family"));err!=nil{t.Fatal(err)}
    token,err:=a.newSession("family");if err!=nil{t.Fatal(err)}
    request:=scannerCoverageCall(a,"/api/books?metadataGap=author",token)
    if request.Code!=403{t.Fatalf("household user accessed owner scan diagnostics: %d %s",request.Code,request.Body.String())}
    anonymous:=scannerCoverageCall(a,"/api/library-health","")
    if anonymous.Code!=401{t.Fatalf("anonymous server scan report allowed: %d",anonymous.Code)}
    guest:=scannerCoverageCall(a,"/api/library-health",token)
    if guest.Code!=403{t.Fatalf("family member accessed mount metadata: %d %s",guest.Code,guest.Body.String())}
}
