package main

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func writeJPEGFixture(t *testing.T, filename string, width, height int) {
	t.Helper()
	img:=image.NewRGBA(image.Rect(0,0,width,height))
	for y:=0;y<height;y++ {
		for x:=0;x<width;x++ {
			img.Set(x,y,color.RGBA{R:uint8(80+x%100),G:uint8(90+y%100),B:130,A:255})
		}
	}
	var buf bytes.Buffer
	if err:=jpeg.Encode(&buf,img,&jpeg.Options{Quality:85});err!=nil{t.Fatal(err)}
	if err:=os.WriteFile(filename,buf.Bytes(),0600);err!=nil{t.Fatal(err)}
}

func TestAssetCoverServesExternalArtwork(t *testing.T) {
	a:=fixture(t)
	root:=t.TempDir()
	if err:=os.WriteFile(filepath.Join(root,"Book.epub"),[]byte("not-an-epub"),0600);err!=nil{t.Fatal(err)}
	writeJPEGFixture(t,filepath.Join(root,"Book.jpg"),80,120)
	if err:=a.addSource("Main",root);err!=nil{t.Fatal(err)}
	if err:=a.scan(1);err!=nil{t.Fatal(err)}

	req:=httptest.NewRequest("GET","/api/assets/1/cover",nil)
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
	res:=httptest.NewRecorder()
	a.routes().ServeHTTP(res,req)

	if res.Code!=http.StatusOK{t.Fatalf("cover status=%d body=%q",res.Code,res.Body.String())}
	if got:=res.Header().Get("Content-Type");got!="image/jpeg"{t.Fatalf("content-type=%q",got)}
	if got:=res.Header().Get("X-Content-Type-Options");got!="nosniff"{t.Fatalf("nosniff=%q",got)}
	if got:=res.Header().Get("Cache-Control");got==""{t.Fatal("cover cache policy missing")}
	cfg,_,err:=image.DecodeConfig(bytes.NewReader(res.Body.Bytes()))
	if err!=nil{t.Fatal(err)}
	if cfg.Width!=80 || cfg.Height!=120{t.Fatalf("cover dimensions=%dx%d",cfg.Width,cfg.Height)}
}

func TestAssetCoverMissingIsClean404(t *testing.T) {
	a:=fixture(t)
	root:=t.TempDir()
	if err:=os.WriteFile(filepath.Join(root,"Book.pdf"),[]byte("pdf"),0600);err!=nil{t.Fatal(err)}
	if err:=a.addSource("Main",root);err!=nil{t.Fatal(err)}
	if err:=a.scan(1);err!=nil{t.Fatal(err)}
	req:=httptest.NewRequest("GET","/api/assets/1/cover",nil)
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
	res:=httptest.NewRecorder()
	a.routes().ServeHTTP(res,req)
	if res.Code!=http.StatusNotFound{t.Fatalf("missing cover status=%d",res.Code)}
}

func TestSafeImageDataDownsizesLargeArtwork(t *testing.T) {
	img:=image.NewRGBA(image.Rect(0,0,900,1200))
	for y:=0;y<1200;y+=20 {
		for x:=0;x<900;x+=20 {
			img.Set(x,y,color.RGBA{R:100,G:120,B:140,A:255})
		}
	}
	var input bytes.Buffer
	if err:=jpeg.Encode(&input,img,&jpeg.Options{Quality:80});err!=nil{t.Fatal(err)}
	data,mime,err:=safeImageData(input.Bytes())
	if err!=nil{t.Fatal(err)}
	if mime!="image/jpeg"{t.Fatalf("mime=%q",mime)}
	cfg,_,err:=image.DecodeConfig(bytes.NewReader(data))
	if err!=nil{t.Fatal(err)}
	if cfg.Width>420 || cfg.Height>640{t.Fatalf("thumbnail too large: %dx%d",cfg.Width,cfg.Height)}
}

func TestAudioEmbeddedCoverReadsM4BArtwork(t *testing.T) {
	root:=t.TempDir()
	img:=image.NewRGBA(image.Rect(0,0,64,96))
	for y:=0;y<96;y++{for x:=0;x<64;x++{img.Set(x,y,color.RGBA{R:120,G:90,B:70,A:255})}}
	var jpegData bytes.Buffer
	if err:=jpeg.Encode(&jpegData,img,&jpeg.Options{Quality:80});err!=nil{t.Fatal(err)}
	dataAtom:=mp4TestAtom([]byte("data"),append(make([]byte,8),jpegData.Bytes()...))
	covr:=mp4TestAtom([]byte("covr"),dataAtom)
	if err:=os.WriteFile(filepath.Join(root,"book.m4b"),covr,0600);err!=nil{t.Fatal(err)}
	data,mime,err:=audioEmbeddedCover(root,"book.m4b")
	if err!=nil{t.Fatal(err)}
	if mime!="image/jpeg"{t.Fatalf("mime=%q",mime)}
	cfg,_,err:=image.DecodeConfig(bytes.NewReader(data));if err!=nil{t.Fatal(err)}
	if cfg.Width!=64||cfg.Height!=96{t.Fatalf("cover dimensions=%dx%d",cfg.Width,cfg.Height)}
}

func TestExternalCoverRecognizesFrontCoverArtwork(t *testing.T) {
	root:=t.TempDir()
	if err:=os.WriteFile(filepath.Join(root,"Book.epub"),[]byte("not-an-epub"),0600);err!=nil{t.Fatal(err)}
	writeJPEGFixture(t,filepath.Join(root,"front-cover.jpg"),72,108)
	data,mime,err:=externalCover(root,"Book.epub")
	if err!=nil{t.Fatal(err)}
	if mime!="image/jpeg"{t.Fatalf("mime=%q",mime)}
	cfg,_,err:=image.DecodeConfig(bytes.NewReader(data));if err!=nil{t.Fatal(err)}
	if cfg.Width!=72||cfg.Height!=108{t.Fatalf("cover dimensions=%dx%d",cfg.Width,cfg.Height)}
}

func TestExternalCoverRejectsAmbiguousGenericArtwork(t *testing.T) {
	root:=t.TempDir()
	if err:=os.WriteFile(filepath.Join(root,"Alpha.epub"),[]byte("a"),0600);err!=nil{t.Fatal(err)}
	if err:=os.WriteFile(filepath.Join(root,"Beta.epub"),[]byte("b"),0600);err!=nil{t.Fatal(err)}
	writeJPEGFixture(t,filepath.Join(root,"cover.jpg"),72,108)
	if _,_,err:=externalCover(root,"Alpha.epub");err==nil{t.Fatal("ambiguous generic artwork must not be assigned across unrelated books")}
}

func TestExternalCoverPrefersExactArtworkOverGeneric(t *testing.T) {
	root:=t.TempDir()
	if err:=os.WriteFile(filepath.Join(root,"Book.epub"),[]byte("book"),0600);err!=nil{t.Fatal(err)}
	writeJPEGFixture(t,filepath.Join(root,"cover.jpg"),70,105)
	writeJPEGFixture(t,filepath.Join(root,"Book.jpg"),80,120)
	data,_,err:=externalCover(root,"Book.epub");if err!=nil{t.Fatal(err)}
	cfg,_,err:=image.DecodeConfig(bytes.NewReader(data));if err!=nil{t.Fatal(err)}
	if cfg.Width!=80||cfg.Height!=120{t.Fatalf("exact artwork did not win: %dx%d",cfg.Width,cfg.Height)}
}
