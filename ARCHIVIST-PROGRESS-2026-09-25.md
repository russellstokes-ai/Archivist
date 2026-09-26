# Archivist Progress Handover - 2026-09-25

## Current GitHub State

- Repository: `russellstokes-ai/Archivist`
- GitHub main commit: `a7eec45590e633592c1da0023fccbba60d91d534`
- GitHub Actions run: https://github.com/russellstokes-ai/Archivist/actions/runs/36110812602
- APK artifact: `archivist-release-apk`
- Artifact size: about 34 MB
- Workflow result: success

The GitHub commit is a single uploaded commit that contains the local work from these local commits:

- `4f424c5` Move mobile app toward local-first setup
- `d96ebde` Add Android local folder scanning
- `576fc2f` Add local sorting preview
- `f3c20f0` Add first-run server owner setup
- `731c76e` Add local sort copy apply
- `1353d5c` Add local media playback handoff
- `282dff8` Add local reader progress and sort recovery
- `778a1c1` Polish server setup and phone connection
- `11c3315` Add atlas filters and comic focus zoom

## Completed Since The Earlier Broken Setup

- Mobile app is local-first.
- Server connection is optional and lives in Settings.
- Android local folder picking/scanning is implemented.
- Local sorting preview and copy-based apply/recovery are implemented.
- Local audio playback, queue, progress, and reader handoff are implemented.
- EPUB, PDF, CBZ/ZIP local reading path is implemented.
- Server first-run owner key setup is implemented.
- Server UI has a Server page with address, setup status, active sessions, roots, sources, and jobs.
- Server folder picker starts from readable roots and no longer forces typing paths first.
- Phone server connection now checks setup status and gives clearer key/address messages.
- Atlas is now data-driven in the app for genres/formats, authors, series, folders, and reading state.
- Atlas rows filter the Shelf.
- Comic double-tap focus zoom is implemented for local comic reader HTML and server comic reader pages.
- README has product-facing wording and logo.
- Packaged server copies under `archivist/app` and `home-assistant/archivist/app` were synced for changed server/web files.

## Verification Already Run Locally

- `npm run typecheck`
- `node mobile/core.test.cjs`
- `node mobile/queue.test.cjs`
- `node mobile/local-library.test.cjs`
- `node mobile/local-reader.test.cjs`
- `node scripts/package-ha.test.cjs`
- `node scripts/ha-runtime.test.cjs`
- `node mobile/native-patch.test.cjs`
- packaged server file parity checks
- `git diff --check`

Go tests and `gofmt` could not run locally because Go/gofmt are not installed in the workspace.

## Current APK For User Testing

Use the GitHub Actions artifact from:

https://github.com/russellstokes-ai/Archivist/actions/runs/36110812602

Download `archivist-release-apk`, unzip it, and install the APK on Android.

## User Testing Script

1. Install the new APK.
2. Open Archivist without adding a server.
3. Add a local folder from the phone.
4. Confirm Shelf populates with local books/comics/audio.
5. Open an audiobook and confirm playback, queue, resume.
6. Open an EPUB/PDF/comic.
7. On a comic, double-tap a speech/text area and confirm focus zoom.
8. Go to Atlas and tap genre/format, author, series, folders, and reading state rows.
9. Confirm Shelf filters correctly.
10. Go to Settings, open Add server, and check server address behaviour.

## Known Gaps / Next Work

- Atlas uses media format as genre until richer metadata exists.
- Atlas is useful and tappable, but not yet a full graph/map visualisation.
- Speech bubble focus is tap-point zoom, not true computer-vision bubble detection yet.
- Android APK is a GitHub Actions release APK artifact, not a Play Store signed AAB.
- Server testing still needs a real install pass from the current packaged server.
- Home Assistant wording should stay out of the main product copy.

## Next Build Priorities

1. User-test the APK install and first-run local folder flow.
2. Fix any install/runtime issues from the phone immediately.
3. If APK is usable, test server install and phone connection.
4. Improve Atlas with real metadata once scan/extraction support is expanded.
5. Upgrade speech focus from tap-point zoom to detected text/bubble regions when stable.

## Android Rebuild Trigger

- Rebuild requested after Android startup compatibility fix (0.0.1 / versionCode 2).


## 2026-09-26 — BookOrbit-informed polish pass

Archivist remains deliberately local-first. BookOrbit was used as a reference for library onboarding, library switching, cover preferences, achievements/statistics and breadth, but Archivist should avoid a server-admin-first experience.

### Implemented for mobile 0.0.8

- Added a three-step first-run guide: choose folders, automatic scan/identification, review only uncertain matches.
- Added immediate visible scan progress from the start of discovery.
- Added a one-time first-library celebration effect.
- Added conservative local metadata inference from common filename/folder layouts with confidence and review flags.
- Raised the local discovery cap to 5,000 while keeping traversal sequential and bounded-memory.
- Added scan summaries for found / confidently identified / review counts.
- Added a responsive library switcher: left library rail on wider layouts, compact chips on phones.
- Added uncertain-item review filtering and per-book review badges.
- Added square audiobook and portrait book/comic cover geometry as the basis for consistent fill-style artwork presentation.
- Bumped Android mobile version to 0.0.8 / versionCode 9.
- Android CI now gates builds on local-library and local-reader tests as well as core/queue/native tests.
- Added `ARCHIVIST-POLISH-PLAN-2026-09-26.md` for the expanded build sequence.

### Next polish sequence after 0.0.8 validation

1. Audiobook player refinement: artwork, chapters, queue, speed/sleep interactions and motion.
2. Reader/comic refinement: paged mode, page-turn animation, optional page-turn sound, richer reader controls.
3. Profile: achievements, reading/listening statistics, streaks and milestones kept out of the main navigation.
4. Scanner v2 deeper layers: embedded metadata, sidecars, multi-file audiobook grouping, ISBN/provider matching, dedupe/fingerprints and background cover extraction.
5. Atlas: real genres and richer relationships.


## 2026-09-26 — Reader and player polish pass

### Audiobook player

- Reworked the mobile player around a dedicated listening surface rather than generic buttons.
- Added large square artwork treatment, clearer title/byline/chapter hierarchy and remaining-time display.
- Added restrained 15-second back / 30-second forward controls and larger central play/pause affordance.
- Added compact speed, sleep/queue surfaces rather than permanently exposing controls.
- Improved chapter and queue presentation.
- Corrected the local mini-player so local playback no longer routes through the server playback controller.
- Local playback speed now uses Expo Audio's native playback-rate API.

### Reader / comics

- Local comics are now paged rather than rendered as one long strip.
- Local EPUB content is presented in paginated columns.
- Edge tap turns pages.
- Center tap focuses text; comic focus zooms around the tapped point.
- Pinch zoom works for comics; EPUB pinch adjusts readable text scale.
- Page transitions use a restrained short 3D turn rather than a decorative full-page curl.
- Optional page-turn sound is synthesized locally with Web Audio, avoiding bundled/licensed sound assets.
- Sound preference is persistent and consistent across local/server readers.
- Reader respects reduced-motion preferences.
- Local EPUB/comic page position persists per file and resumes on reopen.
- Server reader now mirrors the same page-turn, text focus, pinch and sound interaction language.
- Server and Home Assistant packaged reader assets are parity-gated so they cannot silently diverge from root source.

### Validation gates

- Local reader tests now cover sanitization, paging, text focus, pinch and reader controls.
- Server reader tests verify the interaction assets and reduced-motion CSS.
- Android release workflow typechecks, runs all mobile tests, builds a release APK and launches that exact artifact in an emulator.
