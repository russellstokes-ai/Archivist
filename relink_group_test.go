package main

import (
    "context"
    "encoding/json"
    "net/http/httptest"
    "os"
    "path/filepath"
    "strconv"
    "strings"
    "testing"
)

type groupedRelinkScenario struct {
    a *app
    root string
    oldWork,newWork,oldEdition int64
    oldIDs,newIDs []int64
    oldFolder,newFolder string
    pairs []relinkRequest
}
func setupGroupedRelink(t *testing.T)groupedRelinkScenario{
    t.Helper()
    a:=fixture(t)
    for _,init:=range []func()error{
        a.initProgress,a.initListening,a.initReader,a.initPreferences,
        a.initCompletions,a.initActivity,a.initPlayerFeatures,a.initMoves,
    }{if err:=init();err!=nil{t.Fatal(err)}}
    root:=t.TempDir()
    oldFolder,newFolder:="Original Multi Audiobook","Renamed Multi Audiobook"
    oldDir:=filepath.Join(root,oldFolder)
    if err:=os.Mkdir(oldDir,0700);err!=nil{t.Fatal(err)}
    for i:=1;i<=3;i++{
        track:="Chapter 0"+strconv.Itoa(i)+".mp3"
        body:=strings.Repeat("audio chapter "+strconv.Itoa(i)+" ",6)
        if err:=os.WriteFile(filepath.Join(oldDir,track),[]byte(body),0600);err!=nil{t.Fatal(err)}
    }
    if err:=a.addSource("Audio",root);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    var oldWork,oldEdition int64
    if err:=a.db.QueryRow(`SELECT e.work_id,e.id FROM editions e LIMIT 1`).Scan(&oldWork,&oldEdition);err!=nil{t.Fatal(err)}
    oldGroup,err:=groupedWorkFor(context.Background(),a.db,oldWork)
    if err!=nil{t.Fatal(err)}
    if len(oldGroup.Tracks)!=3{t.Fatalf("old track count %+v",oldGroup)}
    ids:=make([]int64,3)
    for i,x:=range oldGroup.Tracks{ids[i]=x.Identity.AssetID}
    if r:=relinkCall(a,"PATCH","/api/assets/"+strconv.FormatInt(ids[0],10)+"/metadata",
      `{"author":"Verified writer","genre":"History"}`,"test-key",true);r.Code!=200{
        t.Fatalf("manual metadata setup: %d %s",r.Code,r.Body.String())
    }
    if _,err:=a.saveProfileProgress(7,oldEdition,progress{Asset:ids[2],Seconds:245,Revision:0});err!=nil{t.Fatal(err)}
    if _,err:=a.saveProfileProgress(0,oldEdition,progress{Asset:ids[1],Seconds:55,Revision:0});err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec(`INSERT INTO work_publication(work_id,state,revision,published_at)
      VALUES(?,'published',8,1700000000)
      ON CONFLICT(work_id) DO UPDATE SET state='published',revision=8,published_at=1700000000`,oldWork);err!=nil{t.Fatal(err)}
    queueRaw,_:=json.Marshal([]int64{ids[1]})
    if _,err:=a.db.Exec("INSERT INTO playback_queue(profile_id,ids,revision) VALUES(7,?,1)",string(queueRaw));err!=nil{t.Fatal(err)}
    if err:=os.Rename(oldDir,filepath.Join(root,newFolder));err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    var newWork int64
    if err:=a.db.QueryRow("SELECT id FROM works WHERE id<>? LIMIT 1",oldWork).Scan(&newWork);err!=nil{t.Fatal(err)}
    newGroup,err:=groupedWorkFor(t.Context(),a.db,newWork)
    if err!=nil{t.Fatal(err)}
    if len(newGroup.Tracks)!=len(ids){t.Fatalf("new grouped track count=%d",len(newGroup.Tracks))}
    pairs:=[]relinkRequest{}
    newIDs:=[]int64{}
    for i,track:=range newGroup.Tracks{
        newIDs=append(newIDs,track.Identity.AssetID)
        pairs=append(pairs,relinkRequest{OldAssetID:ids[i],CandidateAssetID:track.Identity.AssetID})
    }
    return groupedRelinkScenario{a:a,root:root,oldWork:oldWork,newWork:newWork,oldEdition:oldEdition,
       oldIDs:ids,newIDs:newIDs,oldFolder:oldFolder,newFolder:newFolder,pairs:pairs}
}
func (s groupedRelinkScenario)preview(t *testing.T)groupedRelinkPreview{
    t.Helper()
    raw,_:=json.Marshal(groupedRelinkRequest{Pairs:s.pairs})
    res:=relinkCall(s.a,"POST","/api/manage/relink-groups/preview",string(raw),"test-key",true)
    if res.Code!=200{t.Fatalf("group preview %d %s",res.Code,res.Body.String())}
    var result groupedRelinkPreview
    if err:=json.Unmarshal(res.Body.Bytes(),&result);err!=nil{t.Fatal(err)}
    if result.OldWorkID!=s.oldWork||result.CandidateWorkID!=s.newWork||
       len(result.Pairs)!=3||len(result.Receipt)!=64||!result.RequiresAttestation{
        t.Fatalf("group preview missing track proof: %+v",result)
    }
    for i,p:=range result.Pairs{
        if p.Old.Identity.AssetID!=s.oldIDs[i]||p.Candidate.Identity.AssetID!=s.newIDs[i]||
            p.Old.Position!=i||p.Candidate.Position!=i||len(p.SHA256)!=64{
            t.Fatalf("misaligned track %d: %+v",i,p)
        }
    }
    return result
}
func (s groupedRelinkScenario)apply(t *testing.T,p groupedRelinkPreview,confirm bool,attestation string)*httptest.ResponseRecorder{
    t.Helper()
    raw,_:=json.Marshal(groupedRelinkApply{Preview:p,Confirm:confirm,Attestation:attestation})
    return relinkCall(s.a,"POST","/api/manage/relink-groups/apply",string(raw),"test-key",true)
}

