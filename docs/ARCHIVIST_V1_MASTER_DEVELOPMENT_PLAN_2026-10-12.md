# Archivist v1.0 — Final Master Development Plan

**Approved planning baseline:** 12 October 2026  
**Status:** Master scope / requirements and acceptance plan. **Saving this document does not authorise code, UI, asset, APK, container or production release changes.**  
**Products:** Archivist Android mobile, Android Auto audio, Archivist Server for Home Assistant (plus standalone Docker/web), and Google Play distribution.

## Product goal

A premium, dependable, privacy-first book, audiobook and comic library. **Mobile** is for reading, listening, discovery and offline use. **Server** uses the same Archivist branding and visual conventions but focuses on BookOrbit-style, advanced and efficient media-library management. **Android Auto** is a polished, safe audiobook app. Mobile must work without the server.

## 0. Mandatory protections and exclusions

1. **LOCKED and already working—do not modify as general polish work:** (1) Shelf / Continue Reading or Listening layout, (2) Living Book rendering, geometry and page-turn animations, (3) Comic Focus / speech-bubble zoom interaction, (4) Atlas Universe, rings/charts and interactions, (5) Stats and Rewards design/presentation. No redesign, asset replacement, expanded animations or unrequested visual changes. Preserve approved icon, typography and dark navy / warm ivory-gold / teal language.
2. A bug reported *in* one of these protected experiences is not authorisation to rewrite it. For unresolved issues #19 (Atlas blank), #20 (reward animations) or #25 (Living Book intermittently absent), first reproduce and diagnose; propose a strictly isolated fix and obtain specific approval before touching protected modules. Comic format/permission fixes outside Comic Focus are in scope.
3. Source control: canonical full-app reference **df4c39b** on `canonical/archivist-20261011-df4c39b`. Later APKs/branches are not interchangeable. Identify the installed APK's exact source SHA and preserve working improvements in the approved test build before implementation. Never merge stale `main` blindly.
4. **Exclude Windows sorter development and dependencies.** Scanner/library features must function independently of that tool.
5. **Remove the previous standalone Step 4.** Test and acceptance activities run within every development wave. Store-release checks are mandatory deliverables, not a separate old app-development step.
6. No destructive actions from scan, cover lookup or metadata enrichment. File organisation requires dry run, conflict validation, explicit consent, journal and recovery. No automatic duplicate deletion.
7. Raspberry Pi server deliberately omits Living Player/Living Book, Comic Focus rendering/visual processing, elaborate live Atlas animation, rewards/celebration rendering, and default server-side transcoding. Allow simple lightweight HTML5 audio/ebook/comic reading where feasible.
8. Do not promise native Android, Fold, Pi, car, or Play acceptance solely because unit/source tests pass. Real hardware acceptance is required.

## A. Android mobile: required development

### P0 — core failures and library truth

