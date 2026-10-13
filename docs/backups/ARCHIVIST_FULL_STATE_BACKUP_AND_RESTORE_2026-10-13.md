# ARCHIVIST — Pre-v1 Full-State Backup and Recovery Register
**Snapshot date:** 2026-10-13
**Repository:** https://github.com/russellstokes-ai/Archivist
**Purpose:** Safeguard all currently tracked project source, assets, app code, server code, Home Assistant add-on, web UI, Android Auto integration, tests and APK release history before further development.

> **STATUS: PARTIALLY COMPLETE, NOT YET AN END-TO-END BACKUP OF A DEPLOYED SYSTEM.**
> GitHub source checkpoint branches were created at the exact existing SHAs below without modifying those commits. A release asset URL/SHA-256 manifest exists on this documentation branch. These GitHub refs and metadata are *not* independent offline binary copies. The currently installed phone APK's provenance and live phone/Home Assistant/NAS data have **not** been captured. Do not claim that installed-user-state restore is ready.

## 1. Fixed GitHub source checkpoints

| Role | Source Git commit SHA (40 hex, use EXACTLY) | Newly created branch (points at unmodified original commit) |
|---|---|---|
| Approved 11 Oct canonical | `df4c39b44394d8c512ca0298bffa7f19da356490` | [backup/archivist-20261013-canonical-df4c39b](https://github.com/russellstokes-ai/Archivist/tree/backup/archivist-20261013-canonical-df4c39b) |
| Later rewards/player/comic work (candidate, **NOT confirmed installed/approved**) | `131cabdc82ce7c6d6b36e0034540184bd990a3ab` | [backup/archivist-20261013-later-131cabd](https://github.com/russellstokes-ai/Archivist/tree/backup/archivist-20261013-later-131cabd) |
| Original default `main` snapshot | `22ee7645b78b752b9e954a286528fddbedfc1320` | [backup/archivist-20261013-main-22ee764](https://github.com/russellstokes-ai/Archivist/tree/backup/archivist-20261013-main-22ee764) |
| Recovery documentation | Original parent `131cabd`; separate documentation commits | `backup/archivist-20261013-recovery-docs` |

At inspection: 603 tracked files in the later source tree; 551 in canonical; 440 in original `main`. The repository contains `mobile/`, `mobile/android/`, `archivist/`, Go server backend, `web/`, GitHub workflows, tests, tracked art/icons/fonts/Lottie configuration and supporting documents. Counts are repository source-tree metadata, **not installed-app data**, and exclude untracked/uncommitted local files.

**IMPORTANT:** A GitHub branch name can be moved or deleted; the exact 40-character SHAs are the authoritative recovery references. Do not edit/force-push these backup branches. Apply repository ruleset/protection if available. Create at least one independent off-GitHub copy.

### Lock: do not modify approved application functionality
- Working Android scanner and Archivist Assist.
- Approved Shelf / Continue UI.
- Approved Living Book renderer, geometry, and book-motion behaviour.
- Approved Comic Focus / speech-bubble zoom.
- Approved Atlas Universe and charts.
- Approved Stats and Rewards.
- Approved branding, app icon, Lottie assets, design language and Fold layout.

Known defects must be isolated and separately authorised; the existence of a backup does not authorise redesign or regression.

## 2. Existing binary release artifact record

Release metadata and full published SHA-256 digests were queried from GitHub and recorded as a separate committed file:
[ARCHIVIST_GITHUB_RELEASE_MANIFEST_2026-10-13.json](./ARCHIVIST_GITHUB_RELEASE_MANIFEST_2026-10-13.json).

The snapshot lists **42 release entries**, **41 APK assets**, and **103 assets with published digest fields** (not all are APKs). These counts refer to the response at snapshot time, not independently downloaded bytes. Public GitHub release assets might later be deleted, altered or made unavailable: **download and independently store required APKs and SHA256SUMS.txt**.

Two important distinct candidate files:
- Canonical `df4c39b`: [Archivist-Fresh-Scanner-Fold-Test-20261010-df4c39b.apk](https://github.com/russellstokes-ai/Archivist/releases/download/scanner-vnext-fold-fix-20261010-df4c39b/Archivist-Fresh-Scanner-Fold-Test-20261010-df4c39b.apk), SHA-256 `e6db9274c4f63ce6fd5a4c628c201ceab250c02fc2b16744a4d0266c67ad0fdf`; 45,219,072 bytes.
- Later `131cabd`: [Archivist-Rewards-All-Fixes-131cabd.apk](https://github.com/russellstokes-ai/Archivist/releases/download/rewards-all-fixes-final-131cabd/Archivist-Rewards-All-Fixes-131cabd.apk), SHA-256 `c514133d0782d2e655679328f35335b82e40d3a67ea186d05932988319b7c6f9`; 45,789,370 bytes.
- Historical `0.9.4 Test 13` reported from source `131106942b1e4df88ac51f409885bb255c4864a7` on 6 Oct; *not evidence this is the current installed APK*.

**Do not assume either candidate is the approved installed version; verify on the device.** Match package ID, versionCode, signing fingerprint and binary hash. Do not blindly replace a currently working app.

## 3. Make the backup independent of GitHub (required)

A GitHub branch is a checkpoint, not an offsite backup. From a computer with Git installed, create an independent Git mirror/bundle and place copies on TWO independent storage destinations (ideally an external drive and a second private offsite store):

```bash
git clone --mirror https://github.com/russellstokes-ai/Archivist.git Archivist-20261013.git
git -C Archivist-20261013.git bundle create ../Archivist-20261013-allrefs.bundle --all
git -C Archivist-20261013.git rev-parse refs/heads/backup/archivist-20261013-canonical-df4c39b
git -C Archivist-20261013.git rev-parse refs/heads/backup/archivist-20261013-later-131cabd
git -C Archivist-20261013.git rev-parse refs/heads/backup/archivist-20261013-main-22ee764
git -C Archivist-20261013.git bundle verify ../Archivist-20261013-allrefs.bundle
```

Verify SHA output against Section 1. The `.bundle` preserves fetched Git objects/refs present when the clone runs, including tracked assets, tests and server code, but **not** GitHub release attachment binaries, secrets, live device data or external NAS files. After download, record checksum, e.g. PowerShell:
```powershell
Get-FileHash .\Archivist-20261013-allrefs.bundle -Algorithm SHA256
Get-FileHash .\Archivist-Rewards-All-Fixes-131cabd.apk -Algorithm SHA256
```
Compare APK hash to the JSON manifest. Copy release APKs plus `SHA256SUMS.txt` and `TEST-NOTES.txt` into a separate `releases/` folder. For complete archival coverage, download *all* relevant release attachments, not just two exemplars.

**Restore source from bundle:** `git clone Archivist-20261013-allrefs.bundle Archivist-recovered`, then `git checkout df4c39b44394d8c512ca0298bffa7f19da356490` (or other explicitly selected SHA). Verify Git files, Android gradle resources, Go sources, CI and art paths before building.

## 4. Current installed Android application: needs real-device capture

The source does not prove which APK is *installed today*. On Android:
- First, write down Archivist's installed **versionName, versionCode and package** and capture the current app screens. A technically inclined user can gather these without uninstalling via `adb shell dumpsys package app.archivist.reader`.
- Find the precise installed APK/splits with `adb shell pm path app.archivist.reader`; copying those APK files using `adb pull` may require device access. Verify binary signing/hash. Android can install split APKs, so one APK may not be sufficient.
- Secure app-private databases/preferences/cover cache/download checkpoints and user data via **an app-supported export or verified device backup path**. Do not assume Android's old `adb backup` mechanism can recover private app data on current Android versions; it commonly cannot. Samsung Smart Switch or general device backups may not include all app-private data: test restoration non-destructively.
- List SAF-granted media locations and external media: retained content-folder URIs can require renewed user approval after reinstall. NAS/Google Drive media is not embedded in the Git repository.
- DO NOT uninstall, clear storage, switch signing keys, or install an older signed APK on top of an existing build before private state is safely exported and verified. An APK is not a backup of app state.

**Gate:** Identify user's current installed APK filename/commit (or collect device build fingerprint). Until then none of the three source references may be called the exact installed-state fallback.

## 5. Home Assistant / Raspberry Pi server: back up LIVE DATA

Server source and add-on packaging are tracked in Git, including `archivist/config.yaml`, Go backend, `archivist/run.sh` and web UI. Live persistent SQLite database in the add-on's `/data`, Home Assistant add-on options, credentials and media/NAS files are **NOT** in GitHub.

1. Export the Archivist SQLite database with the existing authenticated Server UI **Backup** function (`GET /api/backup`); save encrypted/private, verify a nonzero file and its SQLite `PRAGMA integrity_check`. Do not upload this backup to public GitHub.
2. Create an appropriate **Home Assistant backup** including the Archivist add-on/configuration; retain separate backup of SSH/Tailscale/HTTPS settings, certificates and secrets via secure storage. HA backup contents depend on chosen backup scope: verify `/data` inclusion.
3. Back up actual NAS/media-library folders independently using your normal storage backup/snapshot tooling. Database backup does **not** contain the media library.
4. Record server version, add-on config (redact private tokens), source-folder mount paths, permissions and volume mappings; verify storage and architecture (`aarch64` for Pi).
5. Restore only after making a safety copy of current `/data`. The existing web restore endpoint stages a validated `.db` for apply at **next restart**, preserving a pre-restore database copy; read current version's instructions and migration rules. Never overwrite live media.
6. Verify profiles, grants, covers, reading/listening positions, scanner state, NAS reconnect, HTTP range seeking, OPDS and backups on a separate temporary environment where possible.

Security: Never put access keys, private NAS paths, family names, user media contents or raw exported databases into the public repository.

## 6. Restore and fallback decision matrix

| If problem is… | Preferred fallback | Caveats |
|---|---|---|
| New source code breaks app | Checkout/copy known-good full SHA branch, then build into separate test installation where possible | Exact signing and native config matter; avoid app-data overwrite |
| Need an immediate known APK | Install a verified archived matching APK | Might downgrade schema; restore app state using an independently validated path first |
| Server UI/backend regression | Run known server image/source + matching database backup on safe staging host | DB migration may not reverse cleanly |
| NAS disconnected | Reconnect mount and verify catalogue retained | Never treat absence as permission to delete records |
| Metadata/progress data corruption | Restore integrity-checked encrypted SQLite backup | Reconcile most recent progress before restore; avoid silent loss |
| GitHub inaccessible | Use independently stored `git bundle` plus release APK archives | GitHub-only checkpoint is insufficient |

## 7. Backup verification/acceptance gates (cannot be falsely marked complete)

- [x] Three source checkpoint branches created at exact existing SHAs; no source altered.
- [x] Main, canonical and later repository source trees inspected; mobile, Android, server, web and tracked assets present.
- [x] GitHub release metadata and published SHA256 digests recorded for current visible 42 releases.
- [x] Recovery instructions and protected-functionality rules documented on separate backup-docs branch.
- [ ] Independent mirror/bundle downloaded and checksum recorded at two separate storage locations.
- [ ] Published binary APKs downloaded, checksum verified, and copied to independent storage.
- [ ] **Current installed APK** source and signature identified.
- [ ] Device-private app state reliably exported and restore-tested, if technologically supported.
- [ ] Archivist server live SQLite backup acquired and integrity/restoration verified.
- [ ] Home Assistant add-on options, keys and persistent `/data` backed up.
- [ ] Media/NAS files backed up independently or verified already covered by snapshots.
- [ ] End-to-end rollback drill on a *separate* environment successfully completed.

### Strict go/no-go rule
Do **not** claim `CURRENT APP FULL STATE BACKED UP` until all needed live data and binary checkpoints above exist and restore testing is successful. This document safeguards exact GitHub recovery points but is not proof of an installed-device fallback.

## 8. Development safeguard

All future development goes to separate v1 branches or PRs. No direct writes to canonical/backup/main, no automatic merges to the installed build, no working scanner/Assist or five-approved-experience changes without explicit approval. New deployment/release only after tests and proven rollback path.
