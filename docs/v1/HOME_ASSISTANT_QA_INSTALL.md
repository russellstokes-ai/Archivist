## Library discovery and welcoming onboarding — 20 October 2026

Version **0.9.3-qa.20261020.1**. Exact executable source **29a68642528bba1b87f0005002413c2077695f05**. [Server checks](https://github.com/russellstokes-ai/Archivist/actions/runs/39458881433) and [QA build](https://github.com/russellstokes-ai/Archivist/actions/runs/39458885802) **PASSED**. [Download binaries and HA repository ZIP](https://github.com/russellstokes-ai/Archivist/actions/runs/39458885802/artifacts/12280354655) (expires 27 October 2026). Artifact SHA256: 7562af1fc153f4c30f24bb6091122d37f136e575ad5923e520073f586da9f97e.

Exact-SHA hosted test: **10,020 files**, first import **11.74s**, unchanged rescan **0.435s**, all retained. Allocations 157,462,928 and 54,746,144 bytes respectively (not peak memory or Pi measurements). Root and packaged Go suites, UI/manager/parity/protected-source gates, ARM64 runtime and Docker/Home Assistant smoke checks passed. The fast-path multi-edition safeguard regression was caught by the first Linux run, fixed, and verified in this final run.

- Three-step onboarding: choose folders, find books, open Library. Optional metadata gaps no longer lead the first-import action to mass review. Existing books stay accessible during other imports or failed refreshes. All six navigation icons retained.
- Clearer skipped-file reasons; recover validated comic ZIPs with the reported malformed ]cbz suffix; distinguish multi-book ZIP packs from page comics. No source file is renamed or extracted.
- Better dotted/bracketed comic filenames, inferred bracketed years, conservative issue parsing, preserved annual/volume qualifiers and fractional issues. Case-insensitive ComicInfo, invalid optional years isolated, ComicBookLover ZIP comments, case-insensitive JSON keys/string arrays. Volume is not an issue number.
- Optional Metron token under Settings → library folders → Improve comic details. Unique exact series/issue lookup can fill missing genre and issue year. Tokens are owner-only, never returned/exported, and stored in the private server database (protect backups). No credentials or files go to arbitrary endpoints. Requests have time/body bounds, redirect rejection, pacing and durable failure pause. Connecting saves the token; it does not claim credentials were verified.
- Local synthetic 10,020-file measurement: first import 17.13s, unchanged rescan 4.66s versus 84.90s before the optimisation. This is Windows workstation evidence, not Pi/NAS speed or peak memory. A version-change rescan must re-read metadata once.
- Scan-report schema 2 adds reason counts/examples plus series, issue, year and review reason on sampled files. Counts describe recognised/indexed files, not a guarantee of successful full decoding or identification.

### Install and test

Back up Archivist first. Refresh the existing PR83 Home Assistant app repository, update **Archivist QA (PR 83)** to **0.9.3-qa.20261020.1**, and open its Web UI. Keep the same repository:

https://github.com/russellstokes-ai/Archivist#integration/archivist-v1-auto-restore-recovery-20261016

Rescan each source once. Confirm the Library opens without a review requirement; open a CBZ/CBR/PDF and play an audiobook. Download **Library Manager → Scanner & sources → Download scan report** and compare imported/supporting/unsupported counts. Test a second unchanged scan. Optional: connect Metron in Settings, then check whether genre/year coverage improves. Disconnecting the provider leaves existing saved details intact.

### Acceptance limits and remaining plan scope

Physical Pi4/HAOS/SMB/NFS, representative personal media, actual browser/phone/accessibility and live authenticated Metron acceptance remain **BLOCKED**. The full Linux suite and packaging run in CI; local Windows tests involving Linux paths, hardlinks and simulated mount renames cannot substitute for them.

This candidate does not add CB7 decoding, loose-image-folder reading, MOBI reading, arbitrary archive-pack extraction, PDF metadata extraction, MetronInfo XML, cover-image matching, Comic Vine/MusicBrainz adapters, persistent series caches or a grouped series-choice editor. Generic comic ZIPs are inspected; CBZ/CBR/CBT full readability is established when opened, not exhaustively during discovery. No duplicate auto-merge or guessed genre. Those parts of the wider plan remain unfinished. Existing manual review, metadata locks, family access and protected mobile/reader/scanner remain in place. No commercial release claim or merge.


---

# Home Assistant test build — PR 83

## Diagnostic and comic metadata test build — 18 October 2026

Version **0.9.3-qa.20261018.2**. Exact executable source **1755831ad6e40124b539f6c2c4221b36aa0ab106**.

- [Server validation](https://github.com/russellstokes-ai/Archivist/actions/runs/39123247395): SUCCESS. Root/packaged Go, mixed 10,020-file import/rescan, UI/manager contracts, protected sources/parity, native ARM64, Docker/HA checks.
- [Compiled QA artifacts](https://github.com/russellstokes-ai/Archivist/actions/runs/39123247449/artifacts/12135032009): Linux binaries and HA repository ZIP; expiry 25 October. Archive SHA256 `b876eaa140c095145baa46c23a35c14eb3fd3a548238d613dff06fb92a325001`.
- Icons included. New **Scanner & sources → Download scan report**. Rescan once per source after updating to populate skipped-extension evidence. [Report guide](SERVER_DIAGNOSTIC_REPORT_2026-10-18.md).
- CBT/TAR extraction and ComicInfo text issue labels repaired; safer comic folder/PDF name handling and limited authorless comic matching. Dedicated Metron/Comic Vine/MusicBrainz integrations are **not** included. [Research findings](METADATA_ECOSYSTEM_FINDINGS_2026-10-18.md).
- Physical HA/Pi4/NAS and real archive/browser/phone acceptance remain **BLOCKED**. No commercial release claim, merge or production deployment. The skipped 3,375 files have not yet been identified.

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
The manifest now selects `0.9.3-qa.20261018.2`. This supersedes the
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
ingress, then follow the library setup card: add a folder and let the automatic scan populate Shelf and Library.
Reading does not require approval or publication of every item. Begin with disposable test media
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
  import test files, read/listen without bulk approval, and confirm family access limits.
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

