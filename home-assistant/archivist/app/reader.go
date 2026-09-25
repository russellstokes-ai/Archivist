package main

import (
	"archive/tar"
	"archive/zip"
	"database/sql"
	"encoding/json"
	"encoding/xml"
	"errors"
	"golang.org/x/net/html"
	"io"
	"math"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

type readingPosition struct {
	Part     int     `json:"part"`
	Fraction float64 `json:"fraction"`
	Revision int64   `json:"revision"`
}

func (a *app) initReader() error {
	_, e := a.db.Exec(`CREATE TABLE IF NOT EXISTS reading_progress(profile_id INTEGER NOT NULL,asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,part INTEGER NOT NULL,fraction REAL NOT NULL,revision INTEGER NOT NULL,PRIMARY KEY(profile_id,asset_id));`)
	return e
}
func (a *app) openAsset(id string) (*os.File, string, error) {
	var root, rel, format string
	if e := a.db.QueryRow("SELECT s.path,a.relative_path,a.format FROM assets a JOIN sources s ON s.id=a.source_id WHERE a.id=?", id).Scan(&root, &rel, &format); e != nil {
		return nil, "", e
	}
	dir, e := os.OpenRoot(root)
	if e != nil {
		return nil, "", e
	}
	defer dir.Close()
	f, e := dir.Open(rel)
	return f, format, e
}
func tarComicParts(f *os.File) ([]string, error) {
	if _, e := f.Seek(0, 0); e != nil { return nil, e }
	tr := tar.NewReader(f)
	parts := []string{}
	for count := 0; ; count++ {
		if count > 10000 { return nil, errors.New("comic contains too many entries") }
		h, e := tr.Next()
		if e == io.EOF { break }
		if e != nil { return nil, e }
		if h.Typeflag != tar.TypeReg && h.Typeflag != tar.TypeRegA { continue }
		switch strings.ToLower(path.Ext(h.Name)) {
		case ".jpg", ".jpeg", ".png", ".webp":
			parts = append(parts, h.Name)
		}
	}
	sort.SliceStable(parts, func(i, j int) bool { return naturalLess(parts[i], parts[j]) })
	if len(parts) == 0 { return nil, errors.New("no supported image pages in comic") }
	return parts, nil
}
func tarComicEntry(f *os.File, name string, limit uint64) ([]byte, error) {
	if _, e := f.Seek(0, 0); e != nil { return nil, e }
	tr := tar.NewReader(f)
	for {
		h, e := tr.Next()
		if e == io.EOF { break }
		if e != nil { return nil, e }
		if h.Name != name { continue }
		if h.Size < 0 || uint64(h.Size) > limit { return nil, errors.New("comic page exceeds size limit") }
		b, e := io.ReadAll(io.LimitReader(tr, int64(limit)+1))
		if uint64(len(b)) > limit { return nil, errors.New("comic page exceeds size limit") }
		return b, e
	}
	return nil, errors.New("comic page missing")
}

func zipEntry(z *zip.Reader, name string, limit uint64) ([]byte, error) {
	for _, f := range z.File {
		if f.Name == name {
			if f.UncompressedSize64 > limit {
				return nil, errors.New("book section exceeds size limit")
			}
			r, e := f.Open()
			if e != nil {
				return nil, e
			}
			defer r.Close()
			b, e := io.ReadAll(io.LimitReader(r, int64(limit)+1))
			if uint64(len(b)) > limit {
				return nil, errors.New("book section exceeds size limit")
			}
			return b, e
		}
	}
	return nil, errors.New("book section missing")
}
func readerParts(z *zip.Reader, format string) ([]string, error) {
	if len(z.File) > 10000 {
		return nil, errors.New("book contains too many sections")
	}
	if format == "Comic" {
		parts := []string{}
		for _, f := range z.File {
			switch strings.ToLower(path.Ext(f.Name)) {
			case ".jpg", ".jpeg", ".png", ".webp":
				if !f.FileInfo().IsDir() {
					parts = append(parts, f.Name)
				}
			}
		}
		sort.SliceStable(parts, func(i, j int) bool { return naturalLess(parts[i], parts[j]) })
		if len(parts) == 0 {
			return nil, errors.New("no supported image pages in comic")
		}
		return parts, nil
	}
	c, e := zipEntry(z, "META-INF/container.xml", 2<<20)
	if e != nil {
		return nil, e
	}
	var container struct {
		Files []struct {
			Path string `xml:"full-path,attr"`
		} `xml:"rootfiles>rootfile"`
	}
	if e = xml.Unmarshal(c, &container); e != nil || len(container.Files) == 0 {
		return nil, errors.New("invalid EPUB container")
	}
	opf := container.Files[0].Path
	b, e := zipEntry(z, opf, 4<<20)
	if e != nil {
		return nil, e
	}
	var pkg struct {
		Items []struct {
			ID    string `xml:"id,attr"`
			Href  string `xml:"href,attr"`
			Media string `xml:"media-type,attr"`
		} `xml:"manifest>item"`
		Spine []struct {
			ID string `xml:"idref,attr"`
		} `xml:"spine>itemref"`
	}
	if e = xml.Unmarshal(b, &pkg); e != nil {
		return nil, e
	}
	items := map[string]string{}
	for _, x := range pkg.Items {
		u, e := url.Parse(x.Href)
		if e != nil || u.IsAbs() || u.Host != "" || strings.HasPrefix(u.Path, "/") {
			continue
		}
		if x.Media != "application/xhtml+xml" && x.Media != "text/html" {
			continue
		}
		name := path.Clean(path.Join(path.Dir(opf), u.Path))
		if strings.HasPrefix(name, "../") {
			continue
		}
		items[x.ID] = name
	}
	parts := []string{}
	for _, x := range pkg.Spine {
		if name, ok := items[x.ID]; ok {
			parts = append(parts, name)
		}
	}
	if len(parts) == 0 {
		return nil, errors.New("EPUB has no readable spine")
	}
	return parts, nil
}
func safeParagraphs(b []byte) ([]string, error) {
	doc, e := html.Parse(strings.NewReader(string(b)))
	if e != nil {
		return nil, e
	}
	out := []string{}
	var buf strings.Builder
	flush := func() {
		s := strings.Join(strings.Fields(buf.String()), " ")
		if s != "" {
			out = append(out, s)
		}
		buf.Reset()
	}
	var walk func(*html.Node)
	walk = func(n *html.Node) {
		if n.Type == html.ElementNode {
			switch n.Data {
			case "script", "style", "head", "iframe", "object", "svg", "noscript":
				return
			}
		}
		block := n.Type == html.ElementNode && (n.Data == "p" || n.Data == "div" || n.Data == "h1" || n.Data == "h2" || n.Data == "h3" || n.Data == "li" || n.Data == "br")
		if block {
			flush()
		}
		if n.Type == html.TextNode {
			buf.WriteString(n.Data)
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}
		if block {
			flush()
		}
	}
	walk(doc)
	flush()
	return out, nil
}
func (a *app) readerRoutes(mux *http.ServeMux) {
	serve := func(w http.ResponseWriter, r *http.Request) {
		f, format, e := a.openAsset(r.PathValue("id"))
		if e != nil {
			fail(w, 404, errors.New("book unavailable"))
			return
		}
		defer f.Close()
		info, e := f.Stat()
		if e != nil || !info.Mode().IsRegular() {
			fail(w, 400, errors.New("invalid asset"))
			return
		}
		if format == "PDF" {
			reply(w, map[string]any{"format": "PDF", "parts": []string{}})
			return
		}
		if format != "Ebook" && format != "Comic" {
			fail(w, 400, errors.New("this asset is not a readable book"))
			return
		}
		ext := strings.ToLower(filepath.Ext(f.Name()))
		var parts []string
		var z *zip.Reader
		if format == "Comic" && ext == ".cbt" {
			parts, e = tarComicParts(f)
		} else {
			z, e = zip.NewReader(f, info.Size())
			if e == nil { parts, e = readerParts(z, format) }
		}
		if e != nil {
			fail(w, 400, errors.New("archive unsupported or corrupt"))
			return
		}
		part := r.PathValue("part")
		if part == "" {
			labels := make([]string, len(parts))
			for i := range parts {
				labels[i] = "Section " + strconv.Itoa(i+1)
			}
			reply(w, map[string]any{"format": format, "parts": labels})
			return
		}
		index, e := strconv.Atoi(part)
		if e != nil || index < 0 || index >= len(parts) {
			fail(w, 404, errors.New("section not found"))
			return
		}
		limit := uint64(4 << 20)
		if format == "Comic" {
			limit = 24 << 20
		}
		var data []byte
		if format == "Comic" && ext == ".cbt" {
			data, e = tarComicEntry(f, parts[index], limit)
		} else {
			data, e = zipEntry(z, parts[index], limit)
		}
		if e != nil {
			fail(w, 400, e)
			return
		}
		if format == "Comic" {
			mime := http.DetectContentType(data)
			if mime != "image/jpeg" && mime != "image/png" && mime != "image/webp" {
				fail(w, 400, errors.New("invalid comic image"))
				return
			}
			w.Header().Set("Content-Type", mime)
			w.Write(data)
			return
		}
		paragraphs, e := safeParagraphs(data)
		if e != nil {
			fail(w, 400, e)
			return
		}
		reply(w, map[string]any{"paragraphs": paragraphs})
	}
	mux.HandleFunc("GET /api/assets/{id}/reader", serve)
	mux.HandleFunc("GET /api/assets/{id}/reader/{part}", serve)
	mux.HandleFunc("GET /api/assets/{id}/reading-progress", func(w http.ResponseWriter, r *http.Request) {
		var p readingPosition
		e := a.db.QueryRow("SELECT part,fraction,revision FROM reading_progress WHERE profile_id=? AND asset_id=?", who(r).ID, r.PathValue("id")).Scan(&p.Part, &p.Fraction, &p.Revision)
		if e != nil && e != sql.ErrNoRows {
			fail(w, 500, e)
			return
		}
		reply(w, p)
	})
	mux.HandleFunc("PUT /api/assets/{id}/reading-progress", func(w http.ResponseWriter, r *http.Request) {
		var p readingPosition
		if e := json.NewDecoder(http.MaxBytesReader(w, r.Body, 2048)).Decode(&p); e != nil || p.Part < 0 || p.Part > 100000 || math.IsNaN(p.Fraction) || p.Fraction < 0 || p.Fraction > 1 || p.Revision < 0 {
			fail(w, 400, errors.New("invalid reading position"))
			return
		}
		tx, e := a.db.Begin()
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer tx.Rollback()
		var revision int64
		e = tx.QueryRow("SELECT revision FROM reading_progress WHERE profile_id=? AND asset_id=?", who(r).ID, r.PathValue("id")).Scan(&revision)
		if e != nil && e != sql.ErrNoRows {
			fail(w, 500, e)
			return
		}
		if revision != p.Revision {
			fail(w, 409, errors.New("reading position changed in another session"))
			return
		}
		p.Revision++
		_, e = tx.Exec(`INSERT INTO reading_progress VALUES(?,?,?,?,?) ON CONFLICT(profile_id,asset_id) DO UPDATE SET part=excluded.part,fraction=excluded.fraction,revision=excluded.revision`, who(r).ID, r.PathValue("id"), p.Part, p.Fraction, p.Revision)
		if e != nil {
			fail(w, 400, errors.New("cannot save this asset position"))
			return
		}
		if e = tx.Commit(); e != nil {
			fail(w, 500, e)
			return
		}
		reply(w, p)
	})
}
