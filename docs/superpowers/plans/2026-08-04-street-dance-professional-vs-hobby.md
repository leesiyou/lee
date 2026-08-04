# Street Dance Professional vs Hobby H5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, verify, and publish a mobile-first interactive H5 that helps street dancers distinguish hobby, serious hobby, pre-professional, and portfolio-professional relationships with dance.

**Architecture:** Keep the existing Astro/Docker publishing architecture and add one self-contained static H5 under `apps/web/public/h5/2026-08-04/street-dance-professional-vs-hobby/`. The experience uses semantic HTML, one CSS file, one vanilla JavaScript file, same-origin assets, deterministic scoring, and no runtime API or CDN dependency.

**Tech Stack:** Astro static public assets, HTML5, CSS3, vanilla ES2022 JavaScript, Vitest, existing Docker/GitHub Actions/Caddy deployment.

---

## File map

- Create `apps/web/src/tests/street-dance-professional-vs-hobby.test.ts`: static contract tests for content, sources, accessibility, scoring and network safety.
- Create `apps/web/public/h5/2026-08-04/street-dance-professional-vs-hobby/index.html`: semantic narrative, quiz and source register.
- Create `apps/web/public/h5/2026-08-04/street-dance-professional-vs-hobby/css/style.css`: mobile layout, metallic visual system, animation and reduced-motion handling.
- Create `apps/web/public/h5/2026-08-04/street-dance-professional-vs-hobby/js/main.js`: reveal, progress, 12-question scoring, result, copy, reset and back-to-top behavior.
- Create `apps/web/public/h5/2026-08-04/street-dance-professional-vs-hobby/assets/logo.webp`: same-origin copy of the selected street-dance gas-station shield visual.
- Create `apps/web/public/h5/2026-08-04/street-dance-professional-vs-hobby/assets/wechat-poster.png`: 1080×1440 WeChat reading-original poster.
- Create `content-export/2026/08/street-dance-professional-vs-hobby-wechat.md`: copy-ready WeChat title, summary, body, Moments copy and original URL, following the repository's existing export structure.
- Modify NAS deployment-poller image override after image publication to prevent the scheduled job from reverting the new image.

### Task 1: Lock the static H5 contract

**Files:**
- Create: `apps/web/src/tests/street-dance-professional-vs-hobby.test.ts`

- [ ] **Step 1: Write the failing static contract test**

The test reads the HTML, CSS and JavaScript and asserts: both brands are present; there are exactly 12 `.quiz-question` elements; all four result identifiers exist; official source URLs are present; the page links only `css/style.css`, `js/main.js`, `assets/logo.webp` and `assets/wechat-poster.png`; the script contains `scoreProfile`, clipboard fallback, reset and unanswered-question handling; CSS contains safe-area and reduced-motion rules; none of `127.0.0.1`, `192.168.`, `/Users/`, remote script tags or “嘎子” appears.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run apps/web/src/tests/street-dance-professional-vs-hobby.test.ts`

Expected: FAIL because the H5 files do not exist yet.

- [ ] **Step 3: Commit the failing test**

Run:

```bash
git add apps/web/src/tests/street-dance-professional-vs-hobby.test.ts
git commit -m "test: define street dance identity H5 contract"
```

### Task 2: Build the complete narrative and quiz markup

**Files:**
- Create: `apps/web/public/h5/2026-08-04/street-dance-professional-vs-hobby/index.html`

- [ ] **Step 1: Add semantic sections and exact public copy**

Create a complete document containing: dynamic hero; four identity states; economics, sociology and cultural-history chapters; Don Campbell, Phil Wizard and Liu Qingyi cases; China’s dual-path synthesis; 12 fieldsets with three buttons worth 0/1/2; result live region; methodology; official-source links; publisher lockup; local poster and logo metadata.

- [ ] **Step 2: Add accessible interaction hooks**

Each answer button uses `data-question` and `data-score`; the quiz has `aria-labelledby`; the result has `aria-live="polite"`; copy, reset and back-to-top controls are real buttons with explicit labels.

- [ ] **Step 3: Re-run the focused test**

Expected: content assertions pass; CSS/JavaScript/assets assertions still fail.

### Task 3: Implement the high-end mobile visual system

**Files:**
- Create: `apps/web/public/h5/2026-08-04/street-dance-professional-vs-hobby/css/style.css`

- [ ] **Step 1: Implement mobile-first black/silver/neon design**

Use CSS variables `--ink:#050607`, `--silver:#f4f6f8`, `--muted:#7d8490`, `--acid:#c8ff2e`, `--blue:#1677ff`. Apply metallic text gradients, grid/noise pseudo-elements, thin track lines, readable cards, 44px minimum touch targets, `max-width:760px`, `overflow-x:clip`, and `padding-bottom:env(safe-area-inset-bottom)`.

- [ ] **Step 2: Add purposeful motion and reduced-motion fallback**

