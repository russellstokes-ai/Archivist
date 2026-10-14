package main

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"
)

func TestBackupIsConsistentAndRestoreAppliesOnRestart(t *testing.T){
	a:=fixture(t)
	root:=t.TempDir()
	if e:=a.addSource("Original",root);e!=nil{t.Fatal(e)}
	backup,e:=a.createBackup();if e!=nil{t.Fatal(e)}
	defer os.Remove(backup)
	if e=validateArchivistBackup(backup);e!=nil{t.Fatal(e)}

	restorePath:=filepath.Join(t.TempDir(),"restore.db")
	restoreDB,e:=openDB(restorePath);if e!=nil{t.Fatal(e)}
	restoreApp:=&app{db:restoreDB,dbPath:restorePath}
	if e=restoreApp.initHousehold();e!=nil{t.Fatal(e)}
	if e=restoreApp.initCatalogue();e!=nil{t.Fatal(e)}
	if e=restoreApp.addSource("Restored",t.TempDir());e!=nil{t.Fatal(e)}
	restoreDB.Close()
	payload,e:=os.ReadFile(restorePath);if e!=nil{t.Fatal(e)}
	if e=a.stageRestore(bytes.NewReader(payload));e!=nil{t.Fatal(e)}
	a.db.Close()
	applied,e:=applyPendingRestore(a.dbPath);if e!=nil{t.Fatal(e)}
	if !applied{t.Fatal("staged restore was not applied")}
	db,e:=openDB(a.dbPath);if e!=nil{t.Fatal(e)}
	defer db.Close()
	var space string
	if e=db.QueryRow("SELECT space FROM sources ORDER BY id LIMIT 1").Scan(&space);e!=nil{t.Fatal(e)}
	if space!="Restored"{t.Fatalf("restored space=%q",space)}
}

func TestRestoreRejectsNonArchivistDatabase(t *testing.T){
	a:=fixture(t)
	if e:=a.stageRestore(bytes.NewReader([]byte("not a sqlite database")));e==nil{t.Fatal("invalid restore accepted")}
}

func TestStagedRestoreCannotBeSilentlyReplaced(t *testing.T) {
    a:=fixture(t)
    backup,err:=a.createBackup()
    if err!=nil {t.Fatal(err)}
    defer os.Remove(backup)
    payload,err:=os.ReadFile(backup)
    if err!=nil {t.Fatal(err)}
    if err:=a.stageRestore(bytes.NewReader(payload));err!=nil {t.Fatal(err)}
    pending:=a.dbPath+".restore.pending"
    original,err:=os.ReadFile(pending)
    if err!=nil {t.Fatal(err)}
    if err:=a.stageRestore(bytes.NewReader(payload));err==nil {t.Fatal("overwrote an already staged restore")}
    after,err:=os.ReadFile(pending)
    if err!=nil {t.Fatal(err)}
    if !bytes.Equal(original,after) {t.Fatal("pending restore bytes were changed")}
}

func TestPendingRestoreDoesNotOverwriteExistingRecoverySnapshot(t *testing.T) {
    a:=fixture(t)
    if err:=a.addSource("Original",t.TempDir());err!=nil {t.Fatal(err)}
    backup,err:=a.createBackup()
    if err!=nil {t.Fatal(err)}
    defer os.Remove(backup)
    payload,err:=os.ReadFile(backup)
    if err!=nil {t.Fatal(err)}
    if err:=a.stageRestore(bytes.NewReader(payload));err!=nil {t.Fatal(err)}
    snapshot:=a.dbPath+".before-restore"
    sentinel:=[]byte("an existing backup must be retained")
    if err:=os.WriteFile(snapshot,sentinel,0600);err!=nil {t.Fatal(err)}
    applied,err:=applyPendingRestore(a.dbPath)
    if err==nil || applied {t.Fatalf("overwrote an existing recovery snapshot: applied=%v err=%v",applied,err)}
    preserved,err:=os.ReadFile(snapshot)
    if err!=nil || !bytes.Equal(preserved,sentinel) {t.Fatal("existing recovery snapshot was destroyed")}
    if _,err:=os.Stat(a.dbPath+".restore.pending");err!=nil {t.Fatal("staged restore was lost")}
    var n int
    if err:=a.db.QueryRow("SELECT count(*) FROM sources").Scan(&n);err!=nil || n!=1 {t.Fatalf("active library changed: %d %v",n,err)}
}
