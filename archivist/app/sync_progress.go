package main

import (
    "errors"
    "net/http"
    "strconv"
)

// Sync snapshots are read-only. Devices must still use each existing
// revision-checked progress endpoint to commit any offline playback changes.
// Cross-device conflicts are not silently resolved by this endpoint.
type syncProgressEntry struct {
    Kind string `json:"kind"`
    ID int64 `json:"id"`
    Asset int64 `json:"asset,omitempty"`
    Part int `json:"part"`
    Seconds float64 `json:"seconds"`
    Fraction float64 `json:"fraction"`
    Revision int64 `json:"revision"`
    Complete bool `json:"complete"`
}

func (a *app) syncProgressRoutes(mux *http.ServeMux) {
    mux.HandleFunc("GET /api/sync/progress",func(w http.ResponseWriter,r *http.Request){
        limit:=100
        if raw:=r.URL.Query().Get("limit");raw!=""{
            parsed,err:=strconv.Atoi(raw)
            if err!=nil || parsed<1 || parsed>200{
                fail(w,400,errors.New("limit must be between 1 and 200"))
                return
            }
            limit=parsed
        }
        offset:=0
        if raw:=r.URL.Query().Get("offset");raw!=""{
            parsed,err:=strconv.Atoi(raw)
            if err!=nil || parsed<0 || parsed>1000000{
                fail(w,400,errors.New("invalid progress offset"))
                return
            }
            offset=parsed
        }
        profile:=who(r)
        // A single query gives each page consistent ordering and ensures only
        // the requesting profile's rows in granted spaces are ever returned.
        rows,err:=a.db.Query(`
SELECT kind,id,asset,part,seconds,fraction,revision,complete FROM (
    SELECT 'edition' AS kind,p.edition_id AS id,p.asset_id AS asset,
        0 AS part,p.seconds AS seconds,0 AS fraction,p.revision AS revision,p.complete AS complete
    FROM profile_progress p JOIN editions e ON e.id=p.edition_id
        JOIN works w ON w.id=e.work_id
    WHERE p.profile_id=? AND (? OR EXISTS (
        SELECT 1 FROM grants g WHERE g.profile_id=? AND g.space=w.space))
    UNION ALL
    SELECT 'listening',p.asset_id,p.asset_id,0,p.seconds,0,p.revision,p.complete
    FROM asset_progress p JOIN assets a ON a.id=p.asset_id
        JOIN sources s ON s.id=a.source_id
    WHERE p.profile_id=? AND (? OR EXISTS (
        SELECT 1 FROM grants g WHERE g.profile_id=? AND g.space=s.space))
    UNION ALL
    SELECT 'reading',p.asset_id,0,p.part,0,p.fraction,p.revision,p.complete
    FROM reading_progress p JOIN assets a ON a.id=p.asset_id
        JOIN sources s ON s.id=a.source_id
    WHERE p.profile_id=? AND (? OR EXISTS (
        SELECT 1 FROM grants g WHERE g.profile_id=? AND g.space=s.space))
) ORDER BY kind,id LIMIT ? OFFSET ?`,
        profile.ID,profile.Owner,profile.ID,
        profile.ID,profile.Owner,profile.ID,
        profile.ID,profile.Owner,profile.ID,
        limit+1,offset)
        if err!=nil{fail(w,http.StatusInternalServerError,err);return}
        defer rows.Close()
        entries:=make([]syncProgressEntry,0,limit)
        more:=false
        for rows.Next(){
            var item syncProgressEntry
            if err:=rows.Scan(&item.Kind,&item.ID,&item.Asset,&item.Part,&item.Seconds,
                &item.Fraction,&item.Revision,&item.Complete);err!=nil{
                fail(w,http.StatusInternalServerError,err);return
            }
            if len(entries)==limit {more=true;break}
            entries=append(entries,item)
        }
        if err:=rows.Err();err!=nil{fail(w,http.StatusInternalServerError,err);return}
        reply(w,map[string]any{
            "items":entries,
            "hasMore":more,
            "nextOffset":offset+len(entries),
            "note":"Read-only snapshot. Use existing revision-checked write endpoints to resolve changes.",
        })
    })
}
