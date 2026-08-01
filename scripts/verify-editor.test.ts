import { describe, expect, it } from 'vitest';

import { buildEditorFixture } from './verify-editor';

describe('Editor acceptance fixture', () => {
  it('starts private, leaves slug blank, and uses isolated category/tag slugs', () => {
    const fixture = buildEditorFixture('abc');

    expect(fixture.article.status).toBe('draft');
    expect(fixture.article.slug).toBeUndefined();
    expect(fixture.category.slug).toBe('acceptance-category-abc');
    expect(fixture.tag.slug).toBe('acceptance-tag-abc');
    expect(JSON.stringify(fixture)).not.toContain('token');
  });
});
