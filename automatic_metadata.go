package main

import (
 "context"
 "encoding/json"
 "net/http"
 "net/url"
 "strconv"
 "strings"
 "time"
)

// Recognised genres only: a subject such as a place or language is not a genre.
func atlasGenre(subjects []string) string {
 genres:=[]string{"Science fiction","Fantasy","Mystery","Thriller","Horror","Romance","Historical fiction","Biography","Autobiography","History","Science","Poetry","Drama","Adventure","Humor","Children's fiction","Young adult fiction","Nonfiction","Fiction"}
 for _,genre:=range genres {for _,subject:=range subjects {
  if strings.EqualFold(strings.TrimSpace(subject),genre){return genre}
 }}
 return ""
}

func automaticMetadataCandidate(items []multiMetadataCandidate,q multiMetadataQuery)(multiMetadataCandidate,bool){
 var chosen multiMetadataCandidate
 found:=false
 for _,c:=range items {
  if c.IdentifierMismatch {continue}
  exactText:=q.Title!=""&&q.Author!=""&&strings.Join(multiTokens(q.Title)," ")==strings.Join(multiTokens(c.Title)," ")&&strings.Join(multiTokens(q.Author)," ")==strings.Join(multiTokens(c.Author)," ")
  if !c.ISBNExact&&!c.ASINExact&&!exactText {continue}
  // A book ISBN search cannot establish a particular comic issue.
  if strings.EqualFold(q.MediaFormat,"Comic")&&(c.ComicSeriesMatch!="match"||c.ComicIssueMatch!="match"){continue}
  if found&&chosen.WorkID!=c.WorkID{return multiMetadataCandidate{},false}
  chosen=c;found=true
 }
 return chosen,found
}

func automaticMetadataValues(state workMetaState,c multiMetadataCandidate)map[string]string{
 possible:=map[string]string{"author":c.Author,"genre":c.Genre,"description":c.Description,"language":c.Language,"narrator":c.Narrator,"series":c.Series}
 if c.YearType=="first publication"&&c.PublishedYear>=1000&&c.PublishedYear<=time.Now().Year()+1{possible["publishedYear"]=strconv.Itoa(c.PublishedYear)}
 out:=map[string]string{}
 for _,field:=range state.Fields{
  if field.Locked||field.Conflicting||(field.Value!=""&&field.Value!="0"){continue}
  // An explicitly saved empty field is a user choice too.
  if field.Source!=""&&field.Source!="catalogue"&&field.Source!="missing from files"&&field.Source!="derived from files"{continue}
  if value:=possible[field.Name];value!=""{out[field.Name]=value}
 }
 return out
}

func (a *app)initAutomaticMetadata()error{
 _,err:=a.db.Exec(`CREATE TABLE IF NOT EXISTS automatic_metadata_attempts(
 work_id INTEGER PRIMARY KEY REFERENCES works(id) ON DELETE CASCADE,
 retry_at INTEGER NOT NULL, status TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS automatic_metadata_retry ON automatic_metadata_attempts(retry_at);`)
 return err
}

func (a *app)automaticMetadataEnabled()bool{
 var value string
 _=a.db.QueryRow("SELECT value FROM app_meta WHERE key='automatic_metadata_enabled'").Scan(&value)
 return value!="0"
}

func (a *app)automaticMetadataRoutes(mux *http.ServeMux){
 mux.HandleFunc("GET /api/manage/automatic-metadata",func(w http.ResponseWriter,r *http.Request){
  if !who(r).Owner{http.Error(w,"administrator access required",403);return}
  reply(w,map[string]bool{"enabled":a.automaticMetadataEnabled()})
 })
 mux.HandleFunc("PUT /api/manage/automatic-metadata",func(w http.ResponseWriter,r *http.Request){
  if !who(r).Owner{http.Error(w,"administrator access required",403);return}
  var in struct{Enabled *bool `json:"enabled"`}
  if json.NewDecoder(http.MaxBytesReader(w,r.Body,1024)).Decode(&in)!=nil||in.Enabled==nil{http.Error(w,"enabled is required",400);return}
  value:="0";if *in.Enabled{value="1"}
  if _,err:=a.db.Exec("INSERT INTO app_meta(key,value) VALUES('automatic_metadata_enabled',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",value);err!=nil{fail(w,500,err);return}
  reply(w,map[string]bool{"enabled":*in.Enabled})
 })
}

// One bounded lookup at a time, independent of the filesystem scanner. Durable
// retry times prevent restarting a Pi from querying the entire library again.
func (a *app)automaticMetadataWorker(ctx context.Context){
 ticker:=time.NewTicker(3*time.Second);defer ticker.Stop()
 for {select{case <-ctx.Done():return;case <-ticker.C:
  if a.automaticMetadataEnabled(){a.enrichNextWork(ctx)}
 }}
}