| Reference | Scope | Acceptance |
|---|---|---|
| [#16](https://github.com/russellstokes-ai/Archivist/issues/16) Comic Reader | Investigate `2000AD Annual 1978`: `UNSUPPORTED` and `net::ERR_ACCESS_DENIED`. Separate classification, SAF permission persistence, content URI, WebView origin, archive decoding and unsupported/corrupt cases. **Preserve Comic Focus.** | Real CBZ, CBR, CBT, comic PDF files open, paginate, resume, survive relaunch, and accurately report missing permission. |
| [#15](https://github.com/russellstokes-ai/Archivist/issues/15), [#14](https://github.com/russellstokes-ai/Archivist/issues/14) scanner | Large folders, bounded native reads, cancellation, background progress, metadata search/edit persistence, physical-file vs logical-work identity, comic issues, multipart audio, covers, genre/year, publishing and review queues. | No hangs, ghost rescans, lost manual edits, orphaned published works, incorrect work counts, or destructive modifications. |
| Catalogue/source state | Distinguish valid/unsupported, access denied, moved, unavailable, corrupt, review needed, published. | User sees comprehensible reason/retry; supported inaccessible files not silently hidden or misclassified. |

### P1 — targeted reliability and UX

| Reference | Scope | Acceptance |
|---|---|---|
| [#17](https://github.com/russellstokes-ai/Archivist/issues/17) | Centre **existing** playback button/glyph; preserve all dimensions, adjacent seek controls and approved player arrangement. | Visually/physically centred on standard phone and Fold closed/open for Play and Pause. |
| [#23](https://github.com/russellstokes-ai/Archivist/issues/23) | Remove extra Resume prompt; restore per-title ebook/comic/audio position after app/background/device restarts; never unexpectedly play audio. | Immediate last-position reopen with durable persisted state. |
| [#31](https://github.com/russellstokes-ai/Archivist/issues/31) | Confirm/fix server-preferring downloaded-copy logic when offline. | Usable offline copy survives disconnected server and reconnect. |
| [#32](https://github.com/russellstokes-ai/Archivist/issues/32) | Investigate PDF page/image residue when changing documents. | Exact correct document and saved page, no stale image. |
| [#24](https://github.com/russellstokes-ai/Archivist/issues/24) / [#27](https://github.com/russellstokes-ai/Archivist/issues/27) | Remove Unsupported and PDF standalone library tabs. Classify PDF into Books/Comics based on evidence; ambiguous ones remain reviewable. | Counts and source filters remain accurate; no physical files altered. |
| [#28](https://github.com/russellstokes-ai/Archivist/issues/28) / [#29](https://github.com/russellstokes-ai/Archivist/issues/29) / [#30](https://github.com/russellstokes-ai/Archivist/issues/30) | Standardise tappable affordances, typography, responsive text and Settings without redesign. | No awkward 'Audiobooks' one-letter wrapping, dead controls, clipped text or unreadable touch targets. |

### P2 — finish without changing protected visual experiences

- [#18](https://github.com/russellstokes-ai/Archivist/issues/18): eliminate white launch flash with approved brand colour and launch transition.
- [#26](https://github.com/russellstokes-ai/Archivist/issues/26): consistent bottom-navigation selected, pressed and disabled states.
- [#22](https://github.com/russellstokes-ai/Archivist/issues/22): obvious local avatar selection, replace, crop and restore; preserve existing avatar styling.
- Robust loading/empty/error states, no raw technical messages, reliable search/cached artwork and offline download queue, safe storage reporting, background audio focus, Bluetooth and headphones, lightweight haptics and accessibility. **Do not apply enhancements to the five locked experiences unless separately approved.**
- [#19](https://github.com/russellstokes-ai/Archivist/issues/19), [#20](https://github.com/russellstokes-ai/Archivist/issues/20), [#25](https://github.com/russellstokes-ai/Archivist/issues/25): **recorded existing bugs only**. Confirm against accepted installed APK and obtain permission for a minimal scoped repair before editing protected components.

### Additional known static review risks (not confirmed on-device)

- Wrong comic format routed as generic URI reader instead of archive decoder.
- Local Atlas publication filtering may exclude works despite an apparently populated Library.
- Offline source selection gives server higher priority without availability awareness.
- PDF image/page state may outlive source URI switch.
- Large archives may load base64 into JavaScript memory if native path unavailable.
- Source-level comic watchdog and Lottie tests don't establish real Android WebView/visual reliability.

Each risk must be reproduced before being treated as a confirmed fault.

## B. Archivist Server (Home Assistant + Docker + web)

**Design principle:** Same high-quality Archivist visual identity, screen conventions, search/filter meanings and media identities, but desktop/16:9-first and with sophisticated **library administration**. Do not port costly mobile animation/rendering. Existing Go/SQLite server, web UI, add-on config, scanner jobs, backups, household permissions, streaming and OPDS are foundations to retain.

### Server v1.0 features

1. **Advanced Library:** Cover grid, list and real data-table views; sort, powerful combined filters and saved views; title/author/series/issue/narrator, edition/format/source, status, missing metadata/artwork, unread, missing files.
2. **Metadata workbench:** Candidate search and comparison, confidence and provenance for each field, lock verified fields, publication year vs edition year, manual and bulk safe edits, selected covers, preview/undo and durable persistence through rescans.
3. **Series, editions and comics:** Logical work vs physical file, edition/format choice, reading sequence including fractional issues, next-in-series, missing issues, multi-track audio as one work, individual comic issues with series relationships.
4. **Scanner control:** Multiple paths/libraries and independent spaces, watched and incremental scans, stage progress and times, cancellation/recovery where actually supported, targeted retry, no publication-loss on partial failure, low-memory bounded pipelines, NAS absence diagnostics.
5. **Library health:** Work counts vs file counts, staged/discovered/review/published status, genre/year/cover coverage, permissions, missing sources, malformed files, hash-verified duplicate candidates, per-library source status, read-only export.
6. **Organise/recover:** Preview-first metadata/sort operations, collision prevention, whole-work safety, transaction history, recoverable interrupted moves; no deletion or overwriting without explicit confirmation.
7. **Household:** Admin/User scope and grants, separate saved reading/listening state, explicit sessions/key rotation and revocation, stable permission isolation for media and OPDS.
8. **API, player and remote:** HTTPS/trusted LAN, mobile streaming/download and chapter support, HTTP range seeking, compatibility checks, robust connection failure, OPDS; lightweight web audio/ebook/comic reader only.
9. **Deployment:** Home Assistant ingress and standalone direct API separated correctly, aarch64 and amd64, Pi 4-class resource caps, database backup/restore/migrations, safe upgrades and persistent `/data`, no unintentional public exposure.
10. **UI:** Lightweight Archivist-styled 16:9 administration, Overview, Libraries, Scanner, Review, Metadata, Organise, Family, Health, Settings, Recovery. Retain access to existing Shelf and browsing functions; no blanket redesign without approval.

### Server risks / acceptance ledger

| ID | Priority | Investigate / validate |
|---|---|---|
| SRV-01 | P0 | Missing/disconnected NAS retains indexed catalogue with truthful unavailable flags. |
| SRV-02 | P0 | Jobs survive restart, failure and interruption; actual cancellation truthful, no duplicate loops. |
| SRV-03 | P0 | Server and mobile agree on work identity, grouping, metadata and comic/audio formats. |
| SRV-04 | P0 | Versioned mobile/server API and backward-compatible data migrations. |
| SRV-05 | P1 | Pi 4 CPU/RAM/SSD budget under concurrent streaming and scanning; resource caps and caching. |
| SRV-06 | P1 | Per-profile authorization on search, media, progress, downloading and OPDS. |
| SRV-07 | P1 | Direct API, HTTPS, Tailscale/reverse proxy, expired credentials and reconnection. |
| SRV-08 | P1 | SQLite integrity/backup/restore/upgrade and error recovery; protect personal state. |
| SRV-09 | P1 | Web dashboard accessibility, performance, progress, errors and responsive layout. |
| SRV-10 | P2 | Safe organisation preview and journal-based rollback validation. |

## C. Android Auto — mandatory v1.0 polish

- **Audiobooks only**; no ebook/comic screens, Living Book, heavy art or editing.
- App consistently discoverable in production Android Auto; no developer mode requirement.
- Safe browsable audiobook categories: Continue Listening, Library, series, recent works and optional downloads; correct title, cover, author, current chapter and progress.
- Play/pause, skip, seek, next/previous chapter where appropriate, audio focus for calls/navigation, media hardware controls and system UI; accurate MediaSession metadata/state.
- Voice browsing/search and playback commands via supported Google Assistant / Gemini automotive integrations; graceful unsupported command response.
- Exact durable position across vehicle reconnection, process restart, Bluetooth changes and interrupted audio.
- Server disconnect -> usable downloaded audiobook fallback; no unexpected duplicate streams.
- Performance and distraction restrictions per Google's car app quality tests. Run Android Auto Desktop Head Unit and real vehicle/host acceptance; Android Automotive OS is a separately evaluated later target.
- Verify native MediaLibraryService and MediaBrowserService setup already present, rather than replacing it.

## D. Google Play publication for Android application

**Distribution is Google Play Store, category Books & Reference (not Google Play Books publisher programme).** DRM-protected Play Books content is not included or assumed accessible.

1. Production-signed Android App Bundle `.aab`, stable application ID/versionCode, Play App Signing, private secure signing and validated update migration.
2. **Target Android 16 / API 36 or later** for new phone-app submissions under the current August 2026 policy; verify requirement again at actual submission. Native ABI 64-bit and **16 KB page-size** compatibility including RAR/archive/SQLite/other native libraries.
3. Foreground media playback service declarations, appropriate notification/storage permissions, SAF-first folder permission strategy; avoid all-files access (`MANAGE_EXTERNAL_STORAGE`) unless indispensable and expressly eligible. Audit all manifest declarations and policies.
4. Complete Google Play Console **Data safety**, privacy policy URL/in-app entry, user data handling, target audience, content rating, app access declarations, permissions justification, advertising/payment/account-deletion rules if applicable, licence and third-party asset compliance.
5. Store listing: approved icon (512x512), feature graphic (1024x500), accurate screenshots (phone and supported form factors), truthful description, support email/site and release notes.
6. Provide licence-cleared testing files and reviewer instructions, demo credentials if a server account is required for any tested feature; **mobile must remain useful without server**.
7. Run Play pre-launch, Android 16 native/16 KB emulator/device, Fold open/closed, accessibility, cold/upgrade tests, crash/ANR and real-media checks. Complete closed testing/production access rules applicable to the developer account (e.g. qualifying newer personal accounts require 12 testers for 14 consecutive days).
8. Android Auto needs its own car-app quality, vehicle-safe UX, background media and voice/service discovery acceptance. Approval is not guaranteed in advance.
9. Do not promise rights to copyrighted ebooks/audiobooks or bundled third-party media; confirm terms for optional online metadata providers.

## E. Delivery plan and acceptance

### Wave A — core reliability
Trace installed APK SHA; pin source; fix core media access and scanner/categorisation, resume, PDF/offline state, play control. **Protect the five locked experiences.** Native Fold tests and source-level regression per feature.

### Wave B — server + car
Extend Go/SQLite/Home Assistant server using existing implementations; implement lightweight BookOrbit-style management without costly server-side animations; align shared contracts, provenance and household rights. Polish Android Auto end-to-end; Pi/network and car acceptance within wave.

### Wave C — commercial finish + Play
Apply only agreed app-wide interaction/navigation/settings/profile polish; crash/ANR, performance, battery and accessibility checks. Finalise store disclosures, assets and signed AAB. Submit after each previous wave's acceptance passes.

### Cross-product acceptance gates

- Supported CBZ/CBR/CBT/EPUB/PDF/MP3/M4B from representative real, large and malformed libraries.
- Correct logical work and unique comic-issue counts; no incorrect multi-novel merge; scanner can stop/recover; manual metadata survives rescan; missing files never silently deleted.
- Phone/Fold UI, restart, rotation/layout changes, auto resume, audio focus, streaming/download/offline fallback and accurate save state.
- Server Pi 4 HAOS ingress, add-on update, mounts/disconnection, SQLite backup/restore, RAM/CPU under scan + streaming and role security.
- Android Auto browse/voice/transport/distraction/real-car acceptance.
- Google Play submission requirements and review readiness.
- **No modifications** to protected five without separately documented approval and before/after device evidence.

## F. Work that can be completed in ChatGPT before a Work development session

- Keep this document as the scope of record; reconcile duplicates in the GitHub issue ledger and assign priorities.
- Write detailed acceptance matrices and regression fixtures (descriptions; no user-private paths in public GitHub).
- Define shared API and state schemas, metadata confidence/field-lock semantics and per-user progress reconciliation.
- Produce exact server UI information architecture and wireframes for approval, then freeze visuals.
- Produce Android Auto browser tree, transport/voice test matrix and Google Play release-compliance artefacts.
- Identify installed APK and relevant feature-branch provenance **before modifying source**.

**Implementation intentionally deferred until explicitly approved.**
