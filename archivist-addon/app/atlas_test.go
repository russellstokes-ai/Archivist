package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func addAtlasWork(t *testing.T,a *app,sourceID int64,space,title,author,series,genre,format string) int64 {
	t.Helper()
	res,e:=a.db.Exec(`INSERT INTO assets(source_id,relative_path,title,author,series,genre,format,available,metadata_source,metadata_confidence,needs_review)
		VALUES(?,?,?,?,?,?,?,1,'manual',100,0)`,sourceID,title+"."+format,title,author,series,genre,format)
	if e!=nil{t.Fatal(e)}
	assetID,_:=res.LastInsertId()
	res,e=a.db.Exec("INSERT INTO works(title,space,author,series,genre,auto,group_key) VALUES(?,?,?,?,?,0,'')",title,space,author,series,genre)
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
	dune:=addAtlasWork(t,a,1,"Main","Dune","Frank Herbert","Dune","Science Fiction","Ebook")
	messiah:=addAtlasWork(t,a,1,"Main","Dune Messiah","Frank Herbert","Dune","Science Fiction","Audio")
	foundation:=addAtlasWork(t,a,1,"Main","Foundation","Isaac Asimov","Foundation","Science Fiction","Ebook")
	addAtlasWork(t,a,1,"Main","Anonymous Work","","Misc","Mystery","Comic")
	hidden:=addAtlasWork(t,a,2,"Hidden","Hidden Dune","Frank Herbert","Dune","Science Fiction","Ebook")
	initAllProgressForTest(t,a)

	if _,e:=a.db.Exec("INSERT INTO profiles(id,name,key_hash,revoked) VALUES(1,'Reader',?,0)",keyHash("reader-key"));e!=nil{t.Fatal(e)}
	if e:=a.initHousehold();e!=nil{t.Fatal(e)}
	if _,e:=a.db.Exec("INSERT INTO sessions(token_hash,profile_id,credential_hash,expires,created) VALUES(?,1,?,9999999999,0)",keyHash("reader-session"),keyHash("reader-key"));e!=nil{t.Fatal(e)}

	var messiahEdition,messiahAsset int64
	if e:=a.db.QueryRow("SELECT e.id,ea.asset_id FROM editions e JOIN edition_assets ea ON ea.edition_id=e.id WHERE e.work_id=? LIMIT 1",messiah).Scan(&messiahEdition,&messiahAsset);e!=nil{t.Fatal(e)}
	if _,e:=a.db.Exec("INSERT INTO profile_progress(profile_id,edition_id,asset_id,seconds,revision,complete) VALUES(1,?,?,45,1,0)",messiahEdition,messiahAsset);e!=nil{t.Fatal(e)}
	if _,e:=a.db.Exec("INSERT INTO profile_completions(profile_id,work_id,kind,completed_at) VALUES(1,?,'Reading',1)",dune);e!=nil{t.Fatal(e)}
	for _,pref:=range []struct{work int64;rating int;fav int}{{dune,10,1},{messiah,9,0},{foundation,8,0},{hidden,10,0}} {
		if _,e:=a.db.Exec("INSERT INTO work_preferences(profile_id,work_id,rating,favourite,updated) VALUES(1,?,?,?,1)",pref.work,pref.rating,pref.fav);e!=nil{t.Fatal(e)}
	}

	out,e:=a.atlasRelationshipFor(identity{ID:1,Name:"Reader",Role:"user"},"author","Frank Herbert")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=3 || len(out.Works)!=3{t.Fatalf("author works=%+v",out)}
	if len(out.Series)!=1 || out.Series[0].Name!="Dune" || out.Series[0].Count!=3{t.Fatalf("series=%+v",out.Series)}
	if len(out.Formats)!=2{t.Fatalf("formats=%+v",out.Formats)}
	if len(out.Spaces)!=2{t.Fatalf("spaces=%+v",out.Spaces)}
	if len(out.Genres)!=1 || out.Genres[0].Name!="Science Fiction" || out.Genres[0].Count!=3{t.Fatalf("genres=%+v",out.Genres)}
	if len(out.Availability)!=1 || out.Availability[0].Name!="Available"{t.Fatalf("availability=%+v",out.Availability)}
	out,e=a.atlasRelationshipFor(identity{ID:1,Name:"Reader"},"series","Dune")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=3 || len(out.Authors)!=1 || out.Authors[0].Name!="Frank Herbert" {
		t.Fatalf("series relationship=%+v",out)
	}

	out,e=a.atlasRelationshipFor(identity{ID:1,Name:"Reader"},"genre","Science Fiction")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=4 || len(out.Works)!=4 {t.Fatalf("genre relationship=%+v",out)}

	out,e=a.atlasRelationshipFor(identity{ID:1,Name:"Reader"},"space","Main")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=4 {t.Fatalf("space relationship=%+v",out)}

	out,e=a.atlasRelationshipFor(identity{ID:1,Name:"Reader"},"format","Comic")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=1 || out.Works[0].Title!="Anonymous Work" {t.Fatalf("format relationship=%+v",out)}

	out,e=a.atlasRelationshipFor(identity{ID:1,Name:"Reader"},"status","Available")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=5 {t.Fatalf("status relationship=%+v",out)}

	out,e=a.atlasRelationshipFor(identity{ID:1,Name:"Reader"},"author","Unknown author")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=1 || len(out.Works)!=1 || out.Works[0].Title!="Anonymous Work"{
		t.Fatalf("unknown author relationship=%+v",out)
	}

	out,e=a.atlasRelationshipFor(identity{ID:1,Name:"Reader",Role:"user"},"reading","Finished")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=1 || out.Works[0].Title!="Dune"{t.Fatalf("finished relationship=%+v",out)}
	out,e=a.atlasRelationshipFor(identity{ID:1,Name:"Reader",Role:"user"},"reading","In progress")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=1 || out.Works[0].Title!="Dune Messiah"{t.Fatalf("in-progress relationship=%+v",out)}
	out,e=a.atlasRelationshipFor(identity{ID:1,Name:"Reader",Role:"user"},"reading","Not started")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=3{t.Fatalf("not-started relationship=%+v",out)}
	out,e=a.atlasRelationshipFor(identity{ID:1,Name:"Reader",Role:"user"},"rating","5★")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=2{t.Fatalf("5-star relationship=%+v",out)}
	out,e=a.atlasRelationshipFor(identity{ID:1,Name:"Reader",Role:"user"},"favourite","Favourites")
	if e!=nil{t.Fatal(e)}
	if out.WorkCount!=1 || out.Works[0].Title!="Dune"{t.Fatalf("favourite relationship=%+v",out)}

	req:=httptest.NewRequest("GET","/api/atlas-relationships?kind=author&value=Frank%20Herbert",nil)
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"reader-session"})
	res:=httptest.NewRecorder()
	a.routes().ServeHTTP(res,req)
	if res.Code!=200{t.Fatalf("atlas route=%d %s",res.Code,res.Body.String())}

	req=httptest.NewRequest("GET","/api/atlas-relationships?kind=format&value=Ebook",nil)
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"reader-session"})
	res=httptest.NewRecorder()
	a.routes().ServeHTTP(res,req)
	if res.Code!=200{t.Fatalf("format relationship route=%d %s",res.Code,res.Body.String())}

	req=httptest.NewRequest("GET","/api/atlas-relationships?kind=bogus&value=Ebook",nil)
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"reader-session"})
	res=httptest.NewRecorder()
	a.routes().ServeHTTP(res,req)
	if res.Code!=400{t.Fatalf("unsupported relationship accepted: %d %s",res.Code,res.Body.String())}
}
