package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCatalogueV3MigratesLegacyLibraryWithoutDataLoss(t *testing.T) {
	path := filepath.Join(t.TempDir(), "legacy.db")
	db, err := openDB(path)
	if err != nil {
		t.Fatal(err)
	}
	a := &app{db: db}
	if _, err = db.Exec(`
		CREATE TABLE works(id INTEGER PRIMARY KEY,title TEXT NOT NULL,space TEXT NOT NULL,author TEXT NOT NULL DEFAULT '',series TEXT NOT NULL DEFAULT '',auto INTEGER NOT NULL DEFAULT 0,group_key TEXT NOT NULL DEFAULT '');
		CREATE TABLE editions(id INTEGER PRIMARY KEY,work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,format TEXT NOT NULL);
		CREATE TABLE edition_assets(asset_id INTEGER PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,edition_id INTEGER NOT NULL REFERENCES editions(id) ON DELETE CASCADE,position INTEGER NOT NULL);
		INSERT INTO sources(id,space,path,status) VALUES(1,'Books','/library','Legacy');
		INSERT INTO assets(id,source_id,relative_path,title,author,series,format,available) VALUES(1,1,'Tolkien/Hobbit.epub','The Hobbit','J.R.R. Tolkien','Middle-earth','Ebook',1);
		INSERT INTO works(id,title,space,author,series,auto,group_key) VALUES(1,'The Hobbit','Books','J.R.R. Tolkien','Middle-earth',0,'');
		INSERT INTO editions(id,work_id,format) VALUES(1,1,'Ebook');
		INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(1,1,0);
	`); err != nil {
		t.Fatal(err)
	}
	if err = a.initCatalogue(); err != nil {
		t.Fatal(err)
	}

	var version int
	if err = db.QueryRow("PRAGMA user_version").Scan(&version); err != nil || version != catalogueSchemaVersion {
		t.Fatalf("schema version=%d err=%v", version, err)
	}
	var title string
	if err = db.QueryRow("SELECT title FROM works WHERE id=1").Scan(&title); err != nil || title != "The Hobbit" {
		t.Fatalf("legacy work lost: %q err=%v", title, err)
	}
	var author string
	if err = db.QueryRow(`SELECT a.name FROM authors a JOIN work_authors wa ON wa.author_id=a.id WHERE wa.work_id=1`).Scan(&author); err != nil || author != "J.R.R. Tolkien" {
		t.Fatalf("author backfill=%q err=%v", author, err)
	}
	var series string
	if err = db.QueryRow(`SELECT s.name FROM series_entities s JOIN work_series ws ON ws.series_id=s.id WHERE ws.work_id=1`).Scan(&series); err != nil || series != "Middle-earth" {
		t.Fatalf("series backfill=%q err=%v", series, err)
	}
	var space string
	if err = db.QueryRow("SELECT space FROM work_spaces WHERE work_id=1").Scan(&space); err != nil || space != "Books" {
		t.Fatalf("derived work space=%q err=%v", space, err)
	}

	db.Close()
	db, err = openDB(path)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	if err = db.QueryRow("PRAGMA user_version").Scan(&version); err != nil || version != catalogueSchemaVersion {
		t.Fatalf("openDB reset schema version=%d err=%v", version, err)
	}
}

func TestCatalogueV3NormalizedEntitiesStayInSyncWithScan(t *testing.T) {
	a := fixture(t)
	root := t.TempDir()
	dir := filepath.Join(root, "Ursula K. Le Guin", "Earthsea")
	if err := os.MkdirAll(dir, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "A Wizard of Earthsea.epub"), []byte("not-a-real-epub"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := a.addSource("Library", root); err != nil {
		t.Fatal(err)
	}
	if err := a.scan(1); err != nil {
		t.Fatal(err)
	}
	var author, series string
	if err := a.db.QueryRow(`SELECT a.name,s.name
		FROM works w
		JOIN work_authors wa ON wa.work_id=w.id
		JOIN authors a ON a.id=wa.author_id
		JOIN work_series ws ON ws.work_id=w.id
		JOIN series_entities s ON s.id=ws.series_id
		WHERE w.title='A Wizard of Earthsea'`).Scan(&author, &series); err != nil {
		t.Fatal(err)
	}
	if author != "Ursula K. Le Guin" || series != "Earthsea" {
		t.Fatalf("normalized entities author=%q series=%q", author, series)
	}
}
