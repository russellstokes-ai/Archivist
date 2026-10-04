# Archivist 0.9.3 — Testing Readiness

## 2026-10-04 — Build 6 Sprint 3: online comic metadata enrichment GREEN

- Tested executable head: `1dcc30fb1b621c4233f1ff54677d1d235ce23bc5`.
- Comic scanning now preserves rich ComicInfo fields including distinct issue/volume, creator roles, arcs, characters, teams, universes, IDs, dates and page count.
- ComicInfo `Volume` no longer overwrites `Number` as issue order.
- Metron issue enrichment supports sparse filenames/folders, issue/volume/year/publisher evidence, UPC/SKU and provider/external IDs.
- Matching is conservative: wrong-issue candidates are strongly rejected; only high-confidence exact-ID or exact-issue + strong-series matches auto-apply; ambiguous results remain review items.
- Manual, embedded and sidecar metadata plus existing selected covers remain protected.
- Metron bearer credentials are read from native SecureStore and are not embedded in source or persisted in catalogue files.
- Provider configuration UI is intentionally deferred to Sprint 4 so books + comics receive one coherent Settings/Data setup.
- **PASS Mobile:** run `37238680951` — Expo Doctor, TypeScript, **44/44 suites**, version consistency and web bundle.
- **PASS iOS:** run `37238680942` — Expo Doctor, TypeScript, iOS generation, CocoaPods and full Simulator compile.
- Live Metron/large real-library and physical-device acceptance remain open.
- Full checkpoint: `dev-work/checkpoints/2026-10-04-build6-sprint-03-online-comics.md`.

## 2026-10-04 — Build 6 Sprint 2: online book metadata enrichment GREEN

- Tested executable head: `869a58df3364991d018c554277421cb734f2eb33`.
- Local scanning remains offline-first and publishes immediately; online book enrichment runs afterwards without blocking Shelf/Library.
- Open Library is the zero-configuration primary book provider; optional Google Books fallback is implemented when an API key is configured.
- Matching uses ISBN-10/13, title, author, series, publication year, filename and decoded folder structure, including sparse `Author / Title` and `Author / Series / 03 - Title` layouts.
- Manual, embedded and sidecar metadata remain protected; high-confidence unique online results fill weak/missing fields, while ambiguous matches are retained for review.
- Provider results are cached and Open Library calls are throttled; work/edition identities are recomputed after accepted enrichment.
- **PASS Mobile:** run `37237039848` — Expo Doctor, TypeScript, **43/43 suites**, version consistency and web bundle.
- **PASS iOS:** run `37237039929` — Expo Doctor, TypeScript, iOS generation, CocoaPods and full Simulator compile.
- Live-provider testing against a large real library remains open for Build 6 device acceptance.
- Full checkpoint: `dev-work/checkpoints/2026-10-04-build6-sprint-02-online-books.md`.

## 2026-10-04 — Build 6 Sprint 1: Astra blocker integration GREEN

- Astra blocker bundle integrated on the Test 5 lineage.
- Android fullscreen native bridge defect found by CI and fixed at `7184d87ae0d70eeba1348f387283cd876ce9e216`.
- **PASS Mobile:** run `37236065381`.
- **PASS Android native:** run `37236065446` — native contract tests, Kotlin compile and merged manifest.
- Later Build 6 iOS run `37237039929` confirms the same native integration still generates and compiles successfully after Sprint 2 TypeScript-only work.
- Physical device visual/interaction acceptance remains open.
- Full checkpoint: `dev-work/checkpoints/2026-10-04-build6-sprint-01-astra-blockers.md`.

## 2026-10-04 — Device polish Sprint 12: FINAL RELEASE GATE GREEN

- Final release source: `6bc68362f1ab48e24ff47aa684bbbd1bd3c7e468`.
- Release identity: **Archivist 0.9.4 test build 5**, Android versionCode **95**.
- **PASS Mobile:** run `37229417563`.
- **PASS Android native:** run `37229417463`.
- **PASS iOS:** run `37229417437`, including full Simulator compile.
- **PASS Android Test APK:** run `37229417444`, including release lint/build, package/version/permission/signature/ABI/alignment verification and successful Android emulator launch smoke.
- Published release tag: `v0.9.4-testing.5`.
- APK: `Archivist-0.9.4-test-5.apk`.
- APK SHA-256: `e6915b85f57cd86ea7da9436d5ac7ecc5f189bd85f5119cbbe726a73dfe9603f`.
- Sprint 12 introduced no product/UI redesign; it is the final regression/release checkpoint.
- Remaining acceptance is physical-device testing, not another planned development sprint.
- Full checkpoint: `dev-work/checkpoints/2026-10-04-device-sprint-12.md`.

## 2026-10-04 — Device polish Sprint 11: Shelf controls & Smart Shelves GREEN

- **Arrange** now remains the Shelf structure control and also links directly to **New Smart Shelf** plus **Manage Smart Shelves & collections**.
- Smart Shelf creation now foregrounds plain-language presets: **Currently reading**, **Not started**, **Favourites**, **Highly rated**, and **Available offline**.
- Presets use the same underlying rule model, so **Advanced rules** remains available for fine tuning rather than competing with simple setup.
- Library **Save as Smart Shelf** carries current filters through the shared creation flow.
- Organisation remains inside the existing fixed-height sheet, preventing the old conditional-content layout jump from moving the underlying page.
- No Shelf content, recommendation, Library catalogue, Player, Reader, Atlas, Stats, profile, bottom-nav or Fold redesign was introduced.
- **PASS Mobile:** run `37228382695` — dependencies, Expo Doctor, TypeScript, all maintained tests, version consistency and Expo web bundle.
- **PASS iOS:** run `37228382631` — dependencies, Expo Doctor, TypeScript, native project generation, CocoaPods and full iOS Simulator compile.
- Executable/test head: `0af64e0987d2f9c281e4da475a8ef744696587eb`.
- Full checkpoint: `dev-work/checkpoints/2026-10-04-device-sprint-11.md`.
- Real-device phone/Fold visual and interaction acceptance remains open.

## 2026-10-04 — Device polish Sprint 10: phone UI alignment fixes GREEN

- Real-device phone finding: Library **All / Audio / Comic / …** format row was vertically clipped; Fold was not affected.
- Fix is explicitly phone-only (`phoneLayout < 600`): dedicated 50 px non-shrinking format ScrollView/content rail while retaining the shared 44 px tab target.
- Fold/wide Library format-tab path remains unchanged.
- Shelf **Arrange** and Atlas **List / Universe** now share the same compact icon + short-label secondary-action treatment.
- Shelf/Atlas secondary actions align to the true page content edge; the obsolete 58 px toolbar avatar inset was removed because the toolbar sits below the avatar.
- No Shelf content, Library card, Atlas graph, Player/Reader/Stats, navigation or Fold source-rail redesign.
- **PASS Mobile:** run `37225781141` — Expo Doctor, TypeScript, all maintained tests/UI contracts, version consistency and Expo web bundle.
- **PASS iOS:** run `37225781246` — Expo Doctor, TypeScript, iOS generation, CocoaPods and full iOS Simulator compile.
- Executable/test head: `59d4418bc3e53da64cd742689b7ba13f7a7d187b`.
- Full checkpoint: `dev-work/checkpoints/2026-10-04-device-sprint-10.md`.
- Real-device acceptance still needs the same phone class rechecked for unclipped tabs and the Fold view visually confirmed unchanged.


