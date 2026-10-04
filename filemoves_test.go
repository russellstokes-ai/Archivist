package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func readyMoveIDs(result fileMoveBatchResult) []string {
	ids:=[]string{}
	for _,item:=range result.Items {
		if item.Status=="ready" && item.Move!=nil && item.Move.ID!="" {
			ids=append(ids,item.Move.ID)
		}
	}
	return ids
}

func TestRecoverableFileMoves(t *testing.T) {
	a := fixture(t)
	a.initMoves()
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "Book.mp3"), []byte("private audio"), 0600)
	a.addSource("Books", root)
	a.scan(1)
	for _, target := range []string{"../escape.mp3", "/tmp/escape.mp3", "Book.mp3", "Other.pdf"} {
		if _, e := a.previewMove(1, target); e == nil {
			t.Fatal("unsafe preview", target)
		}
	}
	m, e := a.previewMove(1, "Author/Book.mp3")
	if e != nil {
		t.Fatal(e)
	}
	if _, e = os.Stat(filepath.Join(root, "Author")); !os.IsNotExist(e) {
		t.Fatal("preview modified files")
	}
	os.Mkdir(filepath.Join(root, "Author"), 0750)
	os.WriteFile(filepath.Join(root, "Author/Book.mp3"), []byte("collision"), 0600)
	if _, e = a.applyMove(m.ID); e == nil {
		t.Fatal("overwrote collision")
	}
	os.Remove(filepath.Join(root, "Author/Book.mp3"))
	// Simulate power loss after destination link, before catalogue commit.
	a.db.Exec("UPDATE file_moves SET state='applying' WHERE id=?", m.ID)
	os.Link(filepath.Join(root, "Book.mp3"), filepath.Join(root, "Author/Book.mp3"))
	if e = a.scan(1); e == nil {
		t.Fatal("scan permitted during recovery")
	}
	if m, e = a.applyMove(m.ID); e != nil || m.State != "done" {
		t.Fatal(m, e)
	}
	if _, e = os.Stat(filepath.Join(root, "Book.mp3")); !os.IsNotExist(e) {
		t.Fatal("old file remains")
	}
	if b, e := os.ReadFile(filepath.Join(root, "Author/Book.mp3")); e != nil || string(b) != "private audio" {
		t.Fatal("data loss")
	}
	if _, e = a.applyMove(m.ID); e != nil {
		t.Fatal("retry not idempotent", e)
	}
	undo, e := a.previewMove(1, "Book.mp3")
	if e != nil {
		t.Fatal(e)
	}
	if _, e = a.applyMove(undo.ID); e != nil {
		t.Fatal(e)
	}
	if e = a.scan(1); e != nil {
		t.Fatal(e)
	}
	var n int
	a.db.QueryRow("SELECT count(*) FROM assets").Scan(&n)
	if n != 1 {
		t.Fatal("asset duplicated")
	}
	m, e = a.previewMove(1, "Changed.mp3")
	if e != nil {
		t.Fatal(e)
	}
	os.WriteFile(filepath.Join(root, "Book.mp3"), []byte("changed"), 0600)
	if _, e = a.applyMove(m.ID); e == nil {
		t.Fatal("stale preview accepted")
	}
}

func TestSortTemplatePaths(t *testing.T) {
	got, e := sortTemplatePath("author-series-title", "Dune: Messiah?", "Frank/Herbert", "Dune <Cycle>", "EPUB", "uploads/dune.epub")
	if e != nil {
		t.Fatal(e)
	}
	want := filepath.Join("Frank Herbert", "Dune Cycle", "Dune Messiah.epub")
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
	got, e = sortTemplatePath("format-author-title", "Book", "", "", "Audio", "Book.m4b")
	if e != nil {
		t.Fatal(e)
	}
	want = filepath.Join("Audio", "Unknown", "Book.m4b")
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
	if _, e = sortTemplatePath("bad", "Book", "Author", "", "Audio", "Book.m4b"); e == nil {
		t.Fatal("unknown template accepted")
	}
}

