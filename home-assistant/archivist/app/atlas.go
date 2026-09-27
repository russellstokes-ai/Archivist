package main

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
)

type atlasCount struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type atlasWork struct {
	ID        int64  `json:"id"`
	Title     string `json:"title"`
	Author    string `json:"author"`
	Series    string `json:"series"`
	Genre     string `json:"genre"`
	Format    string `json:"format"`
	Space     string `json:"space"`
	Editions  int64  `json:"editions"`
	Files     int64  `json:"files"`
	Available bool   `json:"available"`
}

type atlasRelationship struct {
	Kind         string       `json:"kind"`
	Value        string       `json:"value"`
	WorkCount    int          `json:"workCount"`
	Works        []atlasWork  `json:"works"`
	Authors      []atlasCount `json:"authors"`
	Series       []atlasCount `json:"series"`
	Genres       []atlasCount `json:"genres"`
	Formats      []atlasCount `json:"formats"`
	Spaces       []atlasCount `json:"spaces"`
	Availability []atlasCount `json:"availability"`
	Reading      []atlasCount `json:"reading"`
	Ratings      []atlasCount `json:"ratings"`
	Favourites   []atlasCount `json:"favourites"`
}

func atlasAvailabilityClause(available bool) string {
	clause := `EXISTS (
		SELECT 1 FROM editions aed
		JOIN edition_assets aea ON aea.edition_id=aed.id
		JOIN assets aa ON aa.id=aea.asset_id
		WHERE aed.work_id=w.id AND aa.available=1
	)`
	if available {
		return clause
	}
	return "NOT " + clause
}

func atlasRatingValue(value string) (int,bool) {
	switch strings.TrimSpace(value) {
	case "5★": return 10,true
	case "4½★": return 9,true
	case "4★": return 8,true
	case "3½★": return 7,true
	case "3★": return 6,true
	case "2½★": return 5,true
	case "2★": return 4,true
	case "1½★": return 3,true
	case "1★": return 2,true
	case "½★": return 1,true
	case "Unrated": return 0,true
	default: return 0,false
	}
}

func atlasRatingExpression(profileID int64) string {
	id:=strconv.FormatInt(profileID,10)
	return `CASE COALESCE((SELECT rating FROM work_preferences wp WHERE wp.profile_id=`+id+` AND wp.work_id=w.id),0)
		WHEN 10 THEN '5★' WHEN 9 THEN '4½★' WHEN 8 THEN '4★' WHEN 7 THEN '3½★'
		WHEN 6 THEN '3★' WHEN 5 THEN '2½★' WHEN 4 THEN '2★' WHEN 3 THEN '1½★'
		WHEN 2 THEN '1★' WHEN 1 THEN '½★' ELSE 'Unrated' END`
}

