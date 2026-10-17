# Archivist Server — comic edition reassignment preflight QA

**Date:** 17 October 2026
**Scope:** First, deliberately read-only stage of existing-edition reassignment.
**Draft:** [PR #83](https://github.com/russellstokes-ai/Archivist/pull/83), `integration/archivist-v1-auto-restore-recovery-20261016`
**Verified source checkpoint:** `2914747c0ffa0434f6a5dfa659b7a6be06d4ac8d`.
**Parent:** `ed509e9a2ebd16a2882d71da4c0e3db783978da5`.
**Release decision:** Protected source candidate only. **NO-GO** for actual transfer, production deployment, release, merging, or family-media migration.

## Behaviour and safety boundary

Archivist Assist's book-level comic workbench offers **Inspect edition reassignment**. The owner enters a destination logical-book ID and selects an already indexed comic edition. The owner-only `POST /api/manage/comic-edition-transfer/inspect` endpoint accepts the source work ID, destination work ID, edition ID, and source work fingerprint. It returns a transactionally consistent, read-only comparison: source and destination identities/fingerprints; selected original asset and issue/year; specific blocking conditions; advisories; a ten-minute HMAC-signed inspection snapshot; and whether all **known preflight checks** passed. The report always states `readOnly=true`. No public/provider lookup, disk scan, file rename, file move, SQLite mutation, edition reparenting, progress reset or publication occurs.

**There is intentionally no transfer Apply route or UI control.** A green preflight indicates only that the known blockers were absent in a SQLite snapshot; it is **not approval to transfer**. The signature must not be accepted by any future mutation without a new, locked transaction that rechecks every dependency and both source/target versions.

Only owners may inspect. Writes to the inspection endpoint require the existing action/CSRF header and a strict single known-fields JSON body, bounded to 256 KiB. SQL references to tables and columns come exclusively from an internal allowlist, not HTTP parameters. The report renders untrusted titles and messages using text content, not injected HTML. Reopening a book, editing either book/edition, changing the selected edition or destination, and late network completions invalidate previously rendered findings.

## Fail-closed conflict inventory

- Source and destination must be **distinct existing manually grouped works** (automatic scanner grouping is unsafe), from the **same granted library space**, both staged/unpublished.
- Source must retain at least one edition after the proposed move; the selected edition must belong to that source, be a **single-file Comic**, available and reviewed. Target is bounded to 40 editions, each an available/reviewed single-file Comic.
- Both works require matching nonblank comic series evidence; known conflicting creators are blockers. Selected issue must be a positive number and agree with every target member; differing original years are blockers. Title differences remain visible warnings, not proof of a match.
- No saved owner edition profiles or edition history may be silently rebound. Work-level manual metadata fields, locks, revisions/history, selected covers, publication events, previous publication transitions and relink history are blockers.
- Household work preferences, completed works, recorded activity, original asset/edition progress, manual asset metadata revision/audit or pending/historical file moves are blockers.
- Active queued/running/committing/cancelling scan jobs on the original or destination media sources block inspection eligibility.
- Unsupported old or new app tables, alternative media identities, multi-volume groupings and physical media verification remain outside the scope. A later apply must audit those independently, not infer safety solely from this report.

## Tested acceptance

Mirrored Go source `comic_edition_transfer_inspect.go`, new mirrored tests `comic_edition_transfer_inspect_test.go`, server route registration in mirrored `main.go`, mirrored `web/manage.html/js/css`, and real manager fake-DOM checks in `scripts/v1-manager-assist.test.cjs`.

The synthetic SQLite tests exercise a clean source with two independently indexed comic editions and a separate destination with a matching issue/year; the inspector returns a signed preflight report **without changing work IDs, edition IDs or original member order**. Negative tests cover anonymous access, missing CSRF, stale fingerprints, wrong source edition, unknown JSON fields, no accidentally exposed Apply route, mismatching issue/series/author/year/space, automatic/published and formerly published works, orphaning a source, unreviewed media, owner-verified profiles, household reading positions and favourites, selected covers, field locks, asset edit revisions, active scan jobs and replay/tamper resistance of the signed report.

The actual server manager test confirms that no inspection occurs automatically upon opening a comic; owner-initiated inspection shows blockers; there is no Apply control; an in-flight old response cannot overwrite a newer destination selection. Root and packaged sources are byte-mirrored. Original mobile scanner, Assist, Living Book, Atlas, comic reader, canonical UI assets and source-lock manifest are not changed.

**Exact source CI:** [Server source tests / Docker / HA](https://github.com/russellstokes-ai/Archivist/actions/runs/39051249918/job/117450123523), [native ARM64 smoke](https://github.com/russellstokes-ai/Archivist/actions/runs/39051249918/job/117450123242). Both exact-source server jobs completed **SUCCESS**: root/packaged Go, manager DOM, source locks, Docker/disposable HA smoke and hosted native ARM64. [Mobile regression also completed SUCCESS](https://github.com/russellstokes-ai/Archivist/actions/runs/39051249886), as did [Android-native source checks](https://github.com/russellstokes-ai/Archivist/actions/runs/39051249870). iOS was still running at this checkpoint. None of these are physical Pi4, NAS or Fold acceptance.

## Next delivery gate — separate actual move/undo feature

Before enabling Apply, implement a single SQLite transaction preserving edition, asset and bookmark identities; bind source and target work revisions, member digests and profile identities; recheck the entire conflict matrix within the write transaction; ensure original work cannot be orphaned; atomically record a durable transfer history; and provide a separate owner-previewed undo with rejection after any subsequent activity, metadata save, publication, rescan or progress change. Deliberately inject failures between reparenting, publication revision and history insertion and verify full rollback and clean retry. Test multi-household progress, detached NAS media, stale previews, target changed mid-flight, crash/restart/restore and original file bytes, then conduct real 16:9 browser and Pi4/NAS acceptance.

**Still NO-GO:** real work-edition regrouping, specialist comic authority/variant IDs, large libraries, full ten-screen server parity, physical HAOS ingress/Pi4/SMB/NFS/power-loss and commercial release. Separate APK/Fold/Android Auto acceptance is unaffected.
