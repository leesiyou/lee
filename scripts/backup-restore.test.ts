import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('backup and restore operations', () => {
  it('backs up database, weekly uploads, configuration, versions, and checksums', async () => {
    const script = await readFile(new URL('./backup.sh', import.meta.url), 'utf8');

    expect(script).toContain('pg_dump -Fc');
    expect(script).toContain('directus-uploads.tgz');
    expect(script).toContain('infra/compose.yaml');
    expect(script).toContain('infra/Caddyfile');
    expect(script).toContain('infra/directus/schema.yaml');
    expect(script).toContain('SECRETS_EXCLUDED.txt');
    expect(script).toContain('NODE_XIAOBAO.txt');
    expect(script).toContain('sha256sum');
    expect(script).toContain('retain_count=7');
    expect(script).toContain('retain_count=4');
    expect(script).toContain('df -Pk');
  });

  it('requires an explicit archive and confirmation before a scoped restore', async () => {
    const script = await readFile(new URL('./restore.sh', import.meta.url), 'utf8');

    expect(script).toContain('Usage: CONFIRM_RESTORE=YES');
    expect(script).toContain('CONFIRM_RESTORE');
    expect(script).toContain('backup.sh" daily');
    expect(script).toContain('stop caddy web directus');
    expect(script).toContain('pg_restore --clean --if-exists');
    expect(script).toContain('uploads-pre-restore');
    expect(script).toContain('/server/ping');
    expect(script).not.toContain('docker compose down -v');
    expect(script).not.toContain('rm -rf "$RUNTIME_DIR"');
  });
});