Add `heroRise`, `metalSweep`, `trackDrift`, `answerPulse`, and `.is-visible` transitions. Under `@media (prefers-reduced-motion: reduce)`, force animation duration to `0.01ms`, disable smooth scrolling, and make reveal elements visible.

- [ ] **Step 3: Re-run the focused test**

Expected: markup and CSS assertions pass; JavaScript/assets assertions remain red.

### Task 4: Implement deterministic quiz behavior

**Files:**
- Create: `apps/web/public/h5/2026-08-04/street-dance-professional-vs-hobby/js/main.js`

- [ ] **Step 1: Implement selection and progress**

Maintain a `Map` keyed by question number. Selecting an answer updates `aria-pressed`, the visible `x/12` progress and the fixed reading-progress bar. Result generation is disabled until all 12 keys exist and reports the exact unanswered count.

- [ ] **Step 2: Implement profile scoring**

`scoreProfile(score)` returns `casual` for 0–6, `serious` for 7–12, `builder` for 13–18 and `portfolio` for 19–24. Each profile supplies a title, explanation, strength, risk and three concrete 90-day actions.

- [ ] **Step 3: Implement failure-safe controls**

Copy uses `navigator.clipboard.writeText` when available and a temporary textarea fallback otherwise; errors are shown in the status region. Reset clears the Map and pressed states. Back-to-top uses reduced-motion-aware scrolling.

- [ ] **Step 4: Re-run the focused test**

Expected: only asset checks remain red.

### Task 5: Add verified brand and poster assets

**Files:**
- Create: `apps/web/public/h5/2026-08-04/street-dance-professional-vs-hobby/assets/logo.webp`
- Create: `apps/web/public/h5/2026-08-04/street-dance-professional-vs-hobby/assets/wechat-poster.png`

- [ ] **Step 1: Add the selected existing brand asset**

Use the green/silver shield visual from the canonical external-drive street-dance gas-station design folder, convert it to WebP without changing its artwork, and keep the source note in the design specification.

- [ ] **Step 2: Generate one cohesive 1080×1440 poster**

Create the poster in the H5 visual language with the exact five approved text lines. Inspect for invented or malformed Chinese; retry once only if unusable.

- [ ] **Step 3: Run the focused test to GREEN**

Expected: all H5 contract tests PASS.

- [ ] **Step 4: Commit the complete H5**

Run:

```bash
git add apps/web/public/h5/2026-08-04/street-dance-professional-vs-hobby
git commit -m "feat: add professional versus hobby street dance H5"
```

### Task 6: Add copy-ready WeChat publication material

**Files:**
- Create: `content-export/2026/08/street-dance-professional-vs-hobby-wechat.md`

- [ ] **Step 1: Write the publication bundle**

Include a title under 64 Chinese characters, a summary under 120 characters, five short public-account paragraphs, one pull quote, the fixed original URL, the poster path, a Moments version and a truthful note that full interaction opens through “阅读原文”.

- [ ] **Step 2: Commit the material**

Run:

```bash
git add content-export/2026/08/street-dance-professional-vs-hobby-wechat.md
git commit -m "content: add WeChat material for street dance identity H5"
```

### Task 7: Run local release gates

**Files:**
- Verify all files created above.

- [ ] **Step 1: Run focused and full checks**

Run `npm test -- --run apps/web/src/tests/street-dance-professional-vs-hobby.test.ts`, then `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`.

Expected: all commands exit 0.

- [ ] **Step 2: Run browser/mobile acceptance**

Serve the repository output locally and verify at 390×844: first screen visible; no horizontal overflow; all 12 answers work; each scoring threshold renders the correct profile; copy/reset/back-to-top work; no console errors; reduced-motion path remains readable.

- [ ] **Step 3: Run a sensitive-data and network scan**

Search the H5 for `127.0.0.1`, `192.168.`, `/Users/`, tokens, remote scripts and old “嘎子” branding. Expected: zero matches.

### Task 8: Publish and verify the Flyniu public route

**Files:**
- Remote: NAS deployment-poller cron image override.

- [ ] **Step 1: Push and wait for CI**

Push `feature/h5-blog-system`, verify the feature-branch CI concludes success, and manually trigger `publish-image.yml` for the same branch.

- [ ] **Step 2: Back up and deploy the exact image**

Run the existing NAS backup script. Deploy `ghcr.io/leesiyou/lee-web:main-<shortsha>`, then update the scheduled poller’s `DEPLOY_POLLER_IMAGE_OVERRIDE` to that identical immutable tag.

- [ ] **Step 3: Verify after the poller interval**

After at least one scheduled poller run, confirm the web container still uses the new immutable image and all five containers are healthy.

- [ ] **Step 4: Verify the public experience**

Require HTTP 200 for the H5 URL, CSS, JavaScript, Logo and poster; confirm the HTML contains 12 questions and the two publisher names; copy the public URL to the clipboard.
