# Archivist v1.0 — Append-Only Development & Protection Log

**Purpose:** A chronological record of work done against the **immutable canonical source**, distinct from bug acceptance and from commercial feature work. Add a dated entry for each new PR, audit, acceptance or rollback. **Never delete a historical entry, rewrite a failure as a success, or imply an unmerged draft was installed.** Current state is in [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md) and [DEVELOPMENT_STATUS.json](./DEVELOPMENT_STATUS.json).

## Immutable context (recorded 15 Oct 2026)

- Original approved reference: `df4c39b44394d8c512ca0298bffa7f19da356490` (`canonical/archivist-20261011-df4c39b`).
- Development baseline: `72bbf177aecc92f31724b48c6cf11a7eddd7a216` (`dev/archivist-v1-protected-20261013`).
- 46 exact protected blobs: `docs/v1/PROTECTED_BLOB_LOCKS.json`, source basis `131cabdc82ce7c6d6b36e0034540184bd990a3ab`; extra reader/archive/gesture source locks apply.
- Owner's installed APK SHA **unverified**. No production merge/deployment/release authorised.
- User's eight active bugs are #16, #19, #25, #23, #17, #20, #31, #32. **#15 and every scanner change are excluded.** Both scanners and Archivist Assist frozen, as are canonical layout and approved renderers/animations.
- PRs #40–#50 form one **stack of DRAFT UNMERGED** changes, not independent production releases. Branch baselines were chosen to avoid altering canonical.
- A source diff measures **net changed files**, not physical user acceptance. Do not claim every intermediate experiment was untouched if later reverted.

## Historical record — draft implementation chain

The following rows capture the existing PRs as **unmerged source-level work**, not a completed feature or accepted bug. All issue-specific acceptance remains tracked in the [status register](./DEVELOPMENT_STATUS.md).

