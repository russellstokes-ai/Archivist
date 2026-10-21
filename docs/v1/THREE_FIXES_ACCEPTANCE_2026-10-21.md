# Three authorised mobile repairs — 21 October 2026

## Scope and baseline

Owner authorised exactly three changes in chat: comic scan completion at the reported 24% stall; a visible Change photo button below the large profile avatar with an app-owned preview and Use photo / Cancel; compact Shelf and Atlas header/action spacing.

Source baseline rechecked: `73a6282ff5d2358fac08029ee82ef9f5f96f4bad`, mobile draft PR85 (`fix/test14-mobile-acceptance-20261017`). Isolated repair branch: `qa/three-fixes-20261021`.

Do not merge, publish to an app store, modify server PR83, redesign other screens, or alter the original Living Book renderer. Preserve existing user data, approved artwork, navigation, canonical sources and protection gates. Recheck the remote head before any integration; never force-push over other work.

## Required acceptance

1. Scanner: distinguish preparation from database queue and commit; report genuine completed/total work. Reproduce and test completion failure paths rather than merely moving the progress percentage. Cancellation must not permit stale writes to overwrite a newer scan. Keep the previous committed catalogue on failure. Verify normal and malformed comics, delayed operations, cancellation/restart, and preservation of manual metadata and identities.
2. Profile: clearly visible Change photo below the large avatar. Bypass the problematic native editing flow; use an app-owned draft preview with prominent Use photo and Cancel. Cancel/back preserves the previous photo. Validate/copy/persist on confirmation; failed saving preserves the old image. Update all avatar surfaces and retain the selected photo after restart. Check Fold closed/open and larger text.
3. Shelf/Atlas: group description and action without an independently spaced toolbar section. Preserve useful touch targets, avatar clearance, fonts, colours, navigation and Atlas rendering. Check empty/populated libraries, narrow/unfolded screens, landscape and larger text.

## Delivery

Run the mobile regression and type checks and the protected-source checks before the QA build. Use the existing QA package identity/signing conventions, with distinguishable version/build metadata. Verify the resulting APK package, signature, native alignment and startup. Deliver the extracted standalone `.apk`, not the GitHub artifact ZIP. Physical owner-device acceptance must not be claimed on the basis of source tests or an emulator.

## Current evidence

This commit records the agreed scope only. No application fix or new APK is claimed here. GitHub read and ordinary source/document write actions are being verified independently of the earlier rejected temporary-workflow action. That rejected workflow must not be retried or disguised.
