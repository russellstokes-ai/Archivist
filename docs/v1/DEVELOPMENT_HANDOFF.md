# Archivist Server — development handoff

Updated **20 October 2026**. Start here when continuing in another chat. This is a tested QA candidate, **not a completed commercial release**.

## Repository, branch and build

- Repository: [russellstokes-ai/Archivist](https://github.com/russellstokes-ai/Archivist).
- Continue [draft PR #83](https://github.com/russellstokes-ai/Archivist/pull/83), branch `integration/archivist-v1-auto-restore-recovery-20261016`.
- Installable Home Assistant version: **0.9.3-qa.20261020.1**, description dated **20 October 2026**.
- Exact tested executable commit: **29a68642528bba1b87f0005002413c2077695f05**.
- Last observed branch head before this handoff: **bc7f3c75989ee694300ce1f471cbfd5ed4026abc**. Later commits up to that point only update documentation. This handoff itself creates a newer docs-only commit.
- **Verify the current remote head before editing; preserve all later commits.** The older 577f3b5 and 1755831 commits are historical baselines, not the development starting point.
- GitHub is authoritative. The previous local checkout has independently created commits and connector-pushed commits; do not assume its local HEAD equals the remote HEAD or force-push it.

Same Home Assistant custom repository as the previous version:

```text
https://github.com/russellstokes-ai/Archivist#integration/archivist-v1-auto-restore-recovery-20261016
```

Refresh the existing repository and update **Archivist QA (PR 83)**. The branch's 20261016 name deliberately remains unchanged. Supervisor builds locally from the repository; there is no prebuilt registry image. Back up first, rescan each source once after upgrading, then open Library and test reading/listening. [Install guide](HOME_ASSISTANT_QA_INSTALL.md).

## What the user wants

A useful private server for books, comics and audiobooks, with the mobile app's familiar Shelf, Library, Atlas, Player, Stats and Settings experience. Simplify heavyweight effects for a small Raspberry Pi, but retain reading and playback. Family access, grid/list sorting and reliable onboarding matter. Genre and year matter particularly for Atlas.

The priority is getting a large existing library into a usable state with minimal manual review. Missing optional metadata must not block reading. Most users will not have sidecar JSON; do not make JSON a prerequisite or spend disproportionate effort on it.

Keep usage and process overhead low. Make substantive improvements, batch checks, avoid repeated planning/approval loops and avoid unnecessary builds. The user permits useful features, but wants an installable result. No Kobo/read-along expansion is requested.

## Implemented in this candidate

- Three-step first-import guidance: choose folders, find books, open Library. Thousands of optional metadata gaps no longer make bulk review the primary completion action. Existing books remain accessible during another scan or failed refresh.
- All six main navigation icons retained, alongside existing family access, simple cover/player, reader, grid/list and sorting.
- More useful dotted/bracketed comic names, series and issue inference, bracketed year extraction. Fractional issues preserved; annual/special/volume qualifiers retained so they cannot silently become ordinary issues. Inferred filename fields remain path evidence, not verified provider facts.
- Case-insensitive ComicInfo filename recognition; invalid optional XML years no longer discard other valid fields. ComicBookLover metadata in ZIP comments; case-insensitive JSON keys and string arrays. Volume is no longer treated as an issue number.
- Valid comic ZIPs with the reported malformed `]cbz` suffix can be recovered without renaming files. Generic ZIP packs containing books are distinguished from page comics; no automatic extraction into the user's library.
- Discovery report reasons distinguish supporting metadata, images/covers, unsupported reader formats, archive packs and other files. Report schema 2 adds series, issue, year and review reason on bounded samples.
- Optional Metron token connection in Settings, under library folders / **Improve comic details**. Exact unique series/issue results can fill missing genre and issue year. Ambiguous matches are not applied. No automatic credits, attributed descriptions or cover downloads from this adapter.
- Metron requests have body/time limits, no redirects, durable pacing and failure pause. Owner-only token storage/readiness endpoints never echo the token or export it in the scan report. The private database and backups contain the saved token. Saving a token does not prove the credentials work; live authenticated acceptance remains outstanding.
- Unchanged rescans skip catalogue rewrites only when files are unchanged, available and linked, while retaining the ambiguous multi-edition safeguard. Changed/disconnected-source scans retain the atomic staging/commit path and original-file protection.

## Verified evidence

- [Server checks — SUCCESS](https://github.com/russellstokes-ai/Archivist/actions/runs/39458881433).
- [QA packaging — SUCCESS](https://github.com/russellstokes-ai/Archivist/actions/runs/39458885802).
- [Linux binaries and Home Assistant repository ZIP](https://github.com/russellstokes-ai/Archivist/actions/runs/39458885802/artifacts/12280354655), expires **27 October 2026**.
- Artifact SHA256: `7562af1fc153f4c30f24bb6091122d37f136e575ad5923e520073f586da9f97e`.
- Root and packaged Go suites, UI/manager contracts, protected-source/parity gates, native ARM64 runtime, Docker and Home Assistant smoke passed on the executable SHA above.
- Hosted synthetic 10,020-file test: initial import **11.74 seconds**, unchanged rescan **0.435 seconds**, all files retained. Allocated bytes: 157,462,928 and 54,746,144; **not peak memory**. The scale fixtures include placeholders and do not establish real archive decoding throughput.
- Real synthetic PNG-in-ZIP reading regression also passed. Independent review caught fractional-issue and bracketed-qualifier mistakes; both were reproduced and fixed.
- The first Linux candidate exposed a skipped multi-edition safeguard in the fast path. It was fixed before the final successful checks. Do not regress this protection.

**BLOCKED / not proven:** physical Pi4/HAOS, NAS SMB/NFS faults, the user's representative media, actual browser/phone/accessibility acceptance and live authenticated Metron matching. Hosted smoke tests are not physical acceptance. No merge or production deployment was performed.

## User evidence that motivated this work

The supplied pre-update report showed 5,143 logical books. One source encountered **8,302 files = 4,927 imported + 3,375 skipped**. Of the skipped files, 3,287 were JSON/images; therefore “8,300 files” was not proof of 8,300 missed comics. There was also a malformed `]cbz` filename and a TAR pack requiring inspection, not guessed classification.

The second source indexed 1,982 files, largely audiobook tracks grouped into far fewer works. Do not compare file counts directly with book counts.

Metadata coverage was poor, particularly comic genre/year, and most automatic enrichment was still waiting. **No post-update report from the user's installed server has yet been reviewed.** Do not claim the actual library is now completely identified.

## Next work, in priority order

1. **Validate the owner's installed result first.** Confirm version, complete one source rescan, obtain the new scan report, compare counts/reasons and inspect representative failed titles. Test an ordinary CBR, CBZ, PDF and audiobook. Do not start another speculative rewrite before seeing whether this candidate fixed the observed cases.
2. **Improve real identification and enrichment outcomes.** Measure matched/unresolved/provider-failure counts and genre/year coverage. Test Metron with owner-configured credentials outside chat; never ask for secrets pasted into conversation. Existing embedded metadata and no-key import must remain useful.
3. **Make remaining review manageable.** A grouped series-choice editor, durable series-level cache and broader per-field provenance are still needed. Do not substitute thousands of individual approvals or automatically merge editions/duplicates.
4. **Expand formats only with end-to-end evidence.** Evaluate real missing formats against both scanner and reader; distinguish “recognised” from “readable.” Keep archive inspection and extraction bounded. Do not label all archives readable based on their extensions.
5. **Complete physical acceptance and resilience checks** using the seven-gate register, then decide commercial readiness from evidence.

Explicitly unfinished: CB7 decoding, loose-image-folder reading, MOBI reading, arbitrary archive-pack extraction, PDF metadata extraction, MetronInfo XML, cover-image matching, Comic Vine/MusicBrainz adapters, persistent series caches and grouped series-choice editing. The broader approved plan is **not all implemented**. Comic ZIPs are inspected selectively; CBZ/CBR/CBT are not exhaustively decoded during discovery. No automatic duplicate merge is implemented.

MusicBrainz is a potential audio source, not a general comic authority. Metron/Comic Vine require provider credentials; do not promise universal zero-configuration online metadata. Do not invent year/genre merely to improve coverage statistics.

## Code and regression-test map

| Area | Files |
| --- | --- |
| Atomic scanner and unchanged fast path | `main.go`, `catalogue.go`, `server_scan_cancel.go` |
| Discovery accounting/classification | `discovery.go`, `scan_report.go` |
| Local metadata and comic filenames | `metadata.go`, `comic_filename.go`, `comic_identity.go` |
| Background enrichment and provider | `automatic_metadata.go`, `comic_provider.go` |
| Onboarding and browsing | `web/onboarding.js`, `web/app.js`, `web/experience.js`, `web/manage.js` |
| New regressions | `server_library_onboarding_test.go`, `comic_provider_test.go` |
| Must-retain scan protections | `server_partial_audio_mount_test.go`, `server_scan_atomic_test.go`, `server_mount_loss_rescan_test.go` |
| Scale check | `server_import_test.go` with `ARCHIVIST_IMPORT_BENCHMARK=1` |
| UI checks | `scripts/ui-contract.cjs`, `scripts/v1-manager-contract.test.cjs`, selection/race tests |
| Protected-source gate | `scripts/v1-protection-gate.cjs` |

Root server sources and **archivist/app** must remain byte-for-byte equivalent for mirrored files. Preserve canonical mobile/scanner/reader and the approved protection manifest. Server work does not require developing Android/iOS features.

On Linux run `go test ./...` in root and `archivist/app`, the UI/manager/protection checks, and appropriate packaging checks before the final candidate. Local Windows tests involving Linux path strings, hardlinks or simulated mount renames were not a replacement for the full Linux suite. Keep tests on disposable synthetic media; never move or modify the owner's live collection.

For subsequent installable candidates, update `archivist/config.yaml`, the QA packaging version default, README, add-on README/DOCS/CHANGELOG and release evidence together. Verify the remote SHA before a leased push; preserve later commits. Record exact executable SHA separately from docs-only follow-ups. Avoid rebuilding for docs-only corrections.

## Documentation entry points

- [Current QA evidence and limitations](SERVER_LIBRARY_ONBOARDING_QA_2026-10-20.md)
- [Home Assistant installation/update/rollback](HOME_ASSISTANT_QA_INSTALL.md)
- [Development status](DEVELOPMENT_STATUS.md) and [machine-readable status](DEVELOPMENT_STATUS.json)
- [Append-only development log](DEVELOPMENT_LOG.md)
- [Seven release gates](SERVER_SEVEN_GATE_RELEASE_QA_2026-10-17.md)
- [Commercial gate register](COMMERCIAL_GATE_REGISTER_2026-10-16.json)
- [Original master development plan](../ARCHIVIST_V1_MASTER_DEVELOPMENT_PLAN_2026-10-12.md)
- [Metadata ecosystem findings](METADATA_ECOSYSTEM_FINDINGS_2026-10-18.md)
- [Implementation record](../superpowers/plans/2026-10-20-library-onboarding.md)

Older dated entries are history; they do not override the current build evidence above. Recheck remote state and owner test results when resuming.
