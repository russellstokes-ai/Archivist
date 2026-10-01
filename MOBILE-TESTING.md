# Archivist 0.9.0 — Mobile Device Acceptance

Use the APK produced by the **Android APK** GitHub Actions workflow. Expo Go is not the acceptance target because Archivist includes native Android playback, sleep and reader behaviour.

## Connection

Archivist works locally without a server. To test the optional server, use the dedicated Archivist HTTPS origin with a certificate trusted by the phone.

Do not use the Home Assistant sidebar or ingress URL as the native app server address. Ingress authentication and path routing are different from the mobile API contract.

For remote testing:
- trusted DuckDNS or reverse-proxy HTTPS is suitable;
- Tailscale or private-network routing can be used as the fallback;
- do not disable certificate validation merely to make a connection pass.

Server and profile credentials are stored with SecureStore. API requests use timeouts and keep reader navigation scoped to the selected server.

## Fold acceptance

Test both the Galaxy Fold closed-phone layout and the open-tablet layout.

### Shelf and Library
- vertical Shelf scroll remains smooth;
- source and Space filters remain usable;
- Library grid density changes without clipped cards;
- open layout uses the intended wider or two-pane treatment;
- Smart Shelves, Collections and bulk actions remain reachable.

### Player
- Local, Server and Downloaded audiobooks open the same polished player;
- pause, resume, seek and deliberate rewind persist correctly;
- Living Book animation follows playback state and reduced-motion;
- queue, chapters, bookmarks, speed and sleep controls remain usable;
- lock screen, Bluetooth or headset and background playback are accepted on-device;
- kill and relaunch restores the intended position rather than a stale future point.

### Reader
- EPUB, PDF, CBZ, CBR and CBT routes open from the correct source;
- bookmarks, highlights, notes, search and appearance persist;
- page turns never own reading progress;
- double-tap Comic Focus Zoom identifies a useful local region and normal zoom remains immediately available;
- orientation and Fold changes return to the same reading context.

### Offline
- start a server download, background the app, return and resume it;
- play or read the completed offline copy with the server unavailable;
- remove a download without removing the server work;
- cleanup removes broken or orphaned download state without touching valid media.

## Server and profile acceptance

- wrong key, revoked User and unavailable server fail clearly;
- Admin and User keep separate ratings, progress and history;
- a User cannot reach Admin-only file, metadata, household or backup operations;
- reconnecting to a saved server does not hide or overwrite the local phone catalogue.

## Completion record

A device pass should record APK version and checksum, Android and device version, server or HA version, Fold closed and open result, playback and background result, reader and comic result, offline result, remote result and any defects.

Automated CI and emulator launch are prerequisites, not substitutes for this physical pass.
