import { describe, expect, it } from 'vitest';

import { buildAcceptanceFixtures } from './verify-live';

describe('live acceptance fixtures', () => {
  it('separates draft, future schedule, and due schedule publication gates', () => {
    const now = new Date('2026-08-01T06:00:00.000Z');
    const fixtures = buildAcceptanceFixtures(now, 'test');

    expect(fixtures.draft.status).toBe('draft');
    expect(fixtures.draft.slug).toBeUndefined();
    expect(new Date(fixtures.future.published_at).getTime()).toBeGreaterThan(now.getTime());
    expect(fixtures.future.status).toBe('scheduled');
    expect(new Date(fixtures.due.published_at).getTime()).toBeLessThan(now.getTime());
    expect(fixtures.due.status).toBe('scheduled');
  });
});
