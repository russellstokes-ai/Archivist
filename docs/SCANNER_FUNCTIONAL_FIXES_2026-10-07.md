# Scanner and metadata functional hardening — Test 14 scanner

Based on `4541470` on `dev/test13-canonical-media-pipeline`; approved Test 13 UI retained. Isolated branch `fix/test13-scanner-commercial-20261007`. Do not merge to main before physical-device acceptance.

## Changes
- Separate work identity ambiguity from incomplete metadata. A trusted title with artwork may publish without an author; genuine identity conflicts remain staged. Optional series disagreements do not suppress publication. Generic chapter titles remain blocked even with an author.
- Normal audio inspection uses one process-wide native reader, bounded MP3/MP4 head/tail windows, positional reads (no sequential seek through a large file), one-second native deadline and provider cancellation/descriptor closure. If a provider ignores cancellation, the circuit remains open for the process lifetime; no replacement workers accumulate. JS timeout is only a secondary guard. Non-seekable and unsupported audio remains unresolved rather than falling back to unbounded reads.
- Cancel background refresh when entering a local editor. Serialize native catalogue transactions, merge edited work into the current durable catalogue, persist overrides and verify all edited fields and chapter metadata before acknowledging success.
- Accepting a selected search result now replaces provisional search clues with that explicit choice and protects it as manual metadata. Updated cover selection invalidates the old jacket slot.
- Preserve manually cleared text/numeric fields on rescan and prevent automatic enrichment/grouping from filling protected blanks.
- Cache filename inference during canonical metadata selection instead of repeating parsing for each metadata field.

## Validation
Run `npm run typecheck` and `npm test` from mobile. Editor test uses an actual on-disk SQLite database, queued scanner writes, reopen, override replay, chapter preservation and injected persistence failures. Publication tests distinguish weak chapters, missing authors, generic titles and real conflicts. Native bridge test verifies timeout propagation and absence of unsafe fallback.

Android APK workflow retains lint, assembly, signature/alignment/package checks and emulator smoke. Test build 14-scanner/versionCode 103 does not replace canonical Test 13 assets.

## Device acceptance still required
Use the same Fold library: compare publication count, inspect grouping for different root-level books, play multipart audio in order, edit several fields and a cover, restart and rescan, and cancel/retry preparation. Test both Fold sizes against locked UI.

No claim of perfect detection or physical-device verification. MP4 metadata outside bounded windows, unsupported tag formats, non-seekable providers and genuinely ambiguous identities may still need selected-work Deep Search. A native timeout deliberately disables automatic tag reads until app restart. Optional author enrichment is attempted by subsequent preparation/online lookup; no additional perpetual background service was introduced.
