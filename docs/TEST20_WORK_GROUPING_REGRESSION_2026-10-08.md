# Test 19 device failure → Test 20 work-grouping regression

Date: 2026-10-08
Branch: `integration/test18-reliability`

## Device finding (reported, not yet device-verified as fixed)
- On the installed Test 19 APK, the Needs Attention view showed 226 "books" for approximately 12 actual audiobooks. The individual media/chapter files were being treated as separate works.
- The Smart Search/Save graphical glitches were reported fixed on the real Fold. Keep those modal/UI fixes intact.
- Test 19 is a rejected device candidate; Test 20 uses a separate GitHub artifact/release identity.

## Reproduced failure
`mobile/metadata-sync.test.cjs` builds 226 physical MP3 entries in 12 distinct audiobook folders (10 with 19 chapters, two with 18), with mixed descriptive chapter filenames, incomplete album tags and individual chapter-derived keys.
The first RED run produced **226 groups**, expected **12** (GitHub Actions Mobile checks on commit `30c8288`).

## Root cause and targeted change
`metadataSync.audioWorkGroupKeys` had all-or-nothing per-directory logic. A single unusual/non-generic chapter filename, incomplete embedded work title, or per-file inferred work key could cause an entire book folder to split into independent `audio-file:<uri>` work identities.

On an unambiguous nested audiobook folder, work-level grouping can now survive incomplete/disagreeing chapter titles while retaining all physical tracks and preserving track metadata. Distinct embedded album titles in a shared folder are partitioned separately, and generic library/collection roots are not combined. Numbered folders such as `Book 01 - The Winter Night` are valid book folders, not library containers.

`groupLocalWorks`, review counts and the editor's `localEditUris` use the same `audioWorkGroupKeys`; no superficial count masking has been introduced. No database reset, forced rescan or canonical UI redesign is part of this change.

## Additional publication safety correction
A separate Test 19 Playwright issue showed that accepting metadata could replace existing verified local artwork with a remote provider URL. The updated `metadataSearchWorkflow` protects manually chosen or locally cached artwork for books and comics. The editor only treats a cover as a manual override when the user has deliberately selected one; a remote provider suggestion is not an explicit cover replacement.

## Acceptance gates
- `metadata-sync.test.cjs`: 226 files → 12 works; 12 review cards for unresolved fixture; editing a book changes all 19 relevant chapters and no unrelated chapters; two separate embedded albums in the same directory remain separate; numbered book-folder regression.
- `metadata-publication-lifecycle.test.cjs`: accepted book/comic preserves verified local artwork; unresolved works with genuinely missing artwork stay visible until cached.
- Entire Mobile/TypeScript suite; phone and Fold Playwright metadata workflow; Android native checks; iOS simulator; Test 20 APK signature/alignment/emulator smoke.
- **Physical Samsung Fold acceptance is still required.** After installing Test 20 over Test 19, re-open Needs Attention without clearing app data. Verify actual 12 logical audiobooks are grouped and all chapters are controlled by one work-level edit. It is possible that fewer than 12 works need review if metadata and covers are complete.

Do not claim the 226→12 fix has passed on the actual device until this retest succeeds.
