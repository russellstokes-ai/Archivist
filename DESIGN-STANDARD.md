# Archivist Design Standard

**Status:** Canonical. UI changes must conform to this file before they can be called complete.

## Product character
Archivist is a premium personal library. It is editorial, content-led and restrained. The app must not look like a generic React Native project, an admin dashboard, or a stack of rounded boxes. Books, covers, reading and listening are visually dominant; controls recede until needed.

## Colour
The interface is almost monochrome.

### Light
- Canvas: #FFFFFF
- Raised surface: #F7F7F7
- Primary text: #111111
- Secondary text: #6B6B6B
- Divider: #E8E8E8

### Dark
- Canvas: #000000
- Raised surface: #111111
- Higher surface: #181818
- Primary text: #F5F5F5
- Secondary text: #A0A0A0
- Divider: #252525

### Accent
- Archivist Sage: #47736F
- Sage is used for active navigation, progress, selected controls, links and primary actions.
- Gold #B99A68 is exceptional only: achievements or rare milestone detail.
- Do not colour-code formats, genres, sources, Atlas relationships or Insights categories. Artwork supplies colour.

## Typography
Two roles:
- Editorial serif: brand, screen titles, feature titles, Reader body, quotations. Current native implementation uses the platform serif until a licensed bundled family is introduced.
- Interface sans: controls, labels, metadata, navigation, filters, statistics. Use the platform sans.

Scale:
- Hero 42/46, serif, medium
- Screen title 36/41, serif, medium
- Feature 28/33, serif, medium
- Section 20/25, serif, medium
- Body 16/24, sans regular
- Card title 15/20, sans semibold
- Metadata 12-13/17-19, sans regular
- Eyebrow 11/14, sans bold, tracked
- Button 15/20, sans semibold
Do not use heavy bold everywhere.

## Spacing
4dp base grid. Use 4/8/12/16/20/24/32/40/48/64.
Phone outer gutter 16-20. Fold/tablet 24-32. Major sections 32-48 apart.
Never solve density by shrinking controls below comfortable sizes.

## Shape
Radii communicate hierarchy: 6 micro, 10 control, 14 content, 18 feature, 24 sheet/hero.
Capsules are only for filters/status/compact segmented choices.
Do not make every section a card. Prefer whitespace and hierarchy to borders.

## Icons
One line-icon language: 24dp grid, rounded joins/caps, ~1.75dp stroke. Standard rendered sizes 16/20/24/28/32.
Touch target minimum 44x44. No emoji and no Unicode substitutes as interface controls.
Selected states may fill only where state meaning benefits (favourite/bookmark/nav).

## Buttons
- Primary: Sage fill, white text, 48 high, 12 radius.
- Secondary: neutral tonal surface or Sage text.
- Tertiary: text/icon only; this is the default secondary action.
- Destructive: red semantic colour only at destructive confirmation.
Pressed feedback: scale ~0.98 and opacity 0.88 over 90-120ms. Disabled opacity ~0.38.

## Motion
Motion is purposeful:
- tap 90-120ms
- selection 160ms
- small reveal 180ms
- sheet 260ms
- screen transition 280ms
- hero transition 360ms
- Atlas focus 420ms
- book opening 520ms
- page turn 520-650ms
- comic focus 300-360ms
Use restrained ease-out curves. Reduced Motion removes continuous/decorative motion and uses opacity/short shifts.

## Scroll
Shelf, Library, Atlas-list and Insights retain independent scroll positions. Returning to a tab restores position.
Editorial horizontal rows are free-scrolling with a partial next item visible; do not hard-page snap.
Fold panes may retain independent positions.

## Navigation
Persistent destinations: Shelf, Library, Atlas, Insights. Player/Reader are contextual. Settings is secondary.
Phone uses a quiet bottom bar on white/black with grey inactive and Sage active state.
Wide layouts may use a rail. Do not stretch phone navigation.

## Shelf
Editorial home, not Library with headings.
Continue is the dominant feature when present: large cover/artwork, title/author/chapter/progress and one compact action.
Recently added/favourites/library rows are cover-led and have no outer container.
Collections use cover collages. Series use stacked/spine motifs. Smart Shelves use a distinct shelf/stack motif rather than plain rectangles.
Utility actions live in a discreet trailing area, not a stack of large buttons.

## Library
High-density cover catalogue. Search is immediate and quiet. Filter/sort/view controls are compact.
Phone uses 2 columns normally; Fold/tablet 4-6 depending width.
Book card = cover, title, author; extra metadata appears on demand.
No permanent checkbox grid. Long press enters selection mode.
Wide layout uses a real rail plus richer content area, not a stretched phone grid.

