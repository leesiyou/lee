#!/bin/sh
set -eu

PROJECT_ROOT="${PROJECT_ROOT:-/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog}"
case "$PROJECT_ROOT" in
  /vol6/1000/Docker部署盘/03_网站项目/*) ;;
  *) printf 'Unsafe PROJECT_ROOT: %s\n' "$PROJECT_ROOT" >&2; exit 2 ;;
esac

REPO_DIR="$PROJECT_ROOT/repo"
SYNC_REPO="$PROJECT_ROOT/runtime/content-sync-repo"
TOKEN_FILE="$PROJECT_ROOT/secrets/github-content-token"
DOCKER_CONFIG="$PROJECT_ROOT/runtime/docker-config"
export DOCKER_CONFIG

if [ ! -f "$TOKEN_FILE" ]; then
  printf 'content-sync=BLOCKED missing %s\n' "$TOKEN_FILE" >&2
  exit 3
fi
token_mode="$(stat -c '%a' "$TOKEN_FILE")"
if [ "$token_mode" != 600 ]; then
  printf 'content-sync=BLOCKED token mode must be 600, got %s\n' "$token_mode" >&2
  exit 3
fi
GITHUB_CONTENT_TOKEN="$(tr -d '\r\n' < "$TOKEN_FILE")"
test -n "$GITHUB_CONTENT_TOKEN"
export GITHUB_CONTENT_TOKEN GIT_TERMINAL_PROMPT=0

askpass="$(mktemp)"
cleanup() {
  code=$?
  trap - EXIT INT TERM
  rm -f "$askpass"
  unset GITHUB_CONTENT_TOKEN
  exit "$code"
}
trap cleanup EXIT INT TERM
chmod 700 "$askpass"
printf '%s\n' '#!/bin/sh' > "$askpass"
printf '%s\n' 'case "$1" in *Username*) printf "%s\n" "x-access-token" ;; *) printf "%s\n" "$GITHUB_CONTENT_TOKEN" ;; esac' >> "$askpass"
export GIT_ASKPASS="$askpass"

docker run --rm --network host --user "$(id -u):$(id -g)" \
  -e DIRECTUS_PUBLIC_URL='http://127.0.0.1:19081' \
  -e CONTENT_EXPORT_DIR='/workspace/content-export' \
  -v "$REPO_DIR:/workspace" \
  node:22.23.2-alpine \
  node --experimental-strip-types /workspace/scripts/export-published-content.ts

if [ ! -d "$SYNC_REPO/.git" ]; then
  git clone --filter=blob:none 'https://github.com/leesiyou/lee.git' "$SYNC_REPO"
fi
cd "$SYNC_REPO"
git remote set-url origin 'https://github.com/leesiyou/lee.git'
git fetch origin --prune
if git show-ref --verify --quiet refs/remotes/origin/content-backup; then
  git checkout -B content-backup origin/content-backup
else
  git checkout -B content-backup origin/main
fi

git rm -r --ignore-unmatch content-export >/dev/null 2>&1 || true
mkdir -p content-export
cp -R "$REPO_DIR/content-export/." content-export/
git add content-export
if git diff --cached --quiet; then
  printf 'content-sync=PASS no changes\n'
  exit 0
fi

git -c user.name='104 Blog Content Bot' -c user.email='content-bot@easybreak.top' \
  commit -m "content: sync published articles $(date '+%Y-%m-%d %H:%M')"
git push origin HEAD:content-backup
printf 'content-sync=PASS pushed content-backup\n'
