/* 背景音乐：Web Audio 实时生成，无音频文件、无版权问题。
   四种情绪随章节切换：calm（开篇）· tension（巴纳姆）· clarity（福特/斯密/SOP）· warm（复盘/行动）。
   必须由读者点击后才开始（浏览器自动播放规则）。 */
(function (w) {
  'use strict';
  var AC = w.AudioContext || w.webkitAudioContext;
  var ctx = null, master, comp, filter, rev, padBus, pluckBus;
  var want = false, running = false, moodKey = 'calm', chordIdx = 0, chordTimer = null, pluckTimer = null;

  var MOODS = {
    calm:    { chords: [[57, 64, 67, 71], [53, 60, 64, 69], [48, 55, 62, 67], [55, 59, 62, 66]], cutoff: 1100, scale: [69, 71, 72, 76, 79], density: 1.0, drone: false, len: 8 },
    tension: { chords: [[45, 52, 57, 60], [44, 52, 56, 59], [45, 52, 57, 60], [41, 48, 56, 60]], cutoff: 620, scale: [64, 65, 68, 69], density: 0.45, drone: true, len: 8 },
    clarity: { chords: [[48, 55, 64, 67, 71], [45, 52, 60, 64, 67], [53, 57, 64, 69], [55, 62, 65, 71]], cutoff: 1800, scale: [72, 74, 76, 79, 81, 84], density: 1.5, drone: false, len: 6 },
    warm:    { chords: [[53, 60, 64, 69], [55, 62, 65, 71], [52, 59, 64, 67], [57, 60, 64, 71]], cutoff: 1300, scale: [67, 69, 72, 74, 76], density: 0.9, drone: false, len: 8 }
  };

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function impulse(sec, decay) {
    var rate = ctx.sampleRate, len = Math.floor(rate * sec), b = ctx.createBuffer(2, len, rate);
    for (var c = 0; c < 2; c++) {
      var d = b.getChannelData(c);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  function init() {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3; comp.connect(master);
    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = MOODS.calm.cutoff; filter.Q.value = 0.4;
    rev = ctx.createConvolver(); rev.buffer = impulse(4, 2.6);
    var wet = ctx.createGain(); wet.gain.value = 0.55;
    var dry = ctx.createGain(); dry.gain.value = 0.6;
    filter.connect(dry); dry.connect(comp);
    filter.connect(rev); rev.connect(wet); wet.connect(comp);
    padBus = ctx.createGain(); padBus.gain.value = 0.16; padBus.connect(filter);
    pluckBus = ctx.createGain(); pluckBus.gain.value = 0.22; pluckBus.connect(filter);
    var delay = ctx.createDelay(2); delay.delayTime.value = 0.62;
    var fb = ctx.createGain(); fb.gain.value = 0.3;
    var dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2200;
    pluckBus.connect(delay); delay.connect(dl); dl.connect(fb); fb.connect(delay); dl.connect(rev);
  }

  function padNote(m, t, dur, level) {
    var f = mtof(m);
    [-5, 5].forEach(function (cents, i) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = i ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = cents;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(level, t + 2.5);
      g.gain.setValueAtTime(level, t + dur - 0.5);
      g.gain.linearRampToValueAtTime(0, t + dur + 2.5);
      o.connect(g); g.connect(padBus);
      o.start(t); o.stop(t + dur + 2.7);
    });
  }

  function pluck(m, t, vel, bus) {
    var f = mtof(m), o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    o2.type = 'sine'; o2.frequency.value = f * 2.01; g2.gain.value = 0.25;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(bus || pluckBus);
    o.start(t); o2.start(t); o.stop(t + 1.9); o2.stop(t + 1.9);
  }

  function nextChord() {
    if (!running) return;
    var mo = MOODS[moodKey], ch = mo.chords[chordIdx % mo.chords.length];
    chordIdx++;
    var t = ctx.currentTime + 0.05;
    ch.forEach(function (m) { padNote(m, t, mo.len, 0.12); });
    if (mo.drone) padNote(ch[0] - 12, t, mo.len, 0.16);
    chordTimer = setTimeout(nextChord, mo.len * 1000);
  }

  function nextPluck() {
    if (!running) return;
    var mo = MOODS[moodKey], t = ctx.currentTime + 0.02, m = pick(mo.scale);
    pluck(m, t, 0.16 + Math.random() * 0.12);
    if (Math.random() < 0.25) pluck(pick(mo.scale), t + 0.31, 0.09);
    pluckTimer = setTimeout(nextPluck, (1400 + Math.random() * 2600) / mo.density);
  }

  function run() {
    if (running || !ctx) return;
    running = true;
    if (ctx.state === 'suspended') ctx.resume();
    var now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(1.5, now + 3);
    nextChord();
    setTimeout(nextPluck, 1800);
  }

  function halt(fade) {
    running = false;
    clearTimeout(chordTimer); clearTimeout(pluckTimer);
    if (!ctx) return;
    var now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + (fade || 1.2));
    setTimeout(function () { if (!running && ctx.state === 'running') ctx.suspend(); }, (fade || 1.2) * 1000 + 200);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (running) halt(0.3); }
    else if (want) run();
  });

  w.LedgerMusic = {
    supported: !!AC,
    start: function () {
      if (!AC) return false;
      if (!ctx) init();
      want = true; run(); return true;
    },
    stop: function () { want = false; halt(); },
    isOn: function () { return want; },
    setMood: function (k) {
      if (!MOODS[k] || k === moodKey) return;
      moodKey = k; chordIdx = 0;
      if (ctx) filter.frequency.setTargetAtTime(MOODS[k].cutoff, ctx.currentTime, 1.5);
    },
    /* 和页面交互呼应的小音效，只在音乐开着时响 */
    cue: function (kind) {
      if (!running) return;
      var t = ctx.currentTime + 0.01;
      if (kind === 'bust') {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(32, t + 1.1);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.45, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
        o.connect(g); g.connect(comp); o.start(t); o.stop(t + 1.5);
      } else if (kind === 'method') {
        pluck(72, t, 0.22); pluck(76, t + 0.12, 0.18); pluck(79, t + 0.24, 0.16);
      } else if (kind === 'luck') {
        pluck(pick([73, 75, 78, 80]), t, 0.2);
      } else if (kind === 'dot') {
        pluck(88, t, 0.08);
      } else if (kind === 'check') {
        pluck(76, t, 0.16); pluck(81, t + 0.1, 0.14);
      }
    }
  };
})(window);

