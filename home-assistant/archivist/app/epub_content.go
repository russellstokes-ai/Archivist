package main

import (
	"archive/zip"
	"bytes"
	"errors"
	"net/http"
	"net/url"
	"path"
	"regexp"
	"strings"

	"github.com/microcosm-cc/bluemonday"
	"golang.org/x/net/html"
)

// Keep semantic publication markup, but never execute book scripts or load remote media.
func epubMarkup(data []byte, section, id string) (string, error) {
	doc, err := html.Parse(bytes.NewReader(data))
	if err != nil {
		return "", err
	}
	var walk func(*html.Node)
	walk = func(n *html.Node) {
		attrs := n.Attr[:0]
		for _, a := range n.Attr {
			if a.Key == "src" && n.Data == "img" {
				u, e := url.Parse(a.Val)
				if e != nil || u.IsAbs() || u.Host != "" || strings.HasPrefix(u.Path, "/") {
					continue
				}
				name := path.Clean(path.Join(path.Dir(section), u.Path))
				if strings.HasPrefix(name, "../") {
					continue
				}
				a.Val = "./api/assets/" + id + "/resources?name=" + url.QueryEscape(name)
			} else if a.Key == "href" && !strings.HasPrefix(a.Val, "#") {
				continue
			}
			if a.Key == "srcset" {
				continue
			}
			attrs = append(attrs, a)
		}
		n.Attr = attrs
		for child := n.FirstChild; child != nil; child = child.NextSibling {
			walk(child)
		}
	}
	walk(doc)
	var body bytes.Buffer
	if err = html.Render(&body, doc); err != nil {
		return "", err
	}
	p := bluemonday.UGCPolicy()
	p.AllowAttrs("src").Matching(regexp.MustCompile(`^\./api/assets/[0-9]+/resources\?name=`)).OnElements("img")
	p.AllowStyles("text-align").MatchingEnum("left", "right", "center", "justify").Globally()
	p.AllowStyles("font-style").MatchingEnum("normal", "italic").Globally()
	return p.Sanitize(body.String()), nil
}

func (a *app) epubResourceRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/assets/{id}/resources", func(w http.ResponseWriter, r *http.Request) {
		f, format, err := a.openAsset(r.PathValue("id"))
		if err != nil {
			fail(w, 404, errors.New("book unavailable"))
			return
		}
		defer f.Close()
		if format != "Ebook" {
			fail(w, 400, errors.New("not an EPUB"))
			return
		}
		info, err := f.Stat()
		if err != nil {
			fail(w, 400, err)
			return
		}
		z, err := zip.NewReader(f, info.Size())
		if err != nil {
			fail(w, 400, err)
			return
		}
		name := r.URL.Query().Get("name")
		if path.Clean(name) != name || strings.HasPrefix(name, "/") || strings.HasPrefix(name, "../") {
			fail(w, 400, errors.New("invalid resource"))
			return
		}
		data, err := zipEntry(z, name, 24<<20)
		if err != nil {
			fail(w, 404, err)
			return
		}
		mime := http.DetectContentType(data)
		if mime != "image/png" && mime != "image/jpeg" && mime != "image/webp" && mime != "image/gif" {
			fail(w, 400, errors.New("unsupported embedded image"))
			return
		}
		w.Header().Set("Content-Type", mime)
		w.Write(data)
	})
}
