# Fresh Archivist scanner recovery checkpoint — 2026-10-09

## Immediate issue

The user reports that the delivered whole-app APK does not load. Treat this APK as failed physical-device acceptance, not a working release. Launch failure has not yet been reproduced or diagnosed. Do not claim a fix from compilation alone.

## Exact delivered build

- Repository: russellstokes-ai/Archivist.
- Isolated branch: feature/archivist-scanner-vnext-real-library; no main merge.
- App source: 56dbe941ab1434af07c0bc8528c406ee1bacb2a8.
- Packaging workflow commit: a68b46fe02f731ace5dfc083d87f6d6fd66fe79f (local equivalent f9759b8).
- Build run: https://github.com/russellstokes-ai/Archivist/actions/runs/37984156691.
- APK: Archivist-Fresh-Scanner-Fold-Test-20261009-56dbe94.apk, 45,125,848 bytes.
- SHA-256: ecdcee377127697fce48e9eeba70738ebbf8f746cdbb9ff5be4c86b79e9062f8.
- Package: app.archivist.reader.scanneracceptance; ARM64; optimized release, repository debug signing key. Installs separately and does not import existing installed app data automatically.
- Download: https://github.com/russellstokes-ai/Archivist/releases/tag/scanner-vnext-fold-test-20261009-56dbe94.

## Evidence and its limits

- Delivered source passed TypeScript, 90/90 mobile suites, release lint, APK signature/package/alignment checks.
- Native SAF lab passed 12/12 instrumented tests on Android 9/API 28 and Android 15/API 35: run 37982696041. These are native component tests, not proof the whole app launches.
- Whole-app run 37982696174 compiled successfully, but its test stopped before installing/launching the app because ffmpeg was absent. No whole-app launch success exists.
- User explicitly authorized an unvalidated Fold test APK with 5% usage remaining, superseding the earlier delivery timing restriction. This did not waive truthful reporting or establish acceptance.
- Real inventories: 8,016 records accounted for offline; not original-media decoding or a complete grouping accuracy score. Hive and Thorn/Talon: 61 confirmed parts grouped correctly. Stormlight remains uncertain.
- Controlled 5,000-file/50-work runtime + actual SQLite benchmark: cold 26,117 ms, warm 9,992 ms, warm clue calls 0; injected source/metadata/artwork ports, not Android timing or large messy-library proof.

## Work included in app source

Fresh discovery/grouping/work identity and durable SQLite runtime; canonical onboarding/scan/editor/Assist bindings; work-level search, paging and conflict approval; mandatory canonical editable Genre and published-work Atlas projection; bounded native operations/artwork and cancellation; manual-field/prior-publication protection, progress keys and exact physical-document overlap deduplication. Existing whole Archivist reader/player/Library/Shelf/Atlas/Stats/settings remain in the app. Historical scanner is not the fresh implementation baseline.

Canonical UI changes are strictly reversible in UI_BINDING_EXCEPTIONS.json. Fourteen other original raw UI hashes remain unchanged. User specifically requires the normal finished-looking app, with no testing notes or checklists inside it; test limitations belong beside the download.

## Outstanding acceptance

Launch failure first; integrated scanner/onboarding/Save/Assist/Library/Atlas, cancellation/restart/permissions, large messy-library Android profiling, screenshot comparisons, embedded/unusual cover/media coverage, ambiguous migration/split/merge and original physical Fold acceptance. Provider auto-accept is disabled pending calibration. Unknown/missing works must stay visible; preserve manual metadata and progress.

## Recovery and next steps

1. Preserve this checkpoint in the repository before additional fixes.
2. Reproduce whole-app release launch on a hosted Android emulator and capture crash/logcat/UI evidence before changing app behavior. Repair the missing test dependency; require a real launch check before replacement APK distribution.
3. Diagnose the specific observed cause, add a meaningful regression check, fix it and verify the app stays open and displays canonical UI.
4. Package the complete app from the corrected exact revision, verify checksum/signature, and provide a distinct replacement link. Do not overwrite the failed APK silently.

Local repository: work/Archivist-scanner-vnext. Recovery bundle: work/archivist-main-checkpoint-20261009.bundle. Prior dirty checkout is untouched. Ignore the harmless untracked .github/scripts/__pycache__/; do not include it in publication. Shell Git push authentication is unavailable; publish exact verified Git trees through the GitHub connector, with an expected-head lease. Local Git commits require explicit Codex name/email options. No further user media files are needed to investigate launch.

Investigation started: added scanner-launch-smoke.py to install/start the actual release APK and require visible app UI, a surviving process, and no startup crash, with crash/logcat/XML/screenshot capture. Whole-app fixture workflow now explicitly installs ffmpeg, the previous missing dependency. These are diagnostic changes; no app fix has yet been claimed or made. Check the latest Fresh scanner whole-app acceptance run on this branch for the reproduced launch result.
