# Wider mobile application audit — 16 October 2026

Audited source: remote draft PR #83 `0abf80f4e0df5b01effc4f17496662a74570a526` (local tree-equivalent `79f0d9b`). This is a focused reliability/source audit, not a claim of exhaustive native, visual or security certification. No app code changed in this audit.

## Confirmed findings

| ID | Priority | Evidence and impact | Repair scope |
|---|---|---|---|
| A1 | P2 | `Playback.load` retains the old duration. Reproduction: update track 1 duration to 30s, select track 2, seek to 120 before its first status; actual seek is 30. Timing-dependent incorrect seeking. | Reset per-track duration on load; test transitions and native status timing. |
| A2 | P1 | A delayed `resumeNowSession` server request can finish after a newer explicit `playLocalWork`, then open the old server title. The restoration generation changes only on another restore, not every new user selection. | One cancellation/selection identity covering restore, explicit local/server Play, reader selection, sign-out and unmount. Do not add disconnected flags. |
| A3 | P1 | Local EPUB loading reads archive HTML entries rather than the OPF spine and caps them at 80. Fixture with spine order chapter 1→0 renders 0→1; chapter 81 is omitted. Legitimate content can appear in the wrong order or be silently unavailable. | Parse container/OPF spine and resolve resources; replace silent truncation with bounded, demand-loaded reading. Preserve approved reader presentation. |
| A4 | P1 | `sanitizeEpubHtml` preserves unquoted `onerror=...` and iframe markup. Local HTML WebView permits JavaScript for reader controls and uses a broad origin whitelist. Confirmed unsafe transformation; no real native exploit, credential access or network exfiltration demonstrated. | Strict parsing/allowlist, event and URL removal, resource isolation and navigation policy while retaining the trusted reader bridge. Add malformed HTML fixtures. |
| A5 | P2 | `LocalPdfReader.move` always runs the page-turn animation; `reduceMotion` is used only for the loader. Source-confirmed accessibility behavior gap. | Immediate page change when Reduced Motion is set; retain normal approved transition otherwise. |
| A6 | P1 | `loadMoreServerWorks` has no session/filter generation check. Reproduction replaces displayed results while an old request is pending; its late response appends old-filter work into the new list. The sibling books pagination and manual refresh need the same audit boundary. | Capture and validate account/query generation for all catalogue responses, not only effect-driven first pages. |

Run the evidence:

```sh
node docs/v1/diagnostics/app-wide-audit-20261016.cjs
```

The diagnostic executes actual production functions with synthetic native/API dependencies, plus an AST-selected sanitizer and a structural PDF check. It asserts the currently observed defects and prints `CONFIRMED`; it is intentionally outside the passing mobile-suite glob. After repairs, invert/promote each relevant case to a normal regression instead of deleting evidence. A3 uses a synthetic archive index/OPF; no personal book or media is accessed.

## Further risks requiring investigation

- Playback API calls resolve `sessionRef.current` at call time. Establish whether account-switch controls can change it during a save/open; test against two accounts before claiming a cross-account defect.
- Local comic ZIP and CBT readers cap pages at 500; determine intended product limit and user-visible behavior, and inspect native CBR limits. Do not silently treat a truncated archive as fully read.
- EPUB relative image/resource URLs are removed; image-rich books require resource reconstruction in the A3 repair.
- Offline file checks verify size, not content hashes. Same-size corruption is not detected by the new resume validation. Native download redirect/authentication behavior needs device/network tests.
- Sign-out awaits remote revocation and local queue persistence before clearing all UI state. Test slow/offline service and storage failure, and verify reader/load cancellation on sign-out.
- Several read-progress writes are fire-and-forget or catch-and-ignore. Inject storage failure and app termination before claiming progress durability across every reader.

## Coverage and limits

Reviewed Playback and its App bridge, Now restoration, catalogue refresh/paging, sign-in/out, offline publication/removal, persistence generations, local EPUB/comic assembly, native ZIP adapter, PDF lifecycle and achievement ledger. Existing 130-suite/typecheck evidence belongs to the prior source commit; this audit did not rerun the entire unchanged product suite. Fresh six-group diagnostic and protection gate passed. No scanner/Assist, renderer, UI, asset or canonical lock was changed.

Not exercised here: actual Fold closed/open UI, native WebView exploitability, original failed comic, real account-switch UI, Android Auto head unit, iOS, long-duration battery/memory or real server/NAS failures. The original five outstanding bugs and all documented commercial/server work remain open.

## Recommended next order

1. A2 selection cancellation, A6 catalogue response isolation, A1 duration reset.
2. A4 EPUB isolation together with A3 spine/resource correctness; treat as one reader-content pipeline repair with explicit protected-source scope.
3. A5 Reduced Motion and the known Living Book/Rewards lifecycle investigations.
4. One consolidated QA APK for the original eight issues plus these regressions; keep release NO-GO until physical acceptance.
