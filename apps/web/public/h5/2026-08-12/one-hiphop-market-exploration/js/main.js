const publicUrl = 'https://myhooddaily.iepose.cn/h5/2026-08-12/one-hiphop-market-exploration/';

const progressBar = document.querySelector('#reading-progress-bar');
const topButton = document.querySelector('#back-to-top');
const liveRegion = document.querySelector('#copy-result');
const revealItems = document.querySelectorAll('.reveal');
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.talk-panel');

function updateProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
  if (progressBar) progressBar.style.width = `${ratio * 100}%`;
  if (topButton) topButton.classList.toggle('is-visible', scrollTop > window.innerHeight * 0.45);
  revealInView();
}

function revealInView() {
  revealItems.forEach((item) => {
    if (item.classList.contains('is-visible')) return;
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      item.classList.add('is-visible');
    }
  });
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    return fallbackCopy(text);
  }
  return fallbackCopy(text);
}

function setCopyMessage(success) {
  if (!liveRegion) return;
  liveRegion.textContent = success ? '已复制，可以粘贴到公众号或微信。' : '复制失败，请长按页面链接手动复制。';
}

function activatePanel(targetId) {
  tabs.forEach((tab) => tab.classList.toggle('is-active', tab.dataset.target === targetId));
  panels.forEach((panel) => panel.classList.toggle('is-active', panel.id === targetId));
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  );
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}
revealInView();

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    if (tab.dataset.target) activatePanel(tab.dataset.target);
  });
});

document.querySelectorAll('.copy-btn').forEach((button) => {
  button.addEventListener('click', async () => {
    const text = button.dataset.copy || publicUrl;
    const success = await copyText(text);
    setCopyMessage(success);
  });
});

topButton?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
updateProgress();