func TestBatchTemplatePreviewAndApply(t *testing.T) {
	a := fixture(t)
	a.initMoves()
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "One.mp3"), []byte("one"), 0600)
	os.WriteFile(filepath.Join(root, "Two.mp3"), []byte("two"), 0600)
	if e := a.addSource("Audio", root); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}
	a.db.Exec("UPDATE assets SET author='Ada',needs_review=0,metadata_source='manual',metadata_confidence=100 WHERE id IN (1,2)")
	out := a.previewMoveTemplateBatch([]int64{1, 2}, "author-title")
	if out.OK != 2 || out.Failed != 0 {
		t.Fatalf("preview batch: %+v", out)
	}
	out = a.applyMoveBatch(readyMoveIDs(out))
	if out.OK != 2 || out.Failed != 0 {
		t.Fatalf("apply batch: %+v", out)
	}
	for _, name := range []string{filepath.Join("Ada", "One.mp3"), filepath.Join("Ada", "Two.mp3")} {
		if _, e := os.Stat(filepath.Join(root, name)); e != nil {
			t.Fatal(name, e)
		}
	}
}

func TestBatchTemplateRejectsDuplicateDestinations(t *testing.T) {
	a := fixture(t)
	a.initMoves()
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "a.mp3"), []byte("a"), 0600)
	os.WriteFile(filepath.Join(root, "b.mp3"), []byte("b"), 0600)
	if e := a.addSource("Audio", root); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}
	a.db.Exec("UPDATE assets SET title='Same',author='Ada',needs_review=0,metadata_source='manual',metadata_confidence=100 WHERE id IN (1,2)")
	out := a.previewMoveTemplateBatch([]int64{1, 2}, "author-title")
	if out.OK != 0 || out.Failed != 2 {
		t.Fatalf("duplicate handling: %+v", out)
	}
	if len(out.Items)!=2 || out.Items[0].Status!="conflict" || out.Items[1].Status!="conflict" {
		t.Fatalf("duplicate destinations must mark every affected item conflict: %+v",out.Items)
	}
	var n int
	a.db.QueryRow("SELECT count(*) FROM file_moves WHERE state='preview'").Scan(&n)
	if n != 0 {
		t.Fatalf("created unsafe duplicate previews: %d", n)
	}
}

func TestCopyFallbackWhenHardlinkUnavailable(t *testing.T) {
	a := fixture(t)
	a.initMoves()
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "Book.mp3"), []byte("copy fallback"), 0600)
	if e := a.addSource("Audio", root); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}
	m, e := a.previewMove(1, "Sorted/Book.mp3")
	if e != nil {
		t.Fatal(e)
	}
	oldLink := moveLinkFile
	moveLinkFile = func(root *os.Root, from, to string) error { return os.ErrInvalid }
	defer func() { moveLinkFile = oldLink }()
	m, e = a.applyMove(m.ID)
	if e != nil || m.State != "done" {
		t.Fatal(m, e)
	}
	if _, e = os.Stat(filepath.Join(root, "Book.mp3")); !os.IsNotExist(e) {
		t.Fatal("old file remains after copy fallback")
	}
	if b, e := os.ReadFile(filepath.Join(root, "Sorted/Book.mp3")); e != nil || string(b) != "copy fallback" {
		t.Fatal("copied data mismatch")
	}
}

