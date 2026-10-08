# Test 23 Android real-media acceptance: REPRODUCED grouping regression

**Date:** 2026-10-08
**Production APK under test:** `Archivist-0.9.4-test-23-scanner-device-truth.apk` (unchanged)
**Signed APK SHA-256:** `97c6a1148fa2cf2b8317ca6ee2a6873af7a19abea8134bd4b9ee7b63edf9fd6d`
**APK source SHA:** `b81ac291f4dcb669b8ffd20fbdbd700633cc08ee`
**Android emulator run:** https://github.com/russellstokes-ai/Archivist/actions/runs/37855747862
**Full screenshots, Android UI dumps and logcat:** GitHub Actions artifact `Archivist-Test23-Android-Native-Media-Acceptance` (ID `11584311391`).
**Test-harness code:** `.github/scripts/android-fixture-media.py`, `.github/scripts/android-media-acceptance.py`, `.github/workflows/android-media-acceptance.yml`.

## Test setup
- Real Android 14 x86_64 emulator with KVM. Boot measured at 27.5 s.
- Installed the **exact** published Test 23 APK; did not rebuild or patch it.
- Generated and transferred **342 genuine, playable MP3 tracks**, representing **12 known audiobooks**.
- ID3v2 tags include varying chapter titles, author gaps, TALB album collisions, chapter/disc ALBUM pollution, TRCK and TPOS. Some tracks embed a real PNG cover.
- Four path patterns: author/book, author/book/CD folder, source-root multipart, and author/series/book/part.
- Selected the actual Android Documents tree with the SAF picker, approved the Android filesystem grant, tapped **Find Books**, then **Identify Books & Covers**.
- This is a *synthetic* analogue of the user's 342-file diagnostic, not a claim to have the user's private media or precise tag patterns.

## Observed native Android results

| Measure | Ground truth / target | Test 23 actual |
| --- | --- | --- |
| Physical playable files | 342 | 342 shown as found in Identify progress |
| Human-known logical audiobook works | 12 | **73 presented for review** |
| After Find Books | 12 works | **73 books need review** |
| After Identify Books & Covers | 12 works | **73 works still need review** |
| Find Books stage | complete | completed; driver observed ready to identify |
| Identify stage | complete and accurate | completed in **54 s** but grouping still wrong |
| UI | no per-chapter review cards | **Review 73 books** |

**Acceptance outcome: FAIL.** The original APK reproduces the logical-work fragmentation under a real Android scanner, not merely in TypeScript unit tests. It passes the stage-completion UI but fails correct grouping and review presentation.

### What is and isn't proven
- **Proven:** the 342 MP3 files exist, Android SAF grants the real folder, Archivist scans it through its two actual stages, and the Android UI still offers 73 review items for 12 known works.
- **Not proven:** the exact user's 85-book count or particular file-tag patterns; their source library was not available to QA.
- **Not proven:** the user's long-duration scan hang; synthetic tracks are short and the emulator completed identification in 54 s.
- **Not proven:** final publication count. The first harness implementation inspected the wrong Expo SQLite directory; the final native stage trace was not collected. Do not infer a count from the stage completion banner.
- **Not tested here:** visual geometry of Smart Search/Save or visible Lottie artwork dimensions; these require separate native UI acceptance tests.

## Root-cause candidates requiring focused code tests
1. `mobile/metadataSync.ts:audioWorkGroupKeys` keys chapters by the **exact enclosing directory** (`audioDirectoryKey`). Distinct disc/part subdirectories within one book are evaluated as different work identities instead of being reconciled to their common parent.
2. In folders with multiple credible album titles, the current branch assigns `audio-file:` keys to chapters lacking credible album evidence rather than retaining a provisional work-level family.
3. The second-stage audio/tag/online sync never reconciled the demonstrated 73 candidate review items down to the 12 verified works.
4. UI review counts are work-level projections of the bad grouping; changing only the review card rendering cannot fix source identity.

## Next test gates before a new APK
- Export the **actual stage-by-stage scanner diagnostic** from the Android package (the QA driver must look for Expo SQLite under `files/SQLite/` rather than `databases/`) so attribution between discovery/audio/online/publication is explicit.
- Add a regression assertion that 342 real tracks remain exactly 12 work identities at discovery, after embedded metadata, after online enrichment and at final publication, without merging distinct authored works.
- Run a second native fixture with realistic longer audio files and adverse provider latencies to reproduce or disprove the hanging complaint separately.
- Make failure block APK release. Preserve Test 23 as a rollback baseline; scanner/UI source must not be modified by the QA harness.
