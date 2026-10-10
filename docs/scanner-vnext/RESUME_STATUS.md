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

User clarified the failure: the Fold app closes immediately on opening. Diagnostic build targets the hosted emulator's x86_64 ABI only to avoid compiling unused architectures while investigating startup; replacement physical-device APK must still contain ARM64. No behavior/UI change has been made on speculation.

Launch failure REPRODUCED: hosted run 37986311028/job 114009570320 crashed immediately with JavascriptException TypeError: undefined is not a function in Client/useMemo. App computes phoneWorks using projectScannerWorks imported from scannerVNext/runtime. Actual Metro Android resolution selects runtime.native.ts instead of runtime.ts, and that adapter does not export projectScannerWorks. The same collision affects store/nativeAccess/providers, including adapter imports that resolve to themselves. New actual-Metro resolution regression failed before the fix. Rename native adapters to androidRuntime.native.ts, androidStore.native.ts, androidAccess.native.ts and androidProviders.native.ts, retaining runtimeFactory as the sole intended platform selection. Actual Metro resolution now passes on Android/iOS/web. App UI bytes remain unchanged. Full suite/typecheck and real release launch verification are pending; do not call this fixed until the app launch gate passes.

Corrected-source run 37992635188/job 114030476185: original JavascriptException is gone. Retrieved artifact 11645708271 and inspected launch-ui.png, launch-ui.xml, launch-logcat.log and launch-start.txt. Actual screen shows the normal Archivist Shelf/setup UI beneath an Android dialog Quickstep isn't responding; hierarchy contains only that system dialog, explaining the launch harness's empty app labels. Log confirms MainActivity displayed at +1,273 ms, React main started, native SQLite loaded, and no app fatal exception. This is evidence the corrected app renders; strict automated launch gate still failed due launcher ANR. Harness now dismisses only the observed Quickstep ANR via its recorded Close app bounds, never an Archivist ANR. Rerun required before replacement packaging. Pending local packaging workflow edits are not dispatched and must be updated to the rerun's exact source/run IDs after success.

Replacement delivery is configured to proceed automatically, without agent polling: exact source 542ea0b160ab04ec616deac034ba42858327bf74; launch evidence run 37994358817. Fold packaging waits up to 20 minutes for that run to complete, downloads only its exact-source artifact, and requires launch-result.json passed=true before building/publishing. A failed full scanner test does not manufacture launch success; a missing/failed launch result blocks delivery. New tag scanner-vnext-fold-fix-20261009-542ea0b; no old APK overwrite. User requested stopping repeated updates/polling to conserve usage. On resume inspect launch run 37994358817 and latest Fresh scanner Fold test APK run. Complete-app/physical Fold acceptance still pending.

2026-10-10: Physical Fold report supersedes component-only success: initial scan did not hang, but 350 files appeared as books; scan slow; Organise hung. User requested independent implementation of folder-oriented behaviour, NOT copying AGPL BookOrbit source, mandatory auto-populated Genre and covers where reliable, low usage and no emulator troubleshooting. Fixed reproduced case: arbitrary/numeric MP3-family tracks within a folder now form one provisional work; separate book folders, M4B containers, root ambiguity, explicit identity conflicts/manual grouping remain protected. Disc separators supported. Assist now auto-applies one eligible match only when results have no issues/outstanding pages; respects online/automatic preferences and metadata revision/manual locks. Scan refreshes enriched work/art after acceptance. Genre remains required for completed publication, never for visibility/playback. Unknown genres remain reviewable, not invented.
Validation: focused grouping (including 100,000-part ordering), genre/Atlas, publication, pipeline, runtime and Assist checks passed; added missing-genre and automatic enrichment/ambiguity/paging/off-switch coverage. No device performance claim. Canonical UI untouched. Not built or delivered in an APK. Remaining: reproduce exact 350-file phone layout and diagnose scan timings/Organise hang; online search still awaited per work during scan (background scheduling remains unfinished). Verify all changes in physical Fold build before claiming fixed. No BookOrbit code copied.

2026-10-10 phone correction build: actual supplied phone inventory replay through fresh discovery/SQLite/grouping accounts 472 entries, 342 audio parts, 43 provisional work groups; Hive41 and Thorn/Talon20 assertions pass. 42 covers and 14 sidecars excluded from books; eight unknown support files now excluded and previously grouped support entries retired on rescan. Windows replay requires PYTHONUTF8=1 for Unicode paths. Replay took 865ms locally; NOT a phone benchmark and no live metadata proof.
Online Assist moved out of initial runtime.scan into sequential cancellable runtime.enrich after catalogue persistence. Accepted updates refresh app rows, including Save/Assist editor completions. Staged books display available covers and canonical Genre without requiring publication. Provider categories examine multiple subjects and nonmanual Unknown genre can be replaced by a meaningful provider value.
Organise mount moved from Library-only subtree to global sheet slot, fixing Shelf/Settings entry points without changing panel design. Metadata review now one representative per logical book; review actions navigate to Library. Organisation previews only metadata-ready meaningful-genre items, use fresh work grouping and stop after a five-second stalled destination check. Native provider timeout regression passed; exact physical panel hang still requires Fold confirmation.
Verification: 89/92 full suites initially passed; the three failures were an attempted test-version-code expression, reverted; all three then passed. Additional changed field/provider/sort checks pass, typecheck passes, canonical UI reverse manifest restores baseline. Whole-app emulator workflow changed to manual dispatch at user's request. Packaging uses current github.sha, complete app, same isolated test package/signature; no old pinned source. Optional GitHub release upload may fail due integration permissions; artifact upload remains authoritative. Await build result and deliver actual artifact. No claim all phone issues fixed until physical test.
