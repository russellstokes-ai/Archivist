package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestProfileActivityAggregatesAndIsProfileIsolated(t *testing.T){
	a:=fixture(t)
	if e:=a.initPreferences();e!=nil{t.Fatal(e)}
	if e:=a.initProgress();e!=nil{t.Fatal(e)}
	if e:=a.initListening();e!=nil{t.Fatal(e)}
	if e:=a.initReader();e!=nil{t.Fatal(e)}
	if e:=a.initCompletions();e!=nil{t.Fatal(e)}
	if e:=a.initActivity();e!=nil{t.Fatal(e)}
	if _,e:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Main','/tmp','Ready')");e!=nil{t.Fatal(e)}
	work:=addAtlasWork(t,a,1,"Main","Tracked","Author","","History","Audio")
	if e:=a.recordActivity(0,work,"Listening",120);e!=nil{t.Fatal(e)}
	if e:=a.recordActivity(0,work,"Listening",30);e!=nil{t.Fatal(e)}
	if e:=a.recordActivity(1,work,"Listening",999);e!=nil{t.Fatal(e)}
	var n int
	var seconds float64
	if e:=a.db.QueryRow("SELECT count(*),sum(active_seconds) FROM profile_activity WHERE profile_id=0 AND work_id=?",work).Scan(&n,&seconds);e!=nil{t.Fatal(e)}
	if n!=1 || seconds!=150 {t.Fatalf("activity aggregation n=%d seconds=%v",n,seconds)}
	req:=httptest.NewRequest("GET","/api/activity",nil)
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
	res:=httptest.NewRecorder()
	a.routes().ServeHTTP(res,req)
	if res.Code!=200{t.Fatalf("activity status=%d %s",res.Code,res.Body.String())}
	var items []profileActivity
	if e:=json.Unmarshal(res.Body.Bytes(),&items);e!=nil{t.Fatal(e)}
	if len(items)!=1 || items[0].WorkID!=work || items[0].ActiveSeconds!=150 {t.Fatalf("items=%+v",items)}
}

func TestActivityBucketIsStableForHalfHourWindow(t *testing.T){
	now:=time.Date(2026,10,1,18,44,59,0,time.UTC).Unix()
	got:=activityBucket(now)
	want:=time.Date(2026,10,1,18,30,0,0,time.UTC).Unix()
	if got!=want{t.Fatalf("bucket=%d want %d",got,want)}
}
