# Archivist reliability repair — architecture review

## Preserved baseline and scope

Test 18 is preserved on `checkpoint/test18-before-architecture-20261007` at remote commit `461694e3b821742b2d2d0fdbb1a56357079abdca`, tree `e1b27c1038ce8639daa6442719ff9dc99d83588d`. The local baseline has the same tree. `integration/test18-reliability` starts from this exact commit. Main and the original development branch remain unchanged by this repair review.

This specification covers Russell's full 7 October repair brief, including the earlier footer ghosting, disappearing reviewed books, restart/rescan state, comics and filters. The Test 13/Test 18 UI remains locked. Changes to labels or controls are limited to distinguishing Save clues from explicit acceptance. No metadata provider, native device test or visual acceptance is assumed successful merely because CI is green.

## Evidence established before implementation

A direct execution of `acceptBookCandidateForWork` followed by `partitionLocalBooksByPublication` produced:

- Accepted Dune candidate, remote cover not cached: review count 0, published count 0, staged count 1. Blockers: remote library cover and missing Living Book cover.
- `applyManualCluesToWork` with existing local artwork: needsReview true, but published count 1. Group identity inference can override the intended clue-only review state.

Additional source findings:

- App.tsx independently implements editor saving despite the existing tested workflow module.
- BulkMetadataPanel replaces SQLite staging using localBooks, the published subset, which can discard unrelated pending-review rows.
- Normal scanning defers embedded EPUB/comic parsing; removed Deep Search leaves no equivalent bounded archive path.
- Startup restores SQLite but legacy folder status may start another scan. Beginning a scan clears the preparation signature; cancellation does not establish a resumable preparation checkpoint. The exact reported device sequence is not yet reproduced.
- Shared Button combines pressed/disabled opacity with a scale transform. This is a compositor hypothesis, not a verified root cause of the remaining footer artifact.
- Living Book constants say 3000 ms, while App and Canvas use 1900 ms; cover timings also differ.
- Native Android SDK/device tooling is not available in the current execution workspace. Physical Fold acceptance must be performed separately; web screenshots cannot prove this symptom fixed.

## Architecture decision

Use a single production work-level metadata workflow with durable identification and publication states, backed by the existing SQLite catalogue. Keep the existing UI and scanner improvements. Rejected alternatives: another needsReview-only patch (cannot express accepted-but-artwork-pending); broad UI rewrite or full archive parsing (violates scope and responsiveness).

### 1. Explicit work state and no hidden records

Separate identification (`unresolved`, `clues-saved`, `accepted`) from publication (`pending`, `ready`, `blocked`). Store acceptance independently from metadata provenance: a manual author clue is not an accepted identity. Record publication blockers as structured codes with clear displayed reasons.

Needs Attention contains every current work without a ready published revision. Shelf/Library uses ready revisions only. Candidate acceptance does not remove a work from attention until publication succeeds. A prior good published revision remains displayed during replacement scans and failed updates.

Migrate old rows conservatively: retain previously publishable works; surface every non-publishable staged work in attention, including comics missing cover evidence. Do not infer acceptance solely from metadataSource=manual, because previous versions used it for both clues and acceptance.

### 2. One editor workflow

App.tsx calls metadataSearchWorkflow.ts for saving clues, selecting candidates and committing acceptance. Tests call these same operations; no parallel test-only implementation.

Save without a selected candidate persists title, author or ISBN clues, allows empty title, leaves identification unresolved and keeps the editor open. Smart Search reads current draft clues, including unsaved changes. Choosing a candidate populates a draft; a separate explicit acceptance action commits resolution. Editing a previously accepted work preserves that established acceptance unless the user explicitly restores scanned metadata.

Preserve physical URI, chapter identity, track/disc numbers, part order and embedded chapter data. Candidate selection may correct user search hints but automatic enrichment must not overwrite manual corrections or artwork.

### 3. Transactional acceptance and catalogue recovery

Resolve required artwork before committing a ready revision. Validate complete work-level metadata and both logical artwork roles. Persist edited metadata, acceptance, publication result and affected-work overrides together using a serial SQLite transaction; update React state only from the committed result.

If artwork/provider/storage fails, retain the work in attention with a retryable reason. Do not clear review visibility early. Cache artwork outside the transaction, then commit only if the operation generation and work revision still match. Never hold a database transaction across a network request.

Bulk edits patch affected URIs into the durable full stage; they never replace it with the published subset. Serialize scan/editor writes, invalidate cancelled generations, and verify restart recovery using a real database test harness. A failed transaction preserves the previous revision.

Persist preparation progress and folder completion separately from transient progress text. Recover the last committed stage on restart. Resume or restart a scan only from explicit persisted job intent, not a display string. Before changing automatic restart policy, reproduce interrupted discovery, interrupted enrichment, opening an editor during scanning, and restart after clue save.

### 4. Bounded archive identification

Retain bounded native audio reads and cooperative staging. Add a native archive probe supporting seekable local/SAF ZIP data for EPUB and CBZ: read the ZIP tail/central directory, selected small XML entries (container.xml, OPF, ComicInfo.xml), and the identified cover/first-page entry only. No full-file copies or full archive inflation merely to identify media.

