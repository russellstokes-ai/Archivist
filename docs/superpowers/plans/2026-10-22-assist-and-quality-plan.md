# Archivist Assist and App Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task after the user's review. Execute inline to control usage. No implementation or build is authorised by this planning document alone.

**Goal:** Deliver a reliable three-stage library workflow, safe metadata persistence and the fixes in the owner's ten-page issue report, followed by a verified direct APK.

**Architecture:** Discovery saves a usable catalogue independently of online identification. A durable per-item queue feeds an append-only evidence ledger and deterministic resolver; a separate guarded writer consumes explicit change plans. UI state observes persisted work and never waits for network lookup or file rewriting to save an edit.

**Tech Stack:** Existing React Native/Expo TypeScript app, SQLite catalogue, Android Kotlin/Java document access and archive/audio writers, existing Node test runner and GitHub Actions.

**Spec:** Owner's `C:/Users/86185/.codex/attachments/75416741-d9e3-4fbb-9d68-a8318c0bbc8b/Pasted text.txt`; `C:/Users/86185/Downloads/Untitled presentation (1).pdf`; subsequent clarification that stage 3 is user assistance for unresolved items. This plan is proposed, not a claim about shipped behaviour.

## Global Constraints

- Three visible stages: Scan library; Identify & populate; Complete missing details.
- Metadata into supported writable files, never new sidecars. Covers app-side only; preserve existing embedded cover bytes.
- Never rename, move, delete duplicates or convert CBR to CBZ.
- File-writing setting enabled by default and switchable off.
- Manual edits and locks win. Missing facts must not be fabricated to satisfy validation.
- Keep existing complementary metadata sources; establish real endpoint, authentication, licensing and availability before adding any service. Do not promise a key-free provider without verification.
- No feature flags, shadow flows or compatibility shims. Preserve existing user library records, edits and progress; do not delete legacy sidecar files.
- No APK compilation until implementation and targeted checks are complete. Then run full validation, build on GitHub and provide the actual APK release asset.
- Preserve approved splash/rewards/logo behaviour. Wrong-chat black-button request is excluded.
- Restrict scanner-lock changes to this explicitly requested scanner redesign; record reviewed exceptions and evidence. Do not merely refresh hashes to conceal regressions.
- No watcher, content-based move tracking, author alias system, calibrated probabilities or bulk-review UI in this scope.

## Review Focus

1. A corrupt or non-returning comic read cannot strand the entire scan; test process isolation, bounded work and checkpoint restart (T1/T3).
2. An old lookup result must never populate a newly opened book; test item identity, query generation and edit revision together (T5).
3. An interruption during Android document replacement must recover the original or verified replacement without losing audio chapters/pages (T6).
4. Missing author, genre, cover or year must not hide a discovered item or create a false identification (T3/T5/T7).
5. Folding, navigation and late artwork callbacks must not lose the player or apply another book's cover (T9).

## User workflow

1. **Scan library:** enumerate selected sources, detect containers, classify, extract bounded local clues and group safely. Persist items as discovered; make them available without a publication gate. Separate file counts from grouped-item counts. Provide Cancel and persistent recovery after restart.
2. **Identify & populate:** button becomes available after discovery. Process the saved catalogue rather than rediscovering unchanged files. Search sources, resolve fields, obtain app covers and queue eligible file writes. Display separate identification, cover and file-writing progress; incomplete artwork never blocks an item.
3. **Complete missing details:** only genuinely unresolved/conflicted items enter this queue. Explain the specific missing clue and ask for title/author or comic series/issue/year/publisher as applicable. Saving reruns that item, retaining existing data. Allow skip and return later. Provider outages and unwritable files are system retry states, not requests for the user to invent metadata.

Remove the separate **Confirm saved identity** action. Selecting a candidate hydrates all available unlocked fields immediately, including series position; Save details persists the selection and confirms when the evidence rules qualify. Saving an incomplete draft remains possible. Explicit manual confirmation is recorded as evidence but does not bypass the stated R1/R2 and strong-grouping automatic-write gate.

