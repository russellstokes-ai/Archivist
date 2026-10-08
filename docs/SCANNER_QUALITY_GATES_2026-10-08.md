# Archivist scanner — locked acceptance contract and Gate 1 baseline
Date: 2026-10-08
Status: **GATE 1 IN PROGRESS — documentation and regression-fixture preparation only. NOT TESTED / NOT RELEASE READY.**
Active isolated branch: `feature/scanner-quality-gates-20261008`
Parent baseline: `feature/test21-scanner-and-book-loader-20261008` @ `aeefd4dc89c4de1c81b7e03eb998ae858da6aaff`
Earlier reliability baseline: `integration/test18-reliability` @ `002fb184d2a64abdeebbe224d7deb81fbf63eb30`
Recoveries: `checkpoint/test18-before-architecture-20261007`; `canonical/archivist-test13`; `ui-lock/0.9.5-test13-baseline`.
**Do not reset, merge, force-push, overwrite or replace these baselines.** Do not work from `main`.

## Non-negotiable user decisions (LOCKED)
- Three sequential onboarding stages: **(1) Find Folders / discover and group (typically 1–5 folders), (2) Identify Books & Covers (explicit user button; reconcile embedded/sidecar/online metadata and artwork), (3) Needs Attention (minimal, work-level exceptions)**. Each finished stage visibly advances/highlights the next; after completion the onboarding goes away. Subsequent scans live in Settings.
- Canonical mobile, phone and Fold open/closed UI, five-button nav, mini player, Library, Shelf, Atlas, Stats, Reader, Live Player, profile, colours, halo, typography and motion **remain locked**. Only three narrowly authorised UI changes: (a) regressions in Smart Search/Save graphical button rendering must be repaired/tested if reproduced; (b) existing Book Loader animation modestly enlarged with adaptive phone/Fold sizing, respecting Reduced Motion and current colour/fade; (c) the explicit second onboarding button and consequent stage feedback. No unrelated spacing/text/layout redesign; do not overwrite the canonical Fold snapshot or automatically update visual baselines.
- **No new paid subscriptions, providers, AI models, cloud services, credits, commercial tools or build costs.** Existing GitHub/Playwright/Superpowers, free local test runners, Context7 and optional free/open metadata providers within limits only.
- Raw/discovered files stay backstage, separate from published library. Never auto-move/rename/delete source media during scanning. Smart Organiser requires explicit preview and book-by-book approval.
- First usable correctly identified books publish progressively with valid cached library artwork. Distinguish authentic square audiobook art from portrait Living Book rendering; missing portrait art uses safe jacket fallback and must not prevent ordinary library publication. Manual user corrections and artwork are authoritative. Do not silently publish weak matches or cause accepted-but-cover-pending works to disappear from both Shelf and Needs Attention.
- Expensive parsing, network, covers and hashing off the interactive UI path, queued at **work/edition** level rather than per chapter. Bound resource/time cost per operation, cancellation, checkpoint/restart, error isolation, incremental rescans and idempotent writes.
- Work / edition / physical-file identities are distinct. Do not merge distinct books in series, collapse individual comic issues, or split one audiobook into chapters. Genre provenance/normalisation must support Atlas without inventing genres.
- Only release a signed APK after the complete gating evidence and native Fold acceptance; no claims of release readiness from a source-string or web test.

## Evidence: TWO DIFFERENT benchmark scales
### Real Windows/NAS inventory (primary grouping benchmark; NOT verified match ground truth)
`audiobooks-Windows-raw.json` (2026-10-08): `\\192.168.1.119\media\Audiobooks\Audiobook`, 1,821 audio files, 153 scanned directories, 45 ebooks, 33 sidecars, 25 ambiguous PDFs, elapsed 26,672 ms **including 351 sampled media headers**.
`comics-Windows-raw.json`: `\\192.168.1.119\media\Comics`, 4,664 comic archives, 272 scanned directories, 229 ambiguous PDFs, elapsed 36,797 ms **including 339 sampled media headers**.
These manifests contain names/paths/properties and sampled headers, NOT verified book/issue identities or complete embedded tags. They must become *redacted, deterministic test fixtures plus separately validated golden identity mappings*. Do not upload private absolute filenames to public repos without sanitisation. Do not equate number of audio tracks, comic archives, volumes or folders with book count.
Grounding cases to verify against actual paths:
- `James S. A. Corey/The Expanse/narrated by Jefferson Mays/1.0 - Leviathan Wakes`: one audiobook edition across ordered tracks, not the whole series.
- `The Expanse/0.2 - The Churn (novella)`: separate novella/series position and narrator/edition.
- `Terry Pratchett/Discworld`: a multi-book series folder, NEVER one book.
- `Warhammer Audiobooks/Dark Angels/Malediction/01 Track 1.mp3`: generic chapter filename derives work from ancestor context.
- `ConanTheBarbarian-001to260-Many`: separate comics/issues, NOT one 260-file book.
- `Judge Dredd - The Complete Case Files (v01-v27+)(digital+Scans)`: distinguish collected volumes vs individual issues/specials.
- `Red Sonja (Marvel)/Misc/Conan - The Ravagers Out of Time.cbr`: misleading parent folder must not override explicit comic identity.
**Before accuracy claims:** select 150–250 varied works/issues, manually verify authoritative work/edition/file associations, with separate untouched holdout examples. Exact sample size and labels must be recorded. File-only manifests cannot verify full local cover extraction.