## 2026-10-04 — Device polish Sprint 9: Cover Management GREEN

- Existing locked **METADATA & COVER** editor retained; no navigation or general UI redesign.
- System image picker remains single-select and does not request broad photo-library permission.
- Picker cancellation/error does not replace the saved cover.
- Device-picked artwork is inspected before preview and copied into Archivist app-private storage before becoming a manual override.
- 25 MB is enforced against the largest verified picker/filesystem size and rechecked on the durable copy.
- Unknown-size images fail closed; failed/mismatched copies are cleaned up.
- Manual-cover destination allocation is non-overwriting even if two saves share a timestamp.
- Local cover alternatives are de-duplicated/ranked with the current scanned candidate first.
- Manual cover overrides remain protected across rescans; **Use scanned metadata & cover** removes the override and restores scanner-selected metadata/artwork.
- Behavioral suite added for cancellation, ranking, size enforcement, durable persistence, collision handling, cleanup and restore semantics.
- **PASS Mobile:** run `37224583681` — dependencies, Expo Doctor, TypeScript, all maintained tests, version consistency, Expo web export.
- **PASS iOS:** run `37224583776` — dependencies, Expo Doctor, TypeScript, native project generation, CocoaPods, full iOS Simulator compile.
- Executable/test head: `503d199be16e51e88aad61441408912305d32381`.
- Full checkpoint: `dev-work/checkpoints/2026-10-04-device-sprint-09.md`.
- Physical Android/iOS/Fold picker, process-relaunch, real-provider >25 MB and visual/accessibility acceptance remain device gates.


## Latest Atlas finishing evidence — 4 October 2026

Implementation and exported-web checks completed; full report and reproduction: [mobile/ATLAS-ACCEPTANCE.md](mobile/ATLAS-ACCEPTANCE.md).

All 33 suites, TypeScript and Expo web export passed. The browser matrix passed at 320/390/600/720/1200px, with light/dark and a Reduced Motion/enlarged-text case, plus a 2,000-book/40-genre case. These runs exercise charts, category drill-down, book/author details, synthetic pinch/pan/cancel and repeat resizing. The ring remains fixed during pinch. The earlier intercepted-click failure was traced to the existing web storage-warning banner; checks pass after explicitly dismissing it. See the acceptance report for the intermediate timing failure and final harness settings.

This supersedes the earlier checkpoint's unresolved Atlas browser checks and missing minority-category drill-down. Final code adds expandable categories, content-measured panels, a non-overlapping accent and circular pan containment. Physical Android/iOS/Fold, real server catalogues, long-session/frame-pacing and native accessibility acceptance remain pending. No production/device approval is claimed. Locked Fold, Player and Comic Focus designs remain unchanged.


## 2026-10-04 — Comic shape-following mask sprint

- Replaced envelope clipping with independent silhouette spans, exterior flood-fill to preserve enclosed lettering, and round outline dilation.
- PASS: `node mobile/speech-focus.test.cjs`, including complete synthetic silhouette coverage, open-notch exclusion, enclosed lettering, neighbouring-bubble isolation, rounded padding and prior motion tests.
- PASS: generated mobile/web/HA parity and `git diff --check`.
- Run-based dilation replaced an initially slow per-pixel expansion. Local Node 24 synthetic 400×520 rectangle benchmark: 12 runs, median 2.23 ms, maximum 11.33 ms. This is a single desktop synthetic workload, not a device latency gate.
- Analysis-resolution masking remains approximate. Real-comic labelled benchmarks, thick/broken/touching outlines, browser rendering and physical-device acceptance remain outstanding. No AI used.

## 2026-10-04 — Comic zoom motion sprint

- Added transform-based 340 ms lift / 260 ms return, mid-animation reversal, source-near placement, visual-viewport/safe-area bounds and focus restoration without scrolling.
- Immediate cancellation for page changes, pinch, resize and viewport movement; Reduced Motion has no animation.
- PASS: speech-focus detector/controller suite, including controlled-animation lifecycle and edge-placement tests; generated web/HA module parity; `git diff --check`.
- Browser rendering blocked: Chromium install returned invalid/truncated downloads. Full typecheck and physical iOS/Android/Fold motion acceptance remain unverified. No visual-quality completion claim.

## 2026-10-04 — Comic speech focus reliability sprint

- Explicit renewed scope: deterministic speech/text bubble enlargement without AI; preserve approved Player/Atlas UI.
- Fixed repeated flood-fill queue entries, invalid-input allocation guards, clipped top-edge padding and neighbouring-bubble/replaced-page cache collisions.
- Server and packaged HA speech-focus modules now generated from `mobile/speechFocus.ts` using `scripts/sync-speech-focus.cjs`.
- PASS: `node mobile/speech-focus.test.cjs` (synthetic detector corpus plus controller cache behaviour).
- Full app typecheck, real-comic precision benchmark and physical Android/iOS interaction/performance are not verified in this sprint.
- Remaining scope and limitations: `COMIC-SPEECH-FOCUS.md`. This is an incremental fix, not a declaration of Bubble Zoom parity.

## 2026-10-03 — iOS CBR parity — source complete, native compile pending

### Implemented and source-tested
- Android continues to use Archivist's existing native Junrar bridge for CBR.
- iOS now has a native RAR/CBR extraction fallback through `react-native-unarchive`.
- iOS extraction is confined to a temporary Archivist cache directory and is deleted in a `finally` path.
- Archivist re-applies its own reader limits after extraction: maximum 500 image pages, 64 MB per image entry and 256 MB total expanded image data.
- The shared archive test covers the Android native path, iOS native-unarchive path, natural image ordering, base64 loading, cleanup and oversize rejection.
- Mobile checks run `37159642916` passed install, Expo Doctor, TypeScript, all mobile suites, version consistency and web export with `react-native-unarchive` installed.
- The iOS dependency requires iOS 15.5 through SSZipArchive; Archivist now declares iOS deployment target 15.5 through Expo SDK 55 `expo-build-properties`.

### Acceptance boundary
- CocoaPods installation with the new target has passed in the current iOS workflow.
- The full unsigned iOS Simulator compile is still running at this checkpoint and is **not yet claimed complete**.
- Physical-device acceptance must still open representative real CBR archives on iPhone/iPad, including malformed and near-limit archives.