func TestBatchApplyRecoversLinkedJournal(t *testing.T) {
	a := fixture(t)
	a.initMoves()
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "One.mp3"), []byte("one"), 0600)
	os.WriteFile(filepath.Join(root, "Two.mp3"), []byte("two"), 0600)
	if e := a.addSource("Audio", root); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}
	a.db.Exec("UPDATE assets SET author='Ada',needs_review=0,metadata_source='manual',metadata_confidence=100 WHERE id IN (1,2)")
	out := a.previewMoveTemplateBatch([]int64{1, 2}, "author-title")
	if out.OK != 2 || out.Failed != 0 {
		t.Fatalf("preview batch: %+v", out)
	}
	os.Mkdir(filepath.Join(root, "Ada"), 0750)
	os.Link(filepath.Join(root, "One.mp3"), filepath.Join(root, "Ada/One.mp3"))
	a.db.Exec("UPDATE assets SET relative_path=? WHERE id=1", filepath.Join("Ada", "One.mp3"))
	a.db.Exec("UPDATE file_moves SET state='linked' WHERE asset=1")
	out = a.applyMoveBatch(readyMoveIDs(out))
	if out.OK != 2 || out.Failed != 0 {
		t.Fatalf("apply recovery batch: %+v", out)
	}
	for _, name := range []string{filepath.Join("Ada", "One.mp3"), filepath.Join("Ada", "Two.mp3")} {
		if _, e := os.Stat(filepath.Join(root, name)); e != nil {
			t.Fatal(name, e)
		}
	}
	if _, e := os.Stat(filepath.Join(root, "One.mp3")); !os.IsNotExist(e) {
		t.Fatal("linked recovery did not remove old One.mp3")
	}
}


func TestTemplateOrganisationRequiresReviewedMetadata(t *testing.T) {
	a := fixture(t)
	a.initMoves()
	root := t.TempDir()
	if e := os.WriteFile(filepath.Join(root, "Mystery.epub"), []byte("book"), 0600); e != nil {
		t.Fatal(e)
	}
	if e := a.addSource("Books", root); e != nil {
		t.Fatal(e)
	}
	if e := a.scan(1); e != nil {
		t.Fatal(e)
	}
	out := a.previewMoveTemplateBatch([]int64{1}, "author-title")
	if out.OK != 0 || out.Failed != 1 {
		t.Fatalf("unreviewed metadata organised: %+v", out)
	}
	if len(out.Items) != 1 || out.Items[0].Status!="review" || out.Items[0].Error != "review metadata before organising this file" {
		t.Fatalf("unexpected review failure: %+v", out)
	}
	if out.Items[0].From!="Mystery.epub" || out.Items[0].To=="" {
		t.Fatalf("review preview must still show current and proposed paths: %+v",out.Items[0])
	}
	a.db.Exec("UPDATE assets SET title='Mystery',author='Known Author',needs_review=0,metadata_source='manual',metadata_confidence=100 WHERE id=1")
	out = a.previewMoveTemplateBatch([]int64{1}, "author-title")
	if out.OK != 1 || out.Failed != 0 {
		t.Fatalf("reviewed metadata not organisable: %+v", out)
	}
}


func TestPendingMovePaginationAndCrossBatchCollision(t *testing.T) {
	a:=fixture(t)
	if e:=a.initMoves();e!=nil{t.Fatal(e)}
	root:=t.TempDir()
	for _,name:=range []string{"One.epub","Two.epub"} {
		if e:=os.WriteFile(filepath.Join(root,name),[]byte(name),0600);e!=nil{t.Fatal(e)}
	}
	if e:=a.addSource("Main",root);e!=nil{t.Fatal(e)}
	if e:=a.scan(1);e!=nil{t.Fatal(e)}
	a.db.Exec("UPDATE assets SET author='Author',needs_review=0,metadata_source='manual',metadata_confidence=100")
	first,e:=a.previewMove(1,"Author/Same.epub")
	if e!=nil{t.Fatal(e)}
	if _,e=a.previewMove(2,"Author/Same.epub");e==nil{
		t.Fatal("cross-batch duplicate destination accepted")
	}
	if _,e=a.db.Exec("DELETE FROM file_moves");e!=nil{t.Fatal(e)}
	for i:=0;i<510;i++{
		if _,e=a.db.Exec("INSERT INTO file_moves(id,asset,root,old_path,new_path,hash,state) VALUES(?,?,?,?,?,?,?)",
			fmt.Sprintf("move-%03d",i),1,root,"One.epub",fmt.Sprintf("Target-%03d.epub",i),"hash","preview");e!=nil{t.Fatal(e)}
	}
	req:=httptest.NewRequest("GET","/api/file-moves?state=pending&limit=500&offset=500",nil)
	req.AddCookie(&http.Cookie{Name:"archivist_session",Value:"test-key"})
	res:=httptest.NewRecorder()
	a.routes().ServeHTTP(res,req)
	if res.Code!=200{t.Fatalf("pending page=%d %s",res.Code,res.Body.String())}
	var page []fileMove
	if e=json.Unmarshal(res.Body.Bytes(),&page);e!=nil{t.Fatal(e)}
	if len(page)!=10{t.Fatalf("pending second page=%d want 10",len(page))}
	_ = first
}


