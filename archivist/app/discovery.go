package main

import (
	"archive/zip"
	"path/filepath"
	"strings"
)

// Classification never extracts or rewrites the source. Only candidate comic
// names get an archive probe; sidecars/images need no extra network-share IO.
func discoverMedia(filename string) (string, string) {
	ext := strings.ToLower(filepath.Ext(filename))
	format := kind(filename)
	malformed := format == "" && strings.HasSuffix(strings.ToLower(filename), "]cbz")
	if ext == ".zip" || malformed {
		z, err := zip.OpenReader(filename)
		if err == nil {
			defer z.Close()
			pages, books := 0, 0
			if len(z.File) > 10000 {
				return "", "archive exceeds inspection limit"
			}
			for _, entry := range z.File {
				if entry.FileInfo().IsDir() {
					continue
				}
				switch strings.ToLower(filepath.Ext(entry.Name)) {
				case ".jpg", ".jpeg", ".png", ".gif", ".webp":
					pages++
				case ".epub", ".pdf", ".cbz", ".cbr", ".cbt", ".mobi", ".mp3", ".m4b":
					books++
				}
			}
			if books > 0 {
				return "", "archive contains books; unpack into a library folder"
			}
			if pages == 0 {
				return "", "archive has no supported comic pages"
			}
			if malformed {
				return "Comic", "recovered comic filename"
			}
		} else if malformed {
			return "", "comic filename found but archive unreadable"
		}
	}
	if format != "" {
		return format, "recognised media"
	}
	switch ext {
	case ".json", ".opf", ".nfo", ".xml", ".cue":
		return "", "supporting metadata"
	case ".jpg", ".jpeg", ".png", ".gif", ".webp":
		return "", "image or cover"
	case ".mobi", ".azw", ".azw3", ".lit", ".rtf", ".doc", ".docx":
		return "", "reader format not supported"
	case ".cb7", ".7z", ".rar", ".tar":
		return "", "archive needs supported reader format"
	}
	return "", "other file"
}
