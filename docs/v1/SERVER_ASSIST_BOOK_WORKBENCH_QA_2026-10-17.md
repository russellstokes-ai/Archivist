# Archivist Server — Archivist Assist 2.0 book-level workbench QA and handoff

**Date:** 17 October 2026
**Scope:** Item 1 of the final commercial server checklist (unified book-level Archivist Assist workbench).
**Repo / draft:** [russellstokes-ai/Archivist PR #83](https://github.com/russellstokes-ai/Archivist/pull/83), `integration/archivist-v1-auto-restore-recovery-20261016`
**Base:** `9d2d932e8d7287849ea1a2e59a7444440d5bfcd4`
**Source commits:** `818b1f9304e905e17880bb2d03571ef717222b95`, `503dbe93f4fb038b5854f7088c057e636e35d24f`, `9a4c78425bd70eec3bab3a344548759562ce2b1d`, `9663d00b82cd1cf3232fa661f142bfa8672f76d6`, `3a5ab6409f67d1ea92486cdc5e032c755b252b51`, `c4555d9837420823a954468abe4d2e889828f95d`, `a0ef0747569a52e2647bfc76ffef4c34bbd21b15`.
**Approval:** All changes remain on an unmerged draft. No production HA add-on/NAS container or APK was built or published from this work.
**Development decision:** Item 1 **source-complete/CI-testable**, subject to the exact-head CI result and real browser/device acceptance. Entire server commercial release remains **NO-GO**.

## Deliverables

1. **Genuine logical-book editor:** owner-only `GET /api/manage/works/{id}/metadata` returns one work (not one physical file), up to 100 editions and a bounded 5,000-media member snapshot with format, counts, availability, review counts, cover digest, publication state and persisted revision. `GET /api/manage/works/{id}/media` provides paged ordered edition/chapter details and a book fingerprint. Per-track editing still uses the established file editor; no unsafe rewrite of user media or unverified work regrouping.
2. **Book-level fields:** 12 independently editable/lockable values: title, author, series, fractional series/issue number, genre, work publication year, narrator, publisher, ISBN, ASIN, language and description. Book-level overrides are durable SQLite records, separate from original file/chapter metadata. Verified title/author/series/genre overrides are reapplied **inside the scanner's atomic grouping transaction**, so ordinary rescans cannot silently replace them.
3. **Conflicts and provenance:** file-derived book-level values disclose missing or conflicting chapter evidence instead of selecting an arbitrary answer; overrides record manual origin or **owner-selected unverified Open Library** origin. Field-level lock/unlock snapshots and historical changes have monotonic revisions; old physical file values remain available for comparison. Numeric scanner confidence is originally file-level and is not claimed to be per-field certainty.
4. **Preview → confirmation → atomic apply:** owner-only `POST /api/manage/works/{id}/metadata/preview` and `/apply` provide a ten-minute HMAC-receipted proposed field diff and independently recheck the live work, cover/publication revision, indexed chapters/file metadata/revisions and locked fields. Stale, tampered, expired, replayed and unconfirmed changes fail rather than overwrite another editor. JSON is single-object/known-fields only, with a strict 256 KiB cap; long legitimate descriptions remain supported.
5. **Reversible last-save:** a bounded 25-entry audit history with per-field before/after values and a separately previewed/signed `undo-preview` / `undo` restores the most recent successful book-wide save if the work has not been modified, locked or republished since. Undo itself creates a new monotonic revision; no file, bookmark or publication change is implied. This is deliberate **last-save undo**, not arbitrary multi-version time travel.
6. **Publication and cover:** existing explicit publish/unpublish and selected-cover routes are available from the new editor. The editor refuses work-level field changes while published until the owner deliberately unpublishes; existing file-level workflow still handles chapter-specific metadata. Selected covers can be uploaded or cleared; physical on-disk artwork is untouched.
7. **Premium desktop layout:** Library Manager → Archivist Assist → **Edit book** opens a wide two-pane book metadata, candidate comparisons, editions/chapters, cover/publication, history/undo workspace. Responsive rules collapse the panes on smaller browsers. The editor remains open after successful Save, and the user can refresh the latest state. All dynamic text is rendered as text content, not injected HTML.
8. **Real client integration:** book-level year and fractional issue/series position now appear in the published `/api/works` record. Book-level year controls published year filtering and Library/Atlas year-ring counts without overwriting edition's physical year. Empty explicit book year does not silently inherit an earlier file-level year.

## Regression and safety matrix

### Existing Go / SQLite fixture coverage

- Multi-part audio is represented by one work; media/editions are paged by original IDs and natural chapter position; household bookmarks retain their original asset/edition and time.
- Explicit work fields survive scanning and SQLite DB reopening; a work-wide change does **not** rewrite per-file metadata and cannot accidentally publish.
- Signed previews bind owner-selected candidate values, old/new diff, work ID, revision, fingerprint and expiry. Replays/tampering/stale field locks and modified source member metadata are blocked.
- Lock/unlock revisions and conservative file-derived conflicts; two editions with conflicting dates do not produce a guessed work year.
- Forced SQLite failure during history insertion rolls back all work fields and revisions; clean retry succeeds.
- Undo preview restores previous core and extended values without rolling back source media or household playback.
- Published `/api/works` year filtering and Atlas/library year aggregation honour explicit book-wide dates. Fractional issue/series number is preserved; invalid `NaN`, infinities, duplicate field names and out-of-range values are refused.
- Big signed diffs containing legitimate ~20,000-byte descriptions pass within 256 KiB, and over-limit requests are rejected without changing data.
- Anonymous and household profiles cannot enter the server administration APIs; writes still require the existing action header / CSRF gate.

### Browser-manager integration coverage

- The actual `web/manage.js` code loads a logical book from an Assist card, shows real edition/chapter records, selectively accepts candidate values, and uses the signed preview and explicit server save / undo routes.
- A delayed response to a preview cannot re-enable Apply after the user changes a field in the same dialog.
- A successful server save followed by a failed UI refresh is truthfully reported as *committed but refresh failed* rather than *save rejected*; Reload book recovers the displayed current version.
- Selected cover removal uses the original owner-only DELETE endpoint and cannot change cover UI state before the server confirms success.
- Existing queueing, review/publishing, scanner controls, grouped relink and original file metadata editor remain covered by their prior regressions.
- Root web/Go source equals the packaged `archivist/app` copies under the existing CI parity and protected-source checks.

## Acceptance limits (explicit)

- **Not a complete replacement for the specialised media editor:** owner-manual group/edition regrouping, creating/deleting editions, chapter reordering, issue-gap detection, specialist comic catalogue import and cross-drive moves belong to checklist item 3/5.
- **Metadata intelligence expansion is item 2:** Open Library is an optional user-initiated provider in the editor. Multi-source candidates, ISBN/ASIN authoritative cross-checking, explainable per-field confidence and comic-specific matching remain outstanding. Stored legacy/source confidence cannot be presented as an independent statistical guarantee for each work-level field.
- **Actual browser QA remains outstanding:** desktop 1920x1080, Home Assistant ingress and small viewport accessibility/keyboard/focus management must be accepted with real environments, not only fake-DOM tests.
- **Hardware and production remain NO-GO:** Raspberry Pi 4, NAS SMB/NFS, backup/restore, credential revocation, real library data and production packaging are later checklist gates.
- **No mobile modifications:** all changes are to the existing server app, server UI, mirrored package, tests and documentation. Mobile scanner, mobile Archivist Assist, Living Book renderer and approved canonical UI/assets are protected.

## Handoff

With an exact green Go/server/ARM64 + manager contract run on the final source and no regression, **item 1 is ready for the next source-development item**. Do not equate source-complete with 100% real-device commercial acceptance. Next item: **advanced metadata intelligence** — opt-in provider adapters, candidate ranking with explicit reasons, better author/title/ISBN/ASIN disambiguation and specialist comics matching, while preserving this workbench's revision/lock/preview protections.
