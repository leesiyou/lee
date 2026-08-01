import { timingSafeEqual } from 'node:crypto';

interface WechatEnvironment {
  WECHAT_APP_ID?: string;
  WECHAT_APP_SECRET?: string;
  WECHAT_DRAFT_ENABLED?: string;
}

export interface WechatDraftAvailability {
  enabled: boolean;
  message: string;
  status: 'disabled' | 'enabled' | 'not_configured';
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
      message: '尚未配置公众号接口',
      status: 'not_configured',
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
