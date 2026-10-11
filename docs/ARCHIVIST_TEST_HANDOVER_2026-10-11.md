# Archivist — device-test handover (11 October 2026)

> **CURRENT USER TEST CANDIDATE: `Archivist-Rewards-All-Fixes-131cabd.apk`.**
> This document supersedes earlier *pre-build* status wording in
> `docs/REWARDS_LOTTIE_CHECKPOINT_2026-10-11.md`.
> All feature code below was built from **exact commit**
> `131cabdc82ce7c6d6b36e0034540184bd990a3ab`.
> This is a test candidate, **not** an accepted promotion of canonical.

## 1. Resuming the next chat

The user will test the installed `131cabd` APK on the Samsung Galaxy Fold (closed/phone and unfolded) and report back in a new chat.

**Do not assume the test passed.** First read this handover and ask for/receive the user's observations. Address only reported issues, preserve the approved layout and artwork, and test against the exact candidate commit before any further build.

- GitHub repository: https://github.com/russellstokes-ai/Archivist
- Source branch: `release/rewards-all-fixes-final-20261011` (contains this handover; build itself is pinned by exact commit).
- Exact immutable test source: `131cabdc82ce7c6d6b36e0034540184bd990a3ab`.
- Exact-code backup: `backup/rewards-all-fixes-approved-test-source-131cabd-20261011` at the same commit.
- GitHub release/tag: https://github.com/russellstokes-ai/Archivist/releases/tag/rewards-all-fixes-final-131cabd
- APK: https://github.com/russellstokes-ai/Archivist/releases/download/rewards-all-fixes-final-131cabd/Archivist-Rewards-All-Fixes-131cabd.apk
- Release checksums: https://github.com/russellstokes-ai/Archivist/releases/download/rewards-all-fixes-final-131cabd/SHA256SUMS.txt
- GitHub Actions run: https://github.com/russellstokes-ai/Archivist/actions/runs/38168748464
- Separate Android app ID: `app.archivist.reader.rewardsqa` (distinct storage from canonical and other QA APKs).
- APK size: **45,789,370 bytes**.
- Exact release was published 2026-10-11 at 19:48 UTC.

## 2. State of actual verification

The **exact `131cabd` source and release** passed:

- GitHub Actions result: `completed / success`.
- **109 / 109 mobile test suites**, including reward source hashes, reward trigger semantics, comic startup watchdog, canonical gesture source locks, portrait optical placement, scanner/library regression tests.
- TypeScript checking, Android release lint, native `assembleRelease`.
- APK package-ID check, arm64 architecture check, APK signer verification, 16 KB zip alignment and SHA-256 checksum generation.
- Source-scoping audit against canonical also passed.

**None of this proves the user has physically approved the new reward animations, the portrait Play/Pause correction, or the comic error recovery.** Device acceptance is still pending. Do not claim comic `net::ERR_ACCESS_DENIED` is fixed until the specific failing comic loads on the user's device.

## 3. Features in this APK — all preserved as a single package

| Component | Exact state in `131cabd` | Source / guard |
|---|---|---|
| Living Book | Approved book artwork scaled uniformly by 1.16 inside same stage; existing page-turn engine untouched | `mobile/LivingBookCanvas.tsx`; canonical-restoration scale test |
| Book Loader | Approved 300×300 user JSON; **nine** circular mobile loading spinners replaced, art 1.35× optical magnification; Reduced Motion static approved frame | `mobile/ArchivistBookLoader.tsx` and `mobile/assets/motion/book-loader.json` |
| Play/Pause | Original selected Lottie; one 260 ms forward/reverse morph inside **unchanged 80 dp control**; no loop; end state held | `mobile/LivePlayerPlayPauseMorph.tsx` |
| Portrait Play/Pause alignment | Artwork only offset **+10 dp X / +3 dp Y** for source-art asymmetry; tighter portrait-only spacing (`playerAdaptivePhoneTight.marginTop=-18`); **Fold/unfolded mode unchanged** | `mobile/App.tsx`, `mobile/player-portrait-comic-fallback.test.cjs` |
| FF/RW | Original Forward Media Lottie, mirrored for rewind, original **58/50 dp** button sizes, white surface, 15s/30s labels; 15 seconds = 3 page flips, 30 seconds = 6, correct directions | `mobile/LivePlayerSkipIcon.tsx`, existing Living Book phase-machine control, runtime burst tests |
| Waveform | Original 5-bar audio Lottie, 20 dp in persistent mini-player; teal/ivory tones; play loops, pause/background halts | `mobile/MiniAudioWaveform.tsx` |
| Rewards — seven assets | Books Stack (books/comics); Headphones (audio); Trophy (major general); Twinkle Crown (rare prestige); Level-Up Confetti (true level-up); Badge (ordinary); Firework Burst (rare overlay) | `mobile/assets/motion/rewards/*-original.json`, `SOURCE_MANIFEST.json`, `mobile/rewardMotion.ts`, `mobile/AchievementRewardOverlay.tsx` |
| Rewards UI | Existing permanent medals, badges, card dimensions, profiles, XP/achievement ledger, titles and colours retained; animated overlay temporary; normal **96 dp phone / 112 dp Fold**, major **136 dp phone / 144 dp Fold**, per-asset optical scaling | `docs/REWARDS_LOTTIE_CHECKPOINT_2026-10-11.md`, `mobile/reward-motion-acceptance.test.cjs` |
| Reward timing | Natural playback rate, no loop, pause at final frame; **3 s minimum** total including 260ms fade; long original assets take ~4.46–5.50 s so they can finish naturally. Firework/confetti overlays may disappear earlier | `mobile/rewardMotion.ts`; this consciously prioritises natural full animation over exactly 3 seconds |
| Comic access recovery | Comic-only WebView first tries `https://appassets.androidplatform.net/` as HTML base; on error or no `reader-ready` message after **7 seconds**, retries exactly once as encoded `data:text/html`; if both fail, shows a retryable error. No relaxed WebView filesystem permission | `mobile/comicReaderWebViewSource.ts`, `mobile/comic-reader-startup-watchdog.test.cjs`, `mobile/readerAccessErrors.ts` |
| Comic gestures | Canonical speech-focus, bubble double tap, pinch zoom, page swipe/turn, CBZ/CBR/CBT loading all byte-for-byte unchanged | `mobile/localReader.ts`, `mobile/speechFocus.ts`, `mobile/archiveReader.ts`, `mobile/nativeZip.ts`; hash-lock tests |

