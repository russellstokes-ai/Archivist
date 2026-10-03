package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func fixture(t *testing.T) *app {
	t.Helper()
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")
	db, e := openDB(dbPath)
	if e != nil {
		t.Fatal(e)
	}
	t.Cleanup(func() { db.Close() })
	a := &app{db: db, dbPath: dbPath, token: "test-key"}
	if e := a.initHousehold(); e != nil {
		t.Fatal(e)
	}
	if e := a.initCatalogue(); e != nil {
		t.Fatal(e)
	}
	a.initSessions()
	a.db.Exec("INSERT INTO sessions(token_hash,profile_id,credential_hash,expires,created) VALUES(?,0,?,9999999999,0)", keyHash("test-key"), keyHash("test-key"))
	return a
}
func TestSourcesAndRescan(t *testing.T) {
	a := fixture(t)
	one, two := t.TempDir(), t.TempDir()
	os.WriteFile(filepath.Join(one, "A.mp3"), []byte("audio"), 0600)
	os.WriteFile(filepath.Join(two, "B.epub"), []byte("book"), 0600)
	if e := a.addSource("Combined", one); e != nil {
		t.Fatal(e)
	}
	if e := a.addSource("Combined", two); e != nil {
		t.Fatal(e)
	}
	if e := a.addSource("Other", one); e == nil {
		t.Fatal("overlap accepted")
	}
	for _, id := range []int64{1, 2, 1} {
		if e := a.scan(id); e != nil {
			t.Fatal(e)
		}
	}
	var n int
	a.db.QueryRow("SELECT count(*) FROM assets").Scan(&n)
	if n != 2 {
		t.Fatalf("duplicates: %d", n)
	}
	os.Remove(filepath.Join(one, "A.mp3"))
	a.scan(1)
	a.db.QueryRow("SELECT available FROM assets WHERE source_id=1").Scan(&n)
	if n != 0 {
		t.Fatal("missing asset still available")
	}
	a.db.Exec("DELETE FROM sources WHERE id=2")
	if _, e := os.Stat(filepath.Join(two, "B.epub")); e != nil {
		t.Fatal("original removed")
	}
}
func TestDisconnectedSourceRetainsCatalogue(t *testing.T) {
	a := fixture(t)
	root := filepath.Join(t.TempDir(), "mount")
	os.Mkdir(root, 0700)
	os.WriteFile(filepath.Join(root, "Book.pdf"), []byte("pdf"), 0600)
	a.addSource("Space", root)
	a.scan(1)
	os.Rename(root, root+"-offline")
	if a.scan(1) == nil {
		t.Fatal("missing source accepted")
	}
	var n int
	a.db.QueryRow("SELECT count(*) FROM assets").Scan(&n)
	if n != 1 {
		t.Fatal("catalogue lost")
	}
}
func TestStreamAuthRangesAndSymlinkEscape(t *testing.T) {
	a := fixture(t)
	root := t.TempDir()
	p := filepath.Join(root, "Book.mp3")
	os.WriteFile(p, []byte("0123456789"), 0600)
	a.addSource("Space", root)
	a.scan(1)
	handler := a.routes()
	req := httptest.NewRequest("GET", "/api/assets/1", nil)
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	if res.Code != 401 {
		t.Fatal("unauthenticated stream")
	}
	req.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
	req.Header.Set("Range", "bytes=2-5")
	res = httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	if res.Code != 206 || res.Body.String() != "2345" {
		t.Fatalf("range: %d %q", res.Code, res.Body.String())
	}
	outside := filepath.Join(t.TempDir(), "secret.mp3")
	os.WriteFile(outside, []byte("secret"), 0600)
	os.Remove(p)
	if e := os.Symlink(outside, p); e != nil {
		t.Skip(e)
	}
	res = httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	if res.Code != 404 {
		t.Fatal("symlink escape")
	}
}
func TestCSRFAndPersistence(t *testing.T) {
	a := fixture(t)
	r := httptest.NewRequest("POST", "/api/sources", strings.NewReader(`{}`))
	r.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
	w := httptest.NewRecorder()
	a.routes().ServeHTTP(w, r)
	if w.Code != 403 {
		t.Fatal("missing request marker accepted")
	}
	dir := t.TempDir()
	dbpath := filepath.Join(dir, "persistent.db")
	db, e := openDB(dbpath)
	if e != nil {
		t.Fatal(e)
	}
	b := &app{db: db}
	if e = b.initHousehold(); e != nil { t.Fatal(e) }
	if e = b.addSource("Separate", t.TempDir()); e != nil {
		t.Fatal(e)
	}
	db.Close()
	db, e = openDB(dbpath)
	if e != nil {
		t.Fatal(e)
	}
	defer db.Close()
	var name string
	db.QueryRow("SELECT space FROM sources").Scan(&name)
	if name != "Separate" {
		t.Fatal("source not persistent")
	}
	req := httptest.NewRequest("GET", "/", nil)
	res := httptest.NewRecorder()
	a.routes().ServeHTTP(res, req)
	body, _ := io.ReadAll(res.Result().Body)
	if res.Code != 200 || !strings.Contains(string(body), "<title>Archivist</title>") || !strings.Contains(string(body), `src="./app.js"`) {
		t.Fatal("UI not embedded")
	}
	req = httptest.NewRequest("GET", "/healthz", nil)
	res = httptest.NewRecorder()
	a.routes().ServeHTTP(res, req)
	if res.Code != 200 || !strings.Contains(res.Body.String(), `"ok":true`) {
		t.Fatalf("health endpoint: %d %q", res.Code, res.Body.String())
	}
}