When a user starts population, its queue can resume after interruption. New evidence re-evaluates affected entries in that queue; it does not silently restart a whole-library scan. Unchanged completed items are not repeatedly searched or written.

## Execution and verification convention

Each task is a separate reviewable patch: write the named failing cases, run them and establish the failure, implement only that task, rerun its cases plus affected regressions, then commit only owned paths. Update task evidence in the handoff. Do not commit unrelated local work. New modules below are proposed interfaces, not existing APIs.

## T0 - Establish the source baseline and fail-closed test corpus (P0)

**Files:** `mobile/run-tests.cjs`; new `mobile/assist-pipeline-corpus.test.cjs`; new `mobile/test-fixtures/assist-pipeline/manifest.json`; existing scanner and file-writing test fixtures.

- [ ] Resolve the live GitHub branch and compare with the shipped release; reconcile the stale local checkout without resetting unrelated changes. Last audited remote was bc4de962, implementation 873f0e2; recheck before editing.
- [ ] Add a corpus manifest of input, expected real format, grouping, identity, write eligibility and preserved media properties. Include wrong extensions, dump folders, mixed audio albums, duplicate track numbers across discs, untagged audio, missing covers, damaged archives, read-only files and empty libraries.
- [ ] Add candidate fixtures for 2000 AD Annual 1978, From the Oasthouse, Bobiverse and The Hunt for Vulcan, including wrong-edition decoys. Use original files when available; synthetic fixtures do not prove the owner's files work.
- [ ] Make missing Python/Java, unresolved async tests, timeout and absent completion reports fail the test runner rather than appearing green.
- [ ] Record baseline failures separately from new regressions. No claim that the previous APK passed startup: its overall workflow failed in the emulator screenshot/startup gate.

## T1 - Scan and queue reliability

**Files:** `mobile/scannerVNext/runtime.ts`, `pipeline.ts`, `store.ts`, `androidRuntime.native.ts`; `mobile/assistMetadata/runtime.native.ts`, `recoveryReader.ts`; new `mobile/assistMetadata/jobQueue.ts`; relevant native archive access.

**Interface:** `PopulationJob { itemId, revision, stage, state, attempts, nextAttemptAt, reason }`; durable queue transitions compare item revision before accepting a result.

- [ ] Reproduce a comic task that stalls and establish whether it blocks enumeration, native extraction, lookup or persistence; instrument stage, elapsed time, item and terminal reason without logging private metadata unnecessarily.
- [ ] Test a never-returning native read, malformed archive, provider timeout, cancellation, process restart and a late result after book switching.
- [ ] Separate discovery from expensive work; bound per-file bytes/time and concurrency. A JS timeout alone is insufficient if its native worker stays occupied: isolate/reset the worker or circuit-break that operation so remaining enumeration completes.
- [ ] Persist checkpoints and queue states. Explain what is happening with completed/total counts and current operation, not an indefinitely frozen 24%.
- [ ] Save edits to the DB promptly and enqueue slower artwork/write work; show their real pending/failed states. Retry transient failures with bounded backoff, not a tight loop.

## T2 - Evidence ledger and deterministic resolution (P1 and resolver foundation)

**Files:** `mobile/assistMetadata/store.ts`, `fieldEvidence.ts`, `core.ts`; new `evidenceLedger.ts`, `resolver.ts`.

**Interfaces:** `resolve(observations, locks): ResolvedRecord`; `ResolvedRecord` includes fields, per-field provenance, conflicts and identification rung. Observations contain item/field/raw/normalised/source/detail/extractorVersion/time/tier/fileRevision/supersededBy.

- [ ] Test append/supersession without deletion, stable ordering, manual lock precedence, absent versus empty fields and conflicting editions.
- [ ] Add ledger storage and make extractors/providers emit observations. Replace direct accept/fill field mutation through the pure resolver, not two competing authorities.
- [ ] Preserve precedence: manual lock > verified ID > embedded tag > provider match > filename. Distinguish bibliographic fields from file-specific duration, pages and chapter data.

