import { access, readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const h5Root = new URL(
  '../../public/h5/2026-08-13/xingzhiguang-ai-native-transformation/',
  import.meta.url,
);
const wechatMaterial = new URL(
  '../../../../content-export/2026/08/xingzhiguang-ai-native-transformation-wechat.md',
  import.meta.url,
);

async function source(path: string): Promise<string> {
  return readFile(new URL(path, h5Root), 'utf8').catch(() => '');
}

describe('xingzhiguang market-gap decision H5', () => {
  it('opens with a boss-facing market decision instead of an AI transformation pitch', async () => {
    const html = await source('index.html');

    expect(html).toContain('星之光 T 恤市场缝隙决策报告');
    expect(html).toContain('给李总的核心结论');
    expect(html).toContain('市场不缺更便宜的 T 恤，缺的是可重复采购的供应服务');
    expect(html).toContain('河北自营工厂');
    expect(html).toContain('广州自有仓库');
    expect(html).toContain('广州销售团队');
    expect(html).toContain('印花厂、团服客户和小批量品牌客户');
    expect(html).toContain('2026.08.14');
    expect(html).not.toContain('2026.08.15');
    expect(html).not.toContain('从传统加工企业到 AI Native 国际贸易组织');
    expect(html).not.toContain('AI 不是工具，是公司的中间层');
    expect(html).toContain(
      'https://myhooddaily.iepose.cn/h5/2026-08-13/xingzhiguang-ai-native-transformation/',
    );
  });

  it('builds the data compass with explicit scope and evidence boundaries', async () => {
    const html = await source('index.html');

    for (const expected of [
      '数据罗盘',
      '2024｜近 200 亿元',
      '2025｜175 亿元',
      '2026｜140 亿元',
      '口径不同，不能直接计算涨跌',
      '10 亿件',
      'T 恤、保暖内衣、运动卫衣等针织服饰',
      '80%',
      '近 2 亿单',
      'A｜官方与权威媒体',
      'B｜平台商家自报',
      'C｜企业内部待确认',
      '23 家可见样本',
      '固定样本，不是全量普查',
      '服务响应率，不是准时履约率',
    ]) {
      expect(html).toContain(expected);
    }

    expect(html).not.toMatch(/两年(?:下降|下滑|减少)\s*30%/);
    expect(html).not.toMatch(/星之光.{0,12}(?:履约率|准时履约).{0,8}(?:68|69)%/s);
    expect(html).not.toMatch(/(?:盛元.{0,8}97%|兰泽.{0,8}99%|三海鲸.{0,8}92%)/s);
  });

  it('answers the market gap, competition, risk, and strategic-choice questions', async () => {
    const html = await source('index.html');

    for (const expected of [
      '四个可抢的市场缝隙',
      '标准货号',
      '分层起订',
      '河北制造 × 广州履约',
      '批次证据',
      '肃宁工厂群',
      '库员外',
      '三海鲸',
      'AG / Gildan',
      '星之光如何对抗',
      '明确不做',
      '不打全网最低价战争',
      '不一次铺几百个 SKU',
      '不把未验证的外贸能力包装成订单',
      '风险与止损线',
      '价格与毛利',
      '库存与现金',
      '批次质量',
      '河北—广州断层',
      '数据失真',
      'AI 越权承诺',
    ]) {
      expect(html).toContain(expected);
    }
  });

  it('uses AI organization and SOP only as the 90-day execution system', async () => {
    const html = await source('index.html');

    for (const expected of [
      '全新 AI 组织架构',
      'AI 经营办公室',
      '商品标准组',
      '河北生产单元',
      '广州仓配单元',
      '销售增长单元',
      '质量与数据官',
      '询盘 → 选款 → 报价 → 打样 → 下单 → 生产/备货 → 质检 → 发货 → 复购',
      '90 天证据计划',
      '0—30 天｜冻结标准',
      '31—60 天｜跑通小闭环',
      '61—90 天｜凭证据扩张',
      '待李总确认',
      '建议目标',
    ]) {
      expect(html).toContain(expected);
    }

    expect(html.indexOf('四个可抢的市场缝隙')).toBeLessThan(html.indexOf('全新 AI 组织架构'));
  });

  it('cites official sources and remains self-contained, mobile-safe, and secret-free', async () => {
    const [html, css, script, material] = await Promise.all([
      source('index.html'),
      source('css/style.css'),
      source('js/main.js'),
      readFile(wechatMaterial, 'utf8').catch(() => ''),
    ]);
    const combined = `${html}\n${css}\n${script}\n${material}`;

    for (const url of [
      'http://epaper.hbjjrb.com/att/202507/11/c4028f68-e325-43b8-aaf5-223b7aa044d4.pdf',
      'http://he.people.com.cn/n2/2026/0731/c192235-41656085.html',
      'https://suning.gov.cn/suning/ADD06333/202603/db9d8119ccf34a9cb997ee529956cf40.shtml',
    ]) {
      expect(html).toContain(url);
    }

    for (const asset of [
      'assets/ai-native-cover.svg',
      'assets/suning-guangzhou-map.svg',
      'assets/ai-organization-layer.svg',
    ]) {
      await access(new URL(asset, h5Root));
      expect(html).toContain(asset);
    }

    expect(html).toContain('id="reading-progress-bar"');
    expect(html).toContain('id="section-nav"');
    expect(html).toContain('id="source-register"');
    expect(html).toContain('id="copy-url"');
    expect(html).toContain('id="back-to-top"');
    expect(html).toContain('aria-live="polite"');
    expect(css).toContain('@media (max-width: 720px)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('overflow-wrap: anywhere');
    expect(script).toContain('IntersectionObserver');
    expect(script).toContain('navigator.clipboard.writeText');
    expect(material).toContain('市场缝隙决策报告');
    expect(material).toContain('阅读原文');
    expect(combined).not.toMatch(
      /127\.0\.0\.1|192\.168\.|DIRECTUS_TOKEN|BEGIN [A-Z ]*PRIVATE KEY|\/Users\/|gazidaily|嘎子/,
    );
    expect(html).not.toMatch(/<script[^>]+src="https?:\/\//);
  });
});
