package main

import (
	"database/sql"
	"net/url"
	"path/filepath"
	"testing"
)

func TestWindowsSQLiteFileURL(t *testing.T) {
	p := filepath.Join(t.TempDir(), "uri.db")
	u := url.URL{Scheme: "file", Path: "/" + filepath.ToSlash(p)}
	db, err := sql.Open("sqlite", u.String())
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	if _, err = db.Exec("CREATE TABLE test(id INTEGER)"); err != nil {
		t.Fatal(err)
	}
}