func atlasFilter(p identity,kind,value string) (string,[]any,error) {
	value=strings.TrimSpace(value)
	if value=="" { return "",nil,errors.New("choose an Atlas value") }
	if len(value)>500 { return "",nil,errors.New("Atlas value is too long") }
	switch kind {
	case "author":
		if value=="Unknown author" {
			return "trim(w.author)=''",nil,nil
		}
		return "w.author=?",[]any{value},nil
	case "series":
		return "w.series=?",[]any{value},nil
	case "genre":
		return "w.genre=?",[]any{value},nil
	case "space":
		return "w.space=?",[]any{value},nil
	case "format":
		return "EXISTS (SELECT 1 FROM editions fed WHERE fed.work_id=w.id AND fed.format=?)",[]any{value},nil
	case "status":
		switch {
		case strings.EqualFold(value,"Available"):
			return atlasAvailabilityClause(true),nil,nil
		case strings.EqualFold(value,"Unavailable"):
			return atlasAvailabilityClause(false),nil,nil
		default:
			return "",nil,errors.New("choose Available or Unavailable")
		}
	case "reading":
		state:=workStateExpression(p.ID)
		switch value {
		case "Finished": return state+"='finished'",nil,nil
		case "In progress": return state+"='in-progress'",nil,nil
		case "Not started": return state+"='not-started'",nil,nil
		default: return "",nil,errors.New("choose Finished, In progress or Not started")
		}
	case "rating":
		rating,ok:=atlasRatingValue(value)
		if !ok{return "",nil,errors.New("choose a rating")}
		if rating==0 {
			return "NOT EXISTS (SELECT 1 FROM work_preferences wp WHERE wp.profile_id="+strconv.FormatInt(p.ID,10)+" AND wp.work_id=w.id AND wp.rating>0)",nil,nil
		}
		return "EXISTS (SELECT 1 FROM work_preferences wp WHERE wp.profile_id="+strconv.FormatInt(p.ID,10)+" AND wp.work_id=w.id AND wp.rating=?)",[]any{rating},nil
	case "favourite":
		if value!="Favourites"{return "",nil,errors.New("choose Favourites")}
		return "EXISTS (SELECT 1 FROM work_preferences wp WHERE wp.profile_id="+strconv.FormatInt(p.ID,10)+" AND wp.work_id=w.id AND wp.favourite=1)",nil,nil
	default:
		return "",nil,errors.New("unsupported Atlas relationship")
	}
}

