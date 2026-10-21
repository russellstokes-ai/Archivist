# Mobile repair and metadata handoff — 20 October 2026

Active branch: `fix/assist-metadata-durable-20261017`. This branch is the source for the requested QA APK. No production release or main-branch merge is implied. Earlier handoffs are historical where they conflict with this scoped update.

## 21 October: scan recovery and profile/header repairs

- Discovery no longer waits for portable metadata recovery or media write-back before saving its baseline. Recovery remains in the existing post-scan enrichment path. Synchronous content-URI size inspection was removed; native persistence measures and hashes current bytes, including after metadata updates.
- Recovery reads have a 65-second caller deadline (native hashing allows 60 seconds). A stalled native read retains its worker slot, preventing queued read accumulation; cancellation returns promptly and late results cannot update the catalogue. Temporarily unavailable recovery defers that work rather than treating it as absent and overwriting its saved identity; a later refresh retries it.
- Profile Add photo / Replace photo and Remove photo now sit with the identity avatar. The old lower photo action row is removed; initials and colour controls close up naturally.
- Shelf and Atlas heading/toolbars are grouped, removing the large parent-layout gaps around the toolbar while preserving touch-target sizes.
- Validation: all 185 mobile suites pass with explicit Python SQLite bridge and JDK paths, including the updated runtime test proving recovery still restores metadata after baseline scan completion. TypeScript and protected-source gate pass. The first GitHub attempt stopped on the prior synchronous-recovery test expectation; commit `873f0e29004d29e9ccd31f49b58955ed40c0049a` updates that test without changing app code. [Current APK build](https://github.com/russellstokes-ai/Archivist/actions/runs/39610259969) uses that commit. Device reproduction of the reported 24% stall is not available: the identified blocking path is fixed, but the exact device cause is not proven. Add final build evidence after completion.

## Previous QA APK delivery evidence

- APK source commit: `37164eba32d9b219d8891b8ef1c9ca999b4a9a44`. Later documentation-only commits do not change this binary.
- [Direct APK download](https://github.com/russellstokes-ai/Archivist/releases/download/qa-test14-39502558683-1/Archivist-0.9.4-test-14.apk) — 74.4 MB, QA package only; not a ZIP.
- APK SHA-256: `a1b342aabe261386e04464ee04e2dd797b1e649b3c77dfc319a305f3786d309b`.
- [Android native checks](https://github.com/russellstokes-ai/Archivist/actions/runs/39501552590): SUCCESS on this source commit, including real audio/chapter and independent RAR extraction checks.
- [APK workflow](https://github.com/russellstokes-ai/Archivist/actions/runs/39502558683): typecheck, all mobile suites, release lint, APK compilation, package/signature/alignment checks and direct publication succeeded. The APK also installed successfully in the Android emulator.
- The workflow's overall result is FAILURE: screenshot capture timed out in the emulator startup check, exit 86, with “Emulator screenshot transport stalled”. This is not a compile or release-lint failure, and it is NOT evidence of passed startup/device acceptance. The app launch command ran, but the subsequent full startup acceptance did not complete. Do not label this run green or commercially release-ready.
- Outstanding: retry emulator visual/startup validation on a healthy runner and complete the physical-device checks below. No automatic polling or duplicate APK builds were requested.
- MOBI and CB7 are outside the current supported reader/writer format list. MP3 is included; supported formats and safe-rejection restrictions are listed below.
- The owner's black-buttons/player-name-input comment belonged to another chat. No changes were made for that comment.

## Implemented changes

- Assist combines catalogue results and enrichment rather than replacing existing providers. Confirmed publisher-only comic identities are supported. Genre, year and cover retrieval is automatic when a matching source supplies them; unavailable data must not be invented.
- Living Book recovery and selected-cover propagation have source repairs. Test leaving/returning to the player, switching titles, pause/play and delayed cover arrival on the owner's device before closing the issue.
- Atlas uses actual published data, proportional cells and three separate equal sectors for Genre, Format and Publication Year. Empty categories do not fabricate books.
- Confirmed metadata can be embedded in supported writable originals, enabled by default with an off switch. Filenames are not changed. Recovery snapshots remain additional protection, not a claim that original files were updated.
- Original-file writing now covers MP3, M4A/M4B, AAC, FLAC, Ogg, Opus, WAV, WMA, EPUB, PDF, CBZ/ZIP, CBR (RAR4/RAR5) and CBT subject to the restrictions below. Multipart audio retains individual track titles while updating the book album metadata.
- MP3 CHAP/CTOC frames survive updates; absolute chapter byte offsets are adjusted if the tag grows. M4B updates retain media/chapter offsets by leaving the original media layout in place. Repeated-write fixtures verify chapter names, times and decoded audio.
- Native Android writes prepare a private copy, compare encoded media samples where applicable, and replace the source through a durable backup journal with readback verification. UI reports the outcome rather than claiming every save wrote to the original.

## Known limitations — do not claim universal completion

CBR now uses independent RAR4/RAR5 container writers, preserving compressed page blocks and merging ComicInfo.xml. Every prepared CBR is independently extracted with Junrar and all non-metadata entry names, lengths and SHA-256 hashes compared before journaled source replacement. Four upstream RAR4/RAR5 fixtures (ordinary and solid) pass repeated-write extraction checks. RAR5 quick-open cache/locator records are omitted to prevent stale cached headers. Recovery/authentication records, encrypted/multivolume archives, unsupported legacy header variants and existing metadata that is a dependency of later solid-compressed entries are rejected without changing the source. Do not call those files successfully embedded.

Embedded writing requires supported writable Android document access (API 29+). JS archive/PDF processing is capped at 64 MiB; audio preparation is capped at 8 GiB and requires temporary space. Signed/encrypted PDFs, encrypted EPUBs, unsupported ID3 header variants, fragmented MP4 and unsupported archive structures fail closed. Android media extraction support can prevent writing some audio formats, including WMA, on particular devices. File-writing failure must remain visible and must not be described as successful embedding.

PDF updates preserve page streams and remove the active stale XMP reference in favour of updated document Info metadata. This is not a claim of preserving every custom metadata schema. MP4 repeated writes can leave old metadata as free boxes and modestly grow the file.

## Verified locally

- All 183 mobile suites passed across the full run and targeted reruns: two JVM suites initially could not find Java, then passed with SCANNER_TEST_JAVA_HOME set; TypeScript and protected-source gate passed.
- Real-media fixtures passed for nine audio extensions: metadata roundtrip and identical decoded audio.
- MP3 and M4B two-chapter fixtures retained names, times and audio through two successive writes.
- PDF and CBT regression tests cover original content preservation and metadata replacement.

Android CI and APK release evidence is recorded above. These local checks do not establish real-device acceptance, power-loss recovery acceptance, or universal format compatibility.

## Required device acceptance

1. Back up a small representative media set. Confirm metadata, cover, genre and year, then reopen/rescan the actual files. Check filenames remain unchanged and the off setting stops original writes.
2. Check MP3/M4B chapter names, boundaries, seeking and resume before/after repeated metadata edits; check multipart track titles.
3. Leave/return to Living Book, switch books rapidly, pause/play and wait for remote covers. Verify no disappearance or previous-book cover.
4. Check Assist comic/ebook/audiobook matches and honest unavailable-data/write-status messages, including CBR.
5. Check Atlas empty state, proportional occupied cells and non-overlapping thirds.
6. Preserve the owner-approved awards, splash and canonical Comic Focus behavior; do not reopen them for redesign.

## Reproduction and maintenance

Run mobile regression tests through the existing package scripts. `node scripts/v1-protection-gate.cjs` checks protected-source exceptions. `mobile/test-support/audio-metadata/verify.cjs` requires Java, FFmpeg and `AUDIO_TAGGER_JAR`; Android native CI obtains the pinned jar and verifies its SHA-256 before running these fixtures.

Do not blindly commit this local checkout: local HEAD predates the GitHub repair branch and unrelated line-ending changes exist. Use the verified remote branch head and narrowly scoped changes. Protected source edits must retain their reversible exception manifest. Never reset or overwrite existing user work.

Use the manual Android APK workflow only for the verified final source commit, with QA confirmation and direct APK publication enabled. Deliver the release asset ending `.apk`, not the workflow artifact ZIP or an expiring redirected URL.

