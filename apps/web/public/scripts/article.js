const progress = document.querySelector('[data-reading-progress]');
const topButton = document.querySelector('[data-back-to-top]');

const updateProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
  if (progress instanceof HTMLElement) progress.style.transform = `scaleX(${ratio})`;
  topButton?.classList.toggle('is-visible', window.scrollY > 600);
};

window.addEventListener('scroll', updateProgress, { passive: true });
topButton?.addEventListener('click', () => window.scrollTo({ behavior: 'smooth', top: 0 }));
updateProgress();
