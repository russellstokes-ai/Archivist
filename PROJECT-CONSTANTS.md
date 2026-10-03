# Archivist Project Constants

**Status:** Durable project source of truth. Read `CURRENT-UI-HANDOFF.md` first for the current approved UI state and active work boundaries.

## Development environment

- Repository: `russellstokes-ai/Archivist`
- GitHub is the committed source of truth.
- Active universal-mobile / Draftbit branch: `design/draftbit-universal-phone`
- Pre-migration universal responsive branch: `design/universal-phone`
- Locked Fold/open reference: `design/hig-refresh`
- App folder: `mobile`
- Work in small, reviewable commits.
- Do not move active UI development to `main` until the approved merge/release step.
- Draftbit is used for interactive review, but an imported Draftbit project is a copy, not a live mirror. Sandbox-only work must be exported/synced to GitHub before the sandbox is deleted.

## Product identity

Archivist is a premium, private, local-first personal library for ebooks, audiobooks, comics and PDFs.

Core character:
- editorial rather than dashboard-like;
- content-led rather than control-led;
- restrained rather than colourful;
- polished enough to feel like a commercial finished product;
- privacy-first and useful without a server;
- optional self-hosted server for household sharing, storage and streaming.

Do not use beta/experimental/unfinished language in normal UI.

## Product platform

Archivist is a universal **iOS + Android** mobile product.

It must support:
- narrow phones;
- ordinary phones;
- large phones / Fold closed;
- Fold open;
- wider/tablet layouts.

Open Fold is a first-class composition, not a stretched phone.

Do not describe the project as Android-first.

Responsive breakpoints and current approval boundaries are defined in `CURRENT-UI-HANDOFF.md`.

## Canonical branding

### Logo and icons
- Primary repository/README logo: `web/assets/archivist-primary-logo.png`
- Mobile app icon: `mobile/assets/icon.png`
- Do not replace/redraw/substitute the canonical Archivist logo without explicit approval.
- Do not introduce generic letter-A branding.

### Colour
Light:
- canvas `#FFFFFF`
- raised `#F7F7F7`
- primary text `#111111`
- secondary text `#6B6B6B`
- divider `#E8E8E8`

Dark:
- canvas `#000000` / approved deep-navy atmosphere where used
- raised `#111111`
- higher surface `#181818`
- primary text `#F5F5F5`
- secondary text `#A0A0A0`
- divider `#252525`

Accents:
- Archivist Sage `#47736F`
- Archivist Gold `#B99A68` for milestones/rare emphasis
- artwork supplies most other colour

### Typography
- editorial face: ArchivistEditorial / Libre Caslon Text
- interface: clean platform sans
- editorial typography for brand/major titles/reading texture
- sans for controls, metadata and dense UI

## Permanent design rules

- no card soup;
- no arbitrary extra colours;
- no emoji/Unicode as production UI icons;
- one clear screen purpose;
- minimum comfortable touch targets;
- gestures need discoverable fallbacks where appropriate;
- light and dark modes must both work;
- Reduced Motion must be respected;
- realistic content must be used for acceptance;
- compilation is not visual acceptance;
- phone adaptation must not silently alter the locked Fold/open design.

The detailed screen-by-screen approved UI is in `CURRENT-UI-HANDOFF.md`.

## Local-first app

The app must remain fully useful without a server:
- browse and organise local books/audiobooks/comics/PDFs;
- read and listen;
- preserve progress/personal state;
- handle multiple folders;
- work offline.

A server is optional and may be added later from Settings.

## Optional server

The server should:
- support Home Assistant and general Docker/self-hosting;
- allow multiple folders;
- provide simple Admin/User household roles;
- support remote storage/streaming;
- allow understandable setup and folder browsing;
- avoid unnecessary HDD wake-ups;
- remain suitable for Raspberry Pi 4-class hardware.

## Core product goals

### Shelf / Library
- Shelf = editorial/personal home.
- Library = dense searchable catalogue/location/organisation view.
- Multiple local/server/downloaded sources coexist without duplicate-looking copies.
- Scanning, sorting, metadata and repair must be powerful but understandable.
- Preview/apply/recovery protect user media.

### Live Player / Now
Signature Living Book Player. Current phase is locked as complete unless a regression or explicit new request reopens it.

### Reader
- immersive reading;
- ebooks, PDFs and comics;
- saved position, bookmarks, highlights, notes;
- realistic motion with Reduced Motion fallback.

### Comic Focus
Headline feature complete/locked for the current finishing phase. Release QA may verify it, but do not redesign or continue feature work unless Russell explicitly reopens it:
- deterministic local focus;
- original pixels only;
- no generative redraw;
- double-tap focus with graceful fallback.

### Atlas
Headline feature and the **only** area still owned by the separate Astra/Work stream while active:
- connected visual universe;
- works/authors/series/collections/genres/notes/tags;
- stable spatial relationships;
- polished adaptive inspector.

### Stats / profile / rewards
- meaningful reading/listening history;
- goals, ratings, achievements, streaks;
- premium editorial/journal feeling;
- not generic BI/game dashboards.

## Release-quality rule

Do not mark features complete merely because code exists.

Before calling a screen/feature finished, use the relevant combination of:
- typecheck/tests;
- native compile when needed;
- rendered output review;
- phone and Fold checks;
- long titles/missing artwork;
- loading/empty/error/offline states;
- light/dark;
- Reduced Motion;
- explicit physical-device verification status.

## Related source-of-truth files

- `CURRENT-UI-HANDOFF.md` — current branch ownership, visual approval and screen-by-screen UI state
- `DESIGN-STANDARD.md` — canonical visual/interaction standard
- `mobile/FOLD-REFERENCE-LOCK.md` — locked Fold/open reference
- `TESTING-READINESS.md` — engineering/testing evidence
- `MOBILE-TESTING.md` — device acceptance procedure
- `AI-HANDOFF.md` — future AI/session recovery instructions
