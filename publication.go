package main

import (
    "database/sql"
    "encoding/json"
    "errors"
    "io"
    "net/http"
    "strconv"
    "strings"
    "time"
)

// An absent publication row means STAGED. Only a single one-time migration
// grandfathers the already-reviewed works that predated explicit publication.
// This preserves existing libraries while preventing new scans from leaking.
func (a *app) initPublication() error {
    _, err := a.db.Exec(`CREATE TABLE IF NOT EXISTS work_publication(
        work_id INTEGER PRIMARY KEY REFERENCES works(id) ON DELETE CASCADE,
        state TEXT NOT NULL CHECK(state IN ('staged','published')),
        revision INTEGER NOT NULL DEFAULT 1,
        published_at INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS work_publication_events(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('publish','unpublish','review_reopened')),
        recorded_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS selected_work_covers(
        work_id INTEGER PRIMARY KEY REFERENCES works(id) ON DELETE CASCADE,
        image BLOB NOT NULL,
        mime TEXT NOT NULL CHECK(mime='image/jpeg'),
        digest TEXT NOT NULL,
        updated_at INTEGER NOT NULL
    );
    CREATE VIEW IF NOT EXISTS published_works AS SELECT w.* FROM works w
      JOIN work_publication pub ON pub.work_id=w.id AND pub.state='published'
      WHERE NOT EXISTS (
        SELECT 1 FROM editions ed
        JOIN edition_assets ea ON ea.edition_id=ed.id
        JOIN assets ast ON ast.id=ea.asset_id
        WHERE ed.work_id=w.id AND ast.needs_review=1
      );
    CREATE INDEX IF NOT EXISTS idx_publication_events_work ON work_publication_events(work_id,id);
    CREATE INDEX IF NOT EXISTS idx_edition_assets_edition ON edition_assets(edition_id,asset_id);
    CREATE TRIGGER IF NOT EXISTS publication_review_reopened
      AFTER UPDATE OF needs_review ON assets
      WHEN NEW.needs_review=1 AND OLD.needs_review=0
      BEGIN
        INSERT INTO work_publication_events(work_id,title,action,recorded_at)
        SELECT w.id,w.title,'review_reopened',strftime('%s','now')
        FROM works w JOIN editions ed ON ed.work_id=w.id
        JOIN edition_assets ea ON ea.edition_id=ed.id
        JOIN work_publication pub ON pub.work_id=w.id AND pub.state='published'
        WHERE ea.asset_id=NEW.id;
        UPDATE work_publication SET state='staged',revision=revision+1,published_at=0
        WHERE state='published' AND work_id IN (
          SELECT ed.work_id FROM editions ed JOIN edition_assets ea ON ea.edition_id=ed.id WHERE ea.asset_id=NEW.id
        );
      END;`)
    if err!=nil {return err}
    tx,err:=a.db.Begin()
    if err!=nil{return err}
    defer tx.Rollback()
    var done string
    err=tx.QueryRow("SELECT value FROM app_meta WHERE key='publication_legacy_migration_v1'").Scan(&done)
    if err==nil{return tx.Commit()}
    if !errors.Is(err,sql.ErrNoRows){return err}
    // Existing, reviewed work identities are preserved. No cover/media probe
    // or destructive source scan occurs during migration. Missing or unreviewed
    // old works remain staged; they are never silently dropped.
    if _,err=tx.Exec(`INSERT OR IGNORE INTO work_publication(work_id,state,revision,published_at)
      SELECT w.id,'published',1,0 FROM works w
      WHERE trim(w.title)<>'' AND trim(w.author)<>''
      AND EXISTS (SELECT 1 FROM editions e JOIN edition_assets ea ON ea.edition_id=e.id WHERE e.work_id=w.id)
      AND NOT EXISTS (
        SELECT 1 FROM editions e JOIN edition_assets ea ON ea.edition_id=e.id
        JOIN assets a ON a.id=ea.asset_id WHERE e.work_id=w.id AND a.needs_review=1
      )`);err!=nil{return err}
    if _,err=tx.Exec("INSERT INTO app_meta(key,value) VALUES('publication_legacy_migration_v1','1')");err!=nil{return err}
    return tx.Commit()
}

type workPublication struct {
    WorkID int64 `json:"workId"`
    State string `json:"state"`
    Revision int64 `json:"revision"`
    Title string `json:"title"`
    Author string `json:"author"`
    Files int `json:"files"`
    NeedsReview int `json:"needsReview"`
    Unavailable int `json:"unavailable"`
}
func (a *app) publicationFor(id int64)(workPublication,error){
    result:=workPublication{WorkID:id,State:"staged"}
    err:=a.db.QueryRow(`SELECT w.title,w.author,COALESCE(pub.state,'staged'),COALESCE(pub.revision,0),
       count(ast.id),COALESCE(sum(CASE WHEN ast.needs_review=1 OR trim(ast.title)='' OR trim(ast.author)='' THEN 1 ELSE 0 END),0),
       COALESCE(sum(CASE WHEN ast.available=0 THEN 1 ELSE 0 END),0)
       FROM works w LEFT JOIN work_publication pub ON pub.work_id=w.id
       LEFT JOIN editions ed ON ed.work_id=w.id
       LEFT JOIN edition_assets ea ON ea.edition_id=ed.id
       LEFT JOIN assets ast ON ast.id=ea.asset_id
       WHERE w.id=? GROUP BY w.id`,id).Scan(&result.Title,&result.Author,&result.State,&result.Revision,
        &result.Files,&result.NeedsReview,&result.Unavailable)
    return result,err
}

