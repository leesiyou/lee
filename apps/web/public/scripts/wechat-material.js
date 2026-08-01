const copyStatus = document.querySelector('[data-copy-status]');

function selectForManualCopy(source) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(source);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

for (const button of document.querySelectorAll('[data-copy-target]')) {
  button.addEventListener('click', async () => {
    const source = document.getElementById(button.dataset.copyTarget || '');
    if (!source) return;
    const value = source.textContent?.trim() || '';
    try {
      await navigator.clipboard.writeText(value);
      if (copyStatus) copyStatus.textContent = '已复制，可以直接粘贴到公众号后台。';
    } catch {
      selectForManualCopy(source);
      if (copyStatus) copyStatus.textContent = '浏览器未允许自动复制，文字已选中，请长按复制。';
    }
  });
}
