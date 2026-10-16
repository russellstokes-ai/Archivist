# Archivist v1.0 — Read this first

**Single entrypoint for all future work sessions:** [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md).

Use these four records **together**. They separate the approved app from pending code and provide a dated audit trail:

1. **[DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md)** — latest recorded point-in-time status: canonical vs development, eight user-approved bugs, separate commercial Work, actual test evidence, pending acceptance and unmerged draft PRs.
2. **[DEVELOPMENT_STATUS.json](./DEVELOPMENT_STATUS.json)** — machine-checkable source SHAs, PR heads, protected-diff audit, current issue and Work statuses, CI run IDs. Updated alongside the human status.
3. **[DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md)** — append-only dated actions, diagnostics, changes, failed/passing CI, safeguards, approval and rollback notes. Never overwrite old entries to hide failed attempts.
4. **[ORIGINAL_BUG_BACKLOG_2026-10-14.md](./ORIGINAL_BUG_BACKLOG_2026-10-14.md)** — *scope* authority. Only #16, #19, #25, #23, #17, #20, #31, #32 are active user bugs. Scanner #15 excluded.

**16 October test gate:** [Safety, six bug diagnoses, server QA and release GO/NO-GO](./V1_SAFETY_BUGS_AND_TEST_GATE_2026-10-16.md) describes [draft integrated PR #55](https://github.com/russellstokes-ai/Archivist/pull/55) and quarantined [expected RED PR #56](https://github.com/russellstokes-ai/Archivist/pull/56). CI on PR #56 confirmed both data-loss and concurrent-progress omissions; those are not fixed or device accepted. No canonical merger or release approval.

**High-risk P0 reproducibility:** `mobile/offline-checkpoint-data-loss.repro.cjs` asserts existing bytes survive a failed replacement; deliberately not a release gate until its RED failure and safe GREEN remediation have been independently exercised.

**16 October sibling PR review:** [PR #52 / #53 reconciliation and P0/P1 acceptance plan](./PR52_PR53_RECONCILIATION_2026-10-16.md). [Draft PR #54](https://github.com/russellstokes-ai/Archivist/pull/54) adds an isolated #31 empty-file guard on #53 without integrating #52. No high-risk deletion rewrite or canonical changes approved.

**Immutable controls:** [PROTECTED_DEVELOPMENT_SCOPE.md](./PROTECTED_DEVELOPMENT_SCOPE.md) and [PROTECTED_BLOB_LOCKS.json](./PROTECTED_BLOB_LOCKS.json). Both scanners, Archivist Assist, canonical mobile layout, Living Book, Comic Focus, Atlas/Rewards and approved assets remain frozen without a specific user-authorised exception.

**Automated cross-check:** `mobile/development-ledger.test.cjs` runs in the existing mobile test suite. It validates the eight-issue list, canonical / draft separation, PR log coverage and **Git blob SHA-1 of all 46 locked files**; it is not a device test or a live GitHub/CI fetch.

Every future Work or chat development session must first reconcile the **current** PR head and CI with this dated record, then make only approved changes on a draft branch. After changing code, update the human status and JSON manifest **together** and append an event to the development log. Do not merge, install, release or alter locks without explicit approval.

**Crucial distinction:** source code corrected + CI green **≠** bug accepted on the actual phone **≠** production release. The owner's installed APK source SHA is not yet verified.
