package main

import (
 "os"
 "path/filepath"
 "testing"
)

// A new preview is a *replacement proposal* for the same original file.
// A failed later preview must never invalidate the owner's previous valid
// recovery-journal entry or make its already reviewed hash inaccessible.
func TestMovePreviewDatabaseFailureKeepsPreviousApprovedPlan(t *testing.T){
 a:=fixture(t)
 if err:=a.initMoves();err!=nil{t.Fatal(err)}
 root:=t.TempDir()
 if err:=os.WriteFile(filepath.Join(root,"Existing.epub"),[]byte("private original, still here"),0600);err!=nil{t.Fatal(err)}
 if err:=a.addSource("Books",root);err!=nil{t.Fatal(err)}
 if err:=a.scan(1);err!=nil{t.Fatal(err)}
 first,err:=a.previewMove(1,"Author/Existing.epub")
 if err!=nil{t.Fatal(err)}
 if _,err=a.db.Exec(`CREATE TRIGGER refuse_new_preview BEFORE INSERT ON file_moves
 BEGIN SELECT RAISE(ABORT,'simulated SQLite write failure'); END`);err!=nil{t.Fatal(err)}
 if _,err=a.previewMove(1,"Alternate/Existing.epub");err==nil{
  t.Fatal("injected journal failure was ignored")
 }
 var oldState string
 if err=a.db.QueryRow("SELECT state FROM file_moves WHERE id=?",first.ID).Scan(&oldState);err!=nil||oldState!="preview"{
  t.Fatalf("previous valid preview destroyed by replacement DB failure: %q %v",oldState,err)
 }
 if _,err=os.Stat(filepath.Join(root,"Existing.epub"));err!=nil{t.Fatalf("a preview touched original file: %v",err)}
 if _,err=a.db.Exec("DROP TRIGGER refuse_new_preview");err!=nil{t.Fatal(err)}
 replacement,err:=a.previewMove(1,"Alternate/Existing.epub")
 if err!=nil{t.Fatal(err)}
 if err=a.db.QueryRow("SELECT state FROM file_moves WHERE id=?",first.ID).Scan(&oldState);err!=nil||oldState!="cancelled"{
  t.Fatalf("successful replacement failed to revoke the earlier preview: %s %v",oldState,err)
 }
 if err=a.db.QueryRow("SELECT state FROM file_moves WHERE id=?",replacement.ID).Scan(&oldState);err!=nil||oldState!="preview"{
  t.Fatalf("new valid journal preview is missing: %s %v",oldState,err)
 }
}
func TestBatchPreviewFailureRetainsEarlierPlanForUnreviewedAsset(t *testing.T){
 a:=fixture(t)
 if err:=a.initMoves();err!=nil{t.Fatal(err)}
 root:=t.TempDir()
 if err:=os.WriteFile(filepath.Join(root,"Draft.cbz"),[]byte("synthetic original"),0600);err!=nil{t.Fatal(err)}
 if err:=a.addSource("Comics",root);err!=nil{t.Fatal(err)}
 if err:=a.scan(1);err!=nil{t.Fatal(err)}
 old,err:=a.previewMove(1,"Recovery/Draft.cbz")
 if err!=nil{t.Fatal(err)}
 // A later metadata review can be reopened without touching a prior,
 // separately owner-reviewed file path preview.
 if _,err=a.db.Exec("UPDATE assets SET needs_review=1,author='Artist',title='Draft' WHERE id=1");err!=nil{t.Fatal(err)}
 result:=a.previewMoveTemplateBatch([]int64{1},"author-title")
 if result.OK!=0||result.Failed!=1||len(result.Items)!=1||result.Items[0].Status!="review"{
  t.Fatalf("expected an unreviewed item, not a new valid preview: %+v",result)
 }
 var state string
 if err=a.db.QueryRow("SELECT state FROM file_moves WHERE id=?",old.ID).Scan(&state);err!=nil||state!="preview"{
  t.Fatalf("metadata review cancelled an unrelated existing file-move preview: %s %v",state,err)
 }
 if _,err=os.Stat(filepath.Join(root,"Draft.cbz"));err!=nil{t.Fatalf("preview modified original bytes: %v",err)}
}
