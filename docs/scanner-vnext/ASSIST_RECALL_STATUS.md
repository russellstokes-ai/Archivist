# Assist-only follow-up — 2026-10-11

User accepted the scanner and direct-review onboarding in remote 63b67efe25bc1073d3300cf4a6a3e96149dc0885 (local 4c42033). Preserve both. Local tag canonical-process-fold-20261011 and CANONICAL_PROCESS_LOCK.json cover seven accepted onboarding/review/scanner-integration functions; the existing 24-file scanner lock remains unchanged.

Changes limited to Assist/provider matching and the metadata editor:
- Exact bibliographic query, broader catalogue query, and bounded explicit-search spelling/spacing fallback. Broad related results are review choices, never automatically trusted identities. Up to 20 per query and further pages remain available; duplicate IDs are merged.
- Partial titles/subtitles remain visible. Equal scores preserve catalogue relevance rather than arbitrary record-ID order. Cache version advances so old no-match results do not mask improvements.
- Missing genre/year/cover fields can be supplemented from compatible same-author, same-base-title records when they agree. Existing selected years and manual edits remain protected. Comma-separated subject hierarchies now map to canonical genres, including Science Fiction.
- Candidate cards show available covers, author, genre and year. Assist is a filled gold button, with a subtle opacity pulse for missing core metadata that respects reduced motion.
- Android metadata modal relies on existing native adjustResize instead of applying KeyboardAvoidingView height a second time. Footer cannot shrink. This addresses the reported clipped buttons after keyboard dismissal; physical confirmation is still required.

User explicitly approved six title-only live Open Library queries. Actual SearchService calls found Bobiverse-related books (6 candidates), Outgunned choices including Denny Flowers (21), Hobbit editions (27), and Master of Mankind (20). Master of Mankind's 2017 record gains Science Fiction from its compatible record. These candidate counts are not identification accuracy. Half Horn returned related noise, not a convincing intended match; Assanorium returned no match. Do not invent genre/year where catalogue evidence is absent. Google Books remains available only when configured; no new provider or silent external destination was enabled.

References: https://openlibrary.org/dev/docs/api/search . Local evidence files live outside the public repository: assist-title-evidence.json and live-assist-recall-results.json. No media files or library paths were sent. No emulator run. Accepted process and scanner must stay frozen in subsequent work.
