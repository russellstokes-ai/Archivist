# Archivist Server — standalone Docker / Docker Compose

This is the first standalone packaging candidate for Archivist's **existing Go/SQLite server**. It uses the same `archivist/Dockerfile`, `archivist/run.sh` and `archivist/app` source as the Home Assistant installation. It does **not** create a second server implementation or change Archivist mobile.

## Quick start (development/QA, not a production release)

1. Install a current Docker Engine / Docker Desktop and Docker Compose v2.
2. Clone this repository, then run `cp .env.example .env` in its root (on Windows, copy the file using File Explorer).
3. Set `ARCHIVIST_MEDIA_PATH` in `.env` to an **existing absolute folder** containing your media directories. The Compose configuration refuses an unset or nonexistent media root rather than silently creating one.
4. Run `docker compose -f compose.yaml config` to inspect resolved settings.
5. Run `docker compose -f compose.yaml up -d --build`.
6. Check `docker compose -f compose.yaml ps` and `docker compose -f compose.yaml logs --tail=100 server`.
7. Open `http://127.0.0.1:5056` on the Docker host (or your configured trusted-LAN address). Set the Archivist administrator access key and add folders under `/media` in the existing web interface.

The image builds for the architecture supported by the Docker host. `linux/amd64` and `linux/arm64` are intended deployment targets; both still need platform acceptance before marking this package release-ready.

## Multi-track external rename recovery

The single-work Docker/NAS server now has a separate **Library Manager → Archivist Assist → Reconnect audiobook** workflow for a folder containing 2–32 Audio chapters (up to 4 GiB total media). The owner must inspect each old/new track pairing in order and confirm every mapping, after which the server hashes the complete replacement tracks and, with separate owner attestation, applies one atomic database relink. The old files are missing and cannot be compared cryptographically; this is owner-confirmed identification only, not automatic matching. No host media writes are required. This is a QA feature pending actual NAS/Pi tests.

## Recovery after external renames

For a single-file work renamed within the same mounted library, the server now offers an explicit **Library Manager → Relink renamed file** workflow. Select the old unavailable entry and the newly indexed available entry after scanning, inspect the signed full-hash preview, and attest that you independently verified they are the same file. The server does not move original media; it preserves the old book's internal identity and bookmarks and transactionally retires an unused staged candidate. No automatic filename/size guesses are performed. The absent original cannot be cryptographically compared with the new content. Multi-file and cross-root relinking are not yet supported.

This feature operates on the SQLite catalogue and therefore also works with the default read-only Docker media mount, subject to adequate read permissions for a full destination SHA-256. It is still a QA feature requiring real NAS/Pi verification; back up `/data` and do not treat it as a replacement for proper filesystem backups.

## Data separation and non-destructive media access

- `archivist-data` is a persistent Docker volume mounted at `/data`, containing the database, user settings and recovery information.
- Host media is mounted at `/media` **read-only by default**. Scanning, viewing and streaming do not require write access.
- File-organiser actions that write to media must **not** be attempted on read-only mounts. To support them, an administrator must separately approve and configure a dedicated writable mount and ensure file-operation recovery/permissions are tested first.
- The standalone container reads optional configuration from `/data/standalone-options.json`, not Home Assistant's `/data/options.json`, to avoid importing platform-specific listener/certificate settings accidentally.
- An existing server or Home Assistant instance must **not** be pointed at the same live SQLite data volume. Stop the source before performing a verified, backed-up migration.
- `docker compose down` stops containers without deleting the named database volume. **Do not run** `docker compose down -v` unless you intentionally wish to delete persistent Archivist application data.

## Multiple drives, NAS shares and additional library roots

Mount SMB/CIFS and NFS shares on the **Docker host**, then bind-mount those existing paths read-only into the container. This makes Synology, QNAP, TrueNAS SCALE, Unraid and ordinary Linux installations use the same server binary. Grant only the source folders Archivist needs.

For additional distinct volumes, create a local `compose.override.yaml` (do not commit machine-specific paths):

```yaml
services:
  server:
    volumes:
      - type: bind
        source: /mnt/another-drive/audiobooks
        target: /media-external/audiobooks
        read_only: true
        bind:
          create_host_path: false
```

