# Archivist build audit and update backlog

Audited: 2026-09-24. Local repository commit: `72f9a5f` (add-on 0.1.9-dev).
Scope: source review of mobile, server, web UI and both packaged add-on copies.
This is not verification of the APK installed on Russell's phone or the running Pi.
No application behaviour changed. All items below are OPEN unless explicitly stated.
No GitHub issue creation, remote update or push performed.

## Readiness decision

Not ready for normal user acceptance testing. The current phone app is a server
client, not the agreed standalone app with an optional server. Installation success
does not establish workflow readiness. Historical PASS entries must not be used as
evidence for this exact checkout without rerunning the relevant checks.

Priorities: P0 blocks the agreed core experience; P1 required for useful, dependable
testing; P2 feature completion and polish. Each acceptance statement is a future gate.

## Confirmed blockers

### A01 - P0 - Home Assistant embedding is blocked

Evidence: `main.go:356` sends `frame-ancestors 'none'` for every request.
`ingressBase` and `serveEntry` in `ingress.go` have no production callers; main.go
serves static files directly and sets cookies at `/`. Both packaged main.go copies
match the root. This is a concrete browser-embedding blocker consistent with the
reported refusal; the live Pi/browser has not been inspected.

Update: wire validated ingress handling, base URLs, frame policy and cookie scoping
into actual request handling. Preserve restrictions for non-ingress traffic.
Acceptance: open from HA sidebar and Open Web UI, log in, browse folders, open each
reader format, refresh and restart successfully on the Pi. Existing
`TestIngressRoutingAndSession` must pass against the packaged source.

### A02 - P0 - App cannot open a local library without a server

Evidence: `mobile/App.tsx:586` returns Login without a session. Shelf, audio, reader,
metadata and sorting all use server APIs; reader uses a server WebView URL.

Update: standalone local library, device folder permission flow, persistent local
catalogue, reading/playback/progress and organisation. Optional server connection
belongs in app settings, with clear device/server library ownership.
Acceptance: fresh install, skip server, select multiple device folders, scan, read,
listen, organise and relaunch in airplane mode without losing progress.

### A03 - P0 - Phone connection contract does not match add-on defaults

Evidence: `mobile/connection.ts:5-11` requires trusted HTTPS and rejects ingress
paths. `archivist/config.yaml` exposes plain HTTP on 5056. The app requires an
externally arranged TLS endpoint; no connection wizard bridges the two.

Update: supported optional pairing/setup workflow with connection diagnostics and
clear local/remote access choices. Do not solve this by disabling TLS validation.
Acceptance: connect from a real phone using the documented supported setup without
guessing ports, credentials or HA ingress addresses; explain failures in the UI.

### A04 - P0 - Owner credentials and sessions break on restart

Evidence: `main.go:449-453,473` generates a random owner key per process and prints
it to logs. `sessions.go:48-49` validates owner sessions against that current key.
`web/index.html` instructs users to retrieve the key from startup logs.

Update: protected first-run setup for a user-chosen credential, securely persisted
credential verification, password-manager support, change/reset and device pairing.
Keep first-run ownership protected from another network client claiming it.
Acceptance: user creates access in the UI, restarts/updates server, reconnects using
saved access, and can deliberately revoke/reset access without reading logs.

## Library and organisation

### A05 - P1 - Folder selection exists on web, but is poorly rooted; absent on phone

Evidence: `web/app.js` appends Browse server folders and calls `/api/folders`.
`background.go:74-95` defaults browsing to the container home directory, not media
mounts, and returns generic errors. Mobile settings only offer a typed server path
(`mobile/App.tsx:548`). HA maps media/share/backup, not arbitrary host drives.

Update: web/mobile server browser starting with accessible media roots, permission
checks and helpful unavailable/read-only folder states; native device picker for
local mode. Explain location through labels, not container troubleshooting.
Acceptance: select real mounted media without typing paths; inaccessible folders
explain why. The reported web-picker failure still needs live reproduction.

### A06 - P1 - Multiple server folders already exist; local equivalents are missing

Evidence: `main.go:55,86-120`, `/api/sources`, web folder list and mobile settings
support multiple sources and shared/separate spaces. Overlapping roots are rejected.

Update: retain this capability, make add-another-folder obvious, expose source
health, distinguish device from server, and explain overlap errors before saving.
Acceptance: three independent folders in one library, separate spaces, unavailable
drive, restart, removal without deleting originals; repeat locally once A02 exists.

### A07 - P1 - Phone sorting operates only on server files

Evidence: `mobile/App.tsx:280-295` calls server file-move APIs. `filemoves.go:128`
constrains moves to the selected source root. No independent device sorter exists.

Update: local sorting plus explicit source/destination selection on each platform;
offer rename/move/copy policies. Cross-source destinations require designed recovery
and ownership rules, not simply relaxing the existing path checks.
Acceptance: preview and perform each supported operation on device and server;
verify originals, collisions, permission failures, interruption and recovery.

### A08 - P1 - Mobile preview does not show proposed file changes

Evidence: mobile preview renders only counts and first error; apply sends empty IDs,
meaning all pending moves. No mobile per-file review, cancel, undo or recovery list.
Web has more detailed history and actions (`web/filemoves.js`).

Update: show old/new paths and conflicts, select exact operations, confirm scope,
provide cancel/retry/undo and recovery. Do not apply unrelated pending previews.
Acceptance: previews made on another client are not unexpectedly applied; users can
inspect and cancel individual moves and recover an interrupted batch from phone.

