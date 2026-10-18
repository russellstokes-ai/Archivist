# Changelog

## 0.9.3-qa.20261018.2 — Discovery diagnostics and comic metadata

- Icons for all six main sections.
- Administrator diagnostic download: extension counts, skipped examples, jobs, build/runtime, metadata gaps, enrichment outcomes and repeated-title candidates.
- Book-level coverage shown separately from file-level gaps.
- CBT metadata reads TAR; nonnumeric ComicInfo issue labels no longer discard author/genre/year.
- Safer comic folder interpretation, numbered PDF titles and authorless explicit comic-identity matching; series-only matches can supply genre, never issue dates.
- Source media untouched; repeated titles are not automatically merged.
- Rescan once after updating to collect new diagnostic evidence.

## 0.9.3-qa.20261018.1 — Automatic library test candidate

- Adding a folder starts scanning; imports are readable without bulk approval.
- Optional attention queue for metadata flags/unavailable items; explicit hidden items stay hidden.
- Conservative background missing-field enrichment, including genre and first-publication year, preserving file/work locks and corrections.
- Shelf, Library grid/list/sort, Atlas, simple Player and separate Stats/Settings.
- Scan accounting and 10,020 mixed-extension synthetic import/rescan check.
- Exact-source server, ARM64, Docker/HA and QA packaging passed; physical/browser acceptance remains pending.

## 0.9.3-qa.20261017.1 — Home Assistant test candidate

- New-user import guidance and single-pass scans with unchanged-file reuse.
- Keyless metadata options, exact-ASIN audiobook details and guarded missing-field suggestions.
- Family library-space access and manager grid/list/table sorting.
- Server CI validation requested; physical HA/Pi/NAS acceptance remains pending.
- Install from the PR 83 branch repository; back up before updating.

## 0.9.3 — UI testing release

- Updated library and connected Atlas presentation with shared typography and teal atmosphere.
- Matched Android testing release 0.9.3.
- Keeps existing source folders and database under /data.
- Native-device acceptance and remaining metadata enhancements are still in progress.


## 0.1.21 — Home Assistant product packaging

- Presents Archivist as a first-class Home Assistant app repository.
- Adds full Home Assistant app documentation and release notes.
- Documents current ingress-first administrator setup and owner access-key workflow.
- Clarifies local and HTTPS network access.
- Keeps the root `archivist/` package and mirrored `home-assistant/archivist/` package aligned.
- Retains the existing catalogue, household, organisation, reader, player, Atlas and health-monitoring capabilities.

## 0.1.20

- Home Assistant repository layout corrected so Archivist is discoverable from the repository root.
- aarch64 and amd64 package metadata.
- Home Assistant ingress, watchdog and persistent storage configuration.
- Optional HTTPS listener and mapped media/share/backup storage.

