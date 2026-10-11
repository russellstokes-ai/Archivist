# Archivist — basic app UI animation checkpoint (11 October 2026)

## Source protection and status

This is a **development checkpoint, not the accepted canonical APK**.
Original canonical source: `df4c39b44394d8c512ca0298bffa7f19da356490` on
`canonical/archivist-20261011-df4c39b`.
Independent original backup: `backup/canonical-full-app-df4c39b-20261011`.

All the following work descends through these isolated branches:

1. `fix/living-book-render-scale-20261011`
2. `feat/book-loader-all-spinners-20261011`
3. `feat/live-player-pause-play-lottie-prototype-20261011`
4. `feat/live-player-forward-rewind-lottie-20261011`
5. `feat/archivist-ui-motion-waveform-20261011` (consolidated current branch)

Do not merge or promote the snapshot until physical Fold / phone visual and touch acceptance.
GitHub branch protection must separately be enabled in repository rulesets; the existence
of a backup reference is **not** an enforced read-only ruleset. Do not rewrite either
canonical or backup ref.

## Approved base UI animation inventory

| Area | Approved source | Repository files | Implemented | Important bounds |
|---|---|---|---|---|
| Living Book drawing | Original accepted Archivist code, not Lottie | `mobile/LivingBookCanvas.tsx` | Uniform 1.16× scale for actual drawn book only | Original frame content, opening, physical page turns, stage, and surrounding layout preserved |
| All circular mobile load spinners | User supplied Book Loader JSON, 300×300, 60 fps, 240 frames | `mobile/assets/motion/book-loader.json`, `mobile/ArchivistBookLoader.tsx` | Nine mobile locations, shared 1.35× visible-artwork zoom and five explicit contexts | No circle data charts replaced; no scanner changes |
| Play/Pause | https://lottiefiles.com/free-animation/pause-play-ThGRBFYJSo | `mobile/assets/motion/live-play-pause-lottiefiles.json`, ivory/navy derived variants, `mobile/LivePlayerPlayPauseMorph.tsx` | One nonlooping in-button morph, 260 ms, holds on end frame and reverses on pause | Original 80 dp transport and Living Book renderer untouched |
| Fast forward / rewind | https://lottiefiles.com/free-animation/forward-media-s7Vy5kFTbT | `mobile/assets/motion/live-forward-media-source.json`, ink variant, `mobile/LivePlayerSkipIcon.tsx` | Mirrored source chevrons, navy ink on warm white, fixed 58 dp/50 dp controls | `15s` = 3 distinct turns, `30s` = 6; forward right, rewind left; bounded event sequencing in `App.tsx` not WebView renderer |
| Mini-player waveform | https://lottiefiles.com/free-animation/audio-waveform-0kiw5n6eq2 | Original 120×120, 24 fps, 28-frame source plus teal/ivory ink variants, `mobile/MiniAudioWaveform.tsx` | Small fixed **20 dp** indicator in persistent AUDIO mini-player, gated by real playback and foreground state | Paused/background: native animation paused; Reduced Motion: static/reset; no extra Live Player placement; no mini-player button resizing |

### Immutable source assets and SHA-256

- User Book Loader JSON: `3343c116823f2aa6cfce375af417630353b42fc06bab63a333b60e4769ac84c6`
- Original Pause/Play Lottie JSON: `905dc4f7a186facc6173b6e78375e7d8fd1cefd83c000c48cacf2dc351ef6300`
- Original Forward Media Lottie JSON: `7598a66a5ea82a21f863648d837e0516e0a891c487069e4614d6a1660b9fa65a`
- Original small Audio Waveform Lottie JSON: `ebd76660844ec46eb8b9176c51a909119ad65a98b4fd771b2a4a3355dd610deb`
- Inherited LivingBookCanvas Git blob SHA-1: `3f2b6f2b91dbe77e71f65c02a8696b372d2126fd`

Preserve original Lottie exports byte-for-byte; theme variants are derived files and must
not change animation geometry/easing/timing. Do not add a duplicate ring around transport icons.

## Verification protocol

Use the existing mobile test runner and typecheck. Especially:

- `mobile/living-book-render-scale.test.cjs`
- `mobile/book-loader-consistency.test.cjs`
- `mobile/live-player-play-pause-morph.test.cjs`
- `mobile/live-player-skip-icons.test.cjs`
- `mobile/live-player-skip-burst-runtime.test.cjs` (executes original skip control against real book phase reducer)
- `mobile/mini-audio-waveform.test.cjs`
- `mobile/scanner-vnext-ui-binding.test.cjs` and `mobile/scanner-vnext-process-lock.test.cjs`
- `mobile/ui-contract.test.cjs` and `mobile/test10-1-living-book-reentry.test.cjs`

Existing canonical UI source hashes are retained, and all deliberately changed UI segments
are listed as narrow reversible exceptions in
`docs/scanner-vnext/UI_BINDING_EXCEPTIONS.json`.

**Important:** passing source tests/typecheck/Android native checks demonstrates automated
compatibility, not human visual acceptance. Real phone/Fold checks remain necessary
for Lottie frame positions, reduced-motion rendering, rapid Play/Pause taps, skip
directions, actual 3/6 page visibility, and mini-player spacing on narrow screens.
No new APK is requested or built as part of the waveform checkpoint.

## Scope freeze after this checkpoint

The *basic app UI animations* are frozen pending acceptance:
Living Book, loaders, play/pause, FF/RW and mini waveform.
**Only Rewards animations and the Splash screen animation** remain authorised
new motion work without a separate explicit request. Do not redesign UI
or replace the physical Living Book with a Lottie.
