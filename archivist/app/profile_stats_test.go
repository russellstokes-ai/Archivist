package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func addProfileStatWork(t *testing.T,a *app,sourceID int64,space,title,series,format string,available int) (int64,int64) {
	t.Helper()
	res,e:=a.db.Exec(`INSERT INTO assets(source_id,relative_path,title,author,series,format,available,metadata_source,metadata_confidence,needs_review)
		VALUES(?,?,?,?,?,?,?,'manual',100,0)`,
		sourceID,title+"."+format,title,"Author",series,format,available)
	if e!=nil{t.Fatal(e)}
	assetID,_:=res.LastInsertId()
	res,e=a.db.Exec("INSERT INTO works(title,space,author,series,auto,group_key) VALUES(?,?,?,?,0,'')",title,space,"Author",series)
	if e!=nil{t.Fatal(e)}
	workID,_:=res.LastInsertId()
	res,e=a.db.Exec("INSERT INTO editions(work_id,format) VALUES(?,?)",workID,format)
	if e!=nil{t.Fatal(e)}
	editionID,_:=res.LastInsertId()
	if _,e=a.db.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(?,?,0)",assetID,editionID);e!=nil{t.Fatal(e)}
	return assetID,editionID
}

func TestProfileStatsAreVerifiedAndGrantAware(t *testing.T) {
	a:=fixture(t)
	if e:=a.initProgress();e!=nil{t.Fatal(e)}
	if e:=a.initReader();e!=nil{t.Fatal(e)}
	if _,e:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Main','/main','Ready'),(2,'Hidden','/hidden','Ready')");e!=nil{t.Fatal(e)}
	if _,e:=a.db.Exec("INSERT INTO profiles(id,name,key_hash,revoked) VALUES(1,'Sam',?,0)",keyHash("child-key"));e!=nil{t.Fatal(e)}
	if _,e:=a.db.Exec("INSERT INTO grants(profile_id,space) VALUES(1,'Main')");e!=nil{t.Fatal(e)}
	if _,e:=a.db.Exec("INSERT INTO sessions(token_hash,profile_id,credential_hash,expires,created) VALUES(?,1,?,9999999999,0)",keyHash("child-key"),keyHash("child-key"));e!=nil{t.Fatal(e)}

	_,audioEdition:=addProfileStatWork(t,a,1,"Main","Audio finished","Series A","Audio",1)
	readAsset,_:=addProfileStatWork(t,a,1,"Main","Book finished","Series B","Ebook",1)
	readStarted,_:=addProfileStatWork(t,a,1,"Main","Comic started","","Comic",1)
	_,hiddenEdition:=addProfileStatWork(t,a,2,"Hidden","Hidden audio","Hidden Series","Audio",1)

	if _,e:=a.db.Exec(`INSERT INTO profile_progress(profile_id,edition_id,asset_id,seconds,revision,complete)
		SELECT 1,?,ea.asset_id,120,1,1 FROM edition_assets ea WHERE ea.edition_id=?`,audioEdition,audioEdition);e!=nil{t.Fatal(e)}
	if _,e:=a.db.Exec(`INSERT INTO profile_progress(profile_id,edition_id,asset_id,seconds,revision,complete)
		SELECT 1,?,ea.asset_id,90,1,1 FROM edition_assets ea WHERE ea.edition_id=?`,hiddenEdition,hiddenEdition);e!=nil{t.Fatal(e)}
	if _,e:=a.db.Exec("INSERT INTO reading_progress(profile_id,asset_id,part,fraction,revision,complete) VALUES(1,?,4,1,2,1),(1,?,1,.25,1,0)",readAsset,readStarted);e!=nil{t.Fatal(e)}

	stats,e:=a.profileStatsFor(identity{ID:1,Name:"Sam"})
	if e!=nil{t.Fatal(e)}
	if stats.Name!="Sam" || stats.Owner || stats.Works!=3 || stats.Formats!=3 || stats.Series!=2 {
		t.Fatalf("catalogue stats=%+v",stats)
	}
	if stats.StartedAudio!=1 || stats.CompletedAudio!=1 || stats.StartedReading!=2 || stats.CompletedReading!=1 {
		t.Fatalf("progress stats=%+v",stats)
	}
	if stats.InProgress!=1 || stats.Completed!=2 {
		t.Fatalf("summary progress=%+v",stats)
	}

	req:=httptest.NewRequest("GET","/api/profile-stats",nil)
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"child-key"})
	res:=httptest.NewRecorder()
	a.routes().ServeHTTP(res,req)
	if res.Code!=200{t.Fatalf("profile route=%d %s",res.Code,res.Body.String())}
	var routed verifiedProfileStats
	if e=json.Unmarshal(res.Body.Bytes(),&routed);e!=nil{t.Fatal(e)}
	if routed.Name!="Sam" || routed.Works!=3 || routed.Completed!=2 || routed.InProgress!=1 {
		t.Fatalf("routed stats=%+v",routed)
	}
}