func TestCopyFailureRetainsOriginalAndCatalogue(t *testing.T) {
	a:=fixture(t)
	if e:=a.initMoves();e!=nil{t.Fatal(e)}
	root:=t.TempDir()
	original:=filepath.Join(root,"Book.mp3")
	if e:=os.WriteFile(original,[]byte("retain me"),0600);e!=nil{t.Fatal(e)}
	if e:=a.addSource("Audio",root);e!=nil{t.Fatal(e)}
	if e:=a.scan(1);e!=nil{t.Fatal(e)}
	m,e:=a.previewMove(1,"Sorted/Book.mp3");if e!=nil{t.Fatal(e)}
	oldLink,oldCopy:=moveLinkFile,moveCopyFile
	moveLinkFile=func(root *os.Root,from,to string)error{return errors.New("cross-device link")}
	moveCopyFile=func(root *os.Root,from,to,wantHash string)error{return errors.New("no space left on device")}
	defer func(){moveLinkFile=oldLink;moveCopyFile=oldCopy}()
	if _,e=a.applyMove(m.ID);e==nil{t.Fatal("copy failure unexpectedly succeeded")}
	if b,e:=os.ReadFile(original);e!=nil||string(b)!="retain me"{t.Fatalf("original lost after copy failure: %q %v",string(b),e)}
	if _,e:=os.Stat(filepath.Join(root,"Sorted/Book.mp3"));!os.IsNotExist(e){t.Fatal("partial destination survived failed copy")}
	var rel string
	if e:=a.db.QueryRow("SELECT relative_path FROM assets WHERE id=1").Scan(&rel);e!=nil{t.Fatal(e)}
	if rel!="Book.mp3"{t.Fatalf("catalogue moved despite failed copy: %q",rel)}
}


func TestSeriesNumberAwareSortTemplate(t *testing.T) {
	got, e := sortTemplatePathWithSeriesNumber("author-series-title", "Dune Messiah", "Frank Herbert", "Dune", "Ebook", "Dune Messiah.epub", 2)
	if e != nil { t.Fatal(e) }
	want := filepath.Join("Frank Herbert", "Dune", "02 - Dune Messiah.epub")
	if got != want { t.Fatalf("got %q want %q", got, want) }

	got, e = sortTemplatePathWithSeriesNumber("format-author-series-title", "A Novella", "Author", "Saga", "Ebook", "A Novella.epub", 2.5)
	if e != nil { t.Fatal(e) }
	want = filepath.Join("Ebook", "Author", "Saga", "2.5 - A Novella.epub")
	if got != want { t.Fatalf("decimal series got %q want %q", got, want) }
}

