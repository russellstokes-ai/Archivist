# Archivist — Current UI Handoff

**Status:** Canonical UI/development handoff. Read this before changing Archivist mobile UI.

**Last consolidated:** 2026-10-03

This file exists so approved UI decisions and current development state do not depend on ChatGPT/Draftbit conversation history.

## Repository and branch ownership

Repository: `https://github.com/russellstokes-ai/Archivist`

### Locked Fold/open reference
- Branch: `design/hig-refresh`
- Canonical approved Fold implementation checkpoint: `e57c5f1b19771ae6036245b8a59fe8a8ec55c28f`
- Current branch tip includes only the Fold lock documentation after that checkpoint: `6efb42c9b127248cfb0f6d0b2209e1106d556a40`
- Lock documentation: `mobile/FOLD-REFERENCE-LOCK.md`
- Full locked StyleSheet snapshot: `mobile/locked-fold-ui.styles.snapshot.txt`
- UI contract: `mobile/ui-contract.test.cjs`

**Rule:** do not change the 600dp+ Fold/open reference without Russell's explicit approval.

### Universal mobile source
- Pre-Draftbit responsive branch: `design/universal-phone`
- Approved phone review fixes checkpoint: `1083bf6cf9bdb15b048f018f77e72861c18cf9ff`

### Active Draftbit / universal-mobile development branch
- Branch: `design/draftbit-universal-phone`
- App folder: `mobile`
- Current checkpoint at consolidation: `43a1e40a079cc36841d09f470f95a120727a49ad`
- This branch contains the Expo 55 / Expo Router migration plus the universal-phone work and later Live Player checkpoint.

Draftbit was imported using **Import & migrate to Draftbit conventions**, not Preserve Existing Setup.

The current Draftbit project is an imported copy, not a live GitHub mirror. Do not assume changes made only inside Draftbit exist in GitHub until explicitly exported/synced/committed. Conversely, GitHub commits made after an import do not automatically appear in that imported Draftbit workspace.

## Product platform rule

Archivist is a **universal iOS + Android mobile app**, with Fold/open layouts as a first-class adaptive composition.

Do not describe the product or roadmap as Android-first.

Supported layout classes:
- narrow phone: 320–359dp
- normal phone: 360–429dp
- large phone / Fold closed: 430–599dp
- Fold/open reference: 600–759dp
- wide/tablet: 760dp+

Phone work may reflow below 600dp. It must not redesign the 600dp+ Fold/open reference.

## Current human visual acceptance

A migrated universal-mobile Draftbit Preview was reviewed by Russell on 2026-10-03.

Overall result: **the universal-mobile preview looked good**.

Only two visual issues were identified in that pass:

1. Mobile metric blocks should be visually centred.
2. Settings Backup & Restore / Server & Access stacked columns overlapped on phone.

Both were approved and corrected.

### Approved phone-only metric centring
Below 600dp, centre the content inside these existing two-column metric cells while keeping section headings left aligned:
- Atlas → Universe Stats
- Reader Stats → Taste & Notes
- Profile → Reading Snapshot
- Profile → Personal Bests

Keep the existing two-column grid, typography, spacing and card dimensions.

Saved in:
- `design/draftbit-universal-phone`: commit `a579c37852a2eed01b18c27782661e784d1972bd`
- `design/universal-phone`: commit `1083bf6cf9bdb15b048f018f77e72861c18cf9ff`

### Approved Settings phone overlap fix
The two top-level Settings columns must not retain `flex:1` when stacked vertically below 600dp.

Phone-only top-level Settings columns use content height:
- `flexGrow: 0`
- `flexShrink: 0`
- `flexBasis: 'auto'`
- `width: '100%'`

This prevents Backup & Restore from overlapping Server & Access / Server & Family.

Fold/wide layout is unchanged.

Saved in the active branch and included in the later consolidated mobile checkpoint.

Russell subsequently confirmed the result was OK.

## Approved global visual language

Archivist is premium, restrained, editorial and content-led.

### Palette
- true black / charcoal / deep navy in dark presentation
- warm ivory / cream / white in light presentation
- Archivist Sage `#47736F` for primary interaction/selection
- Archivist Gold `#B99A68` only for milestones, rare emphasis and selected editorial detail
- artwork supplies most content colour
- avoid rainbow UI or format/source colour coding

### Typography
- canonical editorial face: `ArchivistEditorial / Libre Caslon Text`
- clean sans-serif for controls, metadata and dense UI
- major titles share the established PageHeader hierarchy
- no generic Android serif as the ordinary interface heading system

### Composition
- do not create card soup
- do not replace crafted sections with generic boxes
- use whitespace, hierarchy and dividers before containers
- covers/content remain more visually important than controls
- minimum normal interaction target: 44dp
- one persistent top-right profile avatar on navigable pages
- phone uses sheets where width demands; Fold may use rails/side inspectors

