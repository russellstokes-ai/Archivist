# Archivist Server — Indexed comic identity and issue audit (item 2, milestone B)

**Date:** 17 October 2026  
**Repository:** [Archivist PR #83](https://github.com/russellstokes-ai/Archivist/pull/83), draft, unmerged  
**Starting parent:** `ef46420ce38d3975248c4d76a828b381367057ae`  
**Implementation / hardening:** `dea5afd738f4ed4ad245b10edb8746e5e00f5530` → `585ecb926b8fb922e09bd816fe1dd198bf705813` → `fe6f33996f1c95e371c61871ec7a286ad5808462` → **`a4194150afddd1bdaaaeca08051a185a6700100b`**  
**Decision:** This is a reversible source-tested step toward server commercial completeness, **NOT a commercial release, migration, authorised production restore or physical-device acceptance**.

## Scope of this slice

1. Owner-only `GET /api/manage/works/{id}/comic-audit` reads a transactionally consistent snapshot of the existing SQLite comic catalogue. It uses indexed `ComicInfo.xml`/metadata values already collected by the server scanner; **no scanner algorithm change, disk scan, file write, publishing or external network call** is made by this audit.
2. Workbench displays **effective comic series and issue**, metadata provenance, up to 40 original file-level records and up to 100 same-series works in the same library space, with stable IDs and a book fingerprint. Mixed-format books are refused rather than pretending edition boundaries are known. Unavailable media are flagged.
3. Exact explicit `#12`, `Issue 12`, `No. 012` and fractional `#12.5` issue markers may corroborate existing saved issue values. Bare `2024`/annual dates and `Vol 2` do not count as issue numbers. Multiple distinct markers, ranges such as `#1-#2`, or conflicting file records are treated as ambiguous.
4. Optional owner-initiated Open Library/Google Books candidate cards now show comic series/issue reasoning. For a comic, the workbench offers **no candidate-field selection** unless both the indexed series words and a single explicit issue number match. A matching comic issue still does not verify publisher, series volume, imprint, printing or variant cover. Suggestions require the existing signed preview and explicit Save; no automatic identification or merging.
5. Possible gaps are advisory **only between observed positive integer issues from the same calendar year**, with at least two positions, no unknown/repeated issue, and at most 50 positions of span. Missing, inconsistent, fractional, cross-year, duplicate/reprint and truncated peer sets disable gap inference. A gap is not proof that a work was released, purchased or lost.
6. Owner-cleared work-level issue/year fields have precedence over file-derived values during sibling review. Old provider search cards are invalidated on book revision reload or input edits. Asynchronous audit/search responses are identity- and fingerprint-guarded.

## Source and test protection

**Production mirrored files:** `comic_identity.go` (new), `main.go`, `manage_multisource.go`, `web/manage.html`, `web/manage.js`, `web/manage.css`.  
**Mirrored Go test:** `comic_identity_test.go` (new).  
**Browser interactions:** `scripts/v1-manager-assist.test.cjs`.  
Every server production/test source above is mirrored exactly in `archivist/app/`; original canonical mobile scanner, mobile Assist, Living Book, Atlas, comic-focus reader, layouts, fonts, branding and source hash manifests were not altered by this slice.

Go/SQLite tests cover valid/fractional issues, ambiguous ranges, dates/volumes not used as issue identifiers, comic- vs book-candidate separation, mismatched series/issue, owner authentication, read-only snapshots, indexed provenance, conservative same-year gaps, duplicate reprints, different years, explicit cleared field overrides, manual-source conflicts, wrong media types and missing works. Fake-browser test checks the real comic panel, no automatic network search, verified search parameters, suppression of mismatched candidate actions, and no Save without preview.

**RED → GREEN history:** initial `dea5afd` failed a test fixture type, corrected at `585ecb9`; next `585ecb9` surfaced a real ambiguous-range parsing bug, corrected at `fe6f339`. `a419415` additionally fixes named issue marker cleanup, explicitly cleared metadata precedence and stale comparison cards. These were not papered over or removed from the suite.

**Exact source run:** [server root, mirrored/package tests, web contracts, Docker/HA smoke](https://github.com/russellstokes-ai/Archivist/actions/runs/39046705057/job/117436829829), [native Linux ARM64 smoke](https://github.com/russellstokes-ai/Archivist/actions/runs/39046705057/job/117436830030). Both jobs completed SUCCESS on the exact source SHA. Synthetic fixtures and hosted runners do not prove the owner's Pi 4, NAS mounts or 16:9 ingress. Success on a hosted ARM64 runner does not constitute a real Raspberry Pi 4/4GB or attached NAS test.

## Real CBZ-to-catalogue-to-audit source acceptance

Follow-on **source-test-only** commit [`865fab602a0b5b568a0611533b5dfa0997816a4d`](https://github.com/russellstokes-ai/Archivist/commit/865fab602a0b5b568a0611533b5dfa0997816a4d) adds `server_comic_archive_e2e_test.go` in both root/packaged server trees. The test creates three genuine CBZ ZIP archives containing well-formed `ComicInfo.xml` with series, issue, title, creator, year, genre and publisher, plus a valid GIF page. It executes the real server scan, looks up the original indexed work identity, reads the owner-only comic audit, verifies the indexed embedded metadata origin and cautiously flagged issue #2 gap between existing #1/#3/#4 from one year; rescans unchanged media and asserts stable work identity, fingerprint, source evidence and gap; byte-compares all original archives and checks that no work metadata history was written.

**Exact source `865fab6`:** [full server CI success including Docker and Home Assistant disposable runtime](https://github.com/russellstokes-ai/Archivist/actions/runs/39047128153/job/117437987007) and [native Linux ARM64 smoke success](https://github.com/russellstokes-ai/Archivist/actions/runs/39047128153/job/117437987170). This increases evidence beyond fabricated database rows but is not a physical CBZ/CBR library sampling study, a real Pi4/NAS/HA ingress test, or volume/variant confirmation.

## Remaining commercial requirements

- This is a **local evidence audit and conservative metadata filter**, not an authoritative specialist comic-provider integration. Explicit series **volume**, issue variant, edition/imprint and publication run are not yet represented as trusted indexed identifiers. Neither Open Library nor Google Books is sufficient to confirm every original comic issue.
- Need schema/design for owner-approved edition and comic-volume identities, series/run grouping, duplicate edition/reprint distinctions, bulk issue-gap dashboards, safe copy/rename and undo that retain existing work/edition/asset/bookmark IDs. No automatic changes to the existing scanner or saved media.
- Need measured performance with real 1000+ comics, pagination and bounded server memory, a physical desktop 1920×1080 browser and Home Assistant ingress, live provider policies/rate limits and real metadata catalogue acceptance.
- Entire server also requires hardware Pi/HA/Docker/NAS restore/SMB/NFS failure drills and a complete ten-screen administration acceptance. Mobile original bugs and Google Play release remain separate; no merge/production rollout.

**Next item:** develop an explicit, owner-reviewed comic **series volume / edition identity model** with non-destructive previews and rollback tests. Do not implement automatic re-grouping or destructive file moves before the identity model and conflict matrix are independently verified.
