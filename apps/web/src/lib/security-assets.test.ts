import { access, readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('strict CSP browser assets', () => {
  it('loads article interactions from same-origin external files', async () => {
    const files = [
      new URL('../layouts/ArticleLayout.astro', import.meta.url),
      new URL('../components/ShareCard.astro', import.meta.url),
      new URL('../components/Quiz.astro', import.meta.url),
    ];
    const sources = await Promise.all(files.map((file) => readFile(file, 'utf8')));

    for (const source of sources) {
      expect(source).toMatch(/<script[^>]+src="\/scripts\/[^"]+\.js"/);
      expect(source).not.toMatch(/<script>\s*[A-Za-z]/);
    }
    for (const file of ['article.js', 'share-card.js', 'quiz.js']) {
      await expect(access(new URL(`../../public/scripts/${file}`, import.meta.url))).resolves.toBe(
        undefined,
      );
    }
  });

  it('declares a real favicon while retaining the strict script policy', async () => {
    const layout = await readFile(new URL('../layouts/BaseLayout.astro', import.meta.url), 'utf8');
    const caddy = await readFile(new URL('../../../../infra/Caddyfile', import.meta.url), 'utf8');

    expect(layout).toContain('href="/favicon.svg"');
    await expect(access(new URL('../../public/favicon.svg', import.meta.url))).resolves.toBe(undefined);
    expect(caddy).toContain("script-src 'self'");
    expect(caddy).not.toContain("script-src 'self' 'unsafe-inline'");
  });
});
