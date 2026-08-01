import { describe, expect, it } from 'vitest';

import { buildWechatDraftFlowDefinition, planBootstrap } from './initialize-directus';

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

describe('公众号草稿手动流程', () => {
  it('creates an item-page action without persisting an automation secret', () => {
    const definition = buildWechatDraftFlowDefinition(false);

    expect(definition.flow).toMatchObject({
      name: '生成公众号草稿｜尚未配置公众号接口',
      trigger: 'manual',
      options: { collections: ['articles'], location: 'item' },
    });
    expect(definition.operation).toMatchObject({
      type: 'gazi-wechat-draft',
      options: { articleIds: '{{ $trigger.keys }}' },
    });
    expect(JSON.stringify(definition)).not.toContain('AUTOMATION_SECRET');
  });
});
