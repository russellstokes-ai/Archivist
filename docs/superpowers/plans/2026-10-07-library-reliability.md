# Library Reliability Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline; apply the approved specification and TDD per task.

**Goal:** Preserve reviewed works and deliver bounded, testable media preparation without changing the locked UI.
**Architecture:** Single production editor workflow; independent durable identification state and derived publication assessment; serialized transactional catalogue mutations. Native bounded archive probes feed existing metadata evidence.
**Tech Stack:** React Native/Expo, TypeScript, Kotlin, SQLite, Playwright and Android instrumentation.
**Spec:** docs/superpowers/specs/2026-10-07-library-reliability-design.md

## Global Constraints
- Preserve checkpoint/test18-before-architecture-20261007 and canonical UI.
- No full-file archive reads for identification, no automatic acceptance of saved clues.
- No claims of native/device verification from web or source-text tests.
- Record unresolved native/Fold gates; never bypass them to label a release accepted.

## Review Focus
- Clues with existing artwork must not publish.
- Accepted metadata with unavailable artwork stays in attention after restart.
- Bulk editing must preserve unrelated staged rows.
- Nonseekable/corrupt archive reads stop within budgets.
- Native compositor/keyboard behavior requires physical-device verification.

## Task 1: Production metadata/publication workflow
Files: mobile/metadataSearchWorkflow.ts, publicationPipeline.ts, localLibrary.ts, App.tsx; mobile/metadata-publication-lifecycle.test.cjs.
Interface: explicit identificationState ('clues-saved'|'accepted') on LocalBook, preserved independently of inferred needsReview. Production save uses applyManualCluesToWork/acceptBookCandidateForWork/acceptComicCandidateForWork. Publication refuses clues and surfaces all blockers.
- [ ] Write and observe failures for clue+cover publication and accepted+remote-cover disappearance.
- [ ] Implement explicit state, publication-driven attention, clue-only and candidate-accept paths in the APK.
- [ ] Test author-only save, failure/retry artwork, track/disc preservation, persisted restore and previously accepted edits.
- [ ] Run focused tests, typecheck and full npm test; commit.

## Task 2: Durable mutation and restart
Files: mobile/metadataEditPersistence.ts, localStageStore.native.ts, localStageStore.ts, App.tsx; persistence tests.
Interface: transactional affected-URI patch retaining every unrelated row; preparation checkpoint separate from transient progress labels.
- [ ] Reproduce published-subset bulk replacement and interrupted-scan startup.
- [ ] Back up catalogue before migration; patch full catalogue transactionally and retain last good publication.
- [ ] Stress cancellation, stale writes, failure rollback and restart; focused/full suite; commit.

## Task 3: Bounded local archive evidence
Files: native archive bridge and new bounded native reader; mobile/localLibrary.ts and archive adapter; native fixture tests.
Interface: URI probe returns selected metadata text/cover and typed failure within specification budgets.
- [ ] Build seekable ZIP/EPUB/CBZ and corrupt/nonseekable/oversized fixtures with failing read-budget tests.
- [ ] Implement tail/directory/XML/cover access with byte/time/cancellation limits, then CBR/CBT bounded format paths.
- [ ] Connect normal preparation without full-copy fallback; test comics and EPUB end to end; commit.

## Task 4: Providers, filters and web UI
Files: online metadata modules, real Expo UI, Playwright fixtures/config/tests.
- [ ] Live-test title/author/ISBN and configuration errors at provider boundaries.
- [ ] Seed known catalogue; reproduce all filter controls and editor save/search/accept/restore sequence.
- [ ] Fix demonstrated defects; screenshot phone/Fold canonical screens; run full suite; commit.

## Task 5: Native footer and Living Book
Files: App.tsx, LivingBookCanvas.tsx, playerExperience.ts; native UI and renderer tests.
- [ ] Reproduce footer press/keyboard/resize compositor failure natively before another renderer change.
- [ ] Drive real Canvas timing/lifecycle with controlled time; fail on duplicated 1900/1500 ms timing.
- [ ] Feed canonical timings to both scheduler and Canvas; verify pause/leave/return sequence.
- [ ] Native test, focused/full suite and canonical visual checks; commit.

## Task 6: Performance and release
- [ ] Profile realistic large-library fixtures: bytes, requests, cancellation, UI yielding and stage durations.
- [ ] Run complete web/native/SQLite/CI checks, review whole branch and fix important findings through TDD.
- [ ] Build APK from integration branch only; retain explicit physical Fold acceptance gate.
