# Three authorised mobile repairs — 21 October 2026

## Latest owner decision — build the three-fix APK ONLY

The owner rejected the proposed wider UI mockups and explicitly requested: **leave those proposals and deliver the APK with the original three fixes, not a ZIP**.

This instruction supersedes the earlier APK hold in this document, `THREE_FIXES_SOURCE_QA_2026-10-21.md` and `mobile/threeFixes/README.md`. No general button restyling, contrast sweep, Settings consolidation, control removal, or mockup redesign is approved or included. The contrast treatment inside the original new photo-confirmation component remains part of that already-approved photo repair.

Only package the three-fix candidate already verified at `0a048ed536605e0dde9070d47228f2aeff3ea7d8`. The subsequent documentation-only authorisation does not change executable source. Do not substitute an older APK.

## Scope and baseline

Owner authorised exactly three application changes in chat:
1. Comic-scan preparation and catalogue-save reliability at the reported 24% stall, with real progress and safe cancellation.
2. A visible Change photo button below the large profile avatar and an app-owned preview with Use photo / Cancel.
3. Compact Shelf and Atlas header/action spacing.

Original mobile draft PR85 baseline: `73a6282ff5d2358fac08029ee82ef9f5f96f4bad`, branch `fix/test14-mobile-acceptance-20261017`.
Isolated repair branch: `qa/three-fixes-20261021`.
Rechecked repair head: `0a048ed536605e0dde9070d47228f2aeff3ea7d8`.

The verified repair history is a fast-forward descendant of the unchanged PR85 baseline. Promote only that reviewed history plus this documentation authorisation to the existing mobile QA branch, using the expected-head lease. This is not a merge of PR85 into its parent or main. Keep PR85 draft/unmerged. Never force-push over concurrent work.

Do not modify server PR83, canonical branches, the original Living Book renderer, approved artwork or navigation. Do not publish to an app store or create a public release.

## Verified source evidence

Mobile checks run `39593306689` on `0a048ed536605e0dde9070d47228f2aeff3ea7d8` succeeded: protected-source checks, Expo Doctor, baseline and effective-source TypeScript, 162/162 mobile test suites, version consistency and actual web bundling. Detailed evidence and limitations are recorded in `THREE_FIXES_SOURCE_QA_2026-10-21.md`.

The scanner regressions include real SQLite with 3,000 records, bounded inserts, cancellation/error rollback and reopening, plus synthetic comic sources with a never-returning artwork operation, quarantine, safe restart and late-result rejection. This fixes a reproduced blocking path but does not establish that artwork caused the exact stall on the owner's phone.

Photo tests cover draft/commit/cancel, invalid inputs, failed persistence retaining the old photo and responsive footer state. Header tests cover narrow/wide and larger-text layout branches. Physical Fold acceptance remains outstanding.

Executable App/runtime repairs use the documented SHA-bound, reversible source manifests shared by Metro, TypeScript and the repair tests. Unchanged original source locks alone are not proof of the effective executable source. No wider UI proposals have been implemented; the UI inventory is read-only test code.

## APK route and required checks

Use the existing protected manual Android QA workflow and its already-existing owner-authorised dispatcher. The dispatcher requests the current named mobile QA branch, so recheck that branch resolves to the reviewed repair commit before requesting the build. Do not change a workflow, bypass a QA gate or retry/disguise the earlier rejected temporary-workflow creation.

Preserve existing QA identity/signing conventions (`app.archivist.reader.qa`, QA debug key). Verify the resulting APK's source SHA, package, signature, native alignment and Android startup results. Give the standalone extracted `.apk` a source-distinguishing filename and verify its SHA-256 against the artifact checksum. Do not deliver the GitHub artifact ZIP as the requested application.

No app-store publication, server deployment or production release is authorised. Source tests and emulator smoke tests must not be presented as physical owner-device acceptance.
