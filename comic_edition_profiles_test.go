package main

import (
 "encoding/json"
 "net/http"
 "strconv"
 "strings"
 "testing"
)

func comicProfileRequest(a *app,method string,workID,editionID int64,suffix,payload string,owner,action bool)*testComicRecorder{
 path:="/api/manage/works/"+strconv.FormatInt(workID,10)+"/comic-editions"
 if editionID>0{path+="/"+strconv.FormatInt(editionID,10)+suffix}
 token:=""
 if owner{token="test-key"}
 result:=workMetaRequest(a,method,path,token,payload,action)
 return &testComicRecorder{Code:result.Code,Body:result.Body.String()}
}
type testComicRecorder struct{Code int;Body string}
func comicProfileFixture(t *testing.T)(*app,int64,int64){
 t.Helper()
 a:=comicAuditFixture(t)
 var editionID int64
 if err:=a.db.QueryRow("SELECT id FROM editions WHERE work_id=1").Scan(&editionID);err!=nil{t.Fatal(err)}
 return a,1,editionID
}
func getComicProfile(t *testing.T,a *app,work,edition int64)comicEditionState{
 t.Helper()
 res:=comicProfileRequest(a,"GET",work,0,"","",true,false)
 if res.Code!=200{t.Fatalf("comic edition registry %d %s",res.Code,res.Body)}
 var data struct{
  WorkID int64 `json:"workId"`
  WorkFingerprint string `json:"workFingerprint"`
  Editions []comicEditionState `json:"editions"`
 }
 if err:=json.Unmarshal([]byte(res.Body),&data);err!=nil{t.Fatal(err)}
 if len(data.WorkFingerprint)!=64{t.Fatal("comic work fingerprint absent")}
 for _,e:=range data.Editions{if e.EditionID==edition{return e}}
 t.Fatalf("edition %d absent from owner registry",edition)
 return comicEditionState{}
}
func previewComicProfile(t *testing.T,a *app,work,edition int64,values comicEditionFields)comicEditionPreview{
 t.Helper()
 state:=getComicProfile(t,a,work,edition)
 raw:=stringJSON(comicEditionPreviewRequest{ExpectedRevision:state.Revision,
  ExpectedWorkFingerprint:state.WorkFingerprint,Fields:values})
 res:=comicProfileRequest(a,"POST",work,edition,"/preview",raw,true,true)
 if res.Code!=200{t.Fatalf("comic edition preview %d %s",res.Code,res.Body)}
 var plan comicEditionPreview
 if err:=json.Unmarshal([]byte(res.Body),&plan);err!=nil{t.Fatal(err)}
 if plan.WorkID!=work||plan.EditionID!=edition||len(plan.Receipt)!=64||len(plan.Diff)==0{
  t.Fatalf("preview not specific or signed: %+v",plan)
 }
 return plan
}
func applyComicProfile(a *app,work,edition int64,plan comicEditionPreview,confirm bool)*testComicRecorder{
 return comicProfileRequest(a,"POST",work,edition,"/apply",
  stringJSON(comicEditionApplyRequest{Preview:plan,Confirm:confirm}),true,true)
}

