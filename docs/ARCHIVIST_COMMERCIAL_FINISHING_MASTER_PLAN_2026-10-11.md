# ARCHIVIST — FIXED COMMERCIAL FINISHING & DEFECT MASTER PLAN (EXPERIMENT ARCHIVED)

> **STOP — EXPERIMENTAL COMMERCIAL PREVIEW REJECTED AND ROLLED BACK (11 October 2026).** The user explicitly rejected APK `Archivist-Commercial-Polish-Preview-05fec3c.apk` because the book itself did not become larger: only its stage/container did. The user then withdrew the size-change request and directed a return to the EXACT canonical application at `df4c39b44394d8c512ca0298bffa7f19da356490`, discarding the experimental version. **This decision supersedes all earlier authorisation in this document to resize the book or integrate the polish experiment. Do not reuse, recommend, reinstall, publish or resume the 05fec3c preview as an accepted build. Do not scale the Living Book, change its animations or even enlarge its stage without a NEW explicit request.** The ledger and historical implementation details below are ARCHIVED EVIDENCE ONLY, not the active development plan. Production source on the rollback branch is byte-identical to canonical for all app files; only documentation remains as an audit trail.

**Record:** 2026-10-11 | **Status:** PAUSED / EXPERIMENT REJECTED / CANONICAL RESTORED | **Owner:** Archivist product
**Master plan branch:** plan/archivist-commercial-polish-20261011
**Immutable accepted full-app parent:** df4c39b44394d8c512ca0298bffa7f19da356490
**Canonical tree:** d39ec0a0a3e75a4160c8c687824e940ce768d8d4
**Canonical branch:** canonical/archivist-20261011-df4c39b
**Baseline record:** docs/scanner-vnext/CANONICAL_BASELINE.md
**Canonical acceptance APK:** Archivist-Fresh-Scanner-Fold-Test-20261010-df4c39b.apk
**Release:** https://github.com/russellstokes-ai/Archivist/releases/tag/scanner-vnext-fold-fix-20261010-df4c39b
**Source CI:** https://github.com/russellstokes-ai/Archivist/actions/runs/38131962208

## 0. Purpose, precedence and truthfulness
Deliver commercial-grade Archivist through scoped bug repairs, the agreed 7 October Lottie/motion programme, the user-authorised RESPONSIVE LIVING BOOK ENLARGEMENT ONLY, performance refinement, full device acceptance and release engineering. Maintain the proven app and existing product design; no replacement product, scanner redesign, generic UI rewrite or unapproved feature expansion.

PRECEDENCE: (1) latest explicit user approvals, including df4c39b and Living Book protection, (2) this commercial finishing plan, (3) docs/scanner-vnext/CANONICAL_BASELINE.md and AGENTS.md, (4) existing feature/Fold/design locks and approved handoffs, (5) historical plans for historical context only. Older GitHub issues #11/#12 calling Test 13 the 'sole canonical' are SUPERSEDED by the user-approved 11 October baseline. Older dev-work/SPRINT-RECONCILIATION.md and FIRST-COMPLETE-TEST-BUILD-HANDOFF.md describe earlier recovery/integration work and are not instructions to replace df4c39b with other branches. NEVER use main, Test 13, Test 14, Test 21 or old recovery branches as the new starting point.

Status vocabulary: CONFIRMED SOURCE DEFECT (reproducible code inconsistency); CONFIRMED HISTORICAL DEFECT (previously reported, patched but not physically retested); SUSPECTED/INVESTIGATE; DEVICE ACCEPTANCE OPEN; APPROVED IMPROVEMENT (not a bug); VERIFIED PASS (only cite exact tests). No tests or physical device checks were executed when authoring this document. Source inspection is NOT proof of runtime failure.

