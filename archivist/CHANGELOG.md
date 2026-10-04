# Changelog

## 0.9.4 — final polish testing candidate

- Aligns the Home Assistant package version with the 0.9.4 mobile testing candidate.
- Adds no database or media-schema migration; existing `/data` state and configured sources are retained.
- Mobile/server endpoint parity is covered by the release regression suite.
- Physical Fold/phone, Home Assistant and remote-access acceptance remain device checks.


## 0.9.3 — UI testing release

- Updated library and connected Atlas presentation with shared typography and teal atmosphere.
- Matched Android testing release 0.9.3.
- Keeps existing source folders and database under /data.
- Native-device acceptance and remaining metadata enhancements are still in progress.


## 0.1.21 — Home Assistant product packaging

- Presents Archivist as a first-class Home Assistant app repository.
- Adds full Home Assistant app documentation and release notes.
- Documents current ingress-first administrator setup and owner access-key workflow.
- Clarifies local and HTTPS network access.
- Keeps the root `archivist/` package and mirrored `home-assistant/archivist/` package aligned.
- Retains the existing catalogue, household, organisation, reader, player, Atlas and health-monitoring capabilities.

## 0.1.20

- Home Assistant repository layout corrected so Archivist is discoverable from the repository root.
- aarch64 and amd64 package metadata.
- Home Assistant ingress, watchdog and persistent storage configuration.
- Optional HTTPS listener and mapped media/share/backup storage.

