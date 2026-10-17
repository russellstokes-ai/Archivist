package main

import (
 "context"
 "database/sql"
 "errors"
 "net/http"
 "os"
 "sync"
 "time"
)

// All counters are indexed SQLite state. This route never touches a media
// mount, performs a source scan, guesses whether a NAS is online or promises
// that a backup exists off this server.
type operationsJobs struct {
 Queued int64 `json:"queued"`
 Running int64 `json:"running"`
 Committing int64 `json:"committing"`
 Cancelling int64 `json:"cancelling"`
 Failed int64 `json:"failed"`
 Cancelled int64 `json:"cancelled"`
}
type operationsBackup struct {
 DatabasePresent bool `json:"databasePresent"`
 DatabaseBytes int64 `json:"databaseBytes"`
 StagedRestore bool `json:"stagedRestore"`
 RestoreInFlight bool `json:"restoreInFlight"`
 RecoverySnapshot bool `json:"recoverySnapshot"`
 LocalOnly bool `json:"localOnly"`
}
type operationsOverview struct {
 IndexedSources int64 `json:"indexedSources"`
 WatchedSources int64 `json:"watchedSources"`
 IndexedFiles int64 `json:"indexedFiles"`
 IndexedWorks int64 `json:"indexedWorks"`
 PublishedWorks int64 `json:"publishedWorks"`
 StagedWorks int64 `json:"stagedWorks"`
 ReviewFiles int64 `json:"reviewFiles"`
 UnavailableFileFlags int64 `json:"unavailableFileFlags"`
 Jobs operationsJobs `json:"jobs"`
 Backup operationsBackup `json:"backup"`
 Caveats []string `json:"caveats"`
}

func readOperationsOverview(ctx context.Context,db *sql.DB,dbPath string)(operationsOverview,error){
 out:=operationsOverview{Caveats:[]string{
  "Indexed availability flags are not a fresh physical media, NAS or SMB/NFS access check.",
  "A local SQLite snapshot is not an externally verified backup or a tested recovery.",
 }}
 tx,err:=db.BeginTx(ctx,&sql.TxOptions{ReadOnly:true})
 if err!=nil{return out,err}
 defer tx.Rollback()
 queries:=[]struct{sql string;dst *int64}{
  {"SELECT count(*) FROM sources",&out.IndexedSources},
  {"SELECT count(*) FROM sources WHERE watched=1",&out.WatchedSources},
  {"SELECT count(*) FROM assets",&out.IndexedFiles},
  {"SELECT count(*) FROM works",&out.IndexedWorks},
  {"SELECT count(*) FROM published_works",&out.PublishedWorks},
  {"SELECT count(*) FROM assets WHERE needs_review=1",&out.ReviewFiles},
  {"SELECT count(*) FROM assets WHERE available=0",&out.UnavailableFileFlags},
 }
 for _,q:=range queries{
  if err=tx.QueryRowContext(ctx,q.sql).Scan(q.dst);err!=nil{return out,err}
 }
 out.StagedWorks=out.IndexedWorks-out.PublishedWorks
 // Job tables may not exist yet during first-run owner setup. Never infer
 // "all jobs healthy" from a missing table.
 var jobsTable int
 if err=tx.QueryRowContext(ctx,"SELECT count(*) FROM sqlite_master WHERE type='table' AND name='jobs'").Scan(&jobsTable);err!=nil{return out,err}
 if jobsTable==1{
  rows,e:=tx.QueryContext(ctx,"SELECT state,count(*) FROM jobs WHERE state IN ('queued','running','committing','cancelling','failed','cancelled') GROUP BY state")
  if e!=nil{return out,e}
  for rows.Next(){
   var state string
   var n int64
   if err=rows.Scan(&state,&n);err!=nil{rows.Close();return out,err}
   switch state{
   case "queued":out.Jobs.Queued=n
   case "running":out.Jobs.Running=n
   case "committing":out.Jobs.Committing=n
   case "cancelling":out.Jobs.Cancelling=n
   case "failed":out.Jobs.Failed=n
   case "cancelled":out.Jobs.Cancelled=n
   }
  }
  if err=rows.Err();err!=nil{rows.Close();return out,err}
  rows.Close()
 }else{
  out.Caveats=append(out.Caveats,"Scan job history is not initialised on this server.")
 }
 if err=tx.Commit();err!=nil{return out,err}
 out.Backup.LocalOnly=true
 if dbPath!=""{
  if info,e:=os.Stat(dbPath);e==nil&&info.Mode().IsRegular(){
   out.Backup.DatabasePresent=true
   out.Backup.DatabaseBytes=info.Size()
  }else{
   out.Caveats=append(out.Caveats,"Local database file size could not be checked.")
  }
  // Lstat avoids following a misleading symlink. These local flags are
  // operational context only; they cannot certify recoverability.
  names:=[]struct{suffix string;flag *bool}{
   {".restore.pending",&out.Backup.StagedRestore},
   {".restore.inflight",&out.Backup.RestoreInFlight},
   {".before-restore",&out.Backup.RecoverySnapshot},
  }
  for _,item:=range names{
   if info,e:=os.Lstat(dbPath+item.suffix);e==nil{
    if info.Mode().IsRegular(){*item.flag=true
    }else{out.Caveats=append(out.Caveats,"A non-regular restore artifact exists; manual inspection required.")}
   }else if !errors.Is(e,os.ErrNotExist){
    out.Caveats=append(out.Caveats,"A local restore artifact could not be inspected.")
   }
  }
 }else{
  out.Caveats=append(out.Caveats,"Database path is not configured; local recovery artifacts were not checked.")
 }
 if out.Backup.RestoreInFlight{
  out.Caveats=append(out.Caveats,"A restore transaction marker exists. Verify recovery before restarting or staging another restore.")
 }
 if out.Backup.StagedRestore{
  out.Caveats=append(out.Caveats,"A verified restore may be pending the next restart. Do not stage another upload.")
 }
 return out,nil
}
type operationsIntegrityResult struct {
 Result string `json:"result"`
 PerformedAt int64 `json:"performedAt"`
 DurationMillis int64 `json:"durationMillis"`
 Scope string `json:"scope"`
}

