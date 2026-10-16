package main

import (
    "bytes"
    "crypto/sha256"
    "database/sql"
    "encoding/hex"
    "errors"
    "image"
    "image/jpeg"
    "io"
    "net/http"
    "strconv"
    "time"
)

const selectedCoverUploadLimit = 4 << 20
const selectedCoverStoredLimit = 256 << 10

func selectedCoverJPEG(raw []byte)([]byte,string,error){
    if len(raw)==0||len(raw)>selectedCoverUploadLimit {
        return nil,"",errors.New("cover upload must be 4 MB or smaller")
    }
    mime:=http.DetectContentType(raw)
    if mime!="image/jpeg"&&mime!="image/png" {
        return nil,"",errors.New("choose a JPEG or PNG cover image")
    }
    // safeImageData bounds decoded pixels and normalises large artwork before
    // we decode a second time for a compact, database-portable JPEG.
    thumbnail,_,err:=safeImageData(raw)
    if err!=nil{return nil,"",err}
    input,_,err:=image.Decode(bytes.NewReader(thumbnail))
    if err!=nil{return nil,"",errors.New("image could not be decoded")}
    bounds:=input.Bounds()
    if bounds.Dx()<1||bounds.Dy()<1||!safeCoverDimensions(bounds.Dx(),bounds.Dy()){
        return nil,"",errors.New("invalid cover dimensions")
    }
    var encoded bytes.Buffer
    if err=jpeg.Encode(&encoded,input,&jpeg.Options{Quality:77});err!=nil{return nil,"",err}
    if encoded.Len()>selectedCoverStoredLimit{
        return nil,"",errors.New("cover remains too large after compression; use a smaller image")
    }
    digest:=sha256.Sum256(encoded.Bytes())
    return encoded.Bytes(),hex.EncodeToString(digest[:]),nil
}

// Uploads are deliberately explicit and owner-only. The original media and
// on-disk covers are untouched; the chosen image stays with SQLite backups.
func (a *app) selectedCoverRoutes(mux *http.ServeMux){
    mux.HandleFunc("POST /api/manage/works/{id}/cover",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator access required"));return}
        id,err:=strconv.ParseInt(r.PathValue("id"),10,64)
        if err!=nil||id<1{fail(w,400,errors.New("invalid book identity"));return}
        raw,err:=io.ReadAll(http.MaxBytesReader(w,r.Body,selectedCoverUploadLimit))
        if err!=nil{fail(w,413,errors.New("cover exceeds the 4 MB upload limit"));return}
        picture,digest,err:=selectedCoverJPEG(raw)
        if err!=nil{fail(w,400,err);return}
        a.scanMu.Lock()
        defer a.scanMu.Unlock()
        tx,err:=a.db.BeginTx(r.Context(),nil)
        if err!=nil{fail(w,500,err);return}
        defer tx.Rollback()
        var exists int
        if err=tx.QueryRowContext(r.Context(),"SELECT count(*) FROM works WHERE id=?",id).Scan(&exists);err!=nil{fail(w,500,err);return}
        if exists!=1{fail(w,404,errors.New("book no longer exists"));return}
        now:=time.Now().Unix()
        if _,err=tx.ExecContext(r.Context(),`INSERT INTO selected_work_covers(work_id,image,mime,digest,updated_at)
            VALUES(? ,?, 'image/jpeg', ?, ?) ON CONFLICT(work_id) DO UPDATE SET
            image=excluded.image,mime=excluded.mime,digest=excluded.digest,updated_at=excluded.updated_at`,
            id,picture,digest,now);err!=nil{fail(w,500,err);return}
        if _,err=tx.ExecContext(r.Context(),`INSERT INTO work_publication(work_id,state,revision,published_at)
            VALUES(?,'staged',1,0) ON CONFLICT(work_id) DO UPDATE
            SET revision=work_publication.revision+1`,id);err!=nil{fail(w,500,err);return}
        if err=tx.Commit();err!=nil{fail(w,500,err);return}
        reply(w,map[string]any{"ok":true,"sha256":digest,"mime":"image/jpeg","bytes":len(picture)})
    })
    mux.HandleFunc("DELETE /api/manage/works/{id}/cover",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator access required"));return}
        id,err:=strconv.ParseInt(r.PathValue("id"),10,64)
        if err!=nil||id<1{fail(w,400,errors.New("invalid book identity"));return}
        a.scanMu.Lock()
        defer a.scanMu.Unlock()
        state,err:=a.publicationFor(id)
        if errors.Is(err,sql.ErrNoRows){fail(w,404,errors.New("book not found"));return}
        if err!=nil{fail(w,500,err);return}
        if state.State=="published"{
            fail(w,409,errors.New("unpublish this book before removing its selected cover"));return
        }
        tx,err:=a.db.BeginTx(r.Context(),nil)
        if err!=nil{fail(w,500,err);return}
        defer tx.Rollback()
        result,err:=tx.ExecContext(r.Context(),"DELETE FROM selected_work_covers WHERE work_id=?",id)
        if err!=nil{fail(w,500,err);return}
        n,_:=result.RowsAffected()
        if n!=1{fail(w,404,errors.New("no selected cover exists"));return}
        if _,err=tx.ExecContext(r.Context(),"UPDATE work_publication SET revision=revision+1 WHERE work_id=?",id);err!=nil{fail(w,500,err);return}
        if err=tx.Commit();err!=nil{fail(w,500,err);return}
        reply(w,map[string]bool{"ok":true})
    })
}
