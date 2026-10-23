#!/usr/bin/env bash
set -euo pipefail
# This runs a small DEX harness, not an APK or a release build.
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
TMP=$(mktemp -d)
REMOTE=/data/local/tmp/archivist-sevenzip-check
trap 'rm -rf "$TMP"; adb shell rm -rf "$REMOTE" >/dev/null 2>&1 || true' EXIT
AAR=$(find "${GRADLE_USER_HOME:-$HOME/.gradle}/caches/modules-2/files-2.1/com.sorrowblue.sevenzipjbinding/7-Zip-JBinding-4Android/16.02-2.4" -name '*.aar' -print -quit)
test -n "$AAR"
unzip -p "$AAR" classes.jar > "$TMP/engine.jar"
unzip -p "$AAR" jni/x86_64/lib7-Zip-JBinding.so > "$TMP/lib7-Zip-JBinding.so"
python3 - "$ROOT" "$TMP" <<'PY'
import sys,json,base64,hashlib,pathlib
root,out=map(pathlib.Path,sys.argv[1:])
data=json.loads((root/'mobile/test-support/sevenzip/fixtures.json').read_text())
for name,item in data['files'].items():
    assert name==pathlib.Path(name).name
    raw=base64.b64decode(item['base64']);assert hashlib.sha256(raw).hexdigest()==item['sha256']
    (out/name).write_bytes(raw)
PY
SRC="$ROOT/mobile/android/app/src/main/java/app/archivist/reader"
mkdir "$TMP/classes" "$TMP/dex"
javac --release 17 -cp "$TMP/engine.jar" -d "$TMP/classes" \
 "$SRC/ScannerTaskPool.java" "$SRC/ScannerBoundedIO.java" "$SRC/ScannerArchiveReader.java" "$SRC/ScannerSevenZipReader.java" \
 "$ROOT/mobile/test-support/sevenzip/ScannerSevenZipAndroidTest.java"
jar cf "$TMP/harness.jar" -C "$TMP/classes" .
"$ANDROID_HOME/build-tools/36.0.0/d8" --min-api 26 --lib "$ANDROID_HOME/platforms/android-36/android.jar" --output "$TMP/dex" "$TMP/harness.jar" "$TMP/engine.jar"
(cd "$TMP/dex" && zip -q "$TMP/check.jar" classes*.dex)
adb shell mkdir -p "$REMOTE"
adb push "$TMP/check.jar" "$TMP/lib7-Zip-JBinding.so" "$TMP/fixture.cb7" "$TMP/encrypted.cb7" "$TMP/truncated.cb7" "$TMP/oversized.cb7" "$TMP/page01.png" "$REMOTE/" >/dev/null
adb shell "CLASSPATH=$REMOTE/check.jar app_process /system/bin app.archivist.reader.ScannerSevenZipAndroidTest $REMOTE"
