# Test 15 editor / grouped review

Parent: 3c8c577e4d83d3f12f39ba73fe2abcdcdf6547e2 (working Test 14 scanner).

- Review badges and review list count grouped books, not chapters. Regression: 227 files / 12 books.
- Metadata editor uses a bounded, keyboard-aware phone/Fold form with persistent Smart Search, Save and Cancel. Search and results sit immediately after title/author; selection populates the draft for inspection before saving.
- Smart Search accepts title, author or both. Manual queries exclude stale filename clues. Searching no longer writes overrides or catalogue changes; Save retains verified whole-work persistence. Search respects configured providers. Author-only results always require user selection.
- Settings retain provider configuration and consolidate detailed sorting controls in Library management, avoiding two copies of the same workflow.
- Progress rendering is throttled to 450 ms and onboarding publication assessment is memoized. Scanner grouping, native reader limits and file-moving safety remain unchanged.

Validation: 75 mobile suites pass, including new behavioral review-count and author-only/precise search cases; TypeScript passes. Android CI will validate the built artifact. Device acceptance: phone keyboard/action visibility, search/select/edit/save/restart, Fold layout, scan responsiveness and whole-work organising preview. No physical-device or visual-emulator result is claimed here.

APK: Test 15-editor, versionCode 104. Keep main unchanged pending device acceptance.
