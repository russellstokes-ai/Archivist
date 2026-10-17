package main

import (
 "context"
 "database/sql"
 "errors"
 "math"
 "net/http"
 "regexp"
 "sort"
 "strconv"
 "strings"
)

// Strict explicit comic issue tokens. Never interpret bare dates, years,
// ISBNs, "volume 2" or a filename's first number as an issue.
var comicHashToken=regexp.MustCompile(`(?i)(?:^|[^[:alnum:]])#\s*(\d{1,5}(?:\.\d{1,3})?)\b`)
var comicNamedToken=regexp.MustCompile(`(?i)\b(?:issue|no\.?|number)\s*#?\s*(\d{1,5}(?:\.\d{1,3})?)\b`)

// "match" requires one unambiguous explicit issue token. Titles with several
// distinct markers are ambiguous, even if one matches the indexed number.
func comicTitleIssue(title string)(float64,string){
 seen:=map[string]bool{}
 var values []float64
 for _,expr:=range []*regexp.Regexp{comicHashToken,comicNamedToken}{
  for _,m:=range expr.FindAllStringSubmatch(title,8){
   n,err:=strconv.ParseFloat(m[1],64)
   if err!=nil||math.IsInf(n,0)||math.IsNaN(n)||n<=0||n>100000{continue}
   key:=strconv.FormatFloat(n,'f',-1,64)
   if !seen[key]{seen[key]=true;values=append(values,n)}
  }
 }
 if len(values)>1{return 0,"ambiguous"}
 if len(values)==0{return 0,"unknown"}
 return values[0],"match"
}
func comicSeriesTitle(title string)string{
 removed:=comicNamedToken.ReplaceAllString(title," ")
 removed=comicHashToken.ReplaceAllString(removed," ")
 return strings.TrimSpace(strings.Trim(removed,"() []:;-,"))
}
func comicEnrichCandidate(c *multiMetadataCandidate,q multiMetadataQuery){
 if !strings.EqualFold(q.MediaFormat,"comic"){return}
 c.ComicSeriesMatch="unknown";c.ComicIssueMatch="unknown"
 if series:=strings.TrimSpace(q.Series);series!=""{
  other:=comicSeriesTitle(c.Title)
  coverage:=multiTokenOverlap(series,other)
  if strings.EqualFold(series,other)||coverage>=85{
   c.ComicSeriesMatch="match";c.Score+=25
   c.Reasons=append(c.Reasons,"Explicit comic series words align")
  }else{
   c.ComicSeriesMatch="mismatch";c.Score-=90
   c.Warnings=append(c.Warnings,"Comic series identity differs or includes an unverified volume")
  }
 }else{
  c.Warnings=append(c.Warnings,"No indexed comic series to corroborate")
 }
 expected:=strings.TrimSpace(q.IssueNumber)
 if expected!=""{
  wanted,err:=strconv.ParseFloat(expected,64)
  if err==nil&&!math.IsInf(wanted,0)&&!math.IsNaN(wanted)&&wanted>0&&wanted<=100000{
   found,status:=comicTitleIssue(c.Title)
   c.ComicIssueMatch=status
   switch{
   case status=="match" && found==wanted:
    c.Score+=45
    c.Reasons=append(c.Reasons,"Exact explicit comic issue number")
   case status=="match":
    c.ComicIssueMatch="mismatch";c.Score-=120
    c.Warnings=append(c.Warnings,"Different comic issue number; provider fields disabled")
   case status=="ambiguous":
    c.Score-=70
    c.Warnings=append(c.Warnings,"Multiple comic issue numbers; provider fields disabled")
   default:
    c.Warnings=append(c.Warnings,"Provider does not state a clear comic issue number")
   }
  }
 }else{
  c.Warnings=append(c.Warnings,"Indexed comic issue number is unknown")
 }
 // Even matching series/issue cannot verify a different publisher, reprint,
 // volume or variant edition. Rank remains guidance, never automatic proof.
 c.Warnings=append(c.Warnings,"Volume, imprint and variant edition are not independently verified")
 if c.ComicSeriesMatch!="match"||c.ComicIssueMatch!="match"{
  c.Tier="check carefully"
 }else if c.Score>=80{
  c.Tier="possible comic issue"
 }else{
  c.Tier="check carefully"
 }
}

