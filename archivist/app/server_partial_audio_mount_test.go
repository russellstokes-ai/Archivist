package main

import (
    "os"
    "path/filepath"
    "testing"
)

// A partially disconnected NAS may expose Chapters 1 and 3 but not Chapter 2.
// An unavailable chapter is still part of the audiobook's exact edition.
// Losing its edition_assets row makes the saved chapter bookmark unusable.
func TestPartialAudiobookOutageKeepsChapterMembershipAndProgress(t *testing.T) {
    a:=fixture(t)
    if err:=a.initProgress();err!=nil{t.Fatal(err)}
    root:=t.TempDir()
    bookDir:=filepath.Join(root,"Verified Audio Novel")
    if err:=os.Mkdir(bookDir,0700);err!=nil{t.Fatal(err)}
    contents:=[]string{"part-one-bytes","part-two-bytes","part-three-bytes"}
    paths:=[]string{"01 - Intro.mp3","02 - Main Story.mp3","03 - Conclusion.mp3"}
    for i,name:=range paths {
        if err:=os.WriteFile(filepath.Join(bookDir,name),[]byte(contents[i]),0600);err!=nil{t.Fatal(err)}
    }
    if err:=a.addSource("Audio Shelf",root);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    var work,edition int64
    if err:=a.db.QueryRow(`SELECT w.id,e.id FROM works w
        JOIN editions e ON e.work_id=w.id WHERE w.title='Verified Audio Novel'`).
        Scan(&work,&edition);err!=nil{t.Fatal(err)}
    oldIDs:=make([]int64,3)
    for i,name:=range paths{
        if err:=a.db.QueryRow(`SELECT id FROM assets WHERE relative_path=?`,
            filepath.Join("Verified Audio Novel",name)).Scan(&oldIDs[i]);err!=nil{t.Fatal(err)}
    }
    if _,err:=a.db.Exec(`UPDATE assets SET author='Verified Author',metadata_source='manual',
      needs_review=0,review_reason='' WHERE source_id=1`);err!=nil{t.Fatal(err)}
    if _,err:=a.saveProfileProgress(7,edition,progress{Asset:oldIDs[1],Seconds:403,Revision:0});err!=nil{t.Fatal(err)}
    if _,err:=a.saveProfileProgress(8,edition,progress{Asset:oldIDs[2],Seconds:84,Revision:0});err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec(`INSERT INTO work_publication(work_id,state,revision,published_at)
      VALUES(?,'published',5,100)`,work);err!=nil{t.Fatal(err)}
    if err:=os.Remove(filepath.Join(bookDir,paths[1]));err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}

    var linked,offline,ordinal int
    if err:=a.db.QueryRow(`SELECT count(*),sum(CASE WHEN a.available=0 THEN 1 ELSE 0 END)
      FROM edition_assets ea JOIN assets a ON a.id=ea.asset_id
      WHERE ea.edition_id=?`,edition).Scan(&linked,&offline);err!=nil{t.Fatal(err)}
    if linked!=3||offline!=1{
        t.Fatalf("partial mount loss detached chapter: linked=%d offline=%d",linked,offline)
    }
    if err:=a.db.QueryRow(`SELECT ea.position FROM edition_assets ea WHERE ea.asset_id=? AND ea.edition_id=?`,
        oldIDs[1],edition).Scan(&ordinal);err!=nil||ordinal!=1{
        t.Fatalf("offline chapter missing or out of order: position=%d err=%v",ordinal,err)
    }
    for _,state:=range []struct{profile,asset int64;seconds float64}{
        {7,oldIDs[1],403},{8,oldIDs[2],84},
    }{
        progress,err:=a.readProfileProgress(state.profile,edition)
        if err!=nil||progress.Asset!=state.asset||progress.Seconds!=state.seconds{
            t.Fatalf("household progress corrupted for %d: %+v err=%v",state.profile,progress,err)
        }
    }
    var publication string
    if err:=a.db.QueryRow("SELECT state FROM work_publication WHERE work_id=?",work).Scan(&publication);err!=nil||publication!="published"{
        t.Fatalf("unavailable already-reviewed part incorrectly re-staged book: state=%s err=%v",publication,err)
    }
    if err:=os.WriteFile(filepath.Join(bookDir,paths[1]),[]byte(contents[1]),0600);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    if err:=a.db.QueryRow("SELECT count(*) FROM edition_assets WHERE edition_id=?",edition).Scan(&linked);err!=nil||linked!=3{
        t.Fatalf("reconnect duplicated/deleted chapters: %d %v",linked,err)
    }
    if err:=a.db.QueryRow("SELECT position FROM edition_assets WHERE asset_id=?",oldIDs[1]).Scan(&ordinal);err!=nil||ordinal!=1{
        t.Fatalf("reconnected chapter changed position: %d %v",ordinal,err)
    }
    var savedAuthor string
    if err:=a.db.QueryRow("SELECT author FROM assets WHERE id=?",oldIDs[1]).Scan(&savedAuthor);err!=nil||savedAuthor!="Verified Author"{
        t.Fatalf("manual metadata did not persist after reconnect: %q %v",savedAuthor,err)
    }
    bookmark,err:=a.readProfileProgress(7,edition)
    if err!=nil||bookmark.Asset!=oldIDs[1]||bookmark.Seconds!=403{
        t.Fatalf("reconnect lost original edition progress: %+v %v",bookmark,err)
    }
}

