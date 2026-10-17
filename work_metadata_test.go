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

func workMetaRequest(a *app,method,path,token,payload string,action bool)*httptest.ResponseRecorder{
 r:=httptest.NewRequest(method,path,strings.NewReader(payload))
 if token!=""{r.AddCookie(&http.Cookie{Name:"archivist_session",Value:token})}
 if action{r.Header.Set("X-Archivist-Action","1")}
 w:=httptest.NewRecorder()
 a.routes().ServeHTTP(w,r)
 return w
}
type workFixture struct{
 a *app
 WorkID,EditionID,FirstID,SecondID int64
 Root string
}
func setupWorkFixture(t *testing.T)workFixture{
 t.Helper()
 a:=fixture(t)
 if err:=a.initProgress();err!=nil{t.Fatal(err)}
 root:=t.TempDir()
 folder:=filepath.Join(root,"Writer","Aerial Archive")
 if err:=os.MkdirAll(folder,0700);err!=nil{t.Fatal(err)}
 for _,name:=range []string{"01 - First.mp3","02 - Second.mp3"}{
   if err:=os.WriteFile(filepath.Join(folder,name),[]byte("audiobook-"+name),0600);err!=nil{t.Fatal(err)}
 }
 if err:=a.addSource("Family Books",root);err!=nil{t.Fatal(err)}
 if err:=a.scan(1);err!=nil{t.Fatal(err)}
 var id,edition int64
 if err:=a.db.QueryRow(`SELECT w.id,e.id FROM works w JOIN editions e ON e.work_id=w.id
  WHERE w.title='Aerial Archive'`).Scan(&id,&edition);err!=nil{t.Fatal(err)}
 ids:=[]int64{}
 rows,err:=a.db.Query(`SELECT ea.asset_id FROM edition_assets ea WHERE ea.edition_id=?
    ORDER BY ea.position`,edition)
 if err!=nil{t.Fatal(err)}
 for rows.Next(){var x int64;if err=rows.Scan(&x);err!=nil{rows.Close();t.Fatal(err)};ids=append(ids,x)}
 if err=rows.Err();err!=nil{rows.Close();t.Fatal(err)}
 rows.Close()
 if len(ids)!=2{t.Fatalf("expected two audio tracks got %v",ids)}
 if _,err:=a.saveProfileProgress(9,edition,progress{Asset:ids[1],Seconds:313,Revision:0});err!=nil{t.Fatal(err)}
 return workFixture{a:a,WorkID:id,EditionID:edition,FirstID:ids[0],SecondID:ids[1],Root:root}
}
func (f workFixture)path(part string)string{return "/api/manage/works/"+strconv.FormatInt(f.WorkID,10)+"/metadata"+part}
func (f workFixture)get(t *testing.T)workMetaState{
 t.Helper()
 r:=workMetaRequest(f.a,"GET",f.path(""),"test-key","",false)
 if r.Code!=200{t.Fatalf("GET work meta %d %s",r.Code,r.Body.String())}
 var state workMetaState
 if err:=json.Unmarshal(r.Body.Bytes(),&state);err!=nil{t.Fatal(err)}
 return state
}
func (f workFixture)preview(t *testing.T,state workMetaState,changes []workMetaChange)workMetaPreview{
 t.Helper()
 raw,_:=json.Marshal(workMetaPreviewRequest{ExpectedRevision:state.Revision,
    ExpectedFingerprint:state.Fingerprint,Changes:changes})
 r:=workMetaRequest(f.a,"POST",f.path("/preview"),"test-key",string(raw),true)
 if r.Code!=200{t.Fatalf("work preview status=%d body=%s",r.Code,r.Body.String())}
 var p workMetaPreview
 if err:=json.Unmarshal(r.Body.Bytes(),&p);err!=nil{t.Fatal(err)}
 if len(p.Receipt)!=64||p.WorkID!=f.WorkID||p.ExpectedFingerprint!=state.Fingerprint{
   t.Fatalf("unbound or malformed preview %+v",p)
 }
 return p
}
func (f workFixture)apply(t *testing.T,p workMetaPreview,confirm bool)*httptest.ResponseRecorder{
 t.Helper()
 raw,_:=json.Marshal(workMetaApplyRequest{Preview:p,Confirm:confirm})
 return workMetaRequest(f.a,"POST",f.path("/apply"),"test-key",string(raw),true)
}
func fieldValue(state workMetaState,name string)workMetaField{
 for _,f:=range state.Fields{if f.Name==name{return f}}
 return workMetaField{}
}

