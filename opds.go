package main

import (
	"encoding/xml"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type opdsLink struct {
	Rel string `xml:"rel,attr"`
	Href string `xml:"href,attr"`
	Type string `xml:"type,attr,omitempty"`
	Title string `xml:"title,attr,omitempty"`
}
type opdsAuthor struct { Name string `xml:"name"` }
type opdsEntry struct {
	ID string `xml:"id"`
	Title string `xml:"title"`
	Updated string `xml:"updated"`
	Author *opdsAuthor `xml:"author,omitempty"`
	Content string `xml:"content,omitempty"`
	Links []opdsLink `xml:"link"`
}
type opdsFeed struct {
	XMLName xml.Name `xml:"feed"`
	Xmlns string `xml:"xmlns,attr"`
	ID string `xml:"id"`
	Title string `xml:"title"`
	Updated string `xml:"updated"`
	Links []opdsLink `xml:"link"`
	Entries []opdsEntry `xml:"entry"`
}

func opdsMediaType(format,path string) string {
	switch format {
	case "Ebook": return "application/epub+zip"
	case "PDF": return "application/pdf"
	case "Comic":
		if strings.HasSuffix(strings.ToLower(path),".cbz"){return "application/vnd.comicbook+zip"}
		return "application/octet-stream"
	case "Audio":
		switch strings.ToLower(filepathExt(path)){
		case ".m4b",".m4a": return "audio/mp4"
		case ".flac": return "audio/flac"
		case ".ogg": return "audio/ogg"
		default: return "audio/mpeg"
		}
	}
	return "application/octet-stream"
}
func filepathExt(path string) string {
	if i:=strings.LastIndex(path,".");i>=0{return path[i:]}
	return ""
}

func (a *app) opdsRoutes(mux *http.ServeMux){
	mux.HandleFunc("GET /api/opds",func(w http.ResponseWriter,r *http.Request){
		p:=who(r)
		rows,e:=a.db.Query(`SELECT w.id,w.title,w.author,w.space,a.id,a.title,a.format,a.relative_path
			FROM works w
			JOIN editions ed ON ed.work_id=w.id
			JOIN edition_assets ea ON ea.edition_id=ed.id
			JOIN assets a ON a.id=ea.asset_id
			WHERE a.available=1 AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			ORDER BY lower(w.title),w.id,ea.position LIMIT 1500`,p.Owner,p.ID)
		if e!=nil{fail(w,500,e);return}
		defer rows.Close()
		now:=time.Now().UTC().Format(time.RFC3339)
		feed:=opdsFeed{Xmlns:"http://www.w3.org/2005/Atom",ID:"urn:archivist:catalog",Title:"Archivist Library",Updated:now,Links:[]opdsLink{{Rel:"self",Href:"./opds",Type:"application/atom+xml;profile=opds-catalog"}}}
		byID:=map[int64]int{}
		for rows.Next(){
			var workID,assetID int64
			var title,author,space,assetTitle,format,path string
			if e=rows.Scan(&workID,&title,&author,&space,&assetID,&assetTitle,&format,&path);e!=nil{fail(w,500,e);return}
			index,ok:=byID[workID]
			if !ok{
				if len(feed.Entries)>=200{continue}
				entry:=opdsEntry{ID:fmt.Sprintf("urn:archivist:work:%d",workID),Title:title,Updated:now,Content:strings.TrimSpace(space)}
				if strings.TrimSpace(author)!=""{entry.Author=&opdsAuthor{Name:author}}
				feed.Entries=append(feed.Entries,entry);index=len(feed.Entries)-1;byID[workID]=index
			}
			feed.Entries[index].Links=append(feed.Entries[index].Links,opdsLink{Rel:"http://opds-spec.org/acquisition",Href:fmt.Sprintf("./assets/%d",assetID),Type:opdsMediaType(format,path),Title:assetTitle})
		}
		if e=rows.Err();e!=nil{fail(w,500,e);return}
		w.Header().Set("Content-Type","application/atom+xml; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_,_ = w.Write([]byte(xml.Header))
		if e=xml.NewEncoder(w).Encode(feed);e!=nil{return}
	})
}
