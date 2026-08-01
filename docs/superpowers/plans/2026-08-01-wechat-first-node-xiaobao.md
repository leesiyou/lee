# 微信优先节点小宝公网发布实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将“中国街舞 2015—2026：从热度到资产”作为首篇主推博客部署到飞牛，并交付可直接发微信群的节点小宝 HTTPS 地址。

**Architecture:** 保留现有 Directus/PostgreSQL/Redis 主数据与 Astro SSR；新增一条由 Directus 发布状态控制的街舞专用 H5 路由，以及仅发布文章可访问的公众号素材页。Caddy 在 `18432` 提供前台并同源代理 `/assets/*`，Directus 仅在局域网 `18055` 开放；节点小宝只新增前台 HTTPS 映射。

**Tech Stack:** Astro 7、TypeScript、Directus 11、PostgreSQL 16、Redis 7、Caddy 2、Docker Compose、Vitest、节点小宝。

---

### Task 1: 固定新端口和同源 URL 契约

**Files:**
- Modify: `apps/web/src/lib/routes.test.ts`
- Modify: `apps/web/src/lib/routes.ts`
- Modify: `scripts/validate-compose.test.ts`
- Modify: `infra/compose.yaml`
- Modify: `infra/Caddyfile`
- Modify: `infra/env.example`

- [ ] **Step 1: 写失败测试**

将路由断言改为 `buildAssetUrl('file-id', config) === 'https://blog.example.com/assets/file-id'`；Compose 断言改为 `['18432:8080', '18055:8081']`；Caddy 断言必须包含 `/assets/*` 到 `directus:8055` 的代理。

- [ ] **Step 2: 运行测试并确认红灯**

Run: `npm test -- apps/web/src/lib/routes.test.ts scripts/validate-compose.test.ts`

Expected: FAIL，分别显示旧 Directus 资产地址、旧 `19080/19081` 端口和缺少资产代理。

- [ ] **Step 3: 最小实现**

将 `buildAssetUrl` 的基址改为 `config.publicBaseUrl`；Compose 只改宿主机端口；Caddy 前台加入：

```caddy
@directus_assets path /assets/*
reverse_proxy @directus_assets directus:8055
```

环境示例统一为：

```dotenv
DIRECTUS_PUBLIC_URL=http://192.168.5.104:18055
PUBLIC_BASE_URL=http://192.168.5.104:18432
PUBLIC_ADMIN_URL=http://192.168.5.104:18055
CORS_ORIGIN=http://192.168.5.104:18432,http://192.168.5.104:18055
```

- [ ] **Step 4: 运行定向测试**

Run: `npm test -- apps/web/src/lib/routes.test.ts scripts/validate-compose.test.ts && npm run check:compose`

Expected: PASS，且输出 `compose-structure: ok`。

- [ ] **Step 5: 提交**

```bash
git add apps/web/src/lib/routes.ts apps/web/src/lib/routes.test.ts scripts/validate-compose.test.ts infra/compose.yaml infra/Caddyfile infra/env.example
git commit -m "feat: move blog to WeChat-first ports"
```

### Task 2: 完成公众号素材数据与公开素材页

**Files:**
- Modify: `apps/web/src/lib/content.test.ts`
- Modify: `apps/web/src/lib/content.ts`
- Modify: `apps/web/src/lib/routes.test.ts`
- Modify: `apps/web/src/lib/routes.ts`
- Create: `apps/web/src/pages/wechat/material/[slug].astro`
- Create: `apps/web/public/scripts/wechat-material.js`
- Modify: `apps/web/src/styles/global.css`
- Create: `apps/web/src/pages/wechat/material/material-page.test.ts`

- [ ] **Step 1: 写失败测试**

断言素材优先使用 `wechat_content` 提取 3—5 段、无引用时以摘要作为金句，并从 `PUBLIC_BASE_URL` 生成：

```ts
expect(buildWechatMaterialUrl('demo', config)).toBe(
  'https://blog.example.com/wechat/material/demo',
);
```

静态页面测试断言 `noindex`、复制按钮、封面下载、二维码下载、朋友圈文案以及外部同源脚本存在。

- [ ] **Step 2: 运行测试并确认红灯**

Run: `npm test -- apps/web/src/lib/content.test.ts apps/web/src/lib/routes.test.ts apps/web/src/pages/wechat/material/material-page.test.ts`

Expected: FAIL，素材页与新 URL helper 尚不存在。

- [ ] **Step 3: 最小实现**

`buildWechatMaterial` 使用：

```ts
const sourceContent = article.wechat_content?.trim() || article.content;
const quote = extractedQuote || article.summary;
```

新增已发布文章素材页；请求开始时设置：

