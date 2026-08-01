import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('WeChat automation route', () => {
  it('returns HTTP success only for the material-ready fallback', async () => {
    const source = await readFile(new URL('./draft.ts', import.meta.url), 'utf8');

    expect(source).toContain("availability.status === 'material_ready' ? 200 : 503");
    expect(source).toContain('return Response.json(availability');
    expect(source).toContain("{ status: 401 }");
  });
});
