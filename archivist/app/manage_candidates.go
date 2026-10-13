package main

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type publicMetadataCandidate struct {
	WorkID        string `json:"workId"`
	Title         string `json:"title"`
	Author        string `json:"author"`
	PublishedYear int    `json:"publishedYear,omitempty"`
	ISBN          string `json:"isbn,omitempty"`
	Publisher     string `json:"publisher,omitempty"`
	Source        string `json:"source"`
}

type openLibrarySearchResponse struct {
	Docs []struct {
		Key       string   `json:"key"`
		Title     string   `json:"title"`
		Authors   []string `json:"author_name"`
		Year      int      `json:"first_publish_year"`
		ISBN      []string `json:"isbn"`
		Publishers []string `json:"publisher"`
	} `json:"docs"`
}

func parseOpenLibraryCandidates(r io.Reader) ([]publicMetadataCandidate, error) {
	var result openLibrarySearchResponse
	if err := json.NewDecoder(io.LimitReader(r, 2<<20)).Decode(&result); err != nil {
		return nil, err
	}
	out := make([]publicMetadataCandidate, 0, len(result.Docs))
	for _, doc := range result.Docs {
		title := strings.TrimSpace(doc.Title)
		if title == "" { continue }
		item := publicMetadataCandidate{WorkID:doc.Key,Title:title,PublishedYear:doc.Year,Source:"Open Library"}
		if len(doc.Authors)>0 { item.Author = strings.TrimSpace(doc.Authors[0]) }
		if len(doc.ISBN)>0 { item.ISBN = strings.TrimSpace(doc.ISBN[0]) }
		if len(doc.Publishers)>0 { item.Publisher = strings.TrimSpace(doc.Publishers[0]) }
		if item.PublishedYear<1000 || item.PublishedYear>3000 { item.PublishedYear=0 }
		out=append(out,item)
		if len(out)>=10 { break }
	}
	return out,nil
}

func (a *app) manageCandidateRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/manage/metadata-candidates",func(w http.ResponseWriter,r *http.Request) {
		if !who(r).Owner { fail(w,403,errors.New("administrator only"));return }
		query:=strings.TrimSpace(r.URL.Query().Get("q"))
		if len(query)<2 || len(query)>180 { fail(w,400,errors.New("enter a search of 2–180 characters"));return }
		ctx,cancel:=context.WithTimeout(r.Context(),6*time.Second)
		defer cancel()
		target:="https://openlibrary.org/search.json?q="+url.QueryEscape(query)+"&fields=key,title,author_name,first_publish_year,isbn,publisher&limit=10"
		req,err:=http.NewRequestWithContext(ctx,http.MethodGet,target,nil)
		if err!=nil { fail(w,500,err);return }
		req.Header.Set("Accept","application/json")
		req.Header.Set("User-Agent","Archivist/1.0 metadata workbench (user-initiated)")
		client:=&http.Client{Timeout:6*time.Second}
		res,err:=client.Do(req)
		if err!=nil { fail(w,502,errors.New("metadata provider unavailable; no changes saved"));return }
		defer res.Body.Close()
		if res.StatusCode!=http.StatusOK { fail(w,502,errors.New("metadata provider declined the search; no changes saved"));return }
		result,err:=parseOpenLibraryCandidates(res.Body)
		if err!=nil { fail(w,502,errors.New("invalid metadata provider response; no changes saved"));return }
		reply(w,map[string]any{"provider":"Open Library","candidates":result})
	})
}