```ts
Astro.response.headers.set('Cache-Control', 'private, no-store');
Astro.response.headers.set('X-Robots-Tag', 'noindex, nofollow');
```

页面通过 `fetchPublishedArticle` 门禁，展示标题、摘要、同源封面、3—5 段精华、金句、阅读原文、朋友圈文案和 QR Data URL。复制脚本优先 `navigator.clipboard.writeText`，失败时选择对应文本并提示手工复制。

- [ ] **Step 4: 运行定向测试与构建**

Run: `npm test -- apps/web/src/lib/content.test.ts apps/web/src/lib/routes.test.ts apps/web/src/pages/wechat/material/material-page.test.ts && npm run typecheck && npm run build`

Expected: PASS，Astro 产物包含 `/wechat/material/[slug]`。

- [ ] **Step 5: 提交**

```bash
git add apps/web/src/lib apps/web/src/pages/wechat apps/web/public/scripts/wechat-material.js apps/web/src/styles/global.css
git commit -m "feat: add public WeChat material pages"
```

### Task 3: 迁入街舞十年复盘专用 H5

**Files:**
- Create: `apps/web/src/content/china-street-dance-decade-review.html`
- Create: `apps/web/src/pages/posts/china-street-dance-decade-review.ts`
- Create: `apps/web/public/scripts/streetdance-review.js`
- Create: `apps/web/public/images/streetdance-decade-review-cover.svg`
- Create: `apps/web/public/images/streetdance-decade-review-cover.png`
- Create: `apps/web/src/pages/posts/streetdance-review.test.ts`

- [ ] **Step 1: 写失败测试**

测试断言专用路由先调用 `fetchPublishedArticle`，源文档包含 12 个模块、5 位专家、证据分级和正式标题，不包含 `/Users/`、`127.0.0.1`、`4173`、“双击打开”或内部专家工作区路径；脚本必须是 `/scripts/streetdance-review.js` 外链。

- [ ] **Step 2: 运行测试并确认红灯**

Run: `npm test -- apps/web/src/pages/posts/streetdance-review.test.ts`

Expected: FAIL，专用路由与公开文档尚不存在。

- [ ] **Step 3: 机械导入可信源并净化公开内容**

导入用户已验收的静态 H5：

```bash
cp '/Users/myhood/Desktop/2026街舞文化产业_AI辩论赛/30_H5_十年复盘/docs/Grok汇总版.html' \
  'apps/web/src/content/china-street-dance-decade-review.html'
```

把标题改为“中国街舞 2015—2026：从热度到资产”，添加 `__CANONICAL_URL__`、`__COVER_URL__` 元数据占位符，删除本机启动说明和内部文件路径，外置专家切换、复制链接和返回顶部交互。

- [ ] **Step 4: 实现 Directus 发布门禁路由**

专用端点逻辑：

```ts
const article = await fetchPublishedArticle({ apiUrl: config.directusInternalUrl, slug });
if (!article) return new Response('文章不存在或尚未发布', { status: 404 });
const html = reviewDocument
  .replaceAll('__CANONICAL_URL__', buildPostUrl(slug, config))
  .replaceAll('__COVER_URL__', `${config.publicBaseUrl}/images/streetdance-decade-review-cover.png`);
return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
```

通过 SVG 源生成 1200×630 PNG：

```bash
node --input-type=module -e "import sharp from 'sharp'; await sharp('apps/web/public/images/streetdance-decade-review-cover.svg').png().toFile('apps/web/public/images/streetdance-decade-review-cover.png')"
```

- [ ] **Step 5: 运行定向测试、类型检查和构建**

Run: `npm test -- apps/web/src/pages/posts/streetdance-review.test.ts apps/web/src/lib/security-assets.test.ts && npm run typecheck && npm run build`

Expected: PASS，构建产物包含专用 H5 路由，严格 CSP 下无内联脚本。

- [ ] **Step 6: 提交**

```bash
git add apps/web/src/content apps/web/src/pages/posts apps/web/public/scripts/streetdance-review.js apps/web/public/images
git commit -m "feat: publish street dance decade review H5"
```

### Task 4: 将街舞文章设为 Directus 首篇主推内容

**Files:**
- Create: `content/streetdance-decade-review.json`
- Modify: `scripts/directus-model.test.ts`
- Modify: `scripts/initialize-directus.ts`
- Modify: `scripts/initialize-directus.test.ts`

- [ ] **Step 1: 写失败测试**

断言新数据为：

```ts
expect(article).toMatchObject({
  status: 'published',
  title: '中国街舞 2015—2026：从热度到资产',
  slug: 'china-street-dance-decade-review',
  template: 'retrospective',
  featured: true,
  category_slug: 'street-dance-culture',
});
```

