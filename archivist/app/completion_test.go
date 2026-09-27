package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
)

func initAllProgressForTest(t *testing.T, a *app) {
	t.Helper()
	if err:=a.initPreferences();err!=nil{t.Fatal(err)}
	if err:=a.initProgress();err!=nil{t.Fatal(err)}
	if err:=a.initListening();err!=nil{t.Fatal(err)}
	if err:=a.initReader();err!=nil{t.Fatal(err)}
	if err:=a.initCompletions();err!=nil{t.Fatal(err)}
}

func TestLegacyProgressSchemasMigrateBeforeCompletionHistory(t *testing.T) {
	dbPath:=filepath.Join(t.TempDir(),"legacy-progress.db")
	db,err:=openDB(dbPath)
	if err!=nil{t.Fatal(err)}
	a:=&app{db:db}
	if err=a.initHousehold();err!=nil{t.Fatal(err)}
	if err=a.initCatalogue();err!=nil{t.Fatal(err)}
	if _,err=db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Main','/tmp','Ready')");err!=nil{t.Fatal(err)}
	res,err:=db.Exec("INSERT INTO assets(id,source_id,relative_path,title,author,series,format,available,metadata_source,metadata_confidence,needs_review) VALUES(1,1,'A.mp3','A','','','Audio',1,'manual',100,0)")
	if err!=nil{t.Fatal(err)}
	_ = res
	res,err=db.Exec("INSERT INTO works(id,title,space,author,series,auto,group_key) VALUES(1,'A','Main','','',1,'legacy')")
	if err!=nil{t.Fatal(err)}
	res,err=db.Exec("INSERT INTO editions(id,work_id,format) VALUES(1,1,'Audio')")
	if err!=nil{t.Fatal(err)}
	if _,err=db.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(1,1,0)");err!=nil{t.Fatal(err)}

	if _,err=db.Exec("CREATE TABLE progress(edition_id INTEGER PRIMARY KEY,asset_id INTEGER NOT NULL,seconds REAL NOT NULL,revision INTEGER NOT NULL); INSERT INTO progress VALUES(1,1,42,3)");err!=nil{t.Fatal(err)}
	if _,err=db.Exec("CREATE TABLE asset_progress(profile_id INTEGER NOT NULL,asset_id INTEGER NOT NULL,seconds REAL NOT NULL,revision INTEGER NOT NULL,PRIMARY KEY(profile_id,asset_id)); INSERT INTO asset_progress VALUES(0,1,19,2)");err!=nil{t.Fatal(err)}
	if _,err=db.Exec("CREATE TABLE reading_progress(profile_id INTEGER NOT NULL,asset_id INTEGER NOT NULL,part INTEGER NOT NULL,fraction REAL NOT NULL,revision INTEGER NOT NULL,PRIMARY KEY(profile_id,asset_id)); INSERT INTO reading_progress VALUES(0,1,2,.5,4)");err!=nil{t.Fatal(err)}

	initAllProgressForTest(t,a)

	var seconds float64
	var revision int
	var complete bool
	if err=db.QueryRow("SELECT seconds,revision,complete FROM profile_progress WHERE profile_id=0 AND edition_id=1").Scan(&seconds,&revision,&complete);err!=nil{t.Fatal(err)}
	if seconds!=42 || revision!=3 || complete{t.Fatalf("legacy edition progress seconds=%v revision=%d complete=%v",seconds,revision,complete)}
	if err=db.QueryRow("SELECT seconds,revision,complete FROM asset_progress WHERE profile_id=0 AND asset_id=1").Scan(&seconds,&revision,&complete);err!=nil{t.Fatal(err)}
	if seconds!=19 || revision!=2 || complete{t.Fatalf("legacy asset progress seconds=%v revision=%d complete=%v",seconds,revision,complete)}
	var part int
	var fraction float64
	if err=db.QueryRow("SELECT part,fraction,revision,complete FROM reading_progress WHERE profile_id=0 AND asset_id=1").Scan(&part,&fraction,&revision,&complete);err!=nil{t.Fatal(err)}
	if part!=2 || fraction!=.5 || revision!=4 || complete{t.Fatalf("legacy reading progress part=%d fraction=%v revision=%d complete=%v",part,fraction,revision,complete)}
	db.Close()
}

