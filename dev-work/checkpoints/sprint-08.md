# Sprint 8 — Perfect UI & Release Sweep

## Implemented on the 0.9.0 candidate

- Unified product version: mobile and Home Assistant/server are `0.9.0`; Android versionCode `90`.
- Ink / Sage / Gold / Ivory visual system retained across primary mobile surfaces.
- Continuous Atlas, Living Player, Reader, Insights, Shelf and Library preserved from the advanced recovered branch.
- High-visibility Unicode placeholder controls replaced with drawn native React Native icons.
- Filter chips and advanced Smart Shelf controls expose button/selected accessibility state.
- Existing system/light/dark appearance, reduced-motion handling, SafeArea and keyboard avoidance retained.
- Fold-responsive breakpoints retained for compact and wide layouts.
- Professional root, mobile-build and Home Assistant documentation rewritten for the current product.
- Android workflow renamed to **Android Test APK**, explicitly labels debug signing, verifies the artifact and emulator-launches it.
- Development branch is included in the Android workflow only for mobile/build-path changes.
- Testing artifact naming standardized to `Archivist-0.9.0-Test-APK`.
- Obsolete Pack-era testing handoff replaced by the current readiness matrix.

## Automated gates

Previously green:
- Mobile control-polish run `36908101785`.
- 0.9.0 version Mobile run `36908772223`.
- Server/ARM64/HA run `36907874679` and subsequent server checks.

Final candidate:
- commit `b7842ab5`.
- Mobile checks: running/pending at checkpoint creation.
- Android Test APK: running/pending at checkpoint creation.

The checkpoint will be updated with the final workflow results before Sprint 8 is marked automated-complete.

## Physical gates intentionally not claimed

- Galaxy Fold closed/open screenshots and touch/gesture acceptance.
- Real Android background audio/lock screen/Bluetooth/interruption/sleep acceptance.
- Real Home Assistant OS install/update/restart on the Raspberry Pi 4B.
- Real HDD standby/wake behaviour.
- Real DuckDNS/Tailscale remote path.

Those require the user's hardware and remain the final acceptance pass after the APK is produced.