### Actual Android phone pipeline (secondary latency / UI responsiveness benchmark)
`archivist-pipeline-diagnostic-1791480591691.json` 2026-10-08:
342 physical files discovered in 1,897 ms; 119 preliminary logical works → 89 later audio groups; embedded audio 75 files/101,823 ms; online sample 16 works/32,829 ms; local cover recovery 332 attempts/344,458 ms; 0 published, 89 Needs Attention; JS heartbeat worst recorded delay 7,906 ms.
A finished pipeline that publishes zero despite many cover recoveries is **failure**. Avoid per-file cover extraction, synchronous full-catalogue regrouping and blocking publishing on optional Living Book art.
Previously verified synthetic Test20 RED `226 files -> 226 groups` instead of 12. Subsequent fixes claim `226/12` (also Test21 `227/12`) in fixtures only; physical Fold run remains to be verified. Retain both negative fixture for multiple distinct albums in same folder and positive fixture for incomplete/disc-qualified tags.
See `docs/SCANNER_TEST14_TEST20_PERFORMANCE_AUDIT_2026-10-08.md`, `docs/TEST20_WORK_GROUPING_REGRESSION_2026-10-08.md`, `docs/TEST21_SCANNER_LOADER_SPRINT_STATUS_2026-10-08.md` and reliability handover. Test21 includes native FastSafDirectory, selective audio probe and BookLoader, but **is not signed off**.

## Engineering design / single-pipeline boundaries
1. **Discovery & indexed properties:** native background SAF/OS or server-native bounded folder traversal, returned in batches; persist physical files and folder hierarchy, size/time/stat info, skip known unchanged entries.
2. **Provisional identity:** separately model work, edition, physical file, track/chapter, comic issue, comic collection and series. Use filename, folder ancestry, ID3/MP4 tags, EPUB OPF, ComicInfo, sidecars, sequence and identifier evidence. Root/mixed folders cannot be assigned wholesale. Stable provisional IDs, evidence/provenance, explicit split/merge reasons.
3. **Selective evidence escalation:** representative 1–3 file probes for confident multipart audio; additional per-work probes only on contradictions; native structured metadata, bounded EPUB/CBZ/CBR/PDF reading and isolated timeouts. No catalogue-wide deep parsing, no full archive copying, no mass Base64 I/O to JS.
4. **User-triggered reconciliation:** after Find Folders, Identify Books & Covers performs cached and rate-limited work-level provider candidate lookup, validates title/author/series/edition/issue against local evidence, resolves artwork, normalises genres and supports offline mode. Safe local cover/first-page fallback when applicable; no remote match accepted purely on title similarity.
5. **Atomic publishing / review:** publish only ready work revisions with locally cached cover and credible identity; one unresolved attention item per work/group, never per chapter; committed work edits stay on disk after app restart, rescans and migration. Already published works remain visible until replacement is validated. No fake progress percentage.
6. **Resilience:** isolated bounded workers, cooperative yielding and UI thread safety; permanent scanner state in SQLite, cancellation and restart, per-provider circuit breakers, error diagnostics, backpressure and incremental snapshots. Server uses the same identity/metadata contracts with more efficient native file access, no requirement for a server to use the phone app.

## Six mandatory gates (NO SKIPPING)
- [ ] **Gate 1 — lock and safety**: inspect current baseline/Test21 diff, relevant source modules, existing tests, CI, branch isolation, rollback, canonical UI snapshots, real diagnostic fixtures. Record unverified claims clearly. No app changes before this evidence.
- [ ] **Gate 2 — identity accuracy:** file + work + edition + issue grouping tests, 226/12, 227/12, 18/1, mixed album negative, Expanse/Discworld/Conan/Judge Dredd, hidden holdout fixtures. Must not get correct count by accidental merging. Track identity/ordering preserved. First failing behavioral tests before fixes.
- [ ] **Gate 3 — metadata/cover:** bounded representative reads, source-provenance merge, real provider/offline fallbacks, field-level manual locks, comic/EPUB bounded metadata and cover, cover dedup/cache. Wrong-match false positives measured separately.
- [ ] **Gate 4 — publication & transaction:** one true workflow; clue-save vs accept separated, failed cover/transaction recovery, no disappearing works, 0 published regression eliminated, restart/edit/rescan preserves snapshots.
- [ ] **Gate 5 — performance & UX:** native per-stage timers/JS jank, worst-case slow/corrupt media, 10k/50k logical stress with bounded memory, cancellation and incremental scan tests; Playwright snapshots and Android-native interaction tests; only three approved UI changes.
- [ ] **Gate 6 — candidate APK:** mobile full tests+typecheck, native Android & iOS checks where available, source/dependency audit, Playwright UI, APK signature/size/version, emulator and real Fold open/closed; no merge to main without user approval.

## Reporting / release policy
- Every defect: reproduce -> failing behavior-level test -> root cause -> smallest correction -> focused tests -> full suite -> real symptom verification.
- Never change visual baselines to make a regression pass.
- No claim of PASS based on a plan, unrun script, only source inspection, synthetic paths or CI from a different SHA.
- Gate status reports state commit, precise checks actually executed, pass/fail, blockers, recovery pointer, next permitted step.
- Target accuracy (not yet measured): >90% correct work grouping, stretch 95%; initial enriched records 75–85%; false merges a separate release-blocking metric. Performance targets are milestones until instrumented.
- Keep current published UI and entire staging DB intact through upgrades; no reset, mass purge or destructive schema migration.
- Next: create a compact, **sanitised** representative golden fixture mapping from NAS inventories; inspect work identity code and native worker contract; add first failing tests WITHOUT changing production scanner until Gate 1 passes.
