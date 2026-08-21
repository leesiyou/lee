import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export interface ExportArticle {
  category?: { name?: string } | number | string | null;
  content: string;
  cover_image?: { id?: string } | string | null;
  published_at: string;
  slug: string;
  status: string;
  summary: string;
  tags?: Array<{ tags_id?: { name?: string } | number | string | null }>;
  template: string;
  title: string;
  updated_at?: string | null;
}

interface DirectusPayload {
  data?: ExportArticle[];
}

const exportFields = [
  'status',
  'title',
  'slug',
  'summary',
  'content',
  'published_at',
  'updated_at',
  'template',
  'category.name',
  'tags.tags_id.name',
  'cover_image.id',
].join(',');

export function buildExportUrl(baseUrl: string, now = new Date()): string {
  const url = new URL(`${baseUrl.replace(/\/+$/, '')}/items/articles`);
  url.searchParams.set('filter[status][_eq]', 'published');
  url.searchParams.set('filter[published_at][_lte]', now.toISOString());
  url.searchParams.set('sort', 'published_at');
  url.searchParams.set('limit', '-1');
  url.searchParams.set('fields', exportFields);
  return url.toString();
}

function assertValidDate(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Article has invalid ${field}`);
  return date;
}

export function exportRelativePath(article: ExportArticle): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) {
    throw new Error(`Article has unsafe slug: ${article.slug}`);
  }
  const date = assertValidDate(article.published_at, 'published_at');
  return `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${article.slug}.md`;
}

function yamlValue(value: unknown): string {
  return JSON.stringify(value ?? '');
}

export function renderArticleMarkdown(article: ExportArticle, directusUrl: string): string {
  if (article.status !== 'published') throw new Error('Only published articles can be exported');
  assertValidDate(article.published_at, 'published_at');
  const updatedAt = article.updated_at || article.published_at;
  assertValidDate(updatedAt, 'updated_at');
  const category =
    typeof article.category === 'object' && article.category ? article.category.name ?? '' : '';
  const tags = (article.tags ?? [])
    .map((relation) =>
      typeof relation.tags_id === 'object' && relation.tags_id ? relation.tags_id.name : undefined,
    )
    .filter((name): name is string => Boolean(name));
  const coverId =
    typeof article.cover_image === 'string'
      ? article.cover_image
      : article.cover_image?.id;
  const cover = coverId ? `${directusUrl.replace(/\/+$/, '')}/assets/${coverId}` : '';

  const frontmatter = [
    '---',
    `title: ${yamlValue(article.title)}`,
    `slug: ${yamlValue(article.slug)}`,
    `summary: ${yamlValue(article.summary)}`,
    `category: ${yamlValue(category)}`,
    `tags: ${yamlValue(tags)}`,
    `published_at: ${yamlValue(article.published_at)}`,
    `updated_at: ${yamlValue(updatedAt)}`,
    `cover: ${yamlValue(cover)}`,
    `template: ${yamlValue(article.template)}`,
    '---',
    '',
  ];
  return `${frontmatter.join('\n')}${article.content.trim()}\n`;
}

async function listMarkdownFiles(directory: string, prefix = ''): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(path.join(directory, prefix), { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  const files: string[] = [];
  for (const entry of entries) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...(await listMarkdownFiles(directory, relative)));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(relative);
  }
  return files;
}

export async function exportArticles(
  articles: ExportArticle[],
  outputDirectory: string,
  directusUrl: string,
): Promise<{ changed: number; exported: number; removed: number }> {
  const outputRoot = path.resolve(outputDirectory);
  await mkdir(outputRoot, { recursive: true });
  const expected = new Set<string>();
  let changed = 0;
  for (const article of articles) {
    const relative = exportRelativePath(article);
    expected.add(relative);
    const destination = path.resolve(outputRoot, relative);
    if (!destination.startsWith(`${outputRoot}${path.sep}`)) throw new Error('Unsafe export path');
    const content = renderArticleMarkdown(article, directusUrl);
    let previous = '';
    try {
      previous = await readFile(destination, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    if (previous === content) continue;
    await mkdir(path.dirname(destination), { recursive: true });
    const temporary = `${destination}.tmp`;
    await writeFile(temporary, content, { encoding: 'utf8', mode: 0o644 });
    await rename(temporary, destination);
    changed += 1;
  }

  let removed = 0;
  for (const relative of await listMarkdownFiles(outputRoot)) {
    if (expected.has(relative)) continue;
    await rm(path.join(outputRoot, relative));
    removed += 1;
  }
  return { changed, exported: articles.length, removed };
}

export async function runExport(environment = process.env): Promise<Record<string, number>> {
  const directusUrl = environment.DIRECTUS_PUBLIC_URL?.replace(/\/+$/, '');
  if (!directusUrl) throw new Error('DIRECTUS_PUBLIC_URL is required');
  const response = await fetch(buildExportUrl(directusUrl), {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Published content export failed (${response.status})`);
  const payload = (await response.json()) as DirectusPayload;
  if (!Array.isArray(payload.data)) throw new Error('Published content export returned invalid data');
  const outputDirectory =
    environment.CONTENT_EXPORT_DIR || fileURLToPath(new URL('../content-export', import.meta.url));
  return exportArticles(payload.data, outputDirectory, directusUrl);
}

async function main(): Promise<void> {
  process.stdout.write(`${JSON.stringify(await runExport())}\n`);
}

const entryPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (entryPath === import.meta.url) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Published content export failed');
    process.exitCode = 1;
  });
}