Initial limits: one native probe at a time; 2-second elapsed deadline; 1 MiB central-directory budget; 512 KiB total XML output; 8 MiB compressed/uncompressed cover budget; bounded entry count 10,000; reject encrypted entries, traversal paths, unsupported compression, invalid offsets and expansion-limit violations. Check cancellation between every read/inflate chunk. A provider that cannot seek must fail forward, not trigger a whole-file fallback.

CBR/CBT need format-specific bounded readers: preserve the same operation contract, explicit byte/time limits and fail-forward behavior. Do not call the existing full-copy archive reader from the fast probe. Unsupported or over-limit archives remain visible in attention with an actionable reason. Their unsupported status must not masquerade as a successful empty scan.

Native watchdog/circuit breaking prevents additional jobs after an unresponsive provider. Batch results cooperatively; persist identity and cover provenance. Work-level enrichment queries once per logical work, not per chapter.

### 5. Providers, artwork and filter correctness

Live verification matrix: title-only, author-only, title+author, ISBN, noisy filename, precise-query failure, disabled provider, unavailable network, timeout and rate limit. Open Library needs no Google key. Metron requires configured credentials; test series/issue disambiguation, ComicInfo hints and cover retrieval end to end. Never report missing configuration as no matches.

Keep square/library and portrait/Living Book artwork distinct. A local library cover may be an explicit low-confidence jacket fallback, never falsely labelled a portrait match. Publication still requires verified local artwork. Cover failure cannot create a blank published work or hidden pending work.

Use one shared filter predicate against published works and explicit attention data. Seed audio, EPUB, PDF and comics with multiple authors, series, genres and reading states; exercise All, Books, Comics, Audiobooks, PDFs, author, series, genre and Reset via actual controls. Determine which reported failures result from publication exclusion versus predicate/control errors before changing behavior.

### 6. Footer and Fold renderer investigation

No fourth speculative compositor patch. Reproduce with the real editor and the supplied Fold scenario; instrument layout and interaction transitions. Compare one variable at a time: pressed scale, opacity, native layer boundaries and z-index. Keep the approved button appearance and dimensions. Retain the minimal change that demonstrably removes the artifact.

Native acceptance matrix: closed/open Fold, keyboard show/hide, scrolling, results insertion, Smart Search and Save press/release/disabled states, resize/rotation, editor close/reopen. Capture video/screenshots. Browser tests only establish web-layout behavior.

### 7. Living Book timing and lifecycle

Use PLAYER_MOTION_TIMING as the only source for React scheduling and generated Canvas configuration: page turn 3000 ms, and the declared opening/closing/skip/settle timings. Pass transition progress/time explicitly where needed so reversals and remounts do not start a second independent clock.

Drive the real renderer through Play → open → ambient turn → Pause during turn → finish leaf → close → leave Now → return → Play. Assert phase sequence, elapsed durations, continuity and no extra leaf. Use fake time for state/controller tests and rendered frames for Canvas tests; native playback/renderer recreation still needs Android verification.

### 8. Behavioural and visual verification

Add Playwright tests to the real Expo/web surface, using test-owned seeded storage/provider responses at external boundaries. Do not reimplement editor logic in a demo page. Required path: attention → author/title edit → Save clues → restart/restore → search → select → accept → close → absent in attention and present on Shelf/Library. Repeat with artwork failure, then retry successfully.

Add native Android interaction coverage using instrumentation or Maestro against the APK. Include catalogue restore, keyboard/editor interaction, provider failure and lifecycle; use SAF fixture documents for native archive coverage. Launch-only smoke tests remain useful but are not workflow acceptance.

Capture canonical screenshots at phone and Fold widths for Shelf, Library, editor, Now, Atlas, Stats and profile overlay. Establish baselines from the preserved approved UI, not the modified output. Review intentional differences; forbid automatic baseline updates in CI.

Replace textual existence assertions for these workflows with interaction or real module/renderer tests. Retain legitimate source-policy checks as policy checks, never count them as runtime proof.

Profile realistic large catalogues, root-level mixed books and multipart audio. Record phase elapsed time, byte reads, provider requests, event-loop responsiveness, cancellation latency and transaction times. Verify percentages cover real phases without hiding long work in a tiny range.

## Execution order and gates

1. Reproduce and test publication/acceptance/clue state, then integrate one workflow and transactional persistence.
2. Reproduce restart and bulk-write loss; repair persistence/resume behavior and stress-test overlap/failure.
3. Add bounded native archive probes and end-to-end comic/EPUB identification tests.
4. Verify providers, artwork and Library filters using published/staged fixtures.
5. Reproduce footer compositor issue natively; fix only after evidence. Unify Living Book timing and test lifecycle.
6. Run web/native interactions and canonical visual comparison; profile large libraries; run full existing suites.
7. Build candidate APK from integration branch, then physical Fold acceptance. Promote only the tested revision; do not merge or replace main automatically.

Each defect follows reproduce → root cause → failing behavioural test → targeted change → focused checks → full suite → original-symptom verification. After three unsuccessful attempts, stop and reassess architecture. Mark native/live-provider gaps explicitly; green CI alone does not close them.

## Review decision requested

Confirm this state-machine/transactional workflow and bounded-native-probe design before production changes. The user brief supplies the product requirements; this document supplies the concrete architectural decisions. Superpowers brainstorming requires written-spec review for this architectural change. No application code has been changed in this review checkpoint.
