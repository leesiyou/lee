# H5 日更博客系统设计

## 目标与边界

本项目在 `leesiyou/lee` 建设一个可长期日更的正式博客：Directus 是内容主库和编辑后台，Astro Node SSR 在请求时读取 Directus，PostgreSQL 保存结构化内容，Redis 提供缓存，Caddy 提供两个独立 HTTP 入口。代码通过 GitHub PR 管理，飞牛通过 GHCR 镜像摘要主动拉取前端更新。数据库、上传和密钥不进入 Git。

用户提供的总任务已经明确指定技术栈和执行授权，因此本设计不再重新选择框架。被明确排除的方案是 WordPress、发布时全站重编译的纯静态 Astro、在飞牛安装高权限 GitHub self-hosted runner，以及让 GitHub 直接 SSH 进入 NAS。

## 部署拓扑

- 公网前台：`https://blog.easybreak.top`。当前公共 DoH 返回 NXDOMAIN。
- 公网后台：`https://blog-admin.easybreak.top`。当前公共 DoH 返回 NXDOMAIN。
- 局域网前台：`http://192.168.5.104:19080`。
- 局域网后台：`http://192.168.5.104:19081`。
- Caddy 容器监听 `8080` 和 `8081`，宿主机仅映射 `19080:8080`、`19081:8081`。
- Astro、Directus、PostgreSQL 和 Redis 只存在于 `blog_internal` Docker 网络；PostgreSQL、Redis、Directus、Astro 均不直接映射宿主机端口。
- 节点小宝只新增两个 HTTPS 域名到上述 Caddy 入口，不公开 SSH、Docker、PostgreSQL 或 Redis。

## 持久化与目录

飞牛的 Docker 根目录已位于 `/vol6`，该卷剩余约 1.1 TiB。项目采用以下稳定路径：

```text
/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog/
├── repo/
├── deploy/
├── secrets/
└── runtime/
    ├── postgres/
    ├── redis/
    ├── directus-uploads/
    ├── directus-extensions/
    ├── backups/
    └── logs/
```

`repo` 可以重建；`runtime` 和 `secrets` 不能随代码部署删除。`.env` 和 token 文件权限为 `600`。容器使用 bind mount，便于直接核对备份、权限和恢复结果。

## 版本基线

- Astro `7.1.6`、`@astrojs/node` `11.0.3`
- Node `22.23.2-alpine`
- Directus `12.2.0`
- PostgreSQL `16.14-alpine`
- Redis `7.4.10-alpine`
- Caddy `2.11.4-alpine`

生产镜像使用精确版本；`latest` 只作为 GHCR 的移动发布标签，不作为 Compose 中第三方服务的唯一版本。

## 内容模型与发布规则

Directus 管理 `articles`、`categories`、`tags`、`authors`、`site_settings` 和 `template_presets`。初始化过程通过管理 API 幂等创建集合、字段、关系、角色、权限和默认数据，然后导出 `infra/directus/schema.yaml`。

前台只显示同时满足 `status = published` 和 `published_at <= now` 的文章。定时发布依靠查询条件自然生效，不依赖重新构建或计划任务。草稿预览使用独立只读预览 token 和 `PREVIEW_SECRET`，两者只保存在服务器环境文件中。公开请求不携带管理员 token。

文章 HTML 在 SSR 输出前通过白名单清理。模板字段只接受 `philosophy`、`business`、`diary`、`retrospective`，分别映射哲学思辨、商业拆解、创业日记和项目复盘组件布局。

## 请求与失败流

1. 编辑在 Directus 创建或更新文章和媒体。
2. Astro 每次请求 Directus 公开 API，立即看到符合发布时间规则的新内容。
3. Directus 不可用时，前台返回友好降级页和 503，不泄露堆栈。
4. Caddy 为前台、后台、上传和 API 设置安全头、压缩、缓存与请求体限制。
5. deploy-poller 每两分钟检查 `ghcr.io/leesiyou/lee-web:latest` 摘要，只更新 web；健康检查失败则回滚上一镜像引用。
6. 内容导出失败只记录日志，不影响博客；备份失败返回非零并保留已有备份。

## GitHub 与发布

空仓库先建立最小 `main` 基线，所有产品改动位于 `feature/h5-blog-system`，通过 Draft PR 进入 `main`。CI 在 PR 上执行类型检查、lint、单测、Astro build、Compose 校验和 Docker build。镜像工作流在 `main`、版本 tag 和手动触发时发布 GHCR，并带 OCI source/revision/created 标签。

内容导出进入独立 `content-backup` 分支。NAS 使用两个最小权限 token：一个只读 GHCR，另一个仅对本仓库 Contents Read/Write。未取得 token 时，博客运行、备份和局域网验收不应被阻断。

## 备份与恢复

每日备份 PostgreSQL，保留 7 份；每周备份 PostgreSQL、uploads、schema、Compose、Caddy 和镜像清单，保留 4 份。每个备份生成 SHA-256。恢复必须明确指定备份，先制作恢复前快照，再暂停写入服务、恢复数据库和 uploads、重启并执行健康检查。恢复失败不得默认清空数据。

## 验收门

验收分为五层：单元测试与构建、Docker 内部健康、完整内容生命周期、重启/回滚/恢复、节点小宝外网 HTTPS 与移动端。任何一层缺少真实证据，最终状态必须标为 `FAIL`、`BLOCKED` 或 `PASS_WITH_LIMITATIONS`，不得以本地构建代替发布结论。
