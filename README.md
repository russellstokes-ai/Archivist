<p align="center">
  <img src="web/assets/archivist-primary-logo.png" alt="Archivist" width="190">
</p>

# Archivist

**Your library, yours.**

Archivist is a private, local-first library for books, audiobooks, comics and PDFs. It combines a polished Android reading and listening experience with an optional self-hosted server for household libraries, shared storage and remote access.

| Component | Current version |
| --- | --- |
| Home Assistant app | **0.1.21** |
| Android app | **0.1.0** |

## What Archivist does

- Brings books, audiobooks, comics and PDFs into one library.
- Works locally on Android without requiring a server.
- Connects to an optional private Archivist server for shared household libraries.
- Supports multiple library folders and spaces.
- Scans, groups and organises media while preserving the original files unless you explicitly apply a move.
- Provides preview-first sorting with collision checks and recovery safeguards.
- Includes EPUB, PDF and comic reading plus audiobook playback and saved progress.
- Includes comic speech focus for fast double-tap navigation around likely speech areas.
- Tracks reading/listening progress, completion, ratings, favourites and personal statistics.
- Maps library relationships through Atlas using authors, series, genres, formats, reading state and ratings.
- Supports administrator and household user profiles with separate progress and permissions.
- Keeps recommendations private and based on the library you already own.

## Home Assistant

Archivist can be installed directly from this repository as a Home Assistant app.

### Add the repository

In Home Assistant:

1. Open **Settings → Apps → App store**.
2. Open the repository menu.
3. Add:

`https://github.com/russellstokes-ai/Archivist`

4. Refresh the store.
5. Open **Archivist** and install it.
6. Start Archivist and select **Open Web UI**.

The Home Assistant package supports **aarch64** and **amd64**, including Raspberry Pi 4 installations running HAOS.

### First start

When opened through Home Assistant ingress, Archivist uses the authenticated Home Assistant session for administrator access.

From **Settings → Server** you can set the owner access key used by the Android app and direct network sessions. Then add one or more library folders, scan them, and your Shelf is ready.

Home Assistant exposes these folders to Archivist:

- `/media`
- `/share`
- `/backup`

Archivist keeps its persistent database under `/data`.

For full configuration and network guidance, see [archivist/DOCS.md](archivist/DOCS.md).

## Android

Archivist 0.1.0 introduces the redesigned mobile shell: four fixed destinations — **Shelf, Library, Atlas and Insights** — with Player, Reader and Settings treated as contextual experiences rather than permanent navigation tabs. Shelf is the calm, curated home; Library contains the complete searchable collection; Atlas leads with the connected visual graph; and Insights brings reading history, achievements and statistics together.

The Android app is local-first. You can add folders, scan and organise your library, read or listen without a server, then add an Archivist server later from Settings.

A connected server adds shared household libraries, remote storage, server-side organisation, account separation and cross-device progress.

## Reader and player

Archivist is designed around reading and listening rather than file management.

The reader supports books, PDFs and comics with saved progress, zoom controls and comic speech focus. The audiobook player includes chapters, speed control, queues, background playback, lock-screen integration and sleep-timer support.

## Atlas

Atlas is the visual map of your library. It connects works through author, series, genre, format, space, reading state, ratings and favourites while keeping the approved rounded graph presentation.

Atlas is intended to make a large personal collection easier to rediscover, not to send your reading history to an external recommendation service.

## Privacy

Archivist is self-hosted and privacy-first. Your catalogue, progress and household data stay with your installation. External metadata lookups are optional rather than required for normal library use.

For remote access, prefer HTTPS or a private network such as Tailscale. Do not expose the plain HTTP port directly to the public internet.

## Repository layout

- `archivist/` — Home Assistant app package.
- `mobile/` — Android/React Native application.
- `web/` — server web interface.
- Root Go sources — Archivist server.
- `repository.yaml` — Home Assistant repository metadata.

## Licence

Archivist application source is proprietary. See [LICENSE.md](LICENSE.md). Third-party components retain their respective licences; see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
