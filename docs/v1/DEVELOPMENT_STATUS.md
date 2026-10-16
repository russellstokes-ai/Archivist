# Archivist v1.0 — Development State & Release Gate

**Single current-status entrypoint · audited 15 October 2026.** This is a **point-in-time snapshot**, not a live dashboard. It differentiates the approved canonical app, protected development baseline, unmerged bug-fix candidates, separate commercial feature work and on-device acceptance. The machine-readable source is [DEVELOPMENT_STATUS.json](./DEVELOPMENT_STATUS.json); retain every historical change in the [append-only development log](./DEVELOPMENT_LOG.md).

> **IMPORTANT: No work in PRs #40–#50 has been merged, installed or released.** A passing CI job is not evidence that an issue has been fixed on the owner's Fold. Do not use this file as approval for changing locked code.

## 16 October 2026 — live sibling reconciliation and isolated offline guard (draft #54)

- **Live verified sibling branches:** [PR #52](https://github.com/russellstokes-ai/Archivist/pull/52) at `998278e86907df68b97d40d7caa3b9b3ca0794cd` (Mobile [#38876993016](https://github.com/russellstokes-ai/Archivist/actions/runs/38876993016), Server [#38876992988](https://github.com/russellstokes-ai/Archivist/actions/runs/38876992988), iOS [#38876992947](https://github.com/russellstokes-ai/Archivist/actions/runs/38876992947) all successful) and [PR #53](https://github.com/russellstokes-ai/Archivist/pull/53) at `b7234e3f9c884aff83bcf3e29bb690c865303979` (Mobile [#38885442466](https://github.com/russellstokes-ai/Archivist/actions/runs/38885442466) and iOS [#38885442378](https://github.com/russellstokes-ai/Archivist/actions/runs/38885442378) successful). They diverge at draft PR #51; neither includes the other's fix. No merge authorised.
- **[Detailed reconciliation and acceptance plan](./PR52_PR53_RECONCILIATION_2026-10-16.md):** source comparison, protected boundaries, both Astra queue preservation, reproducible P0 checkpoint-deletion and P1 concurrency scenarios, and a future *approval-gated* integration proposal. Risk remains **open**; there has been no destructive source change or scanner/Assist change.
- **[PR #54](https://github.com/russellstokes-ai/Archivist/pull/54)** is a new draft **based on PR #53 only**. Within existing approved bug **#31**, a synthetic HTTP 200 response returning **zero bytes** with no declared size must not be accepted as an offline-complete chapter. Source `mobile/offlineLibrary.ts` now refuses that single invalid completion, preserves its checkpoint, and adds an adversarial regression in `mobile/offline-library.test.cjs`. Production guard checkpoint: `3c66fc824e9bca0eee39374ddffddc8ce119fb03`. It does **not** repair the unrelated potential data-loss recovery path.
- **Evidence caveat:** the regression-only commit `12e25eaccc1c2f8faa3a89dac55a6475e99d4cbd` would reject the prior zero-byte acceptance, but its Mobile workflow was cancelled when later commits superseded it. Do not claim a verified RED run. **Final PR #54 CI, device acceptance and all eight user-bug release statuses remain pending.**
- **Preservation:** protected compare against `72bbf177aecc92f31724b48c6cf11a7eddd7a216` excludes 46 locked files on both sibling heads. The new draft edits only the unprotected offline helper/test and development docs. Required hash tests/CI must be checked on final #54 head. Original approved canonical `df4c39b44394d8c512ca0298bffa7f19da356490` and installed APK provenance remain separate.

## 16 October robustness audit — pending verification

**New draft [PR #53](https://github.com/russellstokes-ai/Archivist/pull/53)** is stacked on the documentation [PR #51](https://github.com/russellstokes-ai/Archivist/pull/51). It is **not merged, released or device-accepted**. The prior CI-green implementation snapshot remains **PR #50**; this new audit's CI is pending.

- **[Astra review queue](./ASTRA_ROBUSTNESS_REVIEW_QUEUE.md):** ten independently verifiable robustness concerns, prioritising potentially destructive offline checkpoint handling and inconsistent paginated progress snapshots.
- **One small, isolated source correction:** `mobile/progressReconciliation.ts` now fails closed if the replay planner receives duplicate server progress records instead of silently using the last entry. A regression test checks duplicate IDs carrying different revisions. **No claim of successful CI until the exact audit head passes.**
- **Preservation:** Both scanners, Archivist Assist, canonical mobile UI/App.tsx, Living Book, Comic Focus, Atlas/Rewards and approved assets remain unchanged by this draft. Riskier issues are logged for Astra, not patched by guesswork.
- **Status semantics:** Current source SHAs, releases, user-installed APK provenance and device acceptance remain separate; a successful unit test does not close the eight reported bugs.

## 1. Which state is which?

| Lane | Git source or evidence | Meaning / permission |
|---|---|---|
| **Canonical — preserve** | Original approved reference [`df4c39b44394d8c512ca0298bffa7f19da356490`](https://github.com/russellstokes-ai/Archivist/commit/df4c39b44394d8c512ca0298bffa7f19da356490), branch `canonical/archivist-20261011-df4c39b` | Original accepted full-app reference. Do not merge onto, rewrite or tag as production. |
| **Source-lock basis** | `131cabdc82ce7c6d6b36e0034540184bd990a3ab` | Later test source recorded in `PROTECTED_BLOB_LOCKS.json`; **not automatically identical to the user's installed APK**. |
| **Protected development baseline** | `dev/archivist-v1-protected-20261013` at **`72bbf177aecc92f31724b48c6cf11a7eddd7a216`** | Frozen comparison parent for draft development. Protects 46 source/assets via `PROTECTED_BLOB_LOCKS.json`, plus additional reader archive/gesture locks. |
| **Current unmerged development stack** | Draft [PR #50](https://github.com/russellstokes-ai/Archivist/pull/50) head **`ea2222c6ee15272185aae1ca2567e8ae7a87227e`** on `fix/archivist-offline-integrity-fallback-20261015` | Contains PRs #40–#50 stacked on the protected baseline. **Not canonical, not accepted/released.** |
| **Current documentation branch** | `docs/archivist-v1-state-ledger-20261015` | This documentation and consistency checks only; still draft and unmerged. |
| **Installed phone APK** | **Source SHA/package provenance not verified** | Do not assume it comes from the canonical or draft branch. No device-level pass can be claimed without identifying its build. |
| **Approved requirements, not code** | [Master Plan (12 Oct)](https://github.com/russellstokes-ai/Archivist/blob/plan/archivist-v1-master-2026-10-12/docs/ARCHIVIST_V1_MASTER_DEVELOPMENT_PLAN_2026-10-12.md) on `plan/archivist-v1-master-2026-10-12` | Original commercial v1.0 work plan; later explicit **eight-bug restriction and source locks supersede broader historical issue suggestions**. |

The final consolidated scope is [ORIGINAL_BUG_BACKLOG_2026-10-14.md](./ORIGINAL_BUG_BACKLOG_2026-10-14.md). **#15 scanner reliability is excluded** despite appearing in the original historic bug list. Both scanners, Archivist Assist and the existing canonical mobile layout are **frozen**. Reading protected code or running unchanged tests does not authorise altering it.

### Current net-diff protection audit

GitHub compare `dev/archivist-v1-protected-20261013...ea2222c6ee15272185aae1ca2567e8ae7a87227e` reported **122 commits ahead / zero behind / 65 net changed files**. Of the **46 blob-locked paths, zero were changed**. Net changed paths also exclude either mobile scanner, Archivist Assist, `mobile/App.tsx`, `mobile/localReader.ts`, `mobile/archiveReader.ts`, the canonical Living Book/Comic Focus renderers, Atlas/Rewards components, brand icons and Lottie assets. This is a **net source-diff and automated-test statement**, not a guarantee about every abandoned intermediate experiment or behaviour on hardware.

An earlier proposed CBT archive-decoder modification was **fully reverted** because the additional existing SHA-lock test required that source to remain identical. Do not weaken that test. Server-only `web/manage.js` was changed in PR #40 to show NAS storage health; it is **not** the mobile canonical UI, but it is a real functional difference.

**Latest verified CI at PR #50 head:** [Mobile checks #38655627405](https://github.com/russellstokes-ai/Archivist/actions/runs/38655627405) **passed**, [iOS checks #38655627435](https://github.com/russellstokes-ai/Archivist/actions/runs/38655627435) **passed**. These test the draft code, not an installed Fold or signed Play build.

## 2. Actual original bug-fix progress — only eight active issues

**Status vocabulary:** *Diagnosed only* = hypothesis/trace but no source-level root cause accepted; *Open* = unresolved; *CI green, draft only* = code has tests but is not merged or device accepted; *Device accepted* = exact original symptom is proven absent with representative files on target hardware; *Released* = approved built/released artifact. **None of these eight is marked device accepted or released.**

| Issue | Actual status on 15 Oct | Evidence / draft code | Remaining acceptance / dependency |
|---|---|---|---|
| [#16 Comics won't open](https://github.com/russellstokes-ai/Archivist/issues/16) | **Diagnosed only — open** | [#48](https://github.com/russellstokes-ai/Archivist/pull/48) classifies WebView-origin versus SAF/file errors. Existing locked `localReader.ts` could route a misclassified `Unsupported` archive to the generic URI WebView. **This is a hypothesis, not a proven cause.** | Reproduce `2000AD Annual 1978`, inspect verified classification/URI access; CBR, CBZ, CBT, comic PDF open, page, restart. No scanner/Comic Focus changes without narrow approval. |
| [#19 Atlas blank](https://github.com/russellstokes-ai/Archivist/issues/19) | **Diagnosed only — open** | Locked `App.tsx` applies a scanner-published-track filter after Library/Shelf source formation. A catalogue/filter mismatch *may* exclude otherwise valid published works. Synthetic Atlas tests do not prove data flow. | Compare published logical work counts at each existing data stage; populate actual Atlas with same **valid published** catalogue, preserve Universe/charts/renderer. Protected `App.tsx` wiring requires specific approval if change essential. |
| [#25 Living Book disappears](https://github.com/russellstokes-ai/Archivist/issues/25) | **Open** | No current draft change to renderer | Reproduce cold initialisation/timing, correct without replacing renderer or geometry; phone/Fold no Play/Pause workaround. |
| [#23 Unwanted Resume prompt](https://github.com/russellstokes-ai/Archivist/issues/23) | **Open** | #46/#47 provide *sync scaffolding only*, not automatic Resume/no-autoplay change | All books/comics/audiobooks reopen at durable position after process death/reboot without prompt or audio autoplay. Protected player wiring needs approval if modification required. |
| [#17 Play/Pause misalignment](https://github.com/russellstokes-ai/Archivist/issues/17) | **Open** | Existing prior QA branch contains optical-centre candidate; none of #40–#50 changes canonical transport | Whole five-button row and approved Lottie optical centre accepted on Fold closed/open, unchanged approved sizes/positions. |
| [#20 Rewards animations unreliable](https://github.com/russellstokes-ai/Archivist/issues/20) | **Open** | No #40–#50 change to approved Rewards/Lottie source | Books Stack/Headphones and other approved assets play once and hold final frame; test background/resume, rapid reveals, reduced motion and device rendering. |
| [#31 Offline downloaded copy loses priority](https://github.com/russellstokes-ai/Archivist/issues/31) | **CI green, draft only** | [#41](https://github.com/russellstokes-ai/Archivist/pull/41) and [#50](https://github.com/russellstokes-ai/Archivist/pull/50): local-first priority, positive/size-matched track validation, recoverable partial work preserved, connectivity-aware ranking logic. | Reachability isn't passed by locked `App.tsx`; integrity reconciles during the existing inspection/cleanup, not unconditionally at every open. Length matching does **not** detect equal-sized corrupt files. Verify complete/partial/corrupt/offline/reconnect on device. |
| [#32 PDF stale page from previous document](https://github.com/russellstokes-ai/Archivist/issues/32) | **CI green, draft only** | [#49](https://github.com/russellstokes-ai/Archivist/pull/49): document URI/generation/page/viewport/request-scoped native render state; the existing reader JSX/style tree is preserved. | Confirm two real PDFs, fast switch, zero-page transient/retry, correct per-document resume and Fold resize/restart on actual Android hardware. |

**Explicitly out of scope:** [#15 — scanner reliability](https://github.com/russellstokes-ai/Archivist/issues/15). This register is not a request to rework it. Likewise historical issues not among the eight must not be reactivated merely because an old master plan mentions them.

## 3. Separate commercial development work — not bug closure

| Workstream | Draft PRs | Implemented/tested in draft | Outstanding / not accepted |
|---|---|---|---|
| Universal server (standalone Docker + HA/NAS) | [#40](https://github.com/russellstokes-ai/Archivist/pull/40) | Compose/NAS configuration, LAN connectivity safeguards, backups and storage health | Actual Raspberry Pi/NAS performance, migrations, recovery and full server UI/admin acceptance |
| Listening statistics and server metadata | [#42](https://github.com/russellstokes-ai/Archivist/pull/42), [#43](https://github.com/russellstokes-ai/Archivist/pull/43) | Rewind/chapter accounting; server metadata partial-save review-state safety | Real activity/statistics acceptance; advanced server metadata workbench; **no scanner/Assist edits** |
| Comic server hardening and cover image safety | [#44](https://github.com/russellstokes-ai/Archivist/pull/44), [#45](https://github.com/russellstokes-ai/Archivist/pull/45) | Server CBT regular-entry selection, TAR bounds; JPEG/PNG/GIF decode bounds | Native CBR/CBT/PDF scenarios and actual server media; WebP bounds remain a separately identified risk |
| Cross-device state synchronisation foundation | [#46](https://github.com/russellstokes-ai/Archivist/pull/46), [#47](https://github.com/russellstokes-ai/Archivist/pull/47) | Read-only profile-scoped paged server snapshot and client outbox/conflict planner | Durable app storage + playback wiring, authenticated replay, visible conflict resolution, real two-device tests; **not a finished sync feature** |
| Android Auto production finish | Part of #40 | Service progress-file safety and supporting code | Real car/head-unit discoverability, audio focus, search/voice, offline continuity and reconnect |
| Google Play + final commercial acceptance | No release PR yet | Planning/checklists only | Production signed AAB, target/native compatibility, data safety, privacy, permissions, accessibility, Play submission and actual physical tests |

## 4. Stacked PR inventory — no merge implied

All eleven are **OPEN DRAFT / UNMERGED**. Each PR targets the previous draft, not an independently deployable release.

| PR | Type | Scope / current disposition |
|---|---|---|
| [#40](https://github.com/russellstokes-ai/Archivist/pull/40) | Work | Universal Docker/NAS and protected connectivity |
| [#41](https://github.com/russellstokes-ai/Archivist/pull/41) | #31 bug | Local download priority and recovery |
| [#42](https://github.com/russellstokes-ai/Archivist/pull/42) | Work | Listening/statistics accounting |
| [#43](https://github.com/russellstokes-ai/Archivist/pull/43) | Work | Server metadata review-state persistence (not scanner) |
| [#44](https://github.com/russellstokes-ai/Archivist/pull/44) | Work | Server CBT page safety (not mobile Comic Focus fix) |
| [#45](https://github.com/russellstokes-ai/Archivist/pull/45) | Work | Compressed cover decoded-dimension bounds |
| [#46](https://github.com/russellstokes-ai/Archivist/pull/46) | Work | Server progress snapshot |
| [#47](https://github.com/russellstokes-ai/Archivist/pull/47) | Work | Offline progress outbox / conflict planning |
| [#48](https://github.com/russellstokes-ai/Archivist/pull/48) | #16 diagnosis only | Accurate comic access errors + original bug scope |
| [#49](https://github.com/russellstokes-ai/Archivist/pull/49) | #32 bug | PDF document lifecycle correction, draft CI passed |
| [#50](https://github.com/russellstokes-ai/Archivist/pull/50) | #31 bug | Offline integrity and fallback matrix, draft CI passed |

## 5. Required recording procedure — every future change

1. **Before coding:** Identify precise issue/workstream, expected original reproduction, approved scope, original canonical `df4c39b`, protected parent `72bbf177` and *actual current* draft head. Record whether source to change is protected directly **or indirectly**. Scanner/Assist/visual changes are prohibited without a separate explicit user instruction.
2. **One isolated change:** Branch off current draft as needed; link issue, cause, tests and file list in a draft PR. No silent merges or deployed APKs. For locked source propose exact diff and approval first.
3. **After code:** Compare cumulative head to protected baseline; confirm **all 46 blob locks** and extra archive/test locks. Validate root/packaged Go parity where relevant. Do not relax source hashes/tests. Capture real GitHub CI run URLs, full SHAs, pass/fail and caveats; failing, pending or cancelled means *not verified*.
4. **Update the single source of truth:** Change **DEVELOPMENT_STATUS.json and DEVELOPMENT_STATUS.md together**; append (never replace) dated event in **DEVELOPMENT_LOG.md**, noting previous/new SHA, PR number, intent, actual diff, protection audit and acceptance. Run the development-ledger consistency test.
5. **Before claiming bug complete:** Re-run original reproduction with real user media, android/Fold closed+open and force-stop/restart where relevant, document evidence and owner acceptance. **Only then** progress status from CI-green draft to device-accepted. No acceptance inferred from synthetic checks.
6. **Before merging/releases:** Obtain explicit approval; perform integration and rollback compatibility, signed artifact provenance and Google Play/HA/NAS acceptance. Record merge SHA, APK/AAB source SHA/hash, version and deployment separately from the *draft* head.
7. **After any branch moves:** Re-query GitHub rather than reusing this snapshot's SHAs or CI result. Historical log remains immutable; append correction entry if a previous statement was wrong.

**No background status monitoring is implied by these docs.** They are deliberately auditable snapshots with explicit as-of date. A developer/work session must refresh them whenever work continues.

## 6. Supporting documents

- [Machine-readable status manifest](./DEVELOPMENT_STATUS.json)
- [Append-only work and audit history](./DEVELOPMENT_LOG.md)
- [Approved eight-bug scope and frozen boundaries](./ORIGINAL_BUG_BACKLOG_2026-10-14.md)
- [Source immutability rules](./PROTECTED_DEVELOPMENT_SCOPE.md)
- [46 exact protected Git blob hashes](./PROTECTED_BLOB_LOCKS.json)
- [Commercial master development plan](https://github.com/russellstokes-ai/Archivist/blob/plan/archivist-v1-master-2026-10-12/docs/ARCHIVIST_V1_MASTER_DEVELOPMENT_PLAN_2026-10-12.md)
- [Full release work handoff](https://github.com/russellstokes-ai/Archivist/blob/plan/archivist-v1-master-2026-10-12/docs/ARCHIVIST_V1_COMMERCIAL_RELEASE_WORK_HANDOFF_2026-10-13.md)
