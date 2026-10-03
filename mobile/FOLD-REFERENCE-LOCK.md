# Archivist Fold Reference — Canonical Locked UI

Status: **LOCKED REFERENCE**

Canonical branch: `design/hig-refresh`

Canonical reference commit: `e57c5f1b19771ae6036245b8a59fe8a8ec55c28f`

This branch is the approved Archivist Fold/open reference and must remain recoverable from GitHub alone. Deleting a Draftbit sandbox must not affect this reference.

## Non-negotiable rule

Do not change the Fold/open visual design on `design/hig-refresh` unless Russell explicitly approves a Fold design change.

Phone/universal-mobile adaptations belong on `design/universal-phone` or a dedicated migration branch. They must not be used as justification to alter Fold/open layout, spacing, typography, visual hierarchy, icon language, palette, or component geometry.

## Canonical files

- `mobile/App.tsx` — current approved UI and runtime implementation
- `mobile/locked-fold-ui.styles.snapshot.txt` — canonical StyleSheet snapshot
- `mobile/ui-contract.test.cjs` — UI-lock assertions
- `mobile/sprint-5-7-contract.test.cjs` — design/runtime contract checks
- `TESTING-READINESS.md` — latest implementation and verification notes
- `mobile/assets/icon.png` — canonical Archivist logo/icon asset
- `mobile/assets/fonts/LibreCaslonText.ttf` — editorial display font used by Archivist

## Approved Fold/open design language

### Overall
- premium restrained presentation
- dark mode: black / charcoal / deep navy
- light mode: warm ivory / cream
- restrained teal and champagne/gold accents only
- editorial serif headings with clean sans-serif UI copy
- no generic box-heavy redesign
- generous whitespace and strong hierarchy
- tactile but understated motion
- same product language across all screens

### Core screens
- Shelf
- Library
- Now / Player / Reader
- Atlas
- Reader Stats
- Profile
- Rewards
- Settings

### Global shell
- persistent top-right profile avatar
- canonical bottom navigation
- fixed Archivist icon language
- canonical typography hierarchy
- light/dark themes
- Reduced Motion support
- Increased Contrast support
- safe areas and keyboard/inset handling

### Library
- Fold/open uses persistent left Sources & Folders rail
- 112dp rail for Fold layout
- content area remains spacious and editorial
- normal phones collapse Sources & Folders into a sheet; this must not be back-ported into Fold/open
- scanning/metadata/organisation management is accessed through the approved Manage flow

### Shelf
- content-led, not storage-led
- top recommendations for books, comics, audiobooks
- 5 recommendation limit on Fold/open
- Continue hero
- favourites, smart shelves, collections and series
- series stack expands in place with animation
- alternate formats grouped under logical work

### Work details / metadata
- polished details sheet
- metadata editing
- protected manual cover artwork
- ranked local artwork candidates
- native image picker
- scanned metadata restore action
- no raw URI field in normal UI

### Atlas
- relationship-led graph experience
- rounded, polished graph language
- genre and relationship context
- inspector behaviour retained
- do not replace with a generic node graph

### Reader Stats
- premium editorial dashboard
- compact metric cards
- rings, heatmaps, progress and rhythm data
- rich but not cluttered
- current spacing/hierarchy is approved reference

### Player / Reader
- Living Book presentation
- page-turn and skip-turn animation behaviour
- audiobook player
- ebook/PDF/comic reader
- speech-focus / comic zoom capability
- preserve current control hierarchy and motion language

## Locked responsive boundary

- below 600dp: phone-specific composition may adapt on universal-phone branches
- 600–759dp: Fold/open reference
- 760dp+: wide reference

The Fold/open and wide reference styling must not be changed by phone work.

## Existing protection

`mobile/ui-contract.test.cjs` compares the approved StyleSheet against `mobile/locked-fold-ui.styles.snapshot.txt` on the Fold/reference branch.

If a future migration changes styling technology, do not simply delete this protection. Replace it with equivalent assertions that preserve the same Fold/open geometry and visual tokens.

## Recovery procedure

If a Draftbit workspace, sandbox, imported project, or phone branch is deleted or corrupted:

1. Treat `design/hig-refresh` as the canonical Fold source.
2. Verify this document and the locked StyleSheet snapshot are present.
3. Use commit `e57c5f1b19771ae6036245b8a59fe8a8ec55c28f` as the known canonical Fold checkpoint if later branch work is uncertain.
4. Restore from GitHub, not from a Draftbit sandbox export.
5. Do not merge universal-phone layout overrides back into the Fold reference unless explicitly approved.
6. Re-run the UI contract and mobile tests before declaring the Fold reference restored.

## Universal-mobile migration guidance

Universal-mobile work should begin from the locked Fold implementation and adapt composition only where width requires it.

Allowed phone changes include:
- tighter gutters
- one-column stacking
- smaller artwork sizing
- sheet-based navigation instead of persistent rails
- narrower headers
- compact bottom navigation
- reflowed controls

Not allowed without explicit approval:
- new palette
- different typography system
- new component language
- removing approved Fold animations
- changing Fold/open spacing or hierarchy
- replacing canonical Archivist logo
- simplifying Atlas, Stats, Shelf, Library, Player or Reader into generic layouts

## Draftbit

If the Draftbit Fold sandbox is deleted, this GitHub branch remains the source of truth.

For new Draftbit work:
- use the universal-mobile branch/migration branch
- do not use `design/hig-refresh` as a scratch workspace
- compare any generated migration output back to this locked reference
- visually review Fold/open again before any cross-branch merge

## Approval rule

Any proposal that changes Fold/open layout, text, visual hierarchy, spacing, typography, palette, navigation structure or component appearance must be shown to Russell before implementation.
