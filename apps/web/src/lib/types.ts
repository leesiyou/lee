export type ArticleStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type ArticleTemplate = 'philosophy' | 'business' | 'diary' | 'retrospective';

export interface DirectusFile {
  id: string;
  filename_download?: string;
  height?: number | null;
  title?: string | null;
  type?: string | null;
  width?: number | null;
}

export interface Category {
  id: string | number;
  name: string;
  slug: string;
}

export interface Tag {
  id: string | number;
  name: string;
  slug: string;
}

export interface Author {
  id: string | number;
  name: string;
  avatar?: DirectusFile | string | null;
  bio?: string | null;
  social_links?: Record<string, string> | null;
}

export interface Article {
  id: string | number;
  status: ArticleStatus;
  title: string;
  slug: string;
  subtitle?: string | null;
  summary: string;
  content: string;
  cover_image?: DirectusFile | string | null;
  share_image?: DirectusFile | string | null;
  template: ArticleTemplate;
  theme?: string | null;
  author?: Author | string | number | null;
  category?: Category | string | number | null;
  tags?: Array<{ tags_id: Tag | string | number }>;
  featured?: boolean;
  published_at: string;
  created_at?: string;
  updated_at?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  wechat_title?: string | null;
  wechat_summary?: string | null;
  wechat_cover?: DirectusFile | string | null;
  wechat_content?: string | null;
  reading_minutes?: number | null;
  sort?: number | null;
}

export interface DirectusListResponse<T> {
  data: T[];
  meta?: {
    filter_count?: number;
    total_count?: number;
  };
}

export interface SiteSettings {
  id: string | number;
  site_name: string;
  site_description: string;
  logo?: DirectusFile | string | null;
  favicon?: DirectusFile | string | null;
  default_share_image?: DirectusFile | string | null;
  footer_text?: string | null;
  wechat_account_name?: string | null;
  analytics_code?: string | null;
  theme?: string | null;
}

export interface TemplatePresetRecord {
  id: string | number;
  key: ArticleTemplate;
  name: string;
  description?: string | null;
  structure?: string[] | null;
}
