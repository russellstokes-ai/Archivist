# Archivist Assist and Durable Metadata Implementation Plan

**Goal:** Implement the owner's approved Assist/metadata portion only; no AI models, other visual fixes, APK build, production merge or server deployment.
**Baseline:** Test 14 `73a6282ff5d2358fac08029ee82ef9f5f96f4bad`; development isolated on `fix/assist-metadata-durable-20261017`. Preserve PR #85 and server PR #83.
**Specification:** Owner-approved Archivist Consolidated Repair Specification dated 17 October 2026, sections 1–5 and Assist/persistence acceptance in section 7. Other bug fixes are excluded from this run.
**Execution:** Inline in chat as explicitly requested. Test before implementation; existing scanner discovery/grouping and reader/visual features remain protected.

## Tasks
- [ ] Deterministic search-clue parsing and matching: title/creator/identifier/annual variants; separate draft from saved metadata; cancel stale requests.
- [ ] Assist search/enrichment: appropriate configured providers, targeted fill of missing unlocked fields for identified and published works; avoid redundant work and preserve manual clears.
- [ ] Durable portable metadata: versioned validated records, field provenance/locks, real local cover bytes, per-file/work identity, export/backfill and restore outside app-private storage through explicit folder access.
- [ ] Safe embedded metadata: reuse existing format writers where verified; otherwise keep originals and record explicit portable-only support. Never claim an unimplemented native writer.
- [ ] Integrate into existing editor/runtime with narrow reversible source exceptions; no scanner rebaseline.
- [ ] Run meaningful positive/negative, cancellation, publication, persistence, conflict and interrupted-write tests; full mobile checks and native compilation where available; document exact implemented versus unverified scope.

## Review focus
1. Approximate search clues must never become locked official titles or write to media by merely typing.
2. Same work with a different edition, narrator, annual or contradictory identifier must not auto-merge.
3. Enriching optional fields must not depublish an already accepted work.
4. Uninstall recovery requires metadata in a user-authorised persistent folder, not a renamed app-private cache.
5. Failed or concurrent file writes must leave original media and accepted metadata recoverable.

## Rulings and evidence
- The owner has explicitly requested implementation now; no repeated design approval or unrelated artwork work.
- Repository reading and local test setup precede source changes. No user media is mounted for rewriting.
- Full-source fixture export action was blocked by the tool; not retrying that export. Use supported repository reads and scoped tests instead.
