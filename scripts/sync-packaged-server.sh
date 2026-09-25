#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
MODE="${1:-sync}"

copy_tree() {
  target="$1"
  mkdir -p "$target"
  cp "$ROOT"/*.go "$target/"
  cp "$ROOT/go.mod" "$ROOT/go.sum" "$target/"
  mkdir -p "$target/web/assets" "$target/web/vendor"
  cp "$ROOT"/web/*.html "$ROOT"/web/*.css "$ROOT"/web/*.js "$target/web/"
  cp "$ROOT"/web/assets/*.png "$target/web/assets/"
  cp "$ROOT"/web/vendor/LICENSE "$ROOT"/web/vendor/pdf.mjs "$ROOT"/web/vendor/pdf.worker.mjs "$ROOT"/web/vendor/pdfjs-assets.tar.gz "$target/web/vendor/"
}

check_tree() {
  target="$1"
  for file in "$ROOT"/*.go "$ROOT/go.mod" "$ROOT/go.sum"; do
    name="$(basename "$file")"
    cmp "$file" "$target/$name"
  done
  for file in "$ROOT"/web/*.html "$ROOT"/web/*.css "$ROOT"/web/*.js; do
    name="$(basename "$file")"
    cmp "$file" "$target/web/$name"
  done
  for file in "$ROOT"/web/assets/*.png; do
    name="$(basename "$file")"
    cmp "$file" "$target/web/assets/$name"
  done
  for name in LICENSE pdf.mjs pdf.worker.mjs pdfjs-assets.tar.gz; do
    cmp "$ROOT/web/vendor/$name" "$target/web/vendor/$name"
  done
}

case "$MODE" in
  sync)
    copy_tree "$ROOT/archivist/app"
    copy_tree "$ROOT/home-assistant/archivist/app"
    cp "$ROOT/archivist/config.yaml" "$ROOT/home-assistant/archivist/config.yaml"
    cp "$ROOT/archivist/run.sh" "$ROOT/home-assistant/archivist/run.sh"
    cp "$ROOT/archivist/Dockerfile" "$ROOT/home-assistant/archivist/Dockerfile"
    ;;
  --check|check)
    check_tree "$ROOT/archivist/app"
    check_tree "$ROOT/home-assistant/archivist/app"
    cmp "$ROOT/archivist/config.yaml" "$ROOT/home-assistant/archivist/config.yaml"
    cmp "$ROOT/archivist/run.sh" "$ROOT/home-assistant/archivist/run.sh"
    cmp "$ROOT/archivist/Dockerfile" "$ROOT/home-assistant/archivist/Dockerfile"
    ;;
  *)
    echo "usage: $0 [sync|--check]" >&2
    exit 2
    ;;
esac