func TestWorkAssistOneBookEditsPreviewPersistAndUndoAcrossRescan(t *testing.T){
 f:=setupWorkFixture(t)
 old:=f.get(t)
 if old.Auto!=true||old.PublicationState!="staged"||old.Files!=2||
   len(old.Editions)!=1||old.Editions[0].Files!=2||
   len(old.Fingerprint)!=64||len(old.MemberDigest)!=64{
     t.Fatalf("initial logical work incomplete %+v",old)
 }
 if old.Title!="Aerial Archive"||fieldValue(old,"title").Value!="Aerial Archive"{
   t.Fatalf("unexpected original source name %+v",old)
 }
 if fieldValue(old,"publishedYear").Value!=""||fieldValue(old,"genre").Locked{
   t.Fatalf("derived fields were invented or locked %+v",old.Fields)
 }
 changes:=[]workMetaChange{
   {Name:"title",Value:"Archivist: Aerial Archive",Origin:"manual"},
   {Name:"author",Value:"Verified Writer",Origin:"manual"},
   {Name:"genre",Value:"Adventure",Origin:"manual"},
   {Name:"publishedYear",Value:"2020",Origin:"open-library"},
   {Name:"description",Value:"Book-level source and edition metadata.",Origin:"manual"},
 }
 p:=f.preview(t,old,changes)
 if len(p.Diff)!=5{t.Fatalf("partial preview differences: %+v",p)}
 if r:=f.apply(t,p,false);r.Code!=400{t.Fatalf("applied unconfirmed preview: %d",r.Code)}
 if r:=f.apply(t,p,true);r.Code!=200{t.Fatalf("apply failed %d %s",r.Code,r.Body.String())}
 if r:=f.apply(t,p,true);r.Code!=409{t.Fatalf("replayed preview accepted %d",r.Code)}
 updated:=f.get(t)
 if updated.Revision!=1||updated.Title!="Archivist: Aerial Archive"||
   fieldValue(updated,"author").Value!="Verified Writer"||
   fieldValue(updated,"genre").Value!="Adventure"||
   fieldValue(updated,"publishedYear").Value!="2020"||
   !strings.Contains(fieldValue(updated,"publishedYear").Source,"unverified")||
   updated.PublicationState!="staged"{
   t.Fatalf("work edits inconsistent or automatically published: %+v",updated)
 }
 var physicalTitle string
 if err:=f.a.db.QueryRow("SELECT title FROM assets WHERE id=?",f.FirstID).Scan(&physicalTitle);err!=nil{t.Fatal(err)}
 if physicalTitle=="Archivist: Aerial Archive"{t.Fatal("book edit overwrote physical chapter metadata")}
 if err:=f.a.scan(1);err!=nil{t.Fatalf("scanner lost work-level overlays: %v",err)}
 again:=f.get(t)
 if again.Title!=updated.Title||again.Fingerprint!=updated.Fingerprint||
   again.Revision!=updated.Revision||fieldValue(again,"publishedYear").Value!="2020"{
    t.Fatalf("rescan discarded manual work metadata: prior=%+v rescan=%+v",updated,again)
 }
 position,err:=f.a.readProfileProgress(9,f.EditionID)
 if err!=nil||position.Asset!=f.SecondID||position.Seconds!=313{
   t.Fatalf("book-wide edit modified household bookmark %+v %v",position,err)
 }
 fileResp:=workMetaRequest(f.a,"GET",
   "/api/manage/works/"+strconv.FormatInt(f.WorkID,10)+"/media?limit=1&offset=0","test-key","",false)
 if fileResp.Code!=200{t.Fatalf("media structure unavailable: %d %s",fileResp.Code,fileResp.Body.String())}
 var media struct{Files []workMetaMedia `json:"files"`;HasMore bool `json:"hasMore"`;Fingerprint string `json:"fingerprint"`}
 if err:=json.Unmarshal(fileResp.Body.Bytes(),&media);err!=nil{t.Fatal(err)}
 if len(media.Files)!=1||!media.HasMore||media.Files[0].EditionID!=f.EditionID||
    media.Files[0].ID!=f.FirstID||media.Files[0].Position!=0||
    media.Fingerprint!=again.Fingerprint{
   t.Fatalf("paged book edition detail inconsistent: %+v",media)
 }
 // Undo is itself previewed, signed and revisioned. Never delete the book or
 // rewind progress and never re-apply this exact undo token twice.
 undo:=workMetaRequest(f.a,"POST",f.path("/undo-preview"),"test-key","",true)
 if undo.Code!=200{t.Fatalf("undo preview rejected %d %s",undo.Code,undo.Body.String())}
 var undoPlan workUndoPreview
 if err:=json.Unmarshal(undo.Body.Bytes(),&undoPlan);err!=nil{t.Fatal(err)}
 if undoPlan.ExpectedRevision!=1||len(undoPlan.Diff)!=5{t.Fatalf("undo preview incorrect %+v",undoPlan)}
 raw,_:=json.Marshal(workUndoApplyRequest{Preview:undoPlan,Confirm:true})
 undoResult:=workMetaRequest(f.a,"POST",f.path("/undo"),"test-key",string(raw),true)
 if undoResult.Code!=200{t.Fatalf("undo failed %d %s",undoResult.Code,undoResult.Body.String())}
 reverted:=f.get(t)
 if reverted.Title!=old.Title||fieldValue(reverted,"author").Value!=fieldValue(old,"author").Value||
   fieldValue(reverted,"publishedYear").Value!=""||reverted.Revision!=2{
     t.Fatalf("undo did not restore work metadata %+v",reverted)
 }
 if r:=workMetaRequest(f.a,"POST",f.path("/undo"),"test-key",string(raw),true);r.Code!=409{
   t.Fatalf("replayed signed undo accepted %d",r.Code)
 }
 history:=workMetaRequest(f.a,"GET",f.path("/history"),"test-key","",false)
 var event struct{Events []workHistoryEvent `json:"events"`}
 if err:=json.Unmarshal(history.Body.Bytes(),&event);err!=nil||len(event.Events)!=2||
   event.Events[0].Action!="undo"||event.Events[1].Action!="edit"{
   t.Fatalf("undo journal incorrect %+v %v",event,err)
 }
 if err:=f.a.scan(1);err!=nil{t.Fatal(err)}
 if revived:=f.get(t);revived.Title!=old.Title||fieldValue(revived,"publishedYear").Value!=""{
   t.Fatalf("original derived metadata did not reappear after undo: %+v",revived)
 }
 afterBookmark,err:=f.a.readProfileProgress(9,f.EditionID)
 if err!=nil||afterBookmark.Asset!=f.SecondID||afterBookmark.Seconds!=313{
   t.Fatalf("undo changed household bookmark %+v %v",afterBookmark,err)
 }
}

