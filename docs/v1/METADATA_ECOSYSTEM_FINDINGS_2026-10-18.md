# Metadata ecosystem findings — 18 October 2026

Research requested by the owner during PR 83 diagnostic work. This is an implementation comparison, not a claim that new providers are integrated.

## Findings

- [ComicTagger](https://github.com/comictagger/comictagger) uses Comic Vine, image-based issue matching, batch tagging and ComicRack/ComicBookLover formats. Its [user guide](https://github.com/comictagger/comictagger/wiki/UserGuide) describes filename parsing and cover comparison. The useful pattern for Archivist is combining independent evidence rather than requiring the author already be known.
- [Comicbox](https://github.com/ajslater/comicbox) supports CBZ/CBR/CBT/CB7, optional PDF support and several embedded metadata schemas, with [comicfn2dict](https://github.com/ajslater/comicfn2dict) for filename parsing. Archivist has narrower format/schema coverage. A bounded helper or native compatible readers should be evaluated against Pi memory/startup costs; no new Python runtime dependency was added in this patch.
- [Metron API](https://github.com/Metron-Project/metron/blob/master/api/README.md) provides series/issues, external Comic Vine/GCD identifiers and cover-hash matching. It requires authentication; account tokens are supported. Its rate-limit headers and attribution requirements need to be preserved. It is a relevant dedicated comic provider, not a zero-configuration endpoint we can silently enable.
- [Comic Vine API](https://comicvine.gamespot.com/api/) requires a user API key. Provider access/reuse terms and current service behaviour must be checked before integration; no shared credential should be embedded in the repository.
- [MusicBrainz](https://musicbrainz.org/doc/Release%20Group/Type) models audiobooks/audio drama/spoken word. Its [API](https://musicbrainz.org/doc/MusicBrainz_API) supports public metadata reads without an API key, requires an identifying User-Agent and at most one request/second; commercial use has separate plans. It is an audiobook-release candidate source, not a comic catalogue. Audio release date must never silently become original book-publication year.
- The [ComicInfo schema](https://anansi-project.github.io/docs/comicinfo/schemas/v1.0) defines Number as a string. Archivist decoded it as float64, so a textual value could discard the whole XML document. This concrete compatibility defect is fixed in this candidate for embedded and sidecar metadata, preserving author/genre/year while leaving unsupported numeric issue representation unset.

## Recommended next provider work

Prefer metadata already embedded in files, then better filename parsing, then dedicated series/run/issue lookup. Preserve volume/reprint/variant distinctions and model collected stories separately from issue numbers. Cache series lookups, rate-limit network calls and use cover comparison only for uncertain candidates. Keep scanning and reading available while enrichment runs. Review should group ambiguous runs or collections, not demand one confirmation per file.

Immediate patch includes the TAR/ComicInfo compatibility repairs, cautious series-genre lookup and useful diagnostic exports. It does not integrate MusicBrainz/Metron/Comic Vine, add CB7, implement cover fingerprints or establish complete identification of the owner's collection. Those gaps must not be disguised by larger inferred confidence scores or guessed years.
