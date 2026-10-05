package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
)

var (
	openLibrarySearchURL = "https://openlibrary.org/search.json"
	googleBooksSearchURL = "https://www.googleapis.com/books/v1/volumes"
)

type metadataProviderSettings struct {
	OnlineEnabled      bool `json:"onlineEnabled"`
	OpenLibraryEnabled bool `json:"openLibraryEnabled"`
	GoogleBooksEnabled bool `json:"googleBooksEnabled"`
	MinimumMatch       int  `json:"minimumMatch"`
}

type onlineMetadataCandidate struct {
	Title    string   `json:"title"`
	Author   string   `json:"author"`
	Series   string   `json:"series,omitempty"`
	Genre    string   `json:"genre,omitempty"`
	Provider string   `json:"provider"`
	Score    int      `json:"score"`
	Subjects []string `json:"-"`
}

type metadataEnrichTarget struct {
	ID         int64
	SourceID   int64
	Relative   string
	Title      string
	Author     string
	Series     string
	Genre      string
	Format     string
	Source     string
	Confidence int
	NeedsReview bool
}

type metadataEnrichResult struct {
	Examined int      `json:"examined"`
	Matched  int      `json:"matched"`
	Updated  int      `json:"updated"`
	Skipped  int      `json:"skipped"`
	Errors   []string `json:"errors,omitempty"`
}

func (a *app) initMetadataOnline() error {
	_, err := a.db.Exec("CREATE TABLE IF NOT EXISTS metadata_provider_settings(" +
		"id INTEGER PRIMARY KEY CHECK(id=1)," +
		"online_enabled INTEGER NOT NULL DEFAULT 1," +
		"openlibrary_enabled INTEGER NOT NULL DEFAULT 1," +
		"googlebooks_enabled INTEGER NOT NULL DEFAULT 1," +
		"minimum_match INTEGER NOT NULL DEFAULT 72 CHECK(minimum_match>=60 AND minimum_match<=95)," +
		"updated INTEGER NOT NULL DEFAULT 0" +
		");" +
		"INSERT OR IGNORE INTO metadata_provider_settings(id) VALUES(1);")
	return err
}

func (a *app) metadataSettings() (metadataProviderSettings, error) {
	var s metadataProviderSettings
	err := a.db.QueryRow("SELECT online_enabled,openlibrary_enabled,googlebooks_enabled,minimum_match FROM metadata_provider_settings WHERE id=1").
		Scan(&s.OnlineEnabled, &s.OpenLibraryEnabled, &s.GoogleBooksEnabled, &s.MinimumMatch)
	return s, err
}

func normaliseLookupText(v string) string {
	v = strings.ToLower(strings.TrimSpace(v))
	var b strings.Builder
	space := false
	for _, r := range v {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			space = false
		default:
			if !space {
				b.WriteByte(' ')
				space = true
			}
		}
	}
	return strings.Join(strings.Fields(b.String()), " ")
}

func lookupTokens(v string) map[string]struct{} {
	out := map[string]struct{}{}
	for _, token := range strings.Fields(normaliseLookupText(v)) {
		if len(token) < 2 {
			continue
		}
		out[token] = struct{}{}
	}
	return out
}

func tokenSimilarity(a, b string) int {
	aa, bb := lookupTokens(a), lookupTokens(b)
	if len(aa) == 0 || len(bb) == 0 {
		return 0
	}
	intersection := 0
	union := map[string]struct{}{}
	for k := range aa {
		union[k] = struct{}{}
		if _, ok := bb[k]; ok {
			intersection++
		}
	}
	for k := range bb {
		union[k] = struct{}{}
	}
	return int(float64(intersection) / float64(len(union)) * 100)
}

var weakPartTitle = regexp.MustCompile(`(?i)^(?:part|chapter|track|disc|disk|cd|volume|vol\.?)[\s._-]*\d+(?:[\s._-].*)?$`)

