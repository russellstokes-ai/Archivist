# Server Sprint 2 — Automatic Rich Metadata Enrichment

Status: automated green on the canonical 0.9.4 server-parity baseline.

## Implemented

- Rebased the online metadata foundation onto the current 0.9.4 server implementation rather than the older development server.
- Added optional Open Library and Google Books catalogue matching.
- Added persisted owner settings for:
  - online metadata on/off;
  - automatic enrichment after successful scans;
  - Open Library;
  - Google Books;
  - automatic match confidence.
- Automatic enrichment runs as its own durable queue after a local scan has completed.
- Local scanning never waits for or depends on an internet provider.
- Interrupted enrichment jobs resume after restart.
- Provider failures do not mark a successful media scan as failed.
- Lookup state is recorded per asset scan signature so unchanged matches/no-matches are not repeatedly queried.
- Weak file titles such as Part/Chapter/Track numbers fall back to useful parent-folder names for matching.
- Exact ISBN matches score at the highest confidence.
- Online enrichment can fill:
  - title;
  - author(s);
  - genre;
  - publication year;
  - publisher;
  - ISBN;
  - language;
  - description.
- Existing richer embedded/sidecar/path metadata remains preferred; blanks are filled conservatively.
- Manual and legacy corrections remain protected.
- Multi-author provider results are normalized one author at a time so co-authors are not reordered.
- Organisation settings show automatic-enrichment controls and durable job status.

## Validation

GitHub Actions run: 37254197446

Passed:
- root Go tests;
- packaged Home Assistant Go tests;
- new ISBN/rich-metadata/durable-job tests;
- Raspberry Pi ARM64 compile;
- browser JavaScript syntax;
- UI wiring contract;
- Home Assistant package contract;
- add-on launcher syntax;
- root/package source parity;
- Home Assistant Docker smoke test over HTTP and HTTPS.

## Next

Server Sprint 3:
- online cover/artwork acquisition and safe local cache;
- preserve local/embedded cover priority;
- avoid waking media drives merely to display cached online artwork;
- cover provenance/status in metadata management;
- tests for image limits, provider failure and cache fallback.