var operationsIntegrityMu sync.Mutex

func (a *app)operationsRoutes(mux *http.ServeMux){
 mux.HandleFunc("GET /api/manage/operations",func(w http.ResponseWriter,r *http.Request){
  if !who(r).Owner{fail(w,http.StatusForbidden,errors.New("owner-only diagnostics"));return}
  overview,err:=readOperationsOverview(r.Context(),a.db,a.dbPath)
  if err!=nil{fail(w,500,errors.New("unable to read operations snapshot"));return}
  reply(w,overview)
 })
 mux.HandleFunc("POST /api/manage/operations/integrity",func(w http.ResponseWriter,r *http.Request){
  if !who(r).Owner{fail(w,http.StatusForbidden,errors.New("owner-only integrity check"));return}
  if !operationsIntegrityMu.TryLock(){
   fail(w,http.StatusConflict,errors.New("an integrity check is already running"))
   return
  }
  defer operationsIntegrityMu.Unlock()
  // User-triggered only, with a strict upper bound. This check examines
  // SQLite structures, NOT external media, filesystem mounts or backups.
  ctx,cancel:=context.WithTimeout(r.Context(),8*time.Second)
  defer cancel()
  started:=time.Now()
  var result string
  if err:=a.db.QueryRowContext(ctx,"PRAGMA quick_check(1)").Scan(&result);err!=nil{
   fail(w,http.StatusServiceUnavailable,errors.New("SQLite quick check could not complete; integrity is unverified"))
   return
  }
  status:="problems reported"
  if result=="ok"{status="ok"}
  reply(w,operationsIntegrityResult{
   Result:status,PerformedAt:time.Now().Unix(),
   DurationMillis:time.Since(started).Milliseconds(),
   Scope:"SQLite quick_check(1) only; no media bytes, NAS mounts or restore test",
  })
 })
}
