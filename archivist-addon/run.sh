#!/usr/bin/env sh
set -eu

OPTIONS=${ARCHIVIST_OPTIONS:-/data/options.json}
BINARY=${ARCHIVIST_BINARY:-/usr/bin/archivist}
DATA_PATH=/data
LISTEN=0.0.0.0:5056
ALLOW_LAN=true
REMOTE_HTTPS=false
REMOTE_LISTEN=0.0.0.0:5443
CERTFILE=fullchain.pem
KEYFILE=privkey.pem

if [ -f "$OPTIONS" ]; then
  jq -e 'type == "object" and
    ((.data_path == null) or (.data_path | type == "string")) and
    ((.listen == null) or (.listen | type == "string")) and
    ((.allow_lan == null) or (.allow_lan | type == "boolean")) and
    ((.remote_https == null) or (.remote_https | type == "boolean")) and
    ((.remote_listen == null) or (.remote_listen | type == "string")) and
    ((.certfile == null) or (.certfile | type == "string")) and
    ((.keyfile == null) or (.keyfile | type == "string"))' "$OPTIONS" >/dev/null
  DATA_PATH="$(jq -r '.data_path // "/data"' "$OPTIONS")"
  LISTEN="$(jq -r '.listen // "0.0.0.0:5056"' "$OPTIONS")"
  ALLOW_LAN="$(jq -r 'if .allow_lan == null then true else .allow_lan end' "$OPTIONS")"
  REMOTE_HTTPS="$(jq -r 'if .remote_https == null then false else .remote_https end' "$OPTIONS")"
  REMOTE_LISTEN="$(jq -r '.remote_listen // "0.0.0.0:5443"' "$OPTIONS")"
  CERTFILE="$(jq -r '.certfile // "fullchain.pem"' "$OPTIONS")"
  KEYFILE="$(jq -r '.keyfile // "privkey.pem"' "$OPTIONS")"
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
  *) printf '%s\n' 'listen must use 0.0.0.0:5056 or 127.0.0.1:5056' >&2; exit 1 ;;
esac
if [ "$ALLOW_LAN" != "true" ] && [ "$LISTEN" = "0.0.0.0:5056" ]; then
  printf '%s\n' 'allow_lan=false requires listen=127.0.0.1:5056; ingress will be unavailable' >&2
  exit 1
fi

if [ "$REMOTE_HTTPS" = "true" ]; then
  if [ "$ALLOW_LAN" != "true" ]; then
    printf '%s\n' 'remote_https requires allow_lan=true' >&2
    exit 1
  fi
  case "$REMOTE_LISTEN" in
    0.0.0.0:5443|127.0.0.1:5443) ;;
    *) printf '%s\n' 'remote_listen must use 0.0.0.0:5443 or 127.0.0.1:5443' >&2; exit 1 ;;
  esac
  case "$CERTFILE" in
    ""|*/*|*..*) printf '%s\n' 'certfile must be a filename from /ssl' >&2; exit 1 ;;
  esac
  case "$KEYFILE" in
    ""|*/*|*..*) printf '%s\n' 'keyfile must be a filename from /ssl' >&2; exit 1 ;;
  esac
  if [ ! -r "/ssl/$CERTFILE" ] || [ ! -r "/ssl/$KEYFILE" ]; then
    printf '%s\n' "remote_https is enabled but /ssl/$CERTFILE or /ssl/$KEYFILE is not readable" >&2
    exit 1
  fi
fi

mkdir -p "$DATA_PATH"

set -- "$BINARY" -data "$DATA_PATH" -listen "$LISTEN"
if [ "$ALLOW_LAN" = "true" ]; then
  set -- "$@" -allow-lan
fi
if [ "$REMOTE_HTTPS" = "true" ]; then
  set -- "$@" -tls-listen "$REMOTE_LISTEN" -tls-cert "/ssl/$CERTFILE" -tls-key "/ssl/$KEYFILE"
fi

exec "$@"
