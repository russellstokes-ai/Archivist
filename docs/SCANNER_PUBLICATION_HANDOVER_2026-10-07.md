# Archivist — Scanner, Publication, Metadata & Build Handover

**Date:** 7 October 2026  
**Active development branch:** `dev/test13-canonical-media-pipeline`  
**Draft PR:** #13 — `WIP: Test 13 canonical media pipeline hardening`  
**Canonical baseline:** Test 13, commit `583ec8dde2936a2979648c010a4bd44cdc75e01d`  
**Canonical main:** must remain unchanged until physical-device acceptance.

## 1. Purpose

This document captures the current state of the Archivist scanner / metadata / publication work so it can be resumed without losing decisions, regressions, fixes, CI history or real-device findings from the Test 13 hardening work.

Target flow:

> **Discover → Group → Identify → automatic Smart Search / metadata enrichment → acquire Library cover + Living Book jacket → Publication Gate → Publish**

The UI remains locked to canonical Test 13 unless a targeted change is explicitly requested.

## 2. Canonical baseline and safety rules

### Canonical Test 13
- SHA: `583ec8dde2936a2979648c010a4bd44cdc75e01d`
- Canonical branch: `canonical/archivist-test13`
- Recovery branch: `recovery/test13-canonical`
- Tag: `v0.9.4-testing.13`
- Canonical APK: `Archivist-0.9.4-test-13.apk`
- Canonical APK SHA-256: `8a4d14bdf22b48bccfd45ade3d78b6d8316f0d3219680ab19e347842961a75ba`
- Issue #11 = canonical baseline.
- Issue #12 = canonical scanner / metadata / sorting plan.
- Do not use the later broken `dbfa138...` 0.9.5 lineage.
- Do not merge PR #13 until physical-device acceptance.
- Keep canonical `main` untouched.

## 3. Architecture already implemented

### Staged vs published library
There are now separate states for:
- staged/discovered local media
- published Library items

Unresolved works stay staged. Existing accepted Library items remain stable during rescans.

### Work-level grouping
- Multipart audiobooks group into one work.
- Track/disc/chapter order remains file-level metadata.
- Root-level and messy audio grouping was improved using path/filename/embedded work evidence.
- A 36-part audiobook should appear as one work, not 36 books.

### Publication pipeline
New module: `mobile/publicationPipeline.ts`

Current blockers include:
- `needs-review`
- `missing-title`
- `missing-author`
- `missing-library-cover`
- `missing-living-book-cover`
- remote/non-cached artwork blockers

### Dual artwork
New module: `mobile/dualCoverPipeline.ts`

Artwork model:
- `libraryCoverUri`
- `livingBookCoverUri`

Rules:
- remote URLs alone never satisfy publication
- square audiobook art can remain Library artwork
- portrait provider art is preferred for Living Book
- a valid local square audiobook cover can now temporarily also serve as Living Book artwork with low confidence, allowing later portrait upgrade

### Metadata workflow
`mobile/onlineBookMetadata.ts` and `mobile/metadataSearchWorkflow.ts` support:
- Smart Search
- Deep Search
- ranked candidates
- work-level matching
- manual clues
- Accept & Save
- protected manual metadata authority

### Whole-work sorting
Sorter now operates transactionally at work level:
- preflight all files
- copy all
- verify
- checkpoint
- delete originals only after verification
- commit whole work

## 4. The 28% freeze — root cause and fix

### Physical symptom
Prepare Library repeatedly appeared to freeze at exactly **28%**.

### Progress mapping
The old scan progress mapped:
- discovery: 3–18%
- matching: 18–22%
- duplicate check: 22–24%
- preparing: 24–28%
- **reading-metadata: 28–46%**

So 28% identified the start of deep embedded/local metadata parsing.

### Root cause
`enrichLocalEmbeddedMetadata()` was called across large parts of the local library.

A JS `Promise.race()` timeout only stopped waiting in JavaScript. It did **not cancel the underlying Android SAF/native file operation**. Timed-out native reads could continue while new reads started.

EPUB/CBZ fallback code could also read entire archives into Base64 and process them with JSZip, creating substantial memory and CPU pressure.

### Fix
Normal preparation is now shallow:
- folder traversal
- path/URI
- filename
- extension
- cheap file size/modtime
- safe sidecars
- persisted unchanged metadata
- path/folder inference
- grouping
- bounded online lookup

Normal scan no longer bulk deep-opens every EPUB/CBZ/M4B/audio file.

Deep local inspection is now:
- explicit
- selected-work only
- concurrency 1
- one EPUB/comic file
- tiny sample for multipart audio
- first timeout opens the circuit rather than launching more heavy reads

