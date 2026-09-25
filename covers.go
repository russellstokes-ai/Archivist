package main

import (
	"archive/tar"
	"archive/zip"
	"bytes"
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

func (a *app) workCover(id string) ([]byte,string,error) {
	var root, rel, format string
	err:=a.db.QueryRow(`SELECT s.path,a.relative_path,a.format FROM works w
		JOIN editions e ON e.work_id=w.id JOIN edition_assets ea ON ea.edition_id=e.id
		JOIN assets a ON a.id=ea.asset_id JOIN sources s ON s.id=a.source_id
		WHERE w.id=? AND a.available=1 ORDER BY e.id,ea.position LIMIT 1`,id).Scan(&root,&rel,&format)
	if err!=nil{return nil,"",err}
	if data,mime,e:=externalCover(root,rel);e==nil{return data,mime,nil}
	if format=="Comic" || format=="Ebook" {
		if data,mime,e:=archiveCover(root,rel,format);e==nil{return data,mime,nil}
	}
	return nil,"",errors.New("cover unavailable")
}

func (a *app) coverRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/works/{id}/cover",func(w http.ResponseWriter,r *http.Request){
		data,mime,err:=a.workCover(r.PathValue("id"))
		if err!=nil { http.NotFound(w,r); return }
		w.Header().Set("Content-Type",mime)
		w.Header().Set("Cache-Control","private, max-age=86400")
		w.Write(data)
	})
}
