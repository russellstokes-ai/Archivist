<p align="center">
  <img src="web/assets/archivist-primary-logo.png" alt="Archivist" width="220">
</p>

# Archivist

**Your library. Yours.**

Archivist 0.9.3 is a local-first personal library for ebooks, audiobooks, comics and PDFs. The iOS and Android app works on its own; an optional private server adds household sharing, remote storage, web administration and self-hosting through Home Assistant or Docker.

Local files remain useful without a server, and connecting a server later does not replace the phone library.

## Highlights

- **One library, multiple sources** — Local, Server and Downloaded content coexist without duplicate online/offline copies.
- **Shelf & Library** — cover-first browsing, search, filters, grid/list views, Smart Shelves, Collections, favourites, ratings and metadata review.
- **Audiobooks** — background playback, durable progress, mixed-source queue, chapters, bookmarks, speed, sleep-timer controls and offline server downloads.
- **Reader** — ebooks, PDFs and comics with saved position, bookmarks, highlights, notes, appearance controls and Comic Focus Zoom foundations.
- **Atlas** — a pannable, zoomable visual universe of genres, works, authors, series, collections, notes and tags.
- **Insights** — personal history, goals, ratings, achievements and a library-wide annotation hub.
- **Organisation** — preview-first safe sorting, metadata corrections, duplicate review and restart-safe recovery.
- **Family server** — simple Admin/User roles with separate progress, ratings, favourites, sessions and statistics.
- **Server resilience** — watched folders, persistent scan jobs, disconnected-drive retention, database backup/restore and OPDS.

## Mobile build validation

GitHub Actions includes **Android Test APK** for installable Android device acceptance and **iOS checks** for Expo prebuild, CocoaPods and unsigned iOS Simulator compilation. The Android workflow signs its optimized test release with the repository debug key, verifies package metadata/signature/alignment and launches it in an emulator.

Android test workflow output:

- artifact: `Archivist-0.9.3-Test-APK`
- APK: `Archivist-0.9.3-test.apk`
- checksum: `Archivist-0.9.3-test.apk.sha256`

This is an installable Android testing APK, not a production store build. Google Play publication still requires private production signing, an AAB, Play Console testing/review and store assets. iOS production distribution separately requires Apple signing/provisioning, App Store Connect testing/review and store assets.

See `GITHUB-ANDROID-BUILD.md` and `MOBILE-TESTING.md`.

## Optional server

Archivist Server is not required to use the mobile app. When connected it provides multiple source folders, private streaming/downloads, family users, guided folder browsing, background and watched scans, safe file organisation, backup/restore, OPDS and a library-first web interface.

The same server source is packaged for standalone Docker and Home Assistant.

## Home Assistant

Add this repository to the Home Assistant app/add-on store:

`https://github.com/russellstokes-ai/Archivist`

Archivist declares `aarch64` and `amd64`. CI cross-compiles the complete server for Linux ARM64 and smoke-tests the Home Assistant container. The intended home-server target includes Raspberry Pi 4-class hardware.

First run:

1. Start Archivist and open its Home Assistant panel or local web UI.
2. Create the Admin access key.
3. Add one or more mapped folders such as `/media/books`.
4. Scan them to build the Shelf.
5. Optionally enable watched scanning, create family users, download a backup or connect the mobile app.

## Remote access

The native app expects a stable **trusted HTTPS** address for remote use. Archivist does not disable certificate validation.

A correctly configured reverse proxy/DuckDNS address or Tailscale-accessible HTTPS origin can be used. The Home Assistant ingress/sidebar URL is **not** the native mobile API address.

Remote networking belongs to the host environment; Archivist does not silently create public exposure or a cloud account.

## Privacy

Archivist is designed to keep the catalogue, reading history, ratings and recommendations private to the user's device/server. Recommendations are based on media already accessible to the active profile. There is no sponsored recommendation feed and no requirement to upload reading behaviour to an external service.

## Validation status

Automated mobile and server checks cover Expo Doctor, TypeScript, behavioural tests, web export, Go tests, package parity, browser contracts, ARM64 compilation, Home Assistant container startup and health checks. Android and iOS native build gates are tracked separately in `TESTING-READINESS.md`; do not infer a native pass from the shared JavaScript/web gate.

Physical-device acceptance remains a separate gate: iPhone/iPad and Android phone/Fold layouts, real background audio, local Files/folder workflows, real Home Assistant/Pi installation and real remote networking must be exercised on intended hardware before production release.

See `TESTING-READINESS.md` for current evidence.

## Licence

Archivist application source is proprietary. See `LICENSE.md`. Third-party components retain their own licences; relevant notices are in `THIRD-PARTY-NOTICES.md` and vendor notice files.

## Updating an existing Home Assistant installation

Refresh the app/add-on store for this GitHub repository, open Archivist and install version 0.9.3. Keep the existing installation: its database and configured folders remain under `/data`. The canonical package is `archivist/`; the old duplicate package is not published.

Archivist 0.9.3 remains a testing candidate. Physical-device acceptance, store signing/distribution and the remaining platform-specific release gaps recorded in `TESTING-READINESS.md` are still in progress.