### Motion
Animations are approved even where layout is locked.
- restrained and purposeful
- Reduced Motion must be respected
- series stack expansion animates
- sheets/transitions should feel deliberate
- no decorative constant motion

## Global navigation

Canonical primary navigation:
1. Shelf
2. Library
3. Now
4. Atlas
5. Stats

Now is the contextual Player / Reader hub.

Profile, Rewards and Settings are reached from the persistent profile avatar/account hub rather than becoming extra bottom-nav clutter.

## Screen-by-screen approved UI state

### Shelf
Shelf is the personal/editorial home, not a storage catalogue.

Approved:
- shared PageHeader and isolated top-right profile avatar
- Continue Reading / Continue Listening hero
- three recommendation rows: Books for you, Comics for you, Audiobooks for you
- recommendations are owned-content-only and deterministic/local
- max 3 recommendations on phone, 5 on Fold/wide
- Favourites
- Smart Shelves
- Collections
- Series
- series stacks expand/collapse in place with animation
- alternate formats group under the logical work
- if format choice is obvious, resume/open directly; otherwise show explicit format chooser
- storage shortcuts remain secondary, not the Shelf's main purpose
- utility actions remain quiet/trailing rather than dominant buttons

Phone adaptation may tighten gutters/artwork but must retain the same design language.

### Library
Library is the location/organisation catalogue view.

Approved:
- high-density cover catalogue
- phone: Sources & folders opens as a dedicated sheet
- Fold/wide: persistent left Sources & folders rail
- Fold rail width reference: 112dp
- source semantics:
  - local/downloaded = **On this device**
  - remote-only = **Archivist Server**
  - downloaded server work retains **SAVED** origin/state
- search, filters, sort and grid/list controls stay compact
- logical works are the default browsing unit
- series/format/edition grouping remains understandable

Manage Library is the dedicated advanced maintenance workspace.

Approved management areas:
- Scan & Repair
- metadata review
- missing author/series/genre/cover queues
- safe organisation
- duplicate / alternate-format / different-edition review
- bulk metadata
- local and server folder management

Do not add a separate recovery card. If organising may make the index stale, use the simple approved prompt:
- **Library may be out of date**
- copy: files changed while Archivist was organising
- actions: **Rescan**, **Not now**

### Scan / organisation feedback
Standard scanning is already the advanced/capable scanning path. Do not add a separate “deep audit mode”.

Approved scan UX:
- phased progress
- useful human-readable labels
- compact Library updated summary
- exact maintenance/review queues

Approved organisation UX:
- Preview before Apply
- only Ready items selected by default
- statuses:
  - Ready
  - Review recommended
  - Conflict
  - Already organised
- show current/proposed path and metadata context
- never automatically delete duplicates
- interrupted operations must remain recoverable
- originals protected until safe copy/apply succeeds

### Metadata / covers / Work Details
Approved:
- polished Work Details sheet for grouped logical works
- title, author, series, format, genre, year, state, rating, location, availability, file/edition counts and provenance
- metadata editing applies correctly to grouped local works
- manual metadata overrides survive rescans
- series number supports decimal values
- advanced fields are progressively disclosed

Cover management:
- native/system image picker
- one selected image at a time
- 25 MB manual cover limit
- ranked local artwork candidates
- immediate preview
- picked cover copied into Archivist app storage
- manual cover protected from rescans
- **Use scanned metadata & cover** restores scan-driven data
- no raw URI field in normal UI
- no broad photo-library permission request merely to choose one cover

### Reader Stats
Approved premium editorial dashboard.
- dark/light Archivist presentation
- dense but open hierarchy
- metric cards, charts, rings, heatmaps and reading rhythm
- feels like a reading journal, not business intelligence
- user-reviewed phone metric cells centre their content where described above
- section headings remain left aligned

### Profile
Approved:
- editorial identity hero
- Archivist progression/level ring
- reading traits
- Reading Snapshot
- Personal Bests
- Current Goals
- milestone highlights
- persistent/customisable identity avatar

Phone review fix:
- Reading Snapshot metrics centred
- Personal Best cards centre icon/value/caption
- headings remain left aligned

### Rewards
Approved:
- progression and achievements integrated with the Archivist visual system
- gold remains milestone/achievement emphasis, not a general accent
- avoid generic game-dashboard styling

### Settings
Approved six-area structure:
- Library & Metadata
- Offline & Storage
- Privacy & Data
- Server & Family
- Accessibility
- About Archivist

Approved:
- local-first privacy language
- backup/restore for non-sensitive local reading/app state
- server credentials/access keys excluded from backups
- optional server connection
- simple Admin/User family semantics
- accessibility preferences for Reduced Motion, Increased Contrast and Larger Interface Text
- calm sections/dividers, not admin-dashboard card soup

