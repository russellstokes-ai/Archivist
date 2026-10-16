# Archivist v1.0 — Final Source Robustness Sweep & Commercial Acceptance Register
**Date:** 16 October 2026
**Status:** Commercial-grade source review with verified fixes and reproducible unresolved risks. **Not an accepted production or hardware build.**

## Audit boundary, reproducibility and source protection

Audited the 740-entry GitHub tree at protected draft #58, plus the subsequent source additions in PRs #60–#63, across Android mobile reader/lifecycle/state/network/offline, Android Auto Media3, Go/SQLite server, archive/cover/media streaming, OPDS and management UI, SQLite backups, Docker/HA/NAS packaging, workflows and Google Play readiness. This was source review and CI verification, **not a claim that every line was formally security-reviewed or that physical devices were tested**.

- Repository `russellstokes-ai/Archivist`; **canonical immutable** `df4c39b44394d8c512ca0298bffa7f19da356490`; protected development reference `72bbf177aecc92f31724b48c6cf11a7eddd7a216`.
- Safe integration ancestry: [#55](https://github.com/russellstokes-ai/Archivist/pull/55) ← [#57](https://github.com/russellstokes-ai/Archivist/pull/57) ← [#58](https://github.com/russellstokes-ai/Archivist/pull/58) ← [#60](https://github.com/russellstokes-ai/Archivist/pull/60) ← [#61](https://github.com/russellstokes-ai/Archivist/pull/61) ← [#62](https://github.com/russellstokes-ai/Archivist/pull/62), each **draft/unmerged**. PR #52's server-cover fix was reconciled in #55; #53 client progress duplicate hardening was already in its draft ancestry.
- Audit head before these docs `6c18f71d66f965caeb3f9368f0168e99671b745d` compared with protected development baseline: **196 commits ahead, zero behind, 91 cumulative changed file paths, zero of 46 locked file paths modified**, and no `App.tsx`, scanner, Assist, Living Book, Atlas, Stats, Rewards, Comic Focus or motion asset changes. Recheck this result after any future edits.
- Separate **intentional RED-only** audit branches [#56](https://github.com/russellstokes-ai/Archivist/pull/56), [#59](https://github.com/russellstokes-ai/Archivist/pull/59) and [#63](https://github.com/russellstokes-ai/Archivist/pull/63) are not safe integrations, and must never be merged as failing suites.
- User's current installed Android APK source SHA remains unverified. No installation, production credential signing, family DB migration or Play submission occurred here.

## Verified repair results — code/CI, not device acceptance

| Scope | Before: demonstrable failure | Correction / evidence | Status |
|---|---|---|---|
| **Server artwork WebP decode safety (#60)** | [Server RED #38897554558](https://github.com/russellstokes-ai/Archivist/actions/runs/38897554558): VP8, VP8L and VP8X inflated canvas headers, inconsistent RIFF lengths and CBZ/WebP page accepted | New root/packaged `webp_header.go` checks RIFF/chunk boundaries, header signatures and 12 MP / 8192-pixel canvas limits **without decoding**. Root/packaged `covers.go` calls it on WebP artwork and `reader.go` on WebP pages, preserving raw valid bytes. [Server GREEN #38897898492](https://github.com/russellstokes-ai/Archivist/actions/runs/38897898492), [Mobile GREEN #38897898493](https://github.com/russellstokes-ai/Archivist/actions/runs/38897898493), [iOS GREEN #38897898486](https://github.com/russellstokes-ai/Archivist/actions/runs/38897898486) on #60 checkpoint `4ad02f79b658952a024a965861d67d8b33641166` | Draft CI verified, real files/devices outstanding |
| **Complete OPDS library (#61)** | [Server RED #38898474617](https://github.com/russellstokes-ai/Archivist/actions/runs/38898474617): 200/205 works accessible; a 1501-chapter audiobook hid the next title due 1500 join-row limit | Root/packaged `opds.go`: 100-work pages ordered by SQLite lower(title)+ID cursor, authenticated profile/grant work selection, transaction-consistent per-page work and chapter links, Atom next/self navigation, no silent 200-work/1500-row truncation. [Server GREEN #38898678752](https://github.com/russellstokes-ai/Archivist/actions/runs/38898678752) including AMD64, ARM64, HA/Docker | Draft CI verified; real third-party OPDS clients and concurrent rescan acceptance outstanding |
| **Mobile bearer request origin guard (#62)** | [Mobile RED #38898995633](https://github.com/russellstokes-ai/Archivist/actions/runs/38898995633): rehydrated invalid server origin/path sent through unvalidated `request()` instead of rejecting | `mobile/connection.ts` now runs `validateServer(session.server)` again before adding Authorization, uses the validated canonical origin, rejects dot-segment/percent-encoded normalized or fragment-bearing paths, retains valid HTTPS/LAN/Tailscale. [Mobile GREEN #38899288967](https://github.com/russellstokes-ai/Archivist/actions/runs/38899288967). iOS workflow #38899288994 must be checked at final exact head | Draft Mobile CI verified; physical device and iOS final status to refresh |
| **Earlier server comic GIF (#57)** | [Server RED #38894498595](https://github.com/russellstokes-ai/Archivist/actions/runs/38894498595): legitimate GIF-only CBZ/CBT got 400 | Mirrored `reader.go` and tests recognise safe GIF with decoded-canvas header bounds; [Server GREEN #38894595898](https://github.com/russellstokes-ai/Archivist/actions/runs/38894595898) | Server-only, NOT Android #16 resolved |
| **Earlier Library Manager row click (#58)** | [Isolated RED #38896163057](https://github.com/russellstokes-ai/Archivist/actions/runs/38896163057): `TypeError: choose is not a function` in checkbox handler | Mirrored web manager local variable `selectionCell` no longer shadows selection function, real DOM mock selection/export regression; [Server GREEN #38896160314](https://github.com/russellstokes-ai/Archivist/actions/runs/38896160314), latest doc-head [#38896580993](https://github.com/russellstokes-ai/Archivist/actions/runs/38896580993) also succeeded | Draft CI verified; real 16:9 browser UX pending |

**Critical reviewed-source SHA evolution:** #55 integrated #52 `covers.go` as original reviewed blob `9d082c9468b927e58dd8644d8b42aa1ce94d52ce`. #60 deliberately appended only the WebP header preflight and advanced its exact SHA to `f6381164fb432eb6e50d53199ea1de141b6e7667`; mirrored copies are byte-identical and `mobile/v1-integrated-candidate.test.cjs` was explicitly updated. The original #52 `cover_candidate_fallback_test.go` remains **byte-identical** at `43ee302da3ea6893c33260305f879079814172fa`. Do not overwrite the safer #60 source with the old exact #52 covers.go blob to appease a stale lock. The 46 **canonical** locks are separate and unchanged.

## Newly proven high-risk blockers — Astra owns safe remediation

### P0 — central mobile state-store durability and key namespace, [RED PR #63](https://github.com/russellstokes-ai/Archivist/pull/63)

[Mobile expected-RED #38899466348](https://github.com/russellstokes-ai/Archivist/actions/runs/38899466348), using an entirely mocked filesystem and no user data, reported both:
1. With a **corrupted primary** and **previously valid .bak**, `mobile/stateStore.ts:persistEncoded` deletes the valid backup and copies the corrupted primary over it. A simulated ENOSPC write then leaves no recoverable bookmark. Test error: *last valid backup overwritten by invalid primary*.
2. `fileName(key)` replaces punctuation with the same underscores: distinct keys `archivist/a:b` and `archivist:a/b` resolve to the same file. Test error: *persistence-key filename collision leaked or overwrote another state entry*.

**Risk:** `stateStore.ts` is a shared persistence service also supporting **protected scanner/Assist workflows**. Do not casually change filenames or storage semantics. Astra must design staged durable writes, last-good-backup preservation, isolated versioned/hash-based keys, backward-compatible migration for old files and collisions, power-fail/ENOSPC/secure-store bridge scenarios, concurrency and rollback. Recover already-written data without a silent rescan or disappearing published work. Keep PR #63 quarantined until both RED regressions become GREEN with native device evidence. This is a demonstrated *source-level* risk, **not** an actual user data-loss incident.

### P0 — existing offline media destroyed before replacement, [RED PR #56](https://github.com/russellstokes-ai/Archivist/pull/56)

[Mobile expected-RED #38892078091](https://github.com/russellstokes-ai/Archivist/actions/runs/38892078091) proved the current direct-to-published-file checkpoint flow deletes an existing sentinel chapter before failed network replacement. No temporary staging or atomic publication exists. Astra must preserve existing bytes, use dedicated bounded staging+verified commit, handle partial/resume/crash/disk full, avoid destructive checkpoint/cleanup authority, and prove recovery before release. #54's zero-byte check alone is not the fix.

### P1 — false complete cross-device progress pagination, [RED PR #56](https://github.com/russellstokes-ai/Archivist/pull/56)

[Server expected-RED #38892078164](https://github.com/russellstokes-ai/Archivist/actions/runs/38892078164) proved `LIMIT/OFFSET` could return HTTP 200 with the untouched third progress row silently omitted when an earlier row was deleted between page requests. Astra must implement versioned profile-scoped consistent snapshots/cursors with retry, grants/revision checks, protect outbox and cross-device position. Existing #53 duplicate rejection is insufficient. The mobile outbox is not yet fully wired to player persistence.

## Additional source-reviewed risks (not yet proven on hardware)

| Area and exact source | Risk and required acceptance | Gate |
|---|---|---|
| **Android Auto** — `ArchivistAutoService.kt:onMediaItemTransition`, `persistProgress` | Listener persists after current MediaItem changes, and `persistProgress` reads `player.currentMediaItem/currentPosition`: a prior chapter's position may be attributed to the next one. Executor shutdown does not demonstrate a flush barrier. Instrument old/new identities and oldPosition on real Media3 transitions, interrupts and reconnect before changing the service. | P1, Astra native review |
| **Mobile state** — `stateStore.ts`, `nowSession.ts`, `offlineLibrary.ts` | Rehydration, crash, backup, multi-profile and file identity under lock/unlock/force-stop, with original scanner/Assist state untouched. | P0/P1, Astra |
| **SQLite backup/restore** — `backup.go`, `openDB` | Consistent snapshots and WAL/SHM/restore pending rename phases lack demonstrated full crash/fault-injection and filesystem sync durability. Test on disposable DB for every rename/reboot/disk-full point; preserve .before-restore recovery file and off-device backups. | P0 field acceptance |
| **Server manager** — `web/manage.*` | Existing manager has tables, saved filters and one-file metadata candidates/edit, but full work-level cover/list/grid, field-provenance locks, batch preview/undo and BookOrbit-grade review/health screens are unfinished. Do not fake these with superficial UI. | Wave B incomplete |
| **Server household and media** — `household.go`, `sessions.go`, `reader.go` | Profile grants enforced by middleware; require revocation-under-stream, concurrent search/progress, OPDS pages, public host and CSRF/ingress-origin field tests. No demonstrated active exploit from this source review. | Security acceptance |
| **HA / NAS** — `archivist/config.yaml`, `compose.yaml`, `DOCKER-DEPLOYMENT.md` | Docker media read-only by default; HA maps media/share/backup as RW. Verify write permissions and archive/sort owner approval, missing NAS roots, Pi 4 memory, SSD persistence and ingress/native API separation. Synthetic ARM64 CI is not a real NAS. | Hardware acceptance |
| **Android networking/privacy** — AndroidManifest and app backup config | `usesCleartextTraffic=true` and `allowBackup=true` require explicit security/data retention review against supported private LAN workflow and existing encrypted-credentials/data-extraction rules. Do not disable local access or delete backed-up user data as a shortcut. | Play/privacy gate |
| **Album/art dimensions** — Go cover and archive routes | New WebP bounds are source tested; exercise real animated/lossless/WebP variants, JPEG/PNG high-resolution comic pages, huge RAR and archive-bomb input under Pi load. Bound resource cost without breaking legitimate comics. | Media/perf gate |
| **OPDS pagination** — `opds.go` | Work-level stable cursor + per-page consistent SQLite transaction implemented; cursor is not a cross-request historical snapshot. Verify third-party OPDS clients, concurrent rescans and large permitted/revoked profiles before claiming universal compatibility. | Server test gate |

## Original eight-bug scope — unchanged device acceptance

| Issue | Accepted on Fold? | Truth |
|---|---|---|
| #16 Comics not opening | **No** | Go GIF/CBT support is **server-only**; original 2000AD native SAF/WebView/format failure unresolved |
| #19 Atlas blank | **No** | Existing `App.tsx` publication/source filter mismatch remains diagnostic |
| #25 Living Book disappears | **No** | Renderer frozen; cold-open lifecycle evidence needed |
| #23 unwanted Resume prompt | **No** | Precise Now/reader event reproduction and no-autoplay semantics needed |
| #17 Play/Pause alignment | **No** | Original Lottie artwork/control geometry frozen pending visual device evidence |
| #20 Rewards Lottie freeze | **No** | Original approved rewards/presentation frozen pending real-device frame/timing tests |
| #31 Offline priority and integrity | **No** | Partial draft checks green, direct checkpoint data loss still proven RED |
| #32 PDF stale page | **No** | Session-gated draft fix green, actual PDF A→B→A/Fold tests not done |

Scanner #15 explicitly excluded; both scanners and Archivist Assist remain protected. Do not broaden the original eight reported bugs without owner consent. Source fixes/CI do not convert any of the eight to device-accepted.

## Official distribution requirements verified 16 October 2026

- **Google Play new apps and updates:** target Android 16 / **API 36** from 31 August 2026, excluding different device categories such as Android Automotive OS; verify the mobile build's compiled `targetSdkVersion`, not just the presence of `android-36` SDK. [Official Play target API policy](https://support.google.com/googleplay/android-developer/answer/11926878).
- **Native libraries:** Android / Play 16 KB page-size compatibility remains mandatory for affected 64-bit native dependencies; validate uncompressed packaging alignment and **ELF segment** alignment as separate checks, including RAR/native reader/react-native libs on a 16 KB device/emulator. [Official Android 16 KB guide](https://developer.android.com/guide/practices/page-sizes).
- **Android Auto media:** MediaLibraryService/browsable audio and MediaSession already exist, but safety, spoken commands and no unsolicited playback must conform to car-media quality requirements and actual car/head-unit acceptance. [Official guide](https://developer.android.com/training/cars/media/auto), [car app quality](https://developer.android.com/docs/quality-guidelines/car-app-quality).
- **Testing:** if this is a **new personal Play developer account** created after 13 November 2023, production access requires a closed test with at least 12 opted-in testers for 14 continuous days. Do not assume the account falls into this group. [Official Play testing guidance](https://support.google.com/googleplay/android-developer/answer/14151465).

No production signed AAB, complete privacy policy/Data Safety/licence declarations, 16 KB device proof, Play prelaunch or actual Play acceptance evidence exists in this review.

## Commercial GO/NO-GO and next Astra execution

**GO:** disposable standalone Docker/HA server smoke and mirrored Go media/OPDS test candidate after verified exact-head CI, isolated phone *development* test cases without changing trusted user data.

**NO-GO:** live family database restore, commercial server deploy, public internet exposure, merge/release/signed AAB, final Play submission, or representing the eight bugs as fixed. Four proven source-level integrity problems are open: #56 P0 offline media deletion, #56 P1 progress omission and #63 two P0 shared state-store risks.

**Owner-approved action model:** First Astra makes the #56 and #63 RED tests green on isolated safe branches, preserving all existing offline and local metadata; then diagnoses/repairs six original protected mobile bugs with separate scoped authorisations and real Fold acceptance. After complete advanced server admin, Pi/NAS/Android Auto and Play requirements, perform a controlled integrated signed device candidate and an explicit release decision. Preserve branch/CI/rollbacks and append exact SHA, hardware evidence and decisions to `DEVELOPMENT_STATUS.md`, `DEVELOPMENT_STATUS.json` and `DEVELOPMENT_LOG.md`.

**Never:** overwrite approved canonical, remove protected fonts/layouts/renderers, touch the two scanners or Archivist Assist in an incidental fix, merge known-RED test branches, bypass destructive operations by deleting media, or claim commercial completion from CI alone.
