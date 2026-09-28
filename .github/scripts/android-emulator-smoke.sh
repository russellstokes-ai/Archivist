#!/usr/bin/env bash
set -euo pipefail

APK="${1:?APK path required}"
PACKAGE="app.archivist.reader"
ACTIVITY="$PACKAGE/.MainActivity"

test -f "$APK"
adb install -r "$APK"
adb logcat -c
adb shell am force-stop "$PACKAGE"
adb shell am start -W -n "$ACTIVITY"
sleep 15

PID="$(adb shell pidof "$PACKAGE" | tr -d '\r')"
if [ -z "$PID" ]; then
  echo "Archivist process exited after launch"
  adb logcat -d -t 600
  exit 1
fi

if ! adb shell dumpsys activity activities | grep -E 'mResumedActivity|topResumedActivity' | grep -q "$PACKAGE"; then
  echo "Archivist did not remain as the resumed activity"
  adb logcat --pid="$PID" -d -t 600 || true
  exit 1
fi

APP_LOG="$(adb logcat --pid="$PID" -d -v brief || true)"
printf '%s\n' "$APP_LOG"
if printf '%s\n' "$APP_LOG" | grep -Eiq 'FATAL EXCEPTION|UnsatisfiedLinkError|Unable to load script|ReactNativeJS.*(TypeError|ReferenceError|Invariant Violation)'; then
  echo "Archivist emitted a fatal startup error"
  exit 1
fi

echo "Archivist release APK passed launch smoke test (PID $PID)"
