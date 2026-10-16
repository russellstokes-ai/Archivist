package main

import (
    "archive/tar"
    "archive/zip"
    "bytes"
    "encoding/binary"
    "image"
    "image/color"
    "image/gif"
    "net/http"
    "net/http/httptest"
    "os"
    "path/filepath"
    "testing"
)

// Commercial comic compatibility: the server's cover handler already accepts
// GIF bytes. CBZ and CBT archive page APIs must not silently omit valid GIF
// pages or admit oversized declared GIF rasters on a memory-limited Pi.
func comicGifFixture(t *testing.T) []byte {
    t.Helper()
    img:=image.NewPaletted(image.Rect(0,0,2,3),color.Palette{color.Black,color.White})
    img.SetColorIndex(0,0,1)
    var buf bytes.Buffer
    if err:=gif.Encode(&buf,img,nil);err!=nil{t.Fatal(err)}
    return buf.Bytes()
}

func comicGifArchive(t *testing.T,extension string,picture []byte) string {
    t.Helper()
    root:=t.TempDir()
    full:=filepath.Join(root,"Single GIF"+extension)
    out,err:=os.Create(full);if err!=nil{t.Fatal(err)}
    switch extension {
    case ".cbz":
        w:=zip.NewWriter(out)
        entry,err:=w.Create("001.GIF");if err!=nil{t.Fatal(err)}
        if _,err:=entry.Write(picture);err!=nil{t.Fatal(err)}
        if err:=w.Close();err!=nil{t.Fatal(err)}
    case ".cbt":
        w:=tar.NewWriter(out)
        if err:=w.WriteHeader(&tar.Header{Name:"001.GIF",Typeflag:tar.TypeReg,Mode:0600,Size:int64(len(picture))});err!=nil{t.Fatal(err)}
        if _,err:=w.Write(picture);err!=nil{t.Fatal(err)}
        if err:=w.Close();err!=nil{t.Fatal(err)}
    default:
        t.Fatal("unsupported fixture extension")
    }
    if err:=out.Close();err!=nil{t.Fatal(err)}
    return root
}

func TestServerComicGifPagesForZipAndTar(t *testing.T) {
    original:=comicGifFixture(t)
    for _,extension:=range []string{".cbz",".cbt"}{
        t.Run(extension,func(t *testing.T){
            root:=comicGifArchive(t,extension,original)
            a:=fixture(t)
            if err:=a.addSource("Comics",root);err!=nil{t.Fatal(err)}
            if err:=a.scan(1);err!=nil{t.Fatal(err)}
            for _,path:=range []string{"/api/assets/1/reader","/api/assets/1/reader/0"}{
                req:=httptest.NewRequest(http.MethodGet,path,nil)
                req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
                response:=httptest.NewRecorder()
                a.routes().ServeHTTP(response,req)
                if response.Code!=200{
                    t.Fatalf("%s did not read GIF comic %s: HTTP %d: %s",path,extension,response.Code,response.Body.String())
                }
                if path=="/api/assets/1/reader/0"{
                    if response.Header().Get("Content-Type")!="image/gif"{
                        t.Fatalf("GIF MIME wrong: %q",response.Header().Get("Content-Type"))
                    }
                    if !bytes.Equal(response.Body.Bytes(),original){
                        t.Fatal("server altered original GIF media bytes")
                    }
                } else if !bytes.Contains(response.Body.Bytes(),[]byte("Page 1")){
                    t.Fatalf("GIF page missing from comic manifest: %s",response.Body.String())
                }
            }
        })
    }
}

func TestServerComicGifRejectsOversizedCanvas(t *testing.T){
    picture:=append([]byte(nil),comicGifFixture(t)...)
    if len(picture)<10{t.Fatal("unexpected GIF fixture")}
    binary.LittleEndian.PutUint16(picture[6:8],50000)
    binary.LittleEndian.PutUint16(picture[8:10],50000)
    root:=comicGifArchive(t,".cbz",picture)
    a:=fixture(t)
    if err:=a.addSource("Comics",root);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    req:=httptest.NewRequest(http.MethodGet,"/api/assets/1/reader/0",nil)
    req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
    response:=httptest.NewRecorder()
    a.routes().ServeHTTP(response,req)
    if response.Code==200{t.Fatal("Oversized declared GIF dimensions were served to a potentially memory-constrained reader")}
}
