import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const currentDocs = [
  '../README.md',
  './ARCHITECTURE.md',
  './DEPLOYMENT.md',
  './NODE_XIAOBAO.md',
  './OPERATIONS.md',
  './SECURITY.md',
] as const;

describe('WeChat-first deployment documentation', () => {
  it('uses one Node Xiaobao HTTPS frontend and a LAN-only admin', async () => {
    const sources = await Promise.all(
      currentDocs.map((path) => readFile(new URL(path, import.meta.url), 'utf8')),
    );
    const combined = sources.join('\n');

    expect(combined).toContain('127.0.0.1:18432');
    expect(combined).toContain('192.168.5.104:18055');
    expect(combined).toContain('公众号');
    expect(combined).not.toMatch(/blog\.easybreak\.top|blog-admin\.easybreak\.top|19080|19081/);

    const nodeXiaobao = sources[3];
    expect(nodeXiaobao).toContain('127.0.0.1:18432');
    expect(nodeXiaobao).not.toContain('127.0.0.1:18055');
  });
});
