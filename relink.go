package main

import (
    "context"
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "errors"
    "fmt"
    "io"
    "net/http"
    "os"
    "path/filepath"
    "strings"
    "time"
)

const relinkPreviewTTL = 15*time.Minute

// Relinking never guesses by filename, size or sample hash. A disappeared
// single-file work can be connected to a newly scanned, unused single-file
// candidate ONLY after the owner inspects both identities and explicitly
// attests their equivalence. The old bytes are unavailable, so we never
// claim to have compared both files. A full SHA-256 of the destination
// protects against changes between preview and apply.
type relinkIdentity struct {
    AssetID int64 `json:"assetId"`
    WorkID int64 `json:"workId"`
    EditionID int64 `json:"editionId"`
    SourceID int64 `json:"sourceId"`
    SourceRoot string `json:"sourceRoot"`
    Path string `json:"path"`
    Format string `json:"format"`
    Title string `json:"title"`
    WorkTitle string `json:"workTitle"`
    GroupKey string `json:"groupKey"`
    Auto bool `json:"auto"`
    Available bool `json:"available"`
    Size int64 `json:"sizeBytes"`
    Modified int64 `json:"modifiedUnix"`
    Signature string `json:"scanSignature"`
    MetadataSource string `json:"metadataSource"`
    Publication string `json:"publicationState"`
    PublicationRevision int64 `json:"publicationRevision"`
    FieldRevision int64 `json:"fieldRevision"`
}

type relinkPreview struct {
    Old relinkIdentity `json:"old"`
    Candidate relinkIdentity `json:"candidate"`
    SHA256 string `json:"sha256"`
    Expire int64 `json:"expiresAt"`
    Receipt string `json:"receipt"`
    RequiresAttestation bool `json:"requiresAttestation"`
    Important string `json:"important"`
}
type relinkRequest struct {
    OldAssetID int64 `json:"oldAssetId"`
    CandidateAssetID int64 `json:"candidateAssetId"`
}
type relinkApply struct {
    Preview relinkPreview `json:"preview"`
    Confirm bool `json:"confirm"`
    Attestation string `json:"attestation"`
}

func (a *app) initRelink()error{
    _,err:=a.db.Exec(`CREATE TABLE IF NOT EXISTS asset_relink_events(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
      retired_candidate_asset INTEGER NOT NULL,
      retired_candidate_work INTEGER NOT NULL,
      source_id INTEGER NOT NULL,
      from_path TEXT NOT NULL,
      to_path TEXT NOT NULL,
      destination_sha256 TEXT NOT NULL,
      verification TEXT NOT NULL CHECK(verification='owner-attested;destination-sha256'),
      recorded_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_asset_relink_asset ON asset_relink_events(asset_id,id);`)
    return err
}

// All strings come from the database; this is a plain read of one existing
// edition/asset association. Malformed and orphaned entries cannot be relinked.
func relinkIdentityFor(ctx context.Context,q bulkQuerier,id int64)(relinkIdentity,error){
    var v relinkIdentity
    err:=q.QueryRowContext(ctx,`SELECT a.id,w.id,e.id,a.source_id,s.path,
      a.relative_path,a.format,a.title,w.title,w.group_key,w.auto,a.available,
      a.size_bytes,a.modified_unix,a.scan_signature,a.metadata_source,
      COALESCE(p.state,'staged'),COALESCE(p.revision,0),
      COALESCE((SELECT mr.revision FROM asset_metadata_revisions mr WHERE mr.asset_id=a.id),0)
      FROM assets a JOIN sources s ON s.id=a.source_id
      JOIN edition_assets ea ON ea.asset_id=a.id
      JOIN editions e ON e.id=ea.edition_id
      JOIN works w ON w.id=e.work_id
      LEFT JOIN work_publication p ON p.work_id=w.id
      WHERE a.id=?`,id).Scan(&v.AssetID,&v.WorkID,&v.EditionID,&v.SourceID,&v.SourceRoot,
      &v.Path,&v.Format,&v.Title,&v.WorkTitle,&v.GroupKey,&v.Auto,
      &v.Available,&v.Size,&v.Modified,&v.Signature,&v.MetadataSource,
      &v.Publication,&v.PublicationRevision,&v.FieldRevision)
    return v,err
}

