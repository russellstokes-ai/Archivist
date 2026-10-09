# Fresh scanner design for current Archivist

Status: repository adaptation authorized to proceed by the user on 9 October. Scanner phases remain gated by their measured outcomes; APK release remains gated.

## Authority and intended outcome

The user requests a fresh scanner beneath the locked canonical UI, accurate file discovery and grouping, native hang prevention, automatic work-level Smart Search, meaningful editable Genre, reliable artwork/publication and correct Atlas statistics. The supplied WORK_EXECUTION_HANDOVER.md dated 9 October is authoritative. Its instruction to avoid historical scanner implementations supersedes the older repository recovery plan's suggestion to modify the old pipeline and its approximate work-count expectation.

The real inventories are private evidence, not original media or confirmed work truth. Preserve them outside the public repository. Generated audio, tags and controlled archive examples are explicitly synthetic. No source filenames appear in this document or public tests.

## Repository boundary and isolation

Base: current main, 22ee7645b78b752b9e954a286528fddbedfc1320. Local branch: feature/archivist-scanner-vnext-real-library. Recovery tag: recovery/scanner-vnext-main-20261009. A verified complete Git bundle is stored outside the checkout. The older dirty checkout is untouched.

The fixed product baseline is mobile/App.tsx, mobile/app/, mobile/assets/, the locked Fold StyleSheet snapshot, LivingBookCanvas.tsx, LivingBookArtwork.tsx, LivingBookGeometry.ts, AtlasChartRing.tsx, atlasUniverse.ts, LibraryCharts.tsx and mobile/app.json. Record hashes before changes; retain source checks and later phone/Fold screenshot comparisons. Existing tests are compatibility evidence, not proof of scanner correctness.

Create mobile/scannerVNext/ as new domain code. Do not import the old inferLocalBookMetadata, audioWorkGroupKeys, synchronizeLocalMetadata, scanLocalFolders or groupLocalWorks algorithms into it. Read their types and call sites only to define a compatibility projection. Reader, playback, safe organiser and approved UI remain consumers. The older scanner stays inactive once the new runtime is integrated; it is never the algorithmic baseline.

## Domain and identities

SourceId, AssetId, WorkId and EditionId are persisted UUIDs. Source identity uses the explicitly selected grant, reconciled across equivalent tree URIs. Asset identity uses source plus provider document ID; file paths/display names are evidence, not immutable identity. A unique database constraint prevents duplicate discovered assets within a source. Never cross-deduplicate roots from filename/size or this generated lab's shared payload bytes.

Work and edition identities are persisted separately from inferred bibliographic keys. A work owns edition records and each edition owns a unique ordered asset relation. Nested disc/part folders are evidence, not work IDs. Regrouping records lineage and revision; conflicting manual identities hold a proposed merge/split for review rather than rewriting accepted IDs. A rename reuses a provider ID; when provider identity changes and no trustworthy reconciliation exists, retain the old record as unavailable and stage a new candidate.

Asset disposition is discovered, supported-candidate, ambiguous, unsupported or unreadable, with an explicit reason. Review state and publication state are separate columns. A staged revision can need attention while the last published revision remains active. Keep source fingerprints, tasks, checkpoints, field evidence, manual locks, covers and decisions durable.

## New storage and compatibility projection

Use the existing expo-sqlite dependency to add versioned vNext tables in the existing database without deleting local_assets. Tables: sources, assets, works, editions, parts, field_evidence, artwork_slots, tasks, scan_runs and published_revisions. Update only changed rows within work-level transactions. Store append-only revision history for manual decisions and publication; short scan progress updates never rewrite the complete catalogue.

Migration reads existing LocalBook objects and URI-keyed LocalMetadataOverride values as user state only. Preserve metadata, cover URIs, progress and existing IDs, importing manual provenance as field locks. Assign UUIDs in a transaction; durable legacy ID mappings preserve existing reading/player references. Keep legacy data intact until migration verification passes. Repeating migration is idempotent.

projectCatalogue(snapshot) returns the existing LocalBook/LocalWork shapes and normalized genre display labels. The adapter deduplicates published work IDs for Atlas and preserves edition/file relationships for reader/player. Needs Attention projects each unresolved work once. Cache refreshes cannot overwrite protected fields or hide previously published data.

