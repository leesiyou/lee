import { describe, expect, it, vi } from 'vitest';

import { buildEditorFixture, fetchWithRateLimitRetry } from './verify-editor';

describe('Editor acceptance fixture', () => {
  it('starts private, leaves slug blank, and uses isolated category/tag slugs', () => {
    const fixture = buildEditorFixture('abc');

    expect(fixture.article.status).toBe('draft');
    expect(fixture.article.slug).toBeUndefined();
    expect(fixture.category.slug).toBe('acceptance-category-abc');
    expect(fixture.tag.slug).toBe('acceptance-tag-abc');
    expect(JSON.stringify(fixture)).not.toContain('token');
  });

  it('waits and retries a rate-limited Directus request', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('', { headers: { 'retry-after': '0.25' }, status: 429 }))
      .mockResolvedValueOnce(new Response('{"data":{}}', { status: 200 }));
    const sleep = vi.fn(async () => undefined);

    const response = await fetchWithRateLimitRetry('https://directus.test/items/articles/1', undefined, {
      fetcher,
      sleep,
    });

    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(300);
  });
});
