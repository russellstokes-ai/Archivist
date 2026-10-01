# Archivist 0.9.2 — Testing Readiness

**Candidate branch:** `dev/archivist-work`  
**Candidate mobile commit:** `77842e1f`  
**Target:** Android-first local app + optional Home Assistant/Docker server.

This file is the authoritative testing handoff. Historical Pack notes are superseded by the durable Sprint checkpoints under `dev-work/checkpoints/`.

## Current crafted UI sweep

The canonical mobile UI is on `dev/archivist-work`. This sweep was completed screen-by-screen after physical Galaxy Fold screenshots exposed scaling, typography, fallback-artwork and Fold breakpoint problems. It is **not visually accepted yet**; automated checks verify engineering only.

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
| Comic Focus Zoom | Implemented foundations and regression tests | Real comic gesture/focus quality |
| Atlas | Continuous universe retained; responsive inspector refinement | Phone/Fold visual, gesture and performance review |
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

Current runtime candidate `77842e1f` is the crafted UI sweep head. Its Mobile checks are the engineering gate; physical screenshot/device review remains the visual gate.

## Sprint status

- **Sprint 1–4:** durable foundations/player/reader/offline work complete in the recovered development branch.
- **Sprint 5:** Atlas complete and CI-proven.
- **Sprint 6:** Insights, family and organisation complete and CI-proven.
- **Sprint 7:** core server/resilience/ecosystem scope complete and CI-proven.
- **Sprint 8:** source/UI/release sweep complete; final candidate CI/APK plus physical acceptance remain.

## 0.9.2 Android test artifact

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

Do not call 0.9.2 a production store release until the physical checks above pass. Production Google Play publication additionally needs a private signing key, AAB workflow, Play Console testing/policy review, screenshots/store listing and final privacy/legal review.

Do not merge `dev/archivist-work` to `main` solely because CI is green; merge only after the user approves the physical testing candidate.
