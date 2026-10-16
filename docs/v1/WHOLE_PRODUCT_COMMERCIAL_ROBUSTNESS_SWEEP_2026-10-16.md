# Archivist v1.0 — Whole-Product Commercial Robustness Sweep
**16 October 2026 | Draft source-level audit, not a commercial sign-off**

This is an **independent final static/source and existing-CI sweep**, not a claim of native hardware, user data, Google Play or production acceptance. The detailed Astra implementation contract is [ASTRA_FINAL_COMMERCIAL_DELIVERY_HANDOFF_2026-10-16.md](./ASTRA_FINAL_COMMERCIAL_DELIVERY_HANDOFF_2026-10-16.md). Verified integrated parent: PR #55 `037e3df4d715341bc92c2610f13765672778868a` (Mobile #38892377438, iOS #38892377340, Server #38892377241 green). The later server GIF and manager selection work remains draft (#57/#58). Verify latest branch and tests before applying this report.

## Audit severity conventions

- **CONFIRMED RED:** deterministic test failed on the cited source/CI. Does not imply the owner suffered data loss.
- **SOURCE-PROVEN:** the current source directly contains the behavior; exact user-facing impact may still need hardware reproduction.
- **POSSIBLE:** reasoned source hypothesis, not a verified fault.
- **ACCEPTANCE MISSING:** available code or tests exist, but target real-world evidence absent.
- **LOCKED:** no modifications whatsoever unless the owner separately approves the precise protected exception.

## Immediate GO/NO-GO

**GO** — isolated draft engineering and disposable Docker/HA smoke testing, using separate synthetic media and database. AMD64, native ARM64 and mobile/iOS CI have passed on the integrated baseline; subsequent server-only corrections have targeted CI.

**NO-GO** — connect a personal master media library, merge canonical, replace installed APK, publish a production server/App Bundle, treat native Fold/UI issues as fixed, or claim Android Auto and Play approval. Two dangerous reproducible integrity defects remain open, and all eight original mobile bug cases lack owner-device acceptance.

## Android mobile: 12 review groups

| Group | Source/evidence | Verdict and release consequence |
|---|---|---|
| 1. Canonical layout, fonts, colours and navigation | Canonical `df4c39b`, 46 SHA-1 locks, `mobile/App.tsx` protected | **LOCKED**. No broad redesign or rewire, even if unprotected source can affect it indirectly |
| 2. Both scanners and metadata Assist | Native/JS scanner, Android SAF, Smart Search/editor | **LOCKED**. Historical scanner #15 excluded from eight-issue scope. Preserve the installed working experience |
| 3. CBZ/CBR/CBT/comic PDF | `mobile/localReader.ts`, `mobile/App.tsx`, issue #16 | **UNRESOLVED**. Raw-URI WebView fallthrough may be involved; exact 2000AD 1978 permission/classification evidence needed. Server-only GIF compatibility does not close this |
| 4. Atlas/Stats/Rewards | `App.tsx` `atlasRelationshipWorks` and `scannerPublished` filter | #19 **POSSIBLE** filter mismatch; Stats and Rewards visuals LOCKED. Device count reconciliation is required |
| 5. Living Book first paint | `LivingBookCanvas` owner presentation, `App.tsx` book-cover session | #25 **UNRESOLVED**; capture actual WebView readiness/phase on Fold with current installed APK. Renderer LOCKED |
| 6. Playback/Now resume | `App.tsx` Now session and `openBook` lifecycle | #23 **UNRESOLVED**; must prove no duplicate modal and no audio autoplay. Progress outbox scaffolding is not playback sync integration |
| 7. Five-button transport | `LivePlayerPlayPauseMorph.tsx` X/Y artwork offsets and caller layout | #17 **UNRESOLVED**. Optical centring on Fold closed/open must be measured; controls and Lottie LOCKED |
| 8. Rewards Lottie lifecycle | `AchievementRewardOverlay.tsx`, `rewardMotion.ts` | #20 **UNRESOLVED**. Verify animation plays once, freezes only at real last frame, sequential rewards and background restore, reduced motion. Styling/asset LOCKED |
| 9. Local-first downloaded media | `offlineLibrary.ts`, issue #31, PRs #41/#50/#54 | **P0 CONFIRMED RED** [Mobile #38892078091](https://github.com/russellstokes-ai/Archivist/actions/runs/38892078091): a compatible stale checkpoint can delete an 81-byte original file before a failed replacement; current download correctness is NOT commercial-grade. Transactional staging/commit/rollback required |
| 10. PDF lifecycle | `LocalPdfReader.tsx`, `pdfDocumentSession.ts`, PR #49, issue #32 | CI-green draft; stale native replies/page isolation tests are NOT yet Fold and real-PDF acceptance |
| 11. Cross-device audio/reader state | `mobile/progressReconciliation.ts`, `sync_progress.go`, PR #53 | **P1 CONFIRMED RED** [Server #38892078164](https://github.com/russellstokes-ai/Archivist/actions/runs/38892078164): LIMIT/OFFSET between concurrent deletes silently omits an untouched item with HTTP 200. Duplicate detection is insufficient. Must implement snapshot consistency and safe retry |
| 12. Native Android, storage and Fold | `android/AndroidManifest.xml`, Kotlin reader/archive, SAF, orientation, 16KB native alignment | **ACCEPTANCE MISSING**. Real device permission restore, long sessions, memory, 16 KB emulator, phone/Fold closed/open, interruption/storage pressure required; avoid scanner changes |

