# Archivist Server — Atomic Catalogue & Grouped Audiobook Relink QA

**Date:** 17 October 2026  
**Source:** draft PR [#83](https://github.com/russellstokes-ai/Archivist/pull/83), branch `integration/archivist-v1-auto-restore-recovery-20261016`  
**Commits:** `01cba0472bbab19ffe970a24e496a7021dc5300f` (atomic catalogue); `3e86057177ae4e55ece37e8a3a55c57b7de391a6` (explicit grouped audiobook relink); `58761036697e4653c1b4e9c1cc43f7054433d40e` (Assist UI).  
**Decision:** QA source-integrated, commercial **NO-GO**, no hardware acceptance and no production add-on/Docker package published.

## A. Atomic scan catalogue

Historically `scanWithProgressJob` first committed `assets` availability and metadata, and only then ran `syncAutoCatalogueLocked` in a separate transaction. A work insert/update failure could leave files marked indexed with missing work links, stale book groupings, stale publication transitions and misleading source status.

Refactored `syncAutoCatalogueTx(tx,sourceID)` lets both manual work synchronization and the scanner use the same tested grouping logic. Scanner now performs asset upserts, work/edition grouping, publication invalidation and source status **inside one SQLite transaction**, committing only once. An error from any SQL statement rolls all of it back, and the server job reports failure.

**Fault-injection regression:** `TestScanGroupingFailureRollsBackEntireCatalogueTransaction` forces a work insert to abort after staging file changes. It asserts old asset signatures and availability, logical work and edition IDs, source status and unchanged file counts, then proves a clean subsequent scan succeeds. `TestScanReopenedPublicationEventFailureRetainsBookAndPlayback` aborts the review-reopened publication event and checks that the old published state, exact publication revision, prior edition/track count, and a household audiobook bookmark survive, then verifies retry correctly stages the book because the new track is unresolved.

The server scanner has NOT been replaced. The original mobile scanner, canonical mobile app and Living Book are outside this change.

## B. Multi-track folder relink contract

The earlier `/api/manage/relink/...` single-file operation remains unchanged in behaviour. The new separate owner-only grouped relink API supports an **entire automatic one-edition Audio work** after its original tracks become unavailable and its externally renamed folder is scanned as a separate untouched staged work.

| Endpoint | Request/response purpose |
| --- | --- |
| `GET /api/manage/relink-groups/works/{id}` | Inspect the original or replacement work with exact ordered chapter IDs, relative paths, indexed byte lengths and availability. |
| `POST /api/manage/relink-groups/preview` | Supply a complete array of `{"oldAssetId":ID,"candidateAssetId":ID}` pairs IN original chapter order; refuse missing, duplicate, swapped or partly available tracks. Verify all destination paths, fully SHA-256-hash all replacement bytes and return a 15-minute server-signed receipt with each original/target identity and digest. |
| `POST /api/manage/relink-groups/apply` | Supply the exact signed preview, `confirm:true`, and `attestation:"all-chapter-mappings-verified-by-owner"`. Revalidate state, hash all replacements again and run one SQLite transaction retaining all old work/edition/asset IDs and household progress, retiring only the untouched staged candidate and writing an audit row per chapter. |

Every operation requires authenticated owner privileges; mutations also require the usual action/CSRF header. Supports **2–32 audio tracks**, **≤4 GiB total replacement bytes**, equal per-track indexed lengths, identical source and exactly aligned chapter positions, one auto edition per work, and no independent target metadata, publication history, playback progress, reading progress, saved queue, covers, ratings, completion, activity or unfinished organisation journal.

This is owner-attested, not cryptographically established identity: **the old files are absent**, so no old/new byte comparison can be performed. SHA-256 protects replacement freshness/integrity between preview and apply, not their historical identity. Never automatically merge from similar filenames or matching sizes. Over-budget, out-of-order, manual/multi-edition, cross-root and partially missing books are refused rather than patched through.

## C. UI, CI and regression evidence

Library Manager / Archivist Assist displays work IDs, a **Reconnect audiobook** action for multi-file Audio works and a separate mobile-responsive dialog. The owner provides the old/replacement work IDs; the manager obtains real ordered track lists and requires individual tick boxes for **each** original/replacement chapter pairing. Only after all are confirmed does it enable complete-file SHA-256 preview. A separate final attestation and confirm Apply are mandatory. The fake-DOM manager test connects the real UI actions to owner APIs and asserts the full sequence; no generated placeholders or success claims before server reply.

- `server_scan_atomic_test.go`: both mid-catalogue work failure and publication event failure, complete rollback and successful retry.
- `relink_group_test.go`: real Go/SQLite filesystem fixtures for three files, distinct staged replacement group after external folder rename, correct chapter order, stable old IDs and two household progress positions, retained original metadata, published state and playback queue, full audit journal, rescan stability. Negative tests reject swapped/partial/duplicate maps, candidate independent progress, post-preview byte mutation, preview tampering/replay, omitted owner attestation, CSRF/household grants and a late SQLite-triggered failure with all original/candidate rows restored.
- `scripts/v1-manager-assist.test.cjs`: interactive mock DOM and live API request shapes; each chapter checkbox, hash preview, final attestation and actual server apply required.
- Both root and packaged `archivist/app/` Go sources are byte-mirrored, as are the manager web assets. Existing protected source-hash gates remain intact.

**CI at exact source checkpoints:**
- [Atomic scan full server checks](https://github.com/russellstokes-ai/Archivist/actions/runs/39032535089/job/117395740957): success.
- [Atomic scan ARM64 smoke](https://github.com/russellstokes-ai/Archivist/actions/runs/39032535089/job/117395740765): success.
- [Grouped backend server checks](https://github.com/russellstokes-ai/Archivist/actions/runs/39033036134/job/117397200992): success.
- [Grouped backend ARM64 smoke](https://github.com/russellstokes-ai/Archivist/actions/runs/39033036134/job/117397201392): success.
- [Manager UI integration server checks](https://github.com/russellstokes-ai/Archivist/actions/runs/39033248209/job/117397878203): success.
- [Manager UI integration ARM64 smoke](https://github.com/russellstokes-ai/Archivist/actions/runs/39033248209/job/117397878323): success.
- GitHub checks establish source/build/runtime-synthetic results, not a Pi installation or published add-on.

## Outstanding P0/P1 and field-acceptance

1. Real Pi 4 (4GB) and SSD: slow multi-gigabyte SHA-256 twice, parallel audio streaming, indexing large libraries, RAM, CPU and thermals.
2. Real Home Assistant ingress, supervised install/update/rollback, credentials, watchdog and source mappings.
3. Synology/QNAP/TrueNAS/Unraid SMB/NFS: offline mounts, permissions, partial reads, reconnect, symlink/rename races, partial writes and NAS timeouts.
4. Cross-source/drive moves, owner-manual groups, multi-edition collections, changed chapter order and >32 tracks: deliberately unsupported; require a separate specialist migration.
5. Full 10-screen premium server administration, real browser/responsive/accessibility acceptance and final release/versioned package.
6. Security/backup: role grants, HTTPS outside trusted LAN, actual interrupted restore, DB corruption migration and account revocation tests.

**No release or merge approval implied.** Keep PR #83 draft and protect canonical mobile source. Commercial status **NO-GO**.
