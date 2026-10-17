package main

import (
 "context"
 "encoding/json"
 "net/http"
 "net/http/httptest"
 "strings"
 "testing"
 "time"
)

func TestMultiISBNIdentityAndChecksum(t *testing.T){
 for _,s:=range []string{"0441172717","9780441172719","0306406152","9780306406157"}{
  if normalValidISBN(s)==""{t.Fatalf("rejected valid ISBN %s",s)}
 }
 for _,s:=range []string{"9780441172718","044117271X","1234567890","978044117271X","not-an-isbn"}{
  if normalValidISBN(s)!=""{t.Fatalf("accepted invalid ISBN %s",s)}
 }
 if !sameISBN("0441172717","9780441172719"){t.Fatal("978 ISBN-13 must match ISBN-10 counterpart")}
 if sameISBN("9780441172719","9780306406157"){t.Fatal("unrelated ISBNs matched")}
}
func TestMultiCandidatesEditionAndAuthorEvidence(t *testing.T){
 q:=multiMetadataQuery{Search:"Dune Frank Herbert",Title:"Dune",Author:"Frank Herbert",ISBN:"9780441172719"}
 ol:=`{"docs":[
 {"key":"/works/OL1W","title":"Dune","author_name":["Frank Herbert"],"first_publish_year":1965,"isbn":["9780306406157","9780441172719"],"publisher":["Arbitrary edition"]},
 {"key":"/works/OL2W","title":"Dune","author_name":["Other Author"],"isbn":["9780306406157"]},
 {"key":"/works/OL3W","title":"Dune Messiah","author_name":["Frank Herbert"]}
 ]}`
 found,err:=parseOpenLibraryMulti([]byte(ol),q)
 if err!=nil||len(found)!=3{t.Fatalf("Open Library parse error %v, %+v",err,found)}
 if !found[0].ISBNExact||found[0].ISBN!="9780441172719"||found[0].Publisher!=""||
  found[0].YearType!="first publication"||found[0].Tier!="strong candidate"{
  t.Fatalf("Open Library work-level evidence was unsafe: %+v",found[0])
 }
 if found[1].ISBN!=""||found[1].Tier=="strong candidate"{
  t.Fatalf("wrong author or absent matching ISBN was over-trusted: %+v",found[1])
 }
 without,err:=parseOpenLibraryMulti([]byte(ol),multiMetadataQuery{Search:"Dune",Title:"Dune"})
 if err!=nil||without[0].ISBN!=""{t.Fatal("Open Library must not offer the first arbitrary edition ISBN")}
 gb:=`{"items":[
 {"id":"edition-ok","volumeInfo":{"title":"Dune","authors":["Frank Herbert"],"publisher":"Ace","publishedDate":"1990-09","industryIdentifiers":[{"type":"ISBN_13","identifier":"9780441172719"}]}},
 {"id":"wrong-edition","volumeInfo":{"title":"Dune","authors":["Other Author"],"publishedDate":"2020","industryIdentifiers":[{"type":"ISBN_13","identifier":"9780306406157"}]}},
 {"id":"empty","volumeInfo":{"title":"Dune","authors":["Frank Herbert"],"publishedDate":"invalid"}}
 ]}`
 google,err:=parseGoogleBooksMulti([]byte(gb),q)
 if err!=nil||len(google)!=3{t.Fatalf("Google parse error %v, %+v",err,google)}
 if !google[0].ISBNExact||google[0].PublishedYear!=1990||
  google[0].YearType!="edition publication"||google[0].Tier!="strong candidate"{
  t.Fatalf("edition-year mismatch hidden: %+v",google[0])
 }
 if !google[1].IdentifierMismatch||google[1].ISBN!=""||google[1].Tier=="strong candidate"{
  t.Fatalf("wrong-edition identifier could be selected: %+v",google[1])
 }
 if google[2].PublishedYear!=0||google[2].ISBN!=""{t.Fatal("metadata invented for incomplete result")}
}
func TestMultiProviderPartialOutageAndBounds(t *testing.T){
 outage:=httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter,_ *http.Request){w.WriteHeader(503)}))
 defer outage.Close()
 valid:=httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter,_ *http.Request){
  w.Header().Set("Content-Type","application/json")
  _,_=w.Write([]byte(`{"items":[{"id":"g1","volumeInfo":{"title":"Dune","authors":["Frank Herbert"]}}]}`))
 }))
 defer valid.Close()
 client:=&http.Client{Timeout:2*time.Second,CheckRedirect:func(*http.Request,[]*http.Request)error{return http.ErrUseLastResponse}}
 q:=multiMetadataQuery{Search:"Dune",Title:"Dune",Author:"Frank Herbert"}
 candidates,warnings,count:=lookupMultiMetadata(context.Background(),client,[]multiMetadataEndpoint{
  {Name:"Open Library",URL:outage.URL},{Name:"Google Books",URL:valid.URL},
 },q)
 if count!=1||len(candidates)!=1||len(warnings)!=1||candidates[0].Source!="Google Books"{
  t.Fatalf("partial outage should preserve good results %d %+v %+v",count,candidates,warnings)
 }
 huge:=httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter,_ *http.Request){
  _,_=w.Write([]byte(strings.Repeat(" ",multiMetadataResponseLimit+5)))
 }))
 defer huge.Close()
 if result:=requestMultiMetadata(context.Background(),client,multiMetadataEndpoint{Name:"Google Books",URL:huge.URL},q);result.Err==nil{
  t.Fatal("unbounded provider response accepted")
 }
 redirected:=httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){
  http.Redirect(w,r,"http://127.0.0.1:1/internal",302)
 }))
 defer redirected.Close()
 if result:=requestMultiMetadata(context.Background(),client,multiMetadataEndpoint{Name:"Google Books",URL:redirected.URL},q);result.Err==nil{
  t.Fatal("external metadata redirect must be refused")
 }
}
func TestWorkMetadataGoogleProviderOriginGuard(t *testing.T){
 f:=setupWorkFixture(t)
 state:=f.get(t)
 preview:=f.preview(t,state,[]workMetaChange{{Name:"publisher",Value:"Ace Books",Origin:"google-books"}})
 if len(preview.Diff)!=1||!strings.Contains(preview.Diff[0].Source,"Google Books"){
  t.Fatalf("provider origin not represented in signed diff: %+v",preview.Diff)
 }
 if r:=f.apply(t,preview,false);r.Code==200{t.Fatal("unconfirmed provider edit applied")}
 if r:=f.apply(t,preview,true);r.Code!=200{t.Fatalf("confirmed edit failed: %d %s",r.Code,r.Body.String())}
 field:=fieldValue(f.get(t),"publisher")
 if !strings.Contains(field.Source,"Google Books"){t.Fatalf("provider origin not persisted: %+v",field)}
 current:=f.get(t)
 bad,_:=json.Marshal(workMetaPreviewRequest{ExpectedRevision:current.Revision,
  ExpectedFingerprint:current.Fingerprint,Changes:[]workMetaChange{{Name:"title",Value:"Untrusted name",Origin:"invented-provider"}}})
 w:=workMetaRequest(f.a,"POST",f.path("/preview"),"test-key",string(bad),true)
 if w.Code==200{t.Fatal("unknown provider origin accepted")}
}
