# Archivist v1.0 — Read this first

**Single entrypoint for all future work sessions:** [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md).

Use these four records **together**. They separate the approved app from pending code and provide a dated audit trail:

1. **[DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md)** — latest recorded point-in-time status: canonical vs development, eight user-approved bugs, separate commercial Work, actual test evidence, pending acceptance and unmerged draft PRs.
2. **[DEVELOPMENT_STATUS.json](./DEVELOPMENT_STATUS.json)** — machine-checkable source SHAs, PR heads, protected-diff audit, current issue and Work statuses, CI run IDs. Updated alongside the human status.
3. **[DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md)** — append-only dated actions, diagnostics, changes, failed/passing CI, safeguards, approval and rollback notes. Never overwrite old entries to hide failed attempts.
4. **[ORIGINAL_BUG_BACKLOG_2026-10-14.md](./ORIGINAL_BUG_BACKLOG_2026-10-14.md)** — *scope* authority. Only #16, #19, #25, #23, #17, #20, #31, #32 are active user bugs. Scanner #15 excluded.

**Latest P0/P1/P2 QA-only combined source (draft PR #80):** reviewed P0 mobile/server durability + P1 playback, Auto and manager Save + P2 manual APK/16 KB checks. [Consolidated acceptance and remaining work](./V1_P0_P1_P2_QA_STATUS_2026-10-16.md). No merge, installed APK, commercial acceptance or final logo/splash integration.

**Latest P0/P1 source assembly:** `integration/archivist-v1-p0-p1-reviewed-20261016` — pending full integrated CI; imports independently reviewed stateStore P0 (#71), server catalogue P0 (#72), Android Auto chapter transition P1 (#73) on green #70. All 46 locked source files protected, no APK/release approval; see [source-level progress and limitations](./P0_P1_QA_HANDOFF_2026-10-16.md).

**Current combined integrity-source development candidate:** `integration/archivist-v1-offline-sync-reviewed-20261016` contains green draft offline copy-on-write (#68) and consistent server/client progress snapshots (#69), plus the existing plan audit. [Integration limitations and acceptance](./V1_INTEGRATED_COW_SYNC_LIMITS_2026-10-16.md). Neither App.tsx manifest durability nor stateStore/empty-NAS/rename P0 is fixed, and 0/8 original bugs are device accepted.

**Supplementary requirements and missed-bugs audit:** [Full approved plan, 28 issues, 29 commercial gates and newly demonstrated P0 empty-mount data loss](./PLAN_BUG_COMPLETENESS_AUDIT_2026-10-16.md) · [Machine-readable acceptance register](./COMMERCIAL_GATE_REGISTER_2026-10-16.json). The corresponding source-preservation reproduction is quarantined in [PR #66](https://github.com/russellstokes-ai/Archivist/pull/66); do not merge while RED. The separate [PR #67](https://github.com/russellstokes-ai/Archivist/pull/67) is documentation-only and does not replace integrated source PR #65.

**Current Astra engineering start (PR #65):** [Authoritative short source pointer, confirmed regression fixes, priority P0/P1 blockers and exact release acceptance](./ASTRA_START_POINT_AND_ACCEPTANCE_2026-10-16.md). The latest server manager metadata race has RED #38903515420 → GREEN #38903734355; no protected mobile/scanner code was touched. This document supersedes older handoff starting SHAs; never treat documentation as release approval.

**Full 16 October mobile/server/Android Auto/Play robustness audit:** [Verified fixes, four proven state/integrity defects, security risks and hardware acceptance](./FINAL_COMMERCIAL_SOURCE_SWEEP_2026-10-16.md). PRs #60–#62 are isolated draft fixes; #63 is expected-RED only. The canonical and scanners/Assist are untouched. Nothing is commercial release approved.

**Astra final commercial delivery handoff:** [Risk-ordered remaining implementation, RED tests, protected boundaries and hardware release gates](./ASTRA_FINAL_COMMERCIAL_DELIVERY_HANDOFF_2026-10-16.md). Server GIF page support PR #57 has green CI, manager selection PR #58 has a green code checkpoint, and test-only PR #59 is quarantined. No original eight issues are accepted on the Fold.

**16 October test gate:** [Safety, six bug diagnoses, server QA and release GO/NO-GO](./V1_SAFETY_BUGS_AND_TEST_GATE_2026-10-16.md) describes [draft integrated PR #55](https://github.com/russellstokes-ai/Archivist/pull/55) and quarantined [expected RED PR #56](https://github.com/russellstokes-ai/Archivist/pull/56). CI on PR #56 confirmed both data-loss and concurrent-progress omissions; those are not fixed or device accepted. No canonical merger or release approval.

**High-risk P0 reproducibility:** `mobile/offline-checkpoint-data-loss.repro.cjs` asserts existing bytes survive a failed replacement; deliberately not a release gate until its RED failure and safe GREEN remediation have been independently exercised.

**16 October sibling PR review:** [PR #52 / #53 reconciliation and P0/P1 acceptance plan](./PR52_PR53_RECONCILIATION_2026-10-16.md). [Draft PR #54](https://github.com/russellstokes-ai/Archivist/pull/54) adds an isolated #31 empty-file guard on #53 without integrating #52. No high-risk deletion rewrite or canonical changes approved.

**Immutable controls:** [PROTECTED_DEVELOPMENT_SCOPE.md](./PROTECTED_DEVELOPMENT_SCOPE.md) and [PROTECTED_BLOB_LOCKS.json](./PROTECTED_BLOB_LOCKS.json). Both scanners, Archivist Assist, canonical mobile layout, Living Book, Comic Focus, Atlas/Rewards and approved assets remain frozen without a specific user-authorised exception.

**Automated cross-check:** `mobile/development-ledger.test.cjs` runs in the existing mobile test suite. It validates the eight-issue list, canonical / draft separation, PR log coverage and **Git blob SHA-1 of all 46 locked files**; it is not a device test or a live GitHub/CI fetch.

Every future Work or chat development session must first reconcile the **current** PR head and CI with this dated record, then make only approved changes on a draft branch. After changing code, update the human status and JSON manifest **together** and append an event to the development log. Do not merge, install, release or alter locks without explicit approval.

**Crucial distinction:** source code corrected + CI green **≠** bug accepted on the actual phone **≠** production release. The owner's installed APK source SHA is not yet verified.
