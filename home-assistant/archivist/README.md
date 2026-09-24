# Archivist Home Assistant add-on

Internal development packaging for HAOS on Raspberry Pi 4 and amd64 test systems.

This is not a release add-on. It exposes the current Archivist internal server through Home Assistant ingress and port `5056`. The app still uses Archivist's own unlock/session flow and prints a temporary owner access key to the add-on log on startup.

## First install check

1. Add `https://github.com/russellstokes-ai/Archivist` to the Home Assistant store repositories, then install Archivist in a test environment.
2. Start the add-on.
3. Open the add-on log and copy the `Local access key`.
4. Open the web UI through ingress or `http://homeassistant.local:5056`.
5. Unlock with the key.
6. Add a source such as `/media/books`, `/media/audiobooks`, `/share/books` or another mapped folder.
7. Scan the source and confirm titles appear in Shelf.
8. Restart the add-on and confirm the database, source list and catalogue survive.

The add-on exposes `/healthz` so Supervisor watchdog checks can confirm that the server and database are responsive.

## Paths

- Database defaults to `/data/archivist.db`.
- Home Assistant `/media`, `/share` and `/backup` are mapped read/write so source folders can be added from those mount points.
- Original media files are not modified by the scanner.

## Current limitations

- Brand icon and logo are included; final application visual polish is unfinished.
- No migration from the older organiser add-ons.
- No remote-access hardening beyond the current internal server.
- Ingress has not been validated inside a real HAOS supervisor in this environment.

## Runtime checkpoint 0.1.2-dev

Ingress-aware paths and scoped sessions now have automated tests. Direct LAN
access continues to require Archivist authentication. Only Supervisor's ingress
peer can supply ingress routing headers; these never bypass profile permissions.
The container base supports both declared architectures; actual builds/installations
still need verification. Keep data_path under /data and the internal port at 5056;
change the published host port in Home Assistant when needed. Setting allow_lan
to false requires loopback listen and disables ingress connectivity.
