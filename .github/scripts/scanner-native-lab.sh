#!/usr/bin/env bash
set -euo pipefail
repo_dir="$(cd "$(dirname "$0")/../.." && pwd)"
result_dir="$repo_dir/scanner-native-results"
mkdir -p "$result_dir"
collect() {
  timeout 15s adb logcat -d -s ScannerVNextLab:I '*:S' > "$result_dir/metrics.log" || true
  timeout 15s adb shell dumpsys meminfo app.archivist.scannerlab > "$result_dir/memory.log" || true
}
trap collect EXIT
cd "$repo_dir/mobile/android"
./gradlew -p ../scanner-test-lab :app:connectedDebugAndroidTest --console=plain
