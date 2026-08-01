import { describe, expect, it } from 'vitest';

import { GET } from '../pages/health';

describe('GET /health', () => {
  it('returns a machine-readable healthy response', async () => {
    const response = await GET({} as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });
});
