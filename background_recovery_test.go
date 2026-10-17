package main

import (
    "context"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "os"
    "path/filepath"
    "strconv"
    "strings"
    "sync"
    "testing"
    "time"
)

func scanJobRequest(a *app,method,path,cookie string,csrf bool)*httptest.ResponseRecorder{
    req:=httptest.NewRequest(method,path,nil)
    if cookie!=""{req.AddCookie(&http.Cookie{Name:"archivist_session",Value:cookie})}
    if csrf{req.Header.Set("X-Archivist-Action","1")}
    res:=httptest.NewRecorder()
    a.routes().ServeHTTP(res,req)
    return res
}

func TestServerQueuedScanCancellationAndRetryAreDurable(t *testing.T){
    a:=fixture(t)
    if err:=a.initJobs();err!=nil{t.Fatal(err)}
    root:=t.TempDir()
    file:=filepath.Join(root,"Journal.pdf")
    if err:=os.WriteFile(file,[]byte("pdf fixture"),0600);err!=nil{t.Fatal(err)}
    if err:=a.addSource("Library",root);err!=nil{t.Fatal(err)}
    first,err:=a.enqueue(1)
    if err!=nil{t.Fatal(err)}
    jobsURL:="/api/jobs"
    id:=strconv.FormatInt(first,10)
    if res:=scanJobRequest(a,"GET",jobsURL,"",false);res.Code!=401{t.Fatalf("anonymous job access=%d",res.Code)}
    if res:=scanJobRequest(a,"GET","/api/folders","",false);res.Code!=401{t.Fatalf("anonymous host folder access=%d",res.Code)}
    if _,err:=a.db.Exec("INSERT INTO profiles(name,key_hash) VALUES('Reader',?)",keyHash("reader"));err!=nil{t.Fatal(err)}
    member,err:=a.newSession("reader");if err!=nil{t.Fatal(err)}
    for _,path:=range []string{jobsURL,"/api/folders","/api/folders?path="+root}{
        if res:=scanJobRequest(a,"GET",path,member,false);res.Code!=403{t.Fatalf("member accessed server operation %s: %d",path,res.Code)}
    }
    for _,path:=range []string{"/api/jobs/"+id+"/cancel","/api/jobs/"+id+"/retry"}{
        if res:=scanJobRequest(a,"POST",path,member,true);res.Code!=403{t.Fatalf("member mutation allowed: %s %d",path,res.Code)}
        if res:=scanJobRequest(a,"POST",path,"test-key",false);res.Code!=403{t.Fatalf("CSRF missing: %s %d",path,res.Code)}
    }
    response:=scanJobRequest(a,"GET",jobsURL,"test-key",false)
    if response.Code!=200{t.Fatalf("owner jobs GET: %d %s",response.Code,response.Body.String())}
    var jobs []struct{
        ID int64 `json:"id"`
        State string `json:"state"`
        CanCancel bool `json:"canCancel"`
        CanRetry bool `json:"canRetry"`
    }
    if err:=json.Unmarshal(response.Body.Bytes(),&jobs);err!=nil{t.Fatal(err)}
    if len(jobs)!=1||!jobs[0].CanCancel||jobs[0].CanRetry{t.Fatalf("job capabilities: %+v",jobs)}
    cancel:="/api/jobs/"+id+"/cancel"
    res:=scanJobRequest(a,"POST",cancel,"test-key",true)
    if res.Code!=200{t.Fatalf("queued cancellation failed: %d %s",res.Code,res.Body.String())}
    res=scanJobRequest(a,"POST",cancel,"test-key",true)
    if res.Code!=200{t.Fatalf("idempotent cancel failed: %d %s",res.Code,res.Body.String())}
    var state string
    if err:=a.db.QueryRow("SELECT state FROM jobs WHERE id=?",first).Scan(&state);err!=nil||state!="cancelled"{
        t.Fatalf("queued scan state=%s err=%v",state,err)
    }
    var n int
    if err:=a.db.QueryRow("SELECT count(*) FROM assets").Scan(&n);err!=nil||n!=0{
        t.Fatalf("cancelled job unexpectedly scanned source: count=%d err=%v",n,err)
    }
    retry:="/api/jobs/"+id+"/retry"
    res=scanJobRequest(a,"POST",retry,"test-key",true)
    if res.Code!=202||!strings.Contains(res.Header().Get("Content-Type"),"application/json"){
        t.Fatalf("retry should be accepted JSON: %d %s",res.Code,res.Body.String())
    }
    var accepted struct{
        JobID int64 `json:"job_id"`
    }
    if err:=json.Unmarshal(res.Body.Bytes(),&accepted);err!=nil||accepted.JobID==first||accepted.JobID<1{
        t.Fatalf("retry did not create new job: %+v, %v",accepted,err)
    }
    res=scanJobRequest(a,"POST",retry,"test-key",true)
    var again struct{JobID int64 `json:"job_id"`}
    if res.Code!=202{t.Fatalf("second retry failed: %d %s",res.Code,res.Body.String())}
    if err:=json.Unmarshal(res.Body.Bytes(),&again);err!=nil||again.JobID!=accepted.JobID{
        t.Fatalf("retry was not deduplicated: %+v vs %+v err=%v",again,accepted,err)
    }
    // The superseded failed/cancelled job remains in history; only the new job runs.
    ctx,cancelWorker:=context.WithCancel(context.Background())
    defer cancelWorker()
    go a.worker(ctx)
    deadline:=time.Now().Add(5*time.Second)
    for time.Now().Before(deadline){
        if err:=a.db.QueryRow("SELECT state FROM jobs WHERE id=?",accepted.JobID).Scan(&state);err!=nil{t.Fatal(err)}
        if state=="complete"{break}
        if state=="failed"{t.Fatalf("retried job failed: %+v",scanJobRequest(a,"GET",jobsURL,"test-key",false).Body.String())}
        time.Sleep(25*time.Millisecond)
    }
    if state!="complete"{t.Fatal("retied scan never finished")}
    var oldState string
    if err:=a.db.QueryRow("SELECT state FROM jobs WHERE id=?",first).Scan(&oldState);err!=nil||oldState!="cancelled"{
        t.Fatalf("old job history mutated: %s %v",oldState,err)
    }
    if err:=a.db.QueryRow("SELECT count(*) FROM assets").Scan(&n);err!=nil||n!=1{
        t.Fatalf("new job failed to index file: %d %v",n,err)
    }
    if res=scanJobRequest(a,"POST","/api/jobs/"+strconv.FormatInt(accepted.JobID,10)+"/cancel","test-key",true);res.Code!=409{
        t.Fatalf("complete job cancellable: %d",res.Code)
    }
    if res=scanJobRequest(a,"POST","/api/jobs/"+strconv.FormatInt(accepted.JobID,10)+"/retry","test-key",true);res.Code!=409{
        t.Fatalf("completed job retried: %d",res.Code)
    }
    if fileInfo,err:=os.Stat(file);err!=nil||fileInfo.Size()==0{t.Fatalf("scan mutated original media: %v",err)}
}

