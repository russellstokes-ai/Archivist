#!/usr/bin/env sh
# Source-only reproducible QA release candidate builder. No Docker push,
# GitHub Release/tag, signing claim, update, data migration or production
# installation is performed. Runs only on an explicit developer invocation.
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
OUT=${1:-"$ROOT/dist/server-qa"}
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"
VERSION=${ARCHIVIST_QA_VERSION:-0.9.3-qa}
case "$VERSION" in
  ''|*[!a-zA-Z0-9_.-]*)
    echo 'Invalid QA build version' >&2;exit 2 ;;
esac
if [ -z "${SOURCE_DATE_EPOCH:-}" ]; then
  SOURCE_DATE_EPOCH=$(git -C "$ROOT" show -s --format=%ct HEAD)
fi
export SOURCE_DATE_EPOCH
cd "$ROOT"
for ARCH in amd64 arm64; do
  GOOS=linux GOARCH="$ARCH" CGO_ENABLED=0 go build -trimpath -buildvcs=false \
    -ldflags="-s -w -X main.buildVersion=$VERSION" \
    -o "$OUT/archivist-linux-$ARCH" .
done
sh "$ROOT/scripts/package-ha-repository.sh" "$OUT/Archivist-HA-QA-Repository.zip" >/dev/null
(cd "$OUT" && sha256sum archivist-linux-amd64 archivist-linux-arm64 Archivist-HA-QA-Repository.zip > SHA256SUMS)
(cd "$OUT" && sha256sum -c SHA256SUMS)
printf 'PASS: reproducible source-only QA binaries (amd64/arm64), Home Assistant ZIP and SHA256SUMS\n'
printf 'NO RELEASE: hardware acceptance, signed container images, rollback and owner production approval remain separate.\n'
