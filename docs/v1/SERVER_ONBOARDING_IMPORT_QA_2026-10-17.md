# Server onboarding and safe import — 17 October 2026

Base: eee43df0b07024563950a25fe643c3d931c5e980, PR #83. Server only; no mobile or canonical scanner edits.

## Enrichment completion checkpoint

Built on remote PR head 7bc716a9b0fe8674a5cc405691dfc363708996e1. The owner explicitly requested leaving the final build pending. No build or mobile workflow was requested.

- No-key Open Library descriptions are fetched only for a selected work, on demand. Work-key validation, fixed HTTPS host, no redirects, bounded responses, cache and pacing prevent arbitrary URL fetches and wasteful background crawling.
- Known audiobook ASINs can use Audnexus without account configuration: narrator, series, description, language and publisher suggestions. Requests are US-catalogue scoped, paced and cached; no cover, preview, chapter or forced upstream-refresh request. Missing ASINs are not guessed.
- Optional Google Books now supplies description, language and genre. Apple stays text identity only; promotional descriptions/artwork are not imported.
- Both metadata editors expose richer fields. Fill missing details requires an exact ISBN/ASIN result, preserves every existing value and lock, and still requires save/preview. It does not run unattended during import. Mixed-edition work-level narrator/language/publisher/identifiers remain protected.
- Both editors enforce comic series/issue evidence. Description lookup cannot bypass that guard. Provider edition dates are blocked from first-publication year, including at the work-save API boundary.
- Late description responses cannot populate a different book. Bulk-fill becomes inert after identity edits. Provider provenance is preserved for work-level Audnexus selections.
- Onboarding Review books opens Assist directly; guidance refreshes with the current catalogue summary.

Primary schema references: [Audnexus API](https://github.com/laxamentumtech/audnexus/blob/develop/docs/index.html), [Open Library APIs](https://openlibrary.org/developers/api). Suggestions remain unverified until reviewed; no superiority or live-provider availability claim.

### Current verification and release status

JavaScript enrichment, stale-response, comic-identity, onboarding, manager/UI and protection checks passed locally. New Go fixtures cover exact ASIN, wrong identifiers, sanitized rich fields, source provenance, date guards and Open Library description shapes. Go tests have NOT run: no local toolchain; hosted build explicitly deferred by the owner. Physical Pi/HAOS/NAS/browser/phone acceptance remains BLOCKED. No additional feature expansion is required to prepare this candidate for validation, but it is not yet accepted for release.

## Implemented
- Compact owner-only guidance derived from server sources, jobs and catalogue state. Refresh/another browser resumes guidance; family members see no owner setup controls.
- Folder selection, active import, failure/retry, empty import and review/publish next actions. Docker/share help is collapsed. Original files remain unchanged.
- Source addition checks directory read access without a recursive pre-scan or writes.
- One discovery traversal; unknown totals display files found. Existing metadata is fetched through a prepared indexed query one record at a time instead of retaining all source metadata in a map. Signature reuse and atomic catalogue/grouping commit remain.
- Progress callbacks retain a cancellable boundary before commit. The mid-scan cancellation fixture now uses discovered count rather than a pre-counted total.
- Browser catalogue refresh happens on job state transitions, not every progress tick; idle job polling slows to 15 seconds.
- File editor uses the shared Open Library/Apple/optional Google candidate path, displays warnings/source, and blocks mismatched ISBN and Apple store-year selection. Legacy Open Library endpoint also shares safe parsing; it no longer invents edition ISBN/publisher from work-search arrays.

## Verification
Local JavaScript onboarding decisions, UI/Atlas wiring, manager selection/races/locks, protected-blob and canonical scanner checks pass. Root/package source parity is checked. Go regression cases were added for safe candidate parsing, unknown-total discovery, unchanged rescans and manual corrections; Go execution is BLOCKED locally because no Go toolchain is installed. Hosted exact-SHA server validation is required before acceptance.

## Deliberate limits and remaining work
This is not a complete commercial onboarding acceptance. Catalogue commits remain atomic: existing published books remain browsable, but newly discovered books become reviewable after the scan. No unreviewed automatic publication or online automatic enrichment was introduced. The bounded enrichment above is implemented. Representative comics/audiobook identity comparison against the canonical app and a measured performance comparison remain outstanding. Removing the cache map does not bound every scanner allocation (directory walking, sidecar cache and catalogue grouping still need measurement). Prepared per-file lookups trade memory for database calls; do not claim a speedup without measurement.

## Runnable acceptance (disposable data only)
1. On the exact candidate checkout with Go 1.25: run go test ./... and repeat in archivist/app. Run node scripts/ui-contract.cjs and node scripts/v1-manager-contract.test.cjs.
2. For a 10,020-file first-import/rescan measurement on the Pi or a disposable NAS test mount: set TMPDIR to that test mount and run ARCHIVIST_IMPORT_BENCHMARK=1 go test -count=1 -run '^TestServerImportTenThousand$' -v .; the test creates/removes only its own temporary files. Record the logged import/rescan elapsed time and allocated bytes; allocation is not peak RAM. Use an OS process monitor separately for peak RSS and concurrent-stream impact. Synthetic PDF placeholders do not prove real parser speed.
3. Start a fresh disposable server database with test media mounted read-only. In a clean browser create owner access, add a folder, start import, close/reopen the browser, follow Review books, confirm grouping and publish, then open a book. No README should be needed. Confirm empty folder and unreadable-folder guidance, keyboard focus and 1920x1080 layout.
4. Run existing empty-mount, partial-audiobook, NAS-failover and interrupted-job tests. On disposable SMB/NFS disconnect/reconnect during import; verify identity, locks and progress survive. Never use household media or a production database.
5. Check representative synthetic multipart audiobooks, conflicting sidecars and comic issue/collection fixtures against canonical-app expected grouping; record discrepancies rather than assuming code similarity means parity.

Physical Pi/HAOS/SMB/NFS, browser/phone and real-media acceptance: BLOCKED until those environments and fixtures are exercised. No merge, deployment or release.
