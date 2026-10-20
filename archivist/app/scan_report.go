package main

import (
 "encoding/json"
 "net/http"
 "runtime"
 "path/filepath"
 "strings"
 "time"
)

type scanExtensionEvidence struct {
 Extension string `json:"extension"`
 Imported int `json:"imported"`
 Skipped int `json:"skipped"`
 Examples []string `json:"examples"`
}
type scanDiscoveryReport struct {
 CompletedAt string `json:"completedAt"`
 Reasons map[string]*scanReasonEvidence `json:"reasons,omitempty"`
 Extensions map[string]*scanExtensionEvidence `json:"extensions"`
 PathFallback int `json:"pathFallback"`
 Symlinks int `json:"symlinks"`
}
func newScanDiscoveryReport()*scanDiscoveryReport{return &scanDiscoveryReport{Extensions:map[string]*scanExtensionEvidence{}}}
func (d *scanDiscoveryReport)observe(path string, imported bool){
 ext:=strings.ToLower(filepath.Ext(path));if ext==""{ext="(no extension)"};if len(ext)>30{ext="(long extension)"}
 if _,ok:=d.Extensions[ext];!ok&&len(d.Extensions)>=100{ext="(other extensions)"}
 e:=d.Extensions[ext];if e==nil{e=&scanExtensionEvidence{Extension:ext,Examples:[]string{}};d.Extensions[ext]=e}
 if imported{e.Imported++}else{e.Skipped++;if len(e.Examples)<5{name:=filepath.Base(path);if len(name)>180{name=name[:180]};e.Examples=append(e.Examples,name)}}
}
func (a *app)discoveryReportRoutes(mux *http.ServeMux){
 mux.HandleFunc("GET /api/manage/scan-report",func(w http.ResponseWriter,r *http.Request){
  if !who(r).Owner{http.Error(w,"administrator access required",403);return}
  type source struct{ID int64 `json:"id"`;Name string `json:"name"`;Status string `json:"status"`;Report *scanDiscoveryReport `json:"report"`}
  sources:=[]source{}
  rows,err:=a.db.QueryContext(r.Context(),`SELECT s.id,s.space,s.status,COALESCE(m.value,'') FROM sources s LEFT JOIN app_meta m ON m.key='scan_report_'||s.id ORDER BY s.id`)
  if err!=nil{fail(w,500,err);return}
  for rows.Next(){var s source;var raw string;if err=rows.Scan(&s.ID,&s.Name,&s.Status,&raw);err!=nil{rows.Close();fail(w,500,err);return};if raw!=""{if err=json.Unmarshal([]byte(raw),&s.Report);err!=nil{rows.Close();fail(w,500,err);return}};sources=append(sources,s)}
  err=rows.Err();rows.Close();if err!=nil{fail(w,500,err);return}
  var books,missingAuthor,missingGenre,missingYear int64
  // Year follows the work editor: explicit work override, otherwise unanimous
  // nonzero file years. Never count missing chapter years as missing books.
  err=a.db.QueryRowContext(r.Context(),`SELECT count(*),COALESCE(sum(trim(author)=''),0),COALESCE(sum(trim(genre)=''),0),COALESCE(sum(COALESCE((SELECT NULLIF(CAST(c.value AS INTEGER),0) FROM work_field_controls c WHERE c.work_id=w.id AND c.field='publishedYear'),CASE WHEN NOT EXISTS(SELECT 1 FROM work_field_controls c WHERE c.work_id=w.id AND c.field='publishedYear') THEN (SELECT CASE WHEN count(DISTINCT NULLIF(a.published_year,0))=1 THEN max(a.published_year) ELSE 0 END FROM editions e JOIN edition_assets ea ON ea.edition_id=e.id JOIN assets a ON a.id=ea.asset_id WHERE e.work_id=w.id) END,0)=0),0) FROM published_works w`).Scan(&books,&missingAuthor,&missingGenre,&missingYear)
  if err!=nil{fail(w,500,err);return}
  attempts:=map[string]int64{}
  rows,err=a.db.QueryContext(r.Context(),`SELECT CASE WHEN m.work_id IS NULL THEN 'waiting' WHEN m.retry_at<=? THEN 'retry due' ELSE m.status END,count(*) FROM published_works w LEFT JOIN automatic_metadata_attempts m ON m.work_id=w.id GROUP BY 1`,time.Now().Unix())
  if err!=nil{fail(w,500,err);return};for rows.Next(){var status string;var n int64;if err=rows.Scan(&status,&n);err!=nil{break};attempts[status]=n};if err==nil{err=rows.Err()};rows.Close();if err!=nil{fail(w,500,err);return}
  type repeated struct{Title string `json:"title"`;Works int64 `json:"works"`;DistinctSeries int64 `json:"distinctSeries"`}
  repeatedTitles:=[]repeated{}
  rows,err=a.db.QueryContext(r.Context(),`SELECT min(title),count(*),count(DISTINCT lower(series)) FROM works GROUP BY lower(trim(title)) HAVING count(*)>1 ORDER BY count(*) DESC,lower(title) LIMIT 50`)
  if err!=nil{fail(w,500,err);return};for rows.Next(){var d repeated;if err=rows.Scan(&d.Title,&d.Works,&d.DistinctSeries);err!=nil{break};repeatedTitles=append(repeatedTitles,d)};if err==nil{err=rows.Err()};rows.Close();if err!=nil{fail(w,500,err);return}

  // Bounded indexed evidence makes reports useful without exporting the database.
  type formatCount struct{Format string `json:"format"`;MetadataSource string `json:"metadataSource"`;Files int64 `json:"files"`;MissingAuthor int64 `json:"missingAuthor"`;MissingGenre int64 `json:"missingGenre"`;MissingYear int64 `json:"missingYear"`}
  formats:=[]formatCount{}
  rows,err=a.db.QueryContext(r.Context(),`SELECT format,metadata_source,count(*),sum(trim(author)=''),sum(trim(genre)=''),sum(published_year=0) FROM assets GROUP BY format,metadata_source ORDER BY format,metadata_source`)
  if err!=nil{fail(w,500,err);return};for rows.Next(){var x formatCount;if err=rows.Scan(&x.Format,&x.MetadataSource,&x.Files,&x.MissingAuthor,&x.MissingGenre,&x.MissingYear);err!=nil{break};formats=append(formats,x)};if err==nil{err=rows.Err()};rows.Close();if err!=nil{fail(w,500,err);return}
  type example struct{ID int64 `json:"id"`;SourceID int64 `json:"sourceId"`;Filename string `json:"filename"`;Title string `json:"title"`;Format string `json:"format"`;MetadataSource string `json:"metadataSource"`;Confidence int64 `json:"confidence"`;Series string `json:"series"`;IssueNumber float64 `json:"issueNumber"`;Year int `json:"year"`;ReviewReason string `json:"reviewReason"`;NeedsReview bool `json:"needsReview"`}
  examples:=[]example{}
  rows,err=a.db.QueryContext(r.Context(),`SELECT id,source_id,relative_path,title,format,metadata_source,metadata_confidence,series,series_number,published_year,review_reason,needs_review FROM assets WHERE needs_review=1 OR trim(genre)='' OR published_year=0 ORDER BY needs_review DESC,metadata_confidence,id LIMIT 100`)
  if err!=nil{fail(w,500,err);return};for rows.Next(){var x example;if err=rows.Scan(&x.ID,&x.SourceID,&x.Filename,&x.Title,&x.Format,&x.MetadataSource,&x.Confidence,&x.Series,&x.IssueNumber,&x.Year,&x.ReviewReason,&x.NeedsReview);err!=nil{break};x.Filename=filepath.Base(strings.ReplaceAll(x.Filename,"\\","/"));examples=append(examples,x)};if err==nil{err=rows.Err()};rows.Close();if err!=nil{fail(w,500,err);return}
  type job struct{ID int64 `json:"id"`;SourceID int64 `json:"sourceId"`;State string `json:"state"`;Progress int64 `json:"progress"`;Total int64 `json:"total"`}
  jobs:=[]job{}
  rows,err=a.db.QueryContext(r.Context(),`SELECT id,source_id,state,progress,total FROM jobs ORDER BY id DESC LIMIT 30`)
  if err!=nil{fail(w,500,err);return};for rows.Next(){var j job;if err=rows.Scan(&j.ID,&j.SourceID,&j.State,&j.Progress,&j.Total);err!=nil{break};jobs=append(jobs,j)};if err==nil{err=rows.Err()};rows.Close();if err!=nil{fail(w,500,err);return}

  w.Header().Set("Cache-Control","no-store")
  if r.URL.Query().Get("download")=="1"{w.Header().Set("Content-Disposition",`attachment; filename="archivist-scan-report.json"`)}
  reply(w,map[string]any{"schemaVersion":2,"buildVersion":buildVersion,"runtime":map[string]string{"os":runtime.GOOS,"architecture":runtime.GOARCH,"go":runtime.Version()},"recentJobs":jobs,"formats":formats,"metadataExamples":examples,"sampleLimits":map[string]int{"metadataExamples":100,"repeatedTitles":50,"skippedExamplesPerExtension":5},"generatedAt":time.Now().UTC().Format(time.RFC3339),"sources":sources,"books":map[string]int64{"total":books,"missingAuthor":missingAuthor,"missingGenre":missingGenre,"missingYear":missingYear},"automaticMetadataEnabled":a.automaticMetadataEnabled(),"enrichment":attempts,"repeatedTitles":repeatedTitles,"note":"Read-only report. Filenames and titles are included; no source roots, access keys or media bytes. Extension evidence requires a completed scan on this version. Repeated titles are candidates, not confirmed duplicates; nothing is merged. Path fallback means no selected embedded/sidecar metadata, not proof of archive damage."})
 })
}

type scanReasonEvidence struct {Count int `json:"count"`; Examples []string `json:"examples"`}
func (d *scanDiscoveryReport)observeReason(filename,reason string){
 if d.Reasons==nil{d.Reasons=map[string]*scanReasonEvidence{}}
 item:=d.Reasons[reason];if item==nil{item=&scanReasonEvidence{Examples:[]string{}};d.Reasons[reason]=item};item.Count++
 if len(item.Examples)<5{name:=filepath.Base(filename);if len(name)>180{name=name[:180]};item.Examples=append(item.Examples,name)}
}
