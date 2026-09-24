# Archivist: halfway checkpoint

2026-09-23. User requested small packs, minimum token use and a halfway stop.
Worked through Packs 3-9, then resumed Pack 5 on user request. The product is NOT release ready. Partial
packs below must not be reported as finished. No changes pushed to GitHub.

## Pack ledger

| Pack | Status | Implemented | Remaining |
| --- | --- | --- | --- |
| 1 HA package | Code/test done | Root docs/licence/logo, correct Docker context, clean archive rebuilding, real repo URL | Actual upload/install |
| 2 HA runtime | Code/test done | Ingress base/relative URLs, scoped cookies, frame policy, option validation, multiarch base, PDF assets | Real Supervisor/Pi install, sidebar/browser, updates/restarts |
| 3 Mobile connection | Code/test done | HTTPS validation, API timeout/errors, redirect rejection, reader entry cookie flow and restricted navigation | Device TLS/WebView/cookie tests |
| 4 Mobile progress | Code/test done | Grouped/single-file context, resume, rewind, ordered revision saves, track advance and conflicts | Device interruptions, kill/relaunch, durable offline checkpoints (Pack 11) |
| 5 Player controls | Android source build checks partial; native acceptance pending | Speed; native sleep source extension; embedded chapter extraction/seek; server-persisted, reorderable profile queue with conflicts; Android Gradle configuration reaches SDK lookup | Android SDK environment, APK/AAB output, real Android playback/lock-screen/sleep acceptance; iOS later; real chapter-format corpus |
| 6 Device audio | Android source build checks partial | Native background/lock-screen setup, status events, lifecycle saves; Android Hermes export and native project prebuild pass; Gradle wrapper/plugin phase passes until Android SDK lookup | Install/configure Android SDK, produce debug APK/release AAB, Android hardware acceptance; signing; OS timers/interruption/headset behaviour; iOS later |
| 7 Organisation | Partial+ | Native space filtering, folder add/scan/remove, owner-only title/author/series edits in web/mobile; metadata survives rescan and search; existing web grouping | Richer automatic metadata extraction, remaining native grouping/source polish, UI/device QA |
| 8 File sorting | Partial+++ | Web preview/apply/retry/undo-preview; owner web batch templates; native owner sorting controls for visible/all preview and apply pending; same-source verified hard-link move with verified copy fallback when hard links are unavailable; batch linked-journal recovery tests | Cross-source automatic sorting remains intentionally out of scope; browser/device UX acceptance and real power-loss hardware certification remain open |
| 9 Readers | Partial | Semantic EPUB markup/images with sanitizer, CBR decoder, PDF/comic zoom controls | Publisher CSS/fixed layouts/SVG, compressed/encrypted/multivolume RAR corpus, gestures and full browser/device QA |
| 10-16 | Not worked this batch | Existing foundations only | Comic bubble focus; offline; real Atlas; charts/goals; branding/animation polish; security/plugins/notices; signed builds/full acceptance |

## Exact continuation points

- Mobile: connection.ts (HTTPS/API), playback.ts (testable state machine), App.tsx
  (native adapter/UI), core.test.cjs. Nested screen render functions now called directly
  to avoid remounting input/WebView on every audio status update.
- Server audio: listening.go, listening_test.go; existing progress.go for grouped books.
  Standalone audio has asset_progress; grouped editions use profile_progress.
- Metadata: organise.go, web/organise.js and mobile/App.tsx now support owner-only title, author and series corrections. These fields are returned by /api/books, searched locally and preserved on rescan. Mobile owner source folders can be removed as well as added/scanned.
- File moves: filemoves.go, filemoves_test.go, web/filemoves.js. No overwrite allowed.
  Source and destination must stay inside the same selected source. Hard-link failure
  retains original; cancel an unlinked attempt or resume a linked one, then undo.
  Owner web UI can preview sorting templates: Author/Title, Author/Series/Title
  and Format/Author/Title. Template output sanitizes unsafe path characters and still
  passes through the existing same-source collision/hash preview. Batch template
  preview can prepare the currently loaded books; duplicate generated destinations
  are rejected before any conflicting move is previewed. Batch apply resumes/applies
  every pending preview through the same journaled safe-move path and reports moved
  versus skipped items.
  Pending applying/linked journals block scans/source deletion until resolved.
  This is NOT automatic cross-source organisation: generated destinations remain inside the asset source. Native owner controls now expose template selection, preview visible shelf, preview all library items and apply pending safe moves. Hard-link moves remain preferred; when a filesystem refuses hard links, Archivist uses an exclusive temporary copy in the destination folder, fsyncs it, verifies SHA-256, renames without overwrite, updates the catalogue, then removes the original only if it still matches the preview hash. Batch apply can resume linked journals. Real cross-drive organisation between different selected source roots is still not implemented because it changes ownership and rollback boundaries.
