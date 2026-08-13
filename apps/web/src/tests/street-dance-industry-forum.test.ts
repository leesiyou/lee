import { access, readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const h5Root = new URL(
  '../../public/h5/2026-08-13/street-dance-industry-forum/',
  import.meta.url,
);

const expectedCourses = [
  '艺考新规下的招生与交付系统',
  '小机构标准化：把经验变成流程',
  '本地生活直播：从搭建到复盘',
  '赛事数据化：报名、办赛与资源联动',
  '门店增长作战图：获客、转化、复购',
  '长青品牌：街舞机构如何跨周期',
  '舞团IP内容增长：从人设到矩阵',
  '用AI做街舞机构的IP视觉系统',
];

async function source(path: string): Promise<string> {
  return readFile(new URL(path, h5Root), 'utf8').catch(() => '');
}

describe('street dance industry forum static H5', () => {
  it('publishes the fixed public path with campaign theme and eight course cards', async () => {
    const html = await source('index.html');

    expect(html).toContain('https://myhooddaily.iepose.cn/h5/2026-08-13/street-dance-industry-forum/');
    expect(html).toContain('2026街舞文化产业发展大会');
    expect(html).toContain('潮流新时代');
    expect(html).toContain('舞出新经济');
    expect(html).toContain('两天八课');
    expect(html).toContain('证据边界');
    expect(html).toContain('首版不写具体数字');
    expect(html).toContain('未获独立来源前不作为承诺');

    for (const course of expectedCourses) {
      expect(html).toContain(course);
    }

    const courseCards = html.match(/class="course-card"/g) ?? [];
    expect(courseCards).toHaveLength(8);
    expect(html).not.toMatch(/月销千万|单店单月100万|5300万粉丝|600亿播放|保过|保证盈利|郑锋|郑峰|潘域|潘彧/);
  });

  it('ships local static assets without external scripts or leaked paths', async () => {
    const [html, css, script] = await Promise.all([
      source('index.html'),
      source('css/style.css'),
      source('js/main.js'),
    ]);
    const combined = `${html}\n${css}\n${script}`;

    for (const asset of [
      'assets/campaign-hero.png',
      'assets/guests/fengye.png',
      'assets/guests/guixin.png',
      'assets/guests/haibian.png',
      'assets/guests/jishun.png',
      'assets/guests/meizi.png',
      'assets/guests/yingli.png',
      'assets/guests/yuankang.png',
      'assets/guests/zhuyq.png',
      'assets/posters/01_主视觉_潮流新时代舞出新经济.png',
      'css/style.css',
      'js/main.js',
    ]) {
      await access(new URL(asset, h5Root));
      expect(html).toContain(asset);
    }

    expect(html).not.toMatch(/<script[^>]+src="https?:\/\//);
    expect(combined).not.toMatch(/127\.0\.0\.1|192\.168\.|DIRECTUS_TOKEN|\/Users\/|gazidaily|嘎子/);
  });

  it('keeps mobile interaction and overflow protection in the static build', async () => {
    const [html, css, script] = await Promise.all([
      source('index.html'),
      source('css/style.css'),
      source('js/main.js'),
    ]);

    expect(html).toContain('id="reading-progress-bar"');
    expect(html).toContain('id="back-to-top"');
    expect(html).toContain('aria-live="polite"');
    expect(css).toContain('overflow-x: hidden');
    expect(css).toContain('max-width: 100%');
    expect(css).toContain('@media (max-width: 780px)');
    expect(css).toContain('env(safe-area-inset-bottom)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(script).toContain('IntersectionObserver');
    expect(script).toContain('document.documentElement.scrollWidth');
  });
});
