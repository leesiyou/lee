import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('NAS deploy poller', () => {
  it('locks, updates only web, verifies health, and rolls back by immutable image id', async () => {
    const script = await readFile(new URL('./deploy-poller.sh', import.meta.url), 'utf8');

    expect(script).toContain('flock -n');
    expect(script).toContain('pull "$candidate_image"');
    expect(script).toContain('--no-deps --force-recreate web');
    expect(script).toContain('previous_image_id');
    expect(script).toContain('rollback');
    expect(script).toContain('.State.Health.Status');
    expect(script).not.toMatch(/up -d\s+(postgres|redis|directus|caddy)/);
    expect(script).not.toContain('docker compose down');
  });

  it('installs a two-minute schedule without discarding the current crontab', async () => {
    const script = await readFile(new URL('./install-deploy-poller.sh', import.meta.url), 'utf8');

    expect(script).toContain('*/2 * * * *');
    expect(script).toContain('deploy-poller.log');
    expect(script).toContain('crontab-pre-deploy-poller');
  });
});
