# Archivist — canonical real-library scanner recovery plan
**Date:** 2026-10-08  
**Status:** Permanent evidence and roadmap, NOT a completed scanner fix.  
**Do not change:** Installed Archivist app state, its current metadata, progress, settings, or canonical Fold/phone UI. All fixes begin on a fresh isolated branch.

## Original data: preserved privately
The GitHub repository is PUBLIC. Therefore the complete user-supplied JSON scanner reports (including actual filenames and LAN addresses) are stored in the user's private ChatGPT Library and must NOT be checked into public GitHub:
- /Archivist/Scanner Diagnostics/2026-10-08/audiobooks-Windows-raw.json — SHA-256 e8f29fc4c92ac2a0d5049e4cad3aa5a2075a284a9feec0b1a2e77883da179ca1
- /Archivist/Scanner Diagnostics/2026-10-08/comics-Windows-raw.json — SHA-256 bd9d3e22901b51b4885524a59c6ca4bc3e9944ab41464f10d4951658c0581c1d

Public, sanitised, shape-preserving fixture definitions: docs/fixtures/SCANNER_REAL_LIBRARY_SHAPES_2026-10-08.json. They contain deliberately anonymised stand-in paths, NOT the original inventory, and are NOT passing production tests until wired into the real TypeScript code.

### Findings from 8 October 2026 Windows network scans

| Observation | Audiobooks | Comics |
|---|---:|---:|
| Total entries, including folders | 2,216 | 5,817 |
| Directories scanned | 153 | 272 |
| Target media files | 1,821 audio | 4,664 comic archives |
| Sampled media headers/archives | 351 | 339 |
| Complete scan elapsed | 26.672 sec | 36.797 sec |
| Media sampling elapsed | 22.212 sec (83.3%) | 29.581 sec (80.4%) |
| Maximum single sampled operation | 1.250 sec | 3.531 sec |
| Longest directory listing | 0.047 sec | 0.266 sec |
| Reported scanner errors | 0 | 0 |

Audiobook files: 1,595 MP3, 225 M4B, 1 M4A. Four loose root audio files coexist with nested author/book folders. Also 25 ambiguous PDFs and 45 ebooks.

Comic archives: **3,760 CBR / 904 CBZ**, 229 ambiguous PDFs, 4 ebooks. Of 339 media samples, 284 were comic archives, 52 PDFs, and 3 ebooks. Two sampled CBZ files failed ZIP inspection. ComicInfo was not found in the sampled materials; do not assume every valid comic includes it. ZIP-only discovery is not adequate for this CBR-heavy collection.

**Potential duplicates only:** 1,529 extra comic-file occurrences across 972 groups share the same case-insensitive filename and exact file size. This is NOT verified content identity; never delete, overwrite, or automatically merge files on that basis.

The Windows report's attributesTotalMs=0.0 is not evidence that attributes are free; individual timings/precision are insufficient to draw that conclusion.

These reports cover Windows/SMB file listing and selected media reads. They DO NOT isolate Android hangs during SAF, work grouping, image processing, online metadata, database persistence, or publication. A large media sample cost makes those stages worth profiling; it does not prove a particular Android hang cause.

### Crucial opposing grouping cases found in the real data
- Nested Author > Series > Narrator > Novel folder with **57 separate track files**, some named after chapter characters rather than "Chapter 01" -> **1 logical audiobook**.
- **40 numbered whole novels** in one Series folder -> **40 distinct logical audiobooks**, NOT one multipart work.
- **50 M4B parts** beneath one title folder -> **1 logical audiobook**, not 50 books; extension alone is insufficient.
- Book files with continuous track numbers but Chapter counters restarting at each Part -> one work.
- Loose standalone audio files directly below a selected audiobook library root -> separate works unless positive shared-work evidence.
- Comic directory with hundreds of files -> one **series or collection**, but each issue is an independent **work**.
- Repeated comics across multiple folders -> possible duplicates needing non-destructive evidence, not automatic removal.
- Malformed/mislabelled CBZ and mixed PDFs -> fail forward, leave classification unresolved when necessary; NEVER hang.

The exact samples in the public fixture are anonymised and smaller than the full folders; they preserve patterns, not original user identities.

## Non-negotiable invariants
1. **Physical file ≠ logical work ≠ published work ≠ needs-attention work.** Do not use physical track count as a "books found" count. Review is by work.
2. **Never infer grouping from filename numbering alone.** Numbered whole novels must remain separate; numbered or descriptively titled chapters in a confirmed book folder must be tracks. Combine path role, work/album tags, evidence confidence, chapter patterns, series markers and optional bounded tag probes.
3. Ambiguous grouping is provisional. Do not fan out one unresolved work to dozens of per-file review cards.
4. Scanner and diagnostics NEVER move/rename/delete media. Sorting is separate, must use preview and explicit book-by-book consent.
5. Normal discovery is cheap. Heavy archive/media operations are bounded, cancellable when possible, and work-scoped. Deep Scan remains explicit per work.
6. **Comic issue = work; comic series = series relationship.** Handle CBR and CBZ, detect invalid archives, use bounded cover/metadata fallbacks and no forced PDF classification.
7. **Review state and publication state are separate.** A work must not disappear from Needs Attention merely because needsReview is cleared before publication passes.
8. Progress/diagnostics in a RELEASE build, not developer console only: stage timings, last operation, physical files/work counts, attempted probes, timeouts, provider fallbacks, errors, cancellation and elapsed no-progress time.
9. Be honest about timeout semantics: JavaScript Promise timeout does not necessarily cancel native system I/O.
10. Existing user metadata, overrides, artworks, and scan checkpoints must survive cancels, failed refreshes and rescans. Avoid rewriting huge catalogues after minor changes.
11. Canonical UI remains locked; scanner visual updates must be minimal and targeted.
12. No release or statement "fixed" without actual grouping test results and an on-device before/after trace.