func TestCompletionHistorySurvivesReplayAndReread(t *testing.T) {
	a:=fixture(t)
	initAllProgressForTest(t,a)
	root:=t.TempDir()
	if _,err:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Main',?,'Ready')",root);err!=nil{t.Fatal(err)}
	_,audioEdition,audioAsset:=addProfileStatsWork(t,a,1,"Main","Audio","Audio","Series",true)
	_,_,readingAsset:=addProfileStatsWork(t,a,1,"Main","Book","Ebook","Series",true)

	audio,err:=a.saveProfileProgress(0,audioEdition,progress{Asset:audioAsset,Seconds:120,Revision:0,Complete:true})
	if err!=nil{t.Fatal(err)}
	if !audio.Complete{t.Fatal("audio finish not saved")}
	var completions int
	if err=a.db.QueryRow("SELECT count(*) FROM profile_completions WHERE profile_id=0 AND kind='Audio'").Scan(&completions);err!=nil{t.Fatal(err)}
	if completions!=1{t.Fatalf("audio completion history=%d",completions)}

	audio,err=a.saveProfileProgress(0,audioEdition,progress{Asset:audioAsset,Seconds:8,Revision:audio.Revision,Complete:false})
	if err!=nil{t.Fatal(err)}
	if audio.Complete{t.Fatal("replay current state stayed complete")}
	if err=a.db.QueryRow("SELECT count(*) FROM profile_completions WHERE profile_id=0 AND kind='Audio'").Scan(&completions);err!=nil{t.Fatal(err)}
	if completions!=1{t.Fatalf("audio history lost after replay=%d",completions)}

	handler:=a.routes()
	req:=httptest.NewRequest("PUT", "/api/assets/"+itoa(readingAsset)+"/reading-progress", strings.NewReader(`{"part":9,"fraction":1,"revision":0,"complete":true}`))
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
	req.Header.Set("X-Archivist-Action","1")
	res:=httptest.NewRecorder()
	handler.ServeHTTP(res,req)
	if res.Code!=200{t.Fatalf("finish read=%d %s",res.Code,res.Body.String())}
	var finished readingPosition
	if err=json.Unmarshal(res.Body.Bytes(),&finished);err!=nil{t.Fatal(err)}

	req=httptest.NewRequest("PUT", "/api/assets/"+itoa(readingAsset)+"/reading-progress", strings.NewReader(`{"part":2,"fraction":0.3,"revision":`+itoa(finished.Revision)+`,"complete":false}`))
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
	req.Header.Set("X-Archivist-Action","1")
	res=httptest.NewRecorder()
	handler.ServeHTTP(res,req)
	if res.Code!=200{t.Fatalf("reread=%d %s",res.Code,res.Body.String())}
	var current readingPosition
	if err=json.Unmarshal(res.Body.Bytes(),&current);err!=nil{t.Fatal(err)}
	if current.Complete{t.Fatal("reread current state stayed complete")}
	if err=a.db.QueryRow("SELECT count(*) FROM profile_completions WHERE profile_id=0 AND kind='Reading'").Scan(&completions);err!=nil{t.Fatal(err)}
	if completions!=1{t.Fatalf("reading history lost after reread=%d",completions)}

	stats,err:=a.profileStatsFor(identity{ID:0,Name:"Owner",Owner:true})
	if err!=nil{t.Fatal(err)}
	if stats.CompletedAudio!=1 || stats.InProgressAudio!=1 || stats.CompletedReading!=1 || stats.InProgressReading!=1 || stats.Completed!=2 || stats.InProgress!=2 {
		t.Fatalf("lifetime/current stats=%+v",stats)
	}
}

func TestCompletionHistoryBackfillsExistingFinishedProgress(t *testing.T) {
	a:=fixture(t)
	if err:=a.initProgress();err!=nil{t.Fatal(err)}
	if err:=a.initListening();err!=nil{t.Fatal(err)}
	if err:=a.initReader();err!=nil{t.Fatal(err)}
	root:=t.TempDir()
	if _,err:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Main',?,'Ready')",root);err!=nil{t.Fatal(err)}
	_,edition,asset:=addProfileStatsWork(t,a,1,"Main","Finished","Audio","",true)
	if _,err:=a.db.Exec("INSERT INTO profile_progress(profile_id,edition_id,asset_id,seconds,revision,complete) VALUES(0,?,?,?,?,1)",edition,asset,50,1);err!=nil{t.Fatal(err)}
	if err:=a.initCompletions();err!=nil{t.Fatal(err)}
	var n int
	if err:=a.db.QueryRow("SELECT count(*) FROM profile_completions WHERE profile_id=0 AND work_id=1 AND kind='Audio'").Scan(&n);err!=nil{t.Fatal(err)}
	if n!=1{t.Fatalf("completion backfill=%d",n)}
}

func itoa[T ~int | ~int64](value T) string {
	return fmt.Sprint(value)
}
