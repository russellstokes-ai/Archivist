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
 "io"
 "math"
 "net/http"
 "strconv"
 "strings"
 "time"
)

const workMetaPreviewTTL=10*time.Minute
const maxWorkMemberSnapshot=5000
var workMetaNames=[]string{"title","author","series","seriesNumber","genre","publishedYear","narrator","publisher","isbn","asin","language","description"}
var workMetaExtended=[]string{"seriesNumber","publishedYear","narrator","publisher","isbn","asin","language","description"}

func workFieldAllowed(name string)bool{
 for _,v:=range workMetaNames{if name==v{return true}}
 return false
}
func workCore(name string)bool{return name=="title"||name=="author"||name=="series"||name=="genre"}

type workMetaField struct{
 Name string `json:"name"`
 Value string `json:"value"`
 Source string `json:"source"`
 Locked bool `json:"locked"`
 Conflicting bool `json:"conflicting"`
 UpdatedAt int64 `json:"updatedAt"`
}
type workMetaEdition struct{
 ID int64 `json:"id"`
 Format string `json:"format"`
 Files int `json:"files"`
 Available int `json:"available"`
 ReviewFiles int `json:"reviewFiles"`
}
type workMetaState struct{
 WorkID int64 `json:"workId"`
 Title string `json:"title"`
 Space string `json:"space"`
 Auto bool `json:"automatic"`
 Revision int64 `json:"revision"`
 LibraryVisible bool `json:"libraryVisible"`
 PublicationState string `json:"publicationState"`
 PublicationRevision int64 `json:"publicationRevision"`
 CoverHash string `json:"coverHash"`
 Fingerprint string `json:"fingerprint"`
 Files int `json:"files"`
 Editions []workMetaEdition `json:"editions"`
 Fields []workMetaField `json:"fields"`
 MemberDigest string `json:"memberDigest"`
}

func (a *app)initWorkMetadata()error{
 _,err:=a.db.Exec(`CREATE TABLE IF NOT EXISTS work_field_controls(
    work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    value TEXT NOT NULL,
    source TEXT NOT NULL,
    locked INTEGER NOT NULL DEFAULT 0 CHECK(locked IN (0,1)),
    updated_at INTEGER NOT NULL,
    PRIMARY KEY(work_id,field)
 );
 CREATE TABLE IF NOT EXISTS work_metadata_revisions(
    work_id INTEGER PRIMARY KEY REFERENCES works(id) ON DELETE CASCADE,
    revision INTEGER NOT NULL CHECK(revision>=0)
 );
 CREATE TABLE IF NOT EXISTS work_metadata_history(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    revision_before INTEGER NOT NULL,
    revision_after INTEGER NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('edit','undo','lock','unlock')),
    before_json TEXT NOT NULL,
    changes_json TEXT NOT NULL DEFAULT '[]',
    after_fingerprint TEXT NOT NULL,
    recorded_at INTEGER NOT NULL
 );
 CREATE INDEX IF NOT EXISTS idx_work_metadata_history_work ON work_metadata_history(work_id,id DESC);`)
 if err!=nil{return err}
 return a.initComicEditionProfiles()
}

// Manual core-field values are applied INSIDE the same transaction as the
// scanner's auto-grouping. File metadata remains independent and untouched.
func applyWorkOverridesTx(tx *sql.Tx,id int64)error{
 rows,err:=tx.Query(`SELECT field,value FROM work_field_controls
    WHERE work_id=? AND field IN ('title','author','series','genre')`,id)
 if err!=nil{return err}
 control:=map[string]string{}
 for rows.Next(){
  var field,value string
  if err=rows.Scan(&field,&value);err!=nil{rows.Close();return err}
  control[field]=value
 }
 if err=rows.Err();err!=nil{rows.Close();return err}
 rows.Close()
 if len(control)==0{return nil}
 var title,author,series,genre string
 if err=tx.QueryRow("SELECT title,author,series,genre FROM works WHERE id=?",id).
    Scan(&title,&author,&series,&genre);err!=nil{return err}
 if value,ok:=control["title"];ok{title=value}
 if value,ok:=control["author"];ok{author=value}
 if value,ok:=control["series"];ok{series=value}
 if value,ok:=control["genre"];ok{genre=value}
 _,err=tx.Exec("UPDATE works SET title=?,author=?,series=?,genre=? WHERE id=?",title,author,series,genre,id)
 return err
}

