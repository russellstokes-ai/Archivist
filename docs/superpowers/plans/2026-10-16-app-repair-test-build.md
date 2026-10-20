# App repair and test builds Implementation Plan

> Execute inline using superpowers:executing-plans; one final independent review.

**Goal:** Resolve audited defects and evidenced original bugs, deliver test builds without redesign or release claims.
**Architecture:** Shared selection generations guard async results. EPUB content gets an isolated parsed pipeline preserving the existing shell. Server core remains portable.
**Tech Stack:** TypeScript, React Native/Expo, native Android, Go.
**Spec:** docs/v1/APP_WIDE_AUDIT_2026-10-16.md and ASTRA_EXECUTION_START_PR83_2026-10-16.md.

## Global Constraints
- Preserve UI/layout, Living Book renderer and scanner/Assist workflows.
- User explicitly requested all fixes plus APK/server test builds; amend exact reversible source exceptions only for reviewed repairs.
- QA app ID/debug signing only. No merge, install, personal-media migration or production release.

## Review Focus
- New selection or logout while old media/network operations complete.
- Malformed EPUB markup, missing resources, large works and nonstandard spine paths.
- Wrong-server/changed-filter catalogue responses.
- Native lifecycle/replay failure versus unchanged visual presentation.
- QA artifacts correspond exactly to tested source and are clearly distinct from production.

### Task 1: Playback/catalogue races
- [ ] Promote A1/A2/A6 reproductions into regression tests; run RED.
- [ ] Change mobile/playback.ts and scoped mobile/App.tsx logic: duration reset, selection invalidation and account/query guarded responses.
- [ ] Run targeted tests/typecheck; record exact reversible exceptions.

### Task 2: Reader pipeline/accessibility
- [ ] Test OPF ordering, 81+ sections, safe markup/resources and missing references before implementing.
- [ ] Add isolated EPUB helper; integrate mobile/localReader.ts without shell/style changes. Use a maintained parser if available; reject unsafe unsupported content explicitly.
- [ ] Respect reduceMotion in LocalPdfReader.tsx page changes; test.

### Task 3: Original lifecycle issues
- [ ] Inspect LivingBookArtwork/Canvas wrappers, reward overlay and comic dispatch; reproduce before changing.
- [ ] Keep renderer, assets and layout fixed; document cases requiring original file/device measurements.
- [ ] Full mobile suite, typecheck and source protection checks.

### Task 4: Review/build
- [ ] Independent whole-change review, repair important findings with regressions.
- [ ] Root/packaged Go tests and Linux amd64/arm64 binaries; deterministic HA/Docker source packages.
- [ ] Push draft; trigger existing manual QA APK through supported access if available. If unavailable, report exact build blocker, never invent an APK.
- [ ] Record provenance, hashes and testing checklist with explicit unverified gates.

## Execution ledger
- Baseline: remote a48d347, local d173097, isolated worktree. Prior 130 mobile suites/typecheck passed; six audit findings reproduced.
- Ruling: user request authorizes narrow repair exceptions and test-build production; does not authorize redesign, workflow gate bypass, deployment or release.

- Tasks 1–3 source repairs complete: 134/134 mobile suites, TypeScript, reversible baseline checks. Original #16/#19/#17 remain evidence-blocked.
- Final independent reviewer: three actionable findings (pending server open, unsupported EPUB loss, reader logout/unmount completion), all corrected with targeted RED→GREEN tests. No further actionable security findings.
- Ruling: bounded complete EPUB load with explicit errors replaces the proposed demand-loading step; preserves the existing shell and page model without a new reader architecture. Cost: large/unsupported EPUBs fail explicitly until later reader expansion.
- Task 4: Go tests and both binary builds complete; amd64 smoke and package contracts pass. QA APK requires existing manual workflow dispatch, which available connector cannot perform. No automatic trigger workaround.
