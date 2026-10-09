# Hosted native Android validation

User authorized the hosted Linux route after local emulator/build failures. Stop local emulator retries. Use the isolated scanner feature branch only; do not merge main or distribute an APK before acceptance.

The scanner-native-lab workflow builds a small diagnostic application, app.archivist.scannerlab, using the exact production ScannerTaskPool, ScannerBoundedIO and ScannerDocumentAccess source files. It does not reuse the old scanner or include/change canonical screens. A separate-process DocumentsProvider supplies generated file identities and a real, independently decoded synthetic MP3 seed (SHA-256 7fb6e759a5f30ac6113c34259fd4da4e540f7b788b51a0e9d26e49e022ac7e41). Multiple identities share that seed; they are controlled fixtures, not original media or confirmed book labels.

Six Android instrumented tests cover 342 and 5,000 entries, pages of at most 128, repeated actual descriptor reads/cleanup, two uncooperative provider queries, occupied/quarantined worker slots, circuit rejection, cancellation during delayed file open, late-result suppression and selected-tree boundaries. Android logcat records observed query-only timings; reports record assertions. No UI responsiveness or whole-app discovery percentage can be inferred from those timings.

The existing branch source/mobile workflows also compile the application and run maintained tests. New workflow uploads reports and diagnostics only, never test APKs or a release. The isolated lab installs only on an ephemeral hosted emulator.

Local preparation verified Java compilation against API 36, exact AndroidX Test/JUnit classes and production scanner classes, plus YAML parsing. Runtime assertions still require an actual hosted run. S3 remains open until its full requirements pass; these tests alone do not complete missing seek/archive readers, clue collection wiring, React Native lifecycle integration or S7 picker/onboarding tests.

Dependencies use documented stable AndroidX Test versions: https://developer.android.com/jetpack/androidx/releases/test . Hosted emulator setup follows https://github.com/ReactiveCircus/android-emulator-runner .
