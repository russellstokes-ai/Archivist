# Population repair — 24 October 2026

Owner report on QA 40090999658: discovery navigated to Library, population showed zero for 30 minutes, and stage two lacked the scan progress meter.

## Changes

- Discovery no longer opens metadata review automatically. Starting on Shelf leaves the user there for Identify & populate.
- Population projects changed work rows through the existing incremental database upsert. It no longer reloads and replaces the entire local catalogue per notification or repeats that projection through a second subscription.
- Identification queue preparation reports its own progress and yields every 25 items. Cover extraction is queued after an item is processed rather than competing with preparation of the entire batch.
- Each Assist lookup has a 120-second overall deadline, covering provider fallbacks and deeper recognition. Expiry aborts the lookup, fences late results, and allows the durable queue to retry with its existing bounded backoff. It does not lower match confidence or fabricate metadata.
- Shelf and Library use one population display with a progress bar, processed/total, identified, unresolved, retrying, and current title. A completed discovery no longer marks identification complete. Cancellation also pauses a population resumed in the background.

## Evidence and limits

Targeted tests exercise a hung provider through the real Assist controller, cancellation and late-save fencing, progress accounting, and the actual App update function against 20,000 rows. A single metadata update writes one row, retains library order, and does not reload/rewrite the full catalogue.

The device's exact 30-minute incident has not been reproduced from a diagnostics export. The full-catalogue write amplification and absent overall lookup deadline were confirmed in source. A physical-device rescan/population test remains required; automated success does not establish catalogue-provider coverage or guarantee every item is identified.

No accepted splash, awards, player or reader animation changes. Original protected baseline hashes remain intact; the App changes are recorded as reversible Discovery deltas.

## Validation

24 October: TypeScript `tsc --noEmit` passed. The full mobile run passed 197/205 suites; the remaining eight failed only because Windows CRLF conversion prevented the exact protected App hash from matching. After restoring LF source bytes, all eight passed on rerun (205/205 combined). The protection gate remains active and restores the unchanged original baselines. Android release lint, APK assembly and physical-device acceptance have not yet run for this repair.
