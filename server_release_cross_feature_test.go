package main

import (
 "encoding/json"
 "fmt"
 "net/http"
 "net/http/httptest"
 "os"
 "path/filepath"
 "strings"
 "testing"
)

// Integration acceptance across the *same server instance*: owner creates a
// household User, User sees only permitted published media, streams with range,
// browses Atlas/OPDS and is removed immediately on revoke. No real media.
func TestReleaseCrossFeatureFamilyAtlasOPDSAndStreaming(t *testing.T){
 a:=fixture(t)
 initAllProgressForTest(t,a)
 if err:=a.initMoves();err!=nil{t.Fatal(err)}
 for _,item:=range []struct{space,filename string;data string}{
  {"Family","Sunrise.epub","family ebook content 0123456789"},
  {"Audiobooks","Evening.mp3","night audio content abcdef"},
 }{
  dir:=t.TempDir()
  if err:=os.WriteFile(filepath.Join(dir,item.filename),[]byte(item.data),0600);err!=nil{t.Fatal(err)}
  if err:=a.addSource(item.space,dir);err!=nil{t.Fatal(err)}
 }
 for _,id:=range []int64{1,2}{if err:=a.scan(id);err!=nil{t.Fatal(err)}}
 publishFixtureWorks(t,a)
 if _,err:=a.db.Exec("UPDATE works SET genre='Fiction' WHERE space='Family'");err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("UPDATE works SET genre='Drama' WHERE space='Audiobooks'");err!=nil{t.Fatal(err)}
 owner:=func(method,url,body string)*httptest.ResponseRecorder{
  req:=httptest.NewRequest(method,url,strings.NewReader(body))
  req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
  req.Header.Set("X-Archivist-Action","1")
  rr:=httptest.NewRecorder();a.routes().ServeHTTP(rr,req);return rr
 }
 create:=owner("POST","/api/profiles",`{"name":"Family test"}`)
 if create.Code!=200{t.Fatalf("create family user %d %s",create.Code,create.Body.String())}
 var member struct{ID int64 `json:"id"`;Key string `json:"key"`}
 if err:=json.Unmarshal(create.Body.Bytes(),&member);err!=nil||member.ID<1||member.Key==""{t.Fatalf("invalid family credential: %+v %v",member,err)}
 session,err:=a.newSession(member.Key);if err!=nil{t.Fatal(err)}
 user:=func(method,url,body string)*httptest.ResponseRecorder{
  req:=httptest.NewRequest(method,url,strings.NewReader(body))
  req.AddCookie(&http.Cookie{Name:"archivist_session",Value:session})
  req.Header.Set("X-Archivist-Action","1")
  rr:=httptest.NewRecorder();a.routes().ServeHTTP(rr,req);return rr
 }
 for _,url:=range []string{"/api/works","/api/books","/api/library-summary","/api/sources","/api/atlas-relationships?kind=space&value=Family"}{
  rr:=user("GET",url,"")
  if rr.Code!=200{t.Fatalf("family browse %s returned %d: %s",url,rr.Code,rr.Body.String())}
  if url=="/api/works"&&!strings.Contains(rr.Body.String(),"Sunrise"){
   t.Fatalf("user cannot browse published first library: %s",rr.Body.String())
  }
 }
 atlas:=user("GET","/api/atlas-relationships?kind=genre&value=Fiction","")
 var relationship atlasRelationship
 if err:=json.Unmarshal(atlas.Body.Bytes(),&relationship);err!=nil||relationship.WorkCount!=1{
  t.Fatalf("Atlas and published book identity mismatched: %+v %v",relationship,err)
 }
 basic:=httptest.NewRequest("GET","/api/opds",nil)
 basic.SetBasicAuth("archivist",member.Key)
 feed:=httptest.NewRecorder();a.routes().ServeHTTP(feed,basic)
 if feed.Code!=200||!strings.Contains(feed.Body.String(),"Sunrise")||!strings.Contains(feed.Body.String(),"Evening"){
  t.Fatalf("OPDS household published catalogue mismatch: %d %s",feed.Code,feed.Body.String())
 }
 req:=httptest.NewRequest("GET","/api/assets/2",nil)
 req.AddCookie(&http.Cookie{Name:"archivist_session",Value:session})
 req.Header.Set("Range","bytes=0-4")
 audio:=httptest.NewRecorder();a.routes().ServeHTTP(audio,req)
 if audio.Code!=http.StatusPartialContent||audio.Body.String()!="night"{
  t.Fatalf("User audio range streaming failed: %d %s",audio.Code,audio.Body.String())
 }
 for _,url:=range []string{"/api/profiles","/api/manage/review-works","/api/library-health","/api/manage/operations","/api/file-moves"}{
  rr:=user("GET",url,"")
  if rr.Code!=403{t.Fatalf("family User bypassed owner-only route %s: %d",url,rr.Code)}
 }
 sources:=user("GET","/api/sources","")
 var list []struct{Path,Status string}
 if err:=json.Unmarshal(sources.Body.Bytes(),&list);err!=nil{t.Fatal(err)}
 for _,item:=range list{
  if item.Path!=""||item.Status!=""{t.Fatalf("source root leaked to User: %+v",item)}
 }
 deleted:=owner("DELETE",fmt.Sprintf("/api/profiles/%d",member.ID),"")
 if deleted.Code!=200{t.Fatalf("family revoke failed %d %s",deleted.Code,deleted.Body.String())}
 if rr:=user("GET","/api/works","");rr.Code!=401{
  t.Fatalf("revoked User still has catalogue access: %d",rr.Code)
 }
 denied:=httptest.NewRequest("GET","/api/opds",nil);denied.SetBasicAuth("archivist",member.Key)
 rr:=httptest.NewRecorder();a.routes().ServeHTTP(rr,denied)
 if rr.Code!=401{t.Fatalf("revoked OPDS credential still valid: %d",rr.Code)}
 // Owner work/edition IDs never changed as part of family actions.
 var count int
 if err:=a.db.QueryRow("SELECT count(*) FROM works").Scan(&count);err!=nil||count!=2{
  t.Fatalf("family registration changed catalogue: %d %v",count,err)
 }
}