type workMetaCandidate struct{Value string;Found bool;Conflict bool}
func (c *workMetaCandidate)consume(value string){
 value=strings.TrimSpace(value)
 if value==""||value=="0"{return}
 if !c.Found{c.Value=value;c.Found=true;return}
 if c.Value!=value{c.Conflict=true}
}

func (a *app)readWorkMeta(ctx context.Context,q bulkQuerier,id int64)(workMetaState,error){
 state:=workMetaState{WorkID:id,Fields:[]workMetaField{},Editions:[]workMetaEdition{}}
 var title,author,series,genre string
 var auto int
 err:=q.QueryRowContext(ctx,`SELECT w.title,w.author,w.series,w.genre,w.space,w.auto,
   COALESCE((SELECT revision FROM work_metadata_revisions wr WHERE wr.work_id=w.id),0),
   COALESCE((SELECT state FROM work_publication p WHERE p.work_id=w.id),'staged'),
   COALESCE((SELECT revision FROM work_publication p WHERE p.work_id=w.id),0),
   COALESCE((SELECT digest FROM selected_work_covers c WHERE c.work_id=w.id),''),w.id IN (SELECT id FROM published_works)
   FROM works w WHERE w.id=?`,id).Scan(&title,&author,&series,&genre,&state.Space,&auto,
   &state.Revision,&state.PublicationState,&state.PublicationRevision,&state.CoverHash,&state.LibraryVisible)
 if err!=nil{return state,err}
 state.Title=title;state.Auto=auto!=0
 h:=sha256.New()
 encoder:=json.NewEncoder(h)
 rows,err:=q.QueryContext(ctx,`SELECT ed.id,ed.format,ea.position,a.id,a.relative_path,
    a.available,a.needs_review,a.scan_signature,a.metadata_source,
    a.title,a.author,a.series,a.genre,a.series_number,a.published_year,a.narrator,a.publisher,a.isbn,a.asin,a.language,a.description,
    COALESCE((SELECT revision FROM asset_metadata_revisions v WHERE v.asset_id=a.id),0)
    FROM editions ed JOIN edition_assets ea ON ea.edition_id=ed.id
    JOIN assets a ON a.id=ea.asset_id WHERE ed.work_id=?
    ORDER BY ed.id,ea.position,a.id`,id)
 if err!=nil{return state,err}
 derived:=map[string]*workMetaCandidate{}
 for _,field:=range workMetaExtended{derived[field]=&workMetaCandidate{}}
 for rows.Next(){
   var editionID,assetID,fileRev int64
   var pos,year int
   var seriesNumber float64
   var format,path,signature,source,fileTitle,fileAuthor,fileSeries,fileGenre,narrator,publisher,isbn,asin,language,description string
   var available,needsReview bool
   if err=rows.Scan(&editionID,&format,&pos,&assetID,&path,&available,&needsReview,
      &signature,&source,&fileTitle,&fileAuthor,&fileSeries,&fileGenre,&seriesNumber,&year,&narrator,&publisher,&isbn,&asin,&language,&description,&fileRev);err!=nil{
      rows.Close();return state,err
   }
   state.Files++
   if state.Files>maxWorkMemberSnapshot{
      rows.Close();return state,errors.New("book contains too many indexed parts for a safe snapshot")
   }
   if len(state.Editions)==0||state.Editions[len(state.Editions)-1].ID!=editionID{
      state.Editions=append(state.Editions,workMetaEdition{ID:editionID,Format:format})
      if len(state.Editions)>100{
        rows.Close();return state,errors.New("book contains too many editions for the workbench")
      }
   }
   ed:=&state.Editions[len(state.Editions)-1]
   ed.Files++;if available{ed.Available++};if needsReview{ed.ReviewFiles++}
   derived["seriesNumber"].consume(strconv.FormatFloat(seriesNumber,'g',-1,64))
   derived["publishedYear"].consume(strconv.Itoa(year))
   derived["narrator"].consume(narrator)
   derived["publisher"].consume(publisher)
   derived["isbn"].consume(isbn)
   derived["asin"].consume(asin)
   derived["language"].consume(language)
   derived["description"].consume(description)
   if err=encoder.Encode([]any{editionID,format,pos,assetID,path,available,needsReview,
       signature,source,fileRev,fileTitle,fileAuthor,fileSeries,fileGenre,seriesNumber,year,narrator,publisher,isbn,asin,language,description});err!=nil{
       rows.Close();return state,err
   }
 }
 if err=rows.Err();err!=nil{rows.Close();return state,err}
 rows.Close()
 if state.Files==0{return state,errors.New("book has no indexed assets")}
 state.MemberDigest=hex.EncodeToString(h.Sum(nil))
 controls:=map[string]workMetaField{}
 rows,err=q.QueryContext(ctx,`SELECT field,value,source,locked,updated_at FROM work_field_controls WHERE work_id=?`,id)
 if err!=nil{return state,err}
 for rows.Next(){
    var d workMetaField
    if err=rows.Scan(&d.Name,&d.Value,&d.Source,&d.Locked,&d.UpdatedAt);err!=nil{rows.Close();return state,err}
    if !workFieldAllowed(d.Name){rows.Close();return state,errors.New("unknown saved work metadata field")}
    controls[d.Name]=d
 }
 if err=rows.Err();err!=nil{rows.Close();return state,err}
 rows.Close()
 for _,field:=range workMetaNames{
   if d,ok:=controls[field];ok{state.Fields=append(state.Fields,d);continue}
   item:=workMetaField{Name:field,Source:"catalogue"}
   switch field{
   case "title":item.Value=title
   case "author":item.Value=author
   case "series":item.Value=series
   case "genre":item.Value=genre
   default:
      candidate:=derived[field]
      if candidate.Conflict{item.Source="conflicting file values";item.Conflicting=true}
      if candidate.Found&&!candidate.Conflict{item.Value=candidate.Value;item.Source="derived from files"}
      if !candidate.Found{item.Source="missing from files"}
   }
   state.Fields=append(state.Fields,item)
 }
 // A stable fingerprint guards not only fields but publication revisions,
 // chapter membership, file-level edits, cover changes and edition formats.
 clone:=state
 clone.Fingerprint=""
 body,err:=json.Marshal(clone)
 if err!=nil{return state,err}
 state.Fingerprint=metadataDigest(string(body))
 return state,nil
}

