(() => {
  const root = document.documentElement;
  root.classList.add('js');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  function initBeat() {
    const audio = $('#beat-audio');
    const toggle = $('#beat-toggle');
    const state = $('#beat-state');
    if (!audio || !toggle) return;

    let userPaused = false;
    const setUI = (playing) => {
      toggle.classList.toggle('is-on', playing);
      toggle.setAttribute('aria-pressed', String(playing));
      toggle.setAttribute('aria-label', playing ? '暂停背景音乐' : '播放 Old School Hip-Hop beat');
      if (state) state.textContent = playing ? 'ON' : 'OFF';
    };
    const removeRecoveryListeners = () => {
      document.removeEventListener('pointerdown', recoverOnGesture);
      document.removeEventListener('touchstart', recoverOnGesture);
      document.removeEventListener('wheel', recoverOnGesture);
      document.removeEventListener('keydown', recoverOnGesture);
    };
    const startPlayback = () => {
      let result;
      try {
        result = audio.play();
      } catch (_) {
        setUI(false);
        return;
      }
      if (result && typeof result.then === 'function') {
        result.then(() => setUI(true)).catch(() => setUI(false));
      } else {
        setUI(!audio.paused);
      }
    };
    function recoverOnGesture(event) {
      if (userPaused || event.target?.closest?.('#beat-toggle')) return;
      startPlayback();
    }

    audio.addEventListener('play', () => setUI(true));
    audio.addEventListener('pause', () => setUI(false));
    audio.addEventListener('error', () => setUI(false));
    toggle.addEventListener('click', () => {
      if (audio.paused) {
        userPaused = false;
        startPlayback();
      } else {
        userPaused = true;
        audio.pause();
      }
    });

    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach((eventName) => {
      document.addEventListener(eventName, recoverOnGesture, { passive: true });
    });
    audio.addEventListener('play', removeRecoveryListeners, { once: true });
    setUI(false);
    startPlayback();
  }

  function initNavigation() {
    const toggle = $('#menu-toggle');
    const menu = $('#mobile-menu');
    if (!toggle || !menu) return;

    function setOpen(open, returnFocus = false) {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
      document.body.classList.toggle('menu-open', open);
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', () => setOpen(menu.hidden));
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menu.hidden) setOpen(false, true);
    });
    window.matchMedia('(min-width: 901px)').addEventListener?.('change', (event) => {
      if (event.matches) setOpen(false);
    });
  }

  function initScrollFeedback() {
    const fill = $('#reading-progress-fill');
    const header = $('#topbar');
    let ticking = false;

    function update() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (fill) fill.style.width = `${maxScroll > 0 ? Math.min(100, window.scrollY / maxScroll * 100) : 0}%`;
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  function initReveal() {
    const items = $$('.reveal');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('in'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: .07 });
    items.forEach((item) => observer.observe(item));
  }

  function initLookbook() {
    const track = $('#lookbook');
    const cards = $$('.lookbook-card');
    const prev = $('#lookbook-prev');
    const next = $('#lookbook-next');
    const count = $('#lookbook-count');
    if (!track || !cards.length || !prev || !next || !count) return;

    let current = 0;
    let ticking = false;
    function leftPadding() { return parseFloat(getComputedStyle(track).paddingLeft) || 0; }
    function update() {
      const start = track.getBoundingClientRect().left + leftPadding();
      let closest = Infinity;
      cards.forEach((card, index) => {
        const gap = Math.abs(card.getBoundingClientRect().left - start);
        if (gap < closest) { closest = gap; current = index; }
      });
      count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
      prev.disabled = current === 0;
      next.disabled = current === cards.length - 1;
      ticking = false;
    }
    function goTo(index) {
      const target = cards[Math.max(0, Math.min(index, cards.length - 1))];
      const left = target.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft - leftPadding();
      track.scrollTo({ left, behavior: reducedMotion ? 'auto' : 'smooth' });
    }
    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));
    track.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  let selectedWeight = '';

  function initWeightPicker() {
    const options = $$('.weight-option');
    const panels = $$('.weight-detail');
    const feedback = $('#weight-feedback');
    if (!options.length || !panels.length) return;

    function show(weight, chosen) {
      options.forEach((option) => {
        const active = chosen && option.dataset.weight === weight;
        option.classList.toggle('is-active', active);
        option.classList.toggle('is-preview', !chosen && option.dataset.weight === weight);
        option.setAttribute('aria-pressed', String(active));
      });
      panels.forEach((panel) => { panel.hidden = panel.id !== `weight-detail-${weight}`; });
      if (chosen) {
        selectedWeight = weight;
        if (feedback) feedback.textContent = `已选 ${weight}GSM；复制需求清单时会带上这一档。`;
      }
    }

    options.forEach((option) => option.addEventListener('click', () => show(option.dataset.weight, true)));
    show(options[0].dataset.weight, false);
  }

  function enquiry() {
    return [
      '你好，我想咨询 104 服装定制。',
      '用途 / 场景：',
      '图案或 Logo：',
      `款式 / 克重 / 颜色：${selectedWeight ? `T 恤 ${selectedWeight}GSM / ` : ''}`,
      '预计数量与尺码：',
      '希望收到的时间：',
      '其他要求：'
    ].join('\n');
  }

  async function copyText(value) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (_) { /* Continue with the local-file fallback. */ }
    const field = document.createElement('textarea');
    field.value = value;
    field.readOnly = true;
    field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
    field.remove();
    return copied;
  }

  function initEnquiry() {
    const button = $('#btn-copy');
    const toast = $('#toast');
    if (!button || !toast) return;
    let hideTimer;
    button.addEventListener('click', async () => {
      const copied = await copyText(enquiry());
      toast.textContent = copied
        ? '需求清单已复制。请粘贴到你与 104 的公众号或企业微信对话。'
        : '复制失败。请记录图案、用途、数量和期望时间，再通过 104 的公众号或企业微信发送。';
      toast.classList.add('is-on');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => toast.classList.remove('is-on'), 3800);
    });
  }

  function init() {
    initBeat();
    initNavigation();
    initScrollFeedback();
    initReveal();
    initLookbook();
    initWeightPicker();
    initEnquiry();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