const comicAuditMemberCap=40
const comicAuditPeerCap=100
type comicAuditMember struct{
 AssetID int64 `json:"assetId"`
 EditionID int64 `json:"editionId"`
 Title string `json:"title"`
 Series string `json:"series"`
 IssueNumber float64 `json:"issueNumber"`
 Year int `json:"year"`
 MetadataSource string `json:"metadataSource"`
 Available bool `json:"available"`
 NeedsReview bool `json:"needsReview"`
}
type comicAuditPeer struct{
 WorkID int64 `json:"workId"`
 Title string `json:"title"`
 IssueNumber float64 `json:"issueNumber"`
 Year int `json:"year"`
}
type comicAuditResult struct{
 WorkID int64 `json:"workId"`
 Fingerprint string `json:"fingerprint"`
 Series string `json:"series"`
 IssueNumber string `json:"issueNumber"`
 IssueSource string `json:"issueSource"`
 FileEvidence []comicAuditMember `json:"fileEvidence"`
 FileEvidenceTruncated bool `json:"fileEvidenceTruncated"`
 Peers []comicAuditPeer `json:"peers"`
 PeersTruncated bool `json:"peersTruncated"`
 PossibleGaps []int `json:"possibleGaps"`
 Warnings []string `json:"warnings"`
}

