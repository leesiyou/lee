import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const componentNames = [
  'ActionList',
  'CaseStudy',
  'Conclusion',
  'DataCard',
  'DimensionCompare',
  'Hero',
  'Quiz',
  'Quote',
  'ShareCard',
  'Statement',
  'Timeline',
  'TruthCard',
];

describe('H5 article components', () => {
  it.each(componentNames)('%s avoids unsafe HTML and remote font dependencies', async (name) => {
    const path = fileURLToPath(new URL(`./${name}.astro`, import.meta.url));
    const source = await readFile(path, 'utf8');

    expect(source).not.toMatch(/set:html|onclick=|fonts\.(googleapis|gstatic)\.com/i);
    expect(source).toMatch(/class=/);
  });
});
