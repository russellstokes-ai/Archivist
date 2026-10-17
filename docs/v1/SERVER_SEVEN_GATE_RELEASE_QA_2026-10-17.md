# Archivist Server v1 — Seven release-gate execution report

**Date:** 17 October 2026  
**Repo:** [draft PR #83](https://github.com/russellstokes-ai/Archivist/pull/83), `integration/archivist-v1-auto-restore-recovery-20261016`  
**Protected mobile/canonical app:** unchanged. **Commercial server release:** **NO-GO** until all physical/software/privacy/rollout gates are independently accepted. This document distinguishes synthetic source QA from real hardware.

## Stage-by-stage completion evidence

### Stage 1 — Pi4 / Home Assistant / Docker installation
- **Automated software preflight complete:** root/packaged Go, amd64 Docker+HA test containers, native ARM64 runner and new read-only security/health smoke script tested at `d4a7d1ab1e9cf914977be72b7a275402f8aa83fa`; [server CI](https://github.com/russellstokes-ai/Archivist/actions/runs/39061379284) completed SUCCESS.
- **Physical acceptance BLOCKED:** GitHub ARM64 is not a Raspberry Pi 4/4GB SSD; no actual HAOS ingress, 1920×1080 connected monitor, mobile pairing, idle/thermal performance, power loss or upgraded live NAS. Run `ARCHIVIST_SMOKE_REQUIRE_PI=1 sh scripts/server-release-readonly-smoke.sh http://127.0.0.1:5056` only on a disposable Pi test installation. Read-only checks do not scan or modify media.

### Stage 2 — NAS loss, empty mount and reconnection
- **Automated synthetic validation complete:** `TestMultiSourceNASLossDoesNotCrossContaminateBooksOrBookmarks` checks two independent mounted-looking sources; one becomes an empty-but-reachable mountpoint, then absent, then returns. Book/edition/asset IDs and a saved position survive; a second source stays online. Previous partial-audiobook and missing-share tests remain in CI.
- **Physical SMB/NFS acceptance BLOCKED:** physical network drives, permission-denied files, stale SMB clients, host mount options, writable move root and low-power Pi I/O failures still need explicit setup/testing.

### Stage 3 — Backup, rollback and disaster recovery
- **Automated synthetic validation complete:** `TestReleaseBackupRestoresBooksFamilyProgressAndRetainsRollback` backs up real SQLite test state, stages a verified restore, rejects a second pending upload, applies after a clean stop, and verifies identities, publication, profile grants, listening positions and preserved `.before-restore` snapshot. Existing torn-swap and invalid-marker fault injection remains in CI.
- **Physical power-cut and independent off-device restore BLOCKED:** no genuine SSD/HAOS unclean shutdown, SQLite fsync/drive cache tests, off-host backup storage or real family media storage tested. Full media files are not included in the SQLite backup.

### Stage 4 — Archivist Assist metadata and book/comic identification
- **Source improvement in this execution batch:** owner-initiated Open Library + Google Books results gain a ten-minute, 96-entry in-memory cache. Cache identity includes search, title, creator, ISBN, media format, series, issue and exact provider endpoints; user mutation cannot corrupt cached candidate data. Partial provider outages are not cached and can be retried. Existing ISBN checksum, first-publication vs edition-year, score warnings and manual signed field selection remain unchanged.
- **Still required for commercial acceptance:** representative licensed/owned real title, ASIN, obscure comic, comic annual, variant, omnibus and EPUB metadata fixtures; compare matching against trusted source records. Real metadata provider reliability, quota/rate policy and specialist comic authority have not been confirmed. No automatic provider search during scanner or unverified Save introduced.

### Stage 5 — Large-library and concurrent playback
- **Automated synthetic scale validation complete:** `TestReleaseTenThousandMediaReviewAtlasAndPaging` covers 10,020 synthetic indexed media across two spaces, separate staged/published logical works, late catalogue pages, work-review totals, bounded Atlas result page, and Shelf pagination. Logs actual hosted-runner query duration but does not claim a Pi memory or latency result. Existing streaming during SQLite writer, 5,000-work summary and 4,000 move-history index tests remain.
- **Hardware scale acceptance BLOCKED:** actual 10,000+ EPUB/CBR/CBZ/RAR/PDF/audio media bytes, long-lived read/scan concurrency, archive decode bombs, CPU/RAM peak, watched roots and slow removable NAS volumes require a physical system.

### Stage 6 — Full UI, family security and cross-feature integration
- **Source integration improvement in this execution batch:** `TestReleaseCrossFeatureFamilyAtlasOPDSAndStreaming` uses a single test server to create a User, browse two published spaces, check Atlas and OPDS, stream authenticated HTTP byte ranges, reject owner-only endpoints, redact source paths, revoke the User and verify both the session and OPDS password fail immediately afterward. Existing manager fake-DOM contract covers S1–S10 navigation, workbench, journaled moves and metadata review.
- **Real UX acceptance BLOCKED:** 1920×1080 browser screenshots, keyboard and screen-reader checks, HA ingress header routing, real audiobook/comic playback, phone remote sync and family access on actual clients are not proven by synthetic Go/UI checks.

### Stage 7 — Security, authentication and reproducible QA packaging
- **Source improvement in this execution batch:** direct-peer rate limiter for failed `/unlock`/`/session` and API Basic/OPDS credentials; bound in-memory peer state, expiry, retry header, ignores spoofable `X-Forwarded-For`, and tests independent clients, rotation/revocation and brute-force protection. No new credential storage, no account locks by username and no public HTTP port requirement.
- **QA packaging workflow, not a production release:** `scripts/build-server-qa-artifacts.sh` and manually triggered `.github/workflows/server-qa-artifacts.yml` create Linux AMD64/ARM64 binaries, a reproducible Home Assistant repository ZIP, and SHA-256 manifest, uploading only short-lived **QA** artifacts after source tests. No production Docker registry push, public GitHub Release, signed image, store submission or live upgrade. The QA source must still pass exact-head server/protected-mobile workflows.
- **Production security/rollout acceptance BLOCKED:** independent audit, TLS/reverse proxy and credential key rotation on deployment, signed/versioned multiarch image, physical HAOS upgrade/rollback, NAS community platform compatibility, permissions, license review, support documentation and explicit owner release approval.

## Release decision

No new app/APK compilation, no canonical mobile scanner or reader change, no production merge, no public deployment, and no modification of actual household media. **CI and hosted ARM64 are necessary but not sufficient.** A fully green software QA matrix plus successful disposable-device and network share testing with retained snapshots is required before changing **NO-GO** to **GO**.

**The fastest remaining sequence:** accept software CI for Stages 4/6/7, run the read-only smoke on the user's disposable Pi installation, exercise synthetic and representative media on actual SMB/NFS shares, capture browser/CPU/memory evidence, test restart/restore, verify pinning/upgrades and only then issue a production candidate.

## Final source-check evidence and live-acceptance handoff

| Stage | Exact verification | Source result | Physical / release status |
|---|---|---|---|
| 1 Deployment | [full NAS/recovery/ARM64/HA smoke CI](https://github.com/russellstokes-ai/Archivist/actions/runs/39061379284) | PASS | Pi4 4 GB SSD + actual HAOS/ingress BLOCKED |
| 2 NAS safety | Same run, Go `TestMultiSourceNASLossDoesNotCrossContaminateBooksOrBookmarks` | PASS synthetic | SMB/NFS unmount/permission tests BLOCKED |
| 3 State restore | Same run, Go `TestReleaseBackupRestoresBooksFamilyProgressAndRetainsRollback` | PASS synthetic | Off-host restored backup and actual brownout BLOCKED |
| 4 Metadata | [provider cache/ranking suite](https://github.com/russellstokes-ai/Archivist/actions/runs/39062163904) | PASS source | External provider accuracy and real annual/variant fixtures BLOCKED |
| 5 10k scale | [10,020-entry Go/SQLite query suite](https://github.com/russellstokes-ai/Archivist/actions/runs/39061379284) | PASS synthetic | Actual Pi RAM/latency/real archives BLOCKED |
| 6 Cross-feature | [User/Atlas/OPDS/streaming/revoke suite](https://github.com/russellstokes-ai/Archivist/actions/runs/39062163904) | PASS source | Real 1920×1080/HA ingress/accessibility/phones BLOCKED |
| 7 Security/packaging | [security CI](https://github.com/russellstokes-ai/Archivist/actions/runs/39062163904), [QA packaging SUCCESS](https://github.com/russellstokes-ai/Archivist/actions/runs/39062366626), [latest server CI](https://github.com/russellstokes-ai/Archivist/actions/runs/39062366710) | PASS QA-only | Signed production image, restore/upgrade, audit and approval BLOCKED |

**Actual QA artifact:** GitHub Actions `archivist-server-qa-20768b64d9c14e4b69be7380bac1122f690beaba`, artifact ID `12112016159`, 17,470,120 bytes, configured to expire after 7 days. It contains QA-only AMD64 and ARM64 server binaries, reproducible Home Assistant repository ZIP and `SHA256SUMS`. No release tagging/publishing is performed.

**Disposable-device acceptance order:** On a real Pi 4B 4GB+SSD, deploy this source to an isolated data volume and readonly synthetic/owned media mounts. Run `ARCHIVIST_SMOKE_REQUIRE_PI=1 sh scripts/server-release-readonly-smoke.sh http://127.0.0.1:5056` on the Pi, then exercise a synthetic SMB/NFS mount disappearing/empty/reappearing, pause/stop/retry scans, 2 simultaneous real audio/comic streams, publication and progress across two users, SSD restart after staged restore, confirmed independent rollback, and admin 1920×1080 keyboard/screen-reader/HA ingress. Record exact source/image checksum, OS/version, memory/latency, before/after IDs, logs and operator signoff. Never test destructive actions against real family media.

**Decision:** As of the latest source and packaging checkpoint, software evidence is green but **hardware_accepted=false, merge=false, commercial_server_go=false**. This is the final required external input; further code changes should be driven by failures from that acceptance matrix rather than speculative features.
