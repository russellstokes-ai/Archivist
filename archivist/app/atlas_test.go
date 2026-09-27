package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func addAtlasWork(t *testing.T,a *app,sourceID int64,space,title,author,series,format string) int64 {
	t.Helper()
	res,e:=a.db.Exec(`INSERT INTO assets(source_id,relative_path,title,author,series,format,available,metadata_source,metadata_confidence,needs_review)
		VALUES(?,?,?,?,?,?,1,'manual',100,0)`,sourceID,title+"."+format,title,author,series,format)
	if e!=nil{t.Fatal(e)}
	assetID,_:=res.LastInsertId()
	res,e=a.db.Exec("INSERT INTO works(title,space,author,series,auto,group_key) VALUES(?,?,?,?,0,'')",title,space,author,series)
	if e!=nil{t.Fatal(e)}
	workID,_:=res.LastInsertId()
	res,e=a.db.Exec("INSERT INTO editions(work_id,format) VALUES(?,?)",workID,format)
	if e!=nil{t.Fatal(e)}
	editionID,_:=res.LastInsertId()
	if _,e=a.db.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(?,?,0)",assetID,editionID);e!=nil{t.Fatal(e)}
	return workID
}

func TestAtlasRelationshipsAreExactAndGrantAware(t *testing.T) {
	a:=fixture(t)
	if _,e:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Main','/main','Ready'),(2,'Hidden','/hidden','Ready')");e!=nil{t.Fatal(e)}
	addAtlasWork(t,a,1,"Main","Dune","Frank Herbert","Dune","Ebook")
	addAtlasWork(t,a,1,"Main","Dune Messiah","Frank Herbert","Dune","Audio")
	addAtlasWork(t,a,1,"Main","Foundation","Isaac Asimov","Foundation","Ebook")
	addAtlasWork(t,a,1,"Main","Anonymous Work","","Misc","Comic")
	addAtlasWork(t,a,2,"Hidden","Hidden Dune","Frank Herbert","Dune","Ebook")

	if _,e:=a.db.Exec("INSERT INTO profiles(id,name,key_hash,revoked) VALUES(1,'Reader',?,0)",keyHash("reader-key"));e!=nil{t.Fatal(e)}
	if _,e:=a.db.Exec("INSERT INTO grants(profile_id,space) VALUES(1,'Main')");e!=nil{t.Fatal(e)}
	if _,e:=a.db.Exec("INSERT INTO sessions(token_hash,profile_id,credential_hash,expires,created) VALUES(?,1,?,9999999999,0)",keyHash("reader-session"),keyHash("reader-key"));e!=nil{t.Fatal(e)}

	out,e:=a.atlasRelationshipFor(identity{ID:1,Name:"Reader"},"author","Frank Herbert")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=2 || len(out.Works)!=2{t.Fatalf("author works=%+v",out)}
	if len(out.Series)!=1 || out.Series[0].Name!="Dune" || out.Series[0].Count!=2{t.Fatalf("series=%+v",out.Series)}
	if len(out.Formats)!=2{t.Fatalf("formats=%+v",out.Formats)}
	if len(out.Spaces)!=1 || out.Spaces[0].Name!="Main"{t.Fatalf("spaces=%+v",out.Spaces)}
	for _,work:=range out.Works {
		if work.Space=="Hidden"{t.Fatal("hidden work leaked")}
	}

	out,e=a.atlasRelationshipFor(identity{ID:1,Name:"Reader"},"series","Dune")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=2 || len(out.Authors)!=1 || out.Authors[0].Name!="Frank Herbert" {
		t.Fatalf("series relationship=%+v",out)
	}

	out,e=a.atlasRelationshipFor(identity{ID:1,Name:"Reader"},"author","Unknown author")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=1 || len(out.Works)!=1 || out.Works[0].Title!="Anonymous Work"{
		t.Fatalf("unknown author relationship=%+v",out)
	}

	req:=httptest.NewRequest("GET","/api/atlas-relationships?kind=author&value=Frank%20Herbert",nil)
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"reader-session"})
	res:=httptest.NewRecorder()
	a.routes().ServeHTTP(res,req)
	if res.Code!=200{t.Fatalf("atlas route=%d %s",res.Code,res.Body.String())}

	req=httptest.NewRequest("GET","/api/atlas-relationships?kind=format&value=Ebook",nil)
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"reader-session"})
	res=httptest.NewRecorder()
	a.routes().ServeHTTP(res,req)
	if res.Code!=400{t.Fatalf("unsupported relationship accepted: %d %s",res.Code,res.Body.String())}
}
