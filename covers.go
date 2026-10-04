package main

import (
	"archive/tar"
	"archive/zip"
	"bytes"
	"encoding/binary"
	"errors"
	"image"
	"image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

const coverReadLimit = 24 << 20
const audioCoverChunk = 4 << 20

func safeImageData(data []byte) ([]byte, string, error) {
	if len(data) == 0 || len(data) > coverReadLimit {
		return nil, "", errors.New("cover unavailable")
	}
	mime := http.DetectContentType(data)
	switch mime {
	case "image/jpeg", "image/png":
		src, _, err := image.Decode(bytes.NewReader(data))
		if err != nil { return nil, "", err }
		b := src.Bounds()
		w, h := b.Dx(), b.Dy()
		if w <= 420 && h <= 640 {
			return data, mime, nil
		}
		scale := 1.0
		if w > 420 { scale = 420.0 / float64(w) }
		if float64(h)*scale > 640 { scale = 640.0 / float64(h) }
		nw, nh := int(float64(w)*scale), int(float64(h)*scale)
		if nw < 1 { nw = 1 }; if nh < 1 { nh = 1 }
		dst := image.NewRGBA(image.Rect(0,0,nw,nh))
		for y:=0; y<nh; y++ {
			sy := b.Min.Y + y*h/nh
			for x:=0; x<nw; x++ {
				sx := b.Min.X + x*w/nw
				dst.Set(x,y,src.At(sx,sy))
			}
		}
		var out bytes.Buffer
		if err = jpeg.Encode(&out,dst,&jpeg.Options{Quality:82}); err != nil { return nil, "", err }
		return out.Bytes(), "image/jpeg", nil
	case "image/webp", "image/gif":
		return data, mime, nil
	default:
		return nil, "", errors.New("unsupported cover image")
	}
}

func readLimited(f *os.File) ([]byte,error) {
	info, err := f.Stat()
	if err != nil || !info.Mode().IsRegular() || info.Size() <= 0 || info.Size() > coverReadLimit {
		return nil, errors.New("cover unavailable")
	}
	return io.ReadAll(io.LimitReader(f,coverReadLimit+1))
}

func externalCover(root, rel string) ([]byte,string,error) {
	dirRel := filepath.Dir(rel)
	base := strings.TrimSuffix(filepath.Base(rel),filepath.Ext(rel))
	names := []string{"cover.jpg","cover.jpeg","cover.png","cover.webp","folder.jpg","folder.jpeg","folder.png","folder.webp",base+".jpg",base+".png"}
	r, err := os.OpenRoot(root)
	if err != nil { return nil,"",err }
	defer r.Close()
	for _, name := range names {
		candidate := filepath.Join(dirRel,name)
		f, openErr := r.Open(candidate)
		if openErr != nil { continue }
		data, readErr := readLimited(f); f.Close()
		if readErr != nil { continue }
		if thumb,mime,thumbErr:=safeImageData(data);thumbErr==nil{return thumb,mime,nil}
	}
	return nil,"",errors.New("cover not found")
}

func archiveCover(root, rel, format string) ([]byte,string,error) {
	r, err := os.OpenRoot(root)
	if err != nil { return nil,"",err }
	defer r.Close()
	f, err := r.Open(rel)
	if err != nil { return nil,"",err }
	defer f.Close()
	info, err := f.Stat()
	if err != nil { return nil,"",err }
	ext := strings.ToLower(filepath.Ext(rel))
	if format=="Comic" && ext==".cbt" {
		tr:=tar.NewReader(f)
		for {
			h,e:=tr.Next(); if e==io.EOF{break}; if e!=nil{return nil,"",e}
			if h.Typeflag!=tar.TypeReg && h.Typeflag!=tar.TypeRegA{continue}
			switch strings.ToLower(path.Ext(h.Name)){case ".jpg",".jpeg",".png",".webp":
				if h.Size<=0 || h.Size>coverReadLimit{continue}
				data,e:=io.ReadAll(io.LimitReader(tr,coverReadLimit+1)); if e!=nil{continue}
				return safeImageData(data)
			}
		}
		return nil,"",errors.New("cover not found")
	}
	z, err := zip.NewReader(f,info.Size())
	if err != nil { return nil,"",err }
	var fallback *zip.File
	for _, zf := range z.File {
		if zf.FileInfo().IsDir() || zf.UncompressedSize64>coverReadLimit { continue }
		ext:=strings.ToLower(path.Ext(zf.Name))
		if ext!=".jpg" && ext!=".jpeg" && ext!=".png" && ext!=".webp" && ext!=".gif"{continue}
		lower:=strings.ToLower(zf.Name)
		if fallback==nil { fallback=zf }
		if format=="Ebook" && !strings.Contains(lower,"cover"){continue}
		rc,e:=zf.Open(); if e!=nil{continue}
		data,e:=io.ReadAll(io.LimitReader(rc,coverReadLimit+1));rc.Close();if e!=nil{continue}
		return safeImageData(data)
	}
	if fallback!=nil {
		rc,e:=fallback.Open();if e==nil{data,e2:=io.ReadAll(io.LimitReader(rc,coverReadLimit+1));rc.Close();if e2==nil{return safeImageData(data)}}
	}
	return nil,"",errors.New("cover not found")
}

func audioEmbeddedCover(root, rel string) ([]byte,string,error) {
	r,err:=os.OpenRoot(root)
	if err!=nil{return nil,"",err}
	defer r.Close()
	f,err:=r.Open(rel)
	if err!=nil{return nil,"",err}
	defer f.Close()
	info,err:=f.Stat()
	if err!=nil||!info.Mode().IsRegular(){return nil,"",errors.New("cover unavailable")}
	ext:=strings.ToLower(filepath.Ext(rel))
	read:=func(offset,length int64)[]byte{
		if length<=0{return nil}
		if _,e:=f.Seek(offset,io.SeekStart);e!=nil{return nil}
		buf:=make([]byte,length);n,_:=io.ReadFull(f,buf);return buf[:n]
	}
	length:=int64(audioCoverChunk)
	if info.Size()<length{length=info.Size()}
	head:=read(0,length)
	var imageData []byte
	switch ext {
	case ".mp3":
		imageData=id3EmbeddedPicture(head)
	case ".m4a",".m4b":
		imageData=mp4Data(head,[]byte{'c','o','v','r'})
		if len(imageData)==0&&info.Size()>length{
			tailLength:=int64(audioCoverChunk);if info.Size()<tailLength{tailLength=info.Size()}
			imageData=mp4Data(read(info.Size()-tailLength,tailLength),[]byte{'c','o','v','r'})
		}
	default:
		return nil,"",errors.New("cover unavailable")
	}
	if len(imageData)==0{return nil,"",errors.New("cover unavailable")}
	return safeImageData(imageData)
}

func id3EmbeddedPicture(data []byte) []byte {
	if len(data)<10||string(data[:3])!="ID3"||(data[3]!=3&&data[3]!=4){return nil}
	version:=data[3]
	end:=10+synchsafeID3(data[6:10]);if end>len(data){end=len(data)}
	var fallback []byte
	for offset:=10;offset+10<=end;{
		id:=string(data[offset:offset+4])
		if strings.Trim(id,"\x00 ")==""{break}
		frameSize:=0
		if version==4{frameSize=synchsafeID3(data[offset+4:offset+8])}else{frameSize=int(binary.BigEndian.Uint32(data[offset+4:offset+8]))}
		if frameSize<=0||offset+10+frameSize>end{break}
		if id=="APIC"{
			frame:=data[offset+10:offset+10+frameSize]
			if image,pictureType:=parseAPICPicture(frame);len(image)>0{
				if pictureType==3{return image}
				if fallback==nil{fallback=image}
			}
		}
		offset+=10+frameSize
	}
	return fallback
}

func parseAPICPicture(frame []byte)([]byte,byte){
	if len(frame)<6{return nil,0}
	encoding:=frame[0]
	cursor:=1
	mimeEnd:=bytes.IndexByte(frame[cursor:],0);if mimeEnd<0{return nil,0};cursor+=mimeEnd+1
	if cursor>=len(frame){return nil,0}
	pictureType:=frame[cursor];cursor++
	if encoding==1||encoding==2{
		found:=-1
		for i:=cursor;i+1<len(frame);i+=2{if frame[i]==0&&frame[i+1]==0{found=i;break}}
		if found<0{return nil,0};cursor=found+2
	}else{
		descriptionEnd:=bytes.IndexByte(frame[cursor:],0);if descriptionEnd<0{return nil,0};cursor+=descriptionEnd+1
	}
	if cursor>=len(frame)||len(frame)-cursor>coverReadLimit{return nil,0}
	return frame[cursor:],pictureType
}

func (a *app) assetCover(id string) ([]byte,string,error) {
	var root, rel, format string
	err:=a.db.QueryRow(`SELECT s.path,a.relative_path,a.format
		FROM assets a JOIN sources s ON s.id=a.source_id
		WHERE a.id=? AND a.available=1`,id).Scan(&root,&rel,&format)
	if err!=nil{return nil,"",err}
	if data,mime,e:=externalCover(root,rel);e==nil{return data,mime,nil}
	if format=="Audio" { if data,mime,e:=audioEmbeddedCover(root,rel);e==nil{return data,mime,nil} }
	if format=="Comic" || format=="Ebook" {
		if data,mime,e:=archiveCover(root,rel,format);e==nil{return data,mime,nil}
	}
	return nil,"",errors.New("cover unavailable")
}

func (a *app) workCover(id string) ([]byte,string,error) {
	var root, rel, format string
	err:=a.db.QueryRow(`SELECT s.path,a.relative_path,a.format FROM works w
		JOIN editions e ON e.work_id=w.id JOIN edition_assets ea ON ea.edition_id=e.id
		JOIN assets a ON a.id=ea.asset_id JOIN sources s ON s.id=a.source_id
		WHERE w.id=? AND a.available=1 ORDER BY e.id,ea.position LIMIT 1`,id).Scan(&root,&rel,&format)
	if err!=nil{return nil,"",err}
	if data,mime,e:=externalCover(root,rel);e==nil{return data,mime,nil}
	if format=="Audio" { if data,mime,e:=audioEmbeddedCover(root,rel);e==nil{return data,mime,nil} }
	if format=="Comic" || format=="Ebook" {
		if data,mime,e:=archiveCover(root,rel,format);e==nil{return data,mime,nil}
	}
	return nil,"",errors.New("cover unavailable")
}

func writeCoverResponse(w http.ResponseWriter,data []byte,mime string) {
	w.Header().Set("Content-Type",mime)
	w.Header().Set("Cache-Control","private, max-age=86400")
	w.Header().Set("X-Content-Type-Options","nosniff")
	w.Write(data)
}

func (a *app) coverRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/assets/{id}/cover",func(w http.ResponseWriter,r *http.Request){
		data,mime,err:=a.assetCover(r.PathValue("id"))
		if err!=nil { http.NotFound(w,r); return }
		writeCoverResponse(w,data,mime)
	})
	mux.HandleFunc("GET /api/works/{id}/cover",func(w http.ResponseWriter,r *http.Request){
		data,mime,err:=a.workCover(r.PathValue("id"))
		if err!=nil { http.NotFound(w,r); return }
		writeCoverResponse(w,data,mime)
	})
}
