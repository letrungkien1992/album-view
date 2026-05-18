#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-full}"
OUTPUT_ZIP="$ROOT_DIR/deploy.zip"

if [[ "$MODE" == "lite" ]]; then
  OUTPUT_ZIP="$ROOT_DIR/deploy-lite.zip"
elif [[ "$MODE" != "full" ]]; then
  echo "Usage: bash scripts/build-deploy-zip.sh [full|lite]"
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "Missing 'zip' command. Please install zip and try again."
  exit 1
fi

INCLUDE_ITEMS=(
  ".env"
  "index.php"
  "index.html"
  ".htaccess"
  "README.md"
  "package.json"
  "scripts.json"
  "resources"
  "src"
  "storage"
  "vendor"
  "router.php"
)

EXCLUDE_EXTRA=(
  "src/albums/*"
  "src/row/*"
  "src/thumbs/*"
  "src/audio/*"
)

pushd "$ROOT_DIR" >/dev/null

rm -f "$OUTPUT_ZIP"

ITEMS=()
for item in "${INCLUDE_ITEMS[@]}"; do
  if [ -e "$item" ]; then
    ITEMS+=("$item")
  fi
done

if [ "${#ITEMS[@]}" -eq 0 ]; then
  echo "No deployable items found."
  exit 1
fi

zip -r "$OUTPUT_ZIP" "${ITEMS[@]}" \
  -x "*/.DS_Store" \
  -x "*/.idea/*" \
  -x "*/.vscode/*" \
  -x "*/.git/*" \
  -x "*/.gitignore" \
  -x "*/scripts/*" \
  -x "*/deploy.zip" \
  -x "*/node_modules/*" \
  -x ".server.log" \
  -x ".server.pid" \
  -x "storage/*.log" \
  -x "storage/*.lock" \
  ${EXCLUDE_EXTRA[@]+"${EXCLUDE_EXTRA[@]}"}

echo "Created $(basename "$OUTPUT_ZIP")"

popd >/dev/null
