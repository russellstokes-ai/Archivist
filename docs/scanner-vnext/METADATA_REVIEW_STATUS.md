# Metadata and onboarding checkpoint — 2026-10-10

The user physically accepted scanner grouping, speed and no hangs in c2fcbfeac538de2389bc9071b86c924f16d13d54. That scanner is canonical: remote branch `canonical/scanner-fold-20261010`, local tag of the same name, recovery bundle outside this checkout, and 24 normalized SHA-256 file guards in CANONICAL_SCANNER_LOCK.json. Do not change these files or refresh hashes to permit changes without a new explicit scanner request.

Metadata changes are isolated on `feature/archivist-metadata-review`:

- 23 fixed, editable broad Genre choices. Sci-Fi is the dropdown label; stable stored taxonomy IDs/labels preserve Atlas compatibility.
- Provider audience tags no longer suppress one clear content genre (Fantasy plus juvenile fiction).
- Already-confirmed identities can fill missing genre, cover and year when eligible matching records agree. Conflicting years are not guessed. Manual edits are preserved.
- Open Library first publication year and Google Books publication date are now mapped into candidate metadata. Missing/invalid dates remain missing.
- Failed/interrupted Assist requests become retryable, explicit retry bypasses the negative cache, and accepted results refresh the open editor including its year. In-flight results do not overwrite newly typed drafts.
- Phone metadata editor has a bounded scroll area, keyboard avoidance, safe-area padding and persistent Save/Close controls. Errors appear inside the editor.
- Organise presents metadata review first with a work count, explains Save/Assist, reduces rescan emphasis and marks physical file movement optional.
- The existing three proportional Atlas sectors remain Format, Publication Year and Genre, with their existing breakdown/list controls. Their visual design and scanner are unchanged.

Validation: final TypeScript check passed; 95/95 mobile suites passed on the final LF-normalized verification replica; all 24 scanner locks passed; all 14 other locked UI files remained byte-identical, with App edits recorded reversibly in UI_BINDING_EXCEPTIONS.json. End-to-end synthetic test uses the actual provider parser, SQLite metadata store, runtime publication and work projection to verify three chapters count as one book in all three charts and populate the constellation; manual genre/year edits remain protected. Existing Atlas tests cover proportional sectors, 8 viewport geometries and a 2,000-work graph (logic tests, not phone performance).

Approved live Open Library checks used only The Hobbit / J. R. R. Tolkien and The Long Shoe / Bob Mortimer. Replaying those recorded responses after the parser fix returns Hobbit Fantasy, cover and a 1937 first-publication record, but another eligible record says 2026: no automatic consensus year is claimed. The Long Shoe returned no matching record from Open Library. No additional live user-library queries were sent for this checkpoint.

Not yet verified: native rendering/keyboard behavior and live Assist transport on the physical phone, and updated APK installation. No emulator work was done. Automated logic checks do not replace physical Fold/normal-phone acceptance. The CI workflow builds the entire app and releases an acceptance APK only after its automated gates pass.
