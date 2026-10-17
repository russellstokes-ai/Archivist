package main

import (
 "bytes"
 "context"
 "os"
 "path/filepath"
 "testing"
)

// Commercial safety: new edition labels and their undo journal must travel
// inside the same SQLite backup/restore transaction as the main catalogue.
func TestComicEditionLedgerSurvivesRealSQLiteBackupAndStagedRestore(t *testing.T){
 original,workID,editionID:=comicProfileFixture(t)
 proposal:=comicEditionFields{Run:"1971 second printing",Volume:"2",Issue:"1.5",
  Imprint:"Archive Publishing",Variant:"Newsstand",Year:"2024",Notes:"Owner-approved copy"}
 plan:=previewComicProfile(t,original,workID,editionID,proposal)
 if res:=applyComicProfile(original,workID,editionID,plan,true);res.Code!=200{
  t.Fatalf("source edition Save rejected %d %s",res.Code,res.Body)
 }
 confirmed:=getComicProfile(t,original,workID,editionID)
 backup,err:=original.createBackup()
 if err!=nil{t.Fatal(err)}
 defer os.Remove(backup)
 payload,err:=os.ReadFile(backup)
 if err!=nil{t.Fatal(err)}
 targetPath:=filepath.Join(t.TempDir(),"restored-archivist.db")
 targetDB,err:=openDB(targetPath)
 if err!=nil{t.Fatal(err)}
 target:=&app{db:targetDB,dbPath:targetPath}
 if err=target.initHousehold();err!=nil{t.Fatal(err)}
 if err=target.initCatalogue();err!=nil{t.Fatal(err)}
 if err=target.stageRestore(bytes.NewReader(payload));err!=nil{t.Fatal(err)}
 if err=targetDB.Close();err!=nil{t.Fatal(err)}
 applied,err:=applyPendingRestore(targetPath)
 if err!=nil||!applied{t.Fatalf("staged restore of edition ledger failed: %t %v",applied,err)}
 restoredDB,err:=openDB(targetPath)
 if err!=nil{t.Fatal(err)}
 defer restoredDB.Close()
 restored:=&app{db:restoredDB,dbPath:targetPath,token:"test-key"}
 ctx:=context.Background()
 tx,err:=restoredDB.BeginTx(ctx,nil)
 if err!=nil{t.Fatal(err)}
 defer tx.Rollback()
 work,err:=restored.readWorkMeta(ctx,tx,workID)
 if err!=nil{t.Fatal(err)}
 edition,err:=restored.readComicEdition(ctx,tx,work,editionID)
 if err!=nil{t.Fatal(err)}
 if edition.Revision!=confirmed.Revision||edition.Fields!=confirmed.Fields||
  edition.WorkFingerprint!=confirmed.WorkFingerprint||!edition.Stored{
  t.Fatalf("SQLite restore lost owner edition identity: wanted %+v got %+v",confirmed,edition)
 }
 var edits int
 if err=tx.QueryRowContext(ctx,"SELECT count(*) FROM comic_edition_profile_history WHERE edition_id=?",editionID).
  Scan(&edits);err!=nil||edits!=1{
  t.Fatalf("edition audit journal missing after SQLite restore: %d %v",edits,err)
 }
 if err=tx.Commit();err!=nil{t.Fatal(err)}
 // A restored database must remain compatible with the idempotent startup
 // schema initializer. Reinitialization cannot wipe a saved identity.
 if err=restored.initCatalogue();err!=nil{t.Fatalf("edition migration is not idempotent: %v",err)}
 tx2,err:=restoredDB.BeginTx(ctx,nil)
 if err!=nil{t.Fatal(err)}
 defer tx2.Rollback()
 work2,err:=restored.readWorkMeta(ctx,tx2,workID)
 if err!=nil{t.Fatal(err)}
 again,err:=restored.readComicEdition(ctx,tx2,work2,editionID)
 if err!=nil{t.Fatal(err)}
 if again.Fields!=confirmed.Fields||again.Revision!=1{
  t.Fatalf("idempotent migration erased restored edition labels: %+v",again)
 }
 if err=tx2.Commit();err!=nil{t.Fatal(err)}
}
