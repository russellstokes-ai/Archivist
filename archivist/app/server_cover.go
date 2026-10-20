package main

import (
	"database/sql"
	"errors"
	"net/http"
)

// effectiveWorkCover preserves the reviewed media-cover extraction implementation
// unchanged. Only an explicitly selected, bounded SQLite cover takes precedence.
// Missing selections fall through to the original, independently reviewed code.
func (a *app) effectiveWorkCover(workID string) ([]byte, string, error) {
	var cover []byte
	var mime string
	err := a.db.QueryRow(
		"SELECT image,mime FROM selected_work_covers WHERE work_id=?", workID,
	).Scan(&cover, &mime)
	if err == nil {
		if len(cover) == 0 || len(cover) > selectedCoverStoredLimit || mime != "image/jpeg" {
			return nil, "", errors.New("stored cover is invalid")
		}
		return cover, mime, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, "", err
	}
	return a.workCover(workID)
}

// Reuse both previously reviewed GET handlers without modifying covers.go or
// changing media/extraction behaviour. Only work-cover GET is wrapped; asset
// covers, SAF-equivalent paths and downstream permission checks stay identical.
func (a *app) serverCoverRoutes(mux *http.ServeMux) {
	reviewed := http.NewServeMux()
	a.coverRoutes(reviewed)

	mux.Handle("GET /api/assets/{id}/cover", reviewed)
	mux.HandleFunc("GET /api/works/{id}/cover", func(w http.ResponseWriter, r *http.Request) {
		data, mime, err := a.effectiveWorkCover(r.PathValue("id"))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		writeCoverResponse(w, data, mime)
	})
}
