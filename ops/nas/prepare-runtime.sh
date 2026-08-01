#!/bin/sh
set -eu

PROJECT_ROOT="${PROJECT_ROOT:-/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog}"
case "$PROJECT_ROOT" in
  /vol6/1000/Docker部署盘/03_网站项目/*) ;;
  *) printf 'Unsafe PROJECT_ROOT: %s\n' "$PROJECT_ROOT" >&2; exit 2 ;;
esac

RUNTIME_DIR="$PROJECT_ROOT/runtime"
SECRETS_DIR="$PROJECT_ROOT/secrets"
ENV_FILE="$SECRETS_DIR/.env"

umask 077
mkdir -p \
  "$PROJECT_ROOT/repo" \
  "$RUNTIME_DIR/postgres" \
  "$RUNTIME_DIR/redis" \
  "$RUNTIME_DIR/directus-uploads" \
  "$RUNTIME_DIR/directus-extensions" \
  "$RUNTIME_DIR/docker-config" \
  "$RUNTIME_DIR/caddy-data" \
  "$RUNTIME_DIR/caddy-config" \
  "$RUNTIME_DIR/logs/caddy" \
  "$PROJECT_ROOT/backups/postgres" \
  "$PROJECT_ROOT/backups/uploads" \
  "$SECRETS_DIR"

chmod 700 "$SECRETS_DIR" "$PROJECT_ROOT/backups"
chmod 700 "$RUNTIME_DIR/docker-config"

if [ ! -f "$ENV_FILE" ]; then
  postgres_password="$(openssl rand -hex 32)"
  redis_password="$(openssl rand -hex 32)"
  directus_secret="$(openssl rand -hex 32)"
  directus_password="$(openssl rand -base64 30 | tr -d '\n')"
  wechat_secret="$(openssl rand -hex 32)"
  {
    printf 'RUNTIME_DIR=%s\n' "$RUNTIME_DIR"
    printf 'WEB_IMAGE=ghcr.io/leesiyou/lee-web:v0.1.0\n'
    printf 'BUILD_VERSION=nas-local\n'
    printf 'POSTGRES_DB=blog\n'
    printf 'POSTGRES_USER=blog\n'
    printf 'POSTGRES_PASSWORD=%s\n' "$postgres_password"
    printf 'REDIS_PASSWORD=%s\n' "$redis_password"
    printf 'DIRECTUS_SECRET=%s\n' "$directus_secret"
    printf 'DIRECTUS_ADMIN_EMAIL=admin@easybreak.top\n'
    printf 'DIRECTUS_ADMIN_PASSWORD=%s\n' "$directus_password"
    printf 'DIRECTUS_PUBLIC_URL=https://blog-admin.easybreak.top\n'
    printf 'PUBLIC_BASE_URL=https://blog.easybreak.top\n'
    printf 'PUBLIC_ADMIN_URL=https://blog-admin.easybreak.top\n'
    printf 'CORS_ORIGIN=https://blog.easybreak.top,https://blog-admin.easybreak.top,http://192.168.5.104:19080,http://192.168.5.104:19081\n'
    printf 'WECHAT_DRAFT_ENABLED=false\n'
    printf 'WECHAT_APP_ID=\n'
    printf 'WECHAT_APP_SECRET=\n'
    printf 'WECHAT_AUTOMATION_SECRET=%s\n' "$wechat_secret"
  } > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

ensure_secret() {
  key="$1"
  if ! grep -q "^${key}=" "$ENV_FILE"; then
    value="$(openssl rand -hex 32)"
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

ensure_secret 'PREVIEW_SECRET'
ensure_secret 'DIRECTUS_PREVIEW_TOKEN'
chmod 600 "$ENV_FILE"

printf 'runtime-ready=%s\n' "$PROJECT_ROOT"
printf 'secrets-mode=%s\n' "$(stat -c '%a' "$ENV_FILE")"
