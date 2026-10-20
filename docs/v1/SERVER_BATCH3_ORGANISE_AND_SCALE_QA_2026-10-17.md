# Archivist Server — Batch 3: Unified safe organiser and bounded large-library operations

**Date:** 17 October 2026  
**Draft PR:** [#83](https://github.com/russellstokes-ai/Archivist/pull/83)  
**Starting verified head:** `9f636083cd22a0dc64f2c6531acbc01462596691`  
**Scope:** server-only S7 organisation, without modifying canonical mobile/reader/Atlas/scanner or existing physical media. **Commercial release NO-GO.**

## Commercial-priority work completed in this batch

**One 16:9 owner manager for S7 Organise:** The existing organiser no longer needs a separate screen for routine verified file moves. Owners can page through indexed files (40 per request, deterministic order), filter by title/creator/series, library space and media format, and select up to 100 specific, available files across pages. An on-screen counter separates selected files from total work/book counts and does not invent a full-library total. There is also an explicit single-asset relative-path preview for advanced moves.

**Existing safe move engine only:** Templates are `author-title`, `author-series-title`, `format-author-title`, and `format-author-series-title`. The manager sends exactly the chosen asset IDs to the existing hashed, journaled backend `/api/file-moves/preview-template-batch`, not a new file-move implementation. Preview results display the exact source/destination path, including unavailable, review-required, conflict, and unchanged statuses. **No preview is selected for Apply by default**: owners must tick each Ready entry or explicitly click Select all Ready, then separately confirm Apply. Partial server success is reported with failure details and a reminder to inspect the actual journal, not labelled as an all-or-nothing success.

**Persistent recovery and undo:** Recent move-journal records are browsable in 40-entry pages, including pending previews and interrupted `applying`/`linked` states. Preview cancellation uses the original server route. A completed move's **Preview verified undo** requests a fresh reverse hashed preview, presents both exact paths in an explicit confirmation, and applies that reverse journal entry only on approval. An uncertain network outcome never encourages blind re-Apply. A pending reverse preview remains in the journal if approval is declined. Original file bytes are not modified by viewing or previewing.

## Important production robustness correction

The previously available Go batch helper silently enumerated and previewed up to **500 available assets when the caller passed an empty list**. That is dangerous on large libraries and low-power NAS/Raspberry Pi: it creates unexpected persistent previews and costly file hashes.

The engine now requires **1–100 distinct positive asset IDs** per template batch. A missing, duplicate, invalid or oversized selection fails before media/hash/disk access. Apply-batch independently requires **1–100 unique 32-character lowercase hex server-issued move IDs**. Both HTTP handlers strictly decode only one known-fields JSON object, reject invalid requests with 400, and leave original media/indexes unchanged. The full backend path and file-move crash/recovery protocols otherwise remain unchanged. Legacy browser organiser continues to send explicitly selected 100-file chunks and is not removed.

## Regression acceptance

- New mirrored Go source/test changes: `filemoves.go` plus `server_organise_batch_bounds_test.go`, mirrored byte-identically under `archivist/app/`.
- New mirrored owner UI: `web/manage.html`, `web/manage.css` and `web/manage.js`, using the existing Archivist palette, accessible controls and paged on-demand data; no new backend file-move code.
- Existing deterministic fake-DOM manager test extends to S7: opening page triggers no preview; offline originals cannot be selected; owner-selected batch preview is independent of Apply; approving exact Ready entries is necessary; explicit Apply updates journal; verified reverse preview precedes undo; separate manual preview and cancellation work; no previous state is silently replayed.
- New actual Go/SQLite+filesystem integration tests: empty/duplicate/oversized batch requests refuse without staging media; malformed IDs, unknown JSON fields and missing action/auth gates refuse; valid single-file preview changes no bytes, confirmed Apply changes only the indexed relative path while preserving stable work/edition/asset IDs, and confirmed undo restores the original relative path and exact bytes.
- Existing source parity, large media, crash recovery, security, scanner and protected mobile checks remain mandatory.

**Acceptance:** full exact-source CI must pass root/packaged Go, manager JS interactions, Docker/HA smoke and hosted ARM64 before source milestone is accepted. Hosted ARM64 and synthetic media do **not** replace actual 1920×1080 Home Assistant ingress, Pi4/SSD, NAS SMB/NFS, 1,000+ comic/library tests, real connected household and restore/power-failure drills.

## Release and priority decision

The optional comic issue edition-transfer Apply stays disabled. No mobile canonical source, scanner, artwork, Atlas renderer, original book media, family permissions, or reader progress is modified in this batch. No production installation or merge.

After source CI, the next **critical** work is a single comprehensive robustness/performance pass against the remaining owner administration and recovery gates, followed by physical deployment validation; avoid resuming speculative high-risk features before release requirements.
