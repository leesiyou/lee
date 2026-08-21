import type { ArticleTemplate } from './types';

export interface TemplatePreset {
  accent: string;
  key: ArticleTemplate;
  label: string;
  sections: readonly string[];
}

export const templatePresets: Record<ArticleTemplate, TemplatePreset> = {
  philosophy: {
    accent: '#c6a96b',
    key: 'philosophy',
    label: '哲学思辨',
    sections: ['大标题', '核心矛盾', '定义切换', '多维度比较', '哲学金句', '现实真相', '自我测试', '终局结论'],
  },
  business: {
    accent: '#ff6b3d',
    key: 'business',
    label: '商业拆解',
    sections: ['问题', '表象', '底层原因', '案例', '数据', '方法', '执行清单', '结论'],
  },
  diary: {
    accent: '#4f8cff',
    key: 'diary',
    label: '创业日记',
    sections: ['今天发生了什么', '做对了什么', '做错了什么', '客户反馈', '现金流变化', '明天行动', '一句反思'],
  },
  retrospective: {
    accent: '#20a37a',
    key: 'retrospective',
    label: '项目复盘',
    sections: ['目标', '投入', '过程', '结果', '偏差', '原因', '经验', '下一轮动作'],
  },
};

export function getTemplatePreset(value: string | null | undefined): TemplatePreset {
  if (value && Object.hasOwn(templatePresets, value)) {
    return templatePresets[value as ArticleTemplate];
  }
  return templatePresets.philosophy;
}
