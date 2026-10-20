package main

import (
 "context"
 "encoding/json"
 "errors"
 "net/http"
 "regexp"
 "time"
)

var openLibraryWorkKey=regexp.MustCompile(`^/works/OL[0-9]{1,15}W$`)

func parseOpenLibraryDetails(raw []byte,q multiMetadataQuery)([]multiMetadataCandidate,error){
 var work struct{Key string `json:"key"`;Description json.RawMessage `json:"description"`}
 if err:=json.Unmarshal(raw,&work);err!=nil{return nil,err}
 if !openLibraryWorkKey.MatchString(q.Search)||work.Key!=q.Search{return nil,errors.New("provider returned a different work")}
 var description string
 if len(work.Description)>0{
  if err:=json.Unmarshal(work.Description,&description);err!=nil{
   var text struct{Value string `json:"value"`}
   if err:=json.Unmarshal(work.Description,&text);err!=nil{return nil,err}
   description=text.Value
  }
 }
 return []multiMetadataCandidate{{publicMetadataCandidate:publicMetadataCandidate{WorkID:work.Key,Source:"Open Library"},Description:metadataPlainText(description,20000)}},nil
}

func(a *app) metadataDetailRoutes(mux *http.ServeMux){
 mux.HandleFunc("GET /api/manage/metadata-details",func(w http.ResponseWriter,r *http.Request){
  if !who(r).Owner{fail(w,403,errors.New("administrator only"));return}
  key:=r.URL.Query().Get("work")
  if !openLibraryWorkKey.MatchString(key){fail(w,400,errors.New("choose an Open Library work result"));return}
  ctx,cancel:=context.WithTimeout(r.Context(),6*time.Second);defer cancel()
  client:=&http.Client{Timeout:6*time.Second,CheckRedirect:func(*http.Request,[]*http.Request)error{return http.ErrUseLastResponse}}
  found,_,succeeded:=a.metadataCache.lookup(ctx,client,[]multiMetadataEndpoint{{Name:"Open Library details",URL:"https://openlibrary.org"+key+".json"}},multiMetadataQuery{Search:key})
  if succeeded!=1||len(found)!=1{fail(w,502,errors.New("description unavailable; wait a moment and retry"));return}
  reply(w,map[string]string{"description":found[0].Description,"source":"Open Library"})
 })
}
