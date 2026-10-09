# Fresh Archivist Scanner Implementation Plan

> For agentic workers: use superpowers:executing-plans for native, sequential implementation after preparation gates and design review. Do not dispatch extra agents without authorization.

Goal: replace scanning beneath the canonical UI with a reliable work-based, staged and atomic pipeline.

Architecture: new scannerVNext modules plus new Android SAF bridge; existing scanner algorithms are excluded. Preserve legacy user state through a projection adapter and additive SQLite migration. Review/publication revisions remain separate.

Tech Stack: existing TypeScript, React Native/Expo 55 and expo-sqlite; new Kotlin module; Node regression tests; Android emulator tests.

Spec: DESIGN.md in this directory. Commands below are proposed sprint deliverables, not currently available validated commands.

## Global constraints

- Current main 22ee7645b78b752b9e954a286528fddbedfc1320 is the canonical UI source baseline.
- No Test 14 or historical scanner algorithms as implementation baseline.
- No private original inventories, filenames or media in public Git commits.
- No source-media mutations; manual metadata and previous published revisions survive failed work.
- P0-P3 must pass before scanner product-code edits. No APK release before automated acceptance passes.

## Review focus

- Provider ID changes during rename: preserve old accepted work and stage uncertain reconciliation.
- Numeric whole novels alongside numeric chapters: prohibit folder/number-only merging.
- Late provider results after manual edits/cancel: expected revision and generation reject stale writes.
- Uncancellable SAF operations: quarantine bounded slots and never spawn replacement workers.
- Duplicate roots/multiple editions: account for every asset while Atlas counts logical works once.

## Preparation closure

- [x] Clone current main into a separate clean checkout and create requested feature branch.
- [x] Record recovery tag, complete bundle and passing source UI contract.
- [x] Run supplied check_reference.py against all 8,016 records.
- [x] Generate private 342-file MP3/M4A/M4B hierarchy and controlled archive/negative samples with provenance.
- [x] Obtain originals privately and verify four hashes; regenerate normalization with build_reference.py.
- [x] Curate verified file scopes, retaining unknown work/edition labels; real correctness calibration remains an S2/S4 acceptance dependency, not a fabricated total.
- [x] Add a generated stored-RAR5 CBR fixture and valid text/image PDF examples; compressed RAR coverage remains for native-stage testing.
- [x] User authorized continuation after written design/plan and mission confirmation. Actual discovery will be reported as percentages with explicit unresolved reasons.

## S1: Discovery/classification and additive storage

Files: new mobile/scannerVNext/types.ts, classify.ts, sourceAccess.ts, store.ts, store.native.ts and discovery.ts; new mobile/scanner-vnext-discovery.test.cjs.

Interfaces: SourceAccess.nextBatch(sourceId, cursor, limit, signal) -> Promise<DiscoveryBatch>; classifyAsset(asset, optionalSignature) -> AssetDisposition; discoverSource(source, access, store, run) -> Promise<DiscoverySummary>. Types include immutable IDs, MIME, extension, source membership, fingerprint and reason codes.

- [x] Add failing tests for root/mixed formats, MIME mismatch, visible unsupported MOBI, ambiguous PDF/ZIP, denied provider, loops, duplicate document IDs and 100,000-entry resumable cap. Cross-grant reconciliation remains a native integration check.
- [x] Run the new suite and confirm it fails before implementation.
- [x] Implement new logic and additive transactions; retain existing database/user data.
- [x] Replay all 8,016 private records through an external-input harness; assert exact source/path accounting. No work-count assertion.
- [x] Pass new tests and UI hash check; checkpoint S1 and save observed accounting/timings. Native-wrapper/full app typechecking remains pending S3 dependencies.

## S2: Work/edition grouping

Files: new mobile/scannerVNext/grouping.ts and identity.ts; new mobile/scanner-vnext-grouping.test.cjs.

Interfaces: groupCandidates(assets, evidence, priorRelations) -> GroupingProposal[]; orderParts(parts, evidence) -> OrderedPart[]; commitGrouping(proposal, expectedRevision) -> Promise<GroupCommitResult>. Imported manual identities are field locks, never inferred labels.

- [x] Add failing tests with construction-defined labels for nested chapters, discs, root prefixes, named standalone novels, numeric novels, repeated chapter names, comics issues and conflicting editions.
- [x] Verify red, implement fresh evidence rules, and replay private curated cases with unknown labels kept provisional.
- [x] Assert each supported part maps exactly once, numerical ordering is stable and manual merge/split lineage survives rename/rescan. Real SQLite snapshots survive restart, reject stale revisions and retain missing source parts visibly.
- [x] Measure pair precision/recall only on the two confirmed single-work scopes; both are 1.0 over 61 parts, a limited correctness check. The uncertain 73-part series is excluded from accuracy scoring. Core gate passes with 70/70 LF suites, strict core TypeScript and unchanged UI hashes; broader original-library/Android acceptance remains open.

## S3: Native bounded reads and hang hardening

Files: new mobile/android/app/src/main/java/app/archivist/reader/ArchivistScannerModule.kt and ArchivistScannerPackage.kt; modify MainApplication.kt registration only; new scannerVNext/nativeAccess.ts, clues.ts and tasks.ts; new Kotlin tests and mobile/scanner-vnext-tasks.test.cjs.