Phone overlap fix described above is mandatory.

### Onboarding
Approved principles:
- app must be usable locally without server
- first-run can add/scan a local folder
- optional Archivist Server can be connected later
- locally-only choice must not block future server setup
- server should not be presented as a prerequisite

### Branding / splash
Approved:
- canonical Archivist logo, not a generic letter A
- mobile icon: `mobile/assets/icon.png`
- canonical logo also used by splash
- light splash uses warm ivory
- dark splash uses deep navy/black Archivist canvas
- no white/teal flash between native splash and first app frame
- canonical ArchivistEditorial typography

## Live Player / Now — LOCKED FOR THIS PHASE

Russell considers Live Player / Now complete for the current product-polish phase.

Do not redesign or continue feature work there unless:
- a regression from another change is proven; or
- Russell explicitly reopens Player scope.

Current player checkpoint on the active branch:
`43a1e40a079cc36841d09f470f95a120727a49ad`

The implementation/checkpoint is also described at the top of `TESTING-READINESS.md`.

Current product direction includes:
- Living Book hero
- open/close state tied to playback
- page/leaf skip animation
- durable seeking/progress
- narrator-aware byline
- accessible controls
- phone/Fold responsive composition

Runtime/device release acceptance can still be a QA requirement without reopening the approved design.

## Atlas + comic double-tap zoom — SEPARATE ASTRA/WORK OWNERSHIP

A separate Astra/Work stream owns:
- Atlas perfection/polish
- deterministic comic double-tap speech-bubble/panel focus/zoom

The normal chat polish stream must not independently redesign or implement those areas while that work is active.

Any overlapping file change must preserve the Astra work and avoid reverting it.

Atlas remains subject to the canonical Atlas design rules in `DESIGN-STANDARD.md`.

Comic focus rules remain:
- original pixels only
- no generative redraw
- deterministic/local analysis
- smooth focus/restore
- pinch returns to normal zoom
- uncertain detection falls back gracefully

## Remaining polish stream — chat, piecemeal

Outside Atlas, comic focus and the locked Player, the active finishing stream covers:
- Shelf final polish
- Library final polish
- scanning/metadata/organisation release polish
- Work Details / format and edition chooser
- local-only/server onboarding
- folder/source management
- local/server/downloaded switching
- offline downloads and recovery
- Reader polish outside comic focus
- Settings
- privacy / backup / family flows
- accessibility
- empty/loading/error/offline states
- iOS + Android adaptive behaviour
- phone / Fold closed / Fold open / landscape resilience
- splash/icon/branding consistency
- CI/build/release plumbing
- final README, release copy and test readiness

Work is deliberately being done in **small chat sprints** because of usage limits. Do not assume a future session should launch a large autonomous work stream.

## Draftbit migration / preview state

The universal mobile project was successfully migrated far enough for Draftbit Preview.

Problems encountered and resolved inside the Draftbit sandbox included:
- missing Yarn node_modules state
- missing Yarn patch artifacts
- Draftbit dependency reinstall state
- missing `react-native-worklets` required by Reanimated 4

After those fixes, Draftbit reported Preview healthy.

Important: because Draftbit import is a copy, sandbox-generated migration/dependency state must eventually be exported/synced back to GitHub before deleting the Draftbit project. Do not rely on sandbox-only state as permanent source.

The migrated universal-mobile Preview was then visually reviewed and judged good except for the two phone fixes already documented above.

## Accessibility rules

There is no separate “Accessibility Mode”.

Archivist should honour platform/user preferences naturally:
- Reduced Motion
- Increased Contrast
- Larger Interface Text
- VoiceOver / TalkBack semantics and focus order
- 44dp+ interaction targets
- invisible hitSlop may enlarge small visible controls
- no state conveyed by colour alone
- keyboard/inset handling on input-heavy screens

Default visual layout remains the approved Archivist UI.

## Acceptance rules

A feature is not complete merely because code exists.

For relevant changes, require:
- source implementation
- typecheck/tests
- native compile where applicable
- rendered Preview/device review
- phone and Fold review
- light/dark review
- long-title/missing-cover stress
- loading/empty/error/offline state review
- Reduced Motion review
- real interaction/device checks where the platform behaviour matters

Do not mark untested features complete.

## Documents future sessions must read

Read in this order:
1. `CURRENT-UI-HANDOFF.md`
2. `PROJECT-CONSTANTS.md`
3. `DESIGN-STANDARD.md`
4. `mobile/FOLD-REFERENCE-LOCK.md`
5. `TESTING-READINESS.md`
6. `MOBILE-TESTING.md`

Older roadmap/design-refresh files are historical context where they conflict with this handoff.
