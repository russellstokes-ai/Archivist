package main

import (
	"errors"
	"net/http"
	"strconv"
	"time"
)

type profileActivity struct {
	ID            int64   `json:"id"`
	WorkID        int64   `json:"workId"`
	Title         string  `json:"title"`
	Author        string  `json:"author"`
	Kind          string  `json:"kind"`
	StartedAt     int64   `json:"startedAt"`
	UpdatedAt     int64   `json:"updatedAt"`
	ActiveSeconds float64 `json:"activeSeconds"`
	Events        int     `json:"events"`
	Completed     bool    `json:"completed"`
}

func (a *app) initActivity() error {
	_,e:=a.db.Exec(`CREATE TABLE IF NOT EXISTS profile_activity(
		id INTEGER PRIMARY KEY,
		profile_id INTEGER NOT NULL,
		work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
		kind TEXT NOT NULL CHECK(kind IN ('Listening','Reading')),
		bucket_start INTEGER NOT NULL,
		updated_at INTEGER NOT NULL,
		active_seconds REAL NOT NULL DEFAULT 0,
		events INTEGER NOT NULL DEFAULT 0,
		UNIQUE(profile_id,work_id,kind,bucket_start)
	);
	CREATE INDEX IF NOT EXISTS profile_activity_profile_updated ON profile_activity(profile_id,updated_at DESC);`)
	return e
}

func activityBucket(now int64) int64 { return now-(now%(30*60)) }

func (a *app) recordActivity(profileID,workID int64,kind string,activeSeconds float64) error {
	if workID<=0 || (kind!="Listening"&&kind!="Reading") { return errors.New("invalid activity") }
	if activeSeconds<0 { activeSeconds=0 }
	if activeSeconds>1800 { activeSeconds=1800 }
	now:=time.Now().Unix()
	_,e:=a.db.Exec(`INSERT INTO profile_activity(profile_id,work_id,kind,bucket_start,updated_at,active_seconds,events)
		VALUES(?,?,?,?,?,?,1)
		ON CONFLICT(profile_id,work_id,kind,bucket_start) DO UPDATE SET
			updated_at=excluded.updated_at,
			active_seconds=MIN(1800,profile_activity.active_seconds+excluded.active_seconds),
			events=profile_activity.events+1`,
		profileID,workID,kind,activityBucket(now),now,activeSeconds)
	return e
}

func (a *app) workForAsset(assetID int64)(int64,error){
	var workID int64
	e:=a.db.QueryRow(`SELECT e.work_id FROM edition_assets ea JOIN editions e ON e.id=ea.edition_id WHERE ea.asset_id=? LIMIT 1`,assetID).Scan(&workID)
	return workID,e
}

func (a *app) workForEdition(editionID int64)(int64,error){
	var workID int64
	e:=a.db.QueryRow("SELECT work_id FROM editions WHERE id=?",editionID).Scan(&workID)
	return workID,e
}

func (a *app) activityRoutes(mux *http.ServeMux){
	mux.HandleFunc("GET /api/activity",func(w http.ResponseWriter,r *http.Request){
		limit:=50
		if raw:=r.URL.Query().Get("limit");raw!="" {
			if n,e:=strconv.Atoi(raw);e==nil && n>=1 && n<=200 { limit=n }
		}
		p:=who(r)
		rows,e:=a.db.Query(`SELECT pa.id,pa.work_id,w.title,w.author,pa.kind,pa.bucket_start,pa.updated_at,pa.active_seconds,pa.events,
			EXISTS(SELECT 1 FROM profile_completions pc WHERE pc.profile_id=pa.profile_id AND pc.work_id=pa.work_id)
			FROM profile_activity pa JOIN works w ON w.id=pa.work_id
			WHERE pa.profile_id=? AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			ORDER BY pa.updated_at DESC,pa.id DESC LIMIT ?`,p.ID,p.Owner,p.ID,limit)
		if e!=nil{fail(w,500,e);return}
		defer rows.Close()
		out:=[]profileActivity{}
		for rows.Next(){
			var item profileActivity
			if e=rows.Scan(&item.ID,&item.WorkID,&item.Title,&item.Author,&item.Kind,&item.StartedAt,&item.UpdatedAt,&item.ActiveSeconds,&item.Events,&item.Completed);e!=nil{fail(w,500,e);return}
			out=append(out,item)
		}
		if e=rows.Err();e!=nil{fail(w,500,e);return}
		reply(w,out)
	})
}
