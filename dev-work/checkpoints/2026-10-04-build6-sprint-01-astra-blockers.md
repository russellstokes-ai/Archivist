# Build 6 Sprint 1 — Astra blocker integration

Date: 4 October 2026  
Branch: `build/0.9.4-test6-20261004`

## Scope

Integrated the Astra Test 5 blocker bundle on top of the released Test 5 lineage without reverting the later documented state.

The integration includes:
- Live-player book motion: controlled open on play, close on pause, slow repeated page turning while playing, stale callback cancellation and skip-page motion.
- Reader navigation/swipe/full-screen fixes.
- Native archive/CBR/CBT handling and safety limits.
- Metadata-cache/scan-stability fixes from the blocker bundle.
- The blocker bundle's expanded regression coverage.

## Native defect found and fixed

The first Android-native run exposed a genuine Kotlin compile error in `ArchivistArchiveModule.kt`: the fullscreen bridge referenced `currentActivity` directly.

Fixed at:
- `7184d87ae0d70eeba1348f387283cd876ce9e216`
- changed to the React application context activity accessor before window/insets operations.

## Evidence

- Mobile checks: run `37236065381` — PASS.
- Android native checks: run `37236065446` — PASS, including native contract tests, Kotlin compile and merged manifest.
- Final branch-level iOS proof is also supplied by Build 6 Sprint 2 run `37237039929`, which compiles the same Sprint 1 native integration plus subsequent TypeScript-only metadata work — PASS.

## Acceptance boundary

Automated/native integration is GREEN. Physical phone/Fold interaction, real CBR libraries and live player visual acceptance remain part of the Build 6 device pass.
