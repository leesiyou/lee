export default {
  id: 'gazi-wechat-draft',
  handler: async ({ articleIds }, { env }) => {
    const ids = Array.isArray(articleIds) ? articleIds : [articleIds].filter(Boolean);
    if (ids.length !== 1) throw new Error('请在文章详情页对单篇文章执行此操作');
    if (!env.WECHAT_AUTOMATION_SECRET) throw new Error('尚未配置公众号接口');

    const response = await fetch('http://web:4321/api/wechat/draft', {
      body: JSON.stringify({ article_id: ids[0] }),
      headers: {
        'content-type': 'application/json',
        'x-blog-automation-secret': env.WECHAT_AUTOMATION_SECRET,
      },
      method: 'POST',
    });
    const payload = await response.json().catch(() => ({ message: '公众号草稿服务返回无效数据' }));
    if (!response.ok) throw new Error(payload.message || '生成公众号素材失败');
    return {
      ...payload,
      message:
        payload.message ||
        (payload.status === 'draft_created'
          ? '公众号草稿已生成，请在公众号后台人工审核。'
          : '当前已生成公众号发布素材。自动写入公众号草稿箱功能尚未配置，不影响博客发布。'),
    };
  },
};
