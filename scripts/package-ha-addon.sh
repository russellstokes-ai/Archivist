#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
OUT="${1:-/workspace/Archivist-HAOS-Addon.zip}"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

mkdir -p "$STAGE/archivist/app"
cp "$ROOT/home-assistant/archivist/config.yaml" "$STAGE/archivist/config.yaml"
cp "$ROOT/home-assistant/archivist/Dockerfile" "$STAGE/archivist/Dockerfile"
cp "$ROOT/home-assistant/archivist/run.sh" "$STAGE/archivist/run.sh"
cp "$ROOT/home-assistant/archivist/README.md" "$STAGE/archivist/README.md"

cp "$ROOT"/*.go "$STAGE/archivist/app/"
cp "$ROOT/go.mod" "$ROOT/go.sum" "$STAGE/archivist/app/"
mkdir -p "$STAGE/archivist/app/web"
cp -R "$ROOT/web/." "$STAGE/archivist/app/web/"

(cd "$STAGE" && zip -qr "$OUT" archivist)
printf '%s\n' "$OUT"
