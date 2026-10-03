# Comic speech focus — full-release requirement

Requested 23 September 2026. Internal feature name: Speech focus. Google Play Books Bubble Zoom is an experience reference, not an asset/code dependency.

## Interaction contract

Double-tap a speech bubble to enlarge a precisely clipped copy of that bubble over the original page. Preserve its outline, tail, lettering and source artwork; do not redraw or regenerate text. Anchor the initial frame to the original bubble and animate smoothly into a comfortably readable scale. Keep the page visible underneath, prevent viewport clipping and avoid unnecessary camera movement. Tap outside or double-tap again to return to the exact previous page position. Pinch zoom remains available independently. Provide an accessible explicit action and reduced-motion transition.

The finished interaction must feel like lifting the actual bubble off the page, not displaying a rectangular magnifier. Use a high-resolution source region with an antialiased alpha mask. Clip using the detected shape; include sufficient border padding to avoid trimming ink. Constrain the enlarged placement to safe areas. Repeated gestures and page changes cancel earlier animations cleanly. Portrait, landscape, tablets and right-to-left manga require distinct interaction checks.

## Privacy and feasibility

All processing stays on the reading device or the user's own server. No comic upload, cloud vision API, external recommendation request or analytics. Cache masks locally keyed by asset fingerprint, page and detector version; invalidate on file changes. Processing must not contend with playback or block scrolling; use bounded workers and low-resolution analysis with full-resolution display crops.

Google states that its bubble identification uses machine learning; its help page limits supported titles. That is evidence of a nontrivial detection problem, not a promise that a simple heuristic can reproduce it universally.

Archivist's no-AI direction is explicit (reconfirmed 4 October 2026). Use supplied region metadata and conventional local image-processing segmentation only. No learned detector, AI model, generative redraw, OCR service or remote inference is approved. Preserve the original lettering and artwork.

Do not substitute an ordinary page zoom and mark this feature complete. Where segmentation is uncertain, retain ordinary zoom with an honest unsupported state; this fallback does not satisfy the precision requirement. Avoid confident but wrong masks that omit words or merge adjacent bubbles.

## Implementation stages and release gate

1. Implement the rendering/animation path using hand-verified region masks on user-owned or original test pages. Validate perceived quality independently of detection.
2. Evaluate deterministic detection across white/coloured bubbles, thought clouds, narration boxes, jagged borders, touching bubbles, text outside bubbles and manga. Measure complete-text coverage and background leakage against human-labelled masks.
3. Add cache, cancellation, memory budgets and permission enforcement. Ensure no external requests during detection or playback of the animation.
4. Test on actual low/mid/high-tier phones, both platforms, large scanned pages, reduced motion, screen readers and rapid gestures.

A fixed benchmark set and measured acceptance thresholds must be established before claiming release readiness. False positive crops, unreadable enlargement or appreciable interaction stalls block acceptance. Scope includes smooth enlargement and clean cutout quality; exact universal detection is not asserted. An initial deterministic detector and crop overlay are implemented; the full quality requirement is not yet met.

## 4 October 2026 — resumed speech-focus sprint

Active branch: `design/draftbit-universal-phone`. Live Player and Atlas unchanged.

Implemented and behavior-tested:
- Flood-fill marks pixels when queued, preventing duplicate work and queue overflow.
- Invalid coordinates/dimensions and analysis buffers over 1,048,576 pixels are rejected before working-buffer allocation.
- Shape padding considers neighbouring rows, preserving the top edge instead of cutting it into a triangle.
- Cache keys use exact analysis pixels and image source/dimensions, avoiding collisions between adjacent bubbles and replaced pages.
- Mobile, web and packaged HA readers share generated detector/controller code. Run `node scripts/sync-speech-focus.cjs --check` to verify parity (Node 24).
- Tests exercise complete component coverage, ochre captions, malformed inputs, and actual controller cache behaviour, alongside the existing synthetic corpus.

Next: hand-labelled representative comic pages; confidence/rejection for non-text artwork; dark/inverted captions, unboxed lettering, broken borders and touching balloons; real-page boundary accuracy and safe-area/gesture acceptance. The row-envelope limitation was addressed by the subsequent silhouette sprint below. Current light-interior segmentation does not handle all text styles. The synchronous 520px analysis path still needs device latency measurement and worker evaluation.

No Google Play Books parity, real-comic benchmark pass, native acceptance or finished-feature claim is made by this sprint.

## 4 October 2026 — zoom motion sprint

- Overlay uses transform/opacity keyframes (340 ms lift, 260 ms return) rather than animating layout dimensions.
- Dismissal reverses from the current computed transform, including mid-opening interruption, and restores prior keyboard focus without scrolling.
- Enlarged artwork stays near its source and is constrained to the visual viewport and CSS safe-area insets; aspect ratio is preserved for narrow/tall bubbles.
- Page changes, resize/fold, viewport movement and multi-touch cancel immediately. Stale completion callbacks cannot remove a replacement overlay.
- Reduced Motion and missing animation APIs use immediate state changes. Source reader zoom/scroll state is never mutated by the overlay.
- Controlled-clock behavior tests cover reversal, repeated dismissal, stale callbacks, pinch cancellation, safe-area bounds and Reduced Motion. Detector tests and generated-copy parity also pass.
- Browser visual validation could not run: Playwright Chromium installation returned invalid/truncated archives. Smoothness and perceived crop quality still need rendered and physical-device acceptance; no screenshot or native pass is claimed.

## 4 October 2026 — shape-following silhouette sprint

- Replaced the single left/right envelope per row with a binary silhouette represented by independent row spans. The renderer clips against the union of those spans; it no longer joins disjoint spans across page artwork.
- Flood-fill from the crop exterior distinguishes open concavities from enclosed lettering. Enclosed ink stays opaque and is copied directly from the source; no text recognition or regeneration occurs.
- Rounded dilation provides a small outline allowance without square corner leakage. Existing connected-tail detection remains supported.
- Tests verify multiple spans through a concave fixture, every source silhouette pixel retained, enclosed lettering opacity, excluded notch artwork, neighbouring-bubble isolation and rounded corner padding. Existing detector and motion tests also pass.
- This is a raster shape mask at analysis resolution, not a subpixel vector trace. Thick borders, narrow concavities, disconnected thought dots, touching/overlapping balloons and broken borders still require further work and real-comic benchmarks. Padding may include a small amount of exterior artwork. No universal precision or native visual acceptance is claimed.

Sources checked:

- https://support.google.com/googleplay/answer/7059097 — double-tap enlargement and supported-content limitations.
- https://blog.google/products-and-platforms/platforms/google-play/google-play-books-introduces-bubble-zoom/ — machine-learning identification and the page-preserving interaction.
