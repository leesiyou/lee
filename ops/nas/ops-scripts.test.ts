import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('NAS operation scripts', () => {
  it('keeps generated secrets outside the repository and validates compose before deploy', async () => {
    const prepare = await readFile(new URL('./prepare-runtime.sh', import.meta.url), 'utf8');
    const deploy = await readFile(new URL('./deploy.sh', import.meta.url), 'utf8');
    const backupCron = await readFile(new URL('./install-backup-cron.sh', import.meta.url), 'utf8');

    expect(prepare).toContain('SECRETS_DIR="$PROJECT_ROOT/secrets"');
    expect(prepare).toContain('ENV_FILE="$SECRETS_DIR/.env"');
    expect(prepare).toContain("chmod 600 \"$ENV_FILE\"");
    expect(prepare).not.toContain('DIRECTUS_ADMIN_PASSWORD=changeme');
    expect(prepare).toContain("ensure_secret 'PREVIEW_SECRET'");
    expect(prepare).toContain("ensure_secret 'DIRECTUS_PREVIEW_TOKEN'");
    expect(deploy).toContain('config --quiet');
    expect(deploy).toContain('directus-extensions');
    expect(deploy).toContain('DOCKER_CONFIG="$PROJECT_ROOT/runtime/docker-config"');
    expect(deploy.indexOf('config --quiet')).toBeLessThan(deploy.indexOf(' up -d'));
    expect(deploy).not.toContain('docker compose down');
    expect(backupCron).toContain('0 3 * * *');
    expect(backupCron).toContain('30 3 * * 0');
    expect(backupCron).toContain('crontab-pre-blog-backup');
  });
});
