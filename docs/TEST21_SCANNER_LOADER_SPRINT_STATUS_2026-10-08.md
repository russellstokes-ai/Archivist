# Test 21 scanner and global book-loader implementation ledger — 2026-10-08

## Source of truth
- Baseline Test 20: 002fb184d2a64abdeebbe224d7deb81fbf63eb30, integration/test18-reliability
- Recovered Test 14 for comparison only: build/0.9.4-test14-20261006
- Audit / first isolated 18-track RED (8 wrong groups): audit/test20-scanner-latency-20261008
- Active change branch: feature/test21-scanner-and-book-loader-20261008
- Canonical mobile UI and Fold responsive layout **locked**. Source integration branch unchanged.

## Sprints — implementation and acceptance state

1. **Diagnostics** — implemented counters in LocalScanResult.diagnostics (native queries, fallback reads, file stats, physical files, logical works, duration), privacy-safe DEV logging; real-device benchmark / frame trace outstanding.
2. **Fast Android scanner** — FastSafDirectory.kt performs one bounded native DocumentsContract projection query per directory, on a background worker, with a 4s watchdog, cancellation and Expo fallback. localLibrary.ts reuses size/modification-time attributes rather than per-file getInfoAsync. Android native CI and physical provider verification required.
3. **Book grouping** — metadataSync.ts normalizes narrowly explicit multi-disc album labels and ignores generic unknown album placeholders; leaves separately tagged works separate. Device-like tests: 18 chapters previously split into 8; 227 files represent 12 works. Real device scan still pending.
4. **Metadata intelligence** — fastAudioProbeUris plans at most three sample tracks per **high-confidence** multi-chapter work, but inspects ambiguous mixed folder assets independently; Test 20 online book/comic and genre paths remain intact. Not yet verified against real embedded tags.
5. **Publication & Needs Attention** — retained Test 20's existing staged review/published-snapshot protections and work-level edit path; no UI or data migrations touched. Test suite and on-device metadata/cover acceptance pending.
6. **Onboarding/loading animation** — exact user-supplied Book Loader (2).json vector animation preserved at 60fps/240 frames, only existing stroke colours converted to palette dark/light JSON. BookLoader.tsx replaces 8 ActivityIndicator elements in App.tsx and 1 in LocalPdfReader.tsx. Same placements/sizes, reduced-motion static image, accessibility label. Existing progress bar and Fold/phone layout untouched.
7. **Regression & CI** — new book-loader-contract.test.cjs, scanner-fast-saf.test.cjs, audio-probe-plan.test.cjs and scanner-conflicting-albums-regression.test.cjs; full mobile, iOS, native Kotlin, Android emulator/Playwright checks required. CI results must be reviewed by exact commit before release.
8. **Test APK/device acceptance** — NOT RELEASED. Only after required CI passes, benchmark evidence and 227/12 regression on physical Samsung Fold; deliver bare APK, not artifact ZIP.

## Specific regression rules
- File count, grouped work count, Needs Attention and published count are distinct quantities; never interpret physical chapters as books.
- Group identity established before network enrichment; sample track properties cannot overwrite all chapter names.
- A saved metadata clue does not imply publication. Works must retain their verified cached cover and remain in Needs Attention until publication prerequisites pass.
- Unambiguous numbered chapter folders group; a folder containing distinct album/work identities still splits by evidence.
- Do not clear user catalogue or silently overwrite manually corrected metadata.
- Native query timeouts must fail forward with user-visible diagnostic; cancellation must preserve the previous published catalogue.
- New app loaders only replace existing circular spinners in situ. Do not touch skeletons, reading motion, reward animation, logo, bottom navigation or any canonical screen layout.

## Remaining acceptance evidence
- Mobile suite and Expo/TypeScript/web bundle green for latest SHA.
- Native Android Gradle compile and native/unit tests green with FastSafDirectory.
- iOS checks and Playwright automated UI checks green.
- On-device initial and warm scan durations, stalls/jank, and exact logical grouping verified on the same folder/provider as prior 12-book success.
- APK signature/version/package and direct .apk link (not ZIP).
