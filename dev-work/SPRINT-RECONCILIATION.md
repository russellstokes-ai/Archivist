# Archivist Sprint Reconciliation

Updated: 1 October 2026

This file is the authoritative development ledger for the recovery branch. It separates:
- **Durable** — code or evidence currently preserved in GitHub / persistent artifacts.
- **Recoverable** — work was completed or substantially completed before the temporary workspace reset and can be reconstructed from salvaged code, tests, design/specification and the recorded implementation history.
- **Outstanding** — not yet implemented to release standard, or not yet re-verified after reconstruction.

Do not mark a sprint complete until its implementation is present on `dev/archivist-work`, tests pass, and the sprint checkpoint is committed to GitHub.

---

## Sprint 0 — Recovery & Baseline

### Durable
- Preserved Work-session version remains untouched.
- Advanced pre-broken source preserved on `recovery/export-pre010-20260930`.
- Dedicated development branch exists: `dev/archivist-work`.
- Durable workspace policy exists under `dev-work/README.md`.
- Build specification and design standards are preserved.
- Go 1.25 server / HA validation previously completed successfully on the recovery branch.
- Mobile baseline previously passed the recovered regression suites before the ephemeral workspace reset.

### Outstanding
- Reconstruct the best mobile state into `dev/archivist-work`.
- Re-run baseline mobile regression from the durable branch.
- Create `dev-work/checkpoints/sprint-00.md`.

**Status: ACTIVE / recovery foundation established, durable code reconciliation still required.**

---

## Sprint 1 — One Library, Multiple Sources

### Work completed before reset
- Local, Server and Downloaded treated as separate sources rather than a global connection mode.
- Local catalogue and server catalogue split so server refresh cannot overwrite the phone catalogue.
- Stable source-aware work identity.
- Downloaded server works retain original server/work identity.
- Unified All / On this device / Server / Downloaded filtering.
- Downloaded server copies deduplicated from their online server copy in All.
- Source-aware cover, open, reader and playback routing.
- Local reading/playback continues correctly while a server is connected.
- Mixed-source queue design implemented rather than separate local/server queues.
- Local organisation and duplicate tools remain available while connected.
- Source-aware Space scoping.
- Server sign-out does not remove local catalogue.
- Atlas/Insights coexistence leaks were identified and corrected in the lost local workspace.
- Behavioural source/coexistence tests were added and passed before reset.

### Durable / recoverable evidence
- Pre-broken source baseline is durable.
- A salvaged Sprint-2 patch contains exact Sprint-1/Sprint-2 `App.tsx` code hunks: 57,245 bytes / 917 lines recovered.
- Detailed implementation record is preserved in project history.

### Outstanding
- Reconstruct all Sprint-1 changes into `dev/archivist-work`.
- Re-run source/coexistence behavioural tests from the durable branch.
- Verify mixed-source queue persistence and source-aware progress after process restart.
- Create durable Sprint-1 checkpoint.

**Status: RECOVERABLE, not yet durably reconstituted.**

---

## Sprint 2 — Shelf & Library UX

### Work completed before reset
- Four primary tabs: Shelf / Library / Atlas / Insights.
- Player/Reader contextual; Settings moved out of bottom navigation.
- Shelf rebuilt as vertically scrolling editorial/curated surface.
- Library separated into dedicated browse/search/filter/manage surface.
- Clean cover-first cards; cluttered per-card queue/download/rating controls removed.
- Bottom action sheet introduced for secondary actions.
- Source selector redesigned for All / Device / Server / Downloaded.
- Search, sort, grid/list and deeper filter sheet.
- Saved Smart Shelves model and UI.
- Saved cross-source Collections.
- Stable collection identities across server/downloaded copies.
- Bulk selection with Add to collection / Favourite / Done.
- Smart Shelf / Collection See all behaviour.
- Rename/delete management for Smart Shelves and Collections.
- Persisted Shelf section visibility and ordering:
  - Continue
  - In progress
  - Favourites
  - Smart Shelves
  - Collections
  - Series
  - From your library
- Metadata-review queue redesigned.
- Designed loading / empty states.
- Fold-open responsive density work.
- Fold-open Library two-pane layout with source/Space rail.
- Scroll restoration work.
- Multiple local folders manageable after onboarding:
  - add folder
  - rescan
  - forget folder access without deleting user files
- Fallback cover styling improved for Dark mode.

### Durable / recoverable evidence
- Exact partial `App.tsx` diff salvaged from the failed export:
  - 57,245 bytes
  - 917 lines
