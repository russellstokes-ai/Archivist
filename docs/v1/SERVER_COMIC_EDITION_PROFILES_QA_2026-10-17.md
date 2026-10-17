# Archivist Server — Comic edition and volume identity ledger: source QA

**Date:** 17 October 2026  
**Repository:** [russellstokes-ai/Archivist, draft PR #83](https://github.com/russellstokes-ai/Archivist/pull/83)  
**Current implementation source:** `07776dca312ff238ae235d0a1d1380f9d93af5cb`  
**Protected parent:** `ccbbfcf58bbbfb1b15f0674a39ffaa69928d4e8d`  
**Outcome:** Source code and automated server/ARM64 checks **GREEN**. **Production / commercial NO-GO** until physical Pi/NAS/HA ingress, real-browser and external catalogue acceptance. No merge, release, APK or production migration.

## Purpose and product boundary

Existing works, editions, file assets, family progress and scanner grouping remain unchanged. The owner can now register **verified attributes of an existing comic edition**, independently of the book-level metadata editor. This avoids the dangerous assumption that a shared series title or issue number proves the same volume, publication run, printing or variant.

The server adds an owner-only durable table `comic_edition_profiles` keyed to the original `editions.id`, with fields: **series run, volume number, issue number (up to three decimal places), imprint, edition/cover variant, edition year and freeform notes**. Revision and last update time are persistent; `comic_edition_profile_history` retains up to 25 recent edit/undo operations per edition. Both tables live inside the same SQLite database and are included in a normal database snapshot/restore.

The new controls appear inside the existing **Archivist Assist → Edit book → Comic series & issue evidence** workbench. The owner chooses an existing edition, edits labels, inspects a signed old/new preview, then explicitly confirms Save. The owner can separately preview and confirm undo of the most recent Save. The editor remains open after Save; a failed post-Save UI refresh is reported as **committed, refresh failed**, never misrepresented as a failed transaction.

**Not implemented in this slice:** moving files, changing edition membership, automated work merging, deleting works, reordering chapters, renaming original media, automatic issue assignment, or modifying family reading progress. These must be independently designed and tested before any future write routes are permitted.

## Transaction and validation contract

- Only authenticated owner sessions may read or edit the edition ledger. Mutations require the server's existing action/CSRF marker and **a single strictly decoded known-fields-only JSON object**, bounded to 256 KiB.
- A Save must be for a **staged**, **available**, **single-file**, **Comic-only** edition that belongs to the selected logical work. Published books must be explicitly unpublished first; offline and multi-file comic editions remain inspectable but not editable.
- The preview binds original work fingerprint, original edition ID, current per-edition revision, old and proposed labels, exact diff, action and 10-minute expiry to a server HMAC. Apply checks signature, expiry, ownership, correct route, current catalogue/cover/member fingerprint, source availability, edition identity, revision and proposed diff **again inside a transaction**.
- A late SQLite write failure, including forced history insert failure, rolls back both the labels and revision. Every confirmed Save increments the revision; replayed or stale previews fail. Undo has its own signed receipt and checks the latest successful Save and exact saved identity; it is not arbitrary unbounded history rollback.
- Volume is canonicalised as an integer 0–10000; issue as a finite number 0–100000 with up to three decimal places; year is either blank or 1000–3000. All text is UTF-8 and byte-length bounded. Control characters are rejected except line breaks/tabs in optional edition notes. Fields may be deliberately cleared.
- If a pre-labelled edition is subsequently moved into a different logical work outside this workflow, the ledger **refuses silent adoption** until a separately verified reconciliation. Root and packaged sources remain byte-mirrored.

## Comic gap audit integration

The read-only comic audit now checks every returned same-series peer's edition/run labels. **If any peer has a saved profile**, gap inference is suppressed unless *every peer* has one complete, consistent, single-file edition with the same explicit series run and volume; saved issue and year must agree with underlying work-level evidence. Different editions, uncertain/missing labels, conflicting work/edition dates, distinct volumes or moved identities fail closed rather than suggesting that another volume's issue is missing.

If no owner edition profiles exist, the earlier cautiously labelled same-year *possible* gap logic remains available; it still cannot establish a published, purchased or missing comic. The workbench reloads this audit immediately after a confirmed edition Save or undo, and invalidates prior optional online metadata suggestions that were ranked against the old identity.

## Source and test evidence

**Mirrored server changes:** `comic_edition_profiles.go` (new), `comic_edition_profiles_test.go` (new), `server_comic_edition_backup_test.go` (new), `server_legacy_metadata_reopen_test.go` (new), `work_metadata.go`, `main.go`, `comic_identity.go`, `comic_identity_test.go`, `web/manage.js`, `web/manage.html`, and `web/manage.css` — every relevant Go/web file mirrored under `archivist/app/`. Real web interaction checks expanded in `scripts/v1-manager-assist.test.cjs`.

Automated tests cover: owner and CSRF refusal, unknown edition IDs, Save requiring confirm, tampered/replayed/stale plans (and expiry enforced by the signed-preview validity check), individual edition identity preservation within multiple existing editions, no asset/edition membership changes, published/offline/multi-file refusal, short numeric issue validation, missing/invalid data, SQLite audit-trigger rollback and clean retry, last-Save signed undo with monotonic revisions, persistence of edition fields plus audit history across staged SQLite backup/restore, idempotent schema initialization, scanner provenance stability on multiple database opens, mixed/same comic volume cohort gap detection, and real browser-script preview/Save/undo/refresh controls.

**Exact code `07776dca`:**
- [Full server integration CI SUCCESS](https://github.com/russellstokes-ai/Archivist/actions/runs/39049590998/job/117445291766) — root + packaged Go, JavaScript syntax, manager browser contracts, protected source checks, Docker/Compose and Home Assistant add-on smoke.
- [Native Linux ARM64 smoke SUCCESS](https://github.com/russellstokes-ai/Archivist/actions/runs/39049590998/job/117445291948) — hosted ARM64 runner, **not** a physical Pi4.
- [Mobile regression CI SUCCESS](https://github.com/russellstokes-ai/Archivist/actions/runs/39049590947) — scope/source protection regression, not acceptance of any Fold bug. Android-native/iOS checks were independently running at this report checkpoint.

**Failures corrected rather than hidden:**
1. `3fc9f41`: fake-DOM test incorrectly expected a blank comic series, despite existing indexed “The Flash”. Corrected the assertion to preserve the true preexisting series at `8059fde`. Both Go suites already passed.
2. `ae80ec6`: staged backup/restore proved saved edition labels persisted **but work fingerprint changed**. Instrumented test checkpoints `a8979a5` and `6f242e2` identified a genuine legacy startup migration overwriting `metadata_source='embedded'` as `'legacy'` on older/synthetic signature rows. `2894f89` restricts the migration to **genuinely unclassified, unreviewed legacy rows**; test now verifies exact restored fingerprint and labels, and independently tests two successive cold database opens. This fixes real provenance loss without changing scanner code.
3. `e6a8eba` adds the volume-aware gap guard; `07776dca` immediately refreshes the audit and clears stale optional candidate cards after Save and undo. Both changes are source/test proven.

No original protected mobile scanner, mobile Assist, Living Book, Comic Focus, Atlas, approved canonical artwork, app layout or source protection manifest was modified for this server slice.

## Commercial acceptance still open

- **True edition reassignment/grouping and book-level series-run management** with safe signed preview/apply/undo, new-work/old-work conflicts, household progress and abandoned-edition retention. That is a separate higher-risk implementation, not implied by these labels.
- Specialist comic source authority for imprints, volumes, variant prints and issues, including provider licensing/API policies and real-world ambiguous editions. Current Open Library/Google Books remain opt-in suggestions, not authoritative comics proof.
- 1920×1080 browser/accessibility/focus testing, physical Home Assistant ingress and Pi4/4GB SSD testing, 1000+ comic and large-audiobook performance, real NAS/SMB/NFS disconnects, failed imports, process kill/power-loss restore and household-reader acceptance.
- Remaining ten-screen administrative parity, Android Auto/cross-device acceptance and mobile original-bug acceptance remain tracked separately. This source milestone **does not pass the overall commercial release gate**.

**Next implementation work:** design an owner-verified **non-destructive edition reassignment preview** with exact expected source/target membership, active-progress/metadata conflicts and an irreversible-state escape hatch. Do not introduce automatic regrouping or apply before those constraints and rollback tests are established.
