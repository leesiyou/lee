# 李思友的思想实验室品牌迁移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把博客站点品牌和作者身份完整迁移为“李思友的思想实验室”与“李思友”，并部署到现有公网地址。

**Architecture:** 保留 Astro、Directus、数据库结构和 URL，仅替换品牌呈现并增强 Directus 初始化器的身份迁移逻辑。生产迁移保持幂等：已有新作者时复用；只有一个旧作者时原位更新；多作者场景创建新作者并只把两个内置文章关联到新作者。

**Tech Stack:** Astro、TypeScript、Vitest、Directus REST API、Docker Compose、Caddy

---

### Task 1: 用测试锁定新品牌和身份迁移规则

**Files:**
- Modify: `scripts/directus-model.test.ts`
- Modify: `scripts/initialize-directus.test.ts`

- [ ] **Step 1: 修改默认品牌断言并增加身份迁移测试**

```ts
expect(defaultAuthor.name).toBe('李思友');
expect(defaultSiteSettings.site_name).toBe('李思友的思想实验室');
expect(selectManagedAuthorAction([{ id: 1, name: '旧作者' }], '李思友')).toEqual({
  id: 1,
  kind: 'update',
});
```

- [ ] **Step 2: 运行测试并确认旧实现失败**

Run: `npx vitest run scripts/directus-model.test.ts scripts/initialize-directus.test.ts`

Expected: FAIL，默认品牌仍是旧值且身份迁移函数尚不存在。

### Task 2: 修改前台、RSS 和 Directus 默认品牌

**Files:**
- Modify: `scripts/directus-model.ts`
- Modify: `scripts/initialize-directus.ts`
- Modify: `apps/web/src/layouts/BaseLayout.astro`
- Modify: `apps/web/src/layouts/ArticleLayout.astro`
- Modify: `apps/web/src/pages/rss.xml.ts`
- Modify: `apps/web/src/lib/wechat.ts`
- Modify: `content/first-article.json`
- Modify: `content/streetdance-decade-review.json`

- [ ] **Step 1: 实现幂等身份迁移选择器**

```ts
export function selectManagedAuthorAction(
  authors: IdentifiedItem[],
  targetName: string,
): { id?: string | number; kind: 'create' | 'update' | 'use' } {
  const target = authors.find((author) => author.name === targetName);
  if (target) return { id: target.id, kind: 'use' };
  if (authors.length === 1) return { id: authors[0].id, kind: 'update' };
  return { kind: 'create' };
}
```

- [ ] **Step 2: 初始化时更新唯一作者与站点名称**

已有目标作者则复用；只有一个作者则 PATCH 为 `defaultAuthor`；否则创建目标作者。已有 `site_settings` 时只 PATCH `site_name`，不覆盖管理员自定义的说明和页脚。两个内置文章无论新建还是已存在都 PATCH 作者关系为目标作者。

- [ ] **Step 3: 替换前台和种子内容品牌**

所有默认标题、页眉、页脚、SEO、RSS、公众号素材回退作者与两个内容文件的 `author_name` 使用新品牌。文章页优先显示 Directus 返回的真实作者名，缺失时回退为“李思友”。

- [ ] **Step 4: 运行定向测试**

Run: `npx vitest run scripts/directus-model.test.ts scripts/initialize-directus.test.ts apps/web/src/lib/wechat.test.ts`

Expected: PASS。

### Task 3: 更新视觉资源、运行脚本和有效文档

**Files:**
- Modify: `apps/web/public/favicon.svg`
- Modify: `apps/web/public/images/streetdance-decade-review-cover.svg`
- Modify: `ops/publish-h5.sh`
- Modify: `README.md`
- Modify: `00_HERMES_CODEX_通讯日志.md`
- Modify: `docs/superpowers/plans/2026-08-01-wechat-first-node-xiaobao.md`

- [ ] **Step 1: 更新图标和封面署名**

favicon 的无障碍名称改为新品牌，图形字母由 `G` 改为 `L`；旧文章封面署名改为“李思友的思想实验室”。

- [ ] **Step 2: 清除当前受版本控制文件中的旧称呼**

运行一个只读取 `git ls-files` 的 Node 扫描器，检测 Unicode 旧作者词和旧站点词；修改每一个命中项，但不修改 `.git` 历史对象和用户未跟踪目录。

- [ ] **Step 3: 更新日更发布脚本绝对路径**

把 `BLOG_ROOT` 指向迁移后的本地目录 `/Volumes/开发盘加数据 1t/2026年开发/李思友思想实验室博客系统`。

### Task 4: 完整回归、提交与生产部署

**Files:**
- No new files

- [ ] **Step 1: 运行完整验证**

Run: `npm test && npm run typecheck && npm run lint && npm run build`

Expected: 测试、类型检查、lint 和构建全部 PASS。

- [ ] **Step 2: 敏感信息与旧品牌扫描**

Run: `git diff --check`

Expected: 无空白错误；受版本控制文件扫描旧品牌和常见密钥格式均为 0 命中。

- [ ] **Step 3: 提交并推送功能分支**

```bash
git add README.md content scripts apps/web ops docs 00_HERMES_CODEX_通讯日志.md
git commit -m "feat: rebrand blog as Li Siyou thought lab"
git push origin feature/h5-blog-system
```

- [ ] **Step 4: 构建并部署新镜像**

等待 GitHub Actions 镜像构建成功后，在飞牛 NAS 使用现有部署脚本更新 web 容器，并运行 Directus 初始化器完成生产数据迁移。不得改动 PostgreSQL、Redis、SSH、飞牛后台或节点小宝现有映射。

- [ ] **Step 5: 公网验收**

验证首页、正式文章页与 RSS HTTP 200；检查页面可见文本、`<title>`、`og:site_name`、页脚、文章作者和 RSS 标题全部为新品牌；公网响应源代码旧称呼 0 命中。

- [ ] **Step 6: 最后迁移本地目录**

停止使用旧工作目录后，把仓库目录重命名为 `/Volumes/开发盘加数据 1t/2026年开发/李思友思想实验室博客系统`，随后用新路径运行一次 `git status` 与 `ops/publish-h5.sh` 的只读参数检查。