- Readers: epub_content.go, cbr.go, reader.go, web/reader.js. New Go dependencies are
  bluemonday v1.0.27 and rardecode/v2 v2.2.3; notices include their new transitives.
  EPUB scripts/remote media are removed. Original publisher CSS is not rendered.
  CBR decoded limits: 64 MiB dictionary, 24 MiB entry, 512 MiB total, 10,000 entries.
  CBR reads sequentially; large/solid books need performance work. Passwords and
  multipart archives are not configured.
- Pack 5 follow-up: player_features.go adds per-profile revisioned queues and bounded
  ffprobe chapter decoding from an already-open file (network protocols disabled).
  HA installs ffmpeg; standalone deployments need ffprobe on PATH. Two concurrent
  probes maximum, 15-second deadline, 1 MiB output and 5,000 chapter limits.
  mobile/queue.ts serializes queue edits and reloads conflicts; App.tsx adds chapters
  and reorder controls. Playback.sleep delegates to native setSleepTimer; Expo Go
  reports unsupported instead of pretending a JS-only timer is reliable.
- mobile/patch-audio.cjs adds native Android Handler / iOS DispatchWorkItem timers to
  expo-audio 57.0.5. npm postinstall applies it; version/anchor drift fails the build.
  Timers are cancelled on release; expired sleep does not restart at track advance.
  Patch application/idempotence is tested, NOT a native compilation/device pass.
- HA version 0.1.4-dev. Packaging includes mobile patch script in source checkpoint.

## Verification this batch

Pack 7 follow-up PASS: metadata author/series save, local search and rescan preservation test; mobile typecheck/core/queue still pass.




Pack 11 Android Gradle attempt BLOCKED BY ENVIRONMENT: extracted Pack 10, restored mobile dependencies with `npm ci`, and postinstall re-applied the pinned expo-audio native sleep patch. PASS: `npm run typecheck`; `node core.test.cjs`; `node queue.test.cjs`; native audio patch idempotence/API test with child-process permission; full Go suite; server build. Android Gradle release assemble was rerun with `GRADLE_USER_HOME=/tmp/archivist-gradle-pack11 ./gradlew assembleRelease --no-daemon --console=plain`. Gradle wrapper downloaded, Expo/RN Gradle plugins compiled, project configured through SDK version reporting (buildTools 36, minSdk 24, compile/target 36, NDK 27.1, Kotlin 2.1.20). Build then failed because the container has no Android SDK: `SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting sdk.dir in mobile/android/local.properties.` Checked common SDK paths and `sdkmanager`; none were present. No APK/AAB produced, and no device/Google Play readiness is claimed. This is now an environment/tooling blocker rather than a TypeScript or React Native app error.

Pack 10 Android-first readiness PASS/PARTIAL: restored mobile dependencies with `npm ci`; postinstall applied the pinned expo-audio native sleep patch. Added `expo-system-ui` `~57.0.4` so Android prebuild no longer warns about automatic light/dark system UI. Mobile TypeScript typecheck passed. Mobile JS tests passed for connection/playback core and queue. Native audio patch idempotence/API test passed when child-process spawn was allowed. Android Hermes export passed with `npx expo export --platform android`. Android native project prebuild passed with `npx expo prebuild --platform android --no-install --clean`, generating `mobile/android`. Full Go suite and server build still pass. Android Gradle release assemble was attempted with `./gradlew assembleRelease`; Gradle wrapper downloaded and daemon started, but the build stayed silent for several minutes and was manually interrupted, so no APK/AAB output is claimed. Google Play gaps: final app id/name/versioning, production launcher artwork/screenshots/store listing/privacy policy, release keystore/signing, AAB generation, Play Console internal testing, target SDK/compliance review, Android real-device smoke, background audio/lock-screen/sleep acceptance, and server connectivity over real HTTPS/DuckDNS. iOS deliberately not worked except shared React Native code.

