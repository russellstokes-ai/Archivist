# PR #52 / #53 — independent branch reconciliation and safety gates

**Date:** 16 October 2026. **Status:** verified read-only comparison; **NOT a merge or approval to deploy**. The user's installed APK source remains unverified. All user-approved UI/renderer/scanner/Assist/asset locks remain in force.

## Verified upstream state (GitHub as inspected 16 October)

| Lane | Exact head | Actual CI and limits |
|---|---|---|
| Canonical app | `df4c39b44394d8c512ca0298bffa7f19da356490` | Immutable approved reference, NOT the confirmed installed APK |
| Protected development baseline | `72bbf177aecc92f31724b48c6cf11a7eddd7a216` | Read-only comparison parent; 46 protected file hash locks |
| Shared PR #51 parent | `70921ca808940f65e6e409fedb74251c194297dd` | Documentation/ledger branch |
| [PR #52](https://github.com/russellstokes-ai/Archivist/pull/52) | `998278e86907df68b97d40d7caa3b9b3ca0794cd` | Open, draft, unmerged; [Mobile #38876993016](https://github.com/russellstokes-ai/Archivist/actions/runs/38876993016), [Server #38876992988](https://github.com/russellstokes-ai/Archivist/actions/runs/38876992988) and [iOS #38876992947](https://github.com/russellstokes-ai/Archivist/actions/runs/38876992947) all success |
| [PR #53](https://github.com/russellstokes-ai/Archivist/pull/53) | `b7234e3f9c884aff83bcf3e29bb690c865303979` | Open, draft, unmerged; [Mobile #38885442466](https://github.com/russellstokes-ai/Archivist/actions/runs/38885442466) and [iOS #38885442378](https://github.com/russellstokes-ai/Archivist/actions/runs/38885442378) success; no Server workflow in returned runs |
| [PR #54](https://github.com/russellstokes-ai/Archivist/pull/54) | branch `fix/archivist-offline-zero-byte-guard-20261016` from PR #53 | Isolated #31 empty-file contract; acceptance/CI must use its final actual head |

GitHub compare confirmed **merge base #51**, #52 **13 commits ahead**, #53 **6 commits ahead** relative to each other (diverged); neither includes the other's changes. Against the protected baseline, the net file lists of both PR heads exclude all 46 SHA-locked paths, scanners, Assist, locked App.tsx, mobile archiveReader, Living Book/Comic Focus/Atlas/Rewards source and icons/Lotties. Their original development-ledger CI also validates protected blob hashes. Net-diff/CI does not prove physical-device behaviour.

## Exact non-overlapping source changes to preserve later

- **PR #52:** `covers.go`, `archivist/app/covers.go`, matching `cover_candidate_fallback_test.go` mirrors; 13-case Astra review document; enhanced ledger/hash tests and documentation. ZIP, EPUB, CBT/TAR, CBR cover candidate fallback is now bounded; real RAR, WebP dimension, CPU/memory and NAS/Pi field acceptance still outstanding.
- **PR #53:** `mobile/progressReconciliation.ts` and `mobile/progress-reconciliation.test.cjs` reject duplicate remote progress identities before replay; independent 10-item robustness queue plus logs/status. Reconciliation itself is *not* wired into protected playback.
- **Shared conflict:** both independently edit `docs/v1/DEVELOPMENT_LOG.md`, `DEVELOPMENT_STATUS.md`, `DEVELOPMENT_STATUS.json`. Both review queues are source evidence, not alternatives. A future approved integration must carry forward both queues and append-only log history, never take the later document wholesale.

## P0 — offline checkpoint data loss: confirmed path, no fix authorised on this branch

**Code:** `mobile/offlineLibrary.ts` around lines 211–333 (same on PR #51/#53). `compatibleCheckpoint` checks version, server, key and work ID but not original track content identity. After bypassing no-checkpoint preflight, the pre-loop cleanup deletes an existing mismatched-size file if it is not the current resumable target. Later preparation can also delete the target before creating a new download. On an HTTP/network error or disk-full failure, the old bytes are gone. A valid resume token does not prove an existing local file is merely disposable partial data.

**Reproducer for Astra — must be RED before implementation:** create work 61, first existing track at derived `001-...` URI containing unique sentinel bytes but with length different from current server metadata, compatible saved checkpoint for that work with no valid resume token, fail the replacement HTTP request before it writes. Assert original sentinel bytes still exist after rejection, no offline record changed, checkpoint survives, unrelated chapters preserved. Add multi-chapter, zero/unknown server size, mismatch followed by network interruption, stale token, insufficient disk, mid-rename crash, restart and explicit user cancellation. Include the `removeOfflineCheckpoint` current-track deletion path in the authority audit.

**Required solution properties:** download to *new, work-scoped staging pathname*; validate nonempty body, expected length and cryptographic digest where provided; fsync/atomic replace as supported by the Android filesystem or retain versioned rollback; only update durable manifest/checkpoint once replacement is demonstrably safe; never trust arbitrary persisted URIs as deletion authority. Handle pause/resume, duplicate requests for the same work, disk reserve and process death. A simple `deleteAsync` suppression or throw-then-manual-remove is not a complete commercial recovery design; send to Astra for independent contract and rollback proof before touching the destructive path.

## P1 — paginated server progress is not a consistent snapshot

**Code:** `sync_progress.go` around lines 35–94, mirrored in `archivist/app/sync_progress.go`; separate `SELECT ... ORDER BY kind,id LIMIT ? OFFSET ?` requests.

**Reproducer:** fetch page of two records with `hasMore=true,nextOffset=2`; delete a preceding authorised record (or revoke a grant) between requests; the next `OFFSET 2` can omit an unchanged later record. Response can be well formed with `hasMore=false`; client detects neither a gap nor a duplicate. Concurrent insertions before offset may instead produce duplicates, which client #53 rejects; this does not solve silent omissions.

**Acceptance:** transactionally consistent profile-authorised snapshot, or a revisioned/keyset cursor with explicit invalidation/retry, bounded resources and permission-revocation semantics. Verify two clients, insert/delete/update, profile switches, restart, conflict 409 and outbox retention. Do not infer absence from an inconsistent snapshot. This remains an Astra architectural decision, not a guessed SQL patch.

## Independent PR #52 tests to extend before integration

1. ZIP/EPUB real covers, corrupt-first and named-cover priority; malformed archive, duplicate filenames, 64-attempt limit and 10,000-entry bound.
2. Representative RAR4/RAR5 comics with invalid-first/valid-next entries; absence of native RAR decoders must fail safely.
3. WebP declared width/height attacks, image decoded/declared bounds and memory on 4GB Pi; do not confuse compressed byte limit with raster limits.
4. Root and packaged Go parity; Docker/NAS/HA under restart and slow storage. Server cover recovery does **not** resolve Android issue #16.

## Approval-gated integration sequence — NOT actioned

1. Independently approve a specific combined candidate (not an unqualified merge). Start from verified #51 head or an approved equivalent; cherry-pick/reapply only non-overlapping source/test changes with exact diffs, keeping PR #52 and PR #53 available unchanged for rollback.
2. Manually reconcile both review queues and status/log histories, preserving original failed/green CI events. The isolated PR #54 fix can be considered separately, after its own tests and source locks pass.
3. Run all Go AMD64 + ARM64/server, Mobile, iOS, source-immutability and security tests on the *combined exact head*. Never reuse sibling CI runs to certify the integrated tree.
4. Test offline cancellation/recovery, progress pagination/adversarial concurrency, real comics/covers, PDF switching and actual Fold/NAS/Pi scenarios before marking any feature device-accepted.
5. No canonical branch changes, merging, signed APK/AAB, installation, publication or user data migrations without explicit user approval.

**Scope of this document:** review plan and reproducible quality gates. The eight user bugs remain #16, #19, #25, #23, #17, #20, #31 and #32 only; #15 scanner remains excluded.
