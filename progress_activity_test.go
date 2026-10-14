package main

import (
    "fmt"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
)

func TestListeningActivityIgnoresSeeksRewindsAndTrackJumps(t *testing.T) {
    a := fixture(t)
    if err := a.initCatalogue(); err != nil { t.Fatal(err) }
    if err := a.initProgress(); err != nil { t.Fatal(err) }
    if err := a.initListening(); err != nil { t.Fatal(err) }
    if err := a.initActivity(); err != nil { t.Fatal(err) }
    if _,err := a.db.Exec("INSERT INTO sources(id,space,path) VALUES(1,'Audio','/synthetic')");err!=nil{t.Fatal(err)}
    if _,err := a.db.Exec("INSERT INTO assets(id,source_id,relative_path,title,format) VALUES(1,1,'one.mp3','One','Audio'),(2,1,'two.mp3','Two','Audio')");err!=nil{t.Fatal(err)}
    if _,err:=a.group("Chapters",[]int64{1,2});err!=nil{t.Fatal(err)}
    var edition,workID int64
    if err:=a.db.QueryRow("SELECT id,work_id FROM editions WHERE format='Audio' LIMIT 1").Scan(&edition,&workID);err!=nil{t.Fatal(err)}
    total:=func()float64 {
        t.Helper()
        var seconds float64
        if err:=a.db.QueryRow("SELECT coalesce(sum(active_seconds),0) FROM profile_activity WHERE profile_id=0 AND work_id=? AND kind='Listening'",workID).Scan(&seconds);err!=nil{t.Fatal(err)}
        return seconds
    }
    writeEdition:=func(asset int64,seconds float64,revision int64) {
        t.Helper()
        if _,err:=a.saveProgress(edition,progress{Asset:asset,Seconds:seconds,Revision:revision});err!=nil{t.Fatal(err)}
    }

    writeEdition(1,120,0) // Seek on first open is not 120 seconds of listening.
    if got:=total();got!=0 {t.Fatalf("initial seek inflated stats: %v",got)}
    writeEdition(1,150,1)
    if got:=total();got!=30 {t.Fatalf("forward listening not accounted: %v",got)}
    writeEdition(1,10,2)
    if got:=total();got!=30 {t.Fatalf("rewind inflated stats: %v",got)}
    writeEdition(2,300,3)
    if got:=total();got!=30 {t.Fatalf("chapter jump inflated stats: %v",got)}
    writeEdition(2,320,4)
    if got:=total();got!=50 {t.Fatalf("second chapter delta incorrect: %v",got)}

    sendAsset:=func(seconds int,revision int64) {
        t.Helper()
        body:=fmt.Sprintf("{\"asset\":1,\"seconds\":%d,\"revision\":%d,\"complete\":false}",seconds,revision)
        req:=httptest.NewRequest(http.MethodPut,"/api/assets/1/listening-progress",strings.NewReader(body))
        req.Header.Set("Authorization","Bearer test-key")
        req.Header.Set("X-Archivist-Action","1")
        res:=httptest.NewRecorder()
        a.routes().ServeHTTP(res,req)
        if res.Code!=200 {t.Fatalf("asset progress HTTP %d: %s",res.Code,res.Body.String())}
    }
    sendAsset(90,0)
    if got:=total();got!=50 {t.Fatalf("standalone initial asset bookmark inflated stats: %v",got)}
    sendAsset(105,1)
    if got:=total();got!=65 {t.Fatalf("standalone forward delta incorrect: %v",got)}
    sendAsset(10,2)
    if got:=total();got!=65 {t.Fatalf("standalone rewind inflated stats: %v",got)}
}

func TestListenedDeltaIgnoresNonListeningMoves(t *testing.T) {
    for _,tt:=range []struct{previous,current float64;same bool;want float64}{
        {0,180,false,0},
        {100,120,true,20},
        {120,5,true,0},
        {120,120,true,0},
        {100,500,false,0},
    }{
        if got:=listenedDelta(tt.previous,tt.current,tt.same);got!=tt.want {
            t.Errorf("listenedDelta(%v,%v,%v)=%v want %v",tt.previous,tt.current,tt.same,got,tt.want)
        }
    }
}
