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
    "strconv"
    "time"
)

const maxGroupedRelinkTracks=32
const maxGroupedRelinkBytes int64=4<<30

// This path is distinct from single-file relink: every chapter identity and
// original position must be retained. Mapping is supplied by the owner,
// never derived by matching titles, filenames, sizes or content similarity.
type groupedRelinkWork struct {
    WorkID int64 `json:"workId"`
    EditionID int64 `json:"editionId"`
    Title string `json:"title"`
    SourceID int64 `json:"sourceId"`
    SourceRoot string `json:"sourceRoot"`
    GroupKey string `json:"groupKey"`
    Auto bool `json:"auto"`
    Format string `json:"format"`
    Tracks []groupedRelinkTrack `json:"tracks"`
}
type groupedRelinkTrack struct {
    Identity relinkIdentity `json:"identity"`
    Position int `json:"position"`
}
type groupedRelinkPair struct {
    Old groupedRelinkTrack `json:"old"`
    Candidate groupedRelinkTrack `json:"candidate"`
    SHA256 string `json:"sha256"`
}
type groupedRelinkRequest struct {
    Pairs []relinkRequest `json:"pairs"`
}
type groupedRelinkPreview struct {
    OldWorkID int64 `json:"oldWorkId"`
    CandidateWorkID int64 `json:"candidateWorkId"`
    OldTitle string `json:"oldTitle"`
    CandidateTitle string `json:"candidateTitle"`
    Pairs []groupedRelinkPair `json:"pairs"`
    ExpiresAt int64 `json:"expiresAt"`
    RequiresAttestation bool `json:"requiresAttestation"`
    Important string `json:"important"`
    Receipt string `json:"receipt"`
}
type groupedRelinkApply struct {
    Preview groupedRelinkPreview `json:"preview"`
    Confirm bool `json:"confirm"`
    Attestation string `json:"attestation"`
}

func groupedWorkFor(ctx context.Context,q bulkQuerier,workID int64)(groupedRelinkWork,error){
    result:=groupedRelinkWork{WorkID:workID,Tracks:[]groupedRelinkTrack{}}
    if workID<1{return result,errors.New("invalid audiobook ID")}
    var editionCount int
    err:=q.QueryRowContext(ctx,`SELECT w.title,w.auto,w.group_key,
      (SELECT count(*) FROM editions WHERE work_id=w.id)
      FROM works w WHERE w.id=?`,workID).Scan(
      &result.Title,&result.Auto,&result.GroupKey,&editionCount)
    if err!=nil{return result,err}
    if editionCount!=1{return result,errors.New("grouped relink requires one edition per book")}
    if err=q.QueryRowContext(ctx,
      "SELECT id,format FROM editions WHERE work_id=?",workID).
      Scan(&result.EditionID,&result.Format);err!=nil{return result,err}
    if result.Format!="Audio"{return result,errors.New("only grouped audiobooks can be relinked")}
    if !result.Auto||result.GroupKey==""{
        return result,errors.New("manual/custom audiobook grouping requires specialised reconciliation")
    }
    rows,err:=q.QueryContext(ctx,`SELECT ea.asset_id,ea.position
      FROM edition_assets ea WHERE ea.edition_id=?
      ORDER BY ea.position,ea.asset_id`,result.EditionID)
    if err!=nil{return result,err}
    ids:=[]int64{}
    positions:=[]int{}
    for rows.Next(){
        var id int64
        var position int
        if err=rows.Scan(&id,&position);err!=nil{rows.Close();return result,err}
        ids=append(ids,id);positions=append(positions,position)
        if len(ids)>maxGroupedRelinkTracks{rows.Close();return result,errors.New("audiobook exceeds safe 32-track group limit")}
    }
    if err=rows.Err();err!=nil{rows.Close();return result,err}
    rows.Close()
    if len(ids)<2{return result,errors.New("grouped relink requires at least two audio tracks")}
    for i,id:=range ids{
        track,err:=relinkIdentityFor(ctx,q,id)
        if err!=nil{return result,err}
        if track.WorkID!=workID||track.EditionID!=result.EditionID{
            return result,errors.New("audiobook track changed while inspecting it")
        }
        if i==0{
            result.SourceID=track.SourceID
            result.SourceRoot=track.SourceRoot
        }
        if track.SourceID!=result.SourceID||track.SourceRoot!=result.SourceRoot||
            track.GroupKey!=result.GroupKey||positions[i]!=i{
            return result,errors.New("book has mixed sources, sparse order or inconsistent grouping")
        }
        result.Tracks=append(result.Tracks,groupedRelinkTrack{Identity:track,Position:positions[i]})
    }
    return result,nil
}

