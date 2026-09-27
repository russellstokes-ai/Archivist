package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func addProfileStatsWork(t *testing.T, a *app, sourceID int64, space, title, format, series string, available bool) (workID, editionID, assetID int64) {
	t.Helper()
	avail := 0
	if available { avail = 1 }
	res, err := a.db.Exec(`INSERT INTO assets(source_id,relative_path,title,author,series,format,available,metadata_source,metadata_confidence,needs_review)
		VALUES(?,?,?,?,?,?,?,'manual',100,0)`, sourceID, title+"."+format, title, "Author", series, format, avail)
	if err != nil { t.Fatal(err) }
	assetID, _ = res.LastInsertId()
	res, err = a.db.Exec("INSERT INTO works(title,space,author,series,auto,group_key) VALUES(?,?,?,?,1,?)", title, space, "Author", series, "stats-"+title)
	if err != nil { t.Fatal(err) }
	workID, _ = res.LastInsertId()
	res, err = a.db.Exec("INSERT INTO editions(work_id,format) VALUES(?,?)", workID, format)
	if err != nil { t.Fatal(err) }
	editionID, _ = res.LastInsertId()
	if _, err = a.db.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(?,?,0)", assetID, editionID); err != nil { t.Fatal(err) }
	return
}

func TestProfileStatsUsesVerifiedProgress(t *testing.T) {
	a := fixture(t)
	initAllProgressForTest(t,a)
	root := t.TempDir()
	if _, err := a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Main',?,'Ready')", root); err != nil { t.Fatal(err) }

	_, audioDoneEdition, audioDoneAsset := addProfileStatsWork(t,a,1,"Main","Finished Audio","Audio","Series One",true)
	_, readingDoneEdition, readingDoneAsset := addProfileStatsWork(t,a,1,"Main","Finished Book","Ebook","Series Two",true)
	_, audioStartedEdition, audioStartedAsset := addProfileStatsWork(t,a,1,"Main","Started Audio","Audio","Series One",true)
	_ = readingDoneEdition

	if _, err := a.db.Exec("INSERT INTO profile_progress(profile_id,edition_id,asset_id,seconds,revision,complete) VALUES(0,?,?,?,?,1)", audioDoneEdition,audioDoneAsset,120.0,1); err != nil { t.Fatal(err) }
	if _, err := a.db.Exec("INSERT INTO profile_progress(profile_id,edition_id,asset_id,seconds,revision,complete) VALUES(0,?,?,?,?,0)", audioStartedEdition,audioStartedAsset,45.0,1); err != nil { t.Fatal(err) }
	if _, err := a.db.Exec("INSERT INTO reading_progress(profile_id,asset_id,part,fraction,revision,complete) VALUES(0,?,?,?,?,1)", readingDoneAsset,4,1.0,1); err != nil { t.Fatal(err) }

	req := httptest.NewRequest("GET","/api/profile-stats",nil)
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
	res := httptest.NewRecorder()
	a.routes().ServeHTTP(res,req)
	if res.Code != 200 { t.Fatalf("profile stats=%d %s",res.Code,res.Body.String()) }

	var got profileStats
	if err := json.Unmarshal(res.Body.Bytes(),&got); err != nil { t.Fatal(err) }
	if got.Name != "Admin" || !got.Owner { t.Fatalf("identity=%+v",got) }
	if got.Works != 3 || got.Formats != 2 || got.Series != 2 {
		t.Fatalf("library stats=%+v",got)
	}
	if got.StartedAudio != 2 || got.CompletedAudio != 1 || got.InProgressAudio != 1 || got.StartedReading != 1 || got.CompletedReading != 1 || got.InProgressReading != 0 {
		t.Fatalf("progress stats=%+v",got)
	}
	if got.InProgress != 1 || got.Completed != 2 {
		t.Fatalf("completion stats=%+v",got)
	}
}

func TestProfileStatsUserSeesWholeLibrary(t *testing.T) {
	a := fixture(t)
	initAllProgressForTest(t,a)

	mainRoot := filepath.Join(t.TempDir(),"main")
	privateRoot := filepath.Join(t.TempDir(),"private")
	if err:=os.Mkdir(mainRoot,0700);err!=nil{t.Fatal(err)}
	if err:=os.Mkdir(privateRoot,0700);err!=nil{t.Fatal(err)}
	if _,err:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Main',?,'Ready'),(2,'Private',?,'Ready')",mainRoot,privateRoot);err!=nil{t.Fatal(err)}
	_, mainEdition, mainAsset := addProfileStatsWork(t,a,1,"Main","Shared Audio","Audio","Shared Series",true)
	_, privateEdition, privateAsset := addProfileStatsWork(t,a,2,"Private","Private Audio","Audio","Private Series",true)

	res,err:=a.db.Exec("INSERT INTO profiles(name,key_hash,revoked) VALUES('Child',?,0)",keyHash("child-key"))
	if err!=nil{t.Fatal(err)}
	profileID,_:=res.LastInsertId()
	// Startup migration grants every active User every existing library.
	if err=a.initHousehold();err!=nil{t.Fatal(err)}
	if _,err=a.db.Exec("INSERT INTO sessions(token_hash,profile_id,credential_hash,expires,created) VALUES(?,?,?,9999999999,0)",keyHash("child-session"),profileID,keyHash("child-key"));err!=nil{t.Fatal(err)}
	if _,err=a.db.Exec("INSERT INTO profile_progress(profile_id,edition_id,asset_id,seconds,revision,complete) VALUES(?,?,?,?,1,1)",profileID,mainEdition,mainAsset,12.0);err!=nil{t.Fatal(err)}
	if _,err=a.db.Exec("INSERT INTO profile_progress(profile_id,edition_id,asset_id,seconds,revision,complete) VALUES(?,?,?,?,1,1)",profileID,privateEdition,privateAsset,12.0);err!=nil{t.Fatal(err)}

	req:=httptest.NewRequest("GET","/api/profile-stats",nil)
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"child-session"})
	resw:=httptest.NewRecorder()
	a.routes().ServeHTTP(resw,req)
	if resw.Code!=200{t.Fatalf("child stats=%d %s",resw.Code,resw.Body.String())}
	var got profileStats
	if err=json.Unmarshal(resw.Body.Bytes(),&got);err!=nil{t.Fatal(err)}
	if got.Name!="Child" || got.Owner || got.Works!=2 || got.CompletedAudio!=2 || got.Completed!=2 {
		t.Fatalf("whole-library User stats mismatch=%+v",got)
	}
}
