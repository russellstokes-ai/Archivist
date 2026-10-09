# Preparation status, 9 October 2026

Preparation inputs are verified and the user authorized gated implementation. S1 core discovery/storage is implemented separately from the canonical UI; product integration and Android acceptance remain later gates.

## Safety checkpoint

- Source main: 22ee7645b78b752b9e954a286528fddbedfc1320.
- Isolated branch: feature/archivist-scanner-vnext-real-library.
- Recovery tag: recovery/scanner-vnext-main-20261009.
- Complete bundle: ../archivist-main-checkpoint-20261009.bundle, outside the public checkout. `git bundle verify` passed.
- The historical dirty checkout is intact and has not been used as the scanner baseline.
- Fifteen canonical UI/source/asset files have recorded SHA-256 values in the private preparation evidence; all match the source baseline.

Recovery without overwriting the feature branch: verify the bundle, then use `git archive recovery/scanner-vnext-main-20261009` to export the saved source into a new directory. The archive export mechanism was exercised locally for baseline testing. Never reset the old dirty checkout.

## Observed verification

- Supplied check_reference.py: PASS using bundled Python; 8,016 normalized entries, correct source counts, 342 Android audio, 46 root audio, unique source/path keys, eight unverified case profiles.
- Canonical source UI contract: PASS on untouched current main.
- Existing mobile suite: 65/67 on original CRLF source, then 67/67 on a disposable source replica with LF-only normalization. The two failures were CRLF-sensitive test code in speech-focus.test.cjs and test10-1-living-book-reentry.test.cjs. No UI/product test assertions were removed or changed.
- Generated private Android hierarchy: 342 audio files (267 MP3, four M4A, 71 M4B), all payload hashes checked against three locally decoded generated seeds. Forty-six files are at the selected root.
- Fifteen controlled samples: artwork, EPUB, CBZ/CBT, missing/malformed ComicInfo, unsafe archive paths, compressed expansion, unsupported/ambiguous/corrupt formats and MIME-extension mismatch. Seven generated ZIP-based archives passed CRC verification. These are lab checks, not production scanner tests.
- Android SDK tools and Pixel_10_Pro_Fold AVD are available. No emulator scanner acceptance run has occurred; no APK built or released.

## Open gates

P0 safety/UI source baseline is recorded. Full visual/native acceptance is reserved for S7.

P1: all four supplied originals match recorded hashes and sizes; regeneration reproduces all four normalized datasets. The user confirmed the root multipart case is one work, the split-disc case is one work, and the nested series contains separate books. Remaining work/edition labels are hypotheses. No new library scan is requested.

Latest correction: the series folder may have been accidentally damaged; exact book/part boundaries are unconfirmed. Its five current proposals remain review candidates and are excluded from accuracy scoring.

P2: the written adaptation and consecutive plan were presented; the user authorized continuation. The execution ledger records interpretation and evidence.

P3: playable generated audio and controlled archive failures are supplemented with independently verified stored-RAR5 CBR and two valid PDFs. Provider budgets, Genre rules and test strategy are specified. Provider confidence remains uncalibrated; automatic acceptance is disabled pending S4 calibration. Shared synthetic audio payloads cannot establish real duplicate identity. Compressed-RAR native support and actual original-media metadata remain later acceptance checks.

## Next action

S1 observed results: exact accounting of 8,016 inventory records, including all 342 Android audio candidates; 100,000-entry synthetic cap/resumption in 6.39 seconds with batches no larger than 128; real SQLite restart, stable rename identity, source separation, rollback, cancellation and legacy-record preservation. Current mobile suites pass 67/69 in the original CRLF checkout (the same two baseline failures) and 69/69 in a complete LF-only disposable replica. All fifteen canonical source hashes remain identical. Core strict TypeScript checks pass; full native/app typechecking remains pending dependency installation and S3 integration.

Next: S2 grouping tests using private confirmed cases and varied synthetic layouts; never treat filename patterns or an expected count as universal truth. Keep each S1-S7 acceptance gate and commit separate. Actual emulator scanner acceptance has not run; no APK is released.

Update after S2: grouping/identity/snapshot core checks pass, including 70/70 suites in a full LF-only replica. Installed project dependencies now permit a passing full app TypeScript check. S3 has a tested JS scheduler only; native Android access and app integration are unfinished. Actual isolated emulator startup failed, including acceleration check code 6, so the native acceptance gate cannot pass in the current environment. The new scanner is not working in the app yet. S4-S7 remain pending.
