#!/bin/sh
# Non-destructive Archivist Server release smoke. Suitable for CI and for
# disposable Pi/HA/NAS deployment checks. Never sends a credential, scans a
# source, downloads a backup or performs any database mutation.
set -eu
ORIGIN=${1:-http://127.0.0.1:5056}
case "$ORIGIN" in
  http://*|https://*) ;;
  *) echo 'FAIL: provide an http(s) server origin' >&2; exit 2 ;;
esac
case "$ORIGIN" in
  *'?'*|*'#'*|*'@'*|*/api/*)
    echo 'FAIL: provide only a safe server origin, without credentials, fragments or API path' >&2; exit 2 ;;
esac
ORIGIN=${ORIGIN%/}
if [ "${ARCHIVIST_SMOKE_REQUIRE_PI:-0}" = "1" ]; then
  test "$(uname -m)" = "aarch64" || { echo 'FAIL: not native ARM64' >&2; exit 3; }
  test -r /proc/device-tree/model || { echo 'FAIL: no Raspberry Pi model identity' >&2; exit 3; }
  grep -a -qi 'Raspberry Pi' /proc/device-tree/model || { echo 'FAIL: not Raspberry Pi hardware' >&2; exit 3; }
fi
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT HUP INT TERM
get_status(){
  curl --max-time 15 --silent --show-error --output "$TMP/response" \
    --write-out '%{http_code}' "$ORIGIN$1"
}
assert_status(){
  EXPECT=$1
  LABEL=$2
  ACTUAL=$(get_status "$LABEL")
  if [ "$ACTUAL" != "$EXPECT" ]; then
    echo "FAIL: GET $LABEL returned $ACTUAL; expected $EXPECT" >&2
    exit 1
  fi
}
assert_status 200 /healthz
assert_status 200 /setup/status
assert_status 200 /manage.html
assert_status 401 /api/me
assert_status 401 /api/books
assert_status 401 /api/library-health
assert_status 401 /api/manage/operations
assert_status 401 /api/backup
# The admin page must not be frameable from unrelated websites and script
# origins must be restricted. No owner token is requested or displayed.
curl --max-time 15 --silent --show-error --output "$TMP/index" \
  --dump-header "$TMP/headers" "$ORIGIN/" >/dev/null
grep -i -q '^Content-Security-Policy:.*script-src.*self' "$TMP/headers" || {
  echo 'FAIL: server HTML has no restrictive script CSP' >&2; exit 1;
}
grep -i -q '^X-Content-Type-Options: nosniff' "$TMP/headers" || {
  echo 'FAIL: missing nosniff response header' >&2; exit 1;
}
printf 'PASS: anonymous access denied, health and owner interface served, CSP present'
if [ "${ARCHIVIST_SMOKE_REQUIRE_PI:-0}" = "1" ]; then
  printf ' on native Raspberry Pi'
fi
printf '\n'
printf 'NOT TESTED: source mount, authorisation with real accounts, scan/write, streaming, restore or Pi memory/performance.\n'
