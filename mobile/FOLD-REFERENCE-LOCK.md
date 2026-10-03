# Fold reference lock

The approved Archivist Fold/open UI is owned by `design/hig-refresh`.

Canonical implementation checkpoint: `e57c5f1b19771ae6036245b8a59fe8a8ec55c28f`

Canonical lock documentation: `mobile/FOLD-REFERENCE-LOCK.md` on `design/hig-refresh`.

## Rule for this branch

This branch may adapt Archivist for phones or Draftbit conventions, but it must not change the approved Fold/open design.

- below 600dp: responsive composition may adapt
- 600–759dp: Fold/open reference is locked
- 760dp+: wide reference is locked unless explicitly approved

Do not alter the Fold/reference palette, typography, layout hierarchy, icon language, component geometry, navigation, animations, or canonical logo without Russell's explicit approval.

Phone-specific changes should use conditional composition or phone-only styles.

If styling technology is migrated (for example StyleSheet to NativeWind), preserve the same Fold geometry and visual tokens and replace—not remove—the existing UI contract protection.

If a Draftbit sandbox is deleted, restore from GitHub. Do not treat sandbox state as the source of truth.
