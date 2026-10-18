package main

import (
 "encoding/json"
 "fmt"
 "net/http"
 "net/http/httptest"
 "strings"
 "testing"
)

// Exercises the real owner-only route, including the single SQLite count/page
// snapshot. No filesystem, public provider or scanner is involved.
func TestAssistReviewFilteringCountsLogicalWorksAndPreservesPublication(t *testing.T){
 a:=fixture(t)
 if _,err:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Comics','/offline/comics','Indexed'),(2,'Books','/offline/books','Indexed')");err!=nil{t.Fatal(err)}
 works:=[]struct{
  id int
  title,author,series,genre,space,format string
  published bool
 }{
  {1,"The Flash Vol 1","Comic Creator","The Flash","","Comics","Comic",false},
  {2,"The Flash Vol 2","","The Flash","Action","Comics","Comic",false},
  {3,"Historic Volume","Book Author","","History","Books","Ebook",true},
  {4,"The Flash Omnibus","Comic Creator","The Flash","Action","Comics","Comic",true},
 }
 for _,w:=range works{
  if _,err:=a.db.Exec("INSERT INTO works(id,title,author,series,genre,space) VALUES(?,?,?,?,?,?)",
    w.id,w.title,w.author,w.series,w.genre,w.space);err!=nil{t.Fatal(err)}
  if _,err:=a.db.Exec("INSERT INTO editions(id,work_id,format) VALUES(?,?,?)",w.id,w.id,w.format);err!=nil{t.Fatal(err)}
  sourceID:=1
  if w.space=="Books"{sourceID=2}
  available,review:=1,0
  if w.id==1{review=1}
  if w.id==2{available=0}
  for part:=0;part<2;part++{
   if part==1&&w.id!=1{continue}
   id:=w.id*10+part
   if _,err:=a.db.Exec(`INSERT INTO assets(id,source_id,relative_path,title,author,series,genre,format,available,needs_review)
    VALUES(?,?,?,?,?,?,?,?,?,?)`,id,sourceID,
    fmt.Sprintf("book-%d-part-%d.cbz",w.id,part),w.title,w.author,w.series,w.genre,w.format,available,review);err!=nil{
    t.Fatal(err)
   }
   if _,err:=a.db.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(?,?,?)",id,w.id,part);err!=nil{t.Fatal(err)}
  }
  if w.published{
   if _,err:=a.db.Exec("INSERT INTO work_publication(work_id,state,revision,published_at) VALUES(?,'published',1,1)",w.id);err!=nil{t.Fatal(err)}
  }
 }
 if _,err:=a.db.Exec(`INSERT INTO selected_work_covers(work_id,image,mime,digest,updated_at)
  VALUES(4,?,'image/jpeg',?,1)`,[]byte{0xff,0xd8,0xff,0xd9},strings.Repeat("a",64));err!=nil{t.Fatal(err)}
 query:=func(path string,owner bool)(int,struct{
  Total int `json:"total"`
  Works []serverReviewWork `json:"works"`
  State string `json:"state"`
  Reason string `json:"reason"`
 }){
  t.Helper()
  request:=httptest.NewRequest("GET","/api/manage/review-works"+path,nil)
  if owner{request.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})}
  rec:=httptest.NewRecorder();a.routes().ServeHTTP(rec,request)
  var data struct{
   Total int `json:"total"`
   Works []serverReviewWork `json:"works"`
   State string `json:"state"`
   Reason string `json:"reason"`
  }
  if rec.Code==200{
   if err:=json.Unmarshal(rec.Body.Bytes(),&data);err!=nil{t.Fatal(err)}
   if data.Total<len(data.Works){t.Fatalf("page exceeds total: %+v",data)}
  }
  return rec.Code,data
 }
 checks:=[]struct{
  args string
  ids []int64
  total int
 }{
  {"",[]int64{1,2},2},
  {"?reason=unreviewed",[]int64{1},1},
  {"?reason=missing-genre",[]int64{1},1},
  {"?reason=missing-author",[]int64{2},1},
  {"?reason=unavailable",[]int64{2},1},
  {"?reason=no-selected-cover",[]int64{1,2},2},
  {"?q=Flash",[]int64{1,2},2},
  {"?q=omnibus",[]int64{},0},
  {"?space=Books",[]int64{},0},
  {"?space=Comics&format=Comic",[]int64{1,2},2},
  {"?space=Comics&format=Ebook",[]int64{},0},
  {"?state=published",[]int64{3,4,1,2},4},
  {"?state=published&reason=no-selected-cover",[]int64{3,1,2},3},
  {"?state=published&reason=unreviewed",[]int64{1},1},
  {"?state=published&q=flash&format=Comic",[]int64{4,1,2},3},
  {"?q=flash&limit=1&offset=1",[]int64{2},2},
 }
 for _,tc:=range checks{
  code,result:=query(tc.args,true)
  if code!=200{t.Fatalf("filter %q: code %d",tc.args,code)}
  if result.Total!=tc.total||len(result.Works)!=len(tc.ids){
   t.Fatalf("filter %q wrong total/page: %+v expected %v",tc.args,result,tc.ids)
  }
  for i,id:=range tc.ids{
   if result.Works[i].ID!=id{t.Fatalf("filter %q: work[%d]=%d want %d",tc.args,i,result.Works[i].ID,id)}
  }
 }
 for _,bad:=range []string{
  "?reason=malicious","?format=Unsupported","?state=everything",
  "?q="+strings.Repeat("x",121),"?space="+strings.Repeat("y",101),
 }{
  if code,_:=query(bad,true);code!=400{t.Fatalf("invalid filter %q returned %d",bad,code)}
 }
 if code,_:=query("?reason=missing-genre",false);code!=http.StatusUnauthorized{
  t.Fatalf("anonymous review-filter request accepted: %d",code)
 }
 var count int
 if err:=a.db.QueryRow("SELECT count(*) FROM edition_assets").Scan(&count);err!=nil||count!=5{
  t.Fatalf("read-only review filters mutated original file grouping: %d %v",count,err)
 }
}