## Server/core: 11 review groups

| Group | Evidence and risk | Gate |
|---|---|---|
| 1. Core deployment | Single Go/SQLite server in `archivist/app`, HA add-on, `compose.yaml`, `deploy/nas` mounts | **CI-smoke passed** for isolated Docker/ARM64 synthetic roots; no real Synology/QNAP/Unraid/TrueNAS/HA Pi qualification |
| 2. Persistence | Docker named `/data` volume; NAS and primary media mounted read-only by default | No shared writable DB volume between instances, no `down -v`, real SSD/detached NAS test required |
| 3. Database backup | `backup.go` exports `VACUUM INTO`; restore pending and rollback copies exist | **SOURCE RISK**: multi-file WAL/SHM renames and `.before-restore` path are not proven crash-durable at every write/rename/fsync boundary; do fault injection on disposable copies |
| 4. Authentication & grants | Household grants, authenticated media, separate owner and profile | Automated access gates exist; independent profile isolation, revoked-session, per-library authorization, CSRF and remote access penetration tests missing |
| 5. Catalogue consistency | Sources, works, editions, separate physical assets | Need 10k+ mixed media, no silent deletion on detached NAS, no duplicate logical issues or multipart merge |
| 6. Scanner/server source health | `/api/library-health` probes current mounted root, preserves catalogue | Do not modify either existing scanner. Test unplug/reconnect and deeper file errors separately; root present does not imply full readability |
| 7. EPUB/ZIP/CBR/CBT covers | Exact reviewed #52 `covers.go`, root/package tests | Corrected bounded corrupt-first-candidate fallback. Additional real archive/large/WebP dimension tests needed |
| 8. WebP cover handling | `covers.go:safeImageData` does decoded config preflight for JPEG/PNG/GIF; `image/webp` returns compressed bytes without a decoded raster-size check | **SOURCE-PROVEN missing bound** before handing potentially oversized WebP to clients; choose safe native decode-config preflight or bounded reject while preserving valid artwork. Astra review, no speculative rewrite |
| 9. Comic server reader | #57 adds GIF listing + safe dimension preflight with authenticated CBZ/CBT fixture, CBR RAR code already exists | CI-green server-only draft, not Android issue #16; real CBR (RAR variant), malformed archives and real PDF reader test pending |
| 10. Advanced admin UI | `web/manage.*` grid/data table, owner check, saved filter, metadata candidate, health, CSV; #58 row selection fix | #58 confirms row handler `TypeError: choose is not a function` RED/GREEN. **Remaining:** cover grid, bulk safe workbench with undo, true series/editions, rich provenance/field lock, performance/accessibility acceptance |
| 11. API reconciliation | `sync_progress.go` page endpoint returns a separate query per page | **CONFIRMED RED** concurrent omission, blocks cross-device syncing; include grant-revocation testing and REST backwards compatibility |

## Android Auto

