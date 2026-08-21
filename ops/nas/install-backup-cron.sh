#!/bin/sh
set -eu

PROJECT_ROOT="${PROJECT_ROOT:-/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog}"
case "$PROJECT_ROOT" in
  /vol6/1000/Docker部署盘/03_网站项目/*) ;;
  *) printf 'Unsafe PROJECT_ROOT: %s\n' "$PROJECT_ROOT" >&2; exit 2 ;;
esac

SCRIPT="$PROJECT_ROOT/repo/scripts/backup.sh"
LOG="$PROJECT_ROOT/runtime/logs/backup.log"
CRON_BACKUP_DIR="$PROJECT_ROOT/backups/config"
test -x "$SCRIPT"
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
cp "$current" "$CRON_BACKUP_DIR/crontab-pre-blog-backup-$(date '+%Y%m%d-%H%M%S').txt"
awk '
  $0 == "# BEGIN 104-H5-BLOG-BACKUP" { skip=1; next }
  $0 == "# END 104-H5-BLOG-BACKUP" { skip=0; next }
  !skip { print }
' "$current" > "$updated"
{
  printf '%s\n' '# BEGIN 104-H5-BLOG-BACKUP'
  printf '0 3 * * * PROJECT_ROOT="%s" "%s" daily >> "%s" 2>&1\n' "$PROJECT_ROOT" "$SCRIPT" "$LOG"
  printf '30 3 * * 0 PROJECT_ROOT="%s" "%s" weekly >> "%s" 2>&1\n' "$PROJECT_ROOT" "$SCRIPT" "$LOG"
  printf '%s\n' '# END 104-H5-BLOG-BACKUP'
} >> "$updated"
crontab "$updated"
crontab -l | sed -n '/# BEGIN 104-H5-BLOG-BACKUP/,/# END 104-H5-BLOG-BACKUP/p'
