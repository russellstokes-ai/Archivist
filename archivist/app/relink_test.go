package main

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "os"
    "path/filepath"
    "strconv"
    "strings"
    "testing"
)

func relinkCall(a *app,method,path,payload,key string,action bool)*httptest.ResponseRecorder{
    req:=httptest.NewRequest(method,path,strings.NewReader(payload))
    if key!=""{req.AddCookie(&http.Cookie{Name:"archivist_session",Value:key})}
    if action{req.Header.Set("X-Archivist-Action","1")}
    out:=httptest.NewRecorder()
    a.routes().ServeHTTP(out,req)
    return out
}

type relinkScenario struct {
    a *app
    root string
    oldPath,newPath string
    oldAsset,newAsset,oldWork,newWork,oldEdition int64
    media string
}
func setupRelinkScenario(t *testing.T)relinkScenario{
    t.Helper()
    a:=fixture(t)
    if err:=a.initProgress();err!=nil{t.Fatal(err)}
    if err:=a.initListening();err!=nil{t.Fatal(err)}
    if err:=a.initReader();err!=nil{t.Fatal(err)}
    if err:=a.initPreferences();err!=nil{t.Fatal(err)}
    if err:=a.initCompletions();err!=nil{t.Fatal(err)}
    if err:=a.initActivity();err!=nil{t.Fatal(err)}
    root:=t.TempDir()
    media:="One exact audiobook; owner confirms identity, not an auto match."
    oldPath,newPath:="Original Title.m4b","Renamed Title.m4b"
    if err:=os.WriteFile(filepath.Join(root,oldPath),[]byte(media),0600);err!=nil{t.Fatal(err)}
    if err:=a.addSource("Family Audio",root);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    var oldAsset,oldWork,oldEdition int64
    if err:=a.db.QueryRow(`SELECT a.id,w.id,e.id FROM assets a
       JOIN edition_assets ea ON ea.asset_id=a.id JOIN editions e ON e.id=ea.edition_id
       JOIN works w ON w.id=e.work_id WHERE a.relative_path=?`,oldPath).
       Scan(&oldAsset,&oldWork,&oldEdition);err!=nil{t.Fatal(err)}
    res:=relinkCall(a,"PATCH","/api/assets/"+strconv.FormatInt(oldAsset,10)+"/metadata",
        `{"author":"Verified Author","genre":"History"}`,"test-key",true)
    if res.Code!=200{t.Fatalf("metadata setup failed: %d %s",res.Code,res.Body.String())}
    if _,err:=a.saveProgress(oldEdition,progress{Asset:oldAsset,Seconds:222,Revision:0});err!=nil{t.Fatal(err)}
    if _,err:=a.saveProfileProgress(7,oldEdition,progress{Asset:oldAsset,Seconds:304,Revision:0});err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec(`INSERT INTO work_publication(work_id,state,revision,published_at)
        VALUES(?,'published',4,1234) ON CONFLICT(work_id) DO UPDATE
        SET state='published',revision=4,published_at=1234`,oldWork);err!=nil{t.Fatal(err)}
    if err:=os.Rename(filepath.Join(root,oldPath),filepath.Join(root,newPath));err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    var newAsset,newWork int64
    if err:=a.db.QueryRow(`SELECT a.id,w.id FROM assets a
       JOIN edition_assets ea ON ea.asset_id=a.id JOIN editions e ON e.id=ea.edition_id
       JOIN works w ON w.id=e.work_id WHERE a.relative_path=?`,newPath).
       Scan(&newAsset,&newWork);err!=nil{t.Fatal(err)}
    if oldWork==newWork||oldAsset==newAsset{t.Fatal("synthetic scenario did not produce a separate staged rename candidate")}
    return relinkScenario{a:a,root:root,oldPath:oldPath,newPath:newPath,
        oldAsset:oldAsset,newAsset:newAsset,oldWork:oldWork,newWork:newWork,oldEdition:oldEdition,media:media}
}
func (s relinkScenario)preview(t *testing.T)relinkPreview{
    t.Helper()
    raw,_:=json.Marshal(relinkRequest{OldAssetID:s.oldAsset,CandidateAssetID:s.newAsset})
    res:=relinkCall(s.a,"POST","/api/manage/relink/preview",string(raw),"test-key",true)
    if res.Code!=200{t.Fatalf("relink preview %d: %s",res.Code,res.Body.String())}
    var p relinkPreview
    if err:=json.Unmarshal(res.Body.Bytes(),&p);err!=nil{t.Fatal(err)}
    if p.Old.WorkID!=s.oldWork||p.Candidate.WorkID!=s.newWork||len(p.Receipt)!=64||
        len(p.SHA256)!=64||p.Important==""||!p.RequiresAttestation{
        t.Fatalf("identity-preserving preview incomplete: %+v",p)
    }
    return p
}
func (s relinkScenario)apply(t *testing.T,p relinkPreview,confirm bool,attestation string)*httptest.ResponseRecorder{
    t.Helper()
    raw,_:=json.Marshal(relinkApply{Preview:p,Confirm:confirm,Attestation:attestation})
    return relinkCall(s.a,"POST","/api/manage/relink/apply",string(raw),"test-key",true)
}

