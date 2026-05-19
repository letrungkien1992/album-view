#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_ALBUM="${1:-}"
APP_USER="${APP_USER:-www-data}"
APP_GROUP="${APP_GROUP:-www-data}"

log() {
  printf '[prod-build] %s\n' "$*"
}

is_linux() {
  [[ "$(uname -s)" == "Linux" ]]
}

ensure_dir() {
  local dir="$1"
  mkdir -p "$dir"
}

ensure_webp() {
  if command -v cwebp >/dev/null 2>&1; then
    return 0
  fi

  if is_linux && command -v apt-get >/dev/null 2>&1 && [[ ${EUID:-$(id -u)} -eq 0 ]]; then
    log "Installing webp package..."
    apt-get update
    apt-get install -y webp
    return 0
  fi

  log "Missing cwebp. Install package 'webp' first."
  exit 1
}

fix_permissions() {
  if is_linux; then
    if id -u "$APP_USER" >/dev/null 2>&1 && getent group "$APP_GROUP" >/dev/null 2>&1; then
      chown -R "$APP_USER:$APP_GROUP" "$PROJECT_ROOT"
    fi
  fi

  chmod +x \
    "$SCRIPT_DIR/build-album-images.sh" \
    "$SCRIPT_DIR/convert-images-webp.sh" \
    "$SCRIPT_DIR/prod-build-setup.sh"

  chmod -R u+rwX,g+rwX \
    "$PROJECT_ROOT/src" \
    "$PROJECT_ROOT/storage"
}

main() {
  log "Preparing production directories..."
  ensure_dir "$PROJECT_ROOT/src/albums"
  ensure_dir "$PROJECT_ROOT/src/row"
  ensure_dir "$PROJECT_ROOT/src/thumbs"
  ensure_dir "$PROJECT_ROOT/storage"

  ensure_webp
  fix_permissions

  cd "$PROJECT_ROOT"
  if [[ -n "$TARGET_ALBUM" ]]; then
    log "Building album: $TARGET_ALBUM"
    bash "$SCRIPT_DIR/build-album-images.sh" "$TARGET_ALBUM"
  else
    log "Building all albums..."
    bash "$SCRIPT_DIR/build-album-images.sh"
  fi

  log "Done."
}

main "$@"
