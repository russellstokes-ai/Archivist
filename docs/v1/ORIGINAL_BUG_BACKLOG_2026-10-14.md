# Archivist v1.0 — Approved bug scope and canonical source protection

**User-confirmed scope: 14 October 2026.** Supersedes the broader historical bug ledger in this file. The user supplied **nine entries** and expressly directed: **ignore all scanner-related work**. The sole scanner entry, **#15**, is therefore **out of scope**. The eight remaining bugs/risks below are the **only active bug scope** until the user directs otherwise.

## Absolute source and visual locks

- **Both existing mobile scanners and Archivist Assist are frozen.** Do not change their implementation, pipeline, flow, data model or UI. Do not rewrite, replace, integrate or optimise them to solve unrelated issues. Read-only diagnosis and unchanged existing test execution are permitted.
- **Canonical mobile UI layout frozen:** spacing, typography, font, dimensions, button positions, navigation, colours, brand icon, Lotties and accepted assets. Fixes must preserve the visible design. Code behind a protected reader component must **not** be edited without separately scoped explicit permission.
- **Living Book renderer, Comic Focus/speech zoom, Atlas and Stats/Rewards presentation frozen.** Report causal diagnosis first; do not equate a bug report with a licence to rework a renderer.
- `mobile/App.tsx`, `mobile/localLibrary.ts`, `mobile/localReader.ts`, `mobile/metadataSync.ts`, scanner lifecycle/feedback and approved motion assets are within **46 protected Git blob locks** in `docs/v1/PROTECTED_BLOB_LOCKS.json`. Additional code/tests protect `mobile/archiveReader.ts` and gestures. Never weaken lock tests to make a proposed patch pass.
- Keep the approved canonical application separate from draft branches. **No merge, APK installation, release or source-lock update without user approval.**
- Note that server administration `web/manage.js` received a storage-health *functional* addition in draft #40. This is **not** the mobile canonical layout, but it must be disclosed accurately.

## Active bug list — exactly as directed (scanner #15 excluded)

| Priority | Issue | User finding / required outcome | Actual status |
|---|---|---|---|
| P0 | [#16 Comics won't open](https://github.com/russellstokes-ai/Archivist/issues/16) | `2000AD Annual 1978` shows `UNSUPPORTED`, `net::ERR_ACCESS_DENIED`. Fix classification, file/SAF permissions and reader opening. Test CBZ, CBR, CBT and comic PDFs. The local reader's ordinary URI fallback for unrecognised formats could bypass the comic decoder if wrongly classified; this is a **hypothesis, not a proven root cause**. | **Open.** Draft #48 improves error classification only, not the underlying opening failure. No change to locked comic renderer. |
| P0 | [#19 Atlas blank](https://github.com/russellstokes-ai/Archivist/issues/19) | Library/Shelf valid published works must populate Atlas books and existing charts. | **Open.** Atlas UI and data renderer locked, no fix in drafts. |
| P0 | [#25 Living Book disappears](https://github.com/russellstokes-ai/Archivist/issues/25) | Sometimes absent until Play/Pause; correct initialisation/render timing without replacing renderer. | **Open.** Existing renderer untouched. |
| P0 | [#23 Unwanted Resume prompt](https://github.com/russellstokes-ai/Archivist/issues/23) | Books, comics and audiobooks reopen at saved position automatically through force-close and restart, no unexpected audio autoplay. | **Open.** Draft #46/#47 progress sync foundation does not remove prompt or wire to locked player. |
| P1 | [#17 Play/Pause misalignment](https://github.com/russellstokes-ai/Archivist/issues/17) | Check whole five-button row and Lottie optical centre; preserve approved sizes and positions. | **Open.** No visual/layout edits. |
| P1 | [#20 Rewards unreliable](https://github.com/russellstokes-ai/Archivist/issues/20) | Books Stack and other approved Lotties must complete one playback and hold final frame, no freezing/blank. | **Open.** Animation files and rewards presentation unchanged. |
| P1 | [#31 Offline override risk](https://github.com/russellstokes-ai/Archivist/issues/31) | Downloaded local copy must win when server offline or unavailable; online/offline behaviour verified. | **Code fix in draft #41, CI green, not device-accepted**. Existing mobile layout unchanged. |
| P1 | [#32 PDF page-state risk](https://github.com/russellstokes-ai/Archivist/issues/32) | When switching PDFs, show the newly selected document and its own saved page, never previous image/page. | **Unconfirmed code-review risk; not corrected/accepted**. |

**Explicit exclusion:** [#15 scanner reliability](https://github.com/russellstokes-ai/Archivist/issues/15) appeared in the user-supplied reference list, but the user specifically says **ignore anything scanner related** and **do not touch either scanner or Archivist Assist**. Do not list scanner tasks as development priorities. Their code may remain covered by existing regression tests without any edits.

**Other historical issues #18, #21, #22, #24, #26–#30, #33–#39** remain in GitHub for reference, but **they are not this agreed nine-item bug list**; do not introduce them as active bug-fixing tasks without another instruction. Existing separately approved backend commercial work is not reclassified as a reported bug.

## Actual protection audit against complete draft chain #40–#48

Compared `dev/archivist-v1-protected-20261013` with draft #48 head `7734aac6e3d65dc56d7a8d8e075e49760623c1bc` using GitHub's cumulative commit/file comparison:

- **62 current net changed files** across 105 commits in the draft chain.
- **0 of 46 protected paths changed**.
- **0 scanner or Archivist Assist implementation paths changed**.
- **0 mobile/App.tsx, canonical reader, Atlas, Rewards, approved Lottie or approved graphics paths changed**.
- `mobile/archiveReader.ts` was **restored verbatim** after a proposed modification violated an additional existing SHA lock. It is not in the final net changes.
- The two server `main.go` copies added **only** `syncProgressRoutes`, `libraryHealthRoutes` registration and a JSON response Content-Type header; their scanner implementation was not modified.
- Current net mobile changes are separate offline/connection modules and tests, Android Auto service progress-file hardening, manifest network-local permission, and comic **error text mapping**. They do not alter canonical layouts.
- The server manager's storage-health functional addition is intentionally disclosed above.

Latest full branch validation before this documentation-only clarification: **Mobile checks #38640508505 PASSED, iOS checks #38640508303 PASSED**. Tests and source diff do **not** prove original mobile bugs are resolved on device.

## Completion standard

Keep each bug open until its exact reproduction is resolved and behaviour is verified with the approved interface and actual media on Android/Fold (closed and open where relevant). Do not claim a fixed comic, populated Atlas, stable Living Book, reliable Rewards, direct resume or correct PDF behaviour on the strength of unrelated server or synthetic CI.

**Development order for these eight only:** #16 classification/access diagnostics and unprotected fix candidates; #19 underlying published-work feed; #23 saved-position flow; #25 mount/timing diagnostics; #20 one-shot animation lifecycle; #17 exact optical centring; #31 offline end-to-end; #32 PDF stale-state isolation. **Any protected-source change requires a separately agreed narrow exception**; no UI redesign or scanner/Assist edits.