func TestOwnerRelinkPreservesIdentityPublicationAndHouseholdProgress(t *testing.T){
    s:=setupRelinkScenario(t)
    // No speculative relinking during scan; no saved progress may move yet.
    var n int
    if err:=s.a.db.QueryRow("SELECT count(*) FROM works").Scan(&n);err!=nil||n!=2{
        t.Fatalf("pre-confirmation scan must retain separate candidates: works=%d err=%v",n,err)
    }
    if got:=relinkCall(s.a,"POST","/api/manage/relink/preview",
        `{"oldAssetId":1,"candidateAssetId":2}`,"",true);got.Code!=401{
        t.Fatalf("anonymous preview allowed=%d",got.Code)
    }
    if got:=relinkCall(s.a,"POST","/api/manage/relink/preview",
        `{"oldAssetId":1,"candidateAssetId":2}`,"test-key",false);got.Code!=403{
        t.Fatalf("preview without action header=%d",got.Code)
    }
    if _,err:=s.a.db.Exec("INSERT INTO profiles(name,key_hash) VALUES('Reader',?)",keyHash("reader"));err!=nil{t.Fatal(err)}
    guest,err:=s.a.newSession("reader");if err!=nil{t.Fatal(err)}
    if got:=relinkCall(s.a,"POST","/api/manage/relink/preview",
        `{"oldAssetId":1,"candidateAssetId":2}`,guest,true);got.Code!=403{
        t.Fatalf("household member can relink: %d",got.Code)
    }
    p:=s.preview(t)
    if p.Old.Path!=s.oldPath||p.Candidate.Path!=s.newPath{
        t.Fatalf("wrong old/new relative paths: %+v",p)
    }
    if got:=s.apply(t,p,false,"same-file-verified-by-owner");got.Code!=400{
        t.Fatalf("unconfirmed relink accepted=%d",got.Code)
    }
    if got:=s.apply(t,p,true,"");got.Code!=400{
        t.Fatalf("missing explicit attestation accepted=%d",got.Code)
    }
    altered:=p;altered.Candidate.Title="not the candidate shown to owner"
    if got:=s.apply(t,altered,true,"same-file-verified-by-owner");got.Code!=409{
        t.Fatalf("tampered preview accepted=%d %s",got.Code,got.Body.String())
    }
    result:=s.apply(t,p,true,"same-file-verified-by-owner")
    if result.Code!=200{t.Fatalf("owner relink failed: %d %s",result.Code,result.Body.String())}
    if got:=s.apply(t,p,true,"same-file-verified-by-owner");got.Code!=409{
        t.Fatalf("replayed relink unexpectedly accepted: %d",got.Code)
    }
    var path,author,genre,source,groupKey,state string
    var available,revision int
    if err:=s.a.db.QueryRow(`SELECT a.relative_path,a.author,a.genre,a.metadata_source,
      a.available,w.group_key,p.state,p.revision FROM assets a
      JOIN edition_assets ea ON ea.asset_id=a.id JOIN editions e ON e.id=ea.edition_id
      JOIN works w ON w.id=e.work_id LEFT JOIN work_publication p ON p.work_id=w.id
      WHERE a.id=? AND e.id=? AND w.id=?`,s.oldAsset,s.oldEdition,s.oldWork).
      Scan(&path,&author,&genre,&source,&available,&groupKey,&state,&revision);err!=nil{t.Fatal(err)}
    if path!=s.newPath||author!="Verified Author"||genre!="History"||
        source!="manual"||available!=1||state!="published"||revision!=5||
        !strings.Contains(groupKey,s.newPath){
        t.Fatalf("relink changed identity/metadata/publication path=%q author=%q genre=%q source=%q available=%d group=%q state=%q revision=%d",
            path,author,genre,source,available,groupKey,state,revision)
    }
    for _,x:=range []struct{profile int64;seconds float64}{{0,222},{7,304}}{
        got,err:=s.a.readProfileProgress(x.profile,s.oldEdition)
        if err!=nil||got.Asset!=s.oldAsset||got.Seconds!=x.seconds{
            t.Fatalf("profile=%d playback lost: %+v %v",x.profile,got,err)
        }
    }
    if err:=s.a.db.QueryRow("SELECT count(*) FROM works").Scan(&n);err!=nil||n!=1{
        t.Fatalf("unused candidate work should disappear: count=%d err=%v",n,err)
    }
    if err:=s.a.db.QueryRow("SELECT count(*) FROM assets WHERE id=?",s.newAsset).Scan(&n);err!=nil||n!=0{
        t.Fatalf("redundant indexed candidate not retired: %d %v",n,err)
    }
    var auditOld,auditNew,auditWork int64
    var digest,verification string
    if err:=s.a.db.QueryRow(`SELECT asset_id,retired_candidate_asset,work_id,
        destination_sha256,verification FROM asset_relink_events LIMIT 1`).Scan(
        &auditOld,&auditNew,&auditWork,&digest,&verification);err!=nil{t.Fatal(err)}
    if auditOld!=s.oldAsset||auditNew!=s.newAsset||auditWork!=s.oldWork||
       digest!=p.SHA256||verification!="owner-attested;destination-sha256"{
        t.Fatalf("missing auditable owner attestation: %d/%d/%d %s %s",auditOld,auditNew,auditWork,digest,verification)
    }
    if err:=s.a.scan(1);err!=nil{t.Fatal(err)}
    if err:=s.a.db.QueryRow("SELECT count(*) FROM works").Scan(&n);err!=nil||n!=1{
        t.Fatalf("subsequent rescan duplicated work: %d %v",n,err)
    }
    got,err:=s.a.readProfileProgress(7,s.oldEdition)
    if err!=nil||got.Asset!=s.oldAsset||got.Seconds!=304{
        t.Fatalf("next rescan corrupted household bookmark: %+v %v",got,err)
    }
    // Reopen a second connection to simulate the durable DB state surviving a
    // server restart: neither the audit trail nor household progress is ephemeral.
    reopened,err:=openDB(s.a.dbPath)
    if err!=nil{t.Fatal(err)}
    defer reopened.Close()
    var savedSeconds float64
    if err=reopened.QueryRow("SELECT seconds FROM profile_progress WHERE profile_id=7 AND edition_id=?",s.oldEdition).Scan(&savedSeconds);err!=nil||savedSeconds!=304{
        t.Fatalf("restart lost household bookmark: seconds=%v err=%v",savedSeconds,err)
    }
    if err=reopened.QueryRow("SELECT count(*) FROM asset_relink_events WHERE asset_id=?",s.oldAsset).Scan(&n);err!=nil||n!=1{
        t.Fatalf("relink audit absent after restart: count=%d err=%v",n,err)
    }
}

