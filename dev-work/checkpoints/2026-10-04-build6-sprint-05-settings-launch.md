# Build 6 Sprint 5 — Settings refinement and branded cold launch

Date: 4 October 2026  
Branch: `build/0.9.4-test6-20261004`  
Executable/tested head: `a9bcf1ae0ef5061412d39ce5241fc8e1e64ffdcd`

## Goal

Reduce accumulated Settings clutter and replace the blink-fast timer-based splash behaviour with a deliberate branded cold-launch handoff.

## Settings refinement

Targeted changes only:
- `Privacy & Data` is now `Data`.
- Removed the privacy warning / “Local-first · private by default” card.
- Removed the obsolete “External metadata network access — OFF” row.
- Removed the redundant “Local-first metadata” explanatory block.
- Reduced backup copy to: “Back up reading history and app settings. Credentials are never included.”
- Removed the duplicate local-folder metadata refresh action.
- The Metadata group owns the one canonical Refresh metadata & covers action.

No broad screen redesign was made outside Settings/Data.

## Cold launch

The old launch depended on time elapsed since the JS module was evaluated and could therefore disappear almost immediately by the time the phone rendered it. That mechanism is removed.

Native launch now works as a staged handoff:
1. native splash remains while the editorial font initialises;
2. the React branded launch overlay is mounted;
3. two render frames are allowed before the native splash is released;
4. the canonical Archivist logo and wordmark remain visible for 1600 ms;
5. the branded layer fades for 380 ms into the already-mounted app.

The sequence is one-shot for the mounted app, so normal background/foreground transitions do not replay it. Reduced Motion removes the animated fade.

## Automated evidence

All evidence below targets exactly `a9bcf1ae0ef5061412d39ce5241fc8e1e64ffdcd`.

- **PASS Mobile:** run `37240206121`
  - dependency install
  - Expo Doctor
  - TypeScript
  - **47/47 maintained mobile suites**
  - version consistency
  - production web bundle
- **PASS iOS:** run `37240206154`
  - dependency install
  - Expo Doctor
  - TypeScript
  - native project generation
  - CocoaPods
  - complete iOS Simulator compile

New regression coverage locks:
- removed Settings clutter
- a single metadata refresh action
- 1600 ms branded hold
- 380 ms fade
- native-to-React two-frame handoff
- one-shot launch behaviour
- Reduced Motion handling

## Acceptance boundary

The cold-launch implementation is code/test/native-compile GREEN, but its actual visual duration and transition on Russell's Android Fold have not yet been physically verified. Android APK/emulator/physical cold-start acceptance belongs to the Build 6 release gate; this checkpoint does not falsely claim it.
