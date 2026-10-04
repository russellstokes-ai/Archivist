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