func TestRelinkRejectsChangedTargetAndIndependentState(t *testing.T){
    t.Run("changed bytes after preview",func(t *testing.T){
        s:=setupRelinkScenario(t)
        preview:=s.preview(t)
        data:=[]byte(s.media)
        data[len(data)/2]='X' // same length and metadata footprint
        if err:=os.WriteFile(filepath.Join(s.root,s.newPath),data,0600);err!=nil{t.Fatal(err)}
        res:=s.apply(t,preview,true,"same-file-verified-by-owner")
        if res.Code!=409{t.Fatalf("changed contents accepted: %d %s",res.Code,res.Body.String())}
        var n int
        if err:=s.a.db.QueryRow("SELECT count(*) FROM works").Scan(&n);err!=nil||n!=2{
            t.Fatalf("target hash failure partially mutated catalogue: %d %v",n,err)
        }
    })
    t.Run("candidate received independent progress",func(t *testing.T){
        s:=setupRelinkScenario(t)
        preview:=s.preview(t)
        var edition int64
        if err:=s.a.db.QueryRow("SELECT id FROM editions WHERE work_id=?",s.newWork).Scan(&edition);err!=nil{t.Fatal(err)}
        if _,err:=s.a.saveProfileProgress(9,edition,progress{Asset:s.newAsset,Seconds:55,Revision:0});err!=nil{t.Fatal(err)}
        if got:=s.apply(t,preview,true,"same-file-verified-by-owner");got.Code!=409{
            t.Fatalf("candidate progress overwritten: %d %s",got.Code,got.Body.String())
        }
        var n int
        if err:=s.a.db.QueryRow("SELECT count(*) FROM profile_progress WHERE edition_id=?",edition).Scan(&n);err!=nil||n!=1{
            t.Fatalf("candidate progress lost: %d %v",n,err)
        }
    })
    t.Run("candidate already published",func(t *testing.T){
        s:=setupRelinkScenario(t)
        if _,err:=s.a.db.Exec(`INSERT INTO work_publication(work_id,state,revision,published_at)
            VALUES(?,'published',1,1)`,s.newWork);err!=nil{t.Fatal(err)}
        req,_:=json.Marshal(relinkRequest{OldAssetID:s.oldAsset,CandidateAssetID:s.newAsset})
        got:=relinkCall(s.a,"POST","/api/manage/relink/preview",string(req),"test-key",true)
        if got.Code!=409{t.Fatalf("published candidate auto-merged: %d %s",got.Code,got.Body.String())}
    })
    t.Run("old media reappeared",func(t *testing.T){
        s:=setupRelinkScenario(t)
        preview:=s.preview(t)
        if err:=os.WriteFile(filepath.Join(s.root,s.oldPath),[]byte(s.media),0600);err!=nil{t.Fatal(err)}
        got:=s.apply(t,preview,true,"same-file-verified-by-owner")
        if got.Code!=409{t.Fatalf("resurrected old file relinked: %d %s",got.Code,got.Body.String())}
    })
    t.Run("candidate symlink substitution",func(t *testing.T){
        s:=setupRelinkScenario(t)
        preview:=s.preview(t)
        other:=filepath.Join(t.TempDir(),"other.m4b")
        if err:=os.WriteFile(other,[]byte(s.media),0600);err!=nil{t.Fatal(err)}
        if err:=os.Remove(filepath.Join(s.root,s.newPath));err!=nil{t.Fatal(err)}
        if err:=os.Symlink(other,filepath.Join(s.root,s.newPath));err!=nil{t.Skipf("symlinks unsupported: %v",err)}
        got:=s.apply(t,preview,true,"same-file-verified-by-owner")
        if got.Code!=409{t.Fatalf("symlink was followed during relink: %d %s",got.Code,got.Body.String())}
    })
    t.Run("candidate present in family playback queue",func(t *testing.T){
        s:=setupRelinkScenario(t)
        if err:=s.a.initPlayerFeatures();err!=nil{t.Fatal(err)}
        ids:="["+strconv.FormatInt(s.newAsset,10)+"]"
        if _,err:=s.a.db.Exec("INSERT INTO playback_queue(profile_id,ids,revision) VALUES(7,?,1)",ids);err!=nil{t.Fatal(err)}
        req,_:=json.Marshal(relinkRequest{OldAssetID:s.oldAsset,CandidateAssetID:s.newAsset})
        got:=relinkCall(s.a,"POST","/api/manage/relink/preview",string(req),"test-key",true)
        if got.Code!=409{t.Fatalf("candidate queued on another profile was lost: %d %s",got.Code,got.Body.String())}
    })
    t.Run("pending organisation preview on original",func(t *testing.T){
        s:=setupRelinkScenario(t)
        if err:=s.a.initMoves();err!=nil{t.Fatal(err)}
        if _,err:=s.a.db.Exec(`INSERT INTO file_moves(id,asset,root,old_path,new_path,hash,state)
          VALUES('pending-original',?,?,?,?,?,'preview')`,
          s.oldAsset,s.root,s.oldPath,"Sorted/Original Title.m4b","synthetic");err!=nil{t.Fatal(err)}
        req,_:=json.Marshal(relinkRequest{OldAssetID:s.oldAsset,CandidateAssetID:s.newAsset})
        got:=relinkCall(s.a,"POST","/api/manage/relink/preview",string(req),"test-key",true)
        if got.Code!=409{t.Fatalf("original path with pending move preview relinked: %d %s",got.Code,got.Body.String())}
    })
    t.Run("legacy edition progress references candidate asset",func(t *testing.T){
        s:=setupRelinkScenario(t)
        if _,err:=s.a.db.Exec("INSERT INTO progress(edition_id,asset_id,seconds,revision,complete) VALUES(?,?,45,1,0)",
            s.oldEdition,s.newAsset);err!=nil{t.Fatal(err)}
        req,_:=json.Marshal(relinkRequest{OldAssetID:s.oldAsset,CandidateAssetID:s.newAsset})
        res:=relinkCall(s.a,"POST","/api/manage/relink/preview",string(req),"test-key",true)
        if res.Code!=409{t.Fatalf("candidate referenced in legacy progress would be deleted: %d %s",res.Code,res.Body.String())}
    })
    t.Run("candidate has an independently revised staged publication",func(t *testing.T){
        s:=setupRelinkScenario(t)
        if _,err:=s.a.db.Exec("INSERT INTO work_publication(work_id,state,revision,published_at) VALUES(?,'staged',3,0)",
            s.newWork);err!=nil{t.Fatal(err)}
        req,_:=json.Marshal(relinkRequest{OldAssetID:s.oldAsset,CandidateAssetID:s.newAsset})
        res:=relinkCall(s.a,"POST","/api/manage/relink/preview",string(req),"test-key",true)
        if res.Code!=409{t.Fatalf("candidate publication revision lost: %d %s",res.Code,res.Body.String())}
    })
    t.Run("candidate has historical relink work events",func(t *testing.T){
        s:=setupRelinkScenario(t)
        if _,err:=s.a.db.Exec(`INSERT INTO asset_relink_events(
            asset_id,work_id,retired_candidate_asset,retired_candidate_work,source_id,
            from_path,to_path,destination_sha256,verification,recorded_at)
            VALUES(?,?,100,101,1,'original','renamed','digest','owner-attested;destination-sha256',1)`,
            s.oldAsset,s.newWork);err!=nil{t.Fatal(err)}
        req,_:=json.Marshal(relinkRequest{OldAssetID:s.oldAsset,CandidateAssetID:s.newAsset})
        res:=relinkCall(s.a,"POST","/api/manage/relink/preview",string(req),"test-key",true)
        if res.Code!=409{t.Fatalf("candidate work audit history deleted: %d %s",res.Code,res.Body.String())}
    })
    t.Run("candidate already has manual metadata",func(t *testing.T){
        s:=setupRelinkScenario(t)
        res:=relinkCall(s.a,"PATCH","/api/assets/"+strconv.FormatInt(s.newAsset,10)+"/metadata",
            `{"author":"A different new author"}`,"test-key",true)
        if res.Code!=200{t.Fatalf("setup metadata failed: %d %s",res.Code,res.Body.String())}
        req,_:=json.Marshal(relinkRequest{OldAssetID:s.oldAsset,CandidateAssetID:s.newAsset})
        got:=relinkCall(s.a,"POST","/api/manage/relink/preview",string(req),"test-key",true)
        if got.Code!=409{t.Fatalf("manual candidate silently discarded: %d %s",got.Code,got.Body.String())}
    })
}

