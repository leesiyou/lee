import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import {
  collections,
  defaultAuthor,
  defaultCategories,
  defaultSiteSettings,
  defaultTemplatePresets,
  publicArticleFilter,
  relations,
} from './directus-model';

export interface ExistingModelState {
  collections: Set<string>;
  fields: Map<string, Set<string>>;
  fieldTypes?: Map<string, Map<string, string>>;
}

export interface BootstrapPlan {
  createCollections: string[];
  createFields: Record<string, string[]>;
  updateFieldTypes: Record<string, string[]>;
}

export function planBootstrap(existing: ExistingModelState): BootstrapPlan {
  const createCollections: string[] = [];
  const createFields: Record<string, string[]> = {};
  const updateFieldTypes: Record<string, string[]> = {};
  for (const [collectionName, definition] of Object.entries(collections)) {
    if (!existing.collections.has(collectionName)) createCollections.push(collectionName);
    const existingFields = existing.fields.get(collectionName) ?? new Set<string>();
    createFields[collectionName] = definition.fields
      .map((field) => field.field)
      .filter((field) => !existingFields.has(field));
    const existingTypes = existing.fieldTypes?.get(collectionName);
    updateFieldTypes[collectionName] = definition.fields
      .filter((field) => existingFields.has(field.field) && existingTypes?.get(field.field) !== undefined)
      .filter((field) => existingTypes?.get(field.field) !== field.type)
      .map((field) => field.field);
  }
  return { createCollections, createFields, updateFieldTypes };
}

class DirectusAdminClient {
  private token = '';

  constructor(
    private readonly baseUrl: string,
    private readonly email: string,
    private readonly password: string,
  ) {}

