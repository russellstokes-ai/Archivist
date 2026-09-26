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
