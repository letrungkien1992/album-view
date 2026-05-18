#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
OS_TYPE="$(uname -s)"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env file at: $ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${DOMAIN:?DOMAIN is required in .env}"
: "${EMAIL:?EMAIL is required in .env}"

PROJECT_PATH="${PROJECT_PATH:-/var/www/album-view}"
APP_USER="${APP_USER:-www-data}"
APP_GROUP="${APP_GROUP:-www-data}"
SERVICE_NAME="${SERVICE_NAME:-album-view}"
APP_PORT="${APP_PORT:-5500}"
ENABLE_SSL="${ENABLE_SSL:-true}"
ENABLE_WWW="${ENABLE_WWW:-true}"
PHP_BIN="${PHP_BIN:-$(command -v php || echo /usr/bin/php)}"
SOURCE_DIR="${SOURCE_DIR:-$PROJECT_ROOT}"

LINUX_NGINX_CONF="/etc/nginx/sites-available/${SERVICE_NAME}.conf"
LINUX_NGINX_LINK="/etc/nginx/sites-enabled/${SERVICE_NAME}.conf"
LINUX_SYSTEMD_SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

MAC_BREW_PREFIX=""
MAC_NGINX_SERVERS_DIR=""
MAC_NGINX_CONF=""
MAC_LAUNCHD_PLIST=""

log() {
  echo "[setup] $*"
}

is_linux() {
  [[ "$OS_TYPE" == "Linux" ]]
}

is_macos() {
  [[ "$OS_TYPE" == "Darwin" ]]
}

ensure_root_if_linux() {
  if is_linux && [[ ${EUID:-$(id -u)} -ne 0 ]]; then
    echo "Please run as root on Linux: sudo bash scripts/setup-domain.sh"
    exit 1
  fi
}

setup_macos_paths() {
  MAC_BREW_PREFIX="$(brew --prefix)"
  MAC_NGINX_SERVERS_DIR="$MAC_BREW_PREFIX/etc/nginx/servers"
  MAC_NGINX_CONF="$MAC_NGINX_SERVERS_DIR/${SERVICE_NAME}.conf"
  MAC_LAUNCHD_PLIST="$HOME/Library/LaunchAgents/com.${SERVICE_NAME}.plist"
  mkdir -p "$MAC_NGINX_SERVERS_DIR"
}

ensure_supported_os() {
  if is_linux; then
    if ! command -v apt-get >/dev/null 2>&1; then
      echo "Linux detected but apt-get not found. Currently supported Linux: Debian/Ubuntu."
      exit 1
    fi
    return
  fi

  if is_macos; then
    if ! command -v brew >/dev/null 2>&1; then
      echo "macOS detected but Homebrew not found. Install from https://brew.sh first."
      exit 1
    fi
    setup_macos_paths
    return
  fi

  echo "Unsupported OS: $OS_TYPE"
  exit 1
}

