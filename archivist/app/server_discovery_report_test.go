package main

import (
 "archive/tar"
 "encoding/json"
 "net/http"
 "net/http/httptest"
 "strings"
 "os"
 "path/filepath"
 "testing"
)

func TestComicFilenameEvidenceDoesNotInventIssues(t *testing.T) {
 for _,name:=range []string{"0003 The New You.cbz","0009-0017 Robots (9 eps).cbr","0001x Bank Raid.cbz"} {
  m:=pathMetadata("Comics/Example Collected Stories/"+name,"Comic")
  if m.Author!=""||m.SeriesNumber!=0 {t.Fatalf("invented author/issue from collection: %+v",m)}
 }
 m:=pathMetadata("Example/01- Example the Explorer.pdf","PDF")
 if m.Title!="Example the Explorer"||m.Author!="" {t.Fatalf("numbered PDF title: %+v",m)}
 m=pathMetadata("Example/Example #12.cbz","Comic")
 if m.SeriesNumber!=12 {t.Fatalf("explicit issue lost: %+v",m)}
}
func TestCBTEmbeddedMetadata(t *testing.T){
 p:=filepath.Join(t.TempDir(),"Example.cbt");f,err:=os.Create(p);if err!=nil{t.Fatal(err)}
 tw:=tar.NewWriter(f);body:=[]byte(`<ComicInfo><Title>Example</Title><Writer>A Writer</Writer><Genre>Fantasy</Genre><Year>2001</Year><Number>7</Number></ComicInfo>`)
 if err=tw.WriteHeader(&tar.Header{Name:"ComicInfo.xml",Mode:0600,Size:int64(len(body))});err!=nil{t.Fatal(err)}
 if _,err=tw.Write(body);err!=nil{t.Fatal(err)};tw.Close();f.Close()
 m:=comicMetadata(p);if m.Genre!="Fantasy"||m.PublishedYear!=2001||m.SeriesNumber!=7{t.Fatalf("CBT metadata lost: %+v",m)}
}
func TestAuthorlessComicMatchingRequiresIdentity(t *testing.T){
 q:=multiMetadataQuery{Title:"Example #7",Series:"Example",IssueNumber:"7",MediaFormat:"Comic"}
 c:=multiMetadataCandidate{publicMetadataCandidate:publicMetadataCandidate{Title:"Example #7",WorkID:"/works/test",Author:"A Writer"},ComicSeriesMatch:"match",ComicIssueMatch:"match"}
 if _,ok:=automaticMetadataCandidate([]multiMetadataCandidate{c},q);!ok{t.Fatal("explicit unique comic identity rejected without author")}
 c.ComicIssueMatch="mismatch";if _,ok:=automaticMetadataCandidate([]multiMetadataCandidate{c},q);ok{t.Fatal("wrong issue accepted")}
}

func TestSeriesGenreNeverSuppliesIssueDateOrCredits(t *testing.T){
 c:=multiMetadataCandidate{publicMetadataCandidate:publicMetadataCandidate{Title:"Example",WorkID:"one",Author:"A Writer",PublishedYear:1980,Source:"Open Library"},Genre:"Fantasy",YearType:"first publication"}
 out,ok:=automaticSeriesGenre([]multiMetadataCandidate{c},"Example")
 if !ok||out.Genre!="Fantasy"||out.Author!=""||out.PublishedYear!=0{t.Fatalf("series leaked issue details: %+v",out)}
 d:=c;d.WorkID="two";if _,ok=automaticSeriesGenre([]multiMetadataCandidate{c,d},"Example");ok{t.Fatal("ambiguous series accepted")}
}
func TestScanReportCountsSkippedAndEffectiveWorkMetadata(t *testing.T){
 a:=fixture(t);if err:=a.initJobs();err!=nil{t.Fatal(err)};root:=t.TempDir()
 for _,name:=range []string{"Example.cbz","Unknown.CB7","cover.jpg"}{if err:=os.WriteFile(filepath.Join(root,name),[]byte("fixture"),0600);err!=nil{t.Fatal(err)}}
 if err:=a.addSource("Test",root);err!=nil{t.Fatal(err)};if err:=a.scan(1);err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec(`UPDATE works SET genre='Fantasy';INSERT INTO work_field_controls(work_id,field,value,source,locked,updated_at) SELECT id,'publishedYear','2001','manual',1,0 FROM works`);err!=nil{t.Fatal(err)}
 req:=httptest.NewRequest("GET","/api/manage/scan-report?download=1",nil);req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"});res:=httptest.NewRecorder();a.routes().ServeHTTP(res,req)
 if res.Code!=200{t.Fatalf("report: %d %s",res.Code,res.Body.String())}
 var report struct{Sources []struct{Report scanDiscoveryReport `json:"report"`} `json:"sources"`;Books map[string]int64 `json:"books"`}
 if err:=json.Unmarshal(res.Body.Bytes(),&report);err!=nil{t.Fatal(err)}
 if len(report.Sources)!=1||report.Sources[0].Report.Extensions[".cb7"].Skipped!=1||report.Sources[0].Report.Extensions[".cbz"].Imported!=1{t.Fatalf("extension evidence: %+v",report)}
 if report.Books["missingGenre"]!=0||report.Books["missingYear"]!=0{t.Fatalf("file gaps misreported as book gaps: %+v",report.Books)}
 if strings.Contains(res.Body.String(),root)||res.Header().Get("Content-Disposition")==""{t.Fatal("unsafe or missing download headers")}
 if _,err:=a.db.Exec("INSERT INTO profiles(name,key_hash) VALUES('User',?)",keyHash("report-user"));err!=nil{t.Fatal(err)}
 session,err:=a.newSession("report-user");if err!=nil{t.Fatal(err)}
 req=httptest.NewRequest("GET","/api/manage/scan-report",nil);req.AddCookie(&http.Cookie{Name:"archivist_session",Value:session});res=httptest.NewRecorder();a.routes().ServeHTTP(res,req);if res.Code!=403{t.Fatalf("household report access: %d",res.Code)}
}

func TestComicTextIssueKeepsOtherMetadata(t *testing.T){
 for _,label:=range []string{"1A","1/2","Annual",""}{
  t.Run(label,func(t *testing.T){
   root:=t.TempDir();p:=filepath.Join(root,"Example.cbz")
   body:=`<ComicInfo><Title>Special</Title><Series>Example</Series><Number>`+label+`</Number><Writer>A Writer</Writer><Genre>Fantasy</Genre><Year>2001</Year></ComicInfo>`
   writeZipFixture(t,p,map[string]string{"ComicInfo.xml":body})
   embedded:=comicMetadata(p)
   side:=filepath.Join(root,"ComicInfo.xml");if err:=os.WriteFile(side,[]byte(body),0600);err!=nil{t.Fatal(err)}
   for _,m:=range []embeddedMetadata{embedded,parseSidecarFile(side)}{if m.Author!="A Writer"||m.Genre!="Fantasy"||m.PublishedYear!=2001||m.SeriesNumber!=0{t.Fatalf("text issue discarded metadata or invented number: %+v",m)}}
  })
 }
}
