# Archivist v1.0 — Original Bug Backlog and Acceptance Ledger

**As checked:** 14 October 2026  
**Source of scope:** `docs/ARCHIVIST_V1_MASTER_DEVELOPMENT_PLAN_2026-10-12.md` on `plan/archivist-v1-master-2026-10-12`; [original GitHub issues](https://github.com/russellstokes-ai/Archivist/issues).  
**Purpose:** Track the *original reported bugs*, not just subsequently developed server features. A passing unit test is **not** proof that a user-reported bug has been resolved on Android/Fold. Do not close a bug or imply commercial acceptance without its issue-specific evidence.

## Fixed constraints

- **Preserve existing approved UI** and both existing scanner/Archivist Assist workflows. Do not modify the canonical Living Book, Comic Focus zoom, Shelf, Atlas, Stats/Rewards or approved animation packages as collateral changes.
- `docs/v1/PROTECTED_BLOB_LOCKS.json` protects 46 committed files. Some additional baseline checks protect other files not on that list, including `mobile/archiveReader.ts` (see `mobile/comic-webview-access-regression.test.cjs`). **A path absent from the 46-file list is not automatically editable.**
- Original reference: `df4c39b`. User's installed APK exact source SHA is **not yet verified**; do not equate it with a newer draft commit.
- Fixes from draft PRs #40–#48 are **not merged, installed or approved releases**.
- Native device acceptance (Fold closed/open, real comic/ebook/audio and real scanner sources) is deferred until software work is ready, but source tests still run for every patch.
- Protected components with confirmed bugs require **a diagnosis and specific narrow approval before changes**, not blanket permission to redesign.

## P0 — bugs that block commercial acceptance

| Issue | User-observed problem | Actual current position | Next gate |
|---|---|---|---|
| [#14](https://github.com/russellstokes-ai/Archivist/issues/14) / [#15](https://github.com/russellstokes-ai/Archivist/issues/15) | Scanner performance, NAS/grouping, chapter-versus-book counts, Smart Search/Save, review/publishing persistence | **Unresolved end to end.** Existing mobile scanner and Assist frozen; earlier scanner tests/changes do not establish actual full-library reliability. Server-only PATCH review correction in PR #43 is not a fix for the mobile editor. | Compare latest installed APK provenance and golden real-library fixture; test separate novels vs multi-track audiobooks, real comic issue counts, 10k-scale bounded background processing, partial scan recovery, metadata/cover publication and persistence. Diagnose without rewriting locked modules. |
| [#16](https://github.com/russellstokes-ai/Archivist/issues/16) | Comic `2000AD Annual 1978` loads blank `UNSUPPORTED` / `net::ERR_ACCESS_DENIED` | **Unresolved on device.** Server CBT handling in #44 is separate. Draft PR #48 improves safe classification of embedded WebView origin vs inaccessible file permission only; it does not cure a blocked WebView, SAF grant or archive format. Canonical comic gesture/decoder code untouched. | Reproduce with exact file/format and SAF grant; confirm Android WebView native event origin, byte/page bridge, one-time data-URI fallback and whether file is truly unsupported. Test CBZ/CBR/CBT/comic PDF across app/device restart without changing Comic Focus. |
| [#19](https://github.com/russellstokes-ai/Archivist/issues/19) | Atlas is blank despite items in Library | **Unresolved; locked Atlas.** No reason to claim data rings or graphs now work from server metadata tests. | Compare published/catalogue works, Atlas filters, genre/year/format completeness, subscriptions and initial mount before proposing isolated fix. |
| [#20](https://github.com/russellstokes-ai/Archivist/issues/20) | Books Stack / Headphones rewards intermittently freeze or disappear | **Unresolved; locked Rewards and motion.** Do not swap approved Lotties. | Isolate source load/onReady, one-shot play/final-frame hold, reduced motion and background lifecycle. Reproduce before minimal approved patch. |
| [#25](https://github.com/russellstokes-ai/Archivist/issues/25) | Living Book sometimes absent until Play/Pause is pressed | **Unresolved; renderer locked.** | Reproduce initial mount, animation state, measurement and title switching; preserve the exact canonical geometry/animation. |
| [#23](https://github.com/russellstokes-ai/Archivist/issues/23) | Reader asks to Resume instead of returning to saved book/audio/comic position | **Unresolved as a mobile UX defect.** Progress journal PRs #46/#47 do not change this prompt. | Verify persisted page/time after app kill/relaunch/reboot, direct resume with no extra prompt and no accidental autoplay. |

### Existing scanner candidate evidence — do not lose this work

The [#15 scanner acceptance thread](https://github.com/russellstokes-ai/Archivist/issues/15) documents more progress than its original issue description alone indicates. On **8 October**, the isolated `feature/scanner-quality-gates-20261008` branch had passing synthetic regression results for false-merging Discworld novels, separate comic issue/volume identities, cached-cover deduplication and a mocked **227 files → 12 works** publication pipeline. It also produced a Test 22 candidate with a three-stage onboarding workflow and a synthetic 6,485-file JS benchmark. **These were candidate-branch tests, not verified on-device/real-NAS acceptance**; the issue's latest handover records Android APK, Mobile and iOS final runs as pending. Do not copy/rewrite the scanner or assume that isolated branch is the current installed app. Check exact APK provenance and protect improvements already accepted in newer references before discussing any reintegration.

## P1 — mobile library/UX defects and requested behaviour

| Issue | Problem | Status / next gate |
|---|---|---|
| [#17](https://github.com/russellstokes-ai/Archivist/issues/17) | Primary Play/Pause button off-centre | Open. Measure centre on portrait and Fold; get narrow change approval before touching protected Player. |
| [#18](https://github.com/russellstokes-ai/Archivist/issues/18) | White flash at launch; logo-only splash | Open. Inspect native launch theme/splash resources and cold/warm startup, preserving approved branding. |
| [#21](https://github.com/russellstokes-ai/Archivist/issues/21) | Earned rewards hard to distinguish | Open. Accessible achieved/locked contrast, reduced-motion static state, narrow approval for locked Rewards. |
| [#22](https://github.com/russellstokes-ai/Archivist/issues/22) | Profile avatar cannot be changed | Open. Local photo choose/crop/persist/revert without unintended upload. |
| [#24](https://github.com/russellstokes-ai/Archivist/issues/24) | Unsupported tab should be hidden | Open. Ensure inaccessible supported comics do not become labelled unsupported. No deletion. |
| [#26](https://github.com/russellstokes-ai/Archivist/issues/26) | Inconsistent gold/teal bottom-nav selected state | Open. Align design by agreed pattern; preserve navigation labels, bounds and animation. |
| [#27](https://github.com/russellstokes-ai/Archivist/issues/27) | PDF tab should not be a media type | Open. Classify PDF as Book/Comic, ambiguous PDFs remain reviewable and physical files untouched. |
| [#28](https://github.com/russellstokes-ai/Archivist/issues/28) | Tappable affordances inconsistent | Open. Agree interactive vs informational patterns; touch/accessibility audit. |
| [#29](https://github.com/russellstokes-ai/Archivist/issues/29) | Text wraps/clips on Fold closed (e.g. Audiobooks final “s”) | Open. Font and responsive constraints across phone/Fold open and closed. |
| [#30](https://github.com/russellstokes-ai/Archivist/issues/30) | Settings inconsistent and cramped | Open. Scoped hierarchy/touch feedback/spacing audit without whole-app redesign. |
| [#31](https://github.com/russellstokes-ai/Archivist/issues/31) | Downloaded book may lose to unavailable server in All view | **Code change/test passed in draft PR #41**, which prefers available local download and protects content. **Not accepted on real phone offline.** |
| [#32](https://github.com/russellstokes-ai/Archivist/issues/32) | Old PDF page/image may remain when switching documents | Source-review risk, not confirmed on device. Reproduce with two PDFs and save/reopen; do not assume solved. |

## P1 — server and cross-device depth

| Issue | Current implementation | Remaining acceptance |
|---|---|---|
| [#33](https://github.com/russellstokes-ai/Archivist/issues/33) Metadata workbench | PR #43 improves **server** partial-save review; existing metadata foundations preserved. | Field-level locks, per-candidate provenance/compare, safe bulk edits, undo and full mobile/server parity. |
| [#35](https://github.com/russellstokes-ai/Archivist/issues/35) Library health | PR #40 adds NAS root health and retained catalogue; CI passed. | Work-level stages, artwork/genre/year coverage, jobs/cancellation integrity and clear metadata provenance. |
| [#36](https://github.com/russellstokes-ai/Archivist/issues/36) Cross-device sync | PR #46 read-only paginated per-profile snapshot; PR #47 durable offline outbox and conflict planner; unit/CI passed. | Connect to mobile reader + downloaded works, authenticated replay, user-facing resolution and device E2E. |

## Post-v1 / optional (not blockers unless prioritised)

- [#34](https://github.com/russellstokes-ai/Archivist/issues/34) Advanced reader settings — assess preserving Living Book/Comic Focus.
- [#37](https://github.com/russellstokes-ai/Archivist/issues/37) Global annotation/search/export hub.
- [#38](https://github.com/russellstokes-ai/Archivist/issues/38) More sophisticated series/edition navigation.
- [#39](https://github.com/russellstokes-ai/Archivist/issues/39) Kobo/KOReader interoperability research.

## Other mandatory v1.0 acceptance (not captured by a single mobile bug)

1. **Android Auto:** production discovery, audiobook-only browse/search/voice, audio focus, reliable connected/offline position, reconnect/vehicle acceptance. PR #40 atomic JSON progress write is only one correction.
2. **Server/HA/NAS:** real Raspberry Pi memory and streaming+scan performance; full CBR/RAR4/RAR5 support, job cancellation, field locks, migration, safe move/undo, advanced library views, HTTPS, backup-restoration; not inferred from the green CI.
3. **Release:** Android 16/API 36+, 16KB native package, signed AAB, privacy/data safety/permission declarations, screenshots, accessibility, ANR/crash testing and Play console requirements.
4. **Protected experiences:** visual and interaction comparison against original canonical app before release on Fold open/closed.

## Progress definitions

- **Open:** no proven final fix; source-level diagnosis may exist.
- **Code corrected, CI green:** code change is on a draft branch with tests, but is not the installed app nor verified on the reported device.
- **Device accepted:** original reproduction and regression verified on real media/hardware. Only then may a reported mobile bug be closed.
- **Commercial accepted:** integrated release branch, no unreviewed protected changes, all relevant gates pass, signed/reproducible package and actual release policy checks.

**Immediate order:** scanner/Assist read-only diagnosis and golden book-vs-track count tests → Android comic URI/WebView permission reproduction → Atlas, Living Book and Rewards diagnosis (specific approval before locked changes) → PDF/resume/UX fixes → advanced server/Android Auto → signed release and consolidated hardware acceptance.
