package main

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestLookupTitleUsesParentForWeakPartName(t *testing.T) {
	target := metadataEnrichTarget{Title:"Part 36", Relative:"Ursula K Le Guin/Earthsea/A Wizard of Earthsea/Part 36.pdf"}
	if got := lookupTitleForTarget(target); got != "A Wizard of Earthsea" {
		t.Fatalf("lookup title = %q", got)
	}
}

func TestCandidateScoreRewardsStrongTitleAndAuthor(t *testing.T) {
	target := metadataEnrichTarget{Title:"A Wizard of Earthsea", Author:"Ursula K Le Guin", Format:"Ebook"}
	good := onlineMetadataCandidate{Title:"A Wizard of Earthsea", Author:"Ursula K. Le Guin"}
	bad := onlineMetadataCandidate{Title:"The Left Hand of Darkness", Author:"Ursula K. Le Guin"}
	if candidateScore(target,good) <= candidateScore(target,bad) {
		t.Fatal("expected matching title to score higher")
	}
	if candidateScore(target,good) < 80 {
		t.Fatalf("good candidate score too low: %d", candidateScore(target,good))
	}
}

func TestOpenLibraryCandidates(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("title") != "A Wizard of Earthsea" {
			t.Fatalf("unexpected title query: %q", r.URL.Query().Get("title"))
		}
		w.Header().Set("Content-Type","application/json")
		w.Write([]byte(`{"docs":[{"title":"A Wizard of Earthsea","author_name":["Ursula K. Le Guin"],"subject":["Fantasy"]}]}`))
	}))
	defer server.Close()
	old := openLibrarySearchURL
	openLibrarySearchURL = server.URL
	defer func(){ openLibrarySearchURL = old }()
	items, err := openLibraryCandidates(context.Background(), metadataHTTPClient(), metadataEnrichTarget{Title:"A Wizard of Earthsea",Author:"Ursula K Le Guin"})
	if err != nil { t.Fatal(err) }
	if len(items) != 1 || items[0].Author != "Ursula K. Le Guin" || items[0].Genre != "Fantasy" {
		t.Fatalf("unexpected candidates: %#v", items)
	}
}

func TestGoogleBooksCandidates(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type","application/json")
		w.Write([]byte(`{"items":[{"volumeInfo":{"title":"Watchmen","authors":["Alan Moore","Dave Gibbons"],"categories":["Comics & Graphic Novels"]}}]}`))
	}))
	defer server.Close()
	old := googleBooksSearchURL
	googleBooksSearchURL = server.URL
	defer func(){ googleBooksSearchURL = old }()
	items, err := googleBooksCandidates(context.Background(), metadataHTTPClient(), metadataEnrichTarget{Title:"Watchmen",Format:"Comic"})
	if err != nil { t.Fatal(err) }
	if len(items) != 1 || items[0].Title != "Watchmen" || items[0].Genre != "Comics & Graphic Novels" {
		t.Fatalf("unexpected candidates: %#v", items)
	}
}

func TestAppendMetadataSourceIsStable(t *testing.T) {
	got := appendMetadataSource("path+embedded","Google Books")
	if got != "path+embedded+online:google-books" { t.Fatalf("got %q",got) }
	if again := appendMetadataSource(got,"Google Books"); again != got { t.Fatalf("duplicated provider: %q",again) }
}


func TestCandidateScoreExactISBNWins(t *testing.T) {
	target:=metadataEnrichTarget{Title:"Unhelpful scan title",ISBN:"9780061120084",Format:"Ebook"}
	candidate:=onlineMetadataCandidate{Title:"To Kill a Mockingbird",ISBN:"978-0-06-112008-4"}
	if score:=candidateScore(target,candidate);score!=100{t.Fatalf("isbn score=%d",score)}
}

