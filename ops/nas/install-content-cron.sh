#!/bin/sh
set -eu

PROJECT_ROOT="${PROJECT_ROOT:-/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog}"
case "$PROJECT_ROOT" in
  /vol6/1000/Docker部署盘/03_网站项目/*) ;;
  *) printf 'Unsafe PROJECT_ROOT: %s\n' "$PROJECT_ROOT" >&2; exit 2 ;;
esac

SCRIPT="$PROJECT_ROOT/repo/scripts/sync-content-backup.sh"
TOKEN_FILE="$PROJECT_ROOT/secrets/github-content-token"
LOG="$PROJECT_ROOT/runtime/logs/content-sync.log"
CRON_BACKUP_DIR="$PROJECT_ROOT/backups/config"
test -x "$SCRIPT"
test -f "$TOKEN_FILE"
[ "$(stat -c '%a' "$TOKEN_FILE")" = 600 ]
mkdir -p "$(dirname "$LOG")" "$CRON_BACKUP_DIR"

current="$(mktemp)"
updated="$(mktemp)"
cleanup() {
  code=$?
  trap - EXIT INT TERM
  rm -f "$current" "$updated"
  exit "$code"
}
trap cleanup EXIT INT TERM

crontab -l > "$current" 2>/dev/null || true
cp "$current" "$CRON_BACKUP_DIR/crontab-pre-content-sync-$(date '+%Y%m%d-%H%M%S').txt"
awk '
  $0 == "# BEGIN 104-H5-BLOG-CONTENT-SYNC" { skip=1; next }
  $0 == "# END 104-H5-BLOG-CONTENT-SYNC" { skip=0; next }
  !skip { print }
' "$current" > "$updated"
{
  printf '%s\n' '# BEGIN 104-H5-BLOG-CONTENT-SYNC'
  printf '15 4 * * * PROJECT_ROOT="%s" "%s" >> "%s" 2>&1\n' "$PROJECT_ROOT" "$SCRIPT" "$LOG"
  printf '%s\n' '# END 104-H5-BLOG-CONTENT-SYNC'
} >> "$updated"
crontab "$updated"
crontab -l | sed -n '/# BEGIN 104-H5-BLOG-CONTENT-SYNC/,/# END 104-H5-BLOG-CONTENT-SYNC/p'
