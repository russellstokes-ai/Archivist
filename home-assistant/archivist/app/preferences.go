package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"
)

type workPreference struct {
	WorkID    int64  `json:"workId"`
	Rating    int    `json:"rating"`
	Favourite bool   `json:"favourite"`
	State     string `json:"state"`
}

func (a *app) initPreferences() error {
	_, e := a.db.Exec(`CREATE TABLE IF NOT EXISTS work_preferences(
		profile_id INTEGER NOT NULL,
		work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
		rating INTEGER NOT NULL DEFAULT 0 CHECK(rating>=0 AND rating<=10),
		favourite INTEGER NOT NULL DEFAULT 0,
		updated INTEGER NOT NULL,
		PRIMARY KEY(profile_id,work_id)
	);`)
	return e
}

func workStateExpression(profileID int64) string {
	id := strconv.FormatInt(profileID,10)
	return `CASE
		WHEN EXISTS(SELECT 1 FROM profile_completions pc WHERE pc.profile_id=`+id+` AND pc.work_id=w.id) THEN 'finished'
		WHEN EXISTS(
			SELECT 1 FROM editions pe
			JOIN profile_progress pp ON pp.edition_id=pe.id
			WHERE pe.work_id=w.id AND pp.profile_id=`+id+` AND pp.complete=0
			AND (pp.seconds>0 OR pp.revision>0)
		) OR EXISTS(
			SELECT 1 FROM editions ae
			JOIN edition_assets aea ON aea.edition_id=ae.id
			JOIN asset_progress ap ON ap.asset_id=aea.asset_id
			WHERE ae.work_id=w.id AND ap.profile_id=`+id+` AND ap.complete=0
			AND (ap.seconds>0 OR ap.revision>0)
		) OR EXISTS(
			SELECT 1 FROM editions re
			JOIN edition_assets rea ON rea.edition_id=re.id
			JOIN reading_progress rp ON rp.asset_id=rea.asset_id
			WHERE re.work_id=w.id AND rp.profile_id=`+id+` AND rp.complete=0
			AND (rp.part>0 OR rp.fraction>0 OR rp.revision>0)
		) THEN 'in-progress'
		ELSE 'not-started'
	END`
}

func (a *app) preferenceRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/preferences", func(w http.ResponseWriter, r *http.Request) {
		p:=who(r)
		state:=workStateExpression(p.ID)
		rows,e:=a.db.Query(`SELECT w.id,COALESCE(wp.rating,0),COALESCE(wp.favourite,0),`+state+`
			FROM works w
			LEFT JOIN work_preferences wp ON wp.profile_id=? AND wp.work_id=w.id
			WHERE ? OR w.space IN (SELECT space FROM grants WHERE profile_id=?)
			ORDER BY w.id`,p.ID,p.Owner,p.ID)
		if e!=nil{fail(w,500,e);return}
		defer rows.Close()
		out:=[]workPreference{}
		for rows.Next(){
			var item workPreference
			if e=rows.Scan(&item.WorkID,&item.Rating,&item.Favourite,&item.State);e!=nil{fail(w,500,e);return}
			out=append(out,item)
		}
		if e=rows.Err();e!=nil{fail(w,500,e);return}
		reply(w,out)
	})

	mux.HandleFunc("PUT /api/works/{id}/preference", func(w http.ResponseWriter, r *http.Request) {
		workID,e:=strconv.ParseInt(r.PathValue("id"),10,64)
		if e!=nil{fail(w,400,errors.New("invalid work"));return}
		var in struct{
			Rating int `json:"rating"`
			Favourite bool `json:"favourite"`
		}
		if e=json.NewDecoder(http.MaxBytesReader(w,r.Body,2048)).Decode(&in);e!=nil{
			fail(w,400,errors.New("invalid preference"));return
		}
		if in.Rating<0||in.Rating>10{fail(w,400,errors.New("rating must be 0 to 10"));return}
		p:=who(r)
		if in.Rating==0&&!in.Favourite{
			if _,e=a.db.Exec("DELETE FROM work_preferences WHERE profile_id=? AND work_id=?",p.ID,workID);e!=nil{fail(w,500,e);return}
		}else{
			if _,e=a.db.Exec(`INSERT INTO work_preferences(profile_id,work_id,rating,favourite,updated)
				VALUES(?,?,?,?,?)
				ON CONFLICT(profile_id,work_id) DO UPDATE SET rating=excluded.rating,favourite=excluded.favourite,updated=excluded.updated`,
				p.ID,workID,in.Rating,in.Favourite,time.Now().Unix());e!=nil{fail(w,500,e);return}
		}
		reply(w,map[string]any{"workId":workID,"rating":in.Rating,"favourite":in.Favourite})
	})
}
