# Archivist

Privacy-first self-hosted library for ebooks, audiobooks, comics and PDFs, with media sorting, mobile apps and Home Assistant support.

This repository is an internal foundation checkpoint, not the full release or a public beta. It does not replace an existing installation.

## Implemented

- Go service, local SQLite database and embedded web UI.
- Multiple server folders, assigned to a combined named space or separate spaces.
- Persistent sources/catalogue; repeat scans do not duplicate paths.
- Read-only recursive scanning; no symlink traversal; overlapping roots rejected.
- Unavailable sources retain their catalogue; removed files become unavailable after a successful scan.
- Source removal deletes catalogue entries only, never original media.
- Search and space filtering, Light/Dark/System appearance, anchored navigation and audio controls.
- Authenticated byte-range access to original files. Audio plays where supported by the browser.
- Initial reader APIs and web reader for EPUB text, CBZ images and PDF canvas rendering with local PDF.js assets.
- Per-profile reading progress for reader assets, with revision conflict rejection.
- Local-only starter recommendations: unstarted, accessible catalogue items only; no external calls.
- Native Expo source foundation for iOS/Android login, library list, tabbed shell, reader WebView handoff, player screen and direct audio playback wiring.
- Initial Home Assistant add-on wrapper for HAOS/Pi deployment, with ingress/port config and persistent `/data` database path.

## Run

With Go 1.25 or later:

```sh
go test ./...
go build -o archivist .
./archivist -data ./data
```

Open http://127.0.0.1:5056 and paste the temporary local access key printed by the server. Keys change on restart. The service intentionally binds only to loopback until household authentication and remote-access security are complete. Do not add a public reverse proxy to this checkpoint.

Choose Folders. Enter an absolute folder path on the machine running the server, and a space name. Add more folders with the same name to combine them, or different names to separate them. Scan each source. Mounted network drives must already be accessible to the server. The database must remain on local storage.

## Deliberate limits

This checkpoint catalogues individual files, using embedded EPUB titles where available and filenames otherwise. Users can explicitly group selected files into a work. Audio files form one naturally ordered edition; each ebook/comic/PDF remains a separate edition. Automatic match suggestions are not yet implemented. Folders can be entered or chosen with the server folder browser. Search returns at most 500 files. Scans run through a persistent serial background queue. Interrupted jobs restart from the source root; folder traversal and EPUB reads are staged outside the database transaction; requests can still wait during the final catalogue commit. Scan cancellation and incremental checkpoints remain outstanding. Files moved to a different path do not yet retain identity automatically.

Reader support is an early integration, not the final release reader. EPUB is parsed to safe text paragraphs only; original typography, images, tables, footnotes and robust CFI-style location are not complete. CBZ page display is implemented; CBR is explicitly unsupported. PDF rendering uses bundled `pdfjs-dist` 6.3.289 files under `web/vendor/` and must retain its licence notices. Comic Speech focus, the Google Play Books-style double-tap speech-bubble cutout zoom, is specified in `COMIC-SPEECH-FOCUS.md` but not implemented.

Native mobile source now exists under `mobile/`, but no APK/IPA has been built or signed here. The server still binds to loopback, so production device connectivity requires the release-grade HTTPS/remote-access layer. The mobile shell now has Shelf, Player, Reader, Atlas and Settings tabs, light/dark/system appearance, a mini-player anchored above navigation, and player/reader/Atlas placeholders shaped for the release product. Offline downloads, native queue/progress reconciliation, app-store packaging, device interruption testing and polished iOS/Android UI remain outstanding. Atlas, Insights, plugins, packaging, final covers and the approved animated player integration remain incomplete.

Home Assistant packaging is now staged under `home-assistant/archivist`. `scripts/package-ha-addon.sh` creates a self-contained add-on zip by copying the Go/web source under the add-on build context. `scripts/package-ha-repository.sh` creates a repo-style archive containing `repository.yaml` and the add-on folder. The add-on runs Archivist on `0.0.0.0:5056` with `-allow-lan`, maps `/media`, `/share` and `/backup`, and stores the SQLite database under `/data` by default. `/healthz` is exposed for the Supervisor watchdog. This has been packaged locally but not installed into a real HAOS Supervisor.

The UI is a functional foundation, not the approved full-polish release. The navigation exposes only implemented destinations. Database schema is initial/internal; upgrades from older unrelated Archivist organisers are not supported.

