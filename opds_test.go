package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestOPDSBasicAuthAndProfileIsolation(t *testing.T){
	a:=fixture(t)
	if e:=a.initPreferences();e!=nil{t.Fatal(e)}
	for _,item:=range []struct{space,title string}{{"Allowed","Allowed Book"},{"Hidden","Hidden Book"}}{
		root:=t.TempDir()
		if e:=os.WriteFile(filepath.Join(root,item.title+".epub"),[]byte("book"),0600);e!=nil{t.Fatal(e)}
		if e:=a.addSource(item.space,root);e!=nil{t.Fatal(e)}
	}
	if e:=a.scan(1);e!=nil{t.Fatal(e)}
	if e:=a.scan(2);e!=nil{t.Fatal(e)}
	if _,e:=a.db.Exec("INSERT INTO profiles(id,name,key_hash) VALUES(1,'Reader',?)",keyHash("reader-key"));e!=nil{t.Fatal(e)}
	if _,e:=a.db.Exec("INSERT INTO grants(profile_id,space) VALUES(1,'Allowed')");e!=nil{t.Fatal(e)}
	req:=httptest.NewRequest("GET","/api/opds",nil);req.SetBasicAuth("archivist","reader-key")
	res:=httptest.NewRecorder();a.routes().ServeHTTP(res,req)
	if res.Code!=http.StatusOK{t.Fatalf("opds=%d %s",res.Code,res.Body.String())}
	body:=res.Body.String()
	if !strings.Contains(body,"Allowed Book") || strings.Contains(body,"Hidden Book"){t.Fatalf("profile isolation failed: %s",body)}
	if !strings.Contains(body,"opds-spec.org/acquisition") || !strings.Contains(body,"./assets/"){t.Fatalf("acquisition links missing: %s",body)}
	req=httptest.NewRequest("GET","/api/opds",nil);req.SetBasicAuth("archivist","wrong")
	res=httptest.NewRecorder();a.routes().ServeHTTP(res,req)
	if res.Code!=http.StatusUnauthorized{t.Fatalf("invalid basic auth=%d",res.Code)}
}
