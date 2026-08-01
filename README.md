# 嘎子的创业实验室

移动端优先的日更 H5 博客。Astro Node SSR 负责前台，Directus 负责内容编辑，PostgreSQL 和 Redis 负责持久化与缓存，Caddy 提供唯一入口。

正式部署、日常运维和安全说明位于 `docs/`。敏感信息只保存在飞牛受限的 `secrets/.env`，不会进入 Git。

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