## 1. Immutable protection contract
- Keep canonical branch pinned to df4c39b. Work on disposable per-sprint branches from this SHA or a TESTED and documented descendant; never force-push or silently move canonical.
- Keep canonical scanner discovery, grouping, SAF/native access and orchestration intact: docs/scanner-vnext/CANONICAL_SCANNER_LOCK.json guards 24 files. Do not rebaseline hashes to silence failures.
- Keep accepted onboarding, work-level review and scanner integration intact: docs/scanner-vnext/CANONICAL_PROCESS_LOCK.json guards seven function bodies. Do not change their hashes unless user explicitly authorises such scope after a demonstrated defect.
- Maintain one logical work per book, no file-per-chapter regression; no scan stalls; keep review work visible until publication; protect source IDs/progress, safe resumability and original media.
- Direct post-scan review goes to metadata editing; review-row tap MUST NOT play an audiobook. Do NOT restore removed Manage Library screen. Advanced file tools remain under Settings/long press.
- Preserve manual/embedded/sidecar metadata precedence, manually chosen covers, no invented title/author/genre/year, bounded provider results, offline/local use and server optionality.
- Protect approved Shelf, Library, Atlas, Insights, Profile, Settings, Reader and NOW compositions. Preserve mobile/locked-fold-ui.styles.snapshot.txt and mobile/ui-contract.test.cjs, plus original canonical palette/typography, bottom navigation, app icon and first-viewport rules. 600dp+ Fold composition locked absent explicit exception.
- The existing Living Book's appearance, canvas drawing geometry, cover, texture, shadows, opening, closing, natural pages, skips, animation state machine and timings are EXPLICITLY PERFECT/LOCKED. DO NOT 'optimise' its internal requestAnimationFrame loop, change interpolation/duration, replace it with Lottie, redraw it, or adjust animation physics as part of this programme. A rendering-loop observation below is investigation-only; seek separate authorisation if an internal change ever becomes necessary.
- The user authorises ONE Living Book exception: make the SAME book bigger on screen responsively through its OUTER display stage, hosting layout and spacing only, preserving its entire internal renderer and exact motion. Do not change progress/timeline/control placement outside necessary viewport-safe adjustment. Never clip the full opening or turning bounds.
- Keep Comic Focus original-pixels, deterministic local mask/zoom and exact context return; Atlas existing rounded universe/ring semantics; Reduced Motion; mobile iOS/Android parity and separate server/HA packaging.
- Every visual decoration must have a static fallback and must not mutate scanning, playback, identification, reading progress or achievement eligibility. Stop animations when offscreen/backgrounded.
- Every build uses a UNIQUE APK/artifact filename and commit/ref, plus published SHA256. Always retain a known-good rollback build. Never claim emulator, Fold or iOS real-device approval without actual evidence.

## 2. Source audit — priority-ordered defects and risks (2026-10-11)
The findings below were inspected against the exact canonical df4c39b, not old main. A fix is not authorised merely because it appears here: stay inside named sprint and feature locks.

### B-001 — First-library celebration is disconnected [P2, CONFIRMED SOURCE DEFECT]
Evidence: mobile/App.tsx line ~321 declares firstLibraryCelebratedKey; lines ~814-815 declare celebrationEligible and celebrating; lines ~1964-1965 READ saved flag; line ~8098 renders CelebrationOverlay when celebrating. The canonical App.tsx has NO invocation of setCelebrating(true), NO write of firstLibraryCelebratedKey, and celebrationEligible is never used to initiate the effect. The first-library-only celebration is therefore not reachable through the intended state variable. The achievement celebration separately works through achievementCelebration and must NOT be confused with this missing path.
Resolution: Sprint P3 should wire a one-time success signal after a real successfully published local first library, write the displayed flag atomically/idempotently, respect restore/migration and Reduced Motion, and not celebrate empty, cancelled or fully ambiguous scans. Unit test repeated launch, resume, restore, cancellation and multiple folders. Preserve canonical onboarding locks: insert a separate non-invasive observer rather than modifying protected functions. No award duplication.

### B-002 — Living Book canvas continuously repaints when mounted [P2, CONFIRMED CODE PATH; PERFORMANCE IMPACT UNMEASURED]
Evidence: mobile/LivingBookCanvas.tsx rendererHtml function tick at line ~98 calls paint() and requestAnimationFrame(tick) unconditionally; initial invocation around line ~100. This runs even in a stationary state while its mounted WebView is active. CPU/GPU/battery cost has not been measured and no real-device defect is confirmed.
ACTION BOUNDARY: this is AUDIT/PROFILE ONLY, not an authorisation to change the beloved animation. Capture render trace while playing/paused/offscreen, compare against canonical. If costly, isolate a safe mitigation outside the renderer (e.g. mount/visibility management) and obtain explicit authorisation before anything affecting internal timing, frames or imagery. No automatic rewrite, frame throttling or cache of internal book painting.

### B-003 — Book cannot take advantage of extra device space [P2, APPROVED IMPROVEMENT]
Evidence: mobile/LivingBookCanvas.tsx line ~138 has width 340, maxWidth 100%, height 290, overflow hidden. mobile/App.tsx ~8419 playerHeroColumn maxWidth 360; app Player renders LivingBookCanvas around lines ~5814-5839. This fixes the visual stage to a narrow phone-sized area, even when layout permits more.
Resolution: user-approved SPRINT P2A, outer-stage responsive enlargement only. Measure safe width AND height of allotted hero viewport at phone, Fold closed, Fold open and tablet. Increase book as much as practical while maintaining native proportional stage/aspect ratio and original canvas image, page-open extents and margins. Maintain first-viewport title/progress/transport and existing Fold two-pane layout. Preview paused/open/turning/skip against canonical. DO NOT mutate rendererHtml, book textures, physics, timings, transform state machine or overlay other animations on book itself. Compare side by side and revert on any difference beyond overall size.