func relinkSourcePath(root,rel string)(*os.Root,error){
    if !filepath.IsLocal(rel)||rel!=filepath.Clean(rel)||strings.Contains(rel,"\\"){
        return nil,errors.New("unsafe media path")
    }
    resolved,err:=canonical(root)
    if err!=nil||resolved!=root{return nil,errors.New("library mount is unavailable or changed")}
    return os.OpenRoot(root)
}

type relinkReader struct {ctx context.Context;from io.Reader}
func (r relinkReader)Read(p []byte)(int,error){
    if err:=r.ctx.Err();err!=nil{return 0,err}
    return r.from.Read(p)
}

func fullRelinkFileHash(ctx context.Context,root *os.Root,rel string,expectedSize int64)(string,error){
    before,err:=root.Lstat(rel)
    if err!=nil{return "",errors.New("candidate file cannot be inspected")}
    if !before.Mode().IsRegular()||before.Size()!=expectedSize||expectedSize<1{
        return "",errors.New("candidate changed or is not a regular file")
    }
    f,err:=root.Open(rel)
    if err!=nil{return "",errors.New("candidate cannot be opened")}
    defer f.Close()
    opened,err:=f.Stat()
    if err!=nil||!opened.Mode().IsRegular()||!os.SameFile(before,opened){
        return "",errors.New("candidate changed while opening")
    }
    h:=sha256.New()
    buffer:=make([]byte,128<<10)
    count,err:=io.CopyBuffer(h,relinkReader{ctx, f},buffer)
    if err!=nil{return "",errors.New("unable to hash complete candidate media: "+err.Error())}
    after,err:=f.Stat()
    if err!=nil||!os.SameFile(before,after)||count!=expectedSize||
        before.Size()!=after.Size()||!before.ModTime().Equal(after.ModTime()){
        return "",errors.New("candidate was modified during verification")
    }
    current,err:=root.Lstat(rel)
    if err!=nil||!os.SameFile(after,current)||!current.ModTime().Equal(after.ModTime()){
        return "",errors.New("candidate path changed during verification")
    }
    return hex.EncodeToString(h.Sum(nil)),nil
}

func relinkRefCount(ctx context.Context,q bulkQuerier,table,column string,id int64)(int,error){
    // The table/column identifiers are hardcoded in a trusted allowlist
    // below. Skip tables from optional legacy migrations not yet installed.
    var exists int
    if err:=q.QueryRowContext(ctx,`SELECT count(*) FROM sqlite_master
        WHERE type='table' AND name=?`,table).Scan(&exists);err!=nil{return 0,err}
    if exists==0{return 0,nil}
    var count int
    err:=q.QueryRowContext(ctx,"SELECT count(*) FROM "+table+" WHERE "+column+"=?",id).Scan(&count)
    return count,err
}