func TestComicEditionProfilesSaveUndoAndOriginalMediaUnchanged(t *testing.T){
 a,work,edition:=comicProfileFixture(t)
 before:=getComicProfile(t,a,work,edition)
 if before.Revision!=0||before.Stored||!before.Editable||before.Files!=1||before.Available!=1{
  t.Fatalf("new comic edition registry must be optional and editable: %+v",before)
 }
 desired:=comicEditionFields{Run:"1987-1990 series run",Volume:"002",Issue:"1.500",Imprint:" Sample Comics ",
  Variant:"Direct cover",Year:"2024",Notes:"Owner verified printing\nVariant B."}
 plan:=previewComicProfile(t,a,work,edition,desired)
 if plan.After.Volume!="2"||plan.After.Issue!="1.5"||plan.After.Imprint!="Sample Comics"{
  t.Fatalf("unsafe edition value normalization: %+v",plan.After)
 }
 if r:=applyComicProfile(a,work,edition,plan,false);r.Code!=400{t.Fatalf("unconfirmed edition change accepted: %d",r.Code)}
 tampered:=plan;tampered.After.Issue="99"
 if r:=applyComicProfile(a,work,edition,tampered,true);r.Code==200{t.Fatal("tampered signed preview accepted")}
 if r:=applyComicProfile(a,work,edition,plan,true);r.Code!=200{t.Fatalf("approved edition change %d %s",r.Code,r.Body)}
 changed:=getComicProfile(t,a,work,edition)
 if changed.Revision!=1||changed.Fields!=plan.After||!changed.Stored||!changed.Editable||
  changed.WorkFingerprint!=before.WorkFingerprint{
  t.Fatalf("edition fields not independently persisted: %+v",changed)
 }
 if r:=applyComicProfile(a,work,edition,plan,true);r.Code==200{t.Fatal("replayed edition Save accepted")}
 var unchangedTitle,unchangedSeries string
 var unchangedIssue float64
 if err:=a.db.QueryRow("SELECT title,series,series_number FROM assets WHERE id=1").
  Scan(&unchangedTitle,&unchangedSeries,&unchangedIssue);err!=nil{t.Fatal(err)}
 if unchangedTitle!="The Flash #1"||unchangedSeries!="The Flash"||unchangedIssue!=1{
  t.Fatalf("edition registry touched original indexed file: %q %q %g",unchangedTitle,unchangedSeries,unchangedIssue)
 }
 if r:=comicProfileRequest(a,"GET",work,0,"","",false,false);r.Code!=http.StatusUnauthorized{
  t.Fatalf("anonymous edition registry disclosed data: %d",r.Code)
 }
 undoReq:=comicProfileRequest(a,"POST",work,edition,"/undo-preview","",true,true)
 if undoReq.Code!=200{t.Fatalf("undo preview %d %s",undoReq.Code,undoReq.Body)}
 var undo comicEditionPreview
 if err:=json.Unmarshal([]byte(undoReq.Body),&undo);err!=nil{t.Fatal(err)}
 if undo.Action!="undo"||undo.HistoryID<1||undo.After!=(comicEditionFields{}){
  t.Fatalf("undo must restore exact previous blank owner identity: %+v",undo)
 }
 denied:=comicProfileRequest(a,"POST",work,edition,"/undo",
  stringJSON(comicEditionApplyRequest{Preview:undo,Confirm:false}),true,true)
 if denied.Code!=400{t.Fatalf("unconfirmed undo accepted %d",denied.Code)}
 applied:=comicProfileRequest(a,"POST",work,edition,"/undo",
  stringJSON(comicEditionApplyRequest{Preview:undo,Confirm:true}),true,true)
 if applied.Code!=200{t.Fatalf("confirmed undo failed %d %s",applied.Code,applied.Body)}
 restored:=getComicProfile(t,a,work,edition)
 if restored.Revision!=2||restored.Fields!=(comicEditionFields{})||restored.WorkFingerprint!=before.WorkFingerprint{
  t.Fatalf("undo did not return previous fields with monotonic revision: %+v",restored)
 }
 if r:=comicProfileRequest(a,"POST",work,edition,"/undo",
  stringJSON(comicEditionApplyRequest{Preview:undo,Confirm:true}),true,true);r.Code==200{
  t.Fatal("replayed undo accepted")
 }
 if r:=comicProfileRequest(a,"POST",work,edition,"/undo-preview","",true,true);r.Code==200{
  t.Fatal("undo of previous undo should require a new explicit Save")
 }
 var history int
 if err:=a.db.QueryRow("SELECT count(*) FROM comic_edition_profile_history WHERE edition_id=?",edition).Scan(&history);err!=nil||history!=2{
  t.Fatalf("edition audit ledger has %d records (%v)",history,err)
 }
}
func TestComicEditionProfilesRejectInvalidOrStaleAndRollBack(t *testing.T){
 a,work,ed:=comicProfileFixture(t)
 base:=getComicProfile(t,a,work,ed)
 invalid:=[]comicEditionFields{
  {Volume:"two"},{Volume:"10001"},{Issue:"2.3333"},{Issue:"NaN"},
  {Year:"3025"},{Imprint:strings.Repeat("z",161)},
  {Run:"named\x00with control"},{Notes:strings.Repeat("a",2001)},
 }
 for _,fields:=range invalid{
  raw:=stringJSON(comicEditionPreviewRequest{ExpectedRevision:base.Revision,
   ExpectedWorkFingerprint:base.WorkFingerprint,Fields:fields})
  r:=comicProfileRequest(a,"POST",work,ed,"/preview",raw,true,true)
  if r.Code==200{t.Fatalf("invalid comic edition value accepted %+v",fields)}
 }
 plan:=previewComicProfile(t,a,work,ed,comicEditionFields{Run:"Run A",Issue:"1"})
 if _,err:=a.db.Exec(`CREATE TRIGGER abort_comic_edition_history_insert BEFORE INSERT ON comic_edition_profile_history
 BEGIN SELECT RAISE(ABORT,'simulated edition audit failure'); END`);err!=nil{t.Fatal(err)}
 if r:=applyComicProfile(a,work,ed,plan,true);r.Code==200{
  t.Fatal("edition identity was committed without its transaction audit")
 }
 if unchanged:=getComicProfile(t,a,work,ed);unchanged.Stored||unchanged.Revision!=0{
  t.Fatalf("late SQLite failure partially stored edition: %+v",unchanged)
 }
 if _,err:=a.db.Exec("DROP TRIGGER abort_comic_edition_history_insert");err!=nil{t.Fatal(err)}
 if r:=applyComicProfile(a,work,ed,plan,true);r.Code!=200{t.Fatalf("clean retry rejected: %d %s",r.Code,r.Body)}
 stale:=comicProfileRequest(a,"POST",work,ed,"/preview",
  stringJSON(comicEditionPreviewRequest{ExpectedRevision:0,
   ExpectedWorkFingerprint:base.WorkFingerprint,Fields:comicEditionFields{Run:"Old edit"}}),true,true)
 if stale.Code==200{t.Fatal("stale edition revision preview accepted")}
 latest:=getComicProfile(t,a,work,ed)
 sourceDrift:=previewComicProfile(t,a,work,ed,comicEditionFields{Run:"Run B",Issue:"1"})
 if _,err:=a.db.Exec("UPDATE assets SET scan_signature='source changed after preview' WHERE id=1");err!=nil{t.Fatal(err)}
 if r:=applyComicProfile(a,work,ed,sourceDrift,true);r.Code==200{t.Fatal("source-drift edition mutation accepted")}
 if now:=getComicProfile(t,a,work,ed);now.Revision!=latest.Revision{t.Fatal("source drift unexpectedly advanced edition")}
}

