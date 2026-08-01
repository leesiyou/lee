import { createHash } from 'node:crypto';

export interface ModelField {
  field: string;
  meta?: Record<string, unknown> | null;
  schema?: Record<string, unknown> | null;
  type: string;
}

export interface ModelCollection {
  fields: ModelField[];
  icon: string;
  note: string;
}

const idField: ModelField = {
  field: 'id',
  meta: { hidden: true, interface: 'input', readonly: true },
  schema: { data_type: 'integer', has_auto_increment: true, is_primary_key: true },
  type: 'integer',
};

const slugFields: ModelField[] = [
  { field: 'name', meta: { interface: 'input', required: true }, schema: { is_nullable: false, max_length: 120 }, type: 'string' },
  { field: 'slug', meta: { interface: 'input', required: true }, schema: { is_nullable: false, is_unique: true, max_length: 160 }, type: 'string' },
  { field: 'sort', meta: { interface: 'input', width: 'half' }, schema: { default_value: 0, is_nullable: false }, type: 'integer' },
];

export const articleStatuses = ['draft', 'scheduled', 'published', 'archived'] as const;

export const collections: Record<string, ModelCollection> = {
  articles: {
    icon: 'article',
    note: '日更文章主数据',
    fields: [
      idField,
      { field: 'status', meta: { choices: articleStatuses.map((value) => ({ text: value, value })), interface: 'select-dropdown', required: true }, schema: { default_value: 'draft', is_nullable: false, max_length: 24 }, type: 'string' },
      { field: 'title', meta: { interface: 'input', required: true }, schema: { is_nullable: false, max_length: 240 }, type: 'string' },
      { field: 'slug', meta: { interface: 'input', note: '可留空，由服务器自动生成安全且唯一的地址标识', required: false }, schema: { is_nullable: false, is_unique: true, max_length: 180 }, type: 'string' },
      { field: 'subtitle', meta: { interface: 'input' }, schema: { is_nullable: true, max_length: 300 }, type: 'string' },
      { field: 'summary', meta: { interface: 'input-multiline', required: true }, schema: { is_nullable: false }, type: 'text' },
      { field: 'content', meta: { interface: 'input-rich-text-html', required: true }, schema: { is_nullable: false }, type: 'text' },
      { field: 'cover_image', meta: { interface: 'file-image', special: ['file'] }, schema: { is_nullable: true }, type: 'uuid' },
      { field: 'share_image', meta: { interface: 'file-image', special: ['file'] }, schema: { is_nullable: true }, type: 'uuid' },
      { field: 'template', meta: { choices: ['philosophy', 'business', 'diary', 'retrospective'].map((value) => ({ text: value, value })), interface: 'select-dropdown', required: true }, schema: { default_value: 'philosophy', is_nullable: false, max_length: 40 }, type: 'string' },
      { field: 'theme', meta: { interface: 'select-color' }, schema: { default_value: '#c6a96b', is_nullable: true, max_length: 20 }, type: 'string' },
      { field: 'author', meta: { interface: 'select-dropdown-m2o', special: ['m2o'] }, schema: { is_nullable: true }, type: 'integer' },
      { field: 'category', meta: { interface: 'select-dropdown-m2o', special: ['m2o'] }, schema: { is_nullable: true }, type: 'integer' },
      { field: 'tags', meta: { interface: 'list-m2m', special: ['m2m'] }, schema: null, type: 'alias' },
      { field: 'featured', meta: { interface: 'boolean' }, schema: { default_value: false, is_nullable: false }, type: 'boolean' },
      { field: 'published_at', meta: { interface: 'datetime', required: true }, schema: { is_nullable: false }, type: 'timestamp' },
      { field: 'created_at', meta: { interface: 'datetime', readonly: true, special: ['date-created'] }, schema: { is_nullable: true }, type: 'timestamp' },
      { field: 'updated_at', meta: { interface: 'datetime', readonly: true, special: ['date-updated'] }, schema: { is_nullable: true }, type: 'timestamp' },
      { field: 'seo_title', meta: { interface: 'input' }, schema: { is_nullable: true, max_length: 240 }, type: 'string' },
      { field: 'seo_description', meta: { interface: 'input-multiline' }, schema: { is_nullable: true }, type: 'text' },
      { field: 'seo_keywords', meta: { interface: 'input-tags' }, schema: { is_nullable: true, max_length: 500 }, type: 'string' },
      { field: 'wechat_title', meta: { interface: 'input' }, schema: { is_nullable: true, max_length: 128 }, type: 'string' },
      { field: 'wechat_summary', meta: { interface: 'input-multiline' }, schema: { is_nullable: true }, type: 'text' },
      { field: 'wechat_cover', meta: { interface: 'file-image', special: ['file'] }, schema: { is_nullable: true }, type: 'uuid' },
      { field: 'wechat_content', meta: { interface: 'input-rich-text-html' }, schema: { is_nullable: true }, type: 'text' },
      { field: 'reading_minutes', meta: { interface: 'input', width: 'half' }, schema: { is_nullable: true }, type: 'integer' },
      { field: 'sort', meta: { interface: 'input', width: 'half' }, schema: { default_value: 0, is_nullable: false }, type: 'integer' },
    ],
  },
  categories: { fields: [idField, ...slugFields], icon: 'category', note: '文章分类' },
  tags: { fields: [idField, ...slugFields], icon: 'sell', note: '文章标签' },
  authors: {
    icon: 'person',
    note: '文章作者',
    fields: [
      idField,
      { field: 'name', meta: { interface: 'input', required: true }, schema: { is_nullable: false, max_length: 120 }, type: 'string' },
      { field: 'avatar', meta: { interface: 'file-image', special: ['file'] }, schema: { is_nullable: true }, type: 'uuid' },
      { field: 'bio', meta: { interface: 'input-multiline' }, schema: { is_nullable: true }, type: 'text' },
      { field: 'social_links', meta: { interface: 'input-code', options: { language: 'json' } }, schema: { is_nullable: true }, type: 'json' },
    ],
  },
  site_settings: {
    icon: 'settings',
    note: '博客全局设置',
    fields: [
      idField,
      { field: 'site_name', meta: { interface: 'input', required: true }, schema: { is_nullable: false, max_length: 160 }, type: 'string' },
      { field: 'site_description', meta: { interface: 'input-multiline', required: true }, schema: { is_nullable: false }, type: 'text' },
      { field: 'logo', meta: { interface: 'file-image', special: ['file'] }, schema: { is_nullable: true }, type: 'uuid' },
      { field: 'favicon', meta: { interface: 'file-image', special: ['file'] }, schema: { is_nullable: true }, type: 'uuid' },
      { field: 'default_share_image', meta: { interface: 'file-image', special: ['file'] }, schema: { is_nullable: true }, type: 'uuid' },
      { field: 'footer_text', meta: { interface: 'input' }, schema: { is_nullable: true, max_length: 300 }, type: 'string' },
      { field: 'wechat_account_name', meta: { interface: 'input' }, schema: { is_nullable: true, max_length: 120 }, type: 'string' },
      { field: 'analytics_code', meta: { interface: 'input-code' }, schema: { is_nullable: true }, type: 'text' },
      { field: 'theme', meta: { interface: 'select-dropdown' }, schema: { default_value: 'auto', is_nullable: false, max_length: 20 }, type: 'string' },
    ],
  },
  template_presets: {
    icon: 'dashboard_customize',
    note: '文章结构模板',
    fields: [
      idField,
      { field: 'key', meta: { interface: 'input', required: true }, schema: { is_nullable: false, is_unique: true, max_length: 40 }, type: 'string' },
      { field: 'name', meta: { interface: 'input', required: true }, schema: { is_nullable: false, max_length: 80 }, type: 'string' },
      { field: 'description', meta: { interface: 'input-multiline' }, schema: { is_nullable: true }, type: 'text' },
      { field: 'structure', meta: { interface: 'input-code', options: { language: 'json' } }, schema: { is_nullable: true }, type: 'json' },
      { field: 'sort', meta: { interface: 'input' }, schema: { default_value: 0, is_nullable: false }, type: 'integer' },
    ],
  },
  articles_tags: {
    icon: 'link',
    note: '文章与标签关系',
    fields: [
      idField,
      { field: 'articles_id', meta: { hidden: true, interface: 'select-dropdown-m2o', special: ['m2o'] }, schema: { is_nullable: false }, type: 'integer' },
      { field: 'tags_id', meta: { hidden: true, interface: 'select-dropdown-m2o', special: ['m2o'] }, schema: { is_nullable: false }, type: 'integer' },
    ],
  },
};

