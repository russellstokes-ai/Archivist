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
	return nil
}

func applyPendingRestore(dbPath string)(bool,error){
	pending:=dbPath+".restore.pending"
	if _,e:=os.Stat(pending);os.IsNotExist(e){return false,nil}else if e!=nil{return false,e}
	if e:=validateArchivistBackup(pending);e!=nil{return false,e}
	before:=dbPath+".before-restore"
	suffixes:=[]string{"","-wal","-shm"}
	// Never overwrite the previous recovery snapshot. An operator must archive
	// it before the next restore, rather than silently losing a working copy.
	for _,suffix:=range suffixes {
		if _,e:=os.Lstat(before+suffix);e==nil {
			return false,errors.New("previous before-restore backup still exists; archive it before applying another restore")
		}else if !os.IsNotExist(e){return false,e}
	}
	moved:=[]string{}
	rollback:=func(original error)(bool,error){
		var rollbackError error
		for i:=len(moved)-1;i>=0;i-- {
			suffix:=moved[i]
			if e:=os.Rename(before+suffix,dbPath+suffix);e!=nil { rollbackError=errors.Join(rollbackError,e) }
		}
		if rollbackError!=nil{return false,errors.Join(original,errors.New("could not fully roll back old database files"),rollbackError)}
		return false,original
	}
	for _,suffix:=range suffixes {
		if _,e:=os.Lstat(dbPath+suffix);e==nil{
			if e=os.Rename(dbPath+suffix,before+suffix);e!=nil{return rollback(e)}
			moved=append(moved,suffix)
		}else if !os.IsNotExist(e){return rollback(e)}
	}
	if e:=os.Rename(pending,dbPath);e!=nil{return rollback(e)}
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