Interfaces: native beginScan/nextBatch/cancelScan/readClues as specified in DESIGN.md; scheduleTask(task, generation) -> Promise<TaskOutcome>; collectClues(work, limits, signal) -> Promise<ClueResult>.

- [x] Reproduce slow query/open, ignored cancellation, descriptor failure and corrupt/bounded archive scenarios in failing tests.
- [x] Implement finite workers/queue, cancellation signals, quarantined slots, versioned clues cache and persisted checkpoints.
- [x] Record actual emulator provider query/read traces and slot counts during cancellation. Ten controlled Android cases pass.
- [x] Pass descriptor cleanup, late-result rejection and native main-looper responsiveness; S3 component gate passes. Per ledger ruling, integrated React Native lifecycle/navigation remains mandatory in S7. RAR metadata and extended MP4 indexes remain explicitly unresolved; no full extraction coverage claim.

## S4: Automatic work-level Smart Search

Files: new scannerVNext/search.ts, providers.ts and fieldEvidence.ts; new mobile/scanner-vnext-search.test.cjs. Integrate existing selected-work editor bindings only after core gates; no layout/style changes.

Interfaces: searchWork(workId, queryEvidence, policy, signal) -> Promise<SearchResult>; acceptCandidate(workId, candidate, expectedRevision) -> Promise<WorkRevision>. Providers expose search/hydrate under the shared request scheduler.

- [ ] Add failing tests for one query unit per multipart work, duplicate editions, wrong author, identifier conflict, offline, 429 Retry-After, timeout, negative cache, explicit retry and manual edit racing an old response.
- [ ] Add Save-triggered enrichment, sparse input, title punctuation, series/index and story/anthology tests; broaden weak searches across complementary providers and paginate beyond eight candidates. No search action triggers deep file scanning. Conflicting author suggestions require approval.
- [ ] Implement consent-aware automatic missing-field lookup and selected-work candidate acceptance/Deep Search within specified budgets.
- [ ] Calibrate matching against confirmed labels; keep uncalibrated or close candidates in Needs Attention.
- [ ] Record requests/work and cache hits; gate and commit S4.

## S5: Meaningful Genre and Atlas projection

Files: new scannerVNext/genre.ts and projection.ts; new mobile/scanner-vnext-genre-atlas.test.cjs; change App.tsx only at data bindings and existing metadata editor validation. Preserve all canonical styles and screen composition.

Interfaces: normalizeGenre(evidence, taxonomyVersion) -> GenreDecision; setManualGenre(workId, genreId, expectedRevision) -> Promise<WorkRevision>; projectCatalogue(snapshot) -> LegacyCatalogue; buildPublishedGenreCounts(works) -> GenreCounts.

- [ ] Add failing publication tests for blank/Other/format labels, unresolved genre, invalid taxonomy IDs, protected edits after restart/rescan, multi-part/edition double-counting and secondary distribution totals.
- [ ] Implement audited mapping, evidence/provenance and user edit protections.
- [ ] Verify published primary genre coverage is 100%, Atlas primary counts sum to published logical works and edits update existing visuals.
- [ ] Gate and commit S5.

## S6: Artwork and work-atomic publication

Files: new scannerVNext/artwork.ts, publication.ts and migration.ts; new mobile/scanner-vnext-publication.test.cjs; modify only scan/controller persistence call sites in App.tsx and adapter exports.

Interfaces: resolveArtwork(workId, policy, signal) -> Promise<ArtworkResult>; publishWork(workId, expectedRevision) -> Promise<PublicationOutcome>; migrateLegacyState(books, overrides, progress) -> Promise<MigrationResult>.

- [ ] Add failing tests for missing/corrupt/oversized images, separate slot readiness, manual cover retention, transaction interruption, idempotent migration, changed provider IDs and prior accepted work preservation.
- [ ] Implement bounded cache and atomic publication; keep staged unresolved works visible once and prior published revisions active.
- [ ] Verify restart persistence and no invisible accepted work; compare canonical hashes with explicitly allowed controller-only edits.
- [ ] Gate and commit S6.

## S7: Integrated Android and UI acceptance

Files: new Android instrumented suites and private lab runner; sanitized test definitions and acceptance documentation. Separate emulator diagnostic application ID and output directory from installed user app.

- [ ] Run actual SAF picker scans of generated 342-file tree; cold, warm, cancellation, restart, permission loss and slow-provider cases.
- [ ] Replay larger Windows-derived corpus with valid media/negative cases and 5,000-/100,000-entry stress runs; report exact coverage and per-phase p50/p95/max, RSS/native heap, worker counts, heartbeat, cache and publication visibility.
- [ ] Run phone/Fold closed/open light/dark screenshot and interaction checks for Library, editor, Now, Shelf, Atlas, Stats and navigation. Keep all accepted geometry/tokens.
- [ ] Run existing maintained mobile suites and typecheck. Resolve new regressions; preserve documented baseline failures separately.
- [ ] Create results matrix with raw private traces and source/fixture/commit hashes. Automated gates must all pass before a uniquely named APK with package ID/signing/hash can be released.
- [ ] Keep physical Fold original-media acceptance outstanding until user testing; checkpoint final source.
