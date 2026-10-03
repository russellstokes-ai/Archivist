# Archivist UI Lock and QA Boundary

## Locked reference
Branch: `design/hig-refresh`

The approved Fold/reference appearance is locked. CI compares the complete React Native StyleSheet in `App.tsx` with `locked-fold-ui.styles.snapshot.txt`. Accidental visual-style changes fail the mobile UI contract.

The lock covers the approved default appearance: layout geometry, spacing, typography styles, colours, component dimensions and placement. Behaviour-only work remains allowed when it does not alter that approved appearance.

## Behaviour/polish completed without layout changes
- Reduced Motion covers custom motion and native modal transitions.
- Fold sheets avoid the inappropriate phone-style bottom slide.
- Player/Reader switching has a restrained in-place transition.
- Shelf loading uses Reduced-Motion-aware activity.
- Atlas pan/zoom animation work is coalesced/cancellable.
- Remaining Pressables have explicit accessibility semantics or are deliberately excluded as containers.
- Small visible controls use larger invisible hit targets where needed.
- Reader/Player chapter, bookmark and note actions expose meaningful screen-reader labels.
- Stats Increased Contrast now reaches its local palette without changing the default palette.
- Production copy no longer describes Archivist as Android-first or exposes Expo Go implementation wording.
- Input-heavy screens use safer keyboard dismissal/inset behaviour, including iOS automatic keyboard insets.

## Automated QA boundary
Mobile CI must pass:
- dependency install
- Expo Doctor
- TypeScript
- all discovered mobile test suites
- UI contract
- locked Fold StyleSheet snapshot

## Runtime/device verification still required
These cannot be honestly certified from source alone and must be checked on real devices / rendered previews:
- phone and Fold/open light/dark visual comparison
- Fold open/close while Shelf, Library, Player, Reader, Atlas, Stats and sheets are active
- iOS VoiceOver and Android TalkBack focus order
- Dynamic Island/notch/home-indicator and Android navigation-bar safe areas
- real keyboard behaviour with long text and multiple input types
- real cover/artwork aspect ratios and missing-artwork fallbacks
- long title/author/series/folder/server-name clipping
- real gesture quality for Reader, Comic Focus and Atlas
- animation frame smoothness on physical devices
- splash-to-app transition on cold launch
- mini-player/system-navigation overlap
- real large-library scrolling and Atlas performance

## Universal phone workspace
Branch: `design/universal-phone`

Phone-specific visual adaptation belongs on that branch, not on `design/hig-refresh`. The Fold/reference branch remains the visual source of truth. Phone work must preserve Archivist branding and hierarchy while adapting only layouts that need to respond below 600dp.
