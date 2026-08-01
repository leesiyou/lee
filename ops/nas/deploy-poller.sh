#!/bin/sh
set -eu

PROJECT_ROOT="${PROJECT_ROOT:-/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog}"
case "$PROJECT_ROOT" in
  /vol6/1000/Docker部署盘/03_网站项目/*) ;;
  *) printf 'Unsafe PROJECT_ROOT: %s\n' "$PROJECT_ROOT" >&2; exit 2 ;;
esac

REPO_DIR="$PROJECT_ROOT/repo"
ENV_FILE="$PROJECT_ROOT/secrets/.env"
COMPOSE_FILE="$REPO_DIR/infra/compose.yaml"
STATE_DIR="$PROJECT_ROOT/runtime/deploy-poller"
DOCKER_CONFIG="$PROJECT_ROOT/runtime/docker-config"
TOKEN_FILE="$PROJECT_ROOT/secrets/github-packages-token"
candidate_image="${DEPLOY_POLLER_IMAGE_OVERRIDE:-ghcr.io/leesiyou/lee-web:latest}"
health_attempts="${DEPLOY_HEALTH_ATTEMPTS:-30}"
export DOCKER_CONFIG

mkdir -p "$STATE_DIR" "$DOCKER_CONFIG"
exec 9> "$STATE_DIR/deploy.lock"
if ! flock -n 9; then
  printf '%s deploy=SKIP reason=locked\n' "$(date -Iseconds)"
  exit 0
fi

log() {
  printf '%s %s\n' "$(date -Iseconds)" "$*"
}

test -f "$ENV_FILE"
test -f "$COMPOSE_FILE"
if [ -f "$TOKEN_FILE" ]; then
  token_mode="$(stat -c '%a' "$TOKEN_FILE")"
  [ "$token_mode" = 600 ] || { log "deploy=BLOCKED package-token-mode=$token_mode"; exit 3; }
  docker login ghcr.io --username leesiyou --password-stdin < "$TOKEN_FILE" >/dev/null
fi

if [ "${DEPLOY_POLLER_SKIP_PULL:-false}" != true ]; then
  if ! docker pull "$candidate_image"; then
    log "deploy=FAIL stage=pull image=$candidate_image"
    exit 1
  fi
fi

candidate_image_id="$(docker image inspect -f '{{.Id}}' "$candidate_image")"
candidate_digest="$(docker image inspect -f '{{range .RepoDigests}}{{println .}}{{end}}' "$candidate_image" | sed -n '1p')"
[ -n "$candidate_digest" ] || candidate_digest="$candidate_image_id"
container_id="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q web)"
test -n "$container_id"
previous_image_id="$(docker inspect -f '{{.Image}}' "$container_id")"
previous_digest="$(docker image inspect -f '{{range .RepoDigests}}{{println .}}{{end}}' "$previous_image_id" | sed -n '1p')"
[ -n "$previous_digest" ] || previous_digest="$previous_image_id"

if [ "$candidate_image_id" = "$previous_image_id" ]; then
  log "deploy=PASS changed=no digest=$candidate_digest"
  exit 0
fi

timestamp="$(date '+%Y%m%d%H%M%S')"
rollback_image="lee-web:rollback-$timestamp"
docker tag "$previous_image_id" "$rollback_image"
printf '%s\n' "$previous_image_id" > "$STATE_DIR/previous-image-id"
printf '%s\n' "$previous_digest" > "$STATE_DIR/previous-digest"

log "deploy=START candidate=$candidate_digest previous=$previous_digest"
WEB_IMAGE="$candidate_image" docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" \
  up -d --no-deps --force-recreate web

healthy=no
attempt=0
while [ "$attempt" -lt "$health_attempts" ]; do
  container_id="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q web)"
  status="$(docker inspect -f '{{.State.Health.Status}}' "$container_id" 2>/dev/null || true)"
  if [ "$status" = healthy ] && curl -fsS 'http://127.0.0.1:19080/health' >/dev/null 2>&1; then
    healthy=yes
    break
  fi
  attempt=$((attempt + 1))
  sleep 2
done

if [ "$healthy" != yes ]; then
  log "deploy=FAIL stage=health action=rollback"
  WEB_IMAGE="$rollback_image" docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" \
    up -d --no-deps --force-recreate web
  rollback_healthy=no
  attempt=0
  while [ "$attempt" -lt "$health_attempts" ]; do
    container_id="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q web)"
    status="$(docker inspect -f '{{.State.Health.Status}}' "$container_id" 2>/dev/null || true)"
    if [ "$status" = healthy ] && curl -fsS 'http://127.0.0.1:19080/health' >/dev/null 2>&1; then
      rollback_healthy=yes
      break
    fi
    attempt=$((attempt + 1))
    sleep 2
  done
  printf '%s\n' "$candidate_digest" > "$STATE_DIR/last-failed-digest"
  [ "$rollback_healthy" = yes ] || { log 'deploy=CRITICAL rollback=failed'; exit 2; }
  log "deploy=ROLLED_BACK image=$previous_digest"
  exit 1
fi

printf '%s\n' "$candidate_image_id" > "$STATE_DIR/current-image-id.tmp"
printf '%s\n' "$candidate_digest" > "$STATE_DIR/current-digest.tmp"
mv "$STATE_DIR/current-image-id.tmp" "$STATE_DIR/current-image-id"
mv "$STATE_DIR/current-digest.tmp" "$STATE_DIR/current-digest"
log "deploy=PASS changed=yes digest=$candidate_digest"
