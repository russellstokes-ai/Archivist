package main

import (
    "bytes"
    "database/sql"
    "encoding/json"
    "image"
    "image/color"
    "image/png"
    "net/http"
    "net/http/httptest"
    "os"
    "path/filepath"
    "strconv"
    "strings"
    "testing"
)

// The live route harness uses synthetic test files only, never household media.
func publicationCall(t *testing.T,a *app,method,path,body,key string,marker bool)*httptest.ResponseRecorder{
    t.Helper()
    request:=httptest.NewRequest(method,path,strings.NewReader(body))
    if key!=""{request.AddCookie(&http.Cookie{Name:"archivist_session",Value:key})}
    if marker{request.Header.Set("X-Archivist-Action","1")}
    response:=httptest.NewRecorder()
    a.routes().ServeHTTP(response,request)
    return response
}
func publicationSnapshot(t *testing.T,a *app,id int64)workPublication{
    t.Helper()
    out,err:=a.publicationFor(id)
    if err!=nil{t.Fatal(err)}
    return out
}

func TestPublicationRequiresReviewCoverAndExplicitOwnerAction(t *testing.T){
    a:=fixture(t)
    dir:=filepath.Join(t.TempDir(),"My Novel")
    if err:=os.MkdirAll(dir,0700);err!=nil{t.Fatal(err)}
    media:=filepath.Join(dir,"Track 01.mp3")
    if err:=os.WriteFile(media,[]byte("synthetic audio fixture"),0600);err!=nil{t.Fatal(err)}
    if err:=a.addSource("Family",filepath.Dir(dir));err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    var workID,assetID int64
    if err:=a.db.QueryRow(`SELECT w.id,ea.asset_id FROM works w JOIN editions e ON e.work_id=w.id
        JOIN edition_assets ea ON ea.edition_id=e.id LIMIT 1`).Scan(&workID,&assetID);err!=nil{t.Fatal(err)}
    staged:=publicationSnapshot(t,a,workID)
    if staged.State!="staged"||staged.Revision!=0||staged.Files!=1||staged.NeedsReview!=1{
        t.Fatalf("new scan implicitly published: %+v",staged)
    }
    if res:=publicationCall(t,a,"GET","/api/works","","test-key",false);res.Code!=200||res.Body.String()!="[]\n"{
        t.Fatalf("staged scan leaked to Library: %d %s",res.Code,res.Body.String())
    }
    if res:=publicationCall(t,a,"GET","/api/atlas-relationships?kind=space&value=Family","","test-key",false);
        res.Code!=200||!strings.Contains(res.Body.String(),`"workCount":0`){
        t.Fatalf("staged scan leaked to Atlas: %d %s",res.Code,res.Body.String())
    }
    // A family user must not discover or read unpublished media by guessing IDs.
    if _,err:=a.db.Exec("INSERT INTO profiles(id,name,key_hash,revoked) VALUES(10,'Family member',?,0)",keyHash("family-key"));err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec("INSERT INTO grants(profile_id,space) VALUES(10,'Family')");err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec("INSERT INTO sessions(token_hash,profile_id,credential_hash,expires,created) VALUES(?,10,?,9999999999,0)",keyHash("family-session"),keyHash("family-key"));err!=nil{t.Fatal(err)}
    assetPath:="/api/assets/"+strconv.FormatInt(assetID,10)
    workPath:="/api/works/"+strconv.FormatInt(workID,10)
    if res:=publicationCall(t,a,"GET",assetPath,"","family-session",false);res.Code!=403{
        t.Fatalf("unpublished raw media accessible: %d",res.Code)
    }
    if res:=publicationCall(t,a,"GET",workPath+"/cover","","family-session",false);res.Code!=403{
        t.Fatalf("unpublished cover accessible: %d",res.Code)
    }
    if res:=publicationCall(t,a,"GET","/api/books","","family-session",false);res.Code!=200||strings.Contains(res.Body.String(),"Track 01"){
        t.Fatalf("unpublished file leaked in file catalogue: %d %s",res.Code,res.Body.String())
    }
    requestPath:="/api/manage/works/"+strconv.FormatInt(workID,10)+"/publication"
    publish:=func(revision int64) string{
        return `{"action":"publish","confirm":true,"expectedRevision":`+strconv.FormatInt(revision,10)+`}`
    }
    if res:=publicationCall(t,a,"POST",requestPath,publish(0),"test-key",false);res.Code!=403{
        t.Fatalf("publication missing CSRF action allowed: %d",res.Code)
    }
    if res:=publicationCall(t,a,"POST",requestPath,publish(0),"family-session",true);res.Code!=403{
        t.Fatalf("family member published media: %d",res.Code)
    }
    if res:=publicationCall(t,a,"POST",requestPath,publish(0),"test-key",true);res.Code!=409{
        t.Fatalf("unreviewed work accepted: %d %s",res.Code,res.Body.String())
    }
    patch:="/api/assets/"+strconv.FormatInt(assetID,10)+"/metadata"
    body:=`{"title":"A Novel","author":"Test Writer","genre":"Fiction"}`
    if res:=publicationCall(t,a,"PATCH",patch,body,"test-key",true);res.Code!=200{
        t.Fatalf("metadata Save failed: %d %s",res.Code,res.Body.String())
    }
    if snapshot:=publicationSnapshot(t,a,workID);snapshot.State!="staged"||snapshot.NeedsReview!=0{
        t.Fatalf("Save implicitly published: %+v",snapshot)
    }
    if res:=publicationCall(t,a,"POST",requestPath,publish(0),"test-key",true);res.Code!=409||
        !strings.Contains(res.Body.String(),"cover"){
        t.Fatalf("missing cover not blocked: %d %s",res.Code,res.Body.String())
    }
    cover:=image.NewRGBA(image.Rect(0,0,32,32))
    for y:=0;y<32;y++{for x:=0;x<32;x++{cover.Set(x,y,color.RGBA{R:52,G:117,B:104,A:255})}}
    var encoded bytes.Buffer
    if err:=png.Encode(&encoded,cover);err!=nil{t.Fatal(err)}
    if err:=os.WriteFile(filepath.Join(dir,"cover.png"),encoded.Bytes(),0600);err!=nil{t.Fatal(err)}
    if res:=publicationCall(t,a,"POST",requestPath,publish(0),"test-key",true);res.Code!=200{
        t.Fatalf("ready work not published: %d %s",res.Code,res.Body.String())
    }
    if snapshot:=publicationSnapshot(t,a,workID);snapshot.State!="published"||snapshot.Revision!=1{
        t.Fatalf("publish not durable: %+v",snapshot)
    }
    if res:=publicationCall(t,a,"POST",requestPath,publish(0),"test-key",true);res.Code!=409{
        t.Fatalf("stale publish revision accepted: %d",res.Code)
    }
    if res:=publicationCall(t,a,"GET","/api/works","","family-session",false);res.Code!=200||!strings.Contains(res.Body.String(),"A Novel"){
        t.Fatalf("published work not shown: %d %s",res.Code,res.Body.String())
    }
    if res:=publicationCall(t,a,"GET",assetPath,"","family-session",false);res.Code!=200{
        t.Fatalf("published asset missing: %d",res.Code)
    }
    if res:=publicationCall(t,a,"GET","/api/atlas-relationships?kind=author&value=Test%20Writer","","family-session",false);
        res.Code!=200||!strings.Contains(res.Body.String(),`"workCount":1`){
        t.Fatalf("published Atlas not matching Library: %d %s",res.Code,res.Body.String())
    }
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    if snapshot:=publicationSnapshot(t,a,workID);snapshot.State!="published"||snapshot.Revision!=1{
        t.Fatalf("unchanged rescan revoked publication: %+v",snapshot)
    }
    // Adding an unresolved track to the same book must reopen publication review.
    if err:=os.WriteFile(filepath.Join(dir,"Track 02.mp3"),[]byte("new unresolved fixture"),0600);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    reopened:=publicationSnapshot(t,a,workID)
    if reopened.State!="staged"||reopened.Revision!=2||reopened.Files!=2||reopened.NeedsReview<1{
        t.Fatalf("new unresolved track did not reopen review: %+v",reopened)
    }
    if res:=publicationCall(t,a,"GET","/api/works","","family-session",false);res.Code!=200||strings.Contains(res.Body.String(),"A Novel"){
        t.Fatalf("unreviewed added track leaked: %d %s",res.Code,res.Body.String())
    }
    var secondID int64
    if err:=a.db.QueryRow("SELECT id FROM assets WHERE relative_path LIKE '%Track 02.mp3'").Scan(&secondID);err!=nil{t.Fatal(err)}
    if res:=publicationCall(t,a,"PATCH","/api/assets/"+strconv.FormatInt(secondID,10)+"/metadata",
       `{"title":"A Novel","author":"Test Writer"}`,"test-key",true);res.Code!=200{
        t.Fatalf("second file correction: %d %s",res.Code,res.Body.String())
    }
    if snapshot:=publicationSnapshot(t,a,workID);snapshot.State!="staged"||snapshot.NeedsReview!=0{
        t.Fatalf("metadata Save silently republished: %+v",snapshot)
    }
    if res:=publicationCall(t,a,"POST",requestPath,publish(2),"test-key",true);res.Code!=200{
        t.Fatalf("republication rejected: %d %s",res.Code,res.Body.String())
    }
    if res:=publicationCall(t,a,"POST",requestPath,`{"action":"unpublish","confirm":true,"expectedRevision":3}`,"test-key",true);res.Code!=200{
        t.Fatalf("unpublish rejected: %d %s",res.Code,res.Body.String())
    }
    if snapshot:=publicationSnapshot(t,a,workID);snapshot.State!="staged"||snapshot.Revision!=4{
        t.Fatalf("explicit unpublish lost state: %+v",snapshot)
    }
    // A second connection simulates a restart; migration must not republish it.
    nextDB,err:=openDB(a.dbPath);if err!=nil{t.Fatal(err)}
    defer nextDB.Close()
    recovered:=&app{db:nextDB,dbPath:a.dbPath}
    if err=recovered.initCatalogue();err!=nil{t.Fatal(err)}
    if snapshot:=publicationSnapshot(t,recovered,workID);snapshot.State!="staged"||snapshot.Revision!=4{
        t.Fatalf("restart silently published book: %+v",snapshot)
    }
    var audit int
    if err=nextDB.QueryRow("SELECT count(*) FROM work_publication_events WHERE work_id=?",workID).Scan(&audit);err!=nil||audit!=4{
        t.Fatalf("publication audit incomplete: %d %v",audit,err)
    }
}

