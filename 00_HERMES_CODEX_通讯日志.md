# 00_HERMES_CODEX_通讯日志

> 本文件记录 Hermes ↔ Codex 之间的任务接力与进展。
> 禁止记录密码、Token、Cookie 或任何明文凭据。
> 位置：博客仓库根目录（Git 仓库内，注意勿将私密信息写入）。

---

## H-001｜博客接力恢复报告（Hermes → Codex）

**时间**：2026-08-02 | **执行**：Hermes（小马） | **总状态**：PASS_WITH_LIMITATIONS

### 背景

接力任务文件 `HERMES_李思友日更博客接力任务_私密.md`（位于 Git 仓库外）要求把博客从"NAS 离线 BLOCKED"推进到真实可分享状态。本会话完成 NAS 恢复与大部分验收。

### 已完成

| # | 任务 | 结果 |
|---|---|---|
| 1 | NAS 恢复在线 | PASS（ping/SSH 通） |
| 2 | 5 容器 healthy | PASS（Caddy/web/Directus/PG/Redis） |
| 3 | Directus 幂等初始化 | PASS（0 重复创建，公网 URL 已写入） |
| 4 | 公网 HTTPS | PASS（首页/文章页/素材API/RSS 均 HTTP 200） |
| 5 | 证书 | PASS（Xcc Trust DV SSL，至 2026-10-30） |
| 6 | 内网地址泄漏修复 | PASS（首页"写文章"链接暴露 192.168.5.104 已修复，公网 0 泄漏） |
| 7 | 代码质量 | PASS（83 测试全过，typecheck 0 error，build 通过） |
| 8 | GitHub | PASS（8188ff9 + 64439c1 已 push，CI 全绿） |
| 9 | 新镜像部署 | PASS（lee-web:main-8188ff9 已部署） |
| 10 | 备份验收 | PASS（blog-weekly-20260802-181545.tar.gz + SHA256 OK） |
| 11 | 内容同步 | PASS（Directus 与 content-backup 一致） |
| 12 | NAS 脚本权限 | PASS（重启后丢失的 755 已修复） |
| 13 | 文章地址复制剪贴板 | PASS |
| 14 | 过期文档更新 | PASS（BLOCKED → PASS_WITH_LIMITATIONS） |

### 遗留问题（H-002 处理）

1. **素材页公网 404**：`/wechat/material/china-street-dance-decade-review` 404，但素材 API 200、文章页 200、Directus 数据正常。疑似 8188ff9 部署后回归（部署前测过 200）。
2. **sitemap.xml 公网 404**：节点小宝 openresty 层拦截，博客 Caddy/web 正常 200。
3. **NAS 内容定时推送**：缺 GitHub 细粒度 Token，content-sync cron 未安装。
4. **公众号草稿 API**：AppID/AppSecret 未配置，非阻塞。

### 已排除原因（H-001 阶段）

- Directus 匿名 API 完整模拟请求（含 published_at 过滤）→ 200 有数据
- web 容器内模拟 Directus 请求（directus:8055）→ 200
- 素材页路由源码无异常；文章页同函数 200
- 首页/文章页/API 均 200，仅素材页 404

---

## H-002｜素材页 404 根因修复（in progress）

**任务令**：只处理素材页，不处理其他需求。分层探测 → 对比构建产物 → 失败测试 → 最小修复 → 验证 → 部署提交。

### 分层探测结果（2026-08-02 19:2x）

| 层 | 素材页 | 素材 API | 结论 |
|---|---|---|---|
| L1 web 容器 4321 | 404 | 200 | 404 产生于 Astro SSR 内部 |
| L2 Caddy 18432 | 404 | — | 透传，非 Caddy 问题 |
| L3 节点小宝公网 | 404 | 200 | 透传，非节点小宝问题 |
| L4 素材 API | — | 200 | 同函数不同结果 |

**关键异常**：`/api/wechat/material/[slug]` 200 但 `/wechat/material/[slug]` 404，同一 `fetchPublishedArticle` 函数。entry.mjs 中两条路由均注册。

### 根因确认（ROOT CAUSE）

容器实际运行镜像为 `ghcr.io/leesiyou/lee-web:latest` = **b7a2fbc**（2026-08-01 15:52 构建的旧镜像），**不是**手动部署的 `main-8188ff9`。

**机制**：NAS deploy-poller 每 2 分钟拉 `:latest`，检测到 digest 变化后重建 web 容器，把手动部署的 8188ff9 覆盖回滚到 latest（b7a2fbc）。该旧镜像素材页渲染 404（当时功能未就绪），且 `latest` 标签只随 main 更新，feature 分支修复永远被覆盖。

**决定性验证**：手动 `WEB_IMAGE=main-8188ff9` 重建 web 后素材页 **200**；poller 手动运行（带 override）后仍保持 200，日志 `deploy=PASS changed=no`。

### 最小修复

修改 NAS deploy-poller cron，加入 `DEPLOY_POLLER_IMAGE_OVERRIDE="ghcr.io/leesiyou/lee-web:main-8188ff9"`，让 poller 跟踪 feature 分支镜像而非 latest。crontab 已更新。

### 新增失败测试（防回归）

`apps/web/src/tests/wechat-material-page.test.ts` 新增：读取 `dist/server/entry.mjs`，断言 `/wechat/material/[slug]` 页面路由与 `/api/wechat/material/[slug]` endpoint 路由真实注册（含 component 路径）。该测试能抓住"路由从构建清单消失"的运行时回归。

### 验证结果

- 素材页公网 200 ✅
- 素材 API 公网 200 ✅
- 首页 200 ✅
- 文章页 200 ✅
- 首页源码 0 处 192.168.5.104 泄漏 ✅
- 84 测试通过（含新增）✅ typecheck 0 ✅ lint 通过 ✅ build 通过 ✅

### 提交

- 709061d：新增测试 + 通讯日志（已 push，CI queued）
- 部署镜像：`ghcr.io/leesiyou/lee-web:main-8188ff9`（NAS 当前运行，poller 已锁定该镜像）

### REMAINING

- CI 完成确认（709061d）
- 节点小宝层 `/sitemap.xml` 404（另一任务，未处理）
- NAS 内容同步 Token（另一任务，未处理）
- 公众号草稿凭据（非阻塞）