export interface ModelRelation {
  collection: string;
  field: string;
  meta?: { junction_field?: string; one_field?: string };
  related_collection: string;
  schema?: { on_delete?: 'CASCADE' | 'SET NULL' };
}

export const relations: ModelRelation[] = [
  { collection: 'articles', field: 'author', related_collection: 'authors', schema: { on_delete: 'SET NULL' } },
  { collection: 'articles', field: 'category', related_collection: 'categories', schema: { on_delete: 'SET NULL' } },
  { collection: 'articles', field: 'cover_image', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } },
  { collection: 'articles', field: 'share_image', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } },
  { collection: 'articles', field: 'wechat_cover', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } },
  { collection: 'authors', field: 'avatar', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } },
  { collection: 'site_settings', field: 'logo', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } },
  { collection: 'site_settings', field: 'favicon', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } },
  { collection: 'site_settings', field: 'default_share_image', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } },
  {
    collection: 'articles_tags',
    field: 'articles_id',
    meta: { junction_field: 'tags_id', one_field: 'tags' },
    related_collection: 'articles',
    schema: { on_delete: 'CASCADE' },
  },
  { collection: 'articles_tags', field: 'tags_id', related_collection: 'tags', schema: { on_delete: 'CASCADE' } },
];

export const defaultCategories = [
  { name: '创业与商业', slug: 'startup-business', sort: 10 },
  { name: '工厂与制造', slug: 'factory-manufacturing', sort: 20 },
  { name: 'AI 与效率', slug: 'ai-efficiency', sort: 30 },
  { name: '街舞与文化', slug: 'street-dance-culture', sort: 40 },
  { name: '羽毛球馆实战', slug: 'badminton-operations', sort: 50 },
  { name: '创业日记', slug: 'startup-diary', sort: 60 },
  { name: '项目复盘', slug: 'project-retrospective', sort: 70 },
] as const;

