document.querySelectorAll('[data-share-card]').forEach((card) => {
  if (!(card instanceof HTMLElement) || card.dataset.enhanced === 'true') return;
  card.dataset.enhanced = 'true';
  const url = card.dataset.shareUrl ?? window.location.href;
  const title = card.dataset.shareTitle ?? document.title;
  const text = card.dataset.shareText ?? '';
  const status = card.querySelector('[data-share-status]');
  const setStatus = (message) => {
    if (status) status.textContent = message;
  };
  card.querySelector('[data-share-copy]')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      setStatus('链接已复制。');
    } catch {
      setStatus('复制失败，请从地址栏复制链接。');
    }
  });
  card.querySelector('[data-share-native]')?.addEventListener('click', async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text, title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus('当前浏览器不支持系统分享，链接已复制。');
    } catch {
      setStatus('分享未完成。');
    }
  });
});
