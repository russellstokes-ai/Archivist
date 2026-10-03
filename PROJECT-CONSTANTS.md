# Archivist Project Constants

**Status:** Durable project source of truth for app development. Read this before changing Archivist UI, architecture, branding, or release scope.

## Development environment

- Primary interactive development/review environment: **Draftbit**.
- GitHub repository: `russellstokes-ai/Archivist`.
- Active app-development branch: `design/hig-refresh`.
- App folder: `mobile`.
- GitHub remains the committed source of truth.
- Work in small, reviewable commits.
- After each visual stage, review with **Draftbit → Sync → Preview**.
- Preserve the existing React Native / Expo architecture and native integrations.
- Do not move app-development work to `main` until the approved merge/release step.

## Product identity

Archivist is a premium, private, local-first personal library for ebooks, audiobooks, comics and PDFs.

Core product character:
- editorial rather than dashboard-like;
- content-led rather than control-led;
- restrained rather than colourful;
- polished enough to feel like a commercial finished product;
- privacy-first and useful without a server;
- optional self-hosted server for household sharing, storage and streaming.

Do not use beta/experimental/unfinished product language in normal UI.

## Canonical branding

### Logo and icons

- Primary repository/README logo: `web/assets/archivist-primary-logo.png`.
- Mobile app icon: `mobile/assets/icon.png`.
- Expo and Android adaptive icon use that mobile icon.
- Current Android adaptive-icon background: `#072632`.
- Do not replace, redraw or substitute the canonical logo/icon without explicit approval.
- Do not introduce a competing logo treatment in app or server UI.

### Colour palette

Light:
- Canvas `#FFFFFF`
- Raised surface `#F7F7F7`
- Primary text `#111111`
- Secondary text `#6B6B6B`
- Divider `#E8E8E8`

Dark:
- Canvas `#000000`
- Raised surface `#111111`
- Higher surface `#181818`
- Primary text `#F5F5F5`
- Secondary text `#A0A0A0`
- Divider `#252525`

Accents:
- Archivist Sage `#47736F` — primary actions, selected states, progress and links.
- Archivist Gold `#B99A68` — achievements and rare milestone detail only.
- Artwork supplies most other colour.
- Do not colour-code formats, genres, sources or Atlas relationships.

### Typography

- Canonical bundled editorial face: **ArchivistEditorial / Libre Caslon Text**.
- Interface UI: platform sans / Android sans.
- Use editorial typography for brand, major titles and reading texture; use sans for controls, metadata and dense UI.
- Avoid heavy bold everywhere.

## Design-quality baseline

The reusable **App Work** design skill and the repository's `DESIGN-STANDARD.md` are the design baseline.

Use Apple Human Interface Guidelines as a craft benchmark for:
- purpose and hierarchy;
- agency and recoverability;
- accessibility;
- adaptable layout;
- purposeful motion;
- privacy and permission timing;
- familiar interaction;
- restrained delight.

Archivist is Android-first today, so do **not** turn it into an iOS clone. Android navigation, back behavior, permissions and platform expectations remain authoritative.

Permanent visual rules:
- no card soup;
- no arbitrary extra colours;
- no emoji/Unicode as production UI icons;
- one clear screen purpose;
- minimum comfortable touch targets;
- important gestures need an onscreen alternative;
- light and dark modes must both work;
- reduced motion must be respected;
- realistic content must be used for acceptance;
- compilation is not visual acceptance.

## Device targets

Android-first.

Primary physical acceptance target:
- Samsung Galaxy Fold closed mode;
- Samsung Galaxy Fold open mode.

Open Fold is a first-class layout, not a stretched phone layout.

Also support:
- ordinary Android phones;
- wider/tablet compositions where shared React Native code naturally supports them.

## Core development goals

### Local-first app

The app must work without any server:
- browse and organise local books, audiobooks and comics;
- read ebooks/PDFs/comics;
- play audiobooks;
- preserve progress and personal state;
- handle local folders and multiple folders;
- work offline.

A server is optional and can be added later from Settings.

### Optional server

The server should:
- support Home Assistant and general self-hosting/Docker;
- allow multiple folders;
- provide simple Admin/User household roles;
- support remote storage and streaming;
- make setup understandable without requiring a key before entering the UI;
- allow key generation from the UI;
- provide folder browsing rather than requiring manual path typing;
- avoid unnecessary HDD wake-ups;
- remain suitable for Raspberry Pi 4-class hardware.

### Shelf and Library

- Shelf is an editorial home, not another catalogue grid.
- Continue Reading/Listening is the dominant contextual feature.
- Library is cover-led, searchable and high-density.
- Sorting, filtering, selection and metadata work must remain safe and understandable.
- Multiple local/server/downloaded sources should coexist without duplicate-looking copies.

### Living Audiobook Player

This is a signature feature:
- realistic book-opening behavior;
- page movement tied to playback state, not constant decoration;
- strong first viewport;
- background playback;
- chapters;
- bookmarks;
- speed;
- sleep timer;
- lock-screen/media controls;
- Android Auto support built on the current native foundation.

### Reader

- immersive reading;
- realistic page-turn motion;
- reduced-motion fallback;
- ebooks, PDFs and comics;
- saved position, bookmarks, highlights and notes.

### Comic Focus

Headline feature:
- double-tap speech-bubble/panel focus;
- use original comic pixels only;
- no generative redraw;
- preserve context and return accurately;
- fall back gracefully to manual zoom.

### Atlas

Headline feature:
- Obsidian-like connected visual universe;
- works, authors, series, collections, genres, notes and tags;
- stable spatial relationships;
- responsive inspector behavior;
- no dashboard/card presentation;
- genre layer included.

### Insights, rewards and profile

- reading/listening history;
- meaningful charts;
- goals;
- ratings;
- achievements/rewards;
- streaks and personal progress;
- editorial/journal feeling rather than BI-dashboard styling.

### Organisation and integrity

- preview before apply;
- safe rename/copy/sort workflows;
- duplicate detection;
- interrupted-operation recovery;
- cross-drive support;
- no silent destructive moves;
- protect user media first.

## Release and quality goals

Do not mark a feature complete merely because code exists.

Before calling a screen or feature finished:
- typecheck/tests appropriate to the change pass;
- native compilation passes when native code changed;
- real rendered output is reviewed;
- phone and open-Fold layouts are checked;
- long titles and missing artwork are checked;
- loading, empty, error and offline states are checked where relevant;
- light/dark mode is checked;
- reduced-motion behavior is checked for custom animation;
- remaining physical-device verification is stated explicitly.

Production goal:
- polished Android app suitable for eventual Google Play release;
- professional README and release presentation;
- no knowingly incomplete visual surfaces;
- no claiming untested features as complete.

## Related source-of-truth files

- `DESIGN-STANDARD.md` — canonical visual and interaction standard.
- `DESIGN-REFRESH.md` — current screen-by-screen HIG-informed design refresh and Draftbit workflow.
- `TESTING-READINESS.md` — engineering and physical acceptance evidence.
- `MOBILE-TESTING.md` — device acceptance procedure.