## T3 - Real format, classification and safe grouping (P4/P5)

**Files:** `mobile/scannerVNext/classify.ts`, `discovery.ts`, `grouping.ts`, `groupingStore.ts`, `identity.ts`; `mobile/comicSourceFormat.ts`; new `formatCapabilities.ts`.

- [ ] Test signature/extension disagreement, PDF comic versus prose, mixed-format dump folders, multi-disc MP3, single M4B, distinct editions and exact duplicates.
- [ ] Detect containers using bounded content probes. Skip junk and incomplete downloads. Treat book/audiobook/comic as content types; PDF is a file format, not a top-level library category.
- [ ] Group with independent evidence; retain ambiguous separate items. Link works across editions only on sufficient identity evidence. Link exact duplicates without deleting them or collapsing progress incorrectly.
- [ ] Remove publication requirements that hide unresolved items. Keep an unresolved type internally where evidence is insufficient; do not label an unreadable file as a comic just because its folder says comics.
- [ ] Build a tested capability matrix for every enumerated extension: discovery, reading/playback, extraction, embedded write, recovery. Include EPUB/PDF/MOBI/AZW/AZW3/FB2/LIT, CBZ/CBR/CB7/CBT and MP3/M4A/M4B/AAC/FLAC/OGG/OPUS/WAV/WMA. Listing a format is not a promise it already works; every claimed capability needs a real fixture.

## T4 - Readers and identity ladder (P6/P7/P8/P10)

**Files:** `mobile/scannerVNext/clues.ts`, `seekClues.ts`, `androidRuntime.native.ts`; `mobile/assistMetadata/core.ts`, `service.ts`, `providers.native.ts`, `supplement.ts`, `genres.ts`; focused new readers alongside existing ones.

- [ ] Add one format reader per patch: ComicInfo; EPUB OPF; MP4 atoms and chapters; ID3/custom frames; PDF/text ISBN. Verify title, creator roles, series position, date, language, genre and identifiers as available.
- [ ] R1: exact identifiers without conflicting clues. R2: independent field agreement with type-specific evidence. Keep the current acceptance cases as baseline tests, but add conflict and edition checks; a score is not a calibrated probability and unavailable optional narrator/year fields must not become blanket rejection rules.
- [ ] R3: safely use identified neighbours and numbering; folder patterns remain weak evidence. R4: bounded page/credits extraction, cover comparison and opening-audio transcription where an available supported engine can provide it. No silent upload of media to a new service; document engine/data-flow before integration. The LLM tiebreak is optional and may only select existing candidates.
- [ ] Evaluate complementary provider results by edition and provenance. Verify GCD access and other provider contracts during implementation; handle credentials/outages without turning the entire library into a user task.
- [ ] Test false-positive rejection as well as named-title recall. Sources cannot guarantee every missing genre/year exists; retain missing state and retry rather than fabricate it.

## T5 - Three-stage UI, result selection and metadata save

**Files:** `mobile/App.tsx`; `mobile/assistMetadata/controller.ts`, `store.ts`, `runtime.native.ts`; `mobile/scannerVNext/assist.ts`; new `mobile/assist-selection-revision.test.cjs` and `assist-three-stage.test.cjs`.

- [ ] Test candidate selected after a new query, switching items during lookup, missing cached candidate, double Save and manual edits while results arrive.
- [ ] Bind candidate selection to item, lookup generation and revision. Revalidate/refetch a stale candidate safely; never throw the internal 'Candidate is not in this work lookup' message onto the main page or apply it to another item.
- [ ] Hydrate every available unlocked field on selection and persist once. Distinguish no-provider-value from failure-to-populate.
- [ ] Implement the three actions and counts described above. Remove duplicate confirmation, irrelevant genre/path/part blockers and redundant publication prompts; retain genuine grouping conflicts for correction.
- [ ] Present recoverable plain-language status with retry/skip where useful; retain technical details in diagnostics. Do not suppress a genuine failed save or falsely report success.

