package main

import (
	"encoding/binary"
	"io"
	"os"
	"strconv"
	"strings"
	"unicode/utf16"
	"unicode/utf8"
)

const maxID3Head = 256 << 10
const maxMP4MetadataChunk = 4 << 20

func audioMetadata(filename string) embeddedMetadata {
	ext:=strings.ToLower(audioFileExt(filename))
	if ext!=".mp3" && ext!=".m4a" && ext!=".m4b" {
		return embeddedMetadata{}
	}
	f, err := os.Open(filename)
	if err != nil { return embeddedMetadata{} }
	defer f.Close()
	info, err := f.Stat()
	if err != nil || !info.Mode().IsRegular() { return embeddedMetadata{} }

	if ext==".m4a" || ext==".m4b" {
		return mp4MetadataFromFile(f,info.Size())
	}

	headSize := int64(maxID3Head)
	if info.Size() < headSize { headSize = info.Size() }
	head := make([]byte, headSize)
	n, _ := io.ReadFull(f, head)
	meta := parseID3v2(head[:n])
	if info.Size() >= 128 && (meta.Title=="" || meta.Author=="" || meta.PublishedYear==0) {
		if _, err = f.Seek(info.Size()-128, io.SeekStart); err == nil {
			tail := make([]byte,128)
			if _, err = io.ReadFull(f,tail); err == nil {
				meta = fillMetadataBlanks(meta, parseID3v1(tail))
			}
		}
	}
	return meta
}

func audioFileExt(filename string) string {
	index := strings.LastIndex(filename, ".")
	if index < 0 { return "" }
	return filename[index:]
}

func mp4MetadataFromFile(f *os.File, size int64) embeddedMetadata {
	readChunk:=func(offset,length int64) []byte {
		if length<=0 { return nil }
		if _,err:=f.Seek(offset,io.SeekStart);err!=nil{return nil}
		data:=make([]byte,length)
		n,_:=io.ReadFull(f,data)
		return data[:n]
	}
	length:=int64(maxMP4MetadataChunk)
	if size<length { length=size }
	meta:=parseMP4Metadata(readChunk(0,length))
	if size>length {
		tailLength:=int64(maxMP4MetadataChunk)
		if size<tailLength { tailLength=size }
		meta=fillMetadataBlanks(meta,parseMP4Metadata(readChunk(size-tailLength,tailLength)))
	}
	return meta
}

func parseMP4Metadata(data []byte) embeddedMetadata {
	if len(data)<16 { return embeddedMetadata{} }
	title:=mp4Text(data,[]byte{0xa9,'n','a','m'})
	album:=mp4Text(data,[]byte{0xa9,'a','l','b'})
	author:=mp4Text(data,[]byte{0xa9,'A','R','T'})
	if author=="" { author=mp4Text(data,[]byte{'a','A','R','T'}) }
	genre:=mp4Text(data,[]byte{0xa9,'g','e','n'})
	date:=mp4Text(data,[]byte{0xa9,'d','a','y'})
	series:=mp4Text(data,[]byte{0xa9,'g','r','p'})
	if title=="" || (genericAudioTrackLabel(title)&&album!="") { title=album }
	return embeddedMetadata{
		Title:cleanMetadata(title), Author:normalizeAuthor(author), Series:cleanMetadata(series),
		Genre:cleanMetadata(genre), PublishedYear:yearFromText(date),
	}
}

func mp4Text(data,name []byte) string {
	payload:=mp4Data(data,name)
	if len(payload)==0 { return "" }
	return cleanMetadata(strings.Trim(string(payload),"\x00 "))
}

func mp4Data(data,name []byte) []byte {
	if len(name)!=4 { return nil }
	for i:=4;i+4<=len(data);i++ {
		if string(data[i:i+4])!=string(name) { continue }
		parentStart:=i-4
		if parentStart+4>len(data){continue}
		parentSize:=int(binary.BigEndian.Uint32(data[parentStart:parentStart+4]))
		if parentSize<16 { continue }
		parentEnd:=parentStart+parentSize
		if parentEnd>len(data) { parentEnd=len(data) }
		for j:=i+4;j+16<=parentEnd;j++ {
			if string(data[j:j+4])!="data" { continue }
			dataStart:=j-4
			dataSize:=int(binary.BigEndian.Uint32(data[dataStart:dataStart+4]))
			if dataSize<16 || dataStart+dataSize>parentEnd { continue }
			return data[j+12:dataStart+dataSize]
		}
	}
	return nil
}

