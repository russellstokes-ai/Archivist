package main

import (
 "encoding/json"
 "net/http"
 "net/http/httptest"
 "os"
 "path/filepath"
 "strings"
 "testing"
)

func organiseBatchCall(a *app,path,payload string,owner,action bool)*httptest.ResponseRecorder{
 request:=httptest.NewRequest("POST",path,strings.NewReader(payload))
 if owner{request.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})}
 if action{request.Header.Set("X-Archivist-Action","1")}
 response:=httptest.NewRecorder()
 a.routes().ServeHTTP(response,request)
 return response
}
func TestOrganiseExplicitBatchBoundsAndNoImplicitLibraryPreview(t *testing.T){
 a:=fixture(t)
 if err:=a.initMoves();err!=nil{t.Fatal(err)}
 previewPath:="/api/file-moves/preview-template-batch"
 applyPath:="/api/file-moves/apply-batch"
 tooMany:=make([]string,101)
 for i:=range tooMany{tooMany[i]="1"}
 oversizedPreview:="{\"assets\":["+strings.Join(tooMany,",")+"],\"template\":\"author-title\"}"
 badPreviews:=[]string{
  `{"assets":[],"template":"author-title"}`,
  `{"assets":[1,1],"template":"author-title"}`,
  `{"assets":[-1],"template":"author-title"}`,
  oversizedPreview,
  `{"assets":[1],"template":"author-title","unexpected":true}`,
  `{"assets":[1],"template":"author-title"}{"assets":[1]}`,
 }
 for _,payload:=range badPreviews{
  res:=organiseBatchCall(a,previewPath,payload,true,true)
  if res.Code!=http.StatusBadRequest{
   t.Fatalf("unsafe bulk preview %s accepted: %d %s",payload,res.Code,res.Body.String())
  }
 }
 if got:=a.previewMoveTemplateBatch(nil,"author-title");got.OK!=0||got.Failed!=1||
  !strings.Contains(got.Items[0].Error,"select between 1 and 100"){
  t.Fatalf("direct empty batch must not silently preview 500 files: %+v",got)
 }
 badApply:=[]string{
  `{"ids":[]}`,
  `{"ids":["not-a-server-id"]}`,
  `{"ids":["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]}`,
  `{"ids":["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],"unexpected":1}`,
 }
 for _,payload:=range badApply{
  res:=organiseBatchCall(a,applyPath,payload,true,true)
  if res.Code!=http.StatusBadRequest{
   t.Fatalf("unsafe apply %s accepted: %d %s",payload,res.Code,res.Body.String())
  }
 }
 if got:=a.applyMoveBatch(nil);got.OK!=0||got.Failed!=1{
  t.Fatalf("empty apply must fail closed %+v",got)
 }
 if res:=organiseBatchCall(a,previewPath,`{"assets":[1],"template":"author-title"}`,false,true);
  res.Code!=http.StatusUnauthorized{t.Fatalf("anonymous organiser admitted: %d",res.Code)}
 if res:=organiseBatchCall(a,applyPath,`{"ids":["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]}`,true,false);
  res.Code!=http.StatusForbidden{t.Fatalf("missing action marker admitted: %d",res.Code)}
 var count int
 if err:=a.db.QueryRow("SELECT count(*) FROM file_moves").Scan(&count);err!=nil||count!=0{
  t.Fatalf("invalid batches unexpectedly created move previews: %d %v",count,err)
 }
}
func TestOrganiseBatchedExplicitSingleFileRoundTripRetainsIdentity(t *testing.T){
 a:=fixture(t)
 if err:=a.initMoves();err!=nil{t.Fatal(err)}
 dir:=t.TempDir()
 const before="Archive.epub"
 contents:=[]byte("synthetic media, unchanged")
 if err:=os.WriteFile(filepath.Join(dir,before),contents,0600);err!=nil{t.Fatal(err)}
 if err:=a.addSource("Books",dir);err!=nil{t.Fatal(err)}
 if err:=a.scan(1);err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("UPDATE assets SET title='Archive',author='Author',needs_review=0,metadata_source='manual',metadata_confidence=100 WHERE id=1");err!=nil{t.Fatal(err)}
 request:=organiseBatchCall(a,"/api/file-moves/preview-template-batch",
  `{"assets":[1],"template":"author-title"}`,true,true)
 if request.Code!=200{t.Fatalf("explicit preview HTTP %d %s",request.Code,request.Body.String())}
 var plan fileMoveBatchResult
 if err:=json.Unmarshal(request.Body.Bytes(),&plan);err!=nil{t.Fatal(err)}
 if plan.OK!=1||plan.Failed!=0||len(plan.Items)!=1||plan.Items[0].Status!="ready"||
  plan.Items[0].Move==nil||plan.Items[0].Move.ID==""{
  t.Fatalf("server failed to produce exactly one journaled path preview: %+v",plan)
 }
 move:=plan.Items[0].Move
 if move.From!=before||filepath.ToSlash(move.To)!="Author/Archive.epub"{
  t.Fatalf("unexpected preview source/destination: %+v",move)
 }
 if data,err:=os.ReadFile(filepath.Join(dir,before));err!=nil||string(data)!=string(contents){
  t.Fatalf("preview changed original media: %v %s",err,data)
 }
 payload:=`{"ids":["`+move.ID+`"]}`
 applied:=organiseBatchCall(a,"/api/file-moves/apply-batch",payload,true,true)
 if applied.Code!=200{t.Fatalf("apply HTTP %d %s",applied.Code,applied.Body.String())}
 var result fileMoveBatchResult
 if err:=json.Unmarshal(applied.Body.Bytes(),&result);err!=nil{t.Fatal(err)}
 if result.OK!=1||result.Failed!=0{t.Fatalf("hash-verified apply failed %+v",result)}
 restored,err:=os.ReadFile(filepath.Join(dir,move.To))
 if err!=nil||string(restored)!=string(contents){t.Fatalf("file data changed after move: %v",err)}
 if _,err=os.Stat(filepath.Join(dir,before));!os.IsNotExist(err){t.Fatalf("old source path unexpectedly still present: %v",err)}
 var assetID,workID int64
 if err=a.db.QueryRow("SELECT id FROM assets WHERE relative_path=?",move.To).Scan(&assetID);err!=nil{t.Fatal(err)}
 if err=a.db.QueryRow(`SELECT ed.work_id FROM edition_assets ea JOIN editions ed ON ed.id=ea.edition_id
   WHERE ea.asset_id=?`,assetID).Scan(&workID);err!=nil{t.Fatal(err)}
 if assetID!=1||workID<1{t.Fatalf("organising destroyed stable asset/edition/work identity: %d %d",assetID,workID)}
 undo:=organiseBatchCall(a,"/api/file-moves/"+move.ID+"/undo-preview","",true,true)
 if undo.Code!=200{t.Fatalf("undo-preview HTTP %d %s",undo.Code,undo.Body.String())}
 var reverse fileMove
 if err=json.Unmarshal(undo.Body.Bytes(),&reverse);err!=nil{t.Fatal(err)}
 if reverse.From!=move.To||reverse.To!=move.From||reverse.ID==move.ID{
  t.Fatalf("undo preview is not the exact reverse of the completed move: %+v",reverse)
 }
 if _,err=os.Stat(filepath.Join(dir,move.To));err!=nil{t.Fatalf("undo preview already moved media: %v",err)}
 inverse:=organiseBatchCall(a,"/api/file-moves/"+reverse.ID+"/apply","",true,true)
 if inverse.Code!=200{t.Fatalf("confirmed reverse move rejected: %d %s",inverse.Code,inverse.Body.String())}
 if data,err:=os.ReadFile(filepath.Join(dir,before));err!=nil||string(data)!=string(contents){
  t.Fatalf("undo did not preserve exact bytes and original path: %v",err)
 }
}
