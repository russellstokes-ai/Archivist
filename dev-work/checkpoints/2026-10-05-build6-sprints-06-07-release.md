# Build 6 Sprints 6–7 — commercial refinement and release gate

Date: 5 October 2026  
Branch: `build/0.9.4-test6-20261004`  
Executable/tested head: `6ff1ef1606dc882e97cc3c774fb55398c3330e33`  
Release: `v0.9.4-testing.6`

## Sprint 6 — refinement completed

Two release-quality gaps were closed before packaging:

1. **Truthful explicit refresh completion**
   - Automatic library scans still publish quickly and enrich in the background.
   - A user-triggered **Refresh metadata & covers** now waits for the full enrichment pipeline before reporting completion.
   - This prevents Settings from saying “complete” while provider metadata/covers are still changing.

2. **Durable provider covers**
   - Online book and comic cover URLs are cached in Archivist private storage after enrichment.
   - Cache names are deterministic by provider URL.
   - Download concurrency is capped at three.
   - Each image is capped at 12 MB.
   - Failed/oversized downloads retain the remote URL as a safe fallback.
   - Existing local/manual covers are not touched.
   - A newer scan cancels stale caching work.

Rollback point before Sprint 6: `backup/0.9.4-pre-sprint6-refinement-20261005`.

## Sprint 7 — release gate completed

The Build-6 branch was added to the Android test-APK release workflow. A release-contract suite locks:
- app/package version `0.9.4`
- Android `versionCode 96`
- workflow `TEST_BUILD: '6'`
- release lint
- package/signature/alignment/ABI validation
- emulator install/cold launch
- Sprint-5 branded cold launch
- Sprint-6 durable provider-cover cache
- truthful explicit metadata refresh completion

## Same-SHA final evidence

All release gates below ran against `6ff1ef1606dc882e97cc3c774fb55398c3330e33`:

| Gate | Run | Result |
| --- | --- | --- |
| Mobile | `37242628841` | PASS — Expo Doctor, TypeScript, 49/49 suites, version consistency, web bundle |
| Android native | `37242628825` | PASS — native contracts, Kotlin compile, merged manifest |
| iOS | `37242628877` | PASS — native generation, CocoaPods, complete Simulator compile |
| Android Test APK | `37242628844` | PASS — release lint/build/verify/upload + emulator cold-launch + release publish |

## Published APK

- File: `Archivist-0.9.4-test-6.apk`
- Size: 59,361,797 bytes
- SHA-256: `b5194e683497d6734e1f39368b6dd72772bc44800cb5f56361e1b2a47de66177`
- Tag: `v0.9.4-testing.6`
- Release target: `6ff1ef1606dc882e97cc3c774fb55398c3330e33`

## Acceptance boundary

Automated release readiness is GREEN. Physical-device acceptance is still required for:
- Fold closed/open layout and Settings interaction
- branded splash perception/timing
- live Google Books/Metron enrichment
- large real-library performance and offline cover persistence
- Player/page-turn feel, Comic Focus and Atlas gesture/visual quality
