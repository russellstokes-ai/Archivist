# Archivist v1.0 — Read this first

**Updated 16 October 2026 · Single entrypoint for all future work sessions:** [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md).

Use these four records **together**. They separate the approved app from pending code and provide a dated audit trail:

1. **[DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md)** — latest recorded point-in-time status: canonical vs development, eight user-approved bugs, separate commercial Work, actual test evidence, pending acceptance and unmerged draft PRs.
2. **[DEVELOPMENT_STATUS.json](./DEVELOPMENT_STATUS.json)** — machine-checkable source SHAs, PR heads, protected-diff audit, current issue and Work statuses, CI run IDs. Updated alongside the human status.
3. **[DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md)** — append-only dated actions, diagnostics, changes, failed/passing CI, safeguards, approval and rollback notes. Never overwrite old entries to hide failed attempts.
4. **[ORIGINAL_BUG_BACKLOG_2026-10-14.md](./ORIGINAL_BUG_BACKLOG_2026-10-14.md)** — *scope* authority. Only #16, #19, #25, #23, #17, #20, #31, #32 are active user bugs. Scanner #15 excluded.
5. **[ASTRA_REVIEW_QUEUE.md](./ASTRA_REVIEW_QUEUE.md)** — **13 difficult/high-risk items for independent Astra testing**. Each includes actual code evidence, confidence, reproduction steps and scope boundaries. Commercial server artwork fallback is isolated in draft PR #52, not a mobile comic bug closure.

**Immutable controls:** [PROTECTED_DEVELOPMENT_SCOPE.md](./PROTECTED_DEVELOPMENT_SCOPE.md) and [PROTECTED_BLOB_LOCKS.json](./PROTECTED_BLOB_LOCKS.json). Both scanners, Archivist Assist, canonical mobile layout, Living Book, Comic Focus, Atlas/Rewards and approved assets remain frozen without a specific user-authorised exception.

**Automated cross-check:** `mobile/development-ledger.test.cjs` runs in the existing mobile test suite. It validates the eight-issue list, canonical / draft separation, PR log coverage and **Git blob SHA-1 of all 46 locked files**; it is not a device test or a live GitHub/CI fetch.

Every future Work or chat development session must first reconcile the **current** PR head and CI with this dated record, then make only approved changes on a draft branch. After changing code, update the human status and JSON manifest **together** and append an event to the development log. Do not merge, install, release or alter locks without explicit approval.

**Crucial distinction:** source code corrected + CI green **≠** bug accepted on the actual phone **≠** production release. The owner's installed APK source SHA is not yet verified.
