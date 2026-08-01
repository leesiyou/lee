import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

async function optionalSource(url: URL): Promise<string> {
  return readFile(url, 'utf8').catch(() => '');
}

describe('public WeChat material page', () => {
  it('is a published-only noindex workspace with copy and download actions', async () => {
    const source = await optionalSource(new URL('./[slug].astro', import.meta.url));

    expect(source).toContain('fetchPublishedArticle');
    expect(source).toContain('noindex, nofollow');
    expect(source).toContain('private, no-store');
    expect(source).toContain('复制标题');
    expect(source).toContain('复制摘要');
    expect(source).toContain('复制精华正文');
    expect(source).toContain('下载封面');
    expect(source).toContain('下载二维码');
    expect(source).toContain('朋友圈分享文案');
    expect(source).toContain('/scripts/wechat-material.js');
  });

  it('keeps clipboard behavior in a same-origin external script', async () => {
    const source = await optionalSource(
      new URL('../../../../public/scripts/wechat-material.js', import.meta.url),
    );

    expect(source).toContain('navigator.clipboard.writeText');
    expect(source).toContain('document.createRange');
  });
});
