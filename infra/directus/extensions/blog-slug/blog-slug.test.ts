import { describe, expect, it, vi } from 'vitest';

import registerHook, { createSlug } from './dist/index.js';

describe('blog slug hook', () => {
  it('keeps a valid explicit slug and generates URL-safe values for blank slugs', async () => {
    const database = vi.fn(() => ({
      where: vi.fn(() => ({ first: vi.fn(async () => undefined) })),
    }));
    const generated = await createSlug({ title: '创业，不是投机' }, database, () => 'abc123');

    expect(generated).toBe('post-abc123');
    expect(await createSlug({ slug: 'kept-slug', title: 'Ignored' }, database, () => 'x')).toBe(
      'kept-slug',
    );
  });

  it('registers only the article create event and returns a filled payload', async () => {
    let handler: ((payload: Record<string, unknown>) => Promise<Record<string, unknown>>) | undefined;
    const filter = vi.fn((event: string, callback: typeof handler) => {
      expect(event).toBe('articles.items.create');
      handler = callback;
    });
    const database = vi.fn(() => ({
      where: vi.fn(() => ({ first: vi.fn(async () => undefined) })),
    }));

    registerHook({ filter }, { database });
    expect(handler).toBeDefined();
    await expect(handler?.({ title: 'Cash Flow' })).resolves.toMatchObject({ slug: 'cash-flow' });
  });
});
