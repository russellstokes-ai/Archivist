package main

import (
	"archive/zip"
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
)

const metadataXMLLimit = 2 << 20

type embeddedMetadata struct {
	Title  string
	Author string
	Series string
}

type identifiedMetadata struct {
	Title        string
	Author       string
	Series       string
	Source       string
	Confidence   int
	NeedsReview  bool
	ReviewReason string
}

type metadataCandidate struct {
	embeddedMetadata
	source     string
	confidence int
}

type sidecarCacheEntry struct {
	checked bool
	exists  bool
	size    int64
	modNano int64
	parsed  bool
	meta    embeddedMetadata
}

type sidecarScanCache struct {
	generic    map[string]*sidecarCacheEntry
	statChecks int
	parseReads int
}

func newSidecarScanCache() *sidecarScanCache {
	return &sidecarScanCache{generic: map[string]*sidecarCacheEntry{}}
}

func isGenericSidecar(filename string) bool {
	switch strings.ToLower(filepath.Base(filename)) {
	case "metadata.opf", "book.opf", "metadata.nfo", "book.nfo":
		return true
	default:
		return false
	}
}

func (c *sidecarScanCache) stat(filename string) (size, modNano int64, exists bool) {
	if c == nil || !isGenericSidecar(filename) {
		info, err := os.Stat(filename)
		if err != nil || !info.Mode().IsRegular() {
			return 0, 0, false
		}
		return info.Size(), info.ModTime().UnixNano(), true
	}
	entry, ok := c.generic[filename]
	if !ok {
		entry = &sidecarCacheEntry{}
		c.generic[filename] = entry
	}
	if !entry.checked {
		entry.checked = true
		c.statChecks++
		if info, err := os.Stat(filename); err == nil && info.Mode().IsRegular() {
			entry.exists = true
			entry.size = info.Size()
			entry.modNano = info.ModTime().UnixNano()
		}
	}
	return entry.size, entry.modNano, entry.exists
}

func parseSidecarFile(filename string) embeddedMetadata {
	switch strings.ToLower(filepath.Ext(filename)) {
	case ".opf":
		return opfMetadataFromReader(func(dst any) bool { return readXMLFile(filename, dst) })
	case ".nfo":
		var nfo struct {
			Title  string `xml:"title"`
			Author string `xml:"author"`
			Writer string `xml:"writer"`
			Series string `xml:"series"`
		}
		if readXMLFile(filename, &nfo) {
			author := cleanMetadata(nfo.Author)
			if author == "" {
				author = cleanMetadata(nfo.Writer)
			}
			return embeddedMetadata{Title: cleanMetadata(nfo.Title), Author: author, Series: cleanMetadata(nfo.Series)}
		}
	}
	return embeddedMetadata{}
}

func (c *sidecarScanCache) metadata(filename string) embeddedMetadata {
	if c == nil || !isGenericSidecar(filename) {
		return parseSidecarFile(filename)
	}
	size, _, exists := c.stat(filename)
	if !exists || size > metadataXMLLimit {
		return embeddedMetadata{}
	}
	entry := c.generic[filename]
	if !entry.parsed {
		entry.parsed = true
		c.parseReads++
		entry.meta = parseSidecarFile(filename)
	}
	return entry.meta
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
		if filepath.ToSlash(f.Name) != filepath.ToSlash(name) || f.UncompressedSize64 > metadataXMLLimit {
			continue
		}
		r, e := f.Open()
		if e != nil {
			return false
		}
		defer r.Close()
		return xml.NewDecoder(io.LimitReader(r, metadataXMLLimit)).Decode(dst) == nil
	}
	return false
}

func readXMLFile(filename string, dst any) bool {
	info, e := os.Stat(filename)
	if e != nil || !info.Mode().IsRegular() || info.Size() > metadataXMLLimit {
		return false
	}
	f, e := os.Open(filename)
	if e != nil {
		return false
	}
	defer f.Close()
	return xml.NewDecoder(io.LimitReader(f, metadataXMLLimit)).Decode(dst) == nil
}