func TestConcurrentServerScanRequestsDeduplicateAtDatabaseBoundary(t *testing.T){
    a:=fixture(t)
    if err:=a.initJobs();err!=nil{t.Fatal(err)}
    if err:=a.addSource("Main",t.TempDir());err!=nil{t.Fatal(err)}
    const parallel=24
    var wg sync.WaitGroup
    results:=make([]int64,parallel)
    errs:=make([]error,parallel)
    signal:=make(chan struct{})
    for i:=0;i<parallel;i++{
        wg.Add(1)
        go func(i int){defer wg.Done();<-signal;results[i],errs[i]=a.enqueue(1)}(i)
    }
    close(signal)
    wg.Wait()
    for i:=0;i<parallel;i++{
        if errs[i]!=nil||results[i]<1||results[i]!=results[0]{
            t.Fatalf("duplicate enqueue[%d]=%d err=%v; first=%d",i,results[i],errs[i],results[0])
        }
    }
    var count int
    if err:=a.db.QueryRow("SELECT count(*) FROM jobs WHERE state='queued'").Scan(&count);err!=nil||count!=1{
        t.Fatalf("one-active-scan violated: %d %v",count,err)
    }
}

func TestScanJobRestartReconcilesLegacyDuplicatesBeforeCreatingUniqueIndex(t *testing.T){
    a:=fixture(t)
    if err:=a.initJobs();err!=nil{t.Fatal(err)}
    if err:=a.addSource("Main",t.TempDir());err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec("DROP INDEX IF EXISTS one_active_scan");err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec(`INSERT INTO jobs(source_id,state,message,progress,total)
        VALUES(1,'running','Running at crash',35,100),
              (1,'queued','Duplicate before crash',0,0),
              (1,'running','Duplicate worker',14,30)`);err!=nil{t.Fatal(err)}
    if err:=a.initJobs();err!=nil{t.Fatalf("interrupted legacy table not recoverable: %v",err)}
    rows,err:=a.db.Query("SELECT state,message,progress,total FROM jobs ORDER BY id")
    if err!=nil{t.Fatal(err)}
    defer rows.Close()
    i:=0
    for rows.Next(){
        var state,message string
        var progress,total int
        if err=rows.Scan(&state,&message,&progress,&total);err!=nil{t.Fatal(err)}
        if i==0{
            if state!="queued"||progress!=0||total!=0||!strings.Contains(message,"Resuming interrupted"){
                t.Fatalf("primary recovery: %q %q %d %d",state,message,progress,total)
            }
        }else if state!="cancelled"||!strings.Contains(message,"Duplicate")||progress!=0||total!=0{
            t.Fatalf("duplicate recovery: %q %q %d %d",state,message,progress,total)
        }
        i++
    }
    if err=rows.Err();err!=nil{t.Fatal(err)}
    if i!=3{t.Fatalf("unexpected recovered rows: %d",i)}
    if err:=a.initJobs();err!=nil{t.Fatalf("second restart changed recovery: %v",err)}
    job,err:=a.enqueue(1)
    if err!=nil||job!=1{t.Fatalf("recovered primary not reused: id=%d err=%v",job,err)}
    _,err=a.db.Exec("INSERT INTO jobs(source_id,state) VALUES(1,'running')")
    if err==nil{t.Fatal("unique active-job constraint absent after migration")}
}