## Sequence and acceptance gates

### Gate 0 — Preserve reference (COMPLETE)
- Private original JSON reports archived as above, checksums recorded.
- This public canonical plan and 12 anonymised regression cases created.
- Baseline Test 21 feature branch: feature/test21-scanner-and-book-loader-20261008; original observed commit aeefd4dc89c4de1c81b7e03eb998ae858da6aaff. Confirm current SHA before editing. No changes to installed APK or user state.

### Gate 1 — Instrument the actual Android pipeline (FIRST IMPLEMENTATION TASK)
Create a separate app-ID diagnostic build, preserving existing Archivist app data. Instrument the **real implementation**, not a mock filesystem walk. Trace:
- SAF/native fast directory discovery and fallback; cheap file properties.
- Preliminary work grouping and work counts (before enrichment).
- Work-scoped audio tag probes and bounded CBZ/CBR/EPUB evidence.
- Metadata synchronisation and re-grouping.
- Book/comic online lookups and response/cache timings (optional).
- Cover download/caching, including square/portrait slots.
- Each staging database write, publication gate and final reconcile.

Output one simple exportable diagnostic JSON report with stage duration, item counts, last active item/phase, timeout/error counts, and elapsed stalls over 4 seconds. Diagnostic must expose partial findings on cancellation; no ADB, command line, or Android Studio for the user. Record differing cached provider settings if separate app means a cold start.

Acceptance: identify EXACT phase of the real device slowdown instead of just knowing Android storage traversal is fast.

### Gate 2 — Work-first audiobook grouping, backed by real fixture cases
Run actual production inferLocalBookMetadata, audioWorkGroupKeys, groupLocalWorks and downstream publication grouping against all relevant anonymised cases. Add conflict-tag fixtures and negative tests for over-merging. Use provisional book/track clusters; perform a few bounded tag reads to resolve ambiguous cases. Never treat an entire author/series folder as one work without corroboration.

Acceptance: 57 nested tracks -> one work; 40 numbered distinct novels -> 40 works; M4B parts -> one work; root standalone files stay separate. In all cases, review is by work, not track.

### Gate 3 — No-hang metadata and archive evidence
Normal scan: (A) fast inventory and provisional grouping; (B) bounded samples of embedded file properties, audio tags and minimal archive index/ComicInfo/OPF; (C) optional work-level enrichment and covers; (D) durable publication.
- Explicit per-work Deep Search for unresolved cases, NEVER unbounded catalogue-wide deep parsing.
- Cooperative batching and explicit watchdogs/limits; failed or malformed archive cannot stall other work. Distinguish a caught timeout from a native operation truly cancelled.
- Record every storage/provider fallback, slow query and failed header.

Acceptance: every lengthy operation is attributable, cancel/retry responds, unrelated works continue processing, no silent 28% or similar progress freeze.

### Gate 4 — Comics, duplicates, cover recovery
- CBR/RAR-aware bounded metadata/index/first-image path is essential for the 3,760 CBR files; CBZ/ZIP path must also work even without ComicInfo.
- Issue grouping by series, issue, volume rather than folder-only identity.
- Detect duplicate *candidates* by path/name/size; confirm via separate bounded checks only on explicit request, never auto-modify.
- Ambiguous PDFs not automatically comics.
- Resolve covers with local header/first-image/online catalogue fallback; missing/unresolved remains visible to work-level review.

Acceptance: corrupt CBZ does not hang; valid CBR/CBZ remains discoverable; no duplicate-driven deletion or inappropriate issue grouping.

### Gate 5 — Persistence, matching, cover and publication
- Online matching and cover search by logical work, not individual MP3/M4B track; cache and provider timeouts, rate limits and retry rules.
- Avoid full-database rewrite at every progress checkpoint; use staged incremental/delta commits with cancellation-recovery.
- Enforce independent needsReview / isPublishable states, preserve earlier published works and manual metadata.
- Verify cover and identification gate before publication. No unexplained disappearance from both Library and Needs Attention.

Acceptance: real device test library stays near its expected ~12 works rather than 85/226 physical file review cards, no lost works after save/reopen.

### Gate 6 — Verify device and ship
- On real Fold, verify closed/open; multiple-root scan, phase timings, cancellation/resume, corrupted files, offline mode, re-scan, and state preservation.
- Measure before/after against Test 21 on same set. Do not apply Windows SMB timings as a universal Android latency target.
- Canonical layout remains unchanged. Separately verify Smart Search/Save graphics and Lottie size, but do not conflate them with scanner fix.
- Only supply new direct standalone/test APK after tests, package-ID/signing and rollback protections are checked and recorded.

## Handover contract
- Future sessions and contributors should always start by reading THIS FILE and docs/fixtures/SCANNER_REAL_LIBRARY_SHAPES_2026-10-08.json.
- All scanner PRs must cite affected fixture IDs and provide real-code tests, device scan trace and no-regression/rollback evidence.
- The raw private JSON is a filename/timing inventory, not access to media bytes, live embedded tags, complete archive contents or the user phone's actual filesystem.
- **Do not publish original reports, internal IP, file tree or user data in GitHub.**