// Access to this route is already subject to session auth + the action header,
// but the owner check is repeated here for defense in depth.
func (a *app) publicationRoutes(mux *http.ServeMux) {
    mux.HandleFunc("GET /api/manage/works/{id}/publication",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator access required"));return}
        id,err:=strconv.ParseInt(r.PathValue("id"),10,64)
        if err!=nil||id<1{fail(w,400,errors.New("invalid work ID"));return}
        result,err:=a.publicationFor(id)
        if errors.Is(err,sql.ErrNoRows){fail(w,404,errors.New("book not found"));return}
        if err!=nil{fail(w,500,err);return}
        reply(w,result)
    })
    mux.HandleFunc("POST /api/manage/works/{id}/publication",func(w http.ResponseWriter,r *http.Request){
        if !who(r).Owner{fail(w,403,errors.New("administrator access required"));return}
        id,err:=strconv.ParseInt(r.PathValue("id"),10,64)
        if err!=nil||id<1{fail(w,400,errors.New("invalid work ID"));return}
        var request struct {
            Action string `json:"action"`
            Confirm bool `json:"confirm"`
            ExpectedRevision *int64 `json:"expectedRevision"`
        }
        decoder:=json.NewDecoder(http.MaxBytesReader(w,r.Body,4096))
        decoder.DisallowUnknownFields()
        if err=decoder.Decode(&request);err!=nil{fail(w,400,errors.New("invalid publication request"));return}
        var tail any
        if err=decoder.Decode(&tail);err!=io.EOF{fail(w,400,errors.New("publication request must be one JSON object"));return}
        if !request.Confirm||request.ExpectedRevision==nil||*request.ExpectedRevision<0{
            fail(w,400,errors.New("confirm the book and its current revision"));return
        }
        if request.Action!="publish"&&request.Action!="unpublish"{
            fail(w,400,errors.New("action must be publish or unpublish"));return
        }
        a.scanMu.Lock()
        defer a.scanMu.Unlock()
        current,err:=a.publicationFor(id)
        if errors.Is(err,sql.ErrNoRows){fail(w,404,errors.New("book not found"));return}
        if err!=nil{fail(w,500,err);return}
        if current.Revision!=*request.ExpectedRevision{
            fail(w,409,errors.New("book changed; refresh its publication status"));return
        }
        next:="staged"
        if request.Action=="publish" {
            next="published"
            if strings.TrimSpace(current.Title)==""||strings.TrimSpace(current.Author)=="" {
                fail(w,409,errors.New("title and author must be identified before publishing"));return
            }
            if current.Files==0||current.NeedsReview>0 {
                fail(w,409,errors.New("review all files in this book before publishing"));return
            }
            if current.Unavailable>0 {
                fail(w,409,errors.New("some book files are unavailable; reconnect the source before publishing"));return
            }
            // Only an explicit owner operation pays the bounded cover probe cost.
            // Existing imported published works remain grandfathered for continuity.
            if _,_,coverErr:=a.workCover(strconv.FormatInt(id,10));coverErr!=nil {
                fail(w,409,errors.New("a usable cover is required before publishing"));return
            }
        }
        if current.State==next{
            fail(w,409,errors.New("book is already "+next));return
        }
        tx,err:=a.db.BeginTx(r.Context(),nil)
        if err!=nil{fail(w,500,err);return}
        defer tx.Rollback()
        now:=time.Now().Unix()
        publishedAt:=int64(0)
        if next=="published"{publishedAt=now}
        _,err=tx.ExecContext(r.Context(),`INSERT INTO work_publication(work_id,state,revision,published_at)
           VALUES(?,?,?,?) ON CONFLICT(work_id) DO UPDATE
           SET state=excluded.state,revision=excluded.revision,published_at=excluded.published_at`,
           id,next,current.Revision+1,publishedAt)
        if err!=nil{fail(w,500,err);return}
        _,err=tx.ExecContext(r.Context(),`INSERT INTO work_publication_events(work_id,title,action,recorded_at)
            VALUES(?,?,?,?)`,id,current.Title,request.Action,now)
        if err!=nil{fail(w,500,err);return}
        if err=tx.Commit();err!=nil{fail(w,500,err);return}
        current.State=next;current.Revision++
        reply(w,current)
    })
}