ensure_packages_linux() {
  local packages=(
    php
    php-cli
    php-gd
    php-zip
    nginx
    certbot
    python3-certbot-nginx
    webp
    curl
    rsync
  )
  local missing=()
  local pkg

  for pkg in "${packages[@]}"; do
    if ! dpkg -s "$pkg" >/dev/null 2>&1; then
      missing+=("$pkg")
    fi
  done

  if [[ ${#missing[@]} -eq 0 ]]; then
    log "All required Linux packages already installed."
    return
  fi

  log "Installing missing Linux packages: ${missing[*]}"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y "${missing[@]}"
}

ensure_packages_macos() {
  local packages=(php nginx certbot webp curl rsync)
  local missing=()
  local pkg

  for pkg in "${packages[@]}"; do
    if ! brew list --formula "$pkg" >/dev/null 2>&1; then
      missing+=("$pkg")
    fi
  done

  if [[ ${#missing[@]} -eq 0 ]]; then
    log "All required macOS packages already installed."
    return
  fi

  log "Installing missing macOS packages: ${missing[*]}"
  brew install "${missing[@]}"
}

ensure_packages() {
  if is_linux; then
    ensure_packages_linux
  else
    ensure_packages_macos
  fi
}

ensure_user_group() {
  if is_linux; then
    if ! getent group "$APP_GROUP" >/dev/null 2>&1; then
      log "Creating group: $APP_GROUP"
      groupadd --system "$APP_GROUP"
    fi

    if ! id -u "$APP_USER" >/dev/null 2>&1; then
      log "Creating user: $APP_USER"
      useradd --system --no-create-home --gid "$APP_GROUP" --shell /usr/sbin/nologin "$APP_USER"
    fi
  else
    APP_USER="$(id -un)"
    APP_GROUP="$(id -gn)"
  fi
}

sync_project() {
  mkdir -p "$PROJECT_PATH"

  if [[ ! -f "$SOURCE_DIR/index.php" ]]; then
    log "Source project not found at $SOURCE_DIR (missing index.php). Skipping sync."
  else
    log "Syncing project to $PROJECT_PATH"
    rsync -a --delete \
      --exclude '.git' \
      --exclude '.idea' \
      --exclude '.DS_Store' \
      --exclude '.server.pid' \
      --exclude '.server.log' \
      --exclude '.env' \
      "$SOURCE_DIR/" "$PROJECT_PATH/"
  fi

  if is_linux; then
    chown -R "$APP_USER:$APP_GROUP" "$PROJECT_PATH"
  fi

  chmod +x \
    "$PROJECT_PATH/scripts/start-server.sh" \
    "$PROJECT_PATH/scripts/stop-server.sh" \
    "$PROJECT_PATH/scripts/convert-images-webp.sh" \
    "$PROJECT_PATH/scripts/build-album-images.sh" \
    "$PROJECT_PATH/scripts/run-scripts.sh" 2>/dev/null || true
}

write_systemd_service() {
  local tmp
  tmp="$(mktemp)"

  cat > "$tmp" <<EOF
[Unit]
Description=Album View PHP Server
After=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_GROUP}
WorkingDirectory=${PROJECT_PATH}
ExecStart=${PHP_BIN} -S 127.0.0.1:${APP_PORT} -t ${PROJECT_PATH} ${PROJECT_PATH}/router.php
Restart=always
RestartSec=3
Environment=PHP_SERVER=1

[Install]
WantedBy=multi-user.target
EOF

  if [[ ! -f "$LINUX_SYSTEMD_SERVICE_FILE" ]] || ! cmp -s "$tmp" "$LINUX_SYSTEMD_SERVICE_FILE"; then
    log "Updating systemd service: $LINUX_SYSTEMD_SERVICE_FILE"
    mv "$tmp" "$LINUX_SYSTEMD_SERVICE_FILE"
    systemctl daemon-reload
  else
    rm -f "$tmp"
    log "Systemd service already up to date."
  fi

  systemctl enable "$SERVICE_NAME"
  systemctl restart "$SERVICE_NAME"
}

write_launchd_service() {
  local tmp
  tmp="$(mktemp)"

  cat > "$tmp" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.${SERVICE_NAME}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${PHP_BIN}</string>
    <string>-S</string>
    <string>127.0.0.1:${APP_PORT}</string>
    <string>-t</string>
    <string>${PROJECT_PATH}</string>
    <string>${PROJECT_PATH}/router.php</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${PROJECT_PATH}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${PROJECT_PATH}/.server.log</string>
  <key>StandardErrorPath</key>
  <string>${PROJECT_PATH}/.server.log</string>
</dict>
</plist>
EOF

  if [[ ! -f "$MAC_LAUNCHD_PLIST" ]] || ! cmp -s "$tmp" "$MAC_LAUNCHD_PLIST"; then
    log "Updating launchd service: $MAC_LAUNCHD_PLIST"
    mv "$tmp" "$MAC_LAUNCHD_PLIST"
  else
    rm -f "$tmp"
    log "Launchd service already up to date."
  fi

  launchctl unload "$MAC_LAUNCHD_PLIST" >/dev/null 2>&1 || true
  launchctl load "$MAC_LAUNCHD_PLIST"
}

write_nginx_config_linux() {
  local server_names="$DOMAIN"
  if [[ "$ENABLE_WWW" == "true" ]]; then
    server_names="$server_names www.$DOMAIN"
  fi

  local tmp
  tmp="$(mktemp)"

  cat > "$tmp" <<EOF
server {
    listen 80;
    server_name ${server_names};

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

  if [[ ! -f "$LINUX_NGINX_CONF" ]] || ! cmp -s "$tmp" "$LINUX_NGINX_CONF"; then
    log "Updating Nginx config: $LINUX_NGINX_CONF"
    mv "$tmp" "$LINUX_NGINX_CONF"
  else
    rm -f "$tmp"
    log "Nginx config already up to date."
  fi

  ln -sf "$LINUX_NGINX_CONF" "$LINUX_NGINX_LINK"
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl enable nginx
  systemctl restart nginx
}

write_nginx_config_macos() {
  local server_names="$DOMAIN"
  if [[ "$ENABLE_WWW" == "true" ]]; then
    server_names="$server_names www.$DOMAIN"
  fi

  local tmp
  tmp="$(mktemp)"

  cat > "$tmp" <<EOF
server {
    listen 80;
    server_name ${server_names};

    client_max_body_size 50M;

    location / {
      proxy_pass http://127.0.0.1:${APP_PORT};
      proxy_http_version 1.1;
      proxy_set_header Host \$host;
      proxy_set_header X-Real-IP \$remote_addr;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

  if [[ ! -f "$MAC_NGINX_CONF" ]] || ! cmp -s "$tmp" "$MAC_NGINX_CONF"; then
    log "Updating Nginx config: $MAC_NGINX_CONF"
    mv "$tmp" "$MAC_NGINX_CONF"
  else
    rm -f "$tmp"
    log "Nginx config already up to date."
  fi

  nginx -t
  brew services restart nginx >/dev/null 2>&1 || brew services start nginx
}

write_nginx_config() {
  if is_linux; then
    write_nginx_config_linux
  else
    write_nginx_config_macos
  fi
}

cert_exists_for_domain() {
  certbot certificates 2>/dev/null | grep -E "Domains: .*\\b${DOMAIN}\\b" >/dev/null 2>&1
}

ensure_ssl() {
  if [[ "$ENABLE_SSL" != "true" ]]; then
    log "ENABLE_SSL=false, skipping SSL setup."
    return
  fi

  if [[ "$DOMAIN" == *.local ]]; then
    log "Domain ends with .local; skipping Let's Encrypt SSL."
    return
  fi

  if cert_exists_for_domain; then
    log "SSL certificate already exists for ${DOMAIN}, skipping certbot issuance."
    return
  fi

  if is_macos; then
    log "On macOS, certbot with nginx may require sudo/admin DNS setup."
    log "Running certificate issuance now..."
  fi

  if [[ "$ENABLE_WWW" == "true" ]]; then
    certbot --nginx \
      -d "$DOMAIN" \
      -d "www.$DOMAIN" \
      --agree-tos \
      --email "$EMAIL" \
      --non-interactive \
      --redirect
  else
    certbot --nginx \
      -d "$DOMAIN" \
      --agree-tos \
      --email "$EMAIL" \
      --non-interactive \
      --redirect
  fi
}

ensure_firewall_rules() {
  if ! is_linux; then
    return
  fi

  if ! command -v ufw >/dev/null 2>&1; then
    return
  fi

  log "Ensuring UFW rules for 80/443"
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
}

show_status() {
  if is_linux; then
    log "Service status:"
    systemctl status "$SERVICE_NAME" --no-pager | sed -n '1,20p' || true
    log "Nginx status:"
    systemctl status nginx --no-pager | sed -n '1,20p' || true
  else
    log "Launchd status:"
    launchctl list | grep -i "com.${SERVICE_NAME}" || true
    log "Nginx (brew services) status:"
    brew services list | grep -i nginx || true
  fi

  if [[ "$ENABLE_SSL" == "true" && "$DOMAIN" != *.local ]]; then
    log "Done. URL: https://${DOMAIN}"
  else
    log "Done. URL: http://${DOMAIN}"
  fi
}

ensure_root_if_linux
ensure_supported_os

log "1/7 Ensure packages"
ensure_packages
log "2/7 Ensure user/group"
ensure_user_group
log "3/7 Sync project"
sync_project
log "4/7 Configure app service"
if is_linux; then
  write_systemd_service
else
  write_launchd_service
fi
log "5/7 Configure nginx"
write_nginx_config
log "6/7 Configure SSL"
ensure_ssl
log "7/7 Configure firewall + status"
ensure_firewall_rules
show_status