func TestWorkAssistLocksAndStaleSnapshots(t *testing.T){
 f:=setupWorkFixture(t)
 old:=f.get(t)
 // Check a derived field can be pinned without losing the value on a rescan.
 input:=map[string]any{"locked":true,"expectedRevision":old.Revision,"expectedFingerprint":old.Fingerprint}
 raw,_:=json.Marshal(input)
 lock:=workMetaRequest(f.a,"PUT",f.path("/fields/title"),"test-key",string(raw),true)
 if lock.Code!=200{t.Fatalf("lock failed: %d %s",lock.Code,lock.Body.String())}
 current:=f.get(t)
 if !fieldValue(current,"title").Locked||current.Revision!=1{t.Fatalf("lock not persisted %+v",current)}
 if _,err:=f.a.db.Exec("UPDATE assets SET title='Changed file title' WHERE id=?",f.FirstID);err!=nil{t.Fatal(err)}
 if err:=f.a.scan(1);err!=nil{t.Fatal(err)}
 if f.get(t).Title!="Aerial Archive"{t.Fatal("locked derived title changed after scanning")}
 current=f.get(t)
 bad:=workMetaPreviewRequest{ExpectedRevision:current.Revision,
   ExpectedFingerprint:current.Fingerprint,Changes:[]workMetaChange{{Name:"title",Value:"Overwrite locked book",Origin:"manual"}}}
 request,_:=json.Marshal(bad)
 r:=workMetaRequest(f.a,"POST",f.path("/preview"),"test-key",string(request),true)
 if r.Code!=409{t.Fatalf("locked work changed: %d %s",r.Code,r.Body.String())}
 unlockInput:=map[string]any{"locked":false,"expectedRevision":current.Revision,"expectedFingerprint":current.Fingerprint}
 raw,_=json.Marshal(unlockInput)
 if r=workMetaRequest(f.a,"PUT",f.path("/fields/title"),"test-key",string(raw),true);r.Code!=200{
   t.Fatalf("unlock failed %d %s",r.Code,r.Body.String())
 }
 staleInput:=workMetaPreviewRequest{ExpectedRevision:current.Revision,
    ExpectedFingerprint:current.Fingerprint,
    Changes:[]workMetaChange{{Name:"genre",Value:"History",Origin:"manual"}}}
 raw,_=json.Marshal(staleInput)
 if r=workMetaRequest(f.a,"POST",f.path("/preview"),"test-key",string(raw),true);r.Code!=409{
   t.Fatalf("stale preview accepted after field lock: %d",r.Code)
 }
 fresh:=f.get(t)
 plan:=f.preview(t,fresh,[]workMetaChange{{Name:"genre",Value:"History",Origin:"manual"}})
 // Even if the book-level revision has not changed, new source metadata
 // changes its signed membership digest and must invalidate stale previews.
 if _,err:=f.a.db.Exec("UPDATE assets SET publisher='New file publisher' WHERE id=?",f.SecondID);err!=nil{t.Fatal(err)}
 if r=f.apply(t,plan,true);r.Code!=409{t.Fatalf("file changed but preview applied %d %s",r.Code,r.Body.String())}
}

