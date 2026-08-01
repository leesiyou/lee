# 嘎子的创业实验室

移动端优先的日更 H5 博客。Astro Node SSR 负责前台，Directus 负责内容编辑，PostgreSQL 和 Redis 负责持久化与缓存，Caddy 提供唯一入口。

飞牛使用 `http://192.168.5.104:18432` 验收前台，Directus 后台仅在局域网 `http://192.168.5.104:18055` 访问。节点小宝只把 `127.0.0.1:18432` 映射为真实公网 HTTPS 地址，微信公众号菜单和阅读原文均进入博客前台。

## 文档

- [系统架构](docs/ARCHITECTURE.md)
- [部署说明](docs/DEPLOYMENT.md)
- [节点小宝映射](docs/NODE_XIAOBAO.md)
- [GitHub 自动化与内容同步](docs/GITHUB_SYNC.md)
- [日常运维](docs/OPERATIONS.md)
- [安全说明](docs/SECURITY.md)
- [备份与恢复](docs/BACKUP_AND_RESTORE.md)
- [验收报告](docs/ACCEPTANCE_REPORT.md)
- [24 项部署报告](docs/DEPLOYMENT_REPORT.md)
- [真实阻塞项](docs/BLOCKERS.md)

敏感信息只保存在飞牛受限的 `secrets/.env` 或对应的 `secrets/` 凭据文件，不进入 Git、镜像或日志。

## 本地检查

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

## 分支

开发通过 `feature/h5-blog-system` 提交 Draft PR，不直接修改 `main`。
