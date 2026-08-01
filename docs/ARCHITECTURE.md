# 系统架构

## 运行链路

```text
节点小宝 HTTPS（待人工完成）
  ├─ blog.easybreak.top       -> 127.0.0.1:19080 -> Caddy -> Astro SSR:4321
  └─ blog-admin.easybreak.top -> 127.0.0.1:19081 -> Caddy -> Directus:8055

Astro SSR -> Directus API -> PostgreSQL
                         └-> Redis 缓存与限流
```

Directus 是内容主数据库。文章发布后由 Astro SSR 即时读取，不需要重新构建前端。GitHub 保存代码、配置、schema 和已发布文章的 Markdown 副本，不保存 PostgreSQL 数据、上传原图或明文秘密。

## 信任边界

- `postgres`、`redis`、`directus` 和 `web` 通过内部 Docker 网络通信；PostgreSQL、Redis 无宿主机端口。
- Caddy 是唯一宿主机入口，只映射 `19080` 和 `19081`。
- `blog_internal` 设置为内部网络；仅 web 与 Caddy 同时加入受控出站网络。
- 匿名 Directus 权限只能读取已发布且发布时间已到的内容。草稿预览需要服务器端预览 Token 和独立预览密钥。
- Editor 可管理文章、分类、标签和媒体，但无系统设置、用户、角色、扩展和数据库管理权限。
- 公众号草稿操作默认关闭，只允许创建待人工审核草稿，不提供自动群发。

## 固定服务版本

| 服务 | 版本/镜像 |
| --- | --- |
| Astro Web | `ghcr.io/leesiyou/lee-web:v0.1.0-rc.3`（当前 NAS 不可变版本） |
| Directus | `directus/directus:11.17.4` |
| PostgreSQL | `postgres:16.14-alpine` |
| Redis | `redis:7.4.10-alpine` |
| Caddy | `caddy:2.11.4-alpine` |

## 内容模型

模型由 `scripts/initialize-directus.ts` 幂等初始化，并由 `infra/directus/schema.yaml` 保存脱敏 snapshot。核心集合包括 `articles`、`categories`、`tags`、`authors`、`site_settings`、`template_presets` 和文章标签关系。

文章支持草稿、排期、发布、归档、富文本、结构化内容块、封面/微信封面、SEO、分类标签、推荐和四种模板。第一篇正式文章为《创业，不是投机》。

## 持久化与恢复

代码位于 `repo/`，数据库、Redis、上传、扩展、Caddy 状态和日志位于 `runtime/`，秘密位于 `secrets/`，备份位于 `backups/`。执行 `docker compose down` 不删除这些宿主机目录；实际持久化和完整恢复演练均已通过。
