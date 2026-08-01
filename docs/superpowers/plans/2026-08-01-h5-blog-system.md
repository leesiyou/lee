# H5 Blog System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, deploy, and verify a Directus-backed Astro H5 blog on the existing Feiniu NAS without changing existing services.

**Architecture:** Astro Node SSR reads Directus through an internal Docker network; Directus persists to PostgreSQL and uses Redis; Caddy exposes only two HTTP entry ports. GitHub Actions builds the web image, while NAS polling, backup, restore, content export, and rollback scripts operate independently and fail closed.

**Tech Stack:** Astro 7.1.6, TypeScript, Vitest, Directus 12.2.0, PostgreSQL 16.14, Redis 7.4.10, Caddy 2.11.4, Docker Compose, GitHub Actions

---

### Task 1: Repository foundation and quality gates

**Files:**
- Create: `package.json`, `package-lock.json`, `.gitignore`, `LICENSE`, `README.md`
- Create: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/astro.config.mjs`
- Create: `apps/web/vitest.config.ts`, `apps/web/eslint.config.mjs`

- [ ] Create npm workspaces with scripts `test`, `typecheck`, `lint`, `build`, `check:compose` and pin the approved versions.
- [ ] Install dependencies with `npm install` and commit the lockfile.
- [ ] Run `npm test`; expected result is a valid empty suite before behavior tests are added.
- [ ] Commit with `chore: scaffold blog workspace`.

### Task 2: Published-content query contract

**Files:**
- Create: `apps/web/src/lib/types.ts`
- Create: `apps/web/src/lib/directus.ts`
- Test: `apps/web/src/lib/directus.test.ts`

- [ ] Write a failing Vitest test asserting that the article filter contains `status=published`, excludes future `published_at`, sorts descending, and never sends an admin token.
- [ ] Run `npm test -- apps/web/src/lib/directus.test.ts`; expected failure is a missing `buildPublishedArticlesUrl` export.
- [ ] Implement URL construction, API error normalization, public fetch, single article, category, tag, archive, search, adjacent article, and related article queries.
- [ ] Run the focused test and full test suite; expected result is zero failures.
- [ ] Commit with `feat: add Directus content queries`.

### Task 3: Sanitized H5 rendering and template system

**Files:**
- Create: `apps/web/src/lib/content.ts`, `apps/web/src/lib/templates.ts`
- Create: `apps/web/src/components/*.astro`
- Test: `apps/web/src/lib/content.test.ts`, `apps/web/src/lib/templates.test.ts`

- [ ] Write failing tests proving unsafe scripts and event attributes are removed, allowed semantic content remains, and exactly four template identifiers resolve.
- [ ] Run focused tests and confirm expected missing-export failures.
- [ ] Implement sanitize-html allowlists, reading time, excerpt, table of contents, WeChat material generation, and template registry.
- [ ] Implement `Hero`, `Statement`, `Quote`, `DimensionCompare`, `Timeline`, `DataCard`, `TruthCard`, `CaseStudy`, `ActionList`, `Quiz`, `Conclusion`, and `ShareCard` as focused Astro components.
- [ ] Re-run tests and commit with `feat: add safe H5 content templates`.

### Task 4: Astro pages and mobile UI

**Files:**
- Create: `apps/web/src/layouts/BaseLayout.astro`, `apps/web/src/layouts/ArticleLayout.astro`
- Create: `apps/web/src/pages/index.astro`, `apps/web/src/pages/posts/[slug].astro`
- Create: `apps/web/src/pages/category/[slug].astro`, `apps/web/src/pages/tag/[slug].astro`
- Create: `apps/web/src/pages/search.astro`, `apps/web/src/pages/archive.astro`
- Create: `apps/web/src/pages/rss.xml.ts`, `apps/web/src/pages/sitemap.xml.ts`
- Create: `apps/web/src/pages/health.ts`, `apps/web/src/pages/404.astro`
- Create: `apps/web/src/styles/global.css`
- Test: `apps/web/src/pages/health.test.ts`, `apps/web/src/lib/routes.test.ts`

- [ ] Write failing tests for `{status:"ok"}`, canonical route generation, future content exclusion, API-failure 503 behavior, and configurable public base URLs.
- [ ] Implement pages, responsive image helpers, Open Graph metadata, reading progress, safe-area CSS, dark/light mode, no horizontal overflow, and friendly errors.
- [ ] Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
- [ ] Commit with `feat: build mobile H5 blog pages`.

### Task 5: WeChat material and disabled draft API

**Files:**
- Create: `apps/web/src/pages/api/wechat/material/[slug].ts`
- Create: `apps/web/src/pages/api/wechat/draft.ts`
- Test: `apps/web/src/pages/api/wechat/wechat.test.ts`

- [ ] Write failing tests for summary material output, disabled credentials response, and rejection of unauthenticated POST requests.
- [ ] Implement title, summary, highlight paragraphs, quote, source URL, moments copy, QR payload, and the explicit `尚未配置公众号接口` response.
- [ ] Ensure AppID/AppSecret are only read from environment variables and no auto-publish path exists.
- [ ] Run focused and full tests; commit with `feat: add WeChat publishing material`.

### Task 6: Directus schema and idempotent bootstrap

**Files:**
- Create: `infra/directus/schema.yaml`
- Create: `scripts/initialize-directus.ts`, `scripts/directus-model.ts`
- Create: `content/first-article.json`
- Test: `scripts/directus-model.test.ts`, `scripts/initialize-directus.test.ts`

- [ ] Write failing tests for all required collections/fields, four statuses, seven categories, four presets, default author/site, Editor restrictions, public published-only permission, slug generation, and repeat initialization.
- [ ] Implement a declarative model plus idempotent Directus REST bootstrap that creates missing resources and updates only project-owned definitions.
- [ ] Add the full first article `创业，不是投机` using the philosophy template.
- [ ] Validate the model tests locally; Task 10 runs bootstrap twice against the real Directus instance and exports the live schema snapshot.
- [ ] Commit with `feat: define Directus blog model`.

### Task 7: Compose, Caddy, and container image

**Files:**
- Create: `apps/web/Dockerfile`, `apps/web/.dockerignore`
- Create: `infra/compose.yaml`, `infra/Caddyfile`, `infra/env.example`
- Create: `scripts/validate-compose.mjs`
- Test: `scripts/validate-compose.test.ts`

- [ ] Write failing structural tests asserting pinned images, healthchecks, restart policy, log rotation, resource limits, internal network, dependency conditions, no host DB/Redis ports, and only Caddy ports 19080/19081.
- [ ] Implement the multi-stage web image, Compose services, named project network, bind mounts, Caddy compression/security/cache rules, upload limits, and health endpoints.
- [ ] Run structural tests locally and `docker compose config` on the NAS.
- [ ] Build all project images without starting old containers; commit with `feat: add production container stack`.

### Task 8: Operations, deploy polling, rollback, backup, and restore

**Files:**
- Create: `scripts/bootstrap.sh`, `scripts/deploy.sh`, `scripts/deploy-poller.sh`
- Create: `scripts/healthcheck.sh`, `scripts/rollback.sh`
- Create: `scripts/backup.sh`, `scripts/restore.sh`
- Create: `scripts/export-published-content.ts`
- Test: `tests/scripts/*.bats`

- [ ] Write failing shell tests for file locking, web-only updates, digest state, health-gated success, rollback, explicit restore arguments, pre-restore snapshots, retention, SHA-256, and draft exclusion.
- [ ] Implement minimal scripts using strict shell mode, project-scoped Compose commands, atomic state files, and secret redaction.
- [ ] Run shell tests and static shell syntax checks.
- [ ] Commit with `feat: add safe blog operations`.

### Task 9: CI, GHCR, and documentation

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/publish-image.yml`
- Create: `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/NODE_XIAOBAO.md`
- Create: `docs/GITHUB_SYNC.md`, `docs/BACKUP_AND_RESTORE.md`
- Create: `docs/OPERATIONS.md`, `docs/SECURITY.md`

- [ ] Add PR CI for install, typecheck, lint, tests, Astro build, Compose validation, Docker build, and secret scan.
- [ ] Add main/tag/manual GHCR publishing with OCI labels and `latest`, `main-<sha>`, version tags.
- [ ] Document exact commands, paths, least-privilege tokens, failure recovery, and the one permitted Node Xiaobao UI step.
- [ ] Validate workflow YAML and commit with `ci: add build and image publishing`.

### Task 10: NAS protected deployment and content acceptance

**Files:**
- Update: `docs/DEPLOYMENT_REPORT.md`, `docs/ACCEPTANCE_REPORT.md`

- [ ] Back up Node Xiaobao app/config files and current Docker container/network/volume inventories to a timestamped protected directory.
- [ ] Create `/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog` with separate repo/runtime/secrets/deploy directories and `600` environment files.
- [ ] Copy the reviewed repository, run Compose config/build/up, wait for all healthchecks, and run bootstrap twice.
- [ ] Log in to Directus, upload a real cover, create draft, preview, publish, modify, schedule, archive, and verify each frontend transition.
- [ ] Restart web, Directus, PostgreSQL, then the full project; verify article and upload persistence.
- [ ] Record container IDs, images, health, local URLs, persistence paths, and evidence.

### Task 11: Backup, restore, failed image rollback, and automation acceptance

- [ ] Run daily and weekly backups and verify SHA-256.
- [ ] Restore into the running project using the explicit backup path; verify the pre-restore snapshot and content integrity.
- [ ] Simulate a bad web image reference, verify failed health, then verify automatic rollback to the previous image.
- [ ] Install project-only cron/timer entries for backups, content export, and two-minute deploy polling without replacing existing crontab lines.
- [ ] Verify no secret is present in Git-tracked files, logs, environment audit, or workflow output.

### Task 12: Public mapping, GitHub publication, and final acceptance

- [ ] Back up Node Xiaobao configuration without reading or publishing private keys; add only the front and admin mappings if an authenticated API exists.
- [ ] If Node Xiaobao is UI-only, finish every other task and provide exactly one final UI mapping instruction with the two local ports.
- [ ] Push `feature/h5-blog-system`, open a Draft PR to `main`, and inspect real CI results.
- [ ] Push a reviewed version tag to execute GHCR publishing without merging the PR; verify the package and NAS digest update/rollback flow.
- [ ] Test local, external HTTPS, 404, health, media, API, iPhone/Android viewport, and WeChat user-agent behavior with the actual public URLs.
- [ ] Write `docs/ACCEPTANCE_REPORT.md` and `docs/DEPLOYMENT_REPORT.md` with PASS/FAIL/BLOCKED evidence for every required item.
- [ ] Run final tests, `git diff --check`, tracked-secret scan, Git status review, push the final commit, and update the Draft PR.
