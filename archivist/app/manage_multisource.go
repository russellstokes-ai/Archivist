package main

import (
 "context"
 "encoding/json"
 "errors"
 "io"
 "net/http"
 "net/url"
 "sort"
 "strconv"
 "strings"
 "sync"
 "time"
 "unicode"
)

// Source comparisons are owner-initiated, read-only, capped and not scanner inputs.
const multiMetadataResponseLimit=2<<20
type multiMetadataQuery struct{Search,Title,Author,ISBN,MediaFormat string}
type multiMetadataCandidate struct {
 publicMetadataCandidate
 Score int `json:"score"`
 Tier string `json:"tier"`
 Reasons []string `json:"reasons"`
 Warnings []string `json:"warnings,omitempty"`
 YearType string `json:"yearType,omitempty"`
 ISBNExact bool `json:"isbnExact,omitempty"`
 IdentifierMismatch bool `json:"identifierMismatch,omitempty"`
}
type multiMetadataEndpoint struct{Name,URL string}
type multiMetadataResult struct{Name string; Candidates []multiMetadataCandidate; Err error}

func normalValidISBN(s string)string{
 var b strings.Builder
 for _,c:=range strings.ToUpper(strings.TrimSpace(s)){
  if c=='-'||c==' '{continue}
  if (c<'0'||c>'9')&&c!='X'{return ""}
  b.WriteRune(c)
 }
 v:=b.String()
 switch len(v){
 case 10:
  sum:=0
  for i:=0;i<10;i++{
   digit:=0
   if v[i]=='X'{if i!=9{return ""};digit=10}else{digit=int(v[i]-'0')}
   sum+=(10-i)*digit
  }
  if sum%11==0{return v}
 case 13:
  sum:=0
  for i:=0;i<13;i++{
   if v[i]<'0'||v[i]>'9'{return ""}
   multiplier:=1;if i%2==1{multiplier=3}
   sum+=int(v[i]-'0')*multiplier
  }
  if sum%10==0{return v}
 }
 return ""
}
func isbn13For10(v string)string{
 if len(v)!=10{return ""}
 s:="978"+v[:9]
 sum:=0
 for i:=0;i<12;i++{m:=1;if i%2==1{m=3};sum+=int(s[i]-'0')*m}
 return s+strconv.Itoa((10-sum%10)%10)
}
func sameISBN(a,b string)bool{
 x,y:=normalValidISBN(a),normalValidISBN(b)
 if x==""||y==""{return false}
 if x==y{return true}
 return len(x)==10&&isbn13For10(x)==y||len(y)==10&&isbn13For10(y)==x
}
func multiTokens(s string)[]string{
 parts:=strings.FieldsFunc(strings.ToLower(strings.TrimSpace(s)),func(r rune)bool{return !unicode.IsLetter(r)&&!unicode.IsDigit(r)})
 seen:=map[string]bool{}
 out:=[]string{}
 for _,p:=range parts{if p!=""&&!seen[p]{seen[p]=true;out=append(out,p)}}
 return out
}
func multiTokenOverlap(a,b string)int{
 x,y:=multiTokens(a),multiTokens(b)
 if len(x)==0||len(y)==0{return 0}
 have:=map[string]bool{}
 for _,s:=range x{have[s]=true}
 n:=0
 for _,s:=range y{if have[s]{n++}}
 return 200*n/(len(x)+len(y))
}
func multiRank(c *multiMetadataCandidate,q multiMetadataQuery){
 score:=0
 reasons:=[]string{}
 title:=strings.TrimSpace(q.Title)
 if title==""&&normalValidISBN(q.Search)==""{title=q.Search}
 if title!=""{
  overlap:=multiTokenOverlap(title,c.Title)
  switch{
  case strings.EqualFold(strings.TrimSpace(title),strings.TrimSpace(c.Title)):
   score+=45;reasons=append(reasons,"Exact title")
  case overlap>=80:
   score+=30;reasons=append(reasons,"Close title words")
  case overlap>=50:
   score+=12;reasons=append(reasons,"Partial title words")
  default:
   score-=30;c.Warnings=append(c.Warnings,"Title differs from indexed book")
  }
 }
 if q.Author!=""{
  overlap:=multiTokenOverlap(q.Author,c.Author)
  switch{
  case strings.EqualFold(strings.TrimSpace(q.Author),strings.TrimSpace(c.Author)):
   score+=25;reasons=append(reasons,"Exact creator")
  case overlap>=65:
   score+=13;reasons=append(reasons,"Similar creator")
  case c.Author=="":
   c.Warnings=append(c.Warnings,"Provider has no creator evidence")
  default:
   score-=25;c.Warnings=append(c.Warnings,"Creator differs from indexed book")
  }
 }
 if q.ISBN!=""{
  switch{
  case c.ISBNExact:
   score+=80;reasons=append(reasons,"Matching ISBN checksum and identifier")
  case c.IdentifierMismatch:
   score-=80;c.Warnings=append(c.Warnings,"Different ISBN edition; identifier selection blocked")
  default:c.Warnings=append(c.Warnings,"No edition-level ISBN match found")
  }
 }
 if strings.EqualFold(q.MediaFormat,"comic"){
  c.Warnings=append(c.Warnings,"Comic series, volume and issue have not been independently verified")
 }
 if len(reasons)==0{reasons=append(reasons,"No strong book identity evidence")}
 c.Score=score;c.Reasons=reasons
 switch{
 case c.IdentifierMismatch||score<25:c.Tier="check carefully"
 case score>=65:c.Tier="strong candidate"
 default:c.Tier="possible candidate"
 }
}
func parseOpenLibraryMulti(raw []byte,q multiMetadataQuery)([]multiMetadataCandidate,error){
 var response openLibrarySearchResponse
 if err:=json.Unmarshal(raw,&response);err!=nil{return nil,err}
 out:=[]multiMetadataCandidate{}
 for _,item:=range response.Docs{
  if strings.TrimSpace(item.Title)==""{continue}
  c:=multiMetadataCandidate{
   publicMetadataCandidate:publicMetadataCandidate{WorkID:item.Key,Title:strings.TrimSpace(item.Title),Source:"Open Library"},
   Reasons:[]string{},Warnings:[]string{"Work-level result: publisher and ISBN may vary by edition"},YearType:"first publication",
  }
  if len(item.Authors)>0{c.Author=strings.TrimSpace(item.Authors[0])}
  if item.Year>=1000&&item.Year<=3000{c.PublishedYear=item.Year}
  // Open Library work search can list hundreds of edition ISBNs. Never pick
  // an arbitrary first entry; only an independently supplied exact ISBN.
  for _,id:=range item.ISBN{
   if q.ISBN!=""&&sameISBN(q.ISBN,id){c.ISBN=normalValidISBN(id);c.ISBNExact=true;break}
  }
  multiRank(&c,q);out=append(out,c)
  if len(out)>=10{break}
 }
 return out,nil
}
type googleBooksCandidateResponse struct{
 Items []struct{
  ID string `json:"id"`
  VolumeInfo struct{
   Title string `json:"title"`
   Authors []string `json:"authors"`
   Publisher string `json:"publisher"`
   PublishedDate string `json:"publishedDate"`
   IndustryIdentifiers []struct{
    Type string `json:"type"`
    Identifier string `json:"identifier"`
   } `json:"industryIdentifiers"`
  } `json:"volumeInfo"`
 } `json:"items"`
}
func parseGoogleBooksMulti(raw []byte,q multiMetadataQuery)([]multiMetadataCandidate,error){
 var response googleBooksCandidateResponse
 if err:=json.Unmarshal(raw,&response);err!=nil{return nil,err}
 out:=[]multiMetadataCandidate{}
 for _,entry:=range response.Items{
  v:=entry.VolumeInfo
  if strings.TrimSpace(v.Title)==""||strings.TrimSpace(entry.ID)==""{continue}
  c:=multiMetadataCandidate{
   publicMetadataCandidate:publicMetadataCandidate{WorkID:"google-books:"+entry.ID,Title:strings.TrimSpace(v.Title),Publisher:strings.TrimSpace(v.Publisher),Source:"Google Books"},
   Reasons:[]string{},Warnings:[]string{"Edition publication date is not necessarily the book's first publication year"},YearType:"edition publication",
  }
  if len(v.Authors)>0{c.Author=strings.TrimSpace(v.Authors[0])}
  if len(v.PublishedDate)>=4{
   year,err:=strconv.Atoi(v.PublishedDate[:4]);if err==nil&&year>=1000&&year<=3000{c.PublishedYear=year}
  }
  var first13,first10 string
  for _,id:=range v.IndustryIdentifiers{
   v:=normalValidISBN(id.Identifier)
   if v==""{continue}
   if q.ISBN!=""&&sameISBN(q.ISBN,v){c.ISBN=v;c.ISBNExact=true;break}
   if len(v)==13&&first13==""{first13=v}
   if len(v)==10&&first10==""{first10=v}
  }
  if !c.ISBNExact{
   if q.ISBN!=""{
    if first10!=""||first13!=""{c.IdentifierMismatch=true}
   }else{
    c.ISBN=first13;if c.ISBN==""{c.ISBN=first10}
    if c.ISBN!=""{c.Warnings=append(c.Warnings,"ISBN identifies this edition; verify before using it book-wide")}
   }
  }
  multiRank(&c,q);out=append(out,c)
  if len(out)>=10{break}
 }
 return out,nil
}
func requestMultiMetadata(ctx context.Context,client *http.Client,target multiMetadataEndpoint,q multiMetadataQuery)multiMetadataResult{
 out:=multiMetadataResult{Name:target.Name}
 req,err:=http.NewRequestWithContext(ctx,http.MethodGet,target.URL,nil)
 if err!=nil{out.Err=err;return out}
 req.Header.Set("Accept","application/json")
 req.Header.Set("User-Agent","Archivist/1.0 owner-initiated Assist metadata comparison")
 res,err:=client.Do(req)
 if err!=nil{out.Err=err;return out}
 defer res.Body.Close()
 if res.StatusCode!=200{out.Err=errors.New("provider unavailable");return out}
 raw,err:=io.ReadAll(io.LimitReader(res.Body,multiMetadataResponseLimit+1))
 if err!=nil||len(raw)>multiMetadataResponseLimit{out.Err=errors.New("provider response exceeds safe limit");return out}
 switch target.Name{
 case "Open Library":out.Candidates,err=parseOpenLibraryMulti(raw,q)
 case "Google Books":out.Candidates,err=parseGoogleBooksMulti(raw,q)
 default:err=errors.New("unexpected provider")
 }
 out.Err=err
 return out
}
func lookupMultiMetadata(ctx context.Context,client *http.Client,endpoints []multiMetadataEndpoint,q multiMetadataQuery)([]multiMetadataCandidate,[]string,int){
 ch:=make(chan multiMetadataResult,len(endpoints))
 var wg sync.WaitGroup
 for _,endpoint:=range endpoints{
  wg.Add(1)
  go func(endpoint multiMetadataEndpoint){defer wg.Done();ch<-requestMultiMetadata(ctx,client,endpoint,q)}(endpoint)
 }
 wg.Wait();close(ch)
 candidates:=[]multiMetadataCandidate{}
 warnings:=[]string{}
 succeeded:=0
 for result:=range ch{
  if result.Err!=nil{warnings=append(warnings,result.Name+" unavailable; no changes were saved")} else {succeeded++;candidates=append(candidates,result.Candidates...)}
 }
 sort.Strings(warnings)
 sort.SliceStable(candidates,func(i,j int)bool{
  if candidates[i].Score!=candidates[j].Score{return candidates[i].Score>candidates[j].Score}
  if candidates[i].Source!=candidates[j].Source{return candidates[i].Source<candidates[j].Source}
  return candidates[i].WorkID<candidates[j].WorkID
 })
 if len(candidates)>10{candidates=candidates[:10]}
 return candidates,warnings,succeeded
}
func (a *app)serveMultiSourceCandidates(w http.ResponseWriter,r *http.Request,search string){
 q:=multiMetadataQuery{Search:search,Title:strings.TrimSpace(r.URL.Query().Get("title")),
  Author:strings.TrimSpace(r.URL.Query().Get("author")),MediaFormat:strings.TrimSpace(r.URL.Query().Get("format"))}
 rawISBN:=strings.TrimSpace(r.URL.Query().Get("isbn"))
 if len(q.Title)>180||len(q.Author)>180||len(rawISBN)>40||len(q.MediaFormat)>25{
  fail(w,400,errors.New("metadata matching parameters exceed allowed size"));return
 }
 q.ISBN=normalValidISBN(rawISBN)
 warnings:=[]string{}
 if rawISBN!=""&&q.ISBN==""{warnings=append(warnings,"Indexed ISBN has an invalid checksum; identifier ranking disabled")}
 googleQuery:=search
 if q.ISBN!=""{googleQuery="isbn:"+q.ISBN}
 endpoints:=[]multiMetadataEndpoint{
  {Name:"Open Library",URL:"https://openlibrary.org/search.json?q="+url.QueryEscape(search)+"&fields=key,title,author_name,first_publish_year,isbn,publisher&limit=10"},
  {Name:"Google Books",URL:"https://www.googleapis.com/books/v1/volumes?q="+url.QueryEscape(googleQuery)+"&maxResults=10&printType=books&projection=lite"},
 }
 ctx,cancel:=context.WithTimeout(r.Context(),6*time.Second);defer cancel()
 client:=&http.Client{Timeout:6*time.Second,CheckRedirect:func(*http.Request,[]*http.Request)error{return http.ErrUseLastResponse}}
 candidates,down,succeeded:=lookupMultiMetadata(ctx,client,endpoints,q)
 if succeeded==0{fail(w,502,errors.New("public metadata providers are unavailable; nothing saved"));return}
 warnings=append(warnings,down...)
 reply(w,map[string]any{"provider":"Open Library + Google Books","candidates":candidates,"warnings":warnings,
 "notice":"Unverified suggestions: select fields individually and confirm the signed book preview."})
}
