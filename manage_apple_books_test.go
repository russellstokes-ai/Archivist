package main

import (
 "context"
 "encoding/json"
 "net/http"
 "net/http/httptest"
 "net/url"
 "strings"
 "testing"
 "sync/atomic"
 "time"
)

// Catch missing Apple dispatch, accidental artwork ingestion and invented ISBNs.
func TestAppleBooksTextOnlyCandidates(t *testing.T) {
 server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
  w.Write([]byte(`{"resultCount":2,"results":[{"kind":"ebook","trackId":123,"trackName":"Dune","artistName":"Frank Herbert","releaseDate":"2010-04-01T00:00:00Z","trackViewUrl":"https://books.apple.com/us/book/dune/id123","artworkUrl100":"https://example.invalid/art.jpg","previewUrl":"https://example.invalid/preview","description":"Not imported"},{"wrapperType":"audiobook","collectionId":456,"collectionName":"Dune","artistName":"Frank Herbert","releaseDate":"2020-01-01T00:00:00Z","collectionViewUrl":"https://books.apple.com/us/audiobook/dune/id456"}]}`))
 }))
 defer server.Close()
 result := requestMultiMetadata(context.Background(), server.Client(), multiMetadataEndpoint{Name:"Apple Books", URL:server.URL}, multiMetadataQuery{Title:"Dune", Author:"Frank Herbert", ISBN:"9780441172719"})
 if result.Err != nil || len(result.Candidates) != 2 { t.Fatalf("Apple candidates unavailable: %+v", result) }
 c := result.Candidates[0]
 if c.WorkID != "apple-books:123" || c.Title != "Dune" || c.Author != "Frank Herbert" || c.PublishedYear != 2010 || c.Source != "Apple Books" || c.YearType != "store release" { t.Fatalf("wrong mapping: %+v", c) }
 if c.ISBN != "" || c.ISBNExact || c.Publisher != "" { t.Fatalf("invented edition evidence: %+v", c) }
 raw, _ := json.Marshal(c)
 var fields map[string]any
 json.Unmarshal(raw, &fields)
 if fields["sourceUrl"] != "https://books.apple.com/us/book/dune/id123" { t.Fatalf("source link missing: %s", raw) }
 if strings.Contains(string(raw), "example.invalid") || strings.Contains(string(raw), "Not imported") { t.Fatalf("promotional content imported: %s", raw) }
 if result.Candidates[1].WorkID != "apple-books:456" || result.Candidates[1].PublishedYear != 2020 { t.Fatal("audiobook mapping missing") }
}

func TestAppleBooksMalformedResponseIsUnavailable(t *testing.T) {
 for _, body := range []string{`{}`, `null`, `{"errorMessage":"rate limited"}`, `{"results":null}`, `{"results":{}}`} {
  server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.Write([]byte(body)) }))
  candidates, warnings, succeeded := lookupMultiMetadata(context.Background(), server.Client(), []multiMetadataEndpoint{{Name:"Apple Books", URL:server.URL}}, multiMetadataQuery{Search:"Dune"})
  server.Close()
  if succeeded != 0 || len(candidates) != 0 || len(warnings) != 1 { t.Fatalf("malformed Apple response treated as success: %s, %v", body, warnings) }
 }
}

func TestWorkMetadataAppleOriginGuard(t *testing.T) {
 f := setupWorkFixture(t)
 state := f.get(t)
 preview := f.preview(t,state,[]workMetaChange{{Name:"title",Value:"Selected Apple title",Origin:"apple-books"}})
 if len(preview.Diff)!=1 || !strings.Contains(preview.Diff[0].Source,"Apple Books") { t.Fatalf("missing signed provenance: %+v",preview.Diff) }
 if r:=f.apply(t,preview,false);r.Code==200 { t.Fatal("unconfirmed edit applied") }
 tampered:=preview
 tampered.Changes=append([]workMetaChange(nil),preview.Changes...)
 tampered.Changes[0].Value="Tampered title"
 if r:=f.apply(t,tampered,true);r.Code==200 { t.Fatal("tampered candidate applied") }
 if r:=f.apply(t,preview,true);r.Code!=200 { t.Fatalf("confirmed edit failed: %s",r.Body.String()) }
 if field:=fieldValue(f.get(t),"title");field.Value!="Selected Apple title" || !strings.Contains(field.Source,"Apple Books") { t.Fatalf("missing persisted provenance: %+v",field) }
}

