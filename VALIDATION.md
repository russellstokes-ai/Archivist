# Validation — 23 September 2026

Environment: Linux amd64, Go 1.27.1, SQLite driver modernc.org/sqlite v1.39.1.

Passed automated tests:

- Two folders assigned to a combined space; overlapping sources rejected.
- Repeated scans preserve one catalogue row per source-relative path.
- Missing individual files become unavailable after a successful scan.
- Disconnected source retains prior catalogue records.
- Removing a source leaves its original file present.
- Unauthenticated media requests return 401.
- Byte-range request returns 206 with exact requested bytes.
- Replacing a catalogued asset with an escaping symlink returns 404.
- Mutations without the request marker return 403.
- Source settings survive database close/reopen.
- Embedded web entry point is served.

`go test -v ./...` passed all four test groups. `node --check web/app.js` passed. Server compiled with `go build -buildvcs=false` (workspace VCS metadata was unavailable).

Not validated: browser visual rendering, actual audio codecs/devices, mobile background playback, HAOS/native installation packages, high-volume performance, concurrent file replacement by a malicious local actor, or full household security. Do not interpret unit/integration checks as release certification.

Follow-on checkpoint: six test groups pass, including persistent job deduplication, interrupted-job recovery, worker completion, embedded EPUB title extraction and corrupt-archive fallback. Updated server compiles; browser JavaScript syntax check passes. Folder-picker visual behaviour remains unverified.

Latest checkpoint: eight test groups pass. Added same-work/separate-edition grouping, natural audio ordering, preservation after rescans, ungroup without asset deletion, and cross-space rejection with transaction rollback. Staged scans reduce transaction duration by moving filesystem traversal outside it; no large-library latency benchmark has been performed.

Playback checkpoint: nine Go test groups pass. Added revision-conflict rejection, deliberate rewind, audio/ebook validation and progress retention after scan. Node controller test passes resume, automatic track advance, pause save and reopening at saved position using a mock media element. This is not real-device/browser audio validation. Build and JavaScript syntax checks pass.

Household checkpoint: eleven Go test groups and the Node playback-controller test pass. Verified member filtering on sources/books/works, restricted direct streams/track lists/progress, denied administrative endpoints, allowed granted media, independent owner/member progress, revoked key rejection and legacy owner progress migration without overwriting newer state. Server compiles and JS syntax checks pass. Full browser/profile-switch integration, in-flight stream revocation and real-device validation are still outstanding.

Account lifecycle: thirteen Go test groups pass, plus the Node playback-controller test. New checks cover independent session tokens, rejection of raw keys as sessions, expiration, rotation invalidation, server-side logout, atomic failed-grant rollback, immediate permission removal and prevention of member self-escalation. Build and updated JavaScript syntax checks pass.

Reader, recommendations and mobile checkpoint: sixteen Go test groups pass, plus the Node playback-controller test. New checks cover EPUB spine order, safe text extraction, decompression limits, reader permission filtering, per-profile reading progress, revision conflicts, mobile `/session` token responses and local-only recommendation filtering. Recommendation tests install a failing outbound HTTP transport and verify no network calls while excluding inaccessible, revoked and already-started titles.

`node --check web/reader.js` passed. `npx tsc --noEmit` passed in `mobile/`. Expo JavaScript bundles exported for both Android and iOS into `/workspace/archivist-mobile-bundles`.

Still not validated: real browser rendering of the reader, PDF edge cases, real comics at scale, Speech focus bubble cutout/animation, Android APK build, iOS IPA build, signing, app-store packaging, physical device playback, lock-screen controls, background interruption handling, offline downloads, release remote-access security, visual polish or Atlas interaction quality. The mobile bundle result proves source/bundle viability only; it is not a release candidate.

Mobile shell checkpoint: `npx tsc --noEmit` passed after replacing the rough single-screen app with a tabbed native shell: Shelf, Player, Reader, Atlas and Settings. This adds app-level light/dark/system theme persistence, mini-player placement above bottom navigation, a fuller player screen, reader handoff shell and Atlas placeholder. No emulator, physical-device, screenshot or native binary validation has been performed for this checkpoint.

Home Assistant add-on checkpoint: server startup now has an explicit `-allow-lan` flag for trusted container/reverse-proxy contexts while preserving loopback-only default behaviour. `go test ./...` passed and `go build -buildvcs=false` passed after a transient Go proxy retry. `scripts/package-ha-addon.sh /workspace/Archivist-HAOS-Addon.zip` produced a 2.2 MB self-contained add-on archive. Not validated: HAOS Supervisor install, ingress behaviour, Pi 4 ARM64 build on-device, add-on logs, mapped `/media` source selection, restart persistence or DuckDNS/Tailscale exposure.

HAOS install-readiness checkpoint: added unauthenticated `/healthz` database ping endpoint, Supervisor watchdog config, internal `repository.yaml`, clearer first-install add-on notes and `scripts/package-ha-repository.sh`. `go test ./...` passed, `go build -buildvcs=false` passed, `Archivist-HAOS-Addon.zip` and `Archivist-HAOS-Repository.zip` both built successfully. Still not validated inside Home Assistant Supervisor or on Raspberry Pi 4 hardware.
