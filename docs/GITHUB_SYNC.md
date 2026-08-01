# GitHub 自动化与内容同步

## 代码与镜像

- 仓库：`https://github.com/leesiyou/lee`
- 开发分支：`feature/h5-blog-system`
- Draft PR：`https://github.com/leesiyou/lee/pull/1`
- GHCR：`ghcr.io/leesiyou/lee-web`

`CI` 在 PR、`main` 和 `feature/**` push 上执行锁定依赖安装、TypeScript、ESLint、70 项单元测试、Astro build、Compose 结构/插值校验和 Docker build。

`Publish web image` 在 `main`、版本 tag 或人工触发时构建 `linux/amd64` 镜像，写入 OCI source/revision/created 标签，并发布 `latest`、短 SHA 和版本 tag。它仅使用 GitHub 内置 `GITHUB_TOKEN`，不包含 NAS 或应用秘密。

NAS 的 `deploy-poller.sh` 每两分钟匿名拉取公开 GHCR，使用文件锁避免并发，digest 变化时只重建 web，健康失败自动回滚。坏镜像回滚和真实 GHCR 自动更新均已通过。

## 已发布内容备份分支

Directus 仍是内容主库。`scripts/export-published-content.ts` 只导出已发布且到期文章，路径为 `content-export/YYYY/MM/<slug>.md`，不导出草稿、管理员信息或秘密。

`content-backup` 分支已用真实第一篇文章验证，重复导出无变化时不会产生新提交。NAS 自动推送脚本将内容变化提交为 `content: sync published articles YYYY-MM-DD HH:mm`。

## 尚缺的最小权限凭据

NAS 尚未安装内容同步 cron，因为缺少仅限 `leesiyou/lee`、权限为 `Contents: Read and write` 的细粒度 GitHub Token。创建后只把 Token 内容写入：

```text
/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog/secrets/github-content-token
```

文件必须为 `600`。安装脚本会先拒绝缺失或权限错误的文件，不会回退使用本机宽权限 GitHub 登录。

```sh
PROJECT_ROOT='/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog'; export PROJECT_ROOT; chmod 600 "$PROJECT_ROOT/secrets/github-content-token" && "$PROJECT_ROOT/repo/ops/nas/install-content-cron.sh"
```

Token 不得写入聊天、README、workflow、`.env`、Git remote URL 或日志。