### A09 - P1 - Large libraries are truncated and "all" does not mean all

Evidence: `/api/books` and `/api/works` have LIMIT 500; template batch with empty
assets also selects LIMIT 500 (`filemoves.go:171`), apply caps at 500, and move history
returns only 100 (`filemoves.go:562`). Mobile says Preview all library items.
Web acknowledges the shelf limit but has no pagination; history can hide old jobs.

Update: paginated catalogue/history and explicit bounded jobs with total counts and
continuation; keep all/visible/selected scopes consistent with filters and spaces.
Acceptance: 5,000-file fixture is fully browsable; all-library sorting includes every
eligible item exactly once; old pending moves remain reviewable and cancellable.

### A10 - P1 - Scan lifecycle is incomplete in the phone UI

Evidence: server scan returns 202 plus job ID; mobile sourceAction refreshes once
immediately, with no job polling/subscription. Web polls jobs. Adding a source
requires a separate scan action. The worker processes queued scans, not filesystem
watch events, despite the web UI's "Watch mode" label.

Update: add-and-scan flow, progress/completion/failure states and automatic shelf
refresh on phone. Implement watching/scheduled scanning or correct the label.
Acceptance: a long scan visibly completes without manual navigation; later new files
are picked up by the selected supported scan mode; failures preserve the catalogue.

### A11 - P1 - Source removal needs confirmation and consequences

Evidence: mobile removeSource directly deletes the source; server cascade deletes
its catalogue assets. Web already asks for confirmation.

Update: mobile confirmation explaining catalogue/progress consequences and that
original files remain; consistent removal behaviour on both interfaces.
Acceptance: accidental tap does not remove a library source.

## Completeness and usability

### A12 - P1 - No durable offline library/download workflow

Evidence: mobile streams server URLs; dependencies and reviewed code contain no
local library/download store. TESTING-READINESS.md lists offline work as unfinished.
SecureStore saves login/theme, not an offline media library.

Update: durable downloads/local assets, storage controls, pending progress and
reconnection conflict handling, with clear availability indicators.
Acceptance: airplane mode, app kill/relaunch, storage pressure and reconnect retain
downloaded books and progress. Treat this separately from merely saving credentials.

### A13 - P2 - Visible placeholders and reader feature gaps

Evidence: mobile Atlas renders fixed labels and explicitly says graph engine is
release work (`mobile/App.tsx:513-529`). `web/reader.js` implements zoom buttons, not
speech-bubble double-tap focus. Readiness notes also acknowledge EPUB layout and
RAR compatibility/performance limits. Library covers in web/app.js are title text.

Update: implement agreed graph and non-generative speech-bubble focus; improve real
covers/metadata and reader layout, or clearly mark unfinished features in test scope.
Acceptance: real comic gestures/bubbles, representative EPUB/PDF/CBR corpus, useful
Atlas data and responsive shelf/reader views on phone and web. No claim of parity
until exercised on devices.

### A14 - P1 - Errors and reconnect are too opaque

Evidence: web startup uses `start().catch(()=>{})`; web API assumes every response
is JSON. Mobile has better timeout/content checks but no setup diagnostics wizard.
Network/server errors can look like a login prompt or raw parsing error.

Update: distinguish first run, expired access, unreachable server, incorrect address,
permission failures and server errors; retry/reconnect without losing local use.
Acceptance: wrong address/key, restart, dropped Wi-Fi and non-JSON proxy errors each
produce a useful message and working recovery action.

### A15 - P1 - Readiness records and package validation are unreliable

Evidence: TESTING-READINESS.md claims ingress wiring and prior passes that conflict
with the current handler. MOBILE-TESTING.md says native sorting is absent although
controls exist. Source is copied into two add-on trees; their main.go files currently
match root and their app directories match one another, including the ingress bug.

Update: single authoritative build source or enforced package-equivalence checks;
run tests against the shipped package, attach version/commit to artifacts and expose
that information in app/Web UI. Replace stale readiness claims with exact evidence.
Acceptance: same-commit source tests, packaged build tests, HA install/sidebar test,
real Android smoke and update/restart checks before asking for ordinary testing.

## Verification performed in this audit

- Read current source and existing readiness/test documents; traced UI actions to APIs.
- Checked all three main.go copies: identical. Compared both packaged app trees:
  no differences reported.
- Confirmed ingress helpers have no production call sites by repository-wide search.
- Ran `node playback_test.cjs`: FAIL, expected `/api/assets/2`, actual
  `./api/assets/2`. This is a test expectation mismatch with relative URL handling,
  not proof that playback itself is broken. Reconcile test with the ingress contract.
- Go is unavailable in this workspace; no Go suite or server runtime test claimed.
  Existing ingress test assertions contradict current handler code by inspection.
- No APK rebuild, actual phone/Pi access, browser visual test or remote-head check.
  Installed artifact identity and live folder failure remain unverified.

## Update sequence

1. Repair ingress and persistent onboarding; establish truthful artifact/test status.
2. Implement standalone local mode and optional server setup, including folder pickers.
3. Complete multi-folder lifecycle, large-library browsing and scan feedback.
4. Finish local/server sorting review, destination policies and recovery workflows.
5. Offline operation, reader/Atlas completion and visual polish with device acceptance.

Do not close an item merely because code compiles. Record the specific acceptance
evidence against each ID. This backlog is the update log; fixes are not yet applied.
