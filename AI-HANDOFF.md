# Archivist AI Handoff

**Purpose:** Durable context for any future ChatGPT / AI development session working on Archivist.

## Read first

Before changing mobile UI, architecture, release scope, integration state or product wording, read these files in order:

1. `FIRST-COMPLETE-TEST-BUILD-HANDOFF.md`
2. `CURRENT-UI-HANDOFF.md`
3. `mobile/ATLAS-HANDOFF.md`
4. `mobile/LIVE-PLAYER-HANDOFF.md`
5. `COMIC-SPEECH-FOCUS.md`
6. `PROJECT-CONSTANTS.md`
7. `DESIGN-STANDARD.md`
8. `mobile/FOLD-REFERENCE-LOCK.md`
9. `TESTING-READINESS.md`
10. `MOBILE-TESTING.md`

If older files conflict with `CURRENT-UI-HANDOFF.md`, the current UI handoff wins.

## Current development context

- Repository: `russellstokes-ai/Archivist`
- GitHub is the committed source of truth.
- Active universal-mobile / Draftbit branch: `design/draftbit-universal-phone`
- App folder: `mobile`
- Recovery snapshots: `recovery/chat-universal-mobile-20261004`, `recovery/server-polish-20261004`, and `recovery/locked-ui-reference-20261004`.
- Pre-migration universal-phone branch: `design/universal-phone`
- Locked Fold/open visual reference: `design/hig-refresh`
- Do not use `main` as the active UI workspace.
- Work in small, reviewable checkpoints.
- Do not merge/release without explicit approval.

The current Draftbit project was **imported and migrated**, so it is a copy rather than a live GitHub mirror. GitHub commits do not automatically appear in the imported Draftbit workspace, and sandbox-only changes are not permanent until exported/synced back to GitHub.

## Product platform

Archivist is a universal **iOS + Android** app with adaptive phone/Fold/tablet layouts.

Do not describe Archivist as Android-first.

Canonical width classes and phone/Fold ownership are documented in `CURRENT-UI-HANDOFF.md`.

## Locked work boundaries

- **Fold/open UI:** locked on `design/hig-refresh`; no 600dp+ redesign without Russell's explicit approval.
- **Live Player / Now:** considered complete/locked for the current polish phase. Touch only for proven regressions or explicit new approval.
- **Comic Focus:** complete/locked for the current finishing phase; touch only for proven regressions or explicit new approval.
- **Atlas:** the only area still owned by the separate Astra/Work stream. Do not independently redesign or implement Atlas in the normal chat stream.
- **Remaining product polish:** handled piecemeal in chat in small sprints because of usage limits.

## Design memory

Do not reinvent Archivist's visual language.

Always preserve:
- canonical Archivist logo/app icon;
- black/charcoal/deep-navy dark presentation;
- warm ivory/cream/white light presentation;
- Archivist Sage `#47736F`;
- Archivist Gold `#B99A68` only for milestones/rare emphasis;
- bundled ArchivistEditorial / Libre Caslon Text for editorial roles;
- clean sans-serif controls/metadata;
- restrained, content-led premium composition;
- minimal card use and strong hierarchy;
- adaptive platform-appropriate behaviour on both iOS and Android;
- Fold/open layouts as first-class compositions.

The exact screen-by-screen approved state, including the latest mobile visual review, is recorded in `CURRENT-UI-HANDOFF.md`.

## Product memory

Archivist is:
- privacy-first;
- local-first;
- fully useful without a server;
- optionally self-hosted/server-connected;
- universal across iOS and Android;
- designed for ordinary phones, Fold closed/open and wider layouts;
- a polished commercial-quality product, not a prototype.

Headline experiences include:
- Shelf and high-density Library;
- Living Player / Now;
- immersive Reader;
- Comic Focus double-tap speech-bubble/panel zoom;
- Atlas connected visual universe;
- Reader Stats, Profile, Rewards, ratings, streaks and achievements;
- safe organisation with preview/apply/recovery;
- optional family server with simple Admin/User roles.

## Quality memory

Never mark a feature complete solely because code exists or CI is green.

Completion requires the relevant combination of:
- implementation;
- tests/typecheck;
- native compile when native code changes;
- rendered visual review;
- compact-phone review;
- Fold/open review;
- light/dark review;
- long-title/missing-artwork stress;
- loading/empty/error/offline states;
- reduced-motion review;
- explicit statement of physical-device checks still outstanding.

If conversation context is incomplete, recover the project from the repository documents above before asking Russell to repeat decisions already documented there.
