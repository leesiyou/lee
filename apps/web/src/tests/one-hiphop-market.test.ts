import { access, readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const h5Root = new URL(
  '../../public/h5/2026-08-12/one-hiphop-market-exploration/',
  import.meta.url,
);
const wechatMaterial = new URL(
  '../../../../content-export/2026/08/one-hiphop-market-exploration-wechat.md',
  import.meta.url,
);

async function source(path: string): Promise<string> {
  return readFile(new URL(path, h5Root), 'utf8').catch(() => '');
}

describe('one hiphop market exploration H5', () => {
  it('publishes a dynamic structured report from the forum materials', async () => {
    const [html, css, script] = await Promise.all([
      source('index.html'),
      source('css/style.css'),
      source('js/main.js'),
    ]);
    const combined = `${html}\n${css}\n${script}`;

    expect(html).toContain('2026 中国街舞论坛');
    expect(html).toContain('ONE HIPHOP');
    expect(html).toContain('潮流新时代，舞出新经济');
    expect(html).toContain('中国·天津');
    expect(html).toContain('梅江会展中心');
    expect(html).toContain('9月5日 论坛沙龙');
    expect(html).toContain('9月6日-7日 研修班');
    expect(html).toContain('下一个市场不是更多比赛，而是街舞成为青年文化基础设施');
    expect(html).toContain('文化表达');
    expect(html).toContain('机构经营');
    expect(html).toContain('文旅场景');
    expect(html).toContain('内容传播');
    expect(html).toContain('商业协同');
    expect(html).toContain('专业营销话术');
    expect(html).toContain('主理人 / 校长');
    expect(html).toContain('赛事 / 协会');
    expect(html).toContain('品牌 / 商业方');
    expect(html).toContain('文旅 / 城市运营');
    expect(html).toContain('高校 / 研究者 / 媒体');
    expect(html).toContain('https://myhooddaily.iepose.cn/h5/2026-08-12/one-hiphop-market-exploration/');
    expect(html).toContain('content="assets/forum-poster.webp"');
    expect(html).toContain('href="css/style.css"');
    expect(html).toContain('src="js/main.js"');
    expect(html).not.toMatch(/<script[^>]+src="https?:\/\//);
    expect(combined).not.toMatch(/127\.0\.0\.1|192\.168\.|DIRECTUS_TOKEN|\/Users\/|嘎子|gazidaily/);
  });

  it('includes local assets and interactive affordances for WeChat reading', async () => {
    const [html, css, script] = await Promise.all([
      source('index.html'),
      source('css/style.css'),
      source('js/main.js'),
    ]);

    for (const asset of [
      'assets/forum-poster.webp',
      'assets/report-core-value.webp',
      'assets/report-timeline.webp',
      'assets/report-audience.webp',
      'assets/report-takeaway.webp',
      'assets/logo.webp',
    ]) {
      await access(new URL(asset, h5Root));
      expect(html).toContain(asset);
    }

    expect(html).toContain('id="reading-progress-bar"');
    expect(html).toContain('id="copy-url"');
    expect(html).toContain('id="copy-talk-1"');
    expect(html).toContain('id="back-to-top"');
    expect(html).toContain('aria-live="polite"');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('env(safe-area-inset-bottom)');
    expect(script).toContain('IntersectionObserver');
    expect(script).toContain('navigator.clipboard.writeText');
  });

  it('states evidence boundaries instead of inventing event data', async () => {
    const html = await source('index.html');

    expect(html).toContain('活动硬信息来自本次用户提供的海报与图卡');
    expect(html).toContain('未检索到可公开核验的官方网页时，不擅自补充报名人数、嘉宾名单或主办背书');
    expect(html).toContain('近 300 万');
    expect(html).toContain('超过 1000 万人次');
    expect(html).toContain('超万家');
    expect(html).toContain('人次不是去重人数');
    expect(html).toContain('https://www.chhuc.org/18158.html');
    expect(html).toContain('https://zqb.cyol.com/pc/content/202503/25/content_408869.html');
  });

  it('ships copy-ready WeChat material for manual publishing', async () => {
    const material = await readFile(wechatMaterial, 'utf8').catch(() => '');

    expect(material).toContain('2026 中国街舞论坛：下一个市场的探索');
    expect(material).toContain('公众号正文精华');
    expect(material).toContain('专业营销话术');
    expect(material).toContain('朋友圈文案');
    expect(material).toContain('阅读原文');
    expect(material).toContain('https://myhooddaily.iepose.cn/h5/2026-08-12/one-hiphop-market-exploration/');
    expect(material).not.toMatch(/127\.0\.0\.1|192\.168\.|DIRECTUS_TOKEN|\/Users\/|嘎子|gazidaily/);
  });
});