func (a *app) relinkCheck(ctx context.Context,q bulkQuerier,old,candidate relinkIdentity)error{
    if old.AssetID==candidate.AssetID||old.WorkID==candidate.WorkID||
        old.SourceID!=candidate.SourceID||old.Format!=candidate.Format{
        return errors.New("select one old and one new file of the same format and library")
    }
    if old.Available||!candidate.Available {
        return errors.New("old file must be unavailable and candidate currently available")
    }
    if old.Size<1||old.Size!=candidate.Size {
        return errors.New("old and new indexed file lengths differ; cannot relink safely")
    }
    if !candidate.Auto||candidate.Publication=="published"||candidate.MetadataSource=="manual"||
        candidate.MetadataSource=="legacy"||candidate.FieldRevision!=0{
        return errors.New("candidate has independent edits or publication; do not merge it")
    }
    if candidate.WorkID<=0||old.WorkID<=0||candidate.GroupKey==""{
        return errors.New("candidate has no isolated automatic work")
    }
    // Deliberately scope to single-file, single-edition works. A partial
    // multi-track or manually grouped conversion could destroy chapter order.
    for _,item:=range []relinkIdentity{old,candidate}{
        var editions,files int
        err:=q.QueryRowContext(ctx,`SELECT
          (SELECT count(*) FROM editions WHERE work_id=?),
          (SELECT count(*) FROM edition_assets ea JOIN editions e ON e.id=ea.edition_id
           WHERE e.work_id=?)`,item.WorkID,item.WorkID).Scan(&editions,&files)
        if err!=nil{return err}
        if editions!=1||files!=1{
            return errors.New("a work has multiple files or editions; use a specialist grouped relink")
        }
    }
    // The freshly scanned candidate must have no separately owned state.
    // Every referenced entity is guarded before the delete/cascade, even
    // though most rows are absent in a newly staged candidate.
    checks:=[]struct{table,column string;id int64}{
        {"progress","edition_id",candidate.EditionID},
        {"profile_progress","edition_id",candidate.EditionID},
        {"profile_progress","asset_id",candidate.AssetID},
        {"asset_progress","asset_id",candidate.AssetID},
        {"reading_progress","asset_id",candidate.AssetID},
        {"file_moves","asset",candidate.AssetID},
        {"asset_field_controls","asset_id",candidate.AssetID},
        {"asset_metadata_revisions","asset_id",candidate.AssetID},
        {"asset_metadata_audit","asset_id",candidate.AssetID},
        {"work_preferences","work_id",candidate.WorkID},
        {"profile_completions","work_id",candidate.WorkID},
        {"profile_activity","work_id",candidate.WorkID},
        {"selected_work_covers","work_id",candidate.WorkID},
        {"work_publication_events","work_id",candidate.WorkID},
        {"asset_relink_events","asset_id",candidate.AssetID},
    }
    for _,entry:=range checks {
        n,err:=relinkRefCount(ctx,q,entry.table,entry.column,entry.id)
        if err!=nil{return err}
        if n!=0{return fmt.Errorf("candidate has saved data in %s; refusing to discard it",entry.table)}
    }
    // Playback queues are JSON arrays of ASSET IDs rather than foreign-key
    // rows. Losing an independently queued candidate would silently remove
    // somebody's upcoming audiobook; refuse the merge instead.
    var queueTable int
    if err:=q.QueryRowContext(ctx,"SELECT count(*) FROM sqlite_master WHERE type='table' AND name='playback_queue'").Scan(&queueTable);err!=nil{return err}
    if queueTable!=0{
        queueRows,err:=q.QueryContext(ctx,"SELECT ids FROM playback_queue")
        if err!=nil{return err}
        for queueRows.Next(){
            var encoded string
            if err=queueRows.Scan(&encoded);err!=nil{queueRows.Close();return err}
            if len(encoded)>16384{queueRows.Close();return errors.New("saved playback queue is unusually large; review before relinking")}
            var ids []int64
            if err=json.Unmarshal([]byte(encoded),&ids);err!=nil{queueRows.Close();return errors.New("saved playback queue is invalid; review before relinking")}
            for _,id:=range ids{
                if id==candidate.AssetID{
                    queueRows.Close()
                    return errors.New("candidate belongs to a saved listening queue; remove it before relinking")
                }
            }
        }
        if err=queueRows.Err();err!=nil{queueRows.Close();return err}
        queueRows.Close()
    }
    var movesTable int
    if err:=q.QueryRowContext(ctx,"SELECT count(*) FROM sqlite_master WHERE type='table' AND name='file_moves'").Scan(&movesTable);err!=nil{return err}
    if movesTable!=0{
        var pending int
        if err:=q.QueryRowContext(ctx,`SELECT count(*) FROM file_moves
            WHERE asset=? AND state IN ('preview','applying','linked')`,old.AssetID).Scan(&pending);err!=nil{return err}
        if pending!=0{return errors.New("original file has a pending organisation preview; cancel or complete it first")}
    }
    var collisions int
    err:=q.QueryRowContext(ctx,`SELECT count(*) FROM works WHERE auto=1
        AND group_key=? AND id NOT IN (?,?)`,candidate.GroupKey,old.WorkID,candidate.WorkID).Scan(&collisions)
    if err!=nil{return err}
    if collisions!=0{return errors.New("another work already uses the candidate's grouping identity")}
    if a.movesPending(){return errors.New("finish or recover pending file moves before relinking")}
    return nil
}

