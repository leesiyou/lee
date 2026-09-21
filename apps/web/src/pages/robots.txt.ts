import { runtimeConfig } from '@/lib/routes';

export const prerender = false;

export function GET() {
  const body = runtimeConfig().publicListingEnabled
    ? 'User-agent: *\nAllow: /\n'
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
