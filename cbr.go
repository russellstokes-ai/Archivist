package main

import (
	"errors"
	"io"
	"os"
	"path"
	"sort"
	"strings"

	"github.com/nwaples/rardecode/v2"
)

// A CBR is a RAR archive. Decode in memory, never extract member paths to disk.
// Bound the decoder dictionary and each returned page for Raspberry Pi hosts.
const maxRARComicEntries = 10000
const maxRARComicDictionary = 32 << 20
const maxRARComicPage = 24 << 20

func newRARComicReader(f *os.File) (*rardecode.Reader, error) {
	if _, err := f.Seek(0, io.SeekStart); err != nil {
		return nil, err
	}
	return rardecode.NewReader(f, rardecode.MaxDictionarySize(maxRARComicDictionary))
}

func rarComicImage(name string) bool {
	switch strings.ToLower(path.Ext(name)) {
	case ".jpg", ".jpeg", ".png", ".webp":
		return true
	}
	return false
}

func rarComicParts(f *os.File) ([]string, error) {
	r, err := newRARComicReader(f)
	if err != nil {
		return nil, err
	}
	parts := make([]string, 0, 32)
	for count := 0; ; count++ {
		if count >= maxRARComicEntries {
			return nil, errors.New("comic contains too many entries")
		}
		h, nextErr := r.Next()
		if nextErr == io.EOF {
			break
		}
		if nextErr != nil {
			return nil, nextErr
		}
		if h.IsDir || h.LinkType != 0 || !rarComicImage(h.Name) {
			continue
		}
		if h.Encrypted || (!h.UnKnownSize && (h.UnPackedSize < 1 || h.UnPackedSize > maxRARComicPage)) {
			return nil, errors.New("comic contains an encrypted or oversized image")
		}
		parts = append(parts, h.Name)
	}
	if len(parts) == 0 {
		return nil, errors.New("no supported image pages in comic")
	}
	sort.SliceStable(parts, func(i, j int) bool { return naturalLess(parts[i], parts[j]) })
	return parts, nil
}

// rarComicEntry scans a single-volume archive sequentially: required for solid
// archives where decoding later pages depends on preceding entries.
func rarComicEntry(f *os.File, name string, limit uint64) ([]byte, error) {
	if limit == 0 || limit > maxRARComicPage {
		return nil, errors.New("invalid archive read limit")
	}
	r, err := newRARComicReader(f)
	if err != nil {
		return nil, err
	}
	for count := 0; ; count++ {
		if count >= maxRARComicEntries {
			return nil, errors.New("comic contains too many entries")
		}
		h, nextErr := r.Next()
		if nextErr == io.EOF {
			break
		}
		if nextErr != nil {
			return nil, nextErr
		}
		if h.Name != name {
			continue
		}
		if h.IsDir || h.LinkType != 0 || h.Encrypted {
			return nil, errors.New("comic page unavailable or encrypted")
		}
		if !h.UnKnownSize && (h.UnPackedSize < 1 || uint64(h.UnPackedSize) > limit) {
			return nil, errors.New("comic page exceeds size limit")
		}
		data, readErr := io.ReadAll(io.LimitReader(r, int64(limit)+1))
		if uint64(len(data)) > limit {
			return nil, errors.New("comic page exceeds size limit")
		}
		if readErr != nil {
			return nil, readErr
		}
		if len(data) == 0 || (!h.UnKnownSize && int64(len(data)) != h.UnPackedSize) {
			return nil, errors.New("comic page truncated")
		}
		return data, nil
	}
	return nil, errors.New("comic page missing")
}

func rarComicInfo(f *os.File) ([]byte, error) {
	r, err := newRARComicReader(f)
	if err != nil {
		return nil, err
	}
	for count := 0; ; count++ {
		if count >= maxRARComicEntries {
			return nil, errors.New("comic contains too many entries")
		}
		h, nextErr := r.Next()
		if nextErr == io.EOF {
			break
		}
		if nextErr != nil {
			return nil, nextErr
		}
		if h.IsDir || h.LinkType != 0 || !strings.EqualFold(path.Base(h.Name), "ComicInfo.xml") {
			continue
		}
		const xmlLimit = 2 << 20
		if h.Encrypted || (!h.UnKnownSize && (h.UnPackedSize < 0 || h.UnPackedSize > xmlLimit)) {
			return nil, errors.New("comic metadata oversized or encrypted")
		}
		raw, readErr := io.ReadAll(io.LimitReader(r, xmlLimit+1))
		if readErr != nil || len(raw) > xmlLimit {
			return nil, errors.New("comic metadata exceeds limit")
		}
		return raw, nil
	}
	return nil, errors.New("ComicInfo.xml missing")
}
