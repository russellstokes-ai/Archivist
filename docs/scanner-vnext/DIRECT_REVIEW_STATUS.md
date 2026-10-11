# Direct metadata review and save contention — 2026-10-10

User tested ff9c6f3 and reported that metadata-review taps played audiobooks, Manage Library was unintuitive, and Save reported `Database is locked`. User requested removal of the separate management page, direct post-scan review, maintenance functions in Settings/long-press, and preservation of canonical scanner and other UI.

Changes:
- No separate Manage Library page. Its maintenance controls remain under expandable Settings library tools, including source scans, optional verified copy/move and duplicate review. Existing book long-press editing remains.
- After a scan with uncertain works, open metadata review directly. Review-row taps and an explicit Edit details button open the editor; no playback action remains in review rows. Normal-library playback is unchanged. Done reviewing completes onboarding without requiring file moves.
- Onboarding step 3 is Review book details, not file organisation.
- Metadata, search-cache, Assist-state, publication and UI catalogue writers share a serial write queue. Temporary SQLite BUSY/LOCKED failures retry the whole rolled-back transaction up to four times (50/150/350/750 ms). Other failures and stale revisions are not retried. No scanner adapter/discovery/grouping/runtime file changed.

Root-cause evidence: review-row handler called openBook directly. Metadata Save starts asynchronous Assist and refresh/publication while the UI catalogue writes a second exclusive transaction to the same archivist-local.db; these writers previously had no common queue. Installed Expo implementation creates separate connections for exclusive transactions and rolls back failures. Added tests exercise overlapping writes, transient/permanent lock failures, rollback/retry without duplicate revision increments, manual-field preservation and stale-write rejection using the SQLite test port. This is not a claim that the phone error was reproduced on an emulator.

The obsolete UI tests that required the removed page were updated to the explicit user-requested flow. REVIEW_FLOW_TEST_EXCEPTIONS.json records reversible changes to the original locked contract test. App edits remain reversible in UI_BINDING_EXCEPTIONS.json; scanner hashes and locked style snapshot remain unchanged.

Physical acceptance still required: Save while background Assist runs; tap review rows without playback; complete onboarding; open optional tools from Settings. No emulator work was undertaken. Current APK will be built only after automated checks.
