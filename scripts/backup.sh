#!/bin/sh
set -eu

mode="${1:-daily}"
case "$mode" in
  daily) retain_count=7 ;;
  weekly) retain_count=4 ;;
  *) printf 'Usage: %s daily|weekly\n' "$0" >&2; exit 2 ;;
esac

PROJECT_ROOT="${PROJECT_ROOT:-/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog}"
case "$PROJECT_ROOT" in
  /vol6/1000/Docker部署盘/03_网站项目/*) ;;
  *) printf 'Unsafe PROJECT_ROOT: %s\n' "$PROJECT_ROOT" >&2; exit 2 ;;
esac

REPO_DIR="$PROJECT_ROOT/repo"
RUNTIME_DIR="$PROJECT_ROOT/runtime"
ENV_FILE="$PROJECT_ROOT/secrets/.env"
BACKUP_ROOT="${BACKUP_ROOT:-$PROJECT_ROOT/backups/blog}"
case "$BACKUP_ROOT" in
  "$PROJECT_ROOT"/backups/*) ;;
  *) printf 'Unsafe BACKUP_ROOT: %s\n' "$BACKUP_ROOT" >&2; exit 2 ;;
esac

COMPOSE_FILE="$REPO_DIR/infra/compose.yaml"
DOCKER_CONFIG="$RUNTIME_DIR/docker-config"
export DOCKER_CONFIG
test -f "$ENV_FILE"
test -f "$COMPOSE_FILE"

set -a
. "$ENV_FILE"
set +a

backup_dir="$BACKUP_ROOT/$mode"
timestamp="$(date '+%Y%m%d-%H%M%S')"
archive_name="blog-$mode-$timestamp.tar.gz"
archive_path="$backup_dir/$archive_name"
staging_dir=""

cleanup() {
  code=$?
  trap - EXIT INT TERM
  if [ -n "$staging_dir" ]; then
    case "$staging_dir" in
      "$BACKUP_ROOT"/.staging.*) rm -rf "$staging_dir" ;;
    esac
  fi
  exit "$code"
}
trap cleanup EXIT INT TERM

mkdir -p "$backup_dir"
postgres_kb="$(du -sk "$RUNTIME_DIR/postgres" | awk '{print $1}')"
uploads_kb=0
if [ "$mode" = weekly ]; then
  uploads_kb="$(du -sk "$RUNTIME_DIR/directus-uploads" | awk '{print $1}')"
fi
required_kb=$((postgres_kb + uploads_kb + 131072))
available_kb="$(df -Pk "$BACKUP_ROOT" | tail -n 1 | awk '{print $4}')"
if [ "$available_kb" -lt "$required_kb" ]; then
  printf 'Insufficient backup space: available=%sKB required=%sKB\n' "$available_kb" "$required_kb" >&2
  exit 1
fi

staging_dir="$(mktemp -d "$BACKUP_ROOT/.staging.XXXXXX")"
mkdir -p "$staging_dir/config"
cd "$REPO_DIR"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$staging_dir/postgres.dump"
test -s "$staging_dir/postgres.dump"

cp infra/compose.yaml "$staging_dir/config/compose.yaml"
cp infra/Caddyfile "$staging_dir/config/Caddyfile"
cp infra/directus/schema.yaml "$staging_dir/config/directus-schema.yaml"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" images --format json \
  > "$staging_dir/image-versions.json"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps --format json \
  > "$staging_dir/container-state.json"

if [ "$mode" = weekly ]; then
  tar -C "$RUNTIME_DIR" -czf "$staging_dir/directus-uploads.tgz" directus-uploads
else
  printf 'Daily backups retain current uploads; weekly backups include directus-uploads.tgz.\n' \
    > "$staging_dir/UPLOADS_EXCLUDED.txt"
fi

cat > "$staging_dir/SECRETS_EXCLUDED.txt" <<'EOF'
The plaintext secrets/.env file is intentionally excluded from this archive.
Keep an encrypted copy in a password manager and restore it to PROJECT_ROOT/secrets/.env with mode 600.
The backup is not sufficient to recover credentials without that separately protected copy.
EOF

cat > "$staging_dir/NODE_XIAOBAO.txt" <<'EOF'
Node Xiaobao is installed outside this Compose project at /vol6/@appcenter/owjdxb with data under /vol6/@appdata/owjdxb.
Its private-key-bearing configuration is intentionally not copied into routine blog archives.
The pre-deployment protective snapshot and docs/NODE_XIAOBAO.md record the mapping audit and recovery location.
EOF

{
  printf 'backup_type=%s\n' "$mode"
  printf 'created_at=%s\n' "$(date -Iseconds)"
  printf 'project_root=%s\n' "$PROJECT_ROOT"
  printf 'postgres_database=%s\n' "$POSTGRES_DB"
  printf 'uploads_included=%s\n' "$([ "$mode" = weekly ] && printf yes || printf no)"
  printf 'secrets_included=no\n'
} > "$staging_dir/MANIFEST.txt"

temp_archive="$backup_dir/.$archive_name.part"
tar -C "$staging_dir" -czf "$temp_archive" .
mv "$temp_archive" "$archive_path"
(
  cd "$backup_dir"
  sha256sum "$archive_name" > "$archive_name.sha256"
)

find "$backup_dir" -maxdepth 1 -type f -name "blog-$mode-*.tar.gz" \
  -printf '%T@ %p\n' | sort -rn | sed -n "$((retain_count + 1)),\$p" | cut -d ' ' -f 2- |
while IFS= read -r old_archive; do
  [ -n "$old_archive" ] || continue
  case "$old_archive" in
    "$backup_dir"/blog-"$mode"-*.tar.gz)
      rm -f "$old_archive" "$old_archive.sha256"
      ;;
  esac
done

printf 'backup=PASS\n'
printf 'type=%s\n' "$mode"
printf 'archive=%s\n' "$archive_path"
printf 'checksum=%s.sha256\n' "$archive_path"
