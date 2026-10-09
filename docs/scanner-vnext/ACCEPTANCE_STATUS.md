# Fresh scanner acceptance status

This is a development checkpoint, not a complete app or APK release approval.

| Check | Observed result | Scope |
|---|---|---|
| Supplied inventory accounting | 8,016 / 8,016 records accounted for | Private offline inventory replay; does not prove actual media decoding |
| Confirmed multipart grouping | Pair precision and recall 1.0 across 61 confirmed parts | Hive and Thorn and Talon only; ambiguous Stormlight excluded |
| Android emulator | 10 / 10 instrumented tests passed | API 35 controlled native SAF provider, cancellation, descriptor cleanup, bounded seek/archive reads and main-looper responsiveness |
| Mobile regression suite | 86 / 86 suites passed | LF-normalized disposable replica; later fixes require a fresh verification result |
| TypeScript | Passed | Full current mobile source |
| Canonical UI | 14 original raw file hashes match; remaining App file differs only by the two approved copy edits | No new scanner runtime or candidate controls bound into App yet |
| Assist | Focused work-level, paging, cache, offline, conflict and edit-race checks pass | New core controller; provider auto-accept disabled until calibration |
| Genre / Atlas | Canonical-category and distinct-published-work invariants pass | Core projection, not populated canonical app visuals |
| Publication / recovery | SQLite revision, restart, manual-field and prior-publication checks pass | Core staging/publication and additive legacy recovery snapshot |

Android evidence: hosted run `37956864935`, job `113909480449`, remote source `d7d88b0ac316e457f1d31a1d1755f936364e3b1f`.

## Release blockers

- Bind fresh runtime to onboarding, scan, editor Save/Assist choices and Atlas; remove old deep scans from those paths.
- Complete native artwork/cache adapters and validate Library/jacket readiness.
- Apply and validate legacy progress/identity migration; the recovery snapshots alone do not migrate app bindings.
- Complete whole-app SAF picker, cancellation/restart/permission-loss, original-layout generated 342-file replay, larger-library profiling, and phone/Fold/light/dark canonical UI checks.
- Keep ambiguous/no-match/offline works visible. Do not claim rare-title coverage from the two live provider probes.
- Pass automated acceptance before distributing a uniquely named APK. Physical Fold testing remains a separate final requirement.

No scanner APK was built or released at this checkpoint.
