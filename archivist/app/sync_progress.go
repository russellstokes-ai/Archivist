package main

import (
    "context"
    "crypto/rand"
    "crypto/sha256"
    "database/sql"
    "encoding/hex"
    "errors"
    "net/http"
    "strconv"
    "time"
)

// A completed response is never evidence that an outbox entry was deleted.
// All pages of a progress read must originate in the same immutable database
// view. The cache is strictly profile-scoped, short-lived, and size-limited.
const (
    maxProgressSnapshotEntries=10000
    maxProgressSnapshots=16
    progressSnapshotTTL=3*time.Minute
)

type syncProgressEntry struct {
    Kind string `json:"kind"`
    ID int64 `json:"id"`
    Asset int64 `json:"asset,omitempty"`
    Part int `json:"part"`
    Seconds float64 `json:"seconds"`
    Fraction float64 `json:"fraction"`
    Revision int64 `json:"revision"`
    Complete bool `json:"complete"`
}

type progressSnapshot struct {
    profileID int64
    owner bool
    grants [32]byte
    entries []syncProgressEntry
    pageLimit int
    expires time.Time
}

type progressGrantQuerier interface {
    QueryContext(context.Context,string,...any)(*sql.Rows,error)
}

// A change in grants invalidates the prior snapshot instead of disclosing a
// now-restricted catalogue. The first hash is read in the same DB transaction
// as the immutable progress query; later pages re-evaluate authorisation.
func progressGrantsDigest(ctx context.Context,q progressGrantQuerier,p identity)([32]byte,error){
    if p.Owner{return sha256.Sum256([]byte("owner")),nil}
    rows,err:=q.QueryContext(ctx,"SELECT space FROM grants WHERE profile_id=? ORDER BY space",p.ID)
    if err!=nil{return [32]byte{},err}
    defer rows.Close()
    h:=sha256.New()
    for rows.Next(){
        var space string
        if err=rows.Scan(&space);err!=nil{return [32]byte{},err}
        // Length prefix avoids collisions even if a space contains a newline.
        h.Write([]byte(strconv.Itoa(len(space))+":"))
        h.Write([]byte(space))
    }
    if err=rows.Err();err!=nil{return [32]byte{},err}
    var digest [32]byte
    copy(digest[:],h.Sum(nil))
    return digest,nil
}

func (a *app) loadProgressSnapshot(ctx context.Context,p identity)([]syncProgressEntry,[32]byte,error){
    tx,err:=a.db.BeginTx(ctx,&sql.TxOptions{ReadOnly:true})
    if err!=nil{return nil,[32]byte{},err}
    defer tx.Rollback()
    grants,err:=progressGrantsDigest(ctx,tx,p)
    if err!=nil{return nil,[32]byte{},err}
    // A hard cap returns an explicit error before a partial page can be
    // mistaken for a complete server history. No per-page OFFSET is used.
    rows,err:=tx.QueryContext(ctx,`
SELECT kind,id,asset,part,seconds,fraction,revision,complete FROM (
    SELECT 'edition' AS kind,p.edition_id AS id,p.asset_id AS asset,
        0 AS part,p.seconds AS seconds,0 AS fraction,p.revision AS revision,p.complete AS complete
    FROM profile_progress p JOIN editions e ON e.id=p.edition_id
        JOIN works w ON w.id=e.work_id
    WHERE p.profile_id=? AND (? OR EXISTS (
        SELECT 1 FROM grants g WHERE g.profile_id=? AND g.space=w.space))
    UNION ALL
    SELECT 'listening',p.asset_id,p.asset_id,0,p.seconds,0,p.revision,p.complete
    FROM asset_progress p JOIN assets a ON a.id=p.asset_id
        JOIN sources s ON s.id=a.source_id
    WHERE p.profile_id=? AND (? OR EXISTS (
        SELECT 1 FROM grants g WHERE g.profile_id=? AND g.space=s.space))
    UNION ALL
    SELECT 'reading',p.asset_id,0,p.part,0,p.fraction,p.revision,p.complete
    FROM reading_progress p JOIN assets a ON a.id=p.asset_id
        JOIN sources s ON s.id=a.source_id
    WHERE p.profile_id=? AND (? OR EXISTS (
        SELECT 1 FROM grants g WHERE g.profile_id=? AND g.space=s.space))
) ORDER BY kind,id LIMIT ?`,
        p.ID,p.Owner,p.ID,
        p.ID,p.Owner,p.ID,
        p.ID,p.Owner,p.ID,
        maxProgressSnapshotEntries+1)
    if err!=nil{return nil,[32]byte{},err}
    entries:=make([]syncProgressEntry,0,128)
    for rows.Next(){
        var item syncProgressEntry
        if err=rows.Scan(&item.Kind,&item.ID,&item.Asset,&item.Part,&item.Seconds,
            &item.Fraction,&item.Revision,&item.Complete);err!=nil{
            rows.Close()
            return nil,[32]byte{},err
        }
        if len(entries)>=maxProgressSnapshotEntries{
            rows.Close()
            return nil,[32]byte{},errProgressSnapshotTooLarge
        }
        entries=append(entries,item)
    }
    if err=rows.Err();err!=nil{rows.Close();return nil,[32]byte{},err}
    if err=rows.Close();err!=nil{return nil,[32]byte{},err}
    if err=tx.Commit();err!=nil{return nil,[32]byte{},err}
    return entries,grants,nil
}

