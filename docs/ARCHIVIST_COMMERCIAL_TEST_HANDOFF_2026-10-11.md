# Archivist — Commercial motion & Living Book test handoff
**Prepared:** 2026-10-11, BEFORE device test. **Status:** Source verified, physical acceptance pending.

## Source and protecting accepted behaviour
- Canonical immutable source: `df4c39b44394d8c512ca0298bffa7f19da356490`, branch `canonical/archivist-20261011-df4c39b`.
- Last app-code change (pre-test checkpoint): `1913afeab409459e41f1257d9e08eb1bcaac4343`.
- Test branch: `feat/commercial-motion-and-reliability-20261011`.
- Exact APK and SHA256: see workflow [Archivist commercial polish preview APK](https://github.com/russellstokes-ai/Archivist/actions/workflows/commercial-polish-preview.yml) and its `SHA256SUMS.txt`. Each build uses the complete Git source SHA, including this checkpoint document; do not assume it has a particular APK hash until the workflow produces it.
- Master status ledger: [docs/ARCHIVIST_COMMERCIAL_FINISHING_MASTER_PLAN_2026-10-11.md](ARCHIVIST_COMMERCIAL_FINISHING_MASTER_PLAN_2026-10-11.md).
- **Do not change approved book animation.** Source guard `mobile/living-book-exact-canonical.test.cjs` verifies the original entire renderer byte-for-byte except two *outer display-size* changes. Open, close, page turns, curving, shadows, colour and timing remain untouched.
- **Scanner and onboard locks remain unchanged.** Native catalogue grouping, speed, publisher gate and work-level review must remain intact. No downgrade to file-per-part.

## Completed before test (source-level; not physical approval)
1. Responsive outer Living Book stage sizing, with limits for phone, Fold closed and Fold open. Full original animation preserved.
2. Nine local Lottie assets, themed Play/Pause assets and independent Motion Lab compiled on native Android.
3. Production Lottie scanner book-stack / audiobook-headphones loading indicator; truthful existing progress counters and cancel retained.
4. Production Lottie Now and mini-player Play/Pause with physical playback state, waveform active only during play; Reduced Motion fallback.
5. Production reward visual assets, one-time first-library celebration bug fixed and existing sparks motion wired.
6. Exact, reversible changes recorded by UI-binding exceptions. Strict canonical lock checks still green.
7. Same-source code gates: [105/105 mobile suites; Expo Doctor, typecheck and web build](https://github.com/russellstokes-ai/Archivist/actions/runs/38151449352) and [unsigned iOS Simulator compile](https://github.com/russellstokes-ai/Archivist/actions/runs/38151449262) passed on `1913afe`. Android native check [38151276884](https://github.com/russellstokes-ai/Archivist/actions/runs/38151276884) passed on earlier source `171ff682`. A newer release APK workflow must pass before a newer build is distributed.

## Verified current download — ready for physical testing
- **[Download Archivist-Commercial-Polish-Preview-05fec3c.apk](https://github.com/russellstokes-ai/Archivist/releases/download/archivist-commercial-test-05fec3c/Archivist-Commercial-Polish-Preview-05fec3c.apk)**
- [GitHub release page](https://github.com/russellstokes-ai/Archivist/releases/tag/archivist-commercial-test-05fec3c) | [SHA256SUMS.txt](https://github.com/russellstokes-ai/Archivist/releases/download/archivist-commercial-test-05fec3c/SHA256SUMS.txt) | [successful same-source build](https://github.com/russellstokes-ai/Archivist/actions/runs/38154082575)
- Exact APK source commit: `05fec3cbf726712f0a156bacf48ed2484da9cb45`. APK size **45,560,886 bytes**. All source/native release-build/signature/ABI/alignment/upload workflow checks PASS.
- Test pack includes **production** Lottie loader, NOW/mini-player, waveform and reward icons; do not use historical `c3465f5` for animation acceptance.
- Source master plan and this handoff were written before testing; this release details addendum is **documentation only** and does not alter the APK.
- Status: **APK VERIFIED, PHYSICAL DEVICE ACCEPTANCE OPEN**, not a production Play Store app.

## Install caution
The test APK uses `app.archivist.reader.scanneracceptance`, an ISOLATED package from the production `app.archivist.reader`, **but the same test package identity as the previous Fold/scanner acceptance builds**. Installing it may UPDATE that earlier test app rather than create a third separate install. Preserve or back up important test-only data first. Its installer may be called an Android sideload/test prerelease; never call it a commercial store release.

## Requested focused physical tests
1. **Initial open, 1st library and scan**: no stall on 12 logical works with multiple underlying files; one work per book, no 226-files-for-12-books regression. Compare scan speed to the previously physically accepted version; observe Books Stack / Headphones and cancellation/resume.
2. **Fold closed and open**: the book is **larger** without clipping or obscuring title, progress, nav or transports; full open/page-turn frames visually identical to known good. Capture screenshot if any cropping or overflow appears.
3. **Now and mini-player**: tap Play/Pause rapidly and in both views, seek and skip, background/foreground, Bluetooth headset or speaker, audio waveform stops on pause/buffering and resumes on actual play; no flicker or stale icon.
4. **Metadata review and Assist**: edit a logical grouped work, save title/genre/cover, leave and return, ensure no disappearance; run Assist then Save to check concurrent SQLite BUSY; no inadvertent playback on review-row tap; keyboard and Save/Cancel/Assist stay accessible.
5. **Shelf/Library covers**: original assets load, group order stable, missing artwork fallback, no repeated refetch/flicker; scrolling remains responsive.
6. **Rewards**: real achievement reward animations, replay prevention across relaunch, first-library celebration at most once; do not manually edit earned counters just to force visual test.
7. **Atlas/Stats/Reader/Comic Focus**: try node selection and ring/chart alignment, real books/comics and speech-bubble double tap, reading progress and bookmarks, Fold posture switches.
8. **Reduced Motion & themes**: toggle dark/light and Reduced Motion; no animated decoration while inactive, fallback icons remain readable.
9. **Server optionality**: local only works without signing in; if using HA/server, verify remote/offline transitions separately.

## Report any defect with
`APK filename`, `APK SHA256`, `Git commit`, Android version, device, Fold open/closed, source folder count, expected vs actual, reproduction steps and (optionally) screenshot/short screen recording and diagnostics. Prioritise data loss/hangs over visual polish. Don't overwrite the canonical APK.

## Not yet accepted
Commercial Android/iOS store release, physical Fold performance, metadata search provider quality, real audiobook/reader/comic/Android Auto, family/HA, actual batteries/frame pacing and release signing. These remain open in master plan P5-P9 and must not be marked PASS merely because native compile is green.