// A receipt is keyed with the process-local random server token, binds all
// visible fields and expires. Restart invalidates outstanding previews.
func relinkReceipt(secret string,p relinkPreview)string{
    p.Receipt=""
    data,_:=json.Marshal(p)
    mac:=hmac.New(sha256.New,[]byte(secret))
    mac.Write(data)
    return hex.EncodeToString(mac.Sum(nil))
}
func (a *app) relinkPreview(ctx context.Context,ids relinkRequest)(relinkPreview,error){
    p:=relinkPreview{}
    if ids.OldAssetID<=0||ids.CandidateAssetID<=0||ids.OldAssetID==ids.CandidateAssetID {
        return p,errors.New("choose two different file IDs")
    }
    old,err:=relinkIdentityFor(ctx,a.db,ids.OldAssetID)
    if err!=nil{return p,errors.New("original indexed file is missing")}
    target,err:=relinkIdentityFor(ctx,a.db,ids.CandidateAssetID)
    if err!=nil{return p,errors.New("candidate indexed file is missing")}
    if err=a.relinkCheck(ctx,a.db,old,target);err!=nil{return p,err}
    root,err:=relinkSourcePath(old.SourceRoot,old.Path)
    if err!=nil{return p,err}
    defer root.Close()
    _,err=root.Lstat(old.Path)
    if err==nil {
        return p,errors.New("original file exists at its old path; rescan instead of relinking")
    }
    if !errors.Is(err,os.ErrNotExist) {
        return p,errors.New("original file path cannot be verified absent")
    }
    hash,err:=fullRelinkFileHash(ctx,root,target.Path,target.Size)
    if err!=nil{return p,err}
    p=relinkPreview{Old:old,Candidate:target,SHA256:hash,
        Expire:time.Now().Add(relinkPreviewTTL).Unix(),RequiresAttestation:true,
        Important:"The old media bytes are unavailable. Identical file size does NOT prove identity. Confirm this is the same file only if you have checked independently; otherwise do not apply."}
    p.Receipt=relinkReceipt(a.token,p)
    return p,nil
}

