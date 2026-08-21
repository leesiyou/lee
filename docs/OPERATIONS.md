# 日常运维

以下命令只作用于本项目：

```sh
PROJECT_ROOT='/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog'; COMPOSE="$PROJECT_ROOT/repo/infra/compose.yaml"; ENV_FILE="$PROJECT_ROOT/secrets/.env"; export DOCKER_CONFIG="$PROJECT_ROOT/runtime/docker-config"
```

## 每日检查

```sh
docker compose -f "$COMPOSE" --env-file "$ENV_FILE" ps && curl -fsS http://127.0.0.1:18432/health && curl -fsS http://127.0.0.1:18055/server/ping
```

正常结果为五个容器 healthy、前台 `{"status":"ok"}`、Directus `pong`。故障时先检查项目日志，不要重启旧业务容器：

```sh
docker compose -f "$COMPOSE" --env-file "$ENV_FILE" logs --tail=200 caddy web directus postgres redis
```

## 发布检查

轮询器日志位于 `runtime/logs/deploy-poller.log`，状态位于 `runtime/deploy-poller/`。`deploy=PASS changed=yes` 表示新镜像通过；`deploy=ROLLED_BACK` 表示候选失败且旧镜像已恢复。

## 内容操作

- 日更入口：Directus 后台的文章集合。
- 发布条件：`status=published`，或 `status=scheduled` 且 `published_at` 已到。
- 草稿预览链接是私有链接，不得公开转发。
- “生成公众号素材”始终生成可复制文案、阅读原文和二维码；草稿接口未配置不影响博客发布。即使未来启用，也必须在公众号后台人工审核，系统不自动群发。

## 备份

每日 03:00、每周日 03:30 已安装 cron。人工周备份：

```sh
PROJECT_ROOT="$PROJECT_ROOT" "$PROJECT_ROOT/repo/scripts/backup.sh" weekly
```

恢复使用显式归档和 `CONFIRM_RESTORE=YES`，详见 `BACKUP_AND_RESTORE.md`。不要手工复制正在运行的 PostgreSQL 数据目录作为逻辑备份。

## 安全更新

先在功能分支通过 CI 和镜像构建，再发布版本 tag；NAS 自动更新只触碰 web。Directus/PostgreSQL/Redis/Caddy 升级必须单独备份、阅读迁移说明、在维护窗口执行，不纳入前端自动轮询。

## 事故边界

- 数据库/上传异常：停止写入，保留日志，选择已校验归档执行恢复。
- 前端更新异常：检查轮询器自动回滚，不要重启数据库。
- 外网异常但 LAN 正常：检查节点小宝前台映射，不要改 Compose 数据层。
- 凭据疑似泄漏：先旋转对应凭据，再检查 Git/日志；不要用删除日志代替轮换。
