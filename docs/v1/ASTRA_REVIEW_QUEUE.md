# Astra Review Queue — Archivist 1.0

**Recorded:** 16 October 2026. **Audit source:** draft PR #51 head `70921ca808940f65e6e409fedb74251c194297dd`; original accepted reference `df4c39b44394d8c512ca0298bffa7f19da356490`, protected source baseline `72bbf177aecc92f31724b48c6cf11a7eddd7a216`.

**Purpose:** independently reproduce and verify **difficult / higher-risk** findings from review of draft PRs #40–#51, not to assert they are fixed or provide blanket authority to change protected code. PR #52 handles a small isolated server artwork fix. All product PRs remain draft and unmerged. Owner's installed APK source remains unverified. Red/green CI is not Fold acceptance.

**Classification:** *source defect confirmed* means the code behaves as described, not that it reproduced on hardware. *Suspected risk* requires a failing test or device evidence. No issue is closed solely by source analysis.

**Absolute exclusions:** both scanners, Archivist Assist/editor/search, protected mobile `App.tsx` layout, Living Book geometry, Comic Focus/zoom, Atlas, Stats, Rewards, fonts, Lotties, approved icon. All 46 blob locks and additional archive/gesture hashes remain unchanged. Any protected fix requires separately scoped user approval before implementation. Never modify scanner in connection with these tasks.

## High-risk items for Astra to independently verify

### ASTRA-01 — Offline recovery can remove an existing local file (P0)

