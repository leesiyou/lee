import { describe, expect, it } from 'vitest';

import {
  buildTableOfContents,
  buildWechatMaterial,
  calculateReadingMinutes,
  renderStructuredBlocks,
  sanitizeArticleHtml,
} from './content';
import type { Article } from './types';

const article: Article = {
  id: 1,
  status: 'published',
  title: '创业，不是投机',
  slug: 'startup-vs-speculation',
  summary: '创业不是寻找一次价格波动，而是持续建立价值。',
  content:
    '<h2>核心矛盾</h2><p>创业是在不确定中建设。</p><p>投机是在波动中押注。</p><blockquote>时间会放大真实能力。</blockquote>',
  template: 'philosophy',
  published_at: '2026-08-01T04:00:00.000Z',
};

describe('sanitizeArticleHtml', () => {
  it('removes scripts, event handlers, dangerous URLs, and embeds', () => {
    const input =
      '<h2 onclick="alert(1)">标题</h2><script>alert(1)</script><p><a href="javascript:alert(1)">危险</a></p><iframe src="https://bad.example"></iframe>';
    const output = sanitizeArticleHtml(input);

    expect(output).toContain('<h2>标题</h2>');
    expect(output).not.toContain('script');
    expect(output).not.toContain('onclick');
    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('iframe');
  });

  it('keeps useful Chinese article markup and safe image attributes', () => {
    const input =
      '<p><strong>重点</strong></p><img src="/assets/abc" alt="封面" width="1200" height="630" loading="lazy">';
    const output = sanitizeArticleHtml(input);
    expect(output).toContain('<p><strong>重点</strong></p>');
    expect(output).toContain('src="/assets/abc"');
    expect(output).toContain('alt="封面"');
    expect(output).toContain('width="1200"');
    expect(output).toContain('height="630"');
    expect(output).toContain('loading="lazy"');
  });
});

describe('article helpers', () => {
  it('calculates at least one minute and extracts a stable heading id', () => {
    expect(calculateReadingMinutes('很短的正文')).toBe(1);
    expect(buildTableOfContents(article.content)).toEqual([
      { depth: 2, id: '核心矛盾', text: '核心矛盾' },
    ]);
  });

  it('renders supported Editor.js blocks and strips executable markup', () => {
    const output = renderStructuredBlocks({
      blocks: [
        { type: 'header', data: { level: 2, text: '结构化标题' } },
        { type: 'paragraph', data: { text: '安全正文<script>alert(1)</script>' } },
        { type: 'list', data: { style: 'ordered', items: ['第一步', '第二步'] } },
        { type: 'quote', data: { text: '长期主义', caption: '嘎子' } },
      ],
    });

    expect(output).toContain('<h2>结构化标题</h2>');
    expect(output).toContain('<ol><li>第一步</li><li>第二步</li></ol>');
    expect(output).toContain('<blockquote><p>长期主义</p><figcaption>嘎子</figcaption></blockquote>');
    expect(output).not.toContain('<script');
  });
});

describe('buildWechatMaterial', () => {
  it('creates manual publishing material from the configured public URL', () => {
    expect(buildWechatMaterial(article, 'https://blog.example.com/')).toMatchObject({
      title: '创业，不是投机',
      summary: article.summary,
      sourceUrl: 'https://blog.example.com/posts/startup-vs-speculation',
      quote: '时间会放大真实能力。',
      highlights: ['创业是在不确定中建设。', '投机是在波动中押注。'],
    });
  });
});
