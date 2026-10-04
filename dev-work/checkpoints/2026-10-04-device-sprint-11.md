# Device polish Sprint 11 — Shelf controls & Smart Shelf quick starts

Date: 4 October 2026  
Branch: `bugfix/0.9.4-device-pass-20261004`

## Goal

Finish the approved Shelf-control polish without redesigning the locked Shelf.

Sprint 11 scope:
- make **Arrange** the natural place to manage Shelf structure and enter Smart Shelf/collection management;
- keep filter/organisation sheets geometry-stable so opening and changing options does not move the underlying page;
- make Smart Shelf creation approachable with plain-language presets first;
- keep nested **Advanced rules** available as secondary control;
- preserve existing Shelf content, recommendations, Fold layout and visual language.

## Implemented

### Arrange integration
- The existing **Arrange** sheet still controls Shelf section visibility and order.
- It now also exposes **New Smart Shelf** and **Manage Smart Shelves & collections**.
- Existing Shelf shortcuts remain valid, but all Smart Shelf creation now routes through one setup path.
- Library **Save as Smart Shelf** enters the same flow while carrying the active Library filters.

### Plain-language Smart Shelf quick starts
The simple Smart Shelf setup now foregrounds five safe presets:
- **Currently reading**
- **Not started**
- **Favourites**
- **Highly rated**
- **Available offline**

Each preset builds normal Smart Shelf rules rather than a separate feature path, so users can immediately save it or open **Advanced rules** and fine-tune the same rule set.

### Stable menu geometry
- Organisation continues to use the existing fixed-height `actionSheetStable` container.
- No conditional parent-sheet sizing was reintroduced.
- Simple/preset and Advanced-rule content changes occur inside the stable sheet viewport rather than moving the underlying Shelf/Library page.

## Behavioral regression coverage
- Smart Shelf presets are tested against representative local, server and downloaded works.
- Tests verify currently-reading, not-started, favourites, highly-rated and offline filtering behavior.
- Sprint 11 integration guard verifies:
  - Arrange exposes Smart Shelf and collection management;
  - Library Save as Smart Shelf preserves current-filter entry;
  - presets are foregrounded in simple setup;
  - Advanced rules remain secondary;
  - Smart Shelf organisation remains inside the fixed-height sheet.

## Scope boundary
No Shelf sections, recommendation rows, Library catalogue layout, Player, Reader, Atlas, Stats, profile, bottom navigation, Fold layout or content cards were redesigned.

Final code diff from the Sprint 10 checkpoint is intentionally small:
- `mobile/App.tsx`: 26 changed lines
- `mobile/libraryOrganisation.ts`: 18 added lines
- `mobile/library-organisation.test.cjs`: 11 changed lines
- `mobile/shelf-controls-sprint11.test.cjs`: new 17-line integration guard

## Automated evidence
- **PASS Mobile:** run `37228382695` — dependency install, Expo Doctor, TypeScript, full maintained mobile test suite, version consistency and Expo web bundle.
- **PASS iOS:** run `37228382631` — dependency install, Expo Doctor, TypeScript, native project generation, CocoaPods and full iOS Simulator compile.
- Executable/test head: `0af64e0987d2f9c281e4da475a8ef744696587eb`.

## Physical acceptance boundary
Still verify on representative phone/Fold devices:
- Arrange opens without moving the underlying Shelf.
- Switching simple setup / Advanced rules does not produce a visible vertical jump.
- Each quick-start preset is understandable at a glance and saves the expected shelf.
- Library **Save as Smart Shelf** carries active filters correctly.
- Phone/Fold light/dark and larger-text behavior remains visually clean.

No physical-device completion claim is made by this checkpoint.
