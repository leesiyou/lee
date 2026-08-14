import { access, readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const h5Root = new URL(
  '../../public/h5/2026-08-13/street-dance-industry-forum/',
  import.meta.url,
);

const expectedGuests = [
  '卜希霆',
  '夏锐',
  '陆伟',
  '李宗齐',
  '郑锋',
  '桂鑫',
  '潘域',
  '吉顺',
  '周政',
  '袁康',
  '朱颜棋',
  '陈施',
  '周营利',
  '嘎子',
];

const expectedCourses = [
  '新形势下流行舞艺考',
  '小企业标准化管理',
  '抖音直播搭建与实战',
  '赛事系统与行业数据',
  '门店逆袭方法论',
  '28 年长青品牌运营',
  '头部舞团 IP 运营',
  '潮流 IP 与视觉体系',
];

const expectedCozeLinks = [
  'https://www.coze.cn/s/lA1KH6CvgGQ/',
  'https://www.coze.cn/s/sN6glvnH0b0/',
  'https://www.coze.cn/s/pIVw89Z8TyM/',
];

async function source(path: string): Promise<string> {
  return readFile(new URL(path, h5Root), 'utf8');
}

function localReferences(markup: string): string[] {
  return [...markup.matchAll(/\b(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter(
      (ref) =>
        !ref.startsWith('#') &&
        !ref.startsWith('http') &&
        !ref.startsWith('tel:') &&
        !ref.startsWith('mailto:') &&
        !ref.startsWith('data:'),
    );
}

describe('street dance industry forum v3 static H5', () => {
  it('keeps the fixed public H5 slot while rendering the new campaign title', async () => {
    const html = await source('index.html');

    expect(html).toContain('2026新兴文化产业发展大会｜街舞文化产业发展大会');
    expect(html).toContain('2026 中国文化和旅游产业博览会同期活动');
    expect(html).toContain('潮流新时代');
    expect(html).toContain('舞出新经济');
    expect(html).toContain('中国 · 天津 · 梅江会展中心');
    expect(html).toContain('9 月 5 日下午，500 人公益大会');
  });

  it('contains the three-day arrangement without reverting to old v2 copy', async () => {
    const html = await source('index.html');

    expect(html.match(/class="day /g) ?? []).toHaveLength(3);
    for (const item of [
      'DAY 0 · 09.05 周六',
      '发展大会',
      '14:00—17:00 · 梅江 N7 · 公益免费 · 500 席',
      'DAY 1 · 09.06 周日',
      '研修班 上午+下午',
      'DAY 2 · 09.07 周一',
      '研修班 收官',
    ]) {
      expect(html).toContain(item);
    }

    expect(html).not.toContain('首版不写具体数字');
    expect(html).not.toContain('论坛议程为拟定版本');
  });

  it('lists fourteen speaker cards and only optimized WebP guest images', async () => {
    const html = await source('index.html');

    expect(html.match(/<article class="speak\b/g) ?? []).toHaveLength(14);
    for (const guest of expectedGuests) {
      expect(html).toContain(`<h3>${guest}</h3>`);
    }

    const guestImages = [
      ...html.matchAll(/<img src="(assets\/optimized\/guests\/[^"]+\.webp)"/g),
    ].map((match) => match[1]);
    expect(guestImages).toHaveLength(14);
    for (const asset of guestImages) {
      await access(new URL(asset, h5Root));
    }

    expect(html).not.toMatch(/assets\/guests\/|assets\/official\//);
  });

  it('renders eight course rows with the current source titles', async () => {
    const html = await source('index.html');

    expect(html.match(/<article class="cls\b/g) ?? []).toHaveLength(8);
    for (const course of expectedCourses) {
      expect(html).toContain(`<h3>${course}</h3>`);
    }

    for (const item of [
      '09.06 09:00',
      '09.06 10:40',
      '09.06 14:00',
      '09.06 15:40',
      '09.07 09:00',
      '09.07 10:40',
      '09.07 14:00',
      '09.07 15:40',
    ]) {
      expect(html).toContain(item);
    }
  });

  it('keeps exactly three unique Coze CTA destinations', async () => {
    const html = await source('index.html');
    const cozeLinks = [...new Set(html.match(/https:\/\/www\.coze\.cn\/s\/[^"]+/g) ?? [])];

    expect(cozeLinks).toEqual(expectedCozeLinks);
    for (const label of ['免费报名大会', '报名研修班', '预订 SVIP']) {
      expect(html).toContain(label);
    }
  });

  it('ships only the v3 local CSS, JS and optimized WebP image references', async () => {
    const [html, css, script] = await Promise.all([
      source('index.html'),
      source('css/main.css'),
      source('js/app.js'),
    ]);

    expect(html).toContain('href="css/main.css"');
    expect(html).toContain('src="js/app.js"');
    expect(html).toContain('assets/optimized/hero.webp');
    expect(html).toContain('assets/optimized/official/kv.webp');
    expect(html).toContain('assets/optimized/official/lineup.webp');
    expect(html).toContain('assets/optimized/official/courses.webp');
    expect(css).toContain('../assets/optimized/hero.webp');

    for (const ref of localReferences(html)) {
      await access(new URL(ref, h5Root));
    }

    const imgRefs = [...html.matchAll(/<img src="([^"]+)"/g)].map((match) => match[1]);
    expect(imgRefs).toHaveLength(18);
    for (const ref of imgRefs) {
      expect(ref).toMatch(/^assets\/optimized\/.+\.webp$/);
    }

    expect(script).toContain('IntersectionObserver');
  });

  it('prevents font regressions, sub-class conflicts, leaks and mobile overflow regressions', async () => {
    const [html, css, script] = await Promise.all([
      source('index.html'),
      source('css/main.css'),
      source('js/app.js'),
    ]);
    const combined = `${html}\n${css}\n${script}`;

    expect(combined).not.toMatch(/fonts\.googleapis|fonts\.gstatic|Google Fonts|@import\s+url/i);
    expect(css).toContain('-apple-system');
    expect(css).toContain('PingFang SC');
    expect(css).not.toMatch(/(^|[\s,{])\.sub\b/);
    expect(html).not.toMatch(/class="[^"]*\bsub\b[^"]*"/);
    expect(combined).not.toMatch(/127\.0\.0\.1|192\.168\.|DIRECTUS_TOKEN|GITHUB_TOKEN|\/Users\/|gazidaily/i);

    expect(css).toContain('overflow-x: clip');
    expect(css).toContain('max-width: 100%');
    expect(css).toContain('@media (max-width: 560px)');
    expect(css).toContain('.ggrid, .q8 { grid-template-columns: 1fr; }');
    expect(css).toContain('env(safe-area-inset-bottom)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(script).not.toContain('document.documentElement.scrollWidth');
  });
});
