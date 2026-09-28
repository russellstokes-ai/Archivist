package main

import (
	"archive/tar"
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
	for name, content := range map[string]string{"META-INF/container.xml": `<container><rootfiles><rootfile full-path="OPS/book.opf"/></rootfiles></container>`, "OPS/book.opf": `<package><manifest><item id="b" href="b.xhtml" media-type="application/xhtml+xml"/><item id="a" href="a.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="a"/><itemref idref="b"/></spine></package>`, "OPS/a.xhtml": `<html><head><script>steal()</script></head><body><p>Hello <em>reader</em>.</p><img src="images/a.png"><iframe src="https://example.com">secret</iframe><p>Second paragraph.</p></body></html>`, "OPS/b.xhtml": `<html><body><p>End.</p></body></html>`, "OPS/images/a.png": string([]byte{0x89,'P','N','G',0x0d,0x0a,0x1a,0x0a,0,0,0,0})} {
		w, e := z.Create(name)
		if e != nil {
			t.Fatal(e)
		}
		w.Write([]byte(content))
	}
	z.Close()
	return b.Bytes()
}
func TestComicArchiveSupportContract(t *testing.T) {
	if got:=kind("issue.cbz");got!="Comic"{t.Fatalf("CBZ kind=%q",got)}
	if got:=kind("issue.cbt");got!="Comic"{t.Fatalf("CBT kind=%q",got)}
	if got:=kind("issue.cbr");got!=""{t.Fatalf("CBR must remain unsupported, kind=%q",got)}

	var b bytes.Buffer
	tw:=tar.NewWriter(&b)
	for _,name:=range []string{"010.jpg","002.jpg","001.jpg"} {
		data:=[]byte{0xff,0xd8,0xff,0xd9}
		if err:=tw.WriteHeader(&tar.Header{Name:name,Mode:0600,Size:int64(len(data))});err!=nil{t.Fatal(err)}
		if _,err:=tw.Write(data);err!=nil{t.Fatal(err)}
	}
	if err:=tw.Close();err!=nil{t.Fatal(err)}
	p:=filepath.Join(t.TempDir(),"issue.cbt")
	if err:=os.WriteFile(p,b.Bytes(),0600);err!=nil{t.Fatal(err)}
	file,err:=os.Open(p);if err!=nil{t.Fatal(err)}
	defer file.Close()
	parts,err:=tarComicParts(file)
	if err!=nil{t.Fatal(err)}
	if len(parts)!=3 || parts[0]!="001.jpg" || parts[1]!="002.jpg" || parts[2]!="010.jpg"{
		t.Fatalf("CBT natural order=%v",parts)
	}
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
	markup, e := epubMarkup(data, parts[0], "1")
	if e != nil || !strings.Contains(markup, "<em>reader</em>") || !strings.Contains(markup, "./api/assets/1/resources?name=OPS%2Fimages%2Fa.png") {
		t.Fatal(markup, e)
	}
	if strings.Contains(markup, "steal") || strings.Contains(markup, "example.com") {
		t.Fatal("active or remote content included")
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
	for _, path := range []string{"/api/assets/1/reader", "/api/assets/1/reader/0", "/api/assets/1/resources?name=OPS%2Fimages%2Fa.png", "/api/assets/1/reading-progress"} {
		if w := call("GET", path, "", token); w.Code != 403 {
			t.Fatalf("leak %s %d", path, w.Code)
		}
	}
	a.db.Exec("INSERT INTO grants VALUES(1,'Private')")
	if w := call("GET", "/api/assets/1/reader/0", "", token); w.Code != 200 || !strings.Contains(w.Body.String(), `"html"`) || !strings.Contains(w.Body.String(), "Hello") {
		t.Fatal(w.Code, w.Body.String())
	}
	if w := call("GET", "/api/assets/1/resources?name=OPS%2Fimages%2Fa.png", "", token); w.Code != 200 || w.Header().Get("Content-Type") != "image/png" {
		t.Fatalf("member EPUB image=%d type=%q body=%q",w.Code,w.Header().Get("Content-Type"),w.Body.String())
	}
	w := call("PUT", "/api/assets/1/reading-progress", `{"part":1,"fraction":1,"revision":0,"complete":true}`, token)
	if w.Code != 200 || !strings.Contains(w.Body.String(), `"complete":true`) {
		t.Fatal(w.Body.String())
	}
	if w := call("PUT", "/api/assets/1/reading-progress", `{"part":0,"fraction":0,"revision":0}`, token); w.Code != 409 {
		t.Fatal("stale reading progress accepted")
	}
	w = call("PUT", "/api/assets/1/reading-progress", `{"part":0,"fraction":0,"revision":1,"complete":false}`, token)
	if w.Code != 200 || !strings.Contains(w.Body.String(), `"complete":false`) {
		t.Fatalf("reread current state did not reset: %d %s",w.Code,w.Body.String())
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
		"archivist-reader-sound",
		"pageSound()",
		"pinchStartDistance",
		"focusComicPage",
		"focusText",
		"turn-next",
		"turn-prev",
		"complete",
		"archivist-reader-ready",
		"PageDown",
		"Bubble not isolated; page zoomed instead.",
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
		".reader-help",
		"focus-visible",
	} {
		if !strings.Contains(style, marker) {
			t.Fatalf("reader polish CSS missing %q", marker)
		}
	}
}


func TestReaderCompletionMigration(t *testing.T) {
	a:=fixture(t)
	if _,e:=a.db.Exec(`CREATE TABLE reading_progress(
		profile_id INTEGER NOT NULL,
		asset_id INTEGER NOT NULL,
		part INTEGER NOT NULL,
		fraction REAL NOT NULL,
		revision INTEGER NOT NULL,
		PRIMARY KEY(profile_id,asset_id)
	)`);e!=nil{t.Fatal(e)}
	if e:=a.initReader();e!=nil{t.Fatal(e)}
	rows,e:=a.db.Query("PRAGMA table_info(reading_progress)")
	if e!=nil{t.Fatal(e)}
	defer rows.Close()
	found:=false
	for rows.Next(){
		var cid,notnull,pk int
		var name,typ string
		var defaultValue any
		if e=rows.Scan(&cid,&name,&typ,&notnull,&defaultValue,&pk);e!=nil{t.Fatal(e)}
		if name=="complete"{found=true}
	}
	if !found{t.Fatal("legacy reading_progress table was not migrated")}
}
