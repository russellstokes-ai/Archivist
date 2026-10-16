package main

import (
    "errors"
    "net/http"
    "strconv"
)

type serverReviewWork struct {
    ID int64 `json:"id"`
    Title string `json:"title"`
    Author string `json:"author"`
    Series string `json:"series"`
    Genre string `json:"genre"`
    Space string `json:"space"`
    Format string `json:"format"`
    Files int `json:"files"`
    ReviewFiles int `json:"reviewFiles"`
    CoverHash string `json:"coverHash"`
    PublicationState string `json:"publicationState"`
    Revision int64 `json:"revision"`
    Available bool `json:"available"`
}

func reviewPage(r *http.Request, defaultLimit int) (int, int, error) {
    limit, offset := defaultLimit, 0
    if raw := r.URL.Query().Get("limit"); raw != "" {
        n, err := strconv.Atoi(raw)
        if err != nil || n < 1 || n > 100 { return 0, 0, errors.New("invalid page limit") }
        limit = n
    }
    if raw := r.URL.Query().Get("offset"); raw != "" {
        n, err := strconv.Atoi(raw)
        if err != nil || n < 0 || n > 1000000 { return 0, 0, errors.New("invalid page offset") }
        offset = n
    }
    return limit, offset, nil
}

// Work-level metadata review is an owner-only, read-only view of the existing
// catalogue. It does not scan, publish, move media, or change mobile Assist.
func (a *app) serverReviewRoutes(mux *http.ServeMux) {
    mux.HandleFunc("GET /api/manage/review-works", func(w http.ResponseWriter, r *http.Request) {
        if !who(r).Owner { fail(w, http.StatusForbidden, errors.New("administrator access required")); return }
        limit, offset, err := reviewPage(r, 40)
        if err != nil { fail(w, 400, err); return }
        var total int
        err = a.db.QueryRowContext(r.Context(), `SELECT count(DISTINCT w.id) FROM works w
            JOIN editions ed ON ed.work_id=w.id JOIN edition_assets ea ON ea.edition_id=ed.id
            JOIN assets ast ON ast.id=ea.asset_id
            LEFT JOIN work_publication pub ON pub.work_id=w.id
            WHERE ast.needs_review=1 OR COALESCE(pub.state,'staged')='staged'`).Scan(&total)
        if err != nil { fail(w, 500, err); return }
        rows, err := a.db.QueryContext(r.Context(), `SELECT w.id,w.title,w.author,w.series,w.genre,w.space,
            CASE WHEN count(DISTINCT ed.format)=1 THEN min(ed.format) ELSE 'Mixed' END,
            count(ast.id),sum(CASE WHEN ast.needs_review=1 THEN 1 ELSE 0 END),
            sum(CASE WHEN ast.available=1 THEN 1 ELSE 0 END),
            COALESCE(max(pub.state),'staged'),COALESCE(max(pub.revision),0),
            COALESCE(max(cov.digest),'')
            FROM works w LEFT JOIN work_publication pub ON pub.work_id=w.id
            LEFT JOIN selected_work_covers cov ON cov.work_id=w.id
            JOIN editions ed ON ed.work_id=w.id
            JOIN edition_assets ea ON ea.edition_id=ed.id JOIN assets ast ON ast.id=ea.asset_id
            GROUP BY w.id HAVING sum(CASE WHEN ast.needs_review=1 THEN 1 ELSE 0 END)>0
            OR COALESCE(max(pub.state),'staged')='staged'
            ORDER BY sum(CASE WHEN ast.needs_review=1 THEN 1 ELSE 0 END) DESC,w.title COLLATE NOCASE,w.id
            LIMIT ? OFFSET ?`, limit, offset)
        if err != nil { fail(w, 500, err); return }
        defer rows.Close()
        works := []serverReviewWork{}
        for rows.Next() {
            var item serverReviewWork
            var available int
            if err = rows.Scan(&item.ID, &item.Title, &item.Author, &item.Series, &item.Genre, &item.Space, &item.Format, &item.Files, &item.ReviewFiles, &available,&item.PublicationState,&item.Revision,&item.CoverHash); err != nil {
                fail(w, 500, err); return
            }
            item.Available = available > 0
            works = append(works, item)
        }
        if err = rows.Err(); err != nil { fail(w, 500, err); return }
        reply(w, map[string]any{"total":total,"works":works,"limit":limit,"offset":offset})
    })
    mux.HandleFunc("GET /api/manage/review-works/{id}/files", func(w http.ResponseWriter, r *http.Request) {
        if !who(r).Owner { fail(w, http.StatusForbidden, errors.New("administrator access required")); return }
        id, err := strconv.ParseInt(r.PathValue("id"),10,64)
        if err != nil || id < 1 { fail(w, 400, errors.New("invalid work ID")); return }
        limit, offset, err := reviewPage(r, 60)
        if err != nil { fail(w, 400, err); return }
        var exists int
        err = a.db.QueryRowContext(r.Context(), "SELECT count(*) FROM works WHERE id=?", id).Scan(&exists)
        if err != nil { fail(w, 500, err); return }
        if exists == 0 { fail(w, 404, errors.New("work not found")); return }
        rows, err := a.db.QueryContext(r.Context(), `SELECT ast.id,ast.title,ast.author,ast.series,ast.series_number,
            ast.genre,ast.published_year,ast.narrator,ast.publisher,ast.isbn,ast.asin,
            ast.language,ast.description,ast.format,s.space,ast.available,
            ast.metadata_confidence,ast.needs_review,ast.review_reason,ast.metadata_source
            FROM editions ed JOIN edition_assets ea ON ea.edition_id=ed.id
            JOIN assets ast ON ast.id=ea.asset_id JOIN sources s ON s.id=ast.source_id
            WHERE ed.work_id=?
            ORDER BY ast.needs_review DESC,ed.id,ea.position,ast.id
            LIMIT ? OFFSET ?`, id, limit+1, offset)
        if err != nil { fail(w, 500, err); return }
        defer rows.Close()
        files := []book{}
        for rows.Next() {
            var item book
            var confidence int
            if err = rows.Scan(&item.ID,&item.Title,&item.Author,&item.Series,&item.SeriesNumber,
                &item.Genre,&item.PublishedYear,&item.Narrator,&item.Publisher,&item.ISBN,&item.ASIN,
                &item.Language,&item.Description,&item.Format,&item.Space,&item.Available,
                &confidence,&item.NeedsReview,&item.ReviewReason,&item.MetadataSource); err != nil {
                fail(w, 500, err); return
            }
            switch {
            case confidence >= 85: item.IdentificationConfidence = "high"
            case confidence >= 60: item.IdentificationConfidence = "medium"
            default: item.IdentificationConfidence = "low"
            }
            files = append(files, item)
        }
        if err = rows.Err(); err != nil { fail(w, 500, err); return }
        more := len(files)>limit
        if more { files=files[:limit] }
        reply(w, map[string]any{"files":files,"hasMore":more,"limit":limit,"offset":offset})
    })
}
