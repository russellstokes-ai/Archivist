package main

import (
	"strings"
	"testing"
)

func TestEPUBMarkupPreservesContentWithoutExternalRequests(t *testing.T) {
	data := []byte(`<html><body><h1>Title</h1><p>Hello <em>reader</em></p><table><tr><td>Cell</td></tr></table><img src="images/a.png"><img src="https://tracking.example/pixel"><script>steal()</script><iframe src="https://bad.example"></iframe><a href="https://external.example">Link</a><p onclick="steal()">Safe</p></body></html>`)
	s, e := epubMarkup(data, "OPS/chapter.xhtml", "1")
	if e != nil {
		t.Fatal(e)
	}
	for _, want := range []string{"<h1>", "<em>", "<table>", "./api/assets/1/resources?name=OPS%2Fimages%2Fa.png"} {
		if !strings.Contains(s, want) {
			t.Fatal("missing", want, s)
		}
	}
	for _, bad := range []string{"tracking.example", "script", "iframe", "onclick", "external.example", "steal"} {
		if strings.Contains(s, bad) {
			t.Fatal("unsafe", s)
		}
	}
}
