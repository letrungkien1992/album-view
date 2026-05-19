#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_ALBUM="${1:-}"

CLIENT_MAX_BODY_SIZE="${CLIENT_MAX_BODY_SIZE:-8G}"
CLIENT_BODY_TIMEOUT="${CLIENT_BODY_TIMEOUT:-3600s}"
FASTCGI_READ_TIMEOUT="${FASTCGI_READ_TIMEOUT:-3600s}"
FASTCGI_SEND_TIMEOUT="${FASTCGI_SEND_TIMEOUT:-3600s}"
SEND_TIMEOUT="${SEND_TIMEOUT:-3600s}"

UPLOAD_MAX_FILESIZE="${UPLOAD_MAX_FILESIZE:-8G}"
POST_MAX_SIZE="${POST_MAX_SIZE:-8G}"
MAX_FILE_UPLOADS="${MAX_FILE_UPLOADS:-10000}"
MAX_EXECUTION_TIME="${MAX_EXECUTION_TIME:-3600}"
MAX_INPUT_TIME="${MAX_INPUT_TIME:-3600}"
MEMORY_LIMIT="${MEMORY_LIMIT:-1024M}"
REQUEST_TERMINATE_TIMEOUT="${REQUEST_TERMINATE_TIMEOUT:-3600}"

log() {
  printf '[prod-tune] %s\n' "$*"
}

require_root() {
  if [[ "$(uname -s)" == "Linux" && ${EUID:-$(id -u)} -ne 0 ]]; then
    echo "Run this script as root on Linux."
    exit 1
  fi
}

