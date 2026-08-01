import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

describe('GitHub workflows', () => {
  it('runs the complete verification gate including Docker and Compose', async () => {
    const source = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

    for (const command of [
      'npm ci', 'npm run typecheck', 'npm run lint', 'npm test', 'npm run build',
      'npm run check:compose', 'docker build',
    ]) {
      expect(source).toContain(command);
    }
    expect(source).not.toMatch(/PASSWORD:\s+[^$\s]/);
  });

  it('publishes GHCR with least permissions and immutable trace tags', async () => {
    const source = await readFile(
      new URL('../.github/workflows/publish-image.yml', import.meta.url),
      'utf8',
    );
    const workflow = parse(source) as Record<string, unknown>;

    expect(workflow).toBeTruthy();
    expect(source).toContain('ghcr.io/leesiyou/lee-web');
    expect(source).toContain('packages: write');
    expect(source).toContain('main-');
    expect(source).toContain('type=ref,event=tag');
    expect(source).toContain('org.opencontainers.image.source');
    expect(source).toContain('org.opencontainers.image.revision');
    expect(source).toContain('org.opencontainers.image.created');
    expect(source).not.toContain('NAS_PASSWORD');
    expect(source).not.toContain('DIRECTUS_SECRET');
  });
});