When using an override, specify both files: `docker compose -f compose.yaml -f compose.override.yaml up -d`. Verify that the original `/data` and `/media` mounts are preserved in the resolved configuration. Bind mount entries appended by a local override must not unintentionally replace application-data mounts.

## Portable multi-library NAS configuration

For a server using **separate host volumes for books, audiobooks and comics**, use the checked-in, read-only NAS storage profile. This is the **same Go server** on Docker, Synology Container Manager, QNAP Container Station, TrueNAS SCALE, Unraid and Linux; it does not depend on Home Assistant.

1. Copy `deploy/nas/nas.env.example` to `deploy/nas/nas.env`.
2. Set `ARCHIVIST_MEDIA_PATH` (primary books), `ARCHIVIST_AUDIO_HOST_PATH` (audiobooks) and `ARCHIVIST_COMICS_HOST_PATH` (comics) to absolute **existing directories on your Docker host**. For SMB/NFS, mount the remote folders through your NAS/host OS first.
3. Inspect the resolved project before launching:

```sh
docker compose --env-file deploy/nas/nas.env -f compose.yaml -f deploy/nas/compose.volumes.yaml config
```

4. Start the existing Archivist backend:

```sh
docker compose --env-file deploy/nas/nas.env -f compose.yaml -f deploy/nas/compose.volumes.yaml up -d --build
```

5. In Archivist Server → Settings → Library, add the three container paths: `/media`, `/extra-media/audiobooks`, `/extra-media/comics`, giving each a unique library space if desired. No media-folder rescan is automatically triggered by Compose itself.

This profile refuses unset or missing host media paths and never silently creates the directories. Media mounts are read-only. The separate database volume remains writable and survives normal container recreation; do not run `down -v`.

**Host examples are illustrative, not guaranteed paths:** Synology often uses `/volume1/...`, Unraid `/mnt/user/...`, and TrueNAS `/mnt/<pool>/...`. QNAP paths vary by installed volume/firmware. Confirm the actual directories and mount permissions on each host; do not assume the examples exist. A production NAS marketplace package and pre-published multi-architecture image are separate later deliverables.

## Networking

The default published port is bound to `127.0.0.1`. For trusted-LAN clients set `ARCHIVIST_BIND_ADDRESS=0.0.0.0` and secure access with your host firewall/network policy. Never forward the HTTP port directly to the public internet.

For remote mobile clients, use trusted HTTPS through a correctly configured reverse proxy or a private network (for example Tailscale). Archivist does not bypass TLS certificate verification and a Home Assistant ingress URL is not the native mobile API URL.

## Backup, restore and upgrades

Back up the Archivist database/configuration using its server backup controls and verify that the backup can be restored. Back up original media separately: the media bind mount is **not** included in the application-data volume.

Pin a tested source commit/image when making a reproducible deployment. Before updating, preserve a recoverable data snapshot. Do not migrate real family data until native/server acceptance passes.

### Verified restore safety rules

The server's existing administrator-only backup API exports a consistent SQLite database. It is a **catalogue/state backup**, not a copy of the original media. Keep an off-server copy before any platform change.

A submitted restore is staged as `archivist.db.restore.pending` and applied on the next controlled server restart. A second upload **cannot silently replace a pending restore**. The pre-restore database, including any SQLite WAL files, is retained as `archivist.db.before-restore` after a successful restore. Applying another restore is blocked if that previous recovery snapshot still exists. Copy it outside the running data volume, verify the copy and follow an explicit administrator recovery procedure before considering its removal or replacement. Never delete a rollback copy as part of an automatic update.

If applying a staged restore encounters a filesystem error, the server attempts to restore the original database files, returning an error if recovery is incomplete rather than quietly booting with unknown data. Validate restores on disposable copies before migrating a real household.

When moving between Home Assistant, Raspberry Pi, Docker and NAS, retain or consciously remap the container-visible library roots. A valid restored database can still reference paths that are not mounted on the destination host. Do not remove those source records or perform an empty-library rescan until storage mapping and file access are verified.

## Known limitations of this first deployment candidate

