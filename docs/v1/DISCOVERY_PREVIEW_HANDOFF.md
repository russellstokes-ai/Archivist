# Discovery Preview QA handoff

Branch: fix/assist-pipeline-20261022. Version: 0.10.0, Android versionCode 104.

This is a QA candidate, not a production or physical-device acceptance claim.

Implemented: separate discovery/population/review actions; durable identification,
cover and metadata-write queues; revision and generation checks; independent
identity evidence; bounded embedded cover/MP4 metadata reads; file snapshots,
verified receipts and explicit interrupted-write recovery; proportional Atlas
catalogue projection; layout/photo-preview and Living Book recovery changes.
No file renaming, new sidecars or embedded artwork replacement.

Validation: 188/188 mobile suites passed before the final URI type guard.
TypeScript passes with that guard. UI contract, protected-source and scanner
process checks were rerun after it and passed. Git whitespace check passes.
Android release lint, native compilation, emulator startup and signed APK
verification remain required in the GitHub workflow. No new APK exists yet.

Known scope limits: R3 neighbour inference and engine-dependent R4 OCR/audio
recognition are not implemented. Unsupported containers do not gain writers
merely because the app lists them. In-file writers remain limited to their
explicit capability table, with 64 MiB for current non-audio rewrite paths.
Missing provider data is not fabricated. Real Fold navigation/player/scan and
write-recovery acceptance remain outstanding. App-side thumbnail generation
and complete format-fixture coverage remain follow-up work. Do not describe
this preview as completing every item in the implementation plan.

Build: manually dispatch android-apk.yml on this branch with qa_confirmation
and publish_direct_apk true. Publication is gated behind startup validation;
deliver the release's direct .apk asset, never an Actions ZIP or an older APK.
The workflow must be green before describing the download as validated.
