# Archivist 0.9.0 — Testing Readiness

Updated 2026-10-01. This is the current readiness record for the recovered product branch.

## Current position

Archivist has completed the authorised implementation scope for **Sprints 1–7** and is in **Sprint 8 final release/device acceptance**.

The codebase is no longer the September halfway build. Shelf, Library, Living Player, Reader, Comic Focus Zoom, Atlas, Insights, organisation, offline downloads, household server, backup and restore, OPDS and resilience work are all present in the durable repository.

Source code and CI may be marked complete. Physical-device behaviour is not marked complete until it has actually been tested.

## Sprint status

| Sprint | Status | Durable result |
| --- | --- | --- |
| 1 — One Library, Multiple Sources | Complete | Local, Server and Downloaded coexistence, source-aware identity, deduplication, queue and progress. |
| 2 — Shelf & Library UX | Complete | Editorial Shelf, dedicated Library, Smart Shelves, Collections, filters, bulk actions and responsive Fold layouts. |
| 3 — Living Audiobook Player | Complete in source/CI | Living Book motion, source-aware playback, durable queue, progress, bookmarks, chapters, offline state and native sleep integration. |
| 4 — Reader & Comic Excellence | Complete in source/CI | EPUB, PDF and comic reader, annotations, search and appearance, CBR/CBT, offline Android PDF, Comic Focus Zoom and page-turn work. |
| 5 — Atlas | Complete | Continuous zoomable Atlas universe with stable nodes, covers, authors, series, genres, collections, notes and tags, plus list alternative. |
| 6 — Insights, Family & Organisation | Complete | Profile activity and history, Insights, goals, annotation hub, nested ALL/ANY Smart Shelves, Admin/User isolation and safe organisation. |
| 7 — Server, Resilience & Ecosystem | Complete for core scope | HA/Go server, restart-safe scans, watched sources, no dashboard media probing, backup/restore, OPDS, ARM64 gate and low-disk safety. |
| 8 — UI & Release Sweep | Active | Native-control polish is green; 0.9.0 versioning, release docs and APK/device acceptance are being completed. |

## Latest automated evidence

- Sprint 5 Mobile checks passed on f9067cf6, run 36904010022.
- Sprint 6 Mobile checks passed on 6c611f83, run 36905496035.
- Sprint 6 Server checks passed on a695f5ff, run 36905443788.
- Sprint 7 Server checks passed on 8e13649e, run 36907874679, including Linux ARM64 compilation and Home Assistant Docker smoke.
- Sprint 8 native-control polish passed Mobile checks on c6e5776a, run 36908101785.
- The 0.9.0 Sprint 8 branch must pass Mobile checks, Server checks and Android APK before the automated release sweep is closed.

## Android APK automated gate

The workflow builds the exact committed Android source rather than an Expo Go substitute. It runs npm installation and Expo Doctor, high-severity runtime audit, TypeScript and behavioural tests, Android release lint, release-variant APK assembly, package and permission checks, signature and ZIP-alignment verification, ABI checks, Android emulator install and launch, and versioned APK plus SHA-256 publication.

The testing APK uses test signing. It is installable for device acceptance but is not the production Play signing configuration.

## Physical acceptance gates still open

### Galaxy Fold closed and open
- install the generated 0.9.0 APK;
- verify Shelf and Library scrolling and density;
- verify Atlas pan, pinch and inspector;
- verify Living Player controls and page motion;
- verify EPUB, PDF and comic navigation and Comic Focus Zoom;
- verify keyboard, safe areas and light, dark and system appearance;
- verify background audio, lock-screen controls and sleep expiry;
- kill and relaunch, then confirm progress recovery.

### Home Assistant / Raspberry Pi 4B
- install or update the 0.9.0 add-on;
- verify restart and power-cycle behaviour;
- add, browse and scan multiple media roots;
- exercise watched-folder opt-in;
- back up and stage a restore on a disposable test database;
- confirm normal dashboard refresh does not wake sleeping media drives;
- observe CPU, RAM and temperature during scan and concurrent playback.

### Remote access
- test the actual trusted DuckDNS HTTPS endpoint used by the phone;
- test Tailscale or private-network fallback;
- reconnect after server or network interruption;
- verify family User and Admin isolation remotely.

### Visual review
- capture screenshots on Fold closed and open plus Home Assistant browser;
- check text clipping, empty, error and offline states and touch targets.

## Publication gates after device acceptance

These are release operations rather than missing core product features:
- production Android keystore or Play App Signing;
- signed AAB and Play Console internal test;
- store listing, screenshots and privacy policy;
- final third-party licence and attribution audit for the exact distributed binaries;
- iOS native signing and build acceptance when iOS distribution becomes a target.

## Deferred optional integrations

Kobo, KOReader, Hardcover, email or OIDC, private RSS, sharing, casting and similar third-party ecosystems are not dependencies of the 0.9 core product.

## Durable continuation rule

Read this file, then the newest checkpoint under dev-work/checkpoints. Do not mark a device-only gate complete from source inspection or emulator evidence.
