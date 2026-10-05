# Test 10 Sprint 4 — Durable Now / Playback Persistence

Status: automated green.

Branch: `fix/test10-sprint4-player-persistence-20261005`  
Base (Sprint 3 checkpoint): `dae26658623e1ac023d3734d5753bbb2e38d5062`  
Validated implementation head: `2c09844bb5fd6464322b4f675f32d7286da95c5a`

## Permanent-fix contract

Archivist now has one authoritative durable **Now** session for the last-opened audiobook, book or comic.

The session survives app/background lifecycle changes and is resolved by stable media identity rather than presentation metadata. Opening another title replaces the authoritative Now item. Background progress from an older still-active medium is allowed to save its own progress but cannot steal Now back.

Tapping **Now** reopens the authoritative item directly at its saved position. There is no extra Resume step.

## Implemented

- Added versioned `archivist.nowSession.v1` durable state.
- Added stable identity rules:
  - server: server URL + server work ID;
  - grouped local audio: local work key;
  - standalone local content: URI;
  - presentation metadata is not identity.
- Metadata/title/author refreshes therefore update presentation without invalidating the current Now identity.
- Local audio saves exact track URI and seconds.
- Server audio mirrors the active server track ID and seconds into durable Now while server progress remains authoritative.
- Reader sessions save exact page position.
- Local EPUB/comic resume supports an explicit durable page.
- Server reader `archivist-reader-ready` messages now update shared page/count state so server reading participates in the same Now model.
- Local audio checkpoints every five-second progress bucket and on paused/lifecycle states.
- Server audio mirrors into Now every ten-second progress bucket and on paused states.
- App background/unmount uses a current checkpoint ref rather than a stale React effect closure.
- Android Auto progress is consumed into the same local-work progress and authoritative Now session.
- A server Now session can fall back to its downloaded copy when the server is unavailable.
- Server resume resolves by server work ID and can fetch its tracks directly without waiting for the general work list to refresh.
- Startup waits for local catalogue, overrides, offline works and durable Now hydration before exposing the main UI.
- An early Now request after launch resumes automatically once restoration finishes.
- The last-opened ownership rule prevents background audio from replacing a newer reader Now session, and prevents hidden reader updates from replacing a newer audio session.
- The existing Living Book, reader chrome, comic gestures and Sprint 1–3 behavior remain inherited from the previous checkpoint.

## Regression locks

Added:
- `mobile/nowSession.ts`
- `mobile/now-session.test.cjs`
- `mobile/sprint10-now-persistence.test.cjs`

Updated:
- `mobile/scan-stability.test.cjs` to require the stronger startup hydration gate.

The Sprint 4 gates cover:
- stable identity across metadata changes;
- exact position preservation;
- replacing Now when another title is opened;
- current-state lifecycle checkpointing;
- periodic local/server audio persistence;
- reader page persistence;
- server-reader position sync;
- offline downloaded fallback;
- Android Auto handoff;
- direct Now reopening;
- last-opened ownership;
- startup restoration ordering.

## Validation

### Mobile
GitHub Actions run: `37324605034` — **success**

- Expo Doctor — success
- TypeScript — success
- Mobile tests — **57/57 passed**
- Durable Now model test — success
- Sprint 4 persistence closure gate — success
- Version consistency — success
- Expo web export — success

### iOS
GitHub Actions run: `37324605049` — **success**

- Xcode 26 selection — success
- Dependency install — success
- Expo Doctor — success
- TypeScript — success
- iOS prebuild — success
- CocoaPods — success
- iOS simulator compile — **BUILD SUCCEEDED**

## Physical acceptance still required

Automated validation proves the implementation and build gates. The later device test pass should still physically verify:
- kill/relaunch at a known audiobook timestamp;
- reboot and resume;
- reader page resume;
- Fold close/open while playing/reading;
- Android Auto -> phone position handoff;
- server-to-downloaded fallback while offline;
- lock-screen/Bluetooth control interaction.

Do not mark those hardware observations as tested until they have actually been exercised on device.

## Next sprint rule

Any subsequent Test 10 sprint must inherit this Sprint 4 branch/head (or a descendant containing it). Do not restart from Sprint 3 or an older mobile branch.
