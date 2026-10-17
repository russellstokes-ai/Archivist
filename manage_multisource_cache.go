package main

import (
 "context"
 "encoding/json"
 "net/http"
 "sync"
 "time"
)

// The server's optional metadata comparison is explicitly owner-initiated.
// Cache only successful full-provider lookups in bounded process memory, never
// persist searches or user library identifiers. The result remains unverified
// until the owner selects fields and confirms a separate signed Save.
const metadataCacheLimit=96
const metadataCacheTTL=10*time.Minute
type multiMetadataCacheEntry struct {
 expires time.Time
 candidates []multiMetadataCandidate
 warnings []string
 succeeded int
}
type multiMetadataCache struct {
 mu sync.Mutex
 entries map[string]multiMetadataCacheEntry
 appleNext time.Time
}
func multiMetadataCacheKey(q multiMetadataQuery,endpoints []multiMetadataEndpoint)string{
 // JSON gives collision-free encoding for combinations of titles, author
 // and provider endpoint URLs; string concatenation with a delimiter doesn't.
 raw,_:=json.Marshal(struct{
  Query multiMetadataQuery `json:"query"`
  Endpoints []multiMetadataEndpoint `json:"endpoints"`
 }{q,endpoints})
 return string(raw)
}
func copyMetadataCandidates(items []multiMetadataCandidate)[]multiMetadataCandidate{
 out:=make([]multiMetadataCandidate,len(items))
 for i,item:=range items{
  out[i]=item
  out[i].Reasons=append([]string(nil),item.Reasons...)
  out[i].Warnings=append([]string(nil),item.Warnings...)
 }
 return out
}
func (c *multiMetadataCache) get(key string,now time.Time)(multiMetadataCacheEntry,bool){
 c.mu.Lock();defer c.mu.Unlock()
 if c.entries==nil{return multiMetadataCacheEntry{},false}
 entry,ok:=c.entries[key]
 if !ok{return multiMetadataCacheEntry{},false}
 if !now.Before(entry.expires){delete(c.entries,key);return multiMetadataCacheEntry{},false}
 entry.candidates=copyMetadataCandidates(entry.candidates)
 entry.warnings=append([]string(nil),entry.warnings...)
 return entry,true
}
func (c *multiMetadataCache) put(key string,now time.Time,candidates []multiMetadataCandidate,warnings []string,succeeded int){
 c.mu.Lock();defer c.mu.Unlock()
 if c.entries==nil{c.entries=map[string]multiMetadataCacheEntry{}}
 // Bounded for Raspberry Pi and user privacy, including when many different
 // names are searched. No background goroutine or global disk cache needed.
 for k,v:=range c.entries{if !now.Before(v.expires){delete(c.entries,k)}}
 if len(c.entries)>=metadataCacheLimit{
  var oldestKey string
  var oldest time.Time
  for k,v:=range c.entries{
   if oldestKey==""||v.expires.Before(oldest){oldestKey=k;oldest=v.expires}
  }
  delete(c.entries,oldestKey)
 }
 c.entries[key]=multiMetadataCacheEntry{
  expires:now.Add(metadataCacheTTL),candidates:copyMetadataCandidates(candidates),
  warnings:append([]string(nil),warnings...),succeeded:succeeded,
 }
}
func (c *multiMetadataCache) lookup(ctx context.Context,client *http.Client,
 endpoints []multiMetadataEndpoint,q multiMetadataQuery)([]multiMetadataCandidate,[]string,int){
 key:=multiMetadataCacheKey(q,endpoints)
 if cached,ok:=c.get(key,time.Now());ok{
  return cached.candidates,cached.warnings,cached.succeeded
 }
 eligible:=make([]multiMetadataEndpoint,0,len(endpoints))
 paced:=false
 for _,endpoint:=range endpoints{
  if endpoint.Name=="Apple Books"&&!c.allowApple(time.Now()){paced=true;continue}
  eligible=append(eligible,endpoint)
 }
 candidates,warnings,succeeded:=lookupMultiMetadata(ctx,client,eligible,q)
 if paced{warnings=append(warnings,"Apple Books rate limit: wait a few seconds before another search; no changes were saved")}
 if ctx.Err()==nil&&len(endpoints)>0&&succeeded==len(endpoints){
  c.put(key,time.Now(),candidates,warnings,succeeded)
 }
 return candidates,warnings,succeeded
}

// Apple's public search API permits approximately twenty requests per minute.
// Reserve before dispatch, including failures, with no queue or sleeping request.
// Cached identical searches return before consuming this server-wide allowance.
func (c *multiMetadataCache) allowApple(now time.Time)bool{
 c.mu.Lock();defer c.mu.Unlock()
 if now.Before(c.appleNext){return false}
 c.appleNext=now.Add(3*time.Second)
 return true
}
