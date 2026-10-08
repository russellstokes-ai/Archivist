# Archivist Gate 1 — Android actual-pipeline diagnostic
Date: 2026-10-08
Status: Diagnostic branch; release only when CI build and package isolation pass.

## Locked baselines
- Baseline code: `feature/test21-scanner-and-book-loader-20261008`, original commit `aeefd4dc89c4de1c81b7e03eb998ae858da6aaff`.
- Baseline plan in `main`: `docs/SCANNER_REAL_LIBRARY_RECOVERY_PLAN_2026-10-08.md`.
- 12 permanent sanitised fixtures: `main:docs/fixtures/SCANNER_REAL_LIBRARY_SHAPES_2026-10-08.json`.
- Raw Windows SMB reports are PRIVATE in ChatGPT Library at `/Archivist/Scanner Diagnostics/2026-10-08/`. Do not commit original filenames or private network paths.

## What this diagnostic builds
- Build an APK from this branch only using `.github/workflows/android-pipeline-diagnostics.yml`.
- APK identity: `app.archivist.pipelineprobe` (different from installed Archivist `app.archivist.reader`). The original Android app and its state remain intact.
- Entry route points to `mobile/DiagnosticPipelineApp.tsx`, not normal App.tsx.
- Diagnostic uses real `scanLocalFolders`, `groupLocalWorks`, `fastAudioProbeUris`, `enrichLocalEmbeddedMetadata`, `synchronizeLocalMetadataCooperative`, `enrichLocalBoundedArchiveEvidence`, `enrichLocalBookCovers`, `cacheRequiredWorkArtwork`, `partitionLocalBooksByPublication`, `localWorksForReview`, `replaceLocalStageBooks`.
- The orchestration is *representative* rather than an identical run of the full App.tsx lifecycle. No user provider API keys or existing caches are copied.
- Normal library files are never renamed, moved, edited or deleted. Diagnostic private catalogue and logs are stored only inside this separate package.

## One-page UI
1. Select folder with Android's SAF folder picker.
2. Optionally enable a bounded online Open Library sample; OFF by default.
3. Run scan; observe elapsed timer, stage, progress, work counts.
4. If a stage stalls, use **Export partial JSON** even before it finishes; on-device checkpoints survive relaunch.
5. If finished, export full JSON using Android share sheet.

## Diagnostic stages
1. Discovery and cheap file properties; native SAF vs fallback rates and physical/logical counts.
2. Pre-enrichment grouping.
3. Initial isolated stage persistence and readback.
4. Bounded audio sample tags (1200ms per requested probe timeout; native cancellation not guaranteed).
5. Metadata synchronisation and regrouping.
6. Bounded EPUB and comic archive evidence.
7. Optional capped Open Library requests (up to 16 works).
8. Required artwork/work grouping without remote match data.
9. Local cover recovery, with timeout/skip statistics.
10. Publication gate, blocked reasons, per-work Needs Attention count.
11. Final isolated stage persistence.

## Hard limitations and next actions
- A JavaScript no-progress event can identify a pending phase but cannot forcibly cancel a stuck native storage-provider call.
- The explicit diagnostic pipeline approximates order of the full app; it does not yet capture every App.tsx UI and state propagation call.
- This build is for observing actual Android performance, not for making a permanent scanner speed fix or for validating all 12 grouping cases.
- Once a real-device JSON is shared, compare phase times and physical/logical counts, then fix the responsible stage in a separate branch.
- Do not replace the existing Archivist APK; the independent probe installs alongside it.
