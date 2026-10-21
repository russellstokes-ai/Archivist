# Three mobile repairs — source verification checkpoint

## APK HOLD / no wider UI changes

The owner's latest sequence remains binding: finish the three repairs, then present targeted UI recommendations for review, then implement only approved refinements. **Do not build or dispatch an APK.** This is a source-level checkpoint, not owner-device acceptance or a production release.

## Exact verified source

- Repair branch: `qa/three-fixes-20261021`.
- Baseline: mobile PR85 source `73a6282ff5d2358fac08029ee82ef9f5f96f4bad`.
- Verified repair commit: `6fa38091d00f744031dc488976d0de739ce7a46d`.
- Mobile checks: [39592803632](https://github.com/russellstokes-ai/Archivist/actions/runs/39592803632), **SUCCESS**. Protected-source gate, Expo Doctor, baseline and effective-source TypeScript, all mobile test suites, version consistency and the actual Metro web export passed.
- The preceding `6b00532` run proved **161/161 suites passed** but exposed a nested Expo dependency resolution error at bundling. `6fa3809` fixes that exact resolution and adds actual transformer loading to the integration regression; its complete run passed. No dependency upgrade was needed.

## Repair 1 — comic preparation / 24% stall

Implemented: real preparation counts; named operation boundaries; operation transitions are not lost to count throttling; observable batched native catalogue writes; generation-aware cancellation before/during the atomic transaction; scan ownership retained until native persistence settles; safe rollback of failed/cancelled replacement.

An additional deliberately never-returning artwork fixture reproduced a real blocking path: optional artwork could indefinitely hold preparation and cancellation. The repair reuses the existing bounded-task implementation with one five-second artwork lane. A timed-out request retains its lane until it actually settles. Remaining comics are retained for review, not silently dropped or published without ready artwork. Late completion cannot publish stale work, and restarting a scan cannot accumulate replacement native requests.

Verified evidence from the repair tests:
- Real SQLite, synthetic source adapters: 65 comic works completed, one artwork error retained for review, real completed/total events reached 65/65.
- Unresponsive artwork: three comics retained; one request quarantined; completion in approximately five seconds; no late publication; explicit retry recovered after actual worker settlement.
- Cancellation during unresponsive artwork and safe restart passed.
- Native stage-store SQL executed through a real SQLite adapter: 3,000 durable records in 47 bounded inserts, manual fields and original ordinals preserved, cancellation rollback, genuine SQL-error rollback and database reopen passed.
- Existing malformed-archive/native-worker/publication/identity tests remain passing.

**Limit:** this reproduces and fixes a possible blocking operation, not a trace from the owner's phone. It does not prove that artwork was the specific cause of the reported physical 24% stall. A genuinely unresponsive database write is not abandoned by a timer; its operation remains named and ownership is retained to protect data. Final acceptance requires the owner's representative media on the Fold after a later authorised APK.

## Repair 2 — profile photo

Implemented: substantial Change photo directly beneath the large avatar; native editing disabled; app-owned circular preview; visible Use photo and Cancel in a safe-area footer; draft-only selection; image validation and verified private copy; UI replacement only after durable settings save; error/cancel retains the old photo. Large-text footer stacks, invalid images cannot be accepted, and busy states prevent duplicate commits. The Use photo label uses dark ink on the existing gold fill; the hero action uses normal foreground ink rather than low-contrast gold body text.

Verified: commit ordering, failed-save cleanup, cancellation during copy, oversized/invalid/remote input rejection, preview decode gate, footer/cancel behaviour and light/dark label contrast tests. Physical Android picker interaction, actual large-text clipping and restart on the owner's Fold remain acceptance checks.

## Repair 3 — Shelf / Atlas header gap

Implemented: heading, description and existing action now occupy one compact header group rather than two independently spaced page sections. Wide layout places the action beside the heading; narrow/large-text layout stacks it with a small internal gap. Existing action labels, graph/rings, typography, navigation and avatar clearance are retained.

Verified: source integration and narrow/wide/large-text component-layout branches. Physical screenshots in both Fold positions remain an acceptance check. No global spacing reduction or unrelated screen redesign was applied.

## Explicit executable-source mechanism

`mobile/threeFixes` contains named SHA-bound reversible source edits for the original accepted App and scanner runtime. Metro, effective-source TypeScript and the new behaviour tests share the same pure source function. Every transformation verifies the full baseline blob, unique anchors and exact reverse reconstruction. The actual compiled source changes; unchanged original lock tests alone are not evidence of repaired behaviour.

Effective source blobs verified in TypeScript: App `9afb2a82eddf1ca5f15e9839a9a9c19a2c2b94e0`; scanner runtime `c7fe25b80abb16fc739afffeb2f69ac47c0990c9`. The bundler delegates to the installed Expo transform resolved from Expo's own package. See `mobile/threeFixes/README.md` for review/materialisation instructions.

No server, Living Book renderer, approved transport art, navigation, grouping/publication rules, workflows, release metadata or credentials were changed. No merge, APK, production build or distribution occurred.

## Next stage

Perform the source/screenshot UI-affordance audit and present a small prioritised set of recommendations. The audit is not permission to restyle every quiet control. Keep recognisable filled buttons, conventional links, tabs and tappable rows where they already work. Wider implementation awaits the owner's review.
