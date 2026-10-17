package main

import (
    "bytes"
    "encoding/json"
    "image"
    "image/color"
    "image/jpeg"
    "net/http/httptest"
    "os"
    "path/filepath"
    "strconv"
    "strings"
    "testing"
)

func TestSelectedCoverIsOwnerOnlyBoundedAndDurable(t *testing.T){
    a:=fixture(t)
    for _,init:=range []func()error{a.initPreferences,a.initProgress,a.initListening,a.initReader,a.initCompletions}{
        if err:=init();err!=nil{t.Fatal(err)}
    }
    root:=t.TempDir()
    original:=[]byte("synthetic media, no cover")
    if err:=os.WriteFile(filepath.Join(root,"Named.mp3"),original,0600);err!=nil{t.Fatal(err)}
    if err:=a.addSource("Media",root);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    var work,asset int64
    if err:=a.db.QueryRow("SELECT w.id,a.id FROM works w JOIN editions ed ON ed.work_id=w.id JOIN edition_assets ea ON ea.edition_id=ed.id JOIN assets a ON a.id=ea.asset_id").Scan(&work,&asset);err!=nil{t.Fatal(err)}
    bookID:=strconv.FormatInt(work,10)
    endpoint:="/api/manage/works/"+bookID+"/cover"
    img:=image.NewRGBA(image.Rect(0,0,32,48))
    for y:=0;y<48;y++{for x:=0;x<32;x++{img.Set(x,y,color.RGBA{R:41,G:121,B:116,A:255})}}
    var jpegBytes bytes.Buffer
    if err:=jpeg.Encode(&jpegBytes,img,&jpeg.Options{Quality:95});err!=nil{t.Fatal(err)}
    post:=func(body string,key string,marker bool)*httptest.ResponseRecorder{
        return publicationCall(t,a,"POST",endpoint,body,key,marker)
    }
    if response:=post(jpegBytes.String(),"",true);response.Code!=401{t.Fatalf("anonymous cover upload: %d",response.Code)}
    if response:=post(jpegBytes.String(),"test-key",false);response.Code!=403{t.Fatalf("missing CSRF marker: %d",response.Code)}
    if _,err:=a.db.Exec("INSERT INTO profiles(id,name,key_hash,revoked) VALUES(1,'Reader',?,0)",keyHash("reader-secret"));err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec("INSERT INTO grants(profile_id,space) VALUES(1,'Media')");err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec("INSERT INTO sessions(token_hash,profile_id,credential_hash,expires,created) VALUES(?,1,?,9999999999,0)",keyHash("reader-session"),keyHash("reader-secret"));err!=nil{t.Fatal(err)}
    if response:=post(jpegBytes.String(),"reader-session",true);response.Code!=403{t.Fatalf("family user cover upload: %d",response.Code)}
    if response:=post("definitely not an image","test-key",true);response.Code!=400{t.Fatalf("malformed uploaded cover: %d %s",response.Code,response.Body.String())}
    if response:=post(strings.Repeat("A",(4<<20)+1),"test-key",true);response.Code!=413{t.Fatalf("unbounded cover: %d",response.Code)}
    response:=post(jpegBytes.String(),"test-key",true)
    if response.Code!=200{t.Fatalf("valid jpeg not accepted: %d %s",response.Code,response.Body.String())}
    var stored struct{SHA string `json:"sha256"`;Mime string `json:"mime"`;Bytes int `json:"bytes"`}
    if err:=json.Unmarshal(response.Body.Bytes(),&stored);err!=nil{t.Fatal(err)}
    if len(stored.SHA)!=64||stored.Mime!="image/jpeg"||stored.Bytes==0||stored.Bytes>selectedCoverStoredLimit{t.Fatalf("unexpected stored artwork: %+v",stored)}
    if snapshot:=publicationSnapshot(t,a,work);snapshot.State!="staged"||snapshot.Revision!=1{t.Fatalf("cover incorrectly published book: %+v",snapshot)}
    get:=publicationCall(t,a,"GET","/api/works/"+bookID+"/cover","","test-key",false)
    if get.Code!=200||get.Header().Get("Content-Type")!="image/jpeg"||!bytes.Equal(get.Body.Bytes(),jpegBytes.Bytes()){
       // New JPEG is recompressed; compare decoded stored bytes against the
       // authenticated GET result rather than the uploaded source JPEG.
       var selected []byte
       if err:=a.db.QueryRow("SELECT image FROM selected_work_covers WHERE work_id=?",work).Scan(&selected);err!=nil{t.Fatal(err)}
       if get.Code!=200||get.Header().Get("Content-Type")!="image/jpeg"||!bytes.Equal(get.Body.Bytes(),selected){
         t.Fatalf("selected cover not served: %d",get.Code)
       }
    }
    if got:=publicationCall(t,a,"GET","/api/works/"+bookID+"/cover","","reader-session",false);got.Code!=403{
        t.Fatalf("unpublished custom cover disclosed: %d",got.Code)
    }
    if got:=publicationCall(t,a,"DELETE",endpoint,"","test-key",true);got.Code!=200{t.Fatalf("undo selected cover: %d %s",got.Code,got.Body.String())}
    if got:=publicationCall(t,a,"GET","/api/works/"+bookID+"/cover","","test-key",false);got.Code!=404{
        t.Fatalf("fallback incorrectly manufactured after selected cover delete: %d",got.Code)
    }
    response=post(jpegBytes.String(),"test-key",true)
    if response.Code!=200{t.Fatalf("reselect cover: %d %s",response.Code,response.Body.String())}
    if got:=publicationCall(t,a,"PATCH","/api/assets/"+strconv.FormatInt(asset,10)+"/metadata",`{"title":"Named","author":"A Writer"}`,"test-key",true);got.Code!=200{
        t.Fatalf("manual metadata Save: %d %s",got.Code,got.Body.String())
    }
    current:=publicationSnapshot(t,a,work)
    cmd:=`{"action":"publish","confirm":true,"expectedRevision":`+strconv.FormatInt(current.Revision,10)+"}"
    if got:=publicationCall(t,a,"POST","/api/manage/works/"+bookID+"/publication",cmd,"test-key",true);got.Code!=200{
        t.Fatalf("selected cover failed publication: %d %s",got.Code,got.Body.String())
    }
    if got:=publicationCall(t,a,"GET","/api/works","","reader-session",false);got.Code!=200||!strings.Contains(got.Body.String(),stored.SHA){
        t.Fatalf("published work cover revision missing: %d %s",got.Code,got.Body.String())
    }
    if got:=publicationCall(t,a,"DELETE",endpoint,"","test-key",true);got.Code!=409{
        t.Fatalf("published cover could be cleared without unpublishing: %d",got.Code)
    }
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    reopened,err:=openDB(a.dbPath);if err!=nil{t.Fatal(err)}
    defer reopened.Close()
    var imageBytes []byte
    if err:=reopened.QueryRow("SELECT image FROM selected_work_covers WHERE work_id=?",work).Scan(&imageBytes);err!=nil||len(imageBytes)==0{
        t.Fatalf("selected cover did not survive scan/restart: %v",err)
    }
    media,err:=os.ReadFile(filepath.Join(root,"Named.mp3"))
    if err!=nil||!bytes.Equal(media,original){t.Fatal("cover operation changed original media")}
}
