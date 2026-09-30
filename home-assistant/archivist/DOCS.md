# Archivist for Home Assistant — Documentation

## Overview

Archivist is a self-hosted personal library server for books, audiobooks, comics and PDFs. The Home Assistant package provides the Archivist web interface and API, persistent catalogue storage, household profiles and access for the Archivist Android app.

Current Home Assistant version: **0.1.21**

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
