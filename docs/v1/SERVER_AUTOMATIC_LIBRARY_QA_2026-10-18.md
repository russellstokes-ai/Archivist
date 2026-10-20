# Automatic library QA — 18 October 2026

Tested executable source: `f31fa44557bad9f6ea5c772f35e0aeea8f067c7b`, version `0.9.3-qa.20261018.1`, draft PR 83. Documentation-only follow-up does not change the tested executable tree.

## Changed behaviour

Adding a source queues its scan. Completed imports appear in Shelf/Library/Atlas without individual publication. Legacy review-reopened imports also become visible; explicitly hidden items stay hidden. Needs attention means metadata flags or unavailable media, not every unpublished item. Family grants still restrict visibility and reading.

Background enrichment fills missing fields only after a unique identity match. Open Library needs no key; exact-ASIN audiobook lookup uses Audnexus. Genre and first-publication year feed Library/Atlas. Manual fields, file/work locks, existing values and stale editor snapshots are protected. Ambiguous titles and unverified comic issues remain unchanged. This is not a promise of complete online comic metadata coverage. No source media is rewritten or uploaded; identifiers/search terms are sent to providers. Owners can disable automatic metadata in source settings.

Server navigation exposes Shelf, Library, Atlas, Player, Stats and Settings. Library supports grid/list and title/author/recent sorting. Audiobooks use the simple cover/player; books/comics use the existing reader. Canonical mobile, scanner and reader implementations remain protected.

## Automated evidence

- [Server checks](https://github.com/russellstokes-ai/Archivist/actions/runs/39117974038): SUCCESS, both jobs. Root/packaged Go suites, regression tests for automatic visibility and explicit hiding, metadata identity/locks/stale saves/rescans, UI/manager contracts, protected sources, parity, native ARM64 container, Docker persistence and Home Assistant smoke.
- [QA package](https://github.com/russellstokes-ai/Archivist/actions/runs/39117974040): SUCCESS. [Download](https://github.com/russellstokes-ai/Archivist/actions/runs/39117974040/artifacts/12133286010), expires 25 October.
- Mixed-extension import: all **10,020** synthetic `.CBZ`, `.cbr`, `.pdf`, `.cbt` placeholders retained on first scan and unchanged rescan. First import **14.280s**, cumulative allocated bytes **146,537,952**; rescan **109.326s**, allocated bytes **125,846,488**. Allocations are not peak memory. Rescan is substantially slower here; metadata reuse does not eliminate catalogue rebuild cost. No Pi throughput claim.
- Placeholder files test enumeration and persistence, not successful decoding of valid real archives. Existing format fixture tests are separate. This does not confirm the owner's 8,300-file collection or canonical scanner performance equivalence.

## Runnable owner acceptance — disposable media only

1. Update the PR 83 Home Assistant repository to version `0.9.3-qa.20261018.1` using [installation instructions](HOME_ASSISTANT_QA_INSTALL.md). Keep a matching app/data backup; do not uninstall to switch branches.
2. Prepare a separate disposable folder containing known-valid CBZ, CBR, CBT and PDF comics, including mixed-case extensions and nested folders. Add one unsupported CB7 and a text file. Record actual file counts per extension before scanning. Do not use or modify household media.
3. Add the folder once. Confirm scanning starts automatically and finishes. Compare source **media files imported** against supported-file counts, rather than logical book totals. Check skipped files and symlinks separately. CB7 and bare RAR are unsupported. A single logical book may contain multiple files/editions.
4. Open Shelf/Library and read a comic/PDF without any bulk approval. Verify next/previous pages, saved position after restart, grid/list/sorting and cover display. Open a synthetic audiobook with chapters; test play/pause, seek, speed and chapter selection. Confirm Stats and Settings remain separate.
5. Use fixtures with trusted embedded genre/year and exact known identifiers. Confirm existing embedded values appear immediately, safe missing-field matches populate later, ambiguous comic issues remain unchanged, and locked/manual values survive a rescan. Disable automatic metadata and verify no new background lookups are initiated.
6. Compare first-scan/rescan counts and time. Record host CPU/RAM, peak memory, file count, logical work count, format breakdown and decoding errors. For larger enumeration-only reproduction on a Go development host: `ARCHIVIST_IMPORT_BENCHMARK=1 go test -run TestServerImportTenThousand -count=1 -v` (PowerShell: set `$env:ARCHIVIST_IMPORT_BENCHMARK='1'` first).
7. Give a family user only this test space; verify their Library, Atlas, reader and OPDS cannot access another test space. Restart and confirm access/progress persist. Run the existing [seven-gate procedures](SERVER_SEVEN_GATE_RELEASE_QA_2026-10-17.md) for disposable disconnect, restore and rollback tests.

Physical Pi4/HAOS, SMB/NFS, representative archive decoding, actual browser/accessibility and phone acceptance remain **BLOCKED**. The browser tool could not reach the local synthetic preview. Automated UI contracts are not visual or real-player acceptance. Commercial release remains NO-GO; this candidate is available for owner installation testing. No merge or production deployment.
