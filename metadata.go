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
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
)

const metadataXMLLimit = 2 << 20

var (
	asinQualifierRE = regexp.MustCompile(`(?i)\\[\\s*ASIN\\s*[-:#]?\\s*([A-Z0-9]{10})\\s*\\]`)
	isbnQualifierRE = regexp.MustCompile(`(?i)\\[\\s*ISBN(-10|-13)?\\s*[-:#]?\\s*([-0-9Xx ]{10,20})\\s*\\]`)
	narratorQualifierRE = regexp.MustCompile(`\\{([^{}]{2,100})\\}`)
	yearQualifierRE = regexp.MustCompile(`\\(\\s*((19|20)\\d{2})\\s*\\)`)
)

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

func filenameQualifiers(value string) (stem, narrator, isbn, asin string, publishedYear int) {
	stem = value
	if match := asinQualifierRE.FindStringSubmatch(stem); len(match) == 2 {
		asin = normalizeIdentifier(match[1])
		stem = asinQualifierRE.ReplaceAllString(stem, "")
	}
	if match := isbnQualifierRE.FindStringSubmatch(stem); len(match) == 2 {
		isbn = normalizeIdentifier(match[1])
		stem = isbnQualifierRE.ReplaceAllString(stem, "")
	}
	if match := narratorQualifierRE.FindStringSubmatch(stem); len(match) == 2 {
		narrator = cleanMetadata(match[1])
		stem = narratorQualifierRE.ReplaceAllString(stem, "")
	}
	if match := yearQualifierRE.FindStringSubmatch(stem); len(match) == 2 {
		publishedYear = yearFromText(match[1])
		stem = yearQualifierRE.ReplaceAllString(stem, "")
	}
	stem = cleanMetadata(stem)
	return
}

func pathMetadata(relative, format string) metadataCandidate {
	parts := strings.Split(filepath.ToSlash(relative), "/")
	rawBase := cleanMetadata(strings.TrimSuffix(filepath.Base(relative), filepath.Ext(relative)))
	base, narrator, isbn, asin, publishedYear := filenameQualifiers(rawBase)
	m := embeddedMetadata{Title: base, Narrator: narrator, ISBN: isbn, ASIN: asin, PublishedYear: publishedYear}
	confidence := 35

	dashed := strings.Split(base, " - ")
	for i := range dashed { dashed[i] = cleanMetadata(dashed[i]) }

	if format == "Audio" {
		// Common layouts:
		// Author / Book / 01 - Chapter.mp3
		// Author / Series / Book / 01 - Chapter.mp3
		if len(parts) >= 4 {
			m.Author = normalizeAuthor(parts[len(parts)-4])
			m.Series = cleanMetadata(parts[len(parts)-3])
			bookFolder := cleanMetadata(parts[len(parts)-2])
			if bits := strings.SplitN(bookFolder, " - ", 2); len(bits) == 2 {
				if number, ok := seriesPositionFromLabel(bits[0]); ok && number > 0 {
					m.SeriesNumber = number
				}
			}
			confidence = 72
		} else if len(parts) >= 3 {
			m.Author = normalizeAuthor(parts[len(parts)-3])
			confidence = 65
		} else if len(parts) == 2 {
			m.Author = normalizeAuthor(parts[0])
			confidence = 55
		}
		return metadataCandidate{embeddedMetadata: m, source: "path", confidence: confidence}
	}

	parent := ""
	if len(parts) >= 2 { parent = cleanMetadata(parts[len(parts)-2]) }
	grandparent := ""
	if len(parts) >= 3 { grandparent = cleanMetadata(parts[len(parts)-3]) }

	parsedFilename := false
	if len(dashed) >= 4 {
		if number, ok := seriesPositionFromLabel(dashed[2]); ok {
			m.Author = normalizeAuthor(dashed[0])
			m.Series = dashed[1]
			m.SeriesNumber = number
			m.Title = cleanMetadata(strings.Join(dashed[3:], " - "))
			confidence = 82
			parsedFilename = true
		}
	}
	if !parsedFilename && len(dashed) >= 3 {
		if number, ok := seriesPositionFromLabel(dashed[1]); ok {
			m.Author = normalizeAuthor(dashed[0])
			m.SeriesNumber = number
			m.Title = cleanMetadata(strings.Join(dashed[2:], " - "))
			if parent != "" && !strings.EqualFold(parent, m.Title) { m.Series = parent }
			confidence = 78
		}
	}

	if m.Author == "" && m.Series == "" {
		if len(parts) >= 3 {
			m.Author = normalizeAuthor(grandparent)
			m.Series = parent
			confidence = 72
		} else if parent != "" {
			m.Series = parent
			confidence = 52
		}
	}
	if len(dashed) >= 2 {
		if number, indexed := seriesPositionFromLabel(dashed[0]); indexed && m.Series != "" {
			m.SeriesNumber = number
			m.Title = cleanMetadata(strings.Join(dashed[1:], " - "))
			if confidence < 76 { confidence = 76 }
		} else if m.Author == "" && cleanMetadata(dashed[0]) != "" && cleanMetadata(strings.Join(dashed[1:], " - ")) != "" {
			m.Author = normalizeAuthor(dashed[0])
			m.Title = cleanMetadata(strings.Join(dashed[1:], " - "))
			if confidence < 68 { confidence = 68 }
		}
	}
	if m.Title == "" { m.Title = "Untitled" }
	return metadataCandidate{embeddedMetadata: m, source: "path", confidence: confidence}
}

