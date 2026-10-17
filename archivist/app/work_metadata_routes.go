package main

import (
 "context"
 "database/sql"
 "errors"
 "net/http"
 "strconv"
 "strings"
)

type workMetaMedia struct{
 book
 EditionID int64 `json:"editionId"`
 Position int `json:"position"`
 RelativePath string `json:"relativePath"`
 SourceID int64 `json:"sourceId"`
}
func readWorkMedia(ctx context.Context,tx *sql.Tx,id int64,limit,offset int)([]workMetaMedia,bool,error){
 rows,err:=tx.QueryContext(ctx,`SELECT e.id,ea.position,a.relative_path,a.source_id,
   a.id,a.title,a.author,a.series,a.series_number,a.genre,a.published_year,
   a.narrator,a.publisher,a.isbn,a.asin,a.language,a.description,a.format,s.space,
   a.available,a.metadata_confidence,a.needs_review,a.review_reason,a.metadata_source
   FROM editions e JOIN edition_assets ea ON ea.edition_id=e.id
   JOIN assets a ON a.id=ea.asset_id JOIN sources s ON s.id=a.source_id
   WHERE e.work_id=? ORDER BY e.id,ea.position,a.id LIMIT ? OFFSET ?`,id,limit+1,offset)
 if err!=nil{return nil,false,err}
 result:=[]workMetaMedia{}
 for rows.Next(){
   var m workMetaMedia
   var confidence int
   if err=rows.Scan(&m.EditionID,&m.Position,&m.RelativePath,&m.SourceID,
      &m.ID,&m.Title,&m.Author,&m.Series,&m.SeriesNumber,&m.Genre,&m.PublishedYear,
      &m.Narrator,&m.Publisher,&m.ISBN,&m.ASIN,&m.Language,&m.Description,&m.Format,
      &m.Space,&m.Available,&confidence,&m.NeedsReview,&m.ReviewReason,&m.MetadataSource);err!=nil{
      rows.Close();return nil,false,err
   }
   switch{case confidence>=85:m.IdentificationConfidence="high";case confidence>=60:m.IdentificationConfidence="medium";default:m.IdentificationConfidence="low"}
   result=append(result,m)
 }
 if err=rows.Err();err!=nil{rows.Close();return nil,false,err}
 rows.Close()
 more:=len(result)>limit
 if more{result=result[:limit]}
 return result,more,nil
}

func workMetaRouteID(w http.ResponseWriter,r *http.Request)(int64,bool){
 if !who(r).Owner{fail(w,403,errors.New("administrator required"));return 0,false}
 id,err:=strconv.ParseInt(r.PathValue("id"),10,64)
 if err!=nil||id<1{fail(w,400,errors.New("invalid work ID"));return 0,false}
 return id,true
}
func workMetaRouteFailure(w http.ResponseWriter,err error){
 if errors.Is(err,sql.ErrNoRows){fail(w,404,errors.New("book not found"));return}
 // Do not echo internal trigger text or storage paths from SQLite failures.
 lower:=strings.ToLower(err.Error())
 for _,sqlPhrase:=range []string{"sql logic","constraint failed","sqlite","database is locked","database is busy","constraint:","trigger"}{
   if strings.Contains(lower,sqlPhrase){fail(w,500,errors.New("book database change failed; no partial update was applied"));return}
 }
 fail(w,409,err)
}

