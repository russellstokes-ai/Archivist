# Test 7 device regression fixes — 5 October 2026

Source: Build 6 c4cd8cfb02d43b8ed837fa7a579c4d52b3dd85ec (the integrated Draftbit/universal mobile lineage), isolated branch `fix/device-player-metadata-reader-20261005`. Main and the locked layout are unchanged. Russell explicitly reopened player animation and Comic Focus and requested one combined fix pass, end-of-pass checks and an APK.

## Changes

- Replace separate closed/open crossfade with one spine-hinged cover and unfolding left page. Native transforms retain the current stage geometry. Ambient turns are 1.5 seconds plus a 0.3 second rest; seek retains 3/6-page turns and existing audio seek behavior. Player artwork resolves against the current catalogue.
- Package generated speech-focus JavaScript as a source string. Runtime Function.toString is unsuitable for Hermes bytecode and could prevent the speech controller from loading in the actual APK. The same detector source still generates web/server modules. No AI or external OCR.
- Comic drag renders an outgoing page above its neighbouring page, with finger-controlled perspective rotation. Release commits or restores, touch cancellation and rotation clean up, pinch cancels turning. Keep a bounded adjacent-page cache and prefetch neighbouring images. Suppress duplicate synthetic dblclick after a handled touch double tap.
- Retain downloaded/extracted covers across rescans; accept a cached local replacement for its remote source while retaining manual artwork. Include audiobooks in book-provider lookup. Empty embedded metadata results can now be reused until explicit refresh instead of repeatedly rereading unchanged files.
- Background enrichment no longer holds scan controls until all provider requests finish. Publish progress with bounded batches/time intervals, yield without waiting indefinitely for animation frames, debounce Android Auto catalogue persistence and remove discarded duplicate classification. HTTP provider requests have hard deadlines; cover downloads are paused on deadline.
- Native Android SAF document copying streams on a worker and verifies destination byte count. Failed newly created copies are cleaned up; originals are retained. Preview and copy counts are visible. Organisation invalidates background enrichment before taking its snapshot.

## Verification / delivery

Version 0.9.4, versionCode 97, test iteration 7. The APK workflow on this branch performs JS/type checks, native release lint/build, package/signature/alignment/ABI checks and emulator cold launch before publishing the testing APK. Uses the existing repository testing signing key, allowing upgrades over prior testing APKs.

Regression tests cover cached/manual-cover merging, executable packaged focus script, pointer-following page-turn behavior, page response isolation, cadence and release metadata. Existing contract tests were updated where they encoded superseded crossfade, cadence, blocking refresh or Build 6 version requirements.

Physical Samsung Fold acceptance and the user's actual library are not available in this environment. Do not claim those were tested or claim pixel-perfect Google Play Books parity. Bubble detection remains deterministic and can fall back to page zoom for uncertain/non-enclosed regions. Sorting continues the existing safe-copy behavior and does not delete originals.
