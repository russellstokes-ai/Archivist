package main

import (
  "net"
  "time"
)

const (
  maxLoginFailures=8
  loginFailureWindow=5*time.Minute
  loginBlockTime=2*time.Minute
  maxLoginPeers=512
)
type loginAttempt struct {
  failures int
  inFlight int
  windowUntil time.Time
  blockedUntil time.Time
}

// Never trust X-Forwarded-For from the browser or public clients: only the
// actual TCP remote IP participates in rate limiting. An intentionally
// misconfigured proxy may group users under one IP, a documented tradeoff.
func loginPeer(remote string)string{
  host,_,err:=net.SplitHostPort(remote)
  if err!=nil{return "unresolved-peer"}
  ip:=net.ParseIP(host)
  if ip==nil{return "unresolved-peer"}
  return ip.String()
}
func(a *app)beginLoginAttempt(remote string)bool{
  peer:=loginPeer(remote)
  now:=time.Now()
  a.loginMu.Lock()
  defer a.loginMu.Unlock()
  if a.loginRates==nil{a.loginRates=make(map[string]*loginAttempt)}
  for addr,entry:=range a.loginRates{
    if entry.inFlight==0&&now.After(entry.windowUntil)&&now.After(entry.blockedUntil){
      delete(a.loginRates,addr)
    }
  }
  entry:=a.loginRates[peer]
  if entry==nil{
    if len(a.loginRates)>=maxLoginPeers{
      // Hard cap keeps unauthenticated requests from growing an unbounded
      // peer table. Unknown peers fail closed; existing records stay intact.
      return false
    }
    entry=&loginAttempt{windowUntil:now.Add(loginFailureWindow)}
    a.loginRates[peer]=entry
  }
  if now.Before(entry.blockedUntil)return false
  if now.After(entry.windowUntil) && entry.inFlight==0{
    entry.failures=0
    entry.windowUntil=now.Add(loginFailureWindow)
    entry.blockedUntil=time.Time{}
  }
  if entry.failures+entry.inFlight>=maxLoginFailures{return false}
  entry.inFlight++
  return true
}
func(a *app)finishLoginAttempt(remote string,valid bool){
  peer:=loginPeer(remote)
  now:=time.Now()
  a.loginMu.Lock()
  defer a.loginMu.Unlock()
  entry:=a.loginRates[peer]
  if entry==nil{return}
  if entry.inFlight>0{entry.inFlight--}
  if valid{
    delete(a.loginRates,peer)
    return
  }
  entry.failures++
  if entry.failures>=maxLoginFailures{
    entry.blockedUntil=now.Add(loginBlockTime)
  }
}
