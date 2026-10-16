# Archivist P0/P1 — Integrated Source QA and Remaining Release Gates
**Date:** 16 October 2026. Branch: `integration/archivist-v1-p0-p1-reviewed-20261016`. Unmerged QA only.

### Included implementation
- P0: Existing offline media copy-on-write from PR #70, with failed-network/move/pause/retry/alias regressions green.
- P0: Collision-free reversible UTF-8 key filenames and 3-slot verified state generations, legacy .bak and SecureStore preserved, queued writes and explicit tombstones (PR #71).
- P0: Automatic server catalogue no longer deletes unavailable old work/edition mappings and saved bookmarks after empty NAS/filename changes. Old work shows unavailable; new rename is a distinct candidate to avoid false merge (PR #72).
- P1: Immutable, profile-scoped, grants-revalidated remote progress snapshots in PR #70.
- P1: Native Android Auto writer takes Media3 previous chapter identity and position, not new currently selected track (PR #73).

### What is NOT complete
1. New V2 shared state-store helper needs native rollback/permission tests and a scoped owner approval because it indirectly serves protected scanner/Assist; no scanner source changes were made.
2. Server lost-mount detection remains shallow; new renamed media are not verified and reattached automatically, and previous work may remain unavailable until explicit user/identity reconciliation. Must avoid lost user positions AND false merges.
3. Protected `mobile/App.tsx` uses fire-and-forget offline manifest persistence after checkpoint clearing; do not claim crash-durable end-to-end media publication. Shared state helper alone does not solve caller acknowledgment.
4. Cross-device outbox is not wired to actual protected playback events; protocol-paging tests do not imply two-device acceptance.
5. Android Auto single-file progress handoff can still overwrite rapid consecutive transitions and deletes before durable phone acknowledgment; source-only transition repair not end-to-end car readiness.
6. No signed installable APK or device acceptance. Full Fold closed/open bugs #16/#19/#25/#23/#17/#20 still unresolved; #31/#32 hardware tests outstanding.
7. Advanced ten-screen server manager, true scanner job cancellation, exact household grants policy, real Pi4/HA/NAS backup restore, native car/voice and Play release gates still pending.
8. New navy/gold A logo and splash animations are user-provided/coming, not yet incorporated into verified app. Require explicit final art/animation approval and correct dark/light/Fold fit.
9. 46 protected blob locks/canonical `df4c39b` must remain unchanged until individual surgical permissions; no signed publication or merging before owner acceptance.

### Mandatory QA
RED-to-GREEN reproductions from PRs #56/#63/#66, same-source Mobile/iOS/Server/native Android CI, validated server root/app parity, real filesystem write/power loss on synthetic data, hidden-state fallback, redo/undo and media replug, real Fold/Pi/Auto/Play. State exact commit and test records, never extrapolate from mocks.
Commercial GO/NO-GO: **NO-GO**.
