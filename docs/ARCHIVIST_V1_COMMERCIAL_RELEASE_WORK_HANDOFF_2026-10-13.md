# Archivist 1.0 — Commercial Release Work Handoff

**Prepared:** 13 October 2026
**Status:** Technical specification and implementation handoff; NOT a production approval.
**Scope:** Android mobile; Home Assistant / Docker Go/SQLite server; lightweight server web administration; Android Auto; Google Play submission.
**Source of truth:** Original approved canonical reference df4c39b44394d8c512ca0298bffa7f19da356490 plus selectively accepted post-canonical implementation, NEVER a blind merge.
**Execution authorization:** Documentation only. This file does not authorize editing code, protected experiences, deployment, signing, publishing, merging or creating a release.
**Companion:** This file incorporates the 12 October master development plan in Appendix A so the handoff is self-contained.

## Executive decision

Archivist is past greenfield development. The important work is precise bug repair, shared identity and metadata reliability, BookOrbit-level server library administration, Pi-grade resource control, actual Android Auto acceptance and Play compliance. Reuse the existing mobile scanner, native readers, Go/SQLite catalogue, file-move ledger, authentication, backup and Media3 media library service.

**Critical, verified code-level server gap:** At canonical source, archivist/app/main.go function kind() does not identify .cbr, and archivist/app/reader.go explicitly refuses .cbr with HTTP 415. CBR indexing and lightweight reader support are a distinct P0 server task; do not conflate with the mobile WebView ERR_ACCESS_DENIED bug.

## 1. Source-of-truth reconciliation — complete read-only audit

### Fixed references
- Original protected full-app source: df4c39b44394d8c512ca0298bffa7f19da356490, canonical/archivist-20261011-df4c39b.
- Subsequent QA source: 131cabdc82ce7c6d6b36e0034540184bd990a3ab, backup/rewards-all-fixes-approved-test-source-131cabd-20261011.
- GitHub compare: https://github.com/russellstokes-ai/Archivist/compare/df4c39b...131cabd
- Comparison result: 97 commits ahead, 0 behind, 62 changed files. Latest source touches mostly mobile/App.tsx, mobile/LocalPdfReader.tsx, mobile/LivingBookCanvas.tsx, motion components/assets, comic access diagnostics, tests, CI scripts and exception inventories. No server/backend changes appear in this compare.
- The default main branch is stale relative to the original canonical checkpoint. No one should start by merging main into canonical.
- IMPORTANT: Determine the installed user's APK SHA and package ID from installed package/build provenance or explicit tester evidence before choosing a development branch. Repository release assets alone do not reveal the APK on the device.

### Classification of the 97 commits

| Group | Implementation evidence | Decision | Remaining acceptance |
|---|---|---|---|
| Living Book scale | 1.16× drawing only in LivingBookCanvas.tsx; original renderer/motions otherwise retained | RETAIN AS QA CANDIDATE; protect original renderer | Physical phone/Fold drawing bounds and page turning; do not assume accepted |
| Book Loader | Shared ArchivistBookLoader.tsx, nine spinner substitutions, original approved book Lottie | PRESERVE SOURCES and conditional implementation | End-to-end loading, accessibility/reduced motion and real screen fit |
| Play/Pause Lottie | LivePlayerPlayPauseMorph.tsx, existing 80dp transport geometry | PRESERVE SOURCES and candidate | Rapid taps, icon centring, no flicker or duplicate ring |
| FF/RW | LivePlayerSkipIcon.tsx and bounded 15s/3-page, 30s/6-page skip choreography | PRESERVE candidate | Direction, audible seek, cancelled bursts, real page visibility |
| Mini-player waveform | MiniAudioWaveform.tsx at 20dp with teal/ivory variants | PRESERVE candidate | Pauses/freezes appropriately, respects reduced motion and narrow screens |
| Seven reward animations | AchievementRewardOverlay.tsx, rewardMotion.ts and original Lottie source manifests | PROTECTED development candidate; no carte blanche for Rewards edits | Correct source, full native duration, held last frame, 260ms fade, no fake awards |
| Portrait alignment | Optical glyph +5dp right/+2dp down; phone-only player elevation/spacing | VALIDATE against unchanged transport dimensions | Narrow phone and Fold physical QA |
| Comic WebView recovery | Scoped origin/fallback/watchdog and error mapping | UNRESOLVED BUG, diagnostic candidate | Reproduce ERR_ACCESS_DENIED by local/downloaded/server source and actual file type |
| Regression tests/CI | Source locks, targeted JS tests, isolated signed QA APK workflows | KEEP as regression infrastructure | Run tests and inspect that protection rules have not been loosened broadly |

Evidence: docs/ARCHIVIST_BASIC_UI_ANIMATIONS_CHECKPOINT_2026-10-11.md and docs/REWARDS_LOTTIE_CHECKPOINT_2026-10-11.md at 131cabd. Both label the changes development-only, not physically approved replacements for canonical source. Never claim those changes have passed device acceptance simply because code/tests/releases exist.

### Five immutable user-approved experiences
1. Shelf, including Continue Reading / Continue Listening layout.
2. Living Book renderer, physical geometry, page turning and layout.
3. Comic Focus speech-bubble zoom and gestures.
4. Atlas Universe/rings/charts and interactions.
5. Stats & Rewards presentation, medals/awards, profiles and animation design.

