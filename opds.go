package main

import (
    "database/sql"
    "encoding/base64"
    "encoding/json"
    "encoding/xml"
    "errors"
    "fmt"
    "net/http"
    "net/url"
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

const opdsPageWorks=100

// Cursor contains the exact SQL lower(title) sort key, NOT Go's Unicode
// lowercasing (which differs from SQLite), plus the unique work identity.
// It carries no filesystem paths, user identity, secrets or mutable offsets.
type opdsCursor struct {
    Sort string `json:"sort"`
    WorkID int64 `json:"workId"`
}
func parseOPDSCursor(raw string)(opdsCursor,error){
    var value opdsCursor
    if len(raw)>2048{return value,errors.New("invalid OPDS page cursor")}
    b,e:=base64.RawURLEncoding.DecodeString(raw)
    if e!=nil || len(b)>1400 || json.Unmarshal(b,&value)!=nil || value.WorkID<1 || len(value.Sort)>1000 {
        return opdsCursor{},errors.New("invalid OPDS page cursor")
    }
    return value,nil
}
func encodeOPDSCursor(value opdsCursor) string {
    b,_:=json.Marshal(value)
    return base64.RawURLEncoding.EncodeToString(b)
}

func (a *app) opdsRoutes(mux *http.ServeMux){
    mux.HandleFunc("GET /api/opds",func(w http.ResponseWriter,r *http.Request){
        p:=who(r)
        rawCursor:=r.URL.Query().Get("after")
        hasCursor:=rawCursor!=""
        cursor:=opdsCursor{}
        if hasCursor {
            parsed,e:=parseOPDSCursor(rawCursor)
            if e!=nil{fail(w,400,e);return}
            cursor=parsed
        }
        // One read snapshot across work selection and acquisition links means
        // no half-changed album can appear within an individual feed page.
        tx,e:=a.db.BeginTx(r.Context(),&sql.TxOptions{ReadOnly:true})
        if e!=nil{fail(w,500,e);return}
        defer tx.Rollback()
        query:=`SELECT w.id,w.title,w.author,w.space,lower(w.title)
            FROM works w
            WHERE (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
              AND EXISTS (
                SELECT 1 FROM editions ed
                JOIN edition_assets ea ON ea.edition_id=ed.id
                JOIN assets a ON a.id=ea.asset_id
                WHERE ed.work_id=w.id AND a.available=1
              )`
        args:=[]any{p.Owner,p.ID}
        if hasCursor {
            query+=` AND (lower(w.title)>? OR (lower(w.title)=? AND w.id>?))`
            args=append(args,cursor.Sort,cursor.Sort,cursor.WorkID)
        }
        query+=` ORDER BY lower(w.title),w.id LIMIT ?`
        args=append(args,opdsPageWorks+1)
        rows,e:=tx.QueryContext(r.Context(),query,args...)
        if e!=nil{fail(w,500,e);return}
        type row struct {id int64;title,author,space,sort string}
        selected:=[]row{}
        for rows.Next(){
            var item row
            if e=rows.Scan(&item.id,&item.title,&item.author,&item.space,&item.sort);e!=nil{rows.Close();fail(w,500,e);return}
            selected=append(selected,item)
        }
        e=rows.Err()
        rows.Close()
        if e!=nil{fail(w,500,e);return}
        hasMore:=len(selected)>opdsPageWorks
        if hasMore{selected=selected[:opdsPageWorks]}

        now:=time.Now().UTC().Format(time.RFC3339)
        self:="./opds"
        if hasCursor{self+="?after="+url.QueryEscape(rawCursor)}
        feed:=opdsFeed{
            Xmlns:"http://www.w3.org/2005/Atom",
            ID:"urn:archivist:catalog",Title:"Archivist Library",Updated:now,
            Links:[]opdsLink{{Rel:"self",Href:self,Type:"application/atom+xml;profile=opds-catalog"}},
            Entries:make([]opdsEntry,0,len(selected)),
        }
        for _,item:=range selected{
            entry:=opdsEntry{
                ID:fmt.Sprintf("urn:archivist:work:%d",item.id),
                Title:item.title,Updated:now,Content:strings.TrimSpace(item.space),
                Links:[]opdsLink{},
            }
            if strings.TrimSpace(item.author)!=""{entry.Author=&opdsAuthor{Name:item.author}}
            assetRows,err:=tx.QueryContext(r.Context(),`SELECT a.id,a.title,a.format,a.relative_path
                FROM editions ed
                JOIN edition_assets ea ON ea.edition_id=ed.id
                JOIN assets a ON a.id=ea.asset_id
                WHERE ed.work_id=? AND a.available=1
                ORDER BY ed.id,ea.position,a.id`,item.id)
            if err!=nil{fail(w,500,err);return}
            for assetRows.Next(){
                var assetID int64
                var assetTitle,format,path string
                if err=assetRows.Scan(&assetID,&assetTitle,&format,&path);err!=nil{break}
                entry.Links=append(entry.Links,opdsLink{
                    Rel:"http://opds-spec.org/acquisition",
                    Href:fmt.Sprintf("./assets/%d",assetID),
                    Type:opdsMediaType(format,path),Title:assetTitle,
                })
            }
            if err==nil{err=assetRows.Err()}
            assetRows.Close()
            if err!=nil{fail(w,500,err);return}
            feed.Entries=append(feed.Entries,entry)
        }
        if hasMore{
            last:=selected[len(selected)-1]
            feed.Links=append(feed.Links,opdsLink{
                Rel:"next",
                Href:"./opds?after="+url.QueryEscape(encodeOPDSCursor(opdsCursor{Sort:last.sort,WorkID:last.id})),
                Type:"application/atom+xml;profile=opds-catalog",
            })
        }
        w.Header().Set("Content-Type","application/atom+xml; charset=utf-8")
        w.WriteHeader(http.StatusOK)
        _,_ = w.Write([]byte(xml.Header))
        _=xml.NewEncoder(w).Encode(feed)
    })
}