export const defaultTemplatePresets = [
  { key: 'philosophy', name: '哲学思辨', sort: 10, structure: ['大标题', '核心矛盾', '定义切换', '多维度比较', '哲学金句', '现实真相', '自我测试', '终局结论'] },
  { key: 'business', name: '商业拆解', sort: 20, structure: ['问题', '表象', '底层原因', '案例', '数据', '方法', '执行清单', '结论'] },
  { key: 'diary', name: '创业日记', sort: 30, structure: ['今天发生了什么', '做对了什么', '做错了什么', '客户反馈', '现金流变化', '明天行动', '一句反思'] },
  { key: 'retrospective', name: '项目复盘', sort: 40, structure: ['目标', '投入', '过程', '结果', '偏差', '原因', '经验', '下一轮动作'] },
] as const;

export const defaultAuthor = { bio: '创业者、制造业实践者、长期主义实验者。', name: '嘎子', social_links: {} } as const;
export const defaultSiteSettings = {
  footer_text: '把时间投入能留下来的东西。',
  site_description: '记录创业、制造、AI、文化与真实项目的长期实验。',
  site_name: '嘎子的创业实验室',
  theme: 'auto',
  wechat_account_name: '',
} as const;

export const publicArticleFilter = {
  _and: [
    { status: { _in: ['published', 'scheduled'] } },
    { published_at: { _lte: '$NOW' } },
  ],
};
export const editorAllowedCollections = ['articles', 'categories', 'tags', 'articles_tags', 'directus_files'];
export const editorDeniedSystemCollections = ['directus_users', 'directus_roles', 'directus_settings', 'directus_extensions'];

export function slugifyTitle(title: string, uniqueSeed: string): string {
  const latinSlug = title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  if (latinSlug) return latinSlug;
  return `post-${createHash('sha256').update(`${title}:${uniqueSeed}`).digest('hex').slice(0, 10)}`;
}
