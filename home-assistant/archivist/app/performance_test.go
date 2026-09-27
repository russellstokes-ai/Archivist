package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
)

func TestSQLitePoolKeepsPerConnectionSafetyPragmas(t *testing.T) {
	db,err:=openDB(filepath.Join(t.TempDir(),"pool.db"))
	if err!=nil{t.Fatal(err)}
	defer db.Close()
	if got:=db.Stats().MaxOpenConnections;got!=4{t.Fatalf("max open connections=%d want 4",got)}
	ctx:=context.Background()
	first,err:=db.Conn(ctx);if err!=nil{t.Fatal(err)}
	defer first.Close()
	second,err:=db.Conn(ctx);if err!=nil{t.Fatal(err)}
	defer second.Close()
	for i,conn:=range []*sql.Conn{first,second} {
		var foreignKeys,busy int
		if err=conn.QueryRowContext(ctx,"PRAGMA foreign_keys").Scan(&foreignKeys);err!=nil{t.Fatal(err)}
		if err=conn.QueryRowContext(ctx,"PRAGMA busy_timeout").Scan(&busy);err!=nil{t.Fatal(err)}
		if foreignKeys!=1 || busy<5000{t.Fatalf("connection %d pragmas foreign_keys=%d busy_timeout=%d",i,foreignKeys,busy)}
	}
	var journal string
	if err=db.QueryRow("PRAGMA journal_mode").Scan(&journal);err!=nil{t.Fatal(err)}
	if journal!="wal"{t.Fatalf("journal_mode=%q",journal)}
}

func TestFiveThousandWorkPagingAndPersonalSummary(t *testing.T) {
	a:=fixture(t)
	initAllProgressForTest(t,a)
	if err:=a.initPerformance();err!=nil{t.Fatal(err)}
	if _,err:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Main','/tmp','Ready')");err!=nil{t.Fatal(err)}
	tx,err:=a.db.Begin();if err!=nil{t.Fatal(err)}
	for i:=1;i<=5000;i++ {
		format:="Ebook"
		if i%5==0{format="Audio"}
		if _,err=tx.Exec(`INSERT INTO assets(id,source_id,relative_path,title,author,series,genre,format,available,metadata_source,metadata_confidence,needs_review)
			VALUES(?,1,?,?,?,?,?, ?,1,'manual',100,0)`,i,fmt.Sprintf("book-%05d.dat",i),fmt.Sprintf("Book %05d",i),"Scale Author","Scale Series","Scale Genre",format);err!=nil{tx.Rollback();t.Fatal(err)}
		if _,err=tx.Exec("INSERT INTO works(id,title,space,author,series,genre,auto,group_key) VALUES(?,?,'Main','Scale Author','Scale Series','Scale Genre',0,'')",i,fmt.Sprintf("Book %05d",i));err!=nil{tx.Rollback();t.Fatal(err)}
		if _,err=tx.Exec("INSERT INTO editions(id,work_id,format) VALUES(?,?,?)",i,i,format);err!=nil{tx.Rollback();t.Fatal(err)}
		if _,err=tx.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(?,?,0)",i,i);err!=nil{tx.Rollback();t.Fatal(err)}
	}
	if _,err=tx.Exec("INSERT INTO work_preferences(profile_id,work_id,rating,favourite,updated) VALUES(0,5000,10,1,1)");err!=nil{tx.Rollback();t.Fatal(err)}
	if _,err=tx.Exec("INSERT INTO profile_completions(profile_id,work_id,kind,completed_at) VALUES(0,4999,'Reading',1)");err!=nil{tx.Rollback();t.Fatal(err)}
	if _,err=tx.Exec("INSERT INTO reading_progress(profile_id,asset_id,part,fraction,revision,complete) VALUES(0,4998,2,.4,1,0)");err!=nil{tx.Rollback();t.Fatal(err)}
	if err=tx.Commit();err!=nil{t.Fatal(err)}

	call:=func(path string)*httptest.ResponseRecorder{
		req:=httptest.NewRequest("GET",path,nil)
		req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
		res:=httptest.NewRecorder();a.routes().ServeHTTP(res,req);return res
	}
	res:=call("/api/works?limit=100&offset=4900")
	if res.Code!=200{t.Fatalf("works=%d %s",res.Code,res.Body.String())}
	var page []map[string]any
	if err=json.Unmarshal(res.Body.Bytes(),&page);err!=nil{t.Fatal(err)}
	if len(page)!=100{t.Fatalf("last page=%d want 100",len(page))}
	var last map[string]any
	for _,work:=range page{if int(work["id"].(float64))==5000{last=work;break}}
	if last==nil || int(last["rating"].(float64))!=10 || last["favourite"]!=true || last["state"]!="not-started"{
		t.Fatalf("paged personal work=%+v",last)
	}

	res=call("/api/library-summary")
	if res.Code!=200{t.Fatalf("summary=%d %s",res.Code,res.Body.String())}
	var summary struct{
		Total int `json:"total"`
		Reading []atlasCount `json:"reading"`
		Ratings []atlasCount `json:"ratings"`
		Favourites []atlasCount `json:"favourites"`
	}
	if err=json.Unmarshal(res.Body.Bytes(),&summary);err!=nil{t.Fatal(err)}
	if summary.Total!=5000{t.Fatalf("total=%d",summary.Total)}
	find:=func(items []atlasCount,name string)int{for _,item:=range items{if item.Name==name{return item.Count}};return 0}
	if find(summary.Reading,"Finished")!=1 || find(summary.Reading,"In progress")!=1 || find(summary.Reading,"Not started")!=4998{
		t.Fatalf("reading=%+v",summary.Reading)
	}
	if find(summary.Ratings,"5★")!=1 || find(summary.Ratings,"Unrated")!=4999{t.Fatalf("ratings=%+v",summary.Ratings)}
	if find(summary.Favourites,"Favourites")!=1{t.Fatalf("favourites=%+v",summary.Favourites)}
}

func TestCatalogueStartupMigrationRunsOnce(t *testing.T) {
	a:=fixture(t)
	if _,err:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Main','/tmp','Ready')");err!=nil{t.Fatal(err)}
	if err:=a.syncExistingCatalogue();err!=nil{t.Fatal(err)}
	var version string
	if err:=a.db.QueryRow("SELECT value FROM app_meta WHERE key='catalogue_migration'").Scan(&version);err!=nil{t.Fatal(err)}
	if version!=catalogueMigrationVersion{t.Fatalf("migration version=%q",version)}
	// A second startup check should be a metadata lookup, not a full regroup.
	if err:=a.syncExistingCatalogue();err!=nil{t.Fatal(err)}
}