func TestOrganisationPreviewFourStatesAndExplicitApply(t *testing.T) {
	a:=fixture(t)
	if e:=a.initMoves();e!=nil{t.Fatal(e)}
	root:=t.TempDir()
	if e:=os.MkdirAll(filepath.Join(root,"Author"),0750);e!=nil{t.Fatal(e)}
	for _,name:=range []string{"Ready.epub","Review.epub","Conflict.epub"} {
		if e:=os.WriteFile(filepath.Join(root,name),[]byte(name),0600);e!=nil{t.Fatal(e)}
	}
	if e:=os.WriteFile(filepath.Join(root,"Author","Already.epub"),[]byte("already"),0600);e!=nil{t.Fatal(e)}
	if e:=a.addSource("Books",root);e!=nil{t.Fatal(e)}
	if e:=a.scan(1);e!=nil{t.Fatal(e)}

	type row struct{id int64;path string}
	rows,err:=a.db.Query("SELECT id,relative_path FROM assets ORDER BY id")
	if err!=nil{t.Fatal(err)}
	ids:=map[string]int64{}
	for rows.Next(){var r row;if err=rows.Scan(&r.id,&r.path);err!=nil{t.Fatal(err)};ids[filepath.ToSlash(r.path)]=r.id}
	rows.Close()

	for path,id:=range ids {
		switch path {
		case "Ready.epub":
			a.db.Exec("UPDATE assets SET title='Ready',author='Author',needs_review=0,metadata_source='manual',metadata_confidence=100 WHERE id=?",id)
		case "Conflict.epub":
			a.db.Exec("UPDATE assets SET title='Taken',author='Author',needs_review=0,metadata_source='manual',metadata_confidence=100 WHERE id=?",id)
		case "Author/Already.epub":
			a.db.Exec("UPDATE assets SET title='Already',author='Author',needs_review=0,metadata_source='manual',metadata_confidence=100 WHERE id=?",id)
		}
	}
	if err:=os.WriteFile(filepath.Join(root,"Author","Taken.epub"),[]byte("occupied"),0600);err!=nil{t.Fatal(err)}

	requested:=[]int64{ids["Ready.epub"],ids["Review.epub"],ids["Conflict.epub"],ids["Author/Already.epub"]}
	out:=a.previewMoveTemplateBatch(requested,"author-title")
	statuses:=map[int64]string{}
	for _,item:=range out.Items {
		statuses[item.Asset]=item.Status
		if item.From==""||item.To==""{t.Fatalf("preview paths missing: %+v",item)}
	}
	if statuses[ids["Ready.epub"]]!="ready"{t.Fatalf("ready=%q",statuses[ids["Ready.epub"]])}
	if statuses[ids["Review.epub"]]!="review"{t.Fatalf("review=%q",statuses[ids["Review.epub"]])}
	if statuses[ids["Conflict.epub"]]!="conflict"{t.Fatalf("conflict=%q",statuses[ids["Conflict.epub"]])}
	if statuses[ids["Author/Already.epub"]]!="same"{t.Fatalf("same=%q",statuses[ids["Author/Already.epub"]])}

	empty:=a.applyMoveBatch(nil)
	if empty.OK!=0||empty.Failed!=1||len(empty.Items)!=1||!strings.Contains(empty.Items[0].Error,"select at least one ready move"){
		t.Fatalf("empty selection must not apply pending moves: %+v",empty)
	}
	if _,err:=os.Stat(filepath.Join(root,"Ready.epub"));err!=nil{t.Fatal("empty apply changed files",err)}

	readyIDs:=readyMoveIDs(out)
	if len(readyIDs)!=1{t.Fatalf("only one ready move should be selectable: %v",readyIDs)}
	applied:=a.applyMoveBatch(readyIDs)
	if applied.OK!=1||applied.Failed!=0{t.Fatalf("explicit ready apply=%+v",applied)}
	if _,err:=os.Stat(filepath.Join(root,"Author","Ready.epub"));err!=nil{t.Fatal("selected ready move not applied",err)}
	if _,err:=os.Stat(filepath.Join(root,"Review.epub"));err!=nil{t.Fatal("review item changed",err)}
	if _,err:=os.Stat(filepath.Join(root,"Conflict.epub"));err!=nil{t.Fatal("conflict item changed",err)}
	if _,err:=os.Stat(filepath.Join(root,"Author","Already.epub"));err!=nil{t.Fatal("already-organised item changed",err)}
}