func mergeMetadata(candidates ...metadataCandidate) identifiedMetadata {
	result := identifiedMetadata{}
	best := map[string]int{}
	sources := []string{}
	maxConfidence := 0
	type evidenceValue struct { value string; confidence int; source string }
	evidence := map[string][]evidenceValue{}
	record := func(field, value string, confidence int, source string) {
		value = cleanMetadata(value)
		if value == "" { return }
		evidence[field] = append(evidence[field], evidenceValue{value:value, confidence:confidence, source:source})
	}
	setString := func(field string, value string, confidence int, source string, dst *string) {
		record(field, value, confidence, source)
		if value != "" && confidence > best[field] { *dst, best[field] = cleanMetadata(value), confidence }
	}
	setNumber := func(field string, value float64, confidence int, source string, dst *float64) {
		if value == 0 { return }
		record(field, strconv.FormatFloat(value,'f',-1,64), confidence, source)
		if confidence > best[field] { *dst, best[field] = value, confidence }
	}
	setYear := func(value int, confidence int, source string) {
		if value <= 0 { return }
		record("publishedYear", strconv.Itoa(value), confidence, source)
		if confidence > best["publishedYear"] { result.PublishedYear, best["publishedYear"] = value, confidence }
	}
	for _, candidate := range candidates {
		if candidate.confidence <= 0 { continue }
		setString("title", candidate.Title, candidate.confidence, candidate.source, &result.Title)
		setString("author", candidate.Author, candidate.confidence, candidate.source, &result.Author)
		setString("series", candidate.Series, candidate.confidence, candidate.source, &result.Series)
		setNumber("seriesNumber", candidate.SeriesNumber, candidate.confidence, candidate.source, &result.SeriesNumber)
		setString("genre", candidate.Genre, candidate.confidence, candidate.source, &result.Genre)
		setYear(candidate.PublishedYear,candidate.confidence,candidate.source)
		setString("narrator", candidate.Narrator, candidate.confidence, candidate.source, &result.Narrator)
		setString("publisher", candidate.Publisher, candidate.confidence, candidate.source, &result.Publisher)
		setString("isbn", candidate.ISBN, candidate.confidence, candidate.source, &result.ISBN)
		setString("asin", candidate.ASIN, candidate.confidence, candidate.source, &result.ASIN)
		setString("language", candidate.Language, candidate.confidence, candidate.source, &result.Language)
		setString("description", candidate.Description, candidate.confidence, candidate.source, &result.Description)
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

	conflicting := []string{}
	for _, field := range []string{"title","author","series","seriesNumber","isbn","asin"} {
		values := evidence[field]
		if len(values) < 2 { continue }
		bestValue, bestScore := "", -1
		for _, item := range values {
			if item.confidence > bestScore { bestValue, bestScore = strings.ToLower(strings.TrimSpace(item.value)), item.confidence }
		}
		for _, item := range values {
			if item.confidence >= bestScore-15 && strings.ToLower(strings.TrimSpace(item.value)) != bestValue {
				conflicting = append(conflicting, field)
				break
			}
		}
	}
	switch {
	case len(conflicting) > 0:
		result.NeedsReview = true
		result.ReviewReason = "Metadata sources disagree on " + strings.Join(uniqueStrings(conflicting), ", ") + "."
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

func seriesPositionFromLabel(value string) (float64, bool) {
	value = strings.TrimSpace(strings.TrimPrefix(value, "#"))
	var number float64
	if _, err := fmt.Sscanf(value, "%f", &number); err != nil || number < 0 {
		return 0, false
	}
	// Accept only a pure numeric label, not titles that merely begin with digits.
	if strings.TrimSpace(strconv.FormatFloat(number, 'f', -1, 64)) != strings.TrimLeft(value, "0") {
		trimmed := strings.TrimLeft(value, "0")
		if strings.HasPrefix(trimmed, ".") { trimmed = "0" + trimmed }
		if trimmed == "" { trimmed = "0" }
		if trimmed != strconv.FormatFloat(number, 'f', -1, 64) { return 0, false }
	}
	return number, true
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
	case "Audio":
		embedded = audioMetadata(filename)
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
