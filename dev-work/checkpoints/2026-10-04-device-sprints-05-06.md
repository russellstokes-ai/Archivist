# Device polish Sprints 5–6 — 4 October 2026

Active branch: `bugfix/0.9.4-device-pass-20261004`
Baseline: `backup/0.9.4-real-device-baseline-20261004`

## Sprint 5 — scan/catalogue stability

Completed at `a150665a00f738d5e1cb6f5d02c5221880be68e3`.

User-facing result:
- Newly added folders appear immediately with a clear **Scanning…** state.
- Existing Shelf/Library content stays published while a refresh is running; partial scan output is never presented as a finished catalogue.
- Scan results commit atomically and stale overlapping scans cannot overwrite a newer result.
- Interrupted pending folders recover once after relaunch instead of entering retry loops.
- Failed scans keep the saved source and provide a recoverable refresh state.
- Scan completion feedback expires instead of becoming permanent chrome.
- Server-space choices are retained during local rescans.

Validation:
- Mobile checks: GitHub Actions run `37217600399` — success.
- iOS checks: GitHub Actions run `37217600368` — success.

## Sprint 6 — metadata identity and messy-library inference

Implemented after the Sprint 5 checkpoint.

User-facing result:
- Generic audiobook labels such as **Part 1**, **Part 36**, **Track 03**, bare track numbers and numbered track names no longer replace a stronger book identity inferred from folders.
- Multi-track audio uses sibling context so `01 - Opening.mp3` inside a book folder resolves to the book rather than becoming a separate apparent title.
- Indexed book folders such as `01 - Dune` contribute both the clean title and series number.
- Recognised genre folders such as `Science Fiction` are used conservatively and removed from author/series inference, reducing false **Unclassified** results without treating a category as an author.
- Placeholder discovered values such as `Unknown Artist`, `Unknown`, `Untitled` and `Unclassified` are discarded when stronger local evidence exists.
- The metadata resolver's chosen fields are now actually published into the scanned catalogue; previously they were recorded as provenance/confidence but sequential embedded metadata could still remain visible.
- Path evidence now carries narrator, publisher, ISBN, ASIN, language and description into resolution.
- ID3 audiobook parsing now uses the album title when the track title is only a generic part/track label and can fall back to album artist when a primary artist is absent.
- Manual overrides remain final, including intentional clears.

Regression coverage:
- Added `mobile/metadata-quality.test.cjs` for genre hierarchy, indexed folders, multi-track numbering, placeholder rejection, resolver publication and scan integration contracts.
- Extended `mobile/audio-metadata.test.cjs` for generic-track/album-title fallback.

## UI boundary

The locked Shelf, Library, Player, Atlas and Comic Focus visual language was not redesigned by these sprints. Changes are limited to scan-state behaviour, metadata/catalogue correctness and their existing status surfaces.

## Runtime boundary

Physical-device acceptance should still use a representative messy real library with mixed EPUB/PDF/comic/audio structures and confirm actual cover/metadata availability. Automated checks prove the resolver and scan contracts, not the quality of every third-party file's embedded metadata.


## Sprint 6 commercial cover + metadata expansion

Added after the initial identity-resolver checkpoint because real-device feedback showed that metadata correctness and cover completeness are release-critical.

### Mobile/local library
- The resolver now publishes the chosen metadata fields instead of retaining a weaker sequentially-applied candidate.
- Generic audiobook labels such as `Part 36`, `Track 03` and numbered chapter filenames cannot overwrite a stronger book-folder identity.
- Numbered multi-track audio uses sibling context; indexed book folders can provide clean title + series position.
- Placeholder tags such as `Unknown Artist`, `Unknown`, `Untitled` and `Unclassified` are discarded when better evidence exists.
- EPUB OPF parsing now recovers normal `dc:identifier` ISBN/ASIN values and EPUB 3 collection/group-position series metadata.
- MP3 metadata uses album identity when the track title is generic and can fall back to album artist.
- M4A/M4B metadata now reads standard MP4/iTunes title, album, artist, genre, date and grouping fields from bounded head/tail chunks.
- Embedded covers now recover from:
  - EPUB manifest/cover-image metadata;
  - CBZ/ZIP cover or natural first image;
  - MP3 ID3 APIC artwork;
  - M4A/M4B `covr` artwork;
  - Android PDF first-page rendering through the existing trusted Archivist native PDF reader;
  - Android CBR first image through the existing bounded native RAR reader.
- Embedded/generated covers are persisted under Archivist app-private cover storage and reused when the source file is unchanged.
- Existing exact-name/folder artwork and manual cover overrides remain higher priority than generated fallback artwork.

### Archivist Server / Home Assistant
- Server audiobook path inference now resolves track-like filenames to the containing book rather than exposing the part/chapter label as the work title.
- Generic/placeholder embedded audio fields are suppressed when folder evidence is stronger.
- M4A/M4B metadata support mirrors the mobile bounded MP4 parser.
- MP3 metadata now uses album/album-artist fallbacks for generic track tags.
- Server cover endpoints now extract embedded MP3 APIC and M4A/M4B `covr` artwork after checking external artwork.
- Root server and packaged Home Assistant sources remain byte-for-byte synchronized.

### Automated proof
- Server checks run `37219317364`: **PASS** — root tests, packaged tests, ARM64 compile, JavaScript syntax, UI/package contracts, source parity and HA Docker smoke test.
- Mobile checks run `37219394733`: **PASS** — dependency install, Expo Doctor, TypeScript, all maintained mobile suites, version consistency and Expo web export.
- iOS native compile for the same executable mobile head is still running at the time of this documentation commit; no iOS runtime-complete claim is made until that gate finishes.

### Remaining truth boundary
This materially raises cover/metadata recovery but does not pretend that every malformed or metadata-empty file can be identified offline. Archivist remains private/local-first: it does not silently contact internet metadata services. Files with no trustworthy local identity stay in the review workflow instead of being guessed.
