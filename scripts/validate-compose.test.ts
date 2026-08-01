import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

interface Service {
  depends_on?: Record<string, { condition?: string }>;
  deploy?: { resources?: { limits?: Record<string, string> } };
  healthcheck?: Record<string, unknown>;
  environment?: Record<string, string>;
  image?: string;
  logging?: { options?: Record<string, string> };
  networks?: string[];
  ports?: string[];
  restart?: string;
}

describe('production compose', () => {
  it('isolates data services and applies every operational guardrail', async () => {
    const source = await readFile(new URL('../infra/compose.yaml', import.meta.url), 'utf8');
    const compose = parse(source, { merge: true }) as {
      networks: Record<string, { internal?: boolean }>;
      services: Record<string, Service>;
    };
    const services = compose.services;

    expect(Object.keys(services)).toEqual(['postgres', 'redis', 'directus', 'web', 'caddy']);
    expect(services.postgres.image).toBe('postgres:16.14-alpine');
    expect(services.redis.image).toBe('redis:7.4.10-alpine');
    expect(services.directus.image).toBe('directus/directus:11.17.4');
    expect(services.directus.environment?.REDIS).toBe('redis://:${REDIS_PASSWORD}@redis:6379/0');
    expect(services.directus.environment?.CACHE_REDIS).toBeUndefined();
    expect(services.directus.environment?.RATE_LIMITER_REDIS).toBeUndefined();
    expect(services.directus.environment?.FILES_MAX_UPLOAD_SIZE).toBe('20mb');
    expect(services.directus.environment?.FILES_MIME_TYPE_ALLOW_LIST).toBe(
      'image/jpeg,image/png,image/webp,image/avif,image/gif',
    );
    expect(JSON.stringify(services.directus.healthcheck)).toContain('/server/ping');
    expect(services.caddy.image).toBe('caddy:2.11.4-alpine');
    expect(services.postgres.ports).toBeUndefined();
    expect(services.redis.ports).toBeUndefined();
    expect(services.directus.ports).toBeUndefined();
    expect(services.web.ports).toBeUndefined();
    expect(services.caddy.ports).toEqual(['19080:8080', '19081:8081']);
    expect(compose.networks.blog_internal.internal).toBe(true);
    expect(compose.networks.blog_egress.internal).not.toBe(true);
    expect(services.web.networks).toEqual(['blog_internal', 'blog_egress']);
    expect(services.web.environment?.DIRECTUS_PREVIEW_TOKEN).toBe('${DIRECTUS_PREVIEW_TOKEN}');
    expect(services.web.environment?.PREVIEW_SECRET).toBe('${PREVIEW_SECRET}');
    expect(services.caddy.networks).toEqual(['blog_internal', 'blog_egress']);
    expect(services.postgres.networks).toEqual(['blog_internal']);
    expect(services.redis.networks).toEqual(['blog_internal']);

    for (const service of Object.values(services)) {
      expect(service.restart).toBe('unless-stopped');
      expect(service.healthcheck).toBeTruthy();
      expect(service.logging?.options).toMatchObject({ 'max-file': '5', 'max-size': '10m' });
      expect(service.deploy?.resources?.limits).toBeTruthy();
      expect(service.networks).toContain('blog_internal');
    }
    expect(services.directus.depends_on?.postgres.condition).toBe('service_healthy');
    expect(services.directus.depends_on?.redis.condition).toBe('service_healthy');
    expect(services.caddy.depends_on?.web.condition).toBe('service_healthy');
    expect(services.caddy.depends_on?.directus.condition).toBe('service_healthy');
  });

  it('keeps public assets immutable without duplicate upstream cache headers', async () => {
    const caddy = await readFile(new URL('../infra/Caddyfile', import.meta.url), 'utf8');

    expect(caddy).toContain('/scripts/*');
    expect(caddy).toContain('>Cache-Control "public, max-age=31536000, immutable"');
  });
});
