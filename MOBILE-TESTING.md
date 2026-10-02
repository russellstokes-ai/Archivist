# Archivist 0.9.2 mobile acceptance

This is the hands-on checklist for the installable Android testing APK. Automated CI is necessary but does not replace real-device acceptance.

## Testing APK

Run **Actions → Android Test APK → Run workflow** on `dev/archivist-work`.

Successful output:

- artifact: `Archivist-0.9.2-Test-APK`
- APK: `Archivist-0.9.2-test.apk`
- checksum: `Archivist-0.9.2-test.apk.sha256`

The APK is an optimized release variant signed with the repository debug key. It is for testing only.

## Connection

Archivist works locally without a server.

To add a server, use a dedicated trusted HTTPS origin. Do not use the Home Assistant sidebar/ingress URL. Port 5056 is plain HTTP unless placed behind a trusted TLS reverse proxy. The app stores server credentials in SecureStore, rejects redirects, times out failed API calls and preserves the local library if the server is unavailable.

## Galaxy Fold acceptance

Test both closed and open states without restarting the app:

1. Shelf scrolls vertically and retains position after opening/closing the Fold.
2. Library changes cleanly between compact and wide layouts with no clipped controls.
3. Atlas can pan, pinch, focus and inspect nodes in both layouts.
4. Living Player uses the wide layout when open and compact layout when closed.
5. Reader toolbar/content/tool sheets remain usable.
6. Bottom navigation, mini-player and modal sheets respect safe areas.
7. The keyboard does not hide metadata, Smart Shelf or server fields.
8. Light, dark and system themes retain readable contrast.

## Playback acceptance

Use single-file and multi-file audiobooks:

- play/pause/seek and deliberate rewind;
- background playback and lock-screen transport;
- headset/Bluetooth controls and interruption handling;
- speed, chapters, queue and bookmarks;
- native sleep timer while locked;
- force-stop/relaunch and durable resume;
- switch family profile and confirm no progress leakage.

## Reader acceptance

Use representative ebook, PDF and comic material:

- restore reading position after relaunch;
- bookmarks, highlights, notes and search;
- appearance settings;
- comic manual zoom and Comic Focus Zoom fallback;
- page-turn/reduced-motion behaviour;
- offline copy while server is unavailable;
- corrupt/unsupported material fails clearly rather than hanging.

## Source coexistence

With local folders, a connected server and downloaded server content:

- All shows one logical work rather than online/offline duplicates.
- Device / Server / Downloaded filters are accurate.
- Local reading/playback continues if the server is lost.
- Removing a download does not delete the server original.
- Signing out does not delete the local catalogue.

## Home Assistant / Pi acceptance

On the intended Pi/Home Assistant system:

- install/update Archivist 0.9.2 and restart it;
- confirm database/catalogue persistence;
- add multiple folders through the browser;
- enable a watched source and verify scheduled refresh;
- leave a media drive asleep and confirm opening the dashboard does not wake it;
- download a backup, stage restore in a disposable instance, restart and confirm recovery;
- create/revoke/rotate a family user;
- connect externally over the intended DuckDNS/Tailscale HTTPS setup;
- test OPDS with a compatible client.

## Production publication remains separate

A successful testing APK does not complete Google Play publication. Production release still requires private production signing, AAB generation, Play Console testing, policy/privacy/store assets and final device screenshots.
