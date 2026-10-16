package main

// Originally RED P0 tests from quarantined PR #66. Keep catalogue identity
// stable and visible through storage outages and source filename changes.
// An unmounted NAS share can still leave an existing empty mountpoint: a
// successful shallow directory probe is NOT proof that the library was deleted.
import (
    "os"
    "path/filepath"
    "testing"
)

func TestPreviouslyIndexedMountBecomingEmptyMustNotEraseWorkOrBookmark(t *testing.T) {
    a:=fixture(t)
    if err:=a.initProgress();err!=nil{t.Fatal(err)}
    root:=filepath.Join(t.TempDir(),"nas-mount")
    if err:=os.Mkdir(root,0700);err!=nil{t.Fatal(err)}
    media:=filepath.Join(root,"Book.m4b")
    if err:=os.WriteFile(media,[]byte("test-audiobook-bytes"),0600);err!=nil{t.Fatal(err)}
    if err:=a.addSource("Family Audiobooks",root);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}

    var workID,editionID,assetID int64
    if err:=a.db.QueryRow(`SELECT w.id,e.id,ea.asset_id FROM works w
        JOIN editions e ON e.work_id=w.id
        JOIN edition_assets ea ON ea.edition_id=e.id LIMIT 1`).
        Scan(&workID,&editionID,&assetID);err!=nil{t.Fatal(err)}
    if _,err:=a.saveProgress(editionID,progress{Asset:assetID,Seconds:143,Revision:0});err!=nil{t.Fatal(err)}

    // Simulate a disconnected mount exposing an empty underlying folder.
    // The root is still a valid directory, unlike the existing missing-root test.
    if err:=os.Remove(media);err!=nil{t.Fatal(err)}
    scanErr:=a.scan(1)

    var indexedWorks,originalWork,bookmarks int
    if err:=a.db.QueryRow("SELECT count(*) FROM works").Scan(&indexedWorks);err!=nil{t.Fatal(err)}
    if err:=a.db.QueryRow("SELECT count(*) FROM works WHERE id=?",workID).Scan(&originalWork);err!=nil{t.Fatal(err)}
    if err:=a.db.QueryRow("SELECT count(*) FROM profile_progress WHERE profile_id=0 AND edition_id=? AND seconds=143",editionID).Scan(&bookmarks);err!=nil{t.Fatal(err)}

    // A legitimate user-side delete can be explicitly reconciled later.
    // A silent empty scan must NOT cascade-delete all identity and bookmarks.
    if originalWork!=1||bookmarks!=1 {
        t.Fatalf("EMPTY MOUNT DATA LOSS: scanErr=%v, works=%d, former work present=%d, saved playback bookmark=%d; empty but reachable source silently destroyed catalogue identity/progress",scanErr,indexedWorks,originalWork,bookmarks)
    }
    var available int
    if err:=a.db.QueryRow("SELECT available FROM assets WHERE id=?",assetID).Scan(&available);err!=nil{t.Fatal(err)}
    if available!=0{t.Fatal("disconnected mount incorrectly advertises playable media")}
    // Reconnect with the exact same location: prior work identity and bookmark
    // must be restored without an irreversible reimport or new logical work.
    if err:=os.WriteFile(media,[]byte("test-audiobook-bytes"),0600);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    if err:=a.db.QueryRow("SELECT available FROM assets WHERE id=?",assetID).Scan(&available);err!=nil{t.Fatal(err)}
    if available!=1{t.Fatal("reconnected media did not regain available state")}
    if err:=a.db.QueryRow("SELECT count(*) FROM works WHERE id=?",workID).Scan(&originalWork);err!=nil{t.Fatal(err)}
    if err:=a.db.QueryRow("SELECT count(*) FROM profile_progress WHERE profile_id=0 AND edition_id=? AND seconds=143",editionID).Scan(&bookmarks);err!=nil{t.Fatal(err)}
    if originalWork!=1||bookmarks!=1{t.Fatal("reconnecting mount lost original work identity or saved bookmark")}
}


func TestFileRenameCannotSilentlyDestroyAutoWorkBookmark(t *testing.T) {
    a:=fixture(t)
    if err:=a.initProgress();err!=nil{t.Fatal(err)}
    root:=t.TempDir()
    oldPath:=filepath.Join(root,"Original Title.m4b")
    newPath:=filepath.Join(root,"Renamed Title.m4b")
    if err:=os.WriteFile(oldPath,[]byte("same audiobook bytes"),0600);err!=nil{t.Fatal(err)}
    if err:=a.addSource("Audiobooks",root);err!=nil{t.Fatal(err)}
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    var oldWork,oldEdition,oldAsset int64
    if err:=a.db.QueryRow(`SELECT w.id,e.id,ea.asset_id FROM works w
        JOIN editions e ON e.work_id=w.id
        JOIN edition_assets ea ON ea.edition_id=e.id LIMIT 1`).
        Scan(&oldWork,&oldEdition,&oldAsset);err!=nil{t.Fatal(err)}
    if _,err:=a.saveProgress(oldEdition,progress{Asset:oldAsset,Seconds:222,Revision:0});err!=nil{t.Fatal(err)}
    if err:=os.Rename(oldPath,newPath);err!=nil{t.Fatal(err)}
    // No media bytes have changed; only a filename has been updated by the user.
    scanErr:=a.scan(1)

    var retainedWork,retainedProgress int
    if err:=a.db.QueryRow("SELECT count(*) FROM works WHERE id=?",oldWork).Scan(&retainedWork);err!=nil{t.Fatal(err)}
    if err:=a.db.QueryRow("SELECT count(*) FROM profile_progress WHERE profile_id=0 AND edition_id=? AND seconds=222",oldEdition).Scan(&retainedProgress);err!=nil{t.Fatal(err)}
    if retainedWork!=1||retainedProgress!=1 {
        t.Fatalf("RENAME STATE LOSS: scanErr=%v, previous work id=%d retained=%d, saved bookmark retained=%d; non-destructive filename change erased logical work/progress",scanErr,oldWork,retainedWork,retainedProgress)
    }
    var oldAvailable,newAvailable,totalWorks int
    if err:=a.db.QueryRow("SELECT available FROM assets WHERE id=?",oldAsset).Scan(&oldAvailable);err!=nil{t.Fatal(err)}
    if err:=a.db.QueryRow("SELECT available FROM assets WHERE relative_path='Renamed Title.m4b'").Scan(&newAvailable);err!=nil{t.Fatal(err)}
    if err:=a.db.QueryRow("SELECT count(*) FROM works").Scan(&totalWorks);err!=nil{t.Fatal(err)}
    if oldAvailable!=0||newAvailable!=1||totalWorks!=2 {
        t.Fatalf("unverified rename must preserve inaccessible original and offer new file separately: old=%d new=%d works=%d",oldAvailable,newAvailable,totalWorks)
    }
}
