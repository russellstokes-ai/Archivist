# Build the Archivist Android APK in GitHub

This avoids building on Windows.

## One-time setup

1. Upload this repository to `russellstokes-ai/Archivist`.
2. Open the repository on GitHub.
3. Go to **Actions**.
4. Choose **Android APK**.
5. Press **Run workflow**.

When it finishes, open the workflow run and download the artifact named:

`archivist-debug-apk`

Inside is the APK for Android testing.

## What this proves

The workflow installs Node, Java 21, Android SDK 36, NDK 27.1, mobile dependencies, runs the mobile typecheck and JS tests, then builds a debug APK.

## What this does not prove yet

This is not a Play Store release build. Before release, Archivist still needs a signed AAB, store listing, privacy policy, Play Console internal testing, real Android device acceptance, and Home Assistant server testing.