## Living Player
Signature screen. White/black canvas; artwork supplies colour.
The physical Living Book is the hero. On play it opens over ~520ms: front plane rotates, spine/pages reveal, shadow widens, book settles. While playing, decorative page movement occurs only occasionally (roughly every 6-10s), never constant flutter. Pause completes current motion and settles naturally.
Phone: book, identity, timeline, transport, compact tools. Fold: deliberate two-column book/control composition.
Play/Pause 72-82dp; skip 52-60dp. Do not label self-explanatory transport icons visually.

## Reader
Immersive. Chrome disappears when reading. Centre tap toggles toolbars. Page width stays comfortable on wide displays.
Reading surface may use a very subtle paper tone inside the page only; surrounding app remains true white/black.
Page turn must behave like a sheet: lift, bend, shadow, cross spine, reverse face, settle. 420-650ms depending gesture. Reduced Motion uses dissolve.

## Comic Focus
Artwork is immutable. Double tap selects a locally detected bubble/panel, animates original pixels to ~70-85% of viewport, preserves context, and returns exactly. Pinch immediately hands control back to normal zoom. Low-confidence detection falls back to manual zoom. No generated/redrawn comic content.

## Atlas
One continuous universe, never a dashboard.
Canvas is true white/black. Work nodes use real covers; authors use portrait/monogram; genres are atmospheric hubs; series use stack/spine language; collections use cover clusters; notes use paper motifs; tags are small typography.
Edges are neutral low-opacity. Selected relationships may use Sage. No rainbow coding.
Zoom LOD: distant = genre/major people/series; medium = works/collections; near = titles/tags/notes.
Pan has restrained inertia; positions remain stable. Phone inspector = bottom sheet; Fold inspector = persistent right panel. Search travels smoothly to a node over ~420ms.

## Insights
Feels like a personal reading journal, not BI. Strong editorial summary, then listening/reading time, completed works, goals, ratings, genres, annotations and achievements.
Charts use black/white/grey/Sage only, minimal axes and no spreadsheet grid. Achievements are emblematic, not another set of generic statistic cards.

## Sheets, loading, empty and errors
Phone prefers bottom sheets with 24dp top corners and ~40-48% dimming. Fold may use side sheets.
Loading uses real-size skeleton covers/surfaces; no blank spinner pages.
Empty states: small Archivist mark, editorial heading, one short paragraph, one primary action.
Errors stay near the failed action and use plain language; technical detail is secondary.

## Responsive layout and Fold behavior
Archivist must treat device width as a composition decision, not a scaling factor.

Canonical width classes:
- Compact phone: <430dp.
- Phone: 430-599dp.
- Fold / medium: 600-759dp.
- Wide / tablet: 760dp and above.
- Very wide compositions may introduce additional structure from roughly 900dp where content width genuinely supports it.

Rules:
- Open Fold is a first-class layout, not a stretched phone screen.
- Library uses a slim source rail and a four-column catalogue on Fold-class widths when the available content width supports it.
- Player becomes a deliberate two-column composition from Fold-class widths so artwork and transport remain visible without excessive vertical dead space.
- Atlas uses a persistent inspector from Fold-class widths.
- Settings stays single-column on Fold unless a form genuinely benefits from more space; do not create two cramped columns merely because width is available.
- Reader preserves comfortable measure rather than filling the full Fold width.
- Reflow must survive live fold/unfold changes without clipped controls, lost scroll position or hidden primary actions.

### Typography on Android and variable-width devices
- Do not rely on Android's generic `serif` for ordinary interface hierarchy. The generic serif may vary substantially by manufacturer and can produce poor metrics.
- Until a licensed bundled editorial family is introduced, use the platform sans / `sans-serif-medium` for screen titles, feature titles, section titles and dense UI hierarchy.
- Reserve serif treatment for the Archivist wordmark/mark and actual reading content where editorial texture is intentional.
- Dense controls and navigation should generally cap font scaling around 1.15 while preserving accessibility through adequate control height and wrapping elsewhere.
- Fixed-height controls must be tested with long labels and enlarged text. Text must never be vertically clipped.
- Prefer the compact hierarchy around 30/24/18/14/12 rather than many unrelated one-off sizes.

### Real-content stress cases
Visual acceptance must use imperfect real library data, including long audiobook/file-derived titles, missing covers, unknown authors, long series names, mixed source labels, and active playback while browsing.

Fallback artwork must remain quiet and must never become a giant text card. Artwork or the placeholder shape is primary; metadata belongs outside it.

