package main

import (
    "bytes"
    "encoding/binary"
    "hash/crc32"
    "image"
    "image/color"
    "image/gif"
    "image/png"
    "testing"
)

func TestSafeCoverDimensionsRejectsDecodedRasterBombs(t *testing.T) {
    for _,tt:=range []struct{width,height int;want bool}{
        {0,100,false},
        {100,0,false},
        {-1,20,false},
        {8193,1,false},
        {1,8193,false},
        {4000,3000,true},
        {4001,3000,false},
        {4000,4000,false},
        {420,640,true},
    }{
        got:=safeCoverDimensions(tt.width,tt.height)
        if got!=tt.want {t.Errorf("safeCoverDimensions(%d,%d)=%t want %t",tt.width,tt.height,got,tt.want)}
    }
}

func TestSafeCoverRejectsTinyFileWithHugePNGDimensions(t *testing.T) {
    var source bytes.Buffer
    if err:=png.Encode(&source,image.NewRGBA(image.Rect(0,0,1,1)));err!=nil{t.Fatal(err)}
    original:=source.Bytes()
    if data,mime,err:=safeImageData(original);err!=nil||mime!="image/png"||len(data)==0 {
        t.Fatalf("valid PNG cover should work: mime=%q err=%v",mime,err)
    }
    // Modify IHDR dimensions and repair CRC. The compressed payload is still
    // tiny: only the header claims an enormous allocation.
    malicious:=append([]byte(nil),original...)
    if len(malicious)<33 {t.Fatal("unexpected PNG fixture")}
    binary.BigEndian.PutUint32(malicious[16:20],50000)
    binary.BigEndian.PutUint32(malicious[20:24],50000)
    binary.BigEndian.PutUint32(malicious[29:33],crc32.ChecksumIEEE(malicious[12:29]))
    if _,_,err:=safeImageData(malicious);err==nil{
        t.Fatal("oversized raster declaration was accepted")
    }
}

func TestSafeCoverRejectsHugeGIFLogicalCanvas(t *testing.T) {
    img:=image.NewPaletted(image.Rect(0,0,1,1),color.Palette{color.Black})
    var original bytes.Buffer
    if err:=gif.Encode(&original,img,nil);err!=nil{t.Fatal(err)}
    data,mime,err:=safeImageData(original.Bytes())
    if err!=nil||mime!="image/gif"||len(data)==0{t.Fatalf("valid GIF cover rejected: mime=%q err=%v",mime,err)}
    malicious:=append([]byte(nil),original.Bytes()...)
    if len(malicious)<10{t.Fatal("unexpected GIF fixture")}
    binary.LittleEndian.PutUint16(malicious[6:8],50000)
    binary.LittleEndian.PutUint16(malicious[8:10],50000)
    if _,_,err:=safeImageData(malicious);err==nil{
        t.Fatal("oversized GIF canvas was accepted")
    }
}
