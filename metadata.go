package main

import (
	"archive/zip"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

const metadataXMLLimit = 2 << 20

type embeddedMetadata struct {
	Title         string
	Author        string
	Series        string
	SeriesNumber  float64
	Genre         string
	PublishedYear int
	Narrator      string
	Publisher     string
	ISBN          string
	ASIN          string
	Language      string
	Description   string
}

type identifiedMetadata struct {
	Title         string
	Author        string
	Series        string
	SeriesNumber  float64
	Genre         string
	PublishedYear int
	Narrator      string
	Publisher     string
	ISBN          string
	ASIN          string
	Language      string
	Description   string
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
	case "metadata.opf", "book.opf", "metadata.nfo", "book.nfo", "metadata.json", "book.json", "comicinfo.xml":
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
	case ".json":
		info, err := os.Stat(filename)
		if err != nil || !info.Mode().IsRegular() || info.Size() > metadataXMLLimit {
			return embeddedMetadata{}
		}
		f, err := os.Open(filename)
		if err != nil {
			return embeddedMetadata{}
		}
		defer f.Close()
		var raw map[string]any
		if json.NewDecoder(io.LimitReader(f, metadataXMLLimit)).Decode(&raw) != nil {
			return embeddedMetadata{}
		}
		if nested, ok := raw["metadata"].(map[string]any); ok {
			raw = nested
		}
		return metadataFromMap(raw)
	case ".nfo", ".xml":
		var x struct {
			Title         string  `xml:"title"`
			TitleComic    string  `xml:"Title"`
			Author        string  `xml:"author"`
			Writer        string  `xml:"writer"`
			WriterComic   string  `xml:"Writer"`
			Series        string  `xml:"series"`
			SeriesComic   string  `xml:"Series"`
			Number        float64 `xml:"number"`
			NumberComic   float64 `xml:"Number"`
			Genre         string  `xml:"genre"`
			GenreComic    string  `xml:"Genre"`
			Narrator      string  `xml:"narrator"`
			Publisher     string  `xml:"publisher"`
			PublisherComic string `xml:"Publisher"`
			ISBN          string  `xml:"isbn"`
			ASIN          string  `xml:"asin"`
			Language      string  `xml:"language"`
			LanguageComic string  `xml:"LanguageISO"`
			Description   string  `xml:"description"`
			Summary       string  `xml:"Summary"`
			Year          int     `xml:"year"`
			YearComic     int     `xml:"Year"`
		}
		if readXMLFile(filename, &x) {
			first := func(values ...string) string {
				for _, value := range values {
					if clean := cleanMetadata(value); clean != "" { return clean }
				}
				return ""
			}
			number := x.Number
			if number == 0 { number = x.NumberComic }
			year := x.Year
			if year == 0 { year = x.YearComic }
			return embeddedMetadata{
				Title:first(x.Title,x.TitleComic), Author:first(x.Author,x.Writer,x.WriterComic),
				Series:first(x.Series,x.SeriesComic), SeriesNumber:number,
				Genre:first(x.Genre,x.GenreComic), Narrator:cleanMetadata(x.Narrator),
				Publisher:first(x.Publisher,x.PublisherComic), ISBN:normalizeIdentifier(x.ISBN),
				ASIN:normalizeIdentifier(x.ASIN), Language:first(x.Language,x.LanguageComic),
				Description:first(x.Description,x.Summary), PublishedYear:year,
			}
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
		Title       string   `xml:"metadata>title"`
		Creator     []string `xml:"metadata>creator"`
		Subject     []string `xml:"metadata>subject"`
		Publisher   string   `xml:"metadata>publisher"`
		Language    string   `xml:"metadata>language"`
		Description string   `xml:"metadata>description"`
		Date        string   `xml:"metadata>date"`
		Identifier  []string `xml:"metadata>identifier"`
		Meta        []struct {
			Name     string `xml:"name,attr"`
			Content  string `xml:"content,attr"`
			Property string `xml:"property,attr"`
			Value    string `xml:",chardata"`
		} `xml:"metadata>meta"`
	}
	if !decode(&p) {
		return embeddedMetadata{}
	}
	m := embeddedMetadata{
		Title:cleanMetadata(p.Title), Publisher:cleanMetadata(p.Publisher),
		Language:cleanMetadata(p.Language), Description:cleanMetadata(p.Description),
		PublishedYear:yearFromText(p.Date),
	}
	if len(p.Creator) > 0 {
		clean := make([]string, 0, len(p.Creator))
		for _, creator := range p.Creator {
			if v := cleanMetadata(creator); v != "" { clean = append(clean, normalizeAuthor(v)) }
		}
		m.Author = cleanMetadata(strings.Join(clean, ", "))
	}
	for _, subject := range p.Subject {
		if value := cleanMetadata(subject); value != "" { m.Genre = value; break }
	}
	for _, identifier := range p.Identifier {
		value := normalizeIdentifier(identifier)
		if value == "" { continue }
		upper := strings.ToUpper(value)
		switch {
		case strings.HasPrefix(upper,"ISBN"):
			if m.ISBN=="" { m.ISBN=normalizeIdentifier(strings.TrimPrefix(upper,"ISBN")) }
		case strings.HasPrefix(upper,"ASIN"):
			if m.ASIN=="" { m.ASIN=normalizeIdentifier(strings.TrimPrefix(upper,"ASIN")) }
		case looksISBN(value) && m.ISBN=="":
			m.ISBN=value
		}
	}
	for _, meta := range p.Meta {
		key := strings.ToLower(strings.TrimSpace(meta.Name + " " + meta.Property))
		value := cleanMetadata(meta.Content)
		if value == "" { value = cleanMetadata(meta.Value) }
		switch {
		case m.Series == "" && (strings.Contains(key, "calibre:series") || strings.Contains(key, "belongs-to-collection")) && !strings.Contains(key,"index"):
			m.Series = value
		case m.SeriesNumber == 0 && (strings.Contains(key,"series_index") || strings.Contains(key,"series-number") || strings.Contains(key,"group-position")):
			m.SeriesNumber = numberFromText(value)
		case m.Narrator == "" && (strings.Contains(key,"narrator") || strings.Contains(key,"read by")):
			m.Narrator = value
		case m.ASIN == "" && strings.Contains(key,"asin"):
			m.ASIN = normalizeIdentifier(value)
		case m.ISBN == "" && strings.Contains(key,"isbn"):
			m.ISBN = normalizeIdentifier(value)
		case m.Publisher == "" && strings.Contains(key,"publisher"):
			m.Publisher = value
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
	if e != nil { return embeddedMetadata{} }
	defer z.Close()
	var info struct {
		Title       string  `xml:"Title"`
		Series      string  `xml:"Series"`
		Number      float64 `xml:"Number"`
		Writer      string  `xml:"Writer"`
		Genre       string  `xml:"Genre"`
		Publisher   string  `xml:"Publisher"`
		Language    string  `xml:"LanguageISO"`
		Summary     string  `xml:"Summary"`
		Year        int     `xml:"Year"`
	}
	if !readZipXML(&z.Reader, "ComicInfo.xml", &info) { return embeddedMetadata{} }
	return embeddedMetadata{
		Title:cleanMetadata(info.Title), Author:normalizeAuthor(info.Writer),
		Series:cleanMetadata(info.Series), SeriesNumber:info.Number, Genre:cleanMetadata(info.Genre),
		Publisher:cleanMetadata(info.Publisher), Language:cleanMetadata(info.Language),
		Description:cleanMetadata(info.Summary), PublishedYear:info.Year,
	}
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
		filepath.Join(dir, base+".json"),
		filepath.Join(dir, "metadata.json"),
		filepath.Join(dir, "book.json"),
		filepath.Join(dir, "ComicInfo.xml"),
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
		if metadataPresent(meta) {
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
	best := map[string]int{}
	sources := []string{}
	maxConfidence := 0
	setString := func(field string, value string, confidence int, dst *string) {
		if value != "" && confidence > best[field] { *dst, best[field] = cleanMetadata(value), confidence }
	}
	setNumber := func(field string, value float64, confidence int, dst *float64) {
		if value != 0 && confidence > best[field] { *dst, best[field] = value, confidence }
	}
	setYear := func(value int, confidence int) {
		if value > 0 && confidence > best["year"] { result.PublishedYear, best["year"] = value, confidence }
	}
	for _, candidate := range candidates {
		if candidate.confidence <= 0 { continue }
		setString("title", candidate.Title, candidate.confidence, &result.Title)
		setString("author", candidate.Author, candidate.confidence, &result.Author)
		setString("series", candidate.Series, candidate.confidence, &result.Series)
		setNumber("seriesNumber", candidate.SeriesNumber, candidate.confidence, &result.SeriesNumber)
		setString("genre", candidate.Genre, candidate.confidence, &result.Genre)
		setYear(candidate.PublishedYear,candidate.confidence)
		setString("narrator", candidate.Narrator, candidate.confidence, &result.Narrator)
		setString("publisher", candidate.Publisher, candidate.confidence, &result.Publisher)
		setString("isbn", candidate.ISBN, candidate.confidence, &result.ISBN)
		setString("asin", candidate.ASIN, candidate.confidence, &result.ASIN)
		setString("language", candidate.Language, candidate.confidence, &result.Language)
		setString("description", candidate.Description, candidate.confidence, &result.Description)
		if metadataPresent(candidate.embeddedMetadata) {
			sources = append(sources, candidate.source)
			if candidate.confidence > maxConfidence { maxConfidence = candidate.confidence }
		}
	}
	if result.Title == "" { result.Title = "Untitled" }
	result.Author = normalizeAuthor(result.Author)
	result.Confidence = maxConfidence
	result.Source = strings.Join(uniqueStrings(sources), "+")
	if result.Source == "" { result.Source = "path" }
	switch {
	case result.Title == "Untitled":
		result.NeedsReview = true; result.ReviewReason = "Archivist could not determine a title."
	case result.Confidence < 60:
		result.NeedsReview = true; result.ReviewReason = "Only weak filename or folder evidence was available."
	case result.Author == "" && result.Confidence < 85:
		result.NeedsReview = true; result.ReviewReason = "The title looks plausible, but the author could not be identified confidently."
	}
	return result
}

func metadataPresent(m embeddedMetadata) bool {
	return m.Title!="" || m.Author!="" || m.Series!="" || m.SeriesNumber!=0 || m.Genre!="" ||
		m.PublishedYear!=0 || m.Narrator!="" || m.Publisher!="" || m.ISBN!="" || m.ASIN!="" ||
		m.Language!="" || m.Description!=""
}

func normalizeAuthor(value string) string {
	value=cleanMetadata(value)
	if value=="" { return "" }
	parts:=strings.Split(value,",")
	if len(parts)==2 && cleanMetadata(parts[0])!="" && cleanMetadata(parts[1])!="" {
		return cleanMetadata(parts[1]+" "+parts[0])
	}
	return value
}

func normalizeIdentifier(value string) string {
	value=strings.TrimSpace(value)
	value=strings.TrimPrefix(strings.TrimPrefix(strings.ToUpper(value),"URN:ISBN:"),"URN:ASIN:")
	value=strings.NewReplacer(" ","","-","").Replace(value)
	return value
}

func looksISBN(value string) bool {
	value=normalizeIdentifier(value)
	if len(value)!=10 && len(value)!=13 { return false }
	for i,r:=range value {
		if r>='0'&&r<='9' { continue }
		if i==len(value)-1 && len(value)==10 && r=='X' { continue }
		return false
	}
	return true
}

func yearFromText(value string) int {
	var year int
	fmt.Sscanf(strings.TrimSpace(value),"%d",&year)
	if year>=1000 && year<=time.Now().Year()+2 { return year }
	return 0
}

func numberFromText(value string) float64 {
	var number float64
	fmt.Sscanf(strings.TrimSpace(strings.TrimPrefix(value,"#")),"%f",&number)
	if number<0 { return 0 }
	return number
}

func metadataFromMap(raw map[string]any) embeddedMetadata {
	pick:=func(keys ...string) string {
		for _,key:=range keys {
			if value,ok:=raw[key];ok {
				if text:=cleanMetadata(fmt.Sprint(value));text!="" && text!="<nil>" { return text }
			}
		}
		return ""
	}
	return embeddedMetadata{
		Title:pick("title","name"), Author:normalizeAuthor(pick("author","creator","writer")),
		Series:pick("series","collection"), SeriesNumber:numberFromText(pick("seriesNumber","series_index","seriesIndex","number","volume")),
		Genre:pick("genre","subject"), PublishedYear:yearFromText(pick("publishedYear","year","date","published")),
		Narrator:pick("narrator"), Publisher:pick("publisher"), ISBN:normalizeIdentifier(pick("isbn","ISBN")),
		ASIN:normalizeIdentifier(pick("asin","ASIN")), Language:pick("language"),
		Description:pick("description","summary","comments"),
	}
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

	if sidecar := sidecarMetadataWithCache(filename, cache); metadataPresent(sidecar) {
		candidates = append(candidates, metadataCandidate{embeddedMetadata: sidecar, source: "sidecar", confidence: 96})
	}

	var embedded embeddedMetadata
	switch format {
	case "Ebook":
		embedded = epubMetadata(filename)
	case "Comic":
		embedded = comicMetadata(filename)
	}
	if metadataPresent(embedded) {
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
