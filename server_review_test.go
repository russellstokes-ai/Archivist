package main

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "strconv"
    "testing"
)

// Synthetic database rows only; this test never scans or modifies a media folder.
func TestServerReviewGroupsFilesIntoLogicalBooks(t *testing.T) {
    a := fixture(t)
    if _,err:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Books','/synthetic','Ready')");err!=nil{t.Fatal(err)}
    for _,work:=range []struct{id int;title string}{{1,"Multipart audiobook"},{2,"Comic issue"},{3,"Previously reviewed"}} {
        if _,err:=a.db.Exec("INSERT INTO works(id,title,space) VALUES(?,?,'Books')",work.id,work.title);err!=nil{t.Fatal(err)}
        if _,err:=a.db.Exec("INSERT INTO editions(id,work_id,format) VALUES(?,?,'Audio')",work.id,work.id);err!=nil{t.Fatal(err)}
    }
    for _,item:=range []struct{id,edition,review int}{{1,1,1},{2,1,1},{3,1,0},{4,2,1},{5,3,0}} {
        if _,err:=a.db.Exec(`INSERT INTO assets(id,source_id,relative_path,title,author,format,available,needs_review,review_reason)
            VALUES(?,1,?,'Book','A. Author','Audio',1,?,'Verify identity')`,item.id,"asset-"+strconv.Itoa(item.id),item.review);err!=nil{t.Fatal(err)}
        if _,err:=a.db.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(?,?,?)",item.id,item.edition,item.id);err!=nil{t.Fatal(err)}
    }
    call:=func(path string,owner bool)*httptest.ResponseRecorder {
        request:=httptest.NewRequest("GET",path,nil)
        if owner { request.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"}) }
        response:=httptest.NewRecorder()
        a.routes().ServeHTTP(response,request)
        return response
    }
    if response:=call("/api/manage/review-works",false);response.Code!=http.StatusUnauthorized {
        t.Fatalf("unauthenticated request allowed: %d",response.Code)
    }
    response:=call("/api/manage/review-works?limit=1",true)
    if response.Code!=200 {t.Fatalf("review request: %d %s",response.Code,response.Body.String())}
    var page struct {Total int `json:"total"`;Works []serverReviewWork `json:"works"`}
    if err:=json.Unmarshal(response.Body.Bytes(),&page);err!=nil{t.Fatal(err)}
    if page.Total!=2||len(page.Works)!=1||page.Works[0].ID!=1||page.Works[0].ReviewFiles!=2||page.Works[0].Files!=3 {
        t.Fatalf("incorrect logical book count: %+v",page)
    }
    response=call("/api/manage/review-works?limit=1&offset=1",true)
    if response.Code!=200 {t.Fatalf("second page: %d %s",response.Code,response.Body.String())}
    if err:=json.Unmarshal(response.Body.Bytes(),&page);err!=nil{t.Fatal(err)}
    if page.Total!=2||len(page.Works)!=1||page.Works[0].ID!=2 {t.Fatalf("second work: %+v",page)}
    response=call("/api/manage/review-works/1/files?limit=2",true)
    if response.Code!=200 {t.Fatalf("work files: %d %s",response.Code,response.Body.String())}
    var detail struct {Files []book `json:"files"`;HasMore bool `json:"hasMore"`}
    if err:=json.Unmarshal(response.Body.Bytes(),&detail);err!=nil{t.Fatal(err)}
    if len(detail.Files)!=2||!detail.HasMore||!detail.Files[0].NeedsReview||!detail.Files[1].NeedsReview {
        t.Fatalf("first file page: %+v",detail)
    }
    response=call("/api/manage/review-works/1/files?limit=2&offset=2",true)
    if response.Code!=200 {t.Fatalf("last file page: %d %s",response.Code,response.Body.String())}
    // Decode into a fresh struct: omitted JSON fields must not retain values
    // from the previous page's reused Go test object.
    detail = struct {Files []book `json:"files"`;HasMore bool `json:"hasMore"`}{}
    if err:=json.Unmarshal(response.Body.Bytes(),&detail);err!=nil{t.Fatal(err)}
    if len(detail.Files)!=1||detail.HasMore||detail.Files[0].NeedsReview {t.Fatalf("last file page: %+v",detail)}
    if response=call("/api/manage/review-works?limit=101",true);response.Code!=400 {
        t.Fatalf("unbounded review page accepted: %d",response.Code)
    }
    var assets int
    if err:=a.db.QueryRow("SELECT count(*) FROM assets").Scan(&assets);err!=nil||assets!=5 {
        t.Fatalf("review endpoint wrote media catalogue: %d %v",assets,err)
    }
}
