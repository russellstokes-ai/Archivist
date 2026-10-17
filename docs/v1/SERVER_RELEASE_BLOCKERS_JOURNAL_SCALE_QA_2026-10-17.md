# Archivist Server — Release-blocker hardening: journal safety and large-library organiser

**Date:** 17 October 2026  
**Draft:** [PR #83](https://github.com/russellstokes-ai/Archivist/pull/83), branch `integration/archivist-v1-auto-restore-recovery-20261016`  
**Parent:** `a56a7b1c547a5c8c2c9219d6c4662b329a4303c5`.  
**Decision:** Code `d4020db` passed exact-source server/ARM64 CI; overall commercial release **NO-GO** pending real Pi4/NAS/HA ingress/large-library and power-loss acceptance.

## Why this matters

Two existing defects have direct data-integrity and large-library implications. This is a focused corrective release-blocker pass, not a new feature or UI redesign.

### 1. Existing file-move preview could disappear after a failed replacement

The pre-existing single-file preview route cancelled the last **valid preview journal entry** and then inserted its proposed replacement in two separate SQLite operations. If the insert failed (disk, SQLite trigger, unexpected interruption), the previous approved preview was already cancelled with no replacement.

**Change:** preview replacement is now a single SQLite transaction: after the source file is validated, hashed and a new ID created, cancelling the old preview and inserting the new one must both commit or both roll back. The batch-template path no longer eagerly cancels pre-existing previews before it knows whether a file is reviewed, supported, destination-safe, collision-free and eligible for staging.

**Tests:** synthetic real file and SQLite fixture; inject a **BEFORE INSERT RAISE(ABORT)** after a valid prior preview exists, verify the previous record stays `preview` and the original bytes remain untouched. Retry successfully to verify old becomes cancelled and the new one is journaled. Another regression opens metadata review after the original preview, then verifies the invalid template batch cannot revoke the older journal entry.

### 2. The original Settings file organiser silently truncated the library at 500 files

The legacy `web/filemoves.js` manager called `GET /api/books` without paging. That API limits responses to **500 files**, so a library of 503 or 20,000 media assets would appear to contain just the first 500 in the “All loaded files” organisation control. Operators could wrongly believe a full-library review had been completed.

**Change:** the legacy organiser explicitly requests sorted catalogue pages (maximum 200 files per request) until it has established that **at most 500 total assets exist**, or reads the 501st item proving the list is incomplete. When more than 500 exist, bulk preview is explicitly **disabled** with a visible warning and link to the already built 16:9 manager’s **Organise & relink**, which handles indexed files in paginated, 100-asset chunks. A page read/parse/network failure also disables legacy mass preview instead of silently keeping a partial list. For small complete libraries, existing preview/apply functionality continues.

**Tests:** a new Node.js fake-DOM regression invokes the actual legacy UI code against synthetic catalogue pages of **503**, **300** and **0** items. It checks no batch-preview request can occur for the 503-item partial list, 300 files are fetched and previewed in three explicit 100-item chunks, and an empty library cannot generate a move preview. New script runs in server CI, not just as an untracked ad hoc test.

### 3. Move collision checks must remain fast with long journal history

Each new preview checks active and pending move destinations. The old SQL could scan a large `file_moves` table, including thousands of historical completed moves.

**Change:** compatible, idempotent SQLite indexes are created for live-move destination collisions and per-asset preview lookups, **without deleting or migrating away history**. A synthetic SQLite test inserts **4,000 historical completed moves**, verifies the active conflict is still found with case-insensitive path matching, confirms `EXPLAIN QUERY PLAN` actually uses the partial live-destination index, and checks older completed moves remain intact across repeated startup initialization.

## Preservation rules

The existing scanner, automatic logical-work grouping, metadata/provenance, published flags, household reading/listening progress, canonical mobile assets/reader, Android Auto, Atlas and approved 16:9 appearance remain unchanged. No experimental modification of real user data, no forced push, main merge, production Docker/HA deployment or APK compilation.

## Validation

Mirrored root and `archivist/app/` production changes: `filemoves.go` and `web/filemoves.js`, plus mirrored Go regressions `filemoves_preview_replacement_test.go` and `filemoves_large_journal_index_test.go`. New Node `scripts/v1-legacy-organise-coverage.test.cjs` is registered in `.github/workflows/server-check.yml`. Exact-source server CI must run all root+package Go, Node UI/legacy coverage, standalone Docker/HA and ARM64 smoke, alongside mobile source-lock checks. CI is **not** evidence of real 1000+ media NAS timeouts, power cuts or owner device acceptance.

**Remaining highest-priority gate after source CI:** physical/disposable Pi4 4GB SSD + NAS/SMB/NFS mount-loss, long-scan cancellation and power-failure/SQLite restore, plus real 1920×1080 owner browser/screen reader tests. Product remains **NO-GO** until those tests are performed.

## Verified CI result

The exact code revision `d4020db46c330d28db674315baeb8ef0171f5af0` passed [full server integration](https://github.com/russellstokes-ai/Archivist/actions/runs/39057876438/job/117469502872) (root+packaged Go tests, legacy organiser Node behavior, manager contracts, standalone Docker and Home Assistant smoke) and [hosted native ARM64](https://github.com/russellstokes-ai/Archivist/actions/runs/39057876438/job/117469502678). Parallel mobile/Android/iOS checks were still pending at this documentation checkpoint. The result proves source behavior in synthetic/harness conditions only, not the user's physical Raspberry Pi, NAS, connected personal library or actual disaster recovery.