type workMetaChange struct{
 Name string `json:"name"`
 Value string `json:"value"`
 Origin string `json:"origin"`
}
type workMetaDiff struct{
 Name string `json:"name"`
 From string `json:"from"`
 To string `json:"to"`
 Source string `json:"source"`
}
type workMetaPreviewRequest struct{
 ExpectedRevision int64 `json:"expectedRevision"`
 ExpectedFingerprint string `json:"expectedFingerprint"`
 Changes []workMetaChange `json:"changes"`
}
type workMetaPreview struct{
 WorkID int64 `json:"workId"`
 ExpectedRevision int64 `json:"expectedRevision"`
 ExpectedFingerprint string `json:"expectedFingerprint"`
 Changes []workMetaChange `json:"changes"`
 Diff []workMetaDiff `json:"diff"`
 ExpiresAt int64 `json:"expiresAt"`
 Receipt string `json:"receipt"`
}
type workMetaApplyRequest struct{
 Preview workMetaPreview `json:"preview"`
 Confirm bool `json:"confirm"`
}

func validateWorkValue(name,value string)(string,error){
 value=strings.TrimSpace(value)
 limit:=1000
 switch name{
 case "title":
     if value==""{return "",errors.New("book title cannot be blank")}
 case "seriesNumber":
     if value==""||value=="0"{return "",nil}
     n,err:=strconv.ParseFloat(value,64)
     if err!=nil||math.IsNaN(n)||math.IsInf(n,0)||n< -10000||n>100000{
       return "",errors.New("series or issue number must be finite and within accepted bounds")
     }
     return strconv.FormatFloat(n,'f',-1,64),nil
 case "publishedYear":
     if value==""||value=="0"{return "",nil}
     y,err:=strconv.Atoi(value)
     if err!=nil||y<1000||y>3000{return "",errors.New("publication year must be 1000–3000 or empty")}
     return strconv.Itoa(y),nil
 case "isbn","asin","language":limit=100
 case "description":limit=20000
 }
 if len(value)>limit{return "",fmt.Errorf("%s exceeds %d bytes",name,limit)}
 return value,nil
}

