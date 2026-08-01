import type { APIRoute } from 'astro';

import { authorizeAutomationRequest, getWechatDraftAvailability } from '@/lib/wechat';

export const prerender = false;

interface DraftRequest {
  author?: string;
  content: string;
  content_source_url: string;
  digest: string;
  show_cover_pic?: 0 | 1;
  thumb_media_id: string;
  title: string;
}

interface WechatTokenResponse {
  access_token?: string;
  errcode?: number;
  errmsg?: string;
}

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
    return Response.json(availability, { status: 503 });
  }

  let payload: DraftRequest;
  try {
    payload = (await request.json()) as DraftRequest;
  } catch {
    return Response.json({ message: '请求 JSON 无效' }, { status: 400 });
  }
  if (!payload.title || !payload.content || !payload.thumb_media_id || !payload.content_source_url) {
    return Response.json({ message: '缺少标题、正文、封面媒体或阅读原文地址' }, { status: 400 });
  }

  const tokenUrl = new URL('https://api.weixin.qq.com/cgi-bin/token');
  tokenUrl.searchParams.set('grant_type', 'client_credential');
  tokenUrl.searchParams.set('appid', process.env.WECHAT_APP_ID ?? '');
  tokenUrl.searchParams.set('secret', process.env.WECHAT_APP_SECRET ?? '');
  const tokenResponse = await fetch(tokenUrl);
  const tokenPayload = (await tokenResponse.json()) as WechatTokenResponse;
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    return Response.json(
      { message: '获取微信公众号访问令牌失败', wechatError: tokenPayload.errmsg ?? 'unknown' },
      { status: 502 },
    );
  }

  const draftUrl = new URL('https://api.weixin.qq.com/cgi-bin/draft/add');
  draftUrl.searchParams.set('access_token', tokenPayload.access_token);
  const draftResponse = await fetch(draftUrl, {
    body: JSON.stringify({ articles: [{ ...payload, show_cover_pic: payload.show_cover_pic ?? 1 }] }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
  const draftPayload = (await draftResponse.json()) as Record<string, unknown>;
  if (!draftResponse.ok || draftPayload.errcode) {
    return Response.json(
      { message: '创建微信公众号草稿失败', wechatError: draftPayload.errmsg ?? 'unknown' },
      { status: 502 },
    );
  }
  return Response.json({ mediaId: draftPayload.media_id, status: 'draft_created' }, { status: 201 });
};
