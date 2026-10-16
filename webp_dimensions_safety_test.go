package main

import (
    "archive/zip"
    "bytes"
    "encoding/base64"
    "encoding/binary"
    "net/http"
    "net/http/httptest"
    "os"
    "path/filepath"
    "testing"
)

// Real encoded, tiny lossless/lossy/VP8X WebP fixtures. Do not rely only on
// synthetic signatures, since detecting content type alone is insufficient.
var safeWebPFixtures=map[string]string{
    "VP8 ":"UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoCAAMAAUAmJaACdLoB+AADsAD+8ut//NgVzXPv9//S4P0uD9Lg/9KQAAA=",
    "VP8L":"UklGRhwAAABXRUJQVlA4TA8AAAAvAYAAAAcQ/Y/+ByKi/wEA",
    "VP8X":"UklGRj4AAABXRUJQVlA4WAoAAAAIAAAAAQAAAgAAVlA4TA8AAAAvAYAAAAcQ/Y/+ByKi/wEARVhJRgcAAABleGFtcGxlAA==",
}
func webpFixture(t *testing.T,variant string) []byte {
    t.Helper()
    data,e:=base64.StdEncoding.DecodeString(safeWebPFixtures[variant])
    if e!=nil{t.Fatal(e)}
    return data
}
func TestWebPCoverRejectsCompressedCanvasBombsAndMalformedRiff(t *testing.T) {
    for _,kind:=range []string{"VP8 ","VP8L","VP8X"}{
        t.Run(kind+" legitimate",func(t *testing.T){
            b:=webpFixture(t,kind)
            _,mime,e:=safeImageData(b)
            if e!=nil||mime!="image/webp"{t.Fatalf("valid tiny WebP must remain supported: %q %v",mime,e)}
        })
        t.Run(kind+" huge dimensions",func(t *testing.T){
            b:=webpFixture(t,kind)
            switch kind {
            case "VP8 ":
                // Frame width and height: 14-bit dimensions at bytes 26..29.
                binary.LittleEndian.PutUint16(b[26:28],0x3fff)
                binary.LittleEndian.PutUint16(b[28:30],0x3fff)
            case "VP8L":
                // Packed lossless width/height fields after 0x2f signature.
                copy(b[21:25],[]byte{0xff,0xff,0xff,0x0f})
            case "VP8X":
                // 24-bit canvas-minus-one width/height at bytes 24..29.
                copy(b[24:30],[]byte{0xff,0xff,0xff,0xff,0xff,0xff})
            }
            if _,_,e:=safeImageData(b);e==nil{t.Fatalf("oversized %s WebP was passed to clients without memory bounds",kind)}
        })
    }
    malformed:=webpFixture(t,"VP8 ")
    binary.LittleEndian.PutUint32(malformed[4:8],0xffffffff)
    if _,_,e:=safeImageData(malformed);e==nil{t.Fatal("WebP with container length beyond file accepted")}
    truncated:=webpFixture(t,"VP8L")[:22]
    if _,_,e:=safeImageData(truncated);e==nil{t.Fatal("truncated WebP frame accepted")}
}

// Existing CBZ/WebP page serving must reject oversized declared dimensions,
// without touching the scanner, Comic Focus, or the original source media.
func TestWebPComicPageRejectsHugeFrameHeader(t *testing.T){
    picture:=webpFixture(t,"VP8X")
    copy(picture[24:30],[]byte{0xff,0xff,0xff,0xff,0xff,0xff})
    dir:=t.TempDir()
    name:=filepath.Join(dir,"Unsafe.cbz")
    out,e:=os.Create(name);if e!=nil{t.Fatal(e)}
    zw:=zip.NewWriter(out)
    part,e:=zw.Create("001.webp");if e!=nil{t.Fatal(e)}
    if _,e=part.Write(picture);e!=nil{t.Fatal(e)}
    if e=zw.Close();e!=nil{t.Fatal(e)}
    if e=out.Close();e!=nil{t.Fatal(e)}
    a:=fixture(t)
    if e=a.addSource("Comics",dir);e!=nil{t.Fatal(e)}
    if e=a.scan(1);e!=nil{t.Fatal(e)}
    req:=httptest.NewRequest(http.MethodGet,"/api/assets/1/reader/0",nil)
    req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
    response:=httptest.NewRecorder()
    a.routes().ServeHTTP(response,req)
    if response.Code==200{t.Fatal("Comic reader forwarded WebP declared canvas bomb")}
    if bytes.Equal(response.Body.Bytes(),picture){t.Fatal("Unsafe raw WebP bytes were emitted")}
}