func workMetaReceipt(secret string,p workMetaPreview)string{
 p.Receipt=""
 raw,_:=json.Marshal(p)
 mac:=hmac.New(sha256.New,[]byte(secret));mac.Write(raw)
 return hex.EncodeToString(mac.Sum(nil))
}
func previewMetaChanges(state workMetaState,changes []workMetaChange)([]workMetaChange,[]workMetaDiff,error){
 if len(changes)<1||len(changes)>len(workMetaNames){return nil,nil,errors.New("select 1–12 work metadata fields")}
 current:=map[string]workMetaField{}
 for _,field:=range state.Fields{current[field.Name]=field}
 seen:=map[string]bool{}
 normalized:=[]workMetaChange{}
 diffs:=[]workMetaDiff{}
 for _,item:=range changes{
   if !workFieldAllowed(item.Name)||seen[item.Name]{return nil,nil,errors.New("invalid or repeated work field")}
   seen[item.Name]=true
   if item.Origin!="manual"&&item.Origin!="open-library"&&item.Origin!="google-books"&&item.Origin!="apple-books"&&item.Origin!="audnexus"{
      return nil,nil,errors.New("work metadata must state manual or owner-selected candidate origin")
   }
   if (item.Origin=="apple-books"||item.Origin=="audnexus"||item.Origin=="google-books")&&item.Name=="publishedYear"{return nil,nil,errors.New("Provider edition release is not a first-publication year; verify and enter the year manually")}
   value,err:=validateWorkValue(item.Name,item.Value)
   if err!=nil{return nil,nil,err}
   field:=current[item.Name]
   if value==field.Value{continue}
   if field.Locked{return nil,nil,fmt.Errorf("field %s is locked; unlock it before editing",item.Name)}
   normalized=append(normalized,workMetaChange{Name:item.Name,Value:value,Origin:item.Origin})
   source:="owner edit"
   if item.Origin=="open-library"{source="owner-selected Open Library suggestion (unverified)"}
   if item.Origin=="google-books"{source="owner-selected Google Books edition suggestion (unverified)"}
   if item.Origin=="audnexus"{source="owner-selected Audnexus audiobook suggestion (unverified)"}
   if item.Origin=="apple-books"{source="owner-selected Apple Books store suggestion (unverified)"}
   diffs=append(diffs,workMetaDiff{Name:item.Name,From:field.Value,To:value,Source:source})
 }
 if len(diffs)==0{return nil,nil,errors.New("no book-level changes to preview")}
 return normalized,diffs,nil
}
func (a *app)previewWorkMetadata(ctx context.Context,id int64,in workMetaPreviewRequest)(workMetaPreview,error){
 p:=workMetaPreview{}
 if id<1||in.ExpectedRevision<0||len(in.ExpectedFingerprint)!=64{return p,errors.New("invalid book revision or fingerprint")}
 tx,err:=a.db.BeginTx(ctx,&sql.TxOptions{ReadOnly:true})
 if err!=nil{return p,err}
 defer tx.Rollback()
 state,err:=a.readWorkMeta(ctx,tx,id)
 if err!=nil{return p,err}
 if state.PublicationState!="staged"{return p,errors.New("unpublish this book before editing its public metadata")}
 if state.Revision!=in.ExpectedRevision||state.Fingerprint!=in.ExpectedFingerprint{
   return p,errors.New("book or edition changed; reload before editing")
 }
 normalized,diffs,err:=previewMetaChanges(state,in.Changes)
 if err!=nil{return p,err}
 if err=tx.Commit();err!=nil{return p,err}
 p=workMetaPreview{WorkID:id,ExpectedRevision:state.Revision,ExpectedFingerprint:state.Fingerprint,
    Changes:normalized,Diff:diffs,ExpiresAt:time.Now().Add(workMetaPreviewTTL).Unix()}
 p.Receipt=workMetaReceipt(a.token,p)
 return p,nil
}

type workFieldBefore struct{
 Name string `json:"name"`
 DisplayValue string `json:"displayValue"`
 Control *workMetaField `json:"control,omitempty"`
}
type workRollback struct{
 Title string `json:"title"`
 Author string `json:"author"`
 Series string `json:"series"`
 Genre string `json:"genre"`
 Controls []workFieldBefore `json:"controls"`
}

