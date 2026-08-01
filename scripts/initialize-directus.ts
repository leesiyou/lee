import { pathToFileURL } from 'node:url';

import { collections } from './directus-model';

export interface ExistingModelState {
  collections: Set<string>;
  fields: Map<string, Set<string>>;
}

export interface BootstrapPlan {
  createCollections: string[];
  createFields: Record<string, string[]>;
}

export function planBootstrap(existing: ExistingModelState): BootstrapPlan {
  const createCollections: string[] = [];
  const createFields: Record<string, string[]> = {};
  for (const [collectionName, definition] of Object.entries(collections)) {
    if (!existing.collections.has(collectionName)) createCollections.push(collectionName);
    const existingFields = existing.fields.get(collectionName) ?? new Set<string>();
    createFields[collectionName] = definition.fields
      .map((field) => field.field)
      .filter((field) => !existingFields.has(field));
  }
  return { createCollections, createFields };
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

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${this.token}`,
        ...(init?.body ? { 'content-type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
    if (!response.ok) throw new Error(`Directus request failed ${path} (${response.status})`);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
}

async function readExistingState(client: DirectusAdminClient): Promise<ExistingModelState> {
  const collectionPayload = await client.request<{ data: Array<{ collection: string }> }>('/collections');
  const collectionNames = new Set(collectionPayload.data.map((item) => item.collection));
  const fields = new Map<string, Set<string>>();
  for (const collection of Object.keys(collections)) {
    if (!collectionNames.has(collection)) continue;
    const fieldPayload = await client.request<{ data: Array<{ field: string }> }>(`/fields/${collection}`);
    fields.set(collection, new Set(fieldPayload.data.map((item) => item.field)));
  }
  return { collections: collectionNames, fields };
}

export async function initializeDirectus(environment = process.env): Promise<BootstrapPlan> {
  const baseUrl = environment.DIRECTUS_URL?.replace(/\/+$/, '');
  const email = environment.DIRECTUS_ADMIN_EMAIL;
  const password = environment.DIRECTUS_ADMIN_PASSWORD;
  if (!baseUrl || !email || !password) {
    throw new Error('DIRECTUS_URL, DIRECTUS_ADMIN_EMAIL and DIRECTUS_ADMIN_PASSWORD are required');
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
  return { createCollections: plan.createCollections, createFields: fieldPlan.createFields };
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
