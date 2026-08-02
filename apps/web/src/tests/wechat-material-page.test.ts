import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

async function optionalSource(url: URL): Promise<string> {
  return readFile(url, 'utf8').catch(() => '');
}

const serverEntryPath = path.resolve(
  import.meta.dirname,
  '../../dist/server/entry.mjs',
);

describe('public WeChat material page', () => {
  it('is a published-only noindex workspace with copy and download actions', async () => {
    const source = await optionalSource(
      new URL('../pages/wechat/material/[slug].astro', import.meta.url),
    );

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

  it('registers the material page route in the SSR server build manifest', async () => {
    await expect(access(serverEntryPath)).resolves.toBeUndefined();

    const entry = await readFile(serverEntryPath, 'utf8');

    expect(entry).toContain('"route": "/wechat/material/[slug]"');
    expect(entry).toContain('"route": "/api/wechat/material/[slug]"');
    expect(entry).toContain(
      '"component": "src/pages/wechat/material/[slug].astro"',
    );
    expect(entry).toContain(
      '"component": "src/pages/api/wechat/material/[slug].ts"',
    );
  });

  it('keeps clipboard behavior in a same-origin external script', async () => {
    const source = await optionalSource(
      new URL('../../public/scripts/wechat-material.js', import.meta.url),
    );

    expect(source).toContain('navigator.clipboard.writeText');
    expect(source).toContain('document.createRange');
  });
});