## Next work

1. Read concurrency during final scan commit, pagination, grouping suggestions, household-scoped progress and expanded metadata.
2. Finished owner onboarding and full remote-access hardening.
3. Install and validate the HAOS add-on on Raspberry Pi 4, including ingress, mapped media paths, restart persistence and log display of the owner key.
4. Finish reader fidelity, Speech focus, native offline downloads and mobile-background-audio validation.
5. Atlas scale benchmark and Obsidian-level interaction quality.
6. Integrate approved layouts, actual brand masters and motion after the media contracts are stable.

## Ownership

Archivist application source is proprietary. See `LICENSE.md`. No open-source licence grant is implied. Third-party dependencies retain their own licences. A dependency/notice review is required before distribution.

## Grouping

In Library choose Select files to group, select related files, enter a book title, then Create book. Grouped books exposes editions and ordered audio tracks. Ungroup removes the relationship, not source files. Selecting files already grouped reassigns those selected files to the new book. Grouping is restricted to one space. Grouped audio editions now have Continue audiobook, automatic next-track playback and saved track/second positions. Selecting an individual track deliberately starts that track at zero.

## Playback progress limits

Progress is stored per profile and edition. Existing owner progress migrates to the owner profile. Household progress is separated by profile. The controller saves approximately every five seconds and on pause/seek, with a local checkpoint on page exit. A stale server revision is rejected rather than silently overwriting another session; reopen to load the current server position. A failed save stops further sync for that open session and retains a local checkpoint. Retry/reconciliation UI, durable offline outbox, device audio interruptions and native lock-screen controls remain outstanding. Browser audio codec support is required. Ungrouping removes edition-linked progress; regrouping may invalidate earlier edition checkpoints. These actions are not yet suitable for a production library with reading history.

## Household access

The owner can create household profiles in Folders, selecting the existing spaces each can access. A random profile key is displayed once; its hash is stored on the server. Members unlock using their own key. Members can browse and play permitted content and save their own progress, but cannot manage sources, scan jobs, grouping, profiles or server folders. Revocation rejects subsequent requests. Switching profiles signs out and reloads the interface. Browser progress checkpoints are namespaced by profile; shared-browser storage is not a secure vault against someone with developer tools or local-machine access.

The owner bootstrap key remains temporary and printed at launch. Member keys persist until revoked. These are internal access-key credentials, not the finished owner onboarding, password/device-session or remote-access product. Existing in-flight streams are not forcibly terminated on revocation. Grant editing and member key rotation are implemented. No external deployment is supported yet.

## Release contract

This source archive is an internal development save only. It is not a beta release, installation recommendation or release-ready product. The target remains the coordinated full server/web/iOS/Android release and all agreed UI polish. Completion requires the specification's security, reliability, accessibility, device, installer and store-distribution checks. Passing the current automated tests does not satisfy those gates.

## Account sessions

Successful unlock now issues an independent random session token, not the access key itself. Server-side sessions expire after 30 days; explicit sign-out invalidates the server session. My sessions lists the current profile's sessions and permits revoking them. Owner sessions become invalid after a server restart because the bootstrap owner key changes. Member key rotation invalidates existing member sessions and the old credential. Keys and session tokens are stored as hashes; no password authentication is introduced by this change.

Owners can edit each profile's spaces, replace its key, or revoke access. Space edits are transactional; an invalid space does not erase earlier grants. Changes apply to subsequent requests, not already transferred/downloaded data or in-flight responses. Transport security, login abuse controls, secure remote cookies, user-friendly password onboarding and real mobile session management remain release blockers. The service remains loopback-only.

## Reader, recommendations and mobile checkpoint

Reader endpoints are permission checked against the active profile's allowed spaces. Reading progress is stored per profile and asset. Recommendations are deliberately local and permission filtered before ranking; they must never contact the internet, send reading history out, or recommend titles the active profile cannot access. `PRIVACY-AND-MONETISATION.md` records the privacy rule and the Obsidian paid-feature review.

The mobile app currently validates as source and bundles JavaScript for both platforms, but it is not a release build. It uses secure local session storage, rejects non-HTTPS server URLs except local development hosts, passes a bearer session into the reader WebView, and wires native audio playback metadata/background settings. The current app shell is for product-shape review, not beta distribution. Real Android/iOS device testing, store builds and release security are still blockers.