func (a *app) groupRelinkCheck(ctx context.Context,q bulkQuerier,
    oldWork,candidate groupedRelinkWork,pairs []relinkRequest)error{
    if oldWork.WorkID==candidate.WorkID||
        oldWork.SourceID!=candidate.SourceID||
        oldWork.SourceRoot!=candidate.SourceRoot||
        oldWork.GroupKey==candidate.GroupKey||
        len(oldWork.Tracks)!=len(candidate.Tracks)||
        len(pairs)!=len(oldWork.Tracks){
        return errors.New("choose two separate complete audio groups within one source")
    }
    oldByID:=map[int64]groupedRelinkTrack{}
    newByID:=map[int64]groupedRelinkTrack{}
    for _,track:=range oldWork.Tracks{oldByID[track.Identity.AssetID]=track}
    for _,track:=range candidate.Tracks{newByID[track.Identity.AssetID]=track}
    seenOld,seenNew:=map[int64]bool{},map[int64]bool{}
    var sum int64
    for _,p:=range pairs{
        from,okOld:=oldByID[p.OldAssetID]
        to,okNew:=newByID[p.CandidateAssetID]
        if !okOld||!okNew||seenOld[p.OldAssetID]||seenNew[p.CandidateAssetID]||
            from.Position!=to.Position{
            return errors.New("explicit mapping must include every original and replacement once in the same chapter order")
        }
        seenOld[p.OldAssetID]=true;seenNew[p.CandidateAssetID]=true
        if err:=a.relinkCheckCardinality(ctx,q,from.Identity,to.Identity,true);err!=nil{return err}
        sum+=to.Identity.Size
        if sum>maxGroupedRelinkBytes{return errors.New("group exceeds 4 GiB full-hash safety budget; use specialist recovery")}
    }
    if len(seenOld)!=len(oldWork.Tracks)||len(seenNew)!=len(candidate.Tracks){
        return errors.New("both complete audiobook track lists must be included")
    }
    // Keep the signed preview deterministic: explicit mapping is in canonical
    // original chapter order, not arbitrary request order.
    for i,p:=range pairs{
        if oldByID[p.OldAssetID].Position!=i{
            return errors.New("list chapter mappings in original playback order")
        }
    }
    return nil
}

func groupRelinkReceipt(secret string,p groupedRelinkPreview)string{
    p.Receipt=""
    raw,_:=json.Marshal(p)
    mac:=hmac.New(sha256.New,[]byte(secret))
    mac.Write(raw)
    return hex.EncodeToString(mac.Sum(nil))
}

func (a *app) groupRelinkPreview(ctx context.Context,request groupedRelinkRequest)(groupedRelinkPreview,error){
    out:=groupedRelinkPreview{Pairs:[]groupedRelinkPair{}}
    if len(request.Pairs)<2||len(request.Pairs)>maxGroupedRelinkTracks{
        return out,errors.New("choose 2–32 explicit audio chapter mappings")
    }
    first:=request.Pairs[0]
    oldTrack,err:=relinkIdentityFor(ctx,a.db,first.OldAssetID)
    if err!=nil{return out,errors.New("first original track missing")}
    candidateTrack,err:=relinkIdentityFor(ctx,a.db,first.CandidateAssetID)
    if err!=nil{return out,errors.New("first replacement track missing")}
    oldWork,err:=groupedWorkFor(ctx,a.db,oldTrack.WorkID)
    if err!=nil{return out,err}
    candidateWork,err:=groupedWorkFor(ctx,a.db,candidateTrack.WorkID)
    if err!=nil{return out,err}
    if err=a.groupRelinkCheck(ctx,a.db,oldWork,candidateWork,request.Pairs);err!=nil{
        return out,err
    }
    root,err:=relinkSourcePath(oldWork.SourceRoot,oldWork.Tracks[0].Identity.Path)
    if err!=nil{return out,err}
    defer root.Close()
    for _,item:=range request.Pairs{
        old:=oldWork.Tracks[len(out.Pairs)]
        newTrack:=candidateWork.Tracks[len(out.Pairs)]
        if old.Identity.AssetID!=item.OldAssetID||
            newTrack.Identity.AssetID!=item.CandidateAssetID{
            return out,errors.New("track mapping is not in chapter order")
        }
        if _,err=root.Lstat(old.Identity.Path);err==nil{
            return out,errors.New("an original track still exists; rescan rather than relink")
        }else if !errors.Is(err,os.ErrNotExist){return out,errors.New("old track path cannot be verified absent")}
        sha,err:=fullRelinkFileHash(ctx,root,newTrack.Identity.Path,newTrack.Identity.Size)
        if err!=nil{return out,fmt.Errorf("chapter %d: %w",old.Position+1,err)}
        out.Pairs=append(out.Pairs,groupedRelinkPair{Old:old,Candidate:newTrack,SHA256:sha})
    }
    out.OldWorkID=oldWork.WorkID
    out.CandidateWorkID=candidateWork.WorkID
    out.OldTitle=oldWork.Title
    out.CandidateTitle=candidateWork.Title
    out.ExpiresAt=time.Now().Add(relinkPreviewTTL).Unix()
    out.RequiresAttestation=true
    out.Important="The missing original tracks cannot be cryptographically compared. Confirm every track pairing in order using independent evidence. Full hashes only verify unchanged replacement bytes."
    out.Receipt=groupRelinkReceipt(a.token,out)
    return out,nil
}

