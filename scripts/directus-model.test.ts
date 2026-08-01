import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';

import {
  articleStatuses,
  collections,
  defaultAuthor,
  defaultCategories,
  defaultSiteSettings,
  defaultTemplatePresets,
  editorAllowedCollections,
  editorDeniedSystemCollections,
  publicArticleFilter,
  slugifyTitle,
} from './directus-model';

describe('Directus blog model', () => {
  it('defines every required article field and status', () => {
    const articleFields = collections.articles.fields.map((field) => field.field);
    expect(articleFields).toEqual(
      expect.arrayContaining([
        'id', 'status', 'title', 'slug', 'subtitle', 'summary', 'content', 'cover_image',
        'share_image', 'template', 'theme', 'author', 'category', 'tags', 'featured',
        'published_at', 'created_at', 'updated_at', 'seo_title', 'seo_description',
        'seo_keywords', 'wechat_title', 'wechat_summary', 'wechat_cover', 'wechat_content',
        'reading_minutes', 'sort',
      ]),
    );
    expect(articleStatuses).toEqual(['draft', 'scheduled', 'published', 'archived']);
  });

  it('defines seven categories, four templates, the default author, and site name', () => {
    expect(defaultCategories.map((item) => item.name)).toEqual([
      '创业与商业', '工厂与制造', 'AI 与效率', '街舞与文化', '羽毛球馆实战', '创业日记', '项目复盘',
    ]);
    expect(defaultTemplatePresets.map((item) => item.name)).toEqual([
      '哲学思辨', '商业拆解', '创业日记', '项目复盘',
    ]);
    expect(defaultAuthor.name).toBe('嘎子');
    expect(defaultSiteSettings.site_name).toBe('嘎子的创业实验室');
  });

  it('limits public reads and keeps Editor away from system administration', () => {
    expect(publicArticleFilter).toEqual({
      _and: [
        { status: { _eq: 'published' } },
        { published_at: { _lte: '$NOW' } },
      ],
    });
    expect(editorAllowedCollections).toEqual(
      expect.arrayContaining(['articles', 'categories', 'tags', 'directus_files']),
    );
    expect(editorDeniedSystemCollections).toEqual(
      expect.arrayContaining(['directus_users', 'directus_roles', 'directus_settings', 'directus_extensions']),
    );
  });

  it('generates a URL-safe deterministic identifier for Chinese titles', () => {
    const slug = slugifyTitle('创业，不是投机', '2026-08-01T00:00:00Z');
    expect(slug).toMatch(/^post-[a-f0-9]{10}$/);
    expect(slugifyTitle('Cash Flow Is Survival', 'seed')).toBe('cash-flow-is-survival');
  });
});

describe('first formal article', () => {
  it('contains a complete philosophy article instead of placeholder copy', async () => {
    const path = new URL('../content/first-article.json', import.meta.url);
    const article = JSON.parse(await readFile(path, 'utf8')) as Record<string, string>;

    expect(article.title).toBe('创业，不是投机');
    expect(article.slug).toBe('startup-vs-speculation');
    expect(article.status).toBe('published');
    expect(article.template).toBe('philosophy');
    expect(article.content.length).toBeGreaterThan(1500);
    for (const section of ['核心矛盾', '时间', '价值', '风险', '能力', '关系', '失败', '终局']) {
      expect(article.content).toContain(section);
    }
  });
});