func (a *app)workMetadataRoutes(mux *http.ServeMux){
 mux.HandleFunc("GET /api/manage/works/{id}/metadata",func(w http.ResponseWriter,r *http.Request){
   id,ok:=workMetaRouteID(w,r);if !ok{return}
   tx,err:=a.db.BeginTx(r.Context(),&sql.TxOptions{ReadOnly:true})
   if err!=nil{fail(w,500,err);return}
   defer tx.Rollback()
   state,err:=a.readWorkMeta(r.Context(),tx,id)
   if err!=nil{workMetaRouteFailure(w,err);return}
   if err=tx.Commit();err!=nil{fail(w,500,errors.New("could not read book snapshot"));return}
   reply(w,state)
 })
 mux.HandleFunc("GET /api/manage/works/{id}/media",func(w http.ResponseWriter,r *http.Request){
   id,ok:=workMetaRouteID(w,r);if !ok{return}
   limit,offset,err:=reviewPage(r,60)
   if err!=nil{fail(w,400,err);return}
   tx,err:=a.db.BeginTx(r.Context(),&sql.TxOptions{ReadOnly:true})
   if err!=nil{fail(w,500,errors.New("unable to inspect book editions"));return}
   defer tx.Rollback()
   state,err:=a.readWorkMeta(r.Context(),tx,id)
   if err!=nil{workMetaRouteFailure(w,err);return}
   files,more,err:=readWorkMedia(r.Context(),tx,id,limit,offset)
   if err!=nil{workMetaRouteFailure(w,err);return}
   if err=tx.Commit();err!=nil{fail(w,500,errors.New("book snapshot expired"));return}
   reply(w,map[string]any{"workId":id,"fingerprint":state.Fingerprint,"files":files,
      "limit":limit,"offset":offset,"hasMore":more})
 })
 mux.HandleFunc("GET /api/manage/works/{id}/metadata/history",func(w http.ResponseWriter,r *http.Request){
   id,ok:=workMetaRouteID(w,r);if !ok{return}
   var present int
   if err:=a.db.QueryRowContext(r.Context(),"SELECT count(*) FROM works WHERE id=?",id).Scan(&present);err!=nil{
      fail(w,500,errors.New("history unavailable"));return
   }
   if present==0{fail(w,404,errors.New("book not found"));return}
   events,err:=a.workHistory(r.Context(),id)
   if err!=nil{fail(w,500,errors.New("history unavailable"));return}
   reply(w,map[string]any{"workId":id,"events":events})
 })
 mux.HandleFunc("POST /api/manage/works/{id}/metadata/preview",func(w http.ResponseWriter,r *http.Request){
   id,ok:=workMetaRouteID(w,r);if !ok{return}
   var in workMetaPreviewRequest
   if err:=workMetadataJSON(w,r,&in);err!=nil{fail(w,400,err);return}
   p,err:=a.previewWorkMetadata(r.Context(),id,in)
   if err!=nil{workMetaRouteFailure(w,err);return}
   reply(w,p)
 })
 mux.HandleFunc("POST /api/manage/works/{id}/metadata/apply",func(w http.ResponseWriter,r *http.Request){
   id,ok:=workMetaRouteID(w,r);if !ok{return}
   var in workMetaApplyRequest
   if err:=workMetadataJSON(w,r,&in);err!=nil{fail(w,400,err);return}
   if !in.Confirm||in.Preview.WorkID!=id{fail(w,400,errors.New("confirm the exact previewed book"));return}
   state,err:=a.applyWorkMetadata(r.Context(),in.Preview)
   if err!=nil{workMetaRouteFailure(w,err);return}
   reply(w,state)
 })
 mux.HandleFunc("PUT /api/manage/works/{id}/metadata/fields/{field}",func(w http.ResponseWriter,r *http.Request){
   id,ok:=workMetaRouteID(w,r);if !ok{return}
   name:=r.PathValue("field")
   if !workFieldAllowed(name){fail(w,400,errors.New("unsupported work-level metadata field"));return}
   var in struct{
     Locked *bool `json:"locked"`
     ExpectedRevision *int64 `json:"expectedRevision"`
     ExpectedFingerprint string `json:"expectedFingerprint"`
   }
   if err:=workMetadataJSON(w,r,&in);err!=nil{fail(w,400,err);return}
   if in.Locked==nil||in.ExpectedRevision==nil{fail(w,400,errors.New("lock state and book revision are required"));return}
   state,err:=a.workMetaLock(r.Context(),id,name,*in.Locked,*in.ExpectedRevision,in.ExpectedFingerprint)
   if err!=nil{workMetaRouteFailure(w,err);return}
   reply(w,state)
 })
 mux.HandleFunc("POST /api/manage/works/{id}/metadata/undo-preview",func(w http.ResponseWriter,r *http.Request){
   id,ok:=workMetaRouteID(w,r);if !ok{return}
   p,err:=a.previewWorkUndo(r.Context(),id)
   if err!=nil{workMetaRouteFailure(w,err);return}
   reply(w,p)
 })
 mux.HandleFunc("POST /api/manage/works/{id}/metadata/undo",func(w http.ResponseWriter,r *http.Request){
   id,ok:=workMetaRouteID(w,r);if !ok{return}
   var input workUndoApplyRequest
   if err:=workMetadataJSON(w,r,&input);err!=nil{fail(w,400,err);return}
   if !input.Confirm||input.Preview.WorkID!=id{
     fail(w,400,errors.New("undo requires owner confirmation of the exact saved revision"));return
   }
   state,err:=a.applyWorkUndo(r.Context(),input.Preview)
   if err!=nil{workMetaRouteFailure(w,err);return}
   reply(w,state)
 })
}
