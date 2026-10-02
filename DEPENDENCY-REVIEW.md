# Archivist 0.9.0 dependency and licence review

This is an engineering release check, not legal advice. It records the dependency evidence present in the pinned repository at the 0.9.0 testing checkpoint.

## Mobile direct runtime dependencies

The versions and SPDX licence declarations below come from `mobile/package.json` and the pinned `mobile/package-lock.json`.

| Dependency | Resolved | Lockfile licence |
| --- | ---: | --- |
| expo | 57.0.24 | MIT |
| expo-audio | 57.0.5 | MIT |
| expo-file-system | 57.0.7 | MIT |
| expo-secure-store | 57.0.4 | MIT |
| expo-system-ui | 57.0.4 | MIT |
| expo-asset | 57.0.18 | MIT |
| react | 19.2.3 | MIT |
| react-native | 0.86.3 | MIT |
| react-native-safe-area-context | 5.7.0 | MIT |
| react-native-webview | 13.16.1 | MIT |
| jszip | 3.10.1 | MIT OR GPL-3.0-or-later |

For JSZip, the lockfile declares a dual licence. Archivist's distribution review should retain the MIT option/notice rather than adopting GPL terms unintentionally.

The Android testing workflow runs `npm ci`, Expo Doctor and a high-severity runtime `npm audit` gate before producing an APK.

## Go server dependencies

Direct modules pinned in `go.mod`:

- `github.com/microcosm-cc/bluemonday v1.0.27`
- `golang.org/x/net v0.44.0`
- `modernc.org/sqlite v1.39.1`

Transitive Go modules are also pinned through `go.mod` / `go.sum`.

Existing licence text/evidence is retained in `THIRD-PARTY-NOTICES.md`, including the sanitizer-related dependencies used by Archivist. The Home Assistant image also installs FFmpeg/ffprobe as a subprocess dependency; its distribution notices remain governed by the image/package source.

## Bundled reader assets

Bundled PDF.js licence material remains under `web/vendor/LICENSE` and its packaged copies. Reader assets are served from Archivist rather than a third-party CDN.

## 0.9.0 engineering conclusion

No new proprietary third-party dependency was introduced by Sprints 5–8. The release candidate keeps its application code under `LICENSE.md` while third-party components retain their own terms.

Before a public commercial/store release, generate a full transitive SBOM/notices bundle from the exact production build and have the final distribution terms reviewed. That publication step is separate from the 0.9.0 private testing gate.

## 0.9.3 build tooling mitigation

GitHub advisory GHSA-86w9-cpqp-85rv affects node-forge 1.4.0, used by Expo CLI certificate tooling. No upstream patched version was listed on 2 October 2026. `mobile/harden-forge.cjs` adds the missing nested DigestAlgorithm element-count validation and tests both a valid RSA signature and a malformed nested signature. CI applies it before Expo Doctor. The audit gate admits only this exact advisory after the regression passes; every other high/critical advisory still blocks. Moderate findings remain reported. The app has OTA updates disabled and Android APK signing uses Android apksigner, not node-forge. Remove this workaround once an upstream fix is available and verified.

