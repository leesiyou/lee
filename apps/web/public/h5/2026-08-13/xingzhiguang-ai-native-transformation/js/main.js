const reportUrl = 'https://myhooddaily.iepose.cn/h5/2026-08-13/xingzhiguang-ai-native-transformation/';

const progressBar = document.querySelector('#reading-progress-bar');
const backToTop = document.querySelector('#back-to-top');
const toast = document.querySelector('#toast');
const sectionNav = document.querySelector('#section-nav');
const sectionNavScroller = sectionNav?.querySelector('.section-nav-inner');
const navLinks = [...document.querySelectorAll('.section-nav a')];
const sections = [...document.querySelectorAll('main section[id]')];

let toastTimer;

function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
  if (progressBar) progressBar.style.width = `${progress * 100}%`;
  backToTop?.classList.toggle('visible', window.scrollY > 720);
}

function showToast(message) {
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    showToast('报告地址已复制');
  } catch {
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    showToast(copied ? '报告地址已复制' : '复制失败，请长按地址复制');
  }
}

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  },
  { threshold: 0.08, rootMargin: '0px 0px -8% 0px' },
);

for (const node of document.querySelectorAll('.reveal')) revealObserver.observe(node);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    const active = navLinks.find((link) => link.getAttribute('href') === `#${visible.target.id}`);
    for (const link of navLinks) link.classList.toggle('is-active', link === active);
    if (active && sectionNavScroller) {
      const left = active.offsetLeft - (sectionNavScroller.clientWidth - active.offsetWidth) / 2;
      sectionNavScroller.scrollTo({ left, behavior: 'smooth' });
    }
  },
  { rootMargin: '-24% 0px -60% 0px', threshold: [0, 0.1, 0.4] },
);

for (const section of sections) sectionObserver.observe(section);

for (const dot of document.querySelectorAll('[data-gap]')) {
  dot.addEventListener('click', () => {
    const target = document.querySelector(`#${dot.dataset.gap}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

document.querySelector('#copy-url')?.addEventListener('click', () => copyText(reportUrl));
backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href === '#') return;
  const target = document.querySelector(href);
  if (!target) return;
  event.preventDefault();
  const navOffset = sectionNav?.offsetHeight ?? 0;
  const targetTop = Math.max(0, target.getBoundingClientRect().top + window.scrollY - navOffset - 16);
  const previousScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  if (window.location.hash === href) window.history.replaceState(null, '', href);
  else window.history.pushState(null, '', href);
  window.scrollTo({ top: targetTop });
  window.requestAnimationFrame(() => {
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  });
});

window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
updateProgress();
