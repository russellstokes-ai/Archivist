package main

import "testing"

func TestAutomaticMetadataRequiresUniqueIdentity(t *testing.T) {
 q:=multiMetadataQuery{Title:"Dune",Author:"Frank Herbert",MediaFormat:"Ebook"}
 c:=multiMetadataCandidate{publicMetadataCandidate:publicMetadataCandidate{Title:"Dune",Author:"Frank Herbert",WorkID:"/works/OL1W",Source:"Open Library",PublishedYear:1965},Genre:"Science fiction",YearType:"first publication"}
 if _,ok:=automaticMetadataCandidate([]multiMetadataCandidate{c},q);!ok {t.Fatal("exact unique title and author rejected")}
 d:=c;d.WorkID="/works/OL2W"
 if _,ok:=automaticMetadataCandidate([]multiMetadataCandidate{c,d},q);ok {t.Fatal("ambiguous work accepted")}
 q.Author="Other Author"
 if _,ok:=automaticMetadataCandidate([]multiMetadataCandidate{c},q);ok {t.Fatal("wrong author accepted")}
 q.Author="Frank Herbert";q.MediaFormat="Comic"
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
