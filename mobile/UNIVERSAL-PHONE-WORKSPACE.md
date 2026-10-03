# Archivist Universal Phone Workspace

Branch: `design/universal-phone`

This branch adapts the approved Fold/reference UI for normal phones without changing the approved Fold/open layout on `design/hig-refresh`.

## Source of truth
- Fold/reference appearance: `design/hig-refresh`
- Locked Fold StyleSheet snapshot: `mobile/locked-fold-ui.styles.snapshot.txt`
- Universal phone work starts from the latest Fold/reference implementation.

## Rules
- Phone-specific visual adaptation is allowed below 600dp.
- Fold-specific styles are protected by the UI contract on this branch.
- Prefer compact/phone overrides and conditional composition rather than editing shared/Fold styles.
- Branding, typography, palette, icon language, content hierarchy and terminology remain the same Archivist system.
- Do not merge phone experiments back into `design/hig-refresh` until explicitly approved.
- Review screen-by-screen rather than bulk restyling.

## Review widths
- 320–359dp narrow phone
- 360–429dp standard/compact phone
- 430–599dp large phone / Fold closed
- 600–759dp Fold open reference
- 760dp+ wide reference

Review portrait first, then confirm landscape does not break. Review light and dark modes and keyboard-open states where inputs exist.

## Screen order
1. Global shell/navigation
2. Shelf
3. Library
4. Work Details / Manage Library / metadata & cover
5. Player / Reader / Now
6. Atlas
7. Reader Stats
8. Profile / Rewards
9. Settings
10. Splash, loading, empty/error states
11. Android Auto separately as a driver-safe media surface

## Acceptance principle
The phone version may reflow, stack, scroll, collapse rails into sheets and tighten spacing where necessary, but it must feel like the same Archivist product rather than a separate design.
