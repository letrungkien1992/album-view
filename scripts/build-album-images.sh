#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONVERTER="$SCRIPT_DIR/convert-images-webp.sh"
TARGET_ALBUM="${1:-}"

if [[ ! -x "$CONVERTER" ]]; then
  echo "Missing converter script: $CONVERTER"
  echo "Expected file: convert-images-webp.sh"
  exit 1
fi

if ! command -v cwebp >/dev/null 2>&1; then
  echo "cwebp not found."
  echo "Install webp tools first:"
  echo "  macOS: brew install webp"
  echo "  Ubuntu: sudo apt-get install -y webp"
  exit 1
fi

if [[ -n "$TARGET_ALBUM" ]]; then
  echo "Building row + thumbnail images for album: $TARGET_ALBUM"
  "$CONVERTER" "$TARGET_ALBUM"
else
  echo "Building row + thumbnail images from src/albums ..."
  "$CONVERTER"
fi
echo ""
echo "Done."
echo "Output folders:"
echo "  - src/row"
echo "  - src/thumbs"
echo ""
echo "Tip: run this command each time you add new images/albums:"
echo "  ./scripts/build-album-images.sh"
