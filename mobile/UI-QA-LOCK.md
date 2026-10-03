# Archivist UI Lock and QA Boundary

## Current source ownership

Read `CURRENT-UI-HANDOFF.md` first.

- Active universal-mobile / Draftbit branch: `design/draftbit-universal-phone`
- Pre-migration universal branch: `design/universal-phone`
- Locked Fold/open reference: `design/hig-refresh`
- Fold canonical implementation checkpoint: `e57c5f1b19771ae6036245b8a59fe8a8ec55c28f`

## Locked Fold/reference

The approved 600dp+ Fold/open appearance is locked.

`mobile/locked-fold-ui.styles.snapshot.txt` contains the canonical reference StyleSheet and `mobile/ui-contract.test.cjs` protects the Fold styles.

The lock covers approved default appearance: geometry, spacing, typography, colours, component dimensions and placement.

Phone-specific responsive work may adapt below 600dp on the universal-mobile branches. It must not silently alter the Fold/open reference.

## Current human UI review state

The migrated universal-mobile Draftbit Preview was reviewed by Russell on 2026-10-03.

Baseline outcome: **looked good overall**.

The only issues identified in that review were:
- selected phone metric cells needed centred internal alignment;
- Settings Backup & Restore / Server & Access overlapped because stacked phone columns retained flex sizing.

Both fixes were approved, implemented and subsequently confirmed OK.

The full screen-by-screen approved state is in `CURRENT-UI-HANDOFF.md`.

## Locked/owned work boundaries

- Live Player / Now is locked for the current polish phase. See `mobile/LIVE-PLAYER-HANDOFF.md`.
- Atlas and comic double-tap speech-bubble/panel zoom are owned by the separate Astra/Work stream while active.
- The remaining product-polish stream must avoid independently changing those areas.

## Behaviour/polish already established

- Reduced Motion covers custom motion and native modal transitions.
- Fold sheets avoid inappropriate phone-style bottom-slide behaviour.
- Player/Reader switching uses a restrained in-place transition.
- Shelf loading respects Reduced Motion.
- Atlas gesture updates are coalesced/cancellable in the established implementation; Astra owns further Atlas work.
- Interactive Pressables require accessibility semantics or deliberate container exclusion.
- Small visible controls may use larger invisible hit targets.
- Reader/Player actions expose meaningful accessibility labels.
- Reader Stats supports Increased Contrast without changing the default palette.
- Production copy must not describe Archivist as Android-first or expose Expo Go implementation wording.
- Input-heavy screens use safer keyboard dismissal/inset handling.
- Phone Settings top-level columns size to content when stacked below 600dp.
- Approved phone metric cells centre their contents while section headings stay left aligned.

## Universal-mobile responsive boundary

Canonical review widths:
- 320–359dp narrow phone
- 360–429dp normal phone
- 430–599dp large phone / Fold closed
- 600–759dp Fold/open reference
- 760dp+ wide/tablet

Review portrait first, then ensure landscape remains usable.

## Runtime/device verification still required for release

Source/UI approval does not replace physical acceptance.

Verify where relevant:
- phone and Fold/open light/dark
- live fold/unfold while major screens are active
- iOS VoiceOver and Android TalkBack focus order
- notch/Dynamic Island/home-indicator and Android navigation-bar safe areas
- real keyboard behaviour
- long titles/series/folder/server names
- missing-artwork fallbacks
- real cover aspect ratios
- large-library scrolling
- loading/empty/error/offline/server-unavailable states
- splash-to-app cold launch
- mini-player/system-navigation overlap
- animation smoothness
- Reduced Motion
- real native reader/audio/platform integration

## Draftbit boundary

The active Draftbit project is an imported/migrated copy, not a live GitHub mirror.

Do not assume:
- a GitHub commit automatically appears in Draftbit;
- a Draftbit sandbox change is permanent in GitHub.

Before deleting/replacing the Draftbit project, export/sync any sandbox-only migration/configuration work back to GitHub.

## Acceptance rule

A build or CI pass is not visual acceptance.

A visual review is not native/platform acceptance.

Both are needed at the appropriate release gates.
