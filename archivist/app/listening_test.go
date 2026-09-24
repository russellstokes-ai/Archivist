package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestListeningProgressAndReaderHandoff(t *testing.T) {
	a := fixture(t)
	a.initCatalogue()
	a.initListening()
	a.db.Exec("INSERT INTO sources(id,space,path) VALUES(1,'Family','/test')")
	a.db.Exec("INSERT INTO assets(id,source_id,relative_path,title,format) VALUES(1,1,'a.mp3','A','Audio'),(2,1,'b.mp3','B','Audio')")
	call := func(method, path, body, token string) *httptest.ResponseRecorder {
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		r.Header.Set("Authorization", "Bearer "+token)
		r.Header.Set("X-Archivist-Action", "1")
		w := httptest.NewRecorder()
		a.routes().ServeHTTP(w, r)
		return w
	}
	if w := call("GET", "/api/assets/1/listening", "", "test-key"); w.Code != 200 || !strings.Contains(w.Body.String(), "listening-progress") {
		t.Fatal(w.Code, w.Body.String())
	}
	if w := call("PUT", "/api/assets/1/listening-progress", `{"asset":1,"seconds":20,"revision":5}`, "test-key"); w.Code != 409 {
		t.Fatal("initial revision accepted", w.Code)
	}
	if w := call("PUT", "/api/assets/1/listening-progress", `{"asset":1,"seconds":20,"revision":0}`, "test-key"); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w := call("PUT", "/api/assets/1/listening-progress", `{"asset":1,"seconds":10,"revision":0}`, "test-key"); w.Code != 409 {
		t.Fatal("stale write", w.Code)
	}
	if w := call("GET", "/api/assets/1/listening-progress", "", "bad"); w.Code != 401 {
		t.Fatal(w.Code)
	}
	a.db.Exec("INSERT INTO profiles(id,name,key_hash) VALUES(1,'Child',?)", keyHash("child"))
	token, _ := a.newSession("child")
	if w := call("GET", "/api/assets/1/listening", "", token); w.Code != 403 {
		t.Fatal("permission leak")
	}
	a.db.Exec("INSERT INTO grants VALUES(1,'Family')")
	if w := call("GET", "/api/assets/1/listening-progress", "", token); w.Code != 200 || strings.Contains(w.Body.String(), `"seconds":20`) {
		t.Fatal("profile isolation")
	}
	if _, err := a.group("AB", []int64{1, 2}); err != nil {
		t.Fatal(err)
	}
	if w := call("GET", "/api/assets/1/listening", "", token); w.Code != 200 || !strings.Contains(w.Body.String(), "/api/editions/") {
		t.Fatal("group context", w.Body.String())
	}
	w := call("GET", "/reader.html?asset=1", "", token)
	cookies := w.Result().Cookies()
	if len(cookies) != 1 || !cookies[0].HttpOnly {
		t.Fatal("reader cookie missing")
	}
	r := httptest.NewRequest("GET", "/api/me", nil)
	r.AddCookie(cookies[0])
	w = httptest.NewRecorder()
	a.routes().ServeHTTP(w, r)
	if w.Code != 200 {
		t.Fatal("subrequest auth")
	}
	if w := call("GET", "/reader.html?asset=1", "", "invalid"); len(w.Result().Cookies()) != 0 {
		t.Fatal("invalid bearer accepted")
	}
	a.db.Exec("UPDATE profiles SET revoked=1 WHERE id=1")
	r = httptest.NewRequest("GET", "/api/me", nil)
	r.AddCookie(&http.Cookie{Name: "archivist_session", Value: token})
	w = httptest.NewRecorder()
	a.routes().ServeHTTP(w, r)
	if w.Code != 401 {
		t.Fatal("revoked session accepted")
	}
}
