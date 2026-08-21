#!/bin/sh
set -eu

PROJECT_ROOT="${PROJECT_ROOT:-/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog}"
case "$PROJECT_ROOT" in
  /vol6/1000/Docker部署盘/03_网站项目/*) ;;
  *) printf 'Unsafe PROJECT_ROOT: %s\n' "$PROJECT_ROOT" >&2; exit 2 ;;
esac

REPO_DIR="$PROJECT_ROOT/repo"
RUNTIME_DIR="$PROJECT_ROOT/runtime"
ENV_FILE="$PROJECT_ROOT/secrets/.env"
BACKUP_ROOT="${BACKUP_ROOT:-$PROJECT_ROOT/backups/blog}"
COMPOSE_FILE="$REPO_DIR/infra/compose.yaml"
DOCKER_CONFIG="$RUNTIME_DIR/docker-config"
export DOCKER_CONFIG

backup_file="${1:-}"
if [ -z "$backup_file" ]; then
  printf 'Usage: CONFIRM_RESTORE=YES %s /absolute/path/to/blog-*.tar.gz\n' "$0" >&2
  exit 2
fi
if [ "${CONFIRM_RESTORE:-NO}" != YES ]; then
  printf 'Restore refused: set CONFIRM_RESTORE=YES after checking the exact archive.\n' >&2
  exit 2
fi
test -f "$backup_file"
backup_file="$(readlink -f "$backup_file")"
case "$backup_file" in
  "$BACKUP_ROOT"/daily/blog-daily-*.tar.gz|"$BACKUP_ROOT"/weekly/blog-weekly-*.tar.gz) ;;
  *) printf 'Restore archive is outside the scoped backup directory: %s\n' "$backup_file" >&2; exit 2 ;;
esac

checksum_file="$backup_file.sha256"
test -f "$checksum_file"
(
  cd "$(dirname "$backup_file")"
  sha256sum -c "$(basename "$checksum_file")"
)

if tar -tzf "$backup_file" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  printf 'Unsafe path found in backup archive.\n' >&2
  exit 1
fi

test -f "$ENV_FILE"
test -f "$COMPOSE_FILE"
set -a
. "$ENV_FILE"
set +a

restore_dir="$(mktemp -d "$BACKUP_ROOT/.restore.XXXXXX")"
services_stopped=no
cleanup() {
  code=$?
  trap - EXIT INT TERM
  case "$restore_dir" in
    "$BACKUP_ROOT"/.restore.*) rm -rf "$restore_dir" ;;
  esac
  if [ "$code" -ne 0 ] && [ "$services_stopped" = yes ]; then
    cd "$REPO_DIR"
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d caddy web directus || true
  fi
  exit "$code"
}
trap cleanup EXIT INT TERM

tar -C "$restore_dir" -xzf "$backup_file"
test -s "$restore_dir/postgres.dump"
test -f "$restore_dir/MANIFEST.txt"

printf 'Creating mandatory pre-restore snapshot...\n'
"$(dirname "$0")/backup.sh" daily

cd "$REPO_DIR"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" stop caddy web directus
services_stopped=yes

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  pg_restore --clean --if-exists --no-owner --no-privileges \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$restore_dir/postgres.dump"

if [ -f "$restore_dir/directus-uploads.tgz" ]; then
  mkdir -p "$restore_dir/uploads-unpacked" "$BACKUP_ROOT/pre-restore"
  tar -C "$restore_dir/uploads-unpacked" -xzf "$restore_dir/directus-uploads.tgz"
  test -d "$restore_dir/uploads-unpacked/directus-uploads"
  uploads_snapshot="$BACKUP_ROOT/pre-restore/uploads-pre-restore-$(date '+%Y%m%d-%H%M%S')"
  mv "$RUNTIME_DIR/directus-uploads" "$uploads_snapshot"
  mv "$restore_dir/uploads-unpacked/directus-uploads" "$RUNTIME_DIR/directus-uploads"
  printf 'previous_uploads=%s\n' "$uploads_snapshot"
fi

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

health=failed
attempt=0
while [ "$attempt" -lt 45 ]; do
  if curl -fsS 'http://127.0.0.1:18432/health' >/dev/null 2>&1 && \
     [ "$(curl -fsS 'http://127.0.0.1:18055/server/ping' 2>/dev/null)" = pong ]; then
    health=ok
    break
  fi
  attempt=$((attempt + 1))
  sleep 2
done
if [ "$health" != ok ]; then
  printf 'Restore completed but health verification failed. Use the printed pre-restore snapshot for rollback.\n' >&2
  exit 1
fi

services_stopped=no
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
printf 'restore=PASS\n'
printf 'archive=%s\n' "$backup_file"
printf 'health=%s\n' "$health"
