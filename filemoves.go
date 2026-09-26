package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

func safePathPart(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return "Unknown"
	}
	var b strings.Builder
	lastSpace := false
	for _, r := range s {
		switch {
		case r == '/' || r == '\\' || r == ':' || r == '*' || r == '?' || r == '"' || r == '<' || r == '>' || r == '|':
			if !lastSpace {
				b.WriteByte(' ')
				lastSpace = true
			}
		case r < 32:
			continue
		case r == ' ' || r == '\t' || r == '\n':
			if !lastSpace {
				b.WriteByte(' ')
				lastSpace = true
			}
		default:
			b.WriteRune(r)
			lastSpace = false
		}
	}
	out := strings.Trim(strings.TrimSpace(b.String()), ".")
	if out == "" {
		return "Unknown"
	}
	if len(out) > 120 {
		out = strings.TrimSpace(out[:120])
	}
	return out
}

func sortTemplatePath(template, title, author, series, format, current string) (string, error) {
	ext := filepath.Ext(current)
	base := safePathPart(title) + ext
	authorPart := safePathPart(author)
	seriesPart := safePathPart(series)
	formatPart := safePathPart(format)
	switch template {
	case "author-title":
		return filepath.Join(authorPart, base), nil
	case "author-series-title":
		if strings.TrimSpace(series) == "" {
			return filepath.Join(authorPart, base), nil
		}
		return filepath.Join(authorPart, seriesPart, base), nil
	case "format-author-title":
		return filepath.Join(formatPart, authorPart, base), nil
	case "format-author-series-title":
		if strings.TrimSpace(series) == "" {
			return filepath.Join(formatPart, authorPart, base), nil
		}
		return filepath.Join(formatPart, authorPart, seriesPart, base), nil
	default:
		return "", errors.New("unknown sorting template")
	}
}

type fileMove struct {
	ID    string `json:"id"`
	Asset int64  `json:"asset"`
	Root  string `json:"root"`
	From  string `json:"from"`
	To    string `json:"to"`
	Hash  string `json:"hash"`
	State string `json:"state"`
}

type fileMoveBatchItem struct {
	Asset int64     `json:"asset,omitempty"`
	Move  *fileMove `json:"move,omitempty"`
	Error string    `json:"error,omitempty"`
}

type fileMoveBatchResult struct {
	OK     int                 `json:"ok"`
	Failed int                 `json:"failed"`
	Items  []fileMoveBatchItem `json:"items"`
}

func (a *app) initMoves() error {
	_, e := a.db.Exec(`CREATE TABLE IF NOT EXISTS file_moves(id TEXT PRIMARY KEY,asset INTEGER NOT NULL,root TEXT NOT NULL,old_path TEXT NOT NULL,new_path TEXT NOT NULL,hash TEXT NOT NULL,state TEXT NOT NULL)`)
	return e
}
func fileHash(root *os.Root, name string) (string, os.FileInfo, error) {
	info, e := root.Lstat(name)
	if e != nil {
		return "", nil, e
	}
	if !info.Mode().IsRegular() {
		return "", nil, errors.New("only regular files can be moved")
	}
	f, e := root.Open(name)
	if e != nil {
		return "", nil, e
	}
	defer f.Close()
	opened, e := f.Stat()
	if e != nil || !os.SameFile(info, opened) {
		return "", nil, errors.New("file changed while opening")
	}
	h := sha256.New()
	if _, e = io.Copy(h, f); e != nil {
		return "", nil, e
	}
	return hex.EncodeToString(h.Sum(nil)), opened, nil
}
func (a *app) previewMove(asset int64, target string) (fileMove, error) {
	a.scanMu.Lock()
	defer a.scanMu.Unlock()
	m := fileMove{Asset: asset, To: target, State: "preview"}
	if !filepath.IsLocal(target) || target != filepath.Clean(target) || strings.Contains(target, "\\") {
		return m, errors.New("use a relative destination within this source folder")
	}
	if e := a.db.QueryRow(`SELECT s.path,a.relative_path FROM assets a JOIN sources s ON s.id=a.source_id WHERE a.id=? AND a.available=1`, asset).Scan(&m.Root, &m.From); e != nil {
		return m, e
	}
	if m.From == m.To || !strings.EqualFold(filepath.Ext(m.From), filepath.Ext(m.To)) {
		return m, errors.New("choose a different path with the same extension")
	}
	root, e := os.OpenRoot(m.Root)
	if e != nil {
		return m, e
	}
	defer root.Close()
	if _, e = root.Lstat(m.To); !os.IsNotExist(e) {
		return m, errors.New("destination exists or cannot be inspected")
	}
	m.Hash, _, e = fileHash(root, m.From)
	if e != nil {
		return m, e
	}
	raw := make([]byte, 16)
	if _, e = rand.Read(raw); e != nil {
		return m, e
	}
	m.ID = hex.EncodeToString(raw)
	if _, e = a.db.Exec("UPDATE file_moves SET state='cancelled' WHERE asset=? AND state='preview'", m.Asset); e != nil {
		return m, e
	}
	_, e = a.db.Exec("INSERT INTO file_moves VALUES(?,?,?,?,?,?,?)", m.ID, m.Asset, m.Root, m.From, m.To, m.Hash, m.State)
	return m, e
}

