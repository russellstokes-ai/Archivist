package main

import (
    "context"
    "crypto/hmac"
    "crypto/sha256"
    "database/sql"
    "encoding/hex"
    "encoding/json"
    "errors"
    "io"
    "net/http"
    "sort"
    "strconv"
    "strings"
)

// First safe bulk slice deliberately excludes title/author/series/genre:
// changing work identity or Atlas grouping needs a separate relinking/reconcile
// job. These six fields do not alter logical work identity or publication.
type bulkMetadataFields struct {
    Narrator *string `json:"narrator,omitempty"`
    Publisher *string `json:"publisher,omitempty"`
    PublishedYear *int `json:"publishedYear,omitempty"`
    ISBN *string `json:"isbn,omitempty"`
    ASIN *string `json:"asin,omitempty"`
    Language *string `json:"language,omitempty"`
}
func (b bulkMetadataFields) normalized()(bulkMetadataFields,map[string]string,error){
    out:=b
    values:=map[string]string{}
    for _,row:=range []struct{field string;ptr *string;max int}{
        {"narrator",b.Narrator,1000},{"publisher",b.Publisher,1000},
        {"isbn",b.ISBN,100},{"asin",b.ASIN,100},{"language",b.Language,100},
    }{
        if row.ptr==nil{continue}
        value:=strings.TrimSpace(*row.ptr)
        if len(value)>row.max{return out,nil,errors.New(row.field+" is too long")}
        values[row.field]=value
        switch row.field{
        case "narrator":out.Narrator=&value
        case "publisher":out.Publisher=&value
        case "isbn":out.ISBN=&value
        case "asin":out.ASIN=&value
        case "language":out.Language=&value
        }
    }
    if b.PublishedYear!=nil{
        year:=*b.PublishedYear
        if year!=0&&(year<1000||year>3000){return out,nil,errors.New("invalid publication year")}
        values["publishedYear"]=strconv.Itoa(year)
    }
    if len(values)<1||len(values)>4{return out,nil,errors.New("select 1 to 4 bulk fields")}
    return out,values,nil
}
type bulkPreviewRequest struct {
    IDs []int64 `json:"ids"`
    Changes bulkMetadataFields `json:"changes"`
}
type bulkItem struct {
    ID int64 `json:"id"`
    Title string `json:"title"`
    Revision int64 `json:"revision"`
    Digest string `json:"digest"`
    Status string `json:"status"`
    Reason string `json:"reason,omitempty"`
    Diff []bulkFieldDiff `json:"diff"`
}
type bulkFieldDiff struct {
    Name string `json:"name"`
    From string `json:"from"`
    To string `json:"to"`
}
type bulkApplyRequest struct {
    Items []bulkItem `json:"items"`
    Changes bulkMetadataFields `json:"changes"`
    Receipt string `json:"receipt"`
    Confirm bool `json:"confirm"`
}
type bulkAssetSnapshot struct {
    ID,SourceID,Revision int64
    RelativePath,Signature,Source string
    Available,NeedsReview bool
    Value metadataScalars
    Locked map[string]bool
}
type bulkQuerier interface{
    QueryRowContext(context.Context,string,...any)*sql.Row
    QueryContext(context.Context,string,...any)(*sql.Rows,error)
}
func readBulkSnapshot(ctx context.Context,db bulkQuerier,id int64)(bulkAssetSnapshot,error){
    s:=bulkAssetSnapshot{ID:id,Locked:map[string]bool{}}
    err:=db.QueryRowContext(ctx,`SELECT a.source_id,a.relative_path,a.scan_signature,a.metadata_source,
        a.available,a.needs_review,a.title,a.author,a.series,a.series_number,a.genre,
        a.published_year,a.narrator,a.publisher,a.isbn,a.asin,a.language,a.description,
        COALESCE((SELECT revision FROM asset_metadata_revisions v WHERE v.asset_id=a.id),0)
        FROM assets a WHERE a.id=?`,id).Scan(
        &s.SourceID,&s.RelativePath,&s.Signature,&s.Source,&s.Available,&s.NeedsReview,
        &s.Value.Title,&s.Value.Author,&s.Value.Series,&s.Value.SeriesNumber,&s.Value.Genre,
        &s.Value.PublishedYear,&s.Value.Narrator,&s.Value.Publisher,&s.Value.ISBN,&s.Value.ASIN,
        &s.Value.Language,&s.Value.Description,&s.Revision)
    if err!=nil{return s,err}
    rows,err:=db.QueryContext(ctx,"SELECT field FROM asset_field_controls WHERE asset_id=? AND locked=1",id)
    if err!=nil{return s,err}
    for rows.Next(){
        var name string
        if err=rows.Scan(&name);err!=nil{rows.Close();return s,err}
        s.Locked[name]=true
    }
    if err=rows.Err();err!=nil{rows.Close();return s,err}
    rows.Close()
    return s,nil
}
func bulkSnapshotDigest(s bulkAssetSnapshot)string{
    data,_:=json.Marshal(s)
    h:=sha256.Sum256(data)
    return hex.EncodeToString(h[:])
}
func validateBulkIDs(ids []int64) error{
    if len(ids)<1||len(ids)>40{return errors.New("select 1–40 individual files")}
    seen:=map[int64]bool{}
    for _,id:=range ids{
        if id<1||seen[id]{return errors.New("invalid or repeated file ID")}
        seen[id]=true
    }
    return nil
}
func bulkDifferences(s bulkAssetSnapshot,changes map[string]string)(string,string,[]bulkFieldDiff){
    status,reason:="ready",""
    if !s.Available {status="blocked";reason="Source file unavailable"}
    if s.NeedsReview {status="blocked";reason="Complete individual review before bulk editing"}
    values:=s.Value.values()
    differences:=[]bulkFieldDiff{}
    // Stable display and receipt order, never iterate a map for audit/UI.
    for _,name:=range managedMetadataFields{
        target,ok:=changes[name];if !ok||values[name]==target{continue}
        differences=append(differences,bulkFieldDiff{Name:name,From:values[name],To:target})
        if s.Locked[name] {status="blocked";reason="Locked field: "+name}
    }
    if status=="ready"&&len(differences)==0{status="unchanged"}
    return status,reason,differences
}
func bulkReceipt(secret string,items []bulkItem,changes bulkMetadataFields)string{
    // Bind the exact, user-visible preview (titles, values, reasons and
    // version snapshots) to the confirmed apply. A fake payload cannot replace
    // what the administrator reviewed, even when the underlying DB is stable.
    data,_:=json.Marshal(struct{
        Items []bulkItem `json:"items"`
        Changes bulkMetadataFields `json:"changes"`
    }{items,changes})
    mac:=hmac.New(sha256.New,[]byte(secret))
    mac.Write(data)
    return hex.EncodeToString(mac.Sum(nil))
}
func decodeBulkJSON(w http.ResponseWriter,r *http.Request,dst any) error {
    decoder:=json.NewDecoder(http.MaxBytesReader(w,r.Body,32768))
    decoder.DisallowUnknownFields()
    if err:=decoder.Decode(dst);err!=nil{return errors.New("invalid bulk metadata request")}
    var extra any
    if err:=decoder.Decode(&extra);err!=io.EOF{return errors.New("bulk request must be a single JSON object")}
    return nil
}
func (a *app) bulkMetadataRoutes(mux *http.ServeMux){
    mux.HandleFunc("POST /api/manage/bulk-metadata/preview",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator required"));return}
        var input bulkPreviewRequest
        if err:=decodeBulkJSON(w,r,&input);err!=nil{fail(w,400,err);return}
        if err:=validateBulkIDs(input.IDs);err!=nil{fail(w,400,err);return}
        normalized,changes,err:=input.Changes.normalized()
        if err!=nil{fail(w,400,err);return}
        ids:=append([]int64(nil),input.IDs...)
        sort.Slice(ids,func(i,j int)bool{return ids[i]<ids[j]})
        items:=make([]bulkItem,0,len(ids))
        ready:=0
        blocked:=0
        for _,id:=range ids{
            snap,e:=readBulkSnapshot(r.Context(),a.db,id)
            if errors.Is(e,sql.ErrNoRows){fail(w,404,errors.New("one selected file is missing"));return}
            if e!=nil{fail(w,500,e);return}
            status,reason,diff:=bulkDifferences(snap,changes)
            if status=="blocked"{blocked++}
            if status=="ready"{ready++}
            items=append(items,bulkItem{ID:id,Title:snap.Value.Title,Revision:snap.Revision,Digest:bulkSnapshotDigest(snap),Status:status,Reason:reason,Diff:diff})
        }
        receipt:=""
        if blocked==0&&ready>0{receipt=bulkReceipt(a.token,items,normalized)}
        reply(w,map[string]any{"items":items,"changes":normalized,"ready":ready,"blocked":blocked,"receipt":receipt})
    })
    mux.HandleFunc("POST /api/manage/bulk-metadata/apply",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator required"));return}
        var input bulkApplyRequest
        if err:=decodeBulkJSON(w,r,&input);err!=nil{fail(w,400,err);return}
        if !input.Confirm{fail(w,400,errors.New("bulk changes must be explicitly confirmed"));return}
        ids:=make([]int64,0,len(input.Items))
        for _,item:=range input.Items{ids=append(ids,item.ID)}
        if err:=validateBulkIDs(ids);err!=nil{fail(w,400,err);return}
        for i:=1;i<len(ids);i++{if ids[i]<ids[i-1]{fail(w,400,errors.New("bulk items must retain preview order"));return}}
        normalized,changes,err:=input.Changes.normalized()
        if err!=nil{fail(w,400,err);return}
        mac:=bulkReceipt(a.token,input.Items,normalized)
        supplied,err:=hex.DecodeString(input.Receipt)
        expected,_:=hex.DecodeString(mac)
        if err!=nil||len(supplied)!=len(expected)||!hmac.Equal(supplied,expected){
            fail(w,409,errors.New("preview is missing or expired; preview again before applying"));return
        }
        a.scanMu.Lock()
        defer a.scanMu.Unlock()
        tx,err:=a.db.BeginTx(r.Context(),nil)
        if err!=nil{fail(w,500,err);return}
        defer tx.Rollback()
        changed:=0
        old:=make([]bulkAssetSnapshot,len(input.Items))
        updated:=make([]metadataScalars,len(input.Items))
        for i,item:=range input.Items{
            current,e:=readBulkSnapshot(r.Context(),tx,item.ID)
            if e!=nil{fail(w,409,errors.New("a file moved or is missing; preview again"));return}
            if item.Revision!=current.Revision||item.Digest!=bulkSnapshotDigest(current){
                fail(w,409,errors.New("selected metadata changed; preview again"));return
            }
            status,_,delta:=bulkDifferences(current,changes)
            if status!=item.Status||status=="blocked"||len(delta)!=len(item.Diff){
                fail(w,409,errors.New("selected metadata/locks changed; preview again"));return
            }
            if status=="ready"{changed++}
            old[i]=current
            next:=current.Value
            for field,value:=range changes {
                switch field{
                case "narrator":next.Narrator=value
                case "publisher":next.Publisher=value
                case "isbn":next.ISBN=value
                case "asin":next.ASIN=value
                case "language":next.Language=value
                case "publishedYear":next.PublishedYear,_=strconv.Atoi(value)
                }
            }
            updated[i]=next
        }
        if changed==0{fail(w,409,errors.New("no effective changes remain"));return}
        for i,item:=range input.Items{
            if item.Status=="unchanged"{continue}
            before:=old[i]
            rev:=before.Revision
            if err=a.recordMetadataChange(tx,item.ID,&rev,before.Value,updated[i]);err!=nil{
                fail(w,409,errors.New("a field changed or became locked; preview again"));return
            }
            v:=updated[i]
            _,err=tx.ExecContext(r.Context(),`UPDATE assets SET
                narrator=?,publisher=?,published_year=?,isbn=?,asin=?,language=?,
                metadata_source='manual'
                WHERE id=?`,v.Narrator,v.Publisher,v.PublishedYear,v.ISBN,v.ASIN,v.Language,item.ID)
            if err!=nil{fail(w,500,err);return}
        }
        if err=tx.Commit();err!=nil{fail(w,500,err);return}
        reply(w,map[string]any{"ok":true,"updated":changed,"unchanged":len(input.Items)-changed})
    })
}
