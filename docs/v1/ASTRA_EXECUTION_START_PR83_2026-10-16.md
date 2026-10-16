# Archivist v1 — Astra Execution Start (Single Current Entry Point)
**Date:** 16 October 2026 · **Decision:** Engineering handoff READY; commercial release **NO-GO**.
**Repo:** `russellstokes-ai/Archivist` · **Do not use older PR #65/#70 handoff branch pointers as the current code.**

## 1. Exact starting source and confidence

**Start from the unmerged, four-workflow-CI-green source in [draft PR #83](https://github.com/russellstokes-ai/Archivist/pull/83):**
- Branch: `integration/archivist-v1-auto-restore-recovery-20261016`
- **Commit: `70ddc9226e6182f1a0271ce8a08c77b71c3b4ed9`**
- [Mobile checks #38948050600](https://github.com/russellstokes-ai/Archivist/actions/runs/38948050600) **SUCCESS**
- [iOS checks #38948050648](https://github.com/russellstokes-ai/Archivist/actions/runs/38948050648) **SUCCESS**
- [Android native checks #38948050610](https://github.com/russellstokes-ai/Archivist/actions/runs/38948050610) **SUCCESS**
- [Server checks #38948050770](https://github.com/russellstokes-ai/Archivist/actions/runs/38948050770) **SUCCESS**, including native ARM64, Docker and Home Assistant synthetic smokes

**Approval boundary:** Canonical reference `df4c39b44394d8c512ca0298bffa7f19da356490`; protected development parent `72bbf177aecc92f31724b48c6cf11a7eddd7a216`. Cumulative compare through PR #83: **254 commits ahead, none behind; 137 changed paths**. All **46** original protected blobs tracked. The only changed formerly locked file is `mobile/App.tsx`, with an **exact, pre-recorded logic-only exception** in `docs/v1/APP_LOGIC_EXCEPTION_2026-10-16.json` (accepted blob `8fdf3b2cea9fd92f0edf4bef0168cc97acfe9935`); the other **45 protected paths are unchanged**. No further App.tsx/UI/scanner/Assist/reader/assets changes without separately scoped owner authorisation. Original approved Living Book/Comic Focus/Atlas/Stats/Rewards presentation and Lotties must remain.

**Important:** PR #83 and all ancestors remain unmerged, not installed, not production signed, not deployed to the owner's library. The user's installed test APK's source SHA is unverified. Do not infer commercial acceptance from successful CI.

## 2. Work already implemented and regression-verified in the PR #83 stack

Avoid spending Astra tokens reimplementing the following unless an independent test finds a regression.

| Area | Draft code/evidence | Meaning, not hardware acceptance |
|---|---|---|
| Safe offline download | PR #68 + #76 | Copy-on-write private stage and versioned media, non-destructive legacy checkpoint recovery, **durable offline manifest before checkpoint clear** |
| Shared mobile state | PR #71 | Collision-free storage keys with compatibility migration, multi-generation validated state, fail-safe handling of corrupt primary/disk-full; former PR #63 RED regressions green |
| Server identity on missing/renamed media | PR #72 | Preserve old work/edition/bookmark as unavailable rather than deleting on empty NAS root or rename; former PR #66 RED regressions green; **automatic safe relinking of a renamed file is NOT completed** |
| Cross-device audiobook progress | PR #69 + #78 | Immutable authorised paginated snapshot, bounded/tokenised cursors, persistent outbox before network writes, safe replay and conflict retention; complete multi-format/two-device acceptance remains |
| Android Auto | PR #73, #77, #81 | Correct outgoing chapter position, durable acknowledged phone state, native per-transition FIFO; real head unit/car and force-kill acceptance remain |
| SQLite database restore | PR #82 | Recover interrupted restore state with validation and fsynced marker/rollback on disposable server fixtures; real Pi/NAS power-loss still needs acceptance |
| Server manager | PR #58, #65, #75 | Fix individual selection, late provider suggestions and stale Save completions; **ten-screen advanced management is still incomplete** |
| Platform preparation | PR #79 | Manual internal QA APK with separate identity, signing failure closed, preliminary 16 KB ELF checks; NOT a production Play App Bundle |

Retain original quarantined RED-only PRs [#56](https://github.com/russellstokes-ai/Archivist/pull/56), [#63](https://github.com/russellstokes-ai/Archivist/pull/63) and [#66](https://github.com/russellstokes-ai/Archivist/pull/66) as historical test evidence; **never merge those failing branches**. Relevant GREEN regressions already live in corrected descendants.

## 3. Outstanding work for Astra, in execution order

**A — Six unresolved approved mobile issues.** [#16](https://github.com/russellstokes-ai/Archivist/issues/16) 2000AD/comic SAF opening; [#19](https://github.com/russellstokes-ai/Archivist/issues/19) Atlas blank despite Library works; [#25](https://github.com/russellstokes-ai/Archivist/issues/25) Living Book first-entry invisibility; [#23](https://github.com/russellstokes-ai/Archivist/issues/23) unexpected Resume prompt; [#17](https://github.com/russellstokes-ai/Archivist/issues/17) play/pause optical centering; [#20](https://github.com/russellstokes-ai/Archivist/issues/20) Rewards Lottie intermittency. Diagnose using exact existing media/trace; RED test before minimum approved change. **No blanket visual/scanner rewrite or Lottie replacement.**

**B — Approve original bugs #31/#32 on actual Fold.** Offline local-first/content integrity: existing & interrupted downloads, full book and partial chapters, no network, disk-full, force-stop and failed migration; same-size corruption/digest and native no-clobber/atomic-move correctness need independent check. PDF A→B→A document/page state, rotation/Fold closed/open, permission revocation, kill/restart. **0 of 8 bugs are accepted on the owner's device**, even where CI draft fixes exist.

**C — Complete premium portable server administration and data lifecycle.** Use **one existing Go/SQLite core** across Home Assistant add-on and standalone Docker/NAS/Pi; don't create a second server. Implement the approved S1–S10 manager gaps: cover grid/list/table, work/edition/series/issue detail, field-by-field source locks/provenance, bulk preview/journal/undo, work-centric review, truthful source health, scan job cancellation, family permissions, recovery/backup settings. Catalogue rename **relink** must be verified via high-confidence identity or manual confirmation rather than matching unrelated works. Clarify policy: current server User sees all spaces, earlier plan suggested per-profile grants. Preserve existing indexed works/bookmarks on empty or partial NAS mounts. No scanner implementation change without narrowly approved exception.

**D — Qualify Android Auto and cross-device syncing.** Real Desktop Head Unit and vehicle (browse/voice/audio focus, calls/nav, Bluetooth, seek, multi-transition FIFO, force-kill) and offline/downloaded fallback. Multi-device, per-profile sync conflict and rate/retry behaviour, content permission and token-expiry tests; preserve deliberately rewound positions.

**E — Commercial release and owner QA.** Real target Fold closed/open and ordinary phone; actual Pi 4 4GB SSD, HAOS and Docker/NAS SMB/NFS disconnect/reconnect, SQLite restore/power loss using only expendable data, resource/load/error telemetry. Apply correct Android target API/16 KB native compatibility on the **final signed AAB**, secure signing, Google Play privacy/Data Safety/listing/licence/accessibility/crash/ANR requirements. New logo/splash final assets must be separately approved and integrated; no placeholders.

## 4. Delivery and stop rules

1. Check live PRs and run conclusions on entry; source pointer above is a **dated checkpoint**, not a forever-updating branch. Never assume main or canonical contains these drafts.
2. Preserve the immutable canonical, all 45 untouched locks, and the exact approved App.tsx exception. Any additional protected change needs a specific, separate approval and a before/after proof.
3. Work in small reviewable drafts; for each: root cause, file-level diff, genuine RED/GREEN assertions, complete current-head CI and rollback notes. Keep Go root and packaged copies identical. Never weaken source locks.
4. Track implementation vs physical acceptance separately. Keep `docs/v1/DEVELOPMENT_STATUS.md` and `.json` synchronized and **append** `DEVELOPMENT_LOG.md`. Do not close #16/#19/#25/#23/#17/#20/#31/#32 without reproducing their owner-visible result on the actual build.
5. Use disposable media, DBs, accounts and test devices. Never migrate a live family library, install on the owner's phone, merge to canonical/main, remove backups, sign/publish a production artifact or expose public HTTP without explicit owner approval.
6. Deliver **one reproducible integrated acceptance candidate** with source SHA, Build ID/APK/AAB provenance, 8-bug evidence matrix, server/Auto/Play gates, hardware logs, rollback and explicit final **commercial GO/NO-GO**.

**Current judgment:** Engineering handoff **GO**; CI-based development candidate **GO for disposable QA only**; actual user-library deployment, signed production release and Google Play **NO-GO**.

**Supporting detailed references:** `docs/v1/V1_NATIVE_AUTO_RESTORE_QA_2026-10-16.md`, `docs/v1/V1_P0_P1_P2_QA_STATUS_2026-10-16.md`, `docs/v1/PLAN_BUG_COMPLETENESS_AUDIT_2026-10-16.md`, `docs/v1/COMMERCIAL_GATE_REGISTER_2026-10-16.json`, `docs/v1/APP_LOGIC_EXCEPTION_2026-10-16.json`.
