# Archivist release readiness

Date: 2026-09-27

This is the current source-of-truth release ledger. Older polish/testing notes remain useful history but may describe completed work as unfinished.

## Source-complete and CI-covered

### Local-first onboarding
- Three-step first-run flow: choose folder, scan/identify, review uncertainty.
- Scan state is visible immediately.
- First successful library celebration is local/on-device.
- Server setup is optional and remains in Settings.
- Library switching is compact on phone and a rail on wider layouts.

### Scanner and organiser
- Bounded discovery limits and per-file/folder failure isolation.
- Messy filename and folder inference.
- Sidecar OPF/NFO enrichment with bounded reads.
- Generic audiobook metadata/cover reuse for multi-track folders.
- Manual metadata corrections persist across rescans.
- Safe organisation is preview/copy-first with recovery history.
- Fixtures cover messy names, dotted/deep folders, huge media discovery, malformed/oversized sidecars and multi-track audiobook metadata caching.
- Local catalogue is cached so cold starts do not automatically rescan a healthy library.

### Persistence and upgrade resilience
- Growing local state is stored in app-private files rather than SecureStore.
- Existing SecureStore state migrates automatically.
- State writes keep a backup and recover from a corrupt primary file.
- Server credentials and small settings remain in SecureStore.
- New mobile builds tolerate older servers missing genre/Atlas fields.
- Unsupported newer Atlas dimensions fall back to currently loaded works rather than breaking the app.

### Shelf and library presentation
- Logical works rather than raw files are the normal Shelf view.
- Audiobook tracks group into one work.
- Cover aspect defaults are portrait for reading and square for audio.
- Technical local sorting controls have been moved out of the Shelf into Settings.
- Metadata review remains actionable from the Shelf without exposing server administration.

### Audiobook playback
- Local and server playback.
- Resume/progress persistence.
- Multi-track work playback and automatic advance.
- Queue handling.
- Speed, sleep and chapters where supported.
- Lock-screen metadata.
- User-initiated offline downloads for server works, including multi-track audiobooks.
- Resumable/interrupted offline downloads with persisted checkpoints.
- Offline storage manager with used/free space, cleanup, resume, discard and remove controls.
- Offline work manifest persists and downloaded works appear in the local Shelf when the server is unreachable.

### Reader
- EPUB, PDF and CBZ/ZIP comic paths.
- Reader progress/completion persistence.
- Page turns, optional subtle page-turn sound, pinch/zoom and text focus.
- Deterministic local speech-bubble segmentation and clipped high-resolution speech-focus overlay.
- Speech focus is implemented in both local mobile and server-backed readers.
- No OCR, cloud vision or generative AI is used by speech focus.

### Profile
- Real local/server statistics.
- In-progress/completed counts.
- Personal ratings, favourites and average rating.
- Achievements derived from real statistics.
- Milestone celebration remains in Profile/Shelf experience rather than adding navigation clutter.

### Atlas
- Real primary genre extraction and persistence.
- Author, series, genre, format, folder and availability relationships.
- Personal reading state: Not started / In progress / Finished.
- Personal ratings (half-star increments) and favourites.
- Exact Shelf drill-down filters, including personal state/rating/favourite.
- Old-server fallback behavior.

### Server and Home Assistant packaging
- Root server, packaged server and Home Assistant server source parity is enforced by CI.
- Go module metadata is tidy and checked.
- Server checks cover Go tests, web JS syntax, UI wiring, launcher syntax, packaged source parity and Home Assistant container smoke test.
- Track API exposes original filename and size for safe offline download handling.

## CI release gates currently green

- Expo Doctor.
- TypeScript.
- Mobile core/unit/contract tests.
- Local scanner fixtures.
- Local reader tests.
- Speech-focus detector tests.
- Persistence migration/recovery tests.
- Mixed-version compatibility tests.
- Offline-download tests.
- Root Go tests.
- Packaged Go tests.
- Home Assistant packaged Go tests.
- Go module cleanliness.
- Server web syntax/UI contract.
- Home Assistant add-on smoke test.

## Still requires real-device / corpus validation before release claim

### Speech focus
The deterministic detector is now real source code, not tap-point page zoom, but it is not yet release-accepted. It still needs a labelled corpus and device checks covering:
- white and coloured speech bubbles;
- thought clouds and jagged bubbles;
- narration boxes;
- touching/overlapping bubbles;
- manga/right-to-left pages;
- text outside bubbles;
- scanned/noisy pages;
- portrait/landscape/tablet;
- rapid gestures and reduced motion;
- false-positive and text-coverage thresholds.

If detection is uncertain, ordinary zoom remains the fallback. We should not claim universal Bubble-Zoom parity until the corpus passes.

### Android release build
Before generating the next tester APK:
- Android release build must pass on the final source head.
- Emulator launch smoke must pass.
- Install/upgrade over the previous tester build must preserve state.
- Physical-device tests should cover LAN IP, Tailscale IP and public HTTPS server connections.
- Remote/offline transition should be tested with a real downloaded audiobook and ebook.

### Performance
Measure on the target phone and Raspberry Pi:
- 1k / 5k item Shelf startup and search.
- Large audiobook folders.
- Large CBZ/EPUB reader memory.
- Long playback sessions.
- Server scans while streaming.
- Offline download interruption/retry behavior.

## Known gaps

### Local CBR/CBT on phone
The server reader supports RAR/TAR comic archives, but the phone-local reader currently uses JSZip and therefore does not natively open local CBR/CBT. Offline comic downloads intentionally reject CBR/CBT instead of pretending they are CBZ.

A WASM RAR decoder should only be added after measuring binary size, memory use and device compatibility. Until then this is an explicit release gap for users who require local CBR.

### Reader archive memory
Local EPUB/CBZ uses JSZip and materialises archive data in memory. Offline downloads enforce a 256 MB archive safety limit, but local-folder archives can still be larger and require real-device validation or a streaming reader architecture later.

## Remaining release-acceptance order

1. Complete the final Android release build and emulator launch smoke on the current release-candidate head.
2. Install/upgrade the APK over the previous tester build on a physical Android device and confirm persisted state survives.
3. Perform physical-device LAN, Tailscale and public-HTTPS server acceptance.
4. Exercise real offline transitions with downloaded audiobook, EPUB/PDF/CBZ content, including interrupt/resume.
5. Benchmark speech focus on a real labelled comic corpus and check archive-reader memory on target phone/tablet hardware.
6. Measure target Raspberry Pi 4 and phone behavior for large-library startup/search, long playback and scan-while-streaming.
7. Fix only device-specific release blockers found by those checks; then mark the Android release candidate ready.
8. After acceptance, produce the signed Google Play AAB/internal-test package.
