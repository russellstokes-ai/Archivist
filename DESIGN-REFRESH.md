# Archivist HIG-Informed Design Refresh

**Branch:** `design/hig-refresh`  
**Method:** screen-by-screen, small commits, preserve existing React Native/Expo architecture.  
**Reference:** Apple Human Interface Guidelines used as a craft/accessibility baseline; Android conventions remain authoritative for Android-specific behavior.

## Standing development workflow

- Draftbit is the primary interactive development and review environment for Archivist app work.
- GitHub is the source of truth for committed code.
- Draftbit target: repository `russellstokes-ai/Archivist`, branch `design/hig-refresh`, app folder `mobile`.
- App changes are made in small commits, then reviewed with **Sync → Preview** in Draftbit.
- Keep the existing React Native/Expo architecture and native integrations intact.
- Use the connected-repository workflow rather than creating a second imported copy.

## Status

| Stage | Area | Status | Commit |
| --- | --- | --- | --- |
| 0 | Canonical design standard | Done | `c3b93648` |
| 1 | Shelf hierarchy + accessible control targets | Done | `64d54a3a` |
| 2 | Library composition and filters | Next | — |
| 3 | Living Player | Planned | — |
| 4 | Reader + Comic Focus | Planned | — |
| 5 | Atlas | Planned | — |
| 6 | Insights + Rewards/Profile | Planned | — |
| 7 | Settings/onboarding/sheets/error states | Planned | — |
| 8 | Fold/open-width and enlarged-text acceptance sweep | Planned | — |

## Stage 1 changes

- Continue Reading/Listening now appears before secondary metadata/scan maintenance notices.
- Scan progress is an inline status band instead of another rounded card.
- Common interactive controls that were below the 44dp quality baseline were enlarged to a 44dp minimum hit area.
- Shelf arrangement switch keeps its compact visual track but gets a larger invisible hit target.
- Pressed card feedback is less visually harsh.
- Existing palette, typography, navigation model and content-led Shelf design are preserved.

## Review rule

A stage is not visually accepted merely because CI passes. Review it in Draftbit Preview (phone and wide/Fold widths where possible) and, later, on the physical Galaxy Fold.

Check:
- first viewport and content hierarchy;
- alignment and clipping;
- scrolling;
- light/dark appearance;
- long titles and missing covers;
- enlarged text;
- loading/empty/error/offline states;
- touch targets and obvious control states.

## Draftbit connected-repo workflow

For continuous review, connect Draftbit directly to the repository rather than relying on the one-time imported copy.

- Repository: `https://github.com/russellstokes-ai/Archivist`
- Main branch for design review: `design/hig-refresh`
- App folder: `mobile`

When a new design commit is pushed:
1. Open the connected Archivist app in Draftbit.
2. Click **Sync** in the top bar.
3. Wait for the workspace to refresh.
4. Open **Preview**.
5. Review the screen named in this file's latest completed stage.
6. Do not use **Migrate** unless a separate migration copy is being tested.

If Draftbit shows **Resolve sync**, resolve the conflict before saving anything back to GitHub.
