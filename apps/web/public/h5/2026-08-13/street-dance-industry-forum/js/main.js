const progressBar = document.getElementById('reading-progress-bar');
const backToTop = document.getElementById('back-to-top');
const toast = document.getElementById('toast');

function updateProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const ratio = Math.min(scrollTop / max, 1);
  if (progressBar) progressBar.style.width = `${ratio * 100}%`;
  if (backToTop) backToTop.classList.toggle('show', scrollTop > 520);
}

function showOverflowStatus() {
  if (!toast) return;
  const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  if (overflow > 2) {
    toast.textContent = `页面检测到 ${Math.round(overflow)}px 横向溢出，请刷新或截图反馈。`;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2800);
  }
}

backToTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', () => {
  updateProgress();
  showOverflowStatus();
});
updateProgress();

const revealItems = document.querySelectorAll('.reveal, .course-card');
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
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' },
  );
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('in'));
}

window.setTimeout(showOverflowStatus, 800);