detect_php_dir() {
  local dir
  for dir in /etc/php/*/fpm; do
    if [[ -f "$dir/php.ini" && -f "$dir/pool.d/www.conf" ]]; then
      printf '%s\n' "$dir"
      return 0
    fi
  done
  return 1
}

detect_nginx_site_conf() {
  if [[ -n "${NGINX_SITE_CONF:-}" && -f "${NGINX_SITE_CONF:-}" ]]; then
    printf '%s\n' "$NGINX_SITE_CONF"
    return 0
  fi

  local link
  for link in /etc/nginx/sites-enabled/*; do
    [[ -e "$link" ]] || continue
    [[ "$(basename "$link")" == "default" ]] && continue
    readlink -f "$link"
    return 0
  done
  return 1
}

backup_file() {
  local file="$1"
  local backup="${file}.bak"
  if [[ ! -f "$backup" ]]; then
    cp "$file" "$backup"
  fi
}

set_kv_line() {
  local file="$1"
  local key="$2"
  local value="$3"
  local tmp
  tmp="$(mktemp)"
  awk -v key="$key" -v value="$value" '
    BEGIN { done = 0 }
    {
      if ($0 ~ "^[[:space:]]*" key "[[:space:]]*=") {
        if (!done) {
          print key " = " value
          done = 1
        }
        next
      }
      print
    }
    END {
      if (!done) {
        print key " = " value
      }
    }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
}

set_www_conf_value() {
  local file="$1"
  local key="$2"
  local value="$3"
  local tmp
  tmp="$(mktemp)"
  awk -v key="$key" -v value="$value" '
    BEGIN { done = 0 }
    {
      if ($0 ~ "^[[:space:]]*" key "[[:space:]]*=") {
        if (!done) {
          print key " = " value
          done = 1
        }
        next
      }
      print
    }
    END {
      if (!done) {
        print key " = " value
      }
    }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
}

set_www_conf_memory() {
  local file="$1"
  local tmp
  tmp="$(mktemp)"
  awk -v value="$MEMORY_LIMIT" '
    BEGIN { done = 0 }
    {
      if ($0 ~ "^[[:space:]]*php_admin_value\\[memory_limit\\][[:space:]]*=") {
        if (!done) {
          print "php_admin_value[memory_limit] = " value
          done = 1
        }
        next
      }
      print
    }
    END {
      if (!done) {
        print "php_admin_value[memory_limit] = " value
      }
    }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
}

normalize_nginx_server_block() {
  local file="$1"
  local tmp
  tmp="$(mktemp)"
  awk \
    -v client_max_body_size="$CLIENT_MAX_BODY_SIZE" \
    -v client_body_timeout="$CLIENT_BODY_TIMEOUT" \
    -v fastcgi_read_timeout="$FASTCGI_READ_TIMEOUT" \
    -v fastcgi_send_timeout="$FASTCGI_SEND_TIMEOUT" \
    -v send_timeout="$SEND_TIMEOUT" '
    BEGIN {
      in_server = 0
      server_depth = 0
      done = 0
      inserted = 0
    }
    function emit_directives() {
      print "    client_max_body_size " client_max_body_size ";"
      print "    client_body_timeout " client_body_timeout ";"
      print "    fastcgi_read_timeout " fastcgi_read_timeout ";"
      print "    fastcgi_send_timeout " fastcgi_send_timeout ";"
      print "    send_timeout " send_timeout ";"
      inserted = 1
    }
    {
      line = $0
      trimmed = line
      sub(/^[[:space:]]+/, "", trimmed)

      if (!done && !in_server && trimmed ~ /^server[[:space:]]*\{/) {
        in_server = 1
        server_depth = 1
        print line
        next
      }

      if (in_server && !done) {
        if (
          trimmed ~ /^client_max_body_size[[:space:]]+/ ||
          trimmed ~ /^client_body_timeout[[:space:]]+/ ||
          trimmed ~ /^fastcgi_read_timeout[[:space:]]+/ ||
          trimmed ~ /^fastcgi_send_timeout[[:space:]]+/ ||
          trimmed ~ /^send_timeout[[:space:]]+/
        ) {
          next
        }

        if (!inserted && trimmed ~ /^server_name[[:space:]]+/) {
          print line
          emit_directives()
        } else if (!inserted && trimmed ~ /^\}/) {
          emit_directives()
          print line
        } else {
          print line
        }

        opens = gsub(/\{/, "{", line)
        closes = gsub(/\}/, "}", line)
        server_depth += opens - closes
        if (server_depth == 0) {
          in_server = 0
          done = 1
        }
        next
      }

      print line
    }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
}

main() {
  require_root

  local php_dir
  php_dir="$(detect_php_dir)" || {
    echo "Cannot detect PHP-FPM config directory under /etc/php/*/fpm"
    exit 1
  }

  local php_ini="${php_dir}/php.ini"
  local www_conf="${php_dir}/pool.d/www.conf"
  local nginx_conf
  nginx_conf="$(detect_nginx_site_conf)" || {
    echo "Cannot detect active nginx site config. Set NGINX_SITE_CONF=/path/to/site.conf"
    exit 1
  }

  log "Using nginx config: $nginx_conf"
  log "Using php.ini: $php_ini"
  log "Using www.conf: $www_conf"

  backup_file "$nginx_conf"
  backup_file "$php_ini"
  backup_file "$www_conf"

  normalize_nginx_server_block "$nginx_conf"

  set_kv_line "$php_ini" "upload_max_filesize" "$UPLOAD_MAX_FILESIZE"
  set_kv_line "$php_ini" "post_max_size" "$POST_MAX_SIZE"
  set_kv_line "$php_ini" "max_file_uploads" "$MAX_FILE_UPLOADS"
  set_kv_line "$php_ini" "max_execution_time" "$MAX_EXECUTION_TIME"
  set_kv_line "$php_ini" "max_input_time" "$MAX_INPUT_TIME"
  set_kv_line "$php_ini" "memory_limit" "$MEMORY_LIMIT"

  set_www_conf_value "$www_conf" "request_terminate_timeout" "$REQUEST_TERMINATE_TIMEOUT"
  set_www_conf_memory "$www_conf"

  log "Testing nginx config..."
  nginx -t

  log "Restarting php-fpm..."
  systemctl restart "$(basename "$php_dir")-fpm"

  log "Reloading nginx..."
  systemctl reload nginx

  log "Running production build/setup..."
  bash "$SCRIPT_DIR/prod-build-setup.sh" "$TARGET_ALBUM"

  log "Done."
}

main "$@"
