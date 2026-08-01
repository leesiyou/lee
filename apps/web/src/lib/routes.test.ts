import { describe, expect, it } from 'vitest';

import { buildAssetUrl, buildPostUrl, resolveRuntimeConfig } from './routes';

describe('route helpers', () => {
  it('builds canonical post and Directus asset URLs from runtime configuration', () => {
    const config = resolveRuntimeConfig({
      DIRECTUS_INTERNAL_URL: 'http://directus:8055/',
      DIRECTUS_PUBLIC_URL: 'https://admin.example.com/',
      PUBLIC_ADMIN_URL: 'https://admin.example.com/',
      PUBLIC_BASE_URL: 'https://blog.example.com/',
    });

    expect(buildPostUrl('startup-vs-speculation', config)).toBe(
      'https://blog.example.com/posts/startup-vs-speculation',
    );
    expect(buildAssetUrl('file-id', config)).toBe('https://admin.example.com/assets/file-id');
  });

  it('rejects non-http public URLs instead of emitting unsafe links', () => {
    expect(() =>
      resolveRuntimeConfig({
        DIRECTUS_INTERNAL_URL: 'http://directus:8055',
        DIRECTUS_PUBLIC_URL: 'javascript:alert(1)',
        PUBLIC_ADMIN_URL: 'http://192.168.5.104:19081',
        PUBLIC_BASE_URL: 'http://192.168.5.104:19080',
      }),
    ).toThrow('DIRECTUS_PUBLIC_URL must use http or https');
  });
});
