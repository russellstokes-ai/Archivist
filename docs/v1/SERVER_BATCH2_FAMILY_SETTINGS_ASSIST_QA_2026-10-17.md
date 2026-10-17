# Archivist Server — Batch 2: Family, Settings and scalable Assist review

**Date:** 17 October 2026
**Repository:** [Draft PR #83](https://github.com/russellstokes-ai/Archivist/pull/83), `integration/archivist-v1-auto-restore-recovery-20261016`.
**Starting source:** `edcfcc02524f9d78bb2a1f48350bcf0b3c893b4e`.
**Source acceptance:** Full server/ARM64/mobile CI **GREEN** at exact code `6336ce166a4d14a254a8ec22231c4ba0534fd5af`. **Commercial release NO-GO**; physical device, NAS, real 16:9 and end-to-end family acceptance are not proven. No installation or merge.

## Delivery and integration

### S8 Family — native 16:9 administration, existing backend
- The server manager now provides a native **Family & access** view instead of requiring owners to navigate to the separate browser for routine profile management.
- Uses existing authenticated owner-only routes **GET/POST /api/profiles**, **POST /api/profiles/{id}/rotate-key**, and **DELETE /api/profiles/{id}**. No duplicate account tables, credential APIs or changed permission policy.
- Lists active/revoked household users and their indexed library-space count. Creating and rotating a user key are deliberate actions with confirmation; revocation warns that sessions end immediately and preserves progress.
- Keys are generated only by the backend and validated as 64-digit hexadecimal, presented **once** in an explicit private text area. They are never sent to localStorage, URL parameters, clipboard automatically, telemetry or status labels. Until the previous key is dismissed, other user mutations are disabled to prevent accidentally losing it; navigating between owner screens preserves an undisclosed key in browser memory for that session.
- Dismissal explicitly clears the textarea and in-memory reference; refresh/sign-out loses an unrecorded key, so the UI reminds the owner to copy it securely. Backend rotation revokes prior sessions.
- Current product policy is preserved: every active User has full access to all indexed library spaces, with separate reading progress, ratings and favourites. Per-space household grants remain a **separate owner policy decision**; this batch does not silently narrow or widen them.

### S10 Settings — native server connection and session inspection
- The manager now provides a native **Server settings** view backed by existing **GET /api/server-info**, **GET /api/sessions**, and owner-protected **DELETE /api/sessions/{id}**.
- Shows currently resolved request address, source/watch/job/session counts and database size as informational **not** proofs of internet accessibility. Session rows show created/expiry times and explicitly confirmed revocation; ending the current session requires logging in again.
- Advanced access/HTTPS, physical source organisation and staged backup controls stay linked to their verified original browser implementations, avoiding duplicate write engines.

### Archivist Assist — work-level filtering before pagination
- **GET /api/manage/review-works** adds bounded, whitelisted `q`, `space`, `format`, `reason` filters. The book-level reason values are `unreviewed`, `unavailable`, `missing-author`, `missing-genre`, `no-selected-cover`; the last one **does not assert** an original file has no embedded art.
- The endpoint counts and pages from the *same SQLite read transaction and grouped relation*. It counts **logical works**, not chapter files; returns all original linked media count/review flags without filtering the file join prematurely.
- Owner-only checks remain unchanged. Unknown filter values and overly long text are rejected. User-controlled input is parameterized, not interpolated into SQL. Published/staged works retain distinct lists; saves still never auto-publish.
- The native Assist screen adds book search, library, media format and review-reason selectors. The server performs matching before paging; Clear restores the full queue without losing the source catalogue.

## Regression scope

New mirrored production Go code: `server_review.go`. New mirrored Go fixture: `server_review_filter_test.go`. Mirrored manager HTML/CSS/JS: `web/manage.html`, `web/manage.css`, `web/manage.js`. Extended owner fake-DOM tests: `scripts/v1-manager-assist.test.cjs`. Every server file above is paired byte-identically under `archivist/app/`; the mobile application is not modified.

Go synthetic tests cover filtered staged/published works, work-vs-file cardinality, fixed reasons, selected-cover wording, title/series matching, space/format restrictions, server-side pagination/total agreement, bad inputs and anonymous refusal, and ensure no assets/grouping are edited. Browser interaction tests cover true existing API calls, owner explicit create/rotate/revoke, key display/dismissal/retention across screen navigation, no browser-storage secret persistence, authenticated session listing/revocation, filter query normalization/reset and regression of existing scanner/cover/preview/undo/Atlas/recovery paths.

## Automated source CI results (exact `6336ce1`)

- [Full server job SUCCESS](https://github.com/russellstokes-ai/Archivist/actions/runs/39055321470/job/117462004189): root and packaged Go tests, owner API/SQLite fixtures, manager browser interactions, source mirror/lock contracts, standalone Docker runtime and Home Assistant add-on smoke.
- [Native Linux ARM64 smoke SUCCESS](https://github.com/russellstokes-ai/Archivist/actions/runs/39055321470/job/117462004037): hosted runner, **not** owner's Pi4.
- [Mobile source regression SUCCESS](https://github.com/russellstokes-ai/Archivist/actions/runs/39055321480): protects unrelated canonical mobile modules, **not** device acceptance.
- [Android-native source checks SUCCESS](https://github.com/russellstokes-ai/Archivist/actions/runs/39055321516). iOS checks were still independently running at this checkpoint. No device APK, Fold, NAS mount, ingress browser or production restore was exercised.

## Remaining commercial gates

This is **functional integration, not complete visual/hardware acceptance**. S7 Organise still uses the verified shared browser safe-file-move UI, and advanced S10 connectivity/restore controls remain linked rather than rewritten. 16:9 desktop browser ergonomics, keyboard and screen-reader acceptance, real Home Assistant ingress, Pi4/4GB SSD, NAS disconnect/power cut/restart and 1000+ mixed comic/audiobook workload acceptance remain outstanding. Existing Mobile/Auto/Play defects and owner-device verification are separate; no APK build, deployment or merge is authorised.

**Acceptance evidence:** the exact final code SHA must be verified against full server CI, native ARM64, manager DOM, Docker/HA and protected mobile CI. Until all required gates are observed, preserve **NO-GO**.
