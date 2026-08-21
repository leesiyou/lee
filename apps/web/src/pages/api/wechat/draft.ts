import type { APIRoute } from 'astro';

import { runtimeConfig } from '@/lib/routes';
import {
  WechatDraftError,
  authorizeAutomationRequest,
  createWechatDraftFromArticle,
  getWechatDraftAvailability,
} from '@/lib/wechat';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (
    !authorizeAutomationRequest(
      request.headers.get('x-blog-automation-secret') ?? undefined,
      process.env.WECHAT_AUTOMATION_SECRET,
    )
  ) {
    return Response.json({ message: '未授权' }, { status: 401 });
  }

  const availability = getWechatDraftAvailability(process.env);
  if (!availability.enabled) {
    return Response.json(availability, {
      status: availability.status === 'material_ready' ? 200 : 503,
    });
  }

  let payload: { article_id?: number | string };
  try {
    payload = (await request.json()) as { article_id?: number | string };
  } catch {
    return Response.json({ message: '请求 JSON 无效' }, { status: 400 });
  }
  if (payload.article_id === undefined || payload.article_id === null || payload.article_id === '') {
    return Response.json({ message: '缺少文章 ID' }, { status: 400 });
  }

  try {
    const config = runtimeConfig();
    const result = await createWechatDraftFromArticle({
      articleId: payload.article_id,
      directusToken: process.env.DIRECTUS_PREVIEW_TOKEN ?? '',
      directusUrl: config.directusInternalUrl,
      publicBaseUrl: config.publicBaseUrl,
      wechatAppId: process.env.WECHAT_APP_ID ?? '',
      wechatAppSecret: process.env.WECHAT_APP_SECRET ?? '',
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof WechatDraftError) {
      return Response.json(
        { message: error.message, ...(error.wechatError ? { wechatError: error.wechatError } : {}) },
        { status: error.status },
      );
    }
    return Response.json({ message: '公众号草稿服务暂时不可用' }, { status: 503 });
  }
};
