package main

import (
	"regexp"
	"strconv"
	"strings"
	"time"
)

var comicFilenameDecimal = regexp.MustCompile(`\d+\.\d+`)
var comicFilenameBrackets = regexp.MustCompile(`\(([^()]*)\)|\[([^\[\]]*)\]`)
var comicFilenameYear = regexp.MustCompile(`^((?:18|19|20)\d{2})(?:$|[_ -])`)
var comicFilenameIssue = regexp.MustCompile(`^(.+?)\s+(\d{1,5}[A-Za-z]?)$`)
var comicFilenameUnsafe = regexp.MustCompile(`(?i)\b(?:annual|special|volume|vol|omnibus|collection|pack|eps)\b|\d\s*-\s*\d`)

// Filename evidence stays labelled "path". A bracketed date is an inferred
// issue/edition date; it is never supplied as proof to a provider match.
func comicFilenameMetadata(base string) embeddedMetadata {
	m := embeddedMetadata{Title: base}
	protected := comicFilenameDecimal.ReplaceAllStringFunc(base, func(value string) string { return strings.ReplaceAll(value, ".", "\x00") })
	clean := strings.NewReplacer(".", " ", "_", " ").Replace(protected)
	clean = strings.ReplaceAll(clean, "\x00", ".")
	clean = comicFilenameBrackets.ReplaceAllStringFunc(clean, func(token string) string {
		value := strings.TrimSpace(token[1 : len(token)-1])
		if comicFilenameUnsafe.MatchString(value) {
			return " " + value + " "
		}
		if match := comicFilenameYear.FindStringSubmatch(value); len(match) > 1 {
			year, _ := strconv.Atoi(match[1])
			if year <= time.Now().Year()+1 {
				m.PublishedYear = year
			}
			return " "
		}
		// Bracketed scan labels are noise; an actual series+number remains useful.
		if comicFilenameIssue.MatchString(value) && !comicFilenameUnsafe.MatchString(value) {
			return " " + value + " "
		}
		return " "
	})
	clean = strings.Join(strings.Fields(clean), " ")
	if clean == "" {
		return m
	}
	m.Title = clean
	if comicFilenameUnsafe.MatchString(clean) {
		return m
	}
	if n, status := comicTitleIssue(clean); status == "match" {
		m.Series = comicSeriesTitle(clean)
		m.SeriesNumber = n
		return m
	}
	if comicFilenameUnsafe.MatchString(clean) {
		return m
	}
	match := comicFilenameIssue.FindStringSubmatch(clean)
	if len(match) != 3 {
		return m
	}
	label := match[2]
	// Unadorned years and collection-leading numbers are not issues. Only a
	// padded trailing label or bracketed date supports this weak inference.
	if len(label) < 3 && m.PublishedYear == 0 {
		return m
	}
	if n, err := strconv.Atoi(label); err == nil && n >= 1800 && n <= 2099 {
		return m
	}
	m.Series = strings.TrimSpace(match[1])
	if number, err := strconv.ParseFloat(label, 64); err == nil && number > 0 && number <= 100000 {
		m.SeriesNumber = number
		m.Title = m.Series + " #" + strconv.FormatFloat(number, 'f', -1, 64)
	}
	return m
}
