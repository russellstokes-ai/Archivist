# Atlas acceptance — 4 October 2026

Status: implementation and exported-web acceptance completed for this finishing pass. Native device acceptance remains required before a production release.

## Delivered

- Retained the approved rounded Atlas layout, palette foundations and fixed surrounding UI.
- Inner circular pinch/pan surface, centred zoom/fit controls outside the clipping mask, gesture cancellation and pan bounds that keep at least one node inside the circle.
- Real proportional Genre, Format and Year ring segments, stable genre colours and label collision filtering.
- Shared animated chart/book/author/relationship window. Height follows content; the accent no longer crosses the text.
- Expandable chart categories with scrollable full-category lists and book drill-down, including works outside the visible 120-work sample.
- Correct full-library counts for authors/series and minority genres, rather than assigning minority works to unrelated genre hubs.
- Both approved phone-only Settings/metric fixes retained. Live Player, Comic Focus and the locked Fold reference branch were not edited in this pass.

## Executed checks

| Check | Result |
| --- | --- |
| TypeScript | Passed |
| Complete mobile test command | 33/33 suites passed |
| Production Expo web export | Passed, 845 modules |
| Pure Atlas interaction/geometry | Passed across eight widths from 320 to 1200 |
| Browser 320px light | Passed |
| Browser 390px dark | Passed |
| Browser 600px light | Passed |
| Browser 720px dark | Passed |
| Browser 1200px light | Passed |
| Browser 390px light, Reduced Motion + enlarged-text preference | Passed |
| Browser 2,000-book / 40-genre stress fixture at 720px dark | Passed |

Each browser scenario exercises Fit/zoom, all three chart windows, full category expansion, category-to-book selection, book search, author search and details, close/reopen transitions, synthetic two-finger pinch, pan cancellation and repeated 720/390/original-width resizing. Pinch assertions require the graph transform to change while the surrounding ring bounds remain identical. No uncaught page errors occurred in the passing runs. Screenshots of book and author detail states were inspected.

The original wider-screen control failure was reproduced with a pre-existing web SecureStore error banner intercepting interaction. The browser harness explicitly dismisses that banner using its visible Dismiss error control before Atlas checks. An intermediate run also exceeded an 8-second stability wait; the final full matrix passed with the harness's 20-second action timeout, without forced clicks or suppressing Atlas animation. This is not a claim that the underlying web secure-storage warning is fixed.

## Reproduction

From mobile, with the existing dependencies installed:

```
npm run typecheck
npm test
npx expo export --platform web --output-dir dist-atlas
node atlas-browser-check.cjs
```

The optional browser check requires Playwright and Edge. Set ATLAS_PLAYWRIGHT_MODULE to an installed Playwright module path if it is not available by package name. ATLAS_BROWSER_CHANNEL can select another installed Chromium channel. Set ATLAS_STRESS=1 for the 2,000-book fixture. The harness serves only the local export on a temporary localhost port, uses synthetic localStorage data in isolated browser contexts, closes its browser/server and writes screenshots/results to atlas-preview-results.

These browser checks are separate from npm test because Playwright is not a production dependency. No package versions changed.

## Remaining release acceptance

- Actual Android and iOS phones plus an opening/closing Fold: native touch handoff, interrupted gestures, keyboard/screen-reader use, device font scaling and rotation.
- Native frame pacing, heat/memory behaviour and long sessions with realistic local/server libraries. The approximately 13ms pure graph construction result is not a rendering-performance measurement.
- Real server relationship data and final native visual review.
- Existing web SecureStore compatibility warning, if web is a shipping target.

No APK/IPA was built or device/car-host approval claimed here. Native acceptance does not reopen the approved Player/Comic Focus designs. Live Player status remains obvious at ../LIVE-PLAYER-PROGRESS.md and LIVE-PLAYER-HANDOFF.md.

