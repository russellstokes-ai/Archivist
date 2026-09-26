package main

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func makeReaderEPUB(t *testing.T) []byte {
	t.Helper()
	var b bytes.Buffer
	z := zip.NewWriter(&b)
	for name, content := range map[string]string{"META-INF/container.xml": `<container><rootfiles><rootfile full-path="OPS/book.opf"/></rootfiles></container>`, "OPS/book.opf": `<package><manifest><item id="b" href="b.xhtml" media-type="application/xhtml+xml"/><item id="a" href="a.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="a"/><itemref idref="b"/></spine></package>`, "OPS/a.xhtml": `<html><head><script>steal()</script></head><body><p>Hello <em>reader</em>.</p><iframe src="https://example.com">secret</iframe><p>Second paragraph.</p></body></html>`, "OPS/b.xhtml": `<html><body><p>End.</p></body></html>`} {
		w, e := z.Create(name)
		if e != nil {
			t.Fatal(e)
		}
		w.Write([]byte(content))
	}
	z.Close()
	return b.Bytes()
}
func TestReaderSpineAndSafeContent(t *testing.T) {
	b := makeReaderEPUB(t)
	z, e := zip.NewReader(bytes.NewReader(b), int64(len(b)))
	if e != nil {
		t.Fatal(e)
	}
	parts, e := readerParts(z, "Ebook")
	if e != nil || len(parts) != 2 || parts[0] != "OPS/a.xhtml" {
		t.Fatal(parts, e)
	}
	data, _ := zipEntry(z, parts[0], 4<<20)
	p, e := safeParagraphs(data)
	if e != nil || len(p) != 2 || p[0] != "Hello reader." {
		t.Fatal(p, e)
	}
	if strings.Contains(strings.Join(p, " "), "steal") || strings.Contains(strings.Join(p, " "), "secret") {
		t.Fatal("active content included")
	}
	if _, e = zipEntry(z, parts[0], 1); e == nil {
		t.Fatal("size bound ignored")
	}
}
func TestReaderPermissionsAndProgress(t *testing.T) {
	a := fixture(t)
	a.initReader()
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "book.epub"), makeReaderEPUB(t), 0600)
	a.addSource("Private", root)
	a.scan(1)
	a.db.Exec("INSERT INTO profiles(id,name,key_hash) VALUES(1,'Member',?)", keyHash("member"))
	token, _ := a.newSession("member")
	call := func(method, path, body, key string) *httptest.ResponseRecorder {
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		r.Header.Set("Authorization", "Bearer "+key)
		r.Header.Set("X-Archivist-Action", "1")
		w := httptest.NewRecorder()
		a.routes().ServeHTTP(w, r)
		return w
	}
	for _, path := range []string{"/api/assets/1/reader", "/api/assets/1/reader/0", "/api/assets/1/reading-progress"} {
		if w := call("GET", path, "", token); w.Code != 403 {
			t.Fatalf("leak %s %d", path, w.Code)
		}
	}
	a.db.Exec("INSERT INTO grants VALUES(1,'Private')")
	if w := call("GET", "/api/assets/1/reader/0", "", token); w.Code != 200 || !strings.Contains(w.Body.String(), "Hello reader") {
		t.Fatal(w.Code, w.Body.String())
	}
	w := call("PUT", "/api/assets/1/reading-progress", `{"part":1,"fraction":0.5,"revision":0}`, token)
	if w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	if w := call("PUT", "/api/assets/1/reading-progress", `{"part":0,"fraction":0,"revision":0}`, token); w.Code != 409 {
		t.Fatal("stale reading progress accepted")
	}
	var owner readingPosition
	w = call("GET", "/api/assets/1/reading-progress", "", "test-key")
	json.Unmarshal(w.Body.Bytes(), &owner)
	if owner.Revision != 0 {
		t.Fatal("profile position leaked")
	}
	r := httptest.NewRequest("POST", "/session", strings.NewReader(`{"token":"member"}`))
	r.Header.Set("X-Archivist-Action", "1")
	w = httptest.NewRecorder()
	a.routes().ServeHTTP(w, r)
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), "token") {
		t.Fatal("native login failed")
	}
}


func TestReaderWebInteractionAssets(t *testing.T) {
	js, err := web.ReadFile("web/reader.js")
	if err != nil {
		t.Fatal(err)
	}
	css, err := web.ReadFile("web/reader.css")
	if err != nil {
		t.Fatal(err)
	}
	script := string(js)
	style := string(css)
	for _, marker := range []string{
		"reader-page-sound",
		"pageSound()",
		"pinchStartDistance",
		"focusComicPage",
		"focusText",
		"turn-next",
		"turn-prev",
	} {
		if !strings.Contains(script, marker) {
			t.Fatalf("reader interaction missing %q", marker)
		}
	}
	for _, marker := range []string{
		".text-focused",
		"readerTurnNext",
		"readerTurnPrev",
		"prefers-reduced-motion",
	} {
		if !strings.Contains(style, marker) {
			t.Fatalf("reader polish CSS missing %q", marker)
		}
	}
}
