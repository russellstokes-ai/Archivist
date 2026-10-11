# Archivist — Reward Animation Production Checkpoint

Date: 11 October 2026
Status: **Development-only, not promoted and NOT built as a new APK**

## Immutable sources

All original JSON exports preserved byte-for-byte under
`mobile/assets/motion/rewards/*-original.json`. Exact source URLs, SHA-256,
native frame counts/rates and durations are in `SOURCE_MANIFEST.json`.

| Original Lottie | Use | Native duration | Main presentation | Optical size |
|---|---|---:|---:|---|
| Books Stack | Book, comic, collection and multi-title milestones | 4.000s | 4.460s | 96dp phone / 112dp Fold, scale 1.08 |
| Headphones Entertainment | Audiobook-specific milestones | 0.500s | 3.000s | 96dp phone / 112dp Fold, scale 1.13 |
| Trophy Achievement Unlocked | Significant cross-format/general achievements | 4.000s | 4.460s | 132–144dp on prestige scale |
| Twinkle Crown | Selected levels 10, 25, 40, 60 and very rare prestige awards | 5.042s | 5.502s | 136dp phone / 144dp Fold, scale 1.06 |
| Level-Up Confetti | Real level increases; ordinary levels use as primary art, prestige crowns have confetti overlay | 1.667s | 3.000s when primary | Major 136/144dp, scale 1.06 |
| Badge | Generic smaller achievements with no appropriate format-specific animation | 4.037s | 4.497s | 96dp phone /112dp Fold, scale 1.08 |
| Firework Burst | Optional secondary effect on rare meaningful major awards only | 5.000s | No independent timer; ends or disappears with main reward | Overlaid, scale 1.08 |

### Timing acceptance

All sources play **once** at their original fps and speed=1. The native last
frame is held after completion. A shared **260ms fade** closes each
presentation. 3.000 seconds is the minimum shared display, including fade.
To satisfy the more important native-speed/full-final-frame requirement,
4–5-second original assets necessarily remain on-screen longer. The original
animations are **not accelerated or clipped** to make every presentation 3s.
The shorter 0.5-second headphones and 1.667-second level-up confetti pause
on their end frame until the 3-second presentation ends.

## Visual/architecture protection

- Permanent reward medals, ribbons, cards, progress bars, profile levels,
  achievement titles and typography are unchanged.
- Fixed animation mounts and optical scaling avoid changing card dimensions.
- No rejected Open Book animation is included.
- Only approved Lottie source images are used. Rich originals preserve colour.
- New animation overlay is isolated; first-library-onboarding celebration
  remains a separate component.
- Real level changes alone trigger level-up; source filter switches and
  initial catalogue restore cannot generate fake level-ups.
- Award ledger and claim/persistence architecture are not altered.
- Reduced Motion shows the selected still frame.
- Loading, audio and all reader/gesture/scanner code retained.

## Carried-forward player issues from Fold testing

- Play/Pause artistic glyph is shifted 5dp right and 2dp down within the
  **unchanged 80dp button** to offset transparent/optical asymmetry.
- Phone-only Player content is lifted 20dp and internal spacing tightened,
  using the empty space below NOW PLAYING. Original Fold/unfolded layout,
  book renderer and transport button sizes remain unchanged.
- These optical/layout tweaks require physical phone/Fold acceptance.

## Open blocker: comic loading error

User still reported **Error code 1 — net::ERR_ACCESS_DENIED** when opening a
comic in the previous test APK, despite the existing WebView origin fix.
**Do NOT mark that error resolved.** The source category triggering the error
(local CBZ/CBR/CBT vs downloaded vs server comic / comic PDF) still needs
runtime diagnosis. Canonical speech-bubble zoom, double-tap, pinch, swipe,
page turn and archive-reader code remain byte-identical.

## Deliverable scope and release gate

The NEXT APK (only after user approves this combined change list) should
contain the earlier five approved motion features, comic-access correction
once root-caused, portrait player alignment and these seven reward Lotties.
Splash-screen animation remains separate/unimplemented.

Canonical source commit `df4c39b44394d8c512ca0298bffa7f19da356490`
and its backup are untouched. Do not merge or change canonical.
