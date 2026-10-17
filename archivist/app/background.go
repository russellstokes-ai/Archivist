package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sort"
	"strings"
	"time"
)

// Jobs are persisted before acknowledgement. Interrupted scans restart safely:
// scan commits catalogue changes atomically and upserts existing paths.
func (a *app) initJobs() error {
    // Upgrade older schemas BEFORE the first recovery transition. Unlike the
    // old startup order, this also works if the legacy table has no progress
    // columns, or an interrupted worker left more than one active queue row.
    if _,err:=a.db.Exec(`CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY,
      source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      state TEXT NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      progress INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0
    )`);err!=nil{return err}
    for _,stmt:=range []string{
      "ALTER TABLE jobs ADD COLUMN progress INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE jobs ADD COLUMN total INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE jobs ADD COLUMN cancel_requested INTEGER NOT NULL DEFAULT 0",
    }{
      if _,err:=a.db.Exec(stmt);err!=nil&&!strings.Contains(strings.ToLower(err.Error()),"duplicate column"){return err}
    }
    tx,err:=a.db.Begin()
    if err!=nil{return err}
    defer tx.Rollback()
    // Received cancellation survives process death. A crash during commit
    // requeues the scan; the catalogue upsert is idempotent and transactional.
    if _,err=tx.Exec(`UPDATE jobs SET state='cancelled',cancel_requested=0,
       message='Cancelled during interrupted scan; previous catalogue retained'
       WHERE state IN ('running','committing') AND cancel_requested=1`);err!=nil{return err}
    if _,err=tx.Exec(`UPDATE jobs SET state='queued',progress=0,total=0,
       message='Resuming interrupted scan after server restart'
       WHERE state IN ('running','committing') AND cancel_requested=0`);err!=nil{return err}
    // Old databases may contain duplicate active jobs created before the
    // partial unique index was added. Preserve the earliest job as the one
    // real retry and retain the rest as immutable cancelled history.
    if _,err=tx.Exec(`UPDATE jobs SET state='cancelled',progress=0,total=0,
       message='Duplicate queued scan retired during restart recovery'
       WHERE state='queued' AND id NOT IN
       (SELECT min(id) FROM jobs WHERE state='queued' GROUP BY source_id)`);err!=nil{return err}
    if _,err=tx.Exec("DROP INDEX IF EXISTS one_active_scan");err!=nil{return err}
    if _,err=tx.Exec(`CREATE UNIQUE INDEX one_active_scan
       ON jobs(source_id) WHERE state IN ('queued','running','committing')`);err!=nil{return err}
    return tx.Commit()
}
func (a *app) enqueue(id int64) (int64,error) {
    var source int64
    if err:=a.db.QueryRow("SELECT id FROM sources WHERE id=?",id).Scan(&source);err!=nil{
        return 0,errors.New("source not found")
    }
    // One atomic insertion is safe even when an owner and the watch scheduler
    // request a scan at the same instant. Existing active work is reused.
    result,err:=a.db.Exec(`INSERT INTO jobs(source_id,state,message) VALUES(?,'queued','Waiting for scanner')
      ON CONFLICT(source_id) WHERE state IN ('queued','running','committing') DO NOTHING`,source)
    if err!=nil{return 0,err}
    n,err:=result.RowsAffected()
    if err!=nil{return 0,err}
    if n==1{return result.LastInsertId()}
    var existing int64
    if err=a.db.QueryRow(`SELECT id FROM jobs WHERE source_id=? AND state IN ('queued','running','committing') LIMIT 1`,source).Scan(&existing);err!=nil{
        return 0,fmt.Errorf("active scan changed during queue insertion: %w",err)
    }
    return existing,nil
}

