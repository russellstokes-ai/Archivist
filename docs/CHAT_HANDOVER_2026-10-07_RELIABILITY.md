# Archivist reliability handover — stopped at user request

**Status: work in progress, not release-ready. No new APK was built or started.**
User stopped implementation on 7 October 2026 at approximately 22:32 Europe/London because usage was low. Resume only when asked. Preserve the checkpoint and approved UI. Keep further communication and tool output concise.

## Paste into the next chat

Continue Archivist from `integration/test18-reliability`, reading this handover and the approved specification before changing code. Test 18 rollback is `checkpoint/test18-before-architecture-20261007`. Do not start from main, revert layouts, or repeat the earlier speculative footer fixes. Current work is an unfinished checkpoint, not an accepted release. Finish behavioral verification and outstanding architecture work before an APK. Minimize usage, preserve state, and stop/report once the eventual APK build is running, with links.

## Repository and recovery

- Repository: https://github.com/russellstokes-ai/Archivist
- Working directory in this session: `/workspace/scratch/0a5b4bcfacc5/Archivist`.
- Canonical new branch: `integration/test18-reliability`.
- Remote Test 18 baseline: `461694e3b821742b2d2d0fdbb1a56357079abdca`.
- Local equivalent baseline: `08b5154cf6cf0e063ff11c09d3a56743a04f7599`.
- Both baseline trees: `e1b27c1038ce8639daa6442719ff9dc99d83588d`.
- Saved rollback branch, local and remote: `checkpoint/test18-before-architecture-20261007`. Do not move or overwrite it.
- Integration remote before this handover checkpoint: `9d84ee5fbd5e5f1cbf54907651b28ab7abb55d3a` (approved design). Local equivalent: `1383a52`.
- Original feature branch `fix/test13-scanner-commercial-20261007`, draft PR #14 targets `dev/test13-canonical-media-pipeline`. Main untouched. New integration work has not been merged into that PR or main.
- The commit containing this handover preserves the current unfinished source. Use its SHA, or the current integration head, for continuation.
- Source rollback: create a separate branch from the checkpoint; do not reset over unsaved changes. Database rollback also matters: new native code creates a one-time `local_assets_test18_backup` table before mutation; web code saves `archivist.localStage.web.v1.test18-backup`. These are newly implemented and have not been exercised on a real device. No user device has received these changes.

## Approved scope and method

Read `docs/superpowers/specs/2026-10-07-library-reliability-design.md` (user approved), `docs/superpowers/plans/2026-10-07-library-reliability.md`, and its progress ledger. Six tasks cover publication/editor, durable state, bounded archive evidence, providers/UI filters, native footer/Living Book, performance/release.

User requires reproduce → failing behavioral test → root-cause fix → focused/full suite → real symptom validation. After three unsuccessful fixes, reassess architecture. UI is locked except defect-specific editor/layout fixes. Never claim source-string tests or emulator launch alone prove workflows. Physical Fold closed/open, keyboard, rotation, scrolling, results and footer presses remain acceptance requirements. Do not reintroduce catalogue-wide Deep Search/full-file archive reads.

## Changes implemented in this checkpoint

### Metadata and publication

- `LocalBook` now has optional `identificationState` (`unresolved`, `clues-saved`, `accepted`), `manualOverride`, and `publishedSnapshot`.
- `metadataSearchWorkflow.ts`: saving clues preserves existing explicit acceptance but otherwise creates `clues-saved`; accepting a book/comic candidate explicitly sets `accepted`. Physical embedded chapter/disc/track data remains intact.
- `publicationPipeline.ts` blocks explicit unresolved/clue-only works even if grouping infers a confident identity. New `localWorksForReview` derives visibility/reason from the publication gate, including missing or uncached artwork.
- App editor now invokes the shared production clue/candidate functions. Author-only or ISBN-only clues can be saved. Save stays open. Selecting a result changes the action label to `Accept & Save`. Clue saves avoid artwork download unless the work was already accepted. Accepted artwork failures remain in Needs Attention with a message.
- Review counting continues to group logical works, now using publication assessment instead of only raw `needsReview` flags.

### Durable edits and catalogue retention

- `persistWorkEdit` now calls a storage transaction, storing manual overrides in the same book payload instead of first writing a separate overrides file.
- Native `commitLocalWorkEdit` serializes transactions, compares expected payloads and patches only selected URIs. A conflict aborts all selected-row writes. Tests exercise real SQLite through an Expo API adapter.
- Bulk metadata edits now load the complete stage and patch selected records instead of replacing the stage with the published subset (which deleted pending records).
- Startup merges durable row overrides over the legacy overrides file. Explicit “Use scanned metadata & cover” clears the row override/state before rescanning.
- Scanner reconstruction retains explicit acceptance and artwork slots when overrides remain; an actual scan test reproduced their previous loss.
- `retainPublishedSnapshots` stores one nonrecursive prior published version for incomplete replacement rows. `restorePublishedCatalogue` restores the last good publication across restart. Native replacement and edit transactions use this; web storage now serializes mutations and does equivalent retention.
- This is unfinished architecture: inspect every writer, especially native `upsertLocalStageBooks`, migration/restore, stale editor revisions and scan-generation interactions before calling atomic publication complete.

### Living Book