## T6 - Guarded file writing, undo and receipts (P2/P3/P11/P12)

**Files:** `mobile/assistMetadata/writeBack.native.ts`, `embeddedCopy.ts`, `rarCopy.ts`, `rar5Copy.ts`; new `changePlan.ts`, `writeHistory.ts`; native `ArchivistFileMetadataModule.kt`, `ArchivistMetadataModule.kt`, `RarMetadataVerifier.java` under `mobile/android/app/src/main/java/app/archivist/reader/`.

**Interfaces:** `planChanges(record, fileSnapshot): ChangePlan`; `applyPlan(plan): WriteReceipt`; plan carries source fingerprint and operations with old/new values and observation IDs. Receipt carries verified post-write fingerprint and persistent undo reference.

- [ ] Introduce plan-only writing and the conservative certainty gate before enabling any new automatic writes: R1/R2, no conflict, strong grouping, setting enabled and supported writable container.
- [ ] Test source changes between plan/write, space exhaustion, revoked document permission, partial replacement, process death and recovery. Re-read and verify written metadata AND preserved content before marking success.
- [ ] Preserve MP3 ID3 chapter/TOC data and unknown frames; preserve M4B chapter timing/titles, audio samples and duration. Preserve EPUB reading order, PDF pages and comic image payloads. For CBR preserve compressed pages and independently verify extraction; never convert.
- [ ] Retain persistent undo after successful writes, not just crash backups deleted on success. Undo refuses to overwrite newer external changes without a fresh checked plan. Expose optional preview/history; do not add a mandatory fourth workflow stage.
- [ ] Eliminate new sidecar export and sidecar-dependent completion. Existing files remain untouched. Store app covers separately and keep embedded artwork unchanged.
- [ ] Store post-write hashes now; add clean embedded identity/schema stamps only where supported. Repeat population produces no unnecessary rewrites. Unsupported/DRM/read-only writes retain DB data with 'not written to file' and a specific reason.

## T7 - App cover acquisition (P9)

**Files:** `mobile/assistMetadata/service.ts`, `providers.native.ts`, `runtime.native.ts`; `mobile/livingBookCover.ts`; new `coverQueue.ts`.

- [ ] Test missing/placeholder/broken covers, exact edition versus similar work, offline retries and identity changes during download.
- [ ] Reuse a good existing cover; otherwise fetch across the agreed complementary sources. Validate decode, dimensions, aspect and placeholder status; select the best valid exact-edition image.
- [ ] Cache app-side by content hash and create thumbnails. Publish the new cover to library and Living Player via the same item revision. A missing cover does not prevent identification or library access.

## T8 - Layout, categories and photo flow (PDF pages 1, 3, 5, 6, 9, 10)

**Files:** `mobile/App.tsx`, `mobile/profileStats.ts`, existing UI contract tests; add focused visual fixtures.

- [ ] Remove the Shelf/Atlas toolbar gaps at the actual folded and unfolded widths, rather than merely changing one parent gap. Use consistent typography, baselines and responsive form spacing.
- [ ] Widen the unfolded library sidebar enough for normal text; use a drawer in narrow layouts. Top-level filters: All, Books, Audiobooks, Comics. Keep file-format filtering separately if useful; remove Unsupported as a normal category while retaining actionable unavailable-item details.
- [ ] Keep Add photo/Replace photo next to the profile circle, old lower control removed. Page 9 does show a small system 'CROP' action; the issue is discoverability/completion, not proof there is no control. Provide a clear in-app photo preview with Use photo and Cancel; preserve the old photo on cancel/failure.
- [ ] Check Reader Stats typography and empty states from page 10. Reconcile chart totals, legends and units against one dataset; investigate the pictured 59-book centre versus 12 in its legend. Do not invent an unreported feature redesign.
- [ ] Verify folded/unfolded, keyboard open, large system font, safe areas and photo persistence after restart.