func (a *app)applyWorkMetadata(ctx context.Context,p workMetaPreview)(workMetaState,error){
 state:=workMetaState{}
 now:=time.Now().Unix()
 if p.WorkID<1||now>p.ExpiresAt||p.ExpiresAt>now+int64(workMetaPreviewTTL/time.Second)+60{
   return state,errors.New("work metadata preview expired; preview again")
 }
 token,err:=hex.DecodeString(p.Receipt)
 actual,_:=hex.DecodeString(workMetaReceipt(a.token,p))
 if err!=nil||!hmac.Equal(token,actual){return state,errors.New("book preview signature invalid; preview again")}
 a.scanMu.Lock();defer a.scanMu.Unlock()
 tx,err:=a.db.BeginTx(ctx,nil)
 if err!=nil{return state,err}
 defer tx.Rollback()
 state,err=a.readWorkMeta(ctx,tx,p.WorkID)
 if err!=nil{return state,err}
 if state.PublicationState!="staged"{return state,errors.New("book published since preview; unpublish explicitly")}
 if state.Revision!=p.ExpectedRevision||state.Fingerprint!=p.ExpectedFingerprint{
   return state,errors.New("book files, cover or metadata changed; preview again")
 }
 normalized,diffs,err:=previewMetaChanges(state,p.Changes)
 if err!=nil{return state,err}
 if stringJSON(normalized)!=stringJSON(p.Changes)||stringJSON(diffs)!=stringJSON(p.Diff){
    return state,errors.New("book metadata preview differs from approved changes")
 }
 before:=workRollback{Controls:[]workFieldBefore{}}
 if err=tx.QueryRowContext(ctx,"SELECT title,author,series,genre FROM works WHERE id=?",p.WorkID).
     Scan(&before.Title,&before.Author,&before.Series,&before.Genre);err!=nil{return state,err}
 vals:=map[string]string{"title":before.Title,"author":before.Author,"series":before.Series,"genre":before.Genre}
 fields:=map[string]workMetaField{}
 for _,field:=range state.Fields{fields[field.Name]=field}
 for _,change:=range normalized{
    var original workMetaField
    rowErr:=tx.QueryRowContext(ctx,"SELECT field,value,source,locked,updated_at FROM work_field_controls WHERE work_id=? AND field=?",p.WorkID,change.Name).
       Scan(&original.Name,&original.Value,&original.Source,&original.Locked,&original.UpdatedAt)
    var control *workMetaField
    if rowErr==nil{control=&original}else if !errors.Is(rowErr,sql.ErrNoRows){return state,rowErr}
    before.Controls=append(before.Controls,workFieldBefore{Name:change.Name,DisplayValue:fields[change.Name].Value,Control:control})
    source:="owner edit"
    if change.Origin=="open-library"{source="owner-selected Open Library suggestion (unverified)"}
     if change.Origin=="google-books"{source="owner-selected Google Books edition suggestion (unverified)"}
    if change.Origin=="audnexus"{source="owner-selected Audnexus audiobook suggestion (unverified)"}
    if change.Origin=="apple-books"{source="owner-selected Apple Books store suggestion (unverified)"}
    if _,err=tx.ExecContext(ctx,`INSERT INTO work_field_controls(work_id,field,value,source,locked,updated_at)
      VALUES(?,?,?, ?,0,?) ON CONFLICT(work_id,field) DO UPDATE SET
      value=excluded.value,source=excluded.source,updated_at=excluded.updated_at`,
      p.WorkID,change.Name,change.Value,source,now);err!=nil{return state,err}
    if workCore(change.Name){vals[change.Name]=change.Value}
 }
 if _,err=tx.ExecContext(ctx,"UPDATE works SET title=?,author=?,series=?,genre=? WHERE id=?",
    vals["title"],vals["author"],vals["series"],vals["genre"],p.WorkID);err!=nil{return state,err}
 if _,err=tx.ExecContext(ctx,`INSERT INTO work_metadata_revisions(work_id,revision) VALUES(?,?)
   ON CONFLICT(work_id) DO UPDATE SET revision=excluded.revision`,p.WorkID,state.Revision+1);err!=nil{return state,err}
 after,err:=a.readWorkMeta(ctx,tx,p.WorkID)
 if err!=nil{return state,err}
 originalJSON,err:=json.Marshal(before);if err!=nil{return state,err}
 if _,err=tx.ExecContext(ctx,`INSERT INTO work_metadata_history(
   work_id,revision_before,revision_after,action,before_json,changes_json,after_fingerprint,recorded_at)
   VALUES(?,?,?,'edit',?,?,?,?)`,p.WorkID,state.Revision,after.Revision,string(originalJSON),stringJSON(diffs),after.Fingerprint,now);err!=nil{return state,err}
 if _,err=tx.ExecContext(ctx,`DELETE FROM work_metadata_history WHERE work_id=?
   AND id NOT IN(SELECT id FROM work_metadata_history WHERE work_id=? ORDER BY id DESC LIMIT 25)`,
   p.WorkID,p.WorkID);err!=nil{return state,err}
 if err=tx.Commit();err!=nil{return state,err}
 return after,nil
}