func TestRelinkSQLFailurePreservesBothCandidates(t *testing.T){
    s:=setupRelinkScenario(t)
    p:=s.preview(t)
    if _,err:=s.a.db.Exec(`CREATE TRIGGER relink_abort_update BEFORE UPDATE OF relative_path ON assets
        WHEN NEW.id=`+strconv.FormatInt(s.oldAsset,10)+`
        BEGIN SELECT RAISE(ABORT,'simulate SQLite failure');END`);err!=nil{t.Fatal(err)}
    got:=s.apply(t,p,true,"same-file-verified-by-owner")
    if got.Code!=409{t.Fatalf("simulated database fault did not reject: %d %s",got.Code,got.Body.String())}
    var oldPath,newPath string
    if err:=s.a.db.QueryRow("SELECT relative_path FROM assets WHERE id=?",s.oldAsset).Scan(&oldPath);err!=nil{t.Fatal(err)}
    if err:=s.a.db.QueryRow("SELECT relative_path FROM assets WHERE id=?",s.newAsset).Scan(&newPath);err!=nil{t.Fatal(err)}
    if oldPath!=s.oldPath||newPath!=s.newPath{t.Fatalf("transaction partially applied: %q %q",oldPath,newPath)}
    var n int
    if err:=s.a.db.QueryRow("SELECT count(*) FROM asset_relink_events").Scan(&n);err!=nil||n!=0{
        t.Fatalf("failed relink left journal entry: count=%d err=%v",n,err)
    }
}