- **Existing real implementation:** `mobile/android/app/src/main/java/app/archivist/reader/ArchivistAutoService.kt` has a MediaLibraryService, ExoPlayer, MediaSession, browsable audiobook categories and persistent progress file safety. Do **not** replace the service or telephone player.
- **SOURCE RISK:** the Media3 callback `onMediaItemTransition` invokes `persistProgress(false)` after the active item may have switched, potentially writing old position under wrong work key. Diagnose exact Media3 callback timeline; record previous item identity, no duplicate stream and correctness under next/previous chapter.
- **ACCEPTANCE MISSING:** Desktop Head Unit, real vehicle discoverability without developer mode, browse/search/voice, call/navigation audio focus, Bluetooth interruptions, offline reconnect, car play policy and crash/ANR.

## Google Play + release engineering

- `mobile/app.json` and `mobile/android/app/build.gradle` currently use app version **0.9.4**, versionCode **102**, package `app.archivist.reader`. The Android test workflow produces a **debug-signed test APK** and may publish a testing prerelease; this is explicitly NOT a Play-ready signed AAB. Do not distribute it as a production release.
- `mobile/android/app/src/main/AndroidManifest.xml` sets **`android:usesCleartextTraffic="true"`**, supporting intentional direct local HTTP but increasing the network-policy attack surface. Do **not** disable blindly (would break local server use); define a domain/network-security strategy with explicit trusted LAN and HTTPS remote rules, then test actual Android networking. `./plugins/withCleartextTraffic` in Expo confirms policy is intentional.
- Verify the actual target API/AGP/NDK, final App Bundle signing and update migration, native 16 KB page sizes and real arm64, privacy policy/Data Safety/account deletion if applicable, permissions declarations, store category Books & Reference, licensing of every graphic/Lottie/metadata API, test credentials, upload review and closed-test requirements. No production signing credentials or Play approvals are asserted here.
- **User test build provenance is unknown** (no validated installed APK SHA); CI-green branch is not automatically the installed app.

## Security and abuse surfaces to retain under audit

- Media paths must remain constrained under `os.Root` (including symlink and archive traversal) and local folders protected by Android SAF grants.
- Owner-only routes must remain owner-only; per-profile grants must apply to streams, reading progress, OPDS, search, downloads and backups, not just rendered UI. Rerun CSRF and remote HTTP exposure tests.
- `web/manage.js` renders external metadata with `textContent`, not `innerHTML`, and quotes/escapes CSV with a formula-injection prefix; preserve this behavior.
- WebP, compressed comic archive and embedded covers need strictly bounded CPU, decompression/memory, entry count and timeout (especially Pi 4 under concurrent streaming and scan).
- No automatic deletion/rewrite from metadata enrichment, failure cleanup, NAS disappearance, or a resume checkpoint. A release must validate against disconnected and partial states.

## Commercial finish gate in execution order

1. **Astra P0:** fix original-media deletion with staged immutable downloads, manifest publication/rollback, disk-full/restart and concurrency tests. Convert the exact RED PR #56 regression to GREEN.
2. **Astra P1:** versioned coherent snapshot paging, per-profile auth/revocation, restart-safe journal/replay and cross-device conflict semantics. Convert PR #56 server RED to GREEN.
3. **Device acceptance / limited protected UI approval:** original eight user bugs #16/#19/#25/#23/#17/#20/#31/#32 on real media/ Fold open+closed; no workaround or unverified claimed fixes. Scanner #15 excluded.
4. **Server administration and data durability:** full business-grade manager, media integrity, actual Pi4/HA/Docker/NAS, multiple offline roots, SQLite backup+restore interruption.
5. **Android Auto and Store:** native vehicle tests, signed AAB with 16 KB compatibility, disclosures and real Play prelaunch/closed test.
6. **Release integration:** one approved, versioned, reproducible merge/build with SHA, checksums, source locks, rollback and after-install smoke. Reconcile `DEVELOPMENT_STATUS.md`, `DEVELOPMENT_STATUS.json` and append-only `DEVELOPMENT_LOG.md`. Keep all earlier RED/failed tests in audit trail.

## Test outcome and owner release decision

**Zero out of eight original bugs have device acceptance evidence in this source sweep.** No entire-app signoff possible; production **NO-GO**. The value of the current safe draft work is a real combined baseline, code/test corrections and isolation of **verified** dangers from merely suspected risks. Give Astra this report alongside both existing review queues and the final handoff, and require signed-off evidence per gate rather than a “commercial quality” claim.
