# Comic speech focus — full-release requirement

Requested 23 September 2026. Internal feature name: Speech focus. Google Play Books Bubble Zoom is an experience reference, not an asset/code dependency.

## Interaction contract

Double-tap a speech bubble to enlarge a precisely clipped copy of that bubble over the original page. Preserve its outline, tail, lettering and source artwork; do not redraw or regenerate text. Anchor the initial frame to the original bubble and animate smoothly into a comfortably readable scale. Keep the page visible underneath, prevent viewport clipping and avoid unnecessary camera movement. Tap outside or double-tap again to return to the exact previous page position. Pinch zoom remains available independently. Provide an accessible explicit action and reduced-motion transition.

The finished interaction must feel like lifting the actual bubble off the page, not displaying a rectangular magnifier. Use a high-resolution source region with an antialiased alpha mask. Clip using the detected shape; include sufficient border padding to avoid trimming ink. Constrain the enlarged placement to safe areas. Repeated gestures and page changes cancel earlier animations cleanly. Portrait, landscape, tablets and right-to-left manga require distinct interaction checks.

## Privacy and feasibility

All processing stays on the reading device or the user's own server. No comic upload, cloud vision API, external recommendation request or analytics. Cache masks locally keyed by asset fingerprint, page and detector version; invalidate on file changes. Processing must not contend with playback or block scrolling; use bounded workers and low-resolution analysis with full-resolution display crops.

Google states that its bubble identification uses machine learning; its help page limits supported titles. That is evidence of a nontrivial detection problem, not a promise that a simple heuristic can reproduce it universally.

Archivist's existing no-AI direction remains in force. First evaluate supplied region metadata and conventional local image-processing segmentation. A compact local learned detector would be a separate architectural decision if deterministic methods fail the quality threshold; no such model is approved or included by this requirement. No generative AI, OCR service or remote inference is needed for the magnification interaction itself.

Do not substitute an ordinary page zoom and mark this feature complete. Where segmentation is uncertain, retain ordinary zoom with an honest unsupported state; this fallback does not satisfy the precision requirement. Avoid confident but wrong masks that omit words or merge adjacent bubbles.

## Implementation stages and release gate

1. Implement the rendering/animation path using hand-verified region masks on user-owned or original test pages. Validate perceived quality independently of detection.
2. Evaluate deterministic detection across white/coloured bubbles, thought clouds, narration boxes, jagged borders, touching bubbles, text outside bubbles and manga. Measure complete-text coverage and background leakage against human-labelled masks.
3. Add cache, cancellation, memory budgets and permission enforcement. Ensure no external requests during detection or playback of the animation.
4. Test on actual low/mid/high-tier phones, both platforms, large scanned pages, reduced motion, screen readers and rapid gestures.

A fixed benchmark set and measured acceptance thresholds must be established before claiming release readiness. False positive crops, unreadable enlargement or appreciable interaction stalls block acceptance. Scope includes smooth enlargement and clean cutout quality; exact universal detection is not asserted. This feature is specified, not yet implemented.

Sources checked:

- https://support.google.com/googleplay/answer/7059097 — double-tap enlargement and supported-content limitations.
- https://blog.google/products-and-platforms/platforms/google-play/google-play-books-introduces-bubble-zoom/ — machine-learning identification and the page-preserving interaction.
