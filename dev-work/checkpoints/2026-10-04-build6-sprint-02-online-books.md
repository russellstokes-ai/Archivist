# Build 6 Sprint 2 — online book metadata enrichment

Date: 4 October 2026  
Branch: `build/0.9.4-test6-20261004`  
Executable/tested head: `869a58df3364991d018c554277421cb734f2eb33`

## Goal

Make book identification and enrichment behave like a mature library product even when files contain incomplete or messy names, shallow folder structures or partial embedded metadata.

## Architecture

Local scanning remains immediate and offline-capable. Archivist publishes the local catalogue first, performs local cover recovery, then enriches weak book records online in the background. Users do not wait for internet lookup before Shelf/Library becomes usable.

### Evidence hierarchy

Archivist now treats metadata conservatively:
1. Manual values are protected.
2. Embedded and sidecar values are protected from online overwrite.
3. Strong online evidence can fill missing values and improve weak path-derived guesses.
4. Folder/path inference remains a useful fallback.
5. Ambiguous online candidates are stored for review instead of silently changing the library.

Exact identifiers receive the strongest match weight. Title + author, series, publication year and folder evidence contribute progressively weaker evidence.

## Recognition

The lookup engine builds evidence from:
- ISBN-10 and ISBN-13, preserving the full provider identifier set.
- Existing title, author, series and year metadata.
- Bare filenames.
- `Author - Title` style filenames.
- Numbered filenames such as `03 - Title`.
- Simple `Books / Author / Title.epub` layouts.
- `Author / Series / 03 - Title` layouts.
- Deeper Android SAF/document URIs after decoding.
- Existing embedded/sidecar data.

Provider series strings can also supply a series number when a safe explicit pattern such as `Series #3`, `Series (Book 3)` or `Series Volume 3` is present.

## Providers

- Open Library is the zero-configuration primary provider.
- Google Books is implemented as a secondary provider when a Google Books API key is supplied through app configuration.
- Open Library requests are deliberately throttled and cached.
- Positive matches cache for 30 days.
- Misses cache for 24 hours.

## Fields enriched

Where provider data exists and the local precedence rules allow it:
- title
- author
- series
- series number
- genre
- publication year
- publisher
- ISBN
- language
- description
- cover artwork URL

Work and edition keys are recalculated after accepted enrichment.

## Safety and review

- High-confidence unique matches can auto-apply.
- Exact identifier matches can correct weak path-derived identity.
- Manual, embedded and sidecar fields are not overwritten by online enrichment.
- Medium/ambiguous candidates become review items.
- Existing selected covers remain protected when a background merge occurs.
- Enrichment stops when a newer scan generation supersedes the current scan.
- Catalogue and provider cache are persisted incrementally.

## Regression coverage

New `online-book-metadata.test.cjs` covers:
- sparse folder reconstruction
- simple Author/Title folders
- strong title + author matching
- exact ISBN matching
- ISBN-10 / ISBN-13 edition equivalence
- manual/embedded field protection
- publisher/year/genre/description enrichment
- cover discovery from provider results
- mocked Open Library response handling

The scan-stability contract was also upgraded to assert the new staged pipeline: catalogue publish -> local cover enrichment -> online book metadata enrichment.

## Final automated evidence

All evidence below targets exactly `869a58df3364991d018c554277421cb734f2eb33`.

- **PASS Mobile:** run `37237039848`
  - dependency installation
  - Expo Doctor
  - TypeScript
  - **43/43 maintained mobile suites**
  - version consistency
  - Expo web bundle

- **PASS iOS:** run `37237039929`
  - dependency installation
  - Expo Doctor
  - TypeScript
  - native project generation
  - CocoaPods
  - complete iOS Simulator compile

Sprint 1 Android-native proof remains run `37236065446` after the fullscreen bridge fix.

## Acceptance boundary

The engine and integration are automated-test GREEN. Live-provider behaviour on a large, messy real library and physical-device UX remain open for Build 6 acceptance. Online cover files are referenced from provider URLs at this stage; durable local online-cover caching and richer user-facing candidate selection belong to the later metadata/cover experience sprint.