func TestWorkAssistAuthorisationPublicationAndAtomicRollback(t *testing.T){
 f:=setupWorkFixture(t)
 initial:=f.get(t)
 if r:=workMetaRequest(f.a,"GET",f.path(""),"","",false);r.Code!=401{
   t.Fatalf("anonymous metadata read %d",r.Code)
 }
 if _,err:=f.a.db.Exec("INSERT INTO profiles(name,key_hash) VALUES('Reader',?)",keyHash("reader-key"));err!=nil{t.Fatal(err)}
 session,err:=f.a.newSession("reader-key");if err!=nil{t.Fatal(err)}
 if r:=workMetaRequest(f.a,"GET",f.path(""),session,"",false);r.Code!=403{
   t.Fatalf("household member can read admin workbench %d",r.Code)
 }
 req,_:=json.Marshal(workMetaPreviewRequest{ExpectedRevision:initial.Revision,
  ExpectedFingerprint:initial.Fingerprint,Changes:[]workMetaChange{{Name:"title",Value:"Edited",Origin:"manual"}}})
 if r:=workMetaRequest(f.a,"POST",f.path("/preview"),"test-key",string(req),false);r.Code!=403{
   t.Fatalf("CSRF disabled for work previews %d",r.Code)
 }
 if r:=workMetaRequest(f.a,"POST",f.path("/preview"),session,string(req),true);r.Code!=403{
   t.Fatalf("household member can preview book edit %d",r.Code)
 }
 if r:=workMetaRequest(f.a,"POST",f.path("/preview"),"test-key",strings.TrimSuffix(string(req),"}")+`,"unknown":true}`,true);r.Code!=400{
   t.Fatalf("unknown field accepted %d %s",r.Code,r.Body.String())
 }
 if r:=workMetaRequest(f.a,"POST",f.path("/preview"),"test-key",string(req)+"{}",true);r.Code!=400{
   t.Fatalf("trailing JSON accepted %d",r.Code)
 }
 if r:=workMetaRequest(f.a,"POST",f.path("/preview"),"test-key",
   `{"expectedRevision":0,"expectedFingerprint":"none","changes":[{"name":"genre","value":"Fiction","origin":"manual"},{"name":"genre","value":"Mystery","origin":"manual"}]}`,true);r.Code!=409{
    t.Fatalf("invalid fingerprint accepted %d",r.Code)
 }
 preview:=f.preview(t,initial,[]workMetaChange{{Name:"title",Value:"Edited",Origin:"manual"}})
 if _,err:=f.a.db.Exec(`CREATE TRIGGER work_save_abort BEFORE INSERT ON work_metadata_history
  BEGIN SELECT RAISE(ABORT,'forced history recording failure');END`);err!=nil{t.Fatal(err)}
 failure:=f.apply(t,preview,true)
 if failure.Code!=500{t.Fatalf("database failure did not give 500: %d %s",failure.Code,failure.Body.String())}
 if preserved:=f.get(t);preserved.Title!=initial.Title||preserved.Revision!=initial.Revision{
   t.Fatalf("database fault partially saved work: %+v",preserved)
 }
 if _,err:=f.a.db.Exec("DROP TRIGGER work_save_abort");err!=nil{t.Fatal(err)}
 if ok:=f.apply(t,preview,true);ok.Code!=200{t.Fatalf("failure caused unusable retry: %d %s",ok.Code,ok.Body.String())}
 if _,err:=f.a.db.Exec(`INSERT INTO work_publication(work_id,state,revision,published_at)
 VALUES(?,'published',1,1)`,f.WorkID);err!=nil{t.Fatal(err)}
 pub:=f.get(t)
 if pub.PublicationState!="published"{t.Fatal("publication state unavailable in workbench")}
 badReq,_:=json.Marshal(workMetaPreviewRequest{ExpectedRevision:pub.Revision,
  ExpectedFingerprint:pub.Fingerprint,Changes:[]workMetaChange{{Name:"author",Value:"Can't edit while published",Origin:"manual"}}})
 if r:=workMetaRequest(f.a,"POST",f.path("/preview"),"test-key",string(badReq),true);r.Code!=409{
   t.Fatalf("published book modified without explicit unpublish %d",r.Code)
 }
 if r:=workMetaRequest(f.a,"POST",f.path("/undo-preview"),"test-key","",true);r.Code!=409{
   t.Fatalf("published book offered undo %d",r.Code)
 }
}

