# Test build 6: reported test-build-5 blockers

Base: released 6bc68362f1ab48e24ff47aa684bbbd1bd3c7e468, plus release documentation through ca0208dedc7f546e2b1e38726225b5ff47609a36.

The user's physical-device report supersedes the previous statement that only acceptance remained. Test build 5 has blocking playback-animation, local CBR and responsiveness defects.

## Changes

- Playback pause closes the Living Book; play opens it. A completion-driven scheduler repeats native page turns and cancels cleanly on pause/navigation. Reduced motion changes the state without animation. Existing seek flips remain.
- Preserve the Reader WebView and library panels through parent updates. Hoist stateful cover components to prevent repeated image reloads. Suspend offscreen Atlas graph work, throttle scan progress, and yield between batches/files.
- Local reader startup tolerates unavailable WebView localStorage. Local CBR pages are indexed and naturally sorted without decoding all images, then extracted one at a time on an Android worker. Late responses cannot overwrite a newly opened book.
- Swipe navigation replaces local reader Prev/Next/Sound buttons. Page sound is persisted in Settings. Full-screen reading hides app chrome and Android system bars; tap reveals controls, Android Back exits full screen.
- Read embedded ComicInfo.xml from CBR. Revisit previously empty metadata caches; explicit Settings/Details metadata refresh bypasses cached metadata while preserving manual overrides.
- Android ZIP/CBZ/EPUB extraction indexes on a worker and reads bounded entries on demand, replacing whole-archive JS decoding and the 64 MB metadata/cover cutoff. Temporary ZIP snapshots are released when reading/extraction finishes.

## Verification

- Local TypeScript: passed.
- All 42 maintained mobile suites: passed.
- Reader runtime regression executes generated JavaScript with storage throwing SecurityError, requests and injects first page, tests swipe forward/back, ignores stale page responses and applies settings.
- Player regression exercises four completed turns and cancellation of late animation callbacks.
- Native Kotlin compile, production Android APK, emulator launch and production web bundle: see the exact commit's CI runs; pending at initial submission.

## Acceptance still required

- User's actual local CBR: supported compression, page decoding, double-tap focus, portrait/Fold, full screen, swipe and sound preference after restart.
- Physical playback: open/close, continuous turns over several minutes, skip flips, buffering and pause/resume.
- Representative small and large libraries: refresh and organisation responsiveness, coverage counts, source permissions and embedded artwork availability.
- Missing metadata/artwork is not guaranteed to exist in source files. No online enrichment service has been added; automatic internet metadata lookup remains disabled. Unsupported/password-protected RAR variants and corrupt/oversized entries may still require a clear error or source conversion.
- iOS retains its existing archive fallback; Android worker extraction must not be described as an iOS improvement.

Candidate version: 0.9.4, Android versionCode 96, test iteration 6. The fix branch uploads a candidate artifact; publication remains on the normal release branch.
