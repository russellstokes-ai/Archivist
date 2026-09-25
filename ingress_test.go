package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestIngressRoutingAndSession(t *testing.T) {
	a := fixture(t)
	h := a.routes()
	for _, base := range []string{"/", "/api/hassio_ingress/test-token/"} {
		request := func(method, path, body string, cookie *http.Cookie) *httptest.ResponseRecorder {
			r := httptest.NewRequest(method, path, strings.NewReader(body))
			r.RemoteAddr = "172.30.32.2:1234"
			if base != "/" {
				r.Header.Set("X-Ingress-Path", strings.TrimSuffix(base, "/"))
			}
			r.Header.Set("X-Archivist-Action", "1")
			if cookie != nil {
				r.AddCookie(cookie)
			}
			w := httptest.NewRecorder()
			h.ServeHTTP(w, r)
			return w
		}
		for _, entry := range []string{"/", "/index.html", "/reader.html?asset=1"} {
			w := request("GET", entry, "", nil)
			if w.Code != 200 || !strings.Contains(w.Body.String(), `<base href="`+base+`">`) {
				t.Fatalf("entry %s: %d %s", entry, w.Code, w.Body.String())
			}
			ancestor := "frame-ancestors 'none'"
			if base != "/" {
				ancestor = "frame-ancestors 'self'"
			}
			if !strings.Contains(w.Header().Get("Content-Security-Policy"), ancestor) {
				t.Fatal("frame policy")
			}
		}
		w := request("POST", "/unlock", `{"token":"test-key"}`, nil)
		cookies := w.Result().Cookies()
		if w.Code != 200 || len(cookies) != 1 || cookies[0].Path != base || !cookies[0].HttpOnly {
			t.Fatalf("cookie: %d %v", w.Code, cookies)
		}
		cookie := cookies[0]
		if w := request("GET", "/api/me", "", cookie); w.Code != 200 {
			t.Fatalf("login %d", w.Code)
		}
		if w := request("GET", "/api/me", "", nil); w.Code != 401 {
			t.Fatal("auth bypass")
		}
		w = request("POST", "/logout", "", cookie)
		if w.Result().Cookies()[0].Path != base {
			t.Fatal("logout scope")
		}
		if w := request("GET", "/api/me", "", cookie); w.Code != 401 {
			t.Fatal("logout failed")
		}
		for _, asset := range []string{"/app.js", "/reader.js", "/style.css", "/assets/archivist-app-icon.png", "/vendor/pdf.mjs", "/vendor/pdf.worker.mjs"} {
			if w := request("GET", asset, "", nil); w.Code != 200 {
				t.Fatalf("asset %s: %d", asset, w.Code)
			}
		}
	}
}

func TestIngressRejectsSpoofing(t *testing.T) {
	for _, tc := range []struct{ peer, prefix string }{
		{"192.168.1.10:12", "/api/hassio_ingress/token"},
		{"172.30.32.2:12", "//evil.example"},
		{"172.30.32.2:12", "/api/hassio_ingress/../evil"},
		{"172.30.32.2:12", `/api/hassio_ingress/"injection`},
	} {
		r := httptest.NewRequest("GET", "/", nil)
		r.RemoteAddr = tc.peer
		r.Header.Set("X-Ingress-Path", tc.prefix)
		r.Header.Set("X-Forwarded-For", "172.30.32.2")
		if _, err := ingressBase(r); err == nil {
			t.Fatalf("accepted %+v", tc)
		}
	}
}

func TestHealthDatabaseFailure(t *testing.T) {
	a := fixture(t)
	h := a.routes()
	w := httptest.NewRecorder()
	h.ServeHTTP(w, httptest.NewRequest("GET", "/healthz", nil))
	if w.Code != 200 {
		t.Fatal(w.Code)
	}
	a.db.Close()
	w = httptest.NewRecorder()
	h.ServeHTTP(w, httptest.NewRequest("GET", "/healthz", nil))
	if w.Code != 503 {
		t.Fatal(w.Code)
	}
}
