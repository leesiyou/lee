document.querySelectorAll('[data-quiz]').forEach((quiz) => {
  if (!(quiz instanceof HTMLElement) || quiz.dataset.enhanced === 'true') return;
  quiz.dataset.enhanced = 'true';
  const button = quiz.querySelector('[data-quiz-submit]');
  const result = quiz.querySelector('[data-quiz-result]');
  button?.addEventListener('click', () => {
    const checked = [...quiz.querySelectorAll('input:checked')];
    const questionCount = quiz.querySelectorAll('fieldset').length;
    if (checked.length !== questionCount) {
      if (result) result.textContent = '请先完成全部题目。';
      return;
    }
    const score = checked.reduce((total, item) => total + Number(item.value), 0);
    if (result) {
      result.textContent =
        score >= questionCount
          ? '你更接近建设者逻辑：继续把时间投入可积累的价值。'
          : '你正在被短期机会牵引：先确认这次选择会留下什么。';
    }
  });
});
