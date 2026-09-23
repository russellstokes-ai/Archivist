#!/usr/bin/env sh
set -eu

OPTIONS=/data/options.json
DATA_PATH=/data
LISTEN=0.0.0.0:5056
ALLOW_LAN=true

if [ -f "$OPTIONS" ]; then
  DATA_PATH="$(jq -r '.data_path // "/data"' "$OPTIONS")"
  LISTEN="$(jq -r '.listen // "0.0.0.0:5056"' "$OPTIONS")"
  ALLOW_LAN="$(jq -r '.allow_lan // true' "$OPTIONS")"
fi

mkdir -p "$DATA_PATH"

if [ "$ALLOW_LAN" = "true" ]; then
  exec /usr/bin/archivist -data "$DATA_PATH" -listen "$LISTEN" -allow-lan
fi

exec /usr/bin/archivist -data "$DATA_PATH" -listen "$LISTEN"
