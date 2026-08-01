import { describe, expect, it, vi } from 'vitest';

import {
  WechatDraftError,
  authorizeAutomationRequest,
  createWechatDraftFromArticle,
  getWechatDraftAvailability,
} from './wechat';

describe('authorizeAutomationRequest', () => {
  it('rejects missing secrets and accepts only an exact configured secret', () => {
    expect(authorizeAutomationRequest(undefined, undefined)).toBe(false);
    expect(authorizeAutomationRequest('wrong', 'configured-secret')).toBe(false);
    expect(authorizeAutomationRequest('configured-secret', 'configured-secret')).toBe(true);
  });
});

describe('getWechatDraftAvailability', () => {
  it('reports missing credentials without pretending to create a draft', () => {
    expect(
      getWechatDraftAvailability({
        WECHAT_APP_ID: undefined,
        WECHAT_APP_SECRET: undefined,
        WECHAT_DRAFT_ENABLED: 'false',
      }),
    ).toEqual({
      enabled: false,
      message: '尚未配置公众号接口',
      status: 'not_configured',
    });
  });

  it('stays disabled until the explicit feature flag is enabled', () => {
    expect(
      getWechatDraftAvailability({
        WECHAT_APP_ID: 'app-id',
        WECHAT_APP_SECRET: 'app-secret',
        WECHAT_DRAFT_ENABLED: 'false',
      }),
    ).toMatchObject({ enabled: false, status: 'disabled' });
  });
});

describe('createWechatDraftFromArticle', () => {
  it('loads the private article, uploads its cover, and creates a review-only draft', async () => {
    const article = {
      id: 7,
      status: 'draft',
      title: '后台草稿',
      slug: 'private-draft',
      summary: '草稿摘要',
      content: '<p>草稿正文</p>',
      cover_image: { id: 'cover-file', title: '封面', type: 'image/png' },
      template: 'diary',
      published_at: '2026-08-01T00:00:00.000Z',
    };
    const responses = [
      new Response(JSON.stringify({ data: article }), { status: 200 }),
      new Response(JSON.stringify({ access_token: 'wechat-access' }), { status: 200 }),
      new Response(new Blob(['png'], { type: 'image/png' }), { status: 200 }),
      new Response(JSON.stringify({ media_id: 'wechat-cover' }), { status: 200 }),
      new Response(JSON.stringify({ media_id: 'wechat-draft' }), { status: 200 }),
    ];
    const request = vi.fn(
      async (_input: string | URL | RequestInfo, _init?: RequestInit) =>
        responses.shift() as Response,
    );

    await expect(
      createWechatDraftFromArticle(
        {
          articleId: 7,
          directusToken: 'preview-token',
          directusUrl: 'http://directus:8055',
          publicBaseUrl: 'https://blog.example.com',
          wechatAppId: 'app-id',
          wechatAppSecret: 'app-secret',
        },
        request,
      ),
    ).resolves.toEqual({ mediaId: 'wechat-draft', status: 'draft_created' });

    expect(String(request.mock.calls[0]?.[0])).toContain('/items/articles/7');
    expect(String(request.mock.calls[3]?.[0])).toContain('/material/add_material');
    const draftBody = JSON.parse(String((request.mock.calls[4]?.[1] as RequestInit).body));
    expect(draftBody.articles[0]).toMatchObject({
      content_source_url: 'https://blog.example.com/posts/private-draft',
      thumb_media_id: 'wechat-cover',
      title: '后台草稿',
    });
  });

  it('refuses to fake a draft when the article has no cover', async () => {
    const request = vi.fn(
      async (_input: string | URL | RequestInfo, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            data: {
              id: 8,
              status: 'draft',
              title: '无封面',
              slug: 'no-cover',
              summary: '摘要',
              content: '<p>正文</p>',
              template: 'diary',
              published_at: '2026-08-01T00:00:00.000Z',
            },
          }),
          { status: 200 },
        ),
    );

    await expect(
      createWechatDraftFromArticle(
        {
          articleId: 8,
          directusToken: 'preview-token',
          directusUrl: 'http://directus:8055',
          publicBaseUrl: 'https://blog.example.com',
          wechatAppId: 'app-id',
          wechatAppSecret: 'app-secret',
        },
        request,
      ),
    ).rejects.toEqual(new WechatDraftError(422, '请先设置公众号封面或文章封面'));
  });
});