func TestWorkAssistCandidateConflictAndVersionedProvenance(t *testing.T){
 f:=setupWorkFixture(t)
 old:=f.get(t)
 var id int64
 if err:=f.a.db.QueryRow("SELECT id FROM assets WHERE id=?",f.FirstID).Scan(&id);err!=nil{t.Fatal(err)}
 if _,err:=f.a.db.Exec("UPDATE assets SET published_year=2001 WHERE id=?",f.FirstID);err!=nil{t.Fatal(err)}
 if _,err:=f.a.db.Exec("UPDATE assets SET published_year=2010 WHERE id=?",f.SecondID);err!=nil{t.Fatal(err)}
 state:=f.get(t)
 year:=fieldValue(state,"publishedYear")
 if !year.Conflicting||year.Value!=""||year.Source!="conflicting file values"{
   t.Fatalf("conflicting edition years were silently chosen %+v",year)
 }
 p:=f.preview(t,state,[]workMetaChange{{Name:"publishedYear",Value:"2008",Origin:"open-library"}})
 if r:=f.apply(t,p,true);r.Code!=200{t.Fatalf("candidate selection rejected %d %s",r.Code,r.Body.String())}
 done:=f.get(t)
 year=fieldValue(done,"publishedYear")
 if year.Conflicting||!strings.Contains(year.Source,"unverified")||year.Value!="2008"{
    t.Fatalf("selected candidate provenance falsely verified %+v",year)
 }
 var y1,y2 int
 if err:=f.a.db.QueryRow("SELECT published_year FROM assets WHERE id=?",f.FirstID).Scan(&y1);err!=nil{t.Fatal(err)}
 if err:=f.a.db.QueryRow("SELECT published_year FROM assets WHERE id=?",f.SecondID).Scan(&y2);err!=nil{t.Fatal(err)}
 if y1!=2001||y2!=2010{t.Fatal("work year erroneously overwrote edition years")}
 // End-to-end persistence through SQLite reopen for mobile/NAS migration.
 other,err:=openDB(f.a.dbPath);if err!=nil{t.Fatal(err)}
 defer other.Close()
 check:=&app{db:other,token:f.a.token}
 recovered,err:=check.readWorkMeta(httptest.NewRequest("GET","/",nil).Context(),other,f.WorkID)
 if err!=nil||fieldValue(recovered,"publishedYear").Value!="2008"||recovered.Revision!=1{
   t.Fatalf("metadata controls not durable in SQLite %+v %v",recovered,err)
 }
 _=old
}