func TestGroupedRelinkPreservesChapterOrderAndAllProfileState(t *testing.T){
    s:=setupGroupedRelink(t)
    oldEndpoint:="/api/manage/relink-groups/works/"+strconv.FormatInt(s.oldWork,10)
    for _,path:=range []string{oldEndpoint,"/api/manage/relink-groups/works/0"}{
        res:=relinkCall(s.a,"GET",path,"","",false)
        if res.Code!=401{t.Fatalf("anonymous GET grouped media info: %d",res.Code)}
    }
    if _,err:=s.a.db.Exec("INSERT INTO profiles(name,key_hash) VALUES('Reader',?)",keyHash("reader"));err!=nil{t.Fatal(err)}
    member,err:=s.a.newSession("reader");if err!=nil{t.Fatal(err)}
    if res:=relinkCall(s.a,"GET",oldEndpoint,"",member,false);res.Code!=403{
        t.Fatalf("household member viewed relink candidates: %d",res.Code)
    }
    raw,_:=json.Marshal(groupedRelinkRequest{Pairs:s.pairs})
    if res:=relinkCall(s.a,"POST","/api/manage/relink-groups/preview",string(raw),member,true);res.Code!=403{
        t.Fatalf("household member previewed grouped relink: %d",res.Code)
    }
    if res:=relinkCall(s.a,"POST","/api/manage/relink-groups/preview",string(raw),"test-key",false);res.Code!=403{
        t.Fatalf("group relink without CSRF header: %d",res.Code)
    }
    p:=s.preview(t)
    if res:=s.apply(t,p,false,"all-chapter-mappings-verified-by-owner");res.Code!=400{
        t.Fatalf("unconfirmed group relink allowed: %d",res.Code)
    }
    if res:=s.apply(t,p,true,"");res.Code!=400{
        t.Fatalf("missing owner attestation allowed: %d",res.Code)
    }
    tampered:=p;tampered.Pairs=append([]groupedRelinkPair(nil),p.Pairs...)
    tampered.Pairs[1].SHA256=strings.Repeat("f",64)
    if res:=s.apply(t,tampered,true,"all-chapter-mappings-verified-by-owner");res.Code!=409{
        t.Fatalf("tampered group proof allowed: %d",res.Code)
    }
    res:=s.apply(t,p,true,"all-chapter-mappings-verified-by-owner")
    if res.Code!=200{t.Fatalf("group relink failed: %d %s",res.Code,res.Body.String())}
    if res=s.apply(t,p,true,"all-chapter-mappings-verified-by-owner");res.Code!=409{
        t.Fatalf("replayed group proof allowed: %d",res.Code)
    }
    var n int
    if err:=s.a.db.QueryRow("SELECT count(*) FROM works").Scan(&n);err!=nil||n!=1{
        t.Fatalf("newly staged candidate group retained: works=%d %v",n,err)
    }
    if err:=s.a.db.QueryRow("SELECT count(*) FROM asset_relink_events WHERE work_id=?",s.oldWork).Scan(&n);err!=nil||n!=3{
        t.Fatalf("all chapter relink events missing: %d %v",n,err)
    }
    for i,old:=range s.oldIDs{
        var path,author,genre string
        var available bool
        if err:=s.a.db.QueryRow("SELECT relative_path,author,genre,available FROM assets WHERE id=?",old).
            Scan(&path,&author,&genre,&available);err!=nil{t.Fatal(err)}
        if !available||!strings.Contains(path,s.newFolder)||i==0&&(author!="Verified writer"||genre!="History"){
            t.Fatalf("original track metadata/availability lost at chapter %d: %q %q %q %v",i,path,author,genre,available)
        }
        if err:=s.a.db.QueryRow("SELECT count(*) FROM assets WHERE id=?",s.newIDs[i]).Scan(&n);err!=nil||n!=0{
            t.Fatalf("retired candidate track still indexed %d: %d %v",i,n,err)
        }
    }
    for _,row:=range []struct{profile int64;asset int64;seconds float64}{{7,s.oldIDs[2],245},{0,s.oldIDs[1],55}}{
        progress,err:=s.a.readProfileProgress(row.profile,s.oldEdition)
        if err!=nil||progress.Asset!=row.asset||progress.Seconds!=row.seconds{
            t.Fatalf("household progress lost after remap profile=%d: %+v %v",row.profile,progress,err)
        }
    }
    var state,queue string
    var revision int64
    if err:=s.a.db.QueryRow("SELECT state,revision FROM work_publication WHERE work_id=?",s.oldWork).Scan(&state,&revision);err!=nil||state!="published"||revision!=9{
        t.Fatalf("original publication history lost: %q rev=%d %v",state,revision,err)
    }
    if err:=s.a.db.QueryRow("SELECT ids FROM playback_queue WHERE profile_id=7").Scan(&queue);err!=nil||!strings.Contains(queue,strconv.FormatInt(s.oldIDs[1],10)){
        t.Fatalf("household audio queue lost: %s %v",queue,err)
    }
    if err:=s.a.scan(1);err!=nil{t.Fatalf("post-relink rescan failed: %v",err)}
    if err:=s.a.db.QueryRow("SELECT count(*) FROM works").Scan(&n);err!=nil||n!=1{t.Fatalf("relink not stable after rescan %d %v",n,err)}
    if err:=s.a.db.QueryRow("SELECT count(*) FROM edition_assets WHERE edition_id=?",s.oldEdition).Scan(&n);err!=nil||n!=3{
        t.Fatalf("original track positions lost after scan: %d %v",n,err)
    }
}