- Added `living-book-canvas-lifecycle.test.cjs`: executes the actual renderer JavaScript in a VM with a Canvas API stub and controlled time; it observes state without replacing the renderer implementation. It is not a visual/GPU/device test.
- The test reproduced: opening used 1500 ms instead of canonical 900; ambient page used 1900 instead of 3000; a paused settled leaf remained active during closing; unchanged chapter messages reset the physical page after reopening.
- Canvas and App now use shared open/close/ambient timing constants. Closing from settling commits the leaf. Renderer tracks the last chapter number separately from the physical leaf.
- Added canonical skip/multi-skip/rest/settle constants. **Still audit skip timing:** App uses 1040 ms for a six-page skip but Canvas only receives a boolean and uses 780 ms. Initial mounting mid-transition and remount/leave/reentry continuity also need more coverage.
- Removed one old source-string assertion that enforced the incorrect 1900 ms timing. Most old source-string tests still remain and must not be presented as behavioral proof.

## Evidence and exact verification limits

- New publication lifecycle test first failed because saving clues with local artwork published the work. After changes, it passed clue/accept/restart/artwork-blocking/chapter-preservation checks; extended tests passed last-good publication restoration.
- Updated real SQLite test passed transactional selected-row persistence, disk reopen, failed write detection, stale second-row rollback and preservation of unrelated rows.
- Actual scanner test first failed to preserve `identificationState`; after the targeted change, `local-library.test.cjs` passed.
- `living-book-canvas-lifecycle.test.cjs` observed the three failures sequentially and passed after the targeted timing/leaf fixes.
- Latest completed full suite: **76/76**, log `/tmp/arch-tests4.log`; corresponding TypeScript check passed, `/tmp/arch-typecheck4.log`.
- **That full suite/typecheck ran BEFORE the latest Living Book changes and its new 77th suite. Do not describe the final checkpoint as fully verified.** Run `npm run typecheck` and `npm test` from `mobile` when resuming. No further suite was started after the user said stop.
- `git diff --check` was clean at handover preparation.
- No Android compilation, native UI testing, physical Fold acceptance, live provider matrix or Playwright interaction testing completed in this session.

## Outstanding work / next steps

1. Review and typecheck this checkpoint; run all suites. Finish production editor integration, optimistic revision/generation guards, persistence failure recovery and real UI interaction coverage. The transaction compares against the latest load inside `persistWorkEdit`, not necessarily the original editor version; inspect stale edits during artwork/network awaits. Check accepted legacy works and partial-work patches. Publication snapshots group whole catalogues during writes: profile CPU/yield behavior before claiming large-library performance.
2. Reproduce repeated rescan on the actual startup lifecycle. Current `beginLocalScan` clears the prepared signature; cancelling to open the editor can leave it cleared despite a durable discovery stage. This cause was identified in source but **not fixed or reproduced on the real device**. Separate discovery/enrichment checkpoints; do not add another timer workaround.
3. Implement bounded native EPUB/CBZ/CBT/CBR evidence access. No archive fix was made. Current preparation skips embedded archive metadata and the expensive Deep Search fallback was removed. Approved limits: 2 s deadline, 1 MiB central directory, 512 KiB XML, 8 MiB cover, 10,000 entries, one probe, cancellation/watchdog/circuit breaker; no full archive copying/reading for identification. Unsupported/corrupt/nonseekable media must remain visible with reason.
4. Verify real provider title-only, author-only, combined and ISBN searches/fallbacks; Open Library without Google key; offline/disabled/unconfigured distinctions; Metron series/issue/ComicInfo/cover flow. Automatic genre enrichment, manual corrections and covers, logical-work lookup deduplication all need end-to-end tests.
5. Actual Library filter tests for format, author, series, genre, reading status and Reset on a seeded published catalogue. Determine staged/publication vs filter defect. Add Playwright real Expo UI editor/filters and approved phone/Fold screenshots, plus Android-native tests. No broad layout changes.
6. Footer ghosting remains unfixed. Test18 cured the body only; shared Button opacity/scale inside a hardware modal footer is a hypothesis, not a proven cause. Do not apply a fourth speculative compositor fix. Reproduce natively.
7. Complete Living Book timing and real lifecycle/visual checks, realistic large-library performance, cancellation/stale commits, SQLite overlap/restarts and source grouping cases. Review full branch before build.
8. APK workflow currently triggers the old feature branch, **not `integration/test18-reliability`**. Once ready, explicitly wire the integration branch and a new test build/version. Do not accidentally reuse Test18 labels. Stop/report with actual run/download links when build starts, per user preference. Final physical Fold acceptance remains pending even after automation.

## Environment and continuation tools

- No `adb`, Android SDK/emulator, Maestro or `kotlinc` available locally. Java 17 is present. GitHub Android CI can compile when deliberately triggered, but has not done so for this checkpoint at handover time.
- Playwright module exists at `/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`, but Chromium is absent. Installation attempt failed with truncated/non-ZIP downloads. Log `/tmp/arch-browser-install.log`. Do not repeatedly retry unchanged.
- Expo web was started on port 8081 for investigation; no UI test ran. It is stopped for handover. Logs `/tmp/arch-web.log`.
- Fold recording previously inspected: `/workspace/scratch/0a5b4bcfacc5/upload/35891.mp4`; diagnostic frames `/tmp/glitch.jpg`, `/tmp/glitch4.jpg` are transient. Request the original again if unavailable.
- GitHub connector supports fetch, create_tree, create_commit and compare-and-swap update_ref. CLI push credentials were unavailable earlier. Use a tree built on the current remote parent. App.tsx exceeds single-tool output limits: produce a JSON tree payload locally, read in 100,000-character chunks into a functions store without printing, then call create_tree. Local and connector commits have different SHAs but should have identical trees; verify them.
- Do not expose huge payloads, base64, source files or repeated test logs to the chat. The user is very sensitive to usage.
