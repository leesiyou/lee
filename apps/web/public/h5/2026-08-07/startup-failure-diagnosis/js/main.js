/* ============================================
   创业企业倒闭原因知识系统 · main.js
   交互：滚动显现 + 阅读进度 + 自检问卷
   ============================================ */

(function () {
  'use strict';

  // ==========================================
  // 阅读进度条
  // ==========================================
  const progressBar = document.getElementById('reading-progress-bar');
  if (progressBar) {
    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      progressBar.style.width = (pct * 100) + '%';
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
  }

  // ==========================================
  // 滚动显现动画 (Intersection Observer)
  // ==========================================
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // 只触发一次
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );
    revealElements.forEach((el) => observer.observe(el));
  }

  // ==========================================
  // 自检问卷
  // ==========================================
  const quiz = document.querySelector('[data-quiz]');
  if (quiz) {
    const submitBtn = quiz.querySelector('[data-quiz-submit]');
    const resultBox = quiz.querySelector('[data-quiz-result]');
    const questions = quiz.querySelectorAll('.quiz__question');

    function getScoreLabel(score) {
      if (score <= 12) return { level: 'low', label: '🟢 低风险', desc: '企业整体风险较低。继续保持对现金、市场和客户变化的关注。' };
      if (score <= 24) return { level: 'mid', label: '🟡 中等风险', desc: '出现结构性隐患。建议对得分最高的几个维度进行专项分析，制定改进计划。' };
      if (score <= 36) return { level: 'high', label: '🟠 高风险', desc: '企业存在多个严重风险点。建议立即进行现金流压力测试，暂停所有非必要扩张，重新评估商业模式的关键假设。' };
      return { level: 'critical', label: '🔴 极高风险', desc: '企业可能已处于危险区间。建议在30天内完成全面财务审计、业务重构和治理梳理。优先保障现金生存，做最坏的打算。' };
    }

    submitBtn.addEventListener('click', function () {
      let total = 0;
      let answered = 0;
      let maxPossible = 0;

      questions.forEach((q) => {
        const name = `q${q.dataset.q}`;
        const selected = q.querySelector(`input[name="${name}"]:checked`);
        const inputs = q.querySelectorAll(`input[name="${name}"]`);
        maxPossible += 5;

        if (selected) {
          total += parseInt(selected.value, 10);
          answered++;
        }
      });

      if (answered < questions.length) {
        const remaining = questions.length - answered;
        resultBox.innerHTML = `<strong>⚠️ 还有 ${remaining} 题未回答</strong><p>请完成所有 12 道题再查看结果。</p>`;
        resultBox.classList.add('is-visible');
        resultBox.style.display = 'block';
        return;
      }

      const result = getScoreLabel(total);
      const pct = Math.round((total / maxPossible) * 100);

      // 维度分析
      const dims = {
        cash: 0,      // Q1, Q4, Q8, Q11
        market: 0,    // Q2, Q3
        decision: 0,  // Q5, Q6, Q9, Q12
        health: 0,    // Q7, Q10
      };

      // Q1 cash
      const q1 = quiz.querySelector('input[name="q0"]:checked');
      if (q1) dims.cash += parseInt(q1.value, 10);

      // Q2 market
      const q2 = quiz.querySelector('input[name="q1"]:checked');
      if (q2) dims.market += parseInt(q2.value, 10);

      // Q3 market
      const q3 = quiz.querySelector('input[name="q2"]:checked');
      if (q3) dims.market += parseInt(q3.value, 10);

      // Q4 cash
      const q4 = quiz.querySelector('input[name="q3"]:checked');
      if (q4) dims.cash += parseInt(q4.value, 10);

      // Q5 decision
      const q5 = quiz.querySelector('input[name="q4"]:checked');
      if (q5) dims.decision += parseInt(q5.value, 10);

      // Q6 decision
      const q6 = quiz.querySelector('input[name="q5"]:checked');
      if (q6) dims.decision += parseInt(q6.value, 10);

      // Q7 health (expansion)
      const q7 = quiz.querySelector('input[name="q6"]:checked');
      if (q7) dims.health += parseInt(q7.value, 10);

      // Q8 cash
      const q8 = quiz.querySelector('input[name="q7"]:checked');
      if (q8) dims.cash += parseInt(q8.value, 10);

      // Q9 decision
      const q9 = quiz.querySelector('input[name="q8"]:checked');
      if (q9) dims.decision += parseInt(q9.value, 10);

      // Q10 health
      const q10 = quiz.querySelector('input[name="q9"]:checked');
      if (q10) dims.health += parseInt(q10.value, 10);

      // Q11 cash
      const q11 = quiz.querySelector('input[name="q10"]:checked');
      if (q11) dims.cash += parseInt(q11.value, 10);

      // Q12 decision
      const q12 = quiz.querySelector('input[name="q11"]:checked');
      if (q12) dims.decision += parseInt(q12.value, 10);

      // 找出最高风险维度
      const dimMax = {
        cash: 20,      // 4 questions × 5
        market: 10,     // 2 questions × 5
        decision: 20,   // 4 questions × 5
        health: 10,     // 2 questions × 5
      };
      const dimPcts = {
        cash: Math.round((dims.cash / dimMax.cash) * 100),
        market: Math.round((dims.market / dimMax.market) * 100),
        decision: Math.round((dims.decision / dimMax.decision) * 100),
        health: Math.round((dims.health / dimMax.health) * 100),
      };
      const dimNames = {
        cash: '现金流与资金管理',
        market: '市场需求与获客',
        decision: '决策与组织能力',
        health: '扩张与创始人健康',
      };

      const sortedDims = Object.entries(dimPcts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2);

      let dimHtml = '<p style="margin-top:12px;font-size:13px;color:var(--text-faint)">⚠️ 最高风险维度：</p><ul>';
      sortedDims.forEach(([key, val]) => {
        const icon = val >= 60 ? '🔴' : val >= 40 ? '🟡' : '🟢';
        dimHtml += `<li style="font-size:13px;color:var(--text-dim);margin:4px 0">${icon} ${dimNames[key]}（${val}%）</li>`;
      });
      dimHtml += '</ul>';

      resultBox.innerHTML = `
        <strong>${result.label} · 总分 ${total}/${maxPossible}（${pct}%）</strong>
        <p>${result.desc}</p>
        ${dimHtml}
      `;
      resultBox.classList.add('is-visible');
      resultBox.style.display = 'block';

      // 滚动到结果
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // ==========================================
  // 平滑滚动
  // ==========================================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ==========================================
  // 预加载（确保初始可见元素立即显现）
  // ==========================================
  // 对已经可见的 reveal 元素立即触发
  const visibleCheck = () => {
    const viewportHeight = window.innerHeight;
    revealElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < viewportHeight - 60) {
        el.classList.add('is-visible');
      }
    });
  };
  visibleCheck();
  window.addEventListener('load', visibleCheck);

})();