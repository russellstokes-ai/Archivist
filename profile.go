package main

import (
	"net/http"
)

type profileStats struct {
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

func (a *app) profileRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/profile-stats", func(w http.ResponseWriter, r *http.Request) {
		p := who(r)
		out := profileStats{Name: p.Name, Owner: p.Owner}

		if e := a.db.QueryRow(`SELECT count(*) FROM works w
			WHERE ? OR w.space IN (SELECT space FROM grants WHERE profile_id=?)`,
			p.Owner,p.ID).Scan(&out.Works); e != nil {
			fail(w,500,e); return
		}
		if e := a.db.QueryRow(`SELECT count(DISTINCT e.format)
			FROM editions e JOIN works w ON w.id=e.work_id
			WHERE ? OR w.space IN (SELECT space FROM grants WHERE profile_id=?)`,
			p.Owner,p.ID).Scan(&out.Formats); e != nil {
			fail(w,500,e); return
		}
		if e := a.db.QueryRow(`SELECT count(DISTINCT w.series) FROM works w
			WHERE trim(w.series)<>'' AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`,
			p.Owner,p.ID).Scan(&out.Series); e != nil {
			fail(w,500,e); return
		}
		if e := a.db.QueryRow(`SELECT count(DISTINCT w.id)
			FROM profile_progress pp
			JOIN editions e ON e.id=pp.edition_id
			JOIN works w ON w.id=e.work_id
			WHERE pp.profile_id=? AND pp.revision>0
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`,
			p.ID,p.Owner,p.ID).Scan(&out.StartedAudio); e != nil {
			fail(w,500,e); return
		}
		if e := a.db.QueryRow(`SELECT count(DISTINCT w.id)
			FROM profile_progress pp
			JOIN editions e ON e.id=pp.edition_id
			JOIN works w ON w.id=e.work_id
			WHERE pp.profile_id=? AND pp.complete=1
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`,
			p.ID,p.Owner,p.ID).Scan(&out.CompletedAudio); e != nil {
			fail(w,500,e); return
		}
		if e := a.db.QueryRow(`SELECT count(DISTINCT w.id)
			FROM reading_progress rp
			JOIN edition_assets ea ON ea.asset_id=rp.asset_id
			JOIN editions e ON e.id=ea.edition_id
			JOIN works w ON w.id=e.work_id
			WHERE rp.profile_id=? AND rp.revision>0
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`,
			p.ID,p.Owner,p.ID).Scan(&out.StartedReading); e != nil {
			fail(w,500,e); return
		}
		if e := a.db.QueryRow(`SELECT count(DISTINCT w.id)
			FROM reading_progress rp
			JOIN edition_assets ea ON ea.asset_id=rp.asset_id
			JOIN editions e ON e.id=ea.edition_id
			JOIN works w ON w.id=e.work_id
			WHERE rp.profile_id=? AND rp.complete=1
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`,
			p.ID,p.Owner,p.ID).Scan(&out.CompletedReading); e != nil {
			fail(w,500,e); return
		}

		if e := a.db.QueryRow(`SELECT count(*) FROM (
			SELECT DISTINCT w.id
			FROM profile_progress pp
			JOIN editions e ON e.id=pp.edition_id
			JOIN works w ON w.id=e.work_id
			WHERE pp.profile_id=? AND pp.revision>0 AND pp.complete=0
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			UNION
			SELECT DISTINCT w.id
			FROM reading_progress rp
			JOIN edition_assets ea ON ea.asset_id=rp.asset_id
			JOIN editions e ON e.id=ea.edition_id
			JOIN works w ON w.id=e.work_id
			WHERE rp.profile_id=? AND rp.revision>0 AND rp.complete=0
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
		)`,
			p.ID,p.Owner,p.ID,p.ID,p.Owner,p.ID).Scan(&out.InProgress); e != nil {
			fail(w,500,e); return
		}
		if e := a.db.QueryRow(`SELECT count(*) FROM (
			SELECT DISTINCT w.id
			FROM profile_progress pp
			JOIN editions e ON e.id=pp.edition_id
			JOIN works w ON w.id=e.work_id
			WHERE pp.profile_id=? AND pp.complete=1
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			UNION
			SELECT DISTINCT w.id
			FROM reading_progress rp
			JOIN edition_assets ea ON ea.asset_id=rp.asset_id
			JOIN editions e ON e.id=ea.edition_id
			JOIN works w ON w.id=e.work_id
			WHERE rp.profile_id=? AND rp.complete=1
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
		)`,
			p.ID,p.Owner,p.ID,p.ID,p.Owner,p.ID).Scan(&out.Completed); e != nil {
			fail(w,500,e); return
		}

		reply(w,out)
	})
}
