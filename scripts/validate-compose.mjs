import { readFile } from 'node:fs/promises';
import process from 'node:process';

import { parse } from 'yaml';

export async function validateCompose(path) {
  const compose = parse(await readFile(path, 'utf8'), { merge: true });
  const expected = ['postgres', 'redis', 'directus', 'web', 'caddy'];
  const actual = Object.keys(compose.services ?? {});
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected service list: ${actual.join(',')}`);
  }
  for (const [name, service] of Object.entries(compose.services)) {
    if (service.restart !== 'unless-stopped') throw new Error(`${name}: restart policy missing`);
    if (!service.healthcheck) throw new Error(`${name}: healthcheck missing`);
    if (!service.deploy?.resources?.limits) throw new Error(`${name}: resource limits missing`);
    if (!service.logging?.options?.['max-size']) throw new Error(`${name}: log rotation missing`);
  }
  for (const name of ['postgres', 'redis', 'directus', 'web']) {
    if (compose.services[name].ports) throw new Error(`${name}: host ports are forbidden`);
  }
  if (!compose.networks?.blog_internal?.internal) throw new Error('blog_internal must be internal');
  return true;
}

const path = process.argv[2];
if (!path) {
  console.error('Usage: node scripts/validate-compose.mjs <compose.yaml>');
  process.exitCode = 2;
} else {
  validateCompose(path)
    .then(() => process.stdout.write('compose-structure: ok\n'))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : 'compose validation failed');
      process.exitCode = 1;
    });
}
