# Test 17 — Smart Search and phone editor

Android versionCode 106; development branch only.

- Smart Search uses the current title/author draft directly, without traversing or reading local files. Precise queries fall back to shorter title and author-only searches. A failed Open Library request no longer discards other attempts/provider results. Interactive requests have a bounded request budget; offline failure is distinguished from an empty result.
- Save persists the selected work and keeps the editor open. Close exits explicitly. Search also accepts unsaved clues. Selecting one local work and Edit metadata opens the searchable editor directly; multiple works retain bulk editing.
- Removed the Deep Search action and its local file inspection from the editor.
- Editors mount once outside animated/tab content. Onboarding and review render helpers no longer remount on every progress/state update. Bulk editor width/height are constrained; selection actions wrap below the selection count.
- Automatic work-level enrichment includes identified books missing genre; confident matches hydrate missing genre. Open Library request slots are reserved to avoid concurrent rate-limit bursts. Cache namespace updated. Existing manual field protections remain.
- Search result selection hydrates available genre, description and series. Providers may omit fields; absent values are preserved, not invented.

Validation: live Open Library query for Assassinorum Kingmaker / Robert Rath returned work OL28185289W titled Assassinorum. Regression tests cover query fallback after failure, draft-only search, Save staying open, grouped counts, selected-result hydration and automatic genre hydration. TypeScript passed; all 75 mobile suites passed across the full run and targeted reruns after updating obsolete cache/layout contracts. Device-only visual/keyboard/performance acceptance remains required. APK CI keeps native lint, package/signature checks and emulator launch gates.
