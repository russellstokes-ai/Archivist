package main

import (
	"archive/zip"
	"encoding/xml"
	"io"
	"path"
	"path/filepath"
	"strings"
)

type embeddedMetadata struct {
	Title  string
	Author string
	Series string
}

func cleanMetadata(s string) string {
	s = strings.TrimSpace(strings.Join(strings.Fields(s), " "))
	if len(s) > 1000 {
		return ""
	}
	return s
}

func readZipXML(z *zip.Reader, name string, dst any) bool {
	for _, f := range z.File {
		if f.Name != name || f.UncompressedSize64 > 2<<20 {
			continue
		}
		r, e := f.Open()
		if e != nil {
			return false
		}
		defer r.Close()
		return xml.NewDecoder(io.LimitReader(r, 2<<20)).Decode(dst) == nil
	}
	return false
}

func epubMetadata(filename string) embeddedMetadata {
	z, e := zip.OpenReader(filename)
	if e != nil {
		return embeddedMetadata{}
	}
	defer z.Close()
	var c struct {
		Files []struct {
			Path string `xml:"full-path,attr"`
		} `xml:"rootfiles>rootfile"`
	}
	if !readZipXML(&z.Reader, "META-INF/container.xml", &c) || len(c.Files) == 0 {
		return embeddedMetadata{}
	}
	name := c.Files[0].Path
	if path.IsAbs(name) || strings.HasPrefix(path.Clean(name), "../") {
		return embeddedMetadata{}
	}
	var p struct {
		Title   string   `xml:"metadata>title"`
		Creator []string `xml:"metadata>creator"`
		Meta    []struct {
			Name     string `xml:"name,attr"`
			Content  string `xml:"content,attr"`
			Property string `xml:"property,attr"`
			Value    string `xml:",chardata"`
		} `xml:"metadata>meta"`
	}
	if !readZipXML(&z.Reader, name, &p) {
		return embeddedMetadata{}
	}
	m := embeddedMetadata{Title: cleanMetadata(p.Title)}
	if len(p.Creator) > 0 {
		m.Author = cleanMetadata(strings.Join(p.Creator, ", "))
	}
	for _, meta := range p.Meta {
		key := strings.ToLower(strings.TrimSpace(meta.Name + " " + meta.Property))
		value := cleanMetadata(meta.Content)
		if value == "" {
			value = cleanMetadata(meta.Value)
		}
		if m.Series == "" && (strings.Contains(key, "calibre:series") || strings.Contains(key, "belongs-to-collection")) {
			m.Series = value
		}
	}
	return m
}

func comicMetadata(filename string) embeddedMetadata {
	z, e := zip.OpenReader(filename)
	if e != nil {
		return embeddedMetadata{}
	}
	defer z.Close()
	var info struct {
		Title  string `xml:"Title"`
		Series string `xml:"Series"`
		Writer string `xml:"Writer"`
	}
	if !readZipXML(&z.Reader, "ComicInfo.xml", &info) {
		return embeddedMetadata{}
	}
	return embeddedMetadata{Title: cleanMetadata(info.Title), Author: cleanMetadata(info.Writer), Series: cleanMetadata(info.Series)}
}

func pathMetadata(relative, format string) embeddedMetadata {
	parts := strings.Split(filepath.ToSlash(relative), "/")
	base := strings.TrimSuffix(filepath.Base(relative), filepath.Ext(relative))
	m := embeddedMetadata{Title: cleanMetadata(base)}
	if len(parts) >= 2 {
		parent := parts[len(parts)-2]
		if parent != "" {
			m.Series = cleanMetadata(parent)
		}
	}
	if len(parts) >= 3 {
		m.Author = cleanMetadata(parts[len(parts)-3])
	} else if strings.Contains(base, " - ") {
		bits := strings.SplitN(base, " - ", 2)
		m.Author = cleanMetadata(bits[0])
		m.Title = cleanMetadata(bits[1])
	}
	if format == "Audio" && len(parts) == 2 {
		m.Author = cleanMetadata(parts[0])
		m.Series = ""
	}
	return m
}

func metadataFor(filename, relative, format string) embeddedMetadata {
	m := pathMetadata(relative, format)
	var embedded embeddedMetadata
	switch format {
	case "Ebook":
		embedded = epubMetadata(filename)
	case "Comic":
		embedded = comicMetadata(filename)
	}
	if embedded.Title != "" {
		m.Title = embedded.Title
	}
	if embedded.Author != "" {
		m.Author = embedded.Author
	}
	if embedded.Series != "" {
		m.Series = embedded.Series
	}
	return m
}

func epubTitle(filename string) string { return epubMetadata(filename).Title }
