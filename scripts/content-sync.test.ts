import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('GitHub published content sync', () => {
  it('uses a dedicated least-privilege token file and content-backup branch', async () => {
    const script = await readFile(new URL('./sync-content-backup.sh', import.meta.url), 'utf8');

    expect(script).toContain('secrets/github-content-token');
    expect(script).toContain('token_mode');
    expect(script).toContain('GIT_ASKPASS');
    expect(script).toContain('content-backup');
    expect(script).toContain('content: sync published articles');
    expect(script).toContain("DIRECTUS_PUBLIC_URL='http://127.0.0.1:18055'");
    expect(script).not.toMatch(/19080|19081/);
    expect(script).toContain('git diff --cached --quiet');
    expect(script).not.toContain('gh auth token');
    expect(script).not.toContain('https://$GITHUB_CONTENT_TOKEN@');
  });

  it('runs daily from an isolated log and preserves the previous crontab', async () => {
    const script = await readFile(new URL('../ops/nas/install-content-cron.sh', import.meta.url), 'utf8');

    expect(script).toContain('15 4 * * *');
    expect(script).toContain('content-sync.log');
    expect(script).toContain('crontab-pre-content-sync');
  });
});
