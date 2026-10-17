# Home Assistant test build — PR 83

## Home Assistant test build — 17 October 2026

Version **0.9.3-qa.20261017.1**, built and tested source **8c4e02e6f85334c892ff7dba5e078600e54f592d**.

- [Server checks passed](https://github.com/russellstokes-ai/Archivist/actions/runs/39075785499): root/packaged Go tests, ARM64 compile/runtime, JS contracts, parity, Docker and HA smoke checks.
- [Compiled QA artifacts](https://github.com/russellstokes-ai/Archivist/actions/runs/39075785558/artifacts/12116812219): Linux amd64/arm64 binaries, HA repository ZIP and SHA256SUMS. Artifact expires 24 October 2026; repository installation remains available.
- Artifact archive SHA256: `7f78748c6ea18fa39bd37b7bb5ff39b6190acfa9a64d2a18bf354a4c031e144a`.
- Ready for owner installation testing. Physical HA/Pi4, real NAS SMB/NFS and browser/phone acceptance remain BLOCKED. No commercial-release claim, merge or production deployment.
- Subsequent documentation-only commit records these results; executable source and package version are unchanged.

## Add the test repository

Use Home Assistant OS with the Supervisor app store on **aarch64 (64-bit Pi4)**
or **amd64**. Home Assistant Container alone cannot install this app.

To install the tested candidate:

1. Open **Settings → Apps → Install app → ⋮ → Repositories**
   (older versions: **Settings → Add-ons → Add-on Store**).
2. Add this complete URL, including its branch suffix:

   `https://github.com/russellstokes-ai/Archivist#integration/archivist-v1-auto-restore-recovery-20261016`

3. Refresh the store and select **Archivist QA (PR 83)**.
4. Check the displayed version against this branch's `archivist/config.yaml`,
   then select **Install**, **Start**, and **Open Web UI**.

[Add the QA repository in Home Assistant](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Frussellstokes-ai%2FArchivist%23integration%2Farchivist-v1-auto-restore-recovery-20261016)

The default repository URL without the branch suffix does **not** select PR 83.
The manifest now selects `0.9.3-qa.20261017.1`. This supersedes the
16 October label. A version label alone does not establish a passing build.
See PR 83 Checks for the exact commit and server workflow result.

## How installation builds the server

The repository already contains `repository.yaml`, `archivist/config.yaml`,
`archivist/Dockerfile`, and the complete mirrored `archivist/app` source.
There is no prebuilt image reference: Supervisor builds the container locally
when installing. Internet access is needed for base images and dependencies.
The first install can take time and resources on a Pi; this is not a prebuilt
binary download. No Android/iOS build is involved. No ZIP extraction is needed.
A prebuilt container distribution would be a separate future publishing step.

## First use

Keep the default persistent data location `/data`. Open through Home Assistant
ingress, then follow the library setup card: add a folder, scan, review in
Archivist Assist, and publish reviewed books. Begin with disposable test media
under `/share/archivist-qa` or `/media/archivist-qa`; never select a household
library for acceptance testing. Paths are those visible inside the app.

Open Library works without configuration. Optional metadata providers and
missing-field suggestions remain reviewable; existing corrections and locked
fields must survive a rescan. Add family users and explicitly assign their
library spaces. Set an owner access key before direct LAN/mobile connections.
See [the app documentation](../../archivist/DOCS.md) for settings.

## Readiness record to complete before recommending installation

- Run **Server checks** on the exact final SHA, including root/packaged Go
  tests, parity, ARM64 and Docker/HA checks. Record run URL and result.
- If downloadable QA artifacts are needed, run **Archivist server QA artifacts
  (manual only)** on that same SHA and record the artifact checksum and expiry.
  This does not publish a release or registry image.
- On a disposable HA installation, install from the branch URL, open ingress,
  import test files, review metadata, publish, and confirm family access limits.
- Restart the app and Home Assistant: catalogue, corrections and accounts persist.
- Test a disposable NAS share disconnect/reconnect: entries are retained,
  a failed/empty mount does not erase the catalogue, and rescanning recovers.
- Complete the [onboarding/import acceptance steps](SERVER_ONBOARDING_IMPORT_QA_2026-10-17.md)
  and [seven release gates](SERVER_SEVEN_GATE_RELEASE_QA_2026-10-17.md).
  Record actual hardware, library size, elapsed time and observed failures.

## Updates and rollback

Disable automatic updates during QA. Back up the app and its data through Home
Assistant before an update; keep a copy outside the device. Refresh the store
and update only after a new version has its own validation record.
Test restoring that backup on disposable data before relying on rollback.
Do not downgrade a binary against a newer database; restore the matching app
and data backup together.

Home Assistant treats a different repository URL or branch as a different app:
changing from this QA URL to the default URL is not an in-place migration.
Do not uninstall the old app to switch channels without a verified backup and
a tested migration procedure. Avoid running both against the same media; their
default host ports also conflict.

[Home Assistant's official repository/branch guidance](https://contributors.home-assistant.io/apps/guides/repository/)

