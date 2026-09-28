package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestHouseholdPermissionsAndProgress(t *testing.T) {
	a := fixture(t)
	a.initCatalogue()
	initAllProgressForTest(t,a)
	a.initJobs()
	for _, space := range []string{"Adult", "Family"} {
		root := t.TempDir()
		os.WriteFile(filepath.Join(root, space+".mp3"), []byte("audio"), 0600)
		if err:=a.addSource(space, root);err!=nil{t.Fatal(err)}
	}
	if err:=a.scan(1);err!=nil{t.Fatal(err)}
	if err:=a.scan(2);err!=nil{t.Fatal(err)}
	if _,err:=a.group("Adult", []int64{1});err!=nil{t.Fatal(err)}
	if _,err:=a.group("Family", []int64{2});err!=nil{t.Fatal(err)}

	adminReq:=httptest.NewRequest("POST","/api/profiles",strings.NewReader(`{"name":"Child"}`))
	adminReq.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
	adminReq.Header.Set("X-Archivist-Action","1")
	adminRes:=httptest.NewRecorder()
	a.routes().ServeHTTP(adminRes,adminReq)
	if adminRes.Code!=200{t.Fatalf("create user=%d %s",adminRes.Code,adminRes.Body.String())}
	var created struct{ID int64 `json:"id"`;Key string `json:"key"`;Role string `json:"role"`}
	if err:=json.Unmarshal(adminRes.Body.Bytes(),&created);err!=nil{t.Fatal(err)}
	if created.ID==0 || created.Key=="" || created.Role!="user"{t.Fatalf("created=%+v",created)}
	memberSession,err:=a.newSession(created.Key)
	if err!=nil{t.Fatal(err)}

	call := func(method, path, body string) *httptest.ResponseRecorder {
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		r.AddCookie(&http.Cookie{Name: "archivist_session", Value: memberSession})
		r.Header.Set("X-Archivist-Action", "1")
		w := httptest.NewRecorder()
		a.routes().ServeHTTP(w, r)
		return w
	}
	for _, path := range []string{"/api/books", "/api/works", "/api/sources"} {
		w := call("GET", path, "")
		if w.Code != 200 || !strings.Contains(w.Body.String(), "Adult") || !strings.Contains(w.Body.String(), "Family") {
			t.Fatalf("whole-library User access %s: %d %s", path, w.Code, w.Body.String())
		}
	}
	wSources:=call("GET","/api/sources","")
	var memberSources []struct{Path string `json:"path"`; Status string `json:"status"`}
	if err:=json.Unmarshal(wSources.Body.Bytes(),&memberSources);err!=nil{t.Fatal(err)}
	for _,source:=range memberSources {
		if source.Path!="" || source.Status!="" { t.Fatalf("User source metadata leaked path/status: %+v",source) }
	}
	for _, path := range []string{"/api/assets/1", "/api/assets/2", "/api/assets/1/cover", "/api/works/1/tracks", "/api/works/2/tracks"} {
		if w := call("GET", path, ""); w.Code == 403 || w.Code == 401 {
			t.Fatalf("User media blocked %s: %d %s", path, w.Code, w.Body.String())
		}
	}
	for _, path := range []string{"/api/folders", "/api/profiles", "/api/jobs"} {
		if w := call("GET", path, ""); w.Code != 403 {
			t.Fatalf("User reached admin route %s: %d %s", path, w.Code, w.Body.String())
		}
	}
	if w := call("DELETE", "/api/sources/2", ""); w.Code != 403 {
		t.Fatalf("User deleted source: %d %s",w.Code,w.Body.String())
	}
	if w := call("POST", "/api/sources/2/scan", ""); w.Code != 403 {
		t.Fatalf("User scanned source: %d %s",w.Code,w.Body.String())
	}

	a.saveProgress(2, progress{Asset: 2, Seconds: 80})
	if w := call("GET", "/api/editions/2/progress", ""); strings.Contains(w.Body.String(), "80") {
		t.Fatal("Admin progress leaked into User progress")
	}
	w := call("PUT", "/api/editions/2/progress", `{"asset":2,"seconds":20,"revision":0}`)
	if w.Code != 200 { t.Fatalf("User progress save=%d %s",w.Code,w.Body.String()) }
	p,_:=a.readProgress(2)
	if p.Seconds!=80{t.Fatal("User progress overwrote Admin progress")}
	var member progress
	json.Unmarshal(w.Body.Bytes(),&member)
	if member.Seconds!=20{t.Fatal("User progress not isolated")}

	a.db.Exec("UPDATE profiles SET revoked=1 WHERE id=?",created.ID)
	if w:=call("GET","/api/assets/2","");w.Code!=401{t.Fatalf("revoked User accepted: %d",w.Code)}
}

func TestLegacyProgressMigration(t *testing.T) {
	a := fixture(t)
	a.initCatalogue()
	a.initProgress()
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "One.mp3"), []byte("x"), 0600)
	a.addSource("Main", root)
	a.scan(1)
	a.group("One", []int64{1})
	a.db.Exec("INSERT INTO progress VALUES(1,1,42,1,0)")
	if e := a.initProgress(); e != nil {
		t.Fatal(e)
	}
	p, _ := a.readProgress(1)
	if p.Seconds != 42 {
		t.Fatal("legacy owner progress missing")
	}
	a.saveProgress(1, progress{Asset: 1, Seconds: 50, Revision: 1})
	a.initProgress()
	p, _ = a.readProgress(1)
	if p.Seconds != 50 {
		t.Fatal("migration overwrote newer progress")
	}
}
