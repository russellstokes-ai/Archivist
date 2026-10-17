package main

import (
    "crypto/sha256"
    "database/sql"
    "encoding/hex"
    "encoding/json"
    "errors"
    "fmt"
    "io"
    "net/http"
    "strconv"
    "time"
)

// The public field names are an explicit allowlist, not dynamic SQL columns.
// Metadata is still stored in assets; this is a small durable control ledger.
var managedMetadataFields = []string{
    "title","author","series","seriesNumber","genre","publishedYear",
    "narrator","publisher","isbn","asin","language","description",
}

func metadataFieldAllowed(name string) bool {
    for _,allowed := range managedMetadataFields { if name==allowed { return true } }
    return false
}

type metadataScalars struct {
    Title,Author,Series,Genre,Narrator,Publisher,ISBN,ASIN,Language,Description string
    SeriesNumber float64
    PublishedYear int
}
func (m metadataScalars) values() map[string]string {
    return map[string]string{
        "title":m.Title,"author":m.Author,"series":m.Series,
        "seriesNumber":strconv.FormatFloat(m.SeriesNumber,'g',-1,64),
        "genre":m.Genre,"publishedYear":strconv.Itoa(m.PublishedYear),
        "narrator":m.Narrator,"publisher":m.Publisher,
        "isbn":m.ISBN,"asin":m.ASIN,"language":m.Language,"description":m.Description,
    }
}
func assetMetadataScalars(db *sql.DB,id int64)(metadataScalars,string,error) {
    var v metadataScalars
    var source string
    err:=db.QueryRow(`SELECT title,author,series,series_number,genre,published_year,
      narrator,publisher,isbn,asin,language,description,metadata_source FROM assets WHERE id=?`,id).Scan(
      &v.Title,&v.Author,&v.Series,&v.SeriesNumber,&v.Genre,&v.PublishedYear,
      &v.Narrator,&v.Publisher,&v.ISBN,&v.ASIN,&v.Language,&v.Description,&source)
    return v,source,err
}

func (a *app) initMetadataControls() error {
    _,err:=a.db.Exec(`CREATE TABLE IF NOT EXISTS asset_field_controls(
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      field TEXT NOT NULL,
      source TEXT NOT NULL,
      locked INTEGER NOT NULL DEFAULT 0 CHECK(locked IN (0,1)),
      updated_at INTEGER NOT NULL,
      PRIMARY KEY(asset_id,field)
    );
    CREATE TABLE IF NOT EXISTS asset_metadata_revisions(
      asset_id INTEGER PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
      revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0)
    );
    CREATE TABLE IF NOT EXISTS asset_metadata_audit(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      revision INTEGER NOT NULL,
      field TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('save','lock','unlock')),
      previous_digest TEXT NOT NULL DEFAULT '',
      next_digest TEXT NOT NULL DEFAULT '',
      recorded_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_asset_metadata_audit_asset ON asset_metadata_audit(asset_id,id);`)
    return err
}

func metadataRevisionTx(tx *sql.Tx,id int64)(int64,error) {
    var rev int64
    err:=tx.QueryRow("SELECT revision FROM asset_metadata_revisions WHERE asset_id=?",id).Scan(&rev)
    if errors.Is(err,sql.ErrNoRows){return 0,nil}
    return rev,err
}

func bumpMetadataRevision(tx *sql.Tx,id int64,current int64) error {
    _,err:=tx.Exec(`INSERT INTO asset_metadata_revisions(asset_id,revision) VALUES(?,?)
        ON CONFLICT(asset_id) DO UPDATE SET revision=excluded.revision`,id,current+1)
    return err
}
var (
    errMetadataStale=errors.New("metadata changed; refresh before saving")
    errMetadataLocked=errors.New("metadata field is locked")
)
func metadataDigest(s string)string{
    h:=sha256.Sum256([]byte(s))
    return hex.EncodeToString(h[:])
}

// This is called from the existing Save route while the server's scanMu is
// held, in the SAME transaction as the underlying metadata write. A legacy
// mobile/API PATCH may omit expectedRevision for backward compatibility, but
// can never modify a locked field. Workbench clients send a revision.
func (a *app) recordMetadataChange(tx *sql.Tx,id int64,expected *int64,before,after metadataScalars) error {
    rev,err:=metadataRevisionTx(tx,id)
    if err!=nil{return err}
    if expected!=nil && *expected!=rev {return errMetadataStale}
    previous,next:=before.values(),after.values()
    rows,err:=tx.Query("SELECT field FROM asset_field_controls WHERE asset_id=? AND locked=1",id)
    if err!=nil{return err}
    locked:=map[string]bool{}
    for rows.Next(){
        var field string
        if err=rows.Scan(&field);err!=nil{rows.Close();return err}
        locked[field]=true
    }
    if err=rows.Err();err!=nil{rows.Close();return err}
    rows.Close()
    for _,field:=range managedMetadataFields {
        if locked[field] && previous[field]!=next[field]{
            return fmt.Errorf("%w: %q must be unlocked before editing",errMetadataLocked,field)
        }
    }
    now:=time.Now().Unix()
    for _,field:=range managedMetadataFields {
        if previous[field]==next[field]{continue}
        _,err=tx.Exec(`INSERT INTO asset_field_controls(asset_id,field,source,locked,updated_at)
          VALUES(?,?,'manual',0,?)
          ON CONFLICT(asset_id,field) DO UPDATE SET source='manual',updated_at=excluded.updated_at`,id,field,now)
        if err!=nil{return err}
        _,err=tx.Exec(`INSERT INTO asset_metadata_audit(
          asset_id,revision,field,action,previous_digest,next_digest,recorded_at)
          VALUES(?,? ,?,'save',?,?,?)`,id,rev+1,field,metadataDigest(previous[field]),metadataDigest(next[field]),now)
        if err!=nil{return err}
    }
    return bumpMetadataRevision(tx,id,rev)
}

