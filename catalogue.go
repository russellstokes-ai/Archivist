package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"unicode"
)

func (a *app) initCatalogue() error {
	_, e := a.db.Exec(`CREATE TABLE IF NOT EXISTS works(id INTEGER PRIMARY KEY,title TEXT NOT NULL,space TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS editions(id INTEGER PRIMARY KEY,work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,format TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS edition_assets(asset_id INTEGER PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,edition_id INTEGER NOT NULL REFERENCES editions(id) ON DELETE CASCADE,position INTEGER NOT NULL);
 PRAGMA user_version=2;`)
	if e != nil { return e }
	for _, stmt := range []string{
		"ALTER TABLE works ADD COLUMN author TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE works ADD COLUMN series TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE works ADD COLUMN auto INTEGER NOT NULL DEFAULT 0",
		"ALTER TABLE works ADD COLUMN group_key TEXT NOT NULL DEFAULT ''",
	} {
		if _, alterErr := a.db.Exec(stmt); alterErr != nil && !strings.Contains(strings.ToLower(alterErr.Error()), "duplicate column") {
			return alterErr
		}
	}
	return nil
}

// Natural ordering makes Track 2 precede Track 10 without modifying filenames.
func naturalLess(a, b string) bool {
	aa, bb := []rune(strings.ToLower(a)), []rune(strings.ToLower(b))
	for i, j := 0, 0; i < len(aa) && j < len(bb); {
		if unicode.IsDigit(aa[i]) && unicode.IsDigit(bb[j]) {
			x, y := i, j
			for i < len(aa) && unicode.IsDigit(aa[i]) {
				i++
			}
			for j < len(bb) && unicode.IsDigit(bb[j]) {
				j++
			}
			sa, sb := strings.TrimLeft(string(aa[x:i]), "0"), strings.TrimLeft(string(bb[y:j]), "0")
			if len(sa) != len(sb) {
				return len(sa) < len(sb)
			}
			if sa != sb {
				return sa < sb
			}
		} else {
			if aa[i] != bb[j] {
				return aa[i] < bb[j]
			}
			i++
			j++
		}
	}
	return a < b
}

type catalogueAsset struct {
	id int64
	path, title, author, series, format, space string
}

func commonValue(items []catalogueAsset, field func(catalogueAsset) string) string {
	value := ""
	for _, item := range items {
		next := strings.TrimSpace(field(item))
		if next == "" { continue }
		if value == "" { value = next; continue }
		if value != next { return "" }
	}
	return value
}

