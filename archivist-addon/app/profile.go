package main

import "net/http"

type profileStats struct {
	Name              string `json:"name"`
	Owner             bool   `json:"owner"`
	Works             int    `json:"works"`
	Formats           int    `json:"formats"`
	Series            int    `json:"series"`
	StartedAudio      int    `json:"startedAudio"`
	CompletedAudio    int    `json:"completedAudio"`
	InProgressAudio   int    `json:"inProgressAudio"`
	StartedReading    int    `json:"startedReading"`
	CompletedReading  int    `json:"completedReading"`
	InProgressReading int    `json:"inProgressReading"`
	InProgress        int    `json:"inProgress"`
	Completed         int     `json:"completed"`
	Rated             int     `json:"rated"`
	Favourites        int     `json:"favourites"`
	AverageRating     float64 `json:"averageRating"`
}

func (a *app) profileStatsFor(p identity) (profileStats,error) {
	out:=profileStats{Name:p.Name,Owner:p.Owner}
	if out.Name=="" {
		if p.Owner { out.Name="Owner" } else { out.Name="Profile" }
	}
	if e:=a.db.QueryRow(`
		SELECT count(DISTINCT w.id)
		FROM works w
		WHERE ? OR w.space IN (SELECT space FROM grants WHERE profile_id=?)`,
		p.Owner,p.ID).Scan(&out.Works);e!=nil{return out,e}
	if e:=a.db.QueryRow(`
		SELECT count(DISTINCT e.format)
		FROM works w JOIN editions e ON e.work_id=w.id
		WHERE ? OR w.space IN (SELECT space FROM grants WHERE profile_id=?)`,
		p.Owner,p.ID).Scan(&out.Formats);e!=nil{return out,e}
	if e:=a.db.QueryRow(`
		SELECT count(DISTINCT w.series)
		FROM works w
		WHERE trim(w.series)<>'' AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`,
		p.Owner,p.ID).Scan(&out.Series);e!=nil{return out,e}

	audioStarted:=`
		SELECT w.id
		FROM works w
		JOIN editions e ON e.work_id=w.id
		JOIN profile_progress pp ON pp.edition_id=e.id
		WHERE e.format='Audio' AND pp.profile_id=?
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
		AND (pp.seconds>0 OR pp.revision>0 OR pp.complete=1)
		UNION
		SELECT w.id
		FROM works w
		JOIN editions e ON e.work_id=w.id
		JOIN edition_assets ea ON ea.edition_id=e.id
		JOIN asset_progress ap ON ap.asset_id=ea.asset_id
		WHERE e.format='Audio' AND ap.profile_id=?
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
		AND (ap.seconds>0 OR ap.revision>0 OR ap.complete=1)`

	audioInProgress:=`
		SELECT w.id
		FROM works w
		JOIN editions e ON e.work_id=w.id
		JOIN profile_progress pp ON pp.edition_id=e.id
		WHERE e.format='Audio' AND pp.profile_id=? AND pp.complete=0
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
		AND (pp.seconds>0 OR pp.revision>0)
		UNION
		SELECT w.id
		FROM works w
		JOIN editions e ON e.work_id=w.id
		JOIN edition_assets ea ON ea.edition_id=e.id
		JOIN asset_progress ap ON ap.asset_id=ea.asset_id
		WHERE e.format='Audio' AND ap.profile_id=? AND ap.complete=0
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
		AND (ap.seconds>0 OR ap.revision>0)`

	readingStarted:=`
		SELECT DISTINCT w.id
		FROM works w
		JOIN editions e ON e.work_id=w.id
		JOIN edition_assets ea ON ea.edition_id=e.id
		JOIN reading_progress rp ON rp.asset_id=ea.asset_id
		WHERE e.format IN ('Ebook','Comic','PDF')
		AND rp.profile_id=?
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
		AND (rp.part>0 OR rp.fraction>0 OR rp.revision>0 OR rp.complete=1)`

	readingInProgress:=`
		SELECT DISTINCT w.id
		FROM works w
		JOIN editions e ON e.work_id=w.id
		JOIN edition_assets ea ON ea.edition_id=e.id
		JOIN reading_progress rp ON rp.asset_id=ea.asset_id
		WHERE e.format IN ('Ebook','Comic','PDF')
		AND rp.profile_id=? AND rp.complete=0
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
		AND (rp.part>0 OR rp.fraction>0 OR rp.revision>0)`

	if e:=a.db.QueryRow("SELECT count(*) FROM ("+audioStarted+")",
		p.ID,p.Owner,p.ID,p.ID,p.Owner,p.ID).Scan(&out.StartedAudio);e!=nil{return out,e}
	if e:=a.db.QueryRow("SELECT count(*) FROM ("+audioInProgress+")",
		p.ID,p.Owner,p.ID,p.ID,p.Owner,p.ID).Scan(&out.InProgressAudio);e!=nil{return out,e}
	if e:=a.db.QueryRow("SELECT count(*) FROM ("+readingStarted+")",
		p.ID,p.Owner,p.ID).Scan(&out.StartedReading);e!=nil{return out,e}
	if e:=a.db.QueryRow("SELECT count(*) FROM ("+readingInProgress+")",
		p.ID,p.Owner,p.ID).Scan(&out.InProgressReading);e!=nil{return out,e}

	if e:=a.db.QueryRow(`
		SELECT count(DISTINCT pc.work_id)
		FROM profile_completions pc JOIN works w ON w.id=pc.work_id
		WHERE pc.profile_id=? AND pc.kind='Audio'
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`,
		p.ID,p.Owner,p.ID).Scan(&out.CompletedAudio);e!=nil{return out,e}
	if e:=a.db.QueryRow(`
		SELECT count(DISTINCT pc.work_id)
		FROM profile_completions pc JOIN works w ON w.id=pc.work_id
		WHERE pc.profile_id=? AND pc.kind='Reading'
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`,
		p.ID,p.Owner,p.ID).Scan(&out.CompletedReading);e!=nil{return out,e}
	if e:=a.db.QueryRow(`
		SELECT count(DISTINCT pc.work_id)
		FROM profile_completions pc JOIN works w ON w.id=pc.work_id
		WHERE pc.profile_id=?
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`,
		p.ID,p.Owner,p.ID).Scan(&out.Completed);e!=nil{return out,e}

	if e:=a.db.QueryRow(`SELECT count(*),COALESCE(avg(wp.rating),0)
		FROM work_preferences wp JOIN works w ON w.id=wp.work_id
		WHERE wp.profile_id=? AND wp.rating>0
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`,
		p.ID,p.Owner,p.ID).Scan(&out.Rated,&out.AverageRating);e!=nil{return out,e}
	if e:=a.db.QueryRow(`SELECT count(*)
		FROM work_preferences wp JOIN works w ON w.id=wp.work_id
		WHERE wp.profile_id=? AND wp.favourite=1
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`,
		p.ID,p.Owner,p.ID).Scan(&out.Favourites);e!=nil{return out,e}

	currentUnion:="SELECT id FROM ("+audioInProgress+") UNION SELECT id FROM ("+readingInProgress+")"
	if e:=a.db.QueryRow("SELECT count(*) FROM ("+currentUnion+")",
		p.ID,p.Owner,p.ID,p.ID,p.Owner,p.ID,p.ID,p.Owner,p.ID).Scan(&out.InProgress);e!=nil{return out,e}
	return out,nil
}

func (a *app) profileRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/profile-stats",func(w http.ResponseWriter,r *http.Request){
		stats,e:=a.profileStatsFor(who(r))
		if e!=nil{fail(w,500,e);return}
		reply(w,stats)
	})
}
