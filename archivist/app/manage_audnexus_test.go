package main

import (
 "strings"
 "testing"
)

func TestAudnexusExactIdentityAndRichFields(t *testing.T){
 raw:=[]byte(`{"asin":"B012345678","title":"Book","authors":[{"name":"Writer"}],"narrators":[{"name":"Reader One"},{"name":"Reader Two"}],"description":"<p>A story &amp; a journey.</p><script>bad()</script>","language":"english","publisherName":"Publisher","seriesPrimary":{"name":"Series","position":"2"},"releaseDate":"2024-01-01","image":"https://example.invalid/cover"}`)
 q:=multiMetadataQuery{ASIN:"B012345678",MediaFormat:"audio",Title:"Book",Author:"Writer"}
 found,err:=parseAudnexusMulti(raw,q)
 if err!=nil||len(found)!=1{t.Fatalf("parse: %v %+v",err,found)}
 c:=found[0]
 if !c.ASINExact||c.Narrator!="Reader One, Reader Two"||c.Series!="Series"||c.Description!="A story & a journey."||c.Language!="english"{t.Fatalf("wrong rich metadata: %+v",c)}
 if c.PublishedYear!=0||c.ISBN!=""{t.Fatal("invented first-publication year or ISBN")}
 q.ASIN="B987654321"
 if _,err:=parseAudnexusMulti(raw,q);err==nil{t.Fatal("wrong ASIN accepted")}
 for _,value:=range []string{"../../bad","B012345678?x=1","","123"}{if normalASIN(value)!=""{t.Fatal("unsafe ASIN accepted")}}
 endpoints:=defaultMultiMetadataEndpoints("Book",multiMetadataQuery{ASIN:"B012345678",MediaFormat:"audio"},"")
 foundEndpoint:=false
 for _,endpoint:=range endpoints{if endpoint.Name=="Audnexus"{foundEndpoint=true;if !strings.HasPrefix(endpoint.URL,"https://api.audnex.us/books/B012345678?"){t.Fatal("unexpected endpoint")}}}
 if !foundEndpoint{t.Fatal("no-key audiobook provider missing")}
}

func TestGoogleRichMetadataIsBoundedText(t *testing.T){
 raw:=[]byte(`{"items":[{"id":"book","volumeInfo":{"title":"Book","description":"<p>Summary</p>","language":"en","categories":["Fiction"]}}]}`)
 found,err:=parseGoogleBooksMulti(raw,multiMetadataQuery{})
 if err!=nil||len(found)!=1||found[0].Description!="Summary"||found[0].Language!="en"||found[0].Genre!="Fiction"{t.Fatalf("rich fields missing: %v %+v",err,found)}
}

func TestAudiobookEnrichmentProvenanceAndYearGuard(t *testing.T){
 f:=setupWorkFixture(t)
 state:=f.get(t)
 _,diffs,err:=previewMetaChanges(state,[]workMetaChange{{Name:"narrator",Value:"Verified reader",Origin:"audnexus"}})
 if err!=nil||len(diffs)!=1||!strings.Contains(diffs[0].Source,"Audnexus"){t.Fatalf("lost audiobook provenance: %v %+v",err,diffs)}
 for _,origin:=range []string{"audnexus","google-books","apple-books"}{
  if _,_,err:=previewMetaChanges(state,[]workMetaChange{{Name:"publishedYear",Value:"2024",Origin:origin}});err==nil{t.Fatalf("edition year accepted from %s",origin)}
 }
}

func TestOpenLibraryDescriptionIdentityAndShapes(t *testing.T){
 q:=multiMetadataQuery{Search:"/works/OL123W"}
 for _,raw:=range []string{`{"key":"/works/OL123W","description":"<p>A story</p>"}`,`{"key":"/works/OL123W","description":{"type":"/type/text","value":"A story"}}`}{
  found,err:=parseOpenLibraryDetails([]byte(raw),q)
  if err!=nil||len(found)!=1||found[0].Description!="A story"{t.Fatalf("description: %v %+v",err,found)}
 }
 if _,err:=parseOpenLibraryDetails([]byte(`{"key":"/works/OL999W","description":"Wrong book"}`),q);err==nil{t.Fatal("cross-work description accepted")}
 for _,key:=range []string{"https://example.invalid","/works/../../admin","/works/OL1W?x=1"}{if openLibraryWorkKey.MatchString(key){t.Fatal("unsafe work key accepted")}}
}
