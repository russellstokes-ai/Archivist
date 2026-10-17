package main

import (
 "archive/zip"
 "bytes"
 "encoding/json"
 "fmt"
 "os"
 "path/filepath"
 "strings"
 "testing"
)

// Real small CBZ fixtures, not synthetic SQLite asset rows. The indexed scanner
// must parse ComicInfo into a stable work and the comic audit must READ it
// without opening the archive again, moving media or changing its bytes.
func createComicInfoArchive(t *testing.T,folder string,issue int)string{
 t.Helper()
 filename:=filepath.Join(folder,fmt.Sprintf("Flash Issue %03d.cbz",issue))
 file,err:=os.Create(filename)
 if err!=nil{t.Fatal(err)}
 zw:=zip.NewWriter(file)
 xml:=fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<ComicInfo><Title>The Flash Issue #%d</Title><Series>The Flash</Series>
<Number>%d</Number><Year>2024</Year><Writer>Comic Creator</Writer>
<Genre>Superhero</Genre><Publisher>Sample Comics</Publisher></ComicInfo>`,issue,issue)
 doc,err:=zw.Create("ComicInfo.xml")
 if err!=nil{t.Fatal(err)}
 if _,err=doc.Write([]byte(xml));err!=nil{t.Fatal(err)}
 image,err:=zw.Create("0001.gif")
 if err!=nil{t.Fatal(err)}
 if _,err=image.Write(comicGifFixture(t));err!=nil{t.Fatal(err)}
 if err=zw.Close();err!=nil{t.Fatal(err)}
 if err=file.Close();err!=nil{t.Fatal(err)}
 return filename
}
func TestComicAuditUsesScannedComicInfoInRealCBZAndPreservesFiles(t *testing.T){
 a:=fixture(t)
 root:=t.TempDir()
 files:=map[int]string{}
 before:=map[int][]byte{}
 for _,number:=range []int{1,3,4}{
  filename:=createComicInfoArchive(t,root,number)
  files[number]=filename
  data,err:=os.ReadFile(filename);if err!=nil{t.Fatal(err)}
  before[number]=data
 }
 if err:=a.addSource("Comics",root);err!=nil{t.Fatal(err)}
 if err:=a.scan(1);err!=nil{t.Fatalf("actual CBZ scanner rejected ComicInfo archive: %v",err)}
 var workID int64
 if err:=a.db.QueryRow(`SELECT ed.work_id FROM assets a
   JOIN edition_assets ea ON ea.asset_id=a.id
   JOIN editions ed ON ed.id=ea.edition_id
   WHERE a.relative_path='Flash Issue 001.cbz'`).Scan(&workID);err!=nil{t.Fatal(err)}
 getAudit:=func()comicAuditResult{
  t.Helper()
  response:=comicAuditGet(a,fmt.Sprint(workID),true)
  if response.Code!=200{t.Fatalf("comic audit rejected actual indexed archive: %d %s",response.Code,response.Body.String())}
  var report comicAuditResult
  if err:=json.Unmarshal(response.Body.Bytes(),&report);err!=nil{t.Fatal(err)}
  return report
 }
 report:=getAudit()
 if report.Series!="The Flash"||report.IssueNumber!="1"||len(report.Peers)!=3||
  len(report.PossibleGaps)!=1||report.PossibleGaps[0]!=2||len(report.FileEvidence)!=1||
  report.FileEvidence[0].MetadataSource==""{
  t.Fatalf("ComicInfo data not faithfully reflected in server audit: %+v",report)
 }
 if !strings.Contains(report.FileEvidence[0].MetadataSource,"embedded"){
  t.Fatalf("ComicInfo was not identified as indexed embedded metadata: %+v",report.FileEvidence)
 }
 beforeFingerprint:=report.Fingerprint
 if err:=a.scan(1);err!=nil{t.Fatalf("unchanged CBZ rescan failed: %v",err)}
 after:=getAudit()
 if after.WorkID!=workID||after.Series!=report.Series||after.IssueNumber!=report.IssueNumber||
  after.Fingerprint!=beforeFingerprint||len(after.Peers)!=3||
  len(after.PossibleGaps)!=1||after.PossibleGaps[0]!=2{
  t.Fatalf("unchanged scan altered comic work or issue data: before=%+v after=%+v",report,after)
 }
 for _,issue:=range []int{1,3,4}{
  current,err:=os.ReadFile(files[issue]);if err!=nil{t.Fatal(err)}
  if !bytes.Equal(current,before[issue]){t.Fatalf("scan/audit modified issue #%d archive bytes",issue)}
 }
 var history int
 if err:=a.db.QueryRow("SELECT count(*) FROM work_metadata_history").Scan(&history);err!=nil||history!=0{
  t.Fatalf("read-only comic audit unexpectedly saved metadata: %d %v",history,err)
 }
}
