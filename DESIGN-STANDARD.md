# Archivist Design Standard

**Status:** Canonical. UI changes must conform to this file before they can be called complete.


## Canonical visual references — 2026-10-03
The four approved visual references for **Library**, **Living Player**, **Atlas** and **Reader Stats / Insights** are the primary composition and finish targets. If older wording elsewhere in this document conflicts with those references, this section takes precedence.

The references define a premium editorial visual language: near-black or dark navy canvas in dark mode, clean white/ivory canvas in light mode, high-contrast editorial serif headings, restrained fine-line controls, subtle depth/glow, generous spacing, and highly intentional chart/graph composition. Do not translate them into generic React Native cards or flatten them into utilitarian lists.

- **Library:** large editorial “Library” heading, short bookish tagline, quiet search, compact format filters, cover-led catalogue, and a refined continue/mini-player element above navigation. Sparse composition is intentional.
- **Living Player:** the open physical book is the hero and should occupy materially more visual space than ordinary controls. Use a warm near-black/sepia ambience in dark mode, large serif identity, understated metadata, clear progress, oversized central play/pause, and compact secondary actions.
- **Atlas:** immersive circular universe first, controls second. A segmented outer ring may represent dimensions such as Genre, Format and Year; the central graph uses fine luminous relationships and semantic cluster colour. The selected dimension is explained in an overlapping bottom sheet / inspector rather than a detached dashboard card.
- **Reader Stats / Insights:** a crafted reading-journal dashboard. Allow compact metric cards, radial charts, heatmaps, progress rings, streaks and balanced two-column compositions where width permits. Warm ivory/gold is a permitted emphasis colour here. The screen should feel personal and editorial, not like business intelligence software.

### Reference precedence rules
- The product may remain **Insights** in navigation while using **Reader Stats** language inside the destination; do not create duplicate Stats and Insights destinations merely to mirror reference labels.
- Semantic colour is deliberately limited. General navigation, Library and Player stay near-monochrome with Sage as the main interaction accent. Atlas may use a controlled multi-colour categorical palette; Insights may use restrained gold/ivory/Sage data accents.
- ArchivistEditorial (currently bundled Libre Caslon Text) is the preferred family for major screen headings, feature titles, selected card headings, the wordmark and reading content. Dense UI labels, controls and metadata remain sans-serif.
- Exact pixel copying is not required. Match hierarchy, proportion, density, polish, motion and visual intent while preserving Archivist functionality and accessibility.

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
- Do not colour-code formats or sources in ordinary Library/Player UI. Artwork supplies colour there. Atlas may use a controlled semantic categorical palette for graph clusters and dimension rings; Insights may use restrained Sage, warm ivory and gold to communicate reading data.

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
Charts use a restrained black/white/grey/Sage base with warm ivory/gold permitted for emphasis, minimal axes and no spreadsheet grid. The approved Stats reference supports compact metric cards, radial charts, heatmaps and two-column chart groupings when they are visually differentiated and purposeful. Achievements are emblematic, not another set of generic statistic cards.

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
- Use the bundled `ArchivistEditorial` family for major screen titles, feature titles, selected section/card titles, the Archivist wordmark and reading content. Use the platform sans / `sans-serif-medium` for dense UI hierarchy, controls, metadata and navigation.
- Serif is a deliberate part of Archivist's editorial identity; use it selectively but visibly, matching the approved visual references.
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