## Android Auto — current release gap

Archivist currently exposes Android media playback through Expo Audio's MediaSessionService, which supports system/lock-screen media controls.

That is **not** equivalent to a full browseable Android Auto integration.

Current source audit found no Archivist MediaLibraryService / MediaBrowserService / CarAppService or car browse tree. Therefore Android Auto library browsing must remain **not complete** until a dedicated native integration is implemented and tested in an Android Auto host/emulator and on compatible hardware.

Do not mark Android Auto complete merely because Bluetooth, lock-screen or system media controls work.


## 2026-10-03 — Final polish Sprint 6: family account recovery and revocation

### Implemented and source-verified
- Family users now expose a **Reissue key** action in mobile Settings.
- Reissue is confirmed before execution and clearly states that the old access key and existing sessions will stop working immediately.
- The newly issued key is shown once and names the family user it belongs to.
- **Revoke** now requires confirmation and explicitly states that access is removed immediately while the user's reading history/profile data remains on the server.
- The server already had a tested `POST /api/profiles/{id}/rotate-key` route; mobile now exposes it instead of forcing Admin to revoke/recreate a user when a key is lost.
- Server-side key rotation and user revocation now also delete outstanding session rows immediately rather than leaving unusable session records until expiry.
- Added/updated regression coverage for session cleanup and the mobile family-account interaction contract.

### UI boundary
- The existing Settings → Family users structure is retained.
- Actions use the existing wrapped Settings action treatment, so phone/Fold layout is not redesigned.
- Atlas, comic focus and Live Player design were not changed.

### Runtime proof still required
- Reissue a real family user's key and confirm the previous key/session immediately fails.
- Reconnect with the new one-time key.
- Revoke a real family user and verify retained history/profile data after later server-side recovery/recreation scenarios as designed.


## 2026-10-03 — Final polish Sprint 5: native backup and restore

### Implemented and source-verified
- Backup & Restore now uses normal mobile file workflows as the primary experience.
- **Save backup file** writes the existing portable non-sensitive JSON snapshot into Archivist app storage and opens the native iOS/Android share/save sheet.
- **Restore from file** uses the native document picker, enforces a 5 MB safety limit, reads the selected JSON file and feeds it through the same sanitised restore path.
- The established portable backup contract is unchanged: server credentials/access keys and device-local profile-photo paths are not included.
- Raw JSON copy/paste remains available as a quiet **Manual JSON backup** disclosure for recovery/debugging instead of occupying the Settings section by default.
- Restore status is announced through an accessibility live region.
- Added Expo SDK 55-compatible `expo-sharing` and `expo-document-picker` dependencies and strengthened the UI contract around the native file flow.

### UI boundary
- The existing Backup & Restore subgroup and visual language are retained.
- The change replaces developer-like always-visible JSON controls with the approved progressive-disclosure pattern; no Settings page restructuring occurred.

### Runtime proof still required
- Save/share to Files on iOS and Android.
- Restore from local Files, iCloud/Drive-backed providers and cancellation.
- Invalid/oversized backup files.
- Restore after app relaunch and across installations.


## 2026-10-03 — Final polish Sprint 4: source and offline removal safety

### Implemented and source-verified
- Added an explicit Remove action for local folders in Settings → Library & Metadata.
- Android local-folder removal disconnects Archivist from the selected Storage Access Framework folder and never deletes the user's original media.
- iOS imported-folder removal deletes only Archivist's private imported copy under its own `Documents/local-libraries` storage; deletion outside that protected root is rejected.
- Removing a local source rescans remaining local sources, clears catalogue entries from the removed root and drops metadata overrides tied to removed assets.
- Server source removal now requires confirmation and states that server media files are not deleted; only the Archivist source/catalogue entry is removed.
- Completed offline downloads and partial downloads now require confirmation before local data is removed, explicitly stating that the Archivist Server original is untouched.
- Added automated guards for non-destructive Android removal, protected iOS import deletion and visible confirmation contracts.

### UI boundary
- No Shelf/Library/Settings layout redesign was introduced.
- Existing Settings rows gained only the approved quiet Remove action.
- Atlas, comic focus and Live Player design were not changed.

### Runtime proof still required
- Real Android SAF source disconnect with original files verified unchanged.
- Real iOS imported-source removal and reclaimed app storage.
- Multi-source removal while another source is selected.
- Offline removal during/after interrupted downloads.


## 2026-10-03 — Universal-mobile engineering baseline GREEN

GitHub Mobile checks run `37157845522` completed successfully on commit `d35723bdc177a156866016f2fce6e45dc5affd10`.

Verified by that run:
- clean dependency installation against the Expo 55 package set;
- Expo Doctor;
- TypeScript;
- all maintained mobile test suites;
- version consistency;
- Expo web export.

This is the first current green gate for the migrated universal-mobile branch after replacing stale pre-migration `package-lock.json` / `npm ci` assumptions and aligning Expo SDK 55 patch versions.

This is an engineering baseline, not physical-device or store-release acceptance. Subsequent commits still require their own checks where they change executable code.


## 2026-10-03 — Final polish Sprint 3: persistent iOS local libraries

### Implemented and source-verified
- Removed the Android-only local-folder gate.
- Android retains Storage Access Framework folder linking and recursive scanning.
- iOS now uses Expo FileSystem's native directory picker, then copies supported media plus useful sidecars/artwork into Archivist app-private Documents storage while the temporary Files permission is active.
- The imported hierarchy is preserved and rescans use the persistent Archivist copy, so the catalogue does not depend on an external iOS security-scoped directory URI surviving an app restart.
- Imported originals in Files/iCloud are never reorganised or deleted by Archivist; organisation acts on Archivist's private imported copy.
- The scanner now supports both Android SAF `content://` trees and app-private `file://` directory trees.
- Safe organisation preview/apply/recovery now supports app-private `file://` libraries as well as SAF roots.
- Scanned local assets retain their source root so organisation targets the correct imported/linked library root.
- Added regression coverage for app-private iOS-style scanning, organisation copy and recovery deletion.
- UI wording is platform-aware without changing layout: iOS uses **Import folder** / **Rescan imported folders**; Android keeps **Add device folder** / **Rescan device folders**.

### Platform rationale
- Expo FileSystem provides an iOS directory picker, but external selected-directory access is session-scoped. Archivist therefore imports supported content into persistent app-private storage instead of persisting an external URI that can become unreadable after relaunch.
- This is deliberately copy-first and non-destructive.

### Runtime proof still required
- Real iPhone/iPad Files/iCloud folder selection and cancellation.
- Large-library import duration and UI responsiveness.
- Process-kill/relaunch persistence of the imported catalogue.
- Sidecar/cover preservation from real folder trees.
- Available-storage failure handling and partial-import cleanup.
- iOS safe organisation preview/apply/recovery on real files.


