package main

import (
    "archive/tar"
    "archive/zip"
    "bytes"
    "image"
    "image/color"
    "image/jpeg"
    "os"
    "path/filepath"
    "testing"
)

func validArchiveCoverFixture(t *testing.T) []byte {
    t.Helper()
    img := image.NewRGBA(image.Rect(0, 0, 24, 36))
    for y:=0; y<36; y++ {for x:=0; x<24; x++ {img.Set(x,y,color.RGBA{R:95,G:125,B:140,A:255})}}
    var out bytes.Buffer
    if err:=jpeg.Encode(&out,img,&jpeg.Options{Quality:80}); err!=nil {t.Fatal(err)}
    return out.Bytes()
}
type archiveImageFixture struct {name string; data []byte}
func writeCoverZipFixture(t *testing.T,full string,entries []archiveImageFixture) {
    t.Helper()
    f,err:=os.Create(full);if err!=nil{t.Fatal(err)}
    zw:=zip.NewWriter(f)
    for _,entry:=range entries {
        w,err:=zw.Create(entry.name);if err!=nil{t.Fatal(err)}
        if _,err=w.Write(entry.data);err!=nil{t.Fatal(err)}
    }
    if err:=zw.Close();err!=nil{t.Fatal(err)}
    if err:=f.Close();err!=nil{t.Fatal(err)}
}
func writeCoverTarFixture(t *testing.T,full string,entries []archiveImageFixture){
    t.Helper()
    f,err:=os.Create(full);if err!=nil{t.Fatal(err)}
    tw:=tar.NewWriter(f)
    for _,entry:=range entries {
        if err:=tw.WriteHeader(&tar.Header{Name:entry.name,Mode:0600,Size:int64(len(entry.data)),Typeflag:tar.TypeReg});err!=nil{t.Fatal(err)}
        if _,err:=tw.Write(entry.data);err!=nil{t.Fatal(err)}
    }
    if err:=tw.Close();err!=nil{t.Fatal(err)}
    if err:=f.Close();err!=nil{t.Fatal(err)}
}
func TestArchiveCoverSkipsCorruptCandidatesAndPreservesPriority(t *testing.T){
    good:=validArchiveCoverFixture(t)
    bad:=[]byte("bad image bytes that are not actually jpeg")
    cases:=[]struct{
        name,filename,format string
        entries []archiveImageFixture
        tar bool
        wantSuccess bool
    }{
        {"comic zip corrupt first","comic.cbz","Comic",[]archiveImageFixture{{"001.jpg",bad},{"002.jpg",good}},false,true},
        {"comic tar corrupt first","comic.cbt","Comic",[]archiveImageFixture{{"001.jpg",bad},{"002.jpg",good}},true,true},
        {"ebook first cover corrupt","novel.epub","Ebook",[]archiveImageFixture{{"cover-001.jpg",bad},{"cover-002.jpg",good}},false,true},
        {"ebook bad cover then fallback","chapter.epub","Ebook",[]archiveImageFixture{{"cover.jpg",bad},{"images/plate.jpg",good}},false,true},
        {"ebook noncover then valid preferred cover","priority.epub","Ebook",[]archiveImageFixture{{"images/plate.jpg",good},{"cover.jpg",good}},false,true},
        {"comic all malformed","bad.cbz","Comic",[]archiveImageFixture{{"001.jpg",bad},{"002.jpg",bad}},false,false},
        {"tar all malformed","bad.cbt","Comic",[]archiveImageFixture{{"001.jpg",bad},{"002.jpg",bad}},true,false},
    }
    for _,tt:=range cases{
        t.Run(tt.name,func(t *testing.T){
            root:=t.TempDir()
            full:=filepath.Join(root,tt.filename)
            if tt.tar {writeCoverTarFixture(t,full,tt.entries)}else{writeCoverZipFixture(t,full,tt.entries)}
            data,mime,err:=archiveCover(root,tt.filename,tt.format)
            if !tt.wantSuccess {
                if err==nil{t.Fatal("all corrupt images unexpectedly accepted")}
                return
            }
            if err!=nil{t.Fatalf("good cover after broken candidate must still load: %v",err)}
            if mime!="image/jpeg"{t.Fatalf("wrong MIME: %s",mime)}
            cfg,_,err:=image.DecodeConfig(bytes.NewReader(data))
            if err!=nil{t.Fatal(err)}
            if cfg.Width!=24||cfg.Height!=36{t.Fatalf("wrong cover: %dx%d",cfg.Width,cfg.Height)}
        })
    }
}