### B-004 — Reader page-turn sound initial state ambiguous [P3, SUSPECTED/VERIFY INTENT]
Evidence: mobile/readerExperience.ts defaultReaderAppearance omits sound; sanitizeReaderAppearance line ~11 maps absent sound to true. mobile/App.tsx ~7839 shows 'Page-turn sound' enabled for undefined. Verify whether subtle sound enabled-by-default remains desired, that the reader actually honours the switch on ebook/comic/PDF surfaces, and that Reduced Motion does not improperly mute user-selected sounds. Do not change default without product confirmation or failing test.

### B-005 — Metadata Save and SQLite contention [P0, CONFIRMED HISTORICAL DEFECT; FIX NOT PHYSICALLY ACCEPTED]
Docs: docs/scanner-vnext/DIRECT_REVIEW_STATUS.md reports prior 'Database is locked' during simultaneous Save/Assist/UI writes and prior review-row playback misrouting. Shared write queue/transaction BUSY retry and direct editor navigation were added before df4c39b. Need real Fold test with Save + active Assist + rescan, repeat taps, offline search, rapid switching; inspect permanent BUSY, transaction rollback, lost override, disappearing work, publication gate. DO NOT duplicate queue/refactor or reopen accepted scanner without reproduced failure.

### B-006 — Metadata editor keyboard/footer [P0, DEVICE ACCEPTANCE OPEN]
Docs: docs/scanner-vnext/ASSIST_RECALL_STATUS.md and CANONICAL_BASELINE.md. Android adjustResize change intended to prevent footer shrinking/clipping, no physical Fold re-test yet. Test keyboard show/hide, long titles, screen rotation, fold/unfold, 360dp and larger, actual Save/Cancel/Assist buttons, focus and accessibility. Scoped UI fix only if symptom is observed.

### B-007 — Assist real-title matching/metadata evidence [P1, DEVICE ACCEPTANCE OPEN]
The df4c39b Assist now has exact and broad queries, spelling/spacing fallback, cover candidate cards, genre/year evidence supplementation and paging. Live probes are not identity-accuracy benchmarks. Half Horn returned unrelated noise; 'Assanorium' returned no result. Test known+unknown titles, comics, ambiguous editions, duplicate suggestions, paging, missing genre/year, source conflicts, offline and manual locks. Never auto-accept weak matches or fabricate fields. Scanner grouping not in scope.

### B-008 — Atlas native touch/performance and web warning [P2, DEVICE ACCEPTANCE OPEN]
mobile/ATLAS-ACCEPTANCE.md passed synthetic browser/2,000-work fixtures but left Android/iOS/Fold native gestures, frame pacing, real server relationships and native accessibility open. The browser harness recorded an existing web SecureStore warning banner it dismisses; web is not automatically a release target. Do not state that warning affects Android native without reproducing it. Stress genre rings/selection and Fold interruption. No Atlas redesign.

### B-009 — Player/Reader real media/platform tests [P1, DEVICE ACCEPTANCE OPEN]
mobile/LIVE-PLAYER-HANDOFF.md and MOBILE-TESTING.md list background audio, Bluetooth/lock-screen, seek, multi-part chapters, sleep, force-stop/resume, real EPUB/PDF/CBZ/CBR/CBT, annotation persistence, Comic Focus mixed pages and Fold. The source has meaningful feature code; do NOT label these 'broken' without tests. Check Android Auto separately. Keep exact Living Book rendering and approved Comic Focus locked.

### B-010 — Superseded repo instructions could cause destructive regressions [P0, CONFIRMED DOCUMENTATION RISK]
GitHub issues #11 and #12 still instruct Test 13 as canonical, while user approved df4c39b on 2026-10-11. Old README/handoffs contain earlier 0.9.3/0.9.4 references and recovery branches. THIS PLAN and AGENTS.md must explicitly supersede earlier canonical notices. Do not close/edit historical issues without a separate request. Do not mistake earlier test-suite counts for tests run today.

### B-011 — First viewport and presentation clipping [P1, DEVICE ACCEPTANCE OPEN]
Check missing artwork, very long titles, 320dp, Fold open, keyboard, mini-player, bottom navigation and actual reader controls for clipping; earlier human tests found issues but do not prove they survive df4c39b. Validate before changing visual contract. Hero enlargement may expose constraints; render screenshot matrix after P2A.

