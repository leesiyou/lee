import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const root = new URL('../../public/h5/2026-09-28/soul-print-interactive-demo/', import.meta.url);
const publicUrl = 'https://myhooddaily.iepose.cn/h5/2026-09-28/soul-print-interactive-demo/';

async function source(path: string): Promise<string> {
  return readFile(new URL(path, root), 'utf8').catch(() => '');
}

describe('soul print interactive demo', () => {
  it('publishes the original presentation with a clear demo-data boundary', async () => {
    const html = await source('index.html');
    expect(html).toContain('<title>灵魂印花交互演示</title>');
    expect(html).toContain('一张单的一辈子');
    expect(html).toContain('演示数据');
    expect(html).toContain('id="c-play"');
    expect(html).toContain('id="c-next"');
    expect(html).toContain(`content="${publicUrl}"`);
  });

  it('loads executable code from the same origin under the blog CSP', async () => {
    const [html, script] = await Promise.all([source('index.html'), source('js/main.js')]);
    expect(html).toContain('src="./js/main.js"');
    expect(html).not.toMatch(/<script(?![^>]*src=)[^>]*>/i);
    expect(html).not.toContain('fonts.googleapis.com');
    expect(script).toContain('window.__demo=');
    expect(script).toContain('requestAnimationFrame(loop)');
    expect(`${html}\n${script}`).not.toMatch(/192\.168\.|127\.0\.0\.1|DIRECTUS_TOKEN|GITHUB_TOKEN/);
  });
});