User authorizes investigation of old issue reports, not general changes in these modules. Require separate explicit approval for narrowly scoped edits to protected components (#19, #20, #21, #25). Cosmetic tweaks outside approved scope are prohibited. Approved app identity is dark navy, warm ivory/gold and teal, including original logo/icon. Windows companion sorter is OUT OF SCOPE.

### Work-session branch procedure
1. Read installed APK package ID, source SHA, build tag and compare with the checkpointed releases; if unavailable, request evidence instead of guessing.
2. Create a new work branch from the specifically agreed source SHA, not main. Preserve df4c39b and independent backups.
3. Capture checksum, relevant source hashes, tests, screenshots and supported environment before modifying.
4. Selectively integrate candidate commits/features with an explicit allowlist and one regression/acceptance check per candidate. Do not wholesale cherry-pick 97 commits.
5. No release promoted from QA until phone (narrow), Samsung Fold closed/open, actual library, Pi and car gates pass.

## 2. Locked technical architecture

### Product boundaries
- **Android app:** local-first scanner, multiple SAF folders, on-device player, library, reader, downloads, working offline, protected premium visual features.
- **Go/SQLite server:** Home Assistant aarch64/amd64 add-on and Docker; durable catalogue, shared metadata, profiles, permission-enforced direct streaming, scanning, organisation, backups; lightweight web front end; no heavy Living Book, Comic Focus rendering, animated Atlas or live transcoding.
- **Android Auto:** existing Media3 MediaLibraryService / MediaSession; on-device and downloaded audio browse already implemented; add secure server-only source browsing if needed for full v1 scope, without putting credentials in browsable items.
- **Google Play:** production Android application, not a Google Play Books content distributor.

### Canonical data model
Reuse existing sources, assets, works, editions, edition_assets, household grants, profile_progress, reading_progress, jobs, file_moves and SQLite backup paths. Keep existing internal numeric IDs operational. Add durable public work/edition identity and alias resolution rather than discarding existing data or assuming paths are identities.

Proposed additive migrations, to be refined against full database schema before implementation:
- work_identity: work_id FK to works, stable_public_id unique, created_unix.
- edition_identity: edition_id FK to editions, stable_public_id unique, created_unix.
- identity_aliases: source/provider + prior stable key -> surviving public ID, with conflict rejection, upgrade history and audit timestamps.
- metadata_field_state (or separate FK-protected work / edition / asset field tables): entity, field_key, value, source_kind, source_reference, confidence, confirmed, locked, revision, updated_unix. Use strict allowed field keys and transactional updates; retain old aggregate columns for backward-compatible responses.
- metadata_candidate_cache: keyed to work or edition with provider, candidate source, TTL, provenance, confidence and retrieval diagnostics, optional/cached for Pi.
- metadata_change_journal: actor/profile, entity and field, before/after value, provenance, revision and timestamp; supports safe review and rollback.
- scan_job_events or enriched existing jobs: stage, counts of files vs logical works, timestamps, error category, actual cancellation state and recent history.
- progress_pending_events / client-side queue: device ID, stable edition ID, base server revision, event ID (idempotency), position, track/section, explicit seek/rewind intent, timestamp and state.

Schema choices are **implementation proposals, not existing SQL migrations**. Require reversible/migratable SQLite DDL, FK enforcement, indexes and backup/restore verification before deployment.

### Metadata precedence and edit semantics
- Field-specific precedence: explicitly locked manual confirmation > confirmed manual choice > trusted embedded/sidecar > high-confidence external candidate > filename/path inference.
- A save may confirm only some fields. Other unresolved fields remain reviewable; do not turn the whole asset into confidence 100 or erase needs_review for unrelated missing fields.
- Editing one field must not drop title, author, series, genre, year, narrator, ISBN/ASIN, description or cover candidates.
- Work, edition and physical asset metadata are separate: preserve original publication year vs edition release year; comics use series, volume/issue identifiers and fractional issue ordering; an audiobook's multiple files are one logical work.
- Manual edits, selected cover and locks survive refresh, file moves, source reconnect and metadata enrichment.
- Edits carry an expected revision. Mismatched revision returns 409 with the latest state and a safe comparison rather than silently overwriting.
- Prefer cached/embedded parsers and rate-limited provider fetches. Provider timeout must not freeze scanning or publishing.

### Cross-device and media contracts
- Work IDs and edition IDs must be immutable across source/path movement; no accidental new work when a file is renamed or a source is temporarily unavailable.
- Server media capability response distinguishes ebook, PDF-as-book, PDF-as-comic, CBZ, CBR, CBT, audio and unsupported/corrupt. Preserve actual format and reader capability separately.
- Source state: local, server, downloaded; availability: online, offline-readable, temporarily-unavailable, permission-denied, missing, invalid. Availability affects dedupe preference.
- Offline source precedence: available on-device copy first while server is unreachable; online usable server copy may be preferred only by an explicit documented rule. Preserve original-server identity.
- Audiobooks: stable track IDs, duration, seconds, completion, edition; ebook/comics: section/page, fractional offset where applicable, completion. Do not conflate different formats or profiles.
- Progress writes use per-profile edition/asset revisions already present in server. Client queues disconnected writes with idempotency keys, then on conflict fetches latest. Preserve intentional rewinds and explicit resets, not simplistic furthest-position-wins. Surface irreconcilable competing edits without silently deleting either.
- Version negotiation: new GET /api/capabilities endpoint PROPOSED (not currently confirmed implemented) exposing API/schema version and features; mobile keeps older server fallbacks. New JSON fields optional for older clients, no abrupt rename/removal.
- Authentication/authorization enforced on list, media, progress, downloads, OPDS, metadata and diagnostics. Household roles: Admin and User, with library grants and separate progress. No private media paths exposed to user role.

### Proposed API additions — NOT existing routes
| Proposed route | Purpose |
|---|---|
| GET /api/capabilities | Negotiated API and format features |
| GET /api/works?sort=…&filters=… | Expand existing GET works with validated sorting and counted pagination |
| GET /api/works/{id}/metadata | Resolved metadata and per-field provenance/locks |
| GET /api/works/{id}/candidates | Trusted candidate search results with caching and errors |
| PATCH /api/works/{id}/metadata | Atomic field updates, locks and revision checks |
| GET /api/library-health | Work-level cover/review/source/duplicate health, grant-filtered |
| POST /api/jobs/{id}/cancel | Actually signal bounded active scanning and persist cancelled status |
| POST /api/jobs/{id}/retry | Retry with source-state and deduped job guard |
| POST /api/progress/reconcile | Optional versioned/idempotent offline event reconciliation |

Before adding routes, review and extend existing /api/works, /api/books, /api/works/group, /api/assets/{id}/metadata, /api/jobs, /api/file-moves/*, /api/backup, /api/restore and per-profile progress handlers. Preserve old behaviour or maintain compatibility adapters; no second competing backend.

### Safe server CBR plan (P0)
- Add .cbr recognition and correct Comic classification in scanner kind() and any related metadata/cover/source workflows.
- Reuse or adapt the working Android CBR reader concepts, but DO NOT assume Android native dependencies run on aarch64 Linux/HA.
- Choose a legally redistributable, maintained, bounded RAR reader (RAR4/RAR5 as supported). Verify licences, package/architecture, Home Assistant container restrictions, streaming or per-page extraction, and clean fallback for unsupported/corrupt archives. Avoid unbounded extraction to RAM or persistent disk.
- Enforce compressed/uncompressed byte limits, entry counts, image size, traversal prevention, symlink and decompression-bomb controls. Cache small covers/pages on demand. Seek/pagination must work and be abortable.
- A cleanly reported unsupported RAR variant must NOT be listed as a supported/openable comic. Preserve underlying file and existing catalogue.
- Tests include valid RAR4/RAR5, malformed CBR, password-protected files, large covers, cancellation and concurrent Pi audio playback.

### Server scan and resilience
- Preserve current staged, transactional Go scan and unavailability handling, and existing journaled hash-verified moves.
- Cancellation requires a real per-job cancellable context checked during walking, enrichment, archive processing and before commit. User-visible cancellation cannot simply change the status label.
- Keep source unavailable vs scan failure vs rejected file vs metadata-review distinct. No catalogue wipe on NAS disconnect.
- Bound workers and extracted bytes; default low concurrency on Pi 4; stream/copy only as required; lazy image art. Reuse existing SQLite VACUUM INTO integrity-checked backup and staged restore.
- Scan counts report physical files AND logical works; review count is book/work count. Avoid instant republish, duplicate/rescan loops, overwritten manual fields or vanished reviewed works.
- Default network posture is private/trusted HTTPS/Tailscale or reverse proxy with proper auth. Home Assistant ingress is NOT interchangeable with a mobile-accessible HTTPS origin; no casual public exposure of 5056.

## 3. Server UI final design and interactions

Maintain desktop/16:9 orientation; Archivist navy/ivory-gold/teal, existing wordmark, spacing and typography. Desktop-first, keyboard/touch accessible; responsive narrower browser. Prioritize speed and clarity over 3D or continuous animation.

### Shell/navigation
- Header: Archivist wordmark, current library/source context, search, background jobs indicator, profile menu.
- Left navigation: Overview, Library, Metadata, Review, Scanner, Organise, Family, Health, Settings. Keep lightweight existing Shelf/browse and browser reading accessible. Sticky status for scans, no hidden destructive controls.
- Suggested desktop sidebar around 200–250px with collapsible labels; content pane resizes; page width adapts for HA ingress. This is a design spec, not approved fixed pixel geometry.

### Screen S1: Overview
Top row shows library work count, media types, published, needing review, missing artwork, unavailable sources and recent scan outcome. Each stat links to the exact filtered list. Below: source health, current/recent jobs, last backup, activity, action shortcuts. Separate files vs works in tooltips.

### Screen S2: Library Manager
Persistent search (title, author, series, issue, narrator), grid/list/table toggle, server-paginated results, column chooser, multi-filters for space/source/genre/year/format/availability/review/status, saved views per admin, sortable headers. Table default: cover, title, creator, series number, format, year, source, availability, metadata quality and review state. Checkbox selections persist appropriately through paging and correctly indicate selected count. Context bar: edit metadata, compare/merge (non-destructive preview), assign series, preview organisation, export. No automatically invoked destructive actions.

### Screen S3: Work and Edition detail
Master cover/title/author/series, canonical identifiers, selected work art, format/edition switch, audiobook track list, comic issue ordering, physical source locations and statuses, playback/reading progress by permitted user, metadata provenance, file hashes/duplicates as available, change history. Never equate one file with a whole multipart audio work.

### Screen S4: Metadata Workbench
Three-region layout: current record/locked fields; online/local candidate comparison; proposed field-by-field changes with source, confidence and before/after. Search by title+author, ISBN/ASIN, series+issue. Per-field apply, manual override, lock/unlock with confirmation; cover selection and preview; Save only after validation, reports changed/unchanged/unresolved fields. Bulk edit supports dry-run counts and conflict resolution; no guessing over previously confirmed values.

### Screen S5: Review Queue
Work-centric count, not files; grouped reasons (missing core ID, ambiguous title, no genre, art missing, edition mismatch, unsupported type, permission error). Filters/sort/bulk decisions and direct open editor. Fully reviewed and published works remain visible after refreshing. No one-button auto-approve for low-confidence mismatches.

### Screen S6: Scanner
Sources table, paths/redacted by role, online/missing/permission/idle status, watched frequency, scan-now, cancel and retry. Job row: source, phase, file count, work count, completion %, throughput/elapsed, diagnostics. Show queue position and stable history; accidental double-start guarded. Partial failure preserves last valid catalogue.

### Screen S7: Organise
Use existing filemoves.js and filemoves.go foundation. Template picker, selected source/scope, dry-run preview with before/after full paths, relative move boundaries, collision/conflict/unsupported/error status. Separate apply/verify/undo per journalled operation; no automatic deletion. Cross-drive paths need safe copy/hash/verify and recovery semantics before original removal.

### Screen S8: Family
Admin/user distinction, profile/key management and sessions, library access, clear revoke/rotate confirmation, separate reading histories, owner-only source path visibility. Existing household grants preserved and tested.

### Screen S9: Health and Recovery
Cover/metadata/genre completeness, malformed/unavailable/missing files, duplicate candidates, orphan works, scan-job failures, source outages, SQLite integrity, backup/restore and recent upgrade status. Drill-down to actual records. Health score only if computed transparently; no fake green checks.

### Screen S10: Settings
Library paths, metadata provider choices and rate caps, cache/thumbnail controls, scan scheduling, network/security, per-user access, theme/accessibility, diagnostics, version/upgrade and backup. Advanced actions clearly confirm consequences.

### Visual/interaction acceptance
- Common table/search/filter state across pages; responsive landscape and narrow browsers.
- Real keyboard focus, screen-reader labels, reduced-motion settings, focus trap for dialogs, clear error/retry states.
- Never obscure actual counts, errors or file paths behind artistic effects.
- No Living Book, animated Atlas Universe, Comic Focus renderer, celebration Lotties or live media transcoding on Pi.
- User must approve any visual change that affects the protected mobile experiences; server styling can align conceptually without copying heavy mobile components.

## 4. Release gates and test evidence

### Gate A — Mobile
Real SAF folders, multi-part audiobooks, comic CBZ/CBR/CBT/PDF, EPUB, scanner early cancellation, manual metadata retention, no duplicate works, offline fallback, exact resume, source-switch PDF correctness, portrait/Fold closed/open layout. Dedicated regression tests for all five protected experiences. Comic ERR_ACCESS_DENIED MUST be actually reproduced and fixed, not marked solved based on a WebView watchdog.

### Gate B — Server
HaOS Pi4 4GB+SSD, Docker amd64, source unavailable/disconnect, scan partial failure, cancelled job and restart, work/edition migrations, field locks vs rescan, comic CBR, safe move collisions, SQLite backup/restore integrity, AuthZ and OPDS, library size in thousands and simultaneous audio stream with scanner.

### Gate C — Android Auto
Use existing ArchivistAutoService.kt. Full browse/Continue/Series/Favourites, search and voice, no heavy visual reading in car; audio-focus calls/navigation; steering-wheel controls; local/downloaded playback without Internet; accurate progress when unplugging, reconnecting and switching phone/car. Large snapshot performance; secure server-only catalogue if implemented. Desktop Head Unit and actual physical car acceptance mandatory. Existing local JSON snapshot read in callbacks is a benchmark target, not proof of failure.

### Gate D — Google Play
- As of October 2026, Google requires new Android phone app submissions/updates target Android 16/API 36+ from 31 August 2026 (unless eligible extension); reconfirm at submission: https://support.google.com/googleplay/android-developer/answer/11926878
- Validate 16 KB native page-size compatibility on final signed AAB, not only source manifests.
- Signed AAB, Play App Signing, versionCode/versionName, correct application ID, foreground media permissions and declarations, SAF-first approach, data safety, privacy policy, licenced media samples, accurate listing screenshots and reviewer access.
- If Google account category triggers the 12 testers / continuous 14 days production-access rule, meet it; do not claim it applies without checking account eligibility.
- Android Auto distribution and driver-distraction criteria reviewed: https://developer.android.com/training/cars/media
- Source tests, static APK and CI do NOT mean Google Play acceptance.

### Acceptance test IDs
| ID | Must pass |
|---|---|
| MOB-01 | CBR/CBZ/CBT/comic PDF open after permission/restart; correct page |
| MOB-02 | Scanning 57 audio files as 1 audiobook, 40 novels as 40 works, comic issues separate |
| MOB-03 | Partial scan does not replace published catalogue with incomplete state |
| MOB-04 | Offline downloads open with server completely unavailable |
| MOB-05 | Per-book saved position on restart; no stale PDF image when switching |
| MOB-06 | Fold closed/open and ordinary portrait player, UI locks and accessible taps |
| SRV-01 | CBR scan/cover/open with RAR4/RAR5 support as specified and bounded RAM |
| SRV-02 | NAS outage, cancellation and retry preserve work identities |
| SRV-03 | Field locks survive rescans, provider updates and restart |
| SRV-04 | Safe move preview, collision guard, hash validation and recovery |
| SRV-05 | Per-user permissions for browse, media, progress and OPDS |
| SRV-06 | Concurrent Pi scan plus audiobook streaming without playback interruption |
| SRV-07 | HA/Docker update, backup restore and schema migration preserve state |
| AUTO-01 | Car discoverability, browse and voice action with production-like install |
| AUTO-02 | Calls, navigation, Bluetooth, reconnect and position sync |
| AUTO-03 | Large library browse latency and offline progress stability |
| PLAY-01 | API target/native packaging/signature/privacy/console/cars checks pass |

## 5. Prioritized implementation tickets — GitHub-ready, not created

| Ticket | Priority | Existing issue(s) | Implementation owner/source | Must verify |
|---|---|---|---|---|
| FND-00 exact installed source and guarded integration branch | P0 | #11, #12 contextual | Build provenance / Git | No blind merge, canonical clean |
| MOB-16 comic access / source routing | P0 | #16 | App.tsx, localReader.ts, archiveReader.ts, comicReaderWebViewSource.ts | Real file WebView permission + comic gestures intact |
| MOB-15 scanner reliability/metadata publishing | P0 | #14, #15 | localLibrary.ts, metadataSync.ts, scanFeedback.ts, native scanner | Count/persistence/publish real library |
| SRV-CBR scanner & reader | P0 | NEW | archivist/app/main.go, reader.go, metadata.go + Go tests | CBR support or truthful unsupported reason |
| API-01 stable work/edition identity and capabilities | P0 | #36 related | catalogue.go, serverCompatibility.ts, database migrations | Renames/restarts/offline preserve IDs |
| MOB-31 offline source precedence | P1 | #31 | librarySources.ts, offlineLibrary.ts, App.tsx | Download first when disconnected |
| MOB-23/32 resume and PDF state | P1 | #23, #32 | stateStore.ts, LocalPdfReader.tsx | Position persists/no stale source |
| SRV-META field locks + candidate workbench | P1 | #33 | organise.go, metadata.go, web/organise.js | No silent overwrite; genre coverage |
| SRV-UI advanced workbench | P1 | #35 related | web/index.html, app.js, catalogue.js, style.css | Sorted/paginated table and fast review |
| SRV-SCAN cancellation/health | P1 | #35 related | background.go, main.go | Genuine stop and durable status |
| SRV-ORG safety + backup | P1 | existing modules | filemoves.go, backup.go, web/filemoves.js | Preview/undo/restore validated |
| MOB-UX narrow scope | P1/P2 | #17, #18, #22, #24, #26-30 | User-approved UI changes only | Physical Fold/portrait visual contract |
| AUTO-QUAL playback and voice QA | P0 gate | #4 | mobile/android/.../ArchivistAutoService.kt, androidAuto.ts | DHU/real car, no rebuilt framework |
| AUTO-SRV secure online/offline audiobook catalogue | P1 | #4 related | existing Auto snapshot + server streaming | Car browse with server; offline safety |
| PLAY-TECH release technical package | P0 gate | NEW | Gradle, manifests, CI | Signed AAB, target SDK, 16 KB, compliance |
| PLAY-LISTING reviewer/disclosures | P0 gate | NEW | Privacy/Play Console/listing assets | Account-specific test gate and review |

Avoid duplicating open issue #33/#35/#36 when writing subtasks. Retain post-v1/optional issues #34, #37, #38, #39 without reclassifying into blocking core tasks.

## 6. Execution order for one controlled Work session

1. Read this complete document and Appendix A, GitHub issue list and actual branch/commit list. Verify installed APK. Do not write code before base branch is explicitly chosen.
2. Report technical deltas and risks against user-protected mobile modules. Keep tests as evidence, not substitutes for device results.
3. Wave A: mobile core P0 comic and scanner plus P1 progress/offline/PDF, isolated changes with tests.
4. Wave B: shared identifiers, server CBR, metadata field locks, web workbench and resilient Pi jobs. Android Auto hardening can run alongside, but not by rewriting Media3 foundation.
5. Wave C: integrated device/Pi/car acceptance, fix only evidenced regressions, prepare signed AAB and Play listing disclosures.
6. Each code chunk requires reproducible failing case, minimal patch, tests, regression evidence, commit, user-visible change log and pass/fail status. Do not declare 100% commercial quality before testing.
7. Do not develop the Windows sorter or redesign the five protected mobile experiences. Do not publish/merge/install on user's device without explicit permission.

## 7. Source/reference map

- Canonical: https://github.com/russellstokes-ai/Archivist/tree/df4c39b
- QA comparison: https://github.com/russellstokes-ai/Archivist/compare/df4c39b...131cabd
- Basic UI animation checkpoint: https://github.com/russellstokes-ai/Archivist/blob/131cabd/docs/ARCHIVIST_BASIC_UI_ANIMATIONS_CHECKPOINT_2026-10-11.md
- Rewards animation checkpoint: https://github.com/russellstokes-ai/Archivist/blob/131cabd/docs/REWARDS_LOTTIE_CHECKPOINT_2026-10-11.md
- Existing server Go catalogue: https://github.com/russellstokes-ai/Archivist/blob/df4c39b/archivist/app/catalogue.go
- Existing server scanner: https://github.com/russellstokes-ai/Archivist/blob/df4c39b/archivist/app/background.go
- Existing server metadata editor: https://github.com/russellstokes-ai/Archivist/blob/df4c39b/archivist/app/organise.go
- Existing server comic reader: https://github.com/russellstokes-ai/Archivist/blob/df4c39b/archivist/app/reader.go
- Existing file move journal: https://github.com/russellstokes-ai/Archivist/blob/df4c39b/archivist/app/filemoves.go
- Existing native car service: https://github.com/russellstokes-ai/Archivist/blob/131cabd/mobile/android/app/src/main/java/app/archivist/reader/ArchivistAutoService.kt
- Existing server UI: https://github.com/russellstokes-ai/Archivist/tree/df4c39b/web

---

# Appendix A — Approved Archivist v1.0 Master Development Plan (12 October 2026)

The following text is the original full master plan, incorporated verbatim for continuity. In a technical conflict, the strictest protected-feature requirement applies; later verified findings in sections 1–7 refine rather than remove baseline scope.

# Archivist v1.0 — Final Master Development Plan

**Approved planning baseline:** 12 October 2026  
**Status:** Master scope / requirements and acceptance plan. **Saving this document does not authorise code, UI, asset, APK, container or production release changes.**  
**Products:** Archivist Android mobile, Android Auto audio, Archivist Server for Home Assistant (plus standalone Docker/web), and Google Play distribution.

## Product goal

A premium, dependable, privacy-first book, audiobook and comic library. **Mobile** is for reading, listening, discovery and offline use. **Server** uses the same Archivist branding and visual conventions but focuses on BookOrbit-style, advanced and efficient media-library management. **Android Auto** is a polished, safe audiobook app. Mobile must work without the server.

## 0. Mandatory protections and exclusions

1. **LOCKED and already working—do not modify as general polish work:** (1) Shelf / Continue Reading or Listening layout, (2) Living Book rendering, geometry and page-turn animations, (3) Comic Focus / speech-bubble zoom interaction, (4) Atlas Universe, rings/charts and interactions, (5) Stats and Rewards design/presentation. No redesign, asset replacement, expanded animations or unrequested visual changes. Preserve approved icon, typography and dark navy / warm ivory-gold / teal language.
2. A bug reported *in* one of these protected experiences is not authorisation to rewrite it. For unresolved issues #19 (Atlas blank), #20 (reward animations) or #25 (Living Book intermittently absent), first reproduce and diagnose; propose a strictly isolated fix and obtain specific approval before touching protected modules. Comic format/permission fixes outside Comic Focus are in scope.
3. Source control: canonical full-app reference **df4c39b** on `canonical/archivist-20261011-df4c39b`. Later APKs/branches are not interchangeable. Identify the installed APK's exact source SHA and preserve working improvements in the approved test build before implementation. Never merge stale `main` blindly.
4. **Exclude Windows sorter development and dependencies.** Scanner/library features must function independently of that tool.
5. **Remove the previous standalone Step 4.** Test and acceptance activities run within every development wave. Store-release checks are mandatory deliverables, not a separate old app-development step.
6. No destructive actions from scan, cover lookup or metadata enrichment. File organisation requires dry run, conflict validation, explicit consent, journal and recovery. No automatic duplicate deletion.
7. Raspberry Pi server deliberately omits Living Player/Living Book, Comic Focus rendering/visual processing, elaborate live Atlas animation, rewards/celebration rendering, and default server-side transcoding. Allow simple lightweight HTML5 audio/ebook/comic reading where feasible.
8. Do not promise native Android, Fold, Pi, car, or Play acceptance solely because unit/source tests pass. Real hardware acceptance is required.

## A. Android mobile: required development

### P0 — core failures and library truth

| Reference | Scope | Acceptance |
|---|---|---|
| [#16](https://github.com/russellstokes-ai/Archivist/issues/16) Comic Reader | Investigate `2000AD Annual 1978`: `UNSUPPORTED` and `net::ERR_ACCESS_DENIED`. Separate classification, SAF permission persistence, content URI, WebView origin, archive decoding and unsupported/corrupt cases. **Preserve Comic Focus.** | Real CBZ, CBR, CBT, comic PDF files open, paginate, resume, survive relaunch, and accurately report missing permission. |
| [#15](https://github.com/russellstokes-ai/Archivist/issues/15), [#14](https://github.com/russellstokes-ai/Archivist/issues/14) scanner | Large folders, bounded native reads, cancellation, background progress, metadata search/edit persistence, physical-file vs logical-work identity, comic issues, multipart audio, covers, genre/year, publishing and review queues. | No hangs, ghost rescans, lost manual edits, orphaned published works, incorrect work counts, or destructive modifications. |
| Catalogue/source state | Distinguish valid/unsupported, access denied, moved, unavailable, corrupt, review needed, published. | User sees comprehensible reason/retry; supported inaccessible files not silently hidden or misclassified. |

### P1 — targeted reliability and UX

| Reference | Scope | Acceptance |
|---|---|---|
| [#17](https://github.com/russellstokes-ai/Archivist/issues/17) | Centre **existing** playback button/glyph; preserve all dimensions, adjacent seek controls and approved player arrangement. | Visually/physically centred on standard phone and Fold closed/open for Play and Pause. |
| [#23](https://github.com/russellstokes-ai/Archivist/issues/23) | Remove extra Resume prompt; restore per-title ebook/comic/audio position after app/background/device restarts; never unexpectedly play audio. | Immediate last-position reopen with durable persisted state. |
| [#31](https://github.com/russellstokes-ai/Archivist/issues/31) | Confirm/fix server-preferring downloaded-copy logic when offline. | Usable offline copy survives disconnected server and reconnect. |
| [#32](https://github.com/russellstokes-ai/Archivist/issues/32) | Investigate PDF page/image residue when changing documents. | Exact correct document and saved page, no stale image. |
| [#24](https://github.com/russellstokes-ai/Archivist/issues/24) / [#27](https://github.com/russellstokes-ai/Archivist/issues/27) | Remove Unsupported and PDF standalone library tabs. Classify PDF into Books/Comics based on evidence; ambiguous ones remain reviewable. | Counts and source filters remain accurate; no physical files altered. |
| [#28](https://github.com/russellstokes-ai/Archivist/issues/28) / [#29](https://github.com/russellstokes-ai/Archivist/issues/29) / [#30](https://github.com/russellstokes-ai/Archivist/issues/30) | Standardise tappable affordances, typography, responsive text and Settings without redesign. | No awkward 'Audiobooks' one-letter wrapping, dead controls, clipped text or unreadable touch targets. |

### P2 — finish without changing protected visual experiences

- [#18](https://github.com/russellstokes-ai/Archivist/issues/18): eliminate white launch flash with approved brand colour and launch transition.
- [#26](https://github.com/russellstokes-ai/Archivist/issues/26): consistent bottom-navigation selected, pressed and disabled states.
- [#22](https://github.com/russellstokes-ai/Archivist/issues/22): obvious local avatar selection, replace, crop and restore; preserve existing avatar styling.
- Robust loading/empty/error states, no raw technical messages, reliable search/cached artwork and offline download queue, safe storage reporting, background audio focus, Bluetooth and headphones, lightweight haptics and accessibility. **Do not apply enhancements to the five locked experiences unless separately approved.**
- [#19](https://github.com/russellstokes-ai/Archivist/issues/19), [#20](https://github.com/russellstokes-ai/Archivist/issues/20), [#25](https://github.com/russellstokes-ai/Archivist/issues/25): **recorded existing bugs only**. Confirm against accepted installed APK and obtain permission for a minimal scoped repair before editing protected components.

### Additional known static review risks (not confirmed on-device)

- Wrong comic format routed as generic URI reader instead of archive decoder.
- Local Atlas publication filtering may exclude works despite an apparently populated Library.
- Offline source selection gives server higher priority without availability awareness.
- PDF image/page state may outlive source URI switch.
- Large archives may load base64 into JavaScript memory if native path unavailable.
- Source-level comic watchdog and Lottie tests don't establish real Android WebView/visual reliability.

Each risk must be reproduced before being treated as a confirmed fault.

## B. Archivist Server (Home Assistant + Docker + web)

**Design principle:** Same high-quality Archivist visual identity, screen conventions, search/filter meanings and media identities, but desktop/16:9-first and with sophisticated **library administration**. Do not port costly mobile animation/rendering. Existing Go/SQLite server, web UI, add-on config, scanner jobs, backups, household permissions, streaming and OPDS are foundations to retain.

### Server v1.0 features

1. **Advanced Library:** Cover grid, list and real data-table views; sort, powerful combined filters and saved views; title/author/series/issue/narrator, edition/format/source, status, missing metadata/artwork, unread, missing files.
2. **Metadata workbench:** Candidate search and comparison, confidence and provenance for each field, lock verified fields, publication year vs edition year, manual and bulk safe edits, selected covers, preview/undo and durable persistence through rescans.
3. **Series, editions and comics:** Logical work vs physical file, edition/format choice, reading sequence including fractional issues, next-in-series, missing issues, multi-track audio as one work, individual comic issues with series relationships.
4. **Scanner control:** Multiple paths/libraries and independent spaces, watched and incremental scans, stage progress and times, cancellation/recovery where actually supported, targeted retry, no publication-loss on partial failure, low-memory bounded pipelines, NAS absence diagnostics.
5. **Library health:** Work counts vs file counts, staged/discovered/review/published status, genre/year/cover coverage, permissions, missing sources, malformed files, hash-verified duplicate candidates, per-library source status, read-only export.
6. **Organise/recover:** Preview-first metadata/sort operations, collision prevention, whole-work safety, transaction history, recoverable interrupted moves; no deletion or overwriting without explicit confirmation.
7. **Household:** Admin/User scope and grants, separate saved reading/listening state, explicit sessions/key rotation and revocation, stable permission isolation for media and OPDS.
8. **API, player and remote:** HTTPS/trusted LAN, mobile streaming/download and chapter support, HTTP range seeking, compatibility checks, robust connection failure, OPDS; lightweight web audio/ebook/comic reader only.
9. **Deployment:** Home Assistant ingress and standalone direct API separated correctly, aarch64 and amd64, Pi 4-class resource caps, database backup/restore/migrations, safe upgrades and persistent `/data`, no unintentional public exposure.
10. **UI:** Lightweight Archivist-styled 16:9 administration, Overview, Libraries, Scanner, Review, Metadata, Organise, Family, Health, Settings, Recovery. Retain access to existing Shelf and browsing functions; no blanket redesign without approval.

### Server risks / acceptance ledger

| ID | Priority | Investigate / validate |
|---|---|---|
| SRV-01 | P0 | Missing/disconnected NAS retains indexed catalogue with truthful unavailable flags. |
| SRV-02 | P0 | Jobs survive restart, failure and interruption; actual cancellation truthful, no duplicate loops. |
| SRV-03 | P0 | Server and mobile agree on work identity, grouping, metadata and comic/audio formats. |
| SRV-04 | P0 | Versioned mobile/server API and backward-compatible data migrations. |
| SRV-05 | P1 | Pi 4 CPU/RAM/SSD budget under concurrent streaming and scanning; resource caps and caching. |
| SRV-06 | P1 | Per-profile authorization on search, media, progress, downloading and OPDS. |
| SRV-07 | P1 | Direct API, HTTPS, Tailscale/reverse proxy, expired credentials and reconnection. |
| SRV-08 | P1 | SQLite integrity/backup/restore/upgrade and error recovery; protect personal state. |
| SRV-09 | P1 | Web dashboard accessibility, performance, progress, errors and responsive layout. |
| SRV-10 | P2 | Safe organisation preview and journal-based rollback validation. |

## C. Android Auto — mandatory v1.0 polish

- **Audiobooks only**; no ebook/comic screens, Living Book, heavy art or editing.
- App consistently discoverable in production Android Auto; no developer mode requirement.
- Safe browsable audiobook categories: Continue Listening, Library, series, recent works and optional downloads; correct title, cover, author, current chapter and progress.
- Play/pause, skip, seek, next/previous chapter where appropriate, audio focus for calls/navigation, media hardware controls and system UI; accurate MediaSession metadata/state.
- Voice browsing/search and playback commands via supported Google Assistant / Gemini automotive integrations; graceful unsupported command response.
- Exact durable position across vehicle reconnection, process restart, Bluetooth changes and interrupted audio.
- Server disconnect -> usable downloaded audiobook fallback; no unexpected duplicate streams.
- Performance and distraction restrictions per Google's car app quality tests. Run Android Auto Desktop Head Unit and real vehicle/host acceptance; Android Automotive OS is a separately evaluated later target.
- Verify native MediaLibraryService and MediaBrowserService setup already present, rather than replacing it.

## D. Google Play publication for Android application

**Distribution is Google Play Store, category Books & Reference (not Google Play Books publisher programme).** DRM-protected Play Books content is not included or assumed accessible.

1. Production-signed Android App Bundle `.aab`, stable application ID/versionCode, Play App Signing, private secure signing and validated update migration.
2. **Target Android 16 / API 36 or later** for new phone-app submissions under the current August 2026 policy; verify requirement again at actual submission. Native ABI 64-bit and **16 KB page-size** compatibility including RAR/archive/SQLite/other native libraries.
3. Foreground media playback service declarations, appropriate notification/storage permissions, SAF-first folder permission strategy; avoid all-files access (`MANAGE_EXTERNAL_STORAGE`) unless indispensable and expressly eligible. Audit all manifest declarations and policies.
4. Complete Google Play Console **Data safety**, privacy policy URL/in-app entry, user data handling, target audience, content rating, app access declarations, permissions justification, advertising/payment/account-deletion rules if applicable, licence and third-party asset compliance.
5. Store listing: approved icon (512x512), feature graphic (1024x500), accurate screenshots (phone and supported form factors), truthful description, support email/site and release notes.
6. Provide licence-cleared testing files and reviewer instructions, demo credentials if a server account is required for any tested feature; **mobile must remain useful without server**.
7. Run Play pre-launch, Android 16 native/16 KB emulator/device, Fold open/closed, accessibility, cold/upgrade tests, crash/ANR and real-media checks. Complete closed testing/production access rules applicable to the developer account (e.g. qualifying newer personal accounts require 12 testers for 14 consecutive days).
8. Android Auto needs its own car-app quality, vehicle-safe UX, background media and voice/service discovery acceptance. Approval is not guaranteed in advance.
9. Do not promise rights to copyrighted ebooks/audiobooks or bundled third-party media; confirm terms for optional online metadata providers.

## E. Delivery plan and acceptance

### Wave A — core reliability
Trace installed APK SHA; pin source; fix core media access and scanner/categorisation, resume, PDF/offline state, play control. **Protect the five locked experiences.** Native Fold tests and source-level regression per feature.

### Wave B — server + car
Extend Go/SQLite/Home Assistant server using existing implementations; implement lightweight BookOrbit-style management without costly server-side animations; align shared contracts, provenance and household rights. Polish Android Auto end-to-end; Pi/network and car acceptance within wave.

### Wave C — commercial finish + Play
Apply only agreed app-wide interaction/navigation/settings/profile polish; crash/ANR, performance, battery and accessibility checks. Finalise store disclosures, assets and signed AAB. Submit after each previous wave's acceptance passes.

### Cross-product acceptance gates

- Supported CBZ/CBR/CBT/EPUB/PDF/MP3/M4B from representative real, large and malformed libraries.
- Correct logical work and unique comic-issue counts; no incorrect multi-novel merge; scanner can stop/recover; manual metadata survives rescan; missing files never silently deleted.
- Phone/Fold UI, restart, rotation/layout changes, auto resume, audio focus, streaming/download/offline fallback and accurate save state.
- Server Pi 4 HAOS ingress, add-on update, mounts/disconnection, SQLite backup/restore, RAM/CPU under scan + streaming and role security.
- Android Auto browse/voice/transport/distraction/real-car acceptance.
- Google Play submission requirements and review readiness.
- **No modifications** to protected five without separately documented approval and before/after device evidence.

## F. Work that can be completed in ChatGPT before a Work development session

- Keep this document as the scope of record; reconcile duplicates in the GitHub issue ledger and assign priorities.
- Write detailed acceptance matrices and regression fixtures (descriptions; no user-private paths in public GitHub).
- Define shared API and state schemas, metadata confidence/field-lock semantics and per-user progress reconciliation.
- Produce exact server UI information architecture and wireframes for approval, then freeze visuals.
- Produce Android Auto browser tree, transport/voice test matrix and Google Play release-compliance artefacts.
- Identify installed APK and relevant feature-branch provenance **before modifying source**.

**Implementation intentionally deferred until explicitly approved.**

