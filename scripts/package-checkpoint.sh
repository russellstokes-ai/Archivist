#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
OUT="$(realpath -m "${1:-/workspace/Archivist-Halfway-Checkpoint.zip}")"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/source/mobile"
cp "$ROOT"/*.go "$ROOT"/*.md "$ROOT/go.mod" "$ROOT/go.sum" "$ROOT/playback_test.cjs" "$ROOT/.gitignore" "$STAGE/source/"
cp -R "$ROOT/web" "$ROOT/scripts" "$ROOT/home-assistant" "$STAGE/source/"
cp "$ROOT"/mobile/*.ts "$ROOT"/mobile/*.tsx "$ROOT"/mobile/*.json "$ROOT"/mobile/*.cjs "$STAGE/source/mobile/"
sh "$ROOT/scripts/package-ha-repository.sh" "$STAGE/Archivist-HA-Upload.zip" >/dev/null
(cd "$STAGE" && zip -qr checkpoint.zip source Archivist-HA-Upload.zip)
mv "$STAGE/checkpoint.zip" "$OUT"
printf '%s\n' "$OUT"
