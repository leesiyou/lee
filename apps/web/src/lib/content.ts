import sanitizeHtml from 'sanitize-html';

import type { Article, StructuredContent } from './types';

export interface TableOfContentsItem {
  depth: 2 | 3;
  id: string;
  text: string;
}

export interface WechatMaterial {
  highlights: string[];
  momentsCopy: string;
  qrContent: string;
  quote: string | null;
  sourceUrl: string;
  summary: string;
  title: string;
}

const allowedTags = [
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'em',
  'figcaption',
  'figure',
  'h2',
  'h3',
  'h4',
  'hr',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
];

export function sanitizeArticleHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedAttributes: {
      a: ['href', 'rel', 'target', 'title'],
      code: ['class'],
      h2: ['id'],
      h3: ['id'],
      h4: ['id'],
      img: ['alt', 'height', 'loading', 'src', 'title', 'width'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedTags,
    disallowedTagsMode: 'discard',
    enforceHtmlBoundary: true,
    transformTags: {
      a: (_tagName, attributes) => ({
        attribs: {
          ...attributes,
          ...(attributes.target === '_blank' ? { rel: 'noopener noreferrer' } : {}),
        },
        tagName: 'a',
      }),
    },
  });
}

function blockValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object' && 'content' in value) {
    return blockValue((value as { content?: unknown }).content);
  }
  return '';
}

export function renderStructuredBlocks(content: StructuredContent | null | undefined): string {
  if (!content?.blocks || !Array.isArray(content.blocks)) return '';
  const rendered = content.blocks
    .map((block) => {
      const data = block.data ?? {};
      switch (block.type) {
        case 'paragraph':
          return `<p>${blockValue(data.text)}</p>`;
        case 'header': {
          const level = [2, 3, 4].includes(Number(data.level)) ? Number(data.level) : 2;
          return `<h${level}>${blockValue(data.text)}</h${level}>`;
        }
        case 'list': {
          const tag = data.style === 'ordered' ? 'ol' : 'ul';
          const items = Array.isArray(data.items) ? data.items : [];
          return `<${tag}>${items.map((item) => `<li>${blockValue(item)}</li>`).join('')}</${tag}>`;
        }
        case 'quote':
          return `<blockquote><p>${blockValue(data.text)}</p>${data.caption ? `<figcaption>${blockValue(data.caption)}</figcaption>` : ''}</blockquote>`;
        case 'delimiter':
          return '<hr>';
        case 'code':
          return `<pre><code>${blockValue(data.code)}</code></pre>`;
        case 'image': {
          const file = data.file && typeof data.file === 'object' ? data.file as Record<string, unknown> : {};
          const source = blockValue(file.url ?? data.url);
          if (!source) return '';
          return `<figure><img src="${source}" alt="${blockValue(data.caption)}" loading="lazy">${data.caption ? `<figcaption>${blockValue(data.caption)}</figcaption>` : ''}</figure>`;
        }
        default:
          return '';
      }
    })
    .join('');
  return sanitizeArticleHtml(rendered);
}

function plainText(input: string): string {
  return sanitizeHtml(input, { allowedAttributes: {}, allowedTags: [] })
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculateReadingMinutes(input: string): number {
  const text = plainText(input);
  const chineseCharacters = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const latinWords = text.replace(/[\u3400-\u9fff]/g, ' ').match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
  return Math.max(1, Math.ceil(chineseCharacters / 500 + latinWords / 220));
}

function headingId(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\u3400-\u9fff]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function buildTableOfContents(input: string): TableOfContentsItem[] {
  const safeHtml = sanitizeArticleHtml(input);
  const headings: TableOfContentsItem[] = [];
  const pattern = /<h([23])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;
  for (const match of safeHtml.matchAll(pattern)) {
    const text = plainText(match[2] ?? '');
    if (text) {
      headings.push({
        depth: Number(match[1]) as 2 | 3,
        id: headingId(text),
        text,
      });
    }
  }
  return headings;
}

export function addHeadingIds(input: string): string {
  const safeHtml = sanitizeArticleHtml(input);
  return safeHtml.replace(
    /<h([23])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi,
    (_whole, depth: string, body: string) => {
      const id = headingId(plainText(body));
      return `<h${depth} id="${id}">${body}</h${depth}>`;
    },
  );
}

export function buildWechatMaterial(article: Article, publicBaseUrl: string): WechatMaterial {
  const safeContent = sanitizeArticleHtml(article.wechat_content?.trim() || article.content);
  const highlights = [...safeContent.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)]
    .map((match) => plainText(match[1] ?? ''))
    .filter(Boolean)
    .slice(0, 5);
  const quoteMatch = safeContent.match(/<blockquote(?:\s[^>]*)?>([\s\S]*?)<\/blockquote>/i);
  const sourceUrl = new URL(`posts/${encodeURIComponent(article.slug)}`, publicBaseUrl).toString();
  const quote = quoteMatch ? plainText(quoteMatch[1] ?? '') : article.summary;

  return {
    highlights,
    momentsCopy: `${article.title}\n\n${article.summary}\n\n阅读原文：${sourceUrl}`,
    qrContent: sourceUrl,
    quote,
    sourceUrl,
    summary: article.wechat_summary?.trim() || article.summary,
    title: article.wechat_title?.trim() || article.title,
  };
}
