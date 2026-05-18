#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_ROOT/.server.pid"
ENV_FILE="$PROJECT_ROOT/.env"
PORT=5500
APP_HOST="localhost"
APP_URL=""

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  PORT="${APP_PORT:-5500}"
  APP_HOST="${APP_HOST:-${DOMAIN:-localhost}}"
  APP_URL="${APP_URL:-}"
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

if [[ ! -f "$PID_FILE" ]]; then
  FALLBACK_PID="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
  if [[ -n "${FALLBACK_PID:-}" ]]; then
    if curl -fsS --max-time 2 "$HEALTH_URL" | grep -q "Album Viewer"; then
      kill "$FALLBACK_PID" 2>/dev/null || true
      sleep 1
      if kill -0 "$FALLBACK_PID" 2>/dev/null; then
        kill -9 "$FALLBACK_PID" 2>/dev/null || true
      fi
      echo "Server stopped (PID: $FALLBACK_PID)."
      exit 0
    fi
  fi
  echo "No PID file found. Server may already be stopped."
  exit 0
fi

PID="$(cat "$PID_FILE" 2>/dev/null || true)"
if [[ -z "${PID:-}" ]]; then
  echo "PID file is empty. Cleaning up."
  rm -f "$PID_FILE"
  exit 0
fi

if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  sleep 1
  if kill -0 "$PID" 2>/dev/null; then
    kill -9 "$PID" 2>/dev/null || true
  fi
  echo "Server stopped (PID: $PID)."
else
  echo "Process $PID is not running."
fi

rm -f "$PID_FILE"
