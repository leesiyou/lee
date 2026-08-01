import rss from '@astrojs/rss';

import { fetchPublishedArticles } from '@/lib/directus';
import { runtimeConfig } from '@/lib/routes';

export const prerender = false;

export async function GET() {
  const config = runtimeConfig();
  const articles = (await fetchPublishedArticles({ apiUrl: config.directusInternalUrl, limit: 100 })).data;
  return rss({
    description: '记录创业、制造、AI、文化与真实项目的长期实验。',
    items: articles.map((article) => ({
      description: article.summary,
      link: `/posts/${article.slug}`,
      pubDate: new Date(article.published_at),
      title: article.title,
    })),
    site: config.publicBaseUrl,
    title: '嘎子的创业实验室',
  });
}
