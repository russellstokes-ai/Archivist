<p align="center"><img src="logo.png" alt="Archivist" width="420"></p>

# Archivist 0.9.0 for Home Assistant

**Your library. Yours.**

Archivist is a private library server for ebooks, audiobooks, comics and PDFs. The Home Assistant package provides persistent catalogue data, a browser interface and mapped access to Home Assistant media/storage folders.

## First run

1. Install Archivist from the `russellstokes-ai/Archivist` repository.
2. Start it and open the Archivist panel or local web interface.
3. Create your Admin access key on the first-run screen.
4. Add one or more mapped source folders and scan them.
5. Connect the Android app later if wanted; the mobile app remains local-first.

## Capabilities

- multiple source folders and library spaces;
- Shelf/library web browsing;
- Admin/User household access with isolated personal state;
- audiobook streaming and reading endpoints;
- safe preview-first file organisation;
- persistent restart-safe scan jobs;
- opt-in watched folders;
- disconnected-source catalogue retention;
- consistent SQLite backup and restart-time restore;
- OPDS catalogue access;
- optional HTTPS listener for a trusted remote-access setup.

## Paths and ports

- database: `/data/archivist.db`
- media: `/media`
- share: `/share`
- backup: `/backup`
- TLS: `/ssl`
- local HTTP/API: `5056`
- optional HTTPS/API: `5443`
- Supervisor watchdog: `/healthz`

## Raspberry Pi / architectures

The package declares `aarch64` and `amd64`. CI compiles the complete server for Linux ARM64 and builds/starts the Home Assistant container. The intended home-server target includes Raspberry Pi 4-class hardware.

Physical Pi installation, real-drive standby and thermal/resource behaviour remain hardware acceptance checks.

## Remote access

Do not expose plain port 5056 directly to the public internet. For the native app use a stable trusted HTTPS origin provided by the host environment, such as a correctly configured reverse proxy/DuckDNS endpoint or Tailscale-accessible HTTPS service. The Home Assistant ingress/sidebar URL is not the native app API address.

## Backups and media safety

Archivist database backups do not copy media files. Dashboard/server-status requests do not browse media roots. Watched scans are explicitly opt-in.

File organisation is preview-first and journaled. If a hard link or verified copy cannot complete, the original is retained.

## Testing status

Automated validation includes Go tests, source/package parity, browser contract checks, Linux ARM64 compilation, Docker package build/start and HTTP/HTTPS health checks.

Before production release, complete the physical Home Assistant/Pi and remote-access checklist in `MOBILE-TESTING.md` / `TESTING-READINESS.md`.

Archivist is proprietary software. See `LICENSE.md` and `THIRD-PARTY-NOTICES.md`.
