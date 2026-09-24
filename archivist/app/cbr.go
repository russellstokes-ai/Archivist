package main

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"os"
	"path"
	"sort"
	"strconv"
	"strings"

	"github.com/nwaples/rardecode/v2"
)

type cancellationReader struct {
	ctx context.Context
	r   io.Reader
}

func (c cancellationReader) Read(b []byte) (int, error) {
	if e := c.ctx.Err(); e != nil {
		return 0, e
	}
	return c.r.Read(b)
}

func readRAR(ctx context.Context, f *os.File, wanted string) ([]string, []byte, error) {
	if _, e := f.Seek(0, 0); e != nil {
		return nil, nil, e
	}
	r, e := rardecode.NewReader(cancellationReader{ctx, f}, rardecode.MaxDictionarySize(64<<20))
	if e != nil {
		return nil, nil, e
	}
	names := []string{}
	var total int64
	for count := 0; count < 10000; count++ {
		header, e := r.Next()
		if e == io.EOF {
			sort.Slice(names, func(i, j int) bool { return naturalLess(names[i], names[j]) })
			return names, nil, nil
		}
		if e != nil {
			return nil, nil, e
		}
		if header.IsDir {
			continue
		}
		image := false
		switch strings.ToLower(path.Ext(header.Name)) {
		case ".jpg", ".jpeg", ".png", ".webp":
			image = true
		}
		if image {
			names = append(names, header.Name)
		}
		limit := int64(24 << 20)
		if total+limit > 512<<20 {
			limit = (512 << 20) - total
		}
		if limit <= 0 {
			return nil, nil, errors.New("CBR exceeds decoded size limit")
		}
		var data bytes.Buffer
		var target io.Writer = io.Discard
		if header.Name == wanted {
			target = &data
		}
		n, e := io.Copy(target, io.LimitReader(cancellationReader{ctx, r}, limit+1))
		total += n
		if e != nil {
			return nil, nil, e
		}
		if n > limit {
			return nil, nil, errors.New("CBR section exceeds decoded size limit")
		}
		if header.Name == wanted {
			return names, data.Bytes(), nil
		}
	}
	return nil, nil, errors.New("CBR contains too many entries")
}
func serveRAR(w http.ResponseWriter, r *http.Request, f *os.File) {
	names, _, e := readRAR(r.Context(), f, "")
	if e != nil {
		fail(w, 400, errors.New("CBR unsupported, encrypted, corrupt or over resource limits: "+e.Error()))
		return
	}
	if len(names) == 0 {
		fail(w, 400, errors.New("no comic pages"))
		return
	}
	if r.PathValue("part") == "" {
		reply(w, map[string]any{"format": "Comic", "parts": names})
		return
	}
	index, e := strconv.Atoi(r.PathValue("part"))
	if e != nil || index < 0 || index >= len(names) {
		fail(w, 404, errors.New("page not found"))
		return
	}
	_, data, e := readRAR(r.Context(), f, names[index])
	if e != nil {
		fail(w, 400, e)
		return
	}
	mime := http.DetectContentType(data)
	if mime != "image/jpeg" && mime != "image/png" && mime != "image/webp" {
		fail(w, 400, errors.New("invalid comic image"))
		return
	}
	w.Header().Set("Content-Type", mime)
	w.Write(data)
}