- Additional incomplete Sprint-2 export chunks remain on `validation/sprint2-shelf-library`.
- Full design/specification and recorded behaviour remain durable.

### Outstanding
- Reconstruct the complete Sprint-2 implementation into `dev/archivist-work`.
- Rebuild any missing tail of the truncated patch from the recorded change list.
- Re-run all 16 mobile suites and UI contract.
- Perform visual review after the code is durable; visual validation must not block development.
- Create durable Sprint-2 checkpoint.

**Status: SUBSTANTIALLY RECOVERABLE; exact partial code preserved, remainder requires reconstruction.**

---

## Sprint 3 — Living Audiobook Player

### Work completed before reset
- Living Book visual replacing static-cover player.
- Book opens on play, settles on pause.
- Decorative page turning tied to visual state only, never owns playback.
- Rapid-toggle motion rules.
- Reduced-motion static mode.
- Offscreen decorative motion suspension.
- Fold-open two-pane player layout.
- Source-aware player routing.
- Unified mixed-source queue.
- Durable local pause/progress commit improved.
- Immediate local progress persistence on pause/background.
- Bookmarks added with stable identity shared by online/downloaded server copies.
- Offline download/status surfaced from Now Playing.
- Transport controls visually cleaned up.
- Multi-file audiobook custom track-order overrides.
- Non-destructive chapter editor:
  - rename
  - split
  - merge
  - boundary correction
  - reset to embedded metadata
- Offline server downloads retain chapter metadata.
- Playback behavioural testing expanded around pause/buffering/replacement.
- Native Bluetooth/output-route picker explicitly deferred because Expo Audio does not expose general output-device selection; requires native platform extension rather than a fake control.

### Durable / recoverable evidence
- Requirements and motion rules are fully specified in the persistent build/design documents.
- Detailed implementation sequence is preserved in project history.
- Exact local Sprint-3 commit did not reach GitHub.

### Outstanding
- Reconstruct Sprint-3 implementation into `dev/archivist-work`.
- Re-add tests and re-run them from the durable branch.
- Verify pause, buffering, seek, replacement, process death, profile transition and mixed-source queue persistence.
- Native output-device routing remains a later native-platform item.
- Create durable Sprint-3 checkpoint.

**Status: FUNCTIONALLY RECONSTRUCTABLE, exact source not preserved.**

---

## Sprint 4 — Reader & Comic Excellence

### Work completed before reset
- Audit confirmed recovered baseline already had meaningful EPUB/CBZ reader work, page-turn motion and Comic Focus Zoom foundations.
- Reader routing was being corrected to follow item source rather than server connection state.
- Local/Downloaded reader designed to remain local even while connected to a server.
- Unified reader tools protocol was being wired for:
  - bookmarks
  - highlights
  - notes
  - search
  - appearance
  - position/selection reporting
- Stable annotation identity planned/implemented so downloaded server copy and online copy share reading annotations.
- Local/server reader tools were being unified.
- CBR/CBT local support remained an identified gap at audit time.

### Durable / recoverable evidence
- Pre-broken reader implementation is durable.
- Design/build specifications for EPUB/PDF/CBZ/CBR/CBT, page-turn and Comic Focus Zoom are durable.
- Detailed record of the partially completed Sprint-4 work is preserved.

### Outstanding
- Reconstruct the completed reader routing/tools work.
- Finish local CBR.
- Finish safe CBT decoding and enforce archive limits before allocation.
- Finish animated/offline PDF support.
- Complete annotations/bookmarks/highlights/search/appearance end-to-end.
- Verify exact context restoration across relayout/restart.
- Verify Comic Focus Zoom on real varied-layout test files:
  - deterministic local detection
  - original pixels only
  - immediate normal-zoom fallback
  - exact return-to-context
- Verify Fold reader layouts.
- Create durable Sprint-4 checkpoint.

**Status: PARTIALLY COMPLETED BEFORE RESET; substantial implementation still outstanding.**

---

## Sprint 5 — Atlas

### Existing baseline / earlier work
- Recovered source contains an Atlas implementation and relationship logic.
- Earlier Work-session development had more advanced data-driven relationships for author/series/genre/folder/reading.
- Notes/tag relationships were explicitly still outstanding.
- The approved rounded graph/universe direction must not regress to the rejected hub-spoke/dashboard design.