## 3. Original user-approved Lottie / motion inventory (7 October)
This is retained as the agreed work, NOT a substitute generic animation project.
- Book Loader replaces ONLY generic loading indicator; existing truthful scan bar/counters remain. Crossfade between scan phases 250–400ms. Animation must not block scanner, grouping, cancellation, save, navigation, frame responsiveness or progress updates.
- Books Stack: books and comics; Headphones: audiobooks. Do NOT bring back rejected Open Book loader.
- Pause/Play: matched-size Lottie button transition for Now and persistent mini-player. Actual playback events are source of truth; buffering/pause/seek should never show an incorrect 'playing' frame. Keep current hit targets, transport timing and Living Book untouched.
- Waveform: subtle when real audio playing; stationary paused/buffering/offscreen, no fake loudness claims, no UI-width reflow.
- Rewards: Trophy, Twinkle Crown, Level-Up Confetti, Badge, rare Firework Burst; reuse achievementLedger earned/shown semantics; no fabricated wins or frequent fireworks; phone asset box ~96x96dp, Fold-open ~112x112dp, about 3 seconds including natural play and end-frame hold.
- First-library celebration: see B-001; only after genuine first published library; only once, honour cancellation/restore.
- Optional Motion Lab preview-only scenes may include story-building.json, server-discovery.json, completion.json; they DO NOT authorise replacing splash, approved onboarding or actual scanner workflow.
- Bundle assets as locally audited Lottie JSON with transparent background, predictable vector layers, palette-friendly recolouring where appropriate, no external animation service/network. Validate security, licences, package size, light/dark, accessibility, native compatibility, memory. Confirm actual Expo 55 / React Native 0.83 Lottie version rather than assuming latest.
- Motion Lab isolated from production, with Gallery, Scanning & Completion, Player, Mini-player, Rewards, Reduced Motion and closed/open Fold preview; compare screenshot/video with canonical.
- Original approved timing vocabulary in DESIGN-STANDARD.md remains the general language. **Living Book existing animation durations are explicitly exempt: do NOT 'correct' its 1,500ms or 1,900ms durations to generic timing tokens**. The user has approved its exact feel.
- Disable or freeze decorative effects for Reduced Motion, inactive app/offscreen, low-resource scenarios. Haptics only on meaningful actions, never repeated scanning ticks.

## 4. Ordered commercial finishing sprints and completion gates
Each sprint must retain acceptance evidence, unique test artifact if built, regression gate and rollback checkpoint. No sprint is 'done' merely because code exists.

### P0 — Documentation freeze, defect reproduction and canonical regression harness
**Scope**: Keep canonical pinned; this plan, AGENTS/README and clear precedence; enumerate current tests/contracts and screenshot fixtures; establish stable performance sampling and failure reproductions for B-005/B-006, not scanner modifications. Preserve accepted direct-review and Assist behaviour. Assemble phone/Fold closed/open screenshot baselines including dark/light, empty, offline, metadata keyboard and active playback.
**Gate**: documentation contains exact baseline/lineage; lock checks run; known fixes distinguished from unverified ones; no app source changed in documentation commit.

### P1 — Isolated Motion Lab and Lottie technical validation
**Scope**: all approved animation assets and preview scenes, local JSON; native compatibility smoke (Android + iOS), cancellation, dark/light and reduced motion, assets bounded in size, no canonical visual changes.
**Gate**: every asset demonstrable with frame-correct states; unchanged canonical UI with Motion Lab absent.

### P2 — Scanner visual loading only
**Scope**: Books Stack/Headphones loader and crossfade; data-progress/event bridge only, no scanner core edits.
**Gate**: no slower discovery/identification, no extra scanning passes, no file-per-chapter collapse, cancel and offline responsive; canonical locks equal.

### P2A — Bigger Living Book, SAME PERFECT ANIMATION [EXPLICIT EXCEPTION]
**Scope**: responsive outer display stage and allocated hero sizing, optimised within viewport; responsive Fold two-pane preserved, title/timeline/transport still first viewport.
**Hard prohibition**: rendererHtml, project/surface/flex/texture, tick, page-turn logic, state machine, easing, cadence, duration, book aesthetic, cover style, shadows and interaction unchanged.
**Gate**: baseline vs candidate side-by-side paused/open/playing/skipping, phone narrow/normal/large, Fold closed/open, tablet, tall/short screen, long titles, mini-player; no clipping/hidden buttons. Only observed size difference accepted.

### P3 — Play/Pause and waveform microanimations
**Scope**: existing controls only; local Lottie button animations and truthful waveform state. Do not amend Living Book renderer.
**Gate**: rapid taps, background audio, Bluetooth, skips, sleep, buffering, media replacement, Fold/unfold, reduced motion, no transport regressions.

### P4 — Rewards and first-library celebration
**Scope**: badge/crown/trophy/confetti/fireworks local animation, one-time B-001 flow, idempotent ledger use, meaningful haptics, no inflation of progression.
**Gate**: once-only awards across relaunch, restore, profile isolation, server sync; no false positive for cancelled/empty scan; static fallback.

