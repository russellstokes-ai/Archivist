# Archivist Server — safe running-scan cancellation QA, 17 October 2026

**PR:** #83 (draft, not merged)  
**Branch:** `integration/archivist-v1-auto-restore-recovery-20261016`  
**Previous source checkpoint:** `7733c75f198cdde164f544a9fec226fe812b5e52`  
**Feature commit:** `49cf1e3cf718d77f78b7c1c2be4436f51fda83e7`  
**Verified source checkpoint:** `cad76e8db1c0d10954e4d84e07e232cd9d727435`  
**Decision:** commercial **NO-GO**, source tested in CI; Pi4/HAOS/NAS acceptance pending.

## Cancellation model

`POST /api/jobs/{id}/cancel` is owner-only, CSRF-protected and returns:

| State on arrival | Response | Meaning |
|---|---|---|
| queued | HTTP 200, `cancelled` | Worker never claimed this job. No catalogue changes. |
| running, stop not previously requested | HTTP 202, `cancelling` | Durable request recorded. The worker has not yet promised termination. |
| running, stop already requested | HTTP 202, `cancelling` | Idempotent acknowledgment of an outstanding request. |
| committing | HTTP 409 | Commit barrier already won; cannot safely stop. |
| complete/failed | HTTP 409 | No active job remains to cancel; retry failed job separately. |
| cancelled | HTTP 200 | Idempotent final acknowledgment. |

The authenticated owner `GET /api/jobs` shows `cancelling` for a running job with `cancel_requested=1`. It exposes `canCancel` and `canRetry` honestly, and both owner interfaces use these capabilities. Queued Cancel remains backward compatible with the pre-extension response format.

## Transaction safety and restart

The server's existing scanner writes temporary JSONL staging data before any catalogue SQL. A worker job polls cancellation/context while counting and staging the path, plus at a forced checkpoint just before SQL. On an accepted stop, it closes/deletes the temporary file, returns `errScanCancelled`, and worker records `cancelled`: no partial asset reindexing or work/publication/progress mutation.

The `running → committing` transition and owner `cancel_requested=1` transition are conditional UPDATEs on the same SQLite job record. This creates an atomic race winner: either the pending stop is accepted before commit or the scan advances to the no-stop boundary. Worker finalizes complete/failed/cancelled after scan returns. If the process dies with a pending request, startup records cancelled. A crashed `committing` or `running` job without stop request is requeued, with the existing safe upsert and partial unique source index preventing duplicate active jobs. Job progress and messages are reset on interrupted retry.

The scanner still holds its source scan mutex during staging/commit; relink, file-organisation and manual metadata operations are serialized against that scan. The temporary JSONL stage and user media are never published from an aborted pre-commit scan.

## Added Go regression scenarios

- Running stop request is HTTP 202, idempotent and not falsely shown as already cancelled.
- Old catalogue has one indexed book; a running scan stages sixty more media files, stop requested after the tenth staged entry, then cancellation returns `errScanCancelled`. Book/asset identity and physical original remain unchanged.
- A stop request from the last staging progress callback still aborts before SQL.
- A scan with state `committing` rejects late cancellation (HTTP 409), does not set the flag and prevents a duplicate queued job.
- Restart of a canceled running job and an interrupted committing job yields distinct `cancelled` and `queued` states; subsequent startup and enqueue remain idempotent.
- Existing queued cancel/retry behaviour, 24-way concurrent deduplication, legacy schema migration and automated background scan completion remain covered in earlier tests.
- Source protection, root-vs-`archivist/app/` Go parity, actual manager JS interaction contracts, standalone Docker persistence, packaged Home Assistant health and native ARM64 build are mandatory.

## Verification

- [Root/packaged server and Docker/HA checks — success](https://github.com/russellstokes-ai/Archivist/actions/runs/39031960719/job/117394060348) at exact `cad76e8...` source. First source candidate `49cf1e3` failed **only** because a manager mock with legacy queued-job format omitted `canCancel`; the correction in `cad76e8` restored legacy queued cancellation without weakening the running state gate.
- [Native Linux ARM64 smoke — success](https://github.com/russellstokes-ai/Archivist/actions/runs/39031960719/job/117394060052) at exact `cad76e8...`.

## Limitations and remaining blockers

1. This is **cooperative** cancellation. An individual metadata read, an OS directory traversal blocked on NFS/SMB, or a kernel I/O hang may postpone stop until the next checkpoint. The process does not forcibly interrupt arbitrary OS I/O.
2. After the `committing` marker, the scanner deliberately refuses cancellation even if its SQL reindexing takes time. A real failure may leave partial *post-scan catalogue grouping* state only if the existing separate grouping operation itself fails, which remains a future transactionality audit. Do not claim an arbitrary scanner crash can never occur.
3. Stop checkpoint validation runs on the server's local SQLite connection; physically disconnected Pi4 SSD, depleted disk, filesystem corruption, and multi-container installations are not accepted by synthetic CI.
4. Real Raspberry Pi 4 (4GB), Home Assistant ingress, mounted SMB/NFS, 10k+ files, concurrent streams, backup/restore/migrations and NAS recovery tests remain pending.
5. No protected mobile scanner/App/Assist/Living Book source was altered by this server task, and no APK/AAB or production server package was released.
