# Mobile testing checkpoint

This is source code, not an installable Android or iOS release. Native builds,
signing and physical-device acceptance remain outstanding. Do not expose this
development server to the public internet solely to test mobile access.

## Connection

Use the dedicated Archivist HTTPS origin with a certificate trusted by the phone.
Do not paste the Home Assistant sidebar/ingress URL: its authentication, prefix and
session routing differ from the native client API contract. Port 5056 is plain HTTP.
An existing trusted TLS reverse proxy on the private network can forward to it.
The app does not disable certificate validation or allow arbitrary cleartext LAN URLs.
Development-only loopback/emulator HTTP is permitted by the source validator.
Native platform transport policy still applies. Remote-access hardening is Pack 15.

Use a profile key from the server, or its current owner key from the log. Secrets
are stored with SecureStore. API requests time out, reject redirects, and identify
non-API responses. Reader navigation is restricted to the selected server; a valid
bearer on reader entry sets an HttpOnly cookie for reader subrequests. Automated
server tests cover this flow and revocation; WebView cookie behaviour needs devices.

## Implemented in Packs 3-9

- Grouped and standalone audio context, server resume, revision-checked saves,
  seek/rewind, track advance, completion and progress-conflict protection.
- Playback speed, native sleep source extension, selectable tracks/embedded chapters,
  and a server-persisted per-profile book queue with reorder and conflict protection.
- Lock-screen activation and audio background configuration, status-event handling,
  lifecycle saves. No physical device pass is claimed.
- Multiple-space filtering, owner folder add/scan and title correction.
- Server reader improvements automatically serve the native WebView.

## Acceptance still needed

1. Android and iOS: connect over trusted HTTPS; wrong host/key/certificate; timeout;
   sign-out, restart, profile revocation and reader image/PDF subrequest authentication.
2. Play grouped and single-file books; pause, kill/relaunch, resume and deliberate rewind.
   Change position on a second client: conflict must not overwrite it silently.
3. Background for 30 minutes, screen locked; headset/Bluetooth controls; incoming call;
   unplug headphones; other audio app; OS media-service restart.
4. Speed, embedded chapter seeks, track/queue changes and sleep expiry while locked.
   Native sleep source is implemented but NOT yet compiled/device-certified.
   Build after npm postinstall patches pinned expo-audio 57.0.5. Expo Go lacks this
   extension and reports sleep unavailable; install an Archivist native build to test.
5. Native layout/keyboard, safe-area bottom controls and both colour schemes.

Known gaps: native sleep timer acceptance, durable offline checkpoints/downloads,
publisher-perfect EPUB CSS/layout, real compressed RAR corpus and performance tests.
File move controls currently live in the server web UI, not native settings.

## Cheap restart

Read TESTING-READINESS.md first. Tests:

```sh
cd mobile
npm run typecheck
node core.test.cjs
node queue.test.cjs
```

Audio adapter: mobile/App.tsx. Pure player logic: mobile/playback.ts.
Connection guards: mobile/connection.ts. API: listening.go and progress.go.
Device checks are blocked by missing native binaries/hardware, not marked complete.