// Queued cancellation is final immediately. Running cancellation is only a
// request, acknowledged by the scanner before the atomic committing boundary.
func (a *app) cancelQueuedJob(id int64) error {
    result,err:=a.db.Exec(`UPDATE jobs SET state='cancelled',
      message='Cancelled before the scan started',progress=0,total=0
      WHERE id=? AND state='queued'`,id)
    if err!=nil{return err}
    n,err:=result.RowsAffected()
    if err!=nil{return err}
    if n==1{return nil}
    var state string
    if err=a.db.QueryRow("SELECT state FROM jobs WHERE id=?",id).Scan(&state);err!=nil{
        return errors.New("scan job not found")
    }
    if state=="cancelled"{return nil}
    if state=="running"{return errors.New("running scans cannot be cancelled safely; wait for completion")}
    return errors.New("only queued scan jobs may be cancelled")
}
// Running scans can request cancellation, but only the scanner may accept
// the final stop before moving atomically to the COMMITTING boundary.
func (a *app) requestJobCancellation(id int64)(string,error){
    if id<1{return "",errors.New("invalid scan job")}
    if err:=a.cancelQueuedJob(id);err==nil{return "cancelled",nil}
    result,err:=a.db.Exec(`UPDATE jobs
       SET cancel_requested=1,message='Cancellation requested; waiting for safe scan checkpoint'
       WHERE id=? AND state='running' AND cancel_requested=0`,id)
    if err!=nil{return "",err}
    n,err:=result.RowsAffected()
    if err!=nil{return "",err}
    if n==1{return "cancelling",nil}
    var state string
    var requested bool
    if err:=a.db.QueryRow("SELECT state,cancel_requested FROM jobs WHERE id=?",id).
      Scan(&state,&requested);err!=nil{return "",errors.New("scan job not found")}
    if state=="cancelled"{return "cancelled",nil}
    if state=="running"&&requested{return "cancelling",nil}
    if state=="committing"{return "",errors.New("scan is committing its verified catalogue; too late to cancel safely")}
    return "",errors.New("only queued or running scans can be cancelled")
}

func (a *app) retryFailedJob(id int64)(int64,error){
    var source int64
    var state string
    if err:=a.db.QueryRow("SELECT source_id,state FROM jobs WHERE id=?",id).Scan(&source,&state);err!=nil{
        return 0,errors.New("scan job not found")
    }
    if state!="failed"&&state!="cancelled"{
        return 0,errors.New("only cancelled or failed scans can be retried")
    }
    // Do not overwrite failure history or resurrect an old job. A retry is a
    // new durable job, deduplicated with any pending automatic scan.
    return a.enqueue(source)
}

func (a *app) watcher(ctx context.Context) {
	ticker:=time.NewTicker(time.Minute)
	defer ticker.Stop()
	_ = a.scheduleWatched(time.Now().Unix())
	for {
		select {
		case <-ctx.Done(): return
		case now:=<-ticker.C: _ = a.scheduleWatched(now.Unix())
		}
	}
}

func (a *app) scheduleWatched(now int64) error {
	rows,e:=a.db.Query(`SELECT id,watch_minutes,last_watch FROM sources WHERE watched=1 ORDER BY id`)
	if e!=nil{return e}
	type due struct{id int64;minutes int;last int64}
	items:=[]due{}
	for rows.Next(){var item due;if e=rows.Scan(&item.id,&item.minutes,&item.last);e!=nil{rows.Close();return e};items=append(items,item)}
	if e=rows.Err();e!=nil{rows.Close();return e}
	rows.Close()
	for _,item:=range items{
		minutes:=item.minutes;if minutes<15{minutes=15}
		if item.last>0 && now-item.last<int64(minutes*60){continue}
		if _,e=a.enqueue(item.id);e!=nil{return e}
        // Do not consume a watch interval when the database could not queue
        // the job (e.g. a transient read-only storage or SQLite error).
        if _,e=a.db.Exec("UPDATE sources SET last_watch=? WHERE id=?",now,item.id);e!=nil{return e}
	}
	return nil
}

