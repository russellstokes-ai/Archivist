package main

import (
 "context"
 "net/http"
 "net/http/httptest"
 "strconv"
 "sync/atomic"
 "testing"
 "time"
)

func TestMultiProviderOwnerSearchCacheIsBoundedAndNoPartialFailuresAreCached(t *testing.T){
 var openCalls,googleCalls atomic.Int64
 ol:=httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){
  openCalls.Add(1)
  w.Header().Set("Content-Type","application/json")
  _,_=w.Write([]byte(`{"docs":[{"key":"/works/OL1W","title":"Dune","author_name":["Frank Herbert"],"first_publish_year":1965}]}`))
 }))
 defer ol.Close()
 google:=httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){
  googleCalls.Add(1)
  w.Header().Set("Content-Type","application/json")
  _,_=w.Write([]byte(`{"items":[{"id":"edition","volumeInfo":{"title":"Dune","authors":["Frank Herbert"],"publishedDate":"1980"}}]}`))
 }))
 defer google.Close()
 cache:=&multiMetadataCache{}
 endpoints:=[]multiMetadataEndpoint{{Name:"Open Library",URL:ol.URL},{Name:"Google Books",URL:google.URL}}
 q:=multiMetadataQuery{Search:"Dune",Title:"Dune",Author:"Frank Herbert"}
 client:=&http.Client{Timeout:2*time.Second}
 ctx:=context.Background()
 result,warnings,success:=cache.lookup(ctx,client,endpoints,q)
 if success!=2||len(result)!=2||len(warnings)!=0{
  t.Fatalf("provider consensus missing %+v, warnings=%v, success=%d",result,warnings,success)
 }
 if openCalls.Load()!=1||googleCalls.Load()!=1{t.Fatal("first query did not call each provider exactly once")}
 result[0].Title="Corrupted in caller"
 if len(result[0].Reasons)>0{result[0].Reasons[0]="Spoofed identity"}
 cached,_,status:=cache.lookup(ctx,client,endpoints,q)
 if status!=2||len(cached)!=2||cached[0].Title=="Corrupted in caller"{
  t.Fatalf("cached metadata was overwritten by a mutable response %+v",cached)
 }
 if openCalls.Load()!=1||googleCalls.Load()!=1{
  t.Fatal("repeated identical explicit search sent unnecessary provider requests")
 }
 // A different book identity cannot reuse a cached result. The key binds
 // the full title/author/ISBN/issue identity and exact provider endpoints.
 other:=q;other.Author="Other Author"
 _,_,_=cache.lookup(ctx,client,endpoints,other)
 if openCalls.Load()!=2||googleCalls.Load()!=2{
  t.Fatal("different author incorrectly shared provider lookup cache")
 }
 // A partial provider outage is retryable; it must not be stored as a
 // misleading fully verified provider result.
 down:=httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){
  w.WriteHeader(http.StatusServiceUnavailable)
 }))
 defer down.Close()
 partly:=[]multiMetadataEndpoint{{Name:"Open Library",URL:ol.URL},{Name:"Google Books",URL:down.URL}}
 _,degraded,warnStatus:=cache.lookup(ctx,client,partly,q)
 if warnStatus!=1||len(degraded)!=1{
  t.Fatalf("partial metadata outage should be presented as unverified: %v %d",degraded,warnStatus)
 }
 before:=openCalls.Load()
 _,_,_=cache.lookup(ctx,client,partly,q)
 if openCalls.Load()!=before+1{
  t.Fatal("partial-provider outage must be retried, not cached as complete")
 }
 // Cache bounds and expiry need no timers, goroutines or background work.
 now:=time.Now()
 for i:=0;i<150;i++{
  cache.put("synthetic-"+strconv.Itoa(i),now,nil,nil,2)
 }
 cache.mu.Lock()
 length:=len(cache.entries)
 cache.mu.Unlock()
 if length>metadataCacheLimit{
  t.Fatalf("unbounded metadata cache grew to %d entries",length)
 }
 cache.put("expired",now.Add(-2*metadataCacheTTL),nil,nil,2)
 if _,ok:=cache.get("expired",time.Now());ok{
  t.Fatal("expired metadata result was served instead of allowing refresh")
 }
}
