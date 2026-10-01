# Build the Archivist 0.9.1 Android testing APK

Archivist builds Android in GitHub Actions, so a Windows Android SDK is not required for normal testing.

## Run the build

1. Open `russellstokes-ai/Archivist` on GitHub.
2. Open **Actions**.
3. Select **Android Test APK**.
4. Choose **Run workflow**.
5. Select branch `dev/archivist-work`.
6. Start the workflow.

A successful run uploads `Archivist-0.9.1-Test-APK`, containing the APK and SHA-256 checksum.

## What the workflow proves

It:

- installs pinned Node, Java, Android SDK, NDK and CMake tooling;
- restores dependencies with `npm ci`;
- runs Expo Doctor and a high-severity runtime dependency audit;
- runs TypeScript and the mobile behavioural suites;
- runs Android release lint;
- builds the optimized Android release variant for arm64-v8a and x86_64;
- verifies application id, version and permissions;
- verifies APK signature and 16-KiB alignment;
- checks required ABIs and rejects legacy ABIs;
- installs and launches the APK in an Android emulator;
- publishes a checksum beside the APK.

## Signing

The 0.9.1 testing APK is deliberately signed with the repository **debug key** so authorised testers can install it without access to a production secret.

Do not upload this artifact to Google Play. Production Play builds require a private production signing key and AAB workflow.

After download, follow `MOBILE-TESTING.md`, especially the Galaxy Fold, background-audio, source-coexistence and remote-connection checks.
