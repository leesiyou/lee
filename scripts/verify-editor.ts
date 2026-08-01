import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

interface FixtureRecord {
  name: string;
  slug: string;
  sort: number;
}

export function buildEditorFixture(suffix: string): {
  article: Record<string, unknown>;
  category: FixtureRecord;
  tag: FixtureRecord;
} {
  return {
    article: {
      content: '<h2>编辑验收</h2><p>这是一条临时验收文章，完成后自动删除。</p>',
      published_at: new Date(Date.now() - 60_000).toISOString(),
      status: 'draft',
      summary: '编辑角色完整流程验收',
      template: 'diary',
      theme: '#c6a96b',
      title: '编辑角色验收文章',
    },
    category: { name: '验收分类', slug: `acceptance-category-${suffix}`, sort: 999 },
    tag: { name: '验收标签', slug: `acceptance-tag-${suffix}`, sort: 999 },
  };
}

class DirectusClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${this.token}`,
        ...(init?.body && !(init.body instanceof FormData) ? { 'content-type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
    if (!response.ok) {
      const detail = (await response.text()).replace(/\s+/g, ' ').slice(0, 300);
      throw new Error(`Directus request failed ${path} (${response.status}): ${detail}`);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  async status(path: string): Promise<number> {
    return (
      await fetch(`${this.baseUrl}${path}`, {
        headers: { accept: 'application/json', authorization: `Bearer ${this.token}` },
      })
    ).status;
  }
}

async function login(baseUrl: string, email: string, password: string): Promise<string> {
  const response = await fetch(`${baseUrl}/auth/login`, {
    body: JSON.stringify({ email, password }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
  if (!response.ok) throw new Error(`Editor verification admin login failed (${response.status})`);
  const payload = (await response.json()) as { data?: { access_token?: string } };
  if (!payload.data?.access_token) throw new Error('Editor verification login returned no token');
  return payload.data.access_token;
}

function requireEnvironment(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name];
  if (!value) throw new Error(`${name} is required`);
  return value.replace(/\/+$/, '');
}

async function anonymousCount(baseUrl: string, slug: string): Promise<number> {
  const query = new URLSearchParams({ 'filter[slug][_eq]': slug, fields: 'id', limit: '1' });
  const response = await fetch(`${baseUrl}/items/articles?${query}`);
  if (!response.ok) throw new Error(`Anonymous Editor acceptance query failed (${response.status})`);
  const payload = (await response.json()) as { data?: unknown[] };
  return payload.data?.length ?? 0;
}

export async function verifyEditor(environment = process.env): Promise<Record<string, unknown>> {
  const directusUrl = requireEnvironment(environment, 'DIRECTUS_URL');
  const frontendUrl = requireEnvironment(environment, 'FRONTEND_URL');
  const email = requireEnvironment(environment, 'DIRECTUS_ADMIN_EMAIL');
  const password = requireEnvironment(environment, 'DIRECTUS_ADMIN_PASSWORD');
  const admin = new DirectusClient(directusUrl, await login(directusUrl, email, password));
  const suffix = String(Date.now());
  const fixture = buildEditorFixture(suffix);
  const staticToken = randomBytes(32).toString('hex');
  const created: { article?: string | number; category?: string | number; file?: string; notification?: string | number; rejectedFile?: string; tag?: string | number; user?: string } = {};

  try {
    const roles = await admin.request<{ data: Array<{ id: string }> }>(
      '/roles?filter[name][_eq]=Editor&fields=id&limit=1',
    );
    const role = roles.data[0]?.id;
    if (!role) throw new Error('Editor role was not found');
    const user = await admin.request<{ data: { id: string } }>('/users', {
      body: JSON.stringify({
        email: `acceptance-editor-${suffix}@easybreak.top`,
        first_name: 'Acceptance Editor',
        role,
        status: 'active',
        token: staticToken,
      }),
      method: 'POST',
    });
    created.user = user.data.id;
    const editor = new DirectusClient(directusUrl, staticToken);

    const category = await editor.request<{ data: { id: string | number } }>('/items/categories', {
      body: JSON.stringify(fixture.category),
      method: 'POST',
    });
    created.category = category.data.id;
    const tag = await editor.request<{ data: { id: string | number } }>('/items/tags', {
      body: JSON.stringify(fixture.tag),
      method: 'POST',
    });
    created.tag = tag.data.id;

    const onePixelPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4ZQAAAAASUVORK5CYII=',
      'base64',
    );
    const fileForm = new FormData();
    fileForm.append('file', new Blob([onePixelPng], { type: 'image/png' }), 'acceptance-cover.png');
    const file = await editor.request<{ data: { id: string } }>('/files', {
      body: fileForm,
      method: 'POST',
    });
    created.file = file.data.id;
    const rejectedForm = new FormData();
    rejectedForm.append('file', new Blob(['not an image'], { type: 'text/plain' }), 'blocked.txt');
    const rejectedUpload = await fetch(`${directusUrl}/files`, {
      body: rejectedForm,
      headers: { authorization: `Bearer ${staticToken}` },
      method: 'POST',
    });
    if (rejectedUpload.ok) {
      const unexpected = (await rejectedUpload.json()) as { data?: { id?: string } };
      created.rejectedFile = unexpected.data?.id;
      throw new Error('Directus accepted a disallowed text upload');
    }
    if (![400, 415].includes(rejectedUpload.status)) {
      throw new Error(`Disallowed upload returned unexpected status ${rejectedUpload.status}`);
    }

    const article = await editor.request<{ data: { id: string | number; slug: string } }>(
      '/items/articles?fields=id,slug',
      {
        body: JSON.stringify({
          ...fixture.article,
          category: created.category,
          cover_image: created.file,
          tags: [{ tags_id: created.tag }],
        }),
        method: 'POST',
      },
    );
    created.article = article.data.id;
    const slug = article.data.slug;
    if (!/^post-[a-f0-9]{10}$/.test(slug)) throw new Error('Editor blank slug was not generated');
    if ((await anonymousCount(directusUrl, slug)) !== 0) throw new Error('Editor draft leaked publicly');

    const wechatFlowId = '68012484-42dc-4e2d-a87e-14973d118bce';
    const wechatFlow = await editor.request<{ data: { id: string; name: string } }>(
      `/flows/${wechatFlowId}?fields=id,name`,
    );
    if (!wechatFlow.data.name.includes('尚未配置公众号接口')) {
      throw new Error('Editor WeChat action did not display its disabled state');
    }
    await editor.request(`/flows/trigger/${wechatFlowId}`, {
      body: JSON.stringify({ collection: 'articles', keys: [created.article] }),
      method: 'POST',
    });
    const notifications = await editor.request<{
      data: Array<{ id: string | number; message: string }>;
    }>(
      `/notifications?filter[subject][_eq]=${encodeURIComponent('公众号草稿操作结果')}&sort=-timestamp&fields=id,message&limit=1`,
    );
    const notification = notifications.data[0];
    if (!notification || notification.message !== '尚未配置公众号接口') {
      throw new Error('Editor WeChat action did not return the explicit not-configured notice');
    }
    created.notification = notification.id;
    await editor.request(`/notifications/${created.notification}`, { method: 'DELETE' });
    created.notification = undefined;

    await editor.request(`/items/articles/${created.article}`, {
      body: JSON.stringify({ status: 'published' }),
      method: 'PATCH',
    });
    if ((await anonymousCount(directusUrl, slug)) !== 1) throw new Error('Editor publish did not become public');
    const publishedPage = await fetch(`${frontendUrl}/posts/${slug}`);
    if (publishedPage.status !== 200) throw new Error(`Published Editor page returned ${publishedPage.status}`);

    const updatedTitle = '编辑角色验收文章已更新';
    await editor.request(`/items/articles/${created.article}`, {
      body: JSON.stringify({ title: updatedTitle }),
      method: 'PATCH',
    });
    if (!(await (await fetch(`${frontendUrl}/posts/${slug}`)).text()).includes(updatedTitle)) {
      throw new Error('Editor update was not reflected on the H5 page');
    }

    await editor.request(`/items/articles/${created.article}`, {
      body: JSON.stringify({ status: 'archived' }),
      method: 'PATCH',
    });
    if ((await fetch(`${frontendUrl}/posts/${slug}`)).status !== 404) {
      throw new Error('Archived Editor article remained public');
    }

    const systemMetadataStatuses = await Promise.all([
      editor.status('/settings'),
      editor.status('/roles'),
      editor.status('/users'),
    ]);
    const policyPermissions = await admin.request<{
      data: Array<{ action: string; collection: string }>;
    }>('/permissions?filter[policy][name][_eq]=Editor&fields=collection,action&limit=-1');
    const forbiddenSystemCollections = new Set([
      'directus_users',
      'directus_roles',
      'directus_settings',
      'directus_extensions',
    ]);
    const forbiddenPermissions = policyPermissions.data.filter((permission) =>
      forbiddenSystemCollections.has(permission.collection),
    );
    if (forbiddenPermissions.length > 0) {
      throw new Error('Editor received a forbidden system permission');
    }

    await editor.request(`/items/articles/${created.article}`, { method: 'DELETE' });
    created.article = undefined;
    await editor.request(`/files/${created.file}`, { method: 'DELETE' });
    created.file = undefined;
    await editor.request(`/items/tags/${created.tag}`, { method: 'DELETE' });
    created.tag = undefined;
    await editor.request(`/items/categories/${created.category}`, { method: 'DELETE' });
    created.category = undefined;

    return {
      archiveHidden: true,
      coverUpload: true,
      draftPrivate: true,
      editorCrud: true,
      publishedVisible: true,
      forbiddenSystemPermissions: forbiddenPermissions.length,
      rejectedUploadStatus: rejectedUpload.status,
      systemMetadataStatuses,
      updateVisible: true,
      wechatDraftActionVisible: true,
      wechatNotConfiguredNotice: true,
    };
  } finally {
    const cleanup: Array<Promise<unknown>> = [];
    if (created.article) cleanup.push(admin.request(`/items/articles/${created.article}`, { method: 'DELETE' }));
    if (created.file) cleanup.push(admin.request(`/files/${created.file}`, { method: 'DELETE' }));
    if (created.notification) cleanup.push(admin.request(`/notifications/${created.notification}`, { method: 'DELETE' }));
    if (created.rejectedFile) cleanup.push(admin.request(`/files/${created.rejectedFile}`, { method: 'DELETE' }));
    if (created.tag) cleanup.push(admin.request(`/items/tags/${created.tag}`, { method: 'DELETE' }));
    if (created.category) cleanup.push(admin.request(`/items/categories/${created.category}`, { method: 'DELETE' }));
    if (created.user) cleanup.push(admin.request(`/users/${created.user}`, { method: 'DELETE' }));
    await Promise.allSettled(cleanup);
  }
}

async function main(): Promise<void> {
  process.stdout.write(`${JSON.stringify(await verifyEditor())}\n`);
}

const entryPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (entryPath === import.meta.url) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Editor verification failed');
    process.exitCode = 1;
  });
}
