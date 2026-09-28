/* 生命探索 · NOTES ON BEING — 动态版脚本（无外部依赖，兼容 CSP script-src 'self'） */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');
  const mqReduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const reduce = mqReduce.matches;

  /* ---------------- 工具 ---------------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const toast = (() => {
    const el = $('#toast');
    let timer = 0;
    return msg => {
      if (!el) return;
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(() => el.classList.remove('show'), 2600);
    };
  })();

  /* ---------------- 逐字拆分 ---------------- */
  $$('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const ch of child.textContent) {
            if (ch === '\n') continue;
            const s = document.createElement('span');
            s.className = 'ch';
            s.textContent = ch;
            s.style.setProperty('--i', i++);
            frag.appendChild(s);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
    el.setAttribute('aria-label', el.textContent);
  });

  /* ---------------- 粒子场 ---------------- */
  const field = (() => {
    const cv = $('#field');
    if (!cv || !cv.getContext) return null;
    const ctx = cv.getContext('2d', { alpha: false });
    let W = 0, H = 0, DPR = 1, S = 0, N = 0;
    let P = [];
    const TAU = Math.PI * 2;

    // 每个场景的色板：a 主色、b 辅色、bg 底色、g 光晕色
    const PAL = [
      { a: [199, 220, 131], b: [236, 232, 214], bg: [13, 15, 12], g: [199, 220, 131] }, // 序章 呼吸
      { a: [236, 224, 186], b: [199, 220, 131], bg: [15, 15, 12], g: [240, 226, 180] }, // 存在 光里的尘
      { a: [199, 220, 131], b: [150, 214, 190], bg: [11, 14, 13], g: [170, 220, 160] }, // 起点 种子
      { a: [214, 226, 255], b: [199, 220, 131], bg: [10, 12, 17], g: [150, 170, 230] }, // 意义 星座
      { a: [236, 190, 120], b: [236, 232, 214], bg: [15, 13, 11], g: [236, 170, 90] },  // 有限 燃烧的环
      { a: [140, 162, 196], b: [186, 196, 210], bg: [9, 11, 15], g: [236, 190, 130] },  // 痛苦 雨
      { a: [236, 160, 122], b: [199, 220, 131], bg: [15, 12, 12], g: [236, 160, 122] }, // 关系 两个人
      { a: [248, 204, 122], b: [240, 234, 214], bg: [17, 14, 10], g: [248, 186, 100] }, // 日常 日出
      { a: [199, 220, 131], b: [255, 246, 222], bg: [12, 14, 11], g: [214, 232, 150] }  // 此刻 心跳
    ];
    const KINEMATIC = { 5: true, 7: true }; // 连续下落 / 上升的场景允许回绕瞬移

    const st = {
      scene: 0, prev: 0, changedAt: 0, mix: 1,
      pal: JSON.parse(JSON.stringify(PAL[0])), palFrom: PAL[0],
      breath: 0, breathTarget: 0,
      lines: 0, streak: 0,
      pointer: { x: -1e4, y: -1e4 },
      ripples: [],
      t: 0, last: 0, running: false
    };

    const rand = (() => { let s = 20260928; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();

    function build() {
      const area = W * H;
      N = Math.round(clamp(area / (W < 700 ? 2600 : 3600), 150, reduce ? 180 : 420));
      const old = P;
      P = [];
      for (let k = 0; k < N; k++) {
        const o = old[k];
        P.push({
          k,
          s: rand(), s2: rand(), s3: rand(),
          hx: rand(), hy: rand(),
          x: o ? o.x : rand() * W, y: o ? o.y : rand() * H,
          vx: 0, vy: 0,
          r: 0.6 + Math.pow(rand(), 2.2) * 2.1,
          tw: 0.6 + rand() * 2.2,
          alt: rand() < 0.28
        });
      }
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      DPR = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.6 : 2);
      cv.width = Math.round(W * DPR);
      cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      S = Math.min(W, H);
      build();
      const bg = st.pal.bg;
      ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
      ctx.fillRect(0, 0, W, H);
    }

    function center() {
      // 宽屏把图形放在右侧，给文字让出阅读区；手机居中偏上
      return W >= 1080 ? { x: W * 0.72, y: H * 0.5 } : W > 760 ? { x: W * 0.62, y: H * 0.5 } : { x: W * 0.5, y: H * 0.44 };
    }

    /* 各场景的目标位置 */
    function target(p, sc, t, C, out) {
      const R = S * (W >= 1080 ? 0.33 : 0.42);
      switch (sc) {
        case 0: { // 呼吸的三层环
          const ring = p.k % 3;
          const dir = ring === 1 ? -1 : 1;
          const a = p.s * TAU + t * (0.05 + ring * 0.025) * dir;
          const rr = R * (0.55 + ring * 0.22) * (1 + 0.045 * Math.sin(t * 0.8 + ring)) + Math.sin(t * 1.3 + p.s2 * 40) * S * 0.012;
          out.x = C.x + Math.cos(a) * rr;
          out.y = C.y + Math.sin(a) * rr;
          out.a = 0.75;
          break;
        }
        case 1: { // 光里浮动的尘
          out.x = p.hx * W + Math.sin(t * 0.18 + p.s * 12) * 46 + Math.sin(t * 0.07 + p.s2 * 9) * 30;
          out.y = p.hy * H + Math.cos(t * 0.15 + p.s2 * 10) * 36 - ((t * 6 * (0.3 + p.s3)) % 60);
          const beam = 1 - Math.min(1, Math.abs((out.x - W * 0.25) - (out.y) * 0.55) / (S * 0.45));
          out.a = 0.28 + beam * 0.7;
          break;
        }
        case 2: { // 一粒种子，展开成一朵向日葵
          const cyc = 11;
          const ph = ((t + 2.5) % cyc) / cyc;
          let g;
          if (ph < 0.14) g = 0.05;
          else if (ph < 0.5) g = 0.05 + 0.95 * ease((ph - 0.14) / 0.36);
          else if (ph < 0.86) g = 1;
          else g = 1 - 0.95 * ease((ph - 0.86) / 0.14);
          const ang = p.k * 2.39996323 + t * 0.06;
          const rr = R * 1.02 * Math.sqrt((p.k + 0.5) / N) * g;
          out.x = C.x + Math.cos(ang) * rr;
          out.y = C.y + Math.sin(ang) * rr;
          out.a = 0.55 + 0.45 * (1 - Math.sqrt(p.k / N));
          break;
        }
        case 3: { // 星座：固定的星，缓慢漂移
          out.x = (0.04 + p.s2 * 0.92) * W + Math.sin(t * 0.05 + p.s * 9) * 10;
          out.y = (0.06 + p.s3 * 0.88) * H + Math.cos(t * 0.04 + p.s * 7) * 8;
          out.a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * p.tw + p.s * 30));
          break;
        }
        case 4: { // 燃烧的环：时间一点点被用掉
          const cyc = 34;
          const f = 1 - ((t % cyc) / cyc) * 0.82; // 剩余比例 1 → 0.18
          const pos = p.s;
          const a = -Math.PI / 2 + pos * TAU;
          const rr = R * 0.78 + Math.sin(t * 2 + p.s2 * 50) * 2.5;
          const bx = C.x + Math.cos(a) * rr;
          const by = C.y + Math.sin(a) * rr;
          if (pos <= f) {
            out.x = bx; out.y = by; out.a = 0.8;
          } else {
            const since = (pos - f) / 0.82 * cyc; // 已经落下多久（秒）
            out.x = bx + Math.sin(since * 0.8 + p.s2 * 9) * 14 * since;
            out.y = by + since * since * S * 0.018 + since * S * 0.02;
            out.a = Math.max(0, 0.75 - since * 0.07);
          }
          out.f = f;
          break;
        }
        case 5: { // 雨
          const sp = H * (0.11 + p.s3 * 0.16);
          out.y = ((p.hy * (H + 80) + t * sp) % (H + 80)) - 40;
          out.x = p.hx * W + Math.sin(t * 0.3 + p.s) * 8 - out.y * 0.06;
          out.a = 0.14 + p.s2 * 0.28;
          break;
        }
        case 6: { // 两个人：两团光彼此环绕、交换
          const d = R * (0.46 + 0.1 * Math.sin(t * 0.21));
          const w = t * 0.22;
          const ax = C.x + Math.cos(w) * d, ay = C.y + Math.sin(w) * d * 0.55;
          const bx = C.x - Math.cos(w) * d, by = C.y - Math.sin(w) * d * 0.55;
          if (p.k % 9 === 0) { // 在两人之间往返的光
            const u = (t * 0.12 + p.s) % 1;
            const arc = Math.sin(u * Math.PI) * R * 0.18 * (p.s2 < 0.5 ? 1 : -1);
            const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
            out.x = ax + dx * u - dy / L * arc;
            out.y = ay + dy * u + dx / L * arc;
            out.a = 0.9;
          } else {
            const mine = p.k % 2 === 0;
            const cx = mine ? ax : bx, cy = mine ? ay : by;
            const rr = R * 0.3 * Math.sqrt(p.s);
            const aa = p.s2 * TAU + t * (0.35 + p.s3 * 0.3) * (mine ? 1 : -1);
            out.x = cx + Math.cos(aa) * rr;
            out.y = cy + Math.sin(aa) * rr;
            out.a = 0.45 + (1 - p.s) * 0.5;
          }
          out.A = [ax, ay]; out.B = [bx, by];
          break;
        }
        case 7: { // 日常：暖光缓缓上升
          const sp = H * (0.035 + p.s3 * 0.05);
          const yy = ((p.hy * (H + 60) + t * sp) % (H + 60));
          out.y = H + 30 - yy;
          out.x = p.hx * W + Math.sin(t * 0.5 + p.s * 20) * 22;
          out.a = 0.2 + 0.45 * (yy / (H + 60) < 0.5 ? yy / (H + 60) * 2 : 1) * (1 - yy / (H + 60) * 0.7);
          break;
        }
        case 8: { // 此刻：一颗跳动的光心
          const ph = (t % 1.25) / 1.25;
          const beat = 1 + 0.1 * Math.exp(-Math.pow((ph - 0.02) / 0.05, 2)) + 0.06 * Math.exp(-Math.pow((ph - 0.2) / 0.05, 2));
          const ring = p.k % 5 < 3;
          const aa = p.s * TAU + t * 0.08;
          const rr = ring ? R * 0.5 * beat + Math.sin(t * 1.7 + p.s2 * 40) * 3 : R * 0.45 * Math.sqrt(p.s2) * beat;
          out.x = C.x + Math.cos(aa) * rr;
          out.y = C.y + Math.sin(aa) * rr;
          out.a = ring ? 0.85 : 0.4;
          out.beat = beat;
          break;
        }
      }
    }

    function drawGlows(sc, t, C, info) {
      const g = st.pal.g;
      const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
      const R = S * (W >= 1080 ? 0.33 : 0.42);
      const fade = st.mix;
      const glow = (x, y, r, a) => {
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, rgba(g, a));
        grd.addColorStop(1, rgba(g, 0));
        ctx.fillStyle = grd;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      };
      if (sc === 0) glow(C.x, C.y, R * (0.6 + st.breath * 0.4), 0.03 + st.breath * 0.04);
      if (sc === 1) { // 斜射的光柱
        ctx.save();
        ctx.translate(W * 0.25, 0);
        ctx.rotate(-0.5);
        const grd = ctx.createLinearGradient(-S * 0.35, 0, S * 0.35, 0);
        grd.addColorStop(0, rgba(g, 0));
        grd.addColorStop(0.5, rgba(g, 0.022 * fade));
        grd.addColorStop(1, rgba(g, 0));
        ctx.fillStyle = grd;
        ctx.fillRect(-S * 0.35, -H, S * 0.7, H * 3);
        ctx.restore();
      }
      if (sc === 2) glow(C.x, C.y, R * 0.35, 0.04 * fade);
      if (sc === 4 && info.f !== undefined) { // 剩余的弧 + 火点
        const rr = R * 0.78;
        ctx.strokeStyle = rgba(g, 0.18 * fade);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(C.x, C.y, rr, -Math.PI / 2, -Math.PI / 2 + info.f * TAU);
        ctx.stroke();
        const ea = -Math.PI / 2 + info.f * TAU;
        glow(C.x + Math.cos(ea) * rr, C.y + Math.sin(ea) * rr, 24 + Math.sin(t * 9) * 3, 0.32 * fade);
      }
      if (sc === 5) { // 雨中仍亮着的一点光
        const fl = 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 3.1);
        glow(C.x, H * 0.72, S * 0.12 * fl, 0.11 * fade);
        glow(C.x, H * 0.72, 6 * fl, 0.7 * fade);
      }
      if (sc === 6 && info.A) {
        glow(info.A[0], info.A[1], R * 0.4, 0.04 * fade);
        glow(info.B[0], info.B[1], R * 0.4, 0.04 * fade);
        ctx.strokeStyle = rgba(g, 0.12 * fade);
        ctx.beginPath();
        ctx.moveTo(info.A[0], info.A[1]);
        ctx.lineTo(info.B[0], info.B[1]);
        ctx.stroke();
      }
      if (sc === 7) { // 地平线上的暖光
        const grd = ctx.createRadialGradient(W * 0.5, H * 1.08, 0, W * 0.5, H * 1.08, Math.max(W, H) * 0.75);
        grd.addColorStop(0, rgba(g, 0.075 * fade));
        grd.addColorStop(0.5, rgba(g, 0.02 * fade));
        grd.addColorStop(1, rgba(g, 0));
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
      }
      if (sc === 8) {
        const b = info.beat || 1;
        glow(C.x, C.y, R * 0.42 * b, 0.05 * fade);
        glow(C.x, C.y, 8 * b, 0.6 * fade);
      }
    }

    const tgt = {};
    function frame(now) {
      if (!st.running) return;
      requestAnimationFrame(frame);
      const dtRaw = st.last ? (now - st.last) / 1000 : 0.016;
      st.last = now;
      const dt = Math.min(dtRaw, 0.05);
      const speed = reduce ? 0.35 : 1;
      st.t += dt * speed;
      const t = st.t;
      const sc = st.scene;
      const age = (now - st.changedAt) / 1000;

      // 色板过渡
      st.mix = clamp(age / 1.8, 0, 1);
      const m = ease(st.mix);
      ['a', 'b', 'bg', 'g'].forEach(key => {
        for (let i = 0; i < 3; i++) st.pal[key][i] = lerp(st.palFrom[key][i], PAL[sc][key][i], m);
      });
      st.breath = lerp(st.breath, st.breathTarget, 1 - Math.pow(0.02, dt));
      st.lines = lerp(st.lines, sc === 3 ? 1 : 0, 1 - Math.pow(0.1, dt));
      st.streak = lerp(st.streak, sc === 5 ? 1 : 0, 1 - Math.pow(0.05, dt));

      const bg = st.pal.bg;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(${bg[0] | 0},${bg[1] | 0},${bg[2] | 0},${reduce ? 1 : 0.26})`;
      ctx.fillRect(0, 0, W, H);

      const C = center();
      const info = {};
      const stiff = sc === 1 ? 0.5 : sc === 3 ? 0.7 : 1;
      const kin = KINEMATIC[sc] && age > 2.2;
      const breathScale = 1 + st.breath * 0.28;
      const pr = st.pointer;

      ctx.globalCompositeOperation = 'lighter';
      const A = st.pal.a, B = st.pal.b;
      const colA = `${A[0] | 0},${A[1] | 0},${A[2] | 0}`;
      const colB = `${B[0] | 0},${B[1] | 0},${B[2] | 0}`;

      for (let i = 0; i < N; i++) {
        const p = P[i];
        target(p, sc, t, C, tgt);
        if (tgt.f !== undefined) info.f = tgt.f;
        if (tgt.A) { info.A = tgt.A; info.B = tgt.B; }
        if (tgt.beat) info.beat = tgt.beat;
        let tx = C.x + (tgt.x - C.x) * breathScale;
        let ty = C.y + (tgt.y - C.y) * breathScale;
        if (kin && Math.abs(ty - p.y) > H * 0.5) { p.x = tx; p.y = ty; p.vx = 0; p.vy = 0; }
        const k = 0.0105 * stiff * (0.75 + p.s3 * 0.5);
        p.vx += (tx - p.x) * k * dt * 60;
        p.vy += (ty - p.y) * k * dt * 60;
        // 轻微的扰动
        p.vx += Math.sin(t * 0.9 + p.s * 40) * 0.012;
        p.vy += Math.cos(t * 0.8 + p.s2 * 40) * 0.012;
        // 指针排斥
        const dx = p.x - pr.x, dy = p.y - pr.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 12000) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / 110) * 1.4;
          p.vx += dx / d * f;
          p.vy += dy / d * f;
        }
        const damp = Math.pow(0.9, dt * 60);
        p.vx *= damp;
        p.vy *= damp;
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;

        const tw = 0.6 + 0.4 * Math.sin(t * p.tw + p.s * 20);
        const alpha = clamp(tgt.a * tw, 0, 1);
        if (alpha < 0.02) continue;
        const col = p.alt ? colB : colA;
        if (st.streak > 0.05) {
          ctx.strokeStyle = `rgba(${col},${alpha * 0.8})`;
          ctx.lineWidth = Math.max(0.6, p.r * 0.6);
          ctx.beginPath();
          ctx.moveTo(p.x + 1.2 * st.streak, p.y - (8 + p.r * 9) * st.streak);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${col},${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, TAU);
          ctx.fill();
        }
      }

      // 星座连线
      if (st.lines > 0.02) {
        const M = Math.min(N, W < 700 ? 100 : 150);
        const maxD = S * (W < 700 ? 0.16 : 0.12);
        const base = W < 760 ? 0.13 : 0.22;
        const textEdge = W >= 1080 ? W * 0.56 : 0;
        const maxD2 = maxD * maxD;
        ctx.lineWidth = 0.7;
        for (let i = 0; i < M; i++) {
          const a = P[i];
          for (let j = i + 1; j < M; j++) {
            const b = P[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < maxD2) {
              const mx = (a.x + b.x) / 2;
              const zone = textEdge && mx < textEdge ? 0.35 : 1;
              const al = (1 - Math.sqrt(d2) / maxD) * base * zone * st.lines;
              ctx.strokeStyle = `rgba(${colA},${al})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      drawGlows(sc, t, C, info);

      // 点击涟漪
      for (let i = st.ripples.length - 1; i >= 0; i--) {
        const r = st.ripples[i];
        const life = (now - r.t0) / 1400;
        if (life >= 1) { st.ripples.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(${colA},${(1 - life) * 0.45})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 8 + ease(life) * 120, 0, TAU);
        ctx.stroke();
      }
    }

    function start() {
      if (st.running) return;
      st.running = true;
      st.last = 0;
      requestAnimationFrame(frame);
    }
    function stop() { st.running = false; }

    window.addEventListener('resize', (() => {
      let tm = 0;
      let lastW = window.innerWidth;
      return () => {
        clearTimeout(tm);
        tm = setTimeout(() => {
          // 手机地址栏伸缩只改变高度，避免整体重建
          if (Math.abs(window.innerWidth - lastW) < 2 && Math.abs(window.innerHeight - H) < 140) {
            H = window.innerHeight;
            cv.height = Math.round(H * DPR);
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            return;
          }
          lastW = window.innerWidth;
          resize();
        }, 150);
      };
    })());
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    const pointerMove = e => { st.pointer.x = e.clientX; st.pointer.y = e.clientY; };
    window.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') pointerMove(e); }, { passive: true });
    document.addEventListener('mouseleave', () => { st.pointer.x = st.pointer.y = -1e4; });
    window.addEventListener('click', e => {
      if (e.target.closest('button,a,textarea,input,label,.gate')) return;
      if (reduce) return;
      st.ripples.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
      if (st.ripples.length > 6) st.ripples.shift();
      P.forEach(p => {
        const dx = p.x - e.clientX, dy = p.y - e.clientY;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 180) { const f = (1 - d / 180) * 9; p.vx += dx / d * f; p.vy += dy / d * f; }
      });
    }, { passive: true });

    resize();
    start();

    return {
      setScene(i) {
        if (i === st.scene) return;
        st.palFrom = JSON.parse(JSON.stringify(st.pal));
        st.prev = st.scene;
        st.scene = i;
        st.changedAt = performance.now();
      },
      setBreath(v) { st.breathTarget = v; },
      burst(x, y) {
        const C = x === undefined ? center() : { x, y };
        P.forEach(p => {
          const dx = p.x - C.x, dy = p.y - C.y;
          const d = Math.hypot(dx, dy) || 1;
          const f = 6 + Math.random() * 10;
          p.vx += dx / d * f;
          p.vy += dy / d * f - 3;
        });
      }
    };
  })();

  /* ---------------- 声音：环境音乐 + 章节钟声 ---------------- */
  const sound = (() => {
    const audio = $('#ambient');
    const btn = $('#sound');
    const stateEl = $('#sound-state');
    let on = false;
    let actx = null, master = null;
    let fadeRaf = 0;
    let wantResume = false;

    function ui() {
      if (!btn) return;
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? '关闭环境音乐' : '打开环境音乐');
      if (stateEl) stateEl.textContent = on ? '开' : '关';
    }

    function fadeTo(target, ms, done) {
      cancelAnimationFrame(fadeRaf);
      const from = audio.volume;
      const t0 = performance.now();
      const step = now => {
        const k = clamp((now - t0) / ms, 0, 1);
        try { audio.volume = clamp(lerp(from, target, k), 0, 1); } catch (e) { /* iOS 只读 */ }
        if (k < 1) fadeRaf = requestAnimationFrame(step);
        else if (done) done();
      };
      fadeRaf = requestAnimationFrame(step);
    }

    function ensureCtx() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!actx) {
        try {
          actx = new AC();
          master = actx.createGain();
          master.gain.value = 0.8;
          const delay = actx.createDelay(1.5);
          delay.delayTime.value = 0.42;
          const fb = actx.createGain();
          fb.gain.value = 0.32;
          const lp = actx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 2400;
          master.connect(actx.destination);
          master.connect(delay);
          delay.connect(lp);
          lp.connect(fb);
          fb.connect(delay);
          lp.connect(actx.destination);
        } catch (e) { actx = null; return; }
      }
      if (actx.state === 'suspended') actx.resume().catch(() => {});
    }

    function chime(notes, gap = 0.26, vol = 1) {
      if (!on || !actx || actx.state !== 'running') return;
      const now = actx.currentTime + 0.02;
      notes.forEach((m, i) => {
        const f = 440 * Math.pow(2, (m - 69) / 12);
        const t0 = now + i * gap;
        [[1, 1, 2.6], [2, 0.22, 1.3], [3, 0.07, 0.7], [4.01, 0.03, 0.4]].forEach(([r, a, d]) => {
          const o = actx.createOscillator();
          const g = actx.createGain();
          o.type = 'sine';
          o.frequency.value = f * r;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.045 * a * vol, t0 + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
          o.connect(g);
          g.connect(master);
          o.start(t0);
          o.stop(t0 + d + 0.05);
        });
      });
    }

    async function play() {
      ensureCtx();
      try {
        audio.volume = 0;
      } catch (e) { /* ignore */ }
      try {
        const pr = audio.play();
        on = true;
        ui();
        if (pr && pr.then) await pr;
        fadeTo(0.85, 2600);
        return true;
      } catch (e) {
        on = false;
        ui();
        toast('浏览器暂时拦截了声音，再点一次右下角「环境音」试试');
        return false;
      }
    }

    function pause() {
      on = false;
      ui();
      fadeTo(0, 900, () => { if (!on) audio.pause(); });
    }

    if (audio) {
      audio.addEventListener('error', () => {
        if (on) { on = false; ui(); toast('音乐加载失败，请检查网络后再试'); }
      });
    }
    if (btn) btn.addEventListener('click', () => (on ? pause() : play()));

    document.addEventListener('visibilitychange', () => {
      if (!audio) return;
      if (document.hidden) {
        if (on) { wantResume = true; audio.pause(); }
      } else if (wantResume && on) {
        wantResume = false;
        audio.play().catch(() => { on = false; ui(); });
      }
    });

    return { play, pause, chime, get on() { return on; } };
  })();

  // 每个章节的钟声（D 大调五声音阶里取音）
  const CHIMES = [[74, 81], [74, 78], [69, 76], [78, 83, 86], [81, 76], [71, 74], [76, 81], [78, 81, 86], [74, 78, 81, 86]];

  /* ---------------- 入场 ---------------- */
  const gate = $('#gate');
  const hero = $('.hero');
  function enter(withMusic) {
    root.classList.add('entered');
    if (gate) {
      gate.classList.add('leaving');
      setTimeout(() => { gate.hidden = true; }, 1150);
    }
    document.body.style.overflow = '';
    hero && hero.classList.add('visible');
    if (withMusic) sound.play().then(ok => ok && setTimeout(() => sound.chime(CHIMES[0], 0.3, 0.9), 900));
    field && field.burst();
  }
  if (gate) {
    gate.hidden = false;
    document.body.style.overflow = 'hidden';
    const bMusic = $('#enter-music');
    const bQuiet = $('#enter-quiet');
    bMusic && bMusic.addEventListener('click', () => enter(true));
    bQuiet && bQuiet.addEventListener('click', () => enter(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !gate.hidden) enter(false); });
    setTimeout(() => bMusic && bMusic.focus({ preventScroll: true }), 300);
  } else {
    root.classList.add('entered');
    hero && hero.classList.add('visible');
  }

  /* ---------------- 进入视野 ---------------- */
  const revealIO = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealIO.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }) : null;
  $$('.reveal').forEach(el => (revealIO ? revealIO.observe(el) : el.classList.add('visible')));

  /* ---------------- 滚动：进度、当前章节、场景 ---------------- */
  const bar = $('#progress');
  const navNow = $('#nav-now');
  const railLinks = $$('#rail a');
  const scenes = $$('.scene');
  let current = -1;
  let ticking = false;
  function onScroll() {
    ticking = false;
    const d = document.documentElement;
    const max = d.scrollHeight - window.innerHeight;
    const k = max > 0 ? window.scrollY / max : 0;
    if (bar) bar.style.transform = `scaleX(${k})`;
    const mid = window.innerHeight * 0.55;
    let idx = 0;
    scenes.forEach((s, i) => { if (s.getBoundingClientRect().top <= mid) idx = i; });
    if (idx !== current) {
      const first = current === -1;
      current = idx;
      const sc = parseInt(scenes[idx].dataset.scene, 10) || 0;
      field && field.setScene(sc);
      if (navNow) {
        navNow.textContent = scenes[idx].dataset.title || '';
        navNow.classList.toggle('on', idx > 0);
      }
      railLinks.forEach((a, i) => a.classList.toggle('on', i === idx - 1));
      if (!first) sound.chime(CHIMES[sc] || CHIMES[0]);
    }
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------------- 停一下 · 展开思考 ---------------- */
  $$('.pause').forEach(btn => btn.addEventListener('click', () => {
    const panel = btn.nextElementSibling;
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('open', open);
    btn.textContent = open ? '收起思考' : '停一下 · 展开思考';
    if (open) sound.chime([81, 86], 0.34, 0.7);
  }));

  /* ---------------- 呼吸练习 ---------------- */
  (() => {
    const wrap = $('#breath');
    const btn = $('#breath-btn');
    const cue = $('#breath-cue');
    if (!wrap || !btn) return;
    let timers = [];
    let running = false;
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const set = (cls, text) => {
      wrap.classList.remove('in', 'hold', 'out');
      if (cls) wrap.classList.add(cls);
      cue.textContent = text;
    };
    function reset(text) {
      clear();
      running = false;
      set('', text);
      field && field.setBreath(0);
    }
    btn.addEventListener('click', () => {
      if (running) { reset('跟着光，呼吸一次'); return; }
      running = true;
      set('in', '吸气……');
      field && field.setBreath(1);
      sound.chime([74], 0, 0.6);
      timers.push(setTimeout(() => set('hold', '停一下'), 4000));
      timers.push(setTimeout(() => {
        set('out', '慢慢呼气……');
        field && field.setBreath(0);
        sound.chime([69], 0, 0.5);
      }, 6000));
      timers.push(setTimeout(() => reset('欢迎回到此刻 · 再来一次'), 12000));
    });
  })();

  /* ---------------- 写给此刻的自己 ---------------- */
  (() => {
    const note = $('#note');
    const saved = $('#saved');
    const save = $('#save');
    if (!note || !save) return;
    const KEY = 'life-exploration-note';
    try { note.value = localStorage.getItem(KEY) || ''; } catch (e) { /* 无痕模式 */ }
    save.addEventListener('click', () => {
      try {
        localStorage.setItem(KEY, note.value);
        saved.textContent = note.value.trim() ? '已保存在此设备 · 它会一直在这里' : '已清空';
      } catch (e) {
        saved.textContent = '此浏览器不支持本地保存，可以截图留念';
      }
      if (note.value.trim()) {
        const r = save.getBoundingClientRect();
        field && field.burst(r.left + r.width / 2, r.top);
        sound.chime([74, 78, 81, 86], 0.18, 0.8);
      }
      setTimeout(() => (saved.textContent = ''), 3200);
    });
  })();

  /* ---------------- 抽一句话 ---------------- */
  (() => {
    const LINES = [
      ['生命的意义，也许先藏在很小的地方：一段想继续的关系，一件仍好奇的事。', '01 / 存在'],
      ['“我为何出生”也许没有答案，但“我如何活着”，可以由今天的选择一点一点写出来。', '02 / 起点'],
      ['意义不是一件藏好的东西，而是你一次次认真回应生活后，留下的方向。', '03 / 意义'],
      ['有限不是生命的缺陷。它让注意力变得珍贵。', '04 / 有限'],
      ['你不需要先从痛苦中找到意义，才值得被理解。', '05 / 痛苦'],
      ['有些意义不在远方，而在某个人因为你的存在，少了一点孤单。', '06 / 关系'],
      ['认真生活，不等于每天都要活得非凡。', '07 / 日常'],
      ['在还没有答案的时候，仍愿意认真生活。', '08 / 此刻']
    ];
    const btn = $('#draw');
    const card = $('#card');
    const text = $('#card-text');
    const from = $('#card-from');
    if (!btn || !card) return;
    let last = -1;
    btn.addEventListener('click', () => {
      let i;
      do { i = Math.floor(Math.random() * LINES.length); } while (i === last && LINES.length > 1);
      last = i;
      text.textContent = LINES[i][0];
      from.textContent = '— 生命探索 · ' + LINES[i][1];
      card.hidden = false;
      card.classList.remove('flip');
      void card.offsetWidth;
      card.classList.add('flip');
      btn.textContent = '再抽一句';
      const r = card.getBoundingClientRect();
      field && field.burst(r.left + r.width / 2, r.top + r.height / 2);
      sound.chime(CHIMES[i + 1] || CHIMES[0], 0.2, 0.8);
    });
  })();

  /* ---------------- 分享链接 ---------------- */
  (() => {
    const btn = $('#share');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const url = location.href.split('#')[0];
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
          toast('链接已复制，发给那个你想分享的人吧');
          return;
        }
        throw new Error('no clipboard');
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
        toast(ok ? '链接已复制，发给那个你想分享的人吧' : '长按地址栏即可复制链接');
      }
    });
  })();
})();