var errProgressSnapshotTooLarge=errors.New("progress snapshot exceeds the safe 10000-entry limit; no offline bookmarks were reconciled")

func (a *app) storeProgressSnapshot(ctx context.Context,p identity,limit int)(string,*progressSnapshot,error){
    entries,grants,err:=a.loadProgressSnapshot(ctx,p)
    if err!=nil{return "",nil,err}
    tokenBytes:=make([]byte,24)
    if _,err=rand.Read(tokenBytes);err!=nil{return "",nil,err}
    token:=hex.EncodeToString(tokenBytes)
    now:=time.Now()
    snapshot:=&progressSnapshot{profileID:p.ID,owner:p.Owner,grants:grants,
        entries:entries,pageLimit:limit,expires:now.Add(progressSnapshotTTL)}
    a.syncMu.Lock()
    defer a.syncMu.Unlock()
    if a.syncSnapshots==nil{a.syncSnapshots=make(map[string]*progressSnapshot)}
    for key,old:=range a.syncSnapshots{
        if !old.expires.After(now){delete(a.syncSnapshots,key)}
    }
    if len(a.syncSnapshots)>=maxProgressSnapshots{
        return "",nil,errors.New("too many active progress snapshots; retry after earlier reads expire")
    }
    a.syncSnapshots[token]=snapshot
    return token,snapshot,nil
}

func (a *app) readProgressSnapshot(token string,p identity,limit int)(*progressSnapshot,bool){
    now:=time.Now()
    a.syncMu.Lock()
    defer a.syncMu.Unlock()
    snapshot:=a.syncSnapshots[token]
    if snapshot==nil{return nil,false}
    if !snapshot.expires.After(now){
        delete(a.syncSnapshots,token)
        return nil,false
    }
    if snapshot.profileID!=p.ID||snapshot.owner!=p.Owner||snapshot.pageLimit!=limit{return nil,false}
    return snapshot,true
}

func (a *app) discardProgressSnapshot(token string){
    a.syncMu.Lock()
    defer a.syncMu.Unlock()
    delete(a.syncSnapshots,token)
}

func (a *app) syncProgressRoutes(mux *http.ServeMux) {
    mux.HandleFunc("GET /api/sync/progress",func(w http.ResponseWriter,r *http.Request){
        limit:=100
        if raw:=r.URL.Query().Get("limit");raw!=""{
            parsed,err:=strconv.Atoi(raw)
            if err!=nil||parsed<1||parsed>200{
                fail(w,400,errors.New("limit must be between 1 and 200"))
                return
            }
            limit=parsed
        }
        offset:=0
        if raw:=r.URL.Query().Get("offset");raw!=""{
            parsed,err:=strconv.Atoi(raw)
            if err!=nil||parsed<0||parsed>1000000{
                fail(w,400,errors.New("invalid progress offset"))
                return
            }
            offset=parsed
        }
        profile:=who(r)
        token:=r.URL.Query().Get("snapshot")
        var snapshot *progressSnapshot
        if token==""{
            // Breaking a legacy OFFSET-only continuation is safer than
            // silently claiming a complete but inconsistent reconciliation.
            if offset!=0{
                fail(w,http.StatusConflict,errors.New("snapshot token required for progress continuation; restart from offset 0"))
                return
            }
            var err error
            token,snapshot,err=a.storeProgressSnapshot(r.Context(),profile,limit)
            if err!=nil{
                if errors.Is(err,errProgressSnapshotTooLarge){fail(w,http.StatusRequestEntityTooLarge,err)}
                else{fail(w,http.StatusServiceUnavailable,err)}
                return
            }
        }else{
            if len(token)!=48{
                fail(w,http.StatusConflict,errors.New("invalid or expired progress snapshot; restart safely"))
                return
            }
            var ok bool
            snapshot,ok=a.readProgressSnapshot(token,profile,limit)
            if !ok{
                fail(w,http.StatusConflict,errors.New("unknown or expired progress snapshot; restart safely"))
                return
            }
            currentGrants,err:=progressGrantsDigest(r.Context(),a.db,profile)
            if err!=nil{fail(w,503,errors.New("cannot verify progress snapshot grants"));return}
            if currentGrants!=snapshot.grants{
                a.discardProgressSnapshot(token)
                fail(w,http.StatusConflict,errors.New("progress permissions changed; restart safely"))
                return
            }
        }
        if offset>len(snapshot.entries){
            fail(w,http.StatusConflict,errors.New("snapshot position invalid; restart safely"))
            return
        }
        end:=offset+limit
        if end>len(snapshot.entries){end=len(snapshot.entries)}
        part:=make([]syncProgressEntry,0,end-offset)
        part=append(part,snapshot.entries[offset:end]...)
        reply(w,map[string]any{
            "items":part,
            "hasMore":end<len(snapshot.entries),
            "nextOffset":end,
            "snapshot":token,
            "note":"Read-only immutable server snapshot. Write only with revision-checked progress endpoints.",
        })
    })
}