### P5 — Shelf/Library/Metadata experience finishing
**Scope**: cover fade/skeleton, UI press feedback, smooth nonblocking sheets, stable scroll positions during cover/metadata updates, direct work-level review and Assist visual states, keyboard clipping fixes only if reproduced.
**Gate**: no missing/disappearing work; manual field preservation; save while Assist/rescan; no SQLite BUSY; no Manage Library resurrection; source and original files intact.

### P6 — Atlas, Stats and Reader release polish
**Scope**: refine existing visual feedback, test gestures on native devices, ring/category counts, large-library memory, Reader/Comic Focus and Reader position. No redesign, no speculative book/reader algorithms.
**Gate**: tap-focus/pan/pinch precision, actual counts, stable selected node; comic context and original pixels; bookmarks/highlights persist; existing locks pass.

### P7 — Cross-screen accessibility/performance and OS robustness
**Scope**: 320–1200dp matrix, light/dark, reduced motion, increased text/contrast, screen readers, loading/empty/errors, network outage, performance traces (include read-only investigation B-002). Verify native gesture interference, battery, keyboard, responsive open Fold.
**Gate**: every essential control accessible, 60fps target for ordinary interaction where hardware permits (measurement, not assumed fact); no unnecessary offscreen Lottie loops; no data loss, blocking or ANRs.

### P8 — Real-device, server/HA and ecosystem acceptance
**Scope**: actual phone and Galaxy Fold closed/open, Android emulator; real iOS device and Simulator before iOS-release claim; Files/iCloud/SAF import, local-only/no account; audiobook background/Bluetooth/Android Auto; EPUB/PDF/CBR/CBZ/CBT, real comics; mixed sources, family profile and optional remote access. Pi/HA install/update/restart and remote DuckDNS/Tailscale verified separately.
**Gate**: reproducible evidence, failure list with severity, no release-blocking problems.

### P9 — Release candidate and publication preparation
**Scope**: distinct release identity/APK name, release-mode regression and benchmarks, signed Android AAB and proper production signing, iOS signing/TestFlight, privacy/permission policy, attribution/licences for Lottie assets, accessibility, store screenshots, support docs, changelog and rollback.
**Gate**: zero P0/P1 verified defects, no regressions on locked features, APK SHA256 and commit linked, platform checks documented; separate store review is not claimed as automatic pass.

## 5. Universal test matrix & measurable release gates
Dimensions: 320–359dp compact; 360–429dp standard; 430–599dp large/Fold closed; 600–759dp Fold open; 760dp+ wide/tablet; portrait/landscape where practical. States: light/dark, reduced motion, enlarged text, increased contrast, TalkBack/VoiceOver, offline, network drop, empty library, many cover loads, malformed archive, long/unknown metadata, multi-file audiobook, iOS Files vs Android SAF, in-progress audio while browsing, restore from backup, low storage.

Use identical canonical and candidate test fixtures/hardware for performance comparison: 12 logical books with many parts, hundreds of files and >1,000 works stress fixtures. Report p50/p95 latency, real JS/UI frame drops, native memory/battery and artifact sizes. Targets: fluid routine interactions near 60fps on representative hardware, zero persistent hangs/ANRs/confirmed data loss/critical regression, no statistically meaningful scanner slowdown, no continuous decoration battery drain. These are goals; no numbers measured for this audit.

Every candidate: Expo Doctor, TypeScript, maintained mobile tests, scanner-vnext-canonical-lock.test.cjs, scanner-vnext-process-lock.test.cjs, UI contract/locked Fold snapshots, cover/metadata/achievement tests, Android native build and emulator smoke, iOS native build when relevant, package+signature+ABI+alignment checks; server Go/HA/packaging parity if server source touched. Inspect screenshots/video for screen changes; source compilation alone is not visual/device acceptance.

Rollback: tagged last-good candidate; compare file tree against canonical; retain all accepted locks. If a protected function/hash changes incidentally, stop and revert unrelated change. Do not substitute later scanner or weaker tests.

## 6. Tracking protocol (MUST UPDATE THIS FILE)
On each sprint update only this living plan on its development branch: list exact source commit, changed paths, linked evidence, start/finish date, completed deliverables, CONFIRMED passes, OPEN risks/next action and current APK checksum. Use status TODO / IN PROGRESS / CODE COMPLETE / NATIVE VERIFIED / DEVICE VERIFIED / ACCEPTED / BLOCKED. A file without proof stays OPEN. Keep the baseline pointer frozen. Add dated changelog entries below; do not erase earlier risk evidence. The current plan and its issue table are an initial SOURCE AUDIT, NOT completed testing.

