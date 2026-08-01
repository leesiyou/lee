import { describe, expect, it } from 'vitest';

import { authorizeAutomationRequest, getWechatDraftAvailability } from './wechat';

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
