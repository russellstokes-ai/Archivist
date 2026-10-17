package main

import (
 "encoding/json"
 "fmt"
 "net/http"
 "net/http/httptest"
 "testing"
 "time"
)

// Deterministic 10,020 media files, across two library spaces. This measures
// query correctness at scale without inventing a Raspberry Pi latency SLA.
// No physical media is mounted; benchmark time is logged, not gate-scored.
func TestReleaseTenThousandMediaReviewAtlasAndPaging(t *testing.T){
 if testing.Short(){t.Skip("10k synthetic catalogue is an integration test")}
 a:=fixture(t)
 initAllProgressForTest(t,a)
 if err:=a.initPerformance();err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Fiction','/synthetic/media1','Indexed'),(2,'Comics','/synthetic/media2','Indexed')");err!=nil{t.Fatal(err)}
 const count=10020
 tx,err:=a.db.Begin()
 if err!=nil{t.Fatal(err)}
 for i:=1;i<=count;i++{
  space,source,format:="Fiction",1,"Ebook"
  if i%2==0{space,source,format="Comics",2,"Comic"}
  title:=fmt.Sprintf("Scale Book %05d",i)
  if _,err=tx.Exec(`INSERT INTO assets(id,source_id,relative_path,title,author,series,genre,format,available,metadata_source,metadata_confidence,needs_review)
   VALUES(?,?,?,?,'Scale Creator','A Series','Mixed Archive',?,1,'manual',100,0)`,
   i,source,fmt.Sprintf("scale-%05d.dat",i),title,format);err!=nil{tx.Rollback();t.Fatal(err)}
  if _,err=tx.Exec("INSERT INTO works(id,title,space,author,series,genre,auto,group_key) VALUES(?,?,?,'Scale Creator','A Series','Mixed Archive',0,'')",i,title,space);err!=nil{tx.Rollback();t.Fatal(err)}
  if _,err=tx.Exec("INSERT INTO editions(id,work_id,format) VALUES(?,?,?)",i,i,format);err!=nil{tx.Rollback();t.Fatal(err)}
  if _,err=tx.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(?,?,0)",i,i);err!=nil{tx.Rollback();t.Fatal(err)}
 }
 if _,err=tx.Exec(`INSERT INTO work_publication(work_id,state,revision,published_at)
  SELECT id,'published',1,123456 FROM works WHERE id%2=0`);err!=nil{tx.Rollback();t.Fatal(err)}
 if err=tx.Commit();err!=nil{t.Fatal(err)}
 call:=func(url string)(int,[]byte,time.Duration){
  start:=time.Now()
  req:=httptest.NewRequest("GET",url,nil)
  req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
  res:=httptest.NewRecorder()
  a.routes().ServeHTTP(res,req)
  elapsed:=time.Since(start)
  t.Logf("%s response=%d duration=%v bytes=%d",url,res.Code,elapsed,len(res.Body.Bytes()))
  return res.Code,res.Body.Bytes(),elapsed
 }
 code,body,_:=call("/api/books?limit=40&offset=9960&sort=title")
 if code!=200{t.Fatalf("large paged file listing HTTP %d %s",code,body)}
 var books []book
 if err=json.Unmarshal(body,&books);err!=nil||len(books)!=40{
  t.Fatalf("10020-item catalogue page missing: len=%d %v",len(books),err)
 }
 for _,tc:=range []struct{url string;want int}{
  {"/api/manage/review-works?state=published&limit=40&offset=4970",5010},
  {"/api/manage/review-works?state=staged&limit=40&offset=4970",5010},
  {"/api/manage/review-works?state=staged&reason=unreviewed",0},
  {"/api/manage/review-works?state=staged&space=Comics",0},
 }{
  code,body,_=call(tc.url)
  if code!=200{t.Fatalf("%s HTTP %d %s",tc.url,code,body)}
  var result struct {Total int `json:"total"`;Works []serverReviewWork `json:"works"`}
  if err=json.Unmarshal(body,&result);err!=nil||result.Total!=tc.want{
   t.Fatalf("wrong complete work totals for %s: %+v %v",tc.url,result,err)
  }
  if tc.want==5010 && len(result.Works)!=40{
   t.Fatalf("large book review page truncated for %s: got %d",tc.url,len(result.Works))
  }
 }
 code,body,_=call("/api/atlas-relationships?kind=genre&value=Mixed+Archive")
 if code!=200{t.Fatalf("large Atlas query HTTP %d %s",code,body)}
 var atlas atlasRelationship
 if err=json.Unmarshal(body,&atlas);err!=nil||atlas.WorkCount!=5010||len(atlas.Works)!=50{
  t.Fatalf("Atlas large-library count/50 work cap incorrect: %+v %v",atlas,err)
 }
 code,body,_=call("/api/works?limit=40&offset=4970")
 if code!=200{t.Fatalf("published Shelf paging at 5k: %d %s",code,body)}
 var works []map[string]any
 if err=json.Unmarshal(body,&works);err!=nil||len(works)!=40{
  t.Fatalf("published Shelf page at 5k truncated: %d %v",len(works),err)
 }
 // Catalogue identity and user metadata must be unchanged by huge read pages.
 var links int
 if err=a.db.QueryRow("SELECT count(*) FROM edition_assets").Scan(&links);err!=nil||links!=count{
  t.Fatalf("large browse altered file-to-edition links: %d %v",links,err)
 }
}
