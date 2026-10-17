package main

import (
 "bytes"
 "context"
 "encoding/json"
 "net/http"
 "net/http/httptest"
 "strings"
 "testing"
)

func comicTransferFixture(t *testing.T)(*app,int64,int64,int64){
 t.Helper()
 a:=comicAuditFixture(t)
 // Three separate synthetic comics; put two same-issue editions in manual
 // source work #1, and retain one separate existing destination work #2.
 // No production catalogue regrouping function is called here.
 if _,err:=a.db.Exec("UPDATE assets SET series_number=1 WHERE id IN (2,3)");err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("UPDATE editions SET work_id=1 WHERE id=3");err!=nil{t.Fatal(err)}
 return a,1,2,3
}
func transferFingerprint(t *testing.T,a *app,work int64)string{
 t.Helper()
 tx,err:=a.db.BeginTx(context.Background(),nil)
 if err!=nil{t.Fatal(err)}
 defer tx.Rollback()
 state,err:=a.readWorkMeta(context.Background(),tx,work)
 if err!=nil{t.Fatal(err)}
 return state.Fingerprint
}
func transferInspect(a *app,in comicTransferRequest,owner,action bool)*httptest.ResponseRecorder{
 data,_:=json.Marshal(in)
 request:=httptest.NewRequest("POST","/api/manage/comic-edition-transfer/inspect",bytes.NewReader(data))
 if owner{request.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})}
 if action{request.Header.Set("X-Archivist-Action","1")}
 w:=httptest.NewRecorder()
 a.routes().ServeHTTP(w,request)
 return w
}
func transferReport(t *testing.T,a *app,source,target,edition int64)comicTransferPreview{
 t.Helper()
 r:=transferInspect(a,comicTransferRequest{SourceWorkID:source,
  TargetWorkID:target,EditionID:edition,ExpectedSourceFingerprint:transferFingerprint(t,a,source)},true,true)
 if r.Code!=200{t.Fatalf("inspect HTTP %d: %s",r.Code,r.Body.String())}
 var p comicTransferPreview
 if err:=json.Unmarshal(r.Body.Bytes(),&p);err!=nil{t.Fatal(err)}
 return p
}
func containsTransferBlock(p comicTransferPreview,code string)bool{
 for _,v:=range p.Blockers{if v.Code==code{return true}}
 return false
}
func TestComicEditionTransferPreflightIsConsistentReadOnlyAndSigned(t *testing.T){
 a,source,target,edition:=comicTransferFixture(t)
 before:=transferFingerprint(t,a,source)
 p:=transferReport(t,a,source,target,edition)
 if !p.PreflightClear||!p.ReadOnly||p.ExpiresAt<=0||len(p.Receipt)!=64||
  p.Source.WorkID!=source||p.Target.WorkID!=target||p.EditionID!=edition{
  t.Fatalf("incorrect read-only transfer preflight %+v",p)
 }
 if p.Receipt!=comicTransferReceipt(a.token,p){t.Fatal("preview did not bind the work/edition evidence")}
 if len(p.Blockers)!=0||p.Member.AssetID!=3||p.Member.Issue!=1||
  p.Source.Editions!=2||p.Target.Editions!=1{
  t.Fatalf("wrong source/target identity %+v",p)
 }
 if !strings.Contains(stringJSON(p.Warnings),"apply-not-enabled"){
  t.Fatalf("future apply gating not disclosed: %+v",p.Warnings)
 }
 var liveWork,editionOwner,assetPosition int64
 if err:=a.db.QueryRow("SELECT work_id FROM editions WHERE id=?",edition).Scan(&editionOwner);err!=nil{t.Fatal(err)}
 if err:=a.db.QueryRow("SELECT position FROM edition_assets WHERE asset_id=3").Scan(&assetPosition);err!=nil{t.Fatal(err)}
 if err:=a.db.QueryRow("SELECT id FROM works WHERE id=?",target).Scan(&liveWork);err!=nil{t.Fatal(err)}
 if editionOwner!=source||liveWork!=target||assetPosition!=0||
  before!=transferFingerprint(t,a,source){
  t.Fatalf("inspect mutated original edition or catalogue identity: %+v",p)
 }
}
func TestComicEditionTransferPreflightRejectsOwnerOrMalformedRequests(t *testing.T){
 a,source,target,edition:=comicTransferFixture(t)
 in:=comicTransferRequest{SourceWorkID:source,TargetWorkID:target,EditionID:edition,
  ExpectedSourceFingerprint:transferFingerprint(t,a,source)}
 if result:=transferInspect(a,in,false,true);result.Code!=401{
  t.Fatalf("anonymous preflight allowed: %d",result.Code)
 }
 if result:=transferInspect(a,in,true,false);result.Code!=403{
  t.Fatalf("missing CSRF marker allowed: %d",result.Code)
 }
 in.ExpectedSourceFingerprint=strings.Repeat("x",64)
 if result:=transferInspect(a,in,true,true);result.Code==200{
  t.Fatal("stale work fingerprint was trusted")
 }
 in.ExpectedSourceFingerprint=transferFingerprint(t,a,source)
 in.EditionID=2
 if result:=transferInspect(a,in,true,true);result.Code==200{
  t.Fatal("member from unrelated work accepted as source edition")
 }
 invalid:=httptest.NewRequest("POST","/api/manage/comic-edition-transfer/inspect",
  strings.NewReader(`{"sourceWorkId":1,"targetWorkId":2,"editionId":3,"bogus":true}`))
 invalid.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
 invalid.Header.Set("X-Archivist-Action","1")
 w:=httptest.NewRecorder();a.routes().ServeHTTP(w,invalid)
 if w.Code!=400{t.Fatalf("unknown HTTP fields accepted %d",w.Code)}
 // Explicitly no Apply endpoint: the owner may inspect conflicts, never
 // move media by guessing a URL or replaying an inspector receipt.
 req:=httptest.NewRequest("POST","/api/manage/comic-edition-transfer/apply",nil)
 req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
 req.Header.Set("X-Archivist-Action","1")
 forbidden:=httptest.NewRecorder();a.routes().ServeHTTP(forbidden,req)
 if forbidden.Code==200{t.Fatal("transfer Apply endpoint was accidentally exposed")}
}
func TestComicEditionTransferPreflightBlocksPublicationAutoAndIssueMismatch(t *testing.T){
 a,source,target,edition:=comicTransferFixture(t)
 if _,err:=a.db.Exec("UPDATE assets SET series_number=3 WHERE id=2");err!=nil{t.Fatal(err)}
 if p:=transferReport(t,a,source,target,edition);!containsTransferBlock(p,"issue-conflict"){
  t.Fatalf("different comic issues were treated as one edition: %+v",p)
 }
 if _,err:=a.db.Exec("UPDATE assets SET series_number=1 WHERE id=2");err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("UPDATE works SET auto=1 WHERE id=?",target);err!=nil{t.Fatal(err)}
 if p:=transferReport(t,a,source,target,edition);!containsTransferBlock(p,"automatic-work"){
  t.Fatalf("auto-grouping unsafe transfer allowed: %+v",p)
 }
 if _,err:=a.db.Exec("UPDATE works SET auto=0 WHERE id=?",target);err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("INSERT INTO work_publication(work_id,state,revision,published_at) VALUES(?,'published',1,0)",target);err!=nil{t.Fatal(err)}
 if p:=transferReport(t,a,source,target,edition);!containsTransferBlock(p,"published-work"){
  t.Fatalf("published destination transfer allowed: %+v",p)
 }
 if _,err:=a.db.Exec("UPDATE work_publication SET state='staged',revision=revision+1 WHERE work_id=?",target);err!=nil{t.Fatal(err)}
 if p:=transferReport(t,a,source,target,edition);!containsTransferBlock(p,"publication-history"){
  t.Fatalf("prior publication transitions were ignored: %+v",p)
 }
 if _,err:=a.db.Exec("UPDATE works SET space='Other' WHERE id=?",target);err!=nil{t.Fatal(err)}
 if p:=transferReport(t,a,source,target,edition);!containsTransferBlock(p,"cross-library"){
  t.Fatalf("cross-library reparenting allowed: %+v",p)
 }
}
func TestComicEditionTransferPreflightBlocksSavedProfilesAndHouseholdReferences(t *testing.T){
 a,source,target,edition:=comicTransferFixture(t)
 if _,err:=a.db.Exec(`INSERT INTO comic_edition_profiles(
   edition_id,work_id,revision,run,volume,issue,year,updated_at)
   VALUES(3,1,1,'The Flash 2024','1','1','2024',0)`);err!=nil{t.Fatal(err)}
 if p:=transferReport(t,a,source,target,edition);!containsTransferBlock(p,"verified-edition"){
  t.Fatalf("saved edition profile was at risk: %+v",p)
 }
 if _,err:=a.db.Exec("DELETE FROM comic_edition_profiles WHERE edition_id=3");err!=nil{t.Fatal(err)}
 if err:=a.initReader();err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec(`INSERT INTO reading_progress(profile_id,asset_id,part,fraction,revision,complete)
   VALUES(7,3,1,0.5,1,0)`);err!=nil{t.Fatal(err)}
 if p:=transferReport(t,a,source,target,edition);!containsTransferBlock(p,"reading-progress"){
  t.Fatalf("existing reading position could change work ownership: %+v",p)
 }
 if _,err:=a.db.Exec("DELETE FROM reading_progress WHERE asset_id=3");err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("INSERT INTO work_preferences(profile_id,work_id,rating,favourite,updated) VALUES(7,2,5,1,123)");err!=nil{
  // Fixture may not initialise preferences; initialise once and retry.
  if e:=a.initPreferences();e!=nil{t.Fatal(e)}
  if _,e:=a.db.Exec("INSERT INTO work_preferences(profile_id,work_id,rating,favourite,updated) VALUES(7,2,5,1,123)");e!=nil{t.Fatal(e)}
 }
 if p:=transferReport(t,a,source,target,edition);!containsTransferBlock(p,"preferences"){
  t.Fatalf("household favourites were ignored: %+v",p)
 }
}
func TestComicEditionTransferPreflightBlocksEmptySourceAndUnreviewedMedia(t *testing.T){
 a,source,target,edition:=comicTransferFixture(t)
 if _,err:=a.db.Exec("UPDATE editions SET work_id=3 WHERE id=1");err!=nil{t.Fatal(err)}
 if p:=transferReport(t,a,source,target,edition);!containsTransferBlock(p,"source-empty"){
  t.Fatalf("orphaning source work was allowed: %+v",p)
 }
 if _,err:=a.db.Exec("UPDATE editions SET work_id=1 WHERE id=1");err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("UPDATE assets SET needs_review=1 WHERE id=3");err!=nil{t.Fatal(err)}
 if p:=transferReport(t,a,source,target,edition);!containsTransferBlock(p,"unsafe-edition"){
  t.Fatalf("unreviewed original allowed: %+v",p)
 }
}

