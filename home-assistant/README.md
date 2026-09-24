<p align="center"><img src="archivist/logo.png" alt="Archivist" width="480"></p>

# Archivist for Home Assistant

**Your library. Yours.**

A privacy-first, self-hosted library for ebooks, audiobooks, comics and PDFs.
Keep media on your own server, choose multiple source folders, and organise
them into shared or separate library spaces.

## Status

**Development build, not a finished commercial release.** This repository
contains the Home Assistant server/web package, not Android or iOS installers.
Packaging checks do not certify HAOS installation or complete-product readiness.
See [testing readiness](TESTING-READINESS.md) for gaps and
[validation](VALIDATION.md) for historical checks.

## Implemented Foundations

- Multiple source folders, catalogue search, work/edition grouping and ordering.
- Household profiles, space permissions and per-profile progress APIs.
- Browser audiobook playback and basic EPUB, CBZ and PDF readers.
- Local recommendations restricted to media the profile can access.
- Embedded web interface and persistent SQLite catalogue.

Full EPUB fidelity, offline mobile use, comic speech focus, Atlas, charts and final
visual polish remain unfinished. CBR decoding and semantic EPUB markup/images are
implemented with resource limits, but need a real-book validation corpus. Optional
web file moves have previews, collision checks and recovery/undo journals; currently
they require hard-link support within one source filesystem. The scanner itself
leaves originals untouched. Native file-sort controls and cross-drive moves are pending.

## Installation

Repository owner: extract the upload archive and upload its **contents** to the
GitHub repository root. Keep `archivist/` intact; do not upload only the ZIP or
add a wrapper folder. The root must contain `repository.yaml`, this README,
the licence and `archivist/config.yaml`.

Authorised testers:

1. In Home Assistant, open Settings > Apps (Add-ons on older versions) > Store.
2. In the store menu, select Repositories and add
   `https://github.com/russellstokes-ai/Archivist`.
3. Reload the store, select Archivist and install it.
4. Start it and obtain the owner access key from its log. Keep that key private.
5. Initially open `http://homeassistant.local:5056` on your trusted LAN.
6. Add a mapped folder such as `/media/books`, then scan it.

The default port is 5056; change its host mapping if another app uses it.
Ingress routing is implemented and unit-tested; real HAOS sidebar testing remains. Do not expose
this development server directly to the internet or forward its HTTP port.
Native mobile connectivity requires trusted HTTPS and further validation.

## Storage and Platforms

- Declared architectures: aarch64 and amd64; both require runtime validation.
- Target: Raspberry Pi 4, 4 GB, running Home Assistant OS.
- Persistent application data defaults to `/data`; retain that setting.
- `/media`, `/share` and `/backup` are mapped source locations.
- `/healthz` provides the Supervisor watchdog endpoint.

Back up application data and source media before testing updates. Uninstalling
may remove private app data. Migration from older Archivist organiser packages
is not implemented; do not assume database compatibility.

## Privacy and Ownership

Recommendations operate on the accessible local catalogue, not an internet
recommendation service. No advertising or sponsored recommendation feed is
implemented. See [privacy decisions](PRIVACY-AND-MONETISATION.md).

Archivist is proprietary, copyright 2026 Russell Stokes. Public visibility does
not grant an open-source licence or redistribution rights. Use requires
authorisation under [LICENSE.md](LICENSE.md). Bundled PDF.js retains its licence
in `archivist/app/web/vendor/LICENSE`; complete third-party review remains a
release requirement.

## Reporting Problems

Report logs, architecture, Home Assistant version and reproduction steps in the
[issue tracker](https://github.com/russellstokes-ai/Archivist/issues). Remove keys,
tokens, private paths and personal library details first.

## Package Contents

| Path | Purpose |
| --- | --- |
| `repository.yaml` | Repository registration |
| `archivist/config.yaml` | App configuration |
| `archivist/Dockerfile` | Build relative to the app directory |
| `archivist/run.sh` | Startup and persisted options |
| `archivist/app/` | Complete server source and embedded web assets |
| `archivist/icon.png`, `archivist/logo.png` | Store/documentation branding |
| Root Markdown files | Licence, validation, privacy and continuation notes |

PDF character maps and fonts are losslessly bundled in one archive to reduce
upload file count, not removed. In the source checkout, run
`sh scripts/package-ha-repository.sh /absolute/path/Archivist-HA.zip` to regenerate
the package. It requires sh, realpath, mktemp, cp, mv, zip and unzip.
