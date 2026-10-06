package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"testing"
)

func TestGroupingEditionsOrderAndUngroup(t *testing.T) {
	a := fixture(t)
	if e := a.initCatalogue(); e != nil {
		t.Fatal(e)
	}
	root := t.TempDir()
	for _, name := range []string{"Track 10.mp3", "Track 2.mp3", "Book.epub"} {
		os.WriteFile(filepath.Join(root, name), []byte("fixture"), 0600)
	}
	a.addSource("Main", root)
	a.scan(1)
	rows, e := a.db.Query("SELECT id FROM assets ORDER BY id")
	if e != nil {
		t.Fatal(e)
	}
	ids := []int64{}
	for rows.Next() {
		var id int64
		rows.Scan(&id)
		ids = append(ids, id)
	}
	rows.Close()
	work, e := a.group("A book", ids)
	if e != nil {
		t.Fatal(e)
	}
	var n int
	a.db.QueryRow("SELECT count(*) FROM editions WHERE work_id=?", work).Scan(&n)
	if n != 2 {
		t.Fatalf("editions=%d", n)
	}
	var first string
	a.db.QueryRow("SELECT a.title FROM assets a JOIN edition_assets ea ON ea.asset_id=a.id JOIN editions e ON e.id=ea.edition_id WHERE e.format='Audio' ORDER BY ea.position LIMIT 1").Scan(&first)
	if first != "Track 2" {
		t.Fatal(first)
	}

	req:=httptest.NewRequest("GET","/api/works/"+strconv.FormatInt(work,10)+"/tracks",nil)
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
	res:=httptest.NewRecorder()
	a.routes().ServeHTTP(res,req)
	if res.Code!=200{t.Fatalf("tracks=%d %s",res.Code,res.Body.String())}
	var tracks []struct{
		ID int64 `json:"id"`
		Name string `json:"name"`
		Size int64 `json:"size"`
	}
	if e:=json.Unmarshal(res.Body.Bytes(),&tracks);e!=nil{t.Fatal(e)}
	if len(tracks)!=3{t.Fatalf("tracks=%+v",tracks)}
	if tracks[0].Name=="" || tracks[0].Size!=7{t.Fatalf("offline track metadata=%+v",tracks[0])}

	a.scan(1)
	a.db.QueryRow("SELECT count(*) FROM edition_assets").Scan(&n)
	if n != 3 {
		t.Fatal("rescan lost grouping")
	}
	a.db.Exec("DELETE FROM works WHERE id=?", work)
	a.db.QueryRow("SELECT count(*) FROM assets").Scan(&n)
	if n != 3 {
		t.Fatal("ungroup deleted assets")
	}
}
func TestGroupingRejectsCrossSpace(t *testing.T) {
	a := fixture(t)
	a.initCatalogue()
	for _, space := range []string{"Adults", "Children"} {
		root := t.TempDir()
		os.WriteFile(filepath.Join(root, "Book.mp3"), []byte("x"), 0600)
		a.addSource(space, root)
	}
	a.scan(1)
	a.scan(2)
	if _, e := a.group("Mixed", []int64{1, 2}); e == nil {
		t.Fatal("cross-space grouping accepted")
	}
	var n int
	a.db.QueryRow("SELECT count(*) FROM works WHERE auto=0").Scan(&n)
	if n != 0 {
		t.Fatal("failed manual grouping committed")
	}
}

