# H5 Direct Blog Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish an H5 item as a normal Directus article card whose links open the H5 directly.

**Architecture:** Add an optional `h5_path` article field and centralize safe article-link selection in one helper. Existing articles continue to use `/posts/<slug>`; H5 articles use a validated same-origin `/h5/.../` path, and the generic post route redirects legacy links to that path.

**Tech Stack:** Astro, TypeScript, Vitest, Directus REST API, Docker Compose

---

### Task 1: Safe H5 article links

**Files:**
- Create: `apps/web/src/lib/article-link.ts`
- Create: `apps/web/src/tests/h5-article-link.test.ts`
- Modify: `apps/web/src/lib/types.ts`
- Modify: `scripts/directus-model.ts`
- Modify: `apps/web/src/components/ArticleCard.astro`
- Modify: `apps/web/src/pages/posts/[slug].astro`

- [ ] **Step 1: Write the failing link tests**

Test normal articles, a valid `/h5/2026-08-07/startup-failure-diagnosis/` path, and rejection of external URLs, double slashes and path traversal.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- apps/web/src/tests/h5-article-link.test.ts`

Expected: FAIL because `article-link.ts` does not exist.

- [ ] **Step 3: Implement the minimal helper and data field**

```ts
const safeH5Path = /^\/h5\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)+$/;

export function articleHref(article: Pick<Article, 'h5_path' | 'slug'>): string {
  const path = article.h5_path?.trim();
  return path && safeH5Path.test(path) ? path : `/posts/${article.slug}`;
}
```

Add nullable `h5_path` to the article type and Directus model, use `articleHref()` for all card links, and redirect the generic post route when the helper returns an H5 path.

- [ ] **Step 4: Verify GREEN and regression**

Run:

```bash
npm test -- apps/web/src/tests/h5-article-link.test.ts
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/article-link.ts apps/web/src/tests/h5-article-link.test.ts apps/web/src/lib/types.ts scripts/directus-model.ts apps/web/src/components/ArticleCard.astro apps/web/src/pages/posts/'[slug]'.astro
git commit -m "feat: link H5 articles directly from blog"
```

### Task 2: Production article publication

**Files:**
- Use existing poster: `apps/web/public/h5/2026-08-07/startup-failure-diagnosis/assets/wechat-poster.png`
- No plaintext credential files are created.

- [ ] **Step 1: Push and build the exact commit**

Push `feature/startup-failure-20260807`, wait for CI, dispatch `publish-image.yml`, and verify image `ghcr.io/leesiyou/lee-web:main-<short-sha>` exists.

- [ ] **Step 2: Back up and deploy the web image**

Run the existing NAS daily backup and `ops/nas/deploy-poller.sh` with the exact image tag. Update the existing deploy-poller cron tag only after a successful health check.

- [ ] **Step 3: Add the Directus field idempotently**

Use the NAS-protected `.env` admin credentials to query `/fields/articles/h5_path`. Create the nullable string field only if it is absent.

- [ ] **Step 4: Upload the cover and upsert the article**

Reuse an existing file whose `filename_download` is `startup-failure-diagnosis-wechat-poster.png`; otherwise upload the existing poster. Upsert the article by slug `startup-failure-diagnosis` with `status=published`, `h5_path=/h5/2026-08-07/startup-failure-diagnosis/`, author `李思友`, category `startup-business`, and the approved title and summary.

- [ ] **Step 5: Verify public behavior**

Verify:

```text
GET / -> 200 and contains the article title
homepage card href -> /h5/2026-08-07/startup-failure-diagnosis/
GET /posts/startup-failure-diagnosis -> 302 to the H5 path
GET /h5/2026-08-07/startup-failure-diagnosis/ -> 200
all five containers -> healthy
```

- [ ] **Step 6: Copy the blog URL**

Copy `https://myhooddaily.iepose.cn/` to the macOS clipboard and report the final article/H5 URLs.