// Auto-catalogue is conservative: a nested audiobook folder is one work;
// standalone ebook/PDF/comic files are one work each. Explicit user groupings win.
func (a *app) syncAutoCatalogueLocked(sourceID int64) error {
	tx, e := a.db.Begin()
	if e != nil { return e }
	defer tx.Rollback()
	if _, e = tx.Exec(`DELETE FROM works WHERE auto=1 AND id IN (
		SELECT DISTINCT e.work_id FROM editions e
		JOIN edition_assets ea ON ea.edition_id=e.id
		JOIN assets a ON a.id=ea.asset_id WHERE a.source_id=?
	)`, sourceID); e != nil { return e }

	rows, e := tx.Query(`SELECT a.id,a.relative_path,a.title,a.author,a.series,a.format,s.space
		FROM assets a JOIN sources s ON s.id=a.source_id
		LEFT JOIN edition_assets ea ON ea.asset_id=a.id
		WHERE a.source_id=? AND a.available=1 AND ea.asset_id IS NULL
		ORDER BY a.relative_path`, sourceID)
	if e != nil { return e }
	groups := map[string][]catalogueAsset{}
	order := []string{}
	for rows.Next() {
		var x catalogueAsset
		if e = rows.Scan(&x.id,&x.path,&x.title,&x.author,&x.series,&x.format,&x.space); e != nil { rows.Close(); return e }
		key := strings.ToLower(x.format)+":"+filepath.ToSlash(x.path)
		if x.format == "Audio" {
			dir := filepath.ToSlash(filepath.Dir(x.path))
			if dir != "." && dir != "" { key = "audio-dir:"+dir }
		}
		if _, ok := groups[key]; !ok { order = append(order,key) }
		groups[key] = append(groups[key],x)
	}
	if e = rows.Err(); e != nil { rows.Close(); return e }
	rows.Close()

	for _, key := range order {
		items := groups[key]
		sort.SliceStable(items,func(i,j int)bool{return naturalLess(items[i].path,items[j].path)})
		first := items[0]
		title := first.title
		if first.format == "Audio" && strings.HasPrefix(key,"audio-dir:") {
			if folder := filepath.Base(strings.TrimPrefix(key,"audio-dir:")); folder != "." && folder != "" { title = folder }
		}
		author := commonValue(items,func(x catalogueAsset)string{return x.author})
		series := commonValue(items,func(x catalogueAsset)string{return x.series})
		res, err := tx.Exec("INSERT INTO works(title,space,author,series,auto,group_key) VALUES(?,?,?,?,1,?)", title, first.space, author, series, key)
		if err != nil { return err }
		work, err := res.LastInsertId(); if err != nil { return err }
		res, err = tx.Exec("INSERT INTO editions(work_id,format) VALUES(?,?)",work,first.format)
		if err != nil { return err }
		edition, err := res.LastInsertId(); if err != nil { return err }
		for pos,item := range items {
			if _, err = tx.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(?,?,?)",item.id,edition,pos); err != nil { return err }
		}
	}
	if e = pruneCatalogue(tx); e != nil { return e }
	return tx.Commit()
}

func (a *app) syncExistingCatalogue() error {
	a.scanMu.Lock()
	defer a.scanMu.Unlock()
	rows, e := a.db.Query("SELECT id FROM sources ORDER BY id")
	if e != nil { return e }
	ids := []int64{}
	for rows.Next() { var id int64; if e=rows.Scan(&id); e!=nil { rows.Close(); return e }; ids=append(ids,id) }
	if e=rows.Err(); e!=nil { rows.Close(); return e }
	rows.Close()
	for _, id := range ids { if e=a.syncAutoCatalogueLocked(id); e!=nil { return e } }
	return nil
}