### Approval baseline from user's previous feedback

- **Already praised in previous `d176c74` test:** mini-player waveform was described as *perfect*; Book Loader was described as good.
- **Issues reported in previous `d176c74` test:** Play/Pause artwork off-centre and portrait controls too low; comic still failed with *Error code 1, Description: net::ERR_ACCESS_DENIED*.
- **The new `131cabd` candidate includes proposed fixes for those two issues**, but user has **not yet confirmed either fix**.
- Seven reward animations were newly incorporated and have not been device-approved by the user.

## 4. Device acceptance checklist for tomorrow

**A. Existing UI and responsive layout**
- Mini-player 20 dp waveform should remain as previously praised: playback loops; pause stops; no extra decoration.
- All nine loaders remain legible and not too small; no circular loading spinner remains.
- Portrait/closed Fold: Play/Pause artwork visually centred in its white circle; player content positioned higher below NOW PLAYING; no bottom-nav overlap; touch reacts instantly; rapid Play/Pause no flicker or duplicated glyph.
- Unfolded Fold: no drift, clipping, redesign or spacing regression; Living Book appears as accepted and turns smoothly.
- 15s FF/RW: exactly 3 leaf turns in appropriate direction; 30s: exactly 6; audio seeks work even with repeated taps; controls have original sizes.

**B. Comic — highest priority outstanding risk**
- Open the *same comic* that failed in the earlier APK. Record **local, downloaded, or server**, file extension (`CBZ`, `CBR`, `CBT`, comic PDF), and what happens in the first **7–14 seconds**.
- Does it load on first origin, recover after a 7s fallback, show `ERR_ACCESS_DENIED`, present a retry message or remain blank?
- If successful: verify **double-tap speech-bubble zoom**, pinch (1–4×), swipe to next/previous page, comics covers and reader back/fullscreen; ensure no regression.
- If still broken: do **not** blindly change `localReader.ts` or broaden `allowFileAccess`; investigate source permission/URI at the native vs WebView boundary, with device diagnostics if available.

**C. Rewards — first user acceptance**
- Trigger actual achievements for books, comics, audiobooks, ordinary badge, general trophy, real level-up; prestige crown/fireworks only for meaningful/rare thresholds. Verify they don't all display the same animation.
- On phone normal overlay has 96 dp; Fold normal 112 dp; prestige 136/144 dp. Main reward visibly centred and optically similar-sized without resizing permanent reward cards.
- All rewards: no loops or duplicate overlays; source native speed; finished frame remains until fade; minimum 3-second presentation, **naturally longer where original animation takes 4–5 seconds**.
- Reduced Motion shows still art, not invisible/blank Lottie.
- Profile ring/levels, XP pacing, achievement icons and rewards badges remain legible; no phantom level-up on filter changes/startup.

**D. No-regression spot checks**
- Scanner starts and completes, cover/metadata pipeline unchanged, Needs Attention and publication gate unchanged.
- Shelf/Library/Atlas/Stats, mini-player, books/PDF readers, settings and navigation intact.
- New QA app has separate storage; it does not automatically have the canonical app's downloaded books or scanned folders.

## 5. Canonical protection and open follow-up

Original accepted source commit **`df4c39b44394d8c512ca0298bffa7f19da356490`**
on `canonical/archivist-20261011-df4c39b`; original backup branch
`backup/canonical-full-app-df4c39b-20261011` points to the same SHA. Both were verified unchanged when writing this handover. **Neither GitHub branch is protected by a GitHub ruleset**; an administrator must configure one for enforced branch protection.

Do not merge QA changes to canonical until the user explicitly accepts them.
Do not rebuild or modify the current test candidate during the user's overnight device test.

**Remaining future planned motion work:** animated splash screen, not part of this build.

**Next-chat starting instruction:** “Read `docs/ARCHIVIST_TEST_HANDOVER_2026-10-11.md` from `release/rewards-all-fixes-final-20261011`; treat `131cabd` as the exact APK under test, preserve canonical `df4c39b` and the gesture locks. Here is my Fold test feedback: …”

## 6. Historical technical references

- `docs/REWARDS_LOTTIE_CHECKPOINT_2026-10-11.md` — asset source inventory, optical scales and timing semantics; its initial “not built” status is historical, superseded by this handover and successful `131cabd` QA run.
- `docs/ARCHIVIST_BASIC_UI_ANIMATIONS_CHECKPOINT_2026-10-11.md` — five earlier basic app animations.
- `mobile/assets/motion/rewards/SOURCE_MANIFEST.json` — exact seven source URLs, SHA-256 checksums, natural frame counts and timing.
- `docs/scanner-vnext/UI_BINDING_EXCEPTIONS.json` — narrow allowlisted visual exceptions; original scanner processing locks preserved.
- `.github/workflows/rewards-all-fixes-final.yml` — immutable-source release build workflow, checks and release upload.

**Status at handover:** Code and APK archived, 109/109 automated tests passing, Android release verified; user device testing pending. No tasks scheduled in the background.