### Tracking ledger at creation
| Sprint | Status | Work | Evidence at creation |
| --- | --- | --- | --- |
| P0 | CODE COMPLETE; ACCEPTANCE OPEN | Versioned plan and protected branch | Exact reversible UI exceptions added; no base hash changes |
| P1 | NATIVE BUILD VERIFIED; VISUAL DEVICE OPEN | Nine vector Lottie assets and isolated Motion Lab | Android lab compile 38149754930 and 38150522693 passed; device animation review open |
| P2 | CODE COMPLETE; DEVICE OPEN | Production Books Stack/Headphones scanning indicators | ee058587, MotionAnimations.tsx; mobile 105/105; scan progress data unchanged |
| P2A | CODE COMPLETE; DEVICE OPEN | Responsive outer stage only | d61d336 sizing helper + dedicated test, corrected exact UI whitelist db6b4c3; mobile 100/100 suites on 1a8d6a3 |
| P3 | CODE COMPLETE; DEVICE OPEN | Production state-controlled Lottie Play/Pause and waveform on Now/mini-player | ee058587; 171ff682 Android native check passed; physical playback tests open |
| P4 | CODE COMPLETE; DEVICE OPEN | One-off first-library event, protected achievement ledger, Lottie reward variants and burst motion | 1a8d6a3; e1740b8; ee058587; mobile 105/105, native UX acceptance open |
| P5 | TODO | Shelf/Library/review polish | B-005/B-006 device checks pending |
| P6 | TODO | Atlas/Stats/Reader | Native acceptance pending |
| P7 | TODO | Accessibility/performance | B-002 impact unmeasured |
| P8 | TODO | Android/iOS/Fold/HA acceptance | No new physical test in audit |
| P9 | PREVIEW APK BUILT & VERIFIED; STORE GATES OPEN | SHA-pinned, signature/alignment-verified Android acceptance prerelease | 05fec3c from Actions 38154082575 PASS; 45,560,886-byte APK uploaded; physical Fold and commercial store acceptance outstanding |

### Change history
- 2026-10-11: Initial canonical df4c39b documentation/source audit and fixed commercial finishing backlog. No app code changed. B-001 confirmed disconnected first-library celebration; B-002 confirmed unconditional frame scheduling with no impact measurement; B-003 authorised screen-space improvement; B-004 uncertain sound intent; B-005 through B-011 documented acceptance/risk. User-authorised Living Book exception retained.

