# Archivist Development Workspace

This branch is the durable development workspace for Archivist.

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
