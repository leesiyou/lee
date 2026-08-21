const tabs = document.querySelectorAll('.tab');
const panels = {
  tianjin: document.getElementById('x-tianjin'),
  xiaok: document.getElementById('x-xiaok'),
  feas: document.getElementById('x-feas'),
  rev: document.getElementById('x-rev'),
  xiaom: document.getElementById('x-xiaom'),
};

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    for (const item of tabs) item.classList.remove('active');
    tab.classList.add('active');
    for (const panel of Object.values(panels)) panel?.classList.remove('active');
    panels[tab.dataset.x]?.classList.add('active');
  });
}

const shareStatus = document.querySelector('[data-share-status]');
const canonical = document.querySelector('link[rel="canonical"]')?.href || window.location.href;
const shareData = {
  title: document.title,
  text: '中国街舞十年证据复盘：从热度到资产。',
  url: canonical,
};

document.querySelector('[data-share-review]')?.addEventListener('click', async () => {
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      if (shareStatus) shareStatus.textContent = '已打开系统分享。';
      return;
    }
    await navigator.clipboard.writeText(canonical);
    if (shareStatus) shareStatus.textContent = '链接已复制，可以粘贴到微信群。';
  } catch (error) {
    if (error?.name !== 'AbortError' && shareStatus) {
      shareStatus.textContent = '请长按浏览器地址栏复制链接。';
    }
  }
});

document.querySelector('[data-copy-review]')?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(canonical);
    if (shareStatus) shareStatus.textContent = '链接已复制，可以粘贴到微信群。';
  } catch {
    if (shareStatus) shareStatus.textContent = '请长按浏览器地址栏复制链接。';
  }
});

const backToTop = document.querySelector('[data-back-to-top]');
window.addEventListener('scroll', () => {
  backToTop?.classList.toggle('visible', window.scrollY > 720);
}, { passive: true });
backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
