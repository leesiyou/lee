import type { APIRoute } from 'astro';
import QRCode from 'qrcode';

import { buildWechatMaterial } from '@/lib/content';
import { fetchPublishedArticle } from '@/lib/directus';
import { runtimeConfig } from '@/lib/routes';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const config = runtimeConfig();
  try {
    const article = await fetchPublishedArticle({
      apiUrl: config.directusInternalUrl,
      slug: params.slug ?? '',
    });
    if (!article) {
      return Response.json({ message: '文章不存在或尚未发布' }, { status: 404 });
    }
    const material = buildWechatMaterial(article, `${config.publicBaseUrl}/`);
    const qrDataUrl = await QRCode.toDataURL(material.qrContent, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 640,
    });
    return Response.json({
      ...material,
      message: '当前已生成公众号发布素材。自动写入公众号草稿箱功能尚未配置时，不影响博客发布。',
      qrDataUrl,
    });
  } catch {
    return Response.json({ message: '内容服务暂时不可用' }, { status: 503 });
  }
};
