#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

show_list() {
  cat <<'EOF'
Available commands:
  1) start-server
  2) stop-server
  3) build-images
  4) convert-images
  5) setup-domain
  6) restart-server
  7) build-deploy-zip
EOF
}

resolve_script() {
  case "${1:-}" in
    start-server) echo "$SCRIPT_DIR/start-server.sh" ;;
    stop-server) echo "$SCRIPT_DIR/stop-server.sh" ;;
    build-images) echo "$SCRIPT_DIR/build-album-images.sh" ;;
    convert-images) echo "$SCRIPT_DIR/convert-images-webp.sh" ;;
    setup-domain) echo "$SCRIPT_DIR/setup-domain.sh" ;;
    restart-server) echo "__restart__" ;;
    build-deploy-zip) echo "$SCRIPT_DIR/build-deploy-zip.sh" ;;
    *) echo "" ;;
  esac
}

run_command() {
  local cmd="$1"
  shift || true
  local target
  target="$(resolve_script "$cmd")"

  if [[ -z "$target" ]]; then
    echo "Unknown command: $cmd"
    show_list
    exit 1
  fi

  cd "$PROJECT_ROOT"

  if [[ "$target" == "__restart__" ]]; then
    bash "$SCRIPT_DIR/stop-server.sh"
    bash "$SCRIPT_DIR/start-server.sh"
    exit 0
  fi

  bash "$target" "$@"
}

if [[ "${1:-}" == "list" ]]; then
  show_list
  exit 0
fi

if [[ -n "${1:-}" ]]; then
  run_command "$@"
  exit 0
fi

show_list
echo ""
read -r -p "Type command name to run: " input_cmd
if [[ -z "${input_cmd:-}" ]]; then
  echo "No command selected."
  exit 0
fi
run_command "$input_cmd"
