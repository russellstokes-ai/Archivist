# Native hang protection — source checkpoint, not Android acceptance

The user asked whether there is a scanner/metadata system to test and whether hanging is fixed. There is no complete testable replacement in the app yet. This change supplies fresh native safeguards; it does not establish that the original hanging symptom is fixed on Android.

## Implemented source

New Java components are independent of historical scanner algorithms:

- ScannerTaskPool limits each native phase to two actual workers, a queue of 128 and an eight-second caller deadline. A timed-out worker retains its slot until it actually returns. All occupied slots quarantined causes the phase to reject/stop queued work. Cancelling a scope rejects queued/active results promptly and requests provider cancellation through a separate finite executor. No new worker capacity is created to replace blocked operations.
- ScannerBoundedIO requests at most 64 KiB of header data and owns/closes its stream, including when opening or reading completes after cancellation. A stream that makes no progress reports an error.
- ScannerDocumentAccess queries at most 128 entries per returned page, checks selected-tree membership, passes Android CancellationSignal where supported, and closes cursors/descriptors. The membership call itself has no cancellation parameter and remains subject to quarantine.
- ArchivistScannerModule exposes scoped queryChildren/readHeader/cancelScope/diagnostics. Pools are process-wide so a JS/module reload cannot bypass occupied native slots. Header results are explicitly header-only, not fabricated bibliographic metadata.
- ArchivistScannerPackage is registered beside the existing reader package. This does not switch the app's scanning controller to the new pipeline.

Java was selected for these components to run the exact worker/read code directly on the JVM without Android stubs. This adapts the earlier Kotlin-file plan while retaining the specified native boundary and isolation.

## Observed checks

- Test-first native suite failed before the new worker and bounded-read classes existed. A subsequent failing decoder test found a path that could leave the caller waiting; LinkageError now reports an error.
- Actual JVM threads deliberately ignore cancellation, occupy both slots and return late. Tests verify finite queue, timeout quarantine, no replacement workers, circuit breaking, cancellation, late-result suppression and recovery. Bounded stream tests verify byte caps and cleanup after cancellation.
- Native Java source compiles against Android API 36 and the project's exact React Native 0.83.10 classes. The downloaded React Native artifact's SHA-512 matches its Maven module metadata. Compiler emitted three dependency annotation/deprecation warnings; no compilation errors. This is source compilation, not a full packaged app build.
- Full app TypeScript check passes. Full mobile suites: 72/72 in a disposable LF-only replica; original Windows checkout 70/72 with the same two documented CRLF baseline failures. Fifteen canonical raw UI hashes remain identical.

## Remaining acceptance

Full Gradle app build fails before source compilation because Gradle 9 rejects project directories for which Java canWrite reports false. A direct Java probe reports canWrite=false while successful directory creation proves actual writes are permitted. This is a local tooling problem; no permission bypass or build-gate suppression was added. The documented Gradle rule is https://docs.gradle.org/current/userguide/upgrading_major_version_9.html .

The emulator startup/acceleration failure remains unresolved after one software-mode retry with newly granted ADB state access. No scanner Android run is claimed. Actual ContentResolver cancellation, provider stalls, descriptor counts, native queue behaviour and UI responsiveness require on-device/emulator evidence.

Source continuation adds a tested resumable native traversal adapter, bounded ID3/MP4 header parsers and a versioned SQLite clue cache. The virtual-provider traversal accounts for all 8,016 supplied inventory files across per-batch restarts. Full mobile verification is now 74/74 LF and 72/74 original CRLF with the same two baseline failures; all 15 canonical hashes match and full TypeScript passes. Tiny generated MP3/M4A/M4B files independently decode and their synthetic metadata fields match. These are desktop tests, not Android acceptance.

Clue collection wiring, seekable reads for late indexes, bounded archive metadata and controller integration remain pending. S3 remains OPEN; S4-S7 must not be marked passed or skipped.

No scanner APK is released. The current application scan path has not been replaced, so these source tests do not prove the hanging in the installed application is fixed.