func (a *app) atlasRelationshipFor(p identity,kind,value string) (atlasRelationship,error) {
	filter,args,e:=atlasFilter(p,kind,value)
	out:=atlasRelationship{
		Kind:kind,Value:value,Works:[]atlasWork{},
		Authors:[]atlasCount{},Series:[]atlasCount{},Genres:[]atlasCount{},
		Formats:[]atlasCount{},Spaces:[]atlasCount{},Availability:[]atlasCount{},
		Reading:[]atlasCount{},Ratings:[]atlasCount{},Favourites:[]atlasCount{},
	}
	if e!=nil{return out,e}

	baseArgs:=append([]any{},args...)
	baseArgs=append(baseArgs,p.Owner,p.ID)

	countSQL:=`SELECT count(*) FROM works w
		WHERE `+filter+`
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))`
	if e=a.db.QueryRow(countSQL,baseArgs...).Scan(&out.WorkCount);e!=nil{return out,e}

	workSQL:=`SELECT w.id,w.title,w.author,w.series,w.genre,w.space,
		count(DISTINCT ed.id),count(ea.asset_id),
		CASE WHEN count(DISTINCT ed.format)=1 THEN min(ed.format) ELSE 'Mixed' END,
		sum(CASE WHEN a.available=1 THEN 1 ELSE 0 END)
		FROM works w
		JOIN editions ed ON ed.work_id=w.id
		JOIN edition_assets ea ON ea.edition_id=ed.id
		JOIN assets a ON a.id=ea.asset_id
		WHERE `+filter+`
		AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
		GROUP BY w.id
		ORDER BY w.title,w.id
		LIMIT 50`
	rows,e:=a.db.Query(workSQL,baseArgs...)
	if e!=nil{return out,e}
	for rows.Next(){
		var x atlasWork
		var available int64
		if e=rows.Scan(&x.ID,&x.Title,&x.Author,&x.Series,&x.Genre,&x.Space,&x.Editions,&x.Files,&x.Format,&available);e!=nil{rows.Close();return out,e}
		x.Available=available>0
		out.Works=append(out.Works,x)
	}
	if e=rows.Err();e!=nil{rows.Close();return out,e}
	rows.Close()

	type relationSpec struct{
		target *[]atlasCount
		sql string
	}
	specs:=[]relationSpec{
		{&out.Authors,`SELECT CASE WHEN trim(w.author)='' THEN 'Unknown author' ELSE w.author END,count(*)
			FROM works w WHERE `+filter+`
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			GROUP BY CASE WHEN trim(w.author)='' THEN 'Unknown author' ELSE w.author END
			ORDER BY count(*) DESC,1 LIMIT 20`},
		{&out.Series,`SELECT w.series,count(*)
			FROM works w WHERE `+filter+` AND trim(w.series)<>''
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			GROUP BY w.series ORDER BY count(*) DESC,w.series LIMIT 20`},
		{&out.Genres,`SELECT w.genre,count(*)
			FROM works w WHERE `+filter+` AND trim(w.genre)<>''
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			GROUP BY w.genre ORDER BY count(*) DESC,w.genre LIMIT 20`},
		{&out.Formats,`SELECT ed.format,count(DISTINCT w.id)
			FROM works w JOIN editions ed ON ed.work_id=w.id
			WHERE `+filter+`
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			GROUP BY ed.format ORDER BY count(DISTINCT w.id) DESC,ed.format LIMIT 20`},
		{&out.Spaces,`SELECT w.space,count(*)
			FROM works w WHERE `+filter+`
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			GROUP BY w.space ORDER BY count(*) DESC,w.space LIMIT 20`},
		{&out.Availability,`SELECT
			CASE WHEN `+atlasAvailabilityClause(true)+` THEN 'Available' ELSE 'Unavailable' END,
			count(*)
			FROM works w WHERE `+filter+`
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			GROUP BY CASE WHEN `+atlasAvailabilityClause(true)+` THEN 'Available' ELSE 'Unavailable' END
			ORDER BY 1`},
		{&out.Reading,`SELECT CASE `+workStateExpression(p.ID)+`
			WHEN 'finished' THEN 'Finished' WHEN 'in-progress' THEN 'In progress' ELSE 'Not started' END,count(*)
			FROM works w WHERE `+filter+`
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			GROUP BY `+workStateExpression(p.ID)+`
			ORDER BY count(*) DESC,1`},
		{&out.Ratings,`SELECT `+atlasRatingExpression(p.ID)+`,count(*)
			FROM works w WHERE `+filter+`
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			GROUP BY `+atlasRatingExpression(p.ID)+`
			ORDER BY CASE `+atlasRatingExpression(p.ID)+`
				WHEN '5★' THEN 10 WHEN '4½★' THEN 9 WHEN '4★' THEN 8 WHEN '3½★' THEN 7
				WHEN '3★' THEN 6 WHEN '2½★' THEN 5 WHEN '2★' THEN 4 WHEN '1½★' THEN 3
				WHEN '1★' THEN 2 WHEN '½★' THEN 1 ELSE 0 END DESC`},
		{&out.Favourites,`SELECT 'Favourites',count(*)
			FROM works w WHERE `+filter+`
			AND EXISTS (SELECT 1 FROM work_preferences wp WHERE wp.profile_id=`+strconv.FormatInt(p.ID,10)+` AND wp.work_id=w.id AND wp.favourite=1)
			AND (? OR w.space IN (SELECT space FROM grants WHERE profile_id=?))
			HAVING count(*)>0`},
	}
	for _,spec:=range specs{
		rows,e=a.db.Query(spec.sql,baseArgs...)
		if e!=nil{return out,e}
		for rows.Next(){
			var item atlasCount
			if e=rows.Scan(&item.Name,&item.Count);e!=nil{rows.Close();return out,e}
			*spec.target=append(*spec.target,item)
		}
		if e=rows.Err();e!=nil{rows.Close();return out,e}
		rows.Close()
	}
	return out,nil
}

func (a *app) atlasRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/atlas-relationships",func(w http.ResponseWriter,r *http.Request){
		kind:=strings.TrimSpace(r.URL.Query().Get("kind"))
		value:=strings.TrimSpace(r.URL.Query().Get("value"))
		out,e:=a.atlasRelationshipFor(who(r),kind,value)
		if e!=nil{fail(w,400,e);return}
		reply(w,out)
	})
}
