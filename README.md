<p align="center">
  <img src="web/assets/archivist-primary-logo.png" alt="Archivist logo" width="180">
</p>

# Archivist

Archivist is a polished personal library app for books, comics, audiobooks and PDFs. It helps readers bring scattered folders into one calm library, read and listen anywhere, organise collections, and keep an optional private server in sync when they want a shared household library.

Archivist is local-first. The mobile app works on its own, and server connection is an optional setting that can be added later.

## Highlights

- Local-first Android app for books, comics, audiobooks and PDFs.
- Add multiple folders and scan their content from the first launch.
- Sort, rename and organise files with a clear preview before changes are applied.
- Read EPUB, PDF and comics, and listen to audiobooks with saved progress.
- Connect an optional private server from app settings.
- Manage server folders, scans, devices and access from a simple web dashboard.
- Create your own server access key during setup.
- Keep family profiles, spaces and progress separate.
- Explore the library visually with Atlas, including author, series, folder, tag and genre relationships.

## Mobile App

Archivist opens straight into the library experience. Add folders from the phone, scan their contents, and start reading, listening and organising immediately.

Server connection lives in Settings. When a server is added, the app validates the address and access key, explains connection issues clearly, and keeps the local library usable even when the server is unavailable.

Archivist is designed for Google Play distribution.

## Server

The Archivist server is an optional private library hub for households and always-on storage. It provides a web dashboard for adding folders, scanning content, managing spaces, reviewing sort operations, and pairing devices.

On first launch, the owner creates their own access key in the web interface. The key is saved securely and can be changed or reset by the owner.

The server can run anywhere Docker is supported.

## Folder Setup

Archivist supports multiple folders from the start. Users can keep folders separate as spaces or combine them into one library view.

Folder setup uses guided browsing where available, clear permission messages, and readable source health states so users understand exactly what Archivist can see.

## Sorting

Sorting is available locally in the app and on the server.

Each sorting workflow shows a preview before files are changed, including the current location, proposed destination, conflicts and skipped files. Users can apply selected changes, exclude items, review history and recover interrupted operations.

## Reader And Player

Archivist includes an integrated reader and audiobook player with saved progress. The reader is designed for books, PDFs and comics, while the player keeps audiobook position across sessions and devices.

Comic speech bubble focus provides a practical non-generative comic reading flow: double-tap to focus likely speech areas, step through bubbles or panels, and keep manual zoom available at all times.

## Atlas

Atlas is the visual map of a library. It connects books by genre, author, series, folder, tags, reading status and related editions so a large collection becomes easier to understand and rediscover.

Atlas is designed to feel useful rather than decorative: genre clusters, series trails, unread areas, active authors and connected collections should all help users decide what to read next.

## Repository

Archivist application source is proprietary. See `LICENSE.md`. Third-party dependencies retain their own licences.