func TestMetadataJobsAreDurableAndAutomaticSettingIsRespected(t *testing.T) {
	a:=fixture(t)
	if err:=a.initMetadataOnline();err!=nil{t.Fatal(err)}
	root:=t.TempDir()
	if err:=os.WriteFile(filepath.Join(root,"Book.pdf"),[]byte("pdf"),0600);err!=nil{t.Fatal(err)}
	if err:=a.addSource("Main",root);err!=nil{t.Fatal(err)}
	queued,err:=a.enqueueAutomaticMetadataEnrichment(1)
	if err!=nil||!queued{t.Fatalf("queued=%v err=%v",queued,err)}
	var jobs int
	if err=a.db.QueryRow("SELECT count(*) FROM metadata_jobs").Scan(&jobs);err!=nil{t.Fatal(err)}
	if jobs!=1{t.Fatalf("jobs=%d",jobs)}
	if _,err=a.db.Exec("UPDATE metadata_jobs SET state='running'");err!=nil{t.Fatal(err)}
	if err=a.initMetadataJobs();err!=nil{t.Fatal(err)}
	var state string
	if err=a.db.QueryRow("SELECT state FROM metadata_jobs").Scan(&state);err!=nil{t.Fatal(err)}
	if state!="queued"{t.Fatalf("state=%q",state)}
	if _,err=a.db.Exec("UPDATE metadata_provider_settings SET auto_enrich=0 WHERE id=1");err!=nil{t.Fatal(err)}
	if queued,err=a.enqueueAutomaticMetadataEnrichment(1);err!=nil||queued{t.Fatalf("disabled auto queued=%v err=%v",queued,err)}
}

func TestRichGoogleEnrichmentPersistsAndSkipsUnchangedAutomaticLookup(t *testing.T) {
	a:=fixture(t)
	if err:=a.initMetadataOnline();err!=nil{t.Fatal(err)}
	root:=t.TempDir()
	if err:=os.WriteFile(filepath.Join(root,"Watchmen.pdf"),[]byte("pdf"),0600);err!=nil{t.Fatal(err)}
	if err:=a.addSource("Main",root);err!=nil{t.Fatal(err)}
	if err:=a.scan(1);err!=nil{t.Fatal(err)}

	server:=httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){
		w.Header().Set("Content-Type","application/json")
		w.Write([]byte(`{"items":[{"volumeInfo":{"title":"Watchmen","authors":["Alan Moore","Dave Gibbons"],"categories":["Comics & Graphic Novels"],"publisher":"DC Comics","publishedDate":"1987-09-01","description":"A landmark graphic novel.","language":"en","industryIdentifiers":[{"type":"ISBN_13","identifier":"9780930289232"}]}}]}`))
	}))
	defer server.Close()
	oldGoogle:=googleBooksSearchURL
	googleBooksSearchURL=server.URL
	defer func(){googleBooksSearchURL=oldGoogle}()
	if _,err:=a.db.Exec("UPDATE metadata_provider_settings SET openlibrary_enabled=0,googlebooks_enabled=1,minimum_match=72 WHERE id=1");err!=nil{t.Fatal(err)}

	result,err:=a.enrichMetadata(context.Background(),1,10)
	if err!=nil{t.Fatal(err)}
	if result.Updated!=1{t.Fatalf("result=%+v",result)}

	var author,genre,publisher,isbn,language,description,source string
	var year int
	if err=a.db.QueryRow("SELECT author,genre,published_year,publisher,isbn,language,description,metadata_source FROM assets WHERE source_id=1").
		Scan(&author,&genre,&year,&publisher,&isbn,&language,&description,&source);err!=nil{t.Fatal(err)}
	if author!="Alan Moore, Dave Gibbons"||genre!="Comics & Graphic Novels"||year!=1987||publisher!="DC Comics"||isbn!="9780930289232"||language!="en"||description!="A landmark graphic novel."{
		t.Fatalf("rich metadata author=%q genre=%q year=%d publisher=%q isbn=%q language=%q description=%q",author,genre,year,publisher,isbn,language,description)
	}
	if !strings.Contains(source,"online:google-books"){t.Fatalf("source=%q",source)}
	targets,err:=a.metadataEnrichTargets(1,10,false)
	if err!=nil{t.Fatal(err)}
	if len(targets)!=0{t.Fatalf("unchanged asset scheduled again: %+v",targets)}
}
