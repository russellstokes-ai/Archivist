# Archivist Server — Multisource metadata matching, item 2 source milestone A

**Date:** 17 October 2026  
**Branch:** integration/archivist-v1-auto-restore-recovery-20261016, draft [PR #83](https://github.com/russellstokes-ai/Archivist/pull/83)  
**Source checkpoint:** `93b9c40758ec2d9d2f953ac844aa187abdf651c3` (feature `cda736a`, Go syntax correction `93b9c40`)  
**Status:** Source-implemented and CI-tested; NOT production-released, merged, or hardware-accepted.

## Why this is safer than generic online lookup

The existing file editor keeps its original owner-initiated Open Library search. Archivist Assist 2.0's **book-level** workbench now offers a separate explicitly activated two-provider comparison, across Open Library work records and Google Books volume records. Nothing is searched automatically during scans, start-up, or library browsing.

The owner manually clicks Find candidates. Only then does the authenticated server send the search, plus its book-level title, author and any saved ISBN, to the two named public providers. User input cannot choose a provider endpoint or URL. Responses have six-second timeouts, fixed HTTPS hosts, redirects refused, bounded two-MiB JSON, at most ten combined candidates, partial-outage reporting and fail-closed all-provider errors. No account credentials, source paths, media, covers or bookmarks are sent by this operation. Query data does leave the household server, so the web workbench discloses the privacy implication before searching.

## Candidate identity evidence and boundaries

- Title/token matching and creator identity produce **reasons**, not an invented probability or a guarantee. Exact/similar/conflicting identities are ranked deterministically.
- ISBN-10 and ISBN-13 are checksum-validated, with equivalent 978 variants matched. A contradictory provider ISBN is withheld and visibly flagged. Invalid stored ISBN cannot be used as identity evidence.
- Open Library work search may aggregate multiple editions: no arbitrary publisher or first ISBN is imported from the result. The stored ISBN is only echoed when that exact edition identifier appears in the candidate's set.
- Google Books records editions: the displayed publication date is labelled **edition publication** and the workbench deliberately does **not** offer it for the work-wide **first publication year**. Google ISBN values are edition-specific; the workbench refuses ISBN selection for multi-edition works.
- Comic-format candidates are flagged as **unverified for issue/volume identity**. Neither provider supplies sufficient authority to silently identify specialist comic issues in this milestone. ASIN is not corroborated here.
- Choosing a source field marks it as an unverified owner-selected Open Library or Google Books suggestion. Signed work fingerprint, field locks, published/staged gate, preview, explicit confirmation, SQLite transaction, history and undo remain authoritative. Suggestion retrieval alone performs no catalogue mutation.

## Source changes and checks

**Mirrored Go source:** `manage_candidates.go`, `manage_multisource.go`, `manage_multisource_test.go`, `work_metadata.go` in both root and `archivist/app/`.  
**Mirrored web source:** `web/manage.js` and `web/manage.html` in both roots.  
**Browser contract:** `scripts/v1-manager-assist.test.cjs`.

New Go checks cover ISBN checksum/equivalence, same-title/different-author false positives, edition-year semantics, work-level ISBN non-invention, conflicting Google ISBN suppression, incomplete candidate evidence, one-provider outages, oversize JSON, forbidden redirects, signed preview necessity, rejected fake provenance, and confirmed Google provider origin persistence. Existing manager contract checks confirm opt-in query parameters, two-source candidate rendering, work-level year guard, preview and save staying open. These tests use controlled synthetic providers and catalogue fixtures, not external live API success claims.

**Exact code SHA `93b9c40`:**
- [Server check GREEN](https://github.com/russellstokes-ai/Archivist/actions/runs/39045022675/job/117431918769) — root and packaged Go, server DOM/JS contracts, source parity, Docker and HA disposable smoke.
- [Real Linux ARM64 smoke GREEN](https://github.com/russellstokes-ai/Archivist/actions/runs/39045022675/job/117431918998) — runner environment; not the owner's Raspberry Pi.
- First attempt at `cda736a` failed Go syntax on a result-merge else statement. The next source commit corrected the syntax in both mirrors; **do not count that earlier run as green**.
- Exact code SHA Android-native/mobile/iOS jobs may finish independently; their result is not necessary to assert real server hardware acceptance or Fold app acceptance.

## Remaining item 2 and commercial NO-GO

This is the **first bounded item-2 slice**, not full BookOrbit-equivalent intelligence. Outstanding: improved edition-vs-work identifier reconciliation, authoritative specialist comic-series/issue matching with licensed/credentialled provider decisions, ASIN validation or justified omission, score calibration against real ambiguous catalogue fixtures, opt-in provider cache/rate-limit policy, provider outage and privacy acceptance on a live Pi/HAOS ingress and desktop browser, high-volume performance. Never make rankings auto-save; future provider-derived fields still need signed preview and manual selection.

Later checklist work remains: item 3 edition/series management; complete ten-screen server parity; true Pi 4/4GB, HA ingress, NAS/SMB/NFS disconnection, restore/power-loss, credentials and family-client acceptance. No canonical scanner/mobile/reader/brand asset changed in this slice. No APK, signed release, database migration, installation, main merge or household media operation.
