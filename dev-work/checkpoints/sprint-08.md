# Sprint 8 — Perfect UI & Release Sweep

Checkpoint: 0.9.0 automated release preparation.

## Completed before this checkpoint

- Ink, Sage, Gold and Ivory light, dark and system visual system.
- Shelf, Library, Living Player, Reader, Atlas and Insights primary experiences.
- Fold-responsive breakpoints and open-layout treatments.
- Safe-area, keyboard and reduced-motion handling.
- Native-control polish replacing rejected cheap text-glyph controls; Mobile CI passed on c6e5776a, run 36908101785.
- Global loading, error, offline and reader retry states are wired rather than placeholder controls.
- Sprints 1–7 are reconciled as durable.

## This checkpoint

- Product, mobile and HA version aligned to **0.9.0**.
- Android versionCode advanced to **90**.
- README rewritten for the actual current product.
- TESTING-READINESS and MOBILE-TESTING rewritten around current acceptance gates.
- Android build guide updated to the release-variant APK pipeline.
- Android APK workflow runs on the Sprint 8 branch and relevant mobile changes.
- Android APK workflow includes organisation and Insights regression suites.
- Test APK remains deliberately separate from production Play signing.

## Automated gates required to close source and CI

- Mobile checks green at 0.9.0.
- Server checks green at 0.9.0 and HA package parity.
- Android APK green, including lint, assemble, signature, alignment, ABI validation and emulator launch.
- Versioned APK artifact plus checksum present.

## Physical gates not claimable from CI

- Galaxy Fold closed and open visual and functional pass.
- Background, lock-screen and sleep real-device pass.
- Reader and Comic Focus Zoom physical pass.
- Home Assistant and Pi install, update, restart and workload observation.
- Real DuckDNS and Tailscale connection and reconnection.
- Final physical screenshot review.

Sprint 8 should only be marked fully complete after those device gates are recorded.
