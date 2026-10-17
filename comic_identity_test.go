package main

import (
 "encoding/json"
 "net/http"
 "net/http/httptest"
 "strings"
 "testing"
)

func TestComicIssueExtractionRejectsYearsVolumesAndAmbiguity(t *testing.T){
 for _,tc:=range []struct{Title string;Number float64;Status string}{
  {"The Flash #12",12,"match"},
  {"The Flash Issue 12",12,"match"},
  {"The Flash No. 012",12,"match"},
  {"The Flash #12.5",12.5,"match"},
  {"Batman Annual 2024",0,"unknown"},
  {"The Flash Vol 2",0,"unknown"},
  {"Issue #12 and #13",0,"ambiguous"},
  {"Comics #1-#2",0,"ambiguous"},
  {"Comics #1/#2",0,"ambiguous"},
  {"Comics #1,#2",0,"ambiguous"},
  {"The Flash #12 Issue 12",12,"match"},
  {"The Flash number 12",12,"match"},
 }{
  actual,kind:=comicTitleIssue(tc.Title)
  if kind!=tc.Status||actual!=tc.Number{
   t.Fatalf("%q: number=%g status=%s, want %g %s",tc.Title,actual,kind,tc.Number,tc.Status)
  }
 }
 for _,label:=range []string{"The Flash #12","The Flash Issue #12","The Flash No. 12"}{
  if stem:=comicSeriesTitle(label);stem!="The Flash"{
   t.Fatalf("comic title %q incorrectly produced series %q",label,stem)
  }
 }
}

func TestComicProviderCandidateEvidenceAndEditionGuard(t *testing.T){
 q:=multiMetadataQuery{Search:"The Flash 12",Title:"The Flash",Series:"The Flash",IssueNumber:"12",MediaFormat:"comic"}
 cases:=[]struct{Title,SeriesStatus,IssueStatus,Tier string}{
  {"The Flash #12","match","match","possible comic issue"},
  {"The Flash #13","match","mismatch","check carefully"},
  {"The Flash Annual 2024","mismatch","unknown","check carefully"},
  {"Detective Comics #12","mismatch","match","check carefully"},
  {"The Flash #12 #13","match","ambiguous","check carefully"},
 }
 for _,tc:=range cases{
  c:=multiMetadataCandidate{publicMetadataCandidate:publicMetadataCandidate{Title:tc.Title,Source:"Google Books"}}
  multiRank(&c,q)
  if c.ComicSeriesMatch!=tc.SeriesStatus||c.ComicIssueMatch!=tc.IssueStatus||c.Tier!=tc.Tier{
   t.Fatalf("%q produced %+v (want %s/%s/%s)",tc.Title,c,tc.SeriesStatus,tc.IssueStatus,tc.Tier)
  }
  if len(c.Warnings)==0{t.Fatalf("volume/variant caveat absent for %s",tc.Title)}
 }
 normal:=multiMetadataCandidate{publicMetadataCandidate:publicMetadataCandidate{Title:"Dune"}}
 multiRank(&normal,multiMetadataQuery{Search:"Dune",Title:"Dune",MediaFormat:"book"})
 if normal.ComicIssueMatch!=""||normal.ComicSeriesMatch!=""{
  t.Fatal("comic restrictions must not invade normal book ranking")
 }
}

