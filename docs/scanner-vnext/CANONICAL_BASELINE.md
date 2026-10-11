# Canonical full-app baseline — 2026-10-11

**User direction: save this Archivist version as the canonical baseline and make it obvious to other agents.** This is the complete app baseline, not just a scanner snapshot.

## Exact version

- GitHub source commit: `df4c39b44394d8c512ca0298bffa7f19da356490`
- Source tree: `d39ec0a0a3e75a4160c8c687824e940ce768d8d4`
- Canonical GitHub branch: `canonical/archivist-20261011-df4c39b` (keep at the source commit)
- Equivalent local source commit: `7bea9cb`; local tag: `canonical-archivist-20261011-df4c39b`
- APK: `Archivist-Fresh-Scanner-Fold-Test-20261010-df4c39b.apk` (45,219,072 bytes; filename date is the workflow naming convention)
- [Download APK](https://github.com/russellstokes-ai/Archivist/releases/download/scanner-vnext-fold-fix-20261010-df4c39b/Archivist-Fresh-Scanner-Fold-Test-20261010-df4c39b.apk)
- [Release and checksum](https://github.com/russellstokes-ai/Archivist/releases/tag/scanner-vnext-fold-fix-20261010-df4c39b)
- [Successful full-app build and acceptance checks](https://github.com/russellstokes-ai/Archivist/actions/runs/38131962208)

## Preserve

The user previously confirmed that scanning/grouping was fast and did not hang, and accepted the improved direct-review onboarding. This baseline preserves those behaviors and all other full-app features. Existing scanner lock: `CANONICAL_SCANNER_LOCK.json` (24 files); existing process lock: `CANONICAL_PROCESS_LOCK.json` (seven functions). The root `AGENTS.md` directs future work to this baseline. Do not reuse Test 14 or another historical scanner.

This version also includes broader bounded Assist searches, candidate cover cards and additional choices, evidence-based genre/year/cover supplementation, a filled pulsing Assist button for incomplete metadata, and the Android metadata-footer keyboard layout adjustment. Manual edits remain protected. See [Assist implementation and evidence](ASSIST_RECALL_STATUS.md).

## Evidence and remaining limitations

The exact source passed GitHub mobile checks, Android compatibility checks, APK compilation, package/signature/checksum verification and release upload. No new emulator validation was performed. The keyboard clipping adjustment still requires physical Fold confirmation; designation as canonical does not assert that this symptom has been physically retested.

Approved live Open Library checks returned choices for Bobiverse, Outgunned, The Hobbit and The Master of Mankind. Candidate counts are not accuracy measurements. Half Horn had no convincing intended match; “Assanorium” had no result. Genre and publication year are filled only where supported by catalogue evidence and can remain unresolved. Do not silently fabricate missing fields or claim every reported Assist issue is solved.

## Future changes

Use a separate development branch based on this version or documented descendants. Preserve the canonical reference. Follow the user's explicitly requested scope, keep existing lock checks, record validation honestly, and require a new explicit user designation before replacing this canonical baseline. Documentation commits after the source snapshot do not imply a different APK.
