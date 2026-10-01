<p align="center">
  <img src="web/assets/archivist-primary-logo.png" alt="Archivist logo" width="190">
</p>

# Archivist

**Your books. Your listening. Your library.**

Archivist is a local-first personal library for ebooks, audiobooks, comics and PDFs. It brings files from a phone, private server and offline downloads into one coherent Shelf without making a server mandatory.

Current internal build: **0.9.0**

## The library experience

Archivist is built around works rather than loose files. Shelf is the calm day-to-day view; Library is the deeper browse, search, filter and organisation surface.

- Local, Server and Downloaded sources coexist in one library.
- Multiple folders and Spaces are supported from first setup.
- Server and downloaded copies deduplicate in the combined view.
- Smart Shelves support nested **ALL / ANY** rules.
- Collections use stable work identity across local, online and offline copies.
- Personal ratings, favourites, progress and history remain profile-scoped.
- Metadata review and duplicate review are explicit rather than silently destructive.

## Read and listen

The mobile app includes an integrated reader and a Living Audiobook Player.

**Reader**
- EPUB, PDF, CBZ, CBR and CBT support across the implemented platform paths.
- Bookmarks, highlights, notes, search and reading appearance controls.
- Deterministic Comic Focus Zoom using the original comic pixels.
- Offline PDF and comic reading on Android.
- Page-turn motion with reduced-motion support.

**Audiobooks**
- Local, server and downloaded playback.
- Durable progress, queue, bookmarks, chapter metadata and custom file ordering.
- Playback speed and native sleep-timer integration.
- Offline downloads with interrupted-download checkpoints and cleanup.
- Background and lock-screen infrastructure for the native Android build.

## Atlas and Insights

**Atlas** is a continuous, pannable and zoomable map of the collection. It connects works with genre hubs, authors, series, collections, notes and tags, while preserving a list alternative for accessibility.

**Insights** turns the reader's own activity into useful history: completed and in-progress works, listening time, active days, ratings, goals, achievements and a library-wide annotation hub. Archivist does not need cloud recommendation AI to do this.

## Safe organisation

Organisation is deliberately preview-first.

- Batch preview before file changes.
- Collision detection and metadata-review gates.
- Journaled safe moves with restart recovery.
- Hard-link preference with verified copy fallback where links are unavailable.
- SHA-256 verification before originals are removed.
- Copy or disk failure leaves the original and catalogue path intact.

## Optional private server

Archivist works without a server. The optional Go server adds household sharing, remote storage and an always-on catalogue.

The server provides:
- Home Assistant add-on and standalone server packaging.
- Library-first web dashboard with guided folder browsing.
- Admin and User household roles with separate progress and preferences.
- Restart-safe background scan jobs.
- Optional watched folders with bounded scan intervals.
- Database backup and restart-staged restore.
- Profile-aware OPDS access.
- HTTP range streaming and private reader endpoints.
- Dashboard status that does **not** probe media drives simply to refresh the UI.

For remote mobile access, use a trusted HTTPS endpoint such as an existing reverse proxy or DuckDNS setup. Tailscale can be used as a private-network alternative. Archivist does not automatically expose the server to the public internet.

## Android build

The repository Android APK workflow installs the pinned toolchain, runs the mobile regression suite and Android lint, builds a release-variant APK, verifies package, version, permissions, signature, alignment and ABIs, launches it in an Android emulator, and publishes a versioned APK plus SHA-256 checksum.

The **0.9.0** test APK uses the repository test signing configuration. Production Google Play signing and AAB publication are separate release operations.

## Home Assistant

The Home Assistant package is versioned with the product at **0.9.0** and supports aarch64 and amd64. Server CI compiles the Go service for Linux ARM64 and smoke-tests the add-on container over HTTP and HTTPS.

Physical Raspberry Pi installation and update, HDD standby behaviour and external-network routing remain device acceptance checks rather than CI claims.

## Development and verification

Durable sprint checkpoints live under dev-work/checkpoints. TESTING-READINESS.md is the current acceptance record and distinguishes automated validation from checks that require real hardware.

The core product does not depend on optional third-party cloud connectors. Kobo, KOReader, Hardcover and OIDC-style integrations can be added later without blocking the private local-first library.

## Licence

Archivist application source is proprietary. See LICENSE.md.

Third-party libraries and bundled assets retain their own licences. See the repository notices and dependency licence files before public distribution.