### First-viewport rules
- Player must show identity, progress and primary transport without forcing a normal phone or Fold user to scroll.
- Library should expose the catalogue quickly; filters and source controls must not consume most of the first viewport.
- Shelf alerts are secondary to reading/listening content and should use quiet inline rows rather than admin-style banners.
- Persistent header, mini-player and navigation chrome must be budgeted together; they must not crowd out content.

## Haptics
Restrained only. Light for bookmark/selection/toggle/focus; medium for primary playback or significant success; warning for confirmed destructive action. Never vibrate during ordinary scrolling or every tap.

## Acceptance failure rules
A candidate fails visual review if:
- more than three dominant bordered rectangles appear in the first viewport;
- every section uses the same rounded card;
- covers are less visually important than controls;
- pill rows consume the screen;
- wide layout is a stretched phone screen;
- Atlas reads as cards/dashboard;
- Player reads as a generic media player;
- Reader is permanently surrounded by chrome;
- Unicode/emoji are used as UI icons;
- a feature exists technically but looks unfinished.

## Mandatory screenshot gate
Every candidate must be visually reviewed on: Shelf light/dark/phone/Fold, Library phone/Fold, Player paused/playing/Fold, Reader light/dark/Fold, Comic normal/focused, Atlas phone/Fold, Insights phone/Fold, Settings, empty, loading, offline/server unavailable.
Compilation and CI do not satisfy visual acceptance.


## Human-interface quality baseline

Archivist uses the current Apple Human Interface Guidelines as a craft benchmark for hierarchy, agency, accessibility, motion, privacy and adaptive layout. This is a **quality baseline**, not an instruction to make Android look like iOS. Android behavior, back navigation, system surfaces and platform controls remain Android-native where platform expectations differ.

### Purpose and hierarchy
- Every screen must have one dominant user purpose and one clearly dominant action when an action is required.
- Secondary controls must not visually compete with content or the primary task.
- Prefer progressive disclosure over showing every option at once.
- Content should establish the scan path before controls do.
- If hierarchy can be solved with alignment, typography, whitespace or a divider, do that before introducing a container.

### Agency and recoverability
- People must be able to back out, dismiss, undo or retry whenever the underlying action permits it.
- Destructive actions require a clear semantic warning and must never be the visually dominant default action.
- Long-running work must expose progress and a useful interrupted/retry state.
- A gesture may accelerate a task, but essential actions must also have a discoverable onscreen path.

### Touch, focus and control states
- Ordinary touch targets must be at least 44dp on Archivist's Android UI unless a larger Android platform recommendation applies.
- The visible glyph may be smaller than 44dp, but the hit region must not be.
- Every interactive control needs pressed, selected, disabled and loading treatment where those states exist.
- Icon-only controls require an accessibility label and may not use ambiguous Unicode/emoji substitutes.
- Focus order must remain logical for keyboard, switch and screen-reader navigation.

### Text and accessibility
- Text must survive Android font scaling, long real titles and localisation without vertical clipping.
- Do not solve enlarged text by shrinking the font. Reflow or allow additional lines where the task permits it.
- Dense navigation/compact controls may constrain scaling only where necessary to preserve operability; content text should remain free to scale.
- State may never depend on colour alone.
- Reduced Motion must remove decorative/continuous movement while preserving cause-and-effect feedback.
- Meaningful audio-only feedback needs a visual or textual equivalent.

### Platform familiarity
- Keep Archivist's brand, palette and editorial character consistent across platforms.
- Use familiar Android navigation, back behavior, permissions, sheets and system surfaces on Android.
- Do not transplant Apple-specific visual effects or control chrome onto Android merely because the HIG is used as a quality reference.
- When an Apple-platform version is created, follow Apple component and navigation conventions directly.

### Permissions and privacy
- Ask for protected access only at the moment the related feature is used.
- Explain why access is needed before or alongside the system prompt when the reason is not obvious.
- A denied permission must lead to a usable recovery state rather than a dead end.
- Local, downloaded and self-hosted/server storage behavior must remain explicit and understandable.

### Visual acceptance states
Every major screen must be reviewed with:
- realistic populated content;
- long titles and missing artwork;
- loading;
- empty;
- inline error;
- offline/server unavailable where relevant;
- light and dark appearance;
- compact phone and open Fold;
- enlarged text;
- reduced motion where the screen contains custom animation.

A code/build pass is not visual acceptance.


## Standard page identity

Primary app destinations use one shared page-header pattern. The page title is the screen identity, not the generic Archivist brand name.