Pack 8 larger sorting follow-up PASS: native mobile owner sorting controls added in Settings for template choice, visible-shelf preview, all-library preview and apply pending moves. Server safe move now falls back from hard-link to verified copy when hard links are unavailable, with no overwrite, temp-file cleanup, hash verification and original removal only after destination/catalogue safety checks. Added tests for copy fallback and batch recovery from a linked journal, plus existing batch preview/apply tests. PASS: full Go suite, server build, web filemoves syntax and playback_test.cjs. BLOCKED: mobile typecheck and mobile JS tests that require TypeScript because this checkpoint has no mobile/node_modules and `tsc`/`typescript` are not installed; no native Android/iOS build or device acceptance is claimed. Browser/device UX acceptance and real power-loss certification remain open.

Pack 8 batch follow-up PASS: generated sort paths tested for unsafe-character cleanup and unknown-template rejection; batch template preview/apply tested for two successful moves and duplicate-destination rejection; full Go suite and server build passed with temp Go cache/config; web filemoves syntax check passed. Mobile typecheck was attempted but blocked because this extracted checkpoint has no mobile/node_modules and tsc is not installed, so no new mobile verification is claimed. No native sorting UI, browser visual pass, cross-drive/non-hardlink move path or recovery stress certification claimed.

Pack 5 follow-up PASS: full Go suite; actual generated M4B chapter extraction via
ffprobe (not skipped); queue isolation/conflict tests; mobile typecheck;
core.test.cjs, queue.test.cjs, native-patch.test.cjs and HA package preservation.
Native patch tests verify source installation/idempotence only. No new native
binary or hardware validation; previous bundle exports predate this follow-up.

PASS: `go test ./...` including ingress/session/permissions, audio progress conflicts,
file collision and interrupted-link recovery/undo, EPUB sanitization, stored-RAR4
fixture/natural order and corrupt-RAR rejection.

PASS: `node mobile/core.test.cjs`, `npm run typecheck` in mobile,
`node playback_test.cjs`, `node scripts/ha-runtime.test.cjs`,
`node scripts/package-ha.test.cjs`, all web JS syntax, server amd64 compile.
PASS: `go test -race ./...`, Linux ARM64 cross-compile and Android/iOS Expo/Hermes
JavaScript exports. Exported bundles are not APK/IPA files or native device passes.

Browser smoke script: scripts/reader-smoke.cjs. BLOCKED: no Chromium installed;
browser download denied (403 domain allowlist). No screenshot/visual pass claimed.
No Docker executable, native APK/IPA, signing or actual Pi/device tests.
See MOBILE-TESTING.md for connection requirements and device acceptance checklist.
Prior VALIDATION.md entries are historical, not new release certification.

## Low-token restart

Read THIS file only, then the files for the selected unresolved row. Do not reread
the chat, vendor bundles or package-lock. Next exact task: run this same project in an Android build environment with Android SDK installed/configured (`ANDROID_HOME` or `mobile/android/local.properties` with `sdk.dir`), then run `cd mobile/android && ./gradlew assembleDebug` first. If that passes, produce an unsigned/release APK or AAB, install on a real Android device, and test connection, shelf, sorting controls, reader WebView, background audio, lock-screen controls and native sleep timer. After Android smoke is clean, continue Pack 9 reader speech-bubble focus. Do not claim release readiness before device/Home Assistant tests. No need to redo settled source discovery.
Record changed files and exact tests once per pack; never hide technical omissions.
Preserve all functions and local-only accessible-library recommendations.

Source: /workspace/archivist-build. Remote: russellstokes-ai/Archivist (not pushed).
Checkpoint package contains source plus a separate ready-structured HA upload ZIP;
neither constitutes a mobile installer. Keep root licence proprietary. Full dependency
and security reviews remain pending. Finish all acceptance gates before commercial release.

## Pack 12 cloud Android build handoff

Added `.github/workflows/android-apk.yml` so GitHub Actions can build the Android debug APK without a local Windows Android toolchain. The workflow installs Node 24, Java 21, Android SDK platform/build-tools 36, NDK 27.1.12297006 and CMake 3.22.1; runs `npm ci`, mobile typecheck, mobile JS tests and `./gradlew assembleDebug`; then uploads the debug APK as the `archivist-debug-apk` artifact.

Added `GITHUB-ANDROID-BUILD.md` with click-by-click instructions for running the workflow from GitHub Actions.

Local verification this pack: repository files inspected and workflow/docs written. No GitHub Actions run, APK, real Android install, Play Store readiness or Home Assistant acceptance is claimed until the workflow is uploaded and run successfully.

Exact next task: upload the updated repository to GitHub, run Actions → Android APK → Run workflow, download the `archivist-debug-apk` artifact, install it on an Android device, and test connection, shelf, sorting controls, reader WebView, background audio, lock-screen controls and native sleep timer. If GitHub Actions fails, copy the failing log into this chat and fix only that failure next.