func TestWatchedSourcesDoNotConsumeIntervalOnFailedQueueInsert(t *testing.T){
    a:=fixture(t)
    if err:=a.initJobs();err!=nil{t.Fatal(err)}
    if err:=a.addSource("Main",t.TempDir());err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec("UPDATE sources SET watched=1,watch_minutes=15,last_watch=0 WHERE id=1");err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec(`CREATE TRIGGER deny_enqueue BEFORE INSERT ON jobs
      BEGIN SELECT RAISE(ABORT,'simulated unavailable sqlite');END`);err!=nil{t.Fatal(err)}
    when:=time.Date(2026,10,17,12,0,0,0,time.UTC).Unix()
    if err:=a.scheduleWatched(when);err==nil{t.Fatal("failed queue write unexpectedly scheduled")}
    var last int64
    if err:=a.db.QueryRow("SELECT last_watch FROM sources WHERE id=1").Scan(&last);err!=nil||last!=0{
        t.Fatalf("failed queue consumed scan interval: %d %v",last,err)
    }
    if _,err:=a.db.Exec("DROP TRIGGER deny_enqueue");err!=nil{t.Fatal(err)}
    if err:=a.scheduleWatched(when);err!=nil{t.Fatal(err)}
    if err:=a.db.QueryRow("SELECT last_watch FROM sources WHERE id=1").Scan(&last);err!=nil||last!=when{
        t.Fatalf("successful watch enqueue not recorded: %d %v",last,err)
    }
}

func TestRunningScanCannotBeCancelledUnsafely(t *testing.T){
    a:=fixture(t)
    if err:=a.initJobs();err!=nil{t.Fatal(err)}
    if err:=a.addSource("Main",t.TempDir());err!=nil{t.Fatal(err)}
    id,err:=a.enqueue(1);if err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec("UPDATE jobs SET state='running' WHERE id=?",id);err!=nil{t.Fatal(err)}
    res:=scanJobRequest(a,"POST","/api/jobs/"+strconv.FormatInt(id,10)+"/cancel","test-key",true)
    if res.Code!=409||!strings.Contains(res.Body.String(),"cannot be cancelled safely"){
        t.Fatalf("unsafe cancel allowed or wrongly messaged: %d %s",res.Code,res.Body.String())
    }
    var state string
    if err:=a.db.QueryRow("SELECT state FROM jobs WHERE id=?",id).Scan(&state);err!=nil||state!="running"{
        t.Fatalf("running job mutated: %s %v",state,err)
    }
}
