# Archivist v1.0 — Immutable Baseline and Protected Scope
Status: IN DEVELOPMENT BRANCH ONLY, never a production release.
Date: 2026-10-13

## Absolute rollback references
- Protected canonical source: `df4c39b44394d8c512ca0298bffa7f19da356490`.
- Later test source used **only as a development starting point**: `131cabdc82ce7c6d6b36e0034540184bd990a3ab`.
- Original main preserved at `22ee7645b78b752b9e954a286528fddbedfc1320`.
- Recovery register: `backup/archivist-20261013-recovery-docs`.
- NEVER assume the source commit of the installed Android APK without verifying it.
- Do not update `main`, canonical branches, backup branches or existing releases while developing v1.

## LOCKED: require separate explicit written approval per change
1. Working Android local scanner and its source/processing/UI contract.
2. Archivist Assist: search, matching, metadata editor and workflow.
3. Shelf/Continue layout and behaviour.
4. Living Book renderer and player book geometry/animations.
5. Comic Focus/speech-bubble zoom and comic presentation.
6. Atlas/Universe, Stats, Rewards, approved motion and achievement presentation.
7. Logo/icon, brand palette, illustrations, Lottie assets and approved Fold design.

These rules protect **behaviour**, not just filenames: no indirect rewiring of locked modules from surrounding files. Reported bugs in locked components are diagnostic-only until specifically authorised.

## Allowed initial scope
- Server Go API and HA web administration on this branch, where changes do not rewrite the locked mobile scanner.
- Server CBR detection, bounded archive reader and cover extraction.
- New standalone admin web page and server-only metadata management, preserving the existing mobile interface.
- Pure, isolated Android Auto performance work where no protected presentation or player changes are required.
- Release documentation, privacy drafts and read-only compliance tests.
- Mobile bugfixes that **do not** affect the locked components; if a fix inevitably crosses a locked boundary, pause for approval.

## Hard acceptance gates
1. Preserve root/packaged server parity (`*.go`, `go.mod`, `go.sum`, mirrored web assets).
2. Maintain authentication, ownership, library permissions, CSRF protections, and `os.Root` path isolation.
3. Bound RAR decompression and memory; never extract arbitrary archive paths to the filesystem.
4. Do not add new network-dependent mandatory steps to existing scanner or Assist.
5. Test Go server, web JS, mobile tests and CI. Unrun tests MUST be described as unverified.
6. No releases, installation, deployment or merge without explicit user approval; preserve app/private library data.
7. Work only through feature branch changes with small reviewable commits.