func TestComicEditionProfilesBlockPublishedMultifileAndCrossWork(t *testing.T){
 a,work,ed:=comicProfileFixture(t)
 original:=getComicProfile(t,a,work,ed)
 if r:=comicProfileRequest(a,"POST",work,ed,"/preview",
  stringJSON(comicEditionPreviewRequest{ExpectedRevision:original.Revision,
   ExpectedWorkFingerprint:original.WorkFingerprint,Fields:comicEditionFields{Run:"Unpublished only"}}),
  true,false);r.Code!=403{t.Fatalf("write request bypassed CSRF/action gate: %d",r.Code)}
 if r:=comicProfileRequest(a,"POST",work,99,"/preview",
  stringJSON(comicEditionPreviewRequest{ExpectedRevision:0,
   ExpectedWorkFingerprint:original.WorkFingerprint,Fields:comicEditionFields{Run:"Wrong edition"}}),
  true,true);r.Code==200{t.Fatal("non-member edition accepted")}
 if _,err:=a.db.Exec("INSERT INTO work_publication(work_id,state,revision,published_at) VALUES(?,'published',1,1)",work);err!=nil{t.Fatal(err)}
 if r:=comicProfileRequest(a,"POST",work,ed,"/preview",
  stringJSON(comicEditionPreviewRequest{ExpectedRevision:0,
   ExpectedWorkFingerprint:original.WorkFingerprint,Fields:comicEditionFields{Run:"Unsafe public edit"}}),
  true,true);r.Code==200{t.Fatal("published comic edition changed silently")}
 if _,err:=a.db.Exec("UPDATE work_publication SET state='staged',revision=revision+1 WHERE work_id=?",work);err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("UPDATE assets SET available=0 WHERE id=1");err!=nil{t.Fatal(err)}
 offline:=getComicProfile(t,a,work,ed)
 if offline.Editable{t.Fatal("offline source should require reconnection before edition identity changes")}
 if r:=comicProfileRequest(a,"POST",work,ed,"/preview",
  stringJSON(comicEditionPreviewRequest{ExpectedRevision:offline.Revision,
   ExpectedWorkFingerprint:offline.WorkFingerprint,Fields:comicEditionFields{Run:"Offline"}}),
  true,true);r.Code==200{t.Fatal("offline original allowed edition edit")}
 if _,err:=a.db.Exec("UPDATE assets SET available=1 WHERE id=1");err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec(`INSERT INTO assets(id,source_id,relative_path,title,series,format,available,needs_review)
  VALUES(5,1,'part-b.cbz','Second part','The Flash','Comic',1,0)`);err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(5,?,1)",ed);err!=nil{t.Fatal(err)}
 grouped:=getComicProfile(t,a,work,ed)
 if grouped.Files!=2||grouped.Editable{t.Fatalf("multi-file comic edition should be review-only: %+v",grouped)}
 if r:=comicProfileRequest(a,"POST",work,ed,"/preview",
  stringJSON(comicEditionPreviewRequest{ExpectedRevision:grouped.Revision,
   ExpectedWorkFingerprint:grouped.WorkFingerprint,Fields:comicEditionFields{Run:"unsafe mixed files"}}),
  true,true);r.Code==200{t.Fatal("multifile edition identity edited without verifying parts")}
}