func TestGroupedRelinkRejectsWrongMappingsIndependentStateAndPartialFailures(t *testing.T){
    t.Run("swapped chapter identities",func(t *testing.T){
        s:=setupGroupedRelink(t)
        mapping:=append([]relinkRequest(nil),s.pairs...)
        mapping[0].CandidateAssetID,mapping[1].CandidateAssetID=mapping[1].CandidateAssetID,mapping[0].CandidateAssetID
        raw,_:=json.Marshal(groupedRelinkRequest{Pairs:mapping})
        result:=relinkCall(s.a,"POST","/api/manage/relink-groups/preview",string(raw),"test-key",true)
        if result.Code!=409{t.Fatalf("wrong chapter order accepted: %d %s",result.Code,result.Body.String())}
    })
    t.Run("partial and duplicate mappings",func(t *testing.T){
        s:=setupGroupedRelink(t)
        for _,mapping:=range [][]relinkRequest{s.pairs[:2],{s.pairs[0],s.pairs[0],s.pairs[2]}}{
            raw,_:=json.Marshal(groupedRelinkRequest{Pairs:mapping})
            result:=relinkCall(s.a,"POST","/api/manage/relink-groups/preview",string(raw),"test-key",true)
            if result.Code!=409{t.Fatalf("partial/duplicate group mapped: %d %s",result.Code,result.Body.String())}
        }
    })
    t.Run("candidate has its own listening position",func(t *testing.T){
        s:=setupGroupedRelink(t)
        var edition int64
        if err:=s.a.db.QueryRow("SELECT id FROM editions WHERE work_id=?",s.newWork).Scan(&edition);err!=nil{t.Fatal(err)}
        if _,err:=s.a.saveProfileProgress(4,edition,progress{Asset:s.newIDs[2],Seconds:31,Revision:0});err!=nil{t.Fatal(err)}
        raw,_:=json.Marshal(groupedRelinkRequest{Pairs:s.pairs})
        result:=relinkCall(s.a,"POST","/api/manage/relink-groups/preview",string(raw),"test-key",true)
        if result.Code!=409{t.Fatalf("independent candidate listening lost: %d %s",result.Code,result.Body.String())}
    })
    t.Run("candidate bytes changed after preview",func(t *testing.T){
        s:=setupGroupedRelink(t)
        p:=s.preview(t)
        file:=filepath.Join(s.root,s.newFolder,"Chapter 02.mp3")
        data,err:=os.ReadFile(file);if err!=nil{t.Fatal(err)}
        data[len(data)/2]='Z'
        if err:=os.WriteFile(file,data,0600);err!=nil{t.Fatal(err)}
        if result:=s.apply(t,p,true,"all-chapter-mappings-verified-by-owner");result.Code!=409{
            t.Fatalf("changed chapter accepted: %d %s",result.Code,result.Body.String())
        }
        var n int
        if err=s.a.db.QueryRow("SELECT count(*) FROM works").Scan(&n);err!=nil||n!=2{
            t.Fatalf("partially remapped group after file hash failure %d %v",n,err)
        }
    })
    t.Run("late SQLite failure rolls back all tracks",func(t *testing.T){
        s:=setupGroupedRelink(t)
        p:=s.preview(t)
        if _,err:=s.a.db.Exec(`CREATE TRIGGER fail_last_relink BEFORE UPDATE OF relative_path ON assets
          WHEN NEW.id=`+strconv.FormatInt(s.oldIDs[2],10)+`
          BEGIN SELECT RAISE(ABORT,'test grouped rollback');END`);err!=nil{t.Fatal(err)}
        result:=s.apply(t,p,true,"all-chapter-mappings-verified-by-owner")
        if result.Code!=409{t.Fatalf("forced SQLite fault not handled: %d %s",result.Code,result.Body.String())}
        for i,old:=range s.oldIDs{
            var rel string
            if err:=s.a.db.QueryRow("SELECT relative_path FROM assets WHERE id=?",old).Scan(&rel);err!=nil||!strings.Contains(rel,s.oldFolder){
                t.Fatalf("partial group remap at chapter %d: %q %v",i,rel,err)
            }
            var n int
            if err:=s.a.db.QueryRow("SELECT count(*) FROM assets WHERE id=?",s.newIDs[i]).Scan(&n);err!=nil||n!=1{
                t.Fatalf("candidate chapter %d deleted despite rollback: %d %v",i,n,err)
            }
        }
        var n int
        if err:=s.a.db.QueryRow("SELECT count(*) FROM asset_relink_events WHERE work_id=?",s.oldWork).Scan(&n);err!=nil||n!=0{
            t.Fatalf("false partial audit after rollback %d %v",n,err)
        }
        if progress,err:=s.a.readProfileProgress(7,s.oldEdition);err!=nil||progress.Seconds!=245{
            t.Fatalf("rollback erased original bookmark: %+v %v",progress,err)
        }
    })
}