## Discovery and platform access

Android uses a new ArchivistScannerModule, registered beside ArchivistArchiveModule without changing reader archive operations. beginScan(source, generation), nextBatch(token, maxEntries), cancelScan(token) and readClues(asset, generation, limits) expose bounded typed results. ContentResolver queries project document ID, display name, MIME, size and modification time in batches. Traverse only IDs returned under the granted tree; track visited directories, enforce a 100,000-entry run cap and save continuation checkpoints. Each returned batch is at most 128 entries. Duplicate grants share discovery evidence but retain explicit source membership.

Android queries receive CancellationSignal where supported. Every cursor, stream and descriptor closes in finally/use. Cancellation invalidates the run generation before asking native calls to stop. Unsupported native cancellation is reported honestly: the worker remains occupied until the operation returns. Use two discovery slots and two local-clue slots, queue capacity 128, and persisted backlog. A watchdog quarantines stuck slots; never spawn replacement threads for them. If all slots are stuck, stop that provider phase, preserve checkpoints and expose retryable errors. Networking and artwork have independent single-worker queues.

iOS imports remain app-private; implement a FileAccess adapter over the existing import result, preserving the established Import folder behaviour. Server roots use a distinct adapter with explicit grants. No scan moves, renames or deletes media.

## Classification and work grouping

Classification combines extension, MIME and cheap signatures when available. Recognize supported audio, EPUB, CBZ/CBR/CBT and PDF candidates. ZIP and PDF remain ambiguous until bounded clues resolve them. MOBI is explicitly unsupported for reading in this iteration and remains visible with a reason; retain the source asset and any alternate supported edition. Music-like signals produce a review/exclusion candidate; audio extension alone never implies audiobook.

Grouping uses independent path roles, shared title/author evidence, disc/chapter tags and series/edition distinctions. Numeric series filenames with different title stems remain distinct works. Confirmed book folders with chapter stems may form ordered editions; author/series folders cannot be collapsed wholesale. Disc/track metadata wins over natural filename order when consistent. Preserve absent/duplicate track numbers as issues. Comics issues are works; series folders are relationships. All supported assets map to one edition part or one explicit unresolved candidate, never disappear.

Only label-confirmed cases support purity/recall and true work-count assertions. The full inventory supports exhaustive accounting, not a claimed correct number of works. Contradictory evidence remains staged for adjudication. User clarification: seek a high supported-file discovery percentage, not a promise of perfect recognition. Report separate denominators for supplied records, supported candidates, actual readable media and published works; keep explicit dispositions for missed/unreadable/unsupported entries. A generated replay accounting result is never an on-device discovery guarantee.

## Bounded metadata and caches

Normal clues start with paths, persisted manual choices, sidecars and cached fields. Proposed initial caps: 64 KiB audio header; 256 KiB decompressed structured metadata; 1,024 archive entries; 8 MiB source reads per selected work. Selected-work Deep Search raises caps to 20,000 entries and 32 MiB source reads with explicit cancellation. Index parsing must support seekable descriptors and enforce caps; never copy whole arbitrary archives as a normal-scan fallback. CBR extraction receives separate bounded parser tests and actual valid CBR media before its gate passes.

Metadata cache key is asset ID, source fingerprint, reader version and budget class. A fingerprint is size plus modified time plus provider ID; uncertainty forces review rather than claiming content identity. Manual fields/decisions survive cache eviction. Failed reads checkpoint reason codes and capped retry attempts. No all-library embedded art recovery.

## Automatic Smart Search within user settings

The new search service operates on WorkId and runs automatically for missing identity, genre or required artwork when existing online consent/settings allow it. Query only bibliographic title/author/series/index/language/identifiers; never send full paths or media bytes. Offline discovery and grouping run regardless of provider availability.

Initial proposed budgets: one active provider request globally, minimum 1 second Open Library spacing, 8 second request deadline with AbortController, at most two query plans plus one detail request per work and 16 unresolved works per user-initiated scan session. Exhausted budgets leave search pending with explicit retry controls; startup never launches a new bulk lookup loop. Manual selected-work retries bypass negative cache once while retaining rate limits. Positive cache TTL 30 days; no-match TTL 24 hours; timeout/429/500 are transient failures, not cached proof of no match. Respect Retry-After and stop a provider after three consecutive transient failures. Google Books and Metron share the bounded global queue and their observed quota responses.

