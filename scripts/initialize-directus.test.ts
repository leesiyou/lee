import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  buildWechatDraftFlowDefinition,
  editorWechatFlowPermission,
  planBootstrap,
} from './initialize-directus';

describe('planBootstrap', () => {
  it('creates only missing collections and fields', () => {
    const operations = planBootstrap({
      collections: new Set(['articles']),
      fields: new Map([['articles', new Set(['id', 'title'])]]),
    });

    expect(operations.createCollections).not.toContain('articles');
    expect(operations.createCollections).toEqual(
      expect.arrayContaining(['categories', 'tags', 'authors', 'site_settings', 'template_presets']),
    );
    expect(operations.createFields.articles).not.toContain('id');
    expect(operations.createFields.articles).not.toContain('title');
    expect(operations.createFields.articles).toContain('slug');
  });

  it('is a no-op when the project model already exists', () => {
    const first = planBootstrap({ collections: new Set(), fields: new Map() });
    const existing = {
      collections: new Set(first.createCollections),
      fields: new Map(
        Object.entries(first.createFields).map(([collection, fields]) => [collection, new Set(fields)]),
      ),
    };
    const second = planBootstrap(existing);

    expect(second.createCollections).toEqual([]);
    expect(Object.values(second.createFields).flat()).toEqual([]);
    expect(Object.values(second.updateFieldTypes).flat()).toEqual([]);
  });

  it('repairs a mismatched relation key type without recreating its field', () => {
    const operations = planBootstrap({
      collections: new Set(['articles']),
      fields: new Map([['articles', new Set(['author'])]]),
      fieldTypes: new Map([['articles', new Map([['author', 'uuid']])]]),
    });

    expect(operations.createFields.articles).not.toContain('author');
    expect(operations.updateFieldTypes.articles).toContain('author');
  });
});

describe('seed articles', () => {
  it('seeds both formal articles by stable slug without deleting history', async () => {
    const source = await readFile(new URL('./initialize-directus.ts', import.meta.url), 'utf8');

    expect(source).toContain("'first-article.json'");
    expect(source).toContain("'streetdance-decade-review.json'");
    expect(source).toContain('for (const articleFile of seedArticleFiles)');
    expect(source).toContain("ensureSeedItem(client, 'articles', 'slug'");
  });
});

describe('NAS initializer runtime', () => {
  it('imports with the Node strip-only TypeScript runtime used by deployment', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '--eval',
        "import('./scripts/initialize-directus.ts')",
      ],
      {
        cwd: fileURLToPath(new URL('../', import.meta.url)),
        encoding: 'utf8',
      },
    );

    expect(result.status, result.stderr).toBe(0);
  });
});

describe('公众号素材手动流程', () => {
  it('creates an item-page action without persisting an automation secret', () => {
    const definition = buildWechatDraftFlowDefinition(false);

    expect(definition.flow).toMatchObject({
      name: '生成公众号素材',
      trigger: 'manual',
      options: {
        collections: ['articles'],
        confirmationDescription: '生成可复制的公众号素材；不会自动群发。',
        location: 'item',
      },
    });
    expect(definition.operation).toMatchObject({
      key: 'generate_wechat_material',
      name: '生成公众号素材',
      type: 'gazi-wechat-draft',
      options: { articleIds: '{{ $trigger.keys }}' },
      resolve: definition.notificationOperation.id,
    });
    expect(definition.notificationOperation).toMatchObject({
      type: 'notification',
      options: {
        message: '{{ generate_wechat_material.message }}',
        recipient: '{{ $accountability.user }}',
      },
    });
    expect(JSON.stringify(definition)).not.toContain('AUTOMATION_SECRET');
  });

  it('allows Editor to read only the one manual flow without managing flows', () => {
    expect(editorWechatFlowPermission).toEqual({
      action: 'read',
      collection: 'directus_flows',
      fields: ['id', 'name', 'icon', 'description', 'status', 'trigger', 'options', 'operation'],
      permissions: { id: { _eq: '68012484-42dc-4e2d-a87e-14973d118bce' } },
    });
  });
});
