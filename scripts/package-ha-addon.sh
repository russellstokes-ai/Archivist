#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
OUT="${1:-/workspace/Archivist-HAOS-Addon.zip}"
OUT="$(realpath -m "$OUT")"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

mkdir -p "$STAGE/archivist/app"
cp "$ROOT/archivist/config.yaml" "$STAGE/archivist/config.yaml"
cp "$ROOT/archivist/Dockerfile" "$STAGE/archivist/Dockerfile"
cp "$ROOT/archivist/run.sh" "$STAGE/archivist/run.sh"
cp "$ROOT/archivist/README.md" "$STAGE/archivist/README.md"
cp "$ROOT/archivist/DOCS.md" "$STAGE/archivist/DOCS.md"
cp "$ROOT/archivist/CHANGELOG.md" "$STAGE/archivist/CHANGELOG.md"
cp "$ROOT/LICENSE.md" "$STAGE/archivist/LICENSE.md"
cp "$ROOT/THIRD-PARTY-NOTICES.md" "$STAGE/archivist/THIRD-PARTY-NOTICES.md"
cp "$ROOT/web/assets/archivist-app-icon.png" "$STAGE/archivist/icon.png"
cp "$ROOT/web/assets/archivist-primary-logo.png" "$STAGE/archivist/logo.png"

cp "$ROOT"/*.go "$STAGE/archivist/app/"
cp "$ROOT/go.mod" "$ROOT/go.sum" "$STAGE/archivist/app/"
mkdir -p "$STAGE/archivist/app/web/vendor"
cp "$ROOT"/web/*.html "$ROOT"/web/*.css "$ROOT"/web/*.js "$STAGE/archivist/app/web/"
mkdir -p "$STAGE/archivist/app/web/assets"
cp "$ROOT"/web/assets/*.png "$STAGE/archivist/app/web/assets/"
cp "$ROOT"/web/assets/*.ttf "$ROOT"/web/assets/OFL.txt "$STAGE/archivist/app/web/assets/"
cp "$ROOT"/web/vendor/LICENSE "$ROOT"/web/vendor/pdf.mjs "$ROOT"/web/vendor/pdf.worker.mjs "$ROOT"/web/vendor/pdfjs-assets.tar.gz "$STAGE/archivist/app/web/vendor/"

(cd "$STAGE" && zip -qr addon.zip archivist)
mv "$STAGE/addon.zip" "$OUT"
printf '%s\n' "$OUT"