func opfMetadataFromReader(decode func(any) bool) embeddedMetadata {
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
	if !decode(&p) {
		return embeddedMetadata{}
	}
	m := embeddedMetadata{Title: cleanMetadata(p.Title)}
	if len(p.Creator) > 0 {
		clean := make([]string, 0, len(p.Creator))
		for _, creator := range p.Creator {
			if v := cleanMetadata(creator); v != "" {
				clean = append(clean, v)
			}
		}
		m.Author = cleanMetadata(strings.Join(clean, ", "))
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
	return opfMetadataFromReader(func(dst any) bool { return readZipXML(&z.Reader, name, dst) })
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

func sidecarCandidates(filename string) []string {
	dir := filepath.Dir(filename)
	base := strings.TrimSuffix(filepath.Base(filename), filepath.Ext(filename))
	candidates := []string{
		filepath.Join(dir, base+".opf"),
		filepath.Join(dir, "metadata.opf"),
		filepath.Join(dir, "book.opf"),
		filepath.Join(dir, base+".nfo"),
		filepath.Join(dir, "metadata.nfo"),
		filepath.Join(dir, "book.nfo"),
	}
	seen := map[string]bool{}
	out := make([]string, 0, len(candidates))
	for _, candidate := range candidates {
		if !seen[candidate] {
			seen[candidate] = true
			out = append(out, candidate)
		}
	}
	return out
}

func sidecarMetadataWithCache(filename string, cache *sidecarScanCache) embeddedMetadata {
	for _, candidate := range sidecarCandidates(filename) {
		meta := cache.metadata(candidate)
		if meta.Title != "" || meta.Author != "" || meta.Series != "" {
			return meta
		}
	}
	return embeddedMetadata{}
}

func sidecarMetadata(filename string) embeddedMetadata {
	return sidecarMetadataWithCache(filename, nil)
}

func pathMetadata(relative, format string) metadataCandidate {
	parts := strings.Split(filepath.ToSlash(relative), "/")
	base := cleanMetadata(strings.TrimSuffix(filepath.Base(relative), filepath.Ext(relative)))
	m := embeddedMetadata{Title: base}
	confidence := 35

	if format == "Audio" {
		// Common layouts:
		// Author / Book / 01 - Chapter.mp3
		// Author / Series / Book / 01 - Chapter.mp3
		if len(parts) >= 4 {
			m.Author = cleanMetadata(parts[len(parts)-4])
			m.Series = cleanMetadata(parts[len(parts)-3])
			confidence = 72
		} else if len(parts) >= 3 {
			m.Author = cleanMetadata(parts[len(parts)-3])
			confidence = 65
		} else if len(parts) == 2 {
			m.Author = cleanMetadata(parts[0])
			confidence = 55
		}
		return metadataCandidate{embeddedMetadata: m, source: "path", confidence: confidence}
	}

	if len(parts) >= 3 {
		m.Author = cleanMetadata(parts[len(parts)-3])
		m.Series = cleanMetadata(parts[len(parts)-2])
		confidence = 72
	} else if len(parts) >= 2 {
		parent := cleanMetadata(parts[len(parts)-2])
		if parent != "" {
			m.Series = parent
			confidence = 52
		}
	}
	if strings.Contains(base, " - ") {
		bits := strings.SplitN(base, " - ", 2)
		if len(bits) == 2 && cleanMetadata(bits[0]) != "" && cleanMetadata(bits[1]) != "" {
			m.Author = cleanMetadata(bits[0])
			m.Title = cleanMetadata(bits[1])
			if confidence < 68 {
				confidence = 68
			}
		}
	}
	return metadataCandidate{embeddedMetadata: m, source: "path", confidence: confidence}
}

func mergeMetadata(candidates ...metadataCandidate) identifiedMetadata {
	result := identifiedMetadata{}
	bestTitle, bestAuthor, bestSeries := -1, -1, -1
	sources := []string{}
	maxConfidence := 0

	for _, candidate := range candidates {
		if candidate.confidence <= 0 {
			continue
		}
		if candidate.Title != "" && candidate.confidence > bestTitle {
			result.Title, bestTitle = cleanMetadata(candidate.Title), candidate.confidence
		}
		if candidate.Author != "" && candidate.confidence > bestAuthor {
			result.Author, bestAuthor = cleanMetadata(candidate.Author), candidate.confidence
		}
		if candidate.Series != "" && candidate.confidence > bestSeries {
			result.Series, bestSeries = cleanMetadata(candidate.Series), candidate.confidence
		}
		if candidate.Title != "" || candidate.Author != "" || candidate.Series != "" {
			sources = append(sources, candidate.source)
			if candidate.confidence > maxConfidence {
				maxConfidence = candidate.confidence
			}
		}
	}
	if result.Title == "" {
		result.Title = "Untitled"
	}
	result.Confidence = maxConfidence
	result.Source = strings.Join(uniqueStrings(sources), "+")
	if result.Source == "" {
		result.Source = "path"
	}

	switch {
	case result.Title == "Untitled":
		result.NeedsReview = true
		result.ReviewReason = "Archivist could not determine a title."
	case result.Confidence < 60:
		result.NeedsReview = true
		result.ReviewReason = "Only weak filename or folder evidence was available."
	case result.Author == "" && result.Confidence < 85:
		result.NeedsReview = true
		result.ReviewReason = "The title looks plausible, but the author could not be identified confidently."
	}
	return result
}

func uniqueStrings(items []string) []string {
	seen := map[string]bool{}
	out := []string{}
	for _, item := range items {
		if item == "" || seen[item] {
			continue
		}
		seen[item] = true
		out = append(out, item)
	}
	return out
}

func metadataForWithCache(filename, relative, format string, cache *sidecarScanCache) identifiedMetadata {
	pathCandidate := pathMetadata(relative, format)
	candidates := []metadataCandidate{pathCandidate}

	if sidecar := sidecarMetadataWithCache(filename, cache); sidecar.Title != "" || sidecar.Author != "" || sidecar.Series != "" {
		candidates = append(candidates, metadataCandidate{embeddedMetadata: sidecar, source: "sidecar", confidence: 96})
	}

	var embedded embeddedMetadata
	switch format {
	case "Ebook":
		embedded = epubMetadata(filename)
	case "Comic":
		embedded = comicMetadata(filename)
	}
	if embedded.Title != "" || embedded.Author != "" || embedded.Series != "" {
		candidates = append(candidates, metadataCandidate{embeddedMetadata: embedded, source: "embedded", confidence: 92})
	}

	return mergeMetadata(candidates...)
}

func metadataFor(filename, relative, format string) identifiedMetadata {
	return metadataForWithCache(filename, relative, format, nil)
}

func metadataSignatureWithCache(filename string, info os.FileInfo, cache *sidecarScanCache) string {
	parts := []string{fmt.Sprintf("file:%d:%d", info.Size(), info.ModTime().UnixNano())}
	for _, sidecar := range sidecarCandidates(filename) {
		if size, modNano, exists := cache.stat(sidecar); exists {
			parts = append(parts, fmt.Sprintf("%s:%d:%d", filepath.Base(sidecar), size, modNano))
		}
	}
	sort.Strings(parts[1:])
	return strings.Join(parts, "|")
}

func metadataSignature(filename string, info os.FileInfo) string {
	return metadataSignatureWithCache(filename, info, nil)
}

func epubTitle(filename string) string { return epubMetadata(filename).Title }
