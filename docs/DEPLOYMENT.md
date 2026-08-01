# 飞牛部署

## 已部署实例

- 主机：`104spos@192.168.5.104`（REBLES，Debian 12 x86_64，Asia/Shanghai）
- 项目根目录：`/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog`
- Compose：`repo/infra/compose.yaml`
- 受限环境文件：`secrets/.env`，权限 `600`
- 当前 Web 镜像：`ghcr.io/leesiyou/lee-web:v0.1.0-rc.2`
- 局域网前台：`http://192.168.5.104:19080`
- 局域网后台：`http://192.168.5.104:19081`

## 目录布局

```text
/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog/
├── repo/                    # Git 交付内容副本
├── runtime/
│   ├── postgres/
│   ├── redis/
│   ├── directus-uploads/
│   ├── directus-extensions/
│   ├── caddy-data/
│   ├── caddy-config/
│   ├── deploy-poller/
│   └── logs/
├── secrets/                 # 700；.env 和可选细粒度 Token 为 600
└── backups/
```

## 首次或人工部署

在项目文件已经同步到 `repo/` 后执行：

```sh
PROJECT_ROOT='/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog'; export PROJECT_ROOT; "$PROJECT_ROOT/repo/ops/nas/prepare-runtime.sh" && "$PROJECT_ROOT/repo/ops/nas/deploy.sh"
```

`prepare-runtime.sh` 只在秘密不存在时生成随机秘密，并补充缺失的预览密钥；不会覆盖已有 `.env`。`deploy.sh` 校验 Compose、复制 Directus 扩展、启动本项目容器，不操作其他 Compose 项目。

## Directus 初始化

初始化器可重复运行且不会重复创建默认数据。管理员凭据从 NAS 的受限环境文件读取，禁止把值复制到命令历史、聊天或 Git。

```sh
PROJECT_ROOT='/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog'; export PROJECT_ROOT; cd "$PROJECT_ROOT/repo" && set -a && . "$PROJECT_ROOT/secrets/.env" && set +a && DIRECTUS_URL='http://127.0.0.1:19081' node --experimental-strip-types scripts/initialize-directus.ts
```

## 更新与回滚

常规更新由两分钟轮询器完成，只拉取并重建 web。候选镜像健康检查失败时，脚本自动回滚到更新前镜像，Directus、PostgreSQL、Redis 和 Caddy 不参与前端更新。

生产 `.env` 使用不可变 tag；轮询器检查 `latest` digest 并只在验证成功后记录新状态。最终正式发布时应把 `WEB_IMAGE` 更新为对应的不可变版本 tag，避免重启时漂移。

## 删除边界

不得执行 `docker compose down -v`、`docker system prune -a` 或删除 `runtime/`。本项目的卸载与数据销毁不属于日常部署流程，必须先做周备份并单独审批。
