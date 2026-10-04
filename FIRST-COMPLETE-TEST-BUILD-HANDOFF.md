# Archivist — first complete test build handoff

**Purpose:** assemble one first complete test candidate containing all approved mobile UI work, the locked Live Player, Comic Focus, Astra's final Atlas, recent chat polishing, Android Auto/native work and the latest server/Home Assistant polish.

**Date consolidated:** 2026-10-04

This file is the canonical integration handoff. Do not reconstruct the build from chat history.

## Repository

`https://github.com/russellstokes-ai/Archivist`

## Critical fact: no single current branch contains everything

The two main finishing lines have diverged from the earlier locked Fold checkpoint.

### A. Universal-mobile / chat line

Active branch:
`design/draftbit-universal-phone`

Recovery snapshot:
`recovery/chat-universal-mobile-20261004`

Snapshot source:
`ca64fb5bd694ad483a88298684e891265f6adcf9`

This line contains the later mobile work and must be the **mobile integration base**.

It includes:
- Expo 55 / Draftbit universal mobile migration;
- approved phone + Fold responsive UI;
- all recent Shelf/Library/Settings/onboarding/profile/offline/source-management polish;
- local progress persistence;
- iOS local-library import + Android SAF paths;
- native file backup/restore;
- family-account recovery/revoke work on this line;
- Live Player/Now implementation and locked handoff;
- Comic Focus deterministic bubble mask/zoom work through the 4 October checkpoint;
- iOS CBR work;
- Android Auto MediaLibraryService work;
- mobile/native CI and build gates;
- current UI/readiness documentation.

### B. Later server/final-polish line

Active branch:
`polish/final-release-sweep-20261004`

Recovery snapshot:
`recovery/server-polish-20261004`

Snapshot source:
`e0eacc566502076a088d7b38a06cce52d54b2fef`

This line contains the later **server 0.9.4** work:
- advanced server metadata parsing/population;
- metadata conflict handling;
- organisation workflow refinement;
- server/mobile metadata-parity tests;
- Home Assistant packaged-copy parity;
- 16:9/QHD server UI refinement;
- large-screen browser acceptance;
- final server polish/readiness documentation.

This branch is **not** the mobile integration base. Do not replace the current universal `mobile/App.tsx` wholesale with the older divergent mobile file from this branch.

### C. Locked Fold/open UI reference

Source:
`design/hig-refresh`

Recovery snapshot:
`recovery/locked-ui-reference-20261004`

Canonical implementation checkpoint:
`e57c5f1b19771ae6036245b8a59fe8a8ec55c28f`

The 600dp+ Fold/open visual reference remains locked.

## Signature feature handoffs

### Live Player / Now

Durable source:
`mobile/LIVE-PLAYER-HANDOFF.md`

Locked implementation checkpoint:
`43a1e40a079cc36841d09f470f95a120727a49ad`

Treat the Player as complete for this integration phase. Preserve the Living Book design, persisted seek/progress behaviour, transport/motion language and responsive composition. Only fix proven regressions.

### Comic Focus / double-tap speech-bubble zoom

Durable source:
`COMIC-SPEECH-FOCUS.md`

Key later checkpoint:
`bc9fa401e203` — Improve deterministic comic bubble masks and zoom motion; document checkpoints.

Subsequent lock/documentation commits on the mobile line:
- `2bd0ceffe461`
- `7ec563ab4db8`
- `56631d81b5ec`
- `d4ef4423f5d5`

Treat Comic Focus as locked for integration unless a regression is found. It is deterministic/local/no-AI and preserves original pixels/text.

### Atlas

Durable source:
`mobile/ATLAS-HANDOFF.md`

Astra owns the final finishing pass.

**Do not produce the first complete test candidate until Astra's final Atlas commit/ref has been recorded in that handoff or here.**

## Canonical UI log

Read `CURRENT-UI-HANDOFF.md` before resolving any mobile merge conflict.

The visual source of truth also includes:
- `DESIGN-STANDARD.md`
- `mobile/UI-QA-LOCK.md`
- `mobile/FOLD-REFERENCE-LOCK.md`
- `mobile/locked-fold-ui.styles.snapshot.txt`

