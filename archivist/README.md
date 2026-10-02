<p align="center">
  <img src="logo.png" alt="Archivist" width="190">
</p>

# Archivist for Home Assistant

**Version 0.9.3**

Archivist turns Home Assistant into a private library server for books, audiobooks, comics and PDFs. It provides a polished web library, household profiles, safe organisation tools and an optional server connection for the Archivist Android app.

## Highlights

- Home Assistant ingress support.
- Multiple library folders and spaces.
- Books, audiobooks, comics and PDFs in one catalogue.
- Safe scan and organisation workflows.
- Preview-first file sorting with collision protection and recovery.
- Reading and listening progress.
- Ratings, favourites, completion history and statistics.
- Atlas library relationships.
- Administrator and household user profiles.
- Optional direct LAN and HTTPS access for the mobile app.
- Persistent data stored under `/data`.
- Health endpoint for Home Assistant Supervisor monitoring.

## Install

Add this repository to the Home Assistant app store:

`https://github.com/russellstokes-ai/Archivist`

Then install **Archivist**, start it and select **Open Web UI**.

## First start

Home Assistant ingress opens Archivist with administrator access using the authenticated Home Assistant session.

1. Open **Settings → Server** and create your owner access key for mobile/direct access.
2. Open **Settings → Library**.
3. Add one or more folders from `/media`, `/share` or `/backup`.
4. Scan the folders.
5. Return to **Shelf** to browse your library.

Your source media is not altered by scanning. File moves happen only when you explicitly preview and apply an organisation action.

## Supported platforms

- aarch64
- amd64

The package is suitable for HAOS systems including Raspberry Pi 4 and standard x86-64 Home Assistant hosts.

## Network access

Home Assistant ingress is the simplest way to use the server UI.

Archivist can also expose:

- `5056/tcp` — local HTTP interface/API.
- `5443/tcp` — optional HTTPS interface/API.

For remote mobile access, use HTTPS or a private network such as Tailscale. Plain HTTP should remain on a trusted local network.

## Documentation

See [DOCS.md](DOCS.md) for configuration, storage, access and troubleshooting information.

See [CHANGELOG.md](CHANGELOG.md) for release history.

