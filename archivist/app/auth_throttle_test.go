package main

import (
 "fmt"
 "net/http"
 "net/http/httptest"
 "strings"
 "testing"
 "time"
)

func authCall(a *app,method,url,body,peer,authorization,forwarded string)*httptest.ResponseRecorder{
 req:=httptest.NewRequest(method,url,strings.NewReader(body))
 req.RemoteAddr=peer
 if authorization!=""{req.Header.Set("Authorization",authorization)}
 if forwarded!=""{req.Header.Set("X-Forwarded-For",forwarded)}
 if method!="GET"{req.Header.Set("X-Archivist-Action","1")}
 res:=httptest.NewRecorder();a.routes().ServeHTTP(res,req);return res
}
func TestOwnerSessionFailedCredentialThrottlingAndSpoofedForwardHeaders(t *testing.T){
 a:=fixture(t)
 if err:=a.setOwnerCredential("synthetic-correct-admin-key");err!=nil{t.Fatal(err)}
 const peer="198.51.100.44:54321"
 for attempt:=0;attempt<authFailLimit;attempt++{
  req:=authCall(a,"POST","/unlock",`{"token":"incorrect-password"}`,
   peer,"",fmt.Sprintf("203.0.113.%d",attempt))
  if req.Code!=http.StatusUnauthorized{
   t.Fatalf("attempt %d unexpected status %d: %s",attempt,req.Code,req.Body.String())
  }
 }
 // Attacker-supplied forwarding IPs cannot evade the real socket peer
 // throttle, nor does the server leak whether the supplied key is valid.
 blocked:=authCall(a,"POST","/session",`{"token":"synthetic-correct-admin-key"}`,
   peer,"","10.1.2.3")
 if blocked.Code!=http.StatusTooManyRequests||blocked.Header().Get("Retry-After")!="300"{
  t.Fatalf("locked-out remote host bypassed throttle: %d %s",blocked.Code,blocked.Body.String())
 }
 // A different household host can still sign in; an attacker cannot turn
 // one peer's failed credentials into a global lockout.
 other:=authCall(a,"POST","/unlock",`{"token":"synthetic-correct-admin-key"}`,
  "198.51.100.45:5050","","")
 if other.Code!=200||len(other.Result().Cookies())==0{
  t.Fatalf("independent valid host locked out: %d %s",other.Code,other.Body.String())
 }
 a.authLimiter.mu.Lock()
 entries:=len(a.authLimiter.peers)
 a.authLimiter.mu.Unlock()
 if entries!=1{t.Fatalf("success should clear only that peer's failure state, got %d",entries)}
 now:=time.Now().Add(authBlockDuration+time.Second)
 if !a.authLimiter.permitted(authPeerKey(peer),now){
  t.Fatal("expired peer block did not become retryable")
 }
}
func TestOPDSBasicAuthBruteForceUsesTheSameDirectPeerLimit(t *testing.T){
 a:=fixture(t)
 if err:=a.setOwnerCredential("synthetic-owner-key");err!=nil{t.Fatal(err)}
 if err:=a.initPreferences();err!=nil{t.Fatal(err)}
 const peer="192.0.2.77:12000"
 for i:=0;i<authFailLimit;i++{
  req:=authCall(a,"GET","/api/me","",peer,"Basic dXNlcjpiYWQ=",
   fmt.Sprintf("172.16.0.%d",i))
  if req.Code!=http.StatusUnauthorized{
   t.Fatalf("bad basic request %d: %d %s",i,req.Code,req.Body.String())
  }
 }
 req:=httptest.NewRequest("GET","/api/me",nil)
 req.RemoteAddr=peer;req.SetBasicAuth("anything","synthetic-owner-key")
 blocked:=httptest.NewRecorder();a.routes().ServeHTTP(blocked,req)
 if blocked.Code!=http.StatusTooManyRequests{
  t.Fatalf("OPDS/browser Basic auth skipped brute-force protection: %d %s",blocked.Code,blocked.Body.String())
 }
 req=httptest.NewRequest("GET","/api/me",nil)
 req.RemoteAddr="192.0.2.78:12000";req.SetBasicAuth("anything","synthetic-owner-key")
 valid:=httptest.NewRecorder();a.routes().ServeHTTP(valid,req)
 if valid.Code!=200||!strings.Contains(valid.Body.String(),`"owner":true`){
  t.Fatalf("correct Basic auth from independent peer rejected: %d %s",valid.Code,valid.Body.String())
 }
}
func TestAuthLimiterIsBoundedInMemoryAndExpires(t *testing.T){
 var l authFailureLimiter
 now:=time.Now()
 for i:=0;i<authPeerCap;i++{l.failed(fmt.Sprintf("hashed-peer-%d",i),now)}
 if l.permitted("new-peer",now){
  t.Fatal("new attacking peer bypassed bound when limiter table full")
 }
 if !l.permitted("new-peer",now.Add(authFailWindow+time.Second)){
  t.Fatal("expired limiter slots not released without a server restart")
 }
 if strings.Contains(authPeerKey("192.0.2.10:5000"),"192.0.2.10"){
  t.Fatal("raw private client address stored as limiter key")
 }
}
