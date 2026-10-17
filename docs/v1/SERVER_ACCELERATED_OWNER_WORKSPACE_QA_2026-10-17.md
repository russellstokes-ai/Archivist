# Archivist Server v1 — Accelerated owner workspace and operations batch

**Date:** 17 October 2026
**Workstream:** Draft [PR #83](https://github.com/russellstokes-ai/Archivist/pull/83), `integration/archivist-v1-auto-restore-recovery-20261016`.
**Protected source parent:** `830001c91d61ac77392750f058d8c6dd3a6b3a84`.
**Decision:** Consolidated implementation and integrated regression contract; full release is **NO-GO** until this batch's CI and actual Pi/NAS/HA/16:9 acceptance. Do not interpret a documentation commit as a deployed server.

## Accelerated delivery policy

Server v1 completion is now batched by functional area rather than cosmetic milestone: finish meaningful functional slices, run the full source/packaged/UI/Docker/HA/ARM64 checks once for that code checkpoint, record one consolidated status, and reserve physically inaccessible acceptance for a clearly flagged external test. The optional high-risk comic edition transfer **Apply** remains deferred; the read-only preflight from the previous milestone is retained unchanged. Never touch mobile scanner, Archivist Assist mobile, the Living Book renderer, Comic Focus, protected design or brand blobs without separate explicit approval.

## Real v1 owner workflow map (S1–S10)

The owner workspace uses the existing Archivist navy/teal/ivory/gold design, a desktop sidebar and responsive narrower layouts. These are operational *workflows* integrated across the owner manager and the existing browser app, **not a claim of ten independent polished/admin screens or device acceptance**.

| Planned screen | Current functional owner destination | Notes |
|---|---|---|
| S1 Overview | Library Manager → **Overview** | Lazy indexed logical-work/media, published/staged, file review/unavailability, source count and scan job counters; direct actions |
| S2 Library Manager | Library Manager → **Library Manager** | Existing paginated table, filters, file metadata, bulk preview and CSV export |
| S3 Work and edition detail | **Work & metadata → Edit book** | Existing grouped work/editions/chapter snapshot, cover and file provenance |
| S4 Metadata workbench | **Edit book** and individual file editor | Existing owner-selected public lookup, locks, signed previews and undo |
| S5 Review | **Work & metadata** and **File review** | Staged logical books vs individual indexed-file review remain distinct |
| S6 Scanner | **Scanner & sources** | Source probes/indexed counts, active jobs, cancellation/retry and newly integrated guarded Scan |
| S7 Organise | **Organise & relink** | Deep link to existing functioning server browser Settings workflow, not a new move engine |
| S8 Family | **Family** | Deep link to existing profile/key and household Settings controls; current global User access policy unchanged |
| S9 Health and recovery | **Health & recovery** | New owner diagnostics, explicit SQLite check, local restore marker visibility and working backup/restore navigation |
| S10 Settings | **Server settings** | Deep link to existing server connection/session/security and backup controls |

The browseable Shelf and Atlas Universe remain available as explicit navigation links in the same local/ingress origin. Cross-app deep links do not elevate permissions, duplicate a backend or represent a fully unified S1–S10 visual-acceptance pass.

## New safety-specific backend

**`GET /api/manage/operations`** is authenticated owner-only and uses a read-only SQLite transaction to report indexed sources (including watched), indexed files/works, published/staged logical works, physical-file review/unavailable flags and aggregate job states. The source of truth is saved SQLite state; this is **not** a NAS status check and never enumerates source media paths. It reports whether local `.restore.pending`, `.restore.inflight` or `.before-restore` artifacts exist by checking only non-symlink local file metadata. Untrusted artifacts/unknown database size produce explicit caveats. A local recovery snapshot is not a proof of recoverability.

**`POST /api/manage/operations/integrity`** is authenticated owner-only and requires the existing action/CSRF marker. Only a deliberate UI click executes `PRAGMA quick_check(1)`. The check is 8-second context-bounded and process-single-flight to avoid repeated expensive background probes on a Pi4. A failed/incomplete check is reported as *unverified* rather than a false green state. Its scope explicitly excludes NAS mount health, media readability, file hashes and recovery restore testing.

**Scanner:** Each source has a guarded **Scan / refresh source** button alongside its indexed health row. It is disabled when that source is not confirmed connected at the last root probe or has a queued/running/committing/cancelling job. The server `POST /api/sources/{id}/scan` still validates the live source and is authoritative; confirmation remains mandatory. The current work/catalogue scanner logic, metadata choices and publication gates are unchanged. Job cancel/retry controls remain integrated.

**Recovery browser:** Shows indexed flags and local restore markers with a clear warning, a *user-clicked* integrity action, existing `GET /api/backup` link, and a deep link into the real staged-restore settings flow. There is no invented automatic repair, reboot, restore or external-backup certification. HTML/JS text is escaped via text content.

## Source and test contract

New Go source `server_operations.go` and synthetic fixture tests `server_operations_test.go`, plus modified `main.go`, `web/manage.html`, `web/manage.css` and `web/manage.js`. Every changed root Go/web source is copied byte-identically to the packaged `archivist/app/` equivalent. Extended `scripts/v1-manager-assist.test.cjs` exercises real UI event handlers via deterministic fake DOM, including new S1/S9 navigation and no implicit SQLite checks.

New Go tests cover owner/anonymous access, explicit action/CSRF for quick check, process-single-flight rejection, real SQLite `quick_check` result, single-snapshot count separation (logical work vs physical file, staged vs published), job states, unverified local restore markers, source-path non-disclosure, missing jobs schema and absence of catalogue mutation. New JavaScript checks cover lazy loading, S1 counts, source queued-job scan button guards, S9 local marker warnings, explicit user-triggered integrity and cross-screen navigation to scanner.

**One-batch CI acceptance:** After the consolidated code commit, verify the exact commit's root+packaged Go tests, JavaScript syntax, UI contract, manager interaction, canonical source locks, Docker Compose smoke, Home Assistant add-on smoke, ARM64 runner and mobile source-regression workflow. The live results are on [PR #83 checks](https://github.com/russellstokes-ai/Archivist/pull/83/checks); this document does **not** pre-assert results from an unknown future run.

## Remaining real commercial gates

- **Physical:** Raspberry Pi 4/4GB+SSD, real Home Assistant ingress 1920×1080 and Fold-open browser, Synology/QNAP/TrueNAS/Unraid/NFS/SMB disconnect and power interruption. Hosted ARM64 is not a Pi4 acceptance.
- **Media:** Commercial-scale EPUB, CBZ/CBR/RAR, PDF/CBT, audiobook datasets; 1000+ comic scan memory/latency with concurrent streaming, corrupt/permission-denied media, metadata provider quality and licensing.
- **UX:** Full 16:9 visual, accessibility, keyboard/focus, privacy and navigation acceptance against canonical app. Some S7/S8/S10 settings still reside in the shared main browser, so ten-screen independent administration parity is **not yet complete**.
- **Reliability and policy:** Family User all-library vs per-profile grants requires an explicit product decision before changing access. Genuine atomic comic edition reassignment and undo are out of v1 priority until library management, backup and operational UX are accepted. No main merge, deploy, customer-media migration or release permission is conferred by this batch.
