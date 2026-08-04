const profiles = {
  casual: {
    title: '轻松爱好',
    summary: '街舞现在主要为你的生活充电。它不需要被包装成事业，快乐、身体感受和朋友关系本身就有价值。',
    strength: '你保留了自由和低压力，更容易听见自己真正喜欢什么。',
    risk: '如果你想进步，完全随缘可能让身体和技术长期停在同一位置。',
    actions: [
      '选一个最喜欢的舞种，每周固定一次 60 分钟练习。',
      '参加一次真实 cypher、battle 或本地交流，不只在线学动作。',
      '写下“我为什么跳”，三个月后再看答案有没有变化。',
    ],
  },
  serious: {
    title: '严肃爱好',
    summary: '街舞已经是你的长期身份与技艺，但生计并不依赖它。这不是职业的“前一等级”，而是一种可以持续终身的完整选择。',
    strength: '你能长期学习文化与技术，同时保留较强的选择权。',
    risk: '容易被外界用“都这么认真了为什么不职业”推动，忽略自己的生活边界。',
    actions: [
      '建立 12 周训练记录：音乐、基础、作品和身体状态各留一项证据。',
      '明确今年不出售什么、愿意尝试出售什么，保护热爱边界。',
      '为本地社群贡献一次具体行动：分享、志愿、组织或支持新人。',
    ],
  },
  builder: {
    title: '准职业建设者',
    summary: '你已经开始被市场验证，但职业结构还没有完全稳定。现在最重要的不是马上辞掉其他工作，而是验证交付、价格、复购与身体承受力。',
    strength: '你既有热爱，也开始把能力转换成可以重复交付的价值。',
    risk: '免费劳动、低价内卷、伤病和现金流断档可能快速消耗热爱。',
    actions: [
      '只选一个最小职业产品：一门课、一个编舞包或一种演出服务。',
      '连续记录 90 天线索、报价、成交、复购、成本与训练小时。',
      '建立合同、取消规则、伤病预案和至少一个月基本支出缓冲。',
    ],
  },
  portfolio: {
    title: '组合式职业舞者',
    summary: '舞蹈已经是一组相互支撑的工作：训练、教学、创作、演出、比赛、内容或运营。你的核心问题不再是“算不算职业”，而是能否健康、可持续地继续。',
    strength: '你拥有多角色能力、职业信用和真实的市场连接。',
    risk: '角色过多会挤压训练与恢复；短期流量和订单也可能反过来控制表达。',
    actions: [
      '计算每项业务的时薪、毛利、复购和身体负荷，砍掉最低价值的一项。',
      '每周锁定不可售卖的训练与恢复时间，不让所有时间都变成订单。',
      '建立三个月现金缓冲，并培养一项伤病期间仍能交付的能力。',
    ],
  },
};

function scoreProfile(score) {
  if (score <= 6) return 'casual';
  if (score <= 12) return 'serious';
  if (score <= 18) return 'builder';
  return 'portfolio';
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('copy command failed');
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const answers = new Map();
const totalQuestions = 12;
const quiz = document.querySelector('#identity-quiz');
const progressText = document.querySelector('#quiz-progress');
const status = document.querySelector('#quiz-status');
const resultPanel = document.querySelector('#quiz-result');
const resultTitle = document.querySelector('#result-title');
const resultScore = document.querySelector('#result-score');
const resultSummary = document.querySelector('#result-summary');
const resultStrength = document.querySelector('#result-strength');
const resultRisk = document.querySelector('#result-risk');
const resultActions = document.querySelector('#result-actions');
const copyStatus = document.querySelector('#copy-status');
const backToTop = document.querySelector('#back-to-top');
const readingProgress = document.querySelector('#reading-progress-bar');

function updateQuizProgress() {
  const answered = answers.size;
  progressText.textContent = `${answered} / ${totalQuestions} 已回答`;
  if (answered === totalQuestions) {
    status.textContent = '全部完成，可以生成身份报告';
    status.classList.remove('is-error');
  } else {
    status.textContent = `还缺少 ${totalQuestions - answered} 题`;
  }
}

function renderResult() {
  if (answers.size !== totalQuestions) {
    const missing = totalQuestions - answers.size;
    status.textContent = `还缺少 ${missing} 题，请完成后再生成报告`;
    status.classList.add('is-error');
    const firstMissing = Array.from({ length: totalQuestions }, (_, index) => String(index + 1))
      .find((question) => !answers.has(question));
    document.querySelector(`.quiz-question[data-question="${firstMissing}"]`)?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    });
    return;
  }

  const score = Array.from(answers.values()).reduce((sum, value) => sum + value, 0);
  const key = scoreProfile(score);
  const profile = profiles[key];
  resultPanel.dataset.profile = key;
  resultScore.textContent = `${score} / 24 · 当前关系`;
  resultTitle.textContent = profile.title;
  resultSummary.textContent = profile.summary;
  resultStrength.textContent = profile.strength;
  resultRisk.textContent = profile.risk;
  resultActions.replaceChildren(...profile.actions.map((action) => {
    const item = document.createElement('li');
    item.textContent = action;
    return item;
  }));
  resultPanel.hidden = false;
  status.textContent = '报告已生成。它是当前状态，不是永久标签。';
  status.classList.remove('is-error');
  resultPanel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

function resultText() {
  const actions = Array.from(resultActions.querySelectorAll('li'))
    .map((item, index) => `${index + 1}. ${item.textContent}`)
    .join('\n');
  return [
    '我的街舞身份测试',
    `${resultScore.textContent}：${resultTitle.textContent}`,
    resultSummary.textContent,
    `优势：${resultStrength.textContent}`,
    `留意：${resultRisk.textContent}`,
    '接下来 90 天：',
    actions,
    'https://gazidaily.iepose.cn/h5/2026-08-04/street-dance-professional-vs-hobby/',
    '街舞星球 × 街舞加油站 出品',
  ].join('\n');
}

async function copyResult() {
  const text = resultText();
  copyStatus.classList.remove('is-error');
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      fallbackCopy(text);
    }
    copyStatus.textContent = '结果已复制，可以发给朋友。';
  } catch (error) {
    try {
      fallbackCopy(text);
      copyStatus.textContent = '结果已复制，可以发给朋友。';
    } catch (fallbackError) {
      copyStatus.textContent = '复制失败，请长按结果内容手动复制。';
      copyStatus.classList.add('is-error');
    }
  }
}

function resetQuiz() {
  answers.clear();
  quiz.querySelectorAll('[data-score]').forEach((button) => button.setAttribute('aria-pressed', 'false'));
  resultPanel.hidden = true;
  resultPanel.removeAttribute('data-profile');
  copyStatus.textContent = '';
  status.textContent = '请完成全部 12 题';
  status.classList.remove('is-error');
  updateQuizProgress();
  document.querySelector('.quiz-intro')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}

quiz.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-score]');
  if (!button) return;
  const question = button.dataset.question;
  const score = Number(button.dataset.score);
  answers.set(question, score);
  quiz.querySelectorAll(`button[data-question="${question}"]`)
    .forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
  updateQuizProgress();
});

document.querySelector('#show-result').addEventListener('click', renderResult);
document.querySelector('#copy-result').addEventListener('click', copyResult);
document.querySelector('#reset-quiz').addEventListener('click', resetQuiz);

function updateReadingProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
  readingProgress.style.width = `${progress}%`;
  backToTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
}

window.addEventListener('scroll', updateReadingProgress, { passive: true });
window.addEventListener('resize', updateReadingProgress);
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

const revealItems = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  revealItems.forEach((item) => observer.observe(item));
}

updateQuizProgress();
updateReadingProgress();
