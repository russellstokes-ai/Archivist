# Draftbit migration brief — Archivist universal phone

Source branch: `design/draftbit-universal-phone`
App folder: `mobile`

## Goal

Migrate Archivist into Draftbit's current full-builder conventions while preserving the approved product design and behaviour.

Draftbit migration target:
- Expo Router / file-based screens
- strict TypeScript
- `app.config.js`
- working web preview
- NativeWind-compatible styling where conversion is mechanical and visually lossless
- retain existing Expo/native packages and functionality

## Non-negotiable design constraints

The approved Fold/open reference comes from `design/hig-refresh`.

Do not redesign Archivist during migration. Preserve:
- black / warm-ivory core themes
- restrained teal and champagne/gold accents
- ArchivistEditorial typography
- canonical Archivist logo and splash
- current icon language
- current content hierarchy and wording
- animations and Reduced Motion behaviour
- accessibility semantics
- existing Fold/open composition at 600dp and above

The universal-phone work on this branch intentionally adapts composition below 600dp only.

## Responsive targets

- 320–359dp narrow phone
- 360–429dp standard phone
- 430–599dp large phone / Fold closed
- 600–759dp Fold open reference
- 760dp+ wide reference

## Existing UI lock

`mobile/locked-fold-ui.styles.snapshot.txt` is the canonical Fold/reference StyleSheet snapshot.

`mobile/ui-contract.test.cjs` contains Fold-style guards and universal-phone responsive guards. Keep those protections meaningful through the migration. If StyleSheet entries are mechanically converted to NativeWind, replace the snapshot assertion with equivalent visual-token/layout assertions rather than simply deleting the guard.

## Screen model

Archivist currently owns navigation internally in `App.tsx`. During Expo Router migration, expose the major product surfaces as Draftbit-readable routes/screens without changing their visible behaviour:

1. Shelf
2. Library
3. Now / Player / Reader
4. Atlas
5. Reader Stats
6. Profile
7. Rewards
8. Settings

Keep Work Details, metadata/cover editing, Library management, filters, format/edition chooser and other transient experiences as modals/sheets unless a route is technically required.

## Functionality that must survive migration

- local and server libraries
- folder/source management
- advanced scanning and metadata repair
- grouping by logical work / series / format
- safe organisation preview/apply and recovery
- cover management with native system picker
- audiobook playback and persistence
- ebook/PDF/comic reading
- comic speech-focus support
- Atlas relationships
- stats / achievements / ratings / favourites
- offline downloads
- optional Archivist Server connection
- iOS and Android support
- Fold open/closed support
- splash handoff
- Android Auto groundwork

## Migration rule

Prefer small mechanical changes that preserve runtime behaviour. Do not simplify or replace custom Archivist components merely to make them easier for the visual editor to parse.

After migration, run:
- dependency install
- Expo Doctor
- TypeScript
- all mobile tests
- web preview
- native Android/iOS preview where available

Do not mark a visual surface accepted until it has been reviewed in Draftbit Preview.