  async login(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      body: JSON.stringify({ email: this.email, password: this.password }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Directus login failed (${response.status})`);
    const payload = (await response.json()) as { data?: { access_token?: string } };
    if (!payload.data?.access_token) throw new Error('Directus login returned no access token');
    this.token = payload.data.access_token;
  }

  async request<T>(path: string, init?: RequestInit, attempt = 0): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${this.token}`,
        ...(init?.body ? { 'content-type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
    if (response.status === 429 && attempt < 6) {
      const retryAfterSeconds = Number(response.headers.get('retry-after') ?? '0');
      const waitMilliseconds = Math.max(250, Math.min(2_000, retryAfterSeconds * 1_000 || 500));
      await new Promise((resolve) => setTimeout(resolve, waitMilliseconds));
      return this.request<T>(path, init, attempt + 1);
    }
    if (!response.ok) {
      const detail = (await response.text()).replace(/\s+/g, ' ').slice(0, 400);
      throw new Error(`Directus request failed ${path} (${response.status}): ${detail}`);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
}

async function readExistingState(client: DirectusAdminClient): Promise<ExistingModelState> {
  const collectionPayload = await client.request<{ data: Array<{ collection: string }> }>('/collections');
  const collectionNames = new Set(collectionPayload.data.map((item) => item.collection));
  const fields = new Map<string, Set<string>>();
  const fieldTypes = new Map<string, Map<string, string>>();
  for (const collection of Object.keys(collections)) {
    if (!collectionNames.has(collection)) continue;
    const fieldPayload = await client.request<{ data: Array<{ field: string; type: string }> }>(`/fields/${collection}`);
    fields.set(collection, new Set(fieldPayload.data.map((item) => item.field)));
    fieldTypes.set(collection, new Map(fieldPayload.data.map((item) => [item.field, item.type])));
  }
  return { collections: collectionNames, fields, fieldTypes };
}

interface IdentifiedItem {
  id: number | string;
}

async function findOne(
  client: DirectusAdminClient,
  path: string,
  field: string,
  value: string,
): Promise<IdentifiedItem | undefined> {
  const query = new URLSearchParams({
    [`filter[${field}][_eq]`]: value,
    fields: 'id',
    limit: '1',
  });
  const payload = await client.request<{ data: IdentifiedItem[] }>(`${path}?${query}`);
  return payload.data[0];
}

async function createItem(
  client: DirectusAdminClient,
  path: string,
  data: Record<string, unknown>,
): Promise<IdentifiedItem> {
  const payload = await client.request<{ data: IdentifiedItem }>(path, {
    body: JSON.stringify(data),
    method: 'POST',
  });
  return payload.data;
}

async function ensureRelations(client: DirectusAdminClient): Promise<number> {
  const payload = await client.request<{
    data: Array<{
      collection?: string;
      field?: string;
      meta?: { many_collection?: string; many_field?: string };
    }>;
  }>('/relations?limit=-1');
  const existing = new Set(
    payload.data.map((relation) =>
      `${relation.collection ?? relation.meta?.many_collection}:${relation.field ?? relation.meta?.many_field}`,
    ),
  );
  let created = 0;
  for (const relation of relations) {
    const key = `${relation.collection}:${relation.field}`;
    if (existing.has(key)) continue;
    await client.request('/relations', { body: JSON.stringify(relation), method: 'POST' });
    existing.add(key);
    created += 1;
  }
  return created;
}

async function ensurePolicy(
  client: DirectusAdminClient,
  name: string,
  data: Record<string, unknown>,
): Promise<string> {
  const existing = await findOne(client, '/policies', 'name', name);
  if (existing) return String(existing.id);
  return String((await createItem(client, '/policies', { name, ...data })).id);
}

async function ensureRole(
  client: DirectusAdminClient,
  name: string,
  data: Record<string, unknown>,
): Promise<string> {
  const existing = await findOne(client, '/roles', 'name', name);
  if (existing) return String(existing.id);
  return String(
    (
      await createItem(client, '/roles', {
        ...data,
        name,
      })
    ).id,
  );
}

async function ensureRolePolicyAccess(
  client: DirectusAdminClient,
  role: string,
  policy: string,
): Promise<void> {
  const query = new URLSearchParams({
    'filter[policy][_eq]': policy,
    'filter[role][_eq]': role,
    fields: 'id',
    limit: '1',
  });
  const existing = await client.request<{ data: IdentifiedItem[] }>(`/access?${query}`);
  if (existing.data.length > 0) return;
  await createItem(client, '/access', { policy, role, sort: 1 });
}

interface PermissionDefinition {
  action: 'create' | 'read' | 'update' | 'delete';
  collection: string;
  fields?: string[];
  permissions?: Record<string, unknown> | null;
}

async function ensurePermission(
  client: DirectusAdminClient,
  policy: string,
  definition: PermissionDefinition,
): Promise<boolean> {
  const query = new URLSearchParams({
    'filter[action][_eq]': definition.action,
    'filter[collection][_eq]': definition.collection,
    'filter[policy][_eq]': policy,
    fields: 'id,fields,permissions',
    limit: '1',
  });
  const existing = await client.request<{
    data: Array<IdentifiedItem & { fields?: string[]; permissions?: Record<string, unknown> | null }>;
  }>(`/permissions?${query}`);
  const desired = {
    fields: definition.fields ?? ['*'],
    permissions: definition.permissions ?? {},
    policy,
    ...definition,
  };
  if (existing.data[0]) {
    const current = existing.data[0];
    if (
      JSON.stringify(current.fields ?? []) !== JSON.stringify(desired.fields) ||
      JSON.stringify(current.permissions ?? {}) !== JSON.stringify(desired.permissions)
    ) {
      await client.request(`/permissions/${current.id}`, {
        body: JSON.stringify(desired),
        method: 'PATCH',
      });
    }
    return false;
  }
  await createItem(client, '/permissions', desired);
  return true;
}

async function ensurePreviewServiceUser(
  client: DirectusAdminClient,
  role: string,
  token: string,
): Promise<boolean> {
  const email = 'preview-bot@easybreak.top';
  const existing = await findOne(client, '/users', 'email', email);
  const desired = {
    email,
    first_name: 'Blog Preview',
    role,
    status: 'active',
    token,
  };
  if (existing) {
    await client.request(`/users/${existing.id}`, {
      body: JSON.stringify(desired),
      method: 'PATCH',
    });
    return false;
  }
  await createItem(client, '/users', desired);
  return true;
}

async function ensurePermissions(
  client: DirectusAdminClient,
  previewToken: string,
): Promise<{ created: number; createdPreviewUser: boolean }> {
  const publicPolicy = await findOne(client, '/policies', 'name', '$t:public_label');
  if (!publicPolicy) throw new Error('Directus public policy was not found');
  const editorPolicy = await ensurePolicy(client, 'Editor', {
    admin_access: false,
    app_access: true,
    description: '博客内容编辑与发布权限',
    icon: 'edit_note',
  });
  const editorRole = await ensureRole(client, 'Editor', {
    description: '可编辑、排期和发布博客内容，但无系统管理权限。',
    icon: 'edit_note',
  });
  await ensureRolePolicyAccess(client, editorRole, editorPolicy);
  const previewPolicy = await ensurePolicy(client, 'Blog Preview', {
    admin_access: false,
    app_access: false,
    description: '仅供博客服务器预览未发布内容，不允许进入管理后台。',
    icon: 'preview',
  });
  const previewRole = await ensureRole(client, 'Blog Preview', {
    description: '服务器端草稿预览专用服务角色。',
    icon: 'preview',
  });
  await ensureRolePolicyAccess(client, previewRole, previewPolicy);

  const publicDefinitions: PermissionDefinition[] = [
    { action: 'read', collection: 'articles', permissions: publicArticleFilter },
    ...['categories', 'tags', 'authors', 'site_settings', 'template_presets', 'articles_tags'].map(
      (collection): PermissionDefinition => ({ action: 'read', collection }),
    ),
    {
      action: 'read',
      collection: 'directus_files',
      fields: ['id', 'filename_download', 'title', 'description', 'type', 'width', 'height', 'focal_point_x', 'focal_point_y'],
    },
  ];
  const editorCollections = [
    'articles',
    'categories',
    'tags',
    'authors',
    'site_settings',
    'template_presets',
    'articles_tags',
    'directus_files',
    'directus_folders',
  ];
  const editorDefinitions = editorCollections.flatMap((collection) =>
    (['create', 'read', 'update', 'delete'] as const).map(
      (action): PermissionDefinition => ({ action, collection }),
    ),
  );
  const previewDefinitions: PermissionDefinition[] = [
    { action: 'read', collection: 'articles' },
    ...['categories', 'tags', 'authors', 'site_settings', 'template_presets', 'articles_tags'].map(
      (collection): PermissionDefinition => ({ action: 'read', collection }),
    ),
    {
      action: 'read',
      collection: 'directus_files',
      fields: ['id', 'filename_download', 'title', 'description', 'type', 'width', 'height', 'focal_point_x', 'focal_point_y'],
    },
  ];
  let created = 0;
  for (const definition of [...publicDefinitions, ...editorDefinitions, ...previewDefinitions]) {
    const policy = publicDefinitions.includes(definition)
      ? String(publicPolicy.id)
      : previewDefinitions.includes(definition)
        ? previewPolicy
        : editorPolicy;
    if (await ensurePermission(client, policy, definition)) {
      created += 1;
    }
  }
  return {
    created,
    createdPreviewUser: await ensurePreviewServiceUser(client, previewRole, previewToken),
  };
}

async function ensureAuthoringMetadata(
  client: DirectusAdminClient,
  publicBaseUrl: string,
  previewSecret: string,
): Promise<void> {
  await client.request('/fields/articles/slug', {
    body: JSON.stringify({
      meta: {
        interface: 'input',
        note: '可留空，由服务器自动生成安全且唯一的地址标识',
        required: false,
      },
    }),
    method: 'PATCH',
  });
  const collection = await client.request<{ data: { meta?: Record<string, unknown> | null } }>(
    '/collections/articles',
  );
  await client.request('/collections/articles', {
    body: JSON.stringify({
      meta: {
        ...(collection.data.meta ?? {}),
        preview_url: `${publicBaseUrl}/preview/posts/{{slug}}?secret=${previewSecret}`,
      },
    }),
    method: 'PATCH',
  });
}

const wechatDraftFlowId = '68012484-42dc-4e2d-a87e-14973d118bce';
const wechatDraftOperationId = '2f0e121c-a74e-4ae3-a969-c8a42b6a63a5';

export function buildWechatDraftFlowDefinition(enabled: boolean): {
  flow: Record<string, unknown>;
  operation: Record<string, unknown>;
} {
  return {
    flow: {
      accountability: '$trigger',
      description: enabled
        ? '从当前文章生成微信公众号草稿，最终发表仍需人工审核。'
        : '尚未配置公众号接口；博客发布不受影响。',
      icon: 'draft',
      id: wechatDraftFlowId,
      name: enabled ? '生成公众号草稿' : '生成公众号草稿｜尚未配置公众号接口',
      operation: wechatDraftOperationId,
      options: {
        async: false,
        collections: ['articles'],
        error_on_reject: true,
        location: 'item',
        requireConfirmation: true,
        confirmationDescription: '只生成公众号草稿，不会自动群发。',
      },
      status: 'active',
      trigger: 'manual',
    },
    operation: {
      flow: wechatDraftFlowId,
      id: wechatDraftOperationId,
      key: 'create_wechat_draft',
      name: '生成公众号草稿',
      options: { articleIds: '{{ $trigger.keys }}' },
      position_x: 19,
      position_y: 1,
      reject: null,
      resolve: null,
      type: 'gazi-wechat-draft',
    },
  };
}

async function ensureWechatDraftFlow(
  client: DirectusAdminClient,
  enabled: boolean,
): Promise<boolean> {
  const definition = buildWechatDraftFlowDefinition(enabled);
  const existingFlow = await findOne(client, '/flows', 'id', wechatDraftFlowId);
  if (!existingFlow) {
    await createItem(client, '/flows', { ...definition.flow, operation: null });
  }
  const existingOperation = await findOne(client, '/operations', 'id', wechatDraftOperationId);
  if (existingOperation) {
    await client.request(`/operations/${wechatDraftOperationId}`, {
      body: JSON.stringify(definition.operation),
      method: 'PATCH',
    });
  } else {
    await createItem(client, '/operations', definition.operation);
  }
  await client.request(`/flows/${wechatDraftFlowId}`, {
    body: JSON.stringify(definition.flow),
    method: 'PATCH',
  });
  return !existingFlow;
}

async function ensureSeedItem(
  client: DirectusAdminClient,
  collection: string,
  uniqueField: string,
  uniqueValue: string,
  data: Record<string, unknown>,
): Promise<{ created: boolean; item: IdentifiedItem }> {
  const existing = await findOne(client, `/items/${collection}`, uniqueField, uniqueValue);
  if (existing) return { created: false, item: existing };
  return { created: true, item: await createItem(client, `/items/${collection}`, data) };
}

async function ensureSeedData(client: DirectusAdminClient): Promise<number> {
  let created = 0;
  for (const category of defaultCategories) {
    if ((await ensureSeedItem(client, 'categories', 'slug', category.slug, { ...category })).created) created += 1;
  }
  for (const preset of defaultTemplatePresets) {
    if ((await ensureSeedItem(client, 'template_presets', 'key', preset.key, { ...preset })).created) created += 1;
  }
  const authorResult = await ensureSeedItem(client, 'authors', 'name', defaultAuthor.name, { ...defaultAuthor });
  if (authorResult.created) created += 1;
  const settings = await client.request<{ data: IdentifiedItem[] }>('/items/site_settings?fields=id&limit=1');
  if (settings.data.length === 0) {
    await createItem(client, '/items/site_settings', { ...defaultSiteSettings });
    created += 1;
  }

  const articleSource = JSON.parse(
    await readFile(new URL('../content/first-article.json', import.meta.url), 'utf8'),
  ) as Record<string, unknown> & { author_name: string; category_slug: string; slug: string };
  const category = await findOne(client, '/items/categories', 'slug', articleSource.category_slug);
  const author = await findOne(client, '/items/authors', 'name', articleSource.author_name);
  if (!category || !author) throw new Error('First article dependencies were not seeded');
  const { author_name: _authorName, category_slug: _categorySlug, ...article } = articleSource;
  void _authorName;
  void _categorySlug;
  if (
    (
      await ensureSeedItem(client, 'articles', 'slug', articleSource.slug, {
        ...article,
        author: author.id,
        category: category.id,
      })
    ).created
  ) {
    created += 1;
  }
  return created;
}

export interface BootstrapResult extends BootstrapPlan {
  createdPermissions: number;
  createdPreviewUser: boolean;
  createdRelations: number;
  createdSeedItems: number;
  createdWechatDraftFlow: boolean;
}

export async function initializeDirectus(environment = process.env): Promise<BootstrapResult> {
  const baseUrl = environment.DIRECTUS_URL?.replace(/\/+$/, '');
  const email = environment.DIRECTUS_ADMIN_EMAIL;
  const password = environment.DIRECTUS_ADMIN_PASSWORD;
  const previewSecret = environment.PREVIEW_SECRET;
  const previewToken = environment.DIRECTUS_PREVIEW_TOKEN;
  const publicBaseUrl = environment.PUBLIC_BASE_URL?.replace(/\/+$/, '');
  if (!baseUrl || !email || !password || !previewSecret || !previewToken || !publicBaseUrl) {
    throw new Error(
      'DIRECTUS_URL, DIRECTUS_ADMIN_EMAIL, DIRECTUS_ADMIN_PASSWORD, DIRECTUS_PREVIEW_TOKEN, PREVIEW_SECRET and PUBLIC_BASE_URL are required',
    );
  }
  const client = new DirectusAdminClient(baseUrl, email, password);
  await client.login();
  const existing = await readExistingState(client);
  const plan = planBootstrap(existing);

  for (const collectionName of plan.createCollections) {
    const definition = collections[collectionName];
    await client.request('/collections', {
      body: JSON.stringify({
        collection: collectionName,
        meta: { icon: definition.icon, note: definition.note },
        schema: { name: collectionName },
      }),
      method: 'POST',
    });
  }

  const refreshed = await readExistingState(client);
  const fieldPlan = planBootstrap(refreshed);
  for (const [collectionName, fieldNames] of Object.entries(fieldPlan.createFields)) {
    for (const fieldName of fieldNames) {
      const field = collections[collectionName].fields.find((item) => item.field === fieldName);
      if (!field) continue;
      await client.request(`/fields/${collectionName}`, {
        body: JSON.stringify(field),
        method: 'POST',
      });
    }
  }
  const afterFields = await readExistingState(client);
  const updatePlan = planBootstrap(afterFields);
  for (const [collectionName, fieldNames] of Object.entries(updatePlan.updateFieldTypes)) {
    for (const fieldName of fieldNames) {
      const field = collections[collectionName].fields.find((item) => item.field === fieldName);
      if (!field) continue;
      if (field.type === 'integer') {
        const query = new URLSearchParams({
          [`filter[${fieldName}][_nnull]`]: 'true',
          fields: 'id',
          limit: '1',
        });
        const populated = await client.request<{ data: IdentifiedItem[] }>(
          `/items/${collectionName}?${query}`,
        );
        if (populated.data.length > 0) {
          throw new Error(
            `Refusing to rebuild populated field ${collectionName}.${fieldName} during type repair`,
          );
        }
        await client.request(`/fields/${collectionName}/${fieldName}`, { method: 'DELETE' });
        await client.request(`/fields/${collectionName}`, {
          body: JSON.stringify(field),
          method: 'POST',
        });
        continue;
      }
      await client.request(`/fields/${collectionName}/${fieldName}`, {
        body: JSON.stringify(field),
        method: 'PATCH',
      });
    }
  }
  const createdRelations = await ensureRelations(client);
  const permissionResult = await ensurePermissions(client, previewToken);
  await ensureAuthoringMetadata(client, publicBaseUrl, previewSecret);
  const createdWechatDraftFlow = await ensureWechatDraftFlow(
    client,
    environment.WECHAT_DRAFT_ENABLED === 'true' &&
      Boolean(environment.WECHAT_APP_ID) &&
      Boolean(environment.WECHAT_APP_SECRET) &&
      Boolean(environment.WECHAT_AUTOMATION_SECRET),
  );
  const createdSeedItems = await ensureSeedData(client);
  return {
    createCollections: plan.createCollections,
    createFields: fieldPlan.createFields,
    createdPermissions: permissionResult.created,
    createdPreviewUser: permissionResult.createdPreviewUser,
    createdRelations,
    createdSeedItems,
    createdWechatDraftFlow,
    updateFieldTypes: updatePlan.updateFieldTypes,
  };
}

async function main(): Promise<void> {
  const result = await initializeDirectus();
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const entryPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (entryPath === import.meta.url) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Directus initialization failed');
    process.exitCode = 1;
  });
}