Approved mobile preview result before final feature integration:
- universal-mobile preview looked good;
- phone metric-cell centring approved;
- Settings stacked-column overlap fixed and approved;
- Fold/open reference remains locked.

Do not resolve conflicts by reverting to generic boxes/cards, Android-first layouts or old Draftbit/main files.

## Integration order for Astra / final build owner

1. **Start from `design/draftbit-universal-phone`.**
2. Confirm the three recovery branches exist and do not modify them.
3. Finish/commit Astra Atlas work and record the final Atlas SHA in `mobile/ATLAS-HANDOFF.md`.
4. Bring Astra's final Atlas changes into the universal-mobile integration base.
5. Bring the **server-specific** 0.9.4 changes from `polish/final-release-sweep-20261004` into the integration candidate.
6. Resolve overlaps manually using `CURRENT-UI-HANDOFF.md`; do **not** wholesale replace the newer universal `mobile/App.tsx` with the divergent server-polish copy.
7. Preserve `mobile/LIVE-PLAYER-HANDOFF.md` behaviour.
8. Preserve `COMIC-SPEECH-FOCUS.md` behaviour.
9. Ensure root server files and `archivist/app/**` packaged server copies remain synchronized where the project requires mirrored files.
10. Unify app/server candidate version numbers before producing artifacts.
11. Run the full gates below.
12. Only then build the first complete APK/test candidate and prepare the Home Assistant server promotion.

## Required engineering gates before first complete test candidate

At minimum:

- Expo Doctor;
- TypeScript;
- all maintained mobile suites;
- UI contract tests;
- speech-focus detector/controller tests and generated-copy parity;
- Android native compile;
- Android Auto native contract/tests;
- iOS prebuild + CocoaPods + unsigned Simulator compile;
- server Go tests;
- server packaging/parity checks;
- browser/server UI checks including 16:9 and QHD;
- Home Assistant package validation;
- version consistency;
- web export;
- `git diff --check` / equivalent hygiene.

Automated green is not physical acceptance.

## First-device acceptance

The first complete test app should then be exercised for:
- ordinary phone;
- Fold closed;
- Fold open;
- light/dark;
- real local folders/imports;
- server connection and outage fallback;
- audiobook resume after app close/relaunch and device reboot;
- background/system playback;
- Reader formats;
- Comic Focus on real comics;
- Atlas on a realistically sized library;
- native backup/restore;
- family user key issue/reissue/revoke;
- offline download/resume/removal;
- Android Auto host/device where available.

## Home Assistant server status

### What is downloadable now

Repository `main` currently advertises:
`archivist/config.yaml version: 0.9.3`

That is the presently main-branch Home Assistant add-on.

### What is newer but not yet main

`polish/final-release-sweep-20261004` contains server version:
`0.9.4`

The 0.9.4 line includes the later metadata/organisation and 16:9 UI work, but it is not yet the default main-branch add-on.

Therefore, **do not assume the server currently installed/downloadable from main contains all final-polish or latest Atlas-related integration changes.**

The final combined candidate should validate the server first, then promote the intended server package to `main` when Russell explicitly approves making it the downloadable Home Assistant update.

## Atlas/server relationship note

The server already has Atlas relationship infrastructure from earlier work. Later Astra Atlas UI polishing may be client-only, but if Astra changes relationship payloads/routes, those server changes must be included in the final server package as part of this integration.

Do not assume a mobile Atlas commit automatically updates the Home Assistant add-on.

## Recovery

If integration loses work:

- recent universal-mobile/chat work → `recovery/chat-universal-mobile-20261004`
- later server/final-polish work → `recovery/server-polish-20261004`
- locked Fold/open UI → `recovery/locked-ui-reference-20261004`

These recovery branches are snapshots, not active development branches.

## Completion rule

The first complete test candidate is not “all done” merely because it builds.

It is ready for Russell's first full test only when:
- all three signature areas are present: Player, Atlas, Comic Focus;
- approved UI remains intact;
- recent chat polish is retained;
- server 0.9.4 polish is integrated or deliberately superseded;
- mobile/server versions are coherent;
- automated gates pass;
- known physical-device gaps are listed rather than hidden.
