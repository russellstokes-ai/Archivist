# Archivist 0.9.5 canonical UI lock

Status: **LOCKED for the 0.9.5 functional hardening pass**

This document freezes the approved mobile UI baseline before scanner, metadata, playback, reader, Atlas, persistence, Android and release hardening work continues. Functional fixes may change data, state, performance, error handling and behaviour. They must not silently change the layout, copy hierarchy, navigation, branding or styling described here.

## Source of truth

The canonical visual baseline is the user-approved 0.9.4 APK/UI, carried forward to the current application, with only these two approved visual changes:

1. The launch/splash experience gains the Archivist ambient halo and a restrained premium animation.
2. In unfolded/Fold mode, the Library left rail is wider and its labels/selection marker are more readable.

The scanner onboarding is also allowed to use the approved sequential pulse treatment already present in the baseline so the next relevant action is visually clear.

## Locked global language

- Dark canvas: navy `#07111D`, never pure black.
- Primary text: warm ivory `#F3F0E8`.
- Muted text: `#A9B4C5`.
- Divider: `#26364A`.
- Card/raised surfaces: `#0B1725` / `#0E1C2C`.
- Sage/teal accent: `#47736F`.
- Dark-mode gold: `#E3BC67`.
- Editorial headings use `ArchivistEditorial`.
- Teal halo/glow remains part of the visual system; gold is the complementary accent.
- Edge-to-edge layouts, restrained dividers and minimal boxing remain the design language.

## Locked application chrome

- Header retains the Archivist wordmark and the persistent profile/stats entry point where that header is shown.
- Bottom navigation remains exactly: **Shelf · Library · Now · Atlas · Stats**.
- **Now** remains the centre destination.
- Reader/Profile/Settings keep their intentionally different chrome rules.
- The persistent mini-player remains above bottom navigation when applicable.
- No replacement text-glyph controls or ad-hoc iconography.

## Locked responsive tiers

- Compact: under 430 px.
- Phone: 430–599 px.
- Fold: 600–759 px.
- Wide: 760 px and above.

Existing phone/Fold/wide content layouts are frozen unless a device-specific defect is explicitly targeted.

## Locked Shelf / Library hierarchy

- Shelf keeps the editorial greeting/section treatment and existing content ordering.
- Library keeps the editorial catalogue header, search/filter tool row, source/space navigation and cover-first catalogue.
- Fold Library rail is approved at **184 px**, with 11 pt rail headings, 14 pt source/space labels and a 4 px selected marker.
- Phone mode must not inherit Fold rail changes.
- Unidentified/unapproved works must not appear as normal Library entries.

## Locked launch experience

The native launch handoff is followed by the in-app Archivist launch layer:

- navy/ivory presentation appropriate to theme;
- Archivist icon and editorial wordmark;
- ambient teal/gold halo;
- restrained entrance, one inhale/exhale halo movement and fade;
- Reduced Motion respected;
- no animation mechanism that bypasses the Living Book animation safety contract.

## Locked onboarding

The setup journey remains:

1. **Choose your sources** — add one or multiple device folders and/or connect an Archivist server.
2. **Scan your device folders** — nothing is scanned merely by adding a folder.
3. **Review only what needs attention** — unresolved works require review before entering the local Library.
4. **Enter my library** when the usable catalogue is ready.

Only the currently relevant action pulses/highlights. After a folder is added, Scan becomes the relevant stage. Scanner activity may expose the approved sub-stages:

**Discover → Group & identify → Metadata & covers → Ready**

These are progress states, not extra mandatory setup pages.

## Locked core screens

The current approved layouts and text hierarchy for these surfaces are frozen during the 0.9.5 hardening pass:

- Shelf
- Library
- Now / Living Book player
- Reader / comic reader
- Atlas
- Reader Stats
- Profile / Rewards
- Settings
- Metadata review/editor
- Server connection/setup
- Mini-player and bottom navigation

Functional defects may be corrected inside those screens without redesigning them.

## Change-control rule

Any change to the locked UI must be one of:

- an explicitly requested UI change;
- a required accessibility fix;
- a device-specific clipping/overlap fix that preserves the visual hierarchy; or
- a functional-state addition that reuses existing components/styles.

Otherwise, a failing `ui-contract.test.cjs` assertion should be treated as a regression, not rewritten to accommodate the change.

The UI lock remains in force until the 0.9.5 acceptance build has completed physical-device testing.
