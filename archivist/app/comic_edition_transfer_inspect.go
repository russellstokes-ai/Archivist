package main

import (
 "context"
 "crypto/hmac"
 "crypto/sha256"
 "database/sql"
 "encoding/hex"
 "encoding/json"
 "errors"
 "fmt"
 "math"
 "net/http"
 "strings"
 "time"
)

// The preview is deliberately non-mutating. Reassignment is NOT permitted by
// this endpoint: ownership and progress conflicts need an explicit contract.
const comicTransferPreviewTTL = 10*time.Minute
const comicTransferMaxTargetEditions = 40

type comicTransferRequest struct {
 SourceWorkID int64 `json:"sourceWorkId"`
 TargetWorkID int64 `json:"targetWorkId"`
 EditionID int64 `json:"editionId"`
 ExpectedSourceFingerprint string `json:"expectedSourceFingerprint"`
}

type comicTransferFinding struct {
 Code string `json:"code"`
 Explanation string `json:"explanation"`
}
type comicTransferWork struct {
 WorkID int64 `json:"workId"`
 Title string `json:"title"`
 Space string `json:"space"`
 Automatic bool `json:"automatic"`
 PublicationState string `json:"publicationState"`
 Fingerprint string `json:"fingerprint"`
 Files int `json:"files"`
 Editions int `json:"editions"`
}
type comicTransferMember struct {
 AssetID int64 `json:"assetId"`
 Title string `json:"title"`
 Issue float64 `json:"issue"`
 Year int `json:"year"`
 Available bool `json:"available"`
 NeedsReview bool `json:"needsReview"`
 SourceID int64 `json:"sourceId"`
}
type comicTransferPreview struct {
 Source comicTransferWork `json:"source"`
 Target comicTransferWork `json:"target"`
 EditionID int64 `json:"editionId"`
 Member comicTransferMember `json:"member"`
 Blockers []comicTransferFinding `json:"blockers"`
 Warnings []comicTransferFinding `json:"warnings"`
 PreflightClear bool `json:"preflightClear"`
 ReadOnly bool `json:"readOnly"`
 ExpiresAt int64 `json:"expiresAt"`
 Receipt string `json:"receipt,omitempty"`
}
func comicTransferWorkInfo(s workMetaState)comicTransferWork{
 return comicTransferWork{WorkID:s.WorkID,Title:s.Title,Space:s.Space,
  Automatic:s.Auto,PublicationState:s.PublicationState,Fingerprint:s.Fingerprint,
  Files:s.Files,Editions:len(s.Editions)}
}
func comicTransferReceipt(secret string,p comicTransferPreview)string{
 p.Receipt=""
 raw,_:=json.Marshal(p)
 mac:=hmac.New(sha256.New,[]byte(secret))
 mac.Write(raw)
 return hex.EncodeToString(mac.Sum(nil))
}
func comicTransferTableExists(ctx context.Context,tx *sql.Tx,table string)(bool,error){
 var n int
 err:=tx.QueryRowContext(ctx,`SELECT count(*) FROM sqlite_master
    WHERE type='table' AND name=?`,table).Scan(&n)
 return n==1,err
}
// Never accept identifiers from HTTP as table/column names. This helper is
// called only with the literal inventory below.
func comicTransferCount(ctx context.Context,tx *sql.Tx,table,column string,id int64)(int,error){
 exists,err:=comicTransferTableExists(ctx,tx,table)
 if err!=nil||!exists{return 0,err}
 var n int
 err=tx.QueryRowContext(ctx,"SELECT count(*) FROM "+table+" WHERE "+column+"=?",id).Scan(&n)
 return n,err
}
func (a *app)inspectComicEditionTransfer(ctx context.Context,in comicTransferRequest)(comicTransferPreview,error){
 p:=comicTransferPreview{Blockers:[]comicTransferFinding{},Warnings:[]comicTransferFinding{},ReadOnly:true}
 if in.SourceWorkID<=0||in.TargetWorkID<=0||in.EditionID<=0||
    in.SourceWorkID==in.TargetWorkID||len(in.ExpectedSourceFingerprint)!=64{
  return p,errors.New("select two different works, one edition and the exact current source fingerprint")
 }
 tx,err:=a.db.BeginTx(ctx,&sql.TxOptions{ReadOnly:true})
 if err!=nil{return p,err}
 defer tx.Rollback()
 source,err:=a.readWorkMeta(ctx,tx,in.SourceWorkID)
 if err!=nil{return p,err}
 target,err:=a.readWorkMeta(ctx,tx,in.TargetWorkID)
 if err!=nil{return p,err}
 if source.Fingerprint!=in.ExpectedSourceFingerprint{
  return p,errors.New("source book changed; reload and inspect again")
 }
 p.Source,p.Target=comicTransferWorkInfo(source),comicTransferWorkInfo(target)
 p.EditionID=in.EditionID
 add:=func(code,reason string){p.Blockers=append(p.Blockers,comicTransferFinding{code,reason})}
 warn:=func(code,reason string){p.Warnings=append(p.Warnings,comicTransferFinding{code,reason})}
 if source.Auto||target.Auto{add("automatic-work","Both works must be explicit/manual. The automatic scanner could rebuild an inferred work.")}
 if source.Space!=target.Space{add("cross-library","Works belong to different library spaces or family grants.")}
 if source.PublicationState!="staged"||target.PublicationState!="staged"{
  add("published-work","Both works must be explicitly staged/unpublished before ownership changes.")
 }
 if source.PublicationRevision>1||target.PublicationRevision>1{
  add("publication-history","One of the works has prior publication transitions; retain its original publication provenance.")
 }
 if len(source.Editions)<2{
  add("source-empty","Source work must retain at least one independent edition; deleting or orphaning the work is not permitted.")
 }
 if len(target.Editions)>comicTransferMaxTargetEditions{
  add("large-target","Destination exceeds 40 editions; independent batch identity review is required.")
 }
 for _,ed:=range source.Editions{
  if ed.Format!="Comic"{add("mixed-source","Source contains non-comic editions that require specialist work-level review.");break}
 }
 for _,ed:=range target.Editions{
  if ed.Format!="Comic"{add("mixed-target","Destination contains a non-comic edition.");break}
  if ed.Files!=1||ed.Available!=1||ed.ReviewFiles!=0{
   add("target-edition","Destination has a multi-part, offline or unreviewed edition.")
  }
 }
 memberEdition:=false
 for _,ed:=range source.Editions{
  if ed.ID==in.EditionID{
   memberEdition=true
   if ed.Format!="Comic"||ed.Files!=1||ed.Available!=1||ed.ReviewFiles!=0{
    add("unsafe-edition","Selected edition must be a reviewed, available, single-file comic.")
   }
   break
  }
 }
 if !memberEdition{return p,errors.New("selected edition does not belong to the source work")}
 var title string
 err=tx.QueryRowContext(ctx,`SELECT a.id,a.title,a.series_number,a.published_year,
      a.available,a.needs_review,a.source_id
     FROM edition_assets ea JOIN assets a ON a.id=ea.asset_id
     WHERE ea.edition_id=? ORDER BY ea.position,a.id LIMIT 1`,in.EditionID).
  Scan(&p.Member.AssetID,&title,&p.Member.Issue,&p.Member.Year,
   &p.Member.Available,&p.Member.NeedsReview,&p.Member.SourceID)
 if err!=nil{return p,err}
 p.Member.Title=title
 // Work-level author and series do not necessarily reflect their edition's
 // path. Require an explicit shared series, then inspect original issue/year.
 srcSeries,tgtSeries:="",""
 srcAuthor,tgtAuthor:="",""
 for _,field:=range source.Fields{
  if field.Name=="series"{srcSeries=field.Value}
  if field.Name=="author"{srcAuthor=field.Value}
 }
 for _,field:=range target.Fields{
  if field.Name=="series"{tgtSeries=field.Value}
  if field.Name=="author"{tgtAuthor=field.Value}
 }
 if strings.TrimSpace(srcSeries)==""||!strings.EqualFold(strings.TrimSpace(srcSeries),strings.TrimSpace(tgtSeries)){
  add("series-conflict","Source and destination must have the same nonempty comic series identity.")
 }
 if srcAuthor!=""&&tgtAuthor!=""&&!strings.EqualFold(strings.TrimSpace(srcAuthor),strings.TrimSpace(tgtAuthor)){
  add("creator-conflict","Creator metadata differs. Review the original issue and its edition independently.")
 }
 if source.Title!=target.Title{
  warn("title-difference","The two logical books have different titles; confirm this is a true edition, not another issue.")
 }
 if !p.Member.Available||p.Member.NeedsReview||p.Member.Issue<=0||math.IsNaN(p.Member.Issue){
  add("unverified-member","Original comic must be available, reviewed and have an explicit positive issue number.")
 }
 // Review actual target members, not merely the work title. An edition of
 // issue #3 must never silently become a variant of issue #1.
 rows,err:=tx.QueryContext(ctx,`SELECT e.id,a.series_number,a.published_year,a.available,a.needs_review
   FROM editions e JOIN edition_assets ea ON ea.edition_id=e.id
   JOIN assets a ON a.id=ea.asset_id WHERE e.work_id=?
   ORDER BY e.id,ea.position,a.id LIMIT 82`,target.WorkID)
 if err!=nil{return p,err}
 count:=0
 for rows.Next(){
  var edID int64
  var issue float64
  var year int
  var available,review bool
  if err=rows.Scan(&edID,&issue,&year,&available,&review);err!=nil{rows.Close();return p,err}
  count++
  if count>comicTransferMaxTargetEditions+1{
   add("target-complexity","Target has too many indexed members for bounded transfer review.")
   break
  }
  if issue<=0||math.IsNaN(issue)||math.IsInf(issue,0)||issue!=p.Member.Issue{
   add("issue-conflict",fmt.Sprintf("Target edition %d has a different, invalid or missing comic issue number.",edID))
  }
  if year>0&&p.Member.Year>0&&year!=p.Member.Year{
   add("year-conflict",fmt.Sprintf("Target edition %d has a different publication year; volume or reprint may differ.",edID))
  }
  if !available||review{add("target-review","Destination contains offline or unreviewed comic media.")}
 }
 if err=rows.Err();err!=nil{rows.Close();return p,err}
 rows.Close()
 // Owner-edited edition identities are immutable until a dedicated rebind
 // operation with historical audit of both work IDs exists.
 for _,work:=range []workMetaState{source,target}{
  for _,ed:=range work.Editions{
   n,e:=comicTransferCount(ctx,tx,"comic_edition_profiles","edition_id",ed.ID)
   if e!=nil{return p,e}
   if n>0{add("verified-edition","An owner-verified edition profile is bound to this work. Do not reassign its run, volume or history.")}
  }
 }
 type dependent struct{table,column,code,reason string; id int64}
 dependentChecks:=[]dependent{}
 for _,id:=range []int64{source.WorkID,target.WorkID}{
  dependentChecks=append(dependentChecks,
   dependent{"work_field_controls","work_id","manual-fields","A work contains approved or locked book-level metadata.",id},
   dependent{"work_metadata_history","work_id","metadata-history","A work has saved manual book metadata history.",id},
   dependent{"work_metadata_revisions","work_id","metadata-revision","A book metadata revision exists; version-bound changes must not be reparented.",id},
   dependent{"selected_work_covers","work_id","selected-cover","A manually selected cover belongs to this work.",id},
   dependent{"work_publication_events","work_id","publication-events","An existing published/unpublished event belongs to a work.",id},
   dependent{"work_preferences","work_id","preferences","Household ratings or favourites refer to a work.",id},
   dependent{"profile_completions","work_id","completions","Household completion records refer to a work.",id},
   dependent{"profile_activity","work_id","reading-activity","Reading/listening statistics refer to the work.",id},
   dependent{"asset_relink_events","work_id","relink-history","Historical relink events belong to the work.",id},
  )
 }
 dependentChecks=append(dependentChecks,
  dependent{"progress","edition_id","legacy-progress","Legacy audiobook progress refers to this edition.",in.EditionID},
  dependent{"profile_progress","edition_id","profile-progress","Household progress refers to this edition.",in.EditionID},
  dependent{"comic_edition_profile_history","edition_id","edition-history","Owner's verified edition audit history must not be reparented.",in.EditionID},
 )
 for _,d:=range dependentChecks{
  n,e:=comicTransferCount(ctx,tx,d.table,d.column,d.id)
  if e!=nil{return p,e}
  if n>0{add(d.code,d.reason)}
 }
 for _,d:=range []dependent{
  {"reading_progress","asset_id","reading-progress","Reading position belongs to the original issue.",p.Member.AssetID},
  {"asset_progress","asset_id","asset-progress","Listening position belongs to an asset.",p.Member.AssetID},
  {"asset_field_controls","asset_id","asset-field-locks","Asset has manual metadata and field locks.",p.Member.AssetID},
  {"asset_metadata_revisions","asset_id","asset-field-revision","Original media has a manual metadata revision.",p.Member.AssetID},
  {"asset_metadata_audit","asset_id","asset-metadata-history","Original media has a manual metadata audit trail.",p.Member.AssetID},
  {"asset_relink_events","asset_id","relink-history","Original media was previously relinked.",p.Member.AssetID},
  {"file_moves","asset","file-move-history","Media has in-flight or historical file move work.",p.Member.AssetID},
 }{
  n,e:=comicTransferCount(ctx,tx,d.table,d.column,d.id)
  if e!=nil{return p,e}
  if n>0{add(d.code,d.reason)}
 }
 // Do not inspect the filesystem from this preview. Persisted scanner jobs
 // may still be changing both catalogues; they must reach a stable state.
 jobTable,err:=comicTransferTableExists(ctx,tx,"jobs")
 if err!=nil{return p,err}
 if jobTable{
  var active int
  err=tx.QueryRowContext(ctx,`SELECT count(*) FROM jobs
    WHERE state IN ('queued','running','committing','cancelling') AND source_id IN
    (SELECT DISTINCT source_id FROM assets WHERE id=? OR id IN (
      SELECT ea.asset_id FROM edition_assets ea JOIN editions ed ON ed.id=ea.edition_id
      WHERE ed.work_id=?))`,p.Member.AssetID,target.WorkID).Scan(&active)
  if err!=nil{return p,err}
  if active>0{add("active-scan","A queued, running or committing scan affects the media sources.")}
 }
 p.PreflightClear=len(p.Blockers)==0
 p.ExpiresAt=time.Now().Add(comicTransferPreviewTTL).Unix()
 if p.PreflightClear{warn("apply-not-enabled","Source inspection only: no reassignment endpoint is enabled in this milestone.")}
 p.Receipt=comicTransferReceipt(a.token,p)
 if err=tx.Commit();err!=nil{return p,err}
 return p,nil
}
func (a *app)comicTransferRoutes(mux *http.ServeMux){
 mux.HandleFunc("POST /api/manage/comic-edition-transfer/inspect",func(w http.ResponseWriter,r *http.Request){
  if !who(r).Owner{fail(w,403,errors.New("administrator required"));return}
  var request comicTransferRequest
  if err:=workMetadataJSON(w,r,&request);err!=nil{fail(w,400,err);return}
  result,err:=a.inspectComicEditionTransfer(r.Context(),request)
  if err!=nil{workMetaRouteFailure(w,err);return}
  reply(w,result)
 })
}
