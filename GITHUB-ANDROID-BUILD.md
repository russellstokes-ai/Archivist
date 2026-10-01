# Build and download the Archivist Android APK

Archivist 0.9.0 has a repository-native Android build pipeline. You do not need a local Windows Android toolchain to create the testing APK.

## Run it manually

1. Open russellstokes-ai/Archivist on GitHub.
2. Open **Actions**.
3. Choose **Android APK**.
4. Choose the branch you want to test.
5. Press **Run workflow**.
6. Open the completed run and download the artifact named **Archivist-<version>-APK**.

The artifact contains Archivist-<version>.apk and Archivist-<version>.apk.sha256.

The Sprint 8 branch also runs this workflow automatically when relevant mobile or build files change.

## What the workflow checks

Before publishing the artifact it installs the pinned Node, Android and Java toolchain; installs mobile dependencies; runs Expo Doctor and a high-severity runtime dependency audit; runs TypeScript and the mobile regression suites; runs Android release lint; builds the arm64-v8a and x86_64 release variant; checks package, version and permissions; rejects unexpected microphone access; verifies signature and ZIP alignment; installs and launches the APK in an Android emulator; checks startup logs; and produces a SHA-256 checksum.

## Signing

The 0.9.0 APK is a **testing installer** using the repository test signing configuration. It is appropriate for real-device acceptance.

Production Google Play publication remains separate: production key or Play App Signing, AAB generation, Play Console testing, store assets and policy or privacy review.
