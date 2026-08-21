# Startup Failure Diagnosis H5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the supplied startup-failure-diagnosis H5, add a 9:16 WeChat reading-original poster and material, and deploy the exact build to the Flyniu NAS.

**Architecture:** Keep the supplied H5 as a self-contained static experience under the existing Astro public tree. Add one contract test that checks content, network safety, public metadata and the poster, then reuse the existing GitHub Actions image build and immutable NAS poller deployment.

**Tech Stack:** Static HTML/CSS/JavaScript, Vitest, Astro, Docker Compose, GHCR, Flyniu NAS, Node Xiaobao HTTPS.

---

### Task 1: Add the release contract test

**Files:**
- Create: `apps/web/src/tests/startup-failure-diagnosis.test.ts`
- Read: `apps/web/public/h5/2026-08-07/startup-failure-diagnosis/index.html`

- [ ] **Step 1: Write the failing test**

```ts
import { access, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const root = new URL('../../public/h5/2026-08-07/startup-failure-diagnosis/', import.meta.url);
const source = (path: string) => readFile(new URL(path, root), 'utf8');

describe('startup failure diagnosis H5', () => {
  it('publishes the complete diagnosis with safe local assets', async () => {
    const [html, css, script] = await Promise.all([
      source('index.html'),
      source('css/style.css'),
      source('js/main.js'),
    ]);
    expect(html).toContain('经验不是免疫');
    expect(html).toContain('现金跑道模型');
    expect(html).toContain('经验有效性指数');
    expect(html).toContain('为什么仍然会把企业做倒');
    expect(html).toContain('https://myhooddaily.iepose.cn/h5/2026-08-07/startup-failure-diagnosis/');
    expect(html).toContain('content="assets/wechat-poster.png"');
    expect(`${html}\n${css}\n${script}`).not.toMatch(/127\.0\.0\.1|192\.168\.|DIRECTUS_TOKEN|\/Users\//);
    expect(html).not.toMatch(/<script[^>]+src="https?:\/\//);
    await access(new URL('assets/wechat-poster.png', root));
  });
});
```

- [ ] **Step 2: Run the test to verify RED**

Run: `npm test -- --run apps/web/src/tests/startup-failure-diagnosis.test.ts`

Expected: FAIL because `assets/wechat-poster.png` and its Open Graph reference do not exist.

### Task 2: Add the poster and publication material

**Files:**
- Create: `apps/web/public/h5/2026-08-07/startup-failure-diagnosis/assets/wechat-poster.png`
- Modify: `apps/web/public/h5/2026-08-07/startup-failure-diagnosis/index.html`
- Create: `content-export/2026/08/startup-failure-diagnosis-wechat.md`

- [ ] **Step 1: Generate the 9:16 poster**

Use the approved concept: dark black and cold silver business-case photocopies turn into identical office-building dominoes that collapse downward; exact headline “为什么照着成功案例复制，公司还是会倒闭？” and exact call to action “点击原文看”; no QR code, logo, watermark or extra text.

- [ ] **Step 2: Connect the poster to Open Graph**

Add this line after `og:description`:

```html
<meta property="og:image" content="assets/wechat-poster.png">
```

- [ ] **Step 3: Create the WeChat material**

Create a Markdown file containing the title, 120-character summary, three-to-five core paragraphs, one quote, the exact public H5 URL, Moments copy, poster path and a note that publication remains manually reviewed.

- [ ] **Step 4: Run the focused test to verify GREEN**

Run: `npm test -- --run apps/web/src/tests/startup-failure-diagnosis.test.ts`

Expected: one test file passes with no failures.

### Task 3: Verify and publish

**Files:**
- Commit only the new H5 directory, test, publication material, design and plan documents.
- Preserve: `apps/web/public/104-print-lab/` and `apps/web/src/pages/104-print-lab/`.

- [ ] **Step 1: Run release verification**

Run:

```bash
npm test
npm run typecheck
npm run lint
PUBLIC_BASE_URL=https://myhooddaily.iepose.cn npm run build
git diff --check
```

Expected: all tests pass, typecheck and lint exit 0, Astro build exits 0, and diff check prints nothing.

- [ ] **Step 2: Commit and push the scoped release**

```bash
git add apps/web/public/h5/2026-08-07/startup-failure-diagnosis \
  apps/web/src/tests/startup-failure-diagnosis.test.ts \
  content-export/2026/08/startup-failure-diagnosis-wechat.md \
  docs/superpowers/plans/2026-08-07-startup-failure-diagnosis.md
git commit -m "feat: publish startup failure diagnosis H5"
git push origin feature/h5-blog-system
```

- [ ] **Step 3: Build and deploy the immutable image**

Wait for GitHub CI, dispatch `publish-image.yml`, derive `SHORT_SHA="$(git rev-parse --short=7 HEAD)"`, back up NAS data, then deploy `ghcr.io/leesiyou/lee-web:main-$SHORT_SHA` using the existing `ops/nas/deploy-poller.sh`. Update only the blog poller override after a healthy deployment.

- [ ] **Step 4: Verify the public release**

Verify the H5, CSS, JavaScript and poster return HTTP 200; confirm the 9:16 poster dimensions, canonical and Open Graph URLs, mobile overflow, interactive controls, console errors, five healthy containers, exact image tag and post-poller stability. Copy the final URL to the macOS clipboard.