func TestComicEditionTransferPreflightBlocksActiveScanAndOwnerEdits(t *testing.T){
 a,source,target,edition:=comicTransferFixture(t)
 if _,err:=a.db.Exec(`CREATE TABLE IF NOT EXISTS jobs(source_id INTEGER NOT NULL,state TEXT NOT NULL)`);err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("INSERT INTO jobs(source_id,state) VALUES(1,'running')");err!=nil{t.Fatal(err)}
 if p:=transferReport(t,a,source,target,edition);!containsTransferBlock(p,"active-scan"){
  t.Fatalf("active scan was ignored: %+v",p)
 }
 if _,err:=a.db.Exec("UPDATE jobs SET state='complete' WHERE source_id=1");err!=nil{t.Fatal(err)}
 if p:=transferReport(t,a,source,target,edition);containsTransferBlock(p,"active-scan"){
  t.Fatalf("completed scan remained a blocker: %+v",p)
 }
 if _,err:=a.db.Exec(`INSERT INTO work_field_controls(work_id,field,value,source,locked,updated_at)
 VALUES(?, 'series','The Flash','owner edit',1,0)`,source);err!=nil{t.Fatal(err)}
 if p:=transferReport(t,a,source,target,edition);!containsTransferBlock(p,"manual-fields"){
  t.Fatalf("owner locked series metadata was ignored: %+v",p)
 }
 if _,err:=a.db.Exec("DELETE FROM work_field_controls WHERE work_id=?",source);err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec(`INSERT INTO asset_metadata_revisions(asset_id,revision) VALUES(3,1)`);err!=nil{t.Fatal(err)}
 if p:=transferReport(t,a,source,target,edition);!containsTransferBlock(p,"asset-field-revision"){
  t.Fatalf("saved media metadata revision was ignored: %+v",p)
 }
}
func TestComicEditionTransferPreflightRespectsCoverAndExactReceiptBinding(t *testing.T){
 a,source,target,edition:=comicTransferFixture(t)
 initial:=transferReport(t,a,source,target,edition)
 changed:=initial
 changed.EditionID=1
 if changed.Receipt==comicTransferReceipt(a.token,changed){
  t.Fatal("reassignment receipt can be changed to another edition")
 }
 changed=initial
 changed.Target.WorkID=3
 if changed.Receipt==comicTransferReceipt(a.token,changed){
  t.Fatal("receipt can be changed to a different destination")
 }
 if _,err:=a.db.Exec(`INSERT INTO selected_work_covers(
   work_id,image,mime,digest,updated_at) VALUES(?,?,'image/jpeg',?,1)`,
   target,[]byte("synthetic-jpeg"),strings.Repeat("d",64));err!=nil{t.Fatal(err)}
 withCover:=transferReport(t,a,source,target,edition)
 if !containsTransferBlock(withCover,"selected-cover")||withCover.PreflightClear{
  t.Fatalf("target manually selected cover was at risk: %+v",withCover)
 }
 if withCover.Target.Fingerprint==initial.Target.Fingerprint{
  t.Fatal("selected-cover mutation did not change the target revision fingerprint")
 }
}
