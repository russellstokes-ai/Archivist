# ARCHIVIST v1.0 — ASTRA FINAL COMMERCIAL DELIVERY HANDOFF
**16 October 2026 · Working plan, not release approval**

## 0. Mandate and verified starting position

Finish Archivist to an actually demonstrable commercial standard for **Android phones and Fold closed/open, optional Home Assistant / Raspberry Pi 4 4 GB SSD server, standalone Docker/NAS, audiobook Android Auto, and Google Play**. Use current source and tests; avoid rewrites and token-wasting recapitulation. Keep the app locally useful without any server. Never claim a feature accepted from CI alone.

**Repository:** `russellstokes-ai/Archivist`. Begin by reading, in order:
- `docs/v1/README.md`, `DEVELOPMENT_STATUS.md`, `DEVELOPMENT_STATUS.json`, `DEVELOPMENT_LOG.md`, `ORIGINAL_BUG_BACKLOG_2026-10-14.md`, `PROTECTED_BLOB_LOCKS.json`.
- `docs/v1/V1_SAFETY_BUGS_AND_TEST_GATE_2026-10-16.md`, `PR52_PR53_RECONCILIATION_2026-10-16.md`.
- Both independent `docs/v1/ASTRA_REVIEW_QUEUE.md` and `docs/v1/ASTRA_ROBUSTNESS_REVIEW_QUEUE.md`. Preserve both; do not overwrite one with the other.
- Commercial [master plan](https://github.com/russellstokes-ai/Archivist/blob/plan/archivist-v1-master-2026-10-12/docs/ARCHIVIST_V1_MASTER_DEVELOPMENT_PLAN_2026-10-12.md) and [release implementation handoff](https://github.com/russellstokes-ai/Archivist/blob/plan/archivist-v1-master-2026-10-12/docs/ARCHIVIST_V1_COMMERCIAL_RELEASE_WORK_HANDOFF_2026-10-13.md), subject to the later narrower eight-bug scope.

**Immutable originals:** approved canonical `df4c39b44394d8c512ca0298bffa7f19da356490`; protected development baseline `72bbf177aecc92f31724b48c6cf11a7eddd7a216`; original approved phone APK source **not independently established**. Preserve all 46 Git blob hashes and additional archive/gesture locks. Never change either scanner, Archivist Assist, Smart Search/metadata editor, canonical `mobile/App.tsx` layout or typography, Living Book renderer, Comic Focus/gestures, Atlas/Stats/Rewards presentation, approved icons/Lotties/branding without separately scoped explicit owner approval. Do not circumvent protected behavior through unprotected modules.

**Validated draft ancestry as of 16 October:**
- [PR #55](https://github.com/russellstokes-ai/Archivist/pull/55) exact integration SHA `037e3df4d715341bc92c2610f13765672778868a`, **Mobile [#38892377438](https://github.com/russellstokes-ai/Archivist/actions/runs/38892377438), Server [#38892377241](https://github.com/russellstokes-ai/Archivist/actions/runs/38892377241), iOS [#38892377340](https://github.com/russellstokes-ai/Archivist/actions/runs/38892377340) all succeeded**. It includes draft #40–54 client/server foundations with #52 server cover code/test exact blobs integrated; unmerged, no APK. All 46 protected paths excluded from net changes.
- [PR #56](https://github.com/russellstokes-ai/Archivist/pull/56) is **quarantined RED tests only**, against immutable PR #55 test snapshot. [Mobile #38892078091](https://github.com/russellstokes-ai/Archivist/actions/runs/38892078091) failed for confirmed source-level offline media loss; [Server #38892078164](https://github.com/russellstokes-ai/Archivist/actions/runs/38892078164) failed for silent OFFSET-page omission. Never merge these failing tests into a consumer build without making both GREEN.
- [PR #57](https://github.com/russellstokes-ai/Archivist/pull/57), server-only GIF CBZ/CBT page enumeration + validated image MIME/dimensions, RED test followed by green [Server #38894595898](https://github.com/russellstokes-ai/Archivist/actions/runs/38894595898). Preserve both root and packaged `reader.go`; no scanner or Comic Focus change. Still draft and not device-accepted.
- **Verified manager RED/GREEN update:** Quarantined [PR #59](https://github.com/russellstokes-ai/Archivist/pull/59) [Server #38896163057](https://github.com/russellstokes-ai/Archivist/actions/runs/38896163057) failed precisely with TypeError 'choose is not a function' on original manager row click. Corrected [PR #58](https://github.com/russellstokes-ai/Archivist/pull/58) passed [Server #38896160314](https://github.com/russellstokes-ai/Archivist/actions/runs/38896160314) at code/test/workflow commit 61576ec4d58dd37a400512fa21e08200bfd55336. Keep PR #59 RED separate; do not mistake source fixes for device or server UI acceptance.
- [PR #58](https://github.com/russellstokes-ai/Archivist/pull/58), stacked on #57, isolates server manager catalogue row selection (existing `choose` function was shadowed by a TD variable). Includes executable fake-DOM selection regression and one-line-equivalent rename in mirrored `web/manage.js`. **Check latest actual CI before promoting.** A prior run failed in the new mocked UI test bootstrap; this does not establish a product failure. Do not claim green until corrected exact-head run passes.

## 1. P0/production-blocking data integrity — FIRST Astra work

### A1. Offline download checkpoint must never delete original media
**Reproducer already proven RED:** `mobile/offline-checkpoint-data-loss.test.cjs` on PR #56. Simulates an existing 81-byte sentinel, stale compatible checkpoint, changed advertised server length and failed replacement: prior bytes disappeared before any successful replacement. Original behavior is in `mobile/offlineLibrary.ts` checkpoint preflight and direct `deleteAsync(uri)` branches.

**Engineering contract:** immutable previously published media until explicit owner removal or safe transactional replacement; download into separately identified staging path; authenticated resume only within same staged identity; validate length and digest (where authoritative); atomically commit verified media + manifest/checkpoint in crash-safe order; recover after force-stop, reboot, storage-full and pause; ensure concurrent downloads/cleanup cannot race; reject malicious checkpoint paths; never discard unverified partials. Preserve media even on corrupt/no network. Test old client manifests, multi-part audio, power cut before/after rename and incomplete downloads. Zero-byte fix in #54 is a separate, already drafted guard, not the data-loss solution.

**Approval boundary:** this helper is unprotected but high-risk. Independently design, implement on a new isolated draft with GREEN RED regression, audited rollback and owner-visible data-preservation proof. Avoid throw-only/manual-delete bypasses.

### A2. Cross-device reading/listening progress must use consistent snapshots
**Reproducer already proven RED:** mirrored `sync_progress_concurrent_pages_test.go` on PR #56. Deleting a preceding record between `LIMIT/OFFSET` pages yields HTTP 200 while silently omitting an untouched third progress entry. Check `sync_progress.go`, `archivist/app/sync_progress.go`, `mobile/progressReconciliation.ts`.

**Engineering contract:** choose bounded profile-authorised, revisioned snapshot/cursor with expiry+409 retry OR equivalent transactional consistent traversal; no false “remote absent” decision, no dropping local outbox; handle concurrent insert/update/delete, grant revocation, mixed media, two profiles, resumed retries, large libraries, storage failure and multi-writer journal race. The #53 duplicate-remote rejection is necessary but insufficient. Version protocol compatibly and migrate safely.

**Critical:** current `App.tsx` does NOT yet wire durable playback events to the sync outbox. Completion requires separately approved integration that preserves saved positions, deliberate rewind and no unexpected audio autoplay.

### A3. Backup/restore durability
`backup.go` staging, SQLite/WAL/SHM renames and `.before-restore` rollback need fault injection: torn writes, disk full, power loss at every rename/sync boundary, existing rollback-copy preservation, concurrent sessions, mixed mount permissions and next-boot recovery. Never test restore against original family data. Enforce admin-only and profile separation.

## 2. Original eight user bugs — minimum necessary change, no UI redesign

Each must have (a) real reproduce/media proof, (b) diagnosed cause vs hypothesis, (c) precise protected-code exception approval if needed, (d) failing regression, (e) full green CI on the exact draft, (f) actual Android/Fold closed+open acceptance.

| Bug | Current condition / first investigation | Acceptance |
|---|---|---|
| **#16 2000AD comic won't open** | `mobile/localReader.ts:19–32` format route can fall through to raw URI / generic WebView in `App.tsx:6185–6190`; hypothesis, original file not yet traced | 2000AD Annual 1978 plus CBZ/CBR/CBT/comic PDF open/page/force-close with SAF permissions; Comic Focus untouched |
| **#19 Atlas blank** | `App.tsx:1531–1543` adds `scannerPublished` filter not necessarily shared with valid Library catalogue; root cause unproven | Atlas counts/works = eligible published Library/Shelf data across local/offline/server and space filters; approved Universe geometry/animations untouched |
| **#23 unwanted Resume prompt** | Current Now session and local reading resume paths need distinction between explicit open and autoplay | No modal; saved page/chapter/seconds restore after device restart; audio never auto-plays without user choice |
| **#25 Living Book disappears until Play/Pause** | Measure locked Canvas/WebView ready and phase/cover events on cold open | Visible first entry, reliable pause/play without changing book geometry/page renderer |
| **#17 Play/Pause optical centering** | Existing glyph source offsets X=10,Y=3 in `LivePlayerPlayPauseMorph.tsx`; no evidence yet that tweaking one offset suffices | All five controls identical sizing, optical centre Play and Pause verified in Fold both modes; no replacement Lottie |
| **#20 Rewards Lottie blank/frozen** | `AchievementRewardOverlay.tsx` has lifecycle / `progress` end-frame hold; failure not reproduced | Books Stack/Headphones/all approved reward assets play once, retain end-frame and survive rapid successive reveals, resume/reduced motion |
| **#31 Offline local-first** | #41/#50/#54 draft tests pass; P0 destructive checkpoint bug A1 blocks acceptance | Complete/partial/corrupt/offline/reconnect and process death without losing user media; integrity at use time |
| **#32 PDF wrong previous page** | #49 document URI/generation reducer CI passes but no native device proof | A→B→A PDFs rapid switches, persisted positions, revoked permission, orientation/Fold change and force-stop show no stale previous image |

Scanner issue **#15 excluded**. All other historical issues are NOT automatically in the active bug scope. Do not silently expand tasks to reimplement the scanner, Smart Search, rewards design or standard layouts.

## 3. Commercial server work — THEN finish without building a second server

The server already includes Go/SQLite, HA add-on packaging, standalone Docker/NAS Compose, admin health, catalogue pages, saved filters, single-file metadata editing/candidates, backup, streaming and read-only media mounts. **It is not yet a complete BookOrbit-class administration experience.**

Complete the existing lightweight premium desktop-first 16:9 web manager, reusing `web/manage.html`, `manage.js`, `manage.css`, the original admin tools and mirrored `archivist/app/web` assets. Workstream priorities:
- Search/filter/sort **on logical works as well as source files**, cover grid + list + data table, meaningful item/issue/series counts, source and availability truth. Preserve existing accepted mobile catalogue and scanner.
- Metadata workbench: field-by-field provenance, verified field locks, configurable candidate comparison, review persistence, batch-preview bulk edit with explicit confirmation, undo/journal on interruption. No arbitrary automatic overwrite or destructive moves.
- Series/editions/comics grouping, fractional issue order, multipart audiobook identity and source-specific missing status, household profile grants; predictable APIs with access-control tests.
- Library health for disconnected NAS paths, genuine file vs root reachability, non-destructive recovery, database/export verification.
- UI acceptance: functional responsive screens, keyboard/touch, no clipped text, multi-library use, accessibility, secure source path presentation, no server-side Living Book/Atlas/Rewards heavy animations.

**No changes to either existing scanner/workflow without explicit separate approval**. If a feature cannot be safely completed without modifying scanner internals, describe that exact dependency first. Keep root/packaged server implementation byte-identical.

## 4. Android Auto — mandatory, separate test gate

Keep existing Media3 `ArchivistAutoService.kt` and approved phone player. Specifically audit `onMediaItemTransition` progress callback ordering (could save position against the next track), async shutdown writer barrier, atomic progress files, paused/restarted media IDs, audio focus and navigation. Then validate browsable audiobook root/continue/recent/series, voice/search compatibility, background media/notifications, offline continuity, Bluetooth and reconnect, all with car-safe screens. Desktop Head Unit and real vehicle acceptance required; do not assume success because phone player works.

## 5. Google Play / platform release

Create clean versioned signed Android App Bundle *only after* issues, backup, sync and Fold hardware acceptance. Verify current Play target API requirement at actual submission, native 16-KB page alignment, ABI, storage/SAF and foreground audio permissions, accessible notifications, app-data/privacy policy and Data safety, licensed Lottie/metadata assets, clear no-DRM limitations, supported devices, review credentials and accurate screenshots. Perform upgrade migration, Google Play pre-launch/closed-testing obligations as applicable. Do not publish, distribute a production APK, install to owner's Fold, or overwrite existing backups without explicit approval.

## 6. Physical acceptance matrix — non-negotiable

**Mobile:** representative EPUB/PDF/CBZ/CBR/CBT/MP3/M4B and malformed files, Fold closed/open and device cold start, chapter seek, pause/resume, multiple local folders, persisted metadata and rewards, remote server disconnect/reconnect, offline download interruption/disk full, saved position and zero silent file deletion. Observe actual APK source SHA and signed/unsigned build identity.

**Server:** AMD64 Docker, native ARM64 Raspberry Pi 4 4GB with HAOS and SSD, multi-root read-only NAS mounts, 10k+ representative entries and streaming concurrency, permission revoke, drive unplug/reconnect, authentication, SQLite restore/power failure, no public HTTP exposure, backup restore from disposable snapshot, resource and UX stability. Dashboard admin tools and reader streaming must actually work.

**Android Auto:** real head unit/vehicle and Desktop Head Unit, voice/browse, track transitions, long listening session, audio focus/calls/navigation, offline recovery.

Each gate records exact SHA, device/OS/fixture, steps, errors, logs, before/after screenshots or recordings as relevant and reviewer decision; CI is not physical acceptance.

## 7. Astra execution discipline / outputs

1. **Do not repeat already completed research or rewrite protected app.** Inspect current GitHub PR heads first; never treat this document's SHA as automatically current.
2. Make a risk-ordered checklist, then handle one verified defect or tightly related set per isolated draft branch, writing a reproducing RED test before minimal root-cause GREEN correction. Bring PR #56 reproductions into corrected candidate only once passing.
3. Every PR: root cause, exact changed files, privacy/security/dataloss assessment, real tests and full CI, rollback, 46 SHA and other protected hashes unchanged, original eight bug status only, unmerged by default.
4. Maintain `docs/v1/DEVELOPMENT_STATUS.md`, `DEVELOPMENT_STATUS.json` and append-only `DEVELOPMENT_LOG.md` together. Preserve both Astra review queues and source changes/failed CI history; never overclaim production readiness.
5. Propose a single consolidated candidate after resolved dependencies, not a dozen unrelated builds. Confirm rollback, then separately request user permission for an installable Fold APK or test server with actual library.
6. Final output: precise **accepted vs CI-only vs blocked**, draft PR links/head SHAs and run URLs, remaining protected-code exception requests, hardware acceptance evidence, and explicit commercial GO/NO-GO for Android, server, Android Auto, Google Play.

**Definition of done:** every one of the eight approved bugs accepted on hardware; zero known data-loss paths or silent progress truncations; server's required v1.0 management experience functions on real Pi/NAS or is explicitly scoped as optional; Auto meets vehicle tests; release store requirements met; canonical UI untouched except separately authorised surgical fixes; safe rollback and approved signed release. Until then, report “development/test-ready” where warranted, never “commercial grade complete.”