func TestScanBuildsConservativeLogicalWorks(t *testing.T) {
	a := fixture(t)
	if e := a.initCatalogue(); e != nil { t.Fatal(e) }
	root := t.TempDir()
	audioDir := filepath.Join(root, "Author", "Long Book")
	if e := os.MkdirAll(audioDir, 0700); e != nil { t.Fatal(e) }
	for _, name := range []string{"01.mp3", "02.mp3", "03.mp3"} {
		if e := os.WriteFile(filepath.Join(audioDir, name), []byte("audio"), 0600); e != nil { t.Fatal(e) }
	}
	if e := os.WriteFile(filepath.Join(root, "Novel.epub"), []byte("not-a-real-epub"), 0600); e != nil { t.Fatal(e) }
	if e := a.addSource("Main", root); e != nil { t.Fatal(e) }
	if e := a.scan(1); e != nil { t.Fatal(e) }

	var works int
	if e := a.db.QueryRow("SELECT count(*) FROM works").Scan(&works); e != nil { t.Fatal(e) }
	if works != 2 { t.Fatalf("works=%d want 2", works) }

	var title string
	var files int
	if e := a.db.QueryRow(`SELECT w.title,count(ea.asset_id) FROM works w JOIN editions e ON e.work_id=w.id JOIN edition_assets ea ON ea.edition_id=e.id WHERE e.format='Audio' GROUP BY w.id`).Scan(&title,&files); e != nil { t.Fatal(e) }
	if title != "Long Book" || files != 3 { t.Fatalf("audio work=%q files=%d", title, files) }
}


func TestServerAutoGroupingUsesWorkEvidence(t *testing.T) {
	a:=fixture(t)
	if e:=a.initCatalogue();e!=nil{t.Fatal(e)}
	root:=t.TempDir()
	for _,name:=range []string{"Dune - Part 01.mp3","Dune - Part 02.mp3","Standalone One.m4b","Standalone Two.m4b"} {
		if e:=os.WriteFile(filepath.Join(root,name),[]byte("audio"),0600);e!=nil{t.Fatal(e)}
	}
	if e:=a.addSource("Main",root);e!=nil{t.Fatal(e)}
	if e:=a.scan(1);e!=nil{t.Fatal(e)}

	rows,e:=a.db.Query(`SELECT w.title,count(ea.asset_id)
		FROM works w JOIN editions ed ON ed.work_id=w.id
		JOIN edition_assets ea ON ea.edition_id=ed.id
		WHERE ed.format='Audio' GROUP BY w.id ORDER BY w.title`)
	if e!=nil{t.Fatal(e)}
	defer rows.Close()
	counts:=map[string]int{}
	for rows.Next(){var title string;var files int;if e=rows.Scan(&title,&files);e!=nil{t.Fatal(e)};counts[title]=files}
	if e=rows.Err();e!=nil{t.Fatal(e)}
	if counts["Dune"]!=2{t.Fatalf("root multipart Dune files=%d want 2; all=%v",counts["Dune"],counts)}
	if counts["Standalone One"]!=1 || counts["Standalone Two"]!=1 {
		t.Fatalf("standalone root audiobooks were incorrectly merged: %v",counts)
	}
}

func TestNestedFolderDoesNotMergeIndependentStandaloneAudiobooks(t *testing.T) {
	a:=fixture(t)
	if e:=a.initCatalogue();e!=nil{t.Fatal(e)}
	root:=t.TempDir()
	dir:=filepath.Join(root,"Loose Audiobooks")
	if e:=os.MkdirAll(dir,0700);e!=nil{t.Fatal(e)}
	for _,name:=range []string{"Book One.m4b","Book Two.m4b"} {
		if e:=os.WriteFile(filepath.Join(dir,name),[]byte("audio"),0600);e!=nil{t.Fatal(e)}
	}
	if e:=a.addSource("Main",root);e!=nil{t.Fatal(e)}
	if e:=a.scan(1);e!=nil{t.Fatal(e)}
	var works int
	if e:=a.db.QueryRow(`SELECT count(*) FROM works w JOIN editions e ON e.work_id=w.id WHERE e.format='Audio'`).Scan(&works);e!=nil{t.Fatal(e)}
	if works!=2{t.Fatalf("works=%d want 2 independent standalone audiobooks",works)}
}

