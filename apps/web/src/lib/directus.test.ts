import { describe, expect, it, vi } from 'vitest';

import {
  DirectusRequestError,
  buildPublishedArticleUrl,
  buildPublishedArticlesUrl,
  fetchPublishedArticle,
  fetchPublishedArticles,
} from './directus';

describe('buildPublishedArticlesUrl', () => {
  it('filters published articles whose publication time has arrived', () => {
    const url = new URL(
      buildPublishedArticlesUrl({
        baseUrl: 'http://directus:8055',
        now: new Date('2026-08-01T05:00:00.000Z'),
        limit: 12,
      }),
    );

    expect(url.pathname).toBe('/items/articles');
    expect(url.searchParams.get('filter[status][_eq]')).toBe('published');
    expect(url.searchParams.get('filter[published_at][_lte]')).toBe(
      '2026-08-01T05:00:00.000Z',
    );
    expect(url.searchParams.get('sort')).toBe('-published_at');
    expect(url.searchParams.get('limit')).toBe('12');
  });

  it('adds public search, category, tag, and featured filters', () => {
    const url = new URL(
      buildPublishedArticlesUrl({
        baseUrl: 'http://directus:8055',
        category: 'startup-business',
        featured: true,
        now: new Date('2026-08-01T05:00:00.000Z'),
        search: '现金流',
        tag: 'factory',
      }),
    );

    expect(url.searchParams.get('filter[category][slug][_eq]')).toBe('startup-business');
    expect(url.searchParams.get('filter[featured][_eq]')).toBe('true');
    expect(url.searchParams.get('filter[tags][tags_id][slug][_eq]')).toBe('factory');
    expect(url.searchParams.get('search')).toBe('现金流');
  });
});

describe('buildPublishedArticleUrl', () => {
  it('looks up one safe slug and keeps the publication gate', () => {
    const url = new URL(
      buildPublishedArticleUrl({
        baseUrl: 'http://directus:8055/',
        now: new Date('2026-08-01T05:00:00.000Z'),
        slug: 'startup-vs-speculation',
      }),
    );

    expect(url.searchParams.get('filter[slug][_eq]')).toBe('startup-vs-speculation');
    expect(url.searchParams.get('filter[status][_eq]')).toBe('published');
    expect(url.searchParams.get('filter[published_at][_lte]')).toBe(
      '2026-08-01T05:00:00.000Z',
    );
    expect(url.searchParams.get('limit')).toBe('1');
  });
});

describe('fetchPublishedArticles', () => {
  it('uses the public API without an authorization header', async () => {
    const request = vi.fn(async (_input: string | URL | RequestInfo, _init?: RequestInit) =>
      new Response(JSON.stringify({ data: [] }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      }),
    );

    await fetchPublishedArticles(
      {
        apiUrl: 'http://directus:8055',
        now: new Date('2026-08-01T05:00:00.000Z'),
      },
      request,
    );

    const [, init] = request.mock.calls[0] ?? [];
    expect(new Headers(init?.headers).has('authorization')).toBe(false);
  });

  it('normalizes an unavailable Directus response', async () => {
    const request = vi.fn(async (_input: string | URL | RequestInfo, _init?: RequestInit) =>
      new Response('unavailable', { status: 503 }),
    );

    await expect(
      fetchPublishedArticles(
        {
          apiUrl: 'http://directus:8055',
          now: new Date('2026-08-01T05:00:00.000Z'),
        },
        request,
      ),
    ).rejects.toEqual(new DirectusRequestError(503, '内容服务暂时不可用'));
  });
});

describe('fetchPublishedArticle', () => {
  it('returns the first matching article or null', async () => {
    const article = {
      id: 1,
      status: 'published',
      title: '创业，不是投机',
      slug: 'startup-vs-speculation',
      summary: '摘要',
      content: '<p>正文</p>',
      template: 'philosophy',
      published_at: '2026-08-01T04:00:00.000Z',
    } as const;
    const request = vi.fn(async () =>
      new Response(JSON.stringify({ data: [article] }), { status: 200 }),
    );

    await expect(
      fetchPublishedArticle(
        {
          apiUrl: 'http://directus:8055',
          now: new Date('2026-08-01T05:00:00.000Z'),
          slug: article.slug,
        },
        request,
      ),
    ).resolves.toEqual(article);

    request.mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));
    await expect(
      fetchPublishedArticle(
        {
          apiUrl: 'http://directus:8055',
          now: new Date('2026-08-01T05:00:00.000Z'),
          slug: 'missing',
        },
        request,
      ),
    ).resolves.toBeNull();
  });
});
