package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"sort"
)

type duplicateCandidate struct {
	ID       int64  `json:"id"`
	Title    string `json:"title"`
	Author   string `json:"author"`
	Format   string `json:"format"`
	Space    string `json:"space"`
	Path     string `json:"path"`
	Size     int64  `json:"size"`
	Reviewed bool   `json:"reviewed"`
}

func (a *app) duplicateRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/duplicate-candidates", func(w http.ResponseWriter, r *http.Request) {
		if !who(r).Owner {
			fail(w, http.StatusForbidden, errors.New("duplicate review is available to the library owner"))
			return
		}
		rows, e := a.db.Query(`
			SELECT a.id,a.title,a.author,a.format,s.space,a.relative_path,a.size_bytes,a.needs_review
			FROM assets a JOIN sources s ON s.id=a.source_id
			WHERE a.available=1 AND a.size_bytes>0
			AND a.size_bytes IN (
				SELECT size_bytes FROM assets
				WHERE available=1 AND size_bytes>0
				GROUP BY size_bytes HAVING count(*)>1
			)
			ORDER BY a.size_bytes DESC,a.id
			LIMIT 500`)
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer rows.Close()
		groups := map[int64][]duplicateCandidate{}
		order := []int64{}
		for rows.Next() {
			var item duplicateCandidate
			var needsReview bool
			if e = rows.Scan(&item.ID,&item.Title,&item.Author,&item.Format,&item.Space,&item.Path,&item.Size,&needsReview); e != nil {
				fail(w,500,e)
				return
			}
			item.Reviewed = !needsReview
			if _, ok := groups[item.Size]; !ok {
				order = append(order,item.Size)
			}
			groups[item.Size] = append(groups[item.Size],item)
		}
		if e = rows.Err(); e != nil {
			fail(w,500,e)
			return
		}
		out := []map[string]any{}
		for _, size := range order {
			items := groups[size]
			if len(items) < 2 {
				continue
			}
			out = append(out,map[string]any{
				"size": size,
				"reason": "same byte size; verify before treating as duplicates",
				"items": items,
			})
		}
		reply(w,out)
	})

	mux.HandleFunc("POST /api/duplicate-candidates/verify", func(w http.ResponseWriter, r *http.Request) {
		if !who(r).Owner {
			fail(w, http.StatusForbidden, errors.New("duplicate verification is available to the library owner"))
			return
		}
		var in struct {
			IDs []int64 `json:"ids"`
		}
		if json.NewDecoder(http.MaxBytesReader(w,r.Body,16384)).Decode(&in) != nil {
			fail(w,400,errors.New("invalid duplicate verification request"))
			return
		}
		if len(in.IDs) < 2 || len(in.IDs) > 20 {
			fail(w,400,errors.New("verify between 2 and 20 candidate files at a time"))
			return
		}
		a.scanMu.Lock()
		defer a.scanMu.Unlock()
		seen := map[int64]bool{}
		hashGroups := map[string][]duplicateCandidate{}
		hashOrder := []string{}
		errorsOut := []map[string]any{}

		for _, id := range in.IDs {
			if seen[id] {
				fail(w,400,errors.New("duplicate asset id in verification request"))
				return
			}
			seen[id] = true
			var item duplicateCandidate
			var root string
			var needsReview bool
			e := a.db.QueryRow(`
				SELECT a.id,a.title,a.author,a.format,s.space,a.relative_path,a.size_bytes,a.needs_review,s.path
				FROM assets a JOIN sources s ON s.id=a.source_id
				WHERE a.id=? AND a.available=1`,id).
				Scan(&item.ID,&item.Title,&item.Author,&item.Format,&item.Space,&item.Path,&item.Size,&needsReview,&root)
			if e != nil {
				errorsOut=append(errorsOut,map[string]any{"id":id,"error":"asset is unavailable"})
				continue
			}
			item.Reviewed = !needsReview
			dir,e:=os.OpenRoot(root)
			if e != nil {
				errorsOut=append(errorsOut,map[string]any{"id":id,"error":"source is unavailable"})
				continue
			}
			hash,_,hashErr:=fileHash(dir,item.Path)
			dir.Close()
			if hashErr != nil {
				errorsOut=append(errorsOut,map[string]any{"id":id,"error":"file could not be verified"})
				continue
			}
			if _,ok:=hashGroups[hash];!ok {
				hashOrder=append(hashOrder,hash)
			}
			hashGroups[hash]=append(hashGroups[hash],item)
		}

		sort.Strings(hashOrder)
		exact := []map[string]any{}
		unique := []duplicateCandidate{}
		for _, hash := range hashOrder {
			items:=hashGroups[hash]
			if len(items)>1 {
				exact=append(exact,map[string]any{"sha256":hash,"items":items})
			} else if len(items)==1 {
				unique=append(unique,items[0])
			}
		}
		reply(w,map[string]any{
			"exact": exact,
			"unique": unique,
			"errors": errorsOut,
		})
	})
}