func (a *app) previewMoveTemplate(asset int64, template string) (fileMove, error) {
	var title, author, series, format, current string
	var needsReview bool
	if e := a.db.QueryRow(`SELECT title,author,series,format,relative_path,needs_review FROM assets WHERE id=? AND available=1`, asset).Scan(&title, &author, &series, &format, &current, &needsReview); e != nil {
		return fileMove{Asset: asset}, e
	}
	if needsReview {
		return fileMove{Asset: asset}, errors.New("review metadata before organising this file")
	}
	target, e := sortTemplatePath(template, title, author, series, format, current)
	if e != nil {
		return fileMove{Asset: asset, To: target}, e
	}
	return a.previewMove(asset, target)
}

func (a *app) previewMoveTemplateBatch(assets []int64, template string) fileMoveBatchResult {
	if len(assets) == 0 {
		rows, e := a.db.Query(`SELECT id FROM assets WHERE available=1 ORDER BY id LIMIT 500`)
		if e != nil {
			return fileMoveBatchResult{Failed: 1, Items: []fileMoveBatchItem{{Error: e.Error()}}}
		}
		defer rows.Close()
		for rows.Next() {
			var id int64
			if e = rows.Scan(&id); e != nil {
				return fileMoveBatchResult{Failed: 1, Items: []fileMoveBatchItem{{Error: e.Error()}}}
			}
			assets = append(assets, id)
		}
	}
	type candidate struct {
		asset  int64
		target string
	}
	candidates := []candidate{}
	seen := map[string]int64{}
	out := fileMoveBatchResult{}
	for _, asset := range assets {
		var title, author, series, format, current string
		var needsReview bool
		if e := a.db.QueryRow(`SELECT title,author,series,format,relative_path,needs_review FROM assets WHERE id=? AND available=1`, asset).Scan(&title, &author, &series, &format, &current, &needsReview); e != nil {
			out.Items = append(out.Items, fileMoveBatchItem{Asset: asset, Error: e.Error()})
			out.Failed++
			continue
		}
		if needsReview {
			out.Items = append(out.Items, fileMoveBatchItem{Asset: asset, Error: "review metadata before organising this file"})
			out.Failed++
			continue
		}
		target, e := sortTemplatePath(template, title, author, series, format, current)
		if e != nil {
			out.Items = append(out.Items, fileMoveBatchItem{Asset: asset, Error: e.Error()})
			out.Failed++
			continue
		}
		key := strings.ToLower(target)
		if prior, ok := seen[key]; ok {
			out.Items = append(out.Items, fileMoveBatchItem{Asset: asset, Error: "template destination duplicates asset " + strconv.FormatInt(prior, 10)})
			out.Failed++
			continue
		}
		seen[key] = asset
		candidates = append(candidates, candidate{asset, target})
	}
	for _, c := range candidates {
		m, e := a.previewMove(c.asset, c.target)
		if e != nil {
			out.Items = append(out.Items, fileMoveBatchItem{Asset: c.asset, Error: e.Error()})
			out.Failed++
			continue
		}
		out.Items = append(out.Items, fileMoveBatchItem{Asset: c.asset, Move: &m})
		out.OK++
	}
	return out
}

