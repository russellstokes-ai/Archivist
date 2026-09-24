package main

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestSavedQueueIsolationAndConflicts(t *testing.T) {
	a := fixture(t)
	a.initPlayerFeatures()
	a.db.Exec("INSERT INTO sources(id,space,path) VALUES(1,'Family','/family'),(2,'Private','/private')")
	a.db.Exec("INSERT INTO assets(id,source_id,relative_path,title,format) VALUES(1,1,'a.mp3','A','Audio'),(2,2,'b.mp3','B','Audio')")
	a.db.Exec("INSERT INTO profiles(id,name,key_hash) VALUES(1,'Child',?)", keyHash("child"))
	a.db.Exec("INSERT INTO grants VALUES(1,'Family')")
	token, _ := a.newSession("child")
	call := func(method, body string) *httptest.ResponseRecorder {
		r := httptest.NewRequest(method, "/api/queue", strings.NewReader(body))
		r.Header.Set("Authorization", "Bearer "+token)
		r.Header.Set("X-Archivist-Action", "1")
		w := httptest.NewRecorder()
		a.routes().ServeHTTP(w, r)
		return w
	}
	if w := call("PUT", `{"ids":[1],"revision":0}`); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w := call("PUT", `{"ids":[],"revision":0}`); w.Code != 409 {
		t.Fatal("stale write accepted")
	}
	if w := call("PUT", `{"ids":[1,2],"revision":1}`); w.Code != 403 {
		t.Fatal("private book accepted")
	}
	if w := call("PUT", `{"ids":[1,1],"revision":1}`); w.Code != 400 {
		t.Fatal("duplicate accepted")
	}
	if w := call("GET", ""); !strings.Contains(w.Body.String(), `"title":"A"`) {
		t.Fatal("queue not saved")
	}
	a.db.Exec("DELETE FROM grants WHERE profile_id=1")
	if w := call("GET", ""); strings.Contains(w.Body.String(), `"title":"A"`) {
		t.Fatal("revoked book leaked")
	}
}
func TestChapterValidation(t *testing.T) {
	chapters, e := parseChapters([]byte(`{"chapters":[{"start_time":"10","end_time":"20","tags":{"title":"Second"}},{"start_time":"0","end_time":"10"}]}`))
	if e != nil || len(chapters) != 2 || chapters[0].Start != 0 {
		t.Fatal(chapters, e)
	}
	for _, bad := range []string{`{"chapters":[{"start_time":"NaN","end_time":"10"}]}`, `{"chapters":[{"start_time":"-1","end_time":"10"}]}`, `{"chapters":[{"start_time":"20","end_time":"10"}]}`} {
		if _, e := parseChapters([]byte(bad)); e == nil {
			t.Fatal("bad times accepted")
		}
	}
}
func TestEmbeddedChaptersWithFFprobe(t *testing.T) {
	if _, e := exec.LookPath("ffmpeg"); e != nil {
		t.Skip("ffmpeg unavailable")
	}
	if _, e := exec.LookPath("ffprobe"); e != nil {
		t.Skip("ffprobe unavailable")
	}
	root := t.TempDir()
	metadata := filepath.Join(root, "chapters.txt")
	os.WriteFile(metadata, []byte(";FFMETADATA1\n[CHAPTER]\nTIMEBASE=1/1000\nSTART=0\nEND=1000\ntitle=Opening\n[CHAPTER]\nTIMEBASE=1/1000\nSTART=1000\nEND=2000\ntitle=Closing\n"), 0600)
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, "ffmpeg", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=8000:cl=mono", "-f", "ffmetadata", "-i", metadata, "-t", "2", "-map_metadata", "1", "-map_chapters", "1", "-c:a", "aac", filepath.Join(root, "Book.m4b"))
	if out, e := cmd.CombinedOutput(); e != nil {
		t.Fatal(e, string(out))
	}
	a := fixture(t)
	a.addSource("Books", root)
	a.scan(1)
	var id int64
	a.db.QueryRow("SELECT id FROM assets WHERE relative_path='Book.m4b'").Scan(&id)
	if id == 0 {
		t.Fatal("missing audio")
	}
	r := httptest.NewRequest("GET", "/api/assets/1/chapters", nil)
	r.Header.Set("Authorization", "Bearer test-key")
	w := httptest.NewRecorder()
	a.routes().ServeHTTP(w, r)
	var chapters []chapter
	if e := json.Unmarshal(w.Body.Bytes(), &chapters); w.Code != 200 || e != nil || len(chapters) != 2 || chapters[1].Title != "Closing" {
		t.Fatal(w.Code, w.Body.String(), e)
	}
}
