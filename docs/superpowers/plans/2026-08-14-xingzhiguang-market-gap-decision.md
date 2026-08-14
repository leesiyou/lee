# 星之光市场缝隙决策报告 H5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留现有公开 URL 的前提下，把星之光 H5 重做为证据分层清楚、可供李总拍板的市场缝隙决策报告，并完成博客发布和二维码交付。

**Architecture:** 继续使用现有静态 H5 目录，HTML 承载咨询报告语义，CSS 提供董事会视觉和响应式布局，原生 JavaScript 只负责导航、进度、显隐和复制。Vitest 先锁定内容、数据边界和安全要求，Astro 构建与浏览器检查负责集成验收。

**Tech Stack:** HTML5、CSS3、Vanilla JavaScript、Vitest、Astro、GitHub Actions、GHCR、飞牛 Docker、Node `qrcode`。

---

## 文件结构

- Modify `apps/web/public/h5/2026-08-13/xingzhiguang-ai-native-transformation/index.html`: 完整市场决策叙事与来源台账。
- Modify `apps/web/public/h5/2026-08-13/xingzhiguang-ai-native-transformation/css/style.css`: 董事会视觉、图表、导航、响应式和打印样式。
- Modify `apps/web/public/h5/2026-08-13/xingzhiguang-ai-native-transformation/js/main.js`: 阅读进度、章节高亮、折叠来源、复制与返回顶部。
- Modify `apps/web/public/h5/2026-08-13/xingzhiguang-ai-native-transformation/assets/ai-native-cover.svg`: 与市场缝隙报告一致的封面。
- Modify `apps/web/src/tests/xingzhiguang-ai-native.test.ts`: 报告内容、数据纠错、资产、安全和交互合同。
- Modify `content-export/2026/08/xingzhiguang-ai-native-transformation-wechat.md`: 博客卡片和微信传播文案。

### Task 1: 锁定决策报告合同

- [ ] **Step 1: 重写测试并加入失败断言**

在测试中断言 `市场缝隙决策报告`、`数据罗盘`、四个市场缝隙、四类竞争战场、六类风险、90 天验证门和 A/B/C 证据等级；同时断言不得出现错误的履约排名、未来编制日、旧 AI 标题和敏感路径。

- [ ] **Step 2: 运行定向测试确认 RED**

Run: `npm test -- --run apps/web/src/tests/xingzhiguang-ai-native.test.ts`

Expected: FAIL，指出旧页面缺少市场缝隙决策内容或仍含旧 AI 标题。

### Task 2: 实现 H5 与传播素材

- [ ] **Step 1: 重写 HTML、CSS、JavaScript 和封面**

使用语义章节、来源脚注和相对资源路径；禁止引入外部脚本、运行时 API、客户数据和未经标注的经营指标。

- [ ] **Step 2: 更新微信素材**

标题为“星之光市场缝隙决策报告”，摘要只写已核事实和建议，不把建议目标写成已完成业绩。

- [ ] **Step 3: 运行定向测试确认 GREEN**

Run: `npm test -- --run apps/web/src/tests/xingzhiguang-ai-native.test.ts`

Expected: 该文件全部通过。

### Task 3: 本地集成与视觉验收

- [ ] **Step 1: 运行项目验证**

Run: `npm test && npm run lint && npm run typecheck && npm run build`

Expected: 全部 exit 0。

- [ ] **Step 2: 浏览器验收**

本地静态服务分别用 1280×900 和 390×844 打开固定 URL，检查标题、章节导航、来源折叠、复制按钮、控制台错误和 `scrollWidth <= innerWidth`。

- [ ] **Step 3: 同步本地交接副本**

把验收后的 `index.html` 及同目录资源同步到 `/Users/myhood/Desktop/星之光T恤/h5/`，保持用户桌面资料可离线打开。

### Task 4: 提交、推送与生产发布

- [ ] **Step 1: 核对差异与敏感信息**

Run: `git diff --check && rg -n 'DIRECTUS_TOKEN|BEGIN .*PRIVATE KEY|192\\.168\\.|/Users/' apps/web/public/h5/2026-08-13/xingzhiguang-ai-native-transformation content-export/2026/08/xingzhiguang-ai-native-transformation-wechat.md`

Expected: `git diff --check` exit 0；敏感扫描无命中。

- [ ] **Step 2: 提交并推送现有功能分支**

Run: `git add ... && git commit -m "feat: rebuild Xingzhiguang market gap report" && git push origin feature/xzg-ai-native-20260813`

Expected: 远端包含新提交，不改写历史。

- [ ] **Step 3: 发布不可变镜像并部署**

复用仓库现有 GitHub Actions 与飞牛部署脚本，等待 `main-<shortsha>` 镜像发布；先备份，再把 blog poller 覆盖更新为相同 tag，验证容器、局域网和公网固定 URL。

### Task 5: 二维码与最终证据

- [ ] **Step 1: 生成桌面二维码**

使用仓库已有 `qrcode` 依赖把固定公网 URL 生成 `/Users/myhood/Desktop/星之光市场缝隙决策报告_二维码.png`，带标题和可读 URL。

- [ ] **Step 2: 反向验证**

使用系统可用二维码解码器读取 PNG，结果必须精确等于公开 URL；再检查公网 HTTP 200、正文标题和移动端无溢出。

- [ ] **Step 3: 最终核对**

逐项复读设计文档，确认四个市场缝隙、竞争应对、风险止损、AI 落地和 90 天决策门均已出现且事实等级清楚。
