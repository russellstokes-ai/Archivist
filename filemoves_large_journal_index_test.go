package main

import (
 "fmt"
 "strings"
 "testing"
)

// A library can accumulate thousands of previously completed organisation
// moves. New preview conflict checks must stay index-backed, while old
// completed journal entries must remain durable for owner history and undo.
func TestOrganiseJournalUpgradeIndexesLargeHistoryWithoutLosingMoves(t *testing.T){
 a:=fixture(t)
 if err:=a.initMoves();err!=nil{t.Fatal(err)}
 tx,err:=a.db.Begin()
 if err!=nil{t.Fatal(err)}
 for i:=1;i<=4000;i++{
  id:=fmt.Sprintf("%032x",i)
  if _,err=tx.Exec("INSERT INTO file_moves(id,asset,root,old_path,new_path,hash,state) VALUES(?,?,?,?,?,?,?)",
   id,int64(i),"/synthetic/family-nas",fmt.Sprintf("from-%05d.cbz",i),
   fmt.Sprintf("done-%05d.cbz",i),strings.Repeat("a",64),"done");err!=nil{
   tx.Rollback();t.Fatal(err)
  }
 }
 if _,err=tx.Exec("INSERT INTO file_moves(id,asset,root,old_path,new_path,hash,state) VALUES(?,?,?,?,?,?,?)",
  strings.Repeat("b",32),6000,"/synthetic/family-nas","old-6000.cbz","Issue/Twenty.cbz",strings.Repeat("c",64),"preview");err!=nil{
  tx.Rollback();t.Fatal(err)
 }
 if err=tx.Commit();err!=nil{t.Fatal(err)}
 // Opening an already initialized database for a new release must not
 // mutate or delete any journaled owner move.
 if err=a.initMoves();err!=nil{t.Fatalf("idempotent index upgrade failed: %v",err)}
 var n int
 if err=a.db.QueryRow("SELECT count(*) FROM file_moves").Scan(&n);err!=nil||n!=4001{
  t.Fatalf("upgrading large move journal lost a record: %d %v",n,err)
 }
 var idx int
 if err=a.db.QueryRow("SELECT count(*) FROM sqlite_master WHERE type='index' AND name='idx_file_moves_live_destination'").Scan(&idx);err!=nil||idx!=1{
  t.Fatalf("live journal conflict index was not created: %d %v",idx,err)
 }
 if err=a.db.QueryRow("SELECT count(*) FROM sqlite_master WHERE type='index' AND name='idx_file_moves_asset_state'").Scan(&idx);err!=nil||idx!=1{
  t.Fatalf("asset-state journal index not created: %d %v",idx,err)
 }
 const collision=`SELECT count(*) FROM file_moves
 WHERE root=? AND lower(new_path)=lower(?) AND asset<>?
 AND state IN ('preview','applying','linked')`
 if err=a.db.QueryRow(collision,"/synthetic/family-nas","issue/TWENTY.cbz",3000).Scan(&n);err!=nil||n!=1{
  t.Fatalf("live collision invisible after 4,000 completed moves: %d %v",n,err)
 }
 rows,err:=a.db.Query("EXPLAIN QUERY PLAN "+collision,"/synthetic/family-nas","issue/TWENTY.cbz",3000)
 if err!=nil{t.Fatal(err)}
 usedIndex:=false
 for rows.Next(){
  var id,parent,unused int
  var detail string
  if err=rows.Scan(&id,&parent,&unused,&detail);err!=nil{rows.Close();t.Fatal(err)}
  if strings.Contains(detail,"idx_file_moves_live_destination"){usedIndex=true}
 }
 if err=rows.Err();err!=nil{rows.Close();t.Fatal(err)}
 if err=rows.Close();err!=nil{t.Fatal(err)}
 if !usedIndex{t.Fatal("SQLite did not use partial live-journal index for preview collision search")}
 var older string
 if err=a.db.QueryRow("SELECT state FROM file_moves WHERE id=?",fmt.Sprintf("%032x",1)).Scan(&older);err!=nil||older!="done"{
  t.Fatalf("historical completed move lost on index upgrade: %s %v",older,err)
 }
}