func TestPartialAudiobookOutageWithNewChapterKeepsOriginalTrackOrder(t *testing.T){
    a:=fixture(t)
    if err:=a.initProgress();err!=nil{t.Fatal(err)}
    root:=t.TempDir()
    dir:=filepath.Join(root,"Six Part Book")
    if err:=os.Mkdir(dir,0700);err!=nil{t.Fatal(err)}
    for _,name:=range []string{"01.mp3","02.mp3","03.mp3"}{
        if err:=os.WriteFile(filepath.Join(dir,name),[]byte(name),0600);err!=nil{t.Fatal(err)}
    }
    if err:=a.addSource("Audio",root);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    var originalWork,edition,trackID int64
    if err:=a.db.QueryRow(`SELECT w.id,e.id,a.id FROM works w
      JOIN editions e ON e.work_id=w.id JOIN edition_assets ea ON ea.edition_id=e.id
      JOIN assets a ON a.id=ea.asset_id WHERE a.relative_path=?`,
      filepath.Join("Six Part Book","02.mp3")).Scan(&originalWork,&edition,&trackID);err!=nil{t.Fatal(err)}
    if _,err:=a.saveProfileProgress(3,edition,progress{Asset:trackID,Seconds:88,Revision:0});err!=nil{t.Fatal(err)}
    if err:=os.Remove(filepath.Join(dir,"02.mp3"));err!=nil{t.Fatal(err)}
    if err:=os.WriteFile(filepath.Join(dir,"04.mp3"),[]byte("four-bytes"),0600);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    rows,err:=a.db.Query(`SELECT a.relative_path,a.available FROM edition_assets ea
      JOIN assets a ON a.id=ea.asset_id WHERE ea.edition_id=? ORDER BY ea.position`,edition)
    if err!=nil{t.Fatal(err)}
    got:=[]string{}
    availability:=[]bool{}
    for rows.Next(){
        var p string;var online bool
        if err=rows.Scan(&p,&online);err!=nil{rows.Close();t.Fatal(err)}
        got=append(got,filepath.Base(p));availability=append(availability,online)
    }
    if err=rows.Err();err!=nil{rows.Close();t.Fatal(err)}
    rows.Close()
    want:=[]string{"01.mp3","02.mp3","03.mp3","04.mp3"}
    if len(got)!=len(want){t.Fatalf("indexed chapter order dropped missing entry: %q",got)}
    for i,name:=range want{
        if got[i]!=name{t.Fatalf("chapter position %d got %q want %q",i,got[i],name)}
    }
    if availability[1]||!availability[3]{t.Fatalf("availability was not truthful: %v",availability)}
    var actualWork int64
    if err:=a.db.QueryRow("SELECT work_id FROM editions WHERE id=?",edition).Scan(&actualWork);err!=nil||actualWork!=originalWork{
        t.Fatalf("work identity replaced while partial source missing: %d vs %d, %v",actualWork,originalWork,err)
    }
    pos,err:=a.readProfileProgress(3,edition)
    if err!=nil||pos.Asset!=trackID||pos.Seconds!=88{
        t.Fatalf("new chapter addition destroyed old bookmark: %+v %v",pos,err)
    }
}

func TestAutomaticCatalogueRefusesAmbiguousMultiEditionDeletion(t *testing.T){
    a:=fixture(t)
    if err:=a.initProgress();err!=nil{t.Fatal(err)}
    root:=t.TempDir()
    dir:=filepath.Join(root,"Uncertain Album")
    if err:=os.Mkdir(dir,0700);err!=nil{t.Fatal(err)}
    if err:=os.WriteFile(filepath.Join(dir,"01.mp3"),[]byte("part1"),0600);err!=nil{t.Fatal(err)}
    if err:=a.addSource("Audio",root);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    var work,edition int64
    if err:=a.db.QueryRow("SELECT w.id,e.id FROM works w JOIN editions e ON e.work_id=w.id").Scan(&work,&edition);err!=nil{t.Fatal(err)}
    r,err:=a.db.Exec("INSERT INTO editions(work_id,format) VALUES(?,'Audio')",work)
    if err!=nil{t.Fatal(err)}
    additional,err:=r.LastInsertId();if err!=nil{t.Fatal(err)}
    if err=a.scan(1);err==nil{
        t.Fatal("scanner silently pruned a second edition instead of requiring manual review")
    }
    var retained int
    if err=a.db.QueryRow("SELECT count(*) FROM editions WHERE work_id=?",work).Scan(&retained);err!=nil||retained!=2{
        t.Fatalf("scanner destroyed edition or partially committed: %d %v",retained,err)
    }
    if err=a.db.QueryRow("SELECT count(*) FROM edition_assets WHERE edition_id=?",edition).Scan(&retained);err!=nil||retained!=1{
        t.Fatalf("original edition attachments changed: %d %v",retained,err)
    }
    if _,err=a.db.Exec("DELETE FROM editions WHERE id=?",additional);err!=nil{t.Fatal(err)}
    if err=a.scan(1);err!=nil{t.Fatalf("scan after resolving second edition: %v",err)}
}