Regression test:
- `mobile/scanner-shallow-path.test.cjs`

Result: the hard 28% freeze was removed on-device.

## 5. Second performance problem — scanner still too slow

### Device feedback after freeze fix
- progress moved correctly
- no hard hang
- scan was still too slow
- only 2 books published
- many obvious books went to Needs Attention

### Causes found
Normal preparation was still doing too much:
- online lookups for optional fields such as description, genre, publisher and year
- multiple Open Library queries per work
- a second Open Library work-detail request after a good match
- catalogue-wide local-cover recovery
- ambiguous online results could downgrade useful path identification

### Fixes implemented
Normal preparation is now publication-focused:
- lookup only when identity or cover is missing
- one precise title+author query where possible
- title-only fallback only if needed
- optional descriptive metadata no longer delays publication
- Open Library detail hydration is Deep Search only
- strong title+author matches can auto-accept despite edition variants
- ambiguous online proposals cannot downgrade an already-resolved work
- bulk local-cover extraction removed from normal scan

Relevant regression coverage:
- `mobile/scanner-fast-publication.test.cjs`
- `mobile/online-book-metadata.test.cjs`
- updated scan stability/release blocker tests

## 6. Stale metadata cache bug

Earlier broken scanner builds could leave live negative or ambiguous cache entries.

The faster scanner could therefore inherit an old “no match” decision and skip a fresh lookup.

### Fix
Online book cache keys were versioned with a `v2|` prefix so the optimized matcher gets a clean retry instead of inheriting stale earlier results.

## 7. Publication gate — current remaining problem

### Original strict gate
A work required:
- title
- author
- `needsReview=false`
- cached local Library cover
- cached local Living Book cover

This was too strict.

### Artwork relaxation already implemented
For an identified audiobook:
- local square cover may publish as Library cover
- if no portrait Living Book jacket exists, that same local cover may temporarily serve as the Living Book jacket
- confidence remains low so a proper portrait jacket can replace it later

### Physical-device progression
- first shallow build: **2 books**
- optimized fast scanner: **2 books**
- publication + cache + metadata-save fix: **4 books**

This proves the scanner is discovering files and some gate changes are working, but publication is still suppressing most obvious works.

### Current likely choke point
The final gate still effectively requires:
- non-empty author
- no work-level `needsReview`
- no important identity conflict

`groupLocalWorks()` currently treats:
- missing title **or missing author** as unresolved
- any important conflict on a constituent track as a work-level review blocker

For real libraries this is too conservative.

The path parser can often derive a reliable title but not always a confident author from every folder layout.

### Next required change
Make publication work-level and pragmatic:
1. distinguish **identity ambiguity** from **metadata incompleteness**
2. do not hide an otherwise obvious work merely because author is temporarily blank
3. publish title-identifiable works with valid grouping and artwork when there is no actual identity conflict
4. enrich missing author/metadata afterward
5. keep Needs Attention for genuine ambiguity, conflicting identities or uncertain grouping
6. keep stricter requirements for file organising/moving than for simply showing a work in Library

This is the main unresolved task as of 7 October 2026.

## 8. Metadata editing bug and fix

### Device failure
Editing metadata in Needs Attention appeared not to save.

### Root cause
The editor could target only the single raw file URI selected.

For a multipart audiobook:
- one chapter changed
- the other parts kept old metadata
- work-level grouping recalculated from all parts
- the edit effectively disappeared

### Fix implemented
Editing from Needs Attention now:
- resolves the containing grouped work
- applies metadata to every physical part in that work
- preserves file-level track/chapter ordering data
- writes manual overrides for all parts

### Accept & Save
Accepted Smart/Deep Search metadata is also persisted as protected overrides so future scans cannot reconstruct stale path data over the user-approved identity.

### Save verification
After Save Details:
- stage data is written
- persisted stage is read back
- title / author / series are verified
- the editor must not silently close if persistence cannot be confirmed

Regression test:
- `mobile/metadata-editor-persistence.test.cjs`

This is implemented and test-green but still needs final physical-device confirmation.

## 9. Current normal-scan policy

Normal Prepare / Refresh should:
1. discover file/folder structure
2. collect cheap properties
3. use sidecars and persisted unchanged metadata
4. infer identity from path/filename
5. group files into works
6. do minimal online lookup only when needed
7. acquire/cache artwork
8. run publication gate
9. publish obvious works
10. leave genuinely ambiguous works staged / Needs Attention

