#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
OUT="${1:-/workspace/Archivist-HAOS-Repository.zip}"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

mkdir -p "$STAGE/archivist-repository"
cp "$ROOT/home-assistant/repository.yaml" "$STAGE/archivist-repository/repository.yaml"
"$ROOT/scripts/package-ha-addon.sh" "$STAGE/addon.zip" >/dev/null
(cd "$STAGE" && unzip -q addon.zip -d "$STAGE/archivist-repository")
(cd "$STAGE" && zip -qr "$OUT" archivist-repository)
printf '%s\n' "$OUT"