func stringJSON(v any)string{data,_:=json.Marshal(v);return string(data)}

func (a *app)workMetaLock(ctx context.Context,id int64,name string,locked bool,rev int64,fingerprint string)(workMetaState,error){
 result:=workMetaState{}
 if id<1||!workFieldAllowed(name)||rev<0||len(fingerprint)!=64{return result,errors.New("invalid field, revision or fingerprint")}
 a.scanMu.Lock();defer a.scanMu.Unlock()
 tx,err:=a.db.BeginTx(ctx,nil);if err!=nil{return result,err}
 defer tx.Rollback()
 state,err:=a.readWorkMeta(ctx,tx,id);if err!=nil{return result,err}
 if state.PublicationState!="staged"{return result,errors.New("unpublish book before changing metadata locks")}
 if state.Revision!=rev||state.Fingerprint!=fingerprint{return result,errors.New("work changed; reload before locking")}
 var field workMetaField
 for _,x:=range state.Fields{if x.Name==name{field=x;break}}
 if field.Locked==locked{return state,nil}
 // Locking freezes even derived values, including an intentional blank.
 source:=field.Source
 if source=="catalogue"||source=="derived from files"||source=="missing from files"||source=="conflicting file values"{
   source="owner pinned derived value (unverified)"
 }
 if _,err=tx.ExecContext(ctx,`INSERT INTO work_field_controls(work_id,field,value,source,locked,updated_at)
   VALUES(?,?,?,?,?,?) ON CONFLICT(work_id,field) DO UPDATE SET
   locked=excluded.locked,updated_at=excluded.updated_at`,
   id,name,field.Value,source,locked,time.Now().Unix());err!=nil{return result,err}
 if _,err=tx.ExecContext(ctx,`INSERT INTO work_metadata_revisions(work_id,revision) VALUES(?,?)
  ON CONFLICT(work_id) DO UPDATE SET revision=excluded.revision`,id,state.Revision+1);err!=nil{return result,err}
 result,err=a.readWorkMeta(ctx,tx,id);if err!=nil{return result,err}
 action:="unlock";if locked{action="lock"}
 change:=[]workMetaDiff{{Name:name,From:field.Value,To:field.Value,Source:action}}
 if _,err=tx.ExecContext(ctx,`INSERT INTO work_metadata_history(
     work_id,revision_before,revision_after,action,before_json,changes_json,after_fingerprint,recorded_at)
     VALUES(?,?,?,?,'{}',?,?,?)`,id,state.Revision,result.Revision,action,
     stringJSON(change),result.Fingerprint,time.Now().Unix());err!=nil{return result,err}
 if err=tx.Commit();err!=nil{return result,err}
 return result,nil
}

func workMetadataJSON(w http.ResponseWriter,r *http.Request,dst any)error{
 // A signed preview repeats original and replacement descriptions. A fixed
 // 256 KiB limit permits valid 20 KiB descriptions plus bounded multi-field
 // diffs without allowing arbitrarily large owner requests on a Pi 4.
 d:=json.NewDecoder(http.MaxBytesReader(w,r.Body,256<<10))
 d.DisallowUnknownFields()
 if err:=d.Decode(dst);err!=nil{return errors.New("invalid book workbench request")}
 var extra any
 if err:=d.Decode(&extra);err!=io.EOF{return errors.New("only one JSON object is allowed")}
 return nil
}
