package main

import (
    "os"
    "path/filepath"
    "strconv"
    "strings"
    "testing"
)

// Reindexing the asset table and rebuilding works/editions are not separable
// operations. A fault in the latter must not publish partially indexed books.
func TestScanGroupingFailureRollsBackEntireCatalogueTransaction(t *testing.T){
    a:=fixture(t)
    root:=t.TempDir()
    oldFile:=filepath.Join(root,"Existing Novel.epub")
    if err:=os.WriteFile(oldFile,[]byte("existing novel v1"),0600);err!=nil{t.Fatal(err)}
    if err:=a.addSource("Books",root);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    var oldID,oldWork,oldEdition int64
    var oldSignature,oldStatus string
    var oldSize int64
    err:=a.db.QueryRow(`SELECT a.id,w.id,e.id,a.scan_signature,a.size_bytes
        FROM assets a JOIN edition_assets ea ON ea.asset_id=a.id
        JOIN editions e ON e.id=ea.edition_id JOIN works w ON w.id=e.work_id
        WHERE a.relative_path='Existing Novel.epub'`).
        Scan(&oldID,&oldWork,&oldEdition,&oldSignature,&oldSize)
    if err!=nil{t.Fatal(err)}
    if err=a.db.QueryRow("SELECT status FROM sources WHERE id=1").Scan(&oldStatus);err!=nil{t.Fatal(err)}

    // The existing file changes and a second book is discovered in this scan.
    // The trigger fails after file upserts, precisely where the prior design
    // had already COMMITTED the file catalogue.
    if err:=os.WriteFile(oldFile,[]byte("existing novel v2 with new length"),0600);err!=nil{t.Fatal(err)}
    if err:=os.WriteFile(filepath.Join(root,"Newly Added.epub"),[]byte("new book"),0600);err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec(`CREATE TRIGGER reject_new_work BEFORE INSERT ON works
        WHEN NEW.title='Newly Added' BEGIN
          SELECT RAISE(ABORT,'forced work reconciliation failure');END`);err!=nil{t.Fatal(err)}
    err=a.scan(1)
    if err==nil||!strings.Contains(err.Error(),"scan grouping failed"){
        t.Fatalf("a broken grouping was reported as a completed scan: %v",err)
    }
    var n int
    if err=a.db.QueryRow("SELECT count(*) FROM assets").Scan(&n);err!=nil||n!=1{
        t.Fatalf("failed catalogue reindex persisted new asset: count=%d err=%v",n,err)
    }
    var afterSignature,afterStatus string
    var afterSize int64
    var available bool
    if err=a.db.QueryRow(`SELECT scan_signature,size_bytes,available
        FROM assets WHERE id=?`,oldID).Scan(&afterSignature,&afterSize,&available);err!=nil{t.Fatal(err)}
    if afterSignature!=oldSignature||afterSize!=oldSize||!available{
        t.Fatalf("half-applied scan modified existing asset: signature=%q size=%d available=%v",afterSignature,afterSize,available)
    }
    if err=a.db.QueryRow("SELECT status FROM sources WHERE id=1").Scan(&afterStatus);err!=nil||afterStatus!=oldStatus{
        t.Fatalf("source wrongly reports scan complete: before=%q after=%q err=%v",oldStatus,afterStatus,err)
    }
    if err=a.db.QueryRow("SELECT count(*) FROM works WHERE id=?",oldWork).Scan(&n);err!=nil||n!=1{
        t.Fatalf("existing work lost during failed scan: %d %v",n,err)
    }
    if err=a.db.QueryRow("SELECT count(*) FROM editions WHERE id=?",oldEdition).Scan(&n);err!=nil||n!=1{
        t.Fatalf("existing edition lost during failed scan: %d %v",n,err)
    }
    if _,err=a.db.Exec("DROP TRIGGER reject_new_work");err!=nil{t.Fatal(err)}
    if err=a.scan(1);err!=nil{t.Fatalf("retry after fixing DB failed: %v",err)}
    if err=a.db.QueryRow("SELECT count(*) FROM assets WHERE available=1").Scan(&n);err!=nil||n!=2{
        t.Fatalf("valid retry failed to publish two assets: %d %v",n,err)
    }
    if err=a.db.QueryRow("SELECT scan_signature FROM assets WHERE id=?",oldID).Scan(&afterSignature);err!=nil||afterSignature==oldSignature{
        t.Fatalf("successful retry failed to refresh original scan metadata: %q %v",afterSignature,err)
    }
}

