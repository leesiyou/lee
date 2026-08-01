# 验收报告

验收日期：2026-08-01（Asia/Shanghai）

## 结论

核心系统：`PASS`。完整项目：`BLOCKED`。

阻塞原因只有外部权限相关项：节点小宝/公共 DNS 尚未建立公网 HTTPS；NAS 内容同步缺仓库级细粒度 Token。未用局域网结果冒充外网验收。

## 证据汇总

| 验收项 | 状态 | 证据 |
| --- | --- | --- |
| 五个博客容器 | PASS | Caddy、web、Directus、PostgreSQL、Redis 均 healthy |
| 旧服务保护 | PASS | 部署前快照已保存；未删除、修改或重启旧容器和旧映射 |
| 正式文章 | PASS | 《创业，不是投机》已发布，LAN 独立 H5 地址返回 200 |
| Directus 模型 | PASS | 7 个默认分类、4 套模板、默认作者、站点设置和文章模型已幂等初始化 |
| 匿名内容门禁 | PASS | 草稿/未来排期不可见；到期排期与已发布文章可见 |
| 编辑角色完整流程 | PASS | 新建、slug、上传、分类标签、模板、发布、更新、归档、禁止文本上传均通过 |
| 结构化编辑 | PASS | 原生 Block Editor 字段与安全 SSR 渲染已验证 |
| 微信草稿预留 | PASS_WITH_LIMITATIONS | Editor 操作可见；未配置时返回中性提示；真实公众号凭据未提供 |
| GitHub CI | PASS | 最新实现 push 与 PR 两次 CI 均成功 |
| GHCR | PASS | `v0.1.0-rc.3` linux/amd64 镜像发布成功，可匿名拉取 |
| NAS 自动部署 | PASS | 两分钟轮询、只重建 web、真实 digest 更新和坏镜像回滚均通过 |
| 内容导出 | PASS_WITH_LIMITATIONS | 已发布文章已进入 `content-backup`；NAS cron 因缺细粒度 Token 未安装 |
| 备份 | PASS | 每日/每周 cron 已安装，真实归档和 SHA256 校验通过 |
| 恢复 | PASS | 临时数据库恢复和正式完整恢复演练通过 |
| 容器持久化 | PASS | PostgreSQL 单独重启、完整 Compose down/up 后文章和上传文件 SHA256 保持一致 |
| 移动 H5 | PASS | 375×812、390×844 无横向溢出，首页和文章页截图验收通过 |
| Lighthouse（LAN HTTP） | PASS_WITH_LIMITATIONS | Performance 100、Accessibility 100、SEO 100、Best Practices 78；后者仅因 LAN HTTP/无 HTTPS |
| 公网 HTTPS/微信外网 | BLOCKED | 公共权威 DNS 与节点小宝映射尚未完成 |

本地自动化最终基线为 21 个测试文件、71 个测试。完整验证还包含 TypeScript、ESLint、Astro production build、Compose 结构/插值和 Docker image build。
