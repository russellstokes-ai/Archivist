# Assist metadata continuation — 17 October 2026

Base: 36fa0da6c29990255392e47bcd28a6c695b1edc7 on fix/assist-metadata-durable-20261017.

Scope remains Android local libraries. Online metadata catalogues may enrich local files when enabled. Server libraries are a separate workstream. No APK, merge or deployment is authorized by this continuation; the owner additionally requested no new builds and minimal usage.

Implemented and verified in this continuation:
- Reject saved-edition conflicts in narrator, language, publication year, series and explicitly contradictory identifiers. Apply series and identifier conflicts between candidate editions too.
- Wait for an in-flight portable export, then export the latest requested revision instead of returning a stale receipt.
- Allocate and persist the portable UUID before native export; reuse it after a lost receipt and validate the returned identity.
- Allow the same search clue to be resubmitted after toggling online metadata off and on.
- Add real-file/serialized-record/fresh-SQLite recovery coverage, restored manual-clear protection, invalid-record rejection, runtime export-race and interrupted-receipt coverage, native-provider cancellation coverage and clue UI lifecycle coverage.

Evidence: each changed behavior reproduced in a failing test before its fix. TypeScript passed. Full mobile suite passed 159/159 with real Python SQLite and installed JDK on PATH. Protected-feature gate passed (37 original, 2 repair, 7 approved brand blobs). Expo web export passed. Existing baseline iOS run 39070070300 finished successfully; this does not validate the new local changes.

Validation limitations: runtime tests simulate the native transport. Actual Android SAF export/reinstall recovery, cover restoration and device acceptance remain unverified. The added native UUID bridge has not completed Android compilation. A local compile was interrupted when the owner requested no new builds. Embedded file rewriting is not implemented by this snapshot module; original media remains untouched and the durable mechanism is portable sidecar snapshots. This is not a claim of release readiness.

Review: independent review found the two persistence races, peer-edition conflicts and offline retry bug above; all four were reproduced and fixed. No further reviewer pass was requested. The portable/provider tests covering existing successful behavior passed without changes to that behavior.

Ruling: retain changes locally without pushing because a push would trigger automated native builds. Resume from this checkpoint when handling the owner's remaining bugs; defer build/release work until requested.

Environment: Windows checkout line-ending conversion initially broke byte-pinned tests. Exact committed text was restored only for proven line-ending-only changes; protected sources were not edited. Initial suite failures were resolved by restoring repository line endings and supplying installed Java/Python runtimes. Initial web export mkdir failure was resolved by creating its output directory before retrying.
