package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

func (a *app) organisationRoutes(mux *http.ServeMux) {
	mux.HandleFunc("PATCH /api/assets/{id}/metadata", func(w http.ResponseWriter, r *http.Request) {
		var in struct {
			Title  string `json:"title"`
			Author string `json:"author"`
			Series string `json:"series"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&in) != nil {
			fail(w, 400, errors.New("invalid metadata"))
			return
		}
		in.Title = strings.TrimSpace(in.Title)
		in.Author = strings.TrimSpace(in.Author)
		in.Series = strings.TrimSpace(in.Series)
		if in.Title == "" || len(in.Title) > 1000 {
			fail(w, 400, errors.New("enter a title of 1-1000 bytes"))
			return
		}
		if len(in.Author) > 1000 || len(in.Series) > 1000 {
			fail(w, 400, errors.New("author and series must be 1000 bytes or fewer"))
			return
		}
		a.scanMu.Lock()
		defer a.scanMu.Unlock()
		var sourceID int64
		if err := a.db.QueryRow("SELECT source_id FROM assets WHERE id=?", r.PathValue("id")).Scan(&sourceID); err != nil {
			fail(w, 404, errors.New("asset missing"))
			return
		}
		res, err := a.db.Exec(`UPDATE assets
			SET title=?,author=?,series=?,
				metadata_source='manual',
				metadata_confidence=100,
				needs_review=0,
				review_reason=''
			WHERE id=?`, in.Title, in.Author, in.Series, r.PathValue("id"))
		if err != nil {
			fail(w, 500, err)
			return
		}
		n, _ := res.RowsAffected()
		if n != 1 {
			fail(w, 404, errors.New("asset missing"))
			return
		}
		if err = a.syncAutoCatalogueLocked(sourceID); err != nil {
			fail(w, 500, err)
			return
		}
		reply(w, map[string]bool{"ok": true})
	})
}