func TestScanReviewFilterAndIncrementalMetadataRefresh(t *testing.T) {
	a := fixture(t)
	root := t.TempDir()
	book := filepath.Join(root, "Mystery.epub")
	if e := os.WriteFile(book, []byte("not-real-epub"), 0600); e != nil {
		t.Fatal(e)
	}
	if e := a.addSource("Main", root); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}

	var source string
	var confidence int
	var review bool
	var signature string
	if e := a.db.QueryRow("SELECT metadata_source,metadata_confidence,needs_review,scan_signature FROM assets WHERE id=1").Scan(&source,&confidence,&review,&signature); e != nil {
		t.Fatal(e)
	}
	if source != "path" || confidence >= 60 || !review || signature == "" {
		t.Fatalf("initial identification source=%q confidence=%d review=%v signature=%q", source, confidence, review, signature)
	}

	handler := a.routes()
	req := httptest.NewRequest("GET", "/api/books?q=&space=&review=1", nil)
	req.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	if res.Code != 200 || !strings.Contains(res.Body.String(), `"needsReview":true`) {
		t.Fatalf("review queue: %d %s", res.Code, res.Body.String())
	}

	sidecar := filepath.Join(root, "Mystery.opf")
	_jsii := `<?xml version="1.0"?><package><metadata>
		<title>The Dispossessed</title><creator>Ursula K. Le Guin</creator>
		<meta name="calibre:series" content="Hainish Cycle"/>
	</metadata></package>`
	if e := os.WriteFile(sidecar, []byte(_jsii), 0600); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}

	var title, author, series, nextSource, nextSignature string
	var nextConfidence int
	var nextReview bool
	if e := a.db.QueryRow("SELECT title,author,series,metadata_source,metadata_confidence,needs_review,scan_signature FROM assets WHERE id=1").Scan(&title,&author,&series,&nextSource,&nextConfidence,&nextReview,&nextSignature); e != nil {
		t.Fatal(e)
	}
	if title != "The Dispossessed" || author != "Ursula K. Le Guin" || series != "Hainish Cycle" {
		t.Fatalf("sidecar refresh title=%q author=%q series=%q", title, author, series)
	}
	if !strings.Contains(nextSource, "sidecar") || nextConfidence < 90 || nextReview || nextSignature == signature {
		t.Fatalf("refreshed source=%q confidence=%d review=%v signatureChanged=%v", nextSource, nextConfidence, nextReview, nextSignature != signature)
	}

	req = httptest.NewRequest("GET", "/api/books?q=&space=&review=1", nil)
	req.AddCookie(&http.Cookie{Name: "archivist_session", Value: "test-key"})
	res = httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	if res.Code != 200 || strings.Contains(res.Body.String(), "The Dispossessed") {
		t.Fatalf("resolved item still in review queue: %d %s", res.Code, res.Body.String())
	}
}


