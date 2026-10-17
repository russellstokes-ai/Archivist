package main

import (
    "bytes"
    "os"
    "path/filepath"
    "testing"
)

// These tests use disposable SQLite databases, never a real family server.
// A crash can occur after .before-restore is created but before the validated
// staged database reaches its final name. Startup must recover safely instead
// of treating its OWN interrupted transaction as somebody else's old backup.
func TestInterruptedRestoreRecoversOriginalWithoutDiscardingVerifiedPending(t *testing.T) {
    a:=fixture(t)
    if err:=a.addSource("Preserve previous collection",t.TempDir());err!=nil{t.Fatal(err)}
    backup,err:=a.createBackup()
    if err!=nil{t.Fatal(err)}
    defer os.Remove(backup)
    body,err:=os.ReadFile(backup)
    if err!=nil{t.Fatal(err)}
    if err=a.stageRestore(bytes.NewReader(body));err!=nil{t.Fatal(err)}
    if err=a.db.Close();err!=nil{t.Fatal(err)}

    dbPath:=a.dbPath
    before:=dbPath+".before-restore"
    marker:=dbPath+".restore.inflight"
    if err=os.WriteFile(marker,[]byte("ARCHIVIST_RESTORE_TRANSACTION_V1\n"),0600);err!=nil{t.Fatal(err)}
    if err=os.Rename(dbPath,before);err!=nil{t.Fatal(err)}

    applied,err:=applyPendingRestore(dbPath)
    if err!=nil{t.Fatalf("interrupted restore must recover original database instead of blocking startup: %v",err)}
    if applied{t.Fatal("recovery must not claim it installed a fresh restore")}
    if _,err=os.Stat(dbPath);err!=nil{t.Fatalf("previous database not put back: %v",err)}
    if _,err=os.Stat(before);!os.IsNotExist(err){t.Fatal("rollback left half-moved recovery file",err)}
    if _,err=os.Stat(marker);!os.IsNotExist(err){t.Fatal("resolved transaction marker still present",err)}
    if _,err=os.Stat(dbPath+".restore.pending");err!=nil{t.Fatal("valid pending restore was destroyed",err)}

    db,err:=openDB(dbPath)
    if err!=nil{t.Fatal("restored previous sqlite database could not open",err)}
    var n int
    if err=db.QueryRow("SELECT count(*) FROM sources WHERE space='Preserve previous collection'").Scan(&n);err!=nil||n!=1{
        db.Close()
        t.Fatalf("lost previous library after interrupted restore: source count %d, error %v",n,err)
    }
    if err=db.Close();err!=nil{t.Fatal(err)}
}

func TestInterruptedRestoreAfterPendingPromotionCompletesWithoutOverwritingOldBackup(t *testing.T) {
    a:=fixture(t)
    if err:=a.addSource("Original library",t.TempDir());err!=nil{t.Fatal(err)}
    backup,err:=a.createBackup()
    if err!=nil{t.Fatal(err)}
    defer os.Remove(backup)
    data,err:=os.ReadFile(backup)
    if err!=nil{t.Fatal(err)}
    if err=a.stageRestore(bytes.NewReader(data));err!=nil{t.Fatal(err)}
    if err=a.db.Close();err!=nil{t.Fatal(err)}
    path:=a.dbPath
    before:=path+".before-restore"
    marker:=path+".restore.inflight"
    if err=os.WriteFile(marker,[]byte("ARCHIVIST_RESTORE_TRANSACTION_V1\n"),0600);err!=nil{t.Fatal(err)}
    if err=os.Rename(path,before);err!=nil{t.Fatal(err)}
    if err=os.Rename(path+".restore.pending",path);err!=nil{t.Fatal(err)}
    originalBackup,err:=os.ReadFile(before)
    if err!=nil{t.Fatal(err)}

    applied,err:=applyPendingRestore(path)
    if err!=nil||!applied{t.Fatalf("valid installed restore must recover after crash: applied %v, error %v",applied,err)}
    after,err:=os.ReadFile(before)
    if err!=nil||!bytes.Equal(after,originalBackup){t.Fatal("crash completion overwrote original recovery snapshot")}
    if _,err=os.Stat(marker);!os.IsNotExist(err){t.Fatal("completed transaction marker still present",err)}
    if _,err=os.Stat(path+".restore.pending");!os.IsNotExist(err){t.Fatal("already installed restore was unexpectedly restaged",err)}
    if err=validateArchivistBackup(path);err!=nil{t.Fatal("installed restore invalid",err)}
}

func TestUnknownRestoreMarkerFailsClosedWithoutTouchingPriorDatabase(t *testing.T) {
    a:=fixture(t)
    if err:=a.addSource("Keep existing",t.TempDir());err!=nil{t.Fatal(err)}
    backup,err:=a.createBackup()
    if err!=nil{t.Fatal(err)}
    defer os.Remove(backup)
    payload,err:=os.ReadFile(backup)
    if err!=nil{t.Fatal(err)}
    if err=a.stageRestore(bytes.NewReader(payload));err!=nil{t.Fatal(err)}
    if err=a.db.Close();err!=nil{t.Fatal(err)}
    marker:=filepath.Clean(a.dbPath+".restore.inflight")
    if err=os.WriteFile(marker,[]byte("BAD-MARKER"),0600);err!=nil{t.Fatal(err)}
    before,err:=os.ReadFile(a.dbPath)
    if err!=nil{t.Fatal(err)}
    applied,err:=applyPendingRestore(a.dbPath)
    if applied||err==nil{t.Fatalf("unknown restore marker must fail closed: applied=%v err=%v",applied,err)}
    after,err:=os.ReadFile(a.dbPath)
    if err!=nil||!bytes.Equal(before,after){t.Fatal("unknown marker changed old database bytes")}
    if _,err=os.Stat(a.dbPath+".restore.pending");err!=nil{t.Fatal("staged restore not retained",err)}
}
