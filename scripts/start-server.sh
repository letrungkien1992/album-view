#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_ROOT/.server.pid"
LOG_FILE="$PROJECT_ROOT/.server.log"
ENV_FILE="$PROJECT_ROOT/.env"
PORT=5500
PHP_BIN="php"
APP_HOST="localhost"
APP_URL=""

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  PORT="${APP_PORT:-5500}"
  PHP_BIN="${PHP_BIN:-php}"
  APP_HOST="${APP_HOST:-${DOMAIN:-localhost}}"
  APP_URL="${APP_URL:-}"
fi

if [[ -n "${PHP_BIN:-}" && ! -x "$PHP_BIN" ]]; then
  if command -v php >/dev/null 2>&1; then
    PHP_BIN="$(command -v php)"
  fi
fi

if [[ -z "${APP_URL:-}" && "${DOMAIN:-}" =~ ^https?:// ]]; then
  APP_URL="${DOMAIN}"
fi

if [[ "${APP_HOST:-}" =~ ^https?:// ]]; then
  APP_HOST="$(printf '%s' "$APP_HOST" | sed -E 's#^[A-Za-z]+://##; s#/.*$##')"
fi
if [[ "${APP_HOST:-}" == "" ]]; then
  APP_HOST="localhost"
fi

if [[ -z "${APP_URL:-}" ]]; then
  APP_URL="http://${APP_HOST}:${PORT}"
fi
APP_URL="${APP_URL%/}"
HEALTH_URL="${APP_URL}/"

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${OLD_PID:-}" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Server is already running (PID: $OLD_PID, port: $PORT)."
    echo "Open: $APP_URL"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

LISTEN_PID="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
if [[ -n "${LISTEN_PID:-}" ]]; then
  if curl -fsS --max-time 2 "$HEALTH_URL" | grep -q "Album Viewer"; then
    echo "$LISTEN_PID" >"$PID_FILE"
    echo "Server is already running (PID: $LISTEN_PID, port: $PORT)."
    echo "Open: $APP_URL"
    exit 0
  fi
  echo "Port $PORT is already in use by another process (PID: $LISTEN_PID)."
  echo "Run ./scripts/stop-server.sh if it belongs to this app, or free the port first."
  exit 1
fi

cd "$PROJECT_ROOT"
nohup "$PHP_BIN" -S 0.0.0.0:"$PORT" router.php >"$LOG_FILE" 2>&1 < /dev/null &
NEW_PID=$!
echo "$NEW_PID" >"$PID_FILE"

sleep 1
if kill -0 "$NEW_PID" 2>/dev/null; then
  echo "Server started."
  echo "PID: $NEW_PID"
  echo "Runtime: php"
  echo "URL: $APP_URL"
  echo "Log: $LOG_FILE"
else
  echo "Failed to start server. Check log: $LOG_FILE"
  rm -f "$PID_FILE"
  exit 1
fi