func comicAuditFixture(t *testing.T)*app{
 t.Helper()
 a:=fixture(t)
 if _,err:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Comics','/synthetic','Ready')");err!=nil{t.Fatal(err)}
 for _,entry:=range []struct{ID int;Number float64;Title string}{
  {1,1,"The Flash #1"},{2,3,"The Flash #3"},{3,4,"The Flash #4"},
 }{
  if _,err:=a.db.Exec("INSERT INTO works(id,title,space,series) VALUES(? ,?,'Comics','The Flash')",entry.ID,entry.Title);err!=nil{t.Fatal(err)}
  if _,err:=a.db.Exec("INSERT INTO editions(id,work_id,format) VALUES(?,?,'Comic')",entry.ID,entry.ID);err!=nil{t.Fatal(err)}
  if _,err:=a.db.Exec(`INSERT INTO assets(id,source_id,relative_path,title,series,series_number,
   published_year,metadata_source,format,available,needs_review)
   VALUES(?,1,?,?,'The Flash',?,2024,'embedded','Comic',1,0)`,entry.ID,entry.Title+".cbz",entry.Title,entry.Number);err!=nil{t.Fatal(err)}
  if _,err:=a.db.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(?,?,0)",entry.ID,entry.ID);err!=nil{t.Fatal(err)}
 }
 return a
}
func comicAuditGet(a *app,id string,owner bool)*httptest.ResponseRecorder{
 req:=httptest.NewRequest(http.MethodGet,"/api/manage/works/"+id+"/comic-audit",nil)
 if owner{req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})}
 res:=httptest.NewRecorder()
 a.routes().ServeHTTP(res,req)
 return res
}
func TestComicAuditEvidenceAndPossibleGapNeverModifyCatalogue(t *testing.T){
 a:=comicAuditFixture(t)
 if anon:=comicAuditGet(a,"1",false);anon.Code!=401{
  t.Fatalf("anonymous comic audit returned %d",anon.Code)
 }
 res:=comicAuditGet(a,"1",true)
 if res.Code!=200{t.Fatalf("owner audit %d %s",res.Code,res.Body.String())}
 var audit comicAuditResult
 if err:=json.Unmarshal(res.Body.Bytes(),&audit);err!=nil{t.Fatal(err)}
 if audit.Series!="The Flash"||audit.IssueNumber!="1"||len(audit.Fingerprint)!=64||
  len(audit.FileEvidence)!=1||audit.FileEvidence[0].MetadataSource!="embedded"||
  len(audit.Peers)!=3||len(audit.PossibleGaps)!=1||audit.PossibleGaps[0]!=2{
  t.Fatalf("wrong source-level series audit %+v",audit)
 }
 var edits int
 if err:=a.db.QueryRow("SELECT count(*) FROM work_metadata_history").Scan(&edits);err!=nil||edits!=0{
  t.Fatalf("a read-only comic audit changed metadata history: %d %v",edits,err)
 }
 if _,err:=a.db.Exec("UPDATE assets SET published_year=2025 WHERE id=3");err!=nil{t.Fatal(err)}
 res=comicAuditGet(a,"1",true)
 if res.Code!=200{t.Fatalf("year mismatch audit %d %s",res.Code,res.Body.String())}
 audit=comicAuditResult{}
 if err:=json.Unmarshal(res.Body.Bytes(),&audit);err!=nil{t.Fatal(err)}
 if len(audit.PossibleGaps)>0{t.Fatalf("different years produced a supposed same-run gap: %+v",audit)}
 if _,err:=a.db.Exec("UPDATE assets SET published_year=2024 WHERE id=3");err!=nil{t.Fatal(err)}
 for _,field:=range []string{"seriesNumber","publishedYear"}{
  if _,err:=a.db.Exec(`INSERT INTO work_field_controls(work_id,field,value,source,locked,updated_at)
   VALUES(2,?,'','owner edit',0,123)`,field);err!=nil{t.Fatal(err)}
  res=comicAuditGet(a,"1",true)
  if res.Code!=200{t.Fatalf("clear %s audit %d %s",field,res.Code,res.Body.String())}
  audit=comicAuditResult{}
  if err:=json.Unmarshal(res.Body.Bytes(),&audit);err!=nil{t.Fatal(err)}
  if len(audit.PossibleGaps)>0{
   t.Fatalf("explicitly cleared %s was overwritten by derived metadata: %+v",field,audit)
  }
  if _,err:=a.db.Exec("DELETE FROM work_field_controls WHERE work_id=2 AND field=?",field);err!=nil{t.Fatal(err)}
 }
 if _,err:=a.db.Exec("INSERT INTO works(id,title,space,series) VALUES(4,'The Flash reprint','Comics','The Flash')");err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("INSERT INTO editions(id,work_id,format) VALUES(4,4,'Comic')");err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec(`INSERT INTO assets(id,source_id,relative_path,title,series,series_number,
   published_year,metadata_source,format,available,needs_review)
   VALUES(4,1,'Reprint.cbz','Reprint','The Flash',3,2024,'path','Comic',1,0)`);err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(4,4,0)");err!=nil{t.Fatal(err)}
 res=comicAuditGet(a,"1",true)
 if res.Code!=200{t.Fatalf("duplicate audit %d %s",res.Code,res.Body.String())}
 audit=comicAuditResult{}
 if err:=json.Unmarshal(res.Body.Bytes(),&audit);err!=nil{t.Fatal(err)}
 if len(audit.PossibleGaps)>0||!strings.Contains(strings.Join(audit.Warnings," "),"Repeated series/issue"){
  t.Fatalf("reprint ambiguity must prevent gap inference %+v",audit)
 }
}
func TestComicAuditIsTypeSafeAndHandlesManualIdentityConflict(t *testing.T){
 a:=comicAuditFixture(t)
 if _,err:=a.db.Exec(`INSERT INTO work_field_controls(work_id,field,value,source,locked,updated_at)
  VALUES(1,'seriesNumber','9','owner edit',1,123)`);err!=nil{t.Fatal(err)}
 res:=comicAuditGet(a,"1",true)
 if res.Code!=200{t.Fatalf("manual audit failed %d %s",res.Code,res.Body.String())}
 var audit comicAuditResult
 if err:=json.Unmarshal(res.Body.Bytes(),&audit);err!=nil{t.Fatal(err)}
 if audit.IssueNumber!="9"||audit.IssueSource!="owner edit"||
  !strings.Contains(strings.Join(audit.Warnings," "),"disagrees"){
  t.Fatalf("source conflict not visible: %+v",audit)
 }
 audiobook:=setupWorkFixture(t)
 other:=comicAuditGet(audiobook.a,"1",true)
 if other.Code!=409{t.Fatalf("non-comic book received comic report: %d %s",other.Code,other.Body.String())}
 if missing:=comicAuditGet(a,"999",true);missing.Code!=404{t.Fatalf("absent book returned %d",missing.Code)}
}

