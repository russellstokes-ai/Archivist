package main

import (
	"errors"
	"net/http"
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

func atlasFilter(kind,value string) (string,[]any,error) {
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
	default:
		return "",nil,errors.New("unsupported Atlas relationship")
	}
}

func (a *app) atlasRelationshipFor(p identity,kind,value string) (atlasRelationship,error) {
	filter,args,e:=atlasFilter(kind,value)
	out:=atlasRelationship{
		Kind:kind,Value:value,Works:[]atlasWork{},
		Authors:[]atlasCount{},Series:[]atlasCount{},Genres:[]atlasCount{},
		Formats:[]atlasCount{},Spaces:[]atlasCount{},Availability:[]atlasCount{},
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