| Date | PR / source milestone | Lane | What actually changed | Outcome at 15 Oct and remaining gate |
|---|---|---|---|---|
| 2026-10-13 | [#40](https://github.com/russellstokes-ai/Archivist/pull/40) `be67e57` | Commercial work | Standalone Docker/NAS setup, guarded LAN connection, HA/server health, Android Auto progress safety | Draft, unmerged. Automated checks passed within final stack; real NAS/Pi, Auto and data-recovery acceptance not complete. Server **admin manager** gains storage-health UI, but canonical mobile layout untouched. |
| 2026-10-14 | [#41](https://github.com/russellstokes-ai/Archivist/pull/41) `ffc9ae1` | Bug #31 | Offline media retention and offline-first source preference | Draft, unmerged; later strengthened in #50. Device disconnect/reconnect not accepted. |
| 2026-10-14 | [#42](https://github.com/russellstokes-ai/Archivist/pull/42) `026cc88` | Commercial reliability | Prevented inflated listening time when rewinding/changing chapters | Draft, unmerged; real playback statistics acceptance pending. |
| 2026-10-14 | [#43](https://github.com/russellstokes-ai/Archivist/pull/43) `52884fb` | Commercial metadata | Server-only PATCH review-state partial-save validation | Draft, unmerged; **not** a mobile scanner or Archivist Assist fix. |
| 2026-10-14 | [#44](https://github.com/russellstokes-ai/Archivist/pull/44) `2d62ea8` | Commercial server/CBT | Server TAR comic page regular-member and safety bounds | Draft, unmerged; **not** solution for #16 mobile white reader. |
| 2026-10-14 | [#45](https://github.com/russellstokes-ai/Archivist/pull/45) `6127741` | Commercial safety | Cover JPEG/PNG/GIF dimension preflight | Draft, unmerged; WebP dimension preflight not claimed. |
| 2026-10-14 | [#46](https://github.com/russellstokes-ai/Archivist/pull/46) `1d9d350` | Commercial sync | Profile/grant-scoped paginated progress snapshot | Draft, unmerged; read-only server foundation, not full cross-device sync. |
| 2026-10-14 | [#47](https://github.com/russellstokes-ai/Archivist/pull/47) `9e270e0` | Commercial sync | Durable-storage-compatible outbox and conflict planner | Draft, unmerged; **not wired into** locked mobile player; no automatic conflict merge. |
| 2026-10-14 | [#48](https://github.com/russellstokes-ai/Archivist/pull/48) `345fda5` | Bug #16 diagnosis / scope control | More precise comic WebView vs media permission error text and eight-bug scope | Draft, unmerged; **root comic opening fault not fixed**. An attempted archive decoder change was reverted completely after an extra source lock was detected. |
| 2026-10-15 | [#49](https://github.com/russellstokes-ai/Archivist/pull/49) `f80bd80` | Bug #32 | PDF per-URI/generation state, page render/request race protection, saved page recovery | Draft, unmerged; Mobile [#38652709504](https://github.com/russellstokes-ai/Archivist/actions/runs/38652709504) **passed**, iOS [#38652709505](https://github.com/russellstokes-ai/Archivist/actions/runs/38652709505) **passed**. Real PDF/Fold restart acceptance pending. Original PDF JSX/style tree preserved. |
| 2026-10-15 | [#50](https://github.com/russellstokes-ai/Archivist/pull/50) `ea2222c` | Bug #31 | Verify positive/matching lengths; preserve intact partial downloads; prefer local when server reachability is unconfirmed; test online/offline/partial/empty/truncated/restore matrix | Draft, unmerged; Mobile [#38655627405](https://github.com/russellstokes-ai/Archivist/actions/runs/38655627405) **passed**, iOS [#38655627435](https://github.com/russellstokes-ai/Archivist/actions/runs/38655627435) **passed**. Still requires device acceptance. Reachability flag not yet wired in locked `App.tsx`; don't say it is. |

## 2026-10-15 — Canonical/source protection comparison and log installation

**Reason:** User explicitly requested that **progress versus canonical versus bug fixes versus Work/commercial development** be logged and documented; this entry captures the first controlled audit.

**Compared:** Frozen protected baseline `72bbf177aecc92f31724b48c6cf11a7eddd7a216` to final PR #50 head `ea2222c6ee15272185aae1ca2567e8ae7a87227e` using GitHub commit comparison.

**Result:** 122 commits ahead, zero behind, 65 files currently different; **zero of 46 blob-locked paths different**. Scanner, Archivist Assist, canonical `mobile/App.tsx`, `mobile/localReader.ts`, `mobile/archiveReader.ts` and approved Living Book/Comic Focus/Atlas/Rewards/icon/motion source files do **not** appear in final net changed path list. Later local PDF implementation, offline source helpers and Android Auto backend module **do** appear and are documented. Confirmed last two draft PR CI (mobile + iOS) passed.

**Documented distinctions:** #16 and #19 are diagnosis-only; #17/#20/#23/#25 remain unfixed; #31/#32 have draft code with automated tests but **none** of the eight has Fold/device acceptance. Work tracks server Docker/NAS, listening/server metadata, server archive and cover safety, partial sync scaffolding, Android Auto and Google Play separately.

**Preservation decision:** Neither scanner, Archivist Assist nor canonical mobile layouts may be changed. Any intentional exception to protected functionality requires specific user approval *before* a narrow patch. Documentation-only branch `docs/archivist-v1-state-ledger-20261015` is **not a source promotion**, not an APK, not a merge. Any later head/runs must be re-queried and this snapshot updated.

## 2026-10-15 — Draft PR #51: auditable status ledger and automated immutable-source checks

- **Lane:** documentation / source-integrity protection, **not** a bug fix or UI feature.
- **Before:** development head of #50 `ea2222c6ee15272185aae1ca2567e8ae7a87227e`; canonical reference `df4c39b44394d8c512ca0298bffa7f19da356490` unchanged.
- **After:** isolated documentation branch `docs/archivist-v1-state-ledger-20261015`, draft [PR #51](https://github.com/russellstokes-ai/Archivist/pull/51) stacked on #50. No merge/production artifact.
- **Source diff:** `docs/v1/README.md`, `docs/v1/DEVELOPMENT_STATUS.md`, `docs/v1/DEVELOPMENT_STATUS.json`, this append-only log, a clarifying cross-link in the original eight-bug scope, and **one new non-UI test**, `mobile/development-ledger.test.cjs`.
- **Protection:** 46 stored source/blob SHA-1 values are individually rechecked; the current recorded upstream code diff already shows zero locked changes. No scanner, Archivist Assist, App.tsx, renderer, graphic or existing test changed by this documentation PR.
- **CI:** documentation PR #51 full mobile and iOS workflow results must be captured after completion; do not premark them as passed.
- **Acceptance:** no device-level or release gates advanced; all eight user bugs retain their earlier status.
- **Next gate:** verify PR #51 mobile/iOS CI; the index and manifest must be updated for future PRs, and the log must only **append** new events, including failures and corrections.

## 2026-10-16 — User-directed full-stack robustness audit; difficult items assigned to Astra

- **Lane:** read-only inspection + bounded commercial server fix, **not** a scanner, Assist, UI or installed-device fix.
- **Before:** documentation PR #51 `70921ca808940f65e6e409fedb74251c194297dd`; canonical `df4c39b44394d8c512ca0298bffa7f19da356490` and protected baseline `72bbf177aecc92f31724b48c6cf11a7eddd7a216` remain preserved.
- **Audit scope:** Reviewed draft chain #40–#51 implementation and tests across Go/SQLite server, network/offline media, PDF, progress sync, Android Auto, cover decoding, recovery and historic protected bug workflows. Did **not** claim exhaustive dynamic/real-device test coverage.
- **Review queue:** New [ASTRA_REVIEW_QUEUE.md](./ASTRA_REVIEW_QUEUE.md) records **13 prioritised** source/evidence findings with file/line links, independent reproductions and protection boundaries. Main difficult issues: stale checkpoint can remove recoverable offline media (#31), unknown comic routing (#16), Atlas published-data discrepancy (#19), nontransactional progress pagination, PDF effect timing, incomplete reachability integration, Android Auto track transition, WebP raster budget, SQLite power-loss restore and missing Pi/media acceptance. Findings labelled code-confirmed vs plausible, never marked device accepted.
- **Source protections:** No scanner, Archivist Assist, `mobile/App.tsx`, Living Book, Comic Focus, Atlas/Rewards, approved art/fonts/Lotties or extra archive source hashes changed.

## 2026-10-16 — [Draft PR #52](https://github.com/russellstokes-ai/Archivist/pull/52): archive artwork fallback ROOT CAUSE reproduced RED → GREEN

- **Lane:** isolated **commercial Go server** robustness fix, **not** mobile comic opening #16.
- **Development source checkpoint:** `005979d3fdd12a24ad6fc75de871bd9366b4eb2c` (code + server regression test; later documentation commits advance the draft PR head and do not alter that checkpoint's test meaning).
- **Before:** `archiveCover` in `covers.go` and mirror returned `safeImageData` error from the **first corrupt candidate**, even with valid later artwork. The fault occurred in ZIP comics, CBT/TAR and EPUB named cover / illustration fallback. CBR's first-page-only lookup followed the same basic error pattern.
- **Verified RED:** [GitHub Actions #38875572510](https://github.com/russellstokes-ai/Archivist/actions/runs/38875572510) server-check **failed in the expected test** for corrupt-first comic ZIP, CBT TAR, EPUB and missing fallback; ARM64 smoke passed.
- **Minimal implemented fix:** bounded maximum of **64 candidate attempts**; continue after invalid/truncated/unsafe image; prefer a **validated dedicated EPUB cover** over earlier fallback illustration; reject all-corrupt archives; enforce 10,000 ZIP/TAR member limit; retry valid CBR candidate names, while retaining existing archive read budgets. Root `covers.go` and `archivist/app/covers.go` blobs verified identical.
- **Verified GREEN:** [GitHub Actions #38876055497](https://github.com/russellstokes-ai/Archivist/actions/runs/38876055497) completed **AMD64 server-check PASS and ARM64 smoke PASS** on exact code/test checkpoint `005979d3...`.
- **Actual changed code/tests vs PR #51:** `covers.go`, `archivist/app/covers.go`, `cover_candidate_fallback_test.go`, `archivist/app/cover_candidate_fallback_test.go`. Plus new Astra review queue and current audit docs. **Zero of 46 protected paths** changed; neither scanner nor mobile renderer touched. Compared protected baseline to `005979d3...`: **138 commits ahead, zero behind, 73 net changed paths**, zero protected changed.
- **Acceptance remaining:** real RAR4/RAR5, corrupt archive variants, large library/Pi memory and actual media cover quality. No APK, no merge, no deployment, no final device acceptance.
- **Rollback:** unchanged canonical `df4c39b` and protected `72bbf177`; draft PR #52 stacked on documentation draft PR #51.
- **Decision:** simple, independently tested server fix retained as DRAFT; difficult data-loss/architecture/device issues explicitly deferred to Astra independent review with **no permission to touch protected source**.

## New event entry template (append on every subsequent change)

```markdown
## YYYY-MM-DD HH:MM timezone — PR #NN / change type

- **Lane:** canonical protection / bug #N / separate commercial Work / audit / release acceptance
- **Before:** development base branch + full SHA; canonical reference remains df4c39b…
- **After:** branch + full SHA; draft/open/merged/released must be accurately stated
- **Original problem / acceptance target:** link to approved issue / workstream
- **Cause verified:** evidence vs hypothesis; original reproduction and media details
- **Actual source diff:** filenames and whether 46 + extra source locks passed
- **CI:** exact run IDs, each status, test failures corrected (if any)
- **Physical acceptance:** untested / failed / passed with exact device, artifact SHA/version, media and steps
- **Risk / next gate:** exact remaining work and protected-code approval boundary
- **Rollback:** unchanged canonical branch SHA, tested comparison/restore route
- **Decision:** draft-only / approved integration / deployed; explicit owner approval link if necessary
```

Never use a blank/placeholder pass, guessed APK SHA, hypothetical merge or stale CI status to advance any acceptance state.
