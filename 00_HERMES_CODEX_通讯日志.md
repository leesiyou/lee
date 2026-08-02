# 00_HERMES_CODEX_通讯日志

> 本文件记录 Hermes ↔ Codex 之间的任务接力与进展。
> 禁止记录密码、Token、Cookie 或任何明文凭据。
> 位置：博客仓库根目录（Git 仓库内，注意勿将私密信息写入）。

---

## H-001｜博客接力恢复报告（Hermes → Codex）

**时间**：2026-08-02 | **执行**：Hermes（小马） | **总状态**：PASS_WITH_LIMITATIONS

### 背景

接力任务文件 `HERMES_嘎子日更博客接力任务_私密.md`（位于 Git 仓库外）要求把博客从"NAS 离线 BLOCKED"推进到真实可分享状态。本会话完成 NAS 恢复与大部分验收。

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

### 探测记录

（进行中，见后续追加）
