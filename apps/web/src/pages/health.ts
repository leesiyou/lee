import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () =>
  new Response(JSON.stringify({ status: 'ok' }), {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    },
    status: 200,
  });