func TestLegacyMetadataMigrationPreservesCorrections(t *testing.T) {
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "legacy.db")
	root := filepath.Join(dir, "library")
	if e := os.Mkdir(root, 0700); e != nil {
		t.Fatal(e)
	}
	if e := os.WriteFile(filepath.Join(root, "Book.epub"), []byte("book"), 0600); e != nil {
		t.Fatal(e)
	}

	db, e := sql.Open("sqlite", dbPath)
	if e != nil {
		t.Fatal(e)
	}
	_, e = db.Exec(`PRAGMA foreign_keys=ON;
		CREATE TABLE sources(id INTEGER PRIMARY KEY,space TEXT NOT NULL,path TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'Not scanned');
		CREATE TABLE assets(id INTEGER PRIMARY KEY,source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,relative_path TEXT NOT NULL,title TEXT NOT NULL,format TEXT NOT NULL,available INTEGER NOT NULL DEFAULT 1,author TEXT NOT NULL DEFAULT '',series TEXT NOT NULL DEFAULT '',UNIQUE(source_id,relative_path));
		INSERT INTO sources(id,space,path,status) VALUES(1,'Main',?,'Scanned');
		INSERT INTO assets(id,source_id,relative_path,title,format,available,author,series) VALUES(1,1,'Book.epub','My Corrected Title','Ebook',1,'Corrected Author','Corrected Series');`, root)
	if e != nil {
		t.Fatal(e)
	}
	db.Close()

	db, e = openDB(dbPath)
	if e != nil {
		t.Fatal(e)
	}
	defer db.Close()
	a := &app{db: db}
	if e = a.initCatalogue(); e != nil {
		t.Fatal(e)
	}

	var source string
	var confidence int
	var review bool
	if e = db.QueryRow("SELECT metadata_source,metadata_confidence,needs_review FROM assets WHERE id=1").Scan(&source,&confidence,&review); e != nil {
		t.Fatal(e)
	}
	if source != "legacy" || confidence != 100 || review {
		t.Fatalf("legacy migration source=%q confidence=%d review=%v", source, confidence, review)
	}

	if e = a.scan(1); e != nil {
		t.Fatal(e)
	}
	var title, author, series string
	if e = db.QueryRow("SELECT title,author,series FROM assets WHERE id=1").Scan(&title,&author,&series); e != nil {
		t.Fatal(e)
	}
	if title != "My Corrected Title" || author != "Corrected Author" || series != "Corrected Series" {
		t.Fatalf("legacy correction overwritten title=%q author=%q series=%q", title, author, series)
	}
}


func TestBooksPaginationAndFilters(t *testing.T) {
	a := fixture(t)
	root := t.TempDir()
	if _, e := a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Main',?,'Ready')", root); e != nil {
		t.Fatal(e)
	}
	for i := 0; i < 510; i++ {
		author := "Known Author"
		format := "Ebook"
		available := 1
		if i == 509 {
			author = ""
			format = "Audio"
			available = 0
		}
		if _, e := a.db.Exec(`INSERT INTO assets(source_id,relative_path,title,author,series,format,available,metadata_source,metadata_confidence,needs_review)
			VALUES(1,?,?,?,?,?,?, 'manual',100,0)`, fmt.Sprintf("book-%03d.epub",i),fmt.Sprintf("Book %03d",i),author,"",format,available); e != nil {
			t.Fatal(e)
		}
	}
	call := func(path string) *httptest.ResponseRecorder {
		req:=httptest.NewRequest("GET",path,nil)
		req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
		res:=httptest.NewRecorder()
		a.routes().ServeHTTP(res,req)
		return res
	}
	res:=call("/api/books?limit=500&offset=500")
	if res.Code!=200 { t.Fatalf("page status=%d %s",res.Code,res.Body.String()) }
	var page []book
	if e:=json.Unmarshal(res.Body.Bytes(),&page);e!=nil{t.Fatal(e)}
	if len(page)!=10 { t.Fatalf("second page=%d want 10",len(page)) }

	res=call("/api/books?unknownAuthor=1&availability=unavailable&format=Audio&limit=500")
	if res.Code!=200 { t.Fatalf("filtered status=%d %s",res.Code,res.Body.String()) }
	page=nil
	if e:=json.Unmarshal(res.Body.Bytes(),&page);e!=nil{t.Fatal(e)}
	if len(page)!=1 || page[0].Author!="" || page[0].Available || page[0].Format!="Audio" {
		t.Fatalf("filtered page=%+v",page)
	}
}


