package main

import (
    "archive/tar"
    "bytes"
    "fmt"
    "image"
    "image/png"
    "net/http"
    "net/http/httptest"
    "os"
    "path/filepath"
    "strings"
    "testing"
)

func TestCBTPageIgnoresArchiveLinkImpostor(t *testing.T) {
    var picture bytes.Buffer
    if err:=png.Encode(&picture,image.NewRGBA(image.Rect(0,0,2,2)));err!=nil{t.Fatal(err)}
    var archive bytes.Buffer
    writer:=tar.NewWriter(&archive)
    if err:=writer.WriteHeader(&tar.Header{
        Name:"001.png",Typeflag:tar.TypeSymlink,Linkname:"/not/a/comic/page",
        Mode:0600,
    });err!=nil{t.Fatal(err)}
    if err:=writer.WriteHeader(&tar.Header{
        Name:"001.png",Typeflag:tar.TypeReg,Mode:0600,Size:int64(picture.Len()),
    });err!=nil{t.Fatal(err)}
    if _,err:=writer.Write(picture.Bytes());err!=nil{t.Fatal(err)}
    if err:=writer.Close();err!=nil{t.Fatal(err)}
    root:=t.TempDir()
    filename:=filepath.Join(root,"Issue.cbt")
    if err:=os.WriteFile(filename,archive.Bytes(),0600);err!=nil{t.Fatal(err)}
    file,err:=os.Open(filename)
    if err!=nil{t.Fatal(err)}
    parts,err:=tarComicParts(file)
    if err!=nil{file.Close();t.Fatal(err)}
    if len(parts)!=1||parts[0]!="001.png"{file.Close();t.Fatalf("unexpected comic pages: %v",parts)}
    page,err:=tarComicEntry(file,parts[0],24<<20)
    file.Close()
    if err!=nil{t.Fatal(err)}
    if !bytes.Equal(page,picture.Bytes()){t.Fatal("page loader selected a TAR link instead of the real image")}

    // The protected reader UI still uses the same authenticated endpoint.
    a:=fixture(t)
    if err:=a.addSource("Comics",root);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    req:=httptest.NewRequest(http.MethodGet,"/api/assets/1/reader/0",nil)
    req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
    response:=httptest.NewRecorder()
    a.routes().ServeHTTP(response,req)
    if response.Code!=http.StatusOK || response.Header().Get("Content-Type")!="image/png" ||
        !bytes.Equal(response.Body.Bytes(),picture.Bytes()){
        t.Fatalf("comic page delivery failed: status=%d type=%q size=%d",response.Code,response.Header().Get("Content-Type"),response.Body.Len())
    }
}

func TestCBTComicDoesNotFollowLinksOrIgnoreMemberCountLimit(t *testing.T) {
    var archive bytes.Buffer
    writer:=tar.NewWriter(&archive)
    for i:=0;i<maxTarComicEntries+1;i++ {
        if err:=writer.WriteHeader(&tar.Header{
            Name:fmt.Sprintf("link-%05d.jpg",i),Typeflag:tar.TypeSymlink,
            Linkname:"/not/an/image",Mode:0600,
        });err!=nil{t.Fatal(err)}
    }
    if err:=writer.Close();err!=nil{t.Fatal(err)}
    filename:=filepath.Join(t.TempDir(),"oversized.cbt")
    if err:=os.WriteFile(filename,archive.Bytes(),0600);err!=nil{t.Fatal(err)}
    file,err:=os.Open(filename);if err!=nil{t.Fatal(err)}
    defer file.Close()
    if _,err:=tarComicParts(file);err==nil || !strings.Contains(err.Error(),"too many entries"){
        t.Fatalf("part list should reject excess TAR members, got %v",err)
    }
    if _,err:=tarComicEntry(file,"missing.jpg",24<<20);err==nil || !strings.Contains(err.Error(),"too many entries"){
        t.Fatalf("page lookup should reject excess TAR members, got %v",err)
    }
}