func parseID3v2(data []byte) embeddedMetadata {
	if len(data)<10 || string(data[:3])!="ID3" || (data[3]!=3 && data[3]!=4) {
		return embeddedMetadata{}
	}
	version:=data[3]
	tagSize:=synchsafeID3(data[6:10])
	end:=10+tagSize
	if end>len(data){ end=len(data) }
	meta:=embeddedMetadata{}
	album:=""
	for offset:=10; offset+10<=end; {
		id:=string(data[offset:offset+4])
		if strings.Trim(id,"\x00 ")=="" { break }
		frameSize:=0
		if version==4 { frameSize=synchsafeID3(data[offset+4:offset+8]) } else { frameSize=int(binary.BigEndian.Uint32(data[offset+4:offset+8])) }
		if frameSize<=0 || offset+10+frameSize>end { break }
		frame:=data[offset+10:offset+10+frameSize]
		if len(frame)>0 && strings.HasPrefix(id,"T") {
			if id=="TXXX" {
				description,value:=decodeID3UserText(frame)
				key:=strings.ToLower(strings.NewReplacer(" ","","_","","-","").Replace(description))
				switch key {
				case "narrator","readby","reader":
					if meta.Narrator=="" { meta.Narrator=cleanMetadata(value) }
				case "series","seriesname","collection":
					if meta.Series=="" { meta.Series=cleanMetadata(value) }
				case "seriesnumber","seriesindex","booknumber","volume":
					if meta.SeriesNumber==0 { meta.SeriesNumber=numberFromText(value) }
				case "asin":
					if meta.ASIN=="" { meta.ASIN=normalizeIdentifier(value) }
				case "isbn","isbn10","isbn13":
					if meta.ISBN=="" { meta.ISBN=normalizeIdentifier(value) }
				case "publisher":
					if meta.Publisher=="" { meta.Publisher=cleanMetadata(value) }
				}
			} else {
				value:=cleanMetadata(decodeID3Text(frame))
				switch id {
				case "TIT2": if meta.Title=="" { meta.Title=value }
				case "TALB": if album=="" { album=value }
				case "TPE1": if meta.Author=="" { meta.Author=normalizeAuthor(value) }
				case "TPE2": if meta.Author=="" { meta.Author=normalizeAuthor(value) }
				case "TDRC","TYER": if meta.PublishedYear==0 { meta.PublishedYear=yearFromText(value) }
				case "TCON": if meta.Genre=="" { meta.Genre=value }
				case "TPUB": if meta.Publisher=="" { meta.Publisher=value }
				case "TLAN": if meta.Language=="" { meta.Language=value }
				}
			}
		}
		offset += 10+frameSize
	}
	if album!="" && (meta.Title=="" || genericAudioTrackLabel(meta.Title)) { meta.Title=album }
	return meta
}

func parseID3v1(data []byte) embeddedMetadata {
	if len(data)<128 { return embeddedMetadata{} }
	data=data[len(data)-128:]
	if string(data[:3])!="TAG" { return embeddedMetadata{} }
	return embeddedMetadata{
		Title:cleanMetadata(id3Latin1(data[3:33])),
		Author:normalizeAuthor(id3Latin1(data[33:63])),
		PublishedYear:yearFromText(id3Latin1(data[93:97])),
	}
}

func synchsafeID3(data []byte) int {
	if len(data)<4 { return 0 }
	return (int(data[0]&0x7f)<<21)|(int(data[1]&0x7f)<<14)|(int(data[2]&0x7f)<<7)|int(data[3]&0x7f)
}

func decodeID3Text(frame []byte) string {
	if len(frame)==0 { return "" }
	return decodeID3Encoded(frame[1:],frame[0])
}

func decodeID3UserText(frame []byte)(string,string){
	if len(frame)==0 { return "","" }
	encoding:=frame[0]
	body:=frame[1:]
	step:=1
	index:=-1
	if encoding==1 || encoding==2 {
		step=2
		for i:=0;i+1<len(body);i+=2 { if body[i]==0&&body[i+1]==0 { index=i;break } }
	} else {
		for i,b:=range body { if b==0 { index=i;break } }
	}
	if index<0 { return "",decodeID3Encoded(body,encoding) }
	return decodeID3Encoded(body[:index],encoding),decodeID3Encoded(body[index+step:],encoding)
}

func decodeID3Encoded(data []byte, encoding byte) string {
	switch encoding {
	case 1:
		if len(data)>=2 && data[0]==0xff && data[1]==0xfe { return decodeUTF16ID3(data[2:],binary.LittleEndian) }
		if len(data)>=2 && data[0]==0xfe && data[1]==0xff { return decodeUTF16ID3(data[2:],binary.BigEndian) }
		return decodeUTF16ID3(data,binary.LittleEndian)
	case 2:
		return decodeUTF16ID3(data,binary.BigEndian)
	case 3:
		if utf8.Valid(data) { return strings.Trim(string(data),"\x00") }
		return ""
	default:
		return id3Latin1(data)
	}
}

func decodeUTF16ID3(data []byte, order binary.ByteOrder) string {
	units:=make([]uint16,0,len(data)/2)
	for len(data)>=2 {
		value:=order.Uint16(data[:2]);data=data[2:]
		if value!=0 { units=append(units,value) }
	}
	return string(utf16.Decode(units))
}

func id3Latin1(data []byte) string {
	var b strings.Builder
	for _,value:=range data {
		if value==0 { continue }
		b.WriteRune(rune(value))
	}
	return strings.TrimSpace(b.String())
}

func fillMetadataBlanks(primary, fallback embeddedMetadata) embeddedMetadata {
	if primary.Title=="" { primary.Title=fallback.Title }
	if primary.Author=="" { primary.Author=fallback.Author }
	if primary.Series=="" { primary.Series=fallback.Series }
	if primary.SeriesNumber==0 { primary.SeriesNumber=fallback.SeriesNumber }
	if primary.Genre=="" { primary.Genre=fallback.Genre }
	if primary.PublishedYear==0 { primary.PublishedYear=fallback.PublishedYear }
	if primary.Narrator=="" { primary.Narrator=fallback.Narrator }
	if primary.Publisher=="" { primary.Publisher=fallback.Publisher }
	if primary.ISBN=="" { primary.ISBN=fallback.ISBN }
	if primary.ASIN=="" { primary.ASIN=fallback.ASIN }
	if primary.Language=="" { primary.Language=fallback.Language }
	if primary.Description=="" { primary.Description=fallback.Description }
	return primary
}

func parseID3Number(value string) float64 {
	number,_:=strconv.ParseFloat(strings.TrimSpace(value),64)
	return number
}
