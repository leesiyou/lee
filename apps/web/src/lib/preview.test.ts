import { describe, expect, it } from 'vitest';

import { authorizePreview } from './preview';

describe('preview authorization', () => {
  it('rejects missing or incorrect secrets', () => {
    expect(authorizePreview(undefined, 'configured')).toBe(false);
    expect(authorizePreview('wrong', 'configured')).toBe(false);
    expect(authorizePreview('configured', 'configured')).toBe(true);
  });
});
