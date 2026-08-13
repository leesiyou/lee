const PUBLIC_URL = 'https://myhooddaily.iepose.cn/h5/2026-08-13/xingzhiguang-ai-native-transformation/';

const progressBar = document.getElementById('reading-progress-bar');
const backToTop = document.getElementById('back-to-top');
const toast = document.getElementById('toast');

function updateProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(scrollTop / max, 1) : 0;
  if (progressBar) {
    progressBar.style.width = `${ratio * 100}%`;
  }
  if (backToTop) {
    backToTop.classList.toggle('show', scrollTop > 520);
  }
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2200);
}

async function copyText(text, success) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(success);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    showToast(success);
  }
}

const bossSummary = `星之光 T 恤供应链今天不是缺资源，而是缺一套能让资源自动协同的经营系统。建议把 AI 定位为公司中间层：所有客户、库存、报价、任务、复盘都进入统一事实层；老板看驾驶舱，各部门按 SOP 推进，AI 每天回收进度并暴露卡点。第一阶段先用 90 天跑通一个闭环：询盘 → 报价 → 打样 → 下单 → 出库 → 复购。`;

const salesPitch = `我们不是单纯卖 T 恤现货，而是用河北肃宁源头制造、广州仓配前端和 AI 客户推进系统，为国内外客户提供稳定、快速、可追踪的 T 恤供应链服务。客户要的不只是低价，而是确认货在、报价快、交期准、复购省心。`;

document.getElementById('copy-url')?.addEventListener('click', () => {
  copyText(PUBLIC_URL, 'H5 公网地址已复制，可以发给老板。');
});

document.getElementById('copy-boss-summary')?.addEventListener('click', () => {
  copyText(bossSummary, '老板摘要已复制。');
});

document.getElementById('copy-sales-pitch')?.addEventListener('click', () => {
  copyText(salesPitch, '营销话术已复制。');
});

backToTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('in'));
}

document.querySelectorAll('[data-count]').forEach(el => {
  const target = Number(el.getAttribute('data-count'));
  if (!Number.isFinite(target)) return;
  let current = 0;
  const steps = 36;
  const increment = target / steps;
  const tick = () => {
    current += increment;
    if (current >= target) {
      el.textContent = target.toLocaleString('zh-CN');
      return;
    }
    el.textContent = Math.round(current).toLocaleString('zh-CN');
    requestAnimationFrame(tick);
  };
  tick();
});
