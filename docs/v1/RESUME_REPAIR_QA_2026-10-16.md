# Resume and download-first restoration — draft source repair

Base: PR #83, `0e5f078ef819c6fd54267adf7b7b7b3c6e9d9b79`.
The retained local checkpoint `9354f05` has the identical Git tree. Prior uncommitted repair work was copied into an isolated worktree, reviewed and extended; the original checkout was not changed.

## Changes and evidence

- Confirmed both historical actual-function diagnostics fail on the base: unwanted `player.play()` during local restoration, and a server request ahead of an available download.
- Restoration now requests paused loading throughout local, downloaded and server audio paths; explicit Play retains autoplay. Persisted playback intent matches this decision.
- Download-first dispatch validates file existence, non-directory status, positive integer size and the declared size when present. Unusable/missing/inaccessible files retain server fallback, constrained to the matching server. This is file-stat validation, not a cryptographic content-integrity claim.
- A new failing regression proved that server checkpoint chapter 2 could override a saved chapter-1 restoration. Playback now accepts the explicit position within its generation-guarded load, with the requested asset. Deliberate rewinds, including zero, survive. There is no post-open seek that could target a newer title.
- A new failing regression proved a missing downloaded chapter silently selected another chapter of the same format. Both download and server restoration now respect the exact saved identifier when present.
- Rapid server load switching is covered: late old completion cannot overwrite the newer chapter/position or start playback.

## Verification

- 130/130 mobile suites passed with `/tmp/archivist-jdk/bin` on PATH.
- TypeScript typecheck passed.
- Both historical RED diagnostics now pass. The filesystem double was added to the old offline diagnostic because the implementation now verifies the local file.
- New actual-App regression and real Playback regression pass. The latter additionally covers rapid load switching.
- Protection gate passes: 45 original blobs plus the exact scoped App logic blob.
- Reversing the explicitly listed App logic changes restores the canonical scanner/UI binding hash. JSX/styles, scanners, Assist, Living Book renderer, art and assets are unchanged.
- Initial broad run was 126/130: missing JDK caused two failures, and concurrent review edits affected the new resume test and reversible-hunk whitespace. Corrected environment/hunk record and finished source passed 130/130. No tests were disabled.

## Limits and next work

This is a draft source correction for the reproduced #23/#31 defects, not physical acceptance of the owner's original symptoms. No APK, deployment, merge, installation or release occurred. No server source changed, so existing server test evidence was not relabelled as a fresh run.

Still required: Fold local/download/server resume and explicit Play; native unavailable/corrupt media and process death; real PDF A→B→A/permissions/resizing; #16 comics original fixture; #19 catalogue eligibility evidence; #25 WebView lifecycle; #17 rendered alignment; #20 reward replay lifecycle. Ten-screen server/workbench/relink/scan controls, hardware Auto/cross-device progress and commercial release gates remain open. File-stat validation cannot detect same-size content corruption.