func lookupTitleForTarget(t metadataEnrichTarget) string {
	title := cleanMetadata(t.Title)
	if title != "" && !weakPartTitle.MatchString(title) && normaliseLookupText(title) != "untitled" {
		return title
	}
	parts := strings.Split(filepath.ToSlash(t.Relative), "/")
	for i := len(parts) - 2; i >= 0; i-- {
		candidate := cleanMetadata(parts[i])
		if candidate == "" || weakPartTitle.MatchString(candidate) {
			continue
		}
		return candidate
	}
	return title
}

func candidateScore(target metadataEnrichTarget, candidate onlineMetadataCandidate) int {
	queryTitle := lookupTitleForTarget(target)
	titleScore := tokenSimilarity(queryTitle, candidate.Title)
	if normaliseLookupText(queryTitle) == normaliseLookupText(candidate.Title) && queryTitle != "" {
		titleScore = 100
	}
	authorScore := tokenSimilarity(target.Author, candidate.Author)
	score := titleScore
	if strings.TrimSpace(target.Author) != "" && strings.TrimSpace(candidate.Author) != "" {
		score = (titleScore*78 + authorScore*22) / 100
	}
	if target.Format == "Comic" {
		for _, subject := range candidate.Subjects {
			n := normaliseLookupText(subject)
			if strings.Contains(n, "comic") || strings.Contains(n, "graphic novel") {
				score += 5
				break
			}
		}
	}
	if score > 100 {
		score = 100
	}
	return score
}

func metadataHTTPClient() *http.Client {
	return &http.Client{Timeout: 5 * time.Second}
}

func getJSON(ctx context.Context, client *http.Client, endpoint string, query url.Values, dst any) error {
	u, err := url.Parse(endpoint)
	if err != nil {
		return err
	}
	u.RawQuery = query.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Archivist/1.0 metadata-enrichment")
	req.Header.Set("Accept", "application/json")
	res, err := client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return fmt.Errorf("provider returned HTTP %d", res.StatusCode)
	}
	return json.NewDecoder(http.MaxBytesReader(nil, res.Body, 2<<20)).Decode(dst)
}

func openLibraryCandidates(ctx context.Context, client *http.Client, target metadataEnrichTarget) ([]onlineMetadataCandidate, error) {
	title := lookupTitleForTarget(target)
	if title == "" {
		return nil, nil
	}
	query := url.Values{"title": {title}, "limit": {"5"}, "fields": {"title,author_name,subject"}}
	if strings.TrimSpace(target.Author) != "" {
		query.Set("author", target.Author)
	}
	var payload struct {
		Docs []struct {
			Title      string   `json:"title"`
			AuthorName []string `json:"author_name"`
			Subject    []string `json:"subject"`
		} `json:"docs"`
	}
	if err := getJSON(ctx, client, openLibrarySearchURL, query, &payload); err != nil {
		return nil, err
	}
	out := make([]onlineMetadataCandidate, 0, len(payload.Docs))
	for _, doc := range payload.Docs {
		if cleanMetadata(doc.Title) == "" {
			continue
		}
		genre := ""
		for _, subject := range doc.Subject {
			if v := cleanMetadata(subject); v != "" {
				genre = v
				break
			}
		}
		out = append(out, onlineMetadataCandidate{
			Title: cleanMetadata(doc.Title),
			Author: cleanMetadata(strings.Join(doc.AuthorName, ", ")),
			Genre: genre,
			Provider: "Open Library",
			Subjects: doc.Subject,
		})
	}
	return out, nil
}

