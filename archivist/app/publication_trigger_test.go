package main

import (
    "strconv"
    "testing"
)

// A manual book must stay staged after its author is cleared and subsequently
// corrected. Merely pressing Save cannot publish a previously-invalid book.
func TestPublicationReopensForManualGroupAndDoesNotRepublishOnSave(t *testing.T){
    a:=fixture(t)
    if _,err:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Books','/synthetic','Ready')");err!=nil{t.Fatal(err)}
    if _,err:=a.db.Exec("INSERT INTO assets(id,source_id,relative_path,title,author,format,needs_review) VALUES(1,1,'a.mp3','A Novel','Writer','Audio',0)");err!=nil{t.Fatal(err)}
    if _,err:=a.group("A Novel",[]int64{1});err!=nil{t.Fatal(err)}
    publishFixtureWorks(t,a)
    var work int64
    if err:=a.db.QueryRow("SELECT id FROM works LIMIT 1").Scan(&work);err!=nil{t.Fatal(err)}
    if state:=publicationSnapshot(t,a,work).State;state!="published"{t.Fatal("fixture not published")}
    path:="/api/assets/1/metadata"
    save:=func(body string)int {
        return publicationCall(t,a,"PATCH",path,body,"test-key",true).Code
    }
    if code:=save(`{"author":""}`);code!=200{t.Fatalf("clear author: %d",code)}
    reopened:=publicationSnapshot(t,a,work)
    if reopened.State!="staged"||reopened.Revision!=2||reopened.NeedsReview!=1{t.Fatalf("no atomic review invalidation: %+v",reopened)}
    if code:=save(`{"author":"Writer"}`);code!=200{t.Fatalf("restore author: %d",code)}
    after:=publicationSnapshot(t,a,work)
    if after.State!="staged"||after.Revision!=2||after.NeedsReview!=0{t.Fatalf("Save silently re-published: %+v",after)}
    var audit int
    if err:=a.db.QueryRow("SELECT count(*) FROM work_publication_events WHERE work_id=? AND action='review_reopened'",work).Scan(&audit);err!=nil||audit!=1{t.Fatalf("reopen audit: %d %v",audit,err)}
    if err:=a.initPublication();err!=nil{t.Fatal(err)}
    if again:=publicationSnapshot(t,a,work);again.State!="staged"||again.Revision!=2{t.Fatalf("restart auto-published: %+v",again)}
    // Explicit Pub would still require a cover and cannot be inferred from Save.
    request:=`{"action":"publish","confirm":true,"expectedRevision":`+strconv.FormatInt(after.Revision,10)+"}"
    if response:=publicationCall(t,a,"POST","/api/manage/works/"+strconv.FormatInt(work,10)+"/publication",request,"test-key",true);
        response.Code!=409{t.Fatalf("incomplete source/cover accepted: %d %s",response.Code,response.Body.String())}
}
