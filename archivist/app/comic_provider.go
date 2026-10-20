package main

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type metronSeries struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Genres []struct {
		Name string `json:"name"`
	} `json:"genres"`
}
type metronIssue struct {
	ID        int          `json:"id"`
	Number    string       `json:"number"`
	Series    metronSeries `json:"series"`
	CoverDate string       `json:"cover_date"`
}
type metronIssueList struct {
	Count   int           `json:"count"`
	Next    *string       `json:"next"`
	Results []metronIssue `json:"results"`
}

func uniqueMetronIssue(list metronIssueList, q multiMetadataQuery) int {
	// Never choose the first search hit or follow an unbounded pagination chain.
	if list.Count != 1 || list.Next != nil || len(list.Results) != 1 {
		return 0
	}
	item := list.Results[0]
	if item.ID <= 0 || item.Series.ID <= 0 || !strings.EqualFold(strings.TrimSpace(item.Series.Name), strings.TrimSpace(q.Series)) || item.Number != q.IssueNumber {
		return 0
	}
	return item.ID
}
func lookupMetron(ctx context.Context, client *http.Client, base, token string, q multiMetadataQuery) (multiMetadataCandidate, string) {
	empty := multiMetadataCandidate{}
	boundedClient := *client
	boundedClient.Timeout = 8 * time.Second
	boundedClient.CheckRedirect = func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }
	client = &boundedClient
	if q.Series == "" || q.IssueNumber == "" {
		return empty, "needs series or issue identity"
	}
	get := func(endpoint string, out any) error {
		req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
		if err != nil {
			return err
		}
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("User-Agent", "Archivist/"+buildVersion+" (private library metadata)")
		req.Header.Set("Accept", "application/json")
		res, err := client.Do(req)
		if err != nil {
			return errors.New("provider unavailable")
		}
		defer res.Body.Close()
		if res.StatusCode == 429 {
			return errors.New("provider rate limited")
		}
		if res.StatusCode == 401 || res.StatusCode == 403 {
			return errors.New("provider connection needs attention")
		}
		if res.StatusCode != 200 {
			return errors.New("provider unavailable")
		}
		data, err := io.ReadAll(io.LimitReader(res.Body, metadataXMLLimit+1))
		if err != nil || len(data) > metadataXMLLimit {
			return errors.New("provider response too large")
		}
		if err = json.Unmarshal(data, out); err != nil {
			return errors.New("provider response unreadable")
		}
		return nil
	}
	var list metronIssueList
	params := url.Values{"series_name": {q.Series}, "number": {q.IssueNumber}}
	if err := get(base+"/issue/?"+params.Encode(), &list); err != nil {
		return empty, err.Error()
	}
	if list.Count == 0 {
		return empty, "no confident comic match"
	}
	id := uniqueMetronIssue(list, q)
	if id == 0 {
		return empty, "needs series choice"
	}
	var detail metronIssue
	if err := get(base+"/issue/"+strconv.Itoa(id)+"/", &detail); err != nil {
		return empty, err.Error()
	}
	if detail.ID != id || detail.Series.ID != list.Results[0].Series.ID || detail.Number != q.IssueNumber || !strings.EqualFold(detail.Series.Name, q.Series) {
		return empty, "provider identity changed"
	}
	genres := []string{}
	for _, g := range detail.Series.Genres {
		genres = append(genres, g.Name)
	}
	c := multiMetadataCandidate{publicMetadataCandidate: publicMetadataCandidate{Title: q.Title, WorkID: "metron:" + strconv.Itoa(id), Source: "Metron https://metron.cloud/issue/" + strconv.Itoa(id) + "/", PublishedYear: yearFromText(detail.CoverDate)}, Genre: atlasGenre(genres), YearType: "comic issue", ComicSeriesMatch: "match", ComicIssueMatch: "match"}
	// Series genre and issue cover year are distinct evidence. Do not import
	// unverified credits, descriptions with attribution obligations, or covers.
	return c, "matched"
}
func (a *app) metronToken() string {
	var token string
	_ = a.db.QueryRow("SELECT value FROM app_meta WHERE key='metron_token'").Scan(&token)
	return token
}
func (a *app) comicProviderRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/manage/comic-provider", func(w http.ResponseWriter, r *http.Request) {
		if !who(r).Owner {
			http.Error(w, "administrator access required", 403)
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		reply(w, map[string]any{"provider": "Metron", "connected": a.metronToken() != ""})
	})
	mux.HandleFunc("PUT /api/manage/comic-provider", func(w http.ResponseWriter, r *http.Request) {
		if !who(r).Owner {
			http.Error(w, "administrator access required", 403)
			return
		}
		var in struct {
			Token *string `json:"token"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 2048)).Decode(&in) != nil || in.Token == nil {
			http.Error(w, "token is required", 400)
			return
		}
		token := strings.TrimSpace(*in.Token)
		if len(token) > 512 || strings.ContainsAny(token, "\r\n\t ") {
			http.Error(w, "invalid token", 400)
			return
		}
		a.scanMu.Lock()
		defer a.scanMu.Unlock()
		tx, err := a.db.BeginTx(r.Context(), nil)
		if err != nil {
			fail(w, 500, err)
			return
		}
		defer tx.Rollback()
		if _, err = tx.Exec("INSERT INTO app_meta(key,value) VALUES('metron_token',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", token); err != nil {
			fail(w, 500, err)
			return
		}
		if _, err = tx.Exec(`DELETE FROM automatic_metadata_attempts WHERE work_id IN (SELECT work_id FROM editions WHERE format='Comic'); DELETE FROM app_meta WHERE key='metron_retry_at'`); err != nil {
			fail(w, 500, err)
			return
		}
		if err = tx.Commit(); err != nil {
			fail(w, 500, err)
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		reply(w, map[string]any{"provider": "Metron", "connected": token != ""})
	})
}
func (a *app) metronReady(now int64) bool {
	var retry int64
	_ = a.db.QueryRow("SELECT CAST(value AS INTEGER) FROM app_meta WHERE key='metron_retry_at'").Scan(&retry)
	return now >= retry
}
func (a *app) pauseMetron(now int64) {
	_, _ = a.db.Exec("INSERT INTO app_meta(key,value) VALUES('metron_retry_at',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", strconv.FormatInt(now+3600, 10))
}

var metronHTTPClient = &http.Client{Timeout: 8 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