func (a *app)enrichNextWork(ctx context.Context){
 var id int64
 now:=time.Now().Unix()
 err:=a.db.QueryRowContext(ctx,`SELECT w.id FROM published_works w
 LEFT JOIN automatic_metadata_attempts m ON m.work_id=w.id
 WHERE (m.work_id IS NULL OR m.retry_at<=?) AND trim(w.title)<>''
 ORDER BY COALESCE(m.retry_at,0),w.id LIMIT 1`,now).Scan(&id)
 if err!=nil{return}
 retry:=now+7*24*3600;status:="no confident match"
 defer func(){_,_=a.db.Exec("INSERT INTO automatic_metadata_attempts(work_id,retry_at,status) VALUES(?,?,?) ON CONFLICT(work_id) DO UPDATE SET retry_at=excluded.retry_at,status=excluded.status",id,retry,status)}()
 state,err:=a.readWorkMeta(ctx,a.db,id);if err!=nil{retry=now+3600;return}
 fields:=map[string]string{};missing:=false
 for _,f:=range state.Fields{fields[f.Name]=f.Value;if !f.Locked&&!f.Conflicting&&(f.Value==""||f.Value=="0")&&(f.Name=="genre"||f.Name=="publishedYear"||f.Name=="description"){missing=true}}
 if !missing{status="details present";return}
 if len(state.Editions)!=1{status="multiple editions require matching";return}
 q:=multiMetadataQuery{Title:fields["title"],Author:fields["author"],ISBN:normalValidISBN(fields["isbn"]),ASIN:normalASIN(fields["asin"]),MediaFormat:state.Editions[0].Format,Series:fields["series"],IssueNumber:fields["seriesNumber"]}
 if q.Title==""||q.Title=="Untitled"||(q.Author==""&&q.ISBN==""&&q.ASIN==""){return}
 search:="title:\""+q.Title+"\" author:\""+q.Author+"\""
 if q.ISBN!=""{search="isbn:"+q.ISBN}
 endpoints:=[]multiMetadataEndpoint{{Name:"Open Library",URL:"https://openlibrary.org/search.json?q="+url.QueryEscape(search)+"&fields=key,title,author_name,first_publish_year,isbn,subject&limit=10"}}
 if q.MediaFormat=="Audio"&&q.ASIN!=""{endpoints=append(endpoints,multiMetadataEndpoint{Name:"Audnexus",URL:"https://api.audnex.us/books/"+q.ASIN+"?region=us&update=0&seedAuthors=0"})}
 lookupCtx,cancel:=context.WithTimeout(ctx,8*time.Second);defer cancel()
 client:=&http.Client{Timeout:8*time.Second,CheckRedirect:func(*http.Request,[]*http.Request)error{return http.ErrUseLastResponse}}
 candidates,_,succeeded:=a.metadataCache.lookup(lookupCtx,client,endpoints,q)
 if succeeded==0{retry=now+3600;status="provider unavailable";return}
 var chosen multiMetadataCandidate
 matched:=false
 for _,provider:=range []string{"Audnexus","Open Library"} {
  subset:=[]multiMetadataCandidate{}
  for _,c:=range candidates{if c.Source==provider{subset=append(subset,c)}}
  candidate,ok:=automaticMetadataCandidate(subset,q);if !ok{continue}
  if !matched{chosen=candidate;matched=true;continue}
  if chosen.Genre==""{chosen.Genre=candidate.Genre}
  if candidate.YearType=="first publication"{chosen.PublishedYear=candidate.PublishedYear;chosen.YearType=candidate.YearType}
  chosen.Source+=" + "+candidate.Source
 }
 if !matched{return}
 if a.saveAutomaticMetadata(ctx,state,chosen){status="filled missing details"}
}

func (a *app)saveAutomaticMetadata(ctx context.Context,state workMetaState,chosen multiMetadataCandidate)bool{
 id:=state.WorkID;now:=time.Now().Unix()
 a.scanMu.Lock();defer a.scanMu.Unlock()
 if !a.automaticMetadataEnabled(){return false}
 tx,err:=a.db.BeginTx(ctx,nil);if err!=nil{return false};defer tx.Rollback()
 current,err:=a.readWorkMeta(ctx,tx,id);if err!=nil||current.Fingerprint!=state.Fingerprint{return false}
 values:=automaticMetadataValues(current,chosen)
 if len(values)==0{return false}
 for field,value:=range values{
  var protected int
  if err=tx.QueryRowContext(ctx,`SELECT count(*) FROM asset_field_controls ac JOIN edition_assets ea ON ea.asset_id=ac.asset_id JOIN editions ed ON ed.id=ea.edition_id WHERE ed.work_id=? AND ac.field=? AND (ac.locked=1 OR ac.source='manual')`,id,field).Scan(&protected);err!=nil{return false}
  if protected>0{continue}

  if _,err=tx.ExecContext(ctx,`INSERT OR IGNORE INTO work_field_controls(work_id,field,value,source,locked,updated_at) VALUES(?,?,?,?,0,?)`,id,field,value,"automatic "+chosen.Source+" identity match",now);err!=nil{return false}
 }
 if err=applyWorkOverridesTx(tx,id);err!=nil{return false}
 if _,err=tx.ExecContext(ctx,`INSERT INTO work_metadata_revisions(work_id,revision) VALUES(?,1) ON CONFLICT(work_id) DO UPDATE SET revision=revision+1`,id);err!=nil{return false}
 return tx.Commit()==nil
}
