package main

import (
	"errors"
	"net"
	"net/http"
	"regexp"
	"strings"
)

var ingressPathPattern = regexp.MustCompile(`^/api/hassio_ingress/[A-Za-z0-9_-]+/?$`)

// Trust ingress routing metadata only from Supervisor, never a forwarded IP header.
func ingressBase(r *http.Request) (string, error) {
	prefix := r.Header.Get("X-Ingress-Path")
	if prefix == "" {
		return "/", nil
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil || host != "172.30.32.2" || !ingressPathPattern.MatchString(prefix) {
		return "", errors.New("invalid ingress request")
	}
	return strings.TrimSuffix(prefix, "/") + "/", nil
}

func serveEntry(w http.ResponseWriter, r *http.Request, base string) bool {
	name := r.URL.Path
	if name == "/" || name == "/index.html" {
		name = "/index.html"
	} else if name != "/reader.html" {
		return false
	}
	if r.Method != "GET" && r.Method != "HEAD" {
		return false
	}
	body, err := web.ReadFile("web" + name)
	if err != nil {
		http.Error(w, "page unavailable", http.StatusInternalServerError)
		return true
	}
	// The base is either '/' or a strictly validated local Supervisor path.
	body = []byte(strings.Replace(string(body), "<head>", `<head><base href="`+base+`">`, 1))
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if r.Method != "HEAD" {
		w.Write(body)
	}
	return true
}
