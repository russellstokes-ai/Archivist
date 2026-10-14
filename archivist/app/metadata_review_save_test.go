package main

import (
    "net/http"
    "net/http/httptest"
    "os"
    "path/filepath"
    "strings"
    "testing"
)

func TestMetadataPartialSaveRemainsReviewableUntilIdentified(t *testing.T) {
    a := fixture(t)
    root := t.TempDir()
    if err := os.WriteFile(filepath.Join(root, "Unidentified.epub"), []byte("synthetic epub"), 0600); err != nil {t.Fatal(err)}
    if err := a.addSource("Books", root);err != nil {t.Fatal(err)}
    if err := a.scan(1);err != nil {t.Fatal(err)}
    handler := a.routes()
    call := func(method,path,body string) *httptest.ResponseRecorder {
        t.Helper()
        req:=httptest.NewRequest(method,path,strings.NewReader(body))
        req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
        if method!="GET" {req.Header.Set("X-Archivist-Action","1")}
        res:=httptest.NewRecorder()
        handler.ServeHTTP(res,req)
        return res
    }
    status := func() (title,author,source,reason string,needsReview bool) {
        t.Helper()
        if err:=a.db.QueryRow("SELECT title,author,metadata_source,review_reason,needs_review FROM assets WHERE id=1").
           Scan(&title,&author,&source,&reason,&needsReview);err!=nil {t.Fatal(err)}
        return
    }
    _,author,_,_,initialReview:=status()
    if author!="" || !initialReview {t.Fatalf("fixture expected an unresolved book: author=%q review=%t",author,initialReview)}

    for _,bad:=range []string{
        `{}`,
        `null`,
        `{"title":null}`,
        `{"bogus":"not metadata"}`,
        `{"author":"Ada Lovelace"} {"title":"Unexpected second object"}`,
    } {
        res:=call("PATCH","/api/assets/1/metadata",bad)
        if res.Code!=http.StatusBadRequest {t.Fatalf("accepted invalid metadata %q: %d %s",bad,res.Code,res.Body.String())}
        _,currentAuthor,_,_,review:=status()
        if currentAuthor!=""||!review {t.Fatalf("invalid request changed review state: %q",bad)}
    }

    res:=call("PATCH","/api/assets/1/metadata",`{"title":"Recovered Title","genre":"History"}`)
    if res.Code!=200 {t.Fatalf("partial save failed: %d %s",res.Code,res.Body.String())}
    title,author,source,reason,review:=status()
    if title!="Recovered Title"||author!=""||source!="manual"||!review||reason=="" {
        t.Fatalf("partial save wrongly marked reviewed: title=%q author=%q source=%q review=%t reason=%q",title,author,source,review,reason)
    }
    if res=call("GET","/api/books?review=1",""); res.Code!=200 || !strings.Contains(res.Body.String(),"Recovered Title") {
        t.Fatalf("partial metadata absent from review queue: %d %s",res.Code,res.Body.String())
    }
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    title,author,source,_,review=status()
    if title!="Recovered Title"||author!=""||source!="manual"||!review {
        t.Fatalf("rescan lost incomplete manual metadata: title=%q author=%q source=%q review=%t",title,author,source,review)
    }

    res=call("PATCH","/api/assets/1/metadata",`{"author":"Ada Lovelace"}`)
    if res.Code!=200 {t.Fatalf("completed metadata save: %d %s",res.Code,res.Body.String())}
    title,author,source,reason,review=status()
    if title!="Recovered Title"||author!="Ada Lovelace"||source!="manual"||review||reason!="" {
        t.Fatalf("completed metadata unexpectedly incomplete: title=%q author=%q source=%q review=%t reason=%q",title,author,source,review,reason)
    }
    if res=call("GET","/api/books?review=1",""); res.Code!=200 || strings.Contains(res.Body.String(),"Recovered Title") {
        t.Fatalf("reviewed work still in queue: %d %s",res.Code,res.Body.String())
    }
    if err:=a.scan(1);err!=nil{t.Fatal(err)}
    _,author,source,_,review=status()
    if author!="Ada Lovelace"||source!="manual"||review {t.Fatalf("rescan lost completed metadata: author=%q source=%q review=%t",author,source,review)}

    res=call("PATCH","/api/assets/1/metadata",`{"author":""}`)
    if res.Code!=200{t.Fatalf("clearing author rejected: %d %s",res.Code,res.Body.String())}
    _,author,_,reason,review=status()
    if author!=""||!review||reason==""{t.Fatalf("removing mandatory identity must reopen review: author=%q review=%t reason=%q",author,review,reason)}
}