func TestComicAuditVolumeAndRunLabelsPreventCrossVolumeFalseGaps(t *testing.T){
 a:=comicAuditFixture(t)
 read:=func()comicAuditResult{
  t.Helper()
  response:=comicAuditGet(a,"1",true)
  if response.Code!=200{t.Fatalf("comic audit HTTP %d: %s",response.Code,response.Body.String())}
  var report comicAuditResult
  if err:=json.Unmarshal(response.Body.Bytes(),&report);err!=nil{t.Fatal(err)}
  return report
 }
 if gaps:=read().PossibleGaps;len(gaps)!=1||gaps[0]!=2{
  t.Fatalf("initial conservative unlabelled same-year gap changed: %v",gaps)
 }
 for _,item:=range []struct{id int64;issue string}{{1,"1"},{2,"3"},{3,"4"}}{
  if _,err:=a.db.Exec(`INSERT INTO comic_edition_profiles(
    edition_id,work_id,revision,run,volume,issue,year,updated_at)
    VALUES(?,?,1,'Original run','1',?,'2024',123)`,
    item.id,item.id,item.issue);err!=nil{t.Fatal(err)}
  report:=read()
  if item.id!=3&&len(report.PossibleGaps)!=0{
   t.Fatalf("unlabelled sibling was included in a labelled volume: %+v",report)
  }
 }
 result:=read()
 if len(result.PossibleGaps)!=1||result.PossibleGaps[0]!=2||
  result.Peers[0].Run!="Original run"||result.Peers[0].Volume!="1"{
  t.Fatalf("complete same-volume evidence not recognised: %+v",result)
 }
 for _,tc:=range []struct{field,value string}{
  {"volume","2"},{"run","Rebooted series"},{"issue","99"},{"year","2023"},
 }{
  if _,err:=a.db.Exec("UPDATE comic_edition_profiles SET "+tc.field+"=? WHERE edition_id=2",tc.value);err!=nil{t.Fatal(err)}
  report:=read()
  if len(report.PossibleGaps)>0||!strings.Contains(strings.Join(report.Warnings," "),"withheld"){
   t.Fatalf("conflicting %s must block gap inference: %+v",tc.field,report)
  }
  original:="1"
  switch tc.field{case "run":original="Original run";case "issue":original="3";case "year":original="2024"}
  if _,err:=a.db.Exec("UPDATE comic_edition_profiles SET "+tc.field+"=? WHERE edition_id=2",original);err!=nil{t.Fatal(err)}
 }
 result=read()
 if len(result.PossibleGaps)!=1||result.PossibleGaps[0]!=2{
  t.Fatalf("independently verified same-run labels should restore conservative possible-gap display %+v",result)
 }
 // A second comic edition belonging to the same work is a different identity
 // unless separately verified; do not infer a single issue from multiple editions.
 if _,err:=a.db.Exec("UPDATE editions SET work_id=1 WHERE id=2");err!=nil{t.Fatal(err)}
 if len(read().PossibleGaps)>0{t.Fatal("multi-edition work incorrectly inferred a single-series gap")}
}