func googleBooksCandidates(ctx context.Context, client *http.Client, target metadataEnrichTarget) ([]onlineMetadataCandidate, error) {
	title := lookupTitleForTarget(target)
	if title == "" {
		return nil, nil
	}
	terms := []string{"intitle:" + title}
	if strings.TrimSpace(target.Author) != "" {
		terms = append(terms, "inauthor:"+target.Author)
	}
	query := url.Values{"q": {strings.Join(terms, " ")}, "maxResults": {"5"}, "printType": {"books"}}
	var payload struct {
		Items []struct {
			VolumeInfo struct {
				Title      string   `json:"title"`
				Authors    []string `json:"authors"`
				Categories []string `json:"categories"`
			} `json:"volumeInfo"`
		} `json:"items"`
	}
	if err := getJSON(ctx, client, googleBooksSearchURL, query, &payload); err != nil {
		return nil, err
	}
	out := make([]onlineMetadataCandidate, 0, len(payload.Items))
	for _, item := range payload.Items {
		info := item.VolumeInfo
		if cleanMetadata(info.Title) == "" {
			continue
		}
		genre := ""
		if len(info.Categories) > 0 {
			genre = cleanMetadata(info.Categories[0])
		}
		out = append(out, onlineMetadataCandidate{
			Title: cleanMetadata(info.Title),
			Author: cleanMetadata(strings.Join(info.Authors, ", ")),
			Genre: genre,
			Provider: "Google Books",
			Subjects: info.Categories,
		})
	}
	return out, nil
}

func bestOnlineMetadata(ctx context.Context, settings metadataProviderSettings, target metadataEnrichTarget) (onlineMetadataCandidate, bool, []string) {
	if !settings.OnlineEnabled {
		return onlineMetadataCandidate{}, false, nil
	}
	client := metadataHTTPClient()
	candidates := []onlineMetadataCandidate{}
	errs := []string{}
	if settings.OpenLibraryEnabled {
		items, err := openLibraryCandidates(ctx, client, target)
		if err != nil {
			errs = append(errs, "Open Library: "+err.Error())
		} else {
			candidates = append(candidates, items...)
		}
	}
	if settings.GoogleBooksEnabled {
		items, err := googleBooksCandidates(ctx, client, target)
		if err != nil {
			errs = append(errs, "Google Books: "+err.Error())
		} else {
			candidates = append(candidates, items...)
		}
	}
	for i := range candidates {
		candidates[i].Score = candidateScore(target, candidates[i])
	}
	sort.SliceStable(candidates, func(i, j int) bool {
		if candidates[i].Score == candidates[j].Score {
			return candidates[i].Provider < candidates[j].Provider
		}
		return candidates[i].Score > candidates[j].Score
	})
	if len(candidates) == 0 || candidates[0].Score < settings.MinimumMatch {
		return onlineMetadataCandidate{}, false, errs
	}
	return candidates[0], true, errs
}

func appendMetadataSource(existing, provider string) string {
	provider = normaliseLookupText(provider)
	provider = strings.ReplaceAll(provider, " ", "-")
	if provider == "" {
		return existing
	}
	tag := "online:" + provider
	for _, part := range strings.Split(existing, "+") {
		if part == tag {
			return existing
		}
	}
	if strings.TrimSpace(existing) == "" {
		return tag
	}
	return existing + "+" + tag
}

func metadataReviewState(format, title, author string, score int) (bool, string) {
	if cleanMetadata(title) == "" || normaliseLookupText(title) == "untitled" {
		return true, "Archivist could not determine a title."
	}
	if score < 72 {
		return true, "Online matches were not strong enough to apply automatically."
	}
	if cleanMetadata(author) == "" && format != "Comic" {
		return true, "The title was identified, but the author still needs review."
	}
	return false, ""
}

