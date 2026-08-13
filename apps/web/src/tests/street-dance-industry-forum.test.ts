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

const whyAttend = [
  '看懂变化，少走弯路',
  '直面经营，不讲空话',
  '带走工具，回去开工',
  '连接同行，找到协作',
];

const learningOutcomes = [
  '趋势判断',
  '产品交付',
  '门店标准化',
  '流量转化',
  '赛事联动',
  '品牌与 AI',
];

const forumGuests = [
  '夏锐',
  '卜希霆',
  '陆伟',
  '李宗齐',
  '锋爷',
  '桂鑫',
  '海边',
  '吉顺',
  '周政',
  '袁康',
  '朱颜棋（猪猪）',
  '陈施（美子）',
  '周营利（盈利）',
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
    expect(html).toContain('2026-09-05');
    expect(html).toContain('SAT');

    for (const course of expectedCourses) {
      expect(html).toContain(course);
    }

    const courseCards = html.match(/class="course-card"/g) ?? [];
    expect(courseCards).toHaveLength(8);
    expect(html).not.toMatch(/月销千万|单店单月100万|5300万粉丝|600亿播放|保过|保证盈利|郑锋|郑峰|潘域|潘彧/);
  });

  it('includes v2 value proposition, learning outcomes, forum guests and the tentative forum agenda', async () => {
    const html = await source('index.html');

    expect(html).toContain('为什么值得来');
    expect(html).toContain('你将带走什么');
    expect(html.match(/data-worth-item=/g) ?? []).toHaveLength(4);
    expect(html.match(/data-outcome-item=/g) ?? []).toHaveLength(6);

    for (const item of [...whyAttend, ...learningOutcomes, ...forumGuests]) {
      expect(html).toContain(item);
    }

    expect(html.match(/class="guest-card"/g) ?? []).toHaveLength(forumGuests.length);
    expect(html).toContain('assets/forum-speaker-lineup.png');
    expect(html).toContain('论坛议程为拟定版本');

    for (const item of [
      '14:00—14:20',
      '大会开场与产业倡议',
      '14:20—14:40',
      '新兴文化产业与青年经济观察',
      '14:40—15:00',
      '街舞内容如何走向大众表达',
      '15:00—15:20',
      '内容平台与街舞产业协同',
      '15:20—15:40',
      '街舞内容 IP 的运营实践',
      '15:40—16:00',
      '中国街舞文化产业新路径',
      '16:00—16:40',
      '产业生态：内容、平台与城市机会',
      '16:40—17:00',
      '机构经营与区域协同',
    ]) {
      expect(html).toContain(item);
    }
  });

  it('renders workshop agendas with lunch placed between morning and afternoon courses', async () => {
    const html = await source('index.html');

    for (const day of ['2026-09-06', '2026-09-07']) {
      const block = html.match(new RegExp(`<article class="agenda-day workshop-day" data-agenda-day="${day}">([\\s\\S]*?)</article>`))?.[1] ?? '';
      expect(block).toContain('12:10—14:00');
      const firstMorning = block.indexOf('09:00—10:30');
      const secondMorning = block.indexOf('10:40—12:10');
      const lunch = block.indexOf('午休 · 交流');
      const firstAfternoon = block.indexOf('14:00—15:30');
      const secondAfternoon = block.indexOf('15:40—17:10');
      expect(firstMorning).toBeGreaterThan(-1);
      expect(secondMorning).toBeGreaterThan(firstMorning);
      expect(lunch).toBeGreaterThan(secondMorning);
      expect(firstAfternoon).toBeGreaterThan(lunch);
      expect(secondAfternoon).toBeGreaterThan(firstAfternoon);
    }
  });

  it('keeps exactly three takeaways and one information note for every course', async () => {
    const html = await source('index.html');
    const courseBlocks = html.match(/<article class="course-card"[\s\S]*?<\/article>/g) ?? [];

    expect(courseBlocks).toHaveLength(8);
    for (const block of courseBlocks) {
      expect(block.match(/data-takeaway=/g) ?? []).toHaveLength(3);
      expect(block).toContain('课程与嘉宾信息说明');
      expect(block).toContain('source-note');
    }
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
      'assets/forum-speaker-lineup.png',
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
