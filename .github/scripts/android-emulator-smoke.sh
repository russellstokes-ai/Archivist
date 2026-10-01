#!/usr/bin/env bash
set -euo pipefail

APK="${1:?APK path required}"
PACKAGE="app.archivist.reader"
ACTIVITY="$PACKAGE/.MainActivity"
INFRA_EXIT=86

test -f "$APK"

wait_for_android() {
  adb wait-for-device >/dev/null 2>&1 || return 1
  local attempt boot
  for attempt in $(seq 1 60); do
    boot="$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
    if [ "$boot" = "1" ] && adb shell cmd package list packages >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

recover_adb() {
  adb kill-server >/dev/null 2>&1 || true
  sleep 1
  adb start-server >/dev/null 2>&1 || return 1
  wait_for_android
}

if ! wait_for_android; then
  echo "Android emulator boot/package service was not ready; resetting ADB."
  if ! recover_adb; then
    echo "Android emulator infrastructure did not become ready."
    exit "$INFRA_EXIT"
  fi
fi

INSTALL_LOG="$(mktemp)"
trap 'rm -f "$INSTALL_LOG"' EXIT
installed=0
for attempt in 1 2 3; do
  echo "APK install attempt $attempt/3"
  if adb install --no-streaming -r "$APK" >"$INSTALL_LOG" 2>&1; then
    cat "$INSTALL_LOG"
    installed=1
    break
  fi

  cat "$INSTALL_LOG"
  if grep -Eiq 'Broken pipe|device offline|device.*not found|no devices|closed|cannot connect|Failure calling service package' "$INSTALL_LOG"; then
    echo "ADB/package-manager transport failed; resetting ADB before retry."
    recover_adb || true
    continue
  fi

  echo "APK installation failed for an application/package reason."
  exit 1
done

if [ "$installed" -ne 1 ]; then
  echo "APK could not be installed because the emulator/ADB transport remained unavailable."
  exit "$INFRA_EXIT"
fi

if ! adb logcat -c >/dev/null 2>&1; then
  recover_adb || exit "$INFRA_EXIT"
  adb logcat -c >/dev/null 2>&1 || exit "$INFRA_EXIT"
fi

adb shell am force-stop "$PACKAGE" >/dev/null 2>&1 || true

START_LOG="$(mktemp)"
trap 'rm -f "$INSTALL_LOG" "$START_LOG"' EXIT
if ! adb shell am start -W -n "$ACTIVITY" >"$START_LOG" 2>&1; then
  cat "$START_LOG"
  if grep -Eiq 'Broken pipe|device offline|no devices|closed|cannot connect' "$START_LOG"; then
    if ! recover_adb; then
      exit "$INFRA_EXIT"
    fi
    if ! adb shell am start -W -n "$ACTIVITY" >"$START_LOG" 2>&1; then
      cat "$START_LOG"
      exit "$INFRA_EXIT"
    fi
  else
    exit 1
  fi
fi
cat "$START_LOG"

sleep 15

if ! PID="$(adb shell pidof "$PACKAGE" 2>/dev/null | tr -d '\r')"; then
  if ! wait_for_android; then
    exit "$INFRA_EXIT"
  fi
  PID=""
fi

if [ -z "$PID" ]; then
  echo "Archivist process exited after launch"
  adb logcat -d -t 600 || true
  exit 1
fi

if ! ACTIVITY_STATE="$(adb shell dumpsys activity activities 2>/dev/null)"; then
  if ! wait_for_android; then
    exit "$INFRA_EXIT"
  fi
  echo "Unable to read Android activity state after launch."
  exit "$INFRA_EXIT"
fi

if ! printf '%s\n' "$ACTIVITY_STATE" | grep -E 'mResumedActivity|topResumedActivity' | grep -q "$PACKAGE"; then
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
