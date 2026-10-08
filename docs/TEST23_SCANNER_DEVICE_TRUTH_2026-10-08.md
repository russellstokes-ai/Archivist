# Archivist Test 23 — device-truth scanner recovery

Date: 2026-10-08
Status: **ISOLATED CANDIDATE — PHYSICAL FOLD ACCEPTANCE NOT YET PASSED.**
Branch: `feature/test23-scanner-device-truth-20261008`
Test 22 baseline: `e35d9f760c795521b235b109f053e9dffed8a910`
Retain intact: `ui-lock/0.9.5-test13-baseline`, `canonical/archivist-test13`, `integration/test18-reliability`, `feature/test21-scanner-and-book-loader-20261008`, `feature/scanner-quality-gates-20261008`.
Never reset user app storage or overwrite any baseline. Work remains isolated until physical acceptance.

## Facts: why Test 22 was not acceptable
- User's small physical Fold library still showed ~85 books rather than roughly twelve logical audiobooks, was slow and briefly unresponsive during Identify Books & Covers, had Smart Search/Save visual glitches, and the loader appeared the old size.
- GitHub Test 22 used optimised, debug-signed 0.9.4 versionCode 107. Successful CI meant build/launch and synthetic regression tests, NOT a real Fold scan.
- Scanner's multi-album folder branch treated chapter/disc-only TALB tags as distinct work identities. Test23 constructed 227 chapter files across twelve folders with realistic chapter/disc pollution: initial RED run 37844424244 returned **108 logical groups vs 12 expected**. After rejecting generic chapter/disc tags, follow-up run 37844719001 advanced past the 12/12 assertion and uncovered a second RED gate: Identify was forcing provider cache refresh.
- Explicit Identify previously called `enrichPublishedLocalLibrary(staged,generation,true)`, conflating "run configured providers" with "force uncached refresh". Test23 separates those: normal Identify uses `true,false`; user-requested Settings refresh retains force-refresh behaviour.
- UI action labels Smart Search, Save, Accept & Save, Searching and Close changed width inside a wrapping row. Test23 uses one stable equal-column row only within this modal; generic buttons, canonical navigation and reader remain unchanged.
- Book Loader vector art remains untouched; its scanner container is now 50 phone / 58 wide Fold and reader 46 / 54. Reduced Motion support remains unchanged.

## Test23 verification
- RED: Mobile checks run 37844424244, 93/94 suites passed; new realistic tag fixture failed 108 != 12.
- RED after grouping correction: run 37844719001, 93/94 suites passed; new cache assertion failed.
- First full GREEN: Mobile checks run 37845676519 at `3189ab8b56a71054e8924fd34cc457f274292ecf` passed full TypeScript, maintained Mobile suites, web bundle and browser-level phone/Fold Playwright reliability workflows.
- Further diagnostic refinements are intentionally subject to exact HEAD CI before a candidate APK is published. A green web screenshot is NOT native Android visual acceptance.
- VersionCode 108 intentionally distinguishes Test23 from Test21/22's identical versionCode 107. Package `app.archivist.reader` is unchanged for in-place upgrade; app data stays intact. About -> Diagnostics shows build source fingerprint and exports a privacy-safe trace.

## Diagnostic schema and user privacy
The About -> Diagnostics "Export scanner trace" writes one local JSON file that the user explicitly shares. It never exports filenames, album titles, directory names, absolute paths, URIs, credentials, metadata values, or identifiers. Counts include physical files, audio/comic/ebook counts, distinct logical works, album-vs-folder-vs-single-file grouping kinds, anonymous biggest-folder file/group/tag-variance statistics, durations and worst observed JavaScript heartbeat delay, bounded metadata attempts/timeouts/skips, online request units, cached covers and published work count.

Interpret staged results separately: Files != works != items needing review != published works. Trace can show where the 12->85 divergence occurs without falsely claiming the expected result in advance.

## Release and real-device gates
1. Ensure latest-HEAD Mobile checks (unit, typecheck, web, Playwright phone+Fold), native Android compile/tests and iOS checks pass; build must be uniquely stamped with exact GitHub SHA and include the Test23 app version code. Verify APK package, test signature, alignment, size/checksum and emulator startup. Emulator startup is not scanner acceptance.
2. Install Test23 **over** Test22; never clear storage or media files. In Settings -> About, confirm Test23 source fingerprint; save the trace after one Find Books and Identify Books & Covers run.
3. On the SAME local twelve-audiobook folder test, compare discovered physical files, logical works after each stage, Needs Attention work count, published count and stage latencies. One audiobook's chapters must remain in one ordered work. Genuinely different books within a shared folder must stay distinct.
4. Confirm ordinary identified books publish with valid cached square library artwork, optional portrait Living Book jacket never blocks publication, and manual changes and source files remain intact after restart. Do not silently merge series novels or comic issues.
5. Test Smart Search / Save / Accept & Save in the Android modal while busy, with keyboard, and closed/open Fold. Check the actual Lottie visual size and Reduced Motion; web tests alone are not sufficient.
6. Compare cold and warm rescans, cancellation and retry, offline/no-server, online cache reuse, preservation of previously published records, and no meaningful UI freezes. Collect timings rather than fabricate speed.
7. Only once physical Fold confirms accurate grouping, smooth UI, correct covers and stable buttons should Test23 be accepted or merged. Otherwise keep the trace as a failure report and investigate exact stage and folder-group histogram; do not claim the APK fixes the device symptom.

No premium services, new cloud AI, destructive data migrations, file moves, canonical UI redesign or merges to main were introduced by Test23.
