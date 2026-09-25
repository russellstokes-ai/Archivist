# Archivist Foundation Gap Map — Stages 1–3

Baseline: `main` at `5d44dc4129e025da6cca3fbb7023de35e39caf2d` (25 Sep 2026).

This map deliberately excludes new headline feature work. Atlas, the living page-turning audiobook player and comic focus zoom remain product commitments, but foundation work comes first.

## Stage 1 — Stabilise the existing product

| Area | Exists now | Gap / risk | Foundation action |
|---|---|---|---|
| Server runtime | Go server, SQLite WAL, range streaming, auth, jobs, HA packaging | Three copies of server/web source can drift | Root server/web becomes canonical; use one sync/check script for packaged copies |
| CI | Go tests, JS syntax, package parity, HA smoke test, Android APK workflow | Parity logic is hand-maintained in workflow | Move parity/sync knowledge into a reusable script |
| Database | Foreign keys, WAL, transactional scans | Schema changes are spread across init functions and ad-hoc ALTERs | Introduce an explicit v3 catalogue migration layer with idempotent tests |
| Scanning | Atomic scan staging, jobs and progress | Metadata is thin; rescans must preserve user edits | Keep scan contract stable while normalized metadata is backfilled |
| Security | Owner key, sessions, per-Space profile grants, symlink protection | Future entity endpoints must inherit authorization | Do not expose normalized entities until permission queries are defined |
| Mobile | Local-first library, readers, audio, optional server | UI constants live inside App.tsx | Extract design tokens without changing product behaviour |
| Web | Working management UI | Visual values are hard-coded and partly inconsistent | Centralize design tokens first; component polish follows |
| Packaging | Root + packaged app + HA add-on | Manual copying invites stale builds | Canonical sync script plus CI check |

### Stage 1 exit gate
- Main behaviour unchanged.
- Root source is explicitly canonical.
- Packaged copies are reproducible and checked.
- Existing server/mobile tests still pass.
- Schema migration tests prove old libraries can open without losing works, editions, files or progress.

## Stage 2 — Implement the Archivist design system in code

### Already present
- Approved bookshelf-A logo and app icon.
- Core brand colours already used in both clients.
- Light/dark support exists.
- Responsive server layout and mobile safe-area handling exist.

### Missing / inconsistent
- No shared named token contract.
- Mobile palette is defined inline in `App.tsx`.
- Web uses hard-coded colour values in many selectors.
- Spacing, radius, type scale and motion do not yet have named standards.
- Components can still invent their own visual values.

### Foundation action
Create explicit web and mobile token modules using the approved values:

- Ink `#0F2A36`
- Sage `#397076`
- Gold `#C6A374`
- Ivory `#F8F7F2`

Add semantic light/dark surface, text, border and state tokens; a coherent spacing scale; typography roles; radii; shadows; touch targets and motion durations. Existing screens consume these tokens incrementally rather than receiving another redesign.

### Stage 2 exit gate
- No new screen needs to invent a brand colour, spacing unit, radius or type role.
- Mobile and server derive their primary theme from the same documented token contract.
- Light/dark remain complete and accessible.

## Stage 3 — Build the catalogue/data model Archivist actually needs

### Already present
- `works -> editions -> edition_assets -> assets`.
- Multi-file audiobook ordering.
- Per-profile reading/listening progress.
- Spaces/sources and availability state.
- Cover extraction.
- Conservative automatic grouping.

### Current structural gaps

| Data | Current representation | Required representation |
|---|---|---|
| Author | text on work/asset | Author entity + aliases/portrait/bio/external IDs + work relationship |
| Series | text on work/asset | Series entity + numbered work membership |
| Genre | absent | Genre entity + many-to-many work membership |
| Tags/subjects | absent | Normalized tags + work relationships |
| Work metadata | title/author/series/space | subtitle, description, language, dates, publisher-facing fields, sort fields, identifiers, provenance |
| Edition metadata | format only | edition title, identifiers, language, publisher, date, page/duration facts, selected artwork |
| Provider identity | absent | provider registry + external IDs |
| Field provenance | absent | source/provider/confidence/lock per metadata field |
| Artwork | resolved on request | persisted artwork records and future cache variants |
| Collections | not normalized | collection entities and ordered memberships |
| Annotations/bookmarks | incomplete/absent | durable per-profile records |
| Goals/rewards | absent | goals, achievements and progress records |
| Sessions/history | progress exists | durable reading/listening activity suitable for Insights/rewards |
| Work location | one `works.space` text | derived many-to-many work-to-Space relationship through editions/assets |

### Migration rule
Do not delete or reinterpret the current columns during the first v3 migration. Add normalized entities, backfill them from existing data, and keep compatibility columns until all read/write paths have moved. This makes the migration reversible and protects current mobile/server builds.

### Stage 3 exit gate
- Existing libraries migrate in place with no media moves.
- Authors, series, genres/tags and external IDs have stable IDs.
- A Work can ultimately span multiple Spaces because location is derived from its files, not owned by the Work.
- Metadata values carry provenance and can be locked against future refresh.
- Provider and artwork tables are ready before BookOrbit/Audiobookshelf-grade enrichment is added.
- Existing API remains compatible while new entity APIs are introduced deliberately.

## Deferred until Stages 1–3 pass

No additional work on:
- Atlas visualization,
- page-turning player animation,
- comic focus detection,
- reward UI,
- Book Dock-style intake UI,
- external metadata provider fetchers,
- Kobo/KOReader/Hardcover integrations.

Their data contracts are being prepared here; their visible feature work starts only after the foundation gates pass.
