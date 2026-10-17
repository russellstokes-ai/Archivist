package main

import (
 "path/filepath"
 "testing"
)

// Legacy metadata classification is a one-time upgrade of genuinely old
// unclassified rows. It must never overwrite recorded scanner provenance
// during routine startup, backup restore or after a cold power restart.
func TestOpenDBLegacyUpgradeNeverDowngradesExistingMetadataEvidence(t *testing.T){
 path:=filepath.Join(t.TempDir(),"existing-catalogue.db")
 db,err:=openDB(path)
 if err!=nil{t.Fatal(err)}
 if _,err=db.Exec("INSERT INTO sources(id,space,path,status) VALUES(1,'Comics','/synthetic','Ready')");err!=nil{t.Fatal(err)}
 cases:=[]struct{
  id int
  source string
  confidence int
  review int
  title string
 }{
  {1,"embedded",92,0,"Embedded ComicInfo"},
  {2,"legacy",0,1,"Historical user-corrected title"},
  {3,"manual",100,0,"Explicitly edited title"},
  {4,"path",35,1,"Path-only uncertain title"},
  {5,"legacy",100,0,"Already migrated legacy record"},
 }
 for _,tc:=range cases{
  if _,err=db.Exec(`INSERT INTO assets(id,source_id,relative_path,title,format,available,
    metadata_source,metadata_confidence,needs_review,review_reason,scan_signature,size_bytes,modified_unix)
   VALUES(?,1,?,?,'Comic',1,?,?,?,'original evidence','','0','0')`,
   tc.id,tc.title+".cbz",tc.title,tc.source,tc.confidence,tc.review);err!=nil{
   t.Fatal(err)
  }
 }
 if err=db.Close();err!=nil{t.Fatal(err)}
 // Two restarts verify the old migration no longer rewrites live source
 // labels, and already-migrated rows do not repeatedly change.
 for restart:=0;restart<2;restart++{
  db,err=openDB(path)
  if err!=nil{t.Fatal(err)}
  for _,tc:=range cases{
   var src,title,reason string
   var conf,review int
   if err=db.QueryRow(`SELECT metadata_source,title,metadata_confidence,needs_review,review_reason
     FROM assets WHERE id=?`,tc.id).Scan(&src,&title,&conf,&review,&reason);err!=nil{t.Fatal(err)}
   wantConfidence,wantReview:=tc.confidence,tc.review
   if tc.id==2{wantConfidence=100;wantReview=0}
   if src!=tc.source||title!=tc.title||conf!=wantConfidence||review!=wantReview{
    t.Fatalf("reboot %d asset %d changed real source evidence: src=%s conf=%d review=%d title=%q",
     restart,tc.id,src,conf,review,title)
   }
  }
  if err=db.Close();err!=nil{t.Fatal(err)}
 }
}
