package main

import (
	"archive/zip"
	"encoding/xml"
	"io"
	"path"
	"strings"
)

// Read bounded XML members in-place; never extract an untrusted archive.
func epubTitle(filename string) string {
	z, e := zip.OpenReader(filename)
	if e != nil {
		return ""
	}
	defer z.Close()
	read := func(name string, dst any) bool {
		for _, f := range z.File {
			if f.Name == name {
				if f.UncompressedSize64 > 2<<20 {
					return false
				}
				r, e := f.Open()
				if e != nil {
					return false
				}
				defer r.Close()
				return xml.NewDecoder(io.LimitReader(r, 2<<20)).Decode(dst) == nil
			}
		}
		return false
	}
	var c struct {
		Files []struct {
			Path string `xml:"full-path,attr"`
		} `xml:"rootfiles>rootfile"`
	}
	if !read("META-INF/container.xml", &c) || len(c.Files) == 0 {
		return ""
	}
	name := c.Files[0].Path
	if path.IsAbs(name) || strings.HasPrefix(path.Clean(name), "../") {
		return ""
	}
	var p struct {
		Title string `xml:"metadata>title"`
	}
	if !read(name, &p) {
		return ""
	}
	title := strings.TrimSpace(p.Title)
	if len(title) > 1000 {
		return ""
	}
	return title
}
