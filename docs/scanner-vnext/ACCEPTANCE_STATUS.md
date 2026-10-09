# Fresh scanner acceptance status

This is a development checkpoint, not a complete app or APK release approval.

| Check | Observed result | Scope |
|---|---|---|
| Supplied inventory accounting | 8,016 / 8,016 records accounted for | Private offline inventory replay; does not prove actual media decoding |
| Confirmed multipart grouping | Pair precision and recall 1.0 across 61 confirmed parts | Hive and Thorn and Talon only; ambiguous Stormlight excluded |
| Android emulator | 11 / 11 instrumented tests passed | API 35 controlled native SAF provider, cancellation, descriptor cleanup, bounded seek/archive reads, artwork decoding/cache and main-looper responsiveness |
| Mobile regression suite | 90 / 90 suites passed | LF-normalized disposable replica after fresh app bindings; new hosted run pending |
| TypeScript | Passed | Full current mobile source |
| Canonical UI | 14 original raw file hashes match; App restores byte-for-byte after approved copy and explicit binding/control exceptions | UI_BINDING_EXCEPTIONS.json records reversible changes; actual screenshots pending |
| Assist | Focused work-level, paging, cache, offline, conflict and edit-race checks pass | New core controller; provider auto-accept disabled until calibration |
| Genre / Atlas | Canonical-category and distinct-published-work invariants pass | Core projection, not populated canonical app visuals |
| Publication / recovery | SQLite revision, restart, manual-field and prior-publication checks pass | Core staging/publication and additive legacy recovery snapshot |

Latest Android evidence: hosted run `37967683578`, job `113946050615`, remote source `fa6686272afab27fdd299e55661f404e5565d5cf` matches local `1d5868f6ceed069074b0861952c6ba11861842b6` by full Git tree. Logs confirm Starting/Finished 11 tests and BUILD SUCCESSFUL. Hosted Mobile and Android native build checks passed on the same source.

Fresh Android runtime is now wired to onboarding/scan, editor Save, Assist selection/paging/conflict approval, meaningful-genre publication and Atlas's published logical-work projection. Native source/header/archive/cover adapters and optional bounded provider artwork downloads compose the fresh pipeline. Save never enumerates files. Exact physical-document membership reconciles overlapping grants; projection IDs and exact existing progress keys survive rescans. Manual metadata supplies protected grouping evidence. A separate application suffix isolates emulator state. These are code/test results, not completed whole-app emulator evidence.

## Release blockers

- Validate the integrated runtime and Library/jacket/Atlas behaviour in the actual Android app. Historical scanner/deep enrichment functions have no callers on the fresh scan paths.
- Validate legacy metadata/progress migration in app scenarios including ambiguous split/merge decisions; exact membership progress-key preservation is covered by the runtime check.
- Complete whole-app SAF picker, cancellation/restart/permission-loss, original-layout generated 342-file replay, larger-library profiling, and phone/Fold/light/dark canonical UI checks.
- Keep ambiguous/no-match/offline works visible. Do not claim rare-title coverage from the two live provider probes.
- Pass automated acceptance before distributing a uniquely named APK. Physical Fold testing remains a separate final requirement.

Whole-app acceptance workflow builds an isolated emulator-only candidate and captures evidence. It deliberately cannot upload or release an APK. No scanner APK has been released; passing its first integrated gate alone does not close every S7 requirement.
