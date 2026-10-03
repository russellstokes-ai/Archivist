# Archivist 0.9.3 mobile acceptance

This is the hands-on acceptance checklist for the universal iOS + Android mobile candidate.

Automated CI is necessary but does not replace real-device acceptance.

## Current source

- Active mobile branch: `design/draftbit-universal-phone`
- App folder: `mobile`
- Locked Fold/open visual reference: `design/hig-refresh`
- Current engineering evidence: `TESTING-READINESS.md`
- Approved UI state and ownership boundaries: `CURRENT-UI-HANDOFF.md`

Atlas and comic double-tap focus may be under a separate Astra/Work stream. Do not use this checklist to overwrite that active work.

## Android testing build

Run **Actions → Android Test APK → Run workflow** on `design/draftbit-universal-phone` when a fresh device candidate is explicitly wanted.

Expected artifact naming:

- artifact: `Archivist-0.9.3-Test-APK`
- APK: `Archivist-0.9.3-test.apk`
- checksum: `Archivist-0.9.3-test.apk.sha256`

The testing APK is an optimized release variant signed with the repository test/debug key. It is not a Google Play production artifact.

Do not treat an older APK from `main`, `dev/archivist-work` or an earlier UI commit as acceptance of the current universal-mobile candidate.

## iOS build validation

The **iOS checks** workflow:

- installs the Expo 55 dependency set;
- runs Expo Doctor and TypeScript;
- generates the iOS native project;
- installs CocoaPods;
- compiles an unsigned iOS Simulator build.

A successful simulator compile is an engineering gate only. Production/TestFlight distribution still requires Apple signing, provisioning, App Store Connect and real-device checks.

## First launch and local library

Test the app without a server first.

### Android

- **Add device folder** through Storage Access Framework.
- Scan a real nested Books/Comics/Audiobooks tree.
- Force-stop/relaunch and confirm the linked folder remains usable.
- Remove the source from Settings and confirm the original media files remain untouched.

### iOS

- **Import folder** through the native Files picker.
- Test local Files, iCloud Drive and another available document provider.
- Confirm the imported hierarchy appears in Archivist.
- Force-stop/relaunch and confirm Archivist still reads its persistent private copy without requesting the original directory again.
- Remove the imported source and confirm only Archivist's private copy is deleted; the original Files/iCloud folder remains untouched.
- Confirm Archivist's Documents area is visible in the Files app.

For both platforms:

- test multiple folders;
- long/deep paths;
- missing artwork;
- malformed sidecars;
- folder names containing spaces and punctuation;
- scan interruption/retry;
- metadata overrides surviving rescans;
- safe organisation preview/apply/recovery.

## Universal UI acceptance

Review light and dark appearance at:

- narrow phone around 320–359dp;
- ordinary phone around 360–429dp;
- large phone / Fold closed 430–599dp;
- Fold/open 600–759dp;
- wide/tablet 760dp+.

Check:

- Shelf hierarchy, recommendations, series stacks and format chooser;
- Library source/folder navigation, filtering, grouping and empty/offline states;
- Settings including Backup & Restore and source removal;
- Profile/Rewards/Stats;
- long titles, long author/series/folder/server names;
- missing artwork;
- keyboard and safe-area behaviour;
- loading, empty, inline-error, offline and server-unavailable states;
- Increased Contrast, Larger Interface Text and Reduced Motion;
- VoiceOver/TalkBack focus order.

The 600dp+ Fold/open reference is locked. Phone adaptations must not silently redesign it.

## Player acceptance

Live Player / Now is locked for the current polish phase; test it for regressions rather than redesigning it.

Use single-file and multi-file audiobooks and verify:

- play/pause/seek and timed skips;
- background playback and system/lock-screen transport;
- headset/Bluetooth controls and interruption handling;
- speed, chapters, queue and bookmarks;
- sleep-timer behaviour while foregrounded, backgrounded and locked;
- force-stop/relaunch and durable resume;
- offline playback;
- fold/unfold without lost playback state;
- profile switching without progress leakage.

**Do not mark native/background sleep-timer reliability complete until it is demonstrated on both target platforms.**

## Reader acceptance

Use representative EPUB, PDF, CBZ, CBT and CBR material plus malformed/large archives.

Verify:

- restored reading position after relaunch;
- bookmarks, highlights and notes;
- appearance settings;
- page-turn / Reduced Motion behaviour;
- offline copy while server is unavailable;
- corrupt/unsupported material fails clearly rather than hanging;
- memory use on large EPUB/comic archives.

Current platform-specific archive capability must match `TESTING-READINESS.md`. In particular, do not infer iOS CBR support merely because Android's native RAR bridge works.

Atlas/comic-focus visual acceptance should follow the active Astra/Work handoff if that stream is still in progress.

## Offline downloads

Test server works on both platforms:

- start a download and interrupt network/app activity;
- confirm paused/interrupted state is visible;
- resume successfully;
- relaunch with partial state present;
- discard a partial download and confirm server originals are untouched;
- remove a completed offline download and confirm server originals are untouched;
- fill storage near capacity and verify clear failure/recovery;
- use **Clean up storage** with orphan/missing data.

## Backup and restore

Test the finished mobile file flow:

- **Save backup file** to a local/system file destination;
- restore with **Restore from file**;
- cancel the share/document picker;
- restore invalid and oversized JSON;
- use the **Manual JSON backup** fallback;
- verify server credentials/access keys and device-local profile-photo paths are not transferred.

## Server connection and household

Use a dedicated trusted HTTPS origin. Do not use the Home Assistant sidebar/ingress URL as the mobile API origin.

Test:

- LAN/trusted local address where intentionally supported;
- Tailscale/secure private route;
- intended DuckDNS/reverse-proxy HTTPS route;
- saved-server retry after outage;
- server offline → downloaded/local fallback;
- Admin/User separation;
- user revoke/rotate;
- two simultaneous household profiles with no progress/rating leakage.

Do not disable certificate validation to make a test pass.

## Home Assistant / server acceptance

On the target Pi/Home Assistant system:

- install/update Archivist 0.9.3 and restart it;
- confirm database/catalogue persistence;
- add multiple folders through the browser;
- enable a watched source and verify scheduled refresh;
- leave a media drive asleep and confirm opening the dashboard does not wake it;
- download a backup, stage restore in a disposable instance, restart and confirm recovery;
- create/revoke/rotate a family user;
- connect externally over the intended trusted HTTPS path;
- test OPDS with a compatible client.

## Production publication remains separate

A successful test APK or iOS Simulator build does not complete store publication.

Android production requires private signing, AAB generation, Play Console internal/closed testing, policy/privacy review and final store assets.

iOS production requires Apple signing/provisioning, App Store Connect/TestFlight review, privacy declarations and final store assets.
