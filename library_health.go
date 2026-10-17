package main

import (
    "net/http"
)

// Scanner diagnostics are read-only. Counts are *physical file* coverage,
// while indexedWorks and publishedWorks refer to distinct logical books.
// These checks do not probe media bytes or change persisted availability.
type librarySourceHealth struct {
    ID int64 `json:"id"`
    Space string `json:"space"`
    Path string `json:"path"`
    Status string `json:"status"`
    Online bool `json:"online"`
    IndexedFiles int64 `json:"indexedFiles"`
    IndexedWorks int64 `json:"indexedWorks"`
    AvailableFlags int64 `json:"availableFlags"`
    OfflineFiles int64 `json:"offlineFiles"`
    NeedsReview int64 `json:"needsReview"`
    MissingAuthor int64 `json:"missingAuthor"`
    MissingGenre int64 `json:"missingGenre"`
    MissingYear int64 `json:"missingYear"`
    LowConfidence int64 `json:"lowConfidence"`
}

type libraryHealthSummary struct {
    SourceCount int `json:"sourceCount"`
    OfflineSources int `json:"offlineSources"`
    IndexedFiles int64 `json:"indexedFiles"`
    IndexedWorks int64 `json:"indexedWorks"`
    PublishedWorks int64 `json:"publishedWorks"`
    AvailableFlags int64 `json:"availableFlags"`
    OfflineFiles int64 `json:"offlineFiles"`
    NeedsReview int64 `json:"needsReview"`
    MissingAuthor int64 `json:"missingAuthor"`
    MissingGenre int64 `json:"missingGenre"`
    MissingYear int64 `json:"missingYear"`
    LowConfidence int64 `json:"lowConfidence"`
}

func (a *app) libraryHealthRoutes(mux *http.ServeMux) {
    mux.HandleFunc("GET /api/library-health", func(w http.ResponseWriter, r *http.Request) {
        // Owner-only, so source roots cannot leak to household profiles.
        if !who(r).Owner {
            http.Error(w,"access denied",http.StatusForbidden)
            return
        }
        rows,err:=a.db.QueryContext(r.Context(),`SELECT s.id,s.space,s.path,s.status,
            count(a.id),
            count(DISTINCT ed.work_id),
            coalesce(sum(CASE WHEN a.available=1 THEN 1 ELSE 0 END),0),
            coalesce(sum(CASE WHEN a.id IS NOT NULL AND a.available=0 THEN 1 ELSE 0 END),0),
            coalesce(sum(CASE WHEN a.needs_review=1 THEN 1 ELSE 0 END),0),
            coalesce(sum(CASE WHEN a.id IS NOT NULL AND trim(a.author)='' THEN 1 ELSE 0 END),0),
            coalesce(sum(CASE WHEN a.id IS NOT NULL AND trim(a.genre)='' THEN 1 ELSE 0 END),0),
            coalesce(sum(CASE WHEN a.id IS NOT NULL AND
                (a.published_year<1000 OR a.published_year>3000) THEN 1 ELSE 0 END),0),
            coalesce(sum(CASE WHEN a.id IS NOT NULL AND a.metadata_confidence<60 THEN 1 ELSE 0 END),0)
            FROM sources s
            LEFT JOIN assets a ON a.source_id=s.id
            LEFT JOIN edition_assets ea ON ea.asset_id=a.id
            LEFT JOIN editions ed ON ed.id=ea.edition_id
            GROUP BY s.id ORDER BY s.id`)
        if err!=nil{fail(w,http.StatusInternalServerError,err);return}
        sources:=[]librarySourceHealth{}
        summary:=libraryHealthSummary{}
        for rows.Next(){
            var item librarySourceHealth
            if err=rows.Scan(&item.ID,&item.Space,&item.Path,&item.Status,
                &item.IndexedFiles,&item.IndexedWorks,&item.AvailableFlags,
                &item.OfflineFiles,&item.NeedsReview,&item.MissingAuthor,
                &item.MissingGenre,&item.MissingYear,&item.LowConfidence);err!=nil{
                rows.Close();fail(w,http.StatusInternalServerError,err);return
            }
            // This is a root availability probe, not a full NAS/media walk.
            resolved,canonicalErr:=canonical(item.Path)
            item.Online=canonicalErr==nil&&resolved==item.Path
            summary.SourceCount++
            if !item.Online{summary.OfflineSources++}
            summary.IndexedFiles+=item.IndexedFiles
            summary.AvailableFlags+=item.AvailableFlags
            summary.OfflineFiles+=item.OfflineFiles
            summary.NeedsReview+=item.NeedsReview
            summary.MissingAuthor+=item.MissingAuthor
            summary.MissingGenre+=item.MissingGenre
            summary.MissingYear+=item.MissingYear
            summary.LowConfidence+=item.LowConfidence
            sources=append(sources,item)
        }
        if err=rows.Err();err!=nil{rows.Close();fail(w,http.StatusInternalServerError,err);return}
        if err=rows.Close();err!=nil{fail(w,http.StatusInternalServerError,err);return}
        // Count logical works globally: summing per-source work counts can
        // double-count an explicitly grouped book spanning multiple roots.
        if err=a.db.QueryRowContext(r.Context(),"SELECT count(*) FROM works").Scan(&summary.IndexedWorks);err!=nil{
            fail(w,http.StatusInternalServerError,err);return
        }
        if err=a.db.QueryRowContext(r.Context(),"SELECT count(*) FROM published_works").Scan(&summary.PublishedWorks);err!=nil{
            fail(w,http.StatusInternalServerError,err);return
        }
        reply(w,map[string]any{
            "summary":summary,
            "sources":sources,
            "note":"File-level metadata gaps and confidence reflect the last indexed state; root availability is checked separately. This read-only report does not inspect or change physical media."
        })
    })
}
