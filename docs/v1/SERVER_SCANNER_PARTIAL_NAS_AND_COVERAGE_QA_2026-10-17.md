# Archivist Server — partial-NAS audiobook safety and scanner identification coverage QA

**Date:** 17 October 2026  
**Scope:** server-only additions to draft PR #83, branch `integration/archivist-v1-auto-restore-recovery-20261016`  
**Starting source:** `70dc1a6f30714ec704c7d771c6b794e16ceec4ef`  
**Commits:** `af2ec765df2b20450836eb41f944e9a4f44e595a` (partial NAS audio recovery); `2db4cd4b70c3e6c98cfa88a831597cfabe946506` (read-only health and filtered workbench); `bfcfea4ee0207ffbed045563b9170fd40fcfe8aa` (compile correction).  
**Decision:** **NO-GO** commercial release. Synthetic source/runtime CI and ARM64 smoke are positive. No physical Pi4, Home Assistant ingress, SMB/NFS or NAS product acceptance, and no package/version release or merge.

## 1. Partial source disconnection: retain exact audiobook chapter membership

**Reproduced risk:** Earlier `syncAutoCatalogueTx` rebuilt the existing automatic audiobook's edition links exclusively from `available=1` assets. If a NAS share temporarily hid Chapter 02 while Chapters 01/03 remained, the work/edition IDs survived but Chapter 02 lost its edition mapping. Saved `profile_progress.asset_id` could then refer to a track no longer in its edition, making resumption and cross-device state unreliable.

**Scope of fix:** Server `catalogue.go` only. For an existing automatic work, the scanner now loads the edition's unavailable chapter links, preserves their exact asset IDs, and rebuilds the chapter order over available + offline entries in natural filename order. Only the links for currently available assets are refreshed. The old media files, source identities, manual metadata corrections, owner publication state and per-profile progress are unchanged by a temporary outage. All updates remain within the already-established single atomic scan/group/publication transaction.

A pre-existing work with multiple editions is now rejected for owner review rather than having its additional editions silently deleted. This is a data-preservation guard, not a full multi-edition management feature. A fully unavailable work remains in the catalogue and can reappear on reconnection.

**Regression cases** in `server_partial_audio_mount_test.go`:
- Three-chapter book: disconnect Chapter 02; verify three edition links remain, Chapter 02 reports unavailable, its original index stays in natural order, work/edition IDs and two households' saved progress remain intact, and reviewed publication status does not silently change.
- Reconnect exact Chapter 02: no duplicate records or new work IDs; manual author metadata and exact bookmarked track/time persist.
- Add Chapter 04 while Chapter 02 is temporarily missing: all four chapter positions remain coherent and original bookmark survives.
- Introduce a second unexpected edition to an automatic work: fail the scan and preserve all existing edition links; restore normal scanning after owner repairs the invalid structure.

**Important boundary:** A new file with a similar name during a partial outage is never cryptographically identified as the old file. Any manual relink remains an owner-verified separate operation. Full multi-edition, cross-source and re-ordered chapter reconciliation remains outstanding.

## 2. Read-only scanner identification/Atlas coverage

**Added data:** Owner-only `GET /api/library-health` still inspects only configured source roots and indexed SQLite rows, but now includes source-level indexed-work counts, unavailable-file flags and file-level counts missing author, genre or valid publication year, low metadata confidence (<60), plus existing review counts. Global logical-work and published-work totals are DISTINCT independent counts, not an inaccurate sum across multiple sources.

**Owner-only filter:** `GET /api/books?metadataGap=author|genre|year|confidence|review|unavailable` uses a fixed allowlist, parameterized SQL, and denies household users when specified. Existing clients not using `metadataGap` retain their published-only API contract.

**Desktop UI:** Existing 16:9 Library Manager / Health & scans has six live, read-only coverage tiles with file counts. Each tile opens the corresponding server-filtered catalogue for review. The metadata dropdown and saved views retain the selected gap. Cards reflect the database exactly: no new scan, Open Library query, metadata guess or source mutation. "Missing genre" and "missing year" help identify potential Atlas completeness gaps but do **not** prove a book-level Atlas defect.

**Regression cases** in `server_scanner_coverage_test.go` and `scripts/v1-manager-assist.test.cjs`:
- Two missing-metadata EPUB fixtures give exact file/work counts and six gap categories.
- Owner review PATCH of one file updates live per-source/global counts and every relevant filtered `/api/books` result without a rescan.
- Removing a file and rescanning reports persisted file-unavailable flags without deleting its book identity.
- Reject unknown filter names; block anonymous and household members from private scanner diagnostics.
- Browser fake-DOM executes the real Health → Missing Genre → filtered Library path; preserves grouped relink, Assist publication, cancellation/retry regression coverage.
- Source and packaged copies are mirrored byte-for-byte; protection gate remains intact.

## Verified CI on exact source checkpoint

- [Server Go, manager contracts, Docker/HA source checks](https://github.com/russellstokes-ai/Archivist/actions/runs/39037438153/job/117410001891): **success** at `bfcfea4`.
- [ARM64 smoke](https://github.com/russellstokes-ai/Archivist/actions/runs/39037438153/job/117410001608): **success** at `bfcfea4`.
- [Prior offline-chapter regression server/ARM64 check](https://github.com/russellstokes-ai/Archivist/actions/runs/39036750108): **success** at `af2ec76`.

The initial scanner coverage source commit failed Go compilation because of a missing trailing comma in a multiline Go map literal. `bfcfea4` corrected the source; no test or safety gate was weakened. Exact source checks have succeeded.

## Remaining release gates and caveats

1. Raspberry Pi 4 on HAOS + 4 GB RAM and SSD, real SMB/NFS partial-mount failure, stale caches, permissions, reconnect, concurrent stream/scan and large library benchmarks.
2. Improved automatic metadata identification confidence from additional sources remains separate. This change exposes missing evidence and a review path; it is not automatic enrichment or a claim of greater identification accuracy.
3. Work-level metadata field coverage may not equal file-level totals (one work can contain multiple chapters). The UI explicitly labels physical-file counts. Source-root `online` is a shallow check and does not prove individual files accessible.
4. Complex user/manual groupings, real multi-edition repair, cross-volume identities, updated playback on actual phones and metadata review with real ebooks/comics require further acceptance.
5. Full premium 16:9 ten-screen management, security/credentials, reliable backups/upgrades/rollback and production Docker/HA/NAS package delivery remain incomplete.
6. PR #83 stays draft/unmerged; no APK testing or mobile UI/scanner changes in this server workstream.
