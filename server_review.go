package main

import (
    "database/sql"
    "errors"
    "net/http"
    "strconv"
    "strings"
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
        state:=r.URL.Query().Get("state")
        if state==""{state="staged"}
        if state!="staged"&&state!="published"{
            fail(w,400,errors.New("state must be staged or published"));return
        }
        // Optional work-centric filters are defined here, not interpolated
        // from HTTP parameters into SQL. The same grouped relation drives
        // both count and page to avoid reporting a file count as book count.
        search:=strings.TrimSpace(r.URL.Query().Get("q"))
        space:=strings.TrimSpace(r.URL.Query().Get("space"))
        format:=r.URL.Query().Get("format")
        reason:=r.URL.Query().Get("reason")
        if len(search)>120||len(space)>100 {
            fail(w,400,errors.New("review search or library filter is too long"));return
        }
        if format!=""&&format!="Comic"&&format!="Audio"&&format!="Ebook"&&format!="PDF" {
            fail(w,400,errors.New("unsupported review media format"));return
        }
        reasonHaving:=""
        switch reason {
        case "":
        case "unreviewed": reasonHaving="sum(CASE WHEN ast.needs_review=1 THEN 1 ELSE 0 END)>0"
        case "unavailable":reasonHaving="sum(CASE WHEN ast.available=0 THEN 1 ELSE 0 END)>0"
        case "missing-author":reasonHaving="trim(w.author)=''"
        case "missing-genre":reasonHaving="trim(w.genre)=''"
        case "no-selected-cover":reasonHaving="coalesce(max(cov.digest),'')=''"
        default:fail(w,400,errors.New("unsupported book-level review reason"));return
        }
        filter:="1=1"
        groupedFilter:="sum(CASE WHEN ast.needs_review=1 THEN 1 ELSE 0 END)>0 OR COALESCE(max(pub.state),'staged')='staged'"
        sorting:="sum(CASE WHEN ast.needs_review=1 THEN 1 ELSE 0 END) DESC,w.title COLLATE NOCASE,w.id"
        if state=="published"{
            filter="w.id IN (SELECT id FROM published_works)"
            groupedFilter="COALESCE(max(pub.state),'staged')='published' AND sum(CASE WHEN ast.needs_review=1 THEN 1 ELSE 0 END)=0"
            sorting="w.title COLLATE NOCASE,w.id"
        }
        args:=[]any{}
        if search!=""{
            filter+=" AND (instr(lower(w.title),lower(?))>0 OR instr(lower(w.author),lower(?))>0 OR instr(lower(w.series),lower(?))>0)"
            args=append(args,search,search,search)
        }
        if space!=""{
            filter+=" AND w.space=?"
            args=append(args,space)
        }
        if format!=""{
            filter+=" AND EXISTS(SELECT 1 FROM editions fed WHERE fed.work_id=w.id AND fed.format=?)"
            args=append(args,format)
        }
        having:="("+groupedFilter+")"
        if reasonHaving!=""{having+=" AND ("+reasonHaving+")"}
        baseQuery:=` FROM works w
            JOIN editions ed ON ed.work_id=w.id JOIN edition_assets ea ON ea.edition_id=ed.id
            JOIN assets ast ON ast.id=ea.asset_id
            LEFT JOIN work_publication pub ON pub.work_id=w.id
            LEFT JOIN selected_work_covers cov ON cov.work_id=w.id
            WHERE `+filter+` GROUP BY w.id HAVING `+having
        tx,err:=a.db.BeginTx(r.Context(),&sql.TxOptions{ReadOnly:true})
        if err!=nil{fail(w,500,errors.New("unable to start review snapshot"));return}
        defer tx.Rollback()
        var total int
        countSQL:="SELECT count(*) FROM (SELECT w.id"+baseQuery+")"
        if err=tx.QueryRowContext(r.Context(),countSQL,args...).Scan(&total);err!=nil{
            fail(w,500,errors.New("unable to count matching books"));return
        }
        pageArgs:=append(append([]any{},args...),limit,offset)
        rows,err:=tx.QueryContext(r.Context(),`SELECT w.id,w.title,w.author,w.series,w.genre,w.space,
            CASE WHEN count(DISTINCT ed.format)=1 THEN min(ed.format) ELSE 'Mixed' END,
            count(ast.id),sum(CASE WHEN ast.needs_review=1 THEN 1 ELSE 0 END),
            sum(CASE WHEN ast.available=1 THEN 1 ELSE 0 END),
            COALESCE(max(pub.state),'staged'),COALESCE(max(pub.revision),0),
            COALESCE(max(cov.digest),'')`+baseQuery+
            " ORDER BY "+sorting+" LIMIT ? OFFSET ?",pageArgs...)
        if err!=nil{fail(w,500,errors.New("unable to page matching books"));return}
        works := []serverReviewWork{}
        for rows.Next() {
            var item serverReviewWork
            var available int
            if err = rows.Scan(&item.ID, &item.Title, &item.Author, &item.Series, &item.Genre, &item.Space, &item.Format, &item.Files, &item.ReviewFiles, &available,&item.PublicationState,&item.Revision,&item.CoverHash); err != nil {
                rows.Close();fail(w,500,errors.New("unable to decode work review page"));return
            }
            item.Available = available > 0
            works = append(works, item)
        }
        if err = rows.Err(); err != nil { rows.Close();fail(w,500,err);return }
        if err = rows.Close();err!=nil{fail(w,500,err);return}
        if err=tx.Commit();err!=nil{fail(w,500,errors.New("book review snapshot expired"));return}
        reply(w, map[string]any{"total":total,"works":works,"limit":limit,"offset":offset,
            "state":state,"reason":reason,"q":search,"space":space,"format":format})
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