- No prepublished versioned multi-arch image, NAS marketplace template or automated Docker-upgrade procedure is supplied here.
- Docker runtime, NAS permissions, data migration, media scanning, and mobile remote access have not been validated by this chat session.
- Home Assistant packaging and mobile source are unchanged. Do not treat this candidate as a full commercial release.

## Library availability diagnostics (administrator)

Archivist provides an authenticated, administrator-only `GET /api/library-health` endpoint. It returns each registered library root with its space/name, stored scan status, a **current root-availability probe**, indexed physical-file counts, stored availability flags and Needs Review counts. Household users do not receive server filesystem paths.

This check is deliberately **read-only** and shallow: it does not run a full scan, change `available` flags, remove catalogue records, or write to disconnected NAS volumes. If a drive or NAS share goes offline, the report marks the source root offline while preserving its database entries. When the root returns, the online indicator recovers without requiring deletion/reimport. A mounted but empty directory or a deeper inaccessible file may still need a scan or host-level diagnostic, so root availability is not proof every file is readable.

The web server uses the same endpoint on Home Assistant, Docker and NAS hosts. For external administration, use the existing authenticated API over a secured private network or HTTPS; do not expose an unauthenticated diagnostics route.

## ARM64 runtime and NAS-style storage regression gate

The `arm64-smoke` job in GitHub Actions workflow `.github/workflows/server-check.yml` runs on a **native Linux ARM64 runner**, alongside a separate AMD64/Home Assistant server job. Its Docker image is built from the existing `archivist/Dockerfile` and Go server source.

The ARM64 gate checks:

- Protected-file hashes and the standalone Compose contract.
- Native `aarch64` inside the running container and a functioning `/healthz` endpoint.
- Two synthetic host media roots (including **spaces in their paths**), both mapped read-only as would be the case for mounted NAS or external disks.
- Both media roots are readable but cannot be written through the container.
- `/data` remains a Docker-managed persistent volume and survives container recreation.
- The published HTTP port remains bound to localhost in the test.

**Important:** these are representative host bind mounts on GitHub's runner, **not real SMB/NFS mounts** and **not a Synology/QNAP/TrueNAS/Unraid certification test**. Real host filesystems, NAS firmware, drive disconnect/reconnect, write-authorised organiser actions, and Android remote access require separate acceptance on actual target installations. This test uses disposable synthetic content and must never mount or modify a user's media.

## Scanner health for NAS-mounted libraries

The desktop **Library Manager → Health & scans** now offers read-only identification and Atlas metadata coverage per indexed file, plus immediate owner-only filters for missing author/genre/year, low confidence, review-needed and unavailable records. These are SQLite diagnostics; they never silently launch scans, fetch metadata, alter mounted media or publish books. They remain available when the media share is offline, although the availability flags reflect the last completed scan.

If a mounted share briefly hides one or more tracks from an already-indexed audiobook, the server retains those offline tracks' original edition mappings and bookmarks while marking their database file-availability flags accurately on a completed scan. Restoring the path and scanning again keeps work, edition and asset IDs. Do not treat an entirely new file as the missing original without owner verification. Complete album/cross-volume relinking is a separate explicit and constrained workflow.

Exact synthetic acceptance and remaining physical-NAS caveats are recorded under `docs/v1/SERVER_SCANNER_PARTIAL_NAS_AND_COVERAGE_QA_2026-10-17.md`. This draft remains QA software, not a verified production NAS package.

## Using the book-level metadata workbench

The server includes **Archivist Assist 2.0** in `/manage.html` (open Archivist Assist, choose **Edit book**). Its logical-book fields, per-field origins/locks, revisioned confirm/undo, edition membership and selected cover live in the persistent SQLite catalogue under `/data`. Backups must retain all SQLite database tables, including `work_field_controls`, `work_metadata_revisions` and `work_metadata_history`. Do not delete or reset those tables during upgrades or package changes. The scanner preserves manual work-level title/author/series/genre overrides without changing original mounted media.

The UI supports 16:9 desktop browsers and narrower layouts in source; no real Home Assistant ingress, Pi4 or commercial NAS device acceptance is implied by green CI. Consult `docs/v1/SERVER_ASSIST_BOOK_WORKBENCH_QA_2026-10-17.md` before a production upgrade.