## 2026-10-03 — Final polish Sprint 2: profile identity and server connection

### Implemented and source-verified
- Added native profile-photo selection using the existing Expo system image picker.
- Selected profile photos are copied into Archivist app-private storage before being persisted, rather than relying on a temporary picker URI.
- Profile keeps initials and accent colour as the fallback; a stored photo can be changed or removed from Profile.
- Portable JSON backup intentionally stores only avatar initials/accent, not a device-local photo path that would be invalid on another installation.
- Restoring a portable backup therefore preserves portable avatar settings without importing a stale local-file URI.
- Server **Connect** is disabled until both server address and profile access key are present; **Check server** still requires only the server address.
- UI-contract guards now cover photo selection/removal, portable avatar backup, and the server-connect input gate.

### Boundaries / runtime proof
- No Atlas, comic-focus or Live Player code was changed.
- Existing Profile layout was retained; this adds controls within the approved AVATAR section rather than redesigning Profile.
- System-picker behaviour, photo persistence after process kill/relaunch, iOS/Android crop behaviour and screen-reader wording still require runtime/device verification.


## 2026-10-03 — Final polish Sprint 1: Library recovery states

### Implemented and source-verified
- Replaced the generic Library empty message with context-aware finished-product states.
- Library now distinguishes: no configured sources, empty selected device folder, no offline downloads, empty server catalogue, saved server offline, and genuine search/filter no-results.
- Recovery actions now match the state: clear search/filters, choose another source/folder, add a device folder, open server settings, or connect an Archivist Server.
- The empty-state treatment reuses the approved Archivist mark and existing designed-empty composition; no Shelf/Library layout redesign was introduced.
- Confirmed the existing source model still treats downloaded server works as **On this device** while retaining the separate Offline downloads child view.
- Added UI-contract guards for the new state-specific copy/actions.

### Boundaries
- No Atlas, comic-focus or Live Player code was changed.
- Fold/open visual geometry was not changed.
- Runtime Draftbit/device visual proof of these new empty states remains outstanding.

## 2026-10-03 — Universal mobile Live Player checkpoint (not release-ready)

Active branch: `design/draftbit-universal-phone`. The user's current instruction supersedes older references to developing on `design/hig-refresh`; that Fold reference remains locked and untouched.

### Verified baseline
- Inspected source at `a579c37852a2eed01b18c27782661e784d1972bd`.
- Both top-level Settings columns apply content-height overrides only below 600dp.
- Universe Stats, Taste & Notes, Reading Snapshot and Personal Bests apply centred metric styling only on phones.
- Existing Fold style-snapshot assertions pass; no App StyleSheet entries changed in this checkpoint. This is source evidence, not rendered visual acceptance.

### Implemented
- Transport is now −30 / −15 / play-pause / +15 / +30 seconds. Chapters remain accessible in the Chapters panel.
- Small skips animate three leaves; large skips animate six. Audio seeking runs independently of animation. Reduced Motion disables decorative turns; paused audio stays paused with the cover closed.
- Book opening/closing uses a 520ms eased transition. Narrow artwork stages scale to contain the binding; established full-size geometry is retained when it fits.
- Narrator metadata is used for the player byline when available.
- Rapid requests accumulate and coalesce through a serial seek queue. Local seek completion persists the final target. Stale track completions and failed native seeks cannot claim successful persistence.
- Server seeking rejects non-finite inputs and blocked sessions, checks the active generation after native completion, and clears completed state after a successful seek.
- Supplemental artwork is hidden from screen readers; playback information remains in the accessible controls.

### Executed checks
- `node player-transport.test.cjs`: PASS on Node 24, using its built-in TypeScript stripping. Covers skip amounts, bounds, unknown duration, rapid taps, coalescing, final persistence, failure recovery and stale-track completion.
- `node ui-contract.test.cjs`: PASS, including protected Fold styles and both approved phone fixes.
- Full discovered suite attempted: 2/30 passed in the partial local source workspace. Remaining suites cannot be accepted: TypeScript dependency is absent, and native/asset-dependent checks lack the complete checkout.
- `npm run typecheck`: BLOCKED — tsc unavailable.
- `npm run web -- --offline`: BLOCKED — Expo unavailable.
- Git clone failed because the bundled Git HTTPS helper is unavailable. Direct archive retrieval is denied by session network permissions. Source was read through the connected GitHub API.
- The checked-in Mobile Checks workflow references `mobile/package-lock.json` and uses `npm ci`, but this branch tree has no package lock. No CI pass is claimed.

### Required before feature acceptance
- Obtain the current migrated Draftbit workspace/configuration or a complete dependency-enabled checkout; do not overwrite its Expo/Yarn migration with this raw GitHub package configuration.
- Typecheck and full mobile suite; rendered phone 320/360/390/599dp and Fold 600/720/900dp review in both themes.
- Verify actual open/close reversal, six-leaf forward/reverse turns, rapid mixed skips, Reduced Motion, long titles, missing covers, safe areas and first-viewport transport visibility.
- Real audio checks: paused seeking/relaunch resume, end-of-track skipping, track changes during seek, offline playback, background/lock-screen/Bluetooth, interruptions and sleep timer.
- Adjustable skip intervals in Settings remain outstanding; this checkpoint implements approved 15/30 defaults only.
- Screenshot parity, local sleep timer parity, history/characters tools and production motion quality are not claimed complete.
- Android Auto target is native cover art plus standard media controls; native integration and car testing remain outstanding.
- Atlas remains in the separate Astra finishing stream. Comic Focus has since been completed and locked for the current product-finishing phase.

**Active mobile branch:** `design/draftbit-universal-phone`  
**Locked Fold/open reference:** `design/hig-refresh`  
**Target:** universal iOS + Android local app + optional Home Assistant/Docker server.

Current branch ownership and the approved UI state are recorded in `CURRENT-UI-HANDOFF.md`.

This file is the authoritative testing handoff. Historical Pack notes are superseded by the durable Sprint checkpoints under `dev-work/checkpoints/`.

## Current crafted UI sweep

The canonical locked Fold/reference mobile UI is on `design/hig-refresh`. Universal phone adaptations belong on `design/universal-phone`. This sweep was completed screen-by-screen after physical Galaxy Fold screenshots exposed scaling, typography, fallback-artwork and Fold breakpoint problems. It is **not visually accepted yet**; automated checks verify engineering only.

Crafted commits:

