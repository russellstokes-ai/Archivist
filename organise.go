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
			Title         string  `json:"title"`
			Author        string  `json:"author"`
			Series        string  `json:"series"`
			SeriesNumber  float64 `json:"seriesNumber"`
			Genre         string  `json:"genre"`
			PublishedYear int     `json:"publishedYear"`
			Narrator      string  `json:"narrator"`
			Publisher     string  `json:"publisher"`
			ISBN          string  `json:"isbn"`
			ASIN          string  `json:"asin"`
			Language      string  `json:"language"`
			Description   string  `json:"description"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 32768)).Decode(&in) != nil {
			fail(w, 400, errors.New("invalid metadata"))
			return
		}
		in.Title = strings.TrimSpace(in.Title)
		in.Author = strings.TrimSpace(in.Author)
		in.Series = strings.TrimSpace(in.Series)
		in.Genre = strings.TrimSpace(in.Genre)
		in.Narrator = strings.TrimSpace(in.Narrator)
		in.Publisher = strings.TrimSpace(in.Publisher)
		in.ISBN = strings.TrimSpace(in.ISBN)
		in.ASIN = strings.TrimSpace(in.ASIN)
		in.Language = strings.TrimSpace(in.Language)
		in.Description = strings.TrimSpace(in.Description)
		if in.Title == "" || len(in.Title) > 1000 {
			fail(w, 400, errors.New("enter a title of 1-1000 bytes"))
			return
		}
		if len(in.Author) > 1000 || len(in.Series) > 1000 || len(in.Genre) > 1000 || len(in.Narrator) > 1000 || len(in.Publisher) > 1000 {
			fail(w, 400, errors.New("author, series, genre, narrator and publisher must be 1000 bytes or fewer"))
			return
		}
		if len(in.ISBN) > 100 || len(in.ASIN) > 100 || len(in.Language) > 100 || len(in.Description) > 20000 {
			fail(w, 400, errors.New("identifier, language or description is too long"))
			return
		}
		if in.SeriesNumber < -10000 || in.SeriesNumber > 100000 {
			fail(w, 400, errors.New("series number is out of range"))
			return
		}
		if in.PublishedYear != 0 && (in.PublishedYear < 1000 || in.PublishedYear > 3000) {
			fail(w, 400, errors.New("publication year is out of range"))
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
			SET title=?,author=?,series=?,series_number=?,genre=?,published_year=?,narrator=?,publisher=?,isbn=?,asin=?,language=?,description=?,
				metadata_source='manual',
				metadata_confidence=100,
				needs_review=0,
				review_reason=''
			WHERE id=?`,
			in.Title, in.Author, in.Series, in.SeriesNumber, in.Genre, in.PublishedYear,
			in.Narrator, in.Publisher, in.ISBN, in.ASIN, in.Language, in.Description, r.PathValue("id"))
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