### Outstanding release work
- One continuous graph/universe.
- Genre constellation hubs.
- Actual cover nodes.
- Author portraits/monograms.
- Series stacks/spines.
- Topics, collections, tags and notes.
- Combined local/server/offline source model.
- Source and Space filters.
- Search/focus.
- Mobile bottom inspector / Fold-tablet side inspector.
- Stable node positions.
- Pan/pinch/zoom preserving focal point.
- Fit/reset.
- Level-of-detail clustering.
- Accessible list/tree alternative.
- Performance tests with realistic large libraries.

**Status: IMPLEMENTED ON `dev/archivist-work`; CI validation pending.**

---

## Sprint 6 — Insights, Family & Organisation

### Existing baseline / earlier work
- Server/profile/household capabilities exist in the recovered server baseline.
- Profile stats and duplicate modules exist in the recovered mobile baseline.
- Sorting/recovery and local organisation foundations exist.
- Some Insights coexistence fixes were completed in the lost local workspace.

### Outstanding release work
- Correct reading/listening sessions and deduplicated history.
- Personal stars/ratings.
- Goals, milestones and optional achievements.
- Annotation hub.
- Family Admin/User permission polish and profile isolation.
- Smart Shelves full nested ALL/ANY rule builder.
- Metadata provider priority/provenance/locks/merge policy.
- Editions and format separation.
- Collections completeness.
- Safe sorting/recovery across roots/drives.
- Interrupted move, low-space and recovery tests.
- Optional M4B consolidation / metadata-cover writeback workflows with preview and retained originals.

**Status: FOUNDATIONS EXIST; SPRINT NOT COMPLETE.**

---

## Sprint 7 — Server, Resilience & Ecosystem

### Existing baseline / proven work
- Go server and HA packaging exist.
- Go 1.25 server/HA validation previously passed on recovery branch.
- Household, progress, file-move, reader, background-job and packaging tests exist in the recovered baseline.
- HA add-on packaging had previously been kept synchronized.

### Outstanding release work
- Pi 4B resource validation.
- Library-first server UI polish.
- Folder browser and multiple roots end-to-end.
- Optional server connection/reconnection UX.
- DuckDNS/Tailscale supported configuration behaviour.
- Watched libraries and durable restart-safe jobs.
- Bounded caches.
- Low-disk/disconnected-drive behaviour.
- Backup/restore on clean install.
- Schema migration tests.
- No media wake for dashboard.
- OPDS.
- Optional Kobo/KOReader/Hardcover/email/OIDC connectors.
- Private sharing/RSS/casting where supported.
- Cross-profile security tests.

**Status: STRONG BASELINE; RELEASE HARDENING/ECOSYSTEM NOT COMPLETE.**

---

## Sprint 8 — Perfect UI & Release Sweep

### Existing direction
- Approved visual system: Ink / Sage / Gold / Ivory.
- Editorial typography direction: Literata + Inter.
- Shelf/Library commercial redesign was substantially implemented before reset.
- Signature UI direction for Atlas, Living Player and Comic Focus Zoom is specified.
- Fold closed/open is a hard acceptance target.

### Outstanding
- Reconcile all screens onto the final design system.
- Remove placeholder/generic admin UI.
- Replace cheap Unicode/glyph controls with proper icons.
- Perfect light/dark states.
- Sheets, transitions and motion polish.
- Loading/empty/error/offline states everywhere.
- Safe areas, keyboard and accessibility.
- Fold closed/open review.
- Real-device Android acceptance.
- HA/Pi acceptance.
- Android APK build/sign/install path.
- iOS parity through shared RN code and native platform work.
- Screenshot review.
- Dependency/licence review.
- Clean install/upgrade/restore.
- Release documentation.
- Final no-placeholder/no-broken-button/no-regression sweep.

**Status: NOT STARTED AS FINAL RELEASE SWEEP; earlier UI work feeds into it.**

---

# Reconciled execution order

1. Reconstruct and durably commit Sprint 1.
2. Reconstruct and durably commit Sprint 2 using the salvaged exact patch where possible.
3. Reconstruct and durably commit Sprint 3 from the recorded completed work.
4. Resume Sprint 4 from the exact point reached before reset.
5. Complete Sprint 5 Atlas.
6. Complete Sprint 6 Insights/Family/Organisation.
7. Complete Sprint 7 Server/Resilience/Ecosystem.
8. Complete Sprint 8 final UI/release sweep.

At every stage:
- commit to `dev/archivist-work`;
- update this ledger;
- write a checkpoint under `dev-work/checkpoints/`;
- do not rely on a temporary runtime as the only copy;
- do not let CI/emulator/export plumbing block product implementation;
- if tooling starts looping, stop and request direction rather than burning time.
