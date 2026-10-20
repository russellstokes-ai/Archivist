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

func TestScopedHouseholdGrants(t *testing.T) {
 a:=fixture(t)
 initAllProgressForTest(t,a)
 for i,space:=range []string{"Family","Private"} {
  root:=t.TempDir();if err:=os.WriteFile(filepath.Join(root,space+".mp3"),[]byte("synthetic"),0600);err!=nil{t.Fatal(err)}
  if err:=a.addSource(space,root);err!=nil{t.Fatal(err)}
  if err:=a.scan(int64(i+1));err!=nil{t.Fatal(err)}
 }
 publishFixtureWorks(t,a)
 call:=func(token,method,path,body string)*httptest.ResponseRecorder{
  t.Helper();r:=httptest.NewRequest(method,path,strings.NewReader(body));r.AddCookie(&http.Cookie{Name:"archivist_session",Value:token});r.Header.Set("X-Archivist-Action","1");w:=httptest.NewRecorder();a.routes().ServeHTTP(w,r);return w
 }
 create:=func(body string)(int64,string){
  t.Helper();w:=call("test-key","POST","/api/profiles",body);if w.Code!=200{t.Fatalf("create: %d %s",w.Code,w.Body.String())};var p struct{ID int64;Key string};if err:=json.Unmarshal(w.Body.Bytes(),&p);err!=nil{t.Fatal(err)};return p.ID,p.Key
 }
 count:=func(id int64,want int){t.Helper();var n int;if err:=a.db.QueryRow("SELECT count(*) FROM grants WHERE profile_id=?",id).Scan(&n);err!=nil{t.Fatal(err)};if n!=want{t.Fatalf("profile %d grants=%d want %d",id,n,want)}}
 id,key:=create(`{"name":"Child","spaces":["Family"]}`);count(id,1)
 empty,_:=create(`{"name":"No access","spaces":[]}`);count(empty,0)
 legacy,_:=create(`{"name":"Old APK"}`);count(legacy,2)
 if err:=a.initHousehold();err!=nil{t.Fatal(err)};count(id,1);count(empty,0)
 if err:=a.addSource("New",t.TempDir());err!=nil{t.Fatal(err)};count(id,1);count(empty,0);count(legacy,2)
 path:=fmt.Sprintf("/api/profiles/%d/grants",id)
 session,err:=a.newSession(key);if err!=nil{t.Fatal(err)}
 for _,endpoint:=range []string{"/api/books","/api/works","/api/works?q=Private","/api/opds","/api/sources"} {
  w:=call(session,"GET",endpoint,"")
  if w.Code!=200 || strings.Contains(w.Body.String(),"Private"){t.Fatalf("restricted catalogue %s: %d %s",endpoint,w.Code,w.Body.String())}
 }
 for _,endpoint:=range []string{"/api/assets/2","/api/assets/2/listening","/api/assets/2/listening-progress","/api/assets/2/reading-progress","/api/works/2/tracks","/api/editions/2/progress"} {
  if w:=call(session,"GET",endpoint,"");w.Code!=403{t.Fatalf("restricted content %s: %d %s",endpoint,w.Code,w.Body.String())}
 }
 for _,endpoint:=range []string{"/api/assets/2/listening-progress","/api/assets/2/reading-progress","/api/editions/2/progress"} {
  if w:=call(session,"PUT",endpoint,`{"revision":0}`);w.Code!=403{t.Fatalf("restricted progress %s: %d",endpoint,w.Code)}
 }
 if w:=call(session,"PUT",path,`{"spaces":["Private"]}`);w.Code!=403{t.Fatalf("member grant mutation: %d",w.Code)}
 for _,body:=range []string{`{}`,`{"spaces":null}`,`{"spaces":["Family","missing"]}`} {
  if w:=call("test-key","PUT",path,body);w.Code!=400{t.Fatalf("invalid grants %s: %d %s",body,w.Code,w.Body.String())};count(id,1)
 }
 if w:=call("test-key","PUT",path,`{"spaces":["Private","Private"]}`);w.Code!=200{t.Fatalf("replace: %d %s",w.Code,w.Body.String())};count(id,1)
 if w:=call(session,"GET","/api/sources","");w.Code!=200||strings.Contains(w.Body.String(),"Family")||!strings.Contains(w.Body.String(),"Private"){t.Fatalf("filtered sources: %d %s",w.Code,w.Body.String())}
 var privateAsset int64
 if err:=a.db.QueryRow("SELECT a.id FROM assets a JOIN sources s ON s.id=a.source_id WHERE s.space='Private' LIMIT 1").Scan(&privateAsset);err!=nil{t.Fatal(err)}
 assetPath:=fmt.Sprintf("/api/assets/%d",privateAsset)
 if w:=call(session,"GET",assetPath,"");w.Code!=200{t.Fatalf("granted download: %d %s",w.Code,w.Body.String())}
 if w:=call(session,"GET",assetPath+"/listening-progress","");w.Code!=200{t.Fatalf("granted progress: %d %s",w.Code,w.Body.String())}
 basicOPDS:=func()*httptest.ResponseRecorder{
  r:=httptest.NewRequest("GET","/api/opds",nil);r.SetBasicAuth("archivist",key)
  w:=httptest.NewRecorder();a.routes().ServeHTTP(w,r);return w
 }
 if w:=basicOPDS();w.Code!=200||!strings.Contains(w.Body.String(),"Private"){t.Fatalf("granted Basic OPDS: %d %s",w.Code,w.Body.String())}
 if w:=call("test-key","PUT",fmt.Sprintf("/api/profiles/%d/spaces",id),`{"spaces":[]}`);w.Code!=200{t.Fatalf("legacy update: %d %s",w.Code,w.Body.String())};count(id,0)
 for _,endpoint:=range []string{assetPath,assetPath+"/listening",assetPath+"/listening-progress",assetPath+"/reading-progress"}{
  if w:=call(session,"GET",endpoint,"");w.Code!=403{t.Fatalf("same session after grant removal %s: %d",endpoint,w.Code)}
 }
 if w:=call(session,"PUT",assetPath+"/listening-progress",`{"position":1}`);w.Code!=403{t.Fatalf("same session progress write after removal: %d",w.Code)}
 if w:=basicOPDS();w.Code!=200||strings.Contains(w.Body.String(),"Private"){t.Fatalf("Basic OPDS after removal: %d %s",w.Code,w.Body.String())}
 if w:=call("test-key","GET",fmt.Sprintf("/api/profiles/%d/spaces",id),"");w.Code!=200||strings.TrimSpace(w.Body.String())!="[]"{t.Fatalf("read grants: %d %s",w.Code,w.Body.String())}
 if w:=call("test-key","POST","/api/profiles",`{"name":"Invalid","spaces":["missing"]}`);w.Code!=400{t.Fatalf("unknown creation space: %d",w.Code)}
 var n int;if err:=a.db.QueryRow("SELECT count(*) FROM profiles WHERE name='Invalid'").Scan(&n);err!=nil||n!=0{t.Fatalf("invalid creation persisted: %d %v",n,err)}
}