func workFieldValue(state workMetaState,name string)workMetaField{
 for _,f:=range state.Fields{if f.Name==name{return f}}
 return workMetaField{Name:name}
}
func (a *app)readComicAudit(ctx context.Context,tx *sql.Tx,state workMetaState)(comicAuditResult,error){
 out:=comicAuditResult{
  WorkID:state.WorkID,Fingerprint:state.Fingerprint,
  FileEvidence:[]comicAuditMember{},Peers:[]comicAuditPeer{},PossibleGaps:[]int{},Warnings:[]string{},
 }
 if len(state.Editions)==0{return out,errors.New("book has no comic edition")}
 for _,e:=range state.Editions{
  if e.Format!="Comic"{return out,errors.New("comic audit needs a comic-only book; mixed editions require separate review")}
 }
 series,issue:=workFieldValue(state,"series"),workFieldValue(state,"seriesNumber")
 out.Series=strings.TrimSpace(series.Value)
 out.IssueNumber=strings.TrimSpace(issue.Value)
 out.IssueSource=issue.Source
 if out.Series==""{out.Warnings=append(out.Warnings,"No indexed series; check the embedded ComicInfo or original file metadata")}
 if out.IssueNumber==""||issue.Conflicting{
  out.Warnings=append(out.Warnings,"Issue number is missing or conflicting; no issue identification is asserted")
 }
 if len(state.Editions)>1{out.Warnings=append(out.Warnings,"Several editions are grouped; their volumes and variants must be reviewed separately")}
 out.Warnings=append(out.Warnings,"Volume, publisher, reprints and variant covers are not represented by this series/issue identity")
 rows,err:=tx.QueryContext(ctx,`SELECT ed.id,a.id,a.title,a.series,a.series_number,a.published_year,
 a.metadata_source,a.available,a.needs_review
 FROM editions ed JOIN edition_assets ea ON ea.edition_id=ed.id
 JOIN assets a ON a.id=ea.asset_id
 WHERE ed.work_id=? AND ed.format='Comic'
 ORDER BY ed.id,ea.position,a.id LIMIT ?`,state.WorkID,comicAuditMemberCap+1)
 if err!=nil{return out,err}
 for rows.Next(){
  var m comicAuditMember
  if err=rows.Scan(&m.EditionID,&m.AssetID,&m.Title,&m.Series,&m.IssueNumber,&m.Year,
   &m.MetadataSource,&m.Available,&m.NeedsReview);err!=nil{rows.Close();return out,err}
  out.FileEvidence=append(out.FileEvidence,m)
 }
 if err=rows.Err();err!=nil{rows.Close();return out,err};rows.Close()
 if len(out.FileEvidence)>comicAuditMemberCap{
  out.FileEvidence=out.FileEvidence[:comicAuditMemberCap]
  out.FileEvidenceTruncated=true
  out.Warnings=append(out.Warnings,"Only the first 40 indexed source files are shown")
 }
 missingFile:=false;disagreement:=false
 number,numberErr:=strconv.ParseFloat(out.IssueNumber,64)
 for _,m:=range out.FileEvidence{
  if !m.Available{missingFile=true}
  if out.Series!=""&&m.Series!=""&&!strings.EqualFold(strings.TrimSpace(m.Series),out.Series){disagreement=true}
  if numberErr==nil&&number>0&&m.IssueNumber>0&&m.IssueNumber!=number{disagreement=true}
 }
 if missingFile{out.Warnings=append(out.Warnings,"One or more indexed comic files are unavailable; source metadata may be stale")}
 if disagreement{out.Warnings=append(out.Warnings,"Stored file-level comic evidence disagrees with the effective book fields")}
 if out.Series==""{return out,nil}
 // Same library space, Comic format, and exact series label. Read-only SQLite
 // snapshot: no disk walk, network access, sorting, regrouping or publication.
 peers,err:=tx.QueryContext(ctx,`SELECT w.id,w.title,
 CASE WHEN EXISTS(SELECT 1 FROM work_field_controls wc WHERE wc.work_id=w.id AND wc.field='seriesNumber')
   THEN COALESCE((SELECT CAST(NULLIF(wc.value,'') AS REAL) FROM work_field_controls wc
                  WHERE wc.work_id=w.id AND wc.field='seriesNumber'),0)
   ELSE COALESCE(CASE WHEN COUNT(DISTINCT NULLIF(a.series_number,0))=1
                      THEN MIN(NULLIF(a.series_number,0)) ELSE 0 END,0) END,
 CASE WHEN EXISTS(SELECT 1 FROM work_field_controls wy WHERE wy.work_id=w.id AND wy.field='publishedYear')
   THEN COALESCE((SELECT CAST(NULLIF(wy.value,'') AS INTEGER) FROM work_field_controls wy
                  WHERE wy.work_id=w.id AND wy.field='publishedYear'),0)
   ELSE COALESCE(CASE WHEN COUNT(DISTINCT NULLIF(a.published_year,0))=1
                      THEN MIN(NULLIF(a.published_year,0)) ELSE 0 END,0) END
 FROM works w JOIN editions ed ON ed.work_id=w.id AND ed.format='Comic'
 JOIN edition_assets ea ON ea.edition_id=ed.id JOIN assets a ON a.id=ea.asset_id
 WHERE w.space=? AND TRIM(w.series)=? COLLATE NOCASE
 GROUP BY w.id ORDER BY w.id LIMIT ?`,state.Space,out.Series,comicAuditPeerCap+1)
 if err!=nil{return out,err}
 for peers.Next(){
  var p comicAuditPeer
  if err=peers.Scan(&p.WorkID,&p.Title,&p.IssueNumber,&p.Year);err!=nil{peers.Close();return out,err}
  out.Peers=append(out.Peers,p)
 }
 if err=peers.Err();err!=nil{peers.Close();return out,err};peers.Close()
 if len(out.Peers)>comicAuditPeerCap{
  out.Peers=out.Peers[:comicAuditPeerCap];out.PeersTruncated=true
  out.Warnings=append(out.Warnings,"Over 100 same-series records; no gap inference on a partial result")
  return out,nil
 }
 // Potential gap detection is intentionally conservative. A missing issue
 // number is not evidence of a missing purchased file or absent publication.
 positions:=map[int]bool{}
 year:=0;ambiguous:=false;first,last:=int(0),int(0)
 for _,p:=range out.Peers{
  if p.IssueNumber<=0||p.IssueNumber>10000||math.IsNaN(p.IssueNumber)||
   math.IsInf(p.IssueNumber,0)||math.Trunc(p.IssueNumber)!=p.IssueNumber||p.Year<=0{
   ambiguous=true;break
  }
  if year==0{year=p.Year}else if year!=p.Year{ambiguous=true;break}
  n:=int(p.IssueNumber)
  if positions[n]{ambiguous=true;out.Warnings=append(out.Warnings,"Repeated series/issue number; reprint or different volume may exist")}
  positions[n]=true
  if first==0||n<first{first=n}
  if n>last{last=n}
 }
 if len(positions)<2||last-first>50||ambiguous{
  return out,nil
 }
 for n:=first+1;n<last;n++{
  if !positions[n]{
   out.PossibleGaps=append(out.PossibleGaps,n)
   if len(out.PossibleGaps)>=20{break}
  }
 }
 if len(out.PossibleGaps)>0{
  out.Warnings=append(out.Warnings,"Possible gaps are between observed issues of the same year, not proof of missing books")
 }
 sort.Ints(out.PossibleGaps)
 return out,nil
}
func (a *app)comicAuditRoutes(mux *http.ServeMux){
 mux.HandleFunc("GET /api/manage/works/{id}/comic-audit",func(w http.ResponseWriter,r *http.Request){
  id,ok:=workMetaRouteID(w,r);if !ok{return}
  tx,err:=a.db.BeginTx(r.Context(),&sql.TxOptions{ReadOnly:true})
  if err!=nil{fail(w,500,errors.New("unable to inspect comic catalogue"));return}
  defer tx.Rollback()
  state,err:=a.readWorkMeta(r.Context(),tx,id)
  if err!=nil{workMetaRouteFailure(w,err);return}
  audit,err:=a.readComicAudit(r.Context(),tx,state)
  if err!=nil{workMetaRouteFailure(w,err);return}
  if err=tx.Commit();err!=nil{fail(w,500,errors.New("comic catalogue snapshot expired"));return}
  reply(w,audit)
 })
}
