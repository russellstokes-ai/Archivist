#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
OUT="${1:-/workspace/Archivist-HAOS-Repository.zip}"
OUT="$(realpath -m "$OUT")"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cp "$ROOT/home-assistant/repository.yaml" "$STAGE/repository.yaml"
cp "$ROOT/home-assistant/README.md" "$STAGE/README.md"
for DOC in LICENSE.md VALIDATION.md TESTING-READINESS.md THIRD-PARTY-NOTICES.md PRIVACY-AND-MONETISATION.md COMIC-SPEECH-FOCUS.md MOBILE-TESTING.md; do
  cp "$ROOT/$DOC" "$STAGE/$DOC"
done
"$ROOT/scripts/package-ha-addon.sh" "$STAGE/addon.zip" >/dev/null
(cd "$STAGE" && unzip -q addon.zip)
(cd "$STAGE" && zip -qr repository.zip repository.yaml *.md archivist)
mv "$STAGE/repository.zip" "$OUT"
printf '%s\n' "$OUT"
