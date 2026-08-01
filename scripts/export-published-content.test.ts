import { describe, expect, it } from 'vitest';

import {
  buildExportUrl,
  exportRelativePath,
  renderArticleMarkdown,
  type ExportArticle,
} from './export-published-content';

const article: ExportArticle = {
  category: { name: '创业与商业' },
  content: '<h2>正文</h2><p>长期创造价值。</p>',
  cover_image: { id: 'file-id' },
  published_at: '2026-08-01T01:02:03.000Z',
  slug: 'startup-vs-speculation',
  status: 'published',
  summary: '创业与投机的区别',
  tags: [{ tags_id: { name: '长期主义' } }],
  template: 'philosophy',
  title: '创业，不是投机',
  updated_at: '2026-08-01T02:03:04.000Z',
};

describe('published content export', () => {
  it('queries only published and already-due articles without authentication', () => {
    const url = new URL(buildExportUrl('http://directus:8055', new Date('2026-08-01T03:00:00Z')));

    expect(url.searchParams.get('filter[status][_eq]')).toBe('published');
    expect(url.searchParams.get('filter[published_at][_lte]')).toBe('2026-08-01T03:00:00.000Z');
    expect(url.searchParams.get('access_token')).toBeNull();
    expect(url.searchParams.get('fields')).not.toContain('author');
  });

  it('writes the required dated path and frontmatter without admin data', () => {
    expect(exportRelativePath(article)).toBe('2026/08/startup-vs-speculation.md');
    const markdown = renderArticleMarkdown(article, 'http://admin.example.invalid');

    for (const field of [
      'title:', 'slug:', 'summary:', 'category:', 'tags:', 'published_at:', 'updated_at:',
      'cover:', 'template:',
    ]) {
      expect(markdown).toContain(field);
    }
    expect(markdown).toContain('<h2>正文</h2>');
    expect(markdown).not.toContain('author');
    expect(markdown).not.toContain('token');
  });

  it('rejects unsafe slugs and non-published records', () => {
    expect(() => exportRelativePath({ ...article, slug: '../escape' })).toThrow('unsafe slug');
    expect(() => renderArticleMarkdown({ ...article, status: 'draft' }, 'http://directus')).toThrow(
      'published',
    );
  });
});
