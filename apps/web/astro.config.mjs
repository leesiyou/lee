import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  integrations: [sitemap()],
  output: 'server',
  server: { host: true, port: 4321 },
});
