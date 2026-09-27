package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestPersonalPreferencesAreIsolatedAndUserWritable(t *testing.T) {
	a:=fixture(t)
	initAllProgressForTest(t,a)
	if _,err:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Main','/tmp','Ready')");err!=nil{t.Fatal(err)}
	work,edition,asset:=addProfileStatsWork(t,a,1,"Main","Dune","Audio","Dune",true)

	for _,row:=range []struct{id int;name,key string}{{1,"Alice","alice-key"},{2,"Bob","bob-key"}} {
		if _,err:=a.db.Exec("INSERT INTO profiles(id,name,key_hash,revoked) VALUES(?,?,?,0)",row.id,row.name,keyHash(row.key));err!=nil{t.Fatal(err)}
	}
	if err:=a.initHousehold();err!=nil{t.Fatal(err)}
	aliceSession,err:=a.newSession("alice-key");if err!=nil{t.Fatal(err)}
	bobSession,err:=a.newSession("bob-key");if err!=nil{t.Fatal(err)}

	call:=func(session,method,path,body string)*httptest.ResponseRecorder{
		req:=httptest.NewRequest(method,path,strings.NewReader(body))
		req.AddCookie(&http.Cookie{Name:"archivist_session",Value:session})
		if method!="GET"{req.Header.Set("X-Archivist-Action","1")}
		res:=httptest.NewRecorder();a.routes().ServeHTTP(res,req);return res
	}

	res:=call(aliceSession,"PUT","/api/works/"+itoa(work)+"/preference",`{"rating":9,"favourite":true}`)
	if res.Code!=200{t.Fatalf("Alice preference=%d %s",res.Code,res.Body.String())}
	res=call(bobSession,"PUT","/api/works/"+itoa(work)+"/preference",`{"rating":6,"favourite":false}`)
	if res.Code!=200{t.Fatalf("Bob preference=%d %s",res.Code,res.Body.String())}
	res=call("test-key","PUT","/api/works/"+itoa(work)+"/preference",`{"rating":10,"favourite":true}`)
	if res.Code!=200{t.Fatalf("Admin preference=%d %s",res.Code,res.Body.String())}

	if _,err=a.db.Exec("INSERT INTO profile_progress(profile_id,edition_id,asset_id,seconds,revision,complete) VALUES(1,?,?,55,1,0)",edition,asset);err!=nil{t.Fatal(err)}

	check:=func(session string)workPreference{
		res:=call(session,"GET","/api/preferences","")
		if res.Code!=200{t.Fatalf("preferences=%d %s",res.Code,res.Body.String())}
		var items []workPreference
		if err:=json.Unmarshal(res.Body.Bytes(),&items);err!=nil{t.Fatal(err)}
		if len(items)!=1{t.Fatalf("preferences=%+v",items)}
		return items[0]
	}
	alice:=check(aliceSession)
	if alice.Rating!=9 || !alice.Favourite || alice.State!="in-progress"{t.Fatalf("Alice=%+v",alice)}
	for _,path:=range []string{
		"/api/works?favourite=1",
		"/api/works?rating=9",
		"/api/works?reading=in-progress",
	} {
		filtered:=call(aliceSession,"GET",path,"")
		if filtered.Code!=200 || !strings.Contains(filtered.Body.String(),"Dune"){
			t.Fatalf("personal work filter %s=%d %s",path,filtered.Code,filtered.Body.String())
		}
	}
	bob:=check(bobSession)
	if bob.Rating!=6 || bob.Favourite || bob.State!="not-started"{t.Fatalf("Bob=%+v",bob)}
	admin:=check("test-key")
	if admin.Rating!=10 || !admin.Favourite || admin.State!="not-started"{t.Fatalf("Admin=%+v",admin)}

	res=call(aliceSession,"PUT","/api/works/"+itoa(work)+"/preference",`{"rating":11,"favourite":false}`)
	if res.Code!=400{t.Fatalf("invalid rating accepted=%d %s",res.Code,res.Body.String())}
	res=call(aliceSession,"GET","/api/profiles","")
	if res.Code!=403{t.Fatalf("User reached admin profiles=%d %s",res.Code,res.Body.String())}

	res=call(aliceSession,"PUT","/api/works/"+itoa(work)+"/preference",`{"rating":0,"favourite":false}`)
	if res.Code!=200{t.Fatalf("clear preference=%d %s",res.Code,res.Body.String())}
	alice=check(aliceSession)
	if alice.Rating!=0 || alice.Favourite || alice.State!="in-progress"{t.Fatalf("cleared Alice=%+v",alice)}
}
