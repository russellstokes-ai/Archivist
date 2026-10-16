package main

import (
    "encoding/xml"
    "fmt"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
)

// A large OPDS collection must never silently lose everything after the
// first 200 works, or after 1,500 chapters of an early audiobook.
func createOPDSWork(t *testing.T,a *app,source int64,space,title string,tracks int){
    t.Helper()
    tx,err:=a.db.Begin()
    if err!=nil{t.Fatal(err)}
    defer tx.Rollback()
    r,err:=tx.Exec("INSERT INTO works(title,space,author) VALUES(?,?,?)",title,space,"Test Author")
    if err!=nil{t.Fatal(err)}
    work,err:=r.LastInsertId();if err!=nil{t.Fatal(err)}
    r,err=tx.Exec("INSERT INTO editions(work_id,format) VALUES(?,?)",work,"Audio")
    if err!=nil{t.Fatal(err)}
    edition,err:=r.LastInsertId();if err!=nil{t.Fatal(err)}
    for i:=0;i<tracks;i++{
        p:=fmt.Sprintf("%s-%05d.mp3",title,i)
        r,err=tx.Exec("INSERT INTO assets(source_id,relative_path,title,format,available) VALUES(?,?,?,?,1)",source,p,title,"Audio")
        if err!=nil{t.Fatal(err)}
        asset,err:=r.LastInsertId();if err!=nil{t.Fatal(err)}
        if _,err=tx.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(?,?,?)",asset,edition,i);err!=nil{t.Fatal(err)}
    }
    if err=tx.Commit();err!=nil{t.Fatal(err)}
}
func readOPDSFeed(t *testing.T,a *app,uri string,token string) opdsFeed {
    t.Helper()
    req:=httptest.NewRequest(http.MethodGet,uri,nil)
    req.AddCookie(&http.Cookie{Name:"archivist_session",Value:token})
    res:=httptest.NewRecorder()
    a.routes().ServeHTTP(res,req)
    if res.Code!=200{t.Fatalf("OPDS URI %q returned %d: %s",uri,res.Code,res.Body.String())}
    var feed opdsFeed
    if err:=xml.Unmarshal(res.Body.Bytes(),&feed);err!=nil{t.Fatalf("invalid OPDS Atom XML: %v",err)}
    return feed
}
func nextOPDSLink(feed opdsFeed) string {
    for _,link:=range feed.Links{if link.Rel=="next"{return link.Href}}
    return ""
}
func TestOPDSMoreThan200WorksCanBeTraversedWithoutOmissions(t *testing.T){
    a:=fixture(t)
    if err:=a.addSource("Main",t.TempDir());err!=nil{t.Fatal(err)}
    for i:=0;i<205;i++{createOPDSWork(t,a,1,"Main",fmt.Sprintf("Book %04d",i),1)}
    publishFixtureWorks(t,a)
    seen:=map[string]bool{}
    uri:="/api/opds"
    for page:=0;page<10;page++{
        feed:=readOPDSFeed(t,a,uri,"test-key")
        if len(feed.Entries)==0{t.Fatalf("unexpected empty OPDS page %d",page)}
        if len(feed.Entries)>200{t.Fatalf("unbounded OPDS page: %d items",len(feed.Entries))}
        for _,entry:=range feed.Entries {
            if seen[entry.ID]{t.Fatalf("duplicate work %s on page %d",entry.ID,page)}
            seen[entry.ID]=true
            if len(entry.Links)!=1{t.Fatalf("work %s lost acquisition link",entry.ID)}
        }
        next:=nextOPDSLink(feed)
        if next==""{
            if len(seen)!=205{t.Fatalf("OPDS silently truncated catalogue: %d of 205 works reachable",len(seen))}
            return
        }
        if !strings.HasPrefix(next,"./opds?after="){t.Fatalf("OPDS next link not an internal stable cursor: %q",next)}
        uri="/api/"+strings.TrimPrefix(next,"./")
    }
    t.Fatal("pagination never terminated")
}
func TestOPDSOneLargeAudiobookDoesNotHideFollowingWorks(t *testing.T){
    a:=fixture(t)
    if err:=a.addSource("Main",t.TempDir());err!=nil{t.Fatal(err)}
    createOPDSWork(t,a,1,"Main","AAA Audiobook",1501)
    createOPDSWork(t,a,1,"Main","ZZZ Final Book",1)
    publishFixtureWorks(t,a)
    feed:=readOPDSFeed(t,a,"/api/opds","test-key")
    if len(feed.Entries)!=2{t.Fatalf("large audiobook buried later works: %d found",len(feed.Entries))}
    if len(feed.Entries[0].Links)!=1501{t.Fatalf("multi-track audiobook links truncated: %d",len(feed.Entries[0].Links))}
    if feed.Entries[1].Title!="ZZZ Final Book"{t.Fatalf("later book missing after large audiobook: %+v",feed.Entries[1])}
}
