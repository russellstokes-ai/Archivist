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

## Networking

The default published port is bound to `127.0.0.1`. For trusted-LAN clients set `ARCHIVIST_BIND_ADDRESS=0.0.0.0` and secure access with your host firewall/network policy. Never forward the HTTP port directly to the public internet.

For remote mobile clients, use trusted HTTPS through a correctly configured reverse proxy or a private network (for example Tailscale). Archivist does not bypass TLS certificate verification and a Home Assistant ingress URL is not the native mobile API URL.

## Backup, restore and upgrades

Back up the Archivist database/configuration using its server backup controls and verify that the backup can be restored. Back up original media separately: the media bind mount is **not** included in the application-data volume.

Pin a tested source commit/image when making a reproducible deployment. Before updating, preserve a recoverable data snapshot. Do not migrate real family data until native/server acceptance passes.

## Known limitations of this first deployment candidate

- No prepublished versioned multi-arch image, NAS marketplace template or automated Docker-upgrade procedure is supplied here.
- Docker runtime, NAS permissions, data migration, media scanning, and mobile remote access have not been validated by this chat session.
- Home Assistant packaging and mobile source are unchanged. Do not treat this candidate as a full commercial release.
