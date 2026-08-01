export default {
  id: 'gazi-wechat-draft',
  name: '生成公众号草稿',
  icon: 'draft',
  description: '从当前文章生成公众号草稿，只进入草稿箱，不自动群发。',
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
