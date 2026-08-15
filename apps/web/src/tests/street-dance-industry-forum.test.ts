import { createHash } from 'node:crypto';
import { access, readFile, stat } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const h5Root = new URL(
  '../../public/h5/2026-08-13/street-dance-industry-forum/',
  import.meta.url,
);

const expectedGuests = [
  '卜希霆', '夏锐', '陆伟', '李宗齐', '郑锋', '桂鑫', '潘域',
  '吉顺', '周政', '袁康', '朱颜棋', '陈施', '周营利', '嘎子',
];

const expectedCourses = [
  '新形势下流行舞艺考', '小企业标准化管理', '抖音直播搭建与实战',
  '赛事系统与行业数据', '门店逆袭方法论', '28 年长青品牌运营',
  '头部舞团 IP 运营', '潮流 IP 与视觉体系',
];

const forbiddenPublicClaims = [
  '18622186692', '1580', '1980', '2580', '1,580', '1,980', '2,580',
  '10万', '10 万', '100000',
];

const forumRegistration = 'https://u.wechat.com/ECM24ZqD0UZU5iXB8DvGlMs?s=2';
const workshopConsultation = 'https://u.wechat.com/EL5hKhaJ4JZitv3XzICkdQ4';
const registrationQrDigest = '22a75ae7bb2703bb6f2a4ffdded5448f9af938859c687ff813adac6804e17c5b';

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

describe('street dance industry forum official registration H5', () => {
  it('keeps the fixed slot and follows the approved three-chapter story', async () => {
    const html = await source('index.html');
    const expo = html.indexOf('第一章｜认识旅博会');
    const forum = html.indexOf('第二章｜街舞论坛');
    const workshop = html.indexOf('第三章｜产业研修班');

    expect(html).toContain('2026新兴文化产业发展大会｜街舞文化产业发展大会');
    expect(html).toContain('2026 中国文化和旅游产业博览会同期活动');
    expect(expo).toBeGreaterThan(-1);
    expect(forum).toBeGreaterThan(expo);
    expect(workshop).toBeGreaterThan(forum);
  });

  it('uses only the approved public claims and Wan phone link', async () => {
    const html = await source('index.html');

    expect(html).toContain('以主办方最终通知为准');
    expect(html).toContain('18526298357');
    expect(html).toContain('tel:18526298357');
    expect(html).not.toContain('assets/qr-wan.png');
    expect(html).not.toContain('assets/qr-tel.png');
    for (const claim of forbiddenPublicClaims) expect(html).not.toContain(claim);
  });

  it('ships the exact official dual QR, direct links and workshop promise poster', async () => {
    const html = await source('index.html');
    const qrUrl = new URL('assets/official/registration-qr.jpg', h5Root);

    expect(html).toContain('assets/official/registration-qr.jpg');
    expect(html).toContain(forumRegistration);
    expect(html).toContain(workshopConsultation);
    expect(html).toContain('打开论坛免费报名');
    expect(html).toContain('打开研修班官方咨询');
    expect(html).toContain('assets/web/official/workshop-promise.webp');
    expect(html.indexOf('workshop-promise.webp')).toBeLessThan(html.indexOf('id="join"'));
    await access(qrUrl);
    await access(new URL('assets/web/official/workshop-promise.webp', h5Root));
    const digest = createHash('sha256').update(await readFile(qrUrl)).digest('hex');
    expect(digest).toBe(registrationQrDigest);
  });

  it('lists fourteen speaker cards and their referenced WebP portraits', async () => {
    const html = await source('index.html');

    expect(html.match(/<article class="speak\b/g) ?? []).toHaveLength(14);
    for (const guest of expectedGuests) expect(html).toContain(`<h3>${guest}</h3>`);
    const portraits = [...html.matchAll(/<img src="(assets\/web\/guests\/[^"]+\.webp)"/g)]
      .map((match) => match[1]);
    expect(portraits).toHaveLength(14);
    for (const portrait of portraits) await access(new URL(portrait, h5Root));
  });

  it('renders the eight scheduled workshop course rows', async () => {
    const html = await source('index.html');

    expect(html.match(/<article class="cls reveal"><time>09\.0[67]/g) ?? []).toHaveLength(8);
    for (const course of expectedCourses) expect(html).toContain(`<h3>${course}</h3>`);
  });

  it('keeps every local asset present and images web-ready', async () => {
    const html = await source('index.html');
    for (const ref of localReferences(html)) await access(new URL(ref, h5Root));

    const images = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]);
    expect(images).toHaveLength(20);
    for (const image of images) {
      if (!image.endsWith('registration-qr.jpg')) expect(image).toMatch(/\.webp$/);
      expect((await stat(new URL(image, h5Root))).size).toBeLessThan(500_000);
    }
  });

  it('uses stable local typography and responsive registration controls', async () => {
    const [html, css, script] = await Promise.all([
      source('index.html'), source('css/main.css'), source('js/app.js'),
    ]);
    const combined = `${html}\n${css}\n${script}`;

    expect(combined).not.toMatch(/fonts\.googleapis|fonts\.gstatic|Google Fonts|@import\s+url/i);
    expect(css).toContain('PingFang SC');
    expect(css).toContain('overflow-x: clip');
    expect(css).toContain('@media (max-width: 560px)');
    expect(css).toContain('.registration-links { grid-template-columns: 1fr; }');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(script).toContain('IntersectionObserver');
    expect(combined).not.toMatch(/127\.0\.0\.1|192\.168\.|DIRECTUS_TOKEN|GITHUB_TOKEN|\/Users\//i);
  });
});