- Major page titles use `ArchivistEditorial`, 32/39, weight 500, with the same size across Shelf, Library, Atlas, Reader Stats, Profile, Rewards and Settings.
- Every major title is followed by one short, quiet descriptive line in sans-serif. Examples: Library — “Every book. In its place.”; Atlas — “Characters, stories and ideas — your reading universe.”; Reader Stats — “Your reading journey.”
- Do not put a back-to-Shelf arrow beside primary destination titles. Bottom navigation handles primary navigation.
- A persistent customizable profile avatar sits at the top right of every app page. Immersive Player and Reader chrome also expose the same avatar.
- Tapping the avatar opens the account hub with Profile, Rewards and Settings. Profile owns avatar customization; Rewards owns achievements/milestones; Settings owns app/library/server configuration.
- The avatar is a consistent circular identity control, not a replacement for the page title.
- Generic “Archivist” top chrome must not displace page-specific titles.


## Live Player / Reader hub

The bottom navigation has five primary destinations in this order: Shelf, Library, Now, Atlas, Stats.

- **Now** is the central Player / Reader destination and may be visually stronger than the other tab items without becoming an oversized floating action button.
- The Now screen has no page title. Its top chrome is a compact Player / Reader segmented switch plus the persistent profile avatar.
- Player and Reader are parallel live contexts. Starting or resuming audio opens Now in Player mode; opening an ebook, PDF or comic opens Now in Reader mode.
- Audio playback continues when Reader mode is active. A user may listen to an audiobook while reading a book or comic.
- Leaving Now for another primary destination does not discard either live context. Returning to Now restores the last selected Player / Reader mode when possible.
- The compact activity bar sits above bottom navigation. Active audiobook playback has priority. If no audiobook is active, the bar may represent the current/recent reading session instead.
- Tapping the audiobook activity bar returns to Now / Player. Tapping the reading activity bar returns to Now / Reader.
- The current/recent audio and reading targets are persisted so a cold app start can offer direct resume from the Now screen.
- Reader features such as comic speech-bubble focus, zoom, reading position, reader tools and appearance remain available inside Now / Reader.
- The persistent profile avatar remains visible at the top right of the Now screen and every other navigable page.


### Approved Live Player motion and transport

The canonical Player reference image remains the visual acceptance target for Now / Player.

- The hero is a physical open book, not a generic cover card. The actual metadata cover is the closed/front cover when available.
- Play opens the book smoothly; pause closes it smoothly. While audio is actively playing, page turns occur subtly and periodically.
- Short rewind/forward actions animate three pages. The primary short transport is **15 seconds back** and **30 seconds forward**.
- The outer transport controls move by chapter when chapter data exists; otherwise they fall back to a 60-second jump. Those larger jumps animate five pages.
- The transport row has five controls: previous chapter/fallback, 15s back, large play/pause, 30s forward, next chapter/fallback.
- The Now / Player background uses one continuous subtle teal ambient halo, matching the approved Stats lighting language without introducing a visible seam.
- Player identity remains editorial: large serif title, quiet author/byline, series metadata, chapter/progress and time remaining beneath the book.
- The Now page itself does not add a redundant page title above the Player / Reader switch.
- Reader remains the full Archivist reader. Comics support pinch zoom and robust touch double-tap. Double-tap first attempts local speech-bubble focus; if no bubble is detected it falls back to focused image zoom.
- These behaviors are functional requirements, not decorative mock states, and must remain covered by mobile tests.


## Global halo and header alignment

Reader Stats defines the global ambient-light standard for the entire app.

- Every navigable page uses the same teal halo hue, saturation, brightness, scale and vertical position as Reader Stats: dark canvas `#07151C`, dark halo `#2F8B86` at the approved Stats strength; corresponding light values `#F5F8F7` and `#9BCFCB`.
- Do not create page-specific halo brightness, hue, radius or vertical offsets. Player, Reader, Shelf, Library, Atlas, Stats, Profile, Rewards and Settings all inherit the same root halo.
- Primary page content starts on the same grid: 18dp phone gutter, 24dp fold gutter, 28dp wide gutter; primary title area starts at the same top offset as Reader Stats.
- Major page titles use the shared `PageHeader` component and therefore share the same 32/39 ArchivistEditorial title, subtitle spacing and baseline.
- The profile avatar is a single persistent global control fixed at the top-right. It must be visually alone in that corner.
- No period selector, overflow menu, view toggle, Arrange action, back button or other page action may sit beside the avatar.
- Page-specific controls belong in a secondary toolbar below the title/subtitle or in the content area. Reader Stats “All time”, Atlas view/list toggle and Shelf Arrange follow this rule.
- Now remains titleless by design. Its Player / Reader segmented control sits below the reserved avatar corner; the avatar remains the same global top-right control.
