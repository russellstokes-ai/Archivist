# Archivist 1.0 — Astra Engineering Start Point and Acceptance Contract

**Snapshot:** 16 October 2026  
**Role:** definitive short *execution start* for Astra, not permission to merge, deploy or publish.  
**Repository:** `russellstokes-ai/Archivist`. **One production core**, universal server on Docker/HA/NAS/Pi and Android client working even without the server.

## Mandatory additional findings discovered after the original handoff

**Read first:** [PLAN_BUG_COMPLETENESS_AUDIT_2026-10-16.md](./PLAN_BUG_COMPLETENESS_AUDIT_2026-10-16.md) and [29-gate machine register](./COMMERCIAL_GATE_REGISTER_2026-10-16.json), on docs-only draft [PR #67](https://github.com/russellstokes-ai/Archivist/pull/67). This is a *supplement*, not a replacement for the original eight-bug restrictions.

**New P0 confirmed RED: empty but reachable NAS mount can erase work identity and its saved position.** Quarantined [PR #66](https://github.com/russellstokes-ai/Archivist/pull/66) [Server CI #38908960336](https://github.com/russellstokes-ai/Archivist/actions/runs/38908960336) reports `scanErr=<nil>`, `works=0`, `saved playback bookmark=0` after a previously populated mount becomes an empty valid directory. The previous absent-directory preservation check did not catch this. No production scanner source was edited; owner must approve a **strictly scoped** server scan/catalogue identity-preservation change before Astra implements it. Avoid naive zero-count early return that fails on partial remount; preserve work IDs, groupings, edition progress and user data under 100→0 and 100→1, real SMB/NFS loss/recovery and explicit user removal.

**Product/plan decisions needed before claiming v1 complete:** master S1–S10 server manager specification vs currently partial 3-view manager; truthful scan cancellation missing; per-user library-space grants in master vs current all-library User access; historical #18/#21/#22/#24/#26–#30 from older plan but **not** later eight-bug scope; Android Auto Recent/Downloads headings and delete-before-ack progress handoff; owner authentication/throttling, Pi4 memory and Play/privacy evidence. These are not blanket permission to edit frozen scanners or protected UI. Leave optional #34/#37–#39 as post-v1 unless owner promotes them.

**Do NOT merge quarantined RED branches #56, #63 or #66.** The most inclusive already CI-green implementation start remains PR #65. Maintain the new P0 in both development status files and append-only log. Source hardware/Play acceptance remains unfinished.

## 1. Exact code to continue, not canonical or a RED-only test branch

Use the **latest verified head** of draft [PR #65](https://github.com/russellstokes-ai/Archivist/pull/65), branch `fix/archivist-server-manager-stale-candidates-20261016`, **only if its exact-head CI is green**. This branch descends from unmerged #62 ← #61 ← #60 ← #58 ← #57 ← #55 and contains the earlier protected feature foundation #40–54. The **server manager source correction checkpoint** is `63ad2e7e3e88d1dfc6c4e46e41383a04cc914bb7`; Server checks [#38903734355](https://github.com/russellstokes-ai/Archivist/actions/runs/38903734355) must be checked for a **completed SUCCESS conclusion**, not assumed. Root and packaged server manager JS are SHA-identical, and a dedicated executable slow-response regression is required by the server manager contract. **If CI fails, fix the exact defect on a separate reviewable draft; do not use an unverified state as release candidate.**

Prior baseline #62 commit `7700a2d53fe261d76ce03b8cea8101203606e787` passed [Mobile #38900752400](https://github.com/russellstokes-ai/Archivist/actions/runs/38900752400) and [iOS #38900752710](https://github.com/russellstokes-ai/Archivist/actions/runs/38900752710). Earlier server-only #61 [Server #38898678752](https://github.com/russellstokes-ai/Archivist/actions/runs/38898678752) passed. Full same-SHA Mobile/Server/iOS CI plus real native acceptance is required for final integration.

Approved canonical application = `df4c39b44394d8c512ca0298bffa7f19da356490`, protected development parent = `72bbf177aecc92f31724b48c6cf11a7eddd7a216`. Exact SHA lock list = `docs/v1/PROTECTED_BLOB_LOCKS.json` **46 paths**; keep unchanged and run `scripts/v1-protection-gate.cjs` and `mobile/development-ledger.test.cjs`. Do not infer the owner's installed APK source SHA from branches.

**Never treat these as fix branches:** [PR #56](https://github.com/russellstokes-ai/Archivist/pull/56) (two RED integrity regressions); [PR #63](https://github.com/russellstokes-ai/Archivist/pull/63) (two RED state-store integrity regressions); [PR #59](https://github.com/russellstokes-ai/Archivist/pull/59) (quarantined historical manager-row RED proof). Preserve the test assertions, port them to a corrected isolated branch, and make them pass *before* inclusion in an integrated build.

Both scanners and their workflows, Archivist Assist and Smart Search/editor, canonical mobile `App.tsx` visual/layout/nav/fonts, Living Book renderer, Comic Focus, Atlas/Stats/Rewards visuals and Lottie/brand assets **remain frozen**. Changing a shared helper so that it rewires a protected workflow is also prohibited without a separate, exact approval. The source locks are not permission to alter other protected behaviour indirectly.

## 2. Verified chat work — code tested but not owner-device accepted

| Draft(s) | Finished code work | Verified result and caveat |
|---|---|---|
| #40–#50 | Portable server Docker/HA/NAS foundation, local-first offline, stats/metadata/CBT/cover safety, progress scaffolding, comics diagnostics and PDF state | Earlier CI; no actual Pi/NAS/Fold acceptance |
| #52 / #53 / #54 / #55 | Corrupt-cover fallback, reject duplicate progress identities, zero-byte offline guard and isolated integration | #55 Mobile, iOS, Server CI passed. **Not** a fix for destructive offline checkpoint deletion or inconsistent paging |
| #57 | Correctly serve valid GIF comic pages from CBZ/CBT with header memory safeguards | Server [#38894595898](https://github.com/russellstokes-ai/Archivist/actions/runs/38894595898) succeeded; doesn't fix Android comic-opening issue #16 |
| #58 | Correct server manager row selection/export functional exception | RED [#38896163057](https://github.com/russellstokes-ai/Archivist/actions/runs/38896163057), GREEN [#38896160314](https://github.com/russellstokes-ai/Archivist/actions/runs/38896160314); server browser/device acceptance pending |
| #60 | Bounded WebP VP8/VP8L/VP8X cover/comic header dimensions | Server [#38897898492](https://github.com/russellstokes-ai/Archivist/actions/runs/38897898492), Mobile #38897898493 and iOS #38897898486 succeeded |
| #61 | Stable, authorised OPDS work-level pagination; no 200-work/1500-row truncation | Server [#38898678752](https://github.com/russellstokes-ai/Archivist/actions/runs/38898678752) succeeded; third-party reader tests pending |
| #62 | Validate restored server origin/path before mobile bearer-token fetch | Mobile [#38900752400](https://github.com/russellstokes-ai/Archivist/actions/runs/38900752400) and iOS [#38900752710](https://github.com/russellstokes-ai/Archivist/actions/runs/38900752710) succeeded |
| #65 | Prevent delayed metadata-candidate results/errors from an old title appearing in a later server editor; preserve current field-by-field selection | True test-first regression: Server [#38903515420](https://github.com/russellstokes-ai/Archivist/actions/runs/38903515420) failed exact stale-result assertion in unmodified manager; inspect full subsequent green CI before claiming solved |

**No user-installed APK, production signed AAB, released container, merge or live media migration** resulted from these drafts. All source and test changes must be consolidated with correct parentage, never by blindly merging stale branches.

## 3. Astra tasks, priority order and hard end conditions

### A — P0: Offline personal media remains byte-perfect on failure

[PR #56](https://github.com/russellstokes-ai/Archivist/pull/56), Mobile expected-RED [#38892078091](https://github.com/russellstokes-ai/Archivist/actions/runs/38892078091): prior downloaded chapter was deleted before unsuccessful replacement; original 81-byte sentinel disappeared.

Deliver **separate, bounded staging downloads** with explicit checkpoint ownership and session validation; only publish verified completed media/manifest after safe commit. Never overwrite existing canonical chapter on attempt. Single-writer/recovery rules, crash/disk-full/read-only FS/network cut, multi-track and Android resume/SAF integrity. Preserve old data and rollback if no atomic move guaranteed. Make RED regression GREEN without merely removing the failing assertion or throwing an error that leaves working user media stranded.

### B — P0: Shared state-store last-good backup and collision-free migration

[PR #63](https://github.com/russellstokes-ai/Archivist/pull/63), Mobile expected-RED [#38899466348](https://github.com/russellstokes-ai/Archivist/actions/runs/38899466348): corrupt primary overwrites valid .bak on disk-full, and `archivist/a:b` vs `archivist:a/b` collide on disk filenames.

Protect all existing persisted work, bookmarks, scanner/Assist records and offline queues. Versioned, collision-free key names; backward-compatible migration with reversible transition, multi-writer serialization, verified durable backup after fault injection; no destructive rescanning, missing reviewed books or lost achievements. Because shared helper indirectly affects frozen workflows, document exact change and obtain user's scoped approval **before** applying it to a combined APK.

### C — P1: Coherent cross-device progress snapshots and client replay

[PR #56](https://github.com/russellstokes-ai/Archivist/pull/56), Server RED [#38892078164](https://github.com/russellstokes-ai/Archivist/actions/runs/38892078164): `LIMIT/OFFSET` response returned HTTP 200 while silently omitting an untouched progress entry after a preceding record changed.

Use revisioned, profile-authorised, bounded snapshot cursors or equivalent invalidation/retry with explicit 409; preserve local outbox, grant isolation, robust two-device conflict resolution and no inadvertent autoplay. Wire outbox to playback only with **separately approved** smallest change to locked client integration. Confirm on two actual clients with concurrent changes and process restarts, not Go-only tests.

### D — Original eight user bugs (never silently close)

| Report | State to deliver |
|---|---|
| [#16](https://github.com/russellstokes-ai/Archivist/issues/16) Comic `2000AD Annual 1978` fails | Reproduce native SAF/URI/format handling, CBZ/CBR/CBT/comic PDF opens and pages; do not change Comic Focus visuals |
| [#19](https://github.com/russellstokes-ai/Archivist/issues/19) Atlas blank | Eligible published works match Library/Shelf; preserve all Atlas geometry/animations |
| [#25](https://github.com/russellstokes-ai/Archivist/issues/25) Living Book absent | Reliable first entry without Play/Pause workaround; keep Living Book renderer |
| [#23](https://github.com/russellstokes-ai/Archivist/issues/23) Unwanted resume prompt | Last page/chapter/seconds restored with no prompt or unrequested playback |
| [#17](https://github.com/russellstokes-ai/Archivist/issues/17) Play/Pause optical alignment | Exactly approved five-control row/glyph source; prove centred on phone and Fold both modes |
| [#20](https://github.com/russellstokes-ai/Archivist/issues/20) Rewards Lottie intermittency | Approved Books Stack/Headphones assets play once, freeze only on genuine end frame; rapid successive awards/reduced motion |
| [#31](https://github.com/russellstokes-ai/Archivist/issues/31) Offline local-first | Already has CI-draft correction; requires P0 A + real flight mode/reconnect/partial/size-mismatch/restart |
| [#32](https://github.com/russellstokes-ai/Archivist/issues/32) PDF document staleness | #49 has CI-draft correction; requires real A→B→A PDFs, saved pages, fold resize and force-stop |

**Issue #15 scanner is excluded.** Remaining historical issues are *not* scope additions. **0 of 8 are accepted on the owner's Fold**, despite some draft fixes. No user-visible UI source exception granted just because this list exists.

### E — Finish the commercial server administration and reliability

Existing `web/manage.*`, Go/SQLite, authenticated household, metadata tools, read-only Docker/NAS mounts, HA addon, OPDS and 16:9 admin shell should be improved **in place**, not replaced by a second backend. Required v1 management: cover-grid and list as well as existing table; work/edition/series and comic issue identity; powerful true saved filters; provenance and per-field verified locks; safe bulk metadata preview, transaction history, undo/recovery, health and disconnected NAS diagnosis. No scanner changes. Test 10k-file mixed libraries, profile permissions, cover/RAR/EPUB/PDF, malformed archives, CPU/RAM/disk, accessibility and mobile browser.

SQLite backup/restore `backup.go` still needs staged power-fail/disk-full/WAL recovery tests (use disposable data; never family live DB). Real Raspberry Pi 4 4GB SSD and HAOS ingress, amd64 Docker, SMB/NFS detach and representative Synology/QNAP/TrueNAS/Unraid QA remain outstanding. Never expose unsecured port publicly. Treat root-availability probes as shallow; no silent deletion of indexed works.

### F — Android Auto + Play shipping

Native Media3 `ArchivistAutoService.kt` already exists; verify `onMediaItemTransition` old vs new track progress identity and flush-on-destroy, audio focus/calls/navigation, voice/search, Bluetooth/noisy device, downloaded fallback, car UI restrictions. Real car and Desktop Head Unit needed.

Google Play Books & Reference release requires **production signed AAB** (debug-signed test APK is not production), current target API check, 16 KB ARM64 ELF and ZIP alignment, app/update migration, closed-test requirements if applicable, permission/privacy/Data safety/account deletion and all media/Lottie/provider licenses; Play pre-launch/accessibility/crash ANR evidence. Validate LAN HTTP vs HTTPS remote policy without disabling user-supported private servers.

## 4. Non-negotiable engineering discipline

- **Before every change:** compare current branch SHA and 46 protected Git blobs to protected baseline; record exact issue, source and original RED reproduction. Do not claim green from an older commit.
- **For each fix:** one reviewable draft, mirrored root/packaged server parity, deterministic failure test before minimal implementation, robust crash and rollback paths, CI exact-head links, protected-source tests, threat model and trade-off notes.
- **Human approval for protected work:** present an exact minimal change and its behavioural consequences first; no blind UI rewrite, no scanner or Archivist Assist refactor. Surgical bug exceptions must retain user-approved layouts/assets.
- **Documentation:** update `docs/v1/DEVELOPMENT_STATUS.md` AND `docs/v1/DEVELOPMENT_STATUS.json` together, append `DEVELOPMENT_LOG.md`, preserve both `ASTRA_REVIEW_QUEUE.md` and `ASTRA_ROBUSTNESS_REVIEW_QUEUE.md`; keep all historical RED outcomes and provenance.
- **Before hardware deployment:** source SHA, signing hashes, rollback assets, clean test libraries, verified release process and explicit owner permission.
- **Deliverables:** one integrated versioned candidate (not many disconnected forks), real Fold open/closed bug matrix, real Pi/NAS/Auto acceptance, signed Play AAB readiness and documented commercial GO/NO-GO. Never mark a bug done solely because its test passes.

## 5. Handoff / release decision

**Chat engineering may safely end once exact PR #65 Server CI is recorded and the documentation ledger reflects the latest source.** Then the remaining steps above require Astra's long-running engineering, hardware/emulator integration or narrow user-approved changes to protected source. Existing green code can be tested with **disposable** Docker media; not with the owner's originals until integrity/durability and backup tests pass.

**Commercial release remains NO-GO**: (i) three unresolved integrity areas/four proven failures, (ii) zero of eight original bugs device accepted, (iii) advanced server, Android Auto, hardware and Play gates incomplete. Do not reinterpret completion of chat's isolated low-risk fixes as the end of product development.
