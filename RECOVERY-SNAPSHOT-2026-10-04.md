# Archivist recovery snapshot — chat/universal mobile — 2026-10-04

This branch is a **do-not-edit recovery snapshot** of the universal-mobile/chat development line as it stood before final integration.

Source branch: `design/draftbit-universal-phone`
Snapshot source commit: `ca64fb5bd694ad483a88298684e891265f6adcf9`

Recovery branch: `recovery/chat-universal-mobile-20261004`

## What this snapshot protects

This snapshot preserves the recent mobile/product work including:

- Expo 55 / Draftbit universal-mobile migration and responsive phone/Fold rules.
- Approved phone-only Settings overlap fix and centred metric cells.
- Locked UI handoff and Fold/open reference contracts.
- Live Player / Now implementation and locked handoff.
- Persistent local audiobook/reader progress behaviour.
- Profile photo selection and server-connection polish.
- Context-aware Library empty/offline states.
- Persistent iOS local-folder import path and Android SAF path.
- Safe local/server source removal and offline-download removal.
- Native file backup/restore flow with manual JSON fallback.
- Family-account recovery/revoke polish and server health/version work that landed on this line.
- iOS CBR work and native build compatibility checkpoints.
- Comic Focus deterministic bubble-mask and zoom-motion work through its locked 4 October checkpoint.
- Android Auto MediaLibraryService work and native compile gate.
- Mobile/iOS/Android CI/build-gate work and release-readiness documentation.

## Critical documents in this snapshot

Read:

1. `FIRST-COMPLETE-TEST-BUILD-HANDOFF.md` if present on the integration line.
2. `CURRENT-UI-HANDOFF.md`
3. `mobile/LIVE-PLAYER-HANDOFF.md`
4. `COMIC-SPEECH-FOCUS.md`
5. `mobile/ATLAS-HANDOFF.md` once Astra has finalised it.
6. `TESTING-READINESS.md`
7. `DESIGN-STANDARD.md`
8. `mobile/FOLD-REFERENCE-LOCK.md`

## Recovery rule

Do not merge future experimental work into this recovery branch. If final integration regresses or loses mobile work, use this branch as the exact recovery source for the chat/universal-mobile line.

The separate server recovery snapshot is:
`recovery/server-polish-20261004`

The separate locked UI recovery snapshot is:
`recovery/locked-ui-reference-20261004`