/* 以为自己运气好的人，最先把钱亏光 · 交互
   全部本地运行；记录只存在读者自己的浏览器（localStorage），不上传任何数据。 */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function store(key, val) {
    try {
      if (val === undefined) { return JSON.parse(localStorage.getItem(key) || 'null'); }
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
  function music(fn, arg) { var m = window.LedgerMusic; if (m && m[fn]) return m[fn](arg); }

  /* ---------- 阅读进度 ---------- */
  var bar = $('#progress');
  function onScroll() {
    var max = root.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 数字滚动 ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (reduce) { el.textContent = fmt(target); return; }
    var t0 = null, dur = 1200;
    el.textContent = '0';
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- 进入视口时触发 ---------- */
  function enter(el) {
    el.classList.add('visible');
    $$('.count', el).forEach(countUp);
    $$('.bar', el).forEach(function (b) { b.style.setProperty('--w', b.getAttribute('data-w') + '%'); });
    $$('.sc-bar', el).forEach(function (b, i) { setTimeout(function () { b.classList.add('go'); }, reduce ? 0 : 250 + i * 450); });
    if (el.id === 'barnum') {
      var steps = [20000, 30000, 50000, null], totalEl = $('#barnum-total');
      if (!reduce) totalEl.textContent = '$0';
      $$('.booked-rows li', el).forEach(function (li, i) {
        setTimeout(function () {
          li.classList.add('in');
          if (steps[i] !== null) totalEl.textContent = '$' + fmt(steps[i]);
          else { el.classList.add('crash'); music('cue', 'bust'); }
        }, reduce ? 0 : 450 + i * 700);
      });
    }
  }
  var targets = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { enter(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(enter);
  }

  /* ---------- 富兰克林的小本子：5 道工序 × 7 天 ---------- */
  var ROWS = ['懂', '拆', '编号', '总账', '不借'];
  var DAYS = ['一', '二', '三', '四', '五', '六', '日'];
  var GKEY = 'luck-ledger-grid';
  var dots = store(GKEY) || {};
  var grid = $('#grid');
  if (grid) {
    grid.appendChild(Object.assign(document.createElement('span'), { className: 'ch', textContent: '工序' }));
    DAYS.forEach(function (d) {
      grid.appendChild(Object.assign(document.createElement('span'), { className: 'ch', textContent: d }));
    });
    ROWS.forEach(function (r, ri) {
      grid.appendChild(Object.assign(document.createElement('span'), { className: 'rh', textContent: r }));
      DAYS.forEach(function (d, di) {
        var k = ri + '-' + di;
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', '周' + d + '「' + r + '」没做到');
        b.setAttribute('aria-pressed', dots[k] ? 'true' : 'false');
        if (dots[k]) b.classList.add('on');
        b.addEventListener('click', function () {
          dots[k] = !dots[k];
          b.classList.toggle('on', dots[k]);
          b.setAttribute('aria-pressed', String(dots[k]));
          store(GKEY, dots);
          if (dots[k]) music('cue', 'dot');
        });
        grid.appendChild(b);
      });
    });
    $('#grid-clear').addEventListener('click', function () {
      dots = {}; store(GKEY, dots);
      $$('button', grid).forEach(function (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
    });
  }

  /* ---------- 本周复盘账本 ---------- */
  var LKEY = 'luck-ledger-entries';
  var entries = store(LKEY) || [];
  var form = $('#tool-form');
  var msg = $('#tool-msg');
  function say(t) { msg.textContent = t; clearTimeout(say.t); say.t = setTimeout(function () { msg.textContent = ''; }, 2600); }
  function render() {
    ['method', 'luck'].forEach(function (kind) {
      var ul = $('#list-' + kind);
      ul.textContent = '';
      var sum = 0;
      entries.forEach(function (en, i) {
        if (en.kind !== kind) return;
        sum += en.amt;
        var li = document.createElement('li');
        var name = document.createElement('span'); name.textContent = en.what;
        var amt = document.createElement('em'); amt.textContent = (en.amt > 0 ? '+' : '') + fmt(en.amt);
        var del = document.createElement('button');
        del.type = 'button'; del.textContent = '×'; del.setAttribute('aria-label', '删除「' + en.what + '」');
        del.addEventListener('click', function () { entries.splice(i, 1); store(LKEY, entries); render(); });
        var right = document.createElement('span'); right.appendChild(amt); right.appendChild(del);
        li.appendChild(name); li.appendChild(right);
        ul.appendChild(li);
      });
      $('#sum-' + kind).textContent = (sum > 0 ? '+' : '') + fmt(sum);
    });
    var inM = 0, inAll = 0;
    entries.forEach(function (en) { if (en.amt > 0) { inAll += en.amt; if (en.kind === 'method') inM += en.amt; } });
    var r = $('#ratio');
    if (r) r.textContent = inAll > 0 ? Math.round(inM / inAll * 100) + '%' : '—';
  }
  if (form) {
    var lastKind = 'method';
    $$('button[type=submit]', form).forEach(function (b) {
      b.addEventListener('click', function () { lastKind = b.value; });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var what = $('#t-what').value.trim();
      var amt = parseFloat($('#t-amt').value);
      if (!what || isNaN(amt)) return;
      var kind = (e.submitter && e.submitter.value) || lastKind;
      entries.push({ what: what, amt: amt, kind: kind });
      store(LKEY, entries);
      form.reset();
      $('#t-what').focus();
      render();
      music('cue', kind);
      say(kind === 'luck' ? '记入运气栏：收下，但不加注。' : '记入方法栏：下周看它能不能再来一次。');
    });
    $('#tool-clear').addEventListener('click', function () { entries = []; store(LKEY, entries); render(); say('已清空。'); });
    $('#tool-copy').addEventListener('click', function () {
      var lines = ['本周复盘（方法 / 运气）'];
      ['method', 'luck'].forEach(function (kind) {
        lines.push(kind === 'method' ? '【方法】' : '【运气】');
        entries.filter(function (en) { return en.kind === kind; }).forEach(function (en) {
          lines.push('· ' + en.what + '  ' + (en.amt > 0 ? '+' : '') + fmt(en.amt));
        });
      });
      lines.push('方法占比：' + ($('#ratio') ? $('#ratio').textContent : '—'));
      lines.push('下周只改一道工序：');
      var text = lines.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { say('已复制到剪贴板。'); }, function () { say('复制失败，请手动截图保存。'); });
      } else {
        say('这个浏览器不支持一键复制，请手动截图保存。');
      }
    });
    render();
  }


  /* ================= 计算器 ================= */
  var num = function (el) { var v = parseFloat(el.value); return isNaN(v) ? 0 : v; };
  var sign = function (n, d) { var t = (Math.abs(n) >= 1000 ? fmt(Math.abs(n)) : (+Math.abs(n).toFixed(d === undefined ? 1 : d)).toString()); return (n < 0 ? '−' : n > 0 ? '+' : '') + t; };

  // 公式 1：1/√n
  var sq = $('#sq-n');
  if (sq) {
    var sqUp = function () {
      var n = Math.max(1, parseInt(sq.value, 10) || 1), k = 1 / Math.sqrt(n);
      $('#sq-nv').textContent = n;
      $('#sq-out').textContent = Math.round(k * 100) + '%';
      $('#sq-band').style.width = (k * 100) + '%';
    };
    sq.addEventListener('input', sqUp); sqUp();
  }

  // 公式 2：期望值
  var evP = $('#ev-p'), evW = $('#ev-w'), evL = $('#ev-l');
  if (evP) {
    var evUp = function () {
      var p = Math.min(100, Math.max(0, num(evP))) / 100, ev = p * num(evW) - (1 - p) * num(evL);
      var out = $('#ev-out'); out.textContent = sign(ev, 1); out.classList.toggle('neg', ev < 0);
      $('#ev-verdict').textContent = ev > 0
        ? (p < 0.5 ? '期望为正：单次多半会亏，但做得越多越接近这个平均——值得多做，前提是每次输得起。' : '期望为正：值得做，并且要多做。')
        : ev < 0 ? '期望为负：做得越多亏得越多。不管你觉得自己运气多好，都不要做。' : '期望为零：长期不赚不亏，白忙。';
    };
    [evP, evW, evL].forEach(function (el) { el.addEventListener('input', evUp); });
    $$('#calc-ev [data-ev]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-ev').split(',');
        evP.value = +(v[0] * 100).toFixed(1); evW.value = v[1]; evL.value = v[2]; evUp();
      });
    });
    evUp();
  }

  // 公式 3：漏斗
  var fIn = $$('#calc-funnel [data-f]');
  if (fIn.length) {
    var fBase = fIn.map(function (el) { return el.value; }), fRev0 = null;
    var fUp = function () {
      var v = {}; fIn.forEach(function (el) { v[el.getAttribute('data-f')] = num(el); });
      var rev = v.reach * v.ask / 100 * v.close / 100 * v.price * (1 + v.repeat);
      if (fRev0 === null) fRev0 = rev;
      $('#fn-out').textContent = fmt(rev);
      var d = fRev0 > 0 ? (rev / fRev0 - 1) * 100 : 0;
      $('#fn-verdict').textContent = Math.abs(d) < 0.5
        ? '试试点「每一项都 +10%」，看看乘法的威力。'
        : '和初始值比：' + (d > 0 ? '+' : '') + d.toFixed(0) + '%。每一项都 +10%，总收入 +61%（1.1⁵ ≈ 1.61）。';
    };
    fIn.forEach(function (el) { el.addEventListener('input', fUp); });
    $('#fn-up').addEventListener('click', function () {
      fIn.forEach(function (el) {
        // 第五个乘数是 (1 + 复购)，所以要让 (1 + 复购) 整体 +10%，而不是复购次数本身 +10%
        el.value = el.getAttribute('data-f') === 'repeat' ? +((1 + num(el)) * 1.1 - 1).toFixed(3) : +(num(el) * 1.1).toFixed(2);
      }); fUp();
    });
    $('#fn-reset').addEventListener('click', function () { fIn.forEach(function (el, i) { el.value = fBase[i]; }); fUp(); });
    fUp();
  }

  // 公式 4：全押的生存概率 + 凯利
  var ruP = $('#ru-p'), ruN = $('#ru-n');
  if (ruP) {
    var ruUp = function () {
      var p = num(ruP) / 100, n = num(ruN), surv = Math.pow(p, n), f = p - (1 - p) / 1;
      $('#ru-pv').textContent = Math.round(p * 100); $('#ru-nv').textContent = n;
      $('#ru-out').textContent = (surv * 100 < 0.1 ? (surv * 100).toFixed(2) : (surv * 100).toFixed(1)) + '%';
      var k = $('#ru-kelly');
      k.textContent = f > 0 ? Math.round(f * 100) + '%' : '0%（期望不为正，不该押）';
      k.classList.toggle('neg', f <= 0);
    };
    [ruP, ruN].forEach(function (el) { el.addEventListener('input', ruUp); }); ruUp();
  }

  // 验证：二项分布尾概率 P(X ≥ k | n, 0.5)
  var biN = $('#bi-n'), biK = $('#bi-k');
  if (biN) {
    var lnFact = [0];
    for (var i = 1; i <= 1000; i++) lnFact[i] = lnFact[i - 1] + Math.log(i);
    var tail = function (n, k) {
      var t = 0;
      for (var j = k; j <= n; j++) t += Math.exp(lnFact[n] - lnFact[j] - lnFact[n - j] - n * Math.LN2);
      return Math.min(1, t);
    };
    var biUp = function () {
      var n = Math.min(1000, Math.max(1, Math.round(num(biN)))), k = Math.max(0, Math.round(num(biK))), out = $('#bi-out'), vd = $('#bi-verdict');
      if (k > n) { out.textContent = '—'; vd.textContent = '成功次数不能多于总次数。'; return; }
      var pr = tail(n, k), pct = pr * 100;
      out.textContent = (pct < 0.1 ? pct.toFixed(2) : pct.toFixed(1)) + '%';
      out.classList.toggle('neg', pr >= 0.05);
      vd.textContent = n < 20 ? '次数还太少（少于 20 次），先别下结论，继续做、继续记。'
        : k / n <= 0.5 ? '成功率没超过一半，看不出方法有优势。'
        : pr < 0.01 ? '纯运气几乎做不到——这很可能是方法。记进方法栏，可以按规则加注。'
        : pr < 0.05 ? '纯运气很难做到，方法大概率有效。再做一轮确认。'
        : '纯运气也很容易做到，还不能算方法。';
    };
    [biN, biK].forEach(function (el) { el.addEventListener('input', biUp); }); biUp();
  }

  // SOP 第 4 步：总账
  var pIn = $$('#calc-profit [data-p]');
  if (pIn.length) {
    var pUp = function () {
      var v = {}; pIn.forEach(function (el) { v[el.getAttribute('data-p')] = num(el); });
      var gross = v.price - v.mat, time = v.hours * v.wage, refund = v.price * v.refund / 100, net = gross - time - refund - v.cac;
      $('#pl-gross').textContent = sign(gross);
      $('#pl-time').textContent = sign(-time);
      $('#pl-refund').textContent = sign(-refund);
      $('#pl-cac').textContent = sign(-v.cac);
      var ne = $('#pl-net'); ne.textContent = sign(net); ne.classList.toggle('t-luck', net < 0); ne.classList.toggle('t-method', net >= 0);
      $('#pl-verdict').textContent = net < 0
        ? '表面赚 ' + sign(gross) + '，算总账每单 ' + sign(net) + '：你在用自己的时间补贴客户。先改成本，再谈扩大。'
        : '每单真实利润 ' + sign(net) + '，过关。下一步：用第 2 步找最弱的一道工序。';
    };
    pIn.forEach(function (el) { el.addEventListener('input', pUp); }); pUp();
  }

  /* ---------- 7 天行动清单 ---------- */
  var DKEY = 'luck-ledger-days';
  var done = store(DKEY) || {};
  var boxes = $$('#days input[type=checkbox]');
  var countEl = $('#days-count');
  function updateCount() {
    var n = boxes.filter(function (b) { return b.checked; }).length;
    countEl.textContent = n === 0 ? '' : (n === boxes.length ? n + ' / ' + n + ' 完成。第 7 天的复盘，就是下一轮的第 1 天。' : '已完成 ' + n + ' / ' + boxes.length + '（只保存在这台设备上）');
  }
  boxes.forEach(function (b) {
    var k = b.getAttribute('data-day');
    b.checked = !!done[k];
    b.addEventListener('change', function () { done[k] = b.checked; store(DKEY, done); updateCount(); if (b.checked) music('cue', 'check'); });
  });
  updateCount();

  /* ---------- 开场：带着音乐 / 安静阅读 ---------- */
  var gate = $('#gate'), mbtn = $('#music-btn'), body = document.body;
  function setBtn() {
    var on = !!music('isOn');
    mbtn.classList.toggle('on', on);
    mbtn.setAttribute('aria-pressed', String(on));
    $('.music-t', mbtn).textContent = on ? '音乐 开' : '音乐 关';
  }
  function enterSite(withMusic) {
    if (withMusic) music('start');
    gate.classList.add('gone');
    body.classList.remove('locked');
    body.classList.add('entered');
    setBtn();
    setTimeout(function () { gate.setAttribute('hidden', ''); }, 900);
  }
  if (gate) {
    body.classList.add('locked');
    $('#enter-music').addEventListener('click', function () { enterSite(true); });
    $('#enter-quiet').addEventListener('click', function () { enterSite(false); });
    if (!(window.LedgerMusic && window.LedgerMusic.supported)) {
      $('#enter-music').hidden = true; mbtn.hidden = true;
    }
  } else {
    body.classList.add('entered');
  }
  mbtn.addEventListener('click', function () {
    if (music('isOn')) music('stop'); else music('start');
    setBtn();
  });

  /* ---------- 章节情绪：音乐跟着读到哪儿变 ---------- */
  if ('IntersectionObserver' in window) {
    var moodIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) { e.target.classList.remove('now'); return; }
        e.target.classList.add('now');
        music('setMood', e.target.getAttribute('data-mood'));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    $$('[data-mood]').forEach(function (el) { moodIO.observe(el); });
  }

  /* ---------- Hero：账页上的黑点 ---------- */
  var cv = $('#dots');
  if (cv && cv.getContext) {
    var c2 = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0, COLS = 7, ROWH = 32, dl = [], last = 0, heroOn = true;
    var size = function () { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; c2.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);
    var draw = function (t) {
      if (heroOn) {
        c2.clearRect(0, 0, W, H);
        var cw = W / COLS;
        c2.strokeStyle = 'rgba(168,40,31,.2)'; c2.lineWidth = 1;
        for (var i = 1; i < COLS; i++) { c2.beginPath(); c2.moveTo(i * cw + .5, 0); c2.lineTo(i * cw + .5, H); c2.stroke(); }
        if (t - last > 520 && dl.length < 26) {
          last = t;
          dl.push({ x: (Math.floor(Math.random() * COLS) + .5) * cw, y: (Math.floor(Math.random() * Math.floor(H / ROWH)) + .5) * ROWH, b: t, r: 3 + Math.random() * 3, red: Math.random() < .12 });
        }
        dl = dl.filter(function (d) {
          var age = (t - d.b) / 1000; if (age > 7) return false;
          var a = age < .35 ? age / .35 : age > 5.5 ? (7 - age) / 1.5 : 1;
          var r = d.r * (age < .35 ? .4 + .6 * (age / .35) : 1);
          c2.fillStyle = d.red ? 'rgba(168,40,31,' + a + ')' : 'rgba(31,27,22,' + (a * .85) + ')';
          c2.beginPath(); c2.arc(d.x, d.y, r, 0, 6.2832); c2.fill();
          return true;
        });
      }
      if (!reduce) requestAnimationFrame(draw);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; }).observe($('#top'));
    }
    requestAnimationFrame(draw);
  }
})();

