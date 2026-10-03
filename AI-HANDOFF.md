# Archivist AI Handoff

**Purpose:** Durable context for any future ChatGPT / AI development session working on Archivist.

Before making app, UI, architecture, branding, release, or workflow changes, read these files in this order:

1. `PROJECT-CONSTANTS.md`
2. `DESIGN-STANDARD.md`
3. `DESIGN-REFRESH.md`
4. `TESTING-READINESS.md`
5. `MOBILE-TESTING.md`

## Non-negotiable working context

- Draftbit is the primary interactive development/review environment for the mobile app.
- GitHub repository: `russellstokes-ai/Archivist`
- Active app-development branch: `design/hig-refresh`
- App folder: `mobile`
- GitHub is the committed source of truth.
- Keep development in small, reviewable commits.
- After each reviewable UI stage, tell Russell to use **Sync → Preview** in Draftbit.
- Do not move development to `main` or merge/release without explicit approval.

## Design memory

Do not reinvent Archivist's visual language.

Always preserve:
- the canonical Archivist logo and app icon;
- the monochrome white/black base;
- Archivist Sage `#47736F`;
- Archivist Gold `#B99A68` only for achievements/rare milestones;
- bundled ArchivistEditorial / Libre Caslon Text for editorial roles;
- restrained, content-led, premium editorial composition;
- minimal cards and strong hierarchy;
- Android-native behavior on Android;
- Fold/open-width layouts as first-class compositions.

Use the App Work / HIG-informed design baseline in `DESIGN-STANDARD.md`, but do not make Android look like iOS.

## Product memory

Archivist is:
- privacy-first;
- local-first;
- fully useful without a server;
- optional self-hosted/server-connected;
- Android-first;
- designed for phone and Fold;
- a polished commercial-quality product, not a prototype.

Headline experiences that must remain central:
- Shelf and high-density Library;
- Living Audiobook Player with realistic book-opening/page motion;
- immersive Reader with realistic page turning;
- Comic Focus double-tap speech-bubble/panel zoom using original pixels;
- Atlas connected visual universe;
- Insights, rewards, ratings, streaks and achievements;
- safe organisation with preview/apply/recovery;
- optional family server with simple Admin/User roles;
- Android Auto support built on the native media foundation.

## Quality memory

Never mark a feature complete solely because code exists or CI is green.

Completion requires the relevant combination of:
- implementation;
- tests/typecheck;
- native compile when native code changes;
- rendered visual review;
- compact phone review;
- open-Fold review;
- light/dark review;
- long-title/missing-artwork stress;
- loading/empty/error/offline states;
- reduced-motion review;
- explicit statement of any physical-device checks still outstanding.

## Visual references

Use the retained Archivist design images in the user's Library and repository branding assets as visual source material. Do not substitute unrelated generic UI inspiration when approved Archivist references exist.

If conversation context is incomplete, recover project context from these repository files before asking Russell to repeat decisions already documented here.
