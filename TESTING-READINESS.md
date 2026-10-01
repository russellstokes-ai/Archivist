# Archivist 0.9.1 — Testing Readiness

**Candidate branch:** `dev/archivist-work`  
**Candidate mobile commit:** `524ae17f`  
**Target:** Android-first local app + optional Home Assistant/Docker server.

This file is the authoritative testing handoff. Historical Pack notes are superseded by the durable Sprint checkpoints under `dev-work/checkpoints/`.

## Current visual-review pass

The canonical mobile UI is on `dev/archivist-work`. The current review candidate deliberately changes the first-glance composition of the three screens being reviewed:

- Shelf editorial composition: `697d4e0f`
- Dense Library catalogue: `c8671512`
- Living Book Player: `dc2411f7`
- 0.9.1 review-candidate version commit: `524ae17f`

Do not substitute a `main` APK or an older 0.9.0 artifact when reviewing these screens.

## Readiness summary

| Area | Source / automated status | Physical acceptance |
| --- | --- | --- |
| Shelf & unified Library | Implemented; Mobile CI-covered | Fold closed/open visual/scroll smoke |
| Local folders | Implemented; scan/cache tests | Android Storage Access Framework with real folders |
| Server connection | Implemented; HTTPS/session compatibility tests | Real DuckDNS/Tailscale HTTPS |
| Audiobook player | Implemented; state/queue/native-patch tests | Background, lock screen, Bluetooth, calls |
| Reader | EPUB/PDF/comic paths implemented; automated reader tests | Representative real-book/comic corpus |
| Comic Focus Zoom | Implemented foundations and regression tests | Real comic gesture/focus quality |
| Atlas | Continuous pan/zoom universe; deterministic graph tests | Fold gesture/performance review |
| Insights | History/goals/annotation hub implemented/tested | UX review with real usage data |
| Smart Shelves | Nested ALL/ANY engine implemented/tested | Touch/keyboard UX review |
| Safe organisation | Preview/journal/hash/copy fallback tested | Real power-loss/storage scenarios |
| Offline downloads | Implemented with checkpoints/storage cleanup | Long download/background/device test |
| Family Admin/User | Isolation/revocation/session tests | Multi-device household smoke |
| Watched server folders | Persisted/bounded scheduler tested | Actual HDD wake/standby behaviour |
| Backup/restore | SQLite snapshot/staged restore tested | Disposable real HA restore |
| OPDS | Feed/auth/profile filtering tested | Compatible reader smoke |
| Home Assistant package | Server CI, ARM64 compile, Docker smoke | Pi 4B install/update/restart |
| Android test APK | Workflow running for candidate | Install on Galaxy Fold |
| Google Play production | Not a 0.9 testing gate | Private signing + AAB + Play Console |

## Automated evidence already green

- Sprint 5 Atlas Mobile checks: commit `f9067cf6`, run `36904010022`.
- Sprint 6 Mobile checks: commit `6c611f83`, run `36905496035`.
- Sprint 6 Server checks: commit `a695f5ff`, run `36905443788`.
- Sprint 7 server hardening / ARM64 / HA smoke: commit `8e13649e`, run `36907874679`.
- Sprint 7 package/UI follow-up: Server checks remained green, including run `36908976778`.
- 0.9.0 version-aligned Mobile checks: commit `ffe9e545`, run `36908772223`.
- Sprint 8 native-control polish: commit `c6e5776a`, run `36908101785`.

Final candidate `b7842ab5` adds the last filter/accessibility polish. Its Mobile and Android Test APK workflows are the final automated gates for this checkpoint.

## Sprint status

- **Sprint 1–4:** durable foundations/player/reader/offline work complete in the recovered development branch.
- **Sprint 5:** Atlas complete and CI-proven.
- **Sprint 6:** Insights, family and organisation complete and CI-proven.
- **Sprint 7:** core server/resilience/ecosystem scope complete and CI-proven.
- **Sprint 8:** source/UI/release sweep complete; final candidate CI/APK plus physical acceptance remain.

## 0.9.0 Android test artifact

The `Android Test APK` workflow produces an optimized release variant signed with the repository debug key:

- artifact: `Archivist-0.9.0-Test-APK`
- APK: `Archivist-0.9.0-test.apk`
- checksum: `Archivist-0.9.0-test.apk.sha256`

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

Do not call 0.9.0 a production store release until the physical checks above pass. Production Google Play publication additionally needs a private signing key, AAB workflow, Play Console testing/policy review, screenshots/store listing and final privacy/legal review.

Do not merge `dev/archivist-work` to `main` solely because CI is green; merge only after the user approves the physical testing candidate.
