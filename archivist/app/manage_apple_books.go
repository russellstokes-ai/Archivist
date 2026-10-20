package main

import (
 "encoding/json"
 "errors"
 "net/url"
 "strconv"
 "strings"
)

// Only text identity metadata is consumed. Apple artwork, previews and other
// promotional content have separate usage conditions and are never imported.
func parseAppleBooksMulti(raw []byte, q multiMetadataQuery) ([]multiMetadataCandidate, error) {
 var response struct {
  Results *[]struct {
   Kind string `json:"kind"`
   WrapperType string `json:"wrapperType"`
   TrackID int64 `json:"trackId"`
   CollectionID int64 `json:"collectionId"`
   TrackName string `json:"trackName"`
   CollectionName string `json:"collectionName"`
   ArtistName string `json:"artistName"`
   ReleaseDate string `json:"releaseDate"`
   TrackViewURL string `json:"trackViewUrl"`
   CollectionViewURL string `json:"collectionViewUrl"`
  } `json:"results"`
 }
 if err:=json.Unmarshal(raw,&response);err!=nil{return nil,err}
 if response.Results==nil{return nil,errors.New("Apple Books response missing results")}
 out:=[]multiMetadataCandidate{}
 for _,entry:=range *response.Results {
  id,title,link:=entry.TrackID,entry.TrackName,entry.TrackViewURL
  switch {
  case entry.Kind=="ebook":
  case entry.WrapperType=="audiobook":id,title,link=entry.CollectionID,entry.CollectionName,entry.CollectionViewURL
  default:continue
  }
  title=strings.TrimSpace(title)
  if id<=0||title==""||len(title)>1000||len(entry.ArtistName)>1000 {continue}
  // Store links are display-only and restricted to Apple's HTTPS book store.
  sourceURL:=""
  if u,err:=url.Parse(link);err==nil&&u.Scheme=="https"&&u.Host=="books.apple.com"&&u.User==nil {
   sourceURL=u.String()
  }
  c:=multiMetadataCandidate{
   publicMetadataCandidate:publicMetadataCandidate{WorkID:"apple-books:"+strconv.FormatInt(id,10),Title:title,Author:strings.TrimSpace(entry.ArtistName),Source:"Apple Books"},
   SourceURL:sourceURL,YearType:"store release",Reasons:[]string{},
   Warnings:[]string{"US Apple Books storefront; store release date may differ from first publication; ISBN and edition identity are unverified"},
  }
  if len(entry.ReleaseDate)>=4 {
   year,err:=strconv.Atoi(entry.ReleaseDate[:4]);if err==nil&&year>=1000&&year<=3000{c.PublishedYear=year}
  }
  multiRank(&c,q)
  out=append(out,c)
  if len(out)>=10{break}
 }
 return out,nil
}

func appleBooksSearchURL(search,format string)string {
 media,entity:="ebook","ebook"
 if strings.EqualFold(format,"audio")||strings.EqualFold(format,"audiobook") {media,entity="audiobook","audiobook"}
 values:=url.Values{"term":{search},"media":{media},"entity":{entity},"limit":{"10"},"country":{"US"}}
 return "https://itunes.apple.com/search?"+values.Encode()
}
