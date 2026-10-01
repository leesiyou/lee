/* 104 GROUP 宣传站 · 主逻辑 */
(function () {
  'use strict';
  var C = window.CONFIG104 || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var sm = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var VH = function () { return window.innerHeight; };

  /* ---------------- 配置写入 ---------------- */
  $$('[data-cfg]').forEach(function (el) { var v = C[el.getAttribute('data-cfg')]; if (v) el.textContent = v; });
  $$('[data-hide-empty]').forEach(function (el) { if (!C[el.getAttribute('data-hide-empty')]) el.style.display = 'none'; });
  if (C.milestones && C.milestones.length) {
    $('#timeline').innerHTML = C.milestones.map(function (m) { return '<li class="rv"><b>' + m.year + '</b>' + m.text + '</li>'; }).join('');
  }
  (function facts() {
    var f = [[C.factoryArea, '厂房面积'], [C.dailyCapacity, '日产能'], [C.staff, '团队'], ['DTF+DTG', '双工艺产线'], [C.sampleDays, '打样周期'], [C.rush, '加急'], [C.moq, '起订量']]
      .filter(function (x) { return x[0]; }).slice(0, 6);
    var box = $('#facts'); box.style.gridTemplateColumns = 'repeat(' + (f.length % 3 === 0 ? 3 : 2) + ',1fr)';
    box.innerHTML = f.map(function (x) { return '<div><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('');
  })();
  (function contact() {
    if (C.qrBoss) $('.qrc.boss img').src = C.qrBoss;
    if (C.qrOfficial) $('.qrc.off img').src = C.qrOfficial;
    if (C.teamPageUrl) $('#copyBtn').href = C.teamPageUrl;
    var L = ['<b>104 GROUP · 服装定制工厂</b>'];
    if (C.wechatId) L.push('微信：' + C.wechatId);
    if (C.phone) L.push('电话：<a href="tel:' + C.phone + '" style="color:inherit">' + C.phone + '</a>');
    L.push('工厂：' + (C.factoryCity || '广州') + ' · ' + [C.moq, C.sampleDays].filter(Boolean).join(' · '));
    $('#ci').innerHTML = L.join('<br>');
  })();
  if (C.showClients === false) $('#clients').style.display = 'none';

  /* ---------------- 音乐：进场即播 ---------------- */
  var bgm = $('#bgm'), sBtn = $('#soundBtn'), tip = $('#soundTip'), userOff = false, playing = false;
  bgm.volume = 0.85;
  function setPlaying(v) { playing = v; document.body.classList.toggle('playing', v); $('#soundTxt').textContent = v ? 'JAZZ · HIPHOP' : 'MUSIC OFF'; if (v) tip.classList.remove('show'); }
  function tryPlay() {
    if (userOff) return;
    try {
      var p = bgm.play();
      if (p && p.then) p.then(function () { setPlaying(true); }).catch(function () { setPlaying(false); if (loaded) tip.classList.add('show'); });
      else setPlaying(!bgm.paused);
    } catch (e) { }
  }
  document.addEventListener('WeixinJSBridgeReady', function () { tryPlay(); }, false);
  if (window.WeixinJSBridge && window.WeixinJSBridge.invoke) window.WeixinJSBridge.invoke('getNetworkType', {}, tryPlay);
  bgm.addEventListener('playing', function () { setPlaying(true); });
  bgm.addEventListener('pause', function () { setPlaying(false); });
  ['touchstart', 'pointerdown', 'click', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function (e) { if (e.target && e.target.closest && e.target.closest('#soundBtn')) return; if (!playing && !userOff) tryPlay(); }, { passive: true, capture: true });
  });
  sBtn.addEventListener('click', function () {
    if (playing) { userOff = true; bgm.pause(); } else { userOff = false; tryPlay(); }
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { if (playing) { bgm.pause(); bgm._resume = true; } } else if (bgm._resume) { bgm._resume = false; tryPlay(); } });
  tryPlay();

  /* ---------------- 进场 loading ---------------- */
  var loaded = false, pct = 0, target = 10;
  var crit = ['assets/img/logo.webp', 'assets/img/crew-people.webp', 'assets/tex/logo.webp', 'assets/tex/print-01.webp', 'assets/tex/print-02.webp'];
  var got = 0;
  crit.forEach(function (s) { var im = new Image(); im.onload = im.onerror = function () { got++; target = 10 + 80 * got / crit.length; }; im.src = s; });
  window.addEventListener('load', function () { target = 100; });
  var t0 = Date.now(), entered = false;
  function enter() {
    if (entered) return; entered = true;
    $('#loader').classList.add('done'); loaded = true; reveal();
    setTimeout(function () { if (!playing && !userOff) tip.classList.add('show'); }, 800);
  }
  $('#loader').addEventListener('click', function () { if (!$('#loader').classList.contains('ready')) return; userOff = false; tryPlay(); enter(); });
  (function ld() {
    if (Date.now() - t0 > 5000) target = 100;
    pct += (target - pct) * 0.12; if (target === 100 && pct > 99) pct = 100;
    $('#ldFill').style.width = pct + '%'; $('#ldPct').textContent = Math.round(pct) + '%';
    if (pct >= 100) {
      tryPlay();
      setTimeout(function () {
        if (playing) enter();               // 微信等允许自动播放：直接进入，音乐已在播
        else $('#loader').classList.add('ready');  // 其他浏览器：显示「点击进入」，点的那一下同时开音乐
      }, 600);
      return;
    }
    requestAnimationFrame(ld);
  })();

  /* ---------------- 入场动画 ---------------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); if (e.target.classList.contains('big15')) count15(); } });
  }, { threshold: 0.15 }) : null;
  function reveal() { $$('.rv').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); }); }
  var counted = false;
  function count15() {
    if (counted) return; counted = true; var s = performance.now();
    (function f(n) { var k = clamp((n - s) / 1400, 0, 1); $('#count15').textContent = Math.round(15 * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(s);
  }

  /* ---------------- WebGL ---------------- */
  var G = window.GL104, canvas = $('#gl'), R = null, dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  try { R = new G.R(canvas); } catch (e) { R = null; if (window.console) console.warn(e); }
  if (!R) {
    document.documentElement.classList.add('no-gl');
    $$('.stage[data-fallback]').forEach(function (s) { s.style.setProperty('--fb', 'url(' + s.getAttribute('data-fallback') + ')'); });
  }
  var M = G.M, PI = Math.PI;
  function resize() { canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr); }
  resize(); window.addEventListener('resize', resize);
  function camFit(eye, tgt, hfov) { R.cam(eye, tgt, Math.min(2 * Math.atan(Math.tan(hfov / 2) / R.asp), 1.25)); }

  var scenes = [];
  if (R) {
    var Geo = G.Geo, mk = function (d, mode) { return R.mesh(d, mode); };
    var tee = Geo.tee(), teeF = mk(tee[0]), teeB = mk(tee[1]);
    var texCache = {}; var tex = function (s) { return texCache[s] || (texCache[s] = R.loadTex(s)); };
    var logoTx = tex('assets/tex/logo.webp');
    var BOX = mk(Geo.box(1, 1, 1)), PLANE = mk(Geo.plane(1, 1));
    var BLACK = [0.06, 0.06, 0.065], METAL = [0.8, 0.82, 0.85], DARKM = [0.22, 0.23, 0.25], ORANGE = [1, 0.35, 0.12];
    var drawTee = function (Mm, col, o) {
      o = o || {}; var b = { M: Mm, c: col, mode: 4, tx: o.tx, pr: o.pr, tx2: o.tx2, pr2: o.pr2, rev: o.rev, e: o.e };
      R.draw(teeF, b); R.draw(teeB, b);
    };
    var CHEST = [0.1, 0.43, 0.34, 0.255], BACK = [-0.42, -0.45, -0.84, 1.01];

    /* --- HERO 粒子 --- */
    var NP = 520, pd = new Float32Array(NP * 4);
    for (var i = 0; i < NP; i++) { pd[i * 4] = (Math.random() - .5) * 7; pd[i * 4 + 1] = (Math.random() - .5) * 6; pd[i * 4 + 2] = -4 + Math.random() * 5.5; pd[i * 4 + 3] = Math.random(); }
    var parts = { d: pd }, ptr = { x: 0, y: 0 };
    window.addEventListener('pointermove', function (e) { ptr.x = e.clientX / innerWidth - .5; ptr.y = e.clientY / innerHeight - .5; }, { passive: true });
    scenes.push({ el: $('#heroStage'), draw: function (rc, t) {
      R.cam([ptr.x * .6, -ptr.y * .4, 4.2], [0, 0, 0], 0.9);
      R.points(parts, NP, t, 30 * dpr);
    } });

    /* --- 大圆机 --- */
    var K = {
      cone: mk(Geo.cyl(.055, .155, .46, 20)), peg: mk(Geo.cyl(.018, .018, .16, 6)), ring: mk(Geo.torus(2.2, .035, 90, 8)),
      ring2: mk(Geo.torus(2.2, .02, 90, 6)), pole: mk(Geo.cyl(.045, .045, 1, 12)), feeder: mk(Geo.torus(.98, .03, 72, 8)),
      needle: mk(Geo.cyl(.72, .72, .38, 90)), ntop: mk(Geo.torus(.72, .03, 90, 8)), table: mk(Geo.cyl(2.0, 2.0, .12, 90)),
      rim: mk(Geo.torus(2.0, .05, 100, 8)), tube: mk(Geo.cyl(.69, .75, 1, 72, false, true)), hub: mk(Geo.cyl(.2, .2, 1.2, 16)), arm: BOX
    };
    var NC = 22, yl = [];
    for (i = 0; i < NC; i++) {
      var a = i / NC * PI * 2, b2 = a + 0.35;
      yl.push(2.2 * Math.cos(a), 2.12, 2.2 * Math.sin(a), .98 * Math.cos(b2), .64, .98 * Math.sin(b2));
      yl.push(.98 * Math.cos(b2), .64, .98 * Math.sin(b2), .72 * Math.cos(b2 + .1), .53, .72 * Math.sin(b2 + .1));
    }
    K.yarn = R.mesh({ p: yl }, R.gl.LINES);
    var knitP = 0, knitPs = 0;
    scenes.push({ el: $('#knitStage'), draw: function (rc, t, dt) {
      knitPs = lerp(knitPs, knitP, 1 - Math.exp(-dt * 5)); var p = knitPs;
      var az = -0.9 + p * 1.6 + Math.sin(t * .15) * .08, rad = 7.8 - p * .6, ey = 3.6 - p * 2.0;
      camFit([Math.sin(az) * rad, ey, Math.cos(az) * rad], [0, .55 - p * .75, 0], 0.86);
      var rot = t * .35 + p * 3, G0 = M.RY(rot);
      // 地面光
      R.draw(PLANE, { M: M.chain(M.T(0, -2.2, 0), M.S(9, 1, 9)), c: ORANGE, mode: 9, op: .45, lit: false, noDepth: true });
      // 支腿
      for (var k = 0; k < 3; k++) { var la = k / 3 * PI * 2 + .5; R.draw(BOX, { M: M.chain(M.T(1.55 * Math.cos(la), -1.05, 1.55 * Math.sin(la)), M.S(.14, 2.2, .14)), c: DARKM, met: .6 }); }
      // 台面
      R.draw(K.table, { M: M.chain(M.T(0, .1, 0)), c: [.13, .135, .14], met: .5 });
      R.draw(K.rim, { M: M.chain(M.T(0, .16, 0)), c: METAL, met: .95 });
      // 中心立柱 + 顶部横梁
      R.draw(K.hub, { M: M.chain(G0, M.T(0, 1.35, 0)), c: DARKM, met: .7 });
      for (k = 0; k < 3; k++) { var aa = k / 3 * PI * 2; R.draw(K.pole, { M: M.chain(G0, M.T(2.2 * Math.cos(aa), .95, 2.2 * Math.sin(aa)), M.S(1, 1.6, 1)), c: METAL, met: .9 });
        R.draw(BOX, { M: M.chain(G0, M.RY(-aa), M.T(1.1, 1.92, 0), M.S(2.2, .06, .08)), c: METAL, met: .9 }); }
      // 纱架环 + 纱筒
      R.draw(K.ring, { M: M.chain(G0, M.T(0, 1.75, 0)), c: METAL, met: .95 });
      R.draw(K.ring2, { M: M.chain(G0, M.T(0, 1.62, 0)), c: METAL, met: .95 });
      for (k = 0; k < NC; k++) {
        var ca = k / NC * PI * 2, cx = 2.2 * Math.cos(ca), cz = 2.2 * Math.sin(ca);
        R.draw(K.peg, { M: M.chain(G0, M.T(cx, 1.83, cz)), c: METAL, met: .9 });
        R.draw(K.cone, { M: M.chain(G0, M.T(cx, 2.0, cz), M.RY(t * 2 + k)), c: [.97, .94, .88], mode: 2 });
      }
      // 纱线
      R.draw(K.yarn, { M: G0, c: [1, .97, .92], op: .55, lit: false, noDepth: true });
      // 喂纱环（发光）
      R.draw(K.feeder, { M: M.chain(G0, M.T(0, .64, 0)), c: ORANGE, e: [.9, .3, .08], lit: false });
      // 针筒
      R.draw(K.needle, { M: M.chain(G0, M.T(0, .35, 0)), c: METAL, met: .85, mode: 3 });
      R.draw(K.ntop, { M: M.chain(G0, M.T(0, .54, 0)), c: METAL, met: .95 });
      // 布筒（随滚动变长，纹理向下流动）
      var L = .5 + p * 2.05;
      R.draw(K.tube, { M: M.chain(G0, M.T(0, .16 - L / 2, 0), M.S(1, L, 1)), c: [.94, .91, .85], mode: 1, t: -t * .9, rev: L });
    } });

    /* --- DTF / DTG --- */
    var pmode = 'dtf', printP = 0, printPs = 0;
    var inkTx = tex('assets/tex/print-02.webp'), dtgTx = tex('assets/tex/print-03.webp');
    scenes.push({ el: $('#printStage'), draw: function (rc, t, dt) {
      printPs = lerp(printPs, printP, 1 - Math.exp(-dt * 5)); var p = printPs;
      R.draw(PLANE, { M: M.chain(M.T(0, -.6, 0), M.S(7, 1, 7)), c: ORANGE, mode: 9, op: .3, lit: false, noDepth: true });
      if (pmode === 'dtf') {
        camFit([2.3, 3.1, 3.5], [0, .35, 0], 1.0);
        var G1 = M.RY(-.35 + Math.sin(t * .3) * .08 + p * .4);
        var gap = (1 - sm(.05, .55, p)) * .55, down = sm(.55, .72, p), up = sm(.82, .93, p), heat = sm(.66, .74, p) * (1 - sm(.86, .98, p)), peel = sm(.84, 1, p);
        R.draw(BOX, { M: M.chain(G1, M.T(0, -.06, 0), M.S(2.5, .1, 2.0)), c: [.12, .12, .13], met: .4 });
        R.draw(PLANE, { M: M.chain(G1, M.S(2.25, 1, 1.8)), c: [.1, .1, .11], mode: 1, e: [heat * .5, heat * .14, heat * .03] });
        R.draw(PLANE, { M: M.chain(G1, M.T(0, .006 + gap, 0), M.S(1.05, 1, 1.45)), c: [1, 1, 1], mode: 6, op: .9 * (1 - sm(.5, .62, p)), lit: false });
        R.draw(PLANE, { M: M.chain(G1, M.T(0, .01 + gap * 2, 0), M.S(1.05, 1, 1.45)), mode: 5, tx: inkTx, op: .999, e: [heat * .25, heat * .06, 0] });
        R.draw(PLANE, { M: M.chain(G1, M.T(0, .016 + gap * 3 + peel * 1.3, 0), M.RZ(peel * .25), M.S(1.5, 1, 1.85)), mode: 7, t: t, op: .95 * (1 - peel * .85), lit: false, noDepth: true });
        var py = .135 + 5 * (1 - down) + 5 * up;
        R.draw(BOX, { M: M.chain(G1, M.T(0, py, 0), M.S(2.4, .22, 1.95)), c: METAL, met: .9, e: [heat * .25, heat * .07, heat * .02] });
        R.draw(BOX, { M: M.chain(G1, M.T(0, py + .5, 0), M.S(.3, .8, .3)), c: DARKM, met: .7 });
      } else {
        camFit([0, 2.35, 2.75], [0, -.1, .2], .92);
        var G2 = M.RY(Math.sin(t * .3) * .12 - .15), rev = sm(.18, .8, p), cure = sm(.8, .9, p) * (1 - sm(.97, 1, p) * .5);
        R.draw(BOX, { M: M.chain(G2, M.T(0, -.14, 0), M.S(1.95, .1, 2.35)), c: [.13, .13, .14], met: .4 });
        drawTee(M.chain(G2, M.RX(-PI / 2), M.S(.95, .95, .22)), BLACK, { tx: dtgTx, pr: [-0.56, -0.6, 1.12, 1.12], rev: rev, e: [cure * .13, cure * .04, cure * .01] });
        var pre = sm(0, .06, p) * (1 - sm(.14, .2, p));
        R.draw(PLANE, { M: M.chain(G2, M.T(0, .09, .02), M.S(1.05, 1, 1.25)), c: [.8, .9, 1], op: pre * .35, lit: false, noDepth: true });
        var hz = lerp(-.54, .66, rev) * .95, hx = (rev > 0 && rev < 1) ? Math.sin(t * 11) * .38 : 1.25;
        R.draw(BOX, { M: M.chain(G2, M.T(0, .42, hz), M.S(2.6, .05, .1)), c: METAL, met: .9 });
        R.draw(BOX, { M: M.chain(G2, M.T(hx, .32, hz), M.S(.3, .18, .26)), c: DARKM, met: .7 });
        R.draw(BOX, { M: M.chain(G2, M.T(hx, .22, hz), M.S(.24, .02, .2)), c: ORANGE, e: [.9, .3, .08], lit: false });
      }
    } });
    var STEPS = {
      dtf: [[0, '① 打印', '图案 + 白墨打印在 PET 膜上，深色衣服也能印得鲜艳。'], [.25, '② 撒粉 · 烘干', '热熔胶粉均匀附着在图案背面，烘干后固定。'], [.55, '③ 高温热压', '图案面朝下压到纯棉面料上，胶层熔进纤维。'], [.84, '④ 撕膜完成', '撕掉 PET 膜，图案留在衣服上：色彩饱满，久洗不裂。']],
      dtg: [[0, '① 前处理', '在印花区域喷上预处理液，让墨水挂得住、颜色更正。'], [.2, '② 直喷印花', '喷头一行一行把墨水直接喷进纯棉纤维里。'], [.8, '③ 高温固色', '烘干固色，图案和衣服融为一体，柔软透气。']]
    };
    var renderSteps = function () { $('#printSteps').innerHTML = STEPS[pmode].map(function (s) { return '<div class="st"><b>' + s[1] + '</b><p>' + s[2] + '</p></div>'; }).join(''); };
    renderSteps();
    $$('#ptabs button').forEach(function (b) { b.addEventListener('click', function () { $$('#ptabs button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); pmode = b.getAttribute('data-m'); renderSteps(); printPs = 0; }); });

  }

  /* ---------------- BOXFIT · 实拍 3D 旋转环 ---------------- */
  window._sel = { w: '260', col: '黑' };
  (function ring() {
    var wrap = $('#ringWrap'), rg = $('#ring'), cards = $$('.rc', rg), n = cards.length, step = 360 / n;
    var RAD = Math.round(100 / Math.tan(Math.PI / n)) + 46;
    var ang = 0, vel = 0, drag = false, lx = 0, idle = 0, lastT = performance.now(), cur = -1;
    var dots = $('#ringDots'); dots.innerHTML = cards.map(function () { return '<i></i>'; }).join(''); var di = $$('i', dots);
    cards.forEach(function (c, i) { c.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + RAD + 'px)'; });
    wrap.addEventListener('pointerdown', function (e) { drag = true; lx = e.clientX; vel = 0; idle = 0; try { wrap.setPointerCapture(e.pointerId); } catch (x) { } });
    wrap.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - lx; lx = e.clientX; ang -= dx * .32; vel = -dx * .32; });
    var up = function () { drag = false; }; wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
    (function tick(now) {
      var dt = Math.min((now - lastT) / 1000, .05); lastT = now;
      var r = wrap.getBoundingClientRect();
      if (r.bottom > -50 && r.top < innerHeight + 50) {
        if (!drag) {
          idle += dt; ang += vel; vel *= .9;
          if (Math.abs(vel) < .05) { if (idle > 2.6) ang += dt * 14; else { var tg = Math.round(ang / step) * step; ang += (tg - ang) * Math.min(1, dt * 7); } }
        }
        rg.style.transform = 'translateZ(' + (-RAD) + 'px) rotateY(' + (-ang) + 'deg)';
        cards.forEach(function (c, i) { var rel = ((i * step - ang) % 360 + 540) % 360 - 180, k = Math.cos(rel * Math.PI / 180); c.style.filter = 'brightness(' + (.28 + .72 * Math.max(k, 0)).toFixed(2) + ')'; });
        var f = ((Math.round(ang / step) % n) + n) % n;
        if (f !== cur) { cur = f; $('#ringCap').textContent = cards[f].getAttribute('data-cap'); di.forEach(function (d, i) { d.classList.toggle('on', i === f); }); }
      } else lastT = now;
      requestAnimationFrame(tick);
    })(lastT);
  })();

  /* ---------------- 版型拆解 SVG ---------------- */
  var SZ = { S: [66, 47, 46, 20, 150], M: [69, 50, 49, 21, 155], L: [72, 53, 52, 21, 160], XL: [74, 56, 55, 22, 165], '2XL': [76, 59, 58, 22, 170], '3XL': [78, 62, 61, 23, 175], '4XL': [80, 65, 64, 24, 180] };
  function teeShape(L, CW, SW, SL, k, cx, y0, a, drop) {
    var nw = 9.5 * k, sy = y0 + drop * k, sx = SW / 2 * k, cw = CW / 2 * k, A = a * Math.PI / 180, sl = SL * k, cuff = 18.5 * k;
    var S = [cx + sx, sy], E = [S[0] + sl * Math.cos(A), S[1] + sl * Math.sin(A)], Cf = [E[0] - cuff * Math.sin(A), E[1] + cuff * Math.cos(A)];
    var U = [cx + cw, Math.max(Cf[1] + 4, y0 + 24 * k)], H = [cx + cw, y0 + L * k];
    var m = function (p) { return [2 * cx - p[0], p[1]]; }, P = function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); };
    var d = 'M' + P([cx + nw, y0]) + ' L' + P(S) + ' L' + P(E) + ' L' + P(Cf) + ' L' + P(U) + ' L' + P(H) + ' L' + P(m(H)) + ' L' + P(m(U)) + ' L' + P(m(Cf)) + ' L' + P(m(E)) + ' L' + P(m(S)) + ' L' + P([cx - nw, y0]) + ' Q' + P([cx, y0 + 9 * k]) + ' ' + P([cx + nw, y0]) + ' Z';
    return { d: d, S: S, E: E, Cf: Cf, U: U, H: H, m: m };
  }
  function drawPat(sz) {
    var v = SZ[sz], L = v[0], CW = v[1], SW = v[2], SL = v[3], k = 3.0, cx = 180, y0 = 40;
    var t = teeShape(L, CW, SW, SL, k, cx, y0, 24, 2.5), r = teeShape(L - 2, CW - 7, SW - 9, SL - 1, k, cx, y0, 34, 4);
    var tx = function (x, y, s, an) { return '<text x="' + x + '" y="' + y + '" fill="#f3f0ea" font-size="11.5" font-weight="700" text-anchor="' + (an || 'middle') + '">' + s + '</text>'; };
    var ln = function (x1, y1, x2, y2) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#ff5a1f" stroke-width="1.2" marker-start="url(#ar)" marker-end="url(#ar)"/>'; };
    var Sl = t.m(t.S), cyc = t.U[1] + 12, lx = cx - CW / 2 * k + 22;
    var svg = '<defs><marker id="ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ff5a1f"/></marker>' +
      '<linearGradient id="tf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2a2a2a"/><stop offset="1" stop-color="#161616"/></linearGradient></defs>' +
      '<path d="' + r.d + '" fill="none" stroke="#777" stroke-width="1.3" stroke-dasharray="5 4"/>' +
      '<path d="' + t.d + '" fill="url(#tf)" stroke="#ff5a1f" stroke-width="2" stroke-linejoin="round"/>' +
      ln(Sl[0], y0 - 14, t.S[0], y0 - 14) + tx(cx, y0 - 20, '肩宽 ' + SW) +
      ln(cx - CW / 2 * k + 3, cyc, cx + CW / 2 * k - 3, cyc) + tx(cx, cyc - 6, '胸宽 ' + CW) +
      ln(lx, y0 + 6, lx, t.H[1] - 3) + '<text x="' + (lx + 8) + '" y="' + ((y0 + t.H[1]) / 2 + 30) + '" fill="#f3f0ea" font-size="11.5" font-weight="700">衣长 ' + L + '</text>' +
      tx((t.S[0] + t.E[0]) / 2 + 14, (t.S[1] + t.E[1]) / 2 - 6, '袖长 ' + SL, 'start') +
      '<text x="' + cx + '" y="' + (t.H[1] + 26) + '" fill="#8d8a85" font-size="10.5" text-anchor="middle">' + sz + ' 码 · 单位 cm · 推荐身高 ' + v[4] + 'cm</text>';
    $('#patSvg').innerHTML = svg;
    $('#patNote').innerHTML = '<b>' + sz + ' 码</b> 胸宽 ' + CW + ' ≈ 肩宽 ' + SW + '：从肩到下摆几乎一样宽，衣身是方的——这就是 <b>BOX</b>。肩线往下落、袖子短而宽，所以上身宽松有型、不显胖。';
  }
  $$('#sizes button').forEach(function (b) { b.addEventListener('click', function () { $$('#sizes button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); drawPat(b.textContent); }); });
  drawPat('L');

  /* 颜色 / 克重 */
  $$('#colors button').forEach(function (b) { b.addEventListener('click', function () {
    $$('#colors button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
    var n = b.getAttribute('data-n'), im = $('#cprevImg'); window._sel.col = n;
    im.style.opacity = 0; setTimeout(function () { im.src = $('img', b).src; im.style.opacity = 1; }, 150);
    $('#cprevName').textContent = /色$/.test(n) ? n : n + '色'; updSum();
  }); });
  var WD = { 220: '220G · 轻盈基础：经典不断货系列，透气不闷，活动服、夏季团服首选。', 240: '240G · 厚度平衡：精梳纯棉，不透肉、有型，品牌款和日常穿最稳。', 280: '280G · 重磅廓形：26 支双纱精梳棉，手感厚实有分量。', 320: '320G · 超重磅：最厚实挺括的一档，轮廓感最强，适合秋冬单穿和品牌主推款。' };
  if (C.img320) { var b320 = $('#weights [data-w="320"]'); b320.setAttribute('data-img', C.img320); $('i', b320).className = ''; $('i', b320).style.backgroundImage = 'url(' + C.img320 + ')'; }
  var curFull = 'assets/img/w-280.webp';
  function pickW(b) {
    $$('#weights button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
    var w = b.getAttribute('data-w'), img = b.getAttribute('data-img'), wi = $('#wImg');
    window._sel.w = w; $('#wdesc').textContent = WD[w]; $('#wBadge').textContent = w + 'G';
    $('#wview').classList.toggle('empty', !img);
    if (img) { wi.style.opacity = 0; setTimeout(function () { wi.src = img; wi.style.opacity = 1; }, 160); }
    var fab = { 220: 'assets/img/fab-220.webp', 240: 'assets/img/fab-240.webp', 280: 'assets/img/fab-280.webp' }[w]; $('#wview').classList.toggle('nofab', !fab); if (fab) $('#wFabImg').src = fab;
    curFull = b.getAttribute('data-full'); $('#wlink').style.display = curFull ? '' : 'none'; $('#wlink').textContent = '查看 ' + w + 'G 完整资料 ↗';
    if (window.updSum) updSum();
  }
  $$('#weights button').forEach(function (b) { b.addEventListener('click', function () { pickW(b); }); });
  window._sel.w = '280'; $('#wdesc').textContent = WD[280];
  $('#wlink').addEventListener('click', function () { if (curFull) openLB(curFull); });

  /* ---------------- 原创设计 · 实拍上身预览 ---------------- */
  (function mock() {
    var mk = $('#mock'), mp = $('#mprint'), act = 0;
    var tilt = function (x, y) { mk.style.setProperty('--ry', (x * 16).toFixed(2) + 'deg'); mk.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg'); mk.style.setProperty('--gx', (x * 90).toFixed(1) + '%'); };
    mk.addEventListener('pointermove', function (e) { var r = mk.getBoundingClientRect(); act = performance.now(); tilt((e.clientX - r.left) / r.width - .5, (e.clientY - r.top) / r.height - .5); });
    (function sway(n) { if (n - act > 1500) tilt(Math.sin(n / 1700) * .35, Math.cos(n / 2300) * .2); requestAnimationFrame(sway); })(0);
    $$('#tiles button').forEach(function (b) { b.addEventListener('click', function () {
      $$('#tiles button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
      mp.classList.add('swap'); setTimeout(function () { mp.src = b.getAttribute('data-t'); mp.style.width = (b.getAttribute('data-w') || 34) + '%'; mp.style.left = (50 - (b.getAttribute('data-w') || 34) / 2 + .5) + '%'; mp.classList.remove('swap'); }, 260);
    }); });
  })();

  /* ---------------- 滚动驱动 ---------------- */
  function pinP(el) { var r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - VH()), 0, 1); }
  var knitStepsEl = $$('#knitSteps .st'), chainLns = $$('#chain .ln');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset, H = document.documentElement.scrollHeight - VH();
    $('#prog').style.width = (H > 0 ? y / H * 100 : 0) + '%';
    var kp = pinP($('#fabric')); if (R) knitP = kp; $('#knitBar').style.width = kp * 100 + '%';
    var ki = kp < .33 ? 0 : kp < .66 ? 1 : 2; knitStepsEl.forEach(function (s, i) { s.classList.toggle('on', i === ki); });
    var pp = pinP($('#print')); if (R) printP = pp; $('#printBar').style.width = pp * 100 + '%';
    var ss = $$('#printSteps .st'), arr = (R && STEPS) ? STEPS[pmode] : [], idx = 0;
    arr.forEach(function (s, i) { if (pp >= s[0]) idx = i; }); ss.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
    if (!R && ss.length === 0) {}
    var line = $('#chainLine').getBoundingClientRect(), lim = VH() * .62;
    $('#chainFill').style.height = clamp(lim - line.top - 18, 0, line.height - 36) + 'px';
    chainLns.forEach(function (l) { l.classList.toggle('lit', l.getBoundingClientRect().top + 17 < lim); });
    var hl = $('#heroLogo'); if (hl) { var hp = clamp(y / VH(), 0, 1); hl.parentNode.style.transform = 'translate(-50%,calc(-50% - ' + (hp * 120) + 'px)) scale(' + (1 - hp * .25) + ')'; hl.parentNode.style.opacity = 1 - hp * 1.2; }
  }
  if (!R) { // 无 WebGL 也给工艺步骤
    var STEPS = { dtf: [[0, '① 打印', '图案 + 白墨打印在 PET 膜上。'], [.3, '② 撒粉 · 烘干', '热熔胶粉附着在图案背面。'], [.55, '③ 高温热压', '图案压到纯棉面料上。'], [.84, '④ 撕膜完成', '色彩饱满，久洗不裂。']] }, pmode = 'dtf';
    $('#printSteps').innerHTML = STEPS.dtf.map(function (s) { return '<div class="st"><b>' + s[1] + '</b><p>' + s[2] + '</p></div>'; }).join('');
    $('#ptabs').style.display = 'none';
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------- 渲染循环 ---------------- */
  var last = performance.now(), T = 0;
  function frame(now) {
    var dt = Math.min((now - last) / 1000, .05); last = now; T += dt;
    onScroll();
    if (R) {
      if (canvas.width !== Math.round(innerWidth * dpr) || canvas.height !== Math.round(innerHeight * dpr)) resize();
      var gl = R.gl; gl.disable(gl.SCISSOR_TEST); gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      var vh = VH();
      scenes.forEach(function (s) {
        var rc = s.el.getBoundingClientRect(); if (rc.bottom < 0 || rc.top > vh || rc.width < 2) return;
        R.view(rc, dpr); s.draw(rc, T, dt);
      });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* hero logo 跟手倾斜 */
  var hlg = $('#heroLogo');
  function tilt(x, y) { hlg.style.setProperty('--ry', (x * 26 - 8) + 'deg'); hlg.style.setProperty('--rx', (6 - y * 18) + 'deg'); }
  window.addEventListener('pointermove', function (e) { tilt(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5); }, { passive: true });
  window.addEventListener('deviceorientation', function (e) { if (e.gamma == null) return; tilt(clamp(e.gamma / 60, -.5, .5), clamp((e.beta - 45) / 60, -.5, .5)); }, { passive: true });
  (function sway(n) { if (!('ontouchstart' in window)) return; hlg.style.setProperty('--ry', (Math.sin(n / 1600) * 14 - 6) + 'deg'); requestAnimationFrame(sway); })(0);

  /* ---------------- 选印花小测试 ---------------- */
  var qa = {};
  $$('#quiz .q').forEach(function (q) {
    $$('button', q).forEach(function (b) { b.addEventListener('click', function () {
      $$('button', q).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); qa[q.getAttribute('data-q')] = b.getAttribute('data-v');
      if (Object.keys(qa).length === 3) {
        var s = { dtf: 0, dtg: 0 }; Object.keys(qa).forEach(function (k) { var v = qa[k].split(':'); if (s[v[0]] !== undefined) s[v[0]] += +v[1]; });
        var r = s.dtf > s.dtg ? ['推荐 DTF 烫画', '颜色鲜艳、细节清楚，面料适应性强，小批量多款也划算。', 0] : s.dtg > s.dtf ? ['推荐 DTG 直喷', '墨水渗进纤维，手感柔软透气，纯棉大图效果最好。', 1] : ['两种都合适', '建议各打一件样，上身对比后再定，104 可以同时安排。', 2];
        var el = $('#qres'); el.innerHTML = '<b>' + r[0] + '</b><br>' + r[1]; el.classList.add('show');
        var pc = $$('[data-g=proc] button'); pc.forEach(function (x) { x.classList.remove('on'); }); pc[r[2]].classList.add('on'); updSum();
      }
    }); });
  });

  /* ---------------- 需求生成器 ---------------- */
  var QTY = [20, 30, 50, 80, 100, 150, 200, 300, 500, 800, 1000, 2000, 5000], qty = $('#qty');
  qty.value = 17;
  $$('#gen .chips').forEach(function (g) { $$('button', g).forEach(function (b) { b.addEventListener('click', function () { $$('button', g).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); updSum(); }); }); });
  qty.addEventListener('input', updSum);
  function chip(g) { var b = $('[data-g=' + g + '] .on'); return b ? b.textContent : ''; }
  function sumText() {
    var n = QTY[Math.round(qty.value / 100 * (QTY.length - 1))], sel = window._sel || { w: '260', col: '黑' }, cat = chip('cat');
    var spec = (cat === '短袖 T 恤' || cat === '长袖') ? '（' + sel.w + 'G BOXFIT · ' + sel.col + '色）' : '';
    return '【104 定制需求】\n品类：' + cat + spec + '\n工艺：' + chip('proc') + '\n数量：约 ' + n + ' 件\n交期：' + chip('time') + '\n图案：我会把设计图 / 想法发给你们\n—— 来自 104 宣传页';
  }
  function updSum() {
    var n = QTY[Math.round(qty.value / 100 * (QTY.length - 1))]; $('#qtyV').textContent = (n >= 5000 ? '5000+' : n) + ' 件';
    qty.style.setProperty('--p', qty.value + '%'); $('#sum').textContent = sumText();
  }
  window.updSum = updSum; updSum();
  function toast(s) { var t = $('#toast'); t.innerHTML = s; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2200); }
  $('#copyBtn').addEventListener('click', function (e) {
    e.preventDefault(); var url = this.href, s = sumText(), done = false;
    var go = function () { if (done) return; done = true; toast('需求已复制 ✓<br><span style="font-size:12px;color:#aaa">正在打开 104 团队定制页…</span>'); setTimeout(function () { location.href = url; }, 900); };
    var fb = function () { var ta = document.createElement('textarea'); ta.value = s; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (x) { } document.body.removeChild(ta); go(); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).then(go, fb); else fb();
    setTimeout(go, 1200);
  });

  /* ---------------- 看大图 ---------------- */
  function openLB(src) { var lb = $('#lightbox'); $('img', lb).src = src; lb.classList.add('show'); }
  var lb = $('#lightbox');
  $$('.lb').forEach(function (f) { f.addEventListener('click', function () { openLB(f.getAttribute('data-full')); }); });
  lb.addEventListener('click', function () { lb.classList.remove('show'); });
})();