// Grouping is explicit. Title similarity alone must not merge unrelated editions.
func (a *app) group(title string, ids []int64) (int64, error) {
	title = strings.TrimSpace(title)
	if title == "" || len(title) > 1000 || len(ids) < 1 || len(ids) > 500 {
		return 0, errors.New("enter a title and select 1–500 files")
	}
	a.scanMu.Lock()
	defer a.scanMu.Unlock()
	tx, e := a.db.Begin()
	if e != nil {
		return 0, e
	}
	defer tx.Rollback()
	type item struct {
		id int64
		path, format, space, author, series string
	}
	items := []item{}
	seen := map[int64]bool{}
	space := ""
	for _, id := range ids {
		if seen[id] {
			return 0, errors.New("duplicate file selection")
		}
		seen[id] = true
		var x item
		x.id = id
		if e = tx.QueryRow(`SELECT a.relative_path,a.format,s.space,a.author,a.series FROM assets a JOIN sources s ON s.id=a.source_id WHERE a.id=?`, id).Scan(&x.path, &x.format, &x.space, &x.author, &x.series); e != nil {
			return 0, errors.New("selected file no longer exists")
		}
		if len(items) > 0 && space != x.space {
			return 0, errors.New("group files within the same space")
		}
		space = x.space
		items = append(items, x)
	}
	if len(ids) > 0 {
		placeholders := strings.TrimRight(strings.Repeat("?,", len(ids)), ",")
		args := make([]any, len(ids))
		for i,id := range ids { args[i]=id }
		if _, e = tx.Exec("DELETE FROM works WHERE auto=1 AND id IN (SELECT DISTINCT e.work_id FROM editions e JOIN edition_assets ea ON ea.edition_id=e.id WHERE ea.asset_id IN ("+placeholders+"))", args...); e != nil {
			return 0, e
		}
	}
	author := ""; series := ""
	if len(items) > 0 {
		sameAuthor, sameSeries := true, true
		author, series = items[0].author, items[0].series
		for _, x := range items[1:] { if x.author != author { sameAuthor=false }; if x.series != series { sameSeries=false } }
		if !sameAuthor { author="" }; if !sameSeries { series="" }
	}
	res, e := tx.Exec("INSERT INTO works(title,space,author,series,auto,group_key) VALUES(?,?,?,?,0,'')", title, space, author, series)
	if e != nil {
		return 0, e
	}
	work, e := res.LastInsertId()
	if e != nil {
		return 0, e
	}
	sort.SliceStable(items, func(i, j int) bool { return naturalLess(items[i].path, items[j].path) })
	audioEdition := int64(0)
	position := 0
	for _, x := range items {
		edition := int64(0)
		if x.format == "Audio" {
			edition = audioEdition
		}
		if edition == 0 {
			res, e = tx.Exec("INSERT INTO editions(work_id,format) VALUES(?,?)", work, x.format)
			if e != nil {
				return 0, e
			}
			edition, e = res.LastInsertId()
			if e != nil {
				return 0, e
			}
			if x.format == "Audio" {
				audioEdition = edition
			}
		}
		if _, e = tx.Exec(`INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(?,?,?) ON CONFLICT(asset_id) DO UPDATE SET edition_id=excluded.edition_id,position=excluded.position`, x.id, edition, position); e != nil {
			return 0, e
		}
		position++
	}
	if e = pruneCatalogue(tx); e != nil {
		return 0, e
	}
	return work, tx.Commit()
}
func pruneCatalogue(tx *sql.Tx) error {
	_, e := tx.Exec(`DELETE FROM editions WHERE NOT EXISTS(SELECT 1 FROM edition_assets WHERE edition_id=editions.id);DELETE FROM works WHERE NOT EXISTS(SELECT 1 FROM editions WHERE work_id=works.id);`)
	return e
}
func (a *app) catalogueRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/works/group", func(w http.ResponseWriter, r *http.Request) {
		var in struct {
			Title string  `json:"title"`
			IDs   []int64 `json:"ids"`
		}
		if e := json.NewDecoder(http.MaxBytesReader(w, r.Body, 16384)).Decode(&in); e != nil {
			fail(w, 400, errors.New("invalid grouping request"))
			return
		}
		id, e := a.group(in.Title, in.IDs)
		if e != nil {
			fail(w, 400, e)
			return
		}
		reply(w, map[string]int64{"id": id})
	})
	mux.HandleFunc("GET /api/works", func(w http.ResponseWriter, r *http.Request) {
		q := "%" + r.URL.Query().Get("q") + "%"
		space, format := r.URL.Query().Get("space"), r.URL.Query().Get("format")
		limit := 60
		if n, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && n > 0 && n <= 200 { limit = n }
		offset := 0
		if n, err := strconv.Atoi(r.URL.Query().Get("offset")); err == nil && n >= 0 { offset = n }
		rows, e := a.db.Query(`SELECT w.id,w.title,w.author,w.series,w.space,
			count(DISTINCT e.id),count(ea.asset_id),
			CASE WHEN count(DISTINCT e.format)=1 THEN min(e.format) ELSE 'Mixed' END,
			sum(CASE WHEN a.available=1 THEN 1 ELSE 0 END)
			FROM works w JOIN editions e ON e.work_id=w.id
			JOIN edition_assets ea ON ea.edition_id=e.id JOIN assets a ON a.id=ea.asset_id
			WHERE (w.title LIKE ? OR w.author LIKE ? OR w.series LIKE ?)
			AND (?='' OR w.space=?) AND (?='' OR e.format=?)
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			GROUP BY w.id ORDER BY w.title,w.id LIMIT ? OFFSET ?`,
			q,q,q,space,space,format,format,who(r).Owner,who(r).ID,limit,offset)
		if e != nil { fail(w,500,e); return }
		defer rows.Close()
		out := []map[string]any{}
		for rows.Next() {
			var id, editions, files, available int64
			var title, author, series, workSpace, workFormat string
			if e=rows.Scan(&id,&title,&author,&series,&workSpace,&editions,&files,&workFormat,&available); e != nil { fail(w,500,e); return }
			out=append(out,map[string]any{"id":id,"title":title,"author":author,"series":series,"space":workSpace,"editions":editions,"files":files,"format":workFormat,"available":available>0})
		}
		reply(w,out)
	})
	mux.HandleFunc("GET /api/library-summary", func(w http.ResponseWriter, r *http.Request) {
		var total int
		_ = a.db.QueryRow(`SELECT count(DISTINCT w.id) FROM works w JOIN editions e ON e.work_id=w.id JOIN edition_assets ea ON ea.edition_id=e.id WHERE ? OR w.space IN (SELECT space FROM grants WHERE profile_id=?)`,who(r).Owner,who(r).ID).Scan(&total)
		formats := []map[string]any{}
		rows, e := a.db.Query(`SELECT e.format,count(DISTINCT w.id) FROM works w JOIN editions e ON e.work_id=w.id WHERE ? OR w.space IN (SELECT space FROM grants WHERE profile_id=?) GROUP BY e.format ORDER BY count(DISTINCT w.id) DESC,e.format`,who(r).Owner,who(r).ID)
		if e == nil { for rows.Next(){var name string;var count int;if rows.Scan(&name,&count)==nil{formats=append(formats,map[string]any{"name":name,"count":count})}};rows.Close() }
		spaces := []map[string]any{}
		rows, e = a.db.Query(`SELECT w.space,count(*) FROM works w WHERE ? OR w.space IN (SELECT space FROM grants WHERE profile_id=?) GROUP BY w.space ORDER BY count(*) DESC,w.space`,who(r).Owner,who(r).ID)
		if e == nil { for rows.Next(){var name string;var count int;if rows.Scan(&name,&count)==nil{spaces=append(spaces,map[string]any{"name":name,"count":count})}};rows.Close() }
		authors := []map[string]any{}
		rows, e = a.db.Query(`SELECT w.author,count(*) FROM works w WHERE w.author<>'' AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?)) GROUP BY w.author ORDER BY count(*) DESC,w.author LIMIT 12`,who(r).Owner,who(r).ID)
		if e == nil { for rows.Next(){var name string;var count int;if rows.Scan(&name,&count)==nil{authors=append(authors,map[string]any{"name":name,"count":count})}};rows.Close() }
		reply(w,map[string]any{"total":total,"formats":formats,"spaces":spaces,"authors":authors})
	})
	mux.HandleFunc("GET /api/works/{id}/tracks", func(w http.ResponseWriter, r *http.Request) {
		rows, e := a.db.Query(`SELECT a.id,a.title,a.format,e.id,a.available FROM editions e JOIN edition_assets ea ON ea.edition_id=e.id JOIN assets a ON a.id=ea.asset_id WHERE e.work_id=? ORDER BY e.id,ea.position`, r.PathValue("id"))
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer rows.Close()
		out := []map[string]any{}
		for rows.Next() {
			var id, edition int64
			var title, format string
			var available bool
			if e = rows.Scan(&id, &title, &format, &edition, &available); e != nil {
				fail(w, 500, e)
				return
			}
			out = append(out, map[string]any{"id": id, "title": title, "format": format, "edition": edition, "available": available})
		}
		reply(w, out)
	})
	mux.HandleFunc("DELETE /api/works/{id}", func(w http.ResponseWriter, r *http.Request) {
		id, e := strconv.ParseInt(r.PathValue("id"), 10, 64)
		if e != nil {
			fail(w, 400, e)
			return
		}
		_, e = a.db.Exec("DELETE FROM works WHERE id=?", id)
		if e != nil {
			fail(w, 500, e)
			return
		}
		reply(w, map[string]bool{"ok": true})
	})
}