### Execution record — 2026-10-11 (documented same session)
- Active implementation branch: `feat/commercial-motion-and-reliability-20261011` created from plan commit `8840818`, itself exactly one docs-only descendant of immutable canonical `df4c39b`. Canonical branch was never updated.
- `d61d336`: introduced `livingBookViewport.ts`, pure viewport size test and React Native outer stage width/height. Original LivingBookCanvas rendererHtml body and every physical animation frame/timing remain exactly untouched. Dynamic hero maxWidth override only (not StyleSheet lock).
- `db6b4c3`: extended `docs/scanner-vnext/UI_BINDING_EXCEPTIONS.json` by five EXACT reversible, user-authorised App.tsx snippets. Canonical base SHA256 `41e45b1...` was **not changed**. Initial mobile CI on d61d336 failed ONLY its byte-comparison UI binding guard; this is not concealed. Corrected commit passed later.
- `1a8d6a3`: fixed confirmed B-001 using separate guarded observer, persistent first-library flag stored before overlay shown, actual scannerPublished works required. No scanner/onboarding protected function modified. Regression cases cover cancelled/empty/unprepared/restoring/in-progress/duplicate situations.
- **Verified mobile CI**: [38149262591](https://github.com/russellstokes-ai/Archivist/actions/runs/38149262591) on `1a8d6a3` passed **100/100** suites, Expo Doctor and TypeScript, including scanner & process/UI guards. Note this does NOT replace native screen validation.
- `09847a8`: nine independently authored local Lottie JSON vector assets; separate `motion-lab/` Expo SDK55+Lottie 7.3.8 preview. Production mobile package.json/package-lock.json untouched. [Mobile CI](https://github.com/russellstokes-ai/Archivist/actions/runs/38149518560) passed; native iOS workflow pending at time of note.
- `ebfb2a5`: independent Android native Motion Lab compile workflow [38149605806](https://github.com/russellstokes-ai/Archivist/actions/runs/38149605806) running. DO NOT label it pass until green. Further production Lottie integration waits native gate.
- Remaining: Motion Lab actual renders/native builds, Book Loader and Player/mini Lottie production integration, Rewards pack production integration, physical responsive-book screenshots, iOS/Fold real-device testing, P5-P9 release quality/reliability gates and uniquely named new test APK. Never mark these completed by implication.

### Pre-test source checkpoint — 2026-10-11, latest implemented code `1913afeab409459e41f1257d9e08eb1bcaac4343`
This milestone is **SAVED BEFORE ASKING FOR DEVICE TESTING**. A documentation-only follow-up commit and its APK build do not alter the mobile implementation recorded here. Use exact APK SHA from `SHA256SUMS.txt` after release and link back to its build SHA. No clinical/device/external-system acceptance is inferred from CI.

- **Branch:** `feat/commercial-motion-and-reliability-20261011`. Based on canonical `df4c39b44394d8c512ca0298bffa7f19da356490`, through docs-only plan `8840818`; canonical branch remains pinned. GitHub compare confirms 19 ahead / 0 behind at `1913afe`, and identifies only authorised app motion/outer-book changes, test contracts, Lottie package and separate Motion Lab, plus docs/workflows.
- **Living Book protection:** `mobile/living-book-exact-canonical.test.cjs` reconstructs the complete protected `mobile/LivingBookCanvas.tsx` Git blob `bac9a25bd1e75df7dd3ee8ed914d3005e201a5e0` after reversing only the explicit outer viewport prop and stage-style override. Original content, renderer, timing, physics, frames, textures and transitions are untouched. Size remains user-approved but needs *physical Fold closed/open and phone visual acceptance*. Change `d61d336`; byte-exact guard `1913afe`.
- **Motion assets and isolated validation:** nine local Lottie vector assets (Books Stack, Headphones, Play/Pause, Audio Waveform, Badge, Trophy, Twinkle Crown, Level-Up Confetti, Firework Burst) plus theme-adapted Play/Pause variants. Rejected Open Book loader remains absent. Expo SDK55 / RN0.83 / Lottie 7.3.8 Motion Lab compiled Android native: [lab run 38149754930](https://github.com/russellstokes-ai/Archivist/actions/runs/38149754930), [later lab run 38150522693](https://github.com/russellstokes-ai/Archivist/actions/runs/38150522693).
- **Production animation integration:** `mobile/MotionAnimations.tsx` plus exact reversible `mobile/App.tsx` exceptions; scanner phase loader with truthful progress bar and media class, Now/mini-player play/pause tied to real playback, active-only waveform and native reward assets. Reward celebration uses original achievement ledger idempotency and Reduced Motion static fallback. Commits `84ee0b9`, `ee05858`, `6440d2f`, `5eedbe2`, `171ff68`. No scanner discovery/grouping or onboarding protected function changed.
- **First-library bug B-001:** scoped observer requires an originally empty scanning library, successful completion, published work, eligible stored flag and no concurrent reward; writes flag before playing once; covered by `mobile/first-library-celebration.test.cjs`, commit `1a8d6a3`. No award inflation.
- **Existing reward-burst bug:** decoration's sparks Animated.Value was never driven; scoped correction adds a properly gated animation; commit `e1740b8`; Lottie celebration stages retained.
- **Native dependency:** `lottie-react-native@7.3.8` and web peer `@lottiefiles/dotlottie-react@0.13.5` resolved with deterministic production package lock (`df9fa4b`); web export and mobile tests green. Automatic lock synchroniser changed only the development branch; no canonical lock was weakened.
- **Verified latest same-SHA CI:** [mobile run 38151449352](https://github.com/russellstokes-ai/Archivist/actions/runs/38151449352) for `1913afe`: Expo Doctor **19/19**, TypeScript, **105/105 mobile suites**, version parity and Expo web export PASSED. This includes **24/24 canonical scanner protected files** and byte-equivalent App UI exceptions, both process/UI guards, and exact canonical Living Book test. [iOS run 38151449262](https://github.com/russellstokes-ai/Archivist/actions/runs/38151449262) for `1913afe`: Expo prebuild, CocoaPods and **unsigned iOS Simulator compilation** PASSED. [Android native run 38151276884](https://github.com/russellstokes-ai/Archivist/actions/runs/38151276884) PASSED on earlier code `171ff682`, not claimed to be the final-source APK test. The new release-mode APK workflow must validate its exact source SHA independently.
- **Historic preview only:** [APK build 38150080233](https://github.com/russellstokes-ai/Archivist/actions/runs/38150080233) PASSED on `c3465f5`, **BEFORE production Lottie integration**. Its artifact is not a valid commercial-animation test candidate. Do not direct the user to it as the current animation APK.
- **Existing remaining blocks:** Actual install, phone/Fold closed/open layout and keyboard/footer, direct-review Save with active Assist and concurrent SQLite activity, accurate real-world scanner/media grouping/metadata search, Reader/Comic Focus, background audio, real Atlas gestures/performance, iOS physical device, HA/Pi and remote access, release signing/legal/release store. No claim of physical or store readiness.
- **Current release intent:** CI `.github/workflows/commercial-polish-preview.yml` builds a uniquely named SHA-specific `Archivist-Commercial-Polish-Preview-<build-shortsha>.apk` in `app.archivist.reader.scanneracceptance`, checks lint, app signature, alignment, package, checksum and sends APK to Actions artifact plus an immutable prerelease where permitted. This package may **update the existing isolated scanner-acceptance installation/data**, so back up existing test-specific data first. It does not replace the production `app.archivist.reader` install.
- **Source of truth for device testing:** [commercial test handoff](ARCHIVIST_COMMERCIAL_TEST_HANDOFF_2026-10-11.md). Record defects against the APK source SHA, device posture, library fixture and reproduction; do not silently use any other commit.

### Verified APK publication milestone — 2026-10-11, saved before physical testing
- **Exact test source commit:** `05fec3cbf726712f0a156bacf48ed2484da9cb45`. This commit differs from the final app-code checkpoint `1913afe` only by commercial-plan/test-handoff/workflow documentation and packaging instructions; no app source was changed.
- **APK:** [Archivist-Commercial-Polish-Preview-05fec3c.apk](https://github.com/russellstokes-ai/Archivist/releases/download/archivist-commercial-test-05fec3c/Archivist-Commercial-Polish-Preview-05fec3c.apk) — **45,560,886 bytes**, SHA-specific prerelease. [Release and assets](https://github.com/russellstokes-ai/Archivist/releases/tag/archivist-commercial-test-05fec3c); [SHA256SUMS.txt](https://github.com/russellstokes-ai/Archivist/releases/download/archivist-commercial-test-05fec3c/SHA256SUMS.txt) is the authoritative exact checksum. Do not infer a checksum from file size or SHA-1 Git commit.
- **Same-source build verification:** [GitHub Actions run 38154082575](https://github.com/russellstokes-ai/Archivist/actions/runs/38154082575) marked **SUCCESS**, including source checkout/Expo Doctor/TypeScript/mobile tests, `:app:lintRelease`, `:app:assembleRelease`, APK signature, 16KB-compatible zip alignment check, package name `app.archivist.reader.scanneracceptance`, and arm64 ABI verification. The release and Actions artifact uploads succeeded. This is the **first current build containing the approved production Lottie controls**; older `c3465f5` build remains a separate historical preview.
- **Installation state:** same isolated acceptance package as prior scanner/Fold test, not production app; can update an existing acceptance installation and retain its test-specific data. Back up important test-only data first.
- **Physical acceptance status remains OPEN.** Test actual scanner behaviour, book open/close at enlarged size, Lottie and reduced-motion visibility, Fold keyboard/footer, playback, metadata Save/Assist contention, Atlas/Reader/Comic Focus and real-library performance. This is a validated **test APK**, not an accepted commercial release.
- **Progress archival:** this post-build entry plus the companion `docs/ARCHIVIST_COMMERCIAL_TEST_HANDOFF_2026-10-11.md` are documentation-only, made **after** compiling the immutable `05fec3c` APK; the APK itself remains pinned to `05fec3c` and is not rebuilt by this docs-only commit.

## Final user override and reversion — 2026-10-11

**USER DECISION:** The experimental commercial-polish APK `05fec3c` was rejected. The user explicitly requested to revert to the canonical version and ditch the newly created version. This also withdraws the preceding Living Book enlargement authorisation. No book scaling, viewport changes, border changes, Lottie replacement or UI refinements from the experiment are approved for use.

**IMPLEMENTATION ACTION:** Restore the active `feat/commercial-motion-and-reliability-20261011` development branch's ENTIRE application source to the exact canonical app snapshot (`df4c39b44394d8c512ca0298bffa7f19da356490`); retain only canonical baseline records and historical development/bug notes. This is a **full experiment abandonment**, not a claim that the abandoned build was accepted. The original immutable canonical branch remains untouched. The release-tagged 05fec3c preview remains a historical rejected artifact if still accessible from GitHub; it must not be presented as the current APK.

**Canonical test APK to use instead:** [Archivist-Fresh-Scanner-Fold-Test-20261010-df4c39b.apk](https://github.com/russellstokes-ai/Archivist/releases/download/scanner-vnext-fold-fix-20261010-df4c39b/Archivist-Fresh-Scanner-Fold-Test-20261010-df4c39b.apk). This is the original pre-existing APK, not a newly built replacement. It also carries existing pre-release/native-device acceptance limitations.

**Historical evidence retained:** mobile 100/100 and native workflows for the rejected variant and its production Lottie work may have passed earlier; those tests do not make its LOOK or user acceptance valid. `docs/ARCHIVIST_COMMERCIAL_TEST_HANDOFF_2026-10-11.md` is retained only as a historical rejected-test record. All commercial finishing sprints/P1–P9 are **PAUSED / NOT CURRENTLY APPROVED** pending new instructions; their past commits remain available in Git history for audit only. No further development should be inferred from this ledger.