## T9 - Comic focus and Living Player

**Files:** `mobile/comicReaderWebViewSource.ts`, comic focus detection code reached from it; `mobile/LivingBookCanvas.tsx`, `LivingBookArtwork.tsx`, `livingBookReadiness.ts`, `livingBookNativeGate.ts`, `livingBookCover.ts`.

- [ ] Build positive speech/caption and negative artwork fixtures based on PDF pages 7/8. Reject spaceship parts, limbs, highlights and blank shapes without making ordinary text taps stop working. Preserve pinch/manual zoom as fallback.
- [ ] Render focus from original-resolution page data or a sufficiently detailed crop, not an enlarged thumbnail. Bound memory and cancel obsolete page renders. Test readable crops at device pixel density; cannot recover detail missing in the original scan.
- [ ] Test player navigation away/back while paused/playing, switching books, stop/start, late covers, fold/unfold and interrupted animations. Keep visible rendering and cover ownership independent of playback ticks; add a visible fallback while a render recovers.
- [ ] Retain approved reward/splash behaviour and audio playback/chapter state in the same regression pass.

## T10 - Atlas, final validation, release and handoff

**Files:** `mobile/atlas.ts`, `atlasUniverse.ts`, `atlasSourceSelection.ts`, `App.tsx`; tests; `.github/workflows/android-apk.yml`; `AI-HANDOFF.md`, `docs/v1/MOBILE_REPAIR_HANDOFF_2026-10-20.md`.

- [ ] Atlas Genre, Format and Year each own a non-overlapping third of the ring. Within each third, one segment per populated value, proportional to count; no dummy cells. Missing values are disclosed, not invented. Charts derive from the accessible catalogue and current filters, independently of file-write success.
- [ ] Run targeted tests after each patch. After all implementation, run the full mobile suite with explicit functioning Python/Java dependencies, TypeScript check, protection gate and canonical scanner gate; require completed test reports.
- [ ] Exercise end-to-end fixture copies: scan -> populate -> unresolved queue -> add clue -> resolve -> write -> read-back -> rescan -> undo, including cancellation and restart. Validate every claimed format and preserve original file contents in the comparison.
- [ ] Run folded/unfolded visual checks, release lint, native build, signing/alignment verification, emulator install/startup/navigation smoke. Fix the previous startup/screenshot gate; do not describe a red overall workflow as a passing build.
- [ ] Build one final GitHub QA candidate once the above pre-build work is done. If it fails, fix the cause and rerun only the necessary checks/build; never weaken checks to ship it.
- [ ] Publish a stable direct .apk release asset with unique version/build identifier, exact source SHA and checksum. Verify asset provenance. Physical Fold behaviour remains explicitly pending until tested on that device; a green automated run does not prove physical acceptance.
- [ ] Update handoff with architecture, capability matrix, source/API constraints, tests, known limitations, recovery/undo behaviour, APK link and remaining device checklist.

## Patch sequencing and original brief traceability

T0/P0 -> T1 reliability -> T2/P1 -> T6 guarded writer foundation (P2/P3 plus early P11/P12 safety) -> T3/P4/P5 -> T4/P6/P7 -> T5 workflow -> T7/P9 -> T4/P8/P10 -> T6 final promotion/stamps -> T8/T9/T10.

UI and reader repairs stay separate patches but ship together. The write gate, source fingerprint and post-write receipt move earlier because later identification improvements must never run through an unsafe writer. Optional LLM remains optional; all mandatory extraction and R4 data-flow limitations must be reported before claiming full scope complete.

## Approval boundary

This is the combined proposed plan. No source-code changes or APK builds have been performed for it. Obtain the owner's review before implementation. If corpus work reveals an unsupported format or provider contract that prevents a requirement, report the precise gap rather than silently substituting sidecars, conversion, guessed metadata or weakened verification.
