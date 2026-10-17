# Archivist Server — single-file external rename relink acceptance record

**Date:** 2026-10-17  
**Draft:** PR #83, `integration/archivist-v1-auto-restore-recovery-20261016`  
**Starting verified integration head:** `94f9020780dee26210b2e2abea39a3805459a430`  
**Most recent verified relink source:** `71b1818304b6ae0a9a7af6f5733f3dbc1a3ddcb3`  
**Earlier intermediate commits:** `e00a881c17e9e8f813889a24f9925545162230c2`, `de768fd3377c552eb46bf6d403c6903cf6c257e6`  
**Decision:** commercial **NO-GO**. Source/CI verified only; no physical Pi, HA ingress or NAS acceptance and no final package generated.

## Implemented server-only slice

The existing scanner conservatively retains inaccessible original assets and their work IDs, edition IDs, published state and progress. If a user renames the physical file outside Archivist, a normal scan adds a separate staged candidate; it does not guess the old and new files are equivalent.

Owners may now select exactly two rows in Library Manager: unavailable original and available candidate, with the same format and source. The new owner-only relink API checks immutable book identities, source restrictions, same indexed file byte length, single edition/file scope, absence of old path and exact available replacement; it refuses another work's standalone metadata/progress, selected cover, family queue, publication state/history, organisation previews and interactions. It fully SHA-256-hashes the candidate during a signed, short-lived preview, then hashes it again on application.

The owner must independently verify these are the **same file** and affirm this with a separate checkbox and explicit confirmation. Once accepted, a single SQLite transaction retires the untouched staged candidate, rekeys the prior automatic grouping if necessary, and preserves the original asset ID, edition ID, logical-work ID, manual metadata and per-profile progress. The operation records an `asset_relink_events` row for audit. The actual on-disk file is never modified, renamed or removed. Copy/rename/move permissions are not requested by this endpoint.

**This is OWNER-ATTESTED equivalence, not cryptographically proven old/new identity.** The old bytes are unavailable; old-to-new equivalence cannot be established from a hash of the new file. The SHA-256 verifies only that the new file did not change after preview, with a consistent full read and final path-stat checks.

## API and safety contract

```text
POST /api/manage/relink/preview
{"oldAssetId":<positive asset ID>,"candidateAssetId":<distinct positive asset ID>}
=> 200: old, candidate, SHA-256, expiration, signed receipt, explicit risk notice

POST /api/manage/relink/apply
{"preview":<exact preview JSON>,"confirm":true,"attestation":"same-file-verified-by-owner"}
=> 200: original work/edition/asset IDs, accepted verification classification
```

Both endpoints need authenticated owner access and the existing `X-Archivist-Action: 1` action header. The preview receipt is HMAC-signed with the instance's in-memory process key and expires in 15 minutes; server restart invalidates pending previews. Every apply revalidates against current database identities, independent candidate state, original disappearance and a complete second content hash. Rollback on any SQLite write error retains both original/candidate catalogue records.

## Source CI at exact checkpoint

- [Server check success](https://github.com/russellstokes-ai/Archivist/actions/runs/39030809088/job/117390703932) — exact `71b1818304b6ae0a9a7af6f5733f3dbc1a3ddcb3`, root Go suite, packaged Go suite, HTML/JS contract and dynamic manager fake-DOM, HA packaging, Docker/Compose and smoke workflow.
- [ARM64 smoke success](https://github.com/russellstokes-ai/Archivist/actions/runs/39030809088/job/117390703691) — native ARM64 CI runner, not a real Raspberry Pi.
- [Mobile preservation check success](https://github.com/russellstokes-ai/Archivist/actions/runs/39030812868/job/117390713730) — no mobile source change in the relink slice; mobile testing belongs to a different stream.

## Executed regression matrix from source

- Manual metadata, old work/edition/asset IDs and multi-profile audio progress persist after relink, subsequent scan and a database reopen.
- Published original stays published; only untouched staged replacement is retired; original media bytes remain unchanged.
- Changed destination bytes between preview/apply (including unchanged file size), changed preview JSON, missing attestation, expiring/replayed preview and late reappearance of original are refused.
- Candidate activity/state isolation: standalone progress, manual metadata, publication, household playback queue and existing organiser previews block relink rather than cascade-delete user data.
- Path safety: direct symlink substitution and unsafe source roots fail instead of following files outside the mounted library.
- Transaction fault injection: a SQLite trigger abort during old-record update leaves both old and candidate database paths intact, with no false audit record.
- Manager test: selection → actual preview endpoint → both original/candidate detail cards and risk warning → owner checkbox → actual apply endpoint → clear stale selection.
- Original scanner retained as-is; no automatic speculative matching or destructive physical file action.

## Explicit unresolved risks and next acceptance milestones

1. Only a single original asset, edition and replacement in one library/source is supported; multipart audiobooks, grouped editions and cross-source or cross-volume transfers need a distinct reconciler with track mapping, not a loose extension of this endpoint.
2. No prior original content digest is available for historical assets. Trusted owner identification is mandatory; do not market this as automatic or cryptographically verified rename detection. A future opt-in pre-move hash index can improve confidence, but it must have a strict Pi 4 I/O budget.
3. A complete replacement content hash costs sequential I/O, especially for multi-gigabyte M4B files. Benchmark on Pi 4 with actual SSD/NAS and concurrent streaming; bounded memory in source alone does not prove acceptable latency.
4. Cross-process filesystem mutation cannot be globally locked by an application SQL mutex; avoid external moves during relink and validate with real SMB/NFS behavior.
5. Home Assistant ingress browser widths, direct Docker HTTPS/API, NAS access controls, restore/upgrade migrations and real source error/permission behavior remain unaccepted.
6. No server version bump or installable public/release artifact, and PR #83 remains draft. Do not merge into protected canonical/main without owner approval.