- Shelf hierarchy from physical Fold review: `a24f19cb`
- Library phone/open-Fold composition: `8b526c9d`
- Responsive audiobook Player hierarchy: `55e792fc`
- Immersive Reader UI + embedded reader palette/motion: `0c64237d`
- Atlas continuous-universe responsive refinement: `d065b02c`
- Insights reading-journal refinement: `5b3f3833`
- Profile phone/Fold refinement: `2c5dcc8d`
- Settings calm readable sections: `62d6d109`
- Onboarding and optional server setup: `8516ed33`
- Shared header/navigation/mini-player/Fold sheets: `ba3ee74c`
- Secondary controls and typography normalization: `b00b1cc2`
- Canonical responsive/Fold acceptance rules: `bb9e3cc0`
- Reader timing/palette consistency correction: `611fc7fd`
- Loading/error/Comic Focus state refinement: `638e61b8`
- Drawn rating control / final interactive-icon cleanup: `77842e1f`

The physical review that triggered this sweep demonstrated these required rules:
- open Fold is a first-class composition from 600dp, not a stretched phone;
- normal UI hierarchy must not depend on Android's generic serif metrics;
- long real titles, missing covers and unknown metadata are mandatory stress cases;
- the Player must expose progress and transport in the first viewport;
- Library controls must never clip or consume most of the catalogue viewport;
- Reader suppresses global app chrome while reading;
- CI/build success is not visual acceptance.

Do not substitute a `main` APK or any pre-`77842e1f` runtime when reviewing this sweep.

## Readiness summary

| Area | Source / automated status | Physical acceptance |
| --- | --- | --- |
| Shelf & unified Library | Crafted responsive sweep; Mobile CI gate | Re-review Fold closed/open visuals, clipping and scroll |
| Local folders | Implemented; scan/cache tests | Android Storage Access Framework with real folders |
| Server connection | Implemented; HTTPS/session compatibility tests | Real DuckDNS/Tailscale HTTPS |
| Audiobook player | Crafted responsive Player + existing playback tests | Re-review closed/open Fold first viewport, then background/lock screen/Bluetooth/calls |
| Reader | Immersive chrome + 520ms turn timing + automated reader tests | Closed/open Fold, real EPUB/PDF/comic corpus and page-turn quality |
| Comic Focus Zoom | Product work complete/locked for current phase; deterministic local implementation + regression tests | Final physical iOS/Android/Fold acceptance only |
| Atlas | Active Astra/Work finishing stream; do not treat historical Atlas checkpoints as final | Final phone/Fold visual, gesture and performance acceptance after Astra handoff |
| Insights | Crafted journal hierarchy + existing tests | Phone/Fold UX review with real usage data |
| Smart Shelves | Nested ALL/ANY engine implemented/tested | Touch/keyboard UX review |
| Safe organisation | Preview/journal/hash/copy fallback tested | Real power-loss/storage scenarios |
| Offline downloads | Implemented with checkpoints/storage cleanup | Long download/background/device test |
| Family Admin/User | Isolation/revocation/session tests | Multi-device household smoke |
| Watched server folders | Persisted/bounded scheduler tested | Actual HDD wake/standby behaviour |
| Backup/restore | SQLite snapshot/staged restore tested | Disposable real HA restore |
| OPDS | Feed/auth/profile filtering tested | Compatible reader smoke |
| Home Assistant package | Server CI, ARM64 compile, Docker smoke | Pi 4B install/update/restart |
| Android test APK | Workflow available; do not treat artifact as visual approval | Build only after final CI; install on Galaxy Fold for acceptance |
| Google Play production | Not a 0.9 testing gate | Private signing + AAB + Play Console |

## Automated evidence already green

- Sprint 5 Atlas Mobile checks: commit `f9067cf6`, run `36904010022`.
- Sprint 6 Mobile checks: commit `6c611f83`, run `36905496035`.
- Sprint 6 Server checks: commit `a695f5ff`, run `36905443788`.
- Sprint 7 server hardening / ARM64 / HA smoke: commit `8e13649e`, run `36907874679`.
- Sprint 7 package/UI follow-up: Server checks remained green, including run `36908976778`.
- 0.9.0 version-aligned Mobile checks: commit `ffe9e545`, run `36908772223`.
- Sprint 8 native-control polish: commit `c6e5776a`, run `36908101785`.

Historical crafted UI sweep head was `77842e1f`. The active universal-mobile candidate has moved on substantially; use the current `design/draftbit-universal-phone` head plus `CURRENT-UI-HANDOFF.md` rather than treating that historical commit as the present runtime candidate.

## Sprint status

- **Sprint 1â€“4:** durable foundations/player/reader/offline work complete in the recovered development branch.
- **Historical Sprint 5:** earlier Atlas implementation reached a CI-proven checkpoint, but Atlas has since been explicitly reopened for final Astra refinement and is not currently locked.
- **Sprint 6:** Insights, family and organisation complete and CI-proven.
- **Sprint 7:** core server/resilience/ecosystem scope complete and CI-proven.
- **Sprint 8:** source/UI/release sweep complete; final candidate CI/APK plus physical acceptance remain.

## Historical 0.9.2 Android test artifact

The `Android Test APK` workflow produces an optimized release variant signed with the repository debug key:

- artifact: `Archivist-0.9.2-Test-APK`
- APK: `Archivist-0.9.2-test.apk`
- checksum: `Archivist-0.9.2-test.apk.sha256`

The workflow runs dependency/Expo checks, TypeScript, behavioural tests, Android lint, release assembly, package/permission/signature/alignment/ABI verification and emulator launch.

This is for authorised testing, not Google Play publication.

## Required real-device pass

Use `MOBILE-TESTING.md` and record results for:

1. Galaxy Fold closed/open Shelf, Library, Atlas, Player, Reader, sheets and keyboard.
2. Local folder choose/rescan and persisted catalogue after process kill/reboot.
3. Audiobook background/lock-screen/Bluetooth/interruption/sleep timer.
4. Ebook/PDF/comic reading, page-turn behaviour and Comic Focus Zoom.
5. Local + Server + Downloaded coexistence and offline failure/recovery.
6. Real Home Assistant/Pi install, update, restart and multiple roots.
7. HDD standby while dashboard is open; watched scan may wake only when explicitly enabled/due.
8. Backup/restore in a disposable server instance.
9. Family Admin/User isolation across two devices/sessions.
10. Remote connection over the intended trusted DuckDNS/Tailscale HTTPS path.

## Release boundary

Do not call the current 0.9.3 candidate a production store release until the relevant physical checks above pass. Production Google Play publication additionally needs a private signing key, AAB workflow, Play Console testing/policy review, screenshots/store listing and final privacy/legal review.

Do not merge `dev/archivist-work` to `main` solely because CI is green; merge only after the user approves the physical testing candidate.

## 2026-10-02 completion pass â€” burst 1

IMPLEMENTED
- All mobile CI workflows invoke `npm test`; the runner discovers every maintained root-level `*.test.cjs` suite and reports all failures.
- Bundled SIL OFL Libre Caslon Text with expo-font for editorial headings across Shelf, Library, Player, Atlas, Insights, Profile, Settings and onboarding.
- Finer shared icon strokes, 44dp targets for previously 38/42dp square controls, larger Library hierarchy and a rounded inset mini-player.
- Work remains exclusively on dev/archivist-work.

