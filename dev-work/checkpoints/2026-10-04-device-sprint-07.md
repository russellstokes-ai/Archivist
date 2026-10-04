# Device polish Sprint 7 — cover and metadata enrichment

Date: 4 October 2026  
Branch: `bugfix/0.9.4-device-pass-20261004`

## Goal

Substantially reduce blank covers without introducing wrong artwork or recreating the Shelf/Library population race.

The catalogue identity boundary is strict: title, author, series, series position, grouping and review state are resolved before publication. Only expensive missing-cover recovery is deferred.

## Implemented

### Stable enrichment queue
- Primary local scans now use `deferEmbeddedCovers` for expensive artwork extraction.
- Complete metadata/work identity is still resolved before the catalogue snapshot is persisted and published.
- Once that snapshot is live, missing-cover recovery runs in bounded batches.
- A UI frame is yielded between batches so cover extraction does not monopolise the interface.
- A newer scan invalidates the older enrichment generation immediately.
- Enrichment patches only `coverUri` / cover candidates. It cannot change title, author, series, genre, work key, order or review status.
- Existing artwork and manual covers are never overwritten.
- Final persistence re-reads the latest saved catalogue and fills only blank covers, so metadata edits made while enrichment is running cannot be rolled back.

### Cover recovery
The Sprint 6 extraction engines are now used through the stable enrichment path:
- EPUB manifest / `cover-image` artwork.
- CBZ / ZIP cover or natural first page.
- CBR first image through the existing platform reader (Android native Junrar, iOS extraction path).
- CBT first image through the existing bounded TAR reader.
- MP3 ID3 APIC artwork.
- M4A / M4B `covr` artwork.
- Android PDF first page via the existing native PDF renderer.
- Persistent app-private extracted/generated cover cache for unchanged source files.

### Sensible local folder artwork
Trusted names now include:
- exact same-stem artwork such as `Dune.jpg`;
- `cover`;
- `front`, `frontcover`, `front-cover`;
- `bookcover`, `book-cover`;
- `folder`;
- `coverart`;
- `artwork`.

Generic book-level artwork is allowed only when the folder clearly contains one media work, or multiple files that are all audio tracks. A generic image in a folder containing multiple unrelated books is rejected.

### Server parity
- Server external artwork now checks exact same-stem artwork before generic names.
- Generic server folder artwork uses the same confidence rule: one work, or an all-audio multi-track folder.
- Ambiguous `cover.jpg` beside multiple independent books is rejected.
- Root and packaged Home Assistant server files remain synchronized.

## Regression coverage

Added/extended tests verify:
- deferred scans publish metadata before embedded-cover recovery;
- background recovery fills a blank cover;
- existing/manual covers cannot be replaced;
- metadata cannot be rolled back by a late cover batch;
- catalogue order is preserved;
- ambiguous generic folder artwork is not assigned across unrelated books;
- exact same-stem artwork is trusted;
- trusted single-work names such as `book-cover.jpg` resolve;
- server exact artwork wins over generic artwork;
- server ambiguous generic artwork is rejected;
- CBR/CBT reader paths remain bounded by their existing archive safety limits.

## UI boundary

No locked Shelf, Library, Player, Atlas or Comic Focus layout was redesigned. Sprint 7 changes data arrival behaviour only: the catalogue remains stable while missing artwork fills in.

## Automated evidence

- Mobile checks run `37222248717` on executable head `9b0de1d06c9464b3e3f1ab9adcf5821b3d2a4eb1`: **PASS** — dependency install, Expo Doctor, TypeScript, all maintained mobile suites, version consistency and Expo web export.
- Server checks run `37222181534` on server head `475888c7b19060a39856b81ee26e9a789591bc7f`: **PASS** — root/package tests, Raspberry Pi ARM64 compile, web/UI/package contracts, source parity and Home Assistant Docker smoke test.
- iOS checks run `37222248588` for the same mobile executable head: native compile still running at this checkpoint. No iOS completion claim is made until it finishes.

## Acceptance boundary

Physical acceptance still requires rescanning a representative real library and confirming:
- materially fewer fallback covers;
- no visibly incorrect shared artwork;
- no Shelf/Library reordering or repopulation while covers arrive;
- no manual cover replaced after a late enrichment result.
