# Downloadable diagnostics — PR 83, 18 October 2026

## Collect a report

In Archivist Assist, open **Scanner & sources → Download scan report**. This downloads `archivist-scan-report.json`, suitable for attaching to a support conversation. It is available to the administrator only.

After upgrading to **0.9.3-qa.20261018.2**, use **Scan / refresh source** once for each source and wait for completion. Earlier versions did not store skipped-file breakdowns, so a report cannot reconstruct those earlier scans. The report explains when this evidence is absent. Downloading the report itself does not scan, modify files or run metadata lookups.

The report includes:

- Schema/build version, operating system, architecture, Go version and generation time.
- Source identifiers/names and current status; last successful discovery time.
- Imported/skipped counts by extension, plus up to five skipped basenames per extension. At most 100 distinct extension buckets plus an overflow bucket.
- Path-fallback counts and skipped symlinks. A fallback does not prove corrupt media: metadata may be absent, unsupported or unreadable.
- Indexed counts/gaps grouped by format and metadata source.
- Separate effective book-level missing author/genre/year counts, including saved enrichment. File metadata totals are explicitly labelled as files.
- Enrichment enabled/paused state and counts by waiting, retry due, filled, insufficient identity, unresolved or provider-unavailable outcomes. These are last outcomes and queue counts, not a live provider progress bar.
- Up to 100 low-confidence/missing-metadata file examples, with file/source IDs, basename, title, format, provenance and review flag.
- Up to 50 repeated-title groups with work counts and distinct series counts. These are possible duplicates or editions, not a reason to merge/delete them automatically.
- Up to 30 recent scan jobs with state and progress. Original job messages are excluded because they can contain paths.

It does **not** export source root paths, access keys, credentials, household identities, reading history, database backups or media contents. It does include library names, filenames and titles; inspect before sharing. Counts are bounded snapshots and the report records its sample limits. It is not a complete filesystem inventory or archive integrity test.

## Changes in this candidate

- All six main navigation sections have consistent decorative outline icons and readable labels.
- CBT ComicInfo metadata is read from TAR, with bounded traversal, instead of incorrectly using the ZIP reader.
- Comic collection parent folders are no longer assumed to be author names. Explicit `#12`/`issue 12` remains usable evidence; bare story numbers, suffixes and ranges do not become invented issue numbers.
- Numbered PDF names such as `01- Example the Explorer.pdf` have their ordering prefix removed from the display title without assigning an unverified issue number.
- An explicit unique comic series/issue match can enrich without a pre-existing author. An unambiguous exact series-title match can supply **genre only**, never the issue's author or publication year. Series requests share a bounded cache.
- Parser-version invalidation causes one fresh metadata extraction on the next scan; unchanged later scans reuse metadata. Manual corrections and locks remain protected. Changed scans invalidate prior enrichment attempts for their source so newly available evidence is reconsidered.
- Source diagnostics retain the last successful extension report atomically with catalogue changes. Failed scans do not replace it; current source/job status identifies failure separately.

This does not establish that unsupported extensions contain comics, add CB7/bare RAR support, guarantee provider coverage or guess historical issue years. It deliberately preserves unresolved items. Physical HA/Pi/NAS and representative collection/browser acceptance remain outstanding. Use disposable fixtures for automated acceptance; no owner media has been accessed by the agent.

## ComicInfo compatibility follow-up

ComicInfo Number is a text field in the upstream schema. Embedded and sidecar XML with a value such as `1A`, `1/2`, `Annual` or an empty value no longer loses all its other metadata. The current numeric issue field remains unset for these nonnumeric labels; the original source metadata is untouched. Regression fixtures verify title/author/genre/year survive.

See [ecosystem research](METADATA_ECOSYSTEM_FINDINGS_2026-10-18.md) for ComicTagger, Comicbox, Metron, Comic Vine and MusicBrainz comparisons and remaining provider work.

## Exact-source validation

Source 1755831ad6e40124b539f6c2c4221b36aa0ab106 passed both Go suites, 10,020-file import/rescan, UI contracts, protection/parity, native ARM64 and Docker/HA smoke. CI first import: 17.955 seconds, 150,138,696 cumulative allocated bytes. Unchanged rescan: 139.206 seconds, 126,845,520 allocated bytes. Allocations are not peak memory; rescan cost remains a limitation, and these synthetic placeholders do not measure real archive decoding or Pi performance.
