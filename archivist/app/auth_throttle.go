package main

import (
 "crypto/sha256"
 "encoding/hex"
 "errors"
 "net"
 "net/http"
 "sync"
 "time"
)

// Bound failed credential attempts by the direct TCP peer, never by spoofable
// X-Forwarded-For or a username supplied by the attacker. This protects both
// /unlock, /session and API Basic access used by OPDS clients. All entries
// are in process memory only, contain no credentials and are size bounded.
const authFailLimit=8
const authFailWindow=15*time.Minute
const authBlockDuration=5*time.Minute
const authPeerCap=1024
var errTooManyCredentials=errors.New("too many access attempts; retry later")
type authPeerFailures struct{
 attempts int
 windowStarted time.Time
 blockedUntil time.Time
}
type authFailureLimiter struct{
 mu sync.Mutex
 peers map[string]authPeerFailures
}
func authPeerKey(remoteAddr string) string {
 host,_,err:=net.SplitHostPort(remoteAddr)
 if err!=nil{return "unknown"}
 ip:=net.ParseIP(host)
 if ip==nil{return "unknown"}
 sum:=sha256.Sum256([]byte(ip.String()))
 return hex.EncodeToString(sum[:])
}
func (lim *authFailureLimiter) permitted(peer string,now time.Time)bool{
 lim.mu.Lock();defer lim.mu.Unlock()
 if lim.peers==nil{return true}
 record,ok:=lim.peers[peer]
 if !ok{
  if len(lim.peers)>=authPeerCap {
   for key,old:=range lim.peers{
    if !old.blockedUntil.IsZero(){
     if !now.Before(old.blockedUntil){delete(lim.peers,key)}
    }else if now.Sub(old.windowStarted)>=authFailWindow{
     delete(lim.peers,key)
    }
   }
  }
  return len(lim.peers)<authPeerCap
 }
 if now.Before(record.blockedUntil){return false}
 if !record.blockedUntil.IsZero()||now.Sub(record.windowStarted)>=authFailWindow{
  delete(lim.peers,peer)
 }
 return true
}
func (lim *authFailureLimiter) failed(peer string,now time.Time){
 lim.mu.Lock();defer lim.mu.Unlock()
 if lim.peers==nil{lim.peers=map[string]authPeerFailures{}}
 for key,record:=range lim.peers{
  if now.After(record.windowStarted.Add(authFailWindow+authBlockDuration))||
     (!record.blockedUntil.IsZero()&&!now.Before(record.blockedUntil)){
   delete(lim.peers,key)
  }
 }
 if len(lim.peers)>=authPeerCap&&lim.peers[peer].windowStarted.IsZero(){
  // Do not accept unlimited novel addresses. Evict only the oldest
  // unblocked record to preserve live blocks.
  var oldestKey string
  var oldest time.Time
  for key,record:=range lim.peers{
   if now.Before(record.blockedUntil){continue}
   if oldestKey==""||record.windowStarted.Before(oldest){
    oldestKey=key;oldest=record.windowStarted
   }
  }
  if oldestKey!=""{delete(lim.peers,oldestKey)}else{return}
 }
 record:=lim.peers[peer]
 if record.windowStarted.IsZero()||now.Sub(record.windowStarted)>=authFailWindow{
  record=authPeerFailures{windowStarted:now}
 }
 record.attempts++
 if record.attempts>=authFailLimit{record.blockedUntil=now.Add(authBlockDuration)}
 lim.peers[peer]=record
}
func (lim *authFailureLimiter) succeeded(peer string){
 lim.mu.Lock();defer lim.mu.Unlock()
 delete(lim.peers,peer)
}
func (a *app) credentialPeerPermitted(w http.ResponseWriter,r *http.Request)bool{
 if a.authLimiter.permitted(authPeerKey(r.RemoteAddr),time.Now()){return true}
 w.Header().Set("Retry-After","300")
 fail(w,http.StatusTooManyRequests,errTooManyCredentials)
 return false
}