func TestComicEditionProfilesKeepMultipleExistingEditionsIndependent(t *testing.T){
 a,work,first:=comicProfileFixture(t)
 // Manual grouping already exists: this test does not call or change the
 // grouping implementation. Only the dedicated profile ledger may mutate.
 if _,err:=a.db.Exec("UPDATE editions SET work_id=? WHERE id=2",work);err!=nil{t.Fatal(err)}
 initial:=getComicProfile(t,a,work,first)
 if initial.WorkID!=work||initial.Files!=1{t.Fatal("first grouped edition missing")}
 other:=getComicProfile(t,a,work,2)
 if other.Revision!=0||other.WorkFingerprint!=initial.WorkFingerprint||!other.Editable{
  t.Fatalf("second existing comic edition not separately editable %+v",other)
 }
 firstPlan:=previewComicProfile(t,a,work,first,comicEditionFields{Volume:"1",Run:"Old run",Issue:"1"})
 secondPlan:=previewComicProfile(t,a,work,2,comicEditionFields{Volume:"2",Run:"Different run",Issue:"3"})
 if r:=applyComicProfile(a,work,first,firstPlan,true);r.Code!=200{t.Fatalf("first edition %d %s",r.Code,r.Body)}
 if r:=applyComicProfile(a,work,2,secondPlan,true);r.Code!=200{t.Fatalf("second edition %d %s",r.Code,r.Body)}
 a1,a2:=getComicProfile(t,a,work,first),getComicProfile(t,a,work,2)
 if a1.Fields.Volume!="1"||a2.Fields.Volume!="2"||a1.Fields.Run==a2.Fields.Run||
  a1.Revision!=1||a2.Revision!=1{
  t.Fatalf("edition identity leaked between existing edition records: %+v %+v",a1,a2)
 }
 var count int
 if err:=a.db.QueryRow("SELECT count(*) FROM edition_assets").Scan(&count);err!=nil||count!=3{
  t.Fatalf("identity editing changed member files: %d %v",count,err)
 }
 // Even if later regrouping reassigns an edition, the prior owner-verified
 // identity cannot silently migrate to a different logical work.
 if _,err:=a.db.Exec("UPDATE editions SET work_id=3 WHERE id=?",first);err!=nil{t.Fatal(err)}
 moved:=comicProfileRequest(a,"GET",3,0,"","",true,false)
 if moved.Code==200{t.Fatalf("an owner identity was silently carried into an unrelated work: %s",moved.Body)}
 var binding int64
 if err:=a.db.QueryRow("SELECT work_id FROM comic_edition_profiles WHERE edition_id=?",first).Scan(&binding);err!=nil||binding!=work{
  t.Fatalf("source record silently reassigned owner edition identity: %d %v",binding,err)
 }
}
