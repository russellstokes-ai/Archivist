package main

import (
	"net/http"
	"strconv"
)

// This starter rule has no network client: it suggests accessible, unstarted files.
// Richer author/genre/series ranking follows metadata work and remains local.
func (a *app) recommendationRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/recommendations", func(w http.ResponseWriter, r *http.Request) {
		rows, e := a.db.Query(`SELECT a.id,a.title,a.format,s.space FROM assets a JOIN sources s ON s.id=a.source_id WHERE a.available=1 AND s.status!='Unavailable' AND (? OR s.space IN(SELECT space FROM grants WHERE profile_id=?)) AND NOT EXISTS(SELECT 1 FROM reading_progress p WHERE p.asset_id=a.id AND p.profile_id=?) AND NOT EXISTS(SELECT 1 FROM edition_assets ea JOIN profile_progress p ON p.edition_id=ea.edition_id WHERE ea.asset_id=a.id AND p.profile_id=?) ORDER BY a.title,a.id LIMIT 100`, who(r).Owner, who(r).ID, who(r).ID, who(r).ID)
		if e != nil {
			fail(w, 500, e)
			return
		}
		candidates := []book{}
		for rows.Next() {
			var b book
			if e = rows.Scan(&b.ID, &b.Title, &b.Format, &b.Space); e != nil {
				rows.Close()
				fail(w, 500, e)
				return
			}
			candidates = append(candidates, b)
		}
		e = rows.Err()
		rows.Close()
		if e != nil {
			fail(w, 500, e)
			return
		}
		out := []map[string]any{}
		for _, b := range candidates {
			f, _, e := a.openAsset(strconv.FormatInt(b.ID, 10))
			if e != nil {
				continue
			}
			info, e := f.Stat()
			f.Close()
			if e != nil || !info.Mode().IsRegular() {
				continue
			}
			out = append(out, map[string]any{"id": b.ID, "title": b.Title, "format": b.Format, "space": b.Space, "reason": "Not started in your library"})
			if len(out) == 10 {
				break
			}
		}
		reply(w, out)
	})
}
