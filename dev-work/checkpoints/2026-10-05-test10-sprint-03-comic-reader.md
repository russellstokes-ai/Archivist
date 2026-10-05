# Test 10 Sprint 3 — Comic Reader Closure

Status: implementation complete; Mobile automated gate green. iOS simulator compile is still running and is not marked green until GitHub reports success.

Branch: `fix/test10-sprint3-comic-reader-20261005`  
Base (Sprint 2): `220036912dee5ad0387bdb9850f6091167a2c2d8`  
Tested implementation head: `c3d78d4a52f4d0eb69006844e82a906f2313fe4f`

## Implemented

- Moved reader chrome into normal layout flow so the title/header no longer overlays or clips the top of comic pages.
- Replaced the text fullscreen control with standard drawn fullscreen / exit-fullscreen icons.
- Fullscreen entry hides chrome for true edge-to-edge reading; exit and Android Back restore chrome predictably.
- Kept the reader title centred using balanced left/right chrome rails.
- Added a flex reader viewport so the WebView consumes the remaining safe content area rather than sitting underneath the header.
- Made edge-to-edge single-tap chrome reveal deterministic.
- Suppressed synthetic WebView clicks after touch input so a physical tap cannot toggle chrome twice.
- Kept double-tap reserved for speech-bubble/text focus and cancel the pending single-tap action when the second tap arrives.
- Separated tap, pan, pinch and page-turn gesture states so they do not compete.
- Made comic page turns visibly track the finger while swiping.
- Added release velocity plus distance thresholds for natural commit/cancel behaviour.
- Preserved speech-focus-first double-tap behaviour and generic comic zoom fallback.

## Regression lock

Added `mobile/sprint10-comic-reader.test.cjs`, automatically discovered by the shared mobile test runner.

It locks:
- non-overlay reader chrome;
- fullscreen icon states and exit behaviour;
- predictable Android Back behaviour;
- single-tap / double-tap arbitration;
- synthetic-click suppression;
- page-turn / pinch / pan exclusivity;
- finger-linked page-turn geometry;
- distance / velocity page-turn commit logic.

## Validation

- Mobile checks run: `37320490548` — **success**.
- Expo Doctor — success.
- TypeScript — success.
- Mobile regression tests — **55/55 passed**.
- Sprint 3 comic-reader closure test — success.
- Version consistency — success.
- Expo web export — success.
- iOS checks run: `37320490365` — setup, Expo Doctor, TypeScript, prebuild and CocoaPods passed; simulator compile was still running when this checkpoint was written.

## Next

Do not start Sprint 4 from Sprint 2 or an older branch. Sprint 4 must inherit this Sprint 3 head so the comic-reader closure remains part of the permanent-fix chain.