AUTOMATED TESTED
- Clean dependency installation using a workspace-local cache.
- `npm run typecheck` passed.
- `npm test`: 20/20 maintained suites passed, including archive reader, library sources, player experience and reader experience.

PHYSICAL TESTED
- None in this burst. No mobile screenshots captured. These changes are not visually approved.

BLOCKED / REMAINING
- Java and adb were not found on PATH; native rendering, Android build and Fold acceptance remain unverified.
- Full per-screen visual refinement, native sleep reliability, reader motion, canonical Atlas relationships, embedded audio metadata/artwork, durable local sorting and server redesign/onboarding remain outstanding.
- No final APK or server release produced. Existing JS sleep tests do not establish native background sleep-timer reliability.
- Font metrics, enlarged text, first viewport and Fold reflow require actual native screen review before the next visual sprint is accepted.

## 2026-10-02 completion pass â€” burst 2

IMPLEMENTED
- Rebuilt the server presentation with the shared bundled editorial face, white/black canvases, Sage selection, desktop navigation rail, phone navigation and 2/4/5-column catalogue compositions.
- Replaced prominent format statistic cards with quiet live filters; catalogue metadata now prioritises title and author.
- Added deterministic neutral binding-style fallback covers, bounded long-title typography, skeleton loading, actionable empty state and inline retry for failed catalogue requests.
- Reworked settings, source folders, household, organisation controls and dialogs into calm sections, dividers and responsive sheets; existing actions remain wired.
- Synchronized changed source and font assets into both packaged server copies.
- Added fixture-based real-browser checks to Core CI and corrected the pre-existing playback test URL expectation to verify Home Assistant ingress-relative routing.

AUTOMATED TESTED
- Real Edge/Chromium rendering at 390, 720 and 1440 CSS pixels, both themes; no horizontal overflow in tested catalogue and settings views.
- Format filtering, search, empty search, request failure/retry, loading state, stable fallback covers, folder modal dismissal and server settings navigation passed.
- Browser syntax, UI contract and playback resume/advance/pause/reopen tests passed.
- Changed packaged files and bundled font assets match root files byte-for-byte.
- Screenshots inspected; long fallback-title overlap discovered and corrected. Screenshots use fixture catalogue data, not a running Go server or a physical Fold.

PHYSICAL TESTED
- None. This burst does not approve the native app or physical device experience.

BLOCKED / REMAINING
- Server Atlas remains its existing directory view; continuous graph implementation is outstanding.
- First-run owner-key generation, full server player composition and real-server end-to-end validation remain outstanding.
- Native app visual acceptance and the other engineering work listed in burst 1 remain outstanding.
- Explicit user gate: do not build any APK until both app and server UI are finished and verified. No APK built or workflow dispatched; no changes pushed or merged.

### 2 October â€” award and preview burst
Mobile award catalogue expanded from 7 to 69, with device-local daily ritual tracking and category filters. Reward overlay now follows theme and reduced-motion preference. Profile/streak boundary tests and all 20 mobile suites pass; TypeScript check passes. Browser adapter captures cover 13 mobile views in light/dark phone/Fold and server Library, Atlas and settings. Native timing, background activity, cross-device/server award parity and competitor count remain unverified. Overall UI is not complete and no APK was built.

### 2 October â€” Living Book, Atlas and atmosphere
Implemented three-page skip animations, ivory-page Living Book, restrained teal glow and gold reward fireworks. Browser motion checks passed for exactly three leaves, forward/reverse, seeks, rapid taps and reduced motion. Mobile 20-suite gate/typecheck passed. Server Atlas now uses a connected SVG graph and canonical relationship inspection; browser tests pass for zoom/search/selection. All three server web copies match. Browser previews use fixtures; native transforms, native playback and real-server acceptance remain outstanding. No APK built.

### 2 October — authorised testing build 0.9.3
User explicitly authorised APK build, download publication and GitHub server update. This supersedes the earlier no-APK instruction. Version 0.9.3 / Android code 93 includes the saved Living Book, Atlas ring, profile statistics and 143 award milestones. Mobile typecheck, all 20 suites and browser navigation passed before packaging. Native physical-device acceptance, server publication-year ingestion and server sorting parity remain open; this is a testing release, not a commercial-readiness assertion.


## 2026-10-03 — UI polish Sprints 4–6

### Implemented and source-verified
- **Sprint 4 — Profile:** richer identity hero with Archivist level ring/title, derived reading traits, reading snapshot, personal bests, current goals, milestone highlights, and persistent level-aware profile chrome.
- **Profile avatar:** initials remain the reliable fallback. Native system photo picking is now implemented using the existing Expo image-picker dependency, with selected photos copied into app-private storage.
- **Sprint 5 — Settings:** rebuilt around the six approved areas only: Library & Metadata; Offline & Storage; Privacy & Data; Server & Family; Accessibility; About Archivist.
- **Privacy & Data:** local-first messaging plus local JSON backup/restore for non-sensitive reading/app data; server credentials and access keys are excluded.
- **Accessibility:** persistent Reduced Motion, Increased Contrast and Larger Interface Text preferences; effective Reduced Motion also respects the device setting and remains the master switch for decorative motion.
- **About:** app version/build context, platform, connected-server state and diagnostics. Server version is shown as unavailable when the current server API does not report one.
- **Sprint 6 — source QA:** no missing styles references found; phone/Fold page shells retain the shared responsive gutters; Profile/Rewards/Settings remain aligned at the same 980px max width; the six Settings area labels are present and stale top-level headings are absent; theme-aware halo and reduced-motion paths remain wired.
- UI contract updated to lock the richer Profile, six-section Settings structure, local backup/restore, persistent accessibility preferences, progression ring, Rewards progression/trophies, Atlas nearest-node selection and floating inspector.

