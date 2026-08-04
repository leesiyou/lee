import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const h5Root = new URL(
  '../../public/h5/2026-08-04/street-dance-professional-vs-hobby/',
  import.meta.url,
);

async function source(path: string): Promise<string> {
  return readFile(new URL(path, h5Root), 'utf8').catch(() => '');
}

describe('street dance professional versus hobby H5', () => {
  it('publishes the complete evidence-led story and twelve-question test', async () => {
    const html = await source('index.html');

    expect(html).toContain('热爱不是职业，职业也不比热爱高级');
    expect(html).toContain('街舞星球');
    expect(html).toContain('街舞加油站');
    expect(html.match(/class="quiz-question/g) ?? []).toHaveLength(12);
    for (const profile of ['casual', 'serious', 'builder', 'portfolio']) {
      expect(html).toContain(`data-profile="${profile}"`);
    }
    for (const section of ['economics', 'sociology', 'history', 'china', 'quiz', 'sources']) {
      expect(html).toContain(`id="${section}"`);
    }
    for (const name of ['Don Campbell', 'Phil Wizard', '刘清漪']) {
      expect(html).toContain(name);
    }
  });

  it('links primary or authoritative sources without inventing China market figures', async () => {
    const html = await source('index.html');

    for (const url of [
      'https://www.bls.gov/ooh/entertainment-and-sports/dancers-and-choreographers.htm',
      'https://nmaahc.si.edu/explore/stories/hip-hop-bronx',
      'https://doi.org/10.1111/j.1751-9020.2009.00233.x',
      'https://www.college-de-france.fr/media/sociologie-travail-createur/UPL2430709424450709910_Artistic_labor_1999.pdf',
      'https://www.istd.org/dance/dance-genres/street/',
      'https://campbellock.dance/about-locking/the-campbellock-timeline/',
      'https://www.philwizard.com/about',
      'https://www.sport.gov.cn/n14471/n14487/n14524/c25102120/content.html',
      'https://www.sport.gov.cn/n14471/n14487/n14524/c28617801/content.html',
      'https://www.sport.gov.cn/jts/n4999/c25018073/content.html',
      'https://www.sport.gov.cn/n14471/n14487/n14524/c28364121/content.html',
    ]) {
      expect(html).toContain(url);
    }
    expect(html).toContain('综合判断，不是全国从业统计');
    expect(html).not.toMatch(/128\.6|18432|全国街舞从业者|全国平均收入/);
  });

  it('keeps assets same-origin and blocks private or obsolete data', async () => {
    const [html, css, script] = await Promise.all([
      source('index.html'),
      source('css/style.css'),
      source('js/main.js'),
    ]);
    const combined = `${html}\n${css}\n${script}`;

    expect(html).toContain('href="css/style.css"');
    expect(html).toContain('src="js/main.js"');
    expect(html).toContain('src="assets/logo.webp"');
    expect(html).toContain('content="assets/wechat-poster.png"');
    expect(html).not.toMatch(/<script[^>]+src="https?:\/\//);
    expect(combined).not.toMatch(/127\.0\.0\.1|192\.168\.|\/Users\/|DIRECTUS_TOKEN|嘎子/);
  });

  it('implements accessible scoring, failure feedback, and reduced motion', async () => {
    const [html, css, script] = await Promise.all([
      source('index.html'),
      source('css/style.css'),
      source('js/main.js'),
    ]);

    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('id="copy-result"');
    expect(html).toContain('id="reset-quiz"');
    expect(html).toContain('id="back-to-top"');
    expect(css).toContain('env(safe-area-inset-bottom)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(script).toContain('function scoreProfile');
    expect(script).toContain('answers.size');
    expect(script).toContain('navigator.clipboard.writeText');
    expect(script).toContain('fallbackCopy');
    expect(script).toContain('缺少');
  });
});
