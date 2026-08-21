import type { APIRoute } from 'astro';

import reviewDocument from '@/content/china-street-dance-decade-review.html?raw';
import { fetchPublishedArticle } from '@/lib/directus';
import { buildPostUrl, runtimeConfig } from '@/lib/routes';

export const prerender = false;

const slug = 'china-street-dance-decade-review';

export const GET: APIRoute = async () => {
  const config = runtimeConfig();
  try {
    const article = await fetchPublishedArticle({
      apiUrl: config.directusInternalUrl,
      slug,
    });
    if (!article) {
      return new Response('文章不存在或尚未发布', {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
        status: 404,
      });
    }

    const canonical = buildPostUrl(slug, config);
    const cover = `${config.publicBaseUrl}/images/streetdance-decade-review-cover.png`;
    const html = reviewDocument
      .replaceAll('__CANONICAL_URL__', canonical)
      .replaceAll('__COVER_URL__', cover);

    return new Response(html, {
      headers: {
        'cache-control': 'public, max-age=60',
        'content-type': 'text/html; charset=utf-8',
      },
      status: 200,
    });
  } catch {
    return new Response('内容服务暂时不可用，请稍后刷新', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      status: 503,
    });
  }
};
