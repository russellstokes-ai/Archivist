package main

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
)

type metadataPatch struct {
	Title         *string  `json:"title"`
	Author        *string  `json:"author"`
	Series        *string  `json:"series"`
	SeriesNumber  *float64 `json:"seriesNumber"`
	Genre         *string  `json:"genre"`
	PublishedYear *int     `json:"publishedYear"`
	Narrator      *string  `json:"narrator"`
	Publisher     *string  `json:"publisher"`
	ISBN          *string  `json:"isbn"`
	ASIN          *string  `json:"asin"`
	Language      *string  `json:"language"`
	Description   *string  `json:"description"`
}

// hasFields prevents empty or null-only PATCH requests from silently
// clearing a file's Needs Review state.
func (p metadataPatch) hasFields() bool {
 return p.Title != nil || p.Author != nil || p.Series != nil ||
  p.SeriesNumber != nil || p.Genre != nil || p.PublishedYear != nil ||
  p.Narrator != nil || p.Publisher != nil || p.ISBN != nil ||
  p.ASIN != nil || p.Language != nil || p.Description != nil
}

func cleanMetadataValue(value *string, current string) string {
	if value == nil {
		return current
	}
	return strings.TrimSpace(*value)
}

func (a *app) organisationRoutes(mux *http.ServeMux) {
	mux.HandleFunc("PATCH /api/assets/{id}/metadata", func(w http.ResponseWriter, r *http.Request) {
		var in metadataPatch
		decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 32768))
		decoder.DisallowUnknownFields()
		if decoder.Decode(&in) != nil {
			fail(w, 400, errors.New("invalid metadata"))
			return
		}
		var trailing any
		if decoder.Decode(&trailing) != io.EOF {
			fail(w, 400, errors.New("metadata must be a single JSON object"))
			return
		}
		if !in.hasFields() {
			fail(w, 400, errors.New("provide at least one metadata field"))
			return
		}

		a.scanMu.Lock()
		defer a.scanMu.Unlock()

		var sourceID int64
		var title, author, series, genre, narrator, publisher, isbn, asin, language, description string
		var seriesNumber float64
		var publishedYear int
		if err := a.db.QueryRow(`SELECT source_id,title,author,series,series_number,genre,published_year,narrator,publisher,isbn,asin,language,description
			FROM assets WHERE id=?`, r.PathValue("id")).Scan(
			&sourceID, &title, &author, &series, &seriesNumber, &genre, &publishedYear,
			&narrator, &publisher, &isbn, &asin, &language, &description,
		); err != nil {
			fail(w, 404, errors.New("asset missing"))
			return
		}

		title = cleanMetadataValue(in.Title, title)
		author = cleanMetadataValue(in.Author, author)
		series = cleanMetadataValue(in.Series, series)
		genre = cleanMetadataValue(in.Genre, genre)
		narrator = cleanMetadataValue(in.Narrator, narrator)
		publisher = cleanMetadataValue(in.Publisher, publisher)
		isbn = cleanMetadataValue(in.ISBN, isbn)
		asin = cleanMetadataValue(in.ASIN, asin)
		language = cleanMetadataValue(in.Language, language)
		description = cleanMetadataValue(in.Description, description)
		if in.SeriesNumber != nil {
			seriesNumber = *in.SeriesNumber
		}
		if in.PublishedYear != nil {
			publishedYear = *in.PublishedYear
		}

		if title == "" || len(title) > 1000 {
			fail(w, 400, errors.New("enter a title of 1-1000 bytes"))
			return
		}
		if len(author) > 1000 || len(series) > 1000 || len(genre) > 1000 || len(narrator) > 1000 || len(publisher) > 1000 {
			fail(w, 400, errors.New("author, series, genre, narrator and publisher must be 1000 bytes or fewer"))
			return
		}
		if len(isbn) > 100 || len(asin) > 100 || len(language) > 100 || len(description) > 20000 {
			fail(w, 400, errors.New("identifier, language or description is too long"))
			return
		}
		if seriesNumber < -10000 || seriesNumber > 100000 {
			fail(w, 400, errors.New("series number is out of range"))
			return
		}
		if publishedYear != 0 && (publishedYear < 1000 || publishedYear > 3000) {
			fail(w, 400, errors.New("publication year is out of range"))
			return
		}

		// Saving a partial correction does not mean identification is complete.
		// A missing author must remain reviewable, including after rescans.
		needsReview := strings.TrimSpace(author) == ""
		reviewReason := ""
		confidence := 100
		if needsReview {
			reviewReason = "Title or author still needs review."
			confidence = 60
		}
		res, err := a.db.Exec(`UPDATE assets
			SET title=?,author=?,series=?,series_number=?,genre=?,published_year=?,narrator=?,publisher=?,isbn=?,asin=?,language=?,description=?,
				metadata_source='manual',
				metadata_confidence=?,
				needs_review=?,
				review_reason=?
			WHERE id=?`,
			title, author, series, seriesNumber, genre, publishedYear,
			narrator, publisher, isbn, asin, language, description,
			confidence, needsReview, reviewReason, r.PathValue("id"))
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
