import { fetchPublishedArticles, fetchPublicCollection } from '@/lib/directus';
import { runtimeConfig } from '@/lib/routes';
import type { Category, Tag } from '@/lib/types';

export const prerender = false;

function xmlEscape(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character] ?? character);
}

export async function GET() {
  const config = runtimeConfig();
  const [articles, categories, tags] = await Promise.all([
    fetchPublishedArticles({ apiUrl: config.directusInternalUrl, limit: 1000 }).then((response) => response.data),
    fetchPublicCollection<Category>({ baseUrl: config.directusInternalUrl, collection: 'categories' }),
    fetchPublicCollection<Tag>({ baseUrl: config.directusInternalUrl, collection: 'tags' }),
  ]);
  const urls = [
    config.publicBaseUrl,
    `${config.publicBaseUrl}/archive`,
    `${config.publicBaseUrl}/search`,
    ...articles.map((article) => `${config.publicBaseUrl}/posts/${article.slug}`),
    ...categories.map((category) => `${config.publicBaseUrl}/category/${category.slug}`),
    ...tags.map((tag) => `${config.publicBaseUrl}/tag/${tag.slug}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${xmlEscape(url)}</loc></url>`).join('')}</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