type metadataFieldDetail struct {
    Name string `json:"name"`
    Value string `json:"value"`
    Source string `json:"source"`
    Locked bool `json:"locked"`
    UpdatedAt int64 `json:"updatedAt"`
}
type metadataControlState struct {
    AssetID int64 `json:"assetId"`
    Revision int64 `json:"revision"`
    Fields []metadataFieldDetail `json:"fields"`
}
func (a *app) metadataControlState(id int64)(metadataControlState,error) {
    result:=metadataControlState{AssetID:id,Fields:[]metadataFieldDetail{}}
    current,source,err:=assetMetadataScalars(a.db,id)
    if err!=nil{return result,err}
    err=a.db.QueryRow(`SELECT revision FROM asset_metadata_revisions WHERE asset_id=?`,id).Scan(&result.Revision)
    if err!=nil&&!errors.Is(err,sql.ErrNoRows){return result,err}
    values:=current.values()
    rows,err:=a.db.Query(`SELECT field,source,locked,updated_at FROM asset_field_controls
      WHERE asset_id=?`,id)
    if err!=nil{return result,err}
    controls:=map[string]metadataFieldDetail{}
    for rows.Next(){
        var d metadataFieldDetail
        if err=rows.Scan(&d.Name,&d.Source,&d.Locked,&d.UpdatedAt);err!=nil{rows.Close();return result,err}
        controls[d.Name]=d
    }
    if err=rows.Err();err!=nil{rows.Close();return result,err}
    rows.Close()
    for _,name:=range managedMetadataFields {
        detail,ok:=controls[name]
        if !ok{detail=metadataFieldDetail{Name:name,Source:source}}
        detail.Value=values[name]
        result.Fields=append(result.Fields,detail)
    }
    return result,nil
}

func (a *app) metadataControlRoutes(mux *http.ServeMux) {
    mux.HandleFunc("GET /api/manage/assets/{id}/fields",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator required"));return}
        id,err:=strconv.ParseInt(r.PathValue("id"),10,64)
        if err!=nil||id<1{fail(w,400,errors.New("invalid file identity"));return}
        result,err:=a.metadataControlState(id)
        if errors.Is(err,sql.ErrNoRows){fail(w,404,errors.New("file not found"));return}
        if err!=nil{fail(w,500,err);return}
        reply(w,result)
    })
    mux.HandleFunc("PUT /api/manage/assets/{id}/fields/{field}",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator required"));return}
        id,err:=strconv.ParseInt(r.PathValue("id"),10,64)
        field:=r.PathValue("field")
        if err!=nil||id<1||!metadataFieldAllowed(field){fail(w,400,errors.New("invalid file or field"));return}
        var input struct{
            Locked *bool `json:"locked"`
            ExpectedRevision *int64 `json:"expectedRevision"`
        }
        decoder:=json.NewDecoder(http.MaxBytesReader(w,r.Body,4096))
        decoder.DisallowUnknownFields()
        if err=decoder.Decode(&input);err!=nil{fail(w,400,errors.New("invalid lock request"));return}
        var extra any
        if err=decoder.Decode(&extra);err!=io.EOF{fail(w,400,errors.New("lock request must be one JSON object"));return}
        if input.Locked==nil||input.ExpectedRevision==nil||*input.ExpectedRevision<0{
            fail(w,400,errors.New("locked and expectedRevision are required"));return
        }
        a.scanMu.Lock()
        defer a.scanMu.Unlock()
        tx,err:=a.db.BeginTx(r.Context(),nil)
        if err!=nil{fail(w,500,err);return}
        defer tx.Rollback()
        var source string
        if err=tx.QueryRow("SELECT metadata_source FROM assets WHERE id=?",id).Scan(&source);err!=nil{
            if errors.Is(err,sql.ErrNoRows){fail(w,404,errors.New("file not found"))}else{fail(w,500,err)}
            return
        }
        revision,err:=metadataRevisionTx(tx,id)
        if err!=nil{fail(w,500,err);return}
        if revision!=*input.ExpectedRevision{fail(w,409,errors.New("metadata changed; reload before locking"));return}
        var currently bool
        err=tx.QueryRow("SELECT locked FROM asset_field_controls WHERE asset_id=? AND field=?",id,field).Scan(&currently)
        if err!=nil&&!errors.Is(err,sql.ErrNoRows){fail(w,500,err);return}
        if currently==*input.Locked {reply(w,map[string]any{"ok":true,"revision":revision,"locked":currently});return}
        now:=time.Now().Unix()
        if _,err=tx.Exec(`INSERT INTO asset_field_controls(asset_id,field,source,locked,updated_at)
          VALUES(?,?,?,?,?) ON CONFLICT(asset_id,field) DO UPDATE SET locked=excluded.locked,updated_at=excluded.updated_at`,
          id,field,source,*input.Locked,now);err!=nil{fail(w,500,err);return}
        if err=bumpMetadataRevision(tx,id,revision);err!=nil{fail(w,500,err);return}
        action:="unlock";if *input.Locked{action="lock"}
        if _,err=tx.Exec(`INSERT INTO asset_metadata_audit(asset_id,revision,field,action,recorded_at)
          VALUES(?,?,?,?,?)`,id,revision+1,field,action,now);err!=nil{fail(w,500,err);return}
        if err=tx.Commit();err!=nil{fail(w,500,err);return}
        reply(w,map[string]any{"ok":true,"revision":revision+1,"locked":*input.Locked})
    })
}
