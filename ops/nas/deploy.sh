#!/bin/sh
set -eu

PROJECT_ROOT="${PROJECT_ROOT:-/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog}"
REPO_DIR="$PROJECT_ROOT/repo"
ENV_FILE="$PROJECT_ROOT/secrets/.env"
COMPOSE_FILE="$REPO_DIR/infra/compose.yaml"
DOCKER_CONFIG="$PROJECT_ROOT/runtime/docker-config"
export DOCKER_CONFIG

test -f "$ENV_FILE"
test -f "$COMPOSE_FILE"
mkdir -p "$DOCKER_CONFIG"
chmod 700 "$DOCKER_CONFIG"
mkdir -p "$PROJECT_ROOT/runtime/directus-extensions"
cp -R "$REPO_DIR/infra/directus/extensions/." "$PROJECT_ROOT/runtime/directus-extensions/"
cd "$REPO_DIR"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config --quiet
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --pull web
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
