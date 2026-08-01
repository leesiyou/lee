export default {
  id: 'gazi-wechat-draft',
  name: '生成公众号素材',
  icon: 'draft',
  description: '生成可复制的公众号发布素材；接口启用时可写入草稿箱，但不会自动群发。',
  overview: ({ articleIds }) => [
    {
      label: '文章 ID',
      text: Array.isArray(articleIds) ? articleIds.join(', ') : String(articleIds ?? '--'),
    },
  ],
  options: [
    {
      field: 'articleIds',
      name: '文章 ID',
      type: 'csv',
      meta: {
        interface: 'tags',
        note: '手动流程会自动传入当前文章 ID。',
        required: true,
      },
    },
  ],
};
