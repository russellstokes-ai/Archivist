# Archivist polish and differentiation plan

Date: 2026-09-26

## Product direction

Archivist is a local-first personal library product, not a server-first administration tool.

A non-technical user should be able to install the mobile app, choose where their books live, watch Archivist find and organise them, and begin reading or listening without understanding servers, Docker, paths, ports, tokens or metadata providers.

The optional server remains useful for shared household libraries, remote sync and always-on storage, but it stays behind Settings and never blocks the core app.

## Lessons retained from BookOrbit

BookOrbit is a useful reference for breadth, especially its library model, first-library guidance, metadata controls, statistics and achievements. Its documentation describes a library wizard that starts with a name and folder, library-specific cover shape, scan modes and metadata precedence. Archivist should retain the clarity of that setup while reducing configuration and making safe defaults automatic.

Archivist should deliberately differentiate in the areas that matter most to everyday users:

- stronger scan, identification and organisation of messy real-world folders;
- local-first use with no server requirement;
- immediate visible scan progress and reviewable results;
- richer audiobook playback;
- richer ebook/comic reading;
- polished motion, page turns, sound and tactile feedback;
- consistent cover treatment instead of visible letterboxing;
- achievements and statistics kept in Profile instead of crowding the main navigation;
- failure isolation: a bad/large file must not take down the library or block use.

## Build sequence

### 1. First-run guidance and delight — IN PROGRESS

- Replace the permanent technical setup panel with a first-run guided checklist.
- Step 1: choose a folder.
- Step 2: scan and identify content automatically.
- Step 3: review anything uncertain, then enter the Shelf.
- Show an immediate scanning state from the moment the user starts.
- Celebrate the first successful library with a lightweight on-device burst/confetti effect.
- Never force server setup.
- After onboarding, reduce folder controls to a compact library switcher and Settings.

### 2. Scanner / Organiser v2 — IN PROGRESS

- Keep discovery sequential and bounded-memory; never read full book/comic files just to discover them.
- Infer useful metadata from common real-world folder and filename layouts.
- Track identification confidence and flag uncertain items for review instead of silently guessing.
- Report discovered, identified and review counts while the scan runs.
- Preserve originals during organising until the user approves the preview.
- Later layers: embedded metadata, OPF/NFO sidecars, ISBN/provider lookup, dedupe/fingerprints and background cover extraction.
- Scanner/parsers must fail per-file rather than crash the main app.

### 3. Library navigation and cover presentation — IN PROGRESS

- Desktop/tablet: persistent left library rail.
- Phone: compact horizontal library switcher.
- Make folders/libraries feel like first-class library spaces, not settings objects.
- Default ebook/comic/PDF covers to portrait and audiobook artwork to square.
- Cover surfaces use crop/fill presentation rather than letterboxed boxes; retain a user preference later for Fit/Fill.
- Keep the Shelf focused on content; move administrative controls away from every book card.

### 4. Audiobook player polish

- Retain the current Archivist player design as the visual base.
- Refine large artwork, chapter navigation, queue, speed and sleep controls.
- Add tactile transitions and polished mini-player behaviour.
- Add optional subtle page/section sounds only where appropriate; never interrupt spoken audio.
- Improve offline/local queue and resume behaviour.

### 5. Reader and comic polish

- Add realistic but restrained page-turn animation for paged ebook/comic modes.
- Add an optional page-turn sound with per-user setting; default subtle, easy to disable.
- Preserve pinch/zoom and current speech-focus interaction.
- Upgrade speech focus from tap-point zoom to panel/text-region detection without generative AI.
- Add reader appearance controls without turning the reader into a settings dashboard.

### 6. Profile, achievements and statistics

- Add Profile as the home for personal stats, streaks, goals and achievements.
- Keep achievements out of the main sidebar/tab bar.
- Use small celebratory effects for meaningful milestones.
- Keep the main Shelf calm even as the profile becomes richer.

### 7. Atlas depth

- Replace format-as-genre fallback with real extracted/fetched genres.
- Add useful relationships across author, series, genre, collection, folder, edition and reading state.
- Prefer actionable exploration over decorative graph complexity.

### 8. Optional server refinement

- Preserve the mobile-first product language.
- Keep server connection in Settings.
- Improve household sync, remote access and folder management without exposing server concepts to users who do not need them.

## Release gates

Every mobile build must pass typecheck, core/local-library/local-reader tests, Android release build and emulator launch smoke test.

Scanner changes additionally need fixtures for messy filenames, deep folders, large-file discovery and ambiguous metadata. A scan may skip a file, but it must not crash the app.