func (a *app) applyGroupRelink(ctx context.Context,preview groupedRelinkPreview)error{
    if len(preview.Pairs)<2||len(preview.Pairs)>maxGroupedRelinkTracks||
        time.Now().Unix()>preview.ExpiresAt||
        preview.ExpiresAt>time.Now().Add(relinkPreviewTTL+time.Minute).Unix(){
        return errors.New("group preview expired or invalid")
    }
    actual,err:=hex.DecodeString(preview.Receipt)
    want,_:=hex.DecodeString(groupRelinkReceipt(a.token,preview))
    if err!=nil||!hmac.Equal(actual,want){
        return errors.New("grouped relink preview was changed or expired")
    }
    oldWork,err:=groupedWorkFor(ctx,a.db,preview.OldWorkID)
    if err!=nil{return err}
    candidate,err:=groupedWorkFor(ctx,a.db,preview.CandidateWorkID)
    if err!=nil{return err}
    pairs:=make([]relinkRequest,len(preview.Pairs))
    for i,p:=range preview.Pairs{pairs[i]=relinkRequest{p.Old.Identity.AssetID,p.Candidate.Identity.AssetID}}
    if err=a.groupRelinkCheck(ctx,a.db,oldWork,candidate,pairs);err!=nil{return err}
    if oldWork.Title!=preview.OldTitle||candidate.Title!=preview.CandidateTitle{return errors.New("work metadata changed; preview again")}
    root,err:=relinkSourcePath(oldWork.SourceRoot,oldWork.Tracks[0].Identity.Path)
    if err!=nil{return err}
    defer root.Close()
    for i,pair:=range preview.Pairs{
        old,found:=oldWork.Tracks[i],candidate.Tracks[i]
        if old!=pair.Old||found!=pair.Candidate{
            return errors.New("group identity, revision or chapter mapping changed; preview again")
        }
        if _,err=root.Lstat(old.Identity.Path);err==nil{
            return errors.New("original audiobook file reappeared; rescan instead")
        }else if !errors.Is(err,os.ErrNotExist){return errors.New("cannot confirm original file absence")}
        sha,err:=fullRelinkFileHash(ctx,root,found.Identity.Path,found.Identity.Size)
        if err!=nil{return err}
        if sha!=pair.SHA256{return errors.New("a replacement track changed since preview; no changes applied")}
        // Repeat absence check to defend against late external restoration
        // during the full hash of a multi-GB replacement.
        if _,err=root.Lstat(old.Identity.Path);err==nil{
            return errors.New("old track returned during verification; rescan")
        }else if !errors.Is(err,os.ErrNotExist){return errors.New("old track path became inaccessible")}
    }
    tx,err:=a.db.BeginTx(ctx,nil)
    if err!=nil{return err}
    defer tx.Rollback()
    savedOld,err:=groupedWorkFor(ctx,tx,preview.OldWorkID)
    if err!=nil{return err}
    savedNew,err:=groupedWorkFor(ctx,tx,preview.CandidateWorkID)
    if err!=nil{return err}
    if savedOld.Title!=oldWork.Title||savedNew.Title!=candidate.Title||
        len(savedOld.Tracks)!=len(preview.Pairs)||len(savedNew.Tracks)!=len(preview.Pairs){
        return errors.New("group changed before commit; preview again")
    }
    if err=a.groupRelinkCheck(ctx,tx,savedOld,savedNew,pairs);err!=nil{return err}
    for i,pair:=range preview.Pairs{
        if savedOld.Tracks[i]!=pair.Old||savedNew.Tracks[i]!=pair.Candidate{
            return errors.New("group changed while preparing database commit")
        }
    }
    // One transaction: retire all unmodified staged candidate assets and
    // their work/edition, keep every original asset and its reading state.
    for _,pair:=range preview.Pairs{
        if _,err=tx.ExecContext(ctx,"DELETE FROM assets WHERE id=?",pair.Candidate.Identity.AssetID);err!=nil{return err}
    }
    if _,err=tx.ExecContext(ctx,"DELETE FROM editions WHERE id=?",candidate.EditionID);err!=nil{return err}
    if _,err=tx.ExecContext(ctx,"DELETE FROM works WHERE id=?",candidate.WorkID);err!=nil{return err}
    for _,pair:=range preview.Pairs{
        src,dst:=pair.Old.Identity,pair.Candidate.Identity
        res,err:=tx.ExecContext(ctx,`UPDATE assets SET relative_path=?,available=1,
          scan_signature=?,size_bytes=?,modified_unix=?
          WHERE id=? AND source_id=? AND available=0`,
          dst.Path,dst.Signature,dst.Size,dst.Modified,src.AssetID,src.SourceID)
        if err!=nil{return err}
        n,err:=res.RowsAffected()
        if err!=nil||n!=1{return errors.New("old track changed during relink; rolled back")}
        if _,err=tx.ExecContext(ctx,`INSERT INTO asset_relink_events(
          asset_id,work_id,retired_candidate_asset,retired_candidate_work,
          source_id,from_path,to_path,destination_sha256,verification,recorded_at)
          VALUES(?,?,?,?,?,?,?,?,'owner-attested;destination-sha256',?)`,
          src.AssetID,oldWork.WorkID,dst.AssetID,candidate.WorkID,
          oldWork.SourceID,src.Path,dst.Path,pair.SHA256,time.Now().Unix());err!=nil{return err}
    }
    if _,err=tx.ExecContext(ctx,"UPDATE works SET group_key=? WHERE id=?",candidate.GroupKey,oldWork.WorkID);err!=nil{return err}
    if _,err=tx.ExecContext(ctx,"UPDATE work_publication SET revision=revision+1 WHERE work_id=?",oldWork.WorkID);err!=nil{return err}
    return tx.Commit()
}

