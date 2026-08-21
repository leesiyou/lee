import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

async function optionalSource(url: URL): Promise<string> {
  return readFile(url, 'utf8').catch(() => '');
}

describe('street dance decade review H5', () => {
  it('uses Directus publication state as the gate for the dedicated route', async () => {
    const route = await optionalSource(
      new URL('../pages/posts/china-street-dance-decade-review.ts', import.meta.url),
    );

    expect(route).toContain('fetchPublishedArticle');
    expect(route).toContain("const slug = 'china-street-dance-decade-review'");
    expect(route).toContain("status: 404");
    expect(route).toContain('reviewDocument');
    expect(route).toContain('__CANONICAL_URL__');
    expect(route).toContain('__COVER_URL__');
  });

  it('publishes all twelve evidence modules without local development paths', async () => {
    const document = await optionalSource(
      new URL('../content/china-street-dance-decade-review.html', import.meta.url),
    );

    expect(document).toContain('中国街舞 2015—2026：从热度到资产');
    for (const id of [
      'method',
      'timeline',
      'gantt',
      'assets',
      'metrics',
      'experts',
      'align',
      'conflict',
      'audience',
      'verdict',
      'source',
    ]) {
      expect(document).toContain(`id="${id}"`);
    }
    for (const expert of [
      '天津街舞论坛顾问',
      '街舞商业专家小K',
      '街舞商业研修可行性分析专家',
      '街舞商业辩论复盘专家',
      '街舞招生实战专家小M',
    ]) {
      expect(document).toContain(expert);
    }
    expect(document).toContain('__CANONICAL_URL__');
    expect(document).toContain('__COVER_URL__');
    expect(document).toContain('/scripts/streetdance-review.js');
    expect(document).not.toMatch(/\/Users\/|127\.0\.0\.1|4173|双击打开|10_专家工作区|30_H5_十年复盘/);
    expect(document).not.toMatch(/<script>([\s\S]*?)<\/script>/);
  });

  it('keeps all interaction code in the same-origin external script', async () => {
    const script = await optionalSource(
      new URL('../../public/scripts/streetdance-review.js', import.meta.url),
    );

    expect(script).toContain("document.querySelectorAll('.tab')");
    expect(script).toContain('navigator.share');
    expect(script).toContain('navigator.clipboard.writeText');
    expect(script).toContain("document.querySelector('[data-back-to-top]')");
  });
});