func (a *app) applyMoveBatch(ids []string) fileMoveBatchResult {
	if len(ids) == 0 {
		rows, e := a.db.Query(`SELECT id FROM file_moves WHERE state IN ('preview','applying','linked') ORDER BY rowid ASC LIMIT 500`)
		if e != nil {
			return fileMoveBatchResult{Failed: 1, Items: []fileMoveBatchItem{{Error: e.Error()}}}
		}
		defer rows.Close()
		for rows.Next() {
			var id string
			if e = rows.Scan(&id); e != nil {
				return fileMoveBatchResult{Failed: 1, Items: []fileMoveBatchItem{{Error: e.Error()}}}
			}
			ids = append(ids, id)
		}
	}
	out := fileMoveBatchResult{}
	for _, id := range ids {
		m, e := a.applyMove(id)
		if e != nil {
			out.Items = append(out.Items, fileMoveBatchItem{Error: id + ": " + e.Error()})
			out.Failed++
			continue
		}
		out.Items = append(out.Items, fileMoveBatchItem{Asset: m.Asset, Move: &m})
		out.OK++
	}
	return out
}

func (a *app) moveByID(id string) (fileMove, error) {
	var m fileMove
	e := a.db.QueryRow("SELECT id,asset,root,old_path,new_path,hash,state FROM file_moves WHERE id=?", id).Scan(&m.ID, &m.Asset, &m.Root, &m.From, &m.To, &m.Hash, &m.State)
	return m, e
}

var moveLinkFile = func(root *os.Root, from, to string) error { return root.Link(from, to) }