func (a *app) worker(ctx context.Context) {
	ticker := time.NewTicker(300 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			var id, source int64
			if e := a.db.QueryRow("SELECT id,source_id FROM jobs WHERE state='queued' ORDER BY id LIMIT 1").Scan(&id, &source); e != nil {
				continue
			}
            claim,claimErr:=a.db.Exec(`UPDATE jobs SET state='running',message='Scanner starting',
              progress=0,total=0 WHERE id=? AND state='queued'`,id)
            if claimErr!=nil{continue}
            n,claimErr:=claim.RowsAffected()
            if claimErr!=nil||n!=1{continue}
			state, msg := "complete", "Scan complete"
			progressFn := func(done, total int) {
				message := fmt.Sprintf("Reading book details · %d files found", done)
				if total > 0 {
					message = fmt.Sprintf("Scanning %d of %d files", done, total)
				}
				a.db.Exec("UPDATE jobs SET progress=?,total=?,message=? WHERE id=? AND cancel_requested=0", done, total, message, id)
			}
			if e := a.scanWithProgressJob(ctx,source,id,progressFn); e != nil {
                if errors.Is(e,errScanCancelled){
                    state,msg="cancelled","Cancelled safely before catalogue commit; previous catalogue retained"
                }else{
                    state,msg="failed",e.Error()
                }
			}
			a.db.Exec(`UPDATE jobs SET state=?,message=?,cancel_requested=0,
              progress=CASE WHEN ?='complete' THEN total ELSE progress END
              WHERE id=? AND state IN ('running','committing')`, state, msg, state, id)
		}
	}
}
func (a *app) backgroundRoutes(mux *http.ServeMux) {
    mux.HandleFunc("POST /api/jobs/{id}/cancel",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator required"));return}
        id,err:=strconv.ParseInt(r.PathValue("id"),10,64)
        if err!=nil||id<1{fail(w,400,errors.New("invalid scan job"));return}
        state,err:=a.requestJobCancellation(id)
        if err!=nil{fail(w,409,err);return}
        if state=="cancelling"{w.Header().Set("Content-Type","application/json");w.WriteHeader(http.StatusAccepted)}
        reply(w,map[string]any{"ok":true,"id":id,"state":state})
    })
    mux.HandleFunc("POST /api/jobs/{id}/retry",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator required"));return}
        id,err:=strconv.ParseInt(r.PathValue("id"),10,64)
        if err!=nil||id<1{fail(w,400,errors.New("invalid scan job"));return}
        newID,err:=a.retryFailedJob(id)
        if err!=nil{fail(w,409,err);return}
        w.Header().Set("Content-Type","application/json")
        w.WriteHeader(http.StatusAccepted)
        reply(w,map[string]any{"ok":true,"job_id":newID,"state":"queued"})
    })
	mux.HandleFunc("GET /api/jobs", func(w http.ResponseWriter, r *http.Request) {
        if !who(r).Owner{fail(w,403,errors.New("administrator required"));return}
		rows, e := a.db.Query("SELECT id,source_id,state,message,progress,total,cancel_requested FROM jobs ORDER BY id DESC LIMIT 50")
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer rows.Close()
		out := []map[string]any{}
		for rows.Next() {
			var id, source int64
			var progress, total int
            var cancelRequested bool
			var state, msg string
			if e = rows.Scan(&id, &source, &state, &msg, &progress, &total,&cancelRequested); e != nil {
				fail(w, 500, e)
				return
			}
            display:=state
            if state=="running"&&cancelRequested{display="cancelling"}
			out = append(out, map[string]any{
              "id":id,"source_id":source,"state":display,"message":msg,
              "progress":progress,"total":total,
              "canCancel":state=="queued"||(state=="running"&&!cancelRequested),
              "canRetry":state=="cancelled"||state=="failed",
            })
		}
		if e=rows.Err();e!=nil{fail(w,500,e);return}
		reply(w, out)
	})
	mux.HandleFunc("GET /api/folders", func(w http.ResponseWriter, r *http.Request) {
        if !who(r).Owner{fail(w,403,errors.New("administrator required"));return}
		p := r.URL.Query().Get("path")
		if p == "" {
			roots := browseRoots()
			reply(w, map[string]any{"path": "", "parent": "", "roots": roots, "folders": roots})
			return
		}
		root, e := canonical(p)
		if e != nil {
			fail(w, 400, errors.New("folder unavailable: "+p))
			return
		}
		entries, e := os.ReadDir(root)
		if e != nil {
			fail(w, 403, errors.New("Archivist cannot read this folder from the server"))
			return
		}
		folders := []map[string]string{}
		for _, d := range entries {
			if d.IsDir() && d.Type()&os.ModeSymlink == 0 {
				folders = append(folders, map[string]string{"name": d.Name(), "path": filepath.Join(root, d.Name())})
			}
		}
		reply(w, map[string]any{"path": root, "parent": filepath.Dir(root), "folders": folders})
	})
}

func browseRoots() []map[string]string {
	candidates := []struct {
		name string
		path string
	}{
		{"Media", "/media"},
		{"Share", "/share"},
		{"Mounted drives", "/mnt"},
		{"Server data", "/data"},
		{"Library storage", "/srv"},
	}
	if home, e := os.UserHomeDir(); e == nil && home != "" {
		candidates = append(candidates, struct {
			name string
			path string
		}{"Home", home})
	}
	seen := map[string]bool{}
	roots := []map[string]string{}
	for _, c := range candidates {
		p, e := canonical(c.path)
		if e != nil || seen[p] {
			continue
		}
		seen[p] = true
		roots = append(roots, map[string]string{"name": c.name, "path": p})
	}
	sort.SliceStable(roots, func(i, j int) bool { return roots[i]["name"] < roots[j]["name"] })
	return roots
}
