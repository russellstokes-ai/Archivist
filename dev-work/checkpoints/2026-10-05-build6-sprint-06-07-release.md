# Build 6 Sprints 6–7 — commercial refinement and release gate

Date: 5 October 2026  
Branch: `build/0.9.4-test6-20261004`  
Executable/tested head: `6ff1ef1606dc882e97cc3c774fb55398c3330e33`

## Sprint 6

Commercial refinement was intentionally defect-driven rather than a redesign.

Two release-quality issues were closed:
1. Explicit metadata refresh now waits for the complete staged enrichment pipeline before reporting completion. Automatic scans remain asynchronous.
2. Provider book/comic artwork is cached into bounded app-private storage for offline durability without replacing manual/local covers.

Online cover caching is deterministic, concurrent but bounded, size-limited to 12 MB per image and cancelled if a newer scan supersedes the current work.

## Sprint 7 final gate

The same SHA `6ff1ef1606dc882e97cc3c774fb55398c3330e33` passed all release gates:
- Mobile `37242628841` — PASS, 49/49 suites.
- Android native `37242628825` — PASS.
- iOS `37242628877` — PASS complete Simulator compile.
- Android Test APK `37242628844` — PASS including release lint, APK build, signature/package/alignment/ABI checks, emulator launch and release publication.

## Test Build 6

- Archivist 0.9.4
- Android versionCode 96
- Test iteration 6
- Tag `v0.9.4-testing.6`
- APK `Archivist-0.9.4-test-6.apk`
- Size 59,361,797 bytes
- SHA-256 `b5194e683497d6734e1f39368b6dd72772bc44800cb5f56361e1b2a47de66177`

## Runtime boundary

CI and emulator acceptance are green. Physical Galaxy Fold testing remains required for final visual/motion/large-library acceptance. Do not mark those physical observations complete until tested on device.
