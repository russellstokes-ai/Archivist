# Device polish Sprint 12 — final regression & APK release

Date: 4 October 2026  
Release source branch: `build/final-apk-0.9.4-20261004`

## Release identity

- Product version: **0.9.4**
- Testing iteration: **build 5**
- Android versionCode: **95**
- Tested source commit: `6bc68362f1ab48e24ff47aa684bbbd1bd3c7e468`
- Release tag: `v0.9.4-testing.5`
- APK: `Archivist-0.9.4-test-5.apk`

A four-part marketing version such as `0.9.4.5` was deliberately not used because the project retains standard three-part app versioning. Build 5 is represented as a testing iteration, while Android versionCode is incremented to 95 so this APK can install as a newer build.

## Sprint 12 goal

Run the full release gate against the accumulated Sprints 1–11, make no unrelated feature/UI changes, and produce a fresh test APK only after all automated/native gates are green.

## Final automated evidence

All runs target exactly `6bc68362f1ab48e24ff47aa684bbbd1bd3c7e468`.

- **PASS Mobile checks:** run `37229417563`
  - dependency installation
  - Expo Doctor
  - TypeScript
  - full maintained mobile test suite
  - version consistency
  - production Expo web bundle

- **PASS Android native checks:** run `37229417463`
  - native contract tests
  - Kotlin compilation
  - merged Android manifest

- **PASS iOS checks:** run `37229417437`
  - dependency installation
  - Expo Doctor
  - TypeScript
  - iOS project generation
  - CocoaPods
  - complete iOS Simulator compile

- **PASS Android Test APK:** run `37229417444`
  - dependency/runtime audit
  - Expo Doctor
  - TypeScript
  - full mobile tests
  - version metadata verification
  - Android release lint
  - optimized release APK build
  - package ID / versionCode / versionName verification
  - permission contract (notifications retained; microphone absent)
  - APK signature verification
  - 16 KiB zip alignment verification
  - arm64-v8a and x86_64 ABI verification
  - artifact upload
  - emulator install
  - MainActivity launch
  - resumed-activity/process check
  - fatal startup-log check
  - tested APK release publication

## Artifact evidence

- Workflow artifact: `Archivist-0.9.4-Test-5-APK`
- Artifact ID: `11313705218`
- Published release: `Archivist 0.9.4 test build 5`
- APK SHA-256: `e6915b85f57cd86ea7da9436d5ac7ecc5f189bd85f5119cbbe726a73dfe9603f`

## Scope and acceptance boundary

Sprint 12 added no product features and made no Shelf, Library, Player, Reader, Atlas, Stats, Profile, navigation or Fold redesign. Its only source changes are release/build metadata needed to distinguish test build 5 and publish it safely.

Automated release engineering is GREEN. Remaining acceptance is the user's physical-device pass, including real Galaxy Fold closed/open visual review, real media libraries, gestures, system pickers and other device-only interactions.