func (a *app) metadataEnrichTargets(sourceID int64, limit int) ([]metadataEnrichTarget, error) {
	args := []any{}
	where := "a.available=1 AND a.format IN ('Ebook','PDF','Comic') AND a.metadata_source NOT IN ('manual','legacy') AND (a.needs_review=1 OR trim(a.author)='' OR trim(a.genre)='')"
	if sourceID > 0 {
		where += " AND a.source_id=?"
		args = append(args, sourceID)
	}
	args = append(args, limit)
	rows, err := a.db.Query("SELECT a.id,a.source_id,a.relative_path,a.title,a.author,a.series,a.genre,a.format,a.metadata_source,a.metadata_confidence,a.needs_review FROM assets a WHERE "+where+" ORDER BY a.needs_review DESC,a.id LIMIT ?", args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []metadataEnrichTarget{}
	for rows.Next() {
		var item metadataEnrichTarget
		if err = rows.Scan(&item.ID,&item.SourceID,&item.Relative,&item.Title,&item.Author,&item.Series,&item.Genre,&item.Format,&item.Source,&item.Confidence,&item.NeedsReview); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

func (a *app) enrichMetadata(ctx context.Context, sourceID int64, limit int) (metadataEnrichResult, error) {
	settings, err := a.metadataSettings()
	if err != nil {
		return metadataEnrichResult{}, err
	}
	if !settings.OnlineEnabled {
		return metadataEnrichResult{}, errors.New("online metadata is disabled")
	}
	if !settings.OpenLibraryEnabled && !settings.GoogleBooksEnabled {
		return metadataEnrichResult{}, errors.New("enable at least one online metadata provider")
	}
	if limit < 1 {
		limit = 25
	}
	if limit > 100 {
		limit = 100
	}
	targets, err := a.metadataEnrichTargets(sourceID, limit)
	if err != nil {
		return metadataEnrichResult{}, err
	}
	result := metadataEnrichResult{Examined: len(targets)}
	affected := map[int64]struct{}{}
	errorSet := map[string]struct{}{}
	for _, target := range targets {
		if err := ctx.Err(); err != nil {
			return result, err
		}
		candidate, matched, providerErrors := bestOnlineMetadata(ctx, settings, target)
		for _, message := range providerErrors {
			errorSet[message] = struct{}{}
		}
		if !matched {
			result.Skipped++
			continue
		}
		result.Matched++
		title, author, series, genre := target.Title, target.Author, target.Series, target.Genre
		if target.NeedsReview || target.Confidence < 80 || normaliseLookupText(title) == "untitled" {
			title = candidate.Title
		}
		if cleanMetadata(author) == "" || target.NeedsReview || target.Confidence < 80 {
			if candidate.Author != "" {
				author = candidate.Author
			}
		}
		if cleanMetadata(genre) == "" && candidate.Genre != "" {
			genre = candidate.Genre
		}
		needsReview, reason := metadataReviewState(target.Format, title, author, candidate.Score)
		source := appendMetadataSource(target.Source, candidate.Provider)

		a.scanMu.Lock()
		res, updateErr := a.db.Exec("UPDATE assets SET title=?,author=?,series=?,genre=?,metadata_source=?,metadata_confidence=CASE WHEN metadata_confidence>? THEN metadata_confidence ELSE ? END,needs_review=?,review_reason=? WHERE id=? AND metadata_source NOT IN ('manual','legacy')",
			title, author, series, genre, source, candidate.Score, candidate.Score, needsReview, reason, target.ID)
		a.scanMu.Unlock()
		if updateErr != nil {
			return result, updateErr
		}
		if n, _ := res.RowsAffected(); n == 1 {
			result.Updated++
			affected[target.SourceID] = struct{}{}
		} else {
			result.Skipped++
		}
	}
	if len(affected) > 0 {
		ids := make([]int64, 0, len(affected))
		for id := range affected {
			ids = append(ids, id)
		}
		sort.Slice(ids, func(i,j int) bool { return ids[i] < ids[j] })
		a.scanMu.Lock()
		for _, id := range ids {
			if err := a.syncAutoCatalogueLocked(id); err != nil {
				a.scanMu.Unlock()
				return result, err
			}
		}
		a.scanMu.Unlock()
	}
	if len(errorSet) > 0 {
		result.Errors = make([]string, 0, len(errorSet))
		for message := range errorSet {
			result.Errors = append(result.Errors, message)
		}
		sort.Strings(result.Errors)
		if len(result.Errors) > 4 {
			result.Errors = result.Errors[:4]
		}
	}
	return result, nil
}

func (a *app) metadataOnlineRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/metadata/settings", func(w http.ResponseWriter, r *http.Request) {
		if !who(r).Owner {
			fail(w, http.StatusForbidden, errors.New("metadata provider settings are available to the library owner"))
			return
		}
		settings, err := a.metadataSettings()
		if err != nil {
			fail(w, 500, err)
			return
		}
		reply(w, settings)
	})
	mux.HandleFunc("PUT /api/metadata/settings", func(w http.ResponseWriter, r *http.Request) {
		if !who(r).Owner {
			fail(w, http.StatusForbidden, errors.New("metadata provider settings are available to the library owner"))
			return
		}
		var in metadataProviderSettings
		if err := json.NewDecoder(http.MaxBytesReader(w,r.Body,4096)).Decode(&in); err != nil {
			fail(w,400,errors.New("invalid metadata provider settings"))
			return
		}
		if in.MinimumMatch == 0 {
			in.MinimumMatch = 72
		}
		if in.MinimumMatch < 60 || in.MinimumMatch > 95 {
			fail(w,400,errors.New("minimum match must be between 60 and 95"))
			return
		}
		if in.OnlineEnabled && !in.OpenLibraryEnabled && !in.GoogleBooksEnabled {
			fail(w,400,errors.New("enable at least one provider when online metadata is enabled"))
			return
		}
		_, err := a.db.Exec("UPDATE metadata_provider_settings SET online_enabled=?,openlibrary_enabled=?,googlebooks_enabled=?,minimum_match=?,updated=? WHERE id=1",
			in.OnlineEnabled,in.OpenLibraryEnabled,in.GoogleBooksEnabled,in.MinimumMatch,time.Now().Unix())
		if err != nil {
			fail(w,500,err)
			return
		}
		reply(w,in)
	})
	mux.HandleFunc("POST /api/metadata/enrich", func(w http.ResponseWriter, r *http.Request) {
		if !who(r).Owner {
			fail(w, http.StatusForbidden, errors.New("metadata enrichment is available to the library owner"))
			return
		}
		var in struct {
			SourceID int64 `json:"sourceId"`
			Limit int `json:"limit"`
		}
		if r.ContentLength > 0 {
			if err := json.NewDecoder(http.MaxBytesReader(w,r.Body,4096)).Decode(&in); err != nil {
				fail(w,400,errors.New("invalid metadata enrichment request"))
				return
			}
		}
		if in.SourceID < 0 {
			fail(w,400,errors.New("invalid source"))
			return
		}
		result, err := a.enrichMetadata(r.Context(),in.SourceID,in.Limit)
		if err != nil {
			if errors.Is(err,context.Canceled) || errors.Is(err,context.DeadlineExceeded) {
				fail(w,408,errors.New("metadata enrichment was cancelled"))
				return
			}
			fail(w,400,err)
			return
		}
		reply(w,result)
	})
	mux.HandleFunc("GET /api/metadata/preview", func(w http.ResponseWriter, r *http.Request) {
		if !who(r).Owner {
			fail(w,http.StatusForbidden,errors.New("metadata preview is available to the library owner"))
			return
		}
		id, err := strconv.ParseInt(r.URL.Query().Get("asset"),10,64)
		if err != nil || id < 1 {
			fail(w,400,errors.New("choose a valid asset"))
			return
		}
		var target metadataEnrichTarget
		err = a.db.QueryRow("SELECT id,source_id,relative_path,title,author,series,genre,format,metadata_source,metadata_confidence,needs_review FROM assets WHERE id=? AND available=1",id).
			Scan(&target.ID,&target.SourceID,&target.Relative,&target.Title,&target.Author,&target.Series,&target.Genre,&target.Format,&target.Source,&target.Confidence,&target.NeedsReview)
		if err != nil {
			if errors.Is(err,sql.ErrNoRows) { fail(w,404,errors.New("asset missing")); return }
			fail(w,500,err); return
		}
		settings, err := a.metadataSettings()
		if err != nil { fail(w,500,err); return }
		candidate, matched, providerErrors := bestOnlineMetadata(r.Context(),settings,target)
		reply(w,map[string]any{"matched":matched,"candidate":candidate,"providerErrors":providerErrors})
	})
}
