package main

import (
 "context"
 "testing"
)

func TestAutomaticMetadataRequiresUniqueIdentity(t *testing.T) {
 q:=multiMetadataQuery{Title:"Dune",Author:"Frank Herbert",MediaFormat:"Ebook"}
 c:=multiMetadataCandidate{publicMetadataCandidate:publicMetadataCandidate{Title:"Dune",Author:"Frank Herbert",WorkID:"/works/OL1W",Source:"Open Library",PublishedYear:1965},Genre:"Science fiction",YearType:"first publication"}
 if _,ok:=automaticMetadataCandidate([]multiMetadataCandidate{c},q);!ok {t.Fatal("exact unique title and author rejected")}
 d:=c;d.WorkID="/works/OL2W"
 if _,ok:=automaticMetadataCandidate([]multiMetadataCandidate{c,d},q);ok {t.Fatal("ambiguous work accepted")}
 q.Author="Other Author"
 if _,ok:=automaticMetadataCandidate([]multiMetadataCandidate{c},q);ok {t.Fatal("wrong author accepted")}
 q.Author="Frank Herbert";q.MediaFormat="Comic";c.ComicSeriesMatch="unknown";c.ComicIssueMatch="unknown"
 if _,ok:=automaticMetadataCandidate([]multiMetadataCandidate{c},q);ok {t.Fatal("unverified comic issue accepted")}
}

func TestAutomaticMetadataDoesNotReplaceOrUnlockFields(t *testing.T) {
 state:=workMetaState{Fields:[]workMetaField{{Name:"genre",Value:"Personal genre"},{Name:"publishedYear",Locked:true},{Name:"language",Conflicting:true},{Name:"description"}}}
 c:=multiMetadataCandidate{Genre:"Science fiction",Language:"en",Description:"Description",YearType:"first publication",publicMetadataCandidate:publicMetadataCandidate{PublishedYear:1965}}
 values:=automaticMetadataValues(state,c)
 if len(values)!=1||values["description"]!="Description"{t.Fatalf("protected fields changed: %v",values)}
 state.Fields=[]workMetaField{{Name:"publishedYear"}}
 c.YearType="edition release"
 if len(automaticMetadataValues(state,c))!=0{t.Fatal("edition date used as work publication")}
}

func TestAtlasGenreRejectsUnrelatedSubjects(t *testing.T){
 if atlasGenre([]string{"New York","English language","Science Fiction"})!="Science fiction"{t.Fatal("genre classification")}
 if atlasGenre([]string{"New York","2020","English language"})!=""{t.Fatal("invented genre")}
}

func TestAutomaticMetadataSavePreservesLocksRescansAndStaleEditors(t *testing.T){
 f:=setupWorkFixture(t)
 if _,err:=f.a.db.Exec("INSERT INTO asset_field_controls(asset_id,field,source,locked,updated_at) VALUES(?,'genre','manual',1,0)",f.FirstID);err!=nil{t.Fatal(err)}
 state:=f.get(t)
 c:=multiMetadataCandidate{Genre:"Fantasy",YearType:"first publication",publicMetadataCandidate:publicMetadataCandidate{PublishedYear:1965,Source:"Open Library"}}
 if !f.a.saveAutomaticMetadata(context.Background(),state,c){t.Fatal("missing year not filled")}
 current:=f.get(t)
 for _,field:=range current.Fields{
  if field.Name=="genre"&&field.Value!=""{t.Fatal("locked file genre overridden")}
  if field.Name=="publishedYear"&&field.Value!="1965"{t.Fatalf("year not populated: %+v",field)}
 }
 if f.a.saveAutomaticMetadata(context.Background(),state,c){t.Fatal("stale snapshot written")}
 if err:=f.a.scan(1);err!=nil{t.Fatal(err)}
 for _,field:=range f.get(t).Fields{if field.Name=="publishedYear"&&field.Value!="1965"{t.Fatal("rescan erased enrichment")}}
}