func TestBookSeriesFractionalIssueAndAtlasYearUseApprovedWorkMetadata(t *testing.T){
    f:=setupWorkFixture(t)
    for _,init:=range []func()error{f.a.initListening,f.a.initReader,f.a.initPreferences,f.a.initCompletions,f.a.initActivity}{
        if err:=init();err!=nil{t.Fatal(err)}
    }
    if _,err:=f.a.db.Exec("UPDATE assets SET published_year=2001,series_number=1 WHERE source_id=1");err!=nil{t.Fatal(err)}
    initial:=f.get(t)
    if fieldValue(initial,"publishedYear").Value!="2001"||fieldValue(initial,"seriesNumber").Value!="1"{
        t.Fatalf("failed to derive work year/sequence from editions: %+v",initial.Fields)
    }
    p:=f.preview(t,initial,[]workMetaChange{
        {Name:"publishedYear",Value:"2021",Origin:"manual"},
        {Name:"seriesNumber",Value:"0.5",Origin:"manual"},
    })
    if res:=f.apply(t,p,true);res.Code!=200{t.Fatalf("work-level date and fractional issue not saved: %d %s",res.Code,res.Body.String())}
    state:=f.get(t)
    if fieldValue(state,"publishedYear").Value!="2021"||fieldValue(state,"seriesNumber").Value!="0.5"{
        t.Fatalf("work-level sequence/year incorrectly stored: %+v",state.Fields)
    }
    var fileYear int
    if err:=f.a.db.QueryRow("SELECT published_year FROM assets WHERE id=?",f.FirstID).Scan(&fileYear);err!=nil||fileYear!=2001{
        t.Fatalf("book year overwrite changed edition source metadata: year=%d err=%v",fileYear,err)
    }
    // Publication is deliberately a separate, explicit owner action. The
    // shared catalogue and Atlas rings should use the approved *book* year.
    if _,err:=f.a.db.Exec(`INSERT INTO work_publication(work_id,state,revision,published_at)
       VALUES(?,'published',1,1)`,f.WorkID);err!=nil{t.Fatal(err)}
    works:=workMetaRequest(f.a,"GET","/api/works?year=2021","test-key","",false)
    if works.Code!=200{t.Fatalf("year-filtered published books %d %s",works.Code,works.Body.String())}
    var records []struct{
        ID int64 `json:"id"`
        PublishedYear int64 `json:"publishedYear"`
        SeriesNumber float64 `json:"seriesNumber"`
    }
    if err:=json.Unmarshal(works.Body.Bytes(),&records);err!=nil{t.Fatal(err)}
    if len(records)!=1||records[0].ID!=f.WorkID||records[0].PublishedYear!=2021||
       records[0].SeriesNumber!=0.5{
        t.Fatalf("published work did not expose approved year and fractional position %+v",records)
    }
    previous:=workMetaRequest(f.a,"GET","/api/works?year=2001","test-key","",false)
    var older []map[string]any
    if err:=json.Unmarshal(previous.Body.Bytes(),&older);err!=nil||len(older)!=0{
        t.Fatalf("book-level override ignored by published search: %+v %v",older,err)
    }
    summary:=workMetaRequest(f.a,"GET","/api/library-summary","test-key","",false)
    if summary.Code!=200{t.Fatalf("Atlas summary unavailable %d %s",summary.Code,summary.Body.String())}
    var library struct{Years []struct{Name string `json:"name"`;Count int `json:"count"`} `json:"years"`}
    if err:=json.Unmarshal(summary.Body.Bytes(),&library);err!=nil{t.Fatal(err)}
    if len(library.Years)!=1||library.Years[0].Name!="2021"||library.Years[0].Count!=1{
        t.Fatalf("Atlas year ring ignored book workbench correction: %+v",library.Years)
    }
    if _,err:=f.a.db.Exec("UPDATE work_publication SET state='staged',revision=revision+1 WHERE work_id=?",f.WorkID);err!=nil{t.Fatal(err)}
    cleared:=f.get(t)
    clearPlan:=f.preview(t,cleared,[]workMetaChange{{Name:"publishedYear",Value:"",Origin:"manual"}})
    if result:=f.apply(t,clearPlan,true);result.Code!=200{t.Fatalf("explicit year clearing failed %d %s",result.Code,result.Body.String())}
    if _,err:=f.a.db.Exec("UPDATE work_publication SET state='published',revision=revision+1 WHERE work_id=?",f.WorkID);err!=nil{t.Fatal(err)}
    summary=workMetaRequest(f.a,"GET","/api/library-summary","test-key","",false)
    if err:=json.Unmarshal(summary.Body.Bytes(),&library);err!=nil{t.Fatal(err)}
    if len(library.Years)!=0{t.Fatalf("explicit cleared book year wrongly fell back to edition year: %+v",library.Years)}
    // Source edition is still 2001 and visible to file-level editors.
    if err:=f.a.db.QueryRow("SELECT published_year FROM assets WHERE id=?",f.FirstID).Scan(&fileYear);err!=nil||fileYear!=2001{t.Fatalf("file year lost: %d %v",fileYear,err)}
}