func TestWorkFiltersAndCompleteSummary(t *testing.T) {
	a:=fixture(t)
	initAllProgressForTest(t,a)
	root:=t.TempDir()
	if _,e:=a.db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Main',?,'Ready')",root);e!=nil{t.Fatal(e)}
	assets:=[]struct{
		title,author,series,format string
		available,review int
	}{
		{"Known","Author One","Series A","Audio",1,0},
		{"Unknown","","Series B","Ebook",0,1},
		{"Known Two","Author Two","Series A","Ebook",1,0},
	}
	for i,item:=range assets{
		res,e:=a.db.Exec(`INSERT INTO assets(source_id,relative_path,title,author,series,format,available,metadata_source,metadata_confidence,needs_review)
			VALUES(1,?,?,?,?,?,?, 'manual',100,?)`,
			item.title+".dat",item.title,item.author,item.series,item.format,item.available,item.review)
		if e!=nil{t.Fatal(e)}
		assetID,_:=res.LastInsertId()
		res,e=a.db.Exec("INSERT INTO works(title,space,author,series,auto,group_key) VALUES(?,?,?,?,1,?)",item.title,"Main",item.author,item.series,"test-"+item.title)
		if e!=nil{t.Fatal(e)}
		workID,_:=res.LastInsertId()
		res,e=a.db.Exec("INSERT INTO editions(work_id,format) VALUES(?,?)",workID,item.format)
		if e!=nil{t.Fatal(e)}
		editionID,_:=res.LastInsertId()
		if _,e=a.db.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(?,?,0)",assetID,editionID);e!=nil{t.Fatal(e)}
		_ = i
	}
	call:=func(path string)*httptest.ResponseRecorder{
		req:=httptest.NewRequest("GET",path,nil)
		req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
		res:=httptest.NewRecorder()
		a.routes().ServeHTTP(res,req)
		return res
	}
	res:=call("/api/works?unknownAuthor=1&availability=unavailable&format=Ebook&limit=100")
	if res.Code!=200{t.Fatalf("work filter=%d %s",res.Code,res.Body.String())}
	var works []map[string]any
	if e:=json.Unmarshal(res.Body.Bytes(),&works);e!=nil{t.Fatal(e)}
	if len(works)!=1 || works[0]["title"]!="Unknown"{t.Fatalf("filtered works=%v",works)}

	// Current clients can page large catalogues by the stable title/id cursor.
	res=call("/api/works?limit=1")
	if res.Code!=200{t.Fatalf("first cursor page=%d %s",res.Code,res.Body.String())}
	var firstPage []map[string]any
	if e:=json.Unmarshal(res.Body.Bytes(),&firstPage);e!=nil{t.Fatal(e)}
	if len(firstPage)!=1{t.Fatalf("first cursor page=%v",firstPage)}
	firstTitle,_:=firstPage[0]["title"].(string)
	firstID:=int64(firstPage[0]["id"].(float64))
	res=call("/api/works?limit=1&afterTitle="+firstTitle+"&afterId="+strconv.FormatInt(firstID,10))
	if res.Code!=200{t.Fatalf("second cursor page=%d %s",res.Code,res.Body.String())}
	var secondPage []map[string]any
	if e:=json.Unmarshal(res.Body.Bytes(),&secondPage);e!=nil{t.Fatal(e)}
	if len(secondPage)!=1 || int64(secondPage[0]["id"].(float64))==firstID { t.Fatalf("cursor did not advance: first=%v second=%v",firstPage,secondPage) }

	res=call("/api/library-summary")
	if res.Code!=200{t.Fatalf("summary=%d %s",res.Code,res.Body.String())}
	var summary struct{
		Total int `json:"total"`
		UnknownAuthors int `json:"unknownAuthors"`
		NeedsReview int `json:"needsReview"`
		Series []struct{Name string `json:"name"`;Count int `json:"count"`} `json:"series"`
		Availability []struct{Name string `json:"name"`;Count int `json:"count"`} `json:"availability"`
	}
	if e:=json.Unmarshal(res.Body.Bytes(),&summary);e!=nil{t.Fatal(e)}
	if summary.Total!=3 || summary.UnknownAuthors!=1 || summary.NeedsReview!=1 {
		t.Fatalf("summary=%+v",summary)
	}
	if len(summary.Series)!=2 || len(summary.Availability)!=2 {
		t.Fatalf("summary aggregates series=%v availability=%v",summary.Series,summary.Availability)
	}
}