func TestMobileReaderBearerBootstrapSetsSecureSessionCookie(t *testing.T) {
	a := fixture(t)
	req := httptest.NewRequest("GET", "/reader.html?asset=1", nil)
	req.Header.Set("Authorization", "Bearer test-key")
	req.Header.Set("X-Forwarded-Proto", "https")
	res := httptest.NewRecorder()
	a.routes().ServeHTTP(res, req)
	if res.Code != 200 {
		t.Fatalf("reader bootstrap status=%d body=%q", res.Code, res.Body.String())
	}
	var sessionCookie *http.Cookie
	for _, cookie := range res.Result().Cookies() {
		if cookie.Name == "archivist_session" {
			sessionCookie = cookie
			break
		}
	}
	if sessionCookie == nil {
		t.Fatal("reader bootstrap did not set session cookie")
	}
	if sessionCookie.Value != "test-key" || !sessionCookie.HttpOnly || !sessionCookie.Secure || sessionCookie.SameSite != http.SameSiteStrictMode {
		t.Fatalf("reader bootstrap cookie=%+v", sessionCookie)
	}

	apiReq := httptest.NewRequest("GET", "/api/me", nil)
	apiReq.AddCookie(sessionCookie)
	apiRes := httptest.NewRecorder()
	a.routes().ServeHTTP(apiRes, apiReq)
	if apiRes.Code != 200 {
		t.Fatalf("reader cookie did not authenticate subsequent API request: %d %s", apiRes.Code, apiRes.Body.String())
	}
}

func TestInvalidReaderBearerDoesNotMintSessionCookie(t *testing.T) {
	a := fixture(t)
	req := httptest.NewRequest("GET", "/reader.html?asset=1", nil)
	req.Header.Set("Authorization", "Bearer definitely-invalid")
	res := httptest.NewRecorder()
	a.routes().ServeHTTP(res, req)
	for _, cookie := range res.Result().Cookies() {
		if cookie.Name == "archivist_session" && cookie.Value != "" {
			t.Fatalf("invalid bearer minted reader cookie: %+v", cookie)
		}
	}
}


func TestMobileSessionCookieIsSecureBehindHTTPSProxy(t *testing.T) {
	a:=fixture(t)
	req:=httptest.NewRequest("POST","/session",strings.NewReader(`{"token":"test-key"}`))
	req.Header.Set("X-Archivist-Action","1")
	req.Header.Set("X-Forwarded-Proto","https")
	res:=httptest.NewRecorder()
	a.routes().ServeHTTP(res,req)
	if res.Code!=http.StatusOK{t.Fatalf("session status=%d %s",res.Code,res.Body.String())}
	var found *http.Cookie
	for _,cookie:=range res.Result().Cookies(){
		if cookie.Name=="archivist_session"{found=cookie;break}
	}
	if found==nil || !found.HttpOnly || !found.Secure || found.SameSite!=http.SameSiteStrictMode {
		t.Fatalf("session cookie not hardened: %+v",found)
	}
}



func TestServerScanPersistsRichMetadata(t *testing.T) {
	a := fixture(t)
	root := t.TempDir()
	book := filepath.Join(root, "Dune.epub")
	writeZipFixture(t, book, map[string]string{
		"META-INF/container.xml": "<container><rootfiles><rootfile full-path=\"OPS/content.opf\"/></rootfiles></container>",
		"OPS/content.opf": "<package><metadata><title>Dune</title><creator>Herbert, Frank</creator><subject>Science Fiction</subject><publisher>Chilton</publisher><language>en</language><description>Arrakis.</description><date>1965-08-01</date><identifier>ISBN 9780441172719</identifier><meta name=\"calibre:series\" content=\"Dune\"/><meta name=\"calibre:series_index\" content=\"1\"/></metadata></package>",
	})
	if e := a.addSource("Books", root); e != nil { t.Fatal(e) }
	if e := a.scan(1); e != nil { t.Fatal(e) }

	var title, author, series, publisher, isbn, language, description string
	var seriesNumber float64
	var year int
	if e := a.db.QueryRow(`SELECT title,author,series,series_number,published_year,publisher,isbn,language,description FROM assets WHERE id=1`).
		Scan(&title,&author,&series,&seriesNumber,&year,&publisher,&isbn,&language,&description); e != nil { t.Fatal(e) }
	if title!="Dune" || author!="Frank Herbert" || series!="Dune" || seriesNumber!=1 {
		t.Fatalf("identity=%q %q %q %v",title,author,series,seriesNumber)
	}
	if year!=1965 || publisher!="Chilton" || isbn!="9780441172719" || language!="en" || description!="Arrakis." {
		t.Fatalf("details year=%d publisher=%q isbn=%q language=%q description=%q",year,publisher,isbn,language,description)
	}

	if e := a.scan(1); e != nil { t.Fatal(e) }
	var cachedSeriesNumber float64
	if e := a.db.QueryRow("SELECT series_number FROM assets WHERE id=1").Scan(&cachedSeriesNumber); e != nil { t.Fatal(e) }
	if cachedSeriesNumber != 1 { t.Fatalf("incremental rescan lost rich metadata: %v", cachedSeriesNumber) }
}
