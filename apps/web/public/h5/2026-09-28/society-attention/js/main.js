/* ============================================================
   应不应该关注社会 · 交互层
   进度 / 计数 / 揭示 / 网络画布 / tabs / 账单 / 四层 / 剂量 / 收束
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 1. 进度条 ---------- */
  var progress = $('#progress');
  function onScroll() {
    if (!progress) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? (window.scrollY || doc.scrollTop) / max : 0;
    progress.style.width = Math.min(100, Math.max(0, p * 100)).toFixed(2) + '%';
  }

  /* ---------- 2. 逐段揭示 ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    // rootMargin 用正底边：章节很高时，等它 8% 入屏才揭示会显得迟钝
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          ro.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- 3. 章节计数 + 左侧脊柱 ---------- */
  var counter = $('#counter');
  var spineItems = $$('#spine li');
  var chapters = $$('.chapter');

  function setActive(idx) {
    if (counter) {
      counter.textContent = (idx < 10 ? '0' + idx : idx) + ' / 09';
    }
    spineItems.forEach(function (li, i) {
      li.classList.toggle('on', i === idx - 1);
    });
  }

  if ('IntersectionObserver' in window && chapters.length) {
    var co = new IntersectionObserver(function (entries) {
      // 取当前可见比例最高的一段
      var best = null;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
      });
      if (best) {
        var m = /^c(\d+)$/.exec(best.target.id);
        var n = m ? parseInt(m[1], 10) : 9;   // #ending 即第 09 层
        setActive(n);
      }
    }, { threshold: [0.15, 0.35, 0.6] });
    chapters.forEach(function (c) { co.observe(c); });
  }

  // 首屏 → 计数归零
  window.addEventListener('scroll', function () {
    if (window.scrollY < window.innerHeight * 0.5 && counter) {
      counter.textContent = '00 / 09';
      spineItems.forEach(function (li) { li.classList.remove('on'); });
    }
  }, { passive: true });

  spineItems.forEach(function (li) {
    li.addEventListener('click', function () {
      var n = li.getAttribute('data-i');
      var target = n === '9' ? $('#ending') : $('#c' + n);
      if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ---------- 4. 停一下 · 展开 ---------- */
  $$('.pause').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.nextElementSibling;
      if (!box) return;
      var open = box.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? '收起来' : '停一下 · 展开思考';
    });
  });

  /* ---------- 5. 三种姿态 tabs ---------- */
  $$('.tabs').forEach(function (bar) {
    var btns = $$('button', bar);
    var wrap = bar.parentNode;
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) {
          x.setAttribute('aria-selected', x === b ? 'true' : 'false');
        });
        $$('.panel', wrap).forEach(function (p) {
          p.classList.toggle('is-on', p.id === b.getAttribute('data-panel'));
        });
      });
      // 键盘左右切换
      b.addEventListener('keydown', function (ev) {
        if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
        var i = btns.indexOf(b);
        var next = btns[(i + (ev.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length];
        next.focus(); next.click(); ev.preventDefault();
      });
    });
  });

  /* ---------- 6. 注意力账单 ---------- */
  var calc = $('#calc');
  if (calc) {
    var boxes = $$('input[type=checkbox]', calc);
    var tMin = $('#t-min'), tHour = $('#t-hour'), tDay = $('#t-day'), tNote = $('#t-note');

    function render() {
      var mins = boxes.reduce(function (sum, b) {
        return sum + (b.checked ? (parseFloat(b.getAttribute('data-min')) || 0) : 0);
      }, 0);
      var hours = mins * 365 / 60;
      var days = hours / 8;

      if (tMin) tMin.textContent = Math.round(mins);
      if (tHour) tHour.textContent = hours >= 10 ? Math.round(hours) : hours.toFixed(1);
      if (tDay) tDay.textContent = days >= 10 ? Math.round(days) : days.toFixed(1);

      if (tNote) {
        var msg;
        if (mins === 0) {
          msg = '一项都没勾。要么你真的把入口关掉了，要么你高估了自己对它的免疫——先诚实一次。';
        } else if (mins < 40) {
          msg = '每天约 ' + Math.round(mins) + ' 分钟。这个剂量不算失控，但请注意：它是"每天"，所以它挤掉的不是某一天，是三百多天。';
        } else if (mins < 90) {
          msg = '每天约 ' + Math.round(mins) + ' 分钟，一年约 ' + Math.round(hours) + ' 小时。相当于每年少掉 ' + Math.round(days) + ' 个完整工作日——差不多是半个月的带薪时间。';
        } else {
          msg = '每天约 ' + Math.round(mins) + ' 分钟，一年约 ' + Math.round(hours) + ' 小时，折合 ' + Math.round(days) + ' 个工作日，也就是一年里有一个多月只做这一件事。这里还没算情绪余波。';
        }
        tNote.textContent = msg;
      }
    }
    boxes.forEach(function (b) { b.addEventListener('change', render); });
    render();
  }

  /* ---------- 7. 四层 strata ---------- */
  var LAYER_TEXT = {
    1: 'L1 知道 · 接收：你停在"我知道了"。成本几乎为零，满足感来得最快，所以最容易停在这儿。刷到不等于处理过——它只是经过。',
    2: 'L2 判断 · 理解：你开始问"这是怎么发生的"。要背景、要一手材料，还要能忍一段时间说"我暂时不知道"。这一步没有掌声，但判断只在这种地方长出来。',
    3: 'L3 表达 · 表态：你把自己的名字放到了这句话后面。会得罪人、会被追问、要为说过的话负责。很多人以为自己在这一层，其实只是转发了别人的判断。',
    4: 'L4 行动 · 投入：时间、钱、身份真的押进去。四层里只有这一层能改变结果，也只有这一层会改变你生活的形状。累是对的，累说明它生效了。'
  };
  var layerRead = $('#layer-read');
  $$('.layer').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') === 'true';
      $$('.layer').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      if (on) {
        btn.setAttribute('aria-pressed', 'false');
        if (layerRead) layerRead.textContent = '点一层，看看你通常在哪儿停下来。';
        return;
      }
      btn.setAttribute('aria-pressed', 'true');
      if (layerRead) layerRead.textContent = LAYER_TEXT[btn.getAttribute('data-layer')] || '';
    });
  });

  /* ---------- 8. 剂量滑杆 ---------- */
  var dose = $('#dose');
  if (dose) {
    var dNum = $('#dose-num'), dBar = $('#dose-bar'), dRead = $('#dose-read');
    var BANDS = [
      [0, 0, '零剂量：彻底关掉。这可以是一种选择——只要它是你选的，而不是被情绪推的。零剂量的代价是，规则仍然按别人的版本落地。'],
      [0.5, 2.5, '低剂量：偶尔扫一眼，主要靠别人的转述。好处是省，坏处是你的判断基本由别人代笔。适合暂时需要休息的阶段，不适合长期。'],
      [3, 6, '中低剂量：每周一个固定时段、一到三个议题。这是最可持续的区间——足够保持在场，又不至于把生活让出去。'],
      [6.5, 12, '中高剂量：差不多每周要拿出半天到一天半。你已经不是观众了，但请务必配套：固定时段、只追少数议题、事先定好停止条件。'],
      [12.5, 25, '高剂量：这已经是半个兼职。除非它同时是你的工作、身份或长期责任，否则很容易从"关注"滑成"被占用"。到这个量级，边界比热情更重要。']
    ];
    function doseRender() {
      var v = parseFloat(dose.value) || 0;
      if (dNum) dNum.textContent = (v % 1 === 0 ? v : v.toFixed(1));
      if (dBar) dBar.style.width = (v / 25 * 100).toFixed(1) + '%';
      if (dRead) {
        var hit = BANDS.filter(function (b) { return v >= b[0] && v <= b[1]; })[0] || BANDS[BANDS.length - 1];
        dRead.textContent = hit[2];
      }
    }
    dose.addEventListener('input', doseRender);
    doseRender();
  }

  /* ---------- 9. 姿态选择 + 记事 ---------- */
  var answer = $('#answer');
  $$('.choices button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') === 'true';
      $$('.choices button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', on ? 'false' : 'true');
      if (answer) {
        answer.textContent = on ? '' : '你写下的是：' + btn.getAttribute('data-line') + ' 现在，把它换成这周的一个具体动作。';
      }
    });
  });

  var KEY = 'society-attention-note-v1';
  var note = $('#note'), save = $('#save'), saved = $('#saved');
  try {
    var kept = window.localStorage.getItem(KEY);
    if (kept && note) note.value = kept;
  } catch (err) { /* 隐私模式下忽略 */ }

  if (save && note) {
    save.addEventListener('click', function () {
      var ok = true;
      try { window.localStorage.setItem(KEY, note.value); }
      catch (err) { ok = false; }
      if (saved) {
        saved.textContent = ok ? '已存在这台设备上 · ' + new Date().toLocaleString('zh-CN', { hour12: false }) : '这个浏览器不允许本地保存';
        window.setTimeout(function () { if (saved) saved.textContent = ''; }, 4000);
      }
    });
  }

  /* ---------- 10. 网络画布 ---------- */
  var canvas = $('#net');
  if (canvas && canvas.getContext && !reduce) {
    var ctx = canvas.getContext('2d');
    var nodes = [], W = 0, H = 0, dpr = 1, raf = 0, running = true;

    function build() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.max(18, Math.min(52, Math.round(W * H / 26000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          r: Math.random() * 1.4 + 0.6,
          w: Math.random() < 0.16          // 少数"暖色"节点 = 你自己
        });
      }
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, dx, dy, d;

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;

        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x; dy = a.y - b.y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < 148) {
            var o = (1 - d / 148) * 0.16;
            ctx.strokeStyle = (a.w || b.w)
              ? 'rgba(224,122,63,' + o.toFixed(3) + ')'
              : 'rgba(95,179,199,' + o.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        ctx.fillStyle = a.w ? 'rgba(224,122,63,.75)' : 'rgba(95,179,199,.42)';
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = window.requestAnimationFrame(frame);
    }

    build();
    frame();

    var rt = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(rt);
      rt = window.setTimeout(build, 220);
    });

    // 离屏或页面隐藏时停掉，省电
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        running = false;
        window.cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        frame();
      }
    });
  }

  /* ---------- 11. 手机常驻入口：接近结尾时收起 ---------- */
  var toEnd = $('#to-end');
  var ending = $('#ending');
  if (toEnd && ending && 'IntersectionObserver' in window) {
    var eo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var near = e.isIntersecting || e.boundingClientRect.top < window.innerHeight;
        toEnd.classList.toggle('off', near);
        document.body.classList.toggle('at-end', near);
      });
    }, { threshold: 0, rootMargin: '0px 0px -35% 0px' });
    eo.observe(ending);
  } else if (toEnd) {
    toEnd.classList.add('off');
  }

  /* ---------- 12. 滚动 / 首帧 ---------- */
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