并断言初始化器会幂等处理 `first-article.json` 和 `streetdance-decade-review.json`，不删除旧文章。

- [ ] **Step 2: 运行测试并确认红灯**

Run: `npm test -- scripts/directus-model.test.ts scripts/initialize-directus.test.ts`

Expected: FAIL，新文章数据不存在。

- [ ] **Step 3: 最小实现**

新 JSON 包含正式标题、slug、摘要、5 段 `wechat_content`、SEO、`published_at` 晚于旧文章、`sort: 100`、街舞分类和嘎子作者。初始化器遍历两个固定文件名并用现有 `ensureSeedItem` 按 slug 幂等创建。

- [ ] **Step 4: 运行测试**

Run: `npm test -- scripts/directus-model.test.ts scripts/initialize-directus.test.ts`

Expected: PASS，旧文章与新文章均存在于种子契约。

- [ ] **Step 5: 提交**

```bash
git add content/streetdance-decade-review.json scripts/directus-model.test.ts scripts/initialize-directus.ts scripts/initialize-directus.test.ts
git commit -m "feat: seed street dance review as lead article"
```

### Task 5: 把 Directus 操作改为“生成公众号素材”

**Files:**
- Modify: `apps/web/src/lib/wechat.test.ts`
- Modify: `apps/web/src/pages/api/wechat/draft.ts`
- Modify: `infra/directus/extensions/gazi-wechat-draft/src/app.js`
- Modify: `infra/directus/extensions/gazi-wechat-draft/src/api.js`
- Modify: `scripts/initialize-directus.ts`
- Modify: `scripts/initialize-directus.test.ts`

- [ ] **Step 1: 写失败测试**

断言未配置 AppID/AppSecret 时授权请求返回 HTTP 200：

```json
{
  "status": "material_ready",
  "message": "当前已生成公众号发布素材。自动写入公众号草稿箱功能尚未配置，不影响博客发布。"
}
```

断言 Directus 流程和操作统一命名“生成公众号素材”，确认说明不得声称自动群发。

- [ ] **Step 2: 运行测试并确认红灯**

Run: `npm test -- apps/web/src/lib/wechat.test.ts scripts/initialize-directus.test.ts`

Expected: FAIL，现有接口返回 503 且名称仍是“公众号草稿”。

- [ ] **Step 3: 最小实现并构建扩展**

禁用分支返回 `material_ready`；启用且凭据完整时保留现有草稿 API。扩展先返回素材成功消息，只有 `draft_created` 才显示草稿创建成功。

Run: `npm run build --prefix infra/directus/extensions/gazi-wechat-draft`

Expected: `dist/app.js`、`dist/api.js` 更新。

- [ ] **Step 4: 运行测试**

