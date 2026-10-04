# Device polish Sprint 8 — Organisation preview safety

Date: 4 October 2026  
Branch: `bugfix/0.9.4-device-pass-20261004`

## Goal

Make organisation preview a trustworthy gate before any local or server file move/copy.

The approved Sprint 8 contract is:
- show **Current → Proposed** paths and the metadata used;
- classify every preview as **Ready / Review recommended / Conflict / Already organised**;
- auto-select only **Ready** items;
- allow Ready items to be deselected/reselected, plus **Select all Ready** and **Clear selection**;
- Apply must act only on explicitly selected Ready items;
- Review/Conflict/Already organised items can never enter the apply batch;
- local and Archivist Server previews use the same safety model.

## Local app implementation

- Added `previewLocalSortSafely()` as the preflight path used by the app.
- Existing target calculation still produces the proposed relative path and metadata summary before any filesystem mutation.
- Current path comparison now uses the item's actual path relative to its configured library root rather than suffix matching.
- Duplicate destinations are scoped by library root, so identical relative targets in two separate roots are not falsely treated as collisions.
- Every affected item in a same-root duplicate target set is marked **Conflict**.
- Ready candidates are preflighted against the real destination tree without creating folders or files.
- Existing destination files are therefore shown as **Conflict** before Apply rather than failing late during the copy.
- Uninspectable destination paths fail closed as **Conflict**.
- Review items retain the scanner's review reason.
- Already-organised items show a clear “Already matches the selected layout” reason.
- The preview UI continues to show Current, Proposed and metadata used inside the existing locked Library management layout.
- Only Ready IDs are initially selected.
- Select all Ready / Clear selection / per-row toggle remain available.
- Apply filters again to both `state==='ready'` and the explicit selected-ID set before invoking the copy engine.
- The existing copy engine still verifies destination creation/size and leaves originals untouched on failure.

## Server / Home Assistant implementation

### Structured four-state batch preview
Server template previews now return, per asset:
- status: `ready`, `review`, `conflict` or `same`;
- current path;
- proposed path;
- title, author, series/position and format used to derive the target;
- a move ID only for Ready items;
- a reason/error for Review or Conflict items.

### Conflict handling
- Already-organised files are returned as `same` instead of a generic move error.
- Metadata-review files return `review` while still showing Current and Proposed paths.
- Duplicate template destinations now mark **all** affected assets Conflict; the first duplicate is no longer left Ready.
- Duplicate targets are scoped by source root.
- Existing destination/pending-target problems are returned as Conflict before apply.
- Stale preview rows for an asset are cancelled when a new template preview is built.

### Explicit apply only
- `applyMoveBatch` no longer treats an empty ID list as “apply every pending move”.
- An empty selection performs no move and returns a selection error.
- The mobile Server preview submits only selected Ready move IDs.
- The browser Server UI now uses the structured batch preview endpoint, auto-selects Ready rows only, supports deselect/reselect, **Select all Ready**, **Clear selection**, and **Apply selected**.
- Browser Clear preview cancels Ready preview records without moving files.
- Root and packaged Home Assistant server sources/web assets remain synchronized.

## Regression coverage

Automated tests now cover:
- local preflight of an already-existing destination;
- exact Already-organised detection;
- same target in different local roots remaining independently Ready;
- same-root duplicate target Conflict;
- Review state exclusion;
- all server duplicate destinations becoming Conflict;
- server Review items retaining Current/Proposed paths;
- server Ready / Review / Conflict / Already organised state coverage;
- empty server selection applying nothing;
- explicitly selected Ready server item applying while Review, Conflict and Already organised files remain unchanged;
- mobile UI contract for four-state labels, preflight and Ready-only apply;
- server browser UI contract for structured batch preview and explicit selection controls.

## UI boundary

No Shelf, Library, Player, Atlas, Comic Focus or general visual redesign was introduced. Changes are confined to the approved organisation-preview controls and information inside the existing Library management / server organisation surfaces.

## Automated evidence

- Server checks run `37223175976`: **PASS** — root/package Go tests, Raspberry Pi ARM64 compile, browser JavaScript syntax, UI contract, HA package contract, source parity and Home Assistant Docker smoke.
- Mobile checks run `37223198069`: **PASS** — dependency install, Expo Doctor, TypeScript, all maintained behavioral/UI-contract suites, version consistency and Expo web export.
- iOS checks run `37223198102`: **PASS** — dependency install, Expo Doctor, TypeScript, native project generation, CocoaPods and full iOS Simulator compile.
- Final mobile executable/test head: `e2a9e9c944b44161659c50564f09948689806f63`.
- Final server/UI-contract head: `b04bfa910f234e3b40e97da7e8b9ea4a8f02b778`.

## Physical acceptance boundary

Physical/device acceptance should still preview a mixed real library and verify:
- existing target files are labelled Conflict before Apply;
- Already organised files are not selected;
- changing Ready selections changes exactly what is applied;
- Review/Conflict rows cannot be selected;
- no source file is altered by Preview;
- local copy failures retain originals;
- server apply moves only the explicitly selected Ready rows.
