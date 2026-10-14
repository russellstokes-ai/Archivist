package main

import (
    "net/http"
)

// librarySourceHealth is a read-only diagnostic. It does not rescan, rewrite
// availability flags, or remove catalogue entries when a NAS goes offline.
type librarySourceHealth struct {
    ID int64 `json:"id"`
    Space string `json:"space"`
    Path string `json:"path"`
    Status string `json:"status"`
    Online bool `json:"online"`
    IndexedFiles int64 `json:"indexedFiles"`
    AvailableFlags int64 `json:"availableFlags"`
    NeedsReview int64 `json:"needsReview"`
}

type libraryHealthSummary struct {
    SourceCount int `json:"sourceCount"`
    OfflineSources int `json:"offlineSources"`
    IndexedFiles int64 `json:"indexedFiles"`
    AvailableFlags int64 `json:"availableFlags"`
    NeedsReview int64 `json:"needsReview"`
}

func (a *app) libraryHealthRoutes(mux *http.ServeMux) {
    mux.HandleFunc("GET /api/library-health", func(w http.ResponseWriter, r *http.Request) {
        // The central middleware also denies non-admin profiles. Enforce
        // ownership here too so absolute server mount paths never leak.
        if !who(r).Owner {
            http.Error(w, "access denied", http.StatusForbidden)
            return
        }
        rows, err := a.db.Query(`SELECT s.id, s.space, s.path, s.status,
            count(a.id),
            coalesce(sum(case when a.available=1 then 1 else 0 end),0),
            coalesce(sum(case when a.needs_review=1 then 1 else 0 end),0)
            FROM sources s LEFT JOIN assets a ON a.source_id=s.id
            GROUP BY s.id ORDER BY s.id`)
        if err != nil {
            fail(w, http.StatusInternalServerError, err)
            return
        }
        defer rows.Close()
        sources := []librarySourceHealth{}
        summary := libraryHealthSummary{}
        for rows.Next() {
            var item librarySourceHealth
            if err := rows.Scan(&item.ID,&item.Space,&item.Path,&item.Status,
                &item.IndexedFiles,&item.AvailableFlags,&item.NeedsReview); err != nil {
                fail(w, http.StatusInternalServerError, err)
                return
            }
            // Match the existing scanner's source-root validation, but do not
            // walk media or mutate the persisted catalogue.
            resolved, err := canonical(item.Path)
            item.Online = err == nil && resolved == item.Path
            summary.SourceCount++
            if !item.Online { summary.OfflineSources++ }
            summary.IndexedFiles += item.IndexedFiles
            summary.AvailableFlags += item.AvailableFlags
            summary.NeedsReview += item.NeedsReview
            sources = append(sources, item)
        }
        if err := rows.Err(); err != nil {
            fail(w, http.StatusInternalServerError, err)
            return
        }
        reply(w, map[string]any{
            "summary": summary,
            "sources": sources,
            "note": "Online checks inspect source roots only; stored file availability flags are not changed or independently revalidated.",
        })
    })
}
