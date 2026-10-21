# Three authorised mobile repairs — 21 October 2026

## APK BUILD HOLD — latest owner instruction

The owner has changed the delivery sequence. **Do not create an APK after the three repairs. Do not dispatch or re-run an APK-producing workflow.**

Required order:
1. Finish and verify the three already authorised repairs below.
2. Review buttons and other interactive controls throughout the mobile UI, and present screen-by-screen layout and visual recommendations to the owner.
3. Agree and implement the additional button/UI changes. This audit request is not blanket approval to restyle the whole app.
4. Run regression and UI verification. Build the standalone APK only after the owner authorises proceeding following the agreed UI work.

Ordinary source tests, type checks and non-APK checks may continue. No APK was requested by this revised instruction. This hold supersedes earlier instructions to build immediately after the three fixes.

## Scope and baseline

Owner authorised exactly three changes in chat: comic scan completion at the reported 24% stall; a visible Change photo button below the large profile avatar with an app-owned preview and Use photo / Cancel; compact Shelf and Atlas header/action spacing.

Source baseline rechecked: `73a6282ff5d2358fac08029ee82ef9f5f96f4bad`, mobile draft PR85 (`fix/test14-mobile-acceptance-20261017`). Isolated repair branch: `qa/three-fixes-20261021`. Head rechecked before this documentation update: `9fa236ec9cf9ea1281c586d5d473e6bb55dd0898`.

Do not merge, publish to an app store, modify server PR83, redesign other screens, or alter the original Living Book renderer. Preserve existing user data, approved artwork, navigation, canonical sources and protection gates. Recheck the remote head before any integration; never force-push over other work.

## Required acceptance for the three repairs

1. Scanner: distinguish preparation from database queue and commit; report genuine completed/total work. Reproduce and test completion failure paths rather than merely moving the progress percentage. Cancellation must not permit stale writes to overwrite a newer scan. Keep the previous committed catalogue on failure. Verify normal and malformed comics, delayed operations, cancellation/restart, and preservation of manual metadata and identities.
2. Profile: clearly visible Change photo below the large avatar. Bypass the problematic native editing flow; use an app-owned draft preview with prominent Use photo and Cancel. Cancel/back preserves the previous photo. Validate/copy/persist on confirmation; failed saving preserves the old image. Update all avatar surfaces and retain the selected photo after restart. Check Fold closed/open and larger text.
3. Shelf/Atlas: group description and action without an independently spaced toolbar section. Preserve useful touch targets, avatar clearance, fonts, colours, navigation and Atlas rendering. Check empty/populated libraries, narrow/unfolded screens, landscape and larger text.

## Whole-mobile-UI button and layout audit — recommendations first

Owner concern: important actions can look like ordinary text, are too small or difficult to see, or have unclear placement. The profile-photo text control is the concrete example, not the entire scope.

Cover Shelf, Library, Atlas, Stats/Insights, Profile, Rewards, Settings, Player/Now, readers and their controls, first-run setup/scanning, Archivist Assist and metadata editing, source/folder management, and every relevant sheet/dialog and empty/error/loading state. Review shared Button components and individual Pressable/text/icon actions; include filters, segmented controls, selectable rows and concealed long-press actions where they affect discoverability.

For each finding record: screen/control; evidence and source location; actual issue; recommended change; priority; controls to preserve; and required verification. Distinguish source-inspected findings, screenshot observations and unverified device behaviour. Do not describe a source-only audit as a completed physical-device usability test.

Evaluate visibility/contrast, whether actions look tappable, primary versus secondary hierarchy, grouping/placement, touch areas and spacing, readable labels, icon-only ambiguity, selected/pressed/disabled/loading/focus states, confirmation and cancellation, and Fold closed/open, landscape and larger-text behaviour. Check supported light/dark appearances without changing the approved palette.

Direction to propose, not blanket implementation approval: a restrained shared family of prominent primary buttons, clearly bounded secondary actions, recognisable icon buttons and selectable controls, with text links reserved for appropriate low-priority navigation. Do not turn everything into a large filled button or make all actions compete. Preserve the existing Archivist navy/ivory/gold/teal styling, typography, approved player controls, artwork and navigation.

## Eventual delivery — only after the build hold is lifted

Run mobile regression and type checks and protected-source checks before the future QA build. Protection checks must account for the actual executable source; unchanged baseline files alone are not evidence that compiled behaviour is unchanged. Do not count detached Git objects, draft patches or unintegrated helper files as completed application fixes.

Use existing QA package identity/signing conventions with distinguishable version/build metadata. Verify the resulting APK package, signature, native alignment and startup. Deliver the extracted standalone `.apk`, not the GitHub artifact ZIP. Physical owner-device acceptance must not be claimed on the basis of source tests or an emulator.

## Current evidence and limits

- Commit `56d8ef142f38c55917695500affefd38a0d43f37` implements batched, observable, cancellation-aware native catalogue replacement. Mobile checks run `39581618544` passed, including the eight save-path regressions, TypeScript and web bundling. This establishes the storage repair, not a reproduction or resolution of the owner's physical comic-scan stall.
- Commit `9fa236ec9cf9ea1281c586d5d473e6bb55dd0898` adds the pending integration/UI regressions. At that commit, the save-path tests pass but the four App integration/UI tests fail as expected: prominent profile action, app-owned confirmation, compact page headers and passing scan-generation/write progress into the save. The three repairs are therefore not yet complete.
- No repaired APK has been built. The new whole-UI audit is pending; it is not marked completed by this scope update.
- The earlier rejected temporary-workflow action must not be retried or disguised. Source changes, documentation and existing permitted checks are separate from that rejected action.
