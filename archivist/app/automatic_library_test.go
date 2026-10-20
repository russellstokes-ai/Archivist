package main

import (
 "os"
 "path/filepath"
 "strings"
 "testing"
)

func TestImportedLibraryVisibleWithAttentionAndExplicitHidePreserved(t *testing.T){
 a:=fixture(t)
 root:=t.TempDir()
 if err:=os.WriteFile(filepath.Join(root,"Unknown comic.CBZ"),[]byte("synthetic placeholder"),0600);err!=nil{t.Fatal(err)}
 if err:=os.WriteFile(filepath.Join(root,"notes.txt"),[]byte("not media"),0600);err!=nil{t.Fatal(err)}
 if err:=a.addSource("Comics",root);err!=nil{t.Fatal(err)}
 if err:=a.scan(1);err!=nil{t.Fatal(err)}
 var visible,attention int
 if err:=a.db.QueryRow("SELECT count(*) FROM published_works").Scan(&visible);err!=nil{t.Fatal(err)}
 if visible!=1{t.Fatalf("new import hidden: %d",visible)}
 if err:=a.db.QueryRow("SELECT count(*) FROM assets WHERE needs_review=1").Scan(&attention);err!=nil{t.Fatal(err)}
 if attention!=1{t.Fatal("genuine identification flag was erased")}
 var status string
 _=a.db.QueryRow("SELECT status FROM sources WHERE id=1").Scan(&status)
 if !strings.Contains(status,"1 media files imported")||!strings.Contains(status,"1 non-media/unsupported files skipped"){t.Fatal(status)}
 if _,err:=a.db.Exec("INSERT INTO work_publication(work_id,state,revision) SELECT id,'staged',1 FROM works");err!=nil{t.Fatal(err)}
 if _,err:=a.db.Exec("INSERT INTO work_publication_events(work_id,title,action,recorded_at) SELECT id,title,'unpublish',1 FROM works");err!=nil{t.Fatal(err)}
 if err:=a.initPublication();err!=nil{t.Fatal(err)}
 if err:=a.scan(1);err!=nil{t.Fatal(err)}
 _=a.db.QueryRow("SELECT count(*) FROM published_works").Scan(&visible)
 if visible!=0{t.Fatal("explicit hide lost after restart/rescan")}
}