### Still requires runtime proof
- Draftbit visual confirmation on phone-width and Fold-width layouts in both light and dark themes.
- Native typecheck/test execution for these latest commits has **not** been observed from GitHub Actions on this branch; do not mark CI passed.
- Native profile-photo picking is source-implemented; runtime persistence/crop behaviour still requires Draftbit/device verification.
\n\n## 2026-10-03 — Shelf / Library Sprint 1\n\n### Implemented and source-verified\n- Shelf is now independent of the current Library source/folder filters and uses the full unified personal catalogue.\n- Removed the catalogue-style Browse by format and From your library Shelf sections.\n- Retained Continue, Favourites, Smart Shelves, Collections and relevance-ranked Series. Smart Shelves now explain that they update automatically from user rules.\n- Shelf Browse is now a navigation gateway into Library for Books, Comics, Audiobooks and PDFs rather than a Shelf filter.\n- When an Archivist Server is connected, Shelf adds On this device and On Archivist Server shortcuts. On this device includes local files plus offline server downloads.\n- Fresh-install setup now offers Add a folder and Connect to Archivist Server, plus a persisted Use Archivist locally only choice that suppresses future Shelf server prompts without removing server setup from Settings.\n- Added a Library-only content-family filter so the Books shortcut can include EPUB/Ebook representations without changing stored metadata or Smart Shelf rules.\n- Existing stored Shelf section preferences migrate through the new defaults, so removed catalogue sections do not reappear.\n\n### Deferred / runtime proof\n- Recently Added is intentionally not shown yet because the unified local/server work model does not expose a reliable per-work added timestamp. Do not infer recency from title order or scan order.\n- Shelf recommendation rows (Books for you / Comics for you / Audiobooks for you) belong to Sprint 2 and are not claimed complete here.\n- Draftbit/device visual confirmation is still required on phone and Fold layouts.\n- No GitHub Actions pass is claimed unless a workflow/status is attached to the final Sprint 1 commit.\n

## 2026-10-03 — Shelf / Library Sprints 2–3

### Sprint 2 — Shelf recommendations
- Added an owned-content-only recommendation engine for Books, Comics and Audiobooks.
- Recommendation candidates are available, not-started works already present in the user's unified catalogue; finished/in-progress works are excluded from recommendation rows because Continue owns active content.
- Ranking uses existing local signals only: reading/listening state, favourites, ratings, genre, author and series affinity. No generative AI or external recommendation service is used.
- Cold-start ranking remains deterministic and labels itself as learning the user's taste rather than pretending to be personalised.
- Rows are capped at 3 works on phone and 5 on Fold/wide.
- Added shelf-recommendations.test.cjs; mobile test discovery picks it up automatically.

### Sprint 3 — Library source/folder architecture
- Replaced Library's horizontal source/space chips with a shared Sources & folders navigator.
- Fold/wide uses a persistent left rail: All Library; On this device with configured local folders and Offline downloads; Archivist Server with configured server folders.
- Phone uses the same navigator in a dedicated Sources & folders sheet.
- Specific folder selection uses exact source filtering, while the broad On this device bucket includes both local files and offline server downloads.
- Storage labels now use physical-language semantics: local/downloaded = On this device; remote-only = Archivist Server. Downloaded server works retain the SAVED badge to show origin/state.
- Local folder rows are driven by the actual configured LocalFolder records. Server rows are driven by /api/sources records.

### Known limitation / next work
- Current server work records expose space but not source-folder ID/path. If multiple server source folders share the same space name, selecting either row currently filters that shared space. Advanced Library management should add source-folder identity to the server work payload in the later scan/organisation sprint.
- Recently Added remains deferred until a reliable cross-source added timestamp exists.
- Runtime visual proof is still required on phone and Fold layouts; no CI pass is claimed unless GitHub attaches one to the final commit.

## 2026-10-03 — Shelf / Library Sprint 4: scan, metadata & organisation

### Implemented and source-verified
- Library now has a dedicated **Manage** workspace rather than hiding the core content-management workflow in Settings.
- **Scan & Repair** provides beginner-friendly device-folder rescan/add actions, live scan progress and direct maintenance queues.
- Added explicit maintenance views for uncertain metadata plus blank author, series, genre and device-cover fields.
- Local and server maintenance views use editable raw-file rows, so metadata fixes act on the underlying asset rather than merely filtering grouped works.
- Server raw assets are loaded only when an explicit metadata-review/gap workflow needs them; normal Shelf/Library browsing remains work-level and bounded.
- **Advanced Organisation** reuses the existing safe local organiser: choose a layout, preview proposed copies, apply only ready items, preserve originals, and retain recovery/copy history.
- Duplicate review is available from Library and retains exact server SHA-256 verification plus non-destructive local candidate review.
- Connected Admin users can scan individual Archivist Server source folders and use the existing preview/apply safe-sort workflow from Library.
- Added `libraryMaintenance.ts` metadata-gap classification helpers and `library-maintenance.test.cjs`.
- Restored duplicate-review request handlers that were referenced but missing on the Draftbit branch.
- Fixed the progression callback type and stale UI-contract assertions uncovered by the Sprint 4 CI pass; these were pre-existing branch gate failures, not new product-scope additions.

### Automated evidence
- Mobile Checks run `37134732350` on commit `596b4d2141722f48c2af2ba0fd00c213c4eeab82`: **passed**.
- Dependency install: passed.
- Expo Doctor: passed.
- TypeScript: passed.
- Full discovered mobile test suite, including the new Library maintenance test and updated UI contract: passed.

### Acceptance still outstanding
- Draftbit **Sync → Preview** visual review on phone-width and Fold/open-width layouts.
- Light/dark visual review of the Manage sheet and maintenance queues.
- Real Android Storage Access Framework rescan against representative folders.
- Real server-folder scan / duplicate verification / safe-sort smoke against the user's Archivist Server.
- No destructive automatic metadata fill or duplicate deletion was introduced; uncertain values remain reviewable by design.

## 2026-10-03 — Draftbit Sprints 5–7: work details, branding & integrated QA

### Sprint 5 — Work details, metadata & covers
- Added a polished Work Details sheet for every unified work with artwork, title/author/series, format/genre/year, reading state, rating, location, availability, file/edition counts and metadata provenance.
- Work actions now expose Work Details without cluttering the Library cards.
- Local grouped works can edit metadata across every track in the work rather than only the first file.
- Manual local overrides now support publication year and cover URI and survive rescans.
- Manual audiobook titles take precedence over folder-derived group names.
- The metadata editor includes cover preview, optional manual cover URI and a **Use scanned metadata & cover** action that removes manual overrides and rescans.
- Server cover management remains scan-driven; the app does not pretend it can write arbitrary remote cover art when the server API does not support that safely.
- Work Details routes server Admin users into the Library management workflow for metadata/scan work and retains download/favourite/collection actions.

### Sprint 6 — Canonical Archivist logo & splash
- Added a shared in-app `ArchivistLogo` component using the canonical `mobile/assets/icon.png`.
- Replaced visible generic “A” branding in empty states, fallback covers and About with the canonical logo. User initials remain user identity, not app branding.
- The font-loading launch screen now uses the canonical logo and Archivist wordmark.
- Android app/adaptive icon and splash all use the same canonical asset.
- Expo SDK 57 splash configuration uses the supported `expo-splash-screen` config plugin with light and dark backgrounds and `contain` sizing.
- Added and locked `expo-splash-screen ~57.0.9`; Expo Doctor validates the final configuration.

