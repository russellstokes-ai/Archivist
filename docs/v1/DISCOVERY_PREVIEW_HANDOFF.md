## Verified checkpoint — 23 October, CB7 closure checks

- Complete mobile run: **202/202 suites passed** (`cb7-full-tests-verified.log`, exit 0). TypeScript passed. Android release Java/Kotlin compilation passed after CB7 integration. No APK has been assembled or dispatched.
- Real generated audio tests passed for MP3, M4A, M4B, AAC, FLAC, OGG, OPUS, WAV and WMA; decoded audio hashes were unchanged. MP3/M4B chapter names/times survived repeated writes. Independent RAR extraction/write tests passed, including the retained RAR5 solid fixture; this does not establish the legacy app reader's handling of every RAR5 archive.
- CB7 has bounded Android selected-page reading (256 MiB stage, 500 pages, 16 MiB selected page), scanner ComicInfo/cover extraction and bounded R4 first-page evidence (64 MiB scanner stage). No CB7 writer or file conversion is claimed.
- Added real generated LZMA2 fixtures and an Android JNI harness in `mobile/test-support/sevenzip`; `.github/scripts/cb7-native-check.sh` runs production extraction on Android without creating an APK. The local Windows emulator cannot start because hardware acceleration is unavailable. Positive JNI execution is **pending GitHub native checks**, not passed.
- Generic ZIP automatic metadata writes are disabled; ambiguous `.zip` files remain DB-only. This closes an unsafe extension-only eligibility gap.
- Protected baselines remain unchanged. Exact reversible CB7 dispatch deltas preserve the existing comic HTML/zoom; cover exceptions have explicit owner approval. New `repair-original-source` reconstruction also reverses that CB7 delta.
- Windows release lint remains unverified because dependency CMake/Ninja fails on long paths. GitHub native checks now run full release lint and the CB7 Android harness **before any APK dispatch**. Do not bypass either gate or publish an interim APK.
- Original owner-library/OCR accuracy and device UI acceptance remain unverified. The diagnostic export exists to collect actual failed cases; generated corpus tests are not evidence of universal identification or universal embedded writes.

# Latest recognition follow-up

See `RECOGNITION_FOLLOWUP_2026-10-23.md` for the latest implementation and validation. The historical preview notes below describe the earlier source; R3 is now implemented conservatively for bracketed comic neighbours.

# Discovery Preview QA handoff

Branch: fix/assist-pipeline-20261022. Version: 0.10.0, Android versionCode 104.

This is a QA candidate, not a production or physical-device acceptance claim.

Implemented: separate discovery/population/review actions; durable identification,
cover and metadata-write queues; revision and generation checks; independent
identity evidence; bounded embedded cover/MP4 metadata reads; file snapshots,
verified receipts and explicit interrupted-write recovery; proportional Atlas
catalogue projection; layout/photo-preview and Living Book recovery changes.
No file renaming, new sidecars or embedded artwork replacement.

Validation: 188/188 mobile suites passed before the final URI type guard.
TypeScript passes with that guard. UI contract, protected-source and scanner
process checks were rerun after it and passed. Git whitespace check passes.
Android release lint, native compilation, emulator startup and signed APK
verification remain required in the GitHub workflow. No new APK exists yet.

Known scope limits: R3 neighbour inference and engine-dependent R4 OCR/audio
recognition are not implemented. Unsupported containers do not gain writers
merely because the app lists them. In-file writers remain limited to their
explicit capability table, with 64 MiB for current non-audio rewrite paths.
Missing provider data is not fabricated. Real Fold navigation/player/scan and
write-recovery acceptance remain outstanding. App-side thumbnail generation
and complete format-fixture coverage remain follow-up work. Do not describe
this preview as completing every item in the implementation plan.

Build: manually dispatch android-apk.yml on this branch with qa_confirmation
and publish_direct_apk true. Publication is gated behind startup validation;
deliver the release's direct .apk asset, never an Actions ZIP or an older APK.
The workflow must be green before describing the download as validated.