Normal scan must NOT:
- bulk Base64-read EPUB/CBZ archives
- deep-open every audiobook
- rely on Promise.race as if it cancels native I/O
- enrich optional metadata before Library availability
- run catalogue-wide embedded-cover extraction
- downgrade resolved works because of ambiguous online suggestions

## 10. Deep Search policy

Deep Search may:
- inspect only the selected work locally
- use serial local reads
- sample multipart audiobook parts
- perform broader provider queries
- hydrate optional descriptive metadata
- allow user candidate selection
- persist accepted identity as protected overrides

## 11. APK/device history from this hardening cycle

### Shallow-scanner build
Physical result:
- 28% freeze removed
- scan still slow
- only 2 books published
- too many Needs Attention items

### Fast publication-focused scanner
Physical result:
- clearly faster
- still only 2 books published
- metadata edits did not persist

### Publication + metadata-save build
Included:
- v2 metadata cache generation
- audiobook artwork fallback
- whole-work editing
- persistent accepted metadata overrides
- read-back verification

Physical result:
- **4 books published instead of 2**
- still far below the expected number of obvious works

Conclusion:
The remaining priority is publication eligibility / work-level identity confidence, not scanner speed.

## 12. CI and build notes

The active source has repeatedly passed:
- Expo Doctor
- TypeScript
- Mobile JS tests
- version consistency
- Expo web bundle

Android hosted runners repeatedly stalled for an excessive period inside `:app:lintRelease`.

An isolated APK-build branch was therefore used to bypass only the duplicate stuck lint step while still running:
- Expo Doctor
- dependency audit
- TypeScript
- full mobile tests
- release assemble
- package verification
- signature verification
- alignment verification
- artifact upload
- emulator smoke

Native Android code was unchanged during those JS/TS fixes and lint had passed on earlier Test 13 builds.

Do not treat the lint-skip workaround as a canonical production workflow change.

## 13. Important files

Scanner / metadata:
- `mobile/App.tsx`
- `mobile/localLibrary.ts`
- `mobile/libraryIntelligence.ts`
- `mobile/metadataSync.ts`
- `mobile/localWorks.ts`
- `mobile/onlineBookMetadata.ts`
- `mobile/metadataSearchWorkflow.ts`
- `mobile/embeddedMetadata.ts`
- `mobile/audioMetadata.ts`

Publication:
- `mobile/publicationPipeline.ts`
- `mobile/dualCoverPipeline.ts`

Progress:
- `mobile/scanFeedback.ts`

Key tests:
- `mobile/scanner-shallow-path.test.cjs`
- `mobile/scanner-fast-publication.test.cjs`
- `mobile/metadata-editor-persistence.test.cjs`
- `mobile/online-book-metadata.test.cjs`
- `mobile/publication-pipeline.test.cjs`
- `mobile/dual-cover-pipeline.test.cjs`
- `mobile/scan-stability.test.cjs`
- `mobile/test10-1-release-blockers.test.cjs`

## 14. Immediate next sprint

### Goal
Turn the current **4 published books** result into automatic publication of the majority of obvious works without reintroducing hangs, slowness or false positives.

### Work
1. Inspect publication blockers per work:
   - needs-review
   - missing-title
   - missing-author
   - missing-library-cover
   - missing-living-book-cover
   - remote artwork
2. Separate incomplete metadata from ambiguous identity.
3. Rework `groupLocalWorks()` so one weak constituent file does not poison a clearly resolved work.
4. Permit publication of clearly identifiable works with valid grouping + artwork even if author is temporarily unavailable.
5. Continue author/optional metadata enrichment after publication.
6. Keep genuine ambiguity in Needs Attention.
7. Add regression cases for:
   - `Author / Title / file.ext`
   - `Title / file.ext`
   - `Author - Title.ext`
   - root-level multipart audiobook
   - numbered chapters
   - missing author but unique work title
   - one weak chapter inside a coherent audiobook group
8. Build isolated APK only after tests pass.
9. Physical Fold test remains decisive.

## 15. Acceptance criteria for next APK

The next APK should:
- remain responsive during Prepare Library
- never recreate the 28% freeze
- maintain current faster scan speed
- publish substantially more than 4 obvious works from the same test library
- reserve Needs Attention for genuinely ambiguous works
- preserve metadata edits after close/reopen/rescan
- group multipart audiobooks correctly
- preserve track/disc/chapter ordering
- preserve locked Test 13 UI
- remain unmerged until physical-device approval

## 16. Current assessment

The original scanner freeze is solved and the architecture is substantially safer.

The current bottleneck is **over-conservative publication policy plus real-world path/author inference**. Most remaining work should focus narrowly on publication eligibility and work-level identity confidence rather than another scanner rewrite.
