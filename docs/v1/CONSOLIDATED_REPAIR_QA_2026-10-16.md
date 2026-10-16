# Consolidated repair and QA builds — 16 October 2026

User instruction: “Ok do all fixes and lets get an apk and server build to test”. Repairs are isolated on draft PR #83; no merge/install/release.

## Implemented source corrections

- A1: reset playback duration for each loaded track; a new-track seek no longer clamps to the old duration.
- A2: shared App selection cancellation across automatic restore, explicit audio and reader selections, sign-out and unmount. Playback.cancelPending invalidates a server open when a reader is selected without interrupting already established audio/reader coexistence.
- A3/A4: local EPUB now follows container/OPF spine order, includes every supported section rather than silently capping at 80, reconstructs markup through an element/attribute allowlist, and embeds vetted local raster images. No untrusted raw HTML, script/event attributes, external image URLs or SVG script executes through this pipeline.
- EPUB resource MIME resolves from manifest (including extensionless images); raster SVG wrappers are supported. Unsupported vector SVG or MathML produces an explicit error instead of silently dropping content. Limits: 4 MiB source section, 8 MiB encoded image, 24 MiB generated content, 200,000 visited nodes/depth 100; oversized books fail explicitly, not partially. This is bounded complete loading, not a demand-loaded EPUB engine.
- A5: PDF Reduced Motion changes pages immediately without turn animation.
- A6: manual catalogue refresh/pagination validates captured account/filter scope before publishing results; scope changes reset pagination locks.
- #20 source candidate: a new reward event gets a fresh React/native Lottie instance, avoiding reused end-frame state. Assets, sizing and appearance unchanged.
- #25 source candidate: title identity gets a fresh Living Book wrapper; native WebView process/load failures receive at most two remount attempts. Canvas renderer, geometry, styles and approved animation remain byte-equivalent.
- Independent review identified pending controller-open cancellation, unsupported EPUB loss and stale reader completion on logout/unmount. All three were corrected with regressions.

## Verification

- 134/134 mobile test suites passed with JDK available. TypeScript passed. Android Expo export produced the Hermes JavaScript bundle successfully; this is not a native APK build.
- A1/A2/A6 and EPUB order/security had baseline reproductions; reviewer corrections have failing-then-passing targeted regressions.
- Exact source protection passes: 44 original immutable blobs, exact reversible App logic exception and exact reversible localReader content exception. Living Book wrapper is independently reversible before existing original renderer/hash assertions.
- Native lifecycle wiring is source/closure tested. Actual repeated Lottie/native WebView recovery is NOT device-accepted.
- Root Go and packaged Go tests pass. Linux amd64 and ARM64 static binaries compiled; amd64 disposable-DB health smoke passes. HA package and Docker/Compose source contracts pass. No actual Docker/HA container runtime was available here.
- Earlier full mobile runs exposed expected old whole-file protection assertions and legacy EPUB fixture lacking OPF; assertions now reverse exact scoped changes before comparing original hashes, and fixture is a valid EPUB. No suites disabled. A subsequent run terminated before its final summary; it is not counted as a pass. The final complete run is 134/134.

## Server test delivery

`Archivist-Server-QA-2026-10-16.zip` contains Linux amd64/arm64 binaries, deterministic HA source ZIP, portable Docker/Compose source ZIP, SHA256SUMS, provenance and testing instructions. Server core is unchanged from remote `a48d3470ca0c1692e422e6ed757679be6865277b`; version is `qa-20261016-a48d347`. VCS auto-stamping was unavailable in the isolated build environment, so the build uses `-buildvcs=false` and explicit version/source provenance.

Use disposable data and test media, not the family database or the existing HA instance. ARM64 runtime, NAS/Pi/HA power-loss and container execution remain hardware acceptance work. The advanced server administration/workbench/relink scope is still incomplete; this package does not claim those features are finished.

## APK gate

Existing `.github/workflows/android-apk.yml` is manual-only and requires `qa_confirmation=true`. It builds `app.archivist.reader.qa` with a debug key, validates native artifacts and runs emulator smoke checks. The GitHub connector has no workflow-dispatch operation and this environment has no Android SDK. No push trigger was added to evade that manual gate.

Run **Android QA APK (manual only)** on `integration/archivist-v1-auto-restore-recovery-20261016`, confirm QA, and retrieve the verified artifact after completion. This report is not an APK or native build-success claim.

## Still open

Original comics #16 needs the failed file/URI classification; Atlas #19 needs the affected published catalogue; alignment #17 needs actual rendered keyframe measurements. No speculative changes were applied to those protected experiences. #23/#31/#32 and #20/#25 candidates require Fold acceptance. All eight original issues remain unaccepted on-device.

Rulings: preserved working scanner/Assist and renderer; repaired content pipeline with explicit unsupported/size refusal rather than unsafe partial output; did not invent original-issue fixes without fixtures; did not bypass manual APK gate. Consequence: some books now fail clearly instead of silently losing content, and three original issues still need diagnostic evidence. Commercial NO-GO remains.
