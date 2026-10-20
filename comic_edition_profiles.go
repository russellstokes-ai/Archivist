package main

import (
 "context"
 "crypto/hmac"
 "crypto/sha256"
 "database/sql"
 "encoding/hex"
 "encoding/json"
 "errors"
 "math"
 "net/http"
 "strconv"
 "strings"
 "time"
 "unicode"
 "unicode/utf8"
)

// Comic edition profiles are supplementary owner-verified labels on existing
// edition IDs. Neither the scanner nor media files are ever rewritten.
const comicProfilePreviewTTL=10*time.Minute

type comicEditionFields struct {
 Run string `json:"run"`
 Volume string `json:"volume"`
 Issue string `json:"issue"`
 Imprint string `json:"imprint"`
 Variant string `json:"variant"`
 Year string `json:"year"`
 Notes string `json:"notes"`
}
type comicEditionState struct {
 WorkID int64 `json:"workId"`
 EditionID int64 `json:"editionId"`
 WorkFingerprint string `json:"workFingerprint"`
 Revision int64 `json:"revision"`
 Fields comicEditionFields `json:"fields"`
 Stored bool `json:"stored"`
 Files int `json:"files"`
 Available int `json:"available"`
 Editable bool `json:"editable"`
 Warnings []string `json:"warnings"`
}
type comicEditionPreview struct {
 Action string `json:"action"`
 WorkID int64 `json:"workId"`
 EditionID int64 `json:"editionId"`
 ExpectedRevision int64 `json:"expectedRevision"`
 ExpectedWorkFingerprint string `json:"expectedWorkFingerprint"`
 Before comicEditionFields `json:"before"`
 After comicEditionFields `json:"after"`
 Diff []workMetaDiff `json:"diff"`
 HistoryID int64 `json:"historyId,omitempty"`
 ExpiresAt int64 `json:"expiresAt"`
 Receipt string `json:"receipt"`
}
type comicEditionPreviewRequest struct {
 ExpectedRevision int64 `json:"expectedRevision"`
 ExpectedWorkFingerprint string `json:"expectedWorkFingerprint"`
 Fields comicEditionFields `json:"fields"`
}
type comicEditionApplyRequest struct {
 Preview comicEditionPreview `json:"preview"`
 Confirm bool `json:"confirm"`
}
type comicEditionHistoryRecord struct {
 ID int64
 Action string
 RevisionAfter int64
 Before comicEditionFields
 After comicEditionFields
}
func (a *app)initComicEditionProfiles()error{
 _,err:=a.db.Exec(`CREATE TABLE IF NOT EXISTS comic_edition_profiles(
 edition_id INTEGER PRIMARY KEY REFERENCES editions(id) ON DELETE CASCADE,
 work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
 revision INTEGER NOT NULL CHECK(revision>0),
 run TEXT NOT NULL DEFAULT '',
 volume TEXT NOT NULL DEFAULT '',
 issue TEXT NOT NULL DEFAULT '',
 imprint TEXT NOT NULL DEFAULT '',
 variant TEXT NOT NULL DEFAULT '',
 year TEXT NOT NULL DEFAULT '',
 notes TEXT NOT NULL DEFAULT '',
 updated_at INTEGER NOT NULL
 );
 CREATE TABLE IF NOT EXISTS comic_edition_profile_history(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 edition_id INTEGER NOT NULL REFERENCES editions(id) ON DELETE CASCADE,
 work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
 revision_before INTEGER NOT NULL,
 revision_after INTEGER NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('save','undo')),
 before_json TEXT NOT NULL,
 after_json TEXT NOT NULL,
 recorded_at INTEGER NOT NULL
 );
 CREATE INDEX IF NOT EXISTS idx_comic_edition_profile_history
 ON comic_edition_profile_history(edition_id,id DESC);`)
 return err
}
func comicProfileText(value string,limit int,multiline bool)(string,error){
 value=strings.TrimSpace(value)
 if len(value)>limit||!utf8.ValidString(value){return "",errors.New("comic edition field exceeds safe length or invalid UTF-8")}
 for _,ch:=range value{
  if ch==0||unicode.IsControl(ch)&&!(multiline&&(ch=='\n'||ch=='\t')){
   return "",errors.New("comic edition fields may not contain control characters")
  }
 }
 return value,nil
}
func normalizeComicEditionFields(in comicEditionFields)(comicEditionFields,error){
 var out comicEditionFields
 var err error
 if out.Run,err=comicProfileText(in.Run,160,false);err!=nil{return out,err}
 if out.Imprint,err=comicProfileText(in.Imprint,160,false);err!=nil{return out,err}
 if out.Variant,err=comicProfileText(in.Variant,120,false);err!=nil{return out,err}
 if out.Notes,err=comicProfileText(in.Notes,2000,true);err!=nil{return out,err}
 if in.Volume!=""{
  v:=strings.TrimSpace(in.Volume)
  if len(v)>5||strings.Trim(v,"0123456789")!=""{return out,errors.New("volume must be an integer between 0 and 10000")}
  number,e:=strconv.Atoi(v)
  if e!=nil||number<0||number>10000{return out,errors.New("volume must be an integer between 0 and 10000")}
  out.Volume=strconv.Itoa(number)
 }
 if in.Issue!=""{
  v:=strings.TrimSpace(in.Issue)
  if len(v)>12||strings.Trim(v,"0123456789.")!=""||strings.Count(v,".")>1{
   return out,errors.New("issue must be a number with at most three decimal places")
  }
  number,e:=strconv.ParseFloat(v,64)
  if e!=nil||math.IsNaN(number)||math.IsInf(number,0)||number<0||number>100000{
   return out,errors.New("issue must be between 0 and 100000")
  }
  if math.Abs(number*1000-math.Round(number*1000))>0.000001{
   return out,errors.New("issue supports at most three decimal places")
  }
  out.Issue=strconv.FormatFloat(number,'f',-1,64)
 }
 if in.Year!=""{
  v:=strings.TrimSpace(in.Year)
  if len(v)!=4||strings.Trim(v,"0123456789")!=""{return out,errors.New("edition year must be four digits or blank")}
  year,e:=strconv.Atoi(v)
  if e!=nil||year<1000||year>3000{return out,errors.New("edition year must be 1000–3000")}
  out.Year=strconv.Itoa(year)
 }
 return out,nil
}
func comicEditionDiff(before,after comicEditionFields)[]workMetaDiff{
 values:=[][3]string{
  {"run",before.Run,after.Run},{"volume",before.Volume,after.Volume},
  {"issue",before.Issue,after.Issue},{"imprint",before.Imprint,after.Imprint},
  {"variant",before.Variant,after.Variant},{"year",before.Year,after.Year},
  {"notes",before.Notes,after.Notes},
 }
 diff:=[]workMetaDiff{}
 for _,v:=range values{
  if v[1]!=v[2]{diff=append(diff,workMetaDiff{Name:v[0],From:v[1],To:v[2],Source:"owner-verified edition label"})}
 }
 return diff
}
func comicEditionSignature(secret string,p comicEditionPreview)string{
 p.Receipt=""
 data,_:=json.Marshal(p)
 h:=hmac.New(sha256.New,[]byte(secret))
 h.Write(data)
 return hex.EncodeToString(h.Sum(nil))
}
func (a *app)readComicEdition(ctx context.Context,tx *sql.Tx,work workMetaState,editionID int64)(comicEditionState,error){
 out:=comicEditionState{
  WorkID:work.WorkID,EditionID:editionID,
  WorkFingerprint:work.Fingerprint,Warnings:[]string{},
 }
 if editionID<1{return out,errors.New("invalid comic edition")}
 if len(work.Editions)==0{return out,errors.New("book has no comic edition")}
 selected:=false
 for _,ed:=range work.Editions{
  if ed.Format!="Comic"{return out,errors.New("mixed-format book requires separate edition review")}
  if ed.ID==editionID{selected=true}
 }
 if !selected{return out,errors.New("comic edition does not belong to the selected book")}
 var actualWork int64
 var format string
 if err:=tx.QueryRowContext(ctx,"SELECT work_id,format FROM editions WHERE id=?",editionID).Scan(&actualWork,&format);err!=nil{return out,err}
 if actualWork!=work.WorkID||format!="Comic"{return out,errors.New("edition membership or format changed")}
 if err:=tx.QueryRowContext(ctx,`SELECT count(*),COALESCE(sum(CASE WHEN a.available=1 THEN 1 ELSE 0 END),0)
   FROM edition_assets ea JOIN assets a ON a.id=ea.asset_id WHERE ea.edition_id=?`,editionID).
  Scan(&out.Files,&out.Available);err!=nil{return out,err}
 var recordedWork int64
 err:=tx.QueryRowContext(ctx,`SELECT work_id,revision,run,volume,issue,imprint,variant,year,notes
  FROM comic_edition_profiles WHERE edition_id=?`,editionID).
  Scan(&recordedWork,&out.Revision,&out.Fields.Run,&out.Fields.Volume,&out.Fields.Issue,
    &out.Fields.Imprint,&out.Fields.Variant,&out.Fields.Year,&out.Fields.Notes)
 if err!=nil&&!errors.Is(err,sql.ErrNoRows){return out,err}
 if err==nil{
  if recordedWork!=work.WorkID{return out,errors.New("edition profile is bound to another work; manual reconciliation required")}
  out.Stored=true
 }
 if out.Files!=1{out.Warnings=append(out.Warnings,"Only single-file comic editions can be labelled until multi-part identity is verified")}
 if out.Available!=out.Files{out.Warnings=append(out.Warnings,"Original comic file unavailable; review after the mount returns")}
 if work.PublicationState!="staged"{out.Warnings=append(out.Warnings,"Unpublish this book explicitly before editing edition identity")}
 out.Editable=out.Files==1&&out.Available==1&&work.PublicationState=="staged"
 return out,nil
}
func (a *app)comicEditionSnapshot(ctx context.Context,tx *sql.Tx,workID,editionID int64)(comicEditionState,error){
 state,err:=a.readWorkMeta(ctx,tx,workID)
 if err!=nil{return comicEditionState{},err}
 return a.readComicEdition(ctx,tx,state,editionID)
}
func (a *app)previewComicEdition(ctx context.Context,workID,editionID int64,in comicEditionPreviewRequest)(comicEditionPreview,error){
 result:=comicEditionPreview{}
 if in.ExpectedRevision<0||len(in.ExpectedWorkFingerprint)!=64{return result,errors.New("invalid edition revision or work fingerprint")}
 tx,err:=a.db.BeginTx(ctx,&sql.TxOptions{ReadOnly:true})
 if err!=nil{return result,err}
 defer tx.Rollback()
 state,err:=a.comicEditionSnapshot(ctx,tx,workID,editionID)
 if err!=nil{return result,err}
 if !state.Editable{return result,errors.New("edition is published, unavailable or not a single-file comic")}
 if state.Revision!=in.ExpectedRevision||state.WorkFingerprint!=in.ExpectedWorkFingerprint{
  return result,errors.New("comic work or edition changed; reload before editing")
 }
 value,err:=normalizeComicEditionFields(in.Fields)
 if err!=nil{return result,err}
 diff:=comicEditionDiff(state.Fields,value)
 if len(diff)==0{return result,errors.New("no comic edition changes to preview")}
 if err=tx.Commit();err!=nil{return result,err}
 result=comicEditionPreview{Action:"save",WorkID:workID,EditionID:editionID,
  ExpectedRevision:state.Revision,ExpectedWorkFingerprint:state.WorkFingerprint,
  Before:state.Fields,After:value,Diff:diff,ExpiresAt:time.Now().Add(comicProfilePreviewTTL).Unix()}
 result.Receipt=comicEditionSignature(a.token,result)
 return result,nil
}
func latestComicEditionHistory(ctx context.Context,tx *sql.Tx,id int64)(comicEditionHistoryRecord,error){
 var h comicEditionHistoryRecord
 var oldJSON,newJSON string
 err:=tx.QueryRowContext(ctx,`SELECT id,action,revision_after,before_json,after_json
    FROM comic_edition_profile_history WHERE edition_id=? ORDER BY id DESC LIMIT 1`,id).
  Scan(&h.ID,&h.Action,&h.RevisionAfter,&oldJSON,&newJSON)
 if err!=nil{return h,err}
 if err=json.Unmarshal([]byte(oldJSON),&h.Before);err!=nil{return h,err}
 if err=json.Unmarshal([]byte(newJSON),&h.After);err!=nil{return h,err}
 return h,nil
}
func (a *app)previewComicEditionUndo(ctx context.Context,workID,editionID int64)(comicEditionPreview,error){
 result:=comicEditionPreview{}
 tx,err:=a.db.BeginTx(ctx,&sql.TxOptions{ReadOnly:true})
 if err!=nil{return result,err}
 defer tx.Rollback()
 state,err:=a.comicEditionSnapshot(ctx,tx,workID,editionID)
 if err!=nil{return result,err}
 if !state.Editable{return result,errors.New("unpublish and reconnect the single comic file before undoing")}
 history,err:=latestComicEditionHistory(ctx,tx,editionID)
 if err!=nil{return result,errors.New("no last confirmed edition Save is available to undo")}
 if history.Action!="save"||history.RevisionAfter!=state.Revision||history.After!=state.Fields{
  return result,errors.New("edition changed since last Save; undo is unavailable")
 }
 diff:=comicEditionDiff(state.Fields,history.Before)
 if len(diff)==0{return result,errors.New("nothing to undo")}
 if err=tx.Commit();err!=nil{return result,err}
 result=comicEditionPreview{Action:"undo",WorkID:workID,EditionID:editionID,
  ExpectedRevision:state.Revision,ExpectedWorkFingerprint:state.WorkFingerprint,
  Before:state.Fields,After:history.Before,Diff:diff,HistoryID:history.ID,
  ExpiresAt:time.Now().Add(comicProfilePreviewTTL).Unix()}
 result.Receipt=comicEditionSignature(a.token,result)
 return result,nil
}
func (a *app)applyComicEdition(ctx context.Context,p comicEditionPreview)(comicEditionState,error){
 output:=comicEditionState{}
 now:=time.Now().Unix()
 if p.WorkID<1||p.EditionID<1||(p.Action!="save"&&p.Action!="undo")||
  p.ExpectedRevision<0||len(p.ExpectedWorkFingerprint)!=64||now>p.ExpiresAt||
  p.ExpiresAt>now+int64(comicProfilePreviewTTL/time.Second)+60{
  return output,errors.New("invalid or expired comic edition preview")
 }
 signed,err:=hex.DecodeString(p.Receipt)
 digest,_:=hex.DecodeString(comicEditionSignature(a.token,p))
 if err!=nil||!hmac.Equal(signed,digest){return output,errors.New("comic edition preview was altered")}
 value,err:=normalizeComicEditionFields(p.After)
 if err!=nil||value!=p.After{return output,errors.New("comic edition values changed since preview")}
 a.scanMu.Lock()
 defer a.scanMu.Unlock()
 tx,err:=a.db.BeginTx(ctx,nil)
 if err!=nil{return output,err}
 defer tx.Rollback()
 state,err:=a.comicEditionSnapshot(ctx,tx,p.WorkID,p.EditionID)
 if err!=nil{return output,err}
 if !state.Editable{return output,errors.New("edition is published or its original file is unavailable")}
 if state.Revision!=p.ExpectedRevision||state.WorkFingerprint!=p.ExpectedWorkFingerprint||state.Fields!=p.Before{
  return output,errors.New("comic edition or source metadata changed; preview again")
 }
 diff:=comicEditionDiff(state.Fields,value)
 if len(diff)==0||stringJSON(diff)!=stringJSON(p.Diff){
  return output,errors.New("comic edition diff no longer matches the signed preview")
 }
 if p.Action=="save"{
  if p.HistoryID!=0{return output,errors.New("unexpected prior history in Save")}
 }else{
  h,hErr:=latestComicEditionHistory(ctx,tx,p.EditionID)
  if hErr!=nil||h.ID!=p.HistoryID||h.Action!="save"||h.RevisionAfter!=state.Revision||
   h.Before!=value||h.After!=state.Fields{
   return output,errors.New("edition history changed before undo confirmation")
  }
 }
 revision:=state.Revision+1
 if state.Stored{
  result,e:=tx.ExecContext(ctx,`UPDATE comic_edition_profiles SET revision=?,run=?,volume=?,issue=?,
   imprint=?,variant=?,year=?,notes=?,updated_at=? WHERE edition_id=? AND work_id=? AND revision=?`,
   revision,value.Run,value.Volume,value.Issue,value.Imprint,value.Variant,value.Year,value.Notes,now,
   p.EditionID,p.WorkID,state.Revision)
  if e!=nil{return output,e}
  n,e:=result.RowsAffected()
  if e!=nil||n!=1{return output,errors.New("edition revision changed while saving")}
 }else{
  if _,err=tx.ExecContext(ctx,`INSERT INTO comic_edition_profiles(
   edition_id,work_id,revision,run,volume,issue,imprint,variant,year,notes,updated_at)
   VALUES(?,?,?,?,?,?,?,?,?,?,?)`,p.EditionID,p.WorkID,revision,value.Run,value.Volume,
   value.Issue,value.Imprint,value.Variant,value.Year,value.Notes,now);err!=nil{return output,err}
 }
 if _,err=tx.ExecContext(ctx,`INSERT INTO comic_edition_profile_history(
 edition_id,work_id,revision_before,revision_after,action,before_json,after_json,recorded_at)
 VALUES(?,?,?,?,?,?,?,?)`,
  p.EditionID,p.WorkID,state.Revision,revision,p.Action,stringJSON(state.Fields),stringJSON(value),now);err!=nil{
  return output,err
 }
 if _,err=tx.ExecContext(ctx,`DELETE FROM comic_edition_profile_history
 WHERE edition_id=? AND id NOT IN(
  SELECT id FROM comic_edition_profile_history WHERE edition_id=? ORDER BY id DESC LIMIT 25)`,
  p.EditionID,p.EditionID);err!=nil{return output,err}
 output,err=a.comicEditionSnapshot(ctx,tx,p.WorkID,p.EditionID)
 if err!=nil{return output,err}
 if output.Revision!=revision||output.Fields!=value{
  return output,errors.New("saved comic edition identity did not match transaction")
 }
 if err=tx.Commit();err!=nil{return output,err}
 return output,nil
}
func comicEditionID(w http.ResponseWriter,r *http.Request)(int64,bool){
 id,err:=strconv.ParseInt(r.PathValue("edition"),10,64)
 if err!=nil||id<1{fail(w,400,errors.New("invalid comic edition ID"));return 0,false}
 return id,true
}
func (a *app)comicEditionRoutes(mux *http.ServeMux){
 mux.HandleFunc("GET /api/manage/works/{id}/comic-editions",func(w http.ResponseWriter,r *http.Request){
  id,ok:=workMetaRouteID(w,r);if !ok{return}
  tx,err:=a.db.BeginTx(r.Context(),&sql.TxOptions{ReadOnly:true})
  if err!=nil{fail(w,500,errors.New("edition registry unavailable"));return}
  defer tx.Rollback()
  work,err:=a.readWorkMeta(r.Context(),tx,id)
  if err!=nil{workMetaRouteFailure(w,err);return}
  result:=[]comicEditionState{}
  for _,ed:=range work.Editions{
   entry,e:=a.readComicEdition(r.Context(),tx,work,ed.ID)
   if e!=nil{workMetaRouteFailure(w,e);return}
   result=append(result,entry)
  }
  if err=tx.Commit();err!=nil{fail(w,500,errors.New("edition snapshot expired"));return}
  reply(w,map[string]any{"workId":id,"workFingerprint":work.Fingerprint,
   "publicationState":work.PublicationState,"editions":result})
 })
 mux.HandleFunc("POST /api/manage/works/{id}/comic-editions/{edition}/preview",func(w http.ResponseWriter,r *http.Request){
  id,ok:=workMetaRouteID(w,r);if !ok{return}
  ed,ok:=comicEditionID(w,r);if !ok{return}
  var request comicEditionPreviewRequest
  if err:=workMetadataJSON(w,r,&request);err!=nil{fail(w,400,err);return}
  plan,err:=a.previewComicEdition(r.Context(),id,ed,request)
  if err!=nil{workMetaRouteFailure(w,err);return}
  reply(w,plan)
 })
 mux.HandleFunc("POST /api/manage/works/{id}/comic-editions/{edition}/apply",func(w http.ResponseWriter,r *http.Request){
  id,ok:=workMetaRouteID(w,r);if !ok{return}
  ed,ok:=comicEditionID(w,r);if !ok{return}
  var request comicEditionApplyRequest
  if err:=workMetadataJSON(w,r,&request);err!=nil{fail(w,400,err);return}
  if !request.Confirm||request.Preview.WorkID!=id||request.Preview.EditionID!=ed||request.Preview.Action!="save"{
   fail(w,400,errors.New("confirm the exact previewed comic edition"));return
  }
  result,err:=a.applyComicEdition(r.Context(),request.Preview)
  if err!=nil{workMetaRouteFailure(w,err);return}
  reply(w,result)
 })
 mux.HandleFunc("POST /api/manage/works/{id}/comic-editions/{edition}/undo-preview",func(w http.ResponseWriter,r *http.Request){
  id,ok:=workMetaRouteID(w,r);if !ok{return}
  ed,ok:=comicEditionID(w,r);if !ok{return}
  result,err:=a.previewComicEditionUndo(r.Context(),id,ed)
  if err!=nil{workMetaRouteFailure(w,err);return}
  reply(w,result)
 })
 mux.HandleFunc("POST /api/manage/works/{id}/comic-editions/{edition}/undo",func(w http.ResponseWriter,r *http.Request){
  id,ok:=workMetaRouteID(w,r);if !ok{return}
  ed,ok:=comicEditionID(w,r);if !ok{return}
  var request comicEditionApplyRequest
  if err:=workMetadataJSON(w,r,&request);err!=nil{fail(w,400,err);return}
  if !request.Confirm||request.Preview.WorkID!=id||request.Preview.EditionID!=ed||request.Preview.Action!="undo"{
   fail(w,400,errors.New("confirm the exact edition undo preview"));return
  }
  result,err:=a.applyComicEdition(r.Context(),request.Preview)
  if err!=nil{workMetaRouteFailure(w,err);return}
  reply(w,result)
 })
}
// Edition labels never create, delete, reorder or move an original asset.
