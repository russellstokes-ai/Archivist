# Archivist 0.9.5 UI Lock

**Status:** LOCKED for 0.9.5 hardening.

## Canonical baseline

The visual and interaction source of truth is the user-approved **Archivist 0.9.4 test-13** APK/source at commit:

`583ec8dde2936a2979648c010a4bd44cdc75e01d`

Pinned reference branch:

`ui-lock/0.9.5-test13-baseline`

0.9.5 hardening branch:

`review/0.9.5-test13-hardening`

Do not use the later stripped UI branch as the visual source of truth.

## Only approved UI changes

1. **Splash** — preserve the test-13 launch identity, adding the established ambient halo and one restrained breathing/fade animation. Reduced Motion remains respected.
2. **Fold Library source rail** — 184dp on Fold, stronger divider, larger Fold-only folder/source/group labels. Phone composition is unchanged.
3. **Onboarding emphasis** — reuse the existing pulse language so focus moves in order from Add folders → Prepare library → Review what needs attention → Enter my library. During preparation show **Discover → Identify & group → Metadata & covers → Ready**. Unresolved works stay out of normal Library/Shelf publication until reviewed.

## Locked test-13 surfaces

The following must survive functional hardening unchanged in composition and hierarchy:

- persistent top-right avatar, level ring and halo;
- Profile / Rewards / Settings avatar menu;
- Profile progression and Rewards achievements/milestones;
- Shelf editorial hierarchy, personal sections and recommendation rows;
- Library source/folder tree, Manage sheet and metadata-health workflow;
- five-tab bottom navigation: **Shelf · Library · Now · Atlas · Stats**;
- Now Player/Reader live hub and persistent activity bar;
- Living Book layout and transport hierarchy;
- immersive Reader/comic UI and speech-bubble focus;
- Atlas constellation, Genre/Format/Year ring, inspector and Universe Stats;
- Reader Stats hierarchy and charts;
- global page-title/header alignment and ambient halo system;
- Settings section hierarchy;
- light/dark and phone/Fold responsive behavior.

## Change control

Scanner, metadata, cover lookup, grouping, persistence, Android Auto, performance and error recovery may be hardened. Those changes must not simplify, remove or restyle the locked UI merely to make implementation easier.

A deliberate UI change is allowed only when explicitly requested, required for accessibility, or required to correct a device-specific clipping/overlap defect while preserving the same hierarchy.

`mobile/ui-contract.test.cjs`, `DESIGN-STANDARD.md`, and the pinned test-13 branch are release gates. Compilation alone is not visual acceptance.