func TestBookWorkMetaRejectsBadFractionalNumberAndDuplicateFields(t *testing.T){
    f:=setupWorkFixture(t);state:=f.get(t)
    for _,candidate:=range []string{"NaN","Infinity","-120000","1000000","1.2.3"}{
        raw,_:=json.Marshal(workMetaPreviewRequest{ExpectedRevision:state.Revision,ExpectedFingerprint:state.Fingerprint,
           Changes:[]workMetaChange{{Name:"seriesNumber",Value:candidate,Origin:"manual"}}})
        response:=workMetaRequest(f.a,"POST",f.path("/preview"),"test-key",string(raw),true)
        if response.Code!=409{t.Fatalf("invalid fraction %q previewed: %d %s",candidate,response.Code,response.Body.String())}
    }
    raw,_:=json.Marshal(workMetaPreviewRequest{ExpectedRevision:state.Revision,ExpectedFingerprint:state.Fingerprint,
      Changes:[]workMetaChange{
        {Name:"genre",Value:"History",Origin:"manual"},
        {Name:"genre",Value:"Fantasy",Origin:"manual"},
      }})
    response:=workMetaRequest(f.a,"POST",f.path("/preview"),"test-key",string(raw),true)
    if response.Code!=409{t.Fatalf("duplicate work field previewed: %d %s",response.Code,response.Body.String())}
}

func TestLargeSignedBookWorkPreviewAndBoundedApply(t *testing.T){
 f:=setupWorkFixture(t)
 original:=strings.Repeat("Original description. ",1000)
 // Keep source and replacement within the public 20 KiB field limit.
 original=original[:19500]
 replacement:=strings.Repeat("New edition synopsis. ",1000)[:19500]
 if _,err:=f.a.db.Exec("UPDATE assets SET description=? WHERE source_id=1",original);err!=nil{t.Fatal(err)}
 state:=f.get(t)
 if fieldValue(state,"description").Value!=original{t.Fatal("test requires a long current book synopsis")}
 plan:=f.preview(t,state,[]workMetaChange{
   {Name:"description",Value:replacement,Origin:"manual"},
   {Name:"title",Value:strings.Repeat("T",1000),Origin:"manual"},
   {Name:"author",Value:strings.Repeat("A",1000),Origin:"manual"},
   {Name:"genre",Value:strings.Repeat("G",1000),Origin:"manual"},
   {Name:"narrator",Value:strings.Repeat("N",1000),Origin:"manual"},
   {Name:"publisher",Value:strings.Repeat("P",1000),Origin:"manual"},
 })
 raw,_:=json.Marshal(workMetaApplyRequest{Preview:plan,Confirm:true})
 if len(raw)<=65536||len(raw)>=256<<10{
    t.Fatalf("signed 20KiB description edits must exercise a bounded >64KiB apply, got %d",len(raw))
 }
 approved:=workMetaRequest(f.a,"POST",f.path("/apply"),"test-key",string(raw),true)
 if approved.Code!=200{t.Fatalf("legitimate large signed description change rejected %d %s",approved.Code,approved.Body.String())}
 after:=f.get(t)
 if after.Revision!=1||fieldValue(after,"description").Value!=replacement||len(after.Title)!=1000{
    t.Fatalf("large metadata transaction incomplete; rev=%d titleLen=%d descLen=%d",
      after.Revision,len(after.Title),len(fieldValue(after,"description").Value))
 }
 // Over-budget bodies are rejected before they can touch the DB, even if they
 // contain a valid signed preview plus junk appended after the JSON object.
 huge:=string(raw)+strings.Repeat(" ",(256<<10)+1)
 overflow:=workMetaRequest(f.a,"POST",f.path("/apply"),"test-key",huge,true)
 if overflow.Code!=400{t.Fatalf("oversized apply not bounded: %d %s",overflow.Code,overflow.Body.String())}
 unchanged:=f.get(t)
 if unchanged.Revision!=after.Revision||unchanged.Fingerprint!=after.Fingerprint{
   t.Fatal("oversized untrusted apply unexpectedly modified book catalogue")
 }
}