// A signed full-group preview repeats every chapter's identity/path twice;
// its legitimate representation can exceed the unrelated 32 KiB bulk-metadata
// request limit. Apply has a separate hard 512 KiB cap, strict JSON fields,
// mandatory single object, and later validates 2–32 chapter proofs.
func decodeGroupedRelinkApply(w http.ResponseWriter,r *http.Request,out *groupedRelinkApply)error{
    decoder:=json.NewDecoder(http.MaxBytesReader(w,r.Body,512<<10))
    decoder.DisallowUnknownFields()
    if err:=decoder.Decode(out);err!=nil{
        return errors.New("invalid or oversized grouped relink confirmation")
    }
    var extra any
    if err:=decoder.Decode(&extra);err!=io.EOF{
        return errors.New("grouped relink confirmation must be a single JSON object")
    }
    return nil
}

func (a *app) groupedRelinkRoutes(mux *http.ServeMux){
    mux.HandleFunc("GET /api/manage/relink-groups/works/{id}",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator required"));return}
        id,err:=strconv.ParseInt(r.PathValue("id"),10,64)
        if err!=nil||id<1{fail(w,400,errors.New("invalid work identity"));return}
        snapshot,err:=groupedWorkFor(r.Context(),a.db,id)
        if err!=nil{fail(w,409,err);return}
        reply(w,snapshot)
    })
    mux.HandleFunc("POST /api/manage/relink-groups/preview",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator required"));return}
        var req groupedRelinkRequest
        if err:=decodeBulkJSON(w,r,&req);err!=nil{fail(w,400,err);return}
        a.scanMu.Lock()
        defer a.scanMu.Unlock()
        preview,err:=a.groupRelinkPreview(r.Context(),req)
        if err!=nil{fail(w,409,err);return}
        reply(w,preview)
    })
    mux.HandleFunc("POST /api/manage/relink-groups/apply",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator required"));return}
        var req groupedRelinkApply
        if err:=decodeGroupedRelinkApply(w,r,&req);err!=nil{fail(w,400,err);return}
        if !req.Confirm||req.Attestation!="all-chapter-mappings-verified-by-owner"{
            fail(w,400,errors.New("explicit owner attestation for every chapter is required"));return
        }
        a.scanMu.Lock()
        defer a.scanMu.Unlock()
        if err:=a.applyGroupRelink(r.Context(),req.Preview);err!=nil{fail(w,409,err);return}
        reply(w,map[string]any{"ok":true,"workId":req.Preview.OldWorkID,
            "editionId":req.Preview.Pairs[0].Old.Identity.EditionID,
            "tracks":len(req.Preview.Pairs),"verification":"owner-attested;destination-sha256"})
    })
}
