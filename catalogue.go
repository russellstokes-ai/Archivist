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
 CREATE TABLE IF NOT EXISTS app_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 PRAGMA user_version=2;`)
	if e != nil { return e }
	for _, stmt := range []string{
		"ALTER TABLE works ADD COLUMN author TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE works ADD COLUMN series TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE works ADD COLUMN genre TEXT NOT NULL DEFAULT ''",
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
	path, title, author, series, genre, format, space string
	isbn, asin string
	needsReview bool
}

func catalogueIdentityPart(value string) string {
	value=strings.ToLower(strings.TrimSpace(value))
	value=strings.Join(strings.Fields(value)," ")
	return value
}

func autoAudioGroupKey(sourceID int64,x catalogueAsset) string {
	prefix:="source:"+strconv.FormatInt(sourceID,10)+":"
	dir:=filepath.ToSlash(filepath.Dir(x.path))
	base:=strings.TrimSuffix(filepath.Base(x.path),filepath.Ext(x.path))
	if dir!="." && dir!="" && (genericAudioTrackLabel(base)||leadingNumberedAudioTrack(base)||audioMultipartWorkTitle(base)!="") {
		return prefix+"audio-dir:"+dir
	}
	id:=strings.TrimSpace(x.asin)
	if id=="" { id=strings.TrimSpace(x.isbn) }
	if id!="" {
		return prefix+"audio-id:"+strings.ToLower(id)
	}
	if family:=audioMultipartWorkTitle(base);family!="" {
		return prefix+"audio-family:"+catalogueIdentityPart(family)+"|"+catalogueIdentityPart(x.author)
	}
	if !x.needsReview && strings.TrimSpace(x.title)!="" && strings.TrimSpace(x.author)!="" {
		return prefix+"audio-work:"+catalogueIdentityPart(x.title)+"|"+catalogueIdentityPart(x.author)+"|"+catalogueIdentityPart(x.series)
	}
	return prefix+"audio-file:"+filepath.ToSlash(x.path)
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

	rows, e := tx.Query(`SELECT a.id,a.relative_path,a.title,a.author,a.series,a.genre,a.format,s.space,a.isbn,a.asin,a.needs_review,
		COALESCE(w.auto,1)
		FROM assets a JOIN sources s ON s.id=a.source_id
		LEFT JOIN edition_assets ea ON ea.asset_id=a.id
		LEFT JOIN editions ed ON ed.id=ea.edition_id
		LEFT JOIN works w ON w.id=ed.work_id
		WHERE a.source_id=? AND a.available=1 AND (w.id IS NULL OR w.auto=1)
		ORDER BY a.relative_path`, sourceID)
	if e != nil { return e }

	groups := map[string][]catalogueAsset{}
	order := []string{}
	for rows.Next() {
		var x catalogueAsset
		var auto int
		if e = rows.Scan(&x.id,&x.path,&x.title,&x.author,&x.series,&x.genre,&x.format,&x.space,&x.isbn,&x.asin,&x.needsReview,&auto); e != nil { rows.Close(); return e }
		key := "source:" + strconv.FormatInt(sourceID,10) + ":" + strings.ToLower(x.format)+":"+filepath.ToSlash(x.path)
		if x.format == "Audio" { key=autoAudioGroupKey(sourceID,x) }
		if _, ok := groups[key]; !ok { order = append(order,key) }
		groups[key] = append(groups[key],x)
	}
	if e = rows.Err(); e != nil { rows.Close(); return e }
	rows.Close()

	keep := map[int64]bool{}
	for _, key := range order {
		items := groups[key]
		sort.SliceStable(items,func(i,j int)bool{return naturalLess(items[i].path,items[j].path)})
		first := items[0]
		title := first.title
		rawKey := strings.TrimPrefix(key,"source:"+strconv.FormatInt(sourceID,10)+":")
		if first.format == "Audio" && strings.HasPrefix(rawKey,"audio-dir:") {
			if folder := filepath.Base(strings.TrimPrefix(rawKey,"audio-dir:")); folder != "." && folder != "" { title = folder }
		}
		author := commonValue(items,func(x catalogueAsset)string{return x.author})
		series := commonValue(items,func(x catalogueAsset)string{return x.series})
		genre := commonValue(items,func(x catalogueAsset)string{return x.genre})

		var work, edition int64
		err := tx.QueryRow("SELECT id FROM works WHERE auto=1 AND group_key=? LIMIT 1",key).Scan(&work)
		if err == sql.ErrNoRows {
			res, insertErr := tx.Exec("INSERT INTO works(title,space,author,series,genre,auto,group_key) VALUES(?,?,?,?,?,1,?)",title,first.space,author,series,genre,key)
			if insertErr != nil { return insertErr }
			work, insertErr = res.LastInsertId(); if insertErr != nil { return insertErr }
			res, insertErr = tx.Exec("INSERT INTO editions(work_id,format) VALUES(?,?)",work,first.format)
			if insertErr != nil { return insertErr }
			edition, insertErr = res.LastInsertId(); if insertErr != nil { return insertErr }
		} else if err != nil {
			return err
		} else {
			if _, err = tx.Exec("UPDATE works SET title=?,space=?,author=?,series=?,genre=? WHERE id=?",title,first.space,author,series,genre,work); err != nil { return err }
			err = tx.QueryRow("SELECT id FROM editions WHERE work_id=? ORDER BY id LIMIT 1",work).Scan(&edition)
			if err == sql.ErrNoRows {
				res, insertErr := tx.Exec("INSERT INTO editions(work_id,format) VALUES(?,?)",work,first.format)
				if insertErr != nil { return insertErr }
				edition, insertErr = res.LastInsertId(); if insertErr != nil { return insertErr }
			} else if err != nil { return err }
			if _, err = tx.Exec("UPDATE editions SET format=? WHERE id=?",first.format,edition); err != nil { return err }
			if _, err = tx.Exec("DELETE FROM editions WHERE work_id=? AND id<>?",work,edition); err != nil { return err }
			if _, err = tx.Exec("DELETE FROM edition_assets WHERE edition_id=?",edition); err != nil { return err }
		}
		keep[work]=true
		for pos,item := range items {
			if _, err = tx.Exec("INSERT INTO edition_assets(asset_id,edition_id,position) VALUES(?,?,?) ON CONFLICT(asset_id) DO UPDATE SET edition_id=excluded.edition_id,position=excluded.position",item.id,edition,pos); err != nil { return err }
		}
	}

	staleRows, e := tx.Query(`SELECT DISTINCT w.id FROM works w
		JOIN editions ed ON ed.work_id=w.id
		JOIN edition_assets ea ON ea.edition_id=ed.id
		JOIN assets a ON a.id=ea.asset_id
		WHERE w.auto=1 AND a.source_id=?`,sourceID)
	if e != nil { return e }
	stale := []int64{}
	for staleRows.Next(){var id int64;if e=staleRows.Scan(&id);e!=nil{staleRows.Close();return e};if !keep[id]{stale=append(stale,id)}}
	if e=staleRows.Err();e!=nil{staleRows.Close();return e}
	staleRows.Close()
	for _, id := range stale { if _,e=tx.Exec("DELETE FROM works WHERE id=?",id);e!=nil{return e} }

	if e = pruneCatalogue(tx); e != nil { return e }
	return tx.Commit()
}
const catalogueMigrationVersion = "auto-catalogue-v3"

func (a *app) syncExistingCatalogue() error {
	var version string
	err := a.db.QueryRow("SELECT value FROM app_meta WHERE key='catalogue_migration'").Scan(&version)
	if err == nil && version == catalogueMigrationVersion {
		return nil
	}
	if err != nil && err != sql.ErrNoRows {
		return err
	}
	a.scanMu.Lock()
	defer a.scanMu.Unlock()
	rows, e := a.db.Query("SELECT id FROM sources ORDER BY id")
	if e != nil { return e }
	ids := []int64{}
	for rows.Next() { var id int64; if e=rows.Scan(&id); e!=nil { rows.Close(); return e }; ids=append(ids,id) }
	if e=rows.Err(); e!=nil { rows.Close(); return e }
	rows.Close()
	for _, id := range ids { if e=a.syncAutoCatalogueLocked(id); e!=nil { return e } }
	_, e = a.db.Exec(`INSERT INTO app_meta(key,value) VALUES('catalogue_migration',?)
		ON CONFLICT(key) DO UPDATE SET value=excluded.value`, catalogueMigrationVersion)
	return e
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
		path, format, space, author, series, genre string
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
		if e = tx.QueryRow(`SELECT a.relative_path,a.format,s.space,a.author,a.series,a.genre FROM assets a JOIN sources s ON s.id=a.source_id WHERE a.id=?`, id).Scan(&x.path, &x.format, &x.space, &x.author, &x.series, &x.genre); e != nil {
			return 0, errors.New("selected file no longer exists")
		}
		if len(items) > 0 && space != x.space {
			return 0, errors.New("group files within the same space")
		}
		space = x.space
		items = append(items, x)
	}
	author := ""; series := ""; genre := ""
	if len(items) > 0 {
		sameAuthor, sameSeries, sameGenre := true, true, true
		author, series, genre = items[0].author, items[0].series, items[0].genre
		for _, x := range items[1:] { if x.author != author { sameAuthor=false }; if x.series != series { sameSeries=false }; if x.genre != genre { sameGenre=false } }
		if !sameAuthor { author="" }; if !sameSeries { series="" }; if !sameGenre { genre="" }
	}
	placeholders := strings.TrimRight(strings.Repeat("?,", len(ids)), ",")
	args := make([]any, len(ids))
	for i,id := range ids { args[i]=id }
	autoRows, e := tx.Query("SELECT DISTINCT w.id FROM works w JOIN editions e ON e.work_id=w.id JOIN edition_assets ea ON ea.edition_id=e.id WHERE w.auto=1 AND ea.asset_id IN ("+placeholders+")", args...)
	if e != nil { return 0, e }
	autoWorks := []int64{}
	for autoRows.Next(){ var id int64; if e=autoRows.Scan(&id); e!=nil{autoRows.Close();return 0,e}; autoWorks=append(autoWorks,id) }
	if e=autoRows.Err();e!=nil{autoRows.Close();return 0,e};autoRows.Close()
	for _, workID := range autoWorks {
		var total, selected int
		if e=tx.QueryRow("SELECT count(*) FROM edition_assets ea JOIN editions e ON e.id=ea.edition_id WHERE e.work_id=?",workID).Scan(&total);e!=nil{return 0,e}
		query := "SELECT count(*) FROM edition_assets ea JOIN editions e ON e.id=ea.edition_id WHERE e.work_id=? AND ea.asset_id IN ("+placeholders+")"
		workArgs := append([]any{workID}, args...)
		if e=tx.QueryRow(query,workArgs...).Scan(&selected);e!=nil{return 0,e}
		if selected != total { return 0, errors.New("select all files from an automatically grouped work before regrouping it") }
	}
	if len(autoWorks)==1 {
		var total int
		if e=tx.QueryRow("SELECT count(*) FROM edition_assets ea JOIN editions e ON e.id=ea.edition_id WHERE e.work_id=?",autoWorks[0]).Scan(&total);e!=nil{return 0,e}
		if total==len(ids) {
			if _,e=tx.Exec("UPDATE works SET title=?,space=?,author=?,series=?,genre=?,auto=0,group_key='' WHERE id=?",title,space,author,series,genre,autoWorks[0]);e!=nil{return 0,e}
			if e=tx.Commit();e!=nil{return 0,e}
			return autoWorks[0],nil
		}
	}
	if len(autoWorks)>0 {
		workPlaceholders:=strings.TrimRight(strings.Repeat("?,",len(autoWorks)),",")
		workArgs:=make([]any,len(autoWorks));for i,id:=range autoWorks{workArgs[i]=id}
		if _,e=tx.Exec("DELETE FROM works WHERE id IN ("+workPlaceholders+")",workArgs...);e!=nil{return 0,e}
	}
	res, e := tx.Exec("INSERT INTO works(title,space,author,series,genre,auto,group_key) VALUES(?,?,?,?,?,0,'')", title, space, author, series, genre)
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
		author := strings.TrimSpace(r.URL.Query().Get("author"))
		series := strings.TrimSpace(r.URL.Query().Get("series"))
		genre := strings.TrimSpace(r.URL.Query().Get("genre"))
		unknownAuthor := r.URL.Query().Get("unknownAuthor") == "1"
		availability := r.URL.Query().Get("availability")
		if availability != "" && availability != "available" && availability != "unavailable" {
			fail(w,400,errors.New("invalid availability filter"))
			return
		}
		reading := strings.TrimSpace(r.URL.Query().Get("reading"))
		if reading != "" && reading != "finished" && reading != "in-progress" && reading != "not-started" {
			fail(w,400,errors.New("invalid reading-state filter"))
			return
		}
		favourite := 0
		if r.URL.Query().Get("favourite") == "1" { favourite = 1 }
		rating := 0
		if raw:=r.URL.Query().Get("rating");raw!="" {
			n,err:=strconv.Atoi(raw)
			if err!=nil || n<1 || n>10 { fail(w,400,errors.New("invalid rating filter")); return }
			rating=n
		}
		limit := 60
		if n, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && n > 0 && n <= 200 { limit = n }
		offset := 0
		if n, err := strconv.Atoi(r.URL.Query().Get("offset")); err == nil && n >= 0 { offset = n }
		afterTitle:=strings.TrimSpace(r.URL.Query().Get("afterTitle"))
		var afterID int64
		if raw:=strings.TrimSpace(r.URL.Query().Get("afterId"));raw!="" {
			n,err:=strconv.ParseInt(raw,10,64)
			if err!=nil||n<0 { fail(w,400,errors.New("invalid work cursor")); return }
			afterID=n
			if afterID>0 { offset=0 }
		}
		rows, e := a.db.Query(`SELECT w.id,w.title,w.author,w.series,w.genre,w.space,
			count(DISTINCT e.id),count(ea.asset_id),
			CASE WHEN count(DISTINCT e.format)=1 THEN min(e.format) ELSE 'Mixed' END,
			sum(CASE WHEN a.available=1 THEN 1 ELSE 0 END),
			COALESCE((SELECT wp.rating FROM work_preferences wp WHERE wp.profile_id=`+strconv.FormatInt(who(r).ID,10)+` AND wp.work_id=w.id),0),
			COALESCE((SELECT wp.favourite FROM work_preferences wp WHERE wp.profile_id=`+strconv.FormatInt(who(r).ID,10)+` AND wp.work_id=w.id),0),
			`+workStateExpression(who(r).ID)+`
			FROM works w JOIN editions e ON e.work_id=w.id
			JOIN edition_assets ea ON ea.edition_id=e.id JOIN assets a ON a.id=ea.asset_id
			WHERE (w.title LIKE ? OR w.author LIKE ? OR w.series LIKE ? OR w.genre LIKE ?)
			AND (?='' OR w.space=?) AND (?='' OR e.format=?)
			AND (?='' OR w.author=?)
			AND (?='' OR w.series=?)
			AND (?='' OR w.genre=?)
			AND (?=0 OR trim(w.author)='')
			AND (?='' OR `+workStateExpression(who(r).ID)+`=?)
			AND (?=0 OR EXISTS (SELECT 1 FROM work_preferences fp WHERE fp.profile_id=`+strconv.FormatInt(who(r).ID,10)+` AND fp.work_id=w.id AND fp.favourite=1))
			AND (?=0 OR EXISTS (SELECT 1 FROM work_preferences rp WHERE rp.profile_id=`+strconv.FormatInt(who(r).ID,10)+` AND rp.work_id=w.id AND rp.rating=?))
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			AND (?=0 OR lower(w.title)>lower(?) OR (lower(w.title)=lower(?) AND w.id>?))
			GROUP BY w.id
			HAVING (?='' OR (?='available' AND sum(CASE WHEN a.available=1 THEN 1 ELSE 0 END)>0) OR (?='unavailable' AND sum(CASE WHEN a.available=1 THEN 1 ELSE 0 END)=0))
			ORDER BY lower(w.title),w.id LIMIT ? OFFSET ?`,
			q,q,q,q,space,space,format,format,author,author,series,series,genre,genre,unknownAuthor,
			reading,reading,favourite,rating,rating,who(r).Owner,who(r).ID,
			afterID,afterTitle,afterTitle,afterID,
			availability,availability,availability,limit,offset)
		if e != nil { fail(w,500,e); return }
		defer rows.Close()
		out := []map[string]any{}
		for rows.Next() {
			var id, editions, files, available int64
			var ratingValue int
			var favouriteValue bool
			var title, author, series, genre, workSpace, workFormat, state string
			if e=rows.Scan(&id,&title,&author,&series,&genre,&workSpace,&editions,&files,&workFormat,&available,&ratingValue,&favouriteValue,&state); e != nil { fail(w,500,e); return }
			out=append(out,map[string]any{"id":id,"title":title,"author":author,"series":series,"genre":genre,"space":workSpace,"editions":editions,"files":files,"format":workFormat,"available":available>0,"rating":ratingValue,"favourite":favouriteValue,"state":state})
		}
		reply(w,out)
	})
	mux.HandleFunc("GET /api/continue", func(w http.ResponseWriter, r *http.Request) {
		space := r.URL.Query().Get("space")
		rows, e := a.db.Query(`SELECT w.id,w.title,w.author,w.series,w.genre,w.space,
			count(DISTINCT e.id),count(ea.asset_id),
			CASE WHEN count(DISTINCT e.format)=1 THEN min(e.format) ELSE 'Mixed' END,
			sum(CASE WHEN a.available=1 THEN 1 ELSE 0 END)
			FROM works w
			JOIN editions e ON e.work_id=w.id
			JOIN edition_assets ea ON ea.edition_id=e.id
			JOIN assets a ON a.id=ea.asset_id
			WHERE (?='' OR w.space=?)
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			AND (
				EXISTS (
					SELECT 1 FROM editions pe
					JOIN profile_progress pp ON pp.edition_id=pe.id
					WHERE pe.work_id=w.id AND pp.profile_id=? AND pp.complete=0
					AND (pp.seconds>0 OR pp.revision>0)
				)
				OR EXISTS (
					SELECT 1 FROM editions re
					JOIN edition_assets rea ON rea.edition_id=re.id
					JOIN reading_progress rp ON rp.asset_id=rea.asset_id
					WHERE re.work_id=w.id AND rp.profile_id=?
					AND (rp.part>0 OR rp.fraction>0 OR rp.revision>0)
				)
			)
			GROUP BY w.id
			ORDER BY w.title,w.id
			LIMIT 20`,
			space,space,who(r).Owner,who(r).ID,who(r).ID,who(r).ID)
		if e != nil { fail(w,500,e); return }
		defer rows.Close()
		out := []map[string]any{}
		for rows.Next() {
			var id, editions, files, available int64
			var title, author, series, genre, workSpace, workFormat string
			if e=rows.Scan(&id,&title,&author,&series,&genre,&workSpace,&editions,&files,&workFormat,&available); e != nil { fail(w,500,e); return }
			out=append(out,map[string]any{"id":id,"title":title,"author":author,"series":series,"genre":genre,"space":workSpace,"editions":editions,"files":files,"format":workFormat,"available":available>0})
		}
		if e=rows.Err(); e!=nil { fail(w,500,e); return }
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
		var unknownAuthors int
		_ = a.db.QueryRow(`SELECT count(*) FROM works w WHERE trim(w.author)='' AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`,who(r).Owner,who(r).ID).Scan(&unknownAuthors)
		var needsReview int
		_ = a.db.QueryRow(`SELECT count(*) FROM assets a JOIN sources s ON s.id=a.source_id WHERE a.needs_review=1 AND (? OR s.space IN (SELECT space FROM grants WHERE profile_id=?))`,who(r).Owner,who(r).ID).Scan(&needsReview)
		series := []map[string]any{}
		rows, e = a.db.Query(`SELECT w.series,count(*) FROM works w WHERE w.series<>'' AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?)) GROUP BY w.series ORDER BY count(*) DESC,w.series LIMIT 20`,who(r).Owner,who(r).ID)
		if e == nil { for rows.Next(){var name string;var count int;if rows.Scan(&name,&count)==nil{series=append(series,map[string]any{"name":name,"count":count})}};rows.Close() }
		genres := []map[string]any{}
		rows, e = a.db.Query(`SELECT w.genre,count(*) FROM works w WHERE trim(w.genre)<>'' AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?)) GROUP BY w.genre ORDER BY count(*) DESC,w.genre LIMIT 20`,who(r).Owner,who(r).ID)
		if e == nil { for rows.Next(){var name string;var count int;if rows.Scan(&name,&count)==nil{genres=append(genres,map[string]any{"name":name,"count":count})}};rows.Close() }
		availability := []map[string]any{}
		rows, e = a.db.Query(`
			SELECT status,count(*) FROM (
				SELECT w.id,CASE WHEN sum(CASE WHEN a.available=1 THEN 1 ELSE 0 END)>0 THEN 'Available' ELSE 'Unavailable' END AS status
				FROM works w
				JOIN editions ed ON ed.work_id=w.id
				JOIN edition_assets ea ON ea.edition_id=ed.id
				JOIN assets a ON a.id=ea.asset_id
				WHERE ? OR w.space IN (SELECT space FROM grants WHERE profile_id=?)
				GROUP BY w.id
			) GROUP BY status ORDER BY status`,who(r).Owner,who(r).ID)
		if e == nil { for rows.Next(){var name string;var count int;if rows.Scan(&name,&count)==nil{availability=append(availability,map[string]any{"name":name,"count":count})}};rows.Close() }

		readingSummary := []map[string]any{}
		rows, e = a.db.Query(`SELECT state,count(*) FROM (
			SELECT w.id,`+workStateExpression(who(r).ID)+` AS state
			FROM works w WHERE ? OR w.space IN (SELECT space FROM grants WHERE profile_id=?)
		) GROUP BY state ORDER BY count(*) DESC,state`,who(r).Owner,who(r).ID)
		if e == nil {
			for rows.Next(){var state string;var count int;if rows.Scan(&state,&count)==nil{
				name:="Not started";if state=="finished"{name="Finished"}else if state=="in-progress"{name="In progress"}
				readingSummary=append(readingSummary,map[string]any{"name":name,"count":count})
			}};rows.Close()
		}

		ratings := []map[string]any{}
		rows, e = a.db.Query(`SELECT rating,count(*) FROM (
			SELECT w.id,`+atlasRatingExpression(who(r).ID)+` AS rating
			FROM works w WHERE ? OR w.space IN (SELECT space FROM grants WHERE profile_id=?)
		) GROUP BY rating ORDER BY CASE rating
			WHEN '5★' THEN 10 WHEN '4½★' THEN 9 WHEN '4★' THEN 8 WHEN '3½★' THEN 7
			WHEN '3★' THEN 6 WHEN '2½★' THEN 5 WHEN '2★' THEN 4 WHEN '1½★' THEN 3
			WHEN '1★' THEN 2 WHEN '½★' THEN 1 ELSE 0 END DESC`,who(r).Owner,who(r).ID)
		if e == nil { for rows.Next(){var name string;var count int;if rows.Scan(&name,&count)==nil{ratings=append(ratings,map[string]any{"name":name,"count":count})}};rows.Close() }

		favourites := []map[string]any{}
		var favouriteCount int
		_ = a.db.QueryRow(`SELECT count(*) FROM work_preferences wp JOIN works w ON w.id=wp.work_id
			WHERE wp.profile_id=? AND wp.favourite=1 AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`,
			who(r).ID,who(r).Owner,who(r).ID).Scan(&favouriteCount)
		if favouriteCount>0 { favourites=append(favourites,map[string]any{"name":"Favourites","count":favouriteCount}) }

		reply(w,map[string]any{"total":total,"formats":formats,"spaces":spaces,"authors":authors,"unknownAuthors":unknownAuthors,"needsReview":needsReview,"series":series,"genres":genres,"availability":availability,"reading":readingSummary,"ratings":ratings,"favourites":favourites})
	})
	mux.HandleFunc("GET /api/works/{id}/tracks", func(w http.ResponseWriter, r *http.Request) {
		rows, e := a.db.Query(`SELECT a.id,a.title,a.format,e.id,a.available,a.relative_path,a.size_bytes FROM editions e JOIN edition_assets ea ON ea.edition_id=e.id JOIN assets a ON a.id=ea.asset_id WHERE e.work_id=? ORDER BY e.id,ea.position`, r.PathValue("id"))
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer rows.Close()
		out := []map[string]any{}
		for rows.Next() {
			var id, edition int64
			var title, format, relative string
			var available bool
			var size int64
			if e = rows.Scan(&id, &title, &format, &edition, &available, &relative, &size); e != nil {
				fail(w, 500, e)
				return
			}
			out = append(out, map[string]any{"id": id, "title": title, "format": format, "edition": edition, "available": available, "name": filepath.Base(relative), "size": size})
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