func TestScanReopenedPublicationEventFailureRetainsBookAndPlayback(t *testing.T){
    a:=fixture(t)
    if err:=a.initProgress();err!=nil{t.Fatal(err)}
    root:=t.TempDir()
    bookDir:=filepath.Join(root,"Audio Novel")
    if err:=os.Mkdir(bookDir,0700);err!=nil{t.Fatal(err)}
    if err:=os.WriteFile(filepath.Join(bookDir,"Chapter 01.mp3"),[]byte("chapter 1 audio fixture"),0600);err!=nil{t.Fatal(err)}
    if err:=a.addSource("Audio",root);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    var oldID,workID,editionID int64
    if err:=a.db.QueryRow(`SELECT a.id,w.id,e.id FROM assets a
        JOIN edition_assets ea ON ea.asset_id=a.id
        JOIN editions e ON e.id=ea.edition_id JOIN works w ON w.id=e.work_id
        WHERE a.relative_path='Audio Novel/Chapter 01.mp3'`).
        Scan(&oldID,&workID,&editionID);err!=nil{t.Fatal(err)}
    res:=relinkCall(a,"PATCH","/api/assets/"+strconv.FormatInt(oldID,10)+"/metadata",
        `{"title":"Audio Novel","author":"Original Author"}`,"test-key",true)
    if res.Code!=200{t.Fatalf("set original metadata: %d %s",res.Code,res.Body.String())}
    if _,err:=a.saveProfileProgress(7,editionID,progress{Asset:oldID,Seconds:194,Revision:0});err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec(`INSERT INTO work_publication(work_id,state,revision,published_at)
        VALUES(?,'published',7,1700000000)
        ON CONFLICT(work_id) DO UPDATE SET state='published',revision=7,published_at=1700000000`,workID);err!=nil{t.Fatal(err)}
    if err:=os.WriteFile(filepath.Join(bookDir,"Chapter 02.mp3"),[]byte("new unresolved audio"),0600);err!=nil{t.Fatal(err)}

    // Simulate an inability to record a publication invalidation. The scan
    // must retain the previous published state AND not install the new track.
    if _,err:=a.db.Exec(`CREATE TRIGGER refuse_reopened_event BEFORE INSERT ON work_publication_events
       WHEN NEW.action='review_reopened'
       BEGIN SELECT RAISE(ABORT,'fault storing reopen event');END`);err!=nil{t.Fatal(err)}
    err:=a.scan(1)
    if err==nil||!strings.Contains(err.Error(),"scan grouping failed"){
        t.Fatalf("reopen-event failure silently committed: %v",err)
    }
    var state string
    var revision int64
    if err=a.db.QueryRow("SELECT state,revision FROM work_publication WHERE work_id=?",workID).Scan(&state,&revision);err!=nil||state!="published"||revision!=7{
        t.Fatalf("publication partially invalidated: %q rev=%d err=%v",state,revision,err)
    }
    var n int
    if err=a.db.QueryRow("SELECT count(*) FROM assets WHERE relative_path='Audio Novel/Chapter 02.mp3'").Scan(&n);err!=nil||n!=0{
        t.Fatalf("new track incorrectly became indexed: %d %v",n,err)
    }
    p,err:=a.readProfileProgress(7,editionID)
    if err!=nil||p.Asset!=oldID||p.Seconds!=194{t.Fatalf("progress lost on catalogue rollback: %+v %v",p,err)}
    if err=a.db.QueryRow("SELECT count(*) FROM edition_assets WHERE edition_id=?",editionID).Scan(&n);err!=nil||n!=1{
        t.Fatalf("edition changed despite failed publication audit: %d %v",n,err)
    }

    if _,err=a.db.Exec("DROP TRIGGER refuse_reopened_event");err!=nil{t.Fatal(err)}
    if err=a.scan(1);err!=nil{t.Fatalf("retry grouped scan: %v",err)}
    if err=a.db.QueryRow("SELECT state,revision FROM work_publication WHERE work_id=?",workID).Scan(&state,&revision);err!=nil||state!="staged"||revision!=8{
        t.Fatalf("new unreviewed track did not invalidate publication: %q rev=%d err=%v",state,revision,err)
    }
    if err=a.db.QueryRow("SELECT count(*) FROM edition_assets WHERE edition_id=?",editionID).Scan(&n);err!=nil||n!=2{
        t.Fatalf("new track not grouped with original audio: %d %v",n,err)
    }
    p,err=a.readProfileProgress(7,editionID)
    if err!=nil||p.Asset!=oldID||p.Seconds!=194{t.Fatalf("retry lost household progress: %+v %v",p,err)}
}
