# Archivist v1 — safety, bug-fix and first-test gate
**16 October 2026 — draft engineering/acceptance plan for PR #55.**
**This is not a production release, APK, permission to edit protected UI/scanners, or evidence of physical device acceptance.**

## Source and integration state

- Approved canonical full-app reference `df4c39b44394d8c512ca0298bffa7f19da356490`; protected development baseline `72bbf177aecc92f31724b48c6cf11a7eddd7a216`.
- [PR #55](https://github.com/russellstokes-ai/Archivist/pull/55) starts from unmerged [PR #54](https://github.com/russellstokes-ai/Archivist/pull/54), which includes the unmerged #53 and #40–51 chain. It brings from separate sibling [PR #52](https://github.com/russellstokes-ai/Archivist/pull/52) the **exact unmodified blobs** of root/packaged `covers.go`, root/packaged `cover_candidate_fallback_test.go` and `ASTRA_REVIEW_QUEUE.md`.
- The distinct #52 and #53 review queues are both present. This is **one isolated draft test candidate, not a merge of existing PRs**, and does not include a solution for dangerous P0/P1 defects. Both scanners, Archivist Assist, canonical App.tsx, Living Book, Comic Focus, Atlas, Stats, Rewards, logos, fonts, approved Lotties and 46 hashes remain protected. Existing working state is still recoverable without using this draft.
- [PR #56](https://github.com/russellstokes-ai/Archivist/pull/56) is a **separate quarantined test-only branch** with expected-RED reproductions for offline data loss and progress-pagination omission. Do not mistake it for a replacement of PR #55 or merge it before its regressions are GREEN.

## 1 — P0 offline media integrity: not yet safe for release

**Confirmed unsafe source path:** `mobile/offlineLibrary.ts`, compatible-checkpoint preflight and mismatch deletion before downloading. A stale checkpoint may lead to `deleteAsync(uri)` for a pre-existing, potentially intact chapter before a server HTTP response is received. Unverified partial-file resume also poses an overwrite hazard. `removeOfflineCheckpoint` currently assumes the checkpoint owns a direct-child file; test ownership before deleting any real media.

**Repro:** PR #56 `mobile/offline-checkpoint-data-loss.test.cjs`: original sentinel media, compatible stale checkpoint, server length disagreement, simulated network failure; assert original bytes and checkpoint survive. This is intended RED on the existing source; record *actual* workflow outcome, not an assumed failure.

**Safe fix design for independent Astra review:**
1. Treat existing canonical offline media paths as immutable unless the user deliberately removes an offline work. A stale checkpoint alone is not deletion or overwrite authority.
2. Download fresh bytes to a distinct, bounded, work-scoped temporary file; continue partial transfers **only** when the token and staging identity are attested. A resumed transfer must never write into a published file.
3. Validate the destination by nonzero length, exact length when known, HTTP response/range semantics, and cryptographic digest when authoritative; preserve preexisting content on every failure. A size-only check is not full integrity.
4. Update the durable work manifest and checkpoint via an explicitly ordered commit process, with crash/restart recovery, a single active writer per work, fsync/rename guarantees on supported filesystem and rollback if the platform cannot atomically replace. Never clear the checkpoint before durable publication succeeds.
5. Reconcile orphaned/staged files by reference tracking, never automatic deletion based only on filenames. Verify disk-full, stop/pause/resume, new server version, missing server, same-length corruption, multi-track partial success and reboot; real Android filesystem/SAF lifecycle acceptance essential.

**Stop rule:** an incomplete or ambiguous transaction must leave user media and saved progress recoverable; no 'remove the old file and retry' shortcut. This P0 fix remains pending until Astra verifies design and RED/GREEN evidence.

## 2 — P1 cross-device progress pagination: snapshot consistency unresolved

**Confirmed source limitation:** `sync_progress.go` and mirrored `archivist/app/sync_progress.go` use separately executed `ORDER BY kind,id LIMIT/OFFSET` statements. Mutations or grant changes between HTTP pages shift the offset, which can silently skip an unchanged progress entry. Duplicate detection added in #53 catches duplicates, not silent omissions.

**Repro:** PR #56 mirrored `sync_progress_concurrent_pages_test.go` opens 2 entries, deletes a preceding authorised row, then reads the next page. **Acceptable:** 409 snapshot invalidation/retry, or a continuation that still includes the untouched third item; **unacceptable:** HTTP 200 success omitting that position. Follow with parallel inserts/deletes, revocation, mixed progress types, two profiles and large libraries.

**Correctness contract:** choose one bounded implementation: stable cursor + server-side generation/snapshot token, or an authenticated, bounded snapshot transaction/cache with expiration, profile-scoped auth and explicit conflict invalidation. A simple keyset change without a coherent snapshot/revision does not establish consistency under grants and updates. Client must retry on stale snapshot without dropping any local outbox, and all replay writes require existing server revision checks. No unconditional 'remote missing = delete local' rule.

**Stop rule:** no user-facing sync completion claim until two devices and concurrent/restart scenarios pass real integrated tests.

## 3 — The six still-open original mobile bugs (diagnose first; protected code approval required)

| Bug | Source evidence and verification requirement | Narrowest permitted next step |
|---|---|---|
| **#16 Comics fail to open** | `mobile/localReader.ts:19–32` routes by recognised format; unknown formats return raw URI. `mobile/App.tsx:6185–6190` opens raw URI in generic WebView. A misclassified archive *could* cause ERR_ACCESS_DENIED. Original 2000AD Annual 1978 media failure is **not reproduced** by this static evidence. | Collect actual track format, extension, original vs persisted content URI, SAF grant state and decoder failure. Reproduce CBZ/CBR/CBT/comic PDF without changing Comic Focus or scanners. Propose narrowly isolated classification/opening adjustment, then request explicit approval for protected wiring. |
| **#19 Atlas is blank** | `mobile/App.tsx:1531–1543` applies `scannerPublished` to local works before Atlas, separate from Library/Shelf. A mismatch is plausible but not verified for actual records. | On installed build, log/compare counts and stable IDs for published Library works, `sourceWorks`, `atlasRelationshipWorks`, space filter and Universe nodes. Missing genre/year should not drop otherwise valid works. No Atlas layout/animation change. |
| **#23 Unwanted resume prompt** | `mobile/App.tsx:3417–3435` restores saved Now session, `:3785–3820` handles reader opening and local saved pages; server/client progress outbox is not wired. These paths do not establish which prompt was seen. | Record the exact popup trigger on app-open vs explicit Now/Reader open, saved position/track and autoplay state. Specify separate semantics for audio (never unexpectedly autoplay) versus book/comic (open at saved page); approve only specific lifecycle change, not UI replacement. |
| **#25 Living Book initially disappears** | `mobile/App.tsx:5942–5954` passes book phase/cover into locked `LivingBookCanvas`. Code review alone cannot establish WebView mount/cover readiness race. | On phone/Fold cold open: capture current phase, cover decision, WebView ready/animation lifecycle before and after Play/Pause. Propose minimal timing fix outside renderer if possible; protected changes need approval. |
| **#17 Play/Pause misalignment** | `mobile/LivePlayerPlayPauseMorph.tsx` currently compensates for art-centre using `PLAY_PAUSE_VISIBLE_OFFSET_X=10`, Y=3; `App.tsx:5995–6018` keeps the five-control row. | Compare optical glyph centre of play and pause frames across Fold open/closed with unchanged 80dp touch target, adjacent controls and Lottie source. No speculative offset changes from source analysis. |
| **#20 Rewards Lottie freezes/blank** | `mobile/AchievementRewardOverlay.tsx` uses `autoPlay`, conditional final-frame `progress` and completion callback; dismissal duration comes from `rewardMotion.ts`. Both render code and approved files are protected. | Reproduce each asset on target Android device: initial mount, fast sequential reward reveals, background/foreground, reduced-motion and end-frame hold. Verify frame callback and source visibility; approve minimal lifecycle correction only. |

**None** of these six is fixed or accepted on the target Fold. Do not reinterpret this diagnosis as authority to change `App.tsx` or any other protected implementation.

## 4 — Existing drafted fixes that still require Android acceptance

- **#31 Offline priority:** draft #41/#50/#54 tests address selection, damaged-size fallback and zero-byte completion. The P0 overwrite/deletion path is separately **open**. Real internet connected/disconnected/slow, force-stop, disk-full, interrupted downloads and same-length corruption must be verified before acceptance.
- **#32 PDF switching:** draft #49 isolates document URI/generation/page and stale native responses; validate real PDF A→B→A rapid switches, saved page, resize, background, force-stop and revoked URI permission on the Fold.
- Source lock/CI success ≠ resolved user report ≠ signed APK provenance ≠ deployment.

## 5 — Is the server ready? Separate *smoke test* from *commercial acceptance*

**Standalone Docker development QA:** the checked-in `compose.yaml` uses one Go server core with `archivist/Dockerfile`, a separate `/data` volume and read-only, validated media mounts. Start **only with disposable copies of media** after exact PR #55 Go AMD64/ARM64 + Docker CI completes. Follow `DOCKER-DEPLOYMENT.md`: verify host `ARCHIVIST_MEDIA_PATH` exists, `docker compose config`, `docker compose up -d --build`, health, authenticated metadata/streaming, restart and backup/export. Never open port 5056 to the public internet.

**Home Assistant / Pi 4 and NAS field QA:** still **not accepted**. Test actual Pi 4 4GB/SSD, HAOS aarch64 packaging and ingress, standalone local API, owner grants, three library roots, CBR/CBZ/CBT/EPUB/PDF/audio, 10k-file load, disk full, reboot and detached SMB/NFS. Validate ARM64 peak RAM, mount-loss behaviour and database restoration using a disposable backup; require source/root parity and no accidental library disappearance. For NAS, Synology/QNAP/TrueNAS/Unraid installs are target platforms, not currently certified outcomes.

**Commercial server UI:** full BookOrbit-level library administration, filters/saved views, metadata workbench, bulk editing/undo and source audit UX are **not yet demonstrated complete**. Passing backend CI or Docker smoke does not make them production-ready.

**Mobile/Android Auto:** no integrated signed test APK/AAB was produced by this branch; the owner's installed build SHA remains unknown. Android Auto has a service foundation but lacks real head-unit and car voice/audio-focus acceptance.

## Test decision / release gate

| Candidate | Decision | Why |
|---|---|---|
| PR #55 isolated integration source + server CI | **Conditional test candidate** | Go cover fallback combined with #53/#54 client guards; full exact-head CI, locks and Android device pending |
| PR #56 RED integrity reproductions | **Quarantined test-only** | Known-open P0/P1 defects: intentionally not safe to merge or ship |
| Disposable standalone Docker media smoke | **Eligible after green integrated Server CI** | Does not use real family data or claim NAS/Pi certification |
| Pi 4/HA and real NAS | **QA pending** | Hardware, filesystem, restore and load acceptance required |
| Fold APK with all eight bugs accepted | **NOT YET** | Six original bugs open, remaining two unaccepted; no integrated signed APK |
| Commercial v1.0 Google Play/server release | **NO-GO** | Data safety, metadata, server UX, automotive and Play acceptance incomplete |

**Approvals:** owner explicitly authorised safety review, targeted bug work and a draft integrated candidate. There is **no** blanket approval to alter protected source, merge/overwrite canonical, install APK, migrate personal data or release.
