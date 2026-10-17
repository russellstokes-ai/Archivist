# Archivist for Home Assistant — Documentation

## Overview

Archivist is a self-hosted personal library server for books, audiobooks, comics and PDFs. The Home Assistant package provides the Archivist web interface and API, persistent catalogue storage, household profiles and access for the Archivist Android app.

Current Home Assistant version: **0.9.3**

## Installation

Add the following URL as a custom repository in the Home Assistant app store:

`https://github.com/russellstokes-ai/Archivist`

Install **Archivist**, start the app and select **Open Web UI**.

## First-run setup

### Home Assistant ingress

When Archivist is opened from Home Assistant, ingress supplies the authenticated administrator context. You do not need to copy a temporary password from the log.

After opening Archivist:

1. Go to **Settings → Server**.
2. Set an owner access key for the Android app and direct browser/API sessions.
3. Go to **Settings → Library**.
4. Add one or more source folders.
5. Scan each source.
6. Browse the resulting catalogue from **Shelf**.

### Direct access

Direct network access uses Archivist authentication rather than the Home Assistant ingress session. Set the owner access key from the ingress UI before connecting the mobile app or using the direct server address.

## Library folders

The Home Assistant package maps:

- `/media` read/write
- `/share` read/write
- `/backup` read/write
- `/ssl` read-only

Use `/media` or `/share` for normal library storage.

Archivist can manage multiple source folders. Each source can be scanned independently and represented as its own library space.

Scanning catalogues files but does not rename, move or delete the originals.

## Persistent data

Archivist stores its database and internal persistent state under:

`/data`

The default database is:

`/data/archivist.db`

Keep `data_path` under `/data` so Home Assistant can manage the package data correctly.

## Configuration

Default configuration:

```yaml
data_path: /data
listen: 0.0.0.0:5056
allow_lan: true
remote_https: false
remote_listen: 0.0.0.0:5443
certfile: fullchain.pem
keyfile: privkey.pem
```

### `allow_lan`

Leave enabled when you want the Android app or another trusted LAN client to reach the server directly.

Home Assistant ingress remains the preferred browser entry point.

### HTTPS

Set `remote_https: true` to enable the optional HTTPS listener.

Archivist expects the configured certificate and key filenames under `/ssl`. The defaults are:

- `fullchain.pem`
- `privkey.pem`

The HTTPS listener defaults to port `5443`.

## Ports

| Port | Purpose |
| --- | --- |
| 5056 | Local web interface and API |
| 5443 | Optional HTTPS interface and API |

Do not expose port 5056 directly to the public internet. For access outside the home, use properly configured HTTPS or a private network such as Tailscale.

## Household access

Archivist separates administrator controls from household reading/listening access. Household profiles keep their own progress and library preferences while administrative actions remain restricted.

## Reconnect a media file renamed outside Archivist

If you rename or move a single media file on disk and then scan, Archivist deliberately keeps the old book and its bookmarks, marks the old file unavailable, and discovers the new path as a separate candidate. **It never automatically merges books because filenames, sizes or metadata look similar.**

To reconnect an independently confirmed rename, open **Library Manager**, choose the original unavailable file and the new available file, and select **Relink renamed file**. Review the displayed work identities, paths, source and complete SHA-256 of the replacement, tick the explicit same-file attestation and confirm. The operation does not modify the actual media: it repairs the database link while keeping the original book, edition, asset ID and household progress.

This operation is intentionally restricted to a single-file/edition work, unchanged format and indexed file size, and two paths within the same source. Newly discovered candidates that have been separately published, edited, queued for listening or given reading/listening progress cannot be retired. Resolve that state independently instead. If the old file reappears, rescan instead of relinking.

**Crucial:** the old file no longer exists at its registered path, so the server cannot compare its bytes with the replacement. The destination SHA-256 only verifies that the available replacement stays unchanged between preview and apply. You must independently confirm the identity; do not use this feature to guess. Multi-track audiobook, cross-library and cross-volume relinking is still unsupported.

The action writes a durable audit event and is all-or-nothing in SQLite. Back up the server before significant organisation or recovery operations. Real NAS and Raspberry Pi installations remain subject to separate acceptance tests.

## Stop or retry an active server scan safely

Library Manager → **Health & scans** and Settings → **Library** show queued, running, cancelling, committing, complete, failed and cancelled scan jobs. Queued scans can be cancelled immediately; failed or cancelled jobs can be retried as a fresh durable job. A scan that has already started may be given a **Request safe stop** command: Archivist returns `cancelling` until the scanner reaches its next safe stage checkpoint, then records `cancelled` while preserving the old catalogue. Do not interpret the HTTP 202 response as a completed stop.

The scanner checks during staging and just before entering its atomic commit barrier. Once a job shows `committing`, cancellation is deliberately refused: it must complete or be recovered after a server restart. If the process crashes while staging, it resumes on startup; a received stop request is honoured. This avoids partial catalogue publication.

On slow or unresponsive NAS shares, a read/metadata operation may not reach the next checkpoint immediately. Archivist does **not** kill arbitrary SMB/NFS system reads or revert an active SQLite transaction. Do not assume physical files are changed by scans, and do not forcibly power off a NAS to speed up stop. See `docs/v1/SERVER_SCANNER_CANCEL_QA_2026-10-17.md` in the repository for synthetic regression coverage and remaining hardware acceptance.

## Sorting and file safety

Archivist organisation workflows are preview-first.

Before applying a move, Archivist checks the proposed destination and conflicts. Server moves are journalled so interrupted operations can be recovered. Scanning itself never moves media.

As with any software that can organise files, keep a backup of irreplaceable media.

## Health monitoring

The package exposes:

`/healthz`

Home Assistant Supervisor uses this endpoint for watchdog health checks.

## Updating

When a new Archivist version is published in this repository, refresh the Home Assistant app store. Home Assistant will show the newer version for the installed app.

Persistent data remains under `/data` across normal package updates.

## Troubleshooting

### Archivist does not appear in the app store

- Confirm the repository URL is exactly `https://github.com/russellstokes-ai/Archivist`.
- Reload the Home Assistant app store.
- If the repository was previously cached incorrectly, remove and add it again.

### A library folder is not visible

Archivist can browse the Home Assistant paths mounted into the package: `/media`, `/share` and `/backup`. Make sure your media is stored under one of those locations.

### Mobile app cannot connect

- Confirm Archivist is running.
- Set an owner access key in **Settings → Server**.
- For a local connection, use the Home Assistant host/IP and published port.
- For remote access, use HTTPS or Tailscale.
- Do not paste a Home Assistant ingress URL into the mobile server field.

### HTTPS fails to start

Check that `remote_https` is enabled and the configured certificate/key files exist in `/ssl`.

## Licence

Archivist application source is proprietary. Third-party components retain their own licences. See the repository `LICENSE.md` and `THIRD-PARTY-NOTICES.md`.

