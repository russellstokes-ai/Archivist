# Archivist Android Auto Workspace

Branch: `feature/android-auto`

This branch isolates Android Auto work from the locked Fold/reference UI (`design/hig-refresh`) and the universal phone layout workspace (`design/universal-phone`).

## Current audit
- Background audio and a MediaSessionService-style service from expo-audio are present.
- Archivist does **not** yet expose a `MediaLibraryService` / `MediaLibrarySession` browse tree.
- The Android manifest does **not** currently declare Android Auto media support.
- Therefore Android Auto support is not yet complete and must not be described as complete in release notes.

## Implementation gate
1. Add a real Android Media3 `MediaLibraryService` / `MediaLibrarySession`.
2. Expose a driver-safe audiobook browse hierarchy from Archivist data.
3. Connect car-host playback commands to the same playback state as the phone app.
4. Support Now Playing metadata/artwork, play/pause, resume, queue and host-appropriate chapter/seek controls.
5. Preserve playback position and queue when moving phone <-> car.
6. Handle server/offline/local audiobook availability cleanly.
7. Only after the service exists, declare Android Auto media capability via `com.google.android.gms.car.application` and `res/xml/automotive_app_desc.xml`.
8. Run Android Auto Desktop Head Unit / compatible emulator tests, then a real-car smoke test before claiming support.

## UI principle
Android Auto owns the driver-safe presentation. Archivist supplies the media library, metadata, artwork and playback actions; it must not mirror the phone/Fold UI onto the vehicle screen.

## Acceptance checks
- App appears in Android Auto media launcher.
- Browse root opens without launching the phone activity.
- Audiobooks/series/library browsing is deterministic and bounded.
- Selecting an item begins/resumes the intended audiobook.
- Now Playing metadata and artwork stay synchronized.
- Play/pause/next/previous/chapter-safe controls work from car hardware and screen.
- Queue/resume state survives disconnect/reconnect.
- Offline and unavailable media states fail gracefully.
- No admin, file-management, metadata-editing or other unsafe non-driving UI is exposed.
