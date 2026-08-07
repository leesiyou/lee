import { access, readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const root = new URL(
  '../../public/h5/2026-08-07/startup-failure-diagnosis/',
  import.meta.url,
);

async function source(path: string): Promise<string> {
  return readFile(new URL(path, root), 'utf8').catch(() => '');
}

describe('startup failure diagnosis H5', () => {
  it('publishes the complete diagnosis with safe local assets', async () => {
    const [html, css, script] = await Promise.all([
      source('index.html'),
      source('css/style.css'),
      source('js/main.js'),
    ]);
    const combined = `${html}\n${css}\n${script}`;

    expect(html).toContain('经验不是免疫');
    expect(html).toContain('现金跑道模型');
    expect(html).toContain('经验有效性指数');
    expect(html).toContain('为什么仍然会把企业做倒');
    expect(html).toContain(
      'https://myhooddaily.iepose.cn/h5/2026-08-07/startup-failure-diagnosis/',
    );
    expect(html).toContain('content="assets/wechat-poster.png"');
    expect(combined).not.toMatch(/127\.0\.0\.1|192\.168\.|DIRECTUS_TOKEN|\/Users\//);
    expect(html).not.toMatch(/<script[^>]+src="https?:\/\//);
    await access(new URL('assets/wechat-poster.png', root));
  });
});
