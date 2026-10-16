# Archivist v1.0 — COW Offline + Immutable Sync: Engineering Limits and Acceptance
**Draft integration only, 16 October 2026.** Source branch `integration/archivist-v1-offline-sync-reviewed-20261016`.

**Implemented in unmerged PRs #68 and #69:** copy-on-write app-owned media staging with no deletion of published bytes; strict absent-target checks, versioned new copies and non-destructive legacy checkpoint migration; bounded single-transaction authorised server progress snapshot with profile/grant-scoped 48-character cursors, 3-minute expiry, 10k record cap and explicit 409 on inconsistent continuation; client refuses mixed/absent multipage cursor.

**Verified test ancestry:** offline RED Mobile #38912250259 to Mobile GREEN #38913959603 and iOS GREEN #38913959819. Progress deletion RED Server #38914190947 to Server GREEN #38915179616 and Mobile GREEN #38915179344. Separate exact-head integration CI and real devices are still required.

**Unresolved blockers that no test may silently waive:**
1. `mobile/App.tsx` stores downloaded-work manifest with a fire-and-forget `setPersistedJSON` **after** downloader clears checkpoint. Crash/disk-full can leave a verified new copy unreferenced. Need a separately approved, acknowledgment-based durable commit and crash recovery, preserving the frozen mobile interface and scanner/Assist.
2. `stateStore.ts` shared backup/key collision defects in RED [PR #63](https://github.com/russellstokes-ai/Archivist/pull/63), involving frozen scanner/Assist state; no source edit until narrowly approved migration and rollback design.
3. `catalogue.go` work/bookmark deletion on empty NAS roots and simple audiobook rename in RED [PR #66](https://github.com/russellstokes-ai/Archivist/pull/66). Identity retention requires a separate approved server scanner/catalogue scope.
4. Server lengths only are not cryptographic digests. Same-size corruption can evade reuse validation; add trustworthy server SHA-256 and check at publish with transparent migration.
5. Expo legacy `moveAsync` same-directory atomic/no-overwrite/fsync guarantees are not proven on real Android filesystems; verify crash, storage exhaustion, permissions and power loss. Avoid trusting an unreadable file stat as absence.
6. Progress outbox is not yet connected to protected player events and tested across two Android clients. Snapshot caches deliberately return 413 for more than 10k entries; large-library protocol and older client compatibility need decisions.
7. Full eight-bug Fold acceptance is 0/8; advanced server management, Pi/HA/NAS, Android Auto and Play signed AAB are not commercially released.

**Approval:** both scanners, Archivist Assist, canonical mobile App.tsx layout, Living Book/Comic Focus, Atlas/Stats/Rewards and all 46 SHA-locked blobs remain unchanged. Quarantined RED PRs #56/#63/#66 must never be merged unfixed. Verify same-head Mobile/iOS/Server and native Android, backend identity/SQLite recovery, representative media and user approval before APK, migration, merge or release. **Commercial GO = false.**