Run: `npm test -- apps/web/src/lib/wechat.test.ts scripts/initialize-directus.test.ts && npm run typecheck`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/web/src/pages/api/wechat/draft.ts infra/directus/extensions/gazi-wechat-draft scripts/initialize-directus.ts scripts/initialize-directus.test.ts
git commit -m "feat: generate WeChat material without draft credentials"
```

### Task 6: 同步运维脚本与文档契约

**Files:**
- Modify: `ops/nas/prepare-runtime.sh`
- Modify: `ops/nas/deploy-poller.sh`
- Modify: `scripts/restore.sh`
- Modify: `scripts/sync-content-backup.sh`
- Modify: `ops/nas/*.test.ts`
- Modify: `scripts/content-sync.test.ts`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DEPLOYMENT.md`
- Modify: `docs/NODE_XIAOBAO.md`
- Modify: `docs/OPERATIONS.md`
- Modify: `docs/SECURITY.md`
- Modify: `README.md`

- [ ] **Step 1: 写失败测试**

运维脚本测试断言健康检查使用 `18432/18055`，环境模板不得包含 `easybreak.top`、`19080` 或 `19081`；节点小宝文档只允许一条前台映射。

- [ ] **Step 2: 运行测试并确认红灯**

Run: `npm test -- ops/nas scripts/content-sync.test.ts`

Expected: FAIL，定位所有旧端口和独立域名。

- [ ] **Step 3: 最小替换并说明真实边界**

将脚本和操作文档统一到前台 `18432`、后台 `18055`；文档明确公众号菜单固定指向 `PUBLIC_BASE_URL`，博客发布不会自动群发，公网地址必须以节点小宝真实结果为准。

- [ ] **Step 4: 定向回归**

Run: `npm test -- ops/nas scripts/content-sync.test.ts && rg -n 'easybreak\.top|19080|19081' README.md docs/ARCHITECTURE.md docs/DEPLOYMENT.md docs/NODE_XIAOBAO.md docs/OPERATIONS.md docs/SECURITY.md infra/env.example ops/nas scripts/restore.sh scripts/sync-content-backup.sh`

Expected: 测试 PASS；搜索只允许历史验收/迁移说明中的显式旧值。

- [ ] **Step 5: 提交**

```bash
git add ops/nas scripts/restore.sh scripts/sync-content-backup.sh scripts/content-sync.test.ts README.md docs
git commit -m "docs: align operations with Node Xiaobao entry"
```

### Task 7: 全量验证、构建和推送不可变镜像

**Files:**
- Modify: `docs/DEPLOYMENT_REPORT.md`

- [ ] **Step 1: 全量本地验证**

Run: `npm test && npm run lint && npm run typecheck && npm run build && npm run check:compose`

Expected: 全部 PASS，无跳过测试。

- [ ] **Step 2: 敏感信息与差异检查**

Run: `git diff --check && git status --short && git grep -n -E '(ghp_|github_pat_|BEGIN (RSA|OPENSSH) PRIVATE KEY|AppSecret=|POSTGRES_PASSWORD=.+)' -- ':!package-lock.json'`

Expected: `git diff --check` 无输出；敏感扫描无真实密钥。

- [ ] **Step 3: 推送分支并触发 GitHub Actions**

```bash
git push origin feature/h5-blog-system
```

等待 Actions 构建出以新 commit SHA 标记的 `ghcr.io/leesiyou/lee-web` 镜像；不合并 PR。

### Task 8: 备份并部署飞牛

**Files:**
- Remote modify: `/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog/repo`
- Remote modify: `/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog/secrets/.env`
- Remote create: `/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog/backups/pre-node-xiaobao-<timestamp>`

- [ ] **Step 1: 备份当前数据库、上传文件、Compose、Caddy、环境变量和节点小宝原配置**

Run: 使用现有 `scripts/backup.sh`，另将配置复制到带时间戳且权限 `700` 的备份目录；节点小宝仅备份，不打印凭据或设备 ID。

Expected: dump 非空、文件清单和 SHA256 生成，当前五容器继续健康。

- [ ] **Step 2: 拉取新分支并更新真实环境变量**

将 NAS `.env` 改为 LAN 验收值 `18432/18055`，设置新不可变 `WEB_IMAGE`，执行初始化器幂等创建街舞文章和更新素材操作。

- [ ] **Step 3: 只重建 web、Directus 和 Caddy**

Run: `docker compose up -d --no-deps directus web caddy`

Expected: PostgreSQL/Redis 容器 ID 不变，五容器 healthy；`18432` 与 `18055` 返回 200，`19080/19081` 不再监听。

- [ ] **Step 4: LAN 验收**

检查首页最新文章、专用 H5、素材页/API、RSS、sitemap、同源图片、404/503、安全头、无内网地址/Token 泄漏、容器重启恢复和备份恢复演练。

### Task 9: 节点小宝新增 HTTPS 映射并交付

**Files:**
- Modify: `docs/DEPLOYMENT_REPORT.md`
- Modify: `docs/ACCEPTANCE_REPORT.md`
- Modify: `docs/BLOCKERS.md`

- [ ] **Step 1: 登录飞牛节点小宝并盘点现有规则**

只读取现有规则并截图/记录；不删除、不改名、不覆盖。若界面要求重新认证，使用已保存的本机凭据；只有设备所有者验证码才允许暂停。

- [ ] **Step 2: 新增一条博客前台 HTTPS 规则**

目标固定为飞牛 `127.0.0.1:18432`；不映射 `18055`、数据库、Redis、SSH、Docker 或飞牛后台。记录节点小宝真实生成的 HTTPS 地址，禁止伪造。

- [ ] **Step 3: 将真实地址写入 NAS `PUBLIC_BASE_URL` 并重建 web**

保持 `PUBLIC_ADMIN_URL` 与 `DIRECTUS_PUBLIC_URL` 为 `http://192.168.5.104:18055`，公网 HTML 资产统一走同源 `/assets/*`。

- [ ] **Step 4: 公网和微信条件验收**

从非局域网出口检查首页、正式文章、素材页、二维码、图片、互动、复制提示、安全区域、无横向滚动、HTTPS 证书、无飞牛登录跳转、无内网/Token/数据库泄漏。重启 Caddy/web 和飞牛后分别验证映射恢复。

- [ ] **Step 5: 更新报告、提交并推送**

报告写入真实公网地址、端口、容器状态、备份/恢复、Actions、Commit SHA、PR、正式文章地址、公众号菜单地址与剩余限制。

```bash
git add docs/DEPLOYMENT_REPORT.md docs/ACCEPTANCE_REPORT.md docs/BLOCKERS.md
git commit -m "docs: record WeChat-first production acceptance"
git push origin feature/h5-blog-system
```
