import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const sourceFiles = [
  '../layouts/BaseLayout.astro',
  '../layouts/ArticleLayout.astro',
  '../components/ArticleCard.astro',
  '../components/Hero.astro',
  '../pages/index.astro',
  '../pages/rss.xml.ts',
  '../lib/wechat.ts',
  '../../public/favicon.svg',
  '../../public/images/streetdance-decade-review-cover.svg',
] as const;

describe('site brand', () => {
  it('uses the Li Siyou identity throughout public-facing source files', async () => {
    const sources = await Promise.all(
      sourceFiles.map((path) => readFile(new URL(path, import.meta.url), 'utf8')),
    );
    const combined = sources.join('\n');
    const legacyAuthor = String.fromCodePoint(0x560e, 0x5b50);

    expect(combined).toContain('李思友的思想实验室');
    expect(combined).toContain('李思友');
    expect(combined).not.toContain('GAZI');
    expect(combined).not.toContain(legacyAuthor);
  });
});
