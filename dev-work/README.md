# Archivist Development Workspace

This branch is the durable development workspace for Archivist.

## Draftbit workflow

- Draftbit is the primary interactive environment for Archivist mobile development and visual review.
- Connected repository: `russellstokes-ai/Archivist`
- Active development branch: `design/hig-refresh`
- App folder: `mobile`
- GitHub remains the committed source of truth.
- After each reviewable UI stage, sync the connected Draftbit app and review it in Preview.
- Keep app work off `main` until the approved merge/release step.

Rules:
- Do not develop directly on `main`.
- The preserved Work-session source remains untouched.
- All sprint work is committed to this branch.
- After every sprint, create a durable checkpoint under `dev-work/checkpoints/`.
- Never rely on a temporary local/container Git repository as the only copy of completed work.
- External CI/emulator issues must not block product development; record them under `dev-work/validation/` and continue.
- Merge to `main` only after explicit approval.

Current recovery baseline:
- recovery/export-pre010-20260930

Planned checkpoints:
- Sprint 1 — Local + Server + Downloaded coexistence
- Sprint 2 — Shelf & Library UX
- Sprint 3 — Living Audiobook Player
- Sprint 4 — Reader & Comic Excellence
- Sprint 5 — Atlas
- Sprint 6 — Insights, Family & Organisation
- Sprint 7 — Server, Resilience & Ecosystem
- Sprint 8 — Perfect UI & Release Sweep


## Git workflow performance rule
- Do development against a local extracted working tree and local Git repository.
- Do not use GitHub directory listings as the normal filesystem browser.
- Use targeted `fetch_file` reads only when remote verification is needed.
- Publish checkpoints to GitHub in batched commits; avoid chunk-by-chunk source transfers.
- If a GitHub operation stalls or fails twice, stop that path and ask for direction.