func TestAppleBooksSearchMediaAndSafeLinks(t *testing.T) {
 for _, item := range []struct{format,media string}{{"audio","audiobook"},{"audiobook","audiobook"},{"ebook","ebook"},{"comic","ebook"}} {
  u,err:=url.Parse(appleBooksSearchURL("Dune & author",item.format))
  if err!=nil||u.Host!="itunes.apple.com"||u.Query().Get("term")!="Dune & author"||u.Query().Get("media")!=item.media||u.Query().Get("entity")!=item.media||u.Query().Get("limit")!="10"||u.Query().Get("key")!="" {t.Fatalf("unsafe search URL: %v %v",u,err)}
 }
 for _,link:=range []string{"javascript:alert(1)","https://books.apple.com.evil.invalid/book","https://evil@books.apple.com/book","http://books.apple.com/book"} {
  raw,_:=json.Marshal(map[string]any{"results":[]any{map[string]any{"kind":"ebook","trackId":1,"trackName":"Dune","trackViewUrl":link}}})
  found,err:=parseAppleBooksMulti(raw,multiMetadataQuery{Search:"Dune"})
  if err!=nil||len(found)!=1||found[0].SourceURL!="" {t.Fatalf("unsafe link accepted: %s",link)}
 }
 found,err:=parseAppleBooksMulti([]byte(`{"resultCount":0,"results":[]}`),multiMetadataQuery{})
 if err!=nil||len(found)!=0 {t.Fatal("valid empty search must remain successful")}
 state:=workMetaState{Fields:[]workMetaField{{Name:"title",Value:"Locked title",Locked:true}}}
 if _,_,err:=previewMetaChanges(state,[]workMetaChange{{Name:"title",Value:"Apple title",Origin:"apple-books"}});err==nil {t.Fatal("Apple selection bypassed lock")}
}

func TestMetadataDefaultProvidersRequireGoogleKey(t *testing.T) {
 endpoints:=defaultMultiMetadataEndpoints("Dune",multiMetadataQuery{},"")
 if len(endpoints)!=2||endpoints[0].Name!="Open Library"||endpoints[1].Name!="Apple Books" {t.Fatalf("no-key providers incorrect: %+v",endpoints)}
 endpoints=defaultMultiMetadataEndpoints("Dune",multiMetadataQuery{ISBN:"9780441172719"},"configured-test-key")
 if len(endpoints)!=3||endpoints[2].Name!="Google Books" {t.Fatalf("configured Google missing: %+v",endpoints)}
 u,_:=url.Parse(endpoints[2].URL)
 if u.Query().Get("key")!="configured-test-key"||u.Query().Get("q")!="isbn:9780441172719" {t.Fatal("Google configuration or ISBN query lost")}
}

func TestAppleStoreYearRequiresManualOwnerEdit(t *testing.T) {
 state:=workMetaState{Fields:[]workMetaField{{Name:"publishedYear",Value:"1965"}}}
 if _,_,err:=previewMetaChanges(state,[]workMetaChange{{Name:"publishedYear",Value:"2020",Origin:"apple-books"}});err==nil {t.Fatal("store release accepted as first publication")}
 if _,_,err:=previewMetaChanges(state,[]workMetaChange{{Name:"publishedYear",Value:"2020",Origin:"manual"}});err!=nil {t.Fatalf("manual owner correction blocked: %v",err)}
}

func TestAppleSearchPacingKeepsCacheAndOtherProvidersAvailable(t *testing.T) {
 var calls atomic.Int64
 apple:=httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){calls.Add(1);w.Write([]byte(`{"results":[{"kind":"ebook","trackId":1,"trackName":"Dune"}]}`))}))
 defer apple.Close()
 other:=httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){w.Write([]byte(`{"docs":[]}`))}))
 defer other.Close()
 cache:=&multiMetadataCache{}
 endpoints:=[]multiMetadataEndpoint{{Name:"Apple Books",URL:apple.URL},{Name:"Open Library",URL:other.URL}}
 q:=multiMetadataQuery{Search:"Dune"}
 _,_,success:=cache.lookup(context.Background(),apple.Client(),endpoints,q)
 if success!=2 {t.Fatal("initial provider lookup failed")}
 _,warnings,success:=cache.lookup(context.Background(),apple.Client(),endpoints,q)
 if success!=2||len(warnings)!=0||calls.Load()!=1 {t.Fatal("cache hit consumed Apple allowance")}
 _,warnings,success=cache.lookup(context.Background(),apple.Client(),endpoints,multiMetadataQuery{Search:"Another book"})
 if success!=1||len(warnings)!=1||!strings.Contains(warnings[0],"Apple Books rate limit")||calls.Load()!=1 {t.Fatalf("distinct search bypassed rate bound: %d %v calls=%d",success,warnings,calls.Load())}
 now:=time.Now()
 limiter:=&multiMetadataCache{}
 if !limiter.allowApple(now)||limiter.allowApple(now.Add(2999*time.Millisecond))||!limiter.allowApple(now.Add(3*time.Second)) {t.Fatal("Apple requests not spaced three seconds apart")}
}