**Evidence level:** Confirmed unsafe deletion branch; actual damaging case needs reproduction. **Source:** [`mobile/offlineLibrary.ts` L214-L259](https://github.com/russellstokes-ai/Archivist/blob/70921ca808940f65e6e409fedb74251c194297dd/mobile/offlineLibrary.ts#L214-L259).

**Finding:** A checkpoint matching only version, work and server bypasses conservative preflight. A mismatched local track is deleted if no valid native resume token, before any replacement has been safely downloaded. If server content changed, this can discard a recoverable older copy.

**Exact Astra check / acceptance:** Reproduce with previously completed tracks, stale checkpoint, altered server byte size, network failure and disk full. Use temp download and verify-before-atomic-replace or preserve original separately. Fail closed without destroying user media.

**Protection:** Unprotected offline helper may be patched independently, but no App.tsx or scanner/Assist change.

### ASTRA-02 — Comic unsupported classification bypasses archive renderer (P0)

**Evidence level:** Code path confirmed; original 2000AD root cause not proven. **Source:** [`mobile/localReader.ts` L19-L34](https://github.com/russellstokes-ai/Archivist/blob/70921ca808940f65e6e409fedb74251c194297dd/mobile/localReader.ts#L19-L34).

**Finding:** Unrecognised format returns raw URI, which host App.tsx opens in generic WebView. Wrongly tagged CBZ/CBR/CBT can bypass archive/page bridge and emit ERR_ACCESS_DENIED.

**Exact Astra check / acceptance:** Trace actual selected record format and URI extension, SAF persistence, WebView error URL, native page decoding for 2000AD Annual 1978 and representative CBZ/CBR/CBT/comic PDFs. No relaxation of file access; get specific approval before a narrow routing fix.

**Protection:** App.tsx/localReader.ts and comic source bridge locked; diagnose only.

### ASTRA-03 — Atlas published-work filtering may hide Library books (P0)

**Evidence level:** Extra source filter confirmed, causal diagnosis unproven. **Source:** [`mobile/App.tsx` L1529-L1544](https://github.com/russellstokes-ai/Archivist/blob/70921ca808940f65e6e409fedb74251c194297dd/mobile/App.tsx#L1529-L1544).

**Finding:** Atlas applies track.scannerPublished to local works in addition to Library/Shelf catalogue filtering; older accepted works may not carry this property. Source filter and space can also hide all nodes.

**Exact Astra check / acceptance:** Compare actual published work IDs/counts through Library, sourceWorks, Atlas eligible/selected and graph. Test missing genre/year, legacy persisted snapshots, selected space, both source types. Fix data identity without editing scanner.

**Protection:** Atlas and App.tsx protected. Narrow approval required.

### ASTRA-04 — Progress pagination is not transactionally consistent (P1)

**Evidence level:** Design limitation confirmed; omission scenario not yet reproduced. **Source:** [`sync_progress.go` L36-L92](https://github.com/russellstokes-ai/Archivist/blob/70921ca808940f65e6e409fedb74251c194297dd/sync_progress.go#L36-L92).

**Finding:** Each page uses ORDER BY kind,id LIMIT/OFFSET against a fresh SQLite statement. Concurrent insertion/deletion/revoked grants may shift offsets and omit rows without a duplicate warning, making missing remote progress indistinguishable from never-saved.

**Exact Astra check / acceptance:** Create concurrent two-device test with insert/delete between pages. Evaluate keyset pagination plus revisioned snapshot, transactional snapshot or resumable cursor, conflict safety and 409 replay. Never wipe local outbox.

**Protection:** Server code safe to change independently; playback hookup requires protected approval.

### ASTRA-05 — Offline download integrity is not enforced at every open (P1)

**Evidence level:** Known integration gap; failure on actual device unverified. **Source:** [`mobile/offlineLibrary.ts` L389-L469](https://github.com/russellstokes-ai/Archivist/blob/70921ca808940f65e6e409fedb74251c194297dd/mobile/offlineLibrary.ts#L389-L469).

**Finding:** Length matching/cleanup marks absent/truncated tracks only when reconciliation runs, not on every open. Equal-size byte corruption not detectable. New reachable flag in librarySources is not passed by protected App.tsx, so online fallback has to be conservative.

**Exact Astra check / acceptance:** Test complete/partial/zero/altered same-length downloads, local-first under server down/slow, process kill and restore; consider manifest hashes verified after download and validated before use with bounded caching. Never delete unverified media.

**Protection:** Do not alter locked UI/reader/scanner while auditing.

### ASTRA-06 — PDF state lifecycle needs mounted/native tests (P1)

**Evidence level:** Pure reducer coverage green; actual React scheduling unverified. **Source:** [`mobile/LocalPdfReader.tsx` L17-L104](https://github.com/russellstokes-ai/Archivist/blob/70921ca808940f65e6e409fedb74251c194297dd/mobile/LocalPdfReader.tsx#L17-L104).

**Finding:** URI-scoped reducer rejects stale requests, but one-time goto signature and onPosition callback invoked after setSession can race with repeated bookmark commands and React effect order. No real native Fold PDF tests yet.

**Exact Astra check / acceptance:** React mount with deferred native promises; A→B→A rapidly, same bookmark repeated after clearing request, 0-page transient then valid, navigation during resize, force stop. Confirm persisted source URI and image never mismatch.

**Protection:** Reader JSX/layout/animation frozen; only tested internal state allowed.

### ASTRA-07 — Android Auto track-transition persistence may target next track (P1)

**Evidence level:** Likely callback-order hazard, not proven. **Source:** [`mobile/android/app/src/main/java/app/archivist/reader/ArchivistAutoService.kt` L56-L98](https://github.com/russellstokes-ai/Archivist/blob/70921ca808940f65e6e409fedb74251c194297dd/mobile/android/app/src/main/java/app/archivist/reader/ArchivistAutoService.kt#L56-L98).

**Finding:** onMediaItemTransition calls persistProgress on currentMediaItem; if transition already installed next track it can save wrong media. Writes are enqueued without a completion barrier at shutdown.

**Exact Astra check / acceptance:** Instrument Media3 transitions, calls/navigation interruption, audio focus, unplug/replug and process kill. Assert previous chapter seconds/URI, atomic write ordering and last valid progress retained. Check memory growth of artworkCache.

**Protection:** Android Auto native service only; no mobile UI edits.

### ASTRA-08 — Server archive cover fallback fails after corrupt first artwork (P1)

**Evidence level:** Source defect verified; isolated red/green test in PR #52. **Source:** [`covers.go` L161-L209](https://github.com/russellstokes-ai/Archivist/blob/70921ca808940f65e6e409fedb74251c194297dd/covers.go#L161-L209).

**Finding:** archiveCover returns safeImageData on first image entry even if invalid; a later valid cover is not tried. A simple server-only fix is being implemented separately.

**Exact Astra check / acceptance:** Independently check ZIP Comic, TAR CBT and EPUB selected cover vs fallback, corrupt/decompression bomb, duplicate names and performance after PR #52. Verify Go root/app mirrors.

**Protection:** Server only, no mobile scanner/Assist/approved art changes.

### ASTRA-09 — WebP huge dimensions lack declared-raster bound (P1)

**Evidence level:** Static gap confirmed; impact/untrusted file behavior unmeasured. **Source:** [`covers.go` L24-L77](https://github.com/russellstokes-ai/Archivist/blob/70921ca808940f65e6e409fedb74251c194297dd/covers.go#L24-L77).

**Finding:** JPEG/PNG/GIF use DecodeConfig dimension checks. WebP is returned verbatim with up to 24MB compressed data; large image dimensions are not preflighted on server.

**Exact Astra check / acceptance:** Read VP8/VP8L/VP8X safely, add huge declared width/height cases and malformed headers; verify memory on 4GB Pi/ARM64 and good WebP reader fidelity.

**Protection:** Server-only; no UI or icon changes.

### ASTRA-10 — Database restore durability across power loss/SQLite WAL (P1)

**Evidence level:** Acceptance evidence incomplete, not a proven bug. **Source:** [`backup.go` L33-L101](https://github.com/russellstokes-ai/Archivist/blob/70921ca808940f65e6e409fedb74251c194297dd/backup.go#L33-L101).

**Finding:** Validated restore stages via hard-link and renames live DB/WAL/SHM with rollback; no evidence yet for power-cut, disk sync, readonly mounts, restart, or concurrent users.

**Exact Astra check / acceptance:** Inject failures before/after each rename, WAL checkpoint, directory fsync, disk-full and repeat staged restore. Validate original database remains recoverable, profiles/keys intact, and no destructive replacement of .before-restore.

**Protection:** Server-only; do not remove an existing rollback snapshot.

### ASTRA-11 — Sync progress outbox has no fully wired replay path (P1)

**Evidence level:** Confirmed foundation only. **Source:** [`mobile/progressReconciliation.ts` L77-L179](https://github.com/russellstokes-ai/Archivist/blob/70921ca808940f65e6e409fedb74251c194297dd/mobile/progressReconciliation.ts#L77-L179).

**Finding:** New journal/planner is not called by canonical mobile playback. Local writes cannot yet be proven to persist or reconcile across two real devices; same-position ack may drop intent if not checked under concurrency.

**Exact Astra check / acceptance:** Full storage adapter, two-profile identities, interrupted sync, revision 409, intentional rewind, reset, offline seek, retry idempotency and stale ack tests; only propose App.tsx wiring after explicit approval.

**Protection:** App.tsx and approved reader/Now UI remain locked.

### ASTRA-12 — Protected UI bugs remain open (P2)

**Evidence level:** Confirmed reports; root causes not established. **Source:** [`docs/v1/DEVELOPMENT_STATUS.md` L36-L55](https://github.com/russellstokes-ai/Archivist/blob/70921ca808940f65e6e409fedb74251c194297dd/docs/v1/DEVELOPMENT_STATUS.md#L36-L55).

**Finding:** #17 alignment, #20 Rewards Lottie reliability, #23 direct resume and #25 first Living Book mount remain unresolved despite unit source contracts. Actual installed APK commit unverified.

**Exact Astra check / acceptance:** Find real installed APK provenance, collect hardware recordings and performance traces on Fold closed/open. Isolate smallest safe data or lifecycle fix; compare geometry/screens before approval.

**Protection:** No changes to canonical layout, Living Book, Lottie, Atlas/Rewards or scanners without scoped written approval.

### ASTRA-13 — Large-library/HA/NAS acceptance is not demonstrated by CI (P2)

**Evidence level:** Integration gate, not a proven defect. **Source:** [`docs/v1/DEVELOPMENT_STATUS.md` L66-L83](https://github.com/russellstokes-ai/Archivist/blob/70921ca808940f65e6e409fedb74251c194297dd/docs/v1/DEVELOPMENT_STATUS.md#L66-L83).

**Finding:** Core Go/SQLite tests are useful but do not prove Pi4 budget, NAS outage, reattach, CBR RAR4/5 native libs, 10k+ media, concurrent scan plus streaming, backup/migrations and owner/profile authorization under deployment.

**Exact Astra check / acceptance:** Run ARM64 Pi4 HAOS (4GB+SSD) and AMD64 NAS matrix with synthetic plus representative media; check 95p memory, CPU/latency, error messages, source status, auth sessions/revocation and long-term data recovery.

**Protection:** All mobile scanner/Assist components excluded.

## Review method and commercial acceptance

1. Identify exact checked commit and the owner's installed APK before any device claims. Audit any changed files *against* canonical/protected baseline, not only against preceding PR.
2. Prioritize **data preservation** over deleting files or simplifying state: if a download, progress write, DB restore or rename fails, maintain original data and provide a recoverable state.
3. Require reproducible RED regression, smallest isolated patch, GREEN full mobile/iOS/server CI as applicable, ARM64 and AMD64 for server, and real target-device/NAS tests. Avoid tests that merely check for particular source strings.
4. Separate code contracts from test/device evidence. For #16/#19/#17/#20/#23/#25, **diagnosis only** until a precise protected-source exception is approved.
5. When resolving an Astra item: append evidence and status to `docs/v1/DEVELOPMENT_LOG.md`, update the human and JSON development status together, run `mobile/development-ledger.test.cjs`, and retain the item for audit (mark independently verified, fixed-awaiting-device or accepted with exact evidence; never delete).
6. Do not merge/deploy/sign/store-submit unless expressly approved.
