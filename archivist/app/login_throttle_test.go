package main

import (
  "net/http"
  "net/http/httptest"
  "strings"
  "sync"
  "testing"
  "time"
)

func TestLoginFailuresThrottledByActualPeerAndExpire(t *testing.T){
  a:=fixture(t)
  handler:=a.routes()
  request:=func(peer,password,forwarded string)int{
    t.Helper()
    req:=httptest.NewRequest("POST","/session",strings.NewReader(`{"token":"`+password+`"}`))
    req.Header.Set("X-Archivist-Action","1")
    req.RemoteAddr=peer
    if forwarded!=""{req.Header.Set("X-Forwarded-For",forwarded)}
    res:=httptest.NewRecorder()
    handler.ServeHTTP(res,req)
    return res.Code
  }
  peer:="192.168.1.43:1234"
  for i:=0;i<8;i++{
    if status:=request(peer,"wrong-key","198.51.100."+string(rune('A'+i)));status!=401{
      t.Fatalf("attempt %d: expected 401 before lockout, got %d",i,status)
    }
  }
  if status:=request(peer,"wrong-key","198.51.100.99");status!=429{
    t.Fatalf("ninth bad attempt should be rate-limited, got %d",status)
  }
  if status:=request(peer,"test-key","203.0.113.44");status!=429{
    t.Fatalf("forwarded IP spoofing or correct credentials bypassed peer lockout: %d",status)
  }
  if status:=request("192.168.1.44:1234","test-key","192.168.1.43");status!=200{
    t.Fatalf("another genuine peer wrongly locked: %d",status)
  }
  // Force expiry of this synthetic limiter window rather than waiting 2 min.
  a.loginMu.Lock()
  record:=a.loginRates["192.168.1.43"]
  if record==nil{a.loginMu.Unlock();t.Fatal("missing peer lockout record")}
  record.blockedUntil=time.Now().Add(-time.Second)
  record.windowUntil=time.Now().Add(-time.Second)
  a.loginMu.Unlock()
  if status:=request(peer,"test-key","");status!=200{
    t.Fatalf("expired lockout should permit valid authentication, got %d",status)
  }
}

func TestConcurrentAttemptsCannotBypassRateLimiter(t *testing.T){
  a:=fixture(t)
  peer:="10.0.1.3:443"
  var wg sync.WaitGroup
  successfulReservations:=make(chan bool,32)
  for i:=0;i<32;i++{
    wg.Add(1)
    go func(){
      defer wg.Done()
      allowed:=a.beginLoginAttempt(peer)
      if allowed {a.finishLoginAttempt(peer,false)}
      successfulReservations<-allowed
    }()
  }
  wg.Wait()
  close(successfulReservations)
  accepted:=0
  for allowed:=range successfulReservations{if allowed{accepted++}}
  if accepted>8 {t.Fatalf("parallel login attempts bypassed fixed threshold: %d",accepted)}
  if a.beginLoginAttempt(peer){t.Fatal("client bypassed rate limit after concurrent failures")}
}