### Sprint 7 — Integrated QA & lock
- Added `sprint-5-7-contract.test.cjs` to lock Work Details, grouped metadata/cover editing, canonical branding/splash, core screen presence, Fold responsive paths, themes, reduced motion and retention of Sprint 4 Library management.
- Extended local-library tests for manual cover/year overrides.
- Extended grouped-work tests so manual audiobook titles remain stable.
- Brand sweep found no remaining visible generic “A” marks; only obsolete unused style names remain and do not render.
- Core app surfaces remain present: Shelf, Library, Now/Player/Reader, Atlas, Reader Stats, Profile, Rewards and Settings.
- Existing phone/Fold responsive styles, light/dark/system themes and reduced-motion support remain wired.

### Automated evidence
- Final Mobile Checks run `37135925849` on commit `4185c9e21fbf93c3fa3e0c6eb443f2ae2ac56cb7`: **passed**.
- Dependency installation: passed.
- Expo Doctor: passed.
- TypeScript: passed.
- Mobile tests: **23/23 suites passed**, including `library-maintenance.test.cjs` and `sprint-5-7-contract.test.cjs`.

### Runtime acceptance we will check next
- Draftbit **Sync → Preview** on phone-width and Fold/open-width layouts.
- Light and dark modes for Shelf, Library, Work Details, Manage Library, Player/Reader, Atlas, Stats, Profile/Rewards and Settings.
- Work Details sheet scrolling, keyboard behaviour and action-sheet transitions on a real Android device.
- Real grouped audiobook edit/rescan and local cover override/revert using Android Storage Access Framework folders.
- Native release-build splash appearance; development clients do not constitute final splash visual acceptance.
- Real Archivist Server metadata/source scan and remote cover refresh.
- No physical Galaxy Fold or Home Assistant/server runtime acceptance is claimed by this checkpoint.



## 2026-10-03 — locked UI QA baseline

- The approved Fold/reference appearance on `design/hig-refresh` is locked by `mobile/locked-fold-ui.styles.snapshot.txt`; the UI contract compares the complete React Native StyleSheet against that snapshot.
- Behaviour-only polish completed without changing the approved StyleSheet: Reduced Motion coverage, Fold sheet transition behaviour, Player/Reader transition, Shelf loading pulse, Atlas gesture/animation coalescing, screen-reader semantics, invisible touch-target expansion, Stats Increased Contrast propagation, production-copy cleanup and keyboard/inset hardening.
- Archivist is a universal iOS + Android product. “Android-first” and Expo Go implementation wording are not approved production copy.
- `design/universal-phone` is the dedicated phone-layout workspace. Phone-specific visual adaptation must not be developed on the locked Fold/reference branch.
- Automated CI is an engineering gate, not physical visual acceptance. VoiceOver/TalkBack, real iOS/Android safe areas, Fold open/close, keyboard behaviour, real artwork, long metadata, gestures, animation frame quality and large-library runtime performance still require rendered/native verification.


## 2026-10-03 — Sprints 9–10: cover management and final UI-lock regression

### Sprint 9 — Cover management
- Replaced the old raw cover-URI workflow with the native privacy-preserving system image picker for local works.
- Selected device artwork previews immediately and is copied into Archivist app storage before becoming a protected manual cover override.
- The editor exposes ranked local cover candidates under **Other local artwork** so users can choose discovered alternatives without leaving metadata editing.
- Manual covers remain protected from rescans; **Use scanned metadata & cover** removes the override and returns the work to scan-driven artwork.
- Cover selection is single-image only and rejects files above 25 MB.
- No broad photo-library permission request is made before opening the system picker.
- Server cover management remains scan-driven until the server API safely supports explicit remote artwork writes.

### Sprint 10 — UI-lock regression
- No approved layout, copy hierarchy or StyleSheet geometry was changed.
- Extended the UI contract to lock the system picker, privacy behaviour, single-image limit, oversized-art rejection, immediate preview and local-candidate selection.
- The existing full StyleSheet snapshot remains the hard guard against accidental Fold/reference UI drift on `design/hig-refresh`.

### Current branch evidence
- Sprint 9 implementation tip before the regression checkpoint: `86bfe0735bbe8aeb65604b46e9b1eb597550a319`.
- Sprint 10 regression-lock commit: `8ae43e2be602049bbbe13c2f9d4626f96b0d1540`.
- No GitHub Actions run is attached to these latest commits yet, so dependency install, Expo Doctor, TypeScript and full mobile-suite execution are **not claimed** for this checkpoint.
- Remaining acceptance is runtime visual/interaction verification in Draftbit Preview plus real-device image selection/rescan behaviour on iOS/Android and Fold layouts.


## Atlas interaction checkpoint — 4 October 2026

Scope: active `design/draftbit-universal-phone`; locked `design/hig-refresh` untouched. Preserve all later iOS, Player, Android Auto and Comic Focus changes. This is an implementation checkpoint, not final production acceptance.

Implemented:
- Circular inner-only gesture surface with centroid-anchored pinch, bounded pan, two-to-one-finger rebasing, fit and zoom controls outside the clipping mask. Outer charts and app chrome do not receive graph transforms.
- One rounded contextual reveal for charts and selected works/authors/relationships, cancel-safe transitions and full-library search promotion into the bounded graph sample.
- Actual genre/format/year proportions around the fixed ring, restrained genre colours, collision-filtered labels and adjacency lookup caching.
- Honest minority-genre grouping, full-library author/series counts and deterministic 120-work sampling. Search includes works beyond the visible sample.
- Existing below-600dp Settings content-height and centred metric-cell fixes verified and retained.

Executed locally with Node 24 / Expo 55 dependencies:
- TypeScript: passed.
- All 33 mobile test suites: passed, including Atlas interaction, original Atlas, UI/Fold contract, Player transport and Comic Focus.
- Expo production web export: passed (845 modules).
- Atlas pure geometry tests: eight viewport widths 320–1200, pinch anchoring, hit testing, pan constraints, palette determinism, proportional chart totals and a 2,000-work catalogue. Graph construction approximately 13ms on this host; NOT native frame-time evidence.

Runtime preview uses a synthetic local 160-work catalogue, not user media. Web preview exposes the pre-existing SecureStore getValueWithKeyAsync warning; no native storage acceptance is claimed. Native Android/iOS/Fold multi-touch, interrupted gestures, light/dark/Reduced Motion, large text, real server catalogues, frame pacing and long-session memory remain open acceptance gates. Minority category drill-down and dense-library information hierarchy also require further UX review. Do not mark Atlas final or the complete test app assembled from this checkpoint alone.

Preview interaction evidence: chart open/close and fixed-control bounds passed at 320px and 390px. The subsequent 600px resize sequence timed out with another element intercepting Fit; a retry also timed out waiting for the genre control to stabilize. These failures are unresolved, and are NOT waived as passing Fold/responsive QA. Render screenshots at 390px and 720px were inspected; the initially clipped zoom toolbar was moved outside the circular clipping mask and the export/typecheck/UI contract rerun successfully. Book/author inspector browser assertions were not reached after the timeouts.
