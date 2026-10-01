# Sprint 3 — Living Audiobook Player

Durable implementation checkpoint.

Implemented:
- Living Book artwork opens on play and settles on pause without owning playback state.
- Decorative page-turn motion stops offscreen and respects reduced-motion.
- Closed-phone player remains focused; Fold/tablet uses an intentional two-column player layout.
- Source-aware Local / Server / Downloaded playback.
- One mixed-source persistent queue.
- Local progress commits immediately on pause/background.
- Durable player bookmarks with stable work identity.
- Offline download/status from Now Playing.
- Multi-file custom track ordering without destructive file changes.
- Non-destructive chapter editor: rename, split, merge, boundary correction and reset.
- Downloaded server audiobooks retain chapter metadata offline.
- Playback ordering API supports saved server track order.
- Player structure/bookmark/chapter behavioural tests.

Validation expected from this checkpoint:
- TypeScript typecheck.
- Full mobile regression suite under installed dependencies.
- Player-specific behavioural suite.

Native Bluetooth/output-route selection remains a native-platform release item because the current Expo Audio layer does not expose general output selection; no fake control is shipped.
