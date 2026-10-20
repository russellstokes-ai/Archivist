package main

import (
 "encoding/json"
 "errors"
 "html"
 "strings"
 "unicode/utf8"

 "github.com/microcosm-cc/bluemonday"
)

var metadataTextPolicy=bluemonday.StrictPolicy()

func metadataPlainText(value string,limit int)string{
 value=strings.TrimSpace(html.UnescapeString(metadataTextPolicy.Sanitize(value)))
 if len(value)>limit{value=value[:limit];for !utf8.ValidString(value){value=value[:len(value)-1]}}
 return value
}

func normalASIN(value string)string{
 value=strings.ToUpper(strings.TrimSpace(value))
 if len(value)!=10{return ""}
 for _,c:=range value{if !(c>='A'&&c<='Z')&&!(c>='0'&&c<='9'){return ""}}
 return value
}

// Only explicit audiobook identifiers are looked up. No title-to-ASIN guessing,
// cover downloads, chapter replacement, forced upstream refresh or media edits.
func parseAudnexusMulti(raw []byte,q multiMetadataQuery)([]multiMetadataCandidate,error){
 type person struct{Name string `json:"name"`}
 var book struct{
  ASIN string `json:"asin"`
  Title string `json:"title"`
  Authors []person `json:"authors"`
  Narrators []person `json:"narrators"`
  Description string `json:"description"`
  Language string `json:"language"`
  Publisher string `json:"publisherName"`
  Genres []struct{Name string `json:"name"`;Type string `json:"type"`} `json:"genres"`
  Series struct{Name string `json:"name"`} `json:"seriesPrimary"`
 }
 if err:=json.Unmarshal(raw,&book);err!=nil{return nil,err}
 id:=normalASIN(book.ASIN)
 if id==""||id!=normalASIN(q.ASIN)||strings.TrimSpace(book.Title)==""{return nil,errors.New("audiobook provider did not return the requested ASIN")}
 names:=func(people []person)string{
  values:=[]string{}
  for _,person:=range people{if name:=metadataPlainText(person.Name,200);name!=""{values=append(values,name)};if len(values)>=8{break}}
  return metadataPlainText(strings.Join(values,", "),500)
 }
 c:=multiMetadataCandidate{
  publicMetadataCandidate:publicMetadataCandidate{WorkID:"audnexus:"+id,Title:metadataPlainText(book.Title,500),Author:names(book.Authors),Publisher:metadataPlainText(book.Publisher,500),Source:"Audnexus"},
  ASIN:id,ASINExact:true,Narrator:names(book.Narrators),Description:metadataPlainText(book.Description,20000),Language:metadataPlainText(book.Language,100),Series:metadataPlainText(book.Series.Name,500),
  SourceURL:"https://api.audnex.us/books/"+id,YearType:"audiobook edition",
  Warnings:[]string{"Audiobook edition matched by ASIN; check narrator, language and abridgement before saving. US provider catalogue; other regions may differ."},
 }
 for _,genre:=range book.Genres{if genre.Type=="genre"{c.Genre=metadataPlainText(genre.Name,500);break}}
 multiRank(&c,q)
 c.Score+=80;c.Tier="strong candidate"
 c.Reasons=append(c.Reasons,"Matching audiobook ASIN")
 return []multiMetadataCandidate{c},nil
}
