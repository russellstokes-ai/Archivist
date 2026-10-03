package main

import (
	"bytes"
	"encoding/binary"
	"os"
	"path/filepath"
	"testing"
)

func id3Syncsafe(n int) []byte {
	return []byte{byte((n>>21)&127),byte((n>>14)&127),byte((n>>7)&127),byte(n&127)}
}

func id3TextFrame(id,value string) []byte {
	data:=append([]byte{3},[]byte(value)...)
	header:=make([]byte,10)
	copy(header[:4],[]byte(id))
	binary.BigEndian.PutUint32(header[4:8],uint32(len(data)))
	return append(header,data...)
}

func id3UserFrame(description,value string) []byte {
	data:=[]byte{3}
	data=append(data,[]byte(description)...)
	data=append(data,0)
	data=append(data,[]byte(value)...)
	header:=make([]byte,10)
	copy(header[:4],[]byte("TXXX"))
	binary.BigEndian.PutUint32(header[4:8],uint32(len(data)))
	return append(header,data...)
}

func TestBoundedMP3ID3Metadata(t *testing.T) {
	frames:=bytes.Join([][]byte{
		id3TextFrame("TIT2","Dune"),
		id3TextFrame("TPE1","Herbert, Frank"),
		id3TextFrame("TDRC","1965"),
		id3TextFrame("TPUB","Chilton"),
		id3TextFrame("TLAN","en"),
		id3UserFrame("Narrator","Simon Vance"),
		id3UserFrame("Series","Dune"),
		id3UserFrame("Series Number","1"),
		id3UserFrame("ASIN","B000000001"),
	},nil)
	tag:=append([]byte{'I','D','3',3,0,0},id3Syncsafe(len(frames))...)
	tag=append(tag,frames...)
	filename:=filepath.Join(t.TempDir(),"book.mp3")
	if err:=os.WriteFile(filename,append(tag,bytes.Repeat([]byte{1},1024)...),0600);err!=nil{t.Fatal(err)}
	meta:=audioMetadata(filename)
	if meta.Title!="Dune" || meta.Author!="Frank Herbert" || meta.Series!="Dune" || meta.SeriesNumber!=1 {
		t.Fatalf("identity=%+v",meta)
	}
	if meta.PublishedYear!=1965 || meta.Publisher!="Chilton" || meta.Language!="en" || meta.Narrator!="Simon Vance" || meta.ASIN!="B000000001" {
		t.Fatalf("details=%+v",meta)
	}
}

func TestID3v1Fallback(t *testing.T) {
	tail:=make([]byte,128)
	copy(tail[:3],[]byte("TAG"))
	copy(tail[3:33],[]byte("Foundation"))
	copy(tail[33:63],[]byte("Asimov, Isaac"))
	copy(tail[93:97],[]byte("1951"))
	filename:=filepath.Join(t.TempDir(),"old.mp3")
	body:=append(bytes.Repeat([]byte{1},256),tail...)
	if err:=os.WriteFile(filename,body,0600);err!=nil{t.Fatal(err)}
	meta:=audioMetadata(filename)
	if meta.Title!="Foundation" || meta.Author!="Isaac Asimov" || meta.PublishedYear!=1951 {
		t.Fatalf("id3v1=%+v",meta)
	}
}
