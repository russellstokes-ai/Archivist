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
