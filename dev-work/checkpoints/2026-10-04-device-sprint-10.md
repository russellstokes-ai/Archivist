# Device polish Sprint 10 — phone UI alignment fixes

Date: 4 October 2026  
Branch: `bugfix/0.9.4-device-pass-20261004`

## Real-device findings added to this sprint

A phone-layout device pass identified three small but visible polish issues:
- Library's horizontal **All / Audio / Comic / …** format row was vertically clipped on phone.
- Shelf's **Arrange** action sat inboard from the normal content edge and used text-only treatment.
- Atlas's header view/settings action used a different icon-only treatment and had the same floating/inboard alignment problem.

The Library clipping was reported on **mobile/phone only**. Fold layout was not affected and must remain unchanged.

## Implemented

### Phone-only Library format rail
- The shared/fold format-tab styles are retained.
- Only `phoneLayout` (width < 600) receives `libraryFormatScrollPhone` / `libraryFormatTabsPhone`.
- The phone rail now reserves a fixed 50 px vertical viewport with a non-shrinking 44 px minimum tab hit target.
- This prevents Android's horizontal ScrollView from measuring the content shorter than its tab children and clipping text/selection markers.
- Fold/wide use the previous shared rail unchanged.

### Shelf / Atlas page-action consistency
- Shelf **Arrange** now uses the standard compact **icon + short label** treatment: Settings icon + Arrange.
- Atlas now uses the same treatment: List icon + List, switching to Atlas icon + Universe when list mode is active.
- Both use the same icon size, label typography, spacing and sage action colour as the Library **Manage** language.
- The shared page toolbar no longer reserves an unnecessary 58 px avatar inset. The toolbar sits below the avatar, so secondary actions now align to the page's true right content edge.

## Scope boundary
No Shelf content sections, Library cards, Atlas graph, Fold Library rail, navigation, Player, Reader, Stats, profile placement or bottom navigation were redesigned.

## Regression guards
The mobile UI contract now verifies:
- phone-only format-rail application;
- the explicit 50 px phone rail and 44 px tab safety;
- the `phoneLayout < 600` / `foldLayout >= 600` boundary;
- Shelf and Atlas both use icon + label actions;
- page toolbar actions align to the actual content edge.

## Automated evidence
- Mobile checks run `37225781141`: **PASS** — Expo Doctor, TypeScript, full maintained mobile/UI-contract suites, version consistency and Expo web bundle.
- iOS checks run `37225781246`: **PASS** — dependency install, Expo Doctor, TypeScript, iOS project generation, CocoaPods and full iOS Simulator compile.
- Executable/test head: `59d4418bc3e53da64cd742689b7ba13f7a7d187b`.

## Physical acceptance
Recheck on the same phone/device class:
- All / Audio / Comic text renders fully with no top/bottom clipping.
- selected underline remains visible;
- horizontal scrolling still works when more formats exist;
- Shelf Arrange aligns with the right content edge and reads as a secondary action;
- Atlas List / Universe action aligns identically;
- Fold Library appearance remains unchanged.
