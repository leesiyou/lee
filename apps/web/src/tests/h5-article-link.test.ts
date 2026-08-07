import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';

async function loadArticleLink(): Promise<Record<string, unknown>> {
  try {
    return await import('../lib/article-link');
  } catch {
    return {};
  }
}

describe('H5 article links', () => {
  it('uses a validated same-origin H5 path and falls back for unsafe values', async () => {
    const module = await loadArticleLink();
    expect(typeof module.articleHref).toBe('function');
    if (typeof module.articleHref !== 'function') return;

    const articleHref = module.articleHref as (article: {
      h5_path?: string | null;
      slug: string;
    }) => string;

    expect(
      articleHref({
        h5_path: '/h5/2026-08-07/startup-failure-diagnosis/',
        slug: 'startup-failure-diagnosis',
      }),
    ).toBe('/h5/2026-08-07/startup-failure-diagnosis/');
    expect(articleHref({ h5_path: null, slug: 'ordinary-post' })).toBe('/posts/ordinary-post');
    expect(articleHref({ h5_path: 'https://evil.example/h5/demo/', slug: 'external' })).toBe(
      '/posts/external',
    );
    expect(articleHref({ h5_path: '/h5//demo/', slug: 'double-slash' })).toBe(
      '/posts/double-slash',
    );
    expect(articleHref({ h5_path: '/h5/../admin/', slug: 'traversal' })).toBe(
      '/posts/traversal',
    );
  });

  it('uses the shared H5 link in cards, post redirects and the Directus model', async () => {
    const [card, postRoute, model, schema] = await Promise.all([
      readFile(new URL('../components/ArticleCard.astro', import.meta.url), 'utf8'),
      readFile(new URL('../pages/posts/[slug].astro', import.meta.url), 'utf8'),
      readFile(new URL('../../../../scripts/directus-model.ts', import.meta.url), 'utf8'),
      readFile(new URL('../../../../infra/directus/schema.yaml', import.meta.url), 'utf8'),
    ]);

    expect(card).toContain("import { articleHref } from '@/lib/article-link';");
    expect(card).toContain('const href = articleHref(article);');
    expect(postRoute).toContain("import { articleHref } from '@/lib/article-link';");
    expect(postRoute).toContain('return Astro.redirect(articleHref(article), 302);');
    expect(model).toContain("{ field: 'h5_path'");
    expect(schema).toContain('field: h5_path');
  });
});