Open Library currently documents 1 request/second unidentified and 3/second identified, plus a prohibition on bulk backend harvesting. The proposed 1/second cap is intentionally conservative; identify Archivist only with a configured real contact. Provider references checked 9 October: https://openlibrary.org/developers/api ; https://developers.google.com/books/docs/v1/using ; https://github.com/Metron-Project/metron/blob/master/api/README.md . Optional keys/tokens stay in SecureStore and are omitted from backup/logs.

Rank candidates by exact identifier, corroborated title/author, series/index and edition cues; wrong author or contradictory identifiers block automatic acceptance. Until human-confirmed real labels calibrate precision and ambiguity margins, provider-derived identities require candidate approval. Accept & Save writes one work revision and all member relationships atomically. Selected-work Deep Search reads only that work. Failures preserve good local fields and stay visible.

## Genre, artwork and publication

Version the taxonomy as archivist-genres-v1, based on the supplied meaningful content categories. primaryGenreId must be in that taxonomy and supported by stored field evidence/manual confirmation. Reject blank, Other, Unknown, Unclassified and format-only values. Secondary genres are optional. Manual edits are protected by field revision checks so an enrichment result started before an edit cannot overwrite it.

Artwork slots are library-cover and living-jacket, each with provenance, local URI and readiness/error state. The same verified image can satisfy both with explicit role/aspect treatment; do not invent a requirement for a second remote image. Use bounded local/cached image evidence, then approved provider downloads: proposed automatic image byte cap 8 MiB, decoded pixel cap 16 megapixels, one active image task. Keep the existing 25 MB manual picker policy. Invalid images remain blocked/retryable. Never reopen every track for cover recovery.

publishWork(workId, expectedRevision) requires confirmed identity, meaningful confirmed genre, ordered part relations and ready required artwork. Transactionally persist the accepted revision and its projection. Failure preserves previous published revision and adds staged reasons. clearReview is never an alias for publish. Atlas counts distinct published WorkId values, not parts or editions; primary genre totals sum to the same published-work count. Secondary distributions may overlap but never change the total. Genre edits invalidate Atlas's work-data revision without changing its UI or visuals.

## Test and gate policy

Preparation closure: P0 current main isolated, verified bundle/recovery commands, canonical hashes and UI contract pass. P1 all four original hashes and sizes match; regeneration reproduces the four normalized JSON datasets exactly. Curated source file scopes are verified; real work/edition labels remain unknown, explicitly excluded from correctness claims. Generated grouping fixtures carry construction-defined truth and cannot become original-work labels. P2 user authorized continuation after the written adaptation and mission confirmation. P3 playable generated MP3/M4A/M4B, EPUB, CBZ/CBT, stored RAR5 CBR and valid text/image PDFs are available with provenance and independent reader checks. Provider budgets and emulator targets are specified. Real-label calibration is an S2/S4 acceptance dependency; automatic provider acceptance stays disabled until that evidence exists. Compressed RAR4/RAR5 support needs separate native-stage verification.

Provisional Android emulator targets, to be measured and adjusted with evidence before implementation iteration: 342-file cold discovery at most 5 seconds, warm at most 2 seconds; excess JS heartbeat lag p95 at most 100 ms and max at most 500 ms; cancel acknowledgement at most 1 second; late results cannot commit; no growing stuck-worker count; 5,000-file incremental scan memory growth at most 80 MiB. These are targets, not measurements or physical Fold guarantees. At 100,000 entries stop resumably with full accounting and bounded buffers.

Each S1-S7 sprint reproduces a failure, adds a regression, implements only that phase, tests, reports and checkpoints. Android tests use a separate app identity on emulator; device/build/signing changes are local and cannot overwrite the user's installed Archivist state. S7 requires actual SAF picker, cold/warm/cancel/restart traces, screenshots at phone/Fold closed/open and light/dark, plus unchanged canonical source hashes except individually approved scanner bindings. No APK release before all automated gates pass. Physical Fold original-media testing remains a separate mandatory final gate.
