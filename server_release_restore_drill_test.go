package main

import (
 "bytes"
 "os"
 "path/filepath"
 "testing"
)

// Full state-level restore drill with staged writes and a retained local
// rollback snapshot. It uses private synthetic files and never runs on an
// owner's live or mounted media. It is NOT a power-cut hardware simulation.
func TestReleaseBackupRestoresBooksFamilyProgressAndRetainsRollback(t *testing.T){
 a:=fixture(t)
 if err:=a.initProgress();err!=nil{t.Fatal(err)}
 root:=t.TempDir()
 if err:=os.WriteFile(filepath.Join(root,"Narrated Book.m4b"),[]byte("test-only media bytes"),0600);err!=nil{t.Fatal(err)}
 if err:=a.addSource("Family Audio",root);err!=nil{t.Fatal(err)}
 if err:=a.scan(1);err!=nil{t.Fatal(err)}
 var work,edition,asset int64
 if err:=a.db.QueryRow(`SELECT w.id,ed.id,ea.asset_id FROM works w JOIN editions ed ON ed.work_id=w.id
 JOIN edition_assets ea ON ea.edition_id=ed.id LIMIT 1`).Scan(&work,&edition,&asset);err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("INSERT INTO profiles(id,name,key_hash) VALUES(17,'Reader',?)",keyHash("reader-test-key"));err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("INSERT INTO grants(profile_id,space) VALUES(17,'Family Audio')");err!=nil{t.Fatal(err)}
 if _,err:=a.saveProfileProgress(17,edition,progress{Asset:asset,Seconds:293,Revision:0});err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec(`INSERT INTO work_publication(work_id,state,revision,published_at)
  VALUES(?,'published',1,123456)`,work);err!=nil{t.Fatal(err)}
 beforeBackup:=a.dbPath
 backupPath,err:=a.createBackup()
 if err!=nil{t.Fatal(err)}
 defer os.Remove(backupPath)
 snapshot,err:=os.ReadFile(backupPath)
 if err!=nil{t.Fatal(err)}
 if len(snapshot)==0{t.Fatal("empty backup")}
 // Make newer saved progress after backup; the pre-restore version should
 // later survive in the dedicated rollback snapshot.
 if _,err=a.saveProfileProgress(17,edition,progress{Asset:asset,Seconds:777,Revision:1});err!=nil{t.Fatal(err)}
 if err=a.stageRestore(bytes.NewReader(snapshot));err!=nil{t.Fatalf("stage verified backup: %v",err)}
 if err=a.stageRestore(bytes.NewReader(snapshot));err==nil{
  t.Fatal("second restore silently overwrote first verified pending database")
 }
 // Explicit clean stop: actual power-cut/torn-WAL scenarios remain physical.
 if err=a.db.Close();err!=nil{t.Fatal(err)}
 applied,err:=applyPendingRestore(beforeBackup)
 if err!=nil||!applied{t.Fatalf("restore after restart: applied=%v err=%v",applied,err)}
 if _,err=os.Stat(beforeBackup+".before-restore");err!=nil{t.Fatalf("no rollback snapshot: %v",err)}
 restored,err:=openDB(beforeBackup)
 if err!=nil{t.Fatal(err)}
 defer restored.Close()
 var seconds float64
 if err=restored.QueryRow("SELECT seconds FROM profile_progress WHERE profile_id=17 AND edition_id=?",edition).Scan(&seconds);err!=nil||seconds!=293{
  t.Fatalf("backup lost reader bookmark: %v %v",seconds,err)
 }
 var count int
 if err=restored.QueryRow("SELECT count(*) FROM works WHERE id=?",work).Scan(&count);err!=nil||count!=1{
  t.Fatalf("backup lost original logical work: %d %v",count,err)
 }
 if err=restored.QueryRow("SELECT count(*) FROM work_publication WHERE work_id=? AND state='published'",work).Scan(&count);err!=nil||count!=1{
  t.Fatalf("backup lost publication status: %d %v",count,err)
 }
 if err=restored.QueryRow("SELECT count(*) FROM profiles WHERE id=17 AND revoked=0").Scan(&count);err!=nil||count!=1{
  t.Fatalf("backup lost family user: %d %v",count,err)
 }
 if err=restored.QueryRow("SELECT count(*) FROM grants WHERE profile_id=17 AND space='Family Audio'").Scan(&count);err!=nil||count!=1{
  t.Fatalf("backup lost per-user library grant: %d %v",count,err)
 }
 if err=restored.QueryRow("SELECT count(*) FROM edition_assets WHERE asset_id=? AND edition_id=?",asset,edition).Scan(&count);err!=nil||count!=1{
  t.Fatalf("backup detached audiobook: %d %v",count,err)
 }
 // Retained post-backup database must not have been wiped by recovery.
 if err=validateArchivistBackup(beforeBackup+".before-restore");err!=nil{
  t.Fatalf("rollback snapshot not independently readable: %v",err)
 }
 if _,err=os.Stat(filepath.Join(root,"Narrated Book.m4b"));err!=nil{
  t.Fatalf("server catalogue restore touched original media: %v",err)
 }
}