func copyMoveFile(root *os.Root, from, to, wantHash string) error {
	dir := filepath.Dir(to)
	tmp := filepath.Join(dir, ".archivist-copy-"+filepath.Base(to)+".tmp")
	if _, e := root.Lstat(to); e == nil {
		return errors.New("destination exists")
	} else if !os.IsNotExist(e) {
		return e
	}
	_ = root.Remove(tmp)
	in, e := root.Open(from)
	if e != nil {
		return e
	}
	defer in.Close()
	out, e := root.OpenFile(tmp, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if e != nil {
		return e
	}
	_, copyErr := io.Copy(out, in)
	syncErr := out.Sync()
	closeErr := out.Close()
	if copyErr != nil {
		_ = root.Remove(tmp)
		return copyErr
	}
	if syncErr != nil {
		_ = root.Remove(tmp)
		return syncErr
	}
	if closeErr != nil {
		_ = root.Remove(tmp)
		return closeErr
	}
	hash, _, e := fileHash(root, tmp)
	if e != nil || hash != wantHash {
		_ = root.Remove(tmp)
		if e != nil {
			return e
		}
		return errors.New("copied data failed hash verification")
	}
	if _, e = root.Lstat(to); e == nil {
		_ = root.Remove(tmp)
		return errors.New("destination appeared during copy")
	} else if !os.IsNotExist(e) {
		_ = root.Remove(tmp)
		return e
	}
	if e = root.Rename(tmp, to); e != nil {
		_ = root.Remove(tmp)
		return e
	}
	return nil
}

func syncMoveDir(root *os.Root, name string) error {
	f, e := root.Open(filepath.Dir(name))
	if e != nil {
		return e
	}
	defer f.Close()
	return f.Sync()
}

// Journal first; link without overwrite, update catalogue, then unlink the old name.
// Retrying a journal entry after interruption completes the same operation.
func (a *app) applyMove(id string) (fileMove, error) {
	a.scanMu.Lock()
	defer a.scanMu.Unlock()
	m, e := a.moveByID(id)
	if e != nil {
		return m, e
	}
	if m.State == "done" {
		return m, nil
	}
	if m.State != "preview" && m.State != "applying" && m.State != "linked" {
		return m, errors.New("move is not applicable")
	}
	root, e := os.OpenRoot(m.Root)
	if e != nil {
		return m, e
	}
	defer root.Close()
	var current, source string
	if e = a.db.QueryRow(`SELECT a.relative_path,s.path FROM assets a JOIN sources s ON s.id=a.source_id WHERE a.id=?`, m.Asset).Scan(&current, &source); e != nil {
		return m, e
	}
	if source != m.Root || (current != m.From && current != m.To) {
		return m, errors.New("catalogue changed; create a new preview")
	}
	if m.State == "preview" || m.State == "applying" {
		hash, old, e := fileHash(root, m.From)
		if e != nil {
			return m, e
		}
		if hash != m.Hash {
			return m, errors.New("source changed since preview")
		}
		existing, e := root.Lstat(m.To)
		if e == nil && (m.State == "preview" || !os.SameFile(old, existing)) {
			return m, errors.New("destination collision; no files changed")
		}
		if e != nil && !os.IsNotExist(e) {
			return m, e
		}
		if _, e = a.db.Exec("UPDATE file_moves SET state='applying' WHERE id=?", id); e != nil {
			return m, e
		}
		m.State = "applying"
		linkedMove := true
		if existing == nil {
			if e = root.MkdirAll(filepath.Dir(m.To), 0750); e != nil {
				return m, e
			}
			if e = moveLinkFile(root, m.From, m.To); e != nil {
				linkedMove = false
				if e = copyMoveFile(root, m.From, m.To, m.Hash); e != nil {
					return m, errors.New("copy fallback failed; original retained: " + e.Error())
				}
			}
		}
		hash, newInfo, e := fileHash(root, m.To)
		if e != nil || hash != m.Hash {
			return m, errors.New("destination verification failed; original retained")
		}
		if linkedMove && !os.SameFile(old, newInfo) {
			return m, errors.New("destination verification failed; original retained")
		}
		if e = syncMoveDir(root, m.To); e != nil {
			return m, e
		}
		tx, e := a.db.Begin()
		if e != nil {
			return m, e
		}
		defer tx.Rollback()
		if _, e = tx.Exec("UPDATE assets SET relative_path=? WHERE id=?", m.To, m.Asset); e != nil {
			return m, e
		}
		if _, e = tx.Exec("UPDATE file_moves SET state='linked' WHERE id=?", id); e != nil {
			return m, e
		}
		if e = tx.Commit(); e != nil {
			return m, e
		}
		m.State = "linked"
	}
	hash, dest, e := fileHash(root, m.To)
	if e != nil || hash != m.Hash {
		return m, errors.New("destination changed; recovery needs review")
	}
	old, e := root.Lstat(m.From)
	if e == nil {
		if !old.Mode().IsRegular() {
			return m, errors.New("original path changed; refusing removal")
		}
		if !os.SameFile(old, dest) {
			originalHash, _, hashErr := fileHash(root, m.From)
			if hashErr != nil || originalHash != m.Hash {
				return m, errors.New("original path changed; refusing removal")
			}
		}
		if e = root.Remove(m.From); e != nil {
			return m, e
		}
	} else if !os.IsNotExist(e) {
		return m, e
	}
	if e = syncMoveDir(root, m.From); e != nil {
		return m, e
	}
	if _, e = a.db.Exec("UPDATE file_moves SET state='done' WHERE id=?", id); e != nil {
		return m, e
	}
	m.State = "done"
	return m, nil
}
func (a *app) movesPending() bool {
	var n int
	e := a.db.QueryRow("SELECT count(*) FROM file_moves WHERE state IN ('applying','linked')").Scan(&n)
	return e == nil && n > 0
}
func (a *app) moveRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/file-moves/{id}/cancel", func(w http.ResponseWriter, r *http.Request) {
		a.scanMu.Lock()
		defer a.scanMu.Unlock()
		m, e := a.moveByID(r.PathValue("id"))
		if e != nil {
			fail(w, 404, e)
			return
		}
		if m.State != "preview" && m.State != "applying" {
			fail(w, 409, errors.New("this move must finish recovery before undo"))
			return
		}
		root, e := os.OpenRoot(m.Root)
		if e != nil {
			fail(w, 409, e)
			return
		}
		defer root.Close()
		if _, e = root.Lstat(m.To); e == nil && m.State == "applying" {
			fail(w, 409, errors.New("destination created; resume the move then undo it"))
			return
		}
		if e != nil && !os.IsNotExist(e) {
			fail(w, 409, e)
			return
		}
		if _, e = a.db.Exec("UPDATE file_moves SET state='cancelled' WHERE id=?", m.ID); e != nil {
			fail(w, 500, e)
			return
		}
		reply(w, map[string]bool{"ok": true})
	})
	mux.HandleFunc("POST /api/file-moves/preview", func(w http.ResponseWriter, r *http.Request) {
		var in struct {
			Asset int64  `json:"asset"`
			To    string `json:"to"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&in) != nil {
			fail(w, 400, errors.New("invalid preview"))
			return
		}
		m, e := a.previewMove(in.Asset, in.To)
		if e != nil {
			fail(w, 400, e)
			return
		}
		reply(w, m)
	})

	mux.HandleFunc("POST /api/file-moves/preview-template", func(w http.ResponseWriter, r *http.Request) {
		var in struct {
			Asset    int64  `json:"asset"`
			Template string `json:"template"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&in) != nil {
			fail(w, 400, errors.New("invalid template preview"))
			return
		}
		m, e := a.previewMoveTemplate(in.Asset, in.Template)
		if e != nil {
			fail(w, 400, e)
			return
		}
		reply(w, m)
	})
	mux.HandleFunc("POST /api/file-moves/preview-template-batch", func(w http.ResponseWriter, r *http.Request) {
		var in struct {
			Assets   []int64 `json:"assets"`
			Template string  `json:"template"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 65536)).Decode(&in) != nil {
			fail(w, 400, errors.New("invalid batch template preview"))
			return
		}
		out := a.previewMoveTemplateBatch(in.Assets, in.Template)
		reply(w, out)
	})
	mux.HandleFunc("POST /api/file-moves/apply-batch", func(w http.ResponseWriter, r *http.Request) {
		var in struct {
			IDs []string `json:"ids"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 65536)).Decode(&in) != nil {
			fail(w, 400, errors.New("invalid batch apply"))
			return
		}
		out := a.applyMoveBatch(in.IDs)
		reply(w, out)
	})
	mux.HandleFunc("POST /api/file-moves/{id}/apply", func(w http.ResponseWriter, r *http.Request) {
		m, e := a.applyMove(r.PathValue("id"))
		if e != nil {
			fail(w, 409, e)
			return
		}
		reply(w, m)
	})
	mux.HandleFunc("POST /api/file-moves/{id}/undo-preview", func(w http.ResponseWriter, r *http.Request) {
		m, e := a.moveByID(r.PathValue("id"))
		if e != nil || m.State != "done" {
			fail(w, 409, errors.New("only completed moves can be undone"))
			return
		}
		var current string
		if a.db.QueryRow("SELECT relative_path FROM assets WHERE id=?", m.Asset).Scan(&current) != nil || current != m.To {
			fail(w, 409, errors.New("asset moved again; review current path"))
			return
		}
		undo, e := a.previewMove(m.Asset, m.From)
		if e != nil {
			fail(w, 409, e)
			return
		}
		reply(w, undo)
	})
	mux.HandleFunc("GET /api/file-moves", func(w http.ResponseWriter, r *http.Request) {
		rows, e := a.db.Query("SELECT id,asset,root,old_path,new_path,hash,state FROM file_moves ORDER BY rowid DESC LIMIT 100")
		if e != nil {
			fail(w, 500, e)
			return
		}
		defer rows.Close()
		out := []fileMove{}
		for rows.Next() {
			var m fileMove
			if e = rows.Scan(&m.ID, &m.Asset, &m.Root, &m.From, &m.To, &m.Hash, &m.State); e != nil {
				fail(w, 500, e)
				return
			}
			out = append(out, m)
		}
		reply(w, out)
	})
}
