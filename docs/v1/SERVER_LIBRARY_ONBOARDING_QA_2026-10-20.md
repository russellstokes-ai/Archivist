# Server library onboarding QA candidate

## Library discovery and welcoming onboarding — 20 October 2026

Version **0.9.3-qa.20261020.1**. Exact-SHA hosted verification is pending; this entry will be updated after the build.

- Three-step onboarding: choose folders, find books, open Library. Optional metadata gaps no longer lead the first-import action to mass review. Existing books stay accessible during other imports or failed refreshes. All six navigation icons retained.
- Clearer skipped-file reasons; recover validated comic ZIPs with the reported malformed ]cbz suffix; distinguish multi-book ZIP packs from page comics. No source file is renamed or extracted.
- Better dotted/bracketed comic filenames, inferred bracketed years, conservative issue parsing, preserved annual/volume qualifiers and fractional issues. Case-insensitive ComicInfo, invalid optional years isolated, ComicBookLover ZIP comments, case-insensitive JSON keys/string arrays. Volume is not an issue number.
- Optional Metron token under Settings → library folders → Improve comic details. Unique exact series/issue lookup can fill missing genre and issue year. Tokens are owner-only, never returned/exported, and stored in the private server database (protect backups). No credentials or files go to arbitrary endpoints. Requests have time/body bounds, redirect rejection, pacing and durable failure pause. Connecting saves the token; it does not claim credentials were verified.
- Local synthetic 10,020-file measurement: first import 17.13s, unchanged rescan 4.66s versus 84.90s before the optimisation. This is Windows workstation evidence, not Pi/NAS speed or peak memory. A version-change rescan must re-read metadata once.
- Scan-report schema 2 adds reason counts/examples plus series, issue, year and review reason on sampled files. Counts describe recognised/indexed files, not a guarantee of successful full decoding or identification.

### Install and test

Back up Archivist first. Refresh the existing PR83 Home Assistant app repository, update **Archivist QA (PR 83)** to **0.9.3-qa.20261020.1**, and open its Web UI. Keep the same repository:

https://github.com/russellstokes-ai/Archivist#integration/archivist-v1-auto-restore-recovery-20261016

Rescan each source once. Confirm the Library opens without a review requirement; open a CBZ/CBR/PDF and play an audiobook. Download **Library Manager → Scanner & sources → Download scan report** and compare imported/supporting/unsupported counts. Test a second unchanged scan. Optional: connect Metron in Settings, then check whether genre/year coverage improves. Disconnecting the provider leaves existing saved details intact.

### Acceptance limits and remaining plan scope

Physical Pi4/HAOS/SMB/NFS, representative personal media, actual browser/phone/accessibility and live authenticated Metron acceptance remain **BLOCKED**. The full Linux suite and packaging run in CI; local Windows tests involving Linux paths, hardlinks and simulated mount renames cannot substitute for them.

This candidate does not add CB7 decoding, loose-image-folder reading, MOBI reading, arbitrary archive-pack extraction, PDF metadata extraction, MetronInfo XML, cover-image matching, Comic Vine/MusicBrainz adapters, persistent series caches or a grouped series-choice editor. Generic comic ZIPs are inspected; CBZ/CBR/CBT full readability is established when opened, not exhaustively during discovery. No duplicate auto-merge or guessed genre. Those parts of the wider plan remain unfinished. Existing manual review, metadata locks, family access and protected mobile/reader/scanner remain in place. No commercial release claim or merge.