func TestLegacyPublicationMigrationRunsExactlyOnce(t *testing.T){
    a:=fixture(t)
    _,err:=a.db.Exec("DELETE FROM app_meta WHERE key='publication_legacy_migration_v1'")
    if err!=nil{t.Fatal(err)}
    if _,err=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Old','/synthetic','Ready')");err!=nil{t.Fatal(err)}
    _,err=a.db.Exec("INSERT INTO assets(id,source_id,relative_path,title,author,format,needs_review) VALUES(1,1,'old.mp3','Old book','Legacy Author','Audio',0)")
    if err!=nil{t.Fatal(err)}
    _,err=a.db.Exec("INSERT INTO works(id,title,space,author) VALUES(1,'Old book','Old','Legacy Author')")
    if err!=nil{t.Fatal(err)}
    _,err=a.db.Exec("INSERT INTO editions(id,work_id,format) VALUES(1,1,'Audio')")
    if err!=nil{t.Fatal(err)}
    _,err=a.db.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(1,1,0)")
    if err!=nil{t.Fatal(err)}
    if err=a.initPublication();err!=nil{t.Fatal(err)}
    if state:=publicationSnapshot(t,a,1).State;state!="published"{t.Fatalf("reviewed legacy book was hidden: %q",state)}
    _,err=a.db.Exec("INSERT INTO assets(id,source_id,relative_path,title,author,format,needs_review) VALUES(2,1,'new.mp3','New book','New Author','Audio',0)")
    if err!=nil{t.Fatal(err)}
    _,err=a.db.Exec("INSERT INTO works(id,title,space,author) VALUES(2,'New book','Old','New Author')")
    if err!=nil{t.Fatal(err)}
    _,err=a.db.Exec("INSERT INTO editions(id,work_id,format) VALUES(2,2,'Audio')")
    if err!=nil{t.Fatal(err)}
    _,err=a.db.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(2,2,0)")
    if err!=nil{t.Fatal(err)}
    if err=a.initPublication();err!=nil{t.Fatal(err)}
    if state:=publicationSnapshot(t,a,2).State;state!="staged"{t.Fatalf("new work implicitly published by restart: %q",state)}
    var rows int
    if err:=a.db.QueryRow("SELECT count(*) FROM published_works").Scan(&rows);err!=nil||rows!=1 {
        t.Fatalf("migration visibility wrong: %d %v",rows,err)
    }
    // The helper intentionally does not materialize an event for a legacy
    // published work: only owner-initiated and invalidated actions are audited.
    _ = sql.ErrNoRows
    _ = json.Valid
}
