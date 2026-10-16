# PR #83 continuation: verified entry point

This file was **absent** at the requested starting commit
`70ddc9226e6182f1a0271ce8a08c77b71c3b4ed9`. Created during this continuation;
it is not a recovered earlier handoff and does not grant source-lock exceptions.

Read the latest `work_execution_20261016` entry in [DEVELOPMENT_STATUS.json](DEVELOPMENT_STATUS.json),
[DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md), and the append-only [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md).
Existing specification: [delivery handoff](ASTRA_FINAL_COMMERCIAL_DELIVERY_HANDOFF_2026-10-16.md),
[master plan](https://github.com/russellstokes-ai/Archivist/blob/3158c6757cfc906c63cb2bec223e320253f20a54/docs/ARCHIVIST_V1_MASTER_DEVELOPMENT_PLAN_2026-10-12.md),
[acceptance register](COMMERCIAL_GATE_REGISTER_2026-10-16.json),
[native/restore QA](V1_NATIVE_AUTO_RESTORE_QA_2026-10-16.md),
[combined QA](V1_P0_P1_P2_QA_STATUS_2026-10-16.md).
Older register entries marked UNFIXED predate subsequent integrated fixes;
use the dated status updates and actual source rather than repeating old work.

## Findings and next permitted action

| Issue | Verified evidence | Required next step |
|---|---|---|
| #16 comics | `localReader.ts` dispatches by supplied format, returning raw URI for an unknown format. Actual 2000AD file/SAF metadata absent. | Capture original file classification and URI on device; do not guess or change scanner/Comic Focus. |
| #19 Atlas | App.tsx adds `scannerPublished` track eligibility to the local source feed. | Compare real published catalogue at both feed stages; removing the guard without evidence could expose unreviewed works. |
| #25 Living Book | Wrapper sets ready on load-end only, initial HTML memoized; no explicit reload/process recovery. | Reproduce native WebView failure; propose wrapper-only recovery if proven. Renderer/geometry remain locked. |
| #23 Resume | Executing the actual resume and loader functions restores a paused local audiobook by calling `player.play()`. **Genuine RED.** | Narrow App.tsx approval, then separate restore-without-play from explicit Play; propagate intent through local/download/server loaders and Playback. Preserve deliberate rewinds rather than selecting max position. |
| #17 alignment | Existing art compensation X=10/Y=3; touch target unchanged. | Measure both rendered keyframes at actual phone/Fold sizes before proposing art-only offsets. No layout change. |
| #20 Rewards | Same source Lottie reused on successive event keys; effect resets flags but no per-event native playback identity. | Native replay/background reproduction before scoped lifecycle repair; no asset replacement or visual redesign. |
| #31 offline | Existing COW/integrity regressions pass, but actual Now resume requests server before available download. **Genuine RED.** | Narrow App.tsx approval to validate/download-first before any server request; retain fallback when download is unusable. Helper CI alone is not end-to-end acceptance. |
| #32 PDF | Existing URI/generation/page/viewport/request-scoped reducer tests pass; actual reader masks old URI immediately and checks async generations. | Real A→B→A PDFs, permission revoke, resize and process death remain unverified. |

Reproduce the two confirmed failures (expected exit 1):

```sh
node docs/v1/diagnostics/resume-no-autoplay.red.cjs
node docs/v1/diagnostics/resume-no-autoplay.red.cjs --offline-first
```

These execute extracted **actual production functions**, mocking only native media/state dependencies.
They are intentionally quarantined diagnostics, not passing release tests. They do not prove
the owner's exact original modal or physical-device symptoms. No product fix applied.

## Concrete protected-source exception proposed, not applied

Restrict the next exception to App.tsx `resumeNowSession`, `currentLocalResume`,
`loadLocalWorkTrack`, `playLocalWork`, and `playBook` logic plus their intent arguments:

1. Add an explicit playback intent, defaulting to play for existing user Play actions.
   Automatic restoration requests paused loading; do not start audio then pause it.
2. Persist `wasPlaying` from intent, and propagate the paused option into the existing
   Playback loader for server audio. Existing playback journal/acknowledgement ordering stays intact.
3. In server-source resume, validate the existing downloaded representation first;
   use its saved chapter/page without a network request, otherwise retain existing server fallback.
4. Use the latest applicable durable position, not the greatest position, for intentional rewind.

Required tests before applying: both diagnostics RED→GREEN, explicit Play still starts,
server/local/downloaded restore remains paused, missing/corrupt download falls back,
account mismatch refuses remote access, rapid title switches reject stale loads,
rewind survives restart, full existing suite and unchanged JSX/styles/scanner/Assist/assets.
This is a **scope for a narrow reviewed repair**, not permission to update the byte lock now.
No speculative blanket exception is requested for the other four bugs.

## Test package and evidence

The [HA package](../../qa/pr83/Archivist-HA-70ddc922.zip) contains unchanged PR #83 server source.
[Provenance](../../qa/pr83/PROVENANCE.json) records source SHA and per-file hashes.
The adjacent `.sha256` verifies the ZIP. It is a source add-on repository, not a prebuilt container.
Build only with disposable media; no real HA installation or data restore was performed.

Packaging defect: old archives used wall-clock timestamps and traversal ordering.
The new test first failed on SOURCE_DATE_EPOCH; fixed packaging now normalizes UTC timestamps,
stable entry order and Unix modes. Python 3 is required for packaging. Reproduce:

```sh
SOURCE_DATE_EPOCH=1792175484 sh scripts/package-ha-repository.sh /tmp/Archivist-HA.zip
node scripts/package-ha-reproducible.test.cjs
node scripts/package-ha.test.cjs
```

Fresh local verification: 128/128 mobile suites, TypeScript, root Go and packaged Go pass.
Initial 126/128 run lacked javac; no scanner source was modified to resolve it.
Protection gate: 45 originals plus the exact approved App.tsx blob pass.
Starting-commit GitHub CI: Mobile 38948050600, Server 38948050770,
Android native 38948050610, iOS 38948050648 all completed success.

**APK not built.** Existing manual-only `android-apk.yml` uses separate
`app.archivist.reader.qa`, debug signing and 16 KB checks. Connector lacks dispatch;
browser is signed out. No alternate push trigger was added to circumvent the manual gate.
Manual workflow must run on this integration branch with `qa_confirmation=true` once
the desired source is approved. Do not label the present unresolved build commercial-ready.

**Commercial NO-GO.** Six original bugs unresolved; #31 integration defect; #32 hardware pending;
ten-screen server/workbench/relink/scan controls incomplete; Auto/cross-device hardware,
performance/accessibility/Play gates incomplete. No merge, install, migration or release.
