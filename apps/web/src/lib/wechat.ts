import { timingSafeEqual } from 'node:crypto';

import { buildWechatMaterial, sanitizeArticleHtml } from './content';
import { fetchPreviewArticleById } from './directus';
import type { Article, DirectusFile } from './types';

interface WechatEnvironment {
  WECHAT_APP_ID?: string;
  WECHAT_APP_SECRET?: string;
  WECHAT_DRAFT_ENABLED?: string;
}

type Request = (input: string | URL | RequestInfo, init?: RequestInit) => Promise<Response>;

export interface CreateWechatDraftOptions {
  articleId: number | string;
  directusToken: string;
  directusUrl: string;
  publicBaseUrl: string;
  wechatAppId: string;
  wechatAppSecret: string;
}

export class WechatDraftError extends Error {
  readonly status: number;
  readonly wechatError?: string;

  constructor(status: number, message: string, wechatError?: string) {
    super(message);
    this.name = 'WechatDraftError';
    this.status = status;
    this.wechatError = wechatError;
  }
}

export interface WechatDraftAvailability {
  enabled: boolean;
  message: string;
  status: 'disabled' | 'enabled' | 'material_ready';
}

export function authorizeAutomationRequest(
  provided: string | undefined,
  configured: string | undefined,
): boolean {
  if (!provided || !configured) return false;
  const providedBuffer = Buffer.from(provided);
  const configuredBuffer = Buffer.from(configured);
  if (providedBuffer.length !== configuredBuffer.length) return false;
  return timingSafeEqual(providedBuffer, configuredBuffer);
}

export function getWechatDraftAvailability(
  environment: WechatEnvironment,
): WechatDraftAvailability {
  if (!environment.WECHAT_APP_ID || !environment.WECHAT_APP_SECRET) {
    return {
      enabled: false,
      message:
        '当前已生成公众号发布素材。自动写入公众号草稿箱功能尚未配置，不影响博客发布。',
      status: 'material_ready',
    };
  }
  if (environment.WECHAT_DRAFT_ENABLED !== 'true') {
    return {
      enabled: false,
      message: '公众号草稿接口已配置但当前关闭',
      status: 'disabled',
    };
  }
  return {
    enabled: true,
    message: '公众号草稿接口已启用',
    status: 'enabled',
  };
}

function directusFile(value: Article['cover_image']): DirectusFile | null {
  return value && typeof value === 'object' ? value : value ? { id: String(value) } : null;
}

async function jsonRecord(response: Response, message: string): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    throw new WechatDraftError(502, message);
  }
}

export async function createWechatDraftFromArticle(
  options: CreateWechatDraftOptions,
  request: Request = fetch,
): Promise<{ mediaId: unknown; status: 'draft_created' }> {
  const article = await fetchPreviewArticleById(
    {
      apiUrl: options.directusUrl,
      id: options.articleId,
      token: options.directusToken,
    },
    request,
  );
  if (!article) throw new WechatDraftError(404, '文章不存在');

  const cover = directusFile(article.wechat_cover) ?? directusFile(article.cover_image);
  if (!cover) throw new WechatDraftError(422, '请先设置公众号封面或文章封面');

  const tokenUrl = new URL('https://api.weixin.qq.com/cgi-bin/token');
  tokenUrl.searchParams.set('grant_type', 'client_credential');
  tokenUrl.searchParams.set('appid', options.wechatAppId);
  tokenUrl.searchParams.set('secret', options.wechatAppSecret);
  const tokenResponse = await request(tokenUrl);
  const tokenPayload = await jsonRecord(tokenResponse, '微信公众号访问令牌响应无效');
  const accessToken = typeof tokenPayload.access_token === 'string' ? tokenPayload.access_token : '';
  if (!tokenResponse.ok || !accessToken) {
    throw new WechatDraftError(
      502,
      '获取微信公众号访问令牌失败',
      typeof tokenPayload.errmsg === 'string' ? tokenPayload.errmsg : 'unknown',
    );
  }

  const assetResponse = await request(
    new URL(`assets/${encodeURIComponent(cover.id)}`, `${options.directusUrl.replace(/\/+$/, '')}/`),
    { headers: { authorization: `Bearer ${options.directusToken}` } },
  );
  if (!assetResponse.ok) throw new WechatDraftError(502, '读取公众号封面失败');
  const mediaForm = new FormData();
  const safeFilename = `${(cover.title || cover.id).replace(/[^\p{L}\p{N}._-]+/gu, '-')}.png`;
  mediaForm.append('media', await assetResponse.blob(), safeFilename);
  const mediaUrl = new URL('https://api.weixin.qq.com/cgi-bin/material/add_material');
  mediaUrl.searchParams.set('access_token', accessToken);
  mediaUrl.searchParams.set('type', 'thumb');
  const mediaResponse = await request(mediaUrl, { body: mediaForm, method: 'POST' });
  const mediaPayload = await jsonRecord(mediaResponse, '微信公众号封面上传响应无效');
  const thumbMediaId = typeof mediaPayload.media_id === 'string' ? mediaPayload.media_id : '';
  if (!mediaResponse.ok || !thumbMediaId) {
    throw new WechatDraftError(
      502,
      '上传微信公众号封面失败',
      typeof mediaPayload.errmsg === 'string' ? mediaPayload.errmsg : 'unknown',
    );
  }

  const material = buildWechatMaterial(article, `${options.publicBaseUrl.replace(/\/+$/, '')}/`);
  const author = article.author && typeof article.author === 'object' ? article.author.name : '嘎子';
  const draftUrl = new URL('https://api.weixin.qq.com/cgi-bin/draft/add');
  draftUrl.searchParams.set('access_token', accessToken);
  const draftResponse = await request(draftUrl, {
    body: JSON.stringify({
      articles: [
        {
          author,
          content: sanitizeArticleHtml(article.wechat_content?.trim() || article.content),
          content_source_url: material.sourceUrl,
          digest: material.summary,
          show_cover_pic: 1,
          thumb_media_id: thumbMediaId,
          title: material.title,
        },
      ],
    }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
  const draftPayload = await jsonRecord(draftResponse, '微信公众号草稿响应无效');
  if (!draftResponse.ok || draftPayload.errcode) {
    throw new WechatDraftError(
      502,
      '创建微信公众号草稿失败',
      typeof draftPayload.errmsg === 'string' ? draftPayload.errmsg : 'unknown',
    );
  }
  return { mediaId: draftPayload.media_id, status: 'draft_created' };
}
