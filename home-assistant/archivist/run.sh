#!/usr/bin/env sh
set -eu

OPTIONS=${ARCHIVIST_OPTIONS:-/data/options.json}
BINARY=${ARCHIVIST_BINARY:-/usr/bin/archivist}
DATA_PATH=/data
LISTEN=0.0.0.0:5056
ALLOW_LAN=true

if [ -f "$OPTIONS" ]; then
	jq -e 'type == "object" and
	  ((.data_path == null) or (.data_path | type == "string")) and
	  ((.listen == null) or (.listen | type == "string")) and
	  ((.allow_lan == null) or (.allow_lan | type == "boolean"))' "$OPTIONS" >/dev/null
  DATA_PATH="$(jq -r '.data_path // "/data"' "$OPTIONS")"
  LISTEN="$(jq -r '.listen // "0.0.0.0:5056"' "$OPTIONS")"
  ALLOW_LAN="$(jq -r 'if .allow_lan == null then true else .allow_lan end' "$OPTIONS")"
fi

case "$DATA_PATH" in
  /data|/data/*) ;;
  *) printf '%s\n' 'data_path must remain under /data for persistent storage' >&2; exit 1 ;;
esac
case "/$DATA_PATH/" in
  */../*|*/./*) printf '%s\n' 'data_path must not contain dot segments' >&2; exit 1 ;;
esac
case "$LISTEN" in
  0.0.0.0:5056|127.0.0.1:5056) ;;
  *) printf '%s\n' 'listen must use 0.0.0.0:5056 or 127.0.0.1:5056; change the host port in Home Assistant instead' >&2; exit 1 ;;
esac
if [ "$ALLOW_LAN" != "true" ] && [ "$LISTEN" = "0.0.0.0:5056" ]; then
  printf '%s\n' 'allow_lan=false requires listen=127.0.0.1:5056; ingress will be unavailable' >&2
  exit 1
fi

mkdir -p "$DATA_PATH"

if [ "$ALLOW_LAN" = "true" ]; then
  exec "$BINARY" -data "$DATA_PATH" -listen "$LISTEN" -allow-lan
fi

exec "$BINARY" -data "$DATA_PATH" -listen "$LISTEN"
