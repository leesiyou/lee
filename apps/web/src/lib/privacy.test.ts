import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveRuntimeConfig } from './routes';

const page = (name: string) =>
  readFileSync(resolve(import.meta.dirname, '../pages', name), 'utf8');

describe('unlisted diary mode', () => {
  it('defaults to hiding the public directory and allows explicit opt-in', () => {
    const base = resolveRuntimeConfig({});
    const enabled = resolveRuntimeConfig({ PUBLIC_LISTING_ENABLED: 'true' });

    expect(base.publicListingEnabled).toBe(false);
    expect(enabled.publicListingEnabled).toBe(true);
  });

  it('keeps direct articles shareable while removing public discovery surfaces', () => {
    expect(page('index.astro')).toContain('publicListingEnabled');
    expect(page('posts/[slug].astro')).toContain('publicListingEnabled');
    expect(page('archive.astro')).toContain('publicListingEnabled');
    expect(page('search.astro')).toContain('publicListingEnabled');
    expect(page('category/[slug].astro')).toContain('publicListingEnabled');
    expect(page('tag/[slug].astro')).toContain('publicListingEnabled');
    expect(page('rss.xml.ts')).toContain('publicListingEnabled');
    expect(page('sitemap.xml.ts')).toContain('publicListingEnabled');
    expect(page('../layouts/BaseLayout.astro')).toContain('noindex, nofollow');
    expect(page('robots.txt.ts')).toContain('Disallow: /');
    expect(existsSync(resolve(import.meta.dirname, '../../public/h5/2026-08-07/startup-failure-diagnosis/index.html'))).toBe(true);
  });
});
