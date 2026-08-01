import { describe, expect, it } from 'vitest';

import { planBootstrap } from './initialize-directus';

describe('planBootstrap', () => {
  it('creates only missing collections and fields', () => {
    const operations = planBootstrap({
      collections: new Set(['articles']),
      fields: new Map([['articles', new Set(['id', 'title'])]]),
    });

    expect(operations.createCollections).not.toContain('articles');
    expect(operations.createCollections).toEqual(
      expect.arrayContaining(['categories', 'tags', 'authors', 'site_settings', 'template_presets']),
    );
    expect(operations.createFields.articles).not.toContain('id');
    expect(operations.createFields.articles).not.toContain('title');
    expect(operations.createFields.articles).toContain('slug');
  });

  it('is a no-op when the project model already exists', () => {
    const first = planBootstrap({ collections: new Set(), fields: new Map() });
    const existing = {
      collections: new Set(first.createCollections),
      fields: new Map(
        Object.entries(first.createFields).map(([collection, fields]) => [collection, new Set(fields)]),
      ),
    };
    const second = planBootstrap(existing);

    expect(second.createCollections).toEqual([]);
    expect(Object.values(second.createFields).flat()).toEqual([]);
  });
});