func (a *app) applyRelink(ctx context.Context,p relinkPreview)error{
    if time.Now().Unix()>p.Expire||p.Expire>time.Now().Add(relinkPreviewTTL+time.Minute).Unix()||
        p.Old.AssetID<=0||p.Candidate.AssetID<=0||len(p.SHA256)!=64{
        return errors.New("relink preview expired or invalid; preview again")
    }
    supplied,err:=hex.DecodeString(p.Receipt)
    expected,_:=hex.DecodeString(relinkReceipt(a.token,p))
    if err!=nil||!hmac.Equal(supplied,expected){
        return errors.New("relink preview was changed; preview again")
    }
    old,err:=relinkIdentityFor(ctx,a.db,p.Old.AssetID)
    if err!=nil{return errors.New("old file changed; preview again")}
    target,err:=relinkIdentityFor(ctx,a.db,p.Candidate.AssetID)
    if err!=nil{return errors.New("candidate changed; preview again")}
    if old!=p.Old||target!=p.Candidate{return errors.New("catalogue or metadata changed; preview again")}
    if err=a.relinkCheck(ctx,a.db,old,target);err!=nil{return err}
    root,err:=relinkSourcePath(old.SourceRoot,old.Path)
    if err!=nil{return err}
    defer root.Close()
    if _,err=root.Lstat(old.Path);err==nil {
        return errors.New("original media reappeared; rescan instead of relinking")
    }else if !errors.Is(err,os.ErrNotExist){
        return errors.New("original media absence cannot be confirmed")
    }
    digest,err:=fullRelinkFileHash(ctx,root,target.Path,target.Size)
    if err!=nil{return err}
    if digest!=p.SHA256{return errors.New("candidate bytes changed after preview; do not relink")}
    if _,err=root.Lstat(old.Path);err==nil{
        return errors.New("original media returned during hash verification; rescan instead")
    }else if !errors.Is(err,os.ErrNotExist){
        return errors.New("original media path could not be verified absent after hashing")
    }
    // No user media is renamed/deleted/copied. A single SQL transaction
    // retires ONLY the untouched staged candidate and repoints the old asset,
    // retaining original asset/edition/work IDs and all reading positions.
    tx,err:=a.db.BeginTx(ctx,nil)
    if err!=nil{return err}
    defer tx.Rollback()
    // Snapshot the target and every FK-linked user state *inside* the same
    // transaction as its retirement. Progress/activity can be written while
    // SHA-256 is computed and are not protected by scanMu.
    insideOld,err:=relinkIdentityFor(ctx,tx,old.AssetID)
    if err!=nil{return err}
    insideTarget,err:=relinkIdentityFor(ctx,tx,target.AssetID)
    if err!=nil{return err}
    if insideOld!=old||insideTarget!=target{return errors.New("book changed while verifying destination; preview again")}
    if err=a.relinkCheck(ctx,tx,insideOld,insideTarget);err!=nil{return err}
    if _,err=tx.ExecContext(ctx,"DELETE FROM assets WHERE id=?",target.AssetID);err!=nil{return err}
    if _,err=tx.ExecContext(ctx,"DELETE FROM editions WHERE id=?",target.EditionID);err!=nil{return err}
    if _,err=tx.ExecContext(ctx,"DELETE FROM works WHERE id=?",target.WorkID);err!=nil{return err}
    res,err:=tx.ExecContext(ctx,`UPDATE assets SET
        relative_path=?,available=1,scan_signature=?,size_bytes=?,modified_unix=?
        WHERE id=? AND source_id=? AND available=0`,
        target.Path,target.Signature,target.Size,target.Modified,old.AssetID,old.SourceID)
    if err!=nil{return err}
    changed,err:=res.RowsAffected()
    if err!=nil||changed!=1{return errors.New("old file changed during relink; preview again")}
    if old.Auto{
        if _,err=tx.ExecContext(ctx,"UPDATE works SET group_key=? WHERE id=?",
            target.GroupKey,old.WorkID);err!=nil{return err}
    }
    if _,err=tx.ExecContext(ctx,`UPDATE work_publication SET revision=revision+1
        WHERE work_id=?`,old.WorkID);err!=nil{return err}
    if _,err=tx.ExecContext(ctx,`INSERT INTO asset_relink_events(
       asset_id,work_id,retired_candidate_asset,retired_candidate_work,
       source_id,from_path,to_path,destination_sha256,verification,recorded_at)
       VALUES(?,?,?,?,?,?,?,?,'owner-attested;destination-sha256',?)`,
       old.AssetID,old.WorkID,target.AssetID,target.WorkID,
       old.SourceID,old.Path,target.Path,digest,time.Now().Unix());err!=nil{return err}
    return tx.Commit()
}

func (a *app) relinkRoutes(mux *http.ServeMux){
    mux.HandleFunc("POST /api/manage/relink/preview",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator required"));return}
        var in relinkRequest
        if err:=decodeBulkJSON(w,r,&in);err!=nil{fail(w,400,err);return}
        a.scanMu.Lock()
        defer a.scanMu.Unlock()
        preview,err:=a.relinkPreview(r.Context(),in)
        if err!=nil{fail(w,409,err);return}
        reply(w,preview)
    })
    mux.HandleFunc("POST /api/manage/relink/apply",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator required"));return}
        var in relinkApply
        if err:=decodeBulkJSON(w,r,&in);err!=nil{fail(w,400,err);return}
        if !in.Confirm||in.Attestation!="same-file-verified-by-owner"{
            fail(w,400,errors.New("explicit owner identity attestation required"));return
        }
        a.scanMu.Lock()
        defer a.scanMu.Unlock()
        if err:=a.applyRelink(r.Context(),in.Preview);err!=nil{fail(w,409,err);return}
        reply(w,map[string]any{"ok":true,"assetId":in.Preview.Old.AssetID,
            "workId":in.Preview.Old.WorkID,"editionId":in.Preview.Old.EditionID,
            "status":"relinked","verification":"owner-attested;destination-sha256"})
    })
}
