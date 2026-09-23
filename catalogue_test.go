package main

import (
	"os"
	"path/filepath"
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
	a.db.QueryRow("SELECT count(*) FROM works").Scan(&n)
	if n != 0 {
		t.Fatal("failed operation committed")
	}
}
