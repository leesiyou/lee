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

describe('xingzhiguang AI native transformation H5', () => {
  it('publishes a boss-facing AI Native transformation diagnosis', async () => {
    const [html, css, script] = await Promise.all([
      source('index.html'),
      source('css/style.css'),
      source('js/main.js'),
    ]);
    const combined = `${html}\n${css}\n${script}`;

    expect(html).toContain('星之光 T 恤供应链');
    expect(html).toContain('从传统加工企业到 AI Native 国际贸易组织');
    expect(html).toContain('AI 不是工具，是公司的中间层');
    expect(html).toContain('河北肃宁');
    expect(html).toContain('广州前端');
    expect(html).toContain('4500㎡');
    expect(html).toContain('约 200 万件现货');
    expect(html).toContain('两台服务器 + 一台 GPU');
    expect(html).toContain('外贸客户 3 个');
    expect(html).toContain('内销客户 3 个');
    expect(html).toContain('所有员工必须使用公司提供的 AI 工具');
    expect(html).toContain('AI 复盘回收所有员工的工作进度');
    expect(html).toContain('闭环且实战带转化的工作流');
    expect(html).toContain('https://myhooddaily.iepose.cn/h5/2026-08-13/xingzhiguang-ai-native-transformation/');
    expect(html).toContain('content="assets/ai-native-cover.svg"');
    expect(combined).not.toMatch(/127\.0\.0\.1|192\.168\.|DIRECTUS_TOKEN|\/Users\/|gazidaily|嘎子/);
    expect(html).not.toMatch(/<script[^>]+src="https?:\/\//);
  });

  it('defines the organization skeleton, operating loops, and department SOPs', async () => {
    const html = await source('index.html');

    for (const expected of [
      '老板驾驶舱',
      'AI 中台',
      '外贸增长组',
      '内销增长组',
      '仓储现货组',
      '产品供应链组',
      'HR 与训练组',
      '前端工程组',
      '询盘 → 报价 → 打样 → 下单 → 出库 → 复购',
      '客户 24 小时推进表',
      'SKU 现货健康表',
      '90 天转型路线图',
      '第 1-7 天：统一入口',
      '第 8-30 天：跑通闭环',
      '第 31-60 天：放大增长',
      '第 61-90 天：固化制度',
    ]) {
      expect(html).toContain(expected);
    }
  });

  it('keeps evidence boundaries and cites public industry sources', async () => {
    const html = await source('index.html');

    expect(html).toContain('公开资料');
    expect(html).toContain('现场诊断口径');
    expect(html).toContain('肃宁县星之光制衣有限公司');
    expect(html).toContain('成立于 2015 年');
    expect(html).toContain('年产量 1500 万件');
    expect(html).toContain('肃宁针纺相关生产企业 1200 余家');
    expect(html).toContain('广州拥有 187 家服装专业批发市场');
    expect(html).toContain('2024 年广州纺织服装大类商品出口 460.9 亿元');
    expect(html).toContain('https://www.douyin.com/user/MS4wLjABAAAAKXxYoXw3mN4H73sk8ncrGrmY-8eK3qFUsvGJnrbyzSM');
    expect(html).toContain('https://epaper.hbjjrb.com/Pad/jjrb/202507/11/con175848.html');
    expect(html).toContain('https://www.gz.gov.cn/zt/zzyyzq/bmdt/content/post_10472154.html');
    expect(html).toContain('https://www.mckinsey.com/capabilities/business-building/our-insights/the-seven-operating-truths-of-ai-native-companies');
  });

  it('includes local assets, mobile interaction, and copy-ready WeChat material', async () => {
    const [html, css, script, material] = await Promise.all([
      source('index.html'),
      source('css/style.css'),
      source('js/main.js'),
      readFile(wechatMaterial, 'utf8').catch(() => ''),
    ]);

    for (const asset of [
      'assets/ai-native-cover.svg',
      'assets/suning-guangzhou-map.svg',
      'assets/ai-organization-layer.svg',
    ]) {
      await access(new URL(asset, h5Root));
      expect(html).toContain(asset);
    }

    expect(html).toContain('id="reading-progress-bar"');
    expect(html).toContain('id="copy-url"');
    expect(html).toContain('id="copy-boss-summary"');
    expect(html).toContain('id="copy-sales-pitch"');
    expect(html).toContain('id="back-to-top"');
    expect(html).toContain('aria-live="polite"');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('env(safe-area-inset-bottom)');
    expect(script).toContain('IntersectionObserver');
    expect(script).toContain('navigator.clipboard.writeText');
    expect(material).toContain('公众号正文精华');
    expect(material).toContain('朋友圈文案');
    expect(material).toContain('阅读原文');
    expect(material).toContain('https://myhooddaily.iepose.cn/h5/2026-08-13/xingzhiguang-ai-native-transformation/');
    expect(material).not.toMatch(/127\.0\.0\.1|192\.168\.|DIRECTUS_TOKEN|\/Users\/|gazidaily|嘎子/);
  });
});
