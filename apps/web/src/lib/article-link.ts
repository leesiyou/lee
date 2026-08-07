import type { Article } from './types';

const safeH5Path = /^\/h5\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)+$/;

export function articleHref(article: Pick<Article, 'h5_path' | 'slug'>): string {
  const path = article.h5_path?.trim();
  return path && safeH5Path.test(path) ? path : `/posts/${article.slug}`;
}
