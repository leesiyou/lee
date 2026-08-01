import { describe, expect, it } from 'vitest';

import { getTemplatePreset, templatePresets } from './templates';

describe('templatePresets', () => {
  it('contains exactly the four approved article templates', () => {
    expect(Object.keys(templatePresets)).toEqual([
      'philosophy',
      'business',
      'diary',
      'retrospective',
    ]);
    expect(templatePresets.philosophy.label).toBe('哲学思辨');
    expect(templatePresets.business.label).toBe('商业拆解');
    expect(templatePresets.diary.label).toBe('创业日记');
    expect(templatePresets.retrospective.label).toBe('项目复盘');
  });

  it('falls back safely when stored content contains an unknown template', () => {
    expect(getTemplatePreset('unknown').key).toBe('philosophy');
  });
});
