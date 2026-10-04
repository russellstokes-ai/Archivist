# Device polish Sprint 9 — Cover Management

Date: 4 October 2026  
Branch: `bugfix/0.9.4-device-pass-20261004`

## Goal

Finish the approved Cover Management workflow inside the existing metadata editor without redesigning the locked UI.

Sprint 9 requirements:
- use the native/system image picker rather than raw URI entry;
- single-image selection only;
- immediate preview before Save;
- ranked local/scanned artwork alternatives;
- manual cover precedence that survives rescans;
- explicit restore to scanned metadata + cover;
- hard 25 MB cover limit;
- no broad photo-library permission request;
- safe, durable, non-overwriting app-private persistence for a device-picked image.

## Existing UI retained

The existing **METADATA & COVER** editor remains the only cover-management surface. No new navigation or layout was added.

It continues to show:
- the current cover preview;
- **Choose image from device**;
- **Other local artwork**;
- **Save details**;
- **Use scanned metadata & cover**;
- **Cancel**.

All non-targeted Shelf, Library, Player, Reader, Atlas, Stats, Profile, Settings and Fold layout remains locked.

## Completed implementation

### Privacy-preserving system picker
- Cover selection continues through Expo's system image picker.
- Picker is constrained to images and `selectionLimit: 1`.
- Archivist does not call `requestMediaLibraryPermissionsAsync`; no broad photo-library permission request is introduced.
- Picker cancellation returns without changing the pending cover.
- Picker errors are reported without changing the saved manual cover.

### 25 MB enforcement
- Added a dedicated `coverManagement.ts` implementation rather than relying on UI-only checks.
- The selected file is inspected before it becomes the pending preview.
- Archivist uses the larger verified value when picker metadata and filesystem size disagree, so an understated picker value cannot bypass the cap.
- An image whose size cannot be verified is rejected rather than accepted optimistically.
- A selected image over 25 MB is rejected before persistence.
- The durable copied file is checked again after copy.
- A copied file over the limit, missing after copy, or with a size mismatch is removed and the manual-cover save fails safely.

### Durable manual covers
- Device-picked covers are copied to Archivist app-private `Documents/covers/` storage before becoming a manual override.
- Archivist no longer falls back to persisting a temporary picker URI when app-private storage is unavailable; the save fails instead.
- Destination paths are checked before copy.
- Timestamp collisions receive an unused suffixed path, so an existing app-private manual cover is never overwritten.
- Failed persisted copies are cleaned up.

### Ranked local artwork
- Local/scanned candidates are de-duplicated while preserving scanner discovery ranking.
- If the currently selected scanned cover is one of the candidates, it is shown first.
- A protected manual cover is not injected into the **Other local artwork** list.
- Selecting an existing local candidate previews it immediately and saves it as the manual cover choice without altering the editor layout.

### Rescan protection and restore
- Local manual-cover choice remains part of the persisted `LocalMetadataOverride`.
- Scanner behavior continues to give a manual cover precedence over discovered artwork.
- Background cover enrichment fills only blank covers and cannot overwrite an existing/manual cover.
- **Use scanned metadata & cover** removes the manual override and rescans, restoring the scanner's highest-ranked artwork and metadata.
- Grouped local works continue to apply the saved manual override to the intended member files.

## Behavioral regression coverage

New `cover-management.test.cjs` verifies:
- picker cancellation produces no cover selection;
- malformed/empty picker results produce no cover selection;
- single valid selection is accepted;
- exact 25 MB boundary;
- oversized selection rejection;
- missing-size fallback to filesystem inspection;
- unverified-size rejection;
- understated picker size cannot defeat a larger filesystem size;
- current scanned candidate ranking and candidate de-duplication;
- manual current cover is not injected into scanned alternatives;
- durable app-private copy;
- extension preservation;
- pre-copy oversized rejection;
- failed copy verification cleanup;
- non-overwriting timestamp collision handling;
- failure when durable app storage is unavailable.

The local-library suite additionally verifies:
- manual cover survives a rescan;
- manual metadata remains manual/high-confidence;
- deleting the manual override and rescanning restores sidecar/scanned metadata;
- deleting the manual override restores the highest-ranked scanned cover;
- background enrichment cannot replace an existing/manual cover.

The UI contract verifies:
- system image-picker integration;
- no broad media-library permission request;
- single selection;
- pre-preview size inspection;
- app-private persistence;
- 25 MB durable-copy verification;
- ranked alternative artwork;
- immediate preview;
- manual-cover protection and restore control.

## Automated evidence

- Mobile checks run `37224583681`: **PASS** — dependency install, Expo Doctor, TypeScript, all maintained behavioral/UI-contract suites including Sprint 9, version consistency and Expo web export.
- iOS checks run `37224583776`: **PASS** — dependency install, Expo Doctor, TypeScript, iOS project generation, CocoaPods and full iOS Simulator compile.
- Sprint 9 executable/test head: `503d199be16e51e88aad61441408912305d32381`.

## Physical acceptance boundary

Still verify on real iOS/Android devices:
- system picker presentation and cancellation;
- normal JPEG/PNG/HEIC selection from the platform picker;
- immediate preview before Save;
- selected manual cover after app process kill/relaunch;
- selected manual cover after rescan;
- choosing another local candidate;
- **Use scanned metadata & cover** restoration;
- over-25-MB rejection with a real provider file;
- phone/Fold light/dark visual treatment and accessibility focus.

No physical-device completion claim is made by this checkpoint.
