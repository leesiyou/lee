import type { Article, DirectusListResponse } from './types';

export class DirectusRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'DirectusRequestError';
    this.status = status;
  }
}

interface PublishedArticlesUrlOptions {
  baseUrl: string;
  category?: string;
  featured?: boolean;
  limit?: number;
  now: Date;
  offset?: number;
  search?: string;
  tag?: string;
}

interface PublishedArticlesOptions {
  apiUrl: string;
  category?: string;
  featured?: boolean;
  limit?: number;
  now?: Date;
  offset?: number;
  search?: string;
  tag?: string;
}

interface PublishedArticleUrlOptions {
  baseUrl: string;
  now: Date;
  slug: string;
}

interface PublishedArticleOptions {
  apiUrl: string;
  now?: Date;
  slug: string;
}

type Request = (input: string | URL | RequestInfo, init?: RequestInit) => Promise<Response>;
type PublicCollection = 'authors' | 'categories' | 'site_settings' | 'tags' | 'template_presets';

interface PublicCollectionUrlOptions {
  baseUrl: string;
  collection: string;
  fields?: string;
  limit?: number;
  sort?: string;
}

const articleFields = [
  '*',
  'cover_image.id',
  'cover_image.width',
  'cover_image.height',
  'cover_image.title',
  'category.id',
  'category.name',
  'category.slug',
  'author.id',
  'author.name',
  'author.bio',
  'author.avatar',
  'tags.tags_id.id',
  'tags.tags_id.name',
  'tags.tags_id.slug',
].join(',');

function normalizedBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export function buildPublishedArticlesUrl(options: PublishedArticlesUrlOptions): string {
  const url = new URL(`${normalizedBaseUrl(options.baseUrl)}/items/articles`);
  url.searchParams.set('filter[status][_eq]', 'published');
  url.searchParams.set('filter[published_at][_lte]', options.now.toISOString());
  url.searchParams.set('sort', '-published_at');
  url.searchParams.set('limit', String(options.limit ?? 20));
  url.searchParams.set('offset', String(options.offset ?? 0));
  url.searchParams.set('fields', articleFields);
  url.searchParams.set('meta', 'filter_count');
  if (options.category) {
    url.searchParams.set('filter[category][slug][_eq]', options.category);
  }
  if (options.featured !== undefined) {
    url.searchParams.set('filter[featured][_eq]', String(options.featured));
  }
  if (options.tag) {
    url.searchParams.set('filter[tags][tags_id][slug][_eq]', options.tag);
  }
  if (options.search?.trim()) {
    url.searchParams.set('search', options.search.trim());
  }
  return url.toString();
}

export function buildPublishedArticleUrl(options: PublishedArticleUrlOptions): string {
  const url = new URL(`${normalizedBaseUrl(options.baseUrl)}/items/articles`);
  url.searchParams.set('filter[slug][_eq]', options.slug);
  url.searchParams.set('filter[status][_eq]', 'published');
  url.searchParams.set('filter[published_at][_lte]', options.now.toISOString());
  url.searchParams.set('limit', '1');
  url.searchParams.set('fields', articleFields);
  return url.toString();
}

const publicCollections = new Set<PublicCollection>([
  'authors',
  'categories',
  'site_settings',
  'tags',
  'template_presets',
]);

export function buildPublicCollectionUrl(options: PublicCollectionUrlOptions): string {
  if (!publicCollections.has(options.collection as PublicCollection)) {
    throw new Error('Collection is not public');
  }
  const url = new URL(
    `${normalizedBaseUrl(options.baseUrl)}/items/${encodeURIComponent(options.collection)}`,
  );
  url.searchParams.set('fields', options.fields ?? '*');
  url.searchParams.set('limit', String(options.limit ?? -1));
  if (options.sort) url.searchParams.set('sort', options.sort);
  return url.toString();
}

export async function fetchPublishedArticles(
  options: PublishedArticlesOptions,
  request: Request = fetch,
): Promise<DirectusListResponse<Article>> {
  const response = await request(
    buildPublishedArticlesUrl({
      baseUrl: options.apiUrl,
      category: options.category,
      featured: options.featured,
      limit: options.limit,
      now: options.now ?? new Date(),
      offset: options.offset,
      search: options.search,
      tag: options.tag,
    }),
    {
      headers: { accept: 'application/json' },
    },
  );

  if (!response.ok) {
    throw new DirectusRequestError(response.status, '内容服务暂时不可用');
  }

  try {
    return (await response.json()) as DirectusListResponse<Article>;
  } catch {
    throw new DirectusRequestError(502, '内容服务返回了无效数据');
  }
}

export async function fetchPublishedArticle(
  options: PublishedArticleOptions,
  request: Request = fetch,
): Promise<Article | null> {
  const response = await request(
    buildPublishedArticleUrl({
      baseUrl: options.apiUrl,
      now: options.now ?? new Date(),
      slug: options.slug,
    }),
    { headers: { accept: 'application/json' } },
  );

  if (!response.ok) {
    throw new DirectusRequestError(response.status, '内容服务暂时不可用');
  }

  try {
    const payload = (await response.json()) as DirectusListResponse<Article>;
    return payload.data[0] ?? null;
  } catch {
    throw new DirectusRequestError(502, '内容服务返回了无效数据');
  }
}

export async function fetchPublicCollection<T>(
  options: PublicCollectionUrlOptions,
  request: Request = fetch,
): Promise<T[]> {
  const response = await request(buildPublicCollectionUrl(options), {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new DirectusRequestError(response.status, '内容服务暂时不可用');
  }
  try {
    const payload = (await response.json()) as DirectusListResponse<T>;
    return payload.data;
  } catch {
    throw new DirectusRequestError(502, '内容服务返回了无效数据');
  }
}
