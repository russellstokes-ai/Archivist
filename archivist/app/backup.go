package main

import (
	"database/sql"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const maxRestoreBytes int64 = 256 << 20

func sqliteQuote(path string) string { return "'" + strings.ReplaceAll(path,"'","''") + "'" }

func validateArchivistBackup(path string) error {
	db,e:=sql.Open("sqlite","file:"+filepath.ToSlash(path)+"?mode=ro")
	if e!=nil{return e}
	defer db.Close()
	var integrity string
	if e=db.QueryRow("PRAGMA integrity_check").Scan(&integrity);e!=nil{return e}
	if integrity!="ok"{return errors.New("backup failed SQLite integrity check")}
	for _,table:=range []string{"sources","assets","works","editions"}{
		var n int
		if e=db.QueryRow("SELECT count(*) FROM sqlite_master WHERE type='table' AND name=?",table).Scan(&n);e!=nil||n!=1{
			return errors.New("backup is not an Archivist database")
		}
	}
	return nil
}

func (a *app) createBackup()(string,error){
	if a.dbPath==""{return "",errors.New("database path unavailable")}
	dir:=filepath.Dir(a.dbPath)
	f,e:=os.CreateTemp(dir,"archivist-backup-*.db")
	if e!=nil{return "",e}
	path:=f.Name();if e=f.Close();e!=nil{os.Remove(path);return "",e}
	if e=os.Remove(path);e!=nil{return "",e}
	if _,e=a.db.Exec("VACUUM INTO "+sqliteQuote(path));e!=nil{os.Remove(path);return "",e}
	if e=validateArchivistBackup(path);e!=nil{os.Remove(path);return "",e}
	return path,nil
}

func (a *app) stageRestore(reader io.Reader) error {
	if a.dbPath==""{return errors.New("database path unavailable")}
	dir:=filepath.Dir(a.dbPath)
	temp,e:=os.CreateTemp(dir,"archivist-restore-*.db")
	if e!=nil{return e}
	tempPath:=temp.Name()
	defer os.Remove(tempPath)
	n,e:=io.Copy(temp,io.LimitReader(reader,maxRestoreBytes+1))
	if syncErr:=temp.Sync();e==nil{e=syncErr}
	if closeErr:=temp.Close();e==nil{e=closeErr}
	if e!=nil{return e}
	if n<=0 || n>maxRestoreBytes{return errors.New("restore file is empty or too large")}
	if e=validateArchivistBackup(tempPath);e!=nil{return e}
	pending:=a.dbPath+".restore.pending"
	// Do not delete a previously verified restore that is awaiting restart.
	// Link is atomic on the local container filesystem and refuses to replace
	// an existing path, even if two upload requests race with each other.
	if e:=os.Link(tempPath,pending);e!=nil {
		if errors.Is(e,os.ErrExist) { return errors.New("a restore is already staged; restart or resolve it before uploading another") }
		return e
	}
	// Link metadata must survive restart; temp has already been fsynced.
	if e:=syncRestoreDirectory(a.dbPath);e!=nil{return e}
	return nil
}

const restoreInFlightMagic = "ARCHIVIST_RESTORE_TRANSACTION_V1\n"

func restorePathExists(path string) (bool,error) {
    _,err:=os.Lstat(path)
    if err==nil{return true,nil}
    if os.IsNotExist(err){return false,nil}
    return false,err
}

// A rename is atomic locally but not automatically durable after a power
// failure. Flush the containing directory after each recovery boundary.
func syncRestoreDirectory(dbPath string)error {
    dir,err:=os.Open(filepath.Dir(dbPath))
    if err!=nil{return err}
    defer dir.Close()
    return dir.Sync()
}

func createRestoreMarker(dbPath string)error {
    name:=dbPath+".restore.inflight"
    f,err:=os.OpenFile(name,os.O_CREATE|os.O_EXCL|os.O_WRONLY,0600)
    if err!=nil{return err}
    _,writeErr:=f.WriteString(restoreInFlightMagic)
    if writeErr==nil{writeErr=f.Sync()}
    closeErr:=f.Close()
    if writeErr!=nil{return writeErr}
    if closeErr!=nil{return closeErr}
    // No DB/WAL rename can start until the marker is itself durable.
    return syncRestoreDirectory(dbPath)
}

func removeRestoreMarker(dbPath string)error {
    if err:=os.Remove(dbPath+".restore.inflight");err!=nil{return err}
    return syncRestoreDirectory(dbPath)
}

// Recover only swaps that *this server* marked as in-flight. The older
// .before-restore file may belong to a prior successful recovery and must
// never be interpreted as permission to overwrite it.
func recoverInterruptedRestore(dbPath string)(handled,applied bool,err error){
    marker:=dbPath+".restore.inflight"
    info,err:=os.Lstat(marker)
    if os.IsNotExist(err){return false,false,nil}
    if err!=nil{return true,false,err}
    if !info.Mode().IsRegular(){return true,false,errors.New("unsafe SQLite restore marker")}
    content,err:=os.ReadFile(marker)
    if err!=nil{return true,false,err}
    if string(content)!=restoreInFlightMagic{
        return true,false,errors.New("unrecognized SQLite restore transaction marker; old data untouched")
    }
    pending,err:=restorePathExists(dbPath+".restore.pending")
    if err!=nil{return true,false,err}
    before:=dbPath+".before-restore"
    if pending{
        // The new snapshot was NOT installed. Roll all old files back to
        // their original names. Reverse order mirrors the initial DB/WAL/SHM
        // move, retaining both pending and any untouched old files.
        for _,suffix:=range []string{"-shm","-wal",""}{
            recoveryFile,checkErr:=restorePathExists(before+suffix)
            if checkErr!=nil{return true,false,checkErr}
            if !recoveryFile{continue}
            active,activeErr:=restorePathExists(dbPath+suffix)
            if activeErr!=nil{return true,false,activeErr}
            if active{
                return true,false,errors.New("ambiguous SQLite restore state: current and recovery files both exist")
            }
            if renameErr:=os.Rename(before+suffix,dbPath+suffix);renameErr!=nil{
                return true,false,renameErr
            }
        }
        active,checkErr:=restorePathExists(dbPath)
        if checkErr!=nil{return true,false,checkErr}
        if !active{
            return true,false,errors.New("interrupted restore has no recoverable previous database")
        }
        if checkErr=validateArchivistBackup(dbPath);checkErr!=nil{
            return true,false,errors.Join(errors.New("previous SQLite database failed recovery check"),checkErr)
        }
        if checkErr=syncRestoreDirectory(dbPath);checkErr!=nil{return true,false,checkErr}
        if checkErr=removeRestoreMarker(dbPath);checkErr!=nil{return true,false,checkErr}
        // Preserve .restore.pending for the next deliberate restart/attempt.
        // This startup uses the verified previous library, not a partial mix.
        return true,false,nil
    }
    // Pending is absent: the atomic promotion already occurred, and the old
    // .before-restore is retained for rollback. Verify before acknowledging.
    prior,checkErr:=restorePathExists(before)
    if checkErr!=nil{return true,false,checkErr}
    if !prior{return true,false,errors.New("promoted restore has no retained original database")}
    if checkErr=validateArchivistBackup(dbPath);checkErr!=nil{
        return true,false,errors.Join(errors.New("promoted SQLite restore failed integrity checks"),checkErr)
    }
    if checkErr=syncRestoreDirectory(dbPath);checkErr!=nil{return true,false,checkErr}
    if checkErr=removeRestoreMarker(dbPath);checkErr!=nil{return true,false,checkErr}
    return true,true,nil
}

func applyPendingRestore(dbPath string)(bool,error){
    if handled,applied,recoveryErr:=recoverInterruptedRestore(dbPath);handled{
        return applied,recoveryErr
    }
    pending:=dbPath+".restore.pending"
    if _,e:=os.Stat(pending);os.IsNotExist(e){return false,nil}else if e!=nil{return false,e}
    if e:=validateArchivistBackup(pending);e!=nil{return false,e}
    before:=dbPath+".before-restore"
    suffixes:=[]string{"","-wal","-shm"}
    // Never overwrite the previous recovery snapshot. The marker is
    // exclusive to a NEW restore attempt; it cannot override old backups.
    for _,suffix:=range suffixes {
        if _,e:=os.Lstat(before+suffix);e==nil {
            return false,errors.New("previous before-restore backup still exists; archive it before applying another restore")
        }else if !os.IsNotExist(e){return false,e}
    }
    if err:=createRestoreMarker(dbPath);err!=nil{return false,err}

    moved:=[]string{}
    rollback:=func(original error)(bool,error){
        var rollbackError error
        for i:=len(moved)-1;i>=0;i-- {
            suffix:=moved[i]
            if e:=os.Rename(before+suffix,dbPath+suffix);e!=nil{
                rollbackError=errors.Join(rollbackError,e)
            }
        }
        if rollbackError!=nil{
            // Leave the marker and copies in place for recovery on restart.
            return false,errors.Join(original,
                errors.New("could not fully roll back old SQLite files"),rollbackError)
        }
        if e:=syncRestoreDirectory(dbPath);e!=nil{return false,errors.Join(original,e)}
        if e:=removeRestoreMarker(dbPath);e!=nil{return false,errors.Join(original,e)}
        return false,original
    }
    for _,suffix:=range suffixes{
        if _,e:=os.Lstat(dbPath+suffix);e==nil{
            if e=os.Rename(dbPath+suffix,before+suffix);e!=nil{return rollback(e)}
            moved=append(moved,suffix)
        }else if !os.IsNotExist(e){return rollback(e)}
    }
    // The pre-restore files must reach stable directory entries before
    // installing the new database. A torn swap remains recoverable.
    if e:=syncRestoreDirectory(dbPath);e!=nil{return rollback(e)}
    if e:=os.Rename(pending,dbPath);e!=nil{return rollback(e)}
    // After this rename, pending is absent. Keep the marker until a synced,
    // validated new DB exists so a reboot can complete acknowledgement.
    if e:=syncRestoreDirectory(dbPath);e!=nil{return false,e}
    if e:=validateArchivistBackup(dbPath);e!=nil{return false,e}
    if e:=removeRestoreMarker(dbPath);e!=nil{return false,e}
    return true,nil
}

func (a *app) backupRoutes(mux *http.ServeMux){
	mux.HandleFunc("GET /api/backup",func(w http.ResponseWriter,r *http.Request){
		path,e:=a.createBackup()
		if e!=nil{fail(w,500,e);return}
		defer os.Remove(path)
		w.Header().Set("Content-Type","application/vnd.sqlite3")
		w.Header().Set("Content-Disposition",`attachment; filename="archivist-backup.db"`)
		http.ServeFile(w,r,path)
	})
	mux.HandleFunc("POST /api/restore",func(w http.ResponseWriter,r *http.Request){
		if e:=a.stageRestore(http.MaxBytesReader(w,r.Body,maxRestoreBytes+1));e!=nil{fail(w,400,e);return}
		reply(w,map[string]any{"ok":true,"restartRequired":true})
	})
}
