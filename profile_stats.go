package main

import "net/http"

type verifiedProfileStats struct {
	Name             string `json:"name"`
	Owner            bool   `json:"owner"`
	Works            int    `json:"works"`
	Formats          int    `json:"formats"`
	Series           int    `json:"series"`
	StartedAudio     int    `json:"startedAudio"`
	CompletedAudio   int    `json:"completedAudio"`
	StartedReading   int    `json:"startedReading"`
	CompletedReading int    `json:"completedReading"`
	InProgress       int    `json:"inProgress"`
	Completed        int    `json:"completed"`
}

func (a *app) profileStatsFor(p identity) (verifiedProfileStats, error) {
	out := verifiedProfileStats{Name: p.Name, Owner: p.Owner}
	if out.Name == "" {
		if p.Owner {
			out.Name = "Owner"
		} else {
			out.Name = "Profile"
		}
	}

	if e := a.db.QueryRow(`
		SELECT count(DISTINCT w.id)
		FROM works w
		WHERE ? OR w.space IN (SELECT space FROM grants WHERE profile_id=?)`,
		p.Owner,p.ID).Scan(&out.Works); e != nil {
		return out,e
	}
	if e := a.db.QueryRow(`
		SELECT count(DISTINCT e.format)
		FROM works w
		JOIN editions e ON e.work_id=w.id
		WHERE ? OR w.space IN (SELECT space FROM grants WHERE profile_id=?)`,
		p.Owner,p.ID).Scan(&out.Formats); e != nil {
		return out,e
	}
	if e := a.db.QueryRow(`
		SELECT count(DISTINCT w.series)
		FROM works w
		WHERE trim(w.series)<>'' AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`,
		p.Owner,p.ID).Scan(&out.Series); e != nil {
		return out,e
	}

	audioStarted := `
		SELECT DISTINCT w.id
		FROM works w
		JOIN editions e ON e.work_id=w.id
		JOIN profile_progress pp ON pp.edition_id=e.id
		WHERE e.format='Audio'
		AND pp.profile_id=?
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
		AND (pp.seconds>0 OR pp.revision>0 OR pp.complete=1)`
	audioCompleted := `
		SELECT DISTINCT w.id
		FROM works w
		JOIN editions e ON e.work_id=w.id
		JOIN profile_progress pp ON pp.edition_id=e.id
		WHERE e.format='Audio'
		AND pp.profile_id=?
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
		AND pp.complete=1`
	readingStarted := `
		SELECT DISTINCT w.id
		FROM works w
		JOIN editions e ON e.work_id=w.id
		JOIN edition_assets ea ON ea.edition_id=e.id
		JOIN reading_progress rp ON rp.asset_id=ea.asset_id
		WHERE e.format IN ('Ebook','Comic','PDF')
		AND rp.profile_id=?
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
		AND (rp.part>0 OR rp.fraction>0 OR rp.revision>0 OR rp.complete=1)`
	readingCompleted := `
		SELECT DISTINCT w.id
		FROM works w
		JOIN editions e ON e.work_id=w.id
		JOIN edition_assets ea ON ea.edition_id=e.id
		JOIN reading_progress rp ON rp.asset_id=ea.asset_id
		WHERE e.format IN ('Ebook','Comic','PDF')
		AND rp.profile_id=?
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
		AND rp.complete=1`

	if e := a.db.QueryRow("SELECT count(*) FROM ("+audioStarted+")",
		p.ID,p.Owner,p.ID).Scan(&out.StartedAudio); e != nil {
		return out,e
	}
	if e := a.db.QueryRow("SELECT count(*) FROM ("+audioCompleted+")",
		p.ID,p.Owner,p.ID).Scan(&out.CompletedAudio); e != nil {
		return out,e
	}
	if e := a.db.QueryRow("SELECT count(*) FROM ("+readingStarted+")",
		p.ID,p.Owner,p.ID).Scan(&out.StartedReading); e != nil {
		return out,e
	}
	if e := a.db.QueryRow("SELECT count(*) FROM ("+readingCompleted+")",
		p.ID,p.Owner,p.ID).Scan(&out.CompletedReading); e != nil {
		return out,e
	}

	startedUnion := "SELECT id FROM ("+audioStarted+") UNION SELECT id FROM ("+readingStarted+")"
	completedUnion := "SELECT id FROM ("+audioCompleted+") UNION SELECT id FROM ("+readingCompleted+")"
	var startedWorks int
	if e := a.db.QueryRow(
		"SELECT count(*) FROM ("+startedUnion+")",
		p.ID,p.Owner,p.ID,
		p.ID,p.Owner,p.ID,
	).Scan(&startedWorks); e != nil {
		return out,e
	}
	if e := a.db.QueryRow(
		"SELECT count(*) FROM ("+completedUnion+")",
		p.ID,p.Owner,p.ID,
		p.ID,p.Owner,p.ID,
	).Scan(&out.Completed); e != nil {
		return out,e
	}
	out.InProgress = startedWorks - out.Completed
	if out.InProgress < 0 {
		out.InProgress = 0
	}
	return out,nil
}

func (a *app) profileRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/profile-stats",func(w http.ResponseWriter,r *http.Request){
		stats,e:=a.profileStatsFor(who(r))
		if e!=nil{
			fail(w,500,e)
			return
		}
		reply(w,stats)
	})
}
