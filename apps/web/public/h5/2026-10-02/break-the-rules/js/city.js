/* 打破陈规 · 3D 郑州夜景 —— 零依赖 Canvas 线框 3D 引擎
   二七塔（联体五边形双塔）、千玺广场「大玉米」、中原福塔、城市楼群、黄河光带、黑胶唱片与文字环。 */
(function () {
  "use strict";

  function City(canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return null;
    var W = 0, H = 0, DPR = 1, focal = 1, bgGrad = null;
    var NEAR = 0.6, FOG = 0.0105, LV = 7;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      focal = (H / 2) / Math.tan(55 * Math.PI / 360);
      bgGrad = ctx.createRadialGradient(W / 2, H * 1.05, 0, W / 2, H * 1.05, Math.max(W, H) * 0.9);
      bgGrad.addColorStop(0, "rgba(215,38,30,0.32)");
      bgGrad.addColorStop(0.5, "rgba(120,20,15,0.10)");
      bgGrad.addColorStop(1, "rgba(11,10,10,0)");
    }
    resize();
    window.addEventListener("resize", resize);

    /* ---------- camera ---------- */
    var cx = 0, cy = 7, cz = 14, tx = 0, ty = 6.5, tz = 0;
    var rx, rz, ux, uy, uz, fx, fy, fz;
    function basis() {
      fx = tx - cx; fy = ty - cy; fz = tz - cz;
      var l = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1; fx /= l; fy /= l; fz /= l;
      rx = -fz; rz = fx; l = Math.sqrt(rx * rx + rz * rz) || 1; rx /= l; rz /= l;
      ux = -rz * fy; uy = rz * fx - rx * fz; uz = rx * fy;
    }
    var P = [0, 0, 0];
    function toCam(x, y, z) {
      var dx = x - cx, dy = y - cy, dz = z - cz;
      P[0] = dx * rx + dz * rz; P[1] = dx * ux + dy * uy + dz * uz; P[2] = dx * fx + dy * fy + dz * fz;
    }

    /* ---------- styles & buckets ---------- */
    var LINE_STYLES = [
      { c: "#d7261e", w: 1, a: 0.5 },                 // 0 grid
      { c: "#cfcbc5", w: 1.2, a: 0.9 },               // 1 stone
      { c: "#ff3a22", w: 1.5, a: 0.95 },              // 2 red edge
      { c: "#7c2a22", w: 1, a: 0.75 },                // 3 building edge
      { c: "#ffc61a", w: 1.6, a: 1, add: true },      // 4 gold
      { c: "#ffb000", w: 1.3, a: 0.6, add: true },    // 5 river
      { c: "#8d8781", w: 1, a: 0.5 }                  // 6 dim grey
    ];
    var DOT_STYLES = [
      { c: "#ffc61a", s: 0.16, a: 0.85 },             // 0 window gold
      { c: "#ffc61a", s: 0.22, a: 1, add: true },     // 1 corn kernel
      { c: "#ffd34d", s: 0.10, a: 0.8, add: true },   // 2 dust
      { c: "#ff3a22", s: 0.14, a: 0.85, add: true },  // 3 ember
      { c: "#d7261e", s: 0.16, a: 0.8 }               // 4 window red
    ];
    function mk(n) { var b = []; for (var i = 0; i < n; i++) { var l = []; for (var j = 0; j < LV; j++) l.push([]); b.push(l); } return b; }
    var LB = mk(LINE_STYLES.length), DB = mk(DOT_STYLES.length);
    var lineMul = [1, 1, 1, 1, 1, 1, 1], dotMul = [1, 1, 1, 1, 1];

    function seg(st, ax, ay, az, bx, by, bz) {
      toCam(ax, ay, az); var x1 = P[0], y1 = P[1], z1 = P[2];
      toCam(bx, by, bz); var x2 = P[0], y2 = P[1], z2 = P[2];
      if (z1 < NEAR && z2 < NEAR) return;
      var t;
      if (z1 < NEAR) { t = (NEAR - z1) / (z2 - z1); x1 += (x2 - x1) * t; y1 += (y2 - y1) * t; z1 = NEAR; }
      else if (z2 < NEAR) { t = (NEAR - z2) / (z1 - z2); x2 += (x1 - x2) * t; y2 += (y1 - y2) * t; z2 = NEAR; }
      var a = Math.exp(-FOG * (z1 + z2) * 0.5);
      if (a < 0.05) return;
      var lv = Math.min(LV - 1, (a * LV) | 0);
      LB[st][lv].push(W / 2 + x1 / z1 * focal, H / 2 - y1 / z1 * focal, W / 2 + x2 / z2 * focal, H / 2 - y2 / z2 * focal);
    }
    function dot(st, x, y, z) {
      toCam(x, y, z); if (P[2] < NEAR) return;
      var a = Math.exp(-FOG * P[2]); if (a < 0.05) return;
      var s = DOT_STYLES[st].s * focal / P[2]; if (s < 0.7) s = 0.7; else if (s > 7) s = 7;
      var lv = Math.min(LV - 1, (a * LV) | 0);
      DB[st][lv].push(W / 2 + P[0] / P[2] * focal - s / 2, H / 2 - P[1] / P[2] * focal - s / 2, s);
    }
    function flush() {
      var i, j, k, arr, st;
      for (i = 0; i < LB.length; i++) {
        st = LINE_STYLES[i]; ctx.strokeStyle = st.c; ctx.lineWidth = st.w;
        ctx.globalCompositeOperation = st.add ? "lighter" : "source-over";
        for (j = 0; j < LV; j++) {
          arr = LB[i][j]; if (!arr.length) continue;
          ctx.globalAlpha = Math.min(1, st.a * lineMul[i] * (j + 1) / LV);
          ctx.beginPath();
          for (k = 0; k < arr.length; k += 4) { ctx.moveTo(arr[k], arr[k + 1]); ctx.lineTo(arr[k + 2], arr[k + 3]); }
          ctx.stroke(); arr.length = 0;
        }
      }
      for (i = 0; i < DB.length; i++) {
        st = DOT_STYLES[i]; ctx.fillStyle = st.c;
        ctx.globalCompositeOperation = st.add ? "lighter" : "source-over";
        for (j = 0; j < LV; j++) {
          arr = DB[i][j]; if (!arr.length) continue;
          ctx.globalAlpha = Math.min(1, st.a * dotMul[i] * (j + 1) / LV);
          ctx.beginPath();
          for (k = 0; k < arr.length; k += 3) ctx.rect(arr[k], arr[k + 1], arr[k + 2], arr[k + 2]);
          ctx.fill(); arr.length = 0;
        }
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }

    /* ---------- static geometry ---------- */
    var S = [];  // static segments: [style, ax, ay, az, bx, by, bz]
    var D = [];  // static dots: [style, x, y, z]
    function L(st, a, b) { S.push(st, a[0], a[1], a[2], b[0], b[1], b[2]); }
    function ring(st, ox, oy, oz, r, n, rot, yy) {
      var pts = [];
      for (var i = 0; i < n; i++) { var a = rot + i / n * Math.PI * 2; pts.push([ox + Math.sin(a) * r, oy + yy, oz + Math.cos(a) * r]); }
      for (i = 0; i < n; i++) L(st, pts[i], pts[(i + 1) % n]);
      return pts;
    }
    var rnd = function (a, b) { return a + Math.random() * (b - a); };

    // dance-floor grid
    var x, z, i, j;
    for (x = -120; x <= 120; x += 8) for (z = -140; z < 40; z += 10) L(0, [x, 0, z], [x, 0, z + 10]);
    for (z = -140; z <= 40; z += 8) for (x = -120; x < 120; x += 10) L(0, [x, 0, z], [x + 10, 0, z]);

    // 二七塔 Erqi tower
    (function () {
      var ox = -16, oz = -26;
      var b0 = ring(6, ox, 0, oz, 5.8, 10, 0, 0), b1 = ring(1, ox, 0, oz, 5.6, 10, 0, 1.8);
      for (i = 0; i < 10; i++) L(6, b0[i], b1[i]);
      var y = 1.8, r, h = 1.45;
      for (var lvl = 0; lvl < 11; lvl++) {
        r = 2.5 - lvl * 0.07;
        [-1.2, 1.2].forEach(function (sx) {
          var rot = sx < 0 ? Math.PI / 5 : 0;
          var lo = ring(1, ox + sx, 0, oz, r, 5, rot, y), hi = ring(1, ox + sx, 0, oz, r, 5, rot, y + h);
          for (var k = 0; k < 5; k++) L(1, lo[k], hi[k]);
          ring(2, ox + sx, 0, oz, r + 0.55, 5, rot, y + h + 0.12);
        });
        y += h + 0.26;
      }
      [-1.2, 1.2].forEach(function (sx) {
        var rot = sx < 0 ? Math.PI / 5 : 0, base = ring(2, ox + sx, 0, oz, 1.5, 5, rot, y);
        for (var k = 0; k < 5; k++) L(2, base[k], [ox + sx, y + 2.6, oz]);
      });
      L(4, [ox, y + 1, oz], [ox, y + 4.4, oz]);
      var sy = y + 5.2, s = 0.8;
      var star = [[ox, sy + s, oz], [ox + s, sy, oz], [ox, sy - s, oz], [ox - s, sy, oz]];
      for (i = 0; i < 4; i++) L(4, star[i], star[(i + 1) % 4]);
      L(4, [ox, sy, oz - s], [ox, sy, oz + s]);
      // clock face on the front
      var cp = [];
      for (i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2; cp.push([ox + Math.cos(a) * 0.8, 13.5 + Math.sin(a) * 0.8, oz + 2.6]); }
      for (i = 0; i < 16; i++) L(4, cp[i], cp[(i + 1) % 16]);
    })();

    // 千玺广场「大玉米」 corn tower
    var KERNELS = [];
    (function () {
      var ox = 17, oz = -32, CH = 30, n = 14;
      function rad(y) { return 3.55 + 0.35 * Math.sin(Math.PI * y / CH) - 0.22 * (y / CH); }
      for (i = 0; i < n; i++) {
        var a = i / n * Math.PI * 2;
        for (var y = 0; y < CH; y += 3) L(6, [ox + Math.sin(a) * rad(y), y, oz + Math.cos(a) * rad(y)], [ox + Math.sin(a) * rad(y + 3), y + 3, oz + Math.cos(a) * rad(y + 3)]);
        L(1, [ox + Math.sin(a) * rad(CH), CH, oz + Math.cos(a) * rad(CH)], [ox, CH + 5.5, oz]);
      }
      ring(1, ox, 0, oz, rad(CH), 28, 0, CH);
      L(4, [ox, CH + 5.5, oz], [ox, CH + 11, oz]);
      for (var r = 0; r < 40; r++) {
        var yy = 1 + r * (CH - 1.5) / 40;
        for (j = 0; j < 26; j++) {
          var aa = j / 26 * Math.PI * 2 + (r % 2) * Math.PI / 26, rr = rad(yy) + 0.1;
          KERNELS.push(ox + Math.sin(aa) * rr, yy, oz + Math.cos(aa) * rr);
        }
      }
    })();

    // 中原福塔 TV tower
    (function () {
      var ox = 48, oz = -78;
      for (i = 0; i < 8; i++) {
        var a = i / 8 * Math.PI * 2;
        L(1, [ox + Math.sin(a) * 2.6, 0, oz + Math.cos(a) * 2.6], [ox + Math.sin(a) * 1, 58, oz + Math.cos(a) * 1]);
      }
      var p1 = ring(2, ox, 0, oz, 4.6, 12, 0, 42), p0 = ring(2, ox, 0, oz, 3.2, 12, 0, 38);
      for (i = 0; i < 12; i++) L(2, p0[i], p1[i]);
      ring(1, ox, 0, oz, 3.6, 12, 0, 44); ring(1, ox, 0, oz, 3.0, 12, 0, 42);
      L(1, [ox, 58, oz], [ox, 76, oz]);
    })();

    // city blocks + windows
    for (i = 0; i < 80; i++) {
      var bx, bz;
      if (i < 55) { bx = rnd(-120, 120); bz = rnd(-50, -130); }
      else { bx = (Math.random() < 0.5 ? -1 : 1) * rnd(36, 90); bz = rnd(-40, 20); }
      if (Math.abs(bx - 48) < 8 && Math.abs(bz + 78) < 8) continue;
      var w = rnd(4, 10) / 2, d = rnd(4, 10) / 2, h = rnd(8, i % 9 === 0 ? 46 : 28);
      var c = [[bx - w, 0, bz - d], [bx + w, 0, bz - d], [bx + w, 0, bz + d], [bx - w, 0, bz + d]];
      var t = c.map(function (p) { return [p[0], h, p[2]]; });
      for (j = 0; j < 4; j++) { L(3, c[j], c[(j + 1) % 4]); L(3, t[j], t[(j + 1) % 4]); L(3, c[j], t[j]); }
      var cols = Math.max(2, Math.floor(w * 2 / 1.6)), rows = Math.floor(h / 2.2);
      for (var cc = 0; cc < cols; cc++) for (var rr = 1; rr < rows; rr++) {
        var q = Math.random();
        if (q < 0.26) D.push(q < 0.05 ? 4 : 0, bx - w + (cc + 0.5) * (w * 2 / cols), rr * 2.2, bz + d + 0.05);
      }
    }

    // particles
    function cloud(n, spread) { var a = new Float32Array(n * 3); for (var k = 0; k < n; k++) { a[k * 3] = rnd(-spread, spread); a[k * 3 + 1] = rnd(0, 60); a[k * 3 + 2] = rnd(-spread, spread * 0.4); } return a; }
    var dust = cloud(520, 90), embers = cloud(260, 70);

    /* ---------- camera path ---------- */
    var CAM = [[0, 7, 14], [-4, 10, 24], [-26, 15, -4], [-6, 12, -6], [6, 8, -6], [34, 5, 4], [0, 46, 46]];
    var LOOK = [[0, 6.5, 0], [0, 7, -14], [-16, 13, -26], [-12, 12, -28], [17, 17, -32], [-20, 3, -10], [0, 0, -34]];
    function cr(pts, p) {
      var n = pts.length - 1, s = Math.min(n - 1e-6, Math.max(0, p * n)), k = Math.floor(s), t = s - k;
      var p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(n, k + 2)], o = [];
      for (var e = 0; e < 3; e++) {
        o[e] = 0.5 * (2 * p1[e] + (-p0[e] + p2[e]) * t + (2 * p0[e] - 5 * p1[e] + 4 * p2[e] - p3[e]) * t * t + (-p0[e] + 3 * p1[e] - 3 * p2[e] + p3[e]) * t * t * t);
      }
      return o;
    }
    var camS = [0, 7, 14], lookS = [0, 6.5, 0], px = 0, py = 0;
    window.addEventListener("pointermove", function (e) { px = e.clientX / W - 0.5; py = e.clientY / H - 0.5; }, { passive: true });

    /* ---------- hub: vinyl + text rings ---------- */
    var RING1 = " BREAK THE RULES ✦ 打破陈规 ✦ ZHENGZHOU ✦ 0371 ✦".split("");
    var RING2 = " HIPHOP ✦ SINCE 2022 ✦ KEEP THE LOVE ✦ 二七塔 ✦ 黄河 ✦".split("");
    var spin = 0, r1 = 0, r2 = 0, HUBA = 1;
    var TILT = 1.15, sT = Math.sin(TILT), cT = Math.cos(TILT);

    function hubPoint(hx, hy, hz, phi, lx, ly, lz, out) {
      // rotate local point around Y by phi, translate to hub
      var c = Math.cos(phi), s = Math.sin(phi);
      out[0] = hx + lx * c + lz * s; out[1] = hy + ly; out[2] = hz - lx * s + lz * c;
    }
    var tmp = [0, 0, 0];
    function project(x, y, z) { toCam(x, y, z); if (P[2] < NEAR) return null; return [W / 2 + P[0] / P[2] * focal, H / 2 - P[1] / P[2] * focal, P[2]]; }

    function drawDisk(hx, hy, hz, phi, R, fill, stroke, lw, alpha) {
      ctx.beginPath(); var ok = true;
      for (var k = 0; k <= 48; k++) {
        var a = k / 48 * Math.PI * 2, lx = Math.cos(a) * R, ld = Math.sin(a) * R;
        hubPoint(hx, hy, hz, phi, lx, -sT * ld, cT * ld, tmp);
        var q = project(tmp[0], tmp[1], tmp[2]); if (!q) { ok = false; break; }
        if (k === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
      }
      if (!ok) return;
      ctx.globalAlpha = alpha * HUBA;
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    function drawArc(hx, hy, hz, phi, R, a0, a1, color, lw) {
      ctx.beginPath();
      for (var k = 0; k <= 12; k++) {
        var a = a0 + (a1 - a0) * k / 12, lx = Math.cos(a) * R, ld = Math.sin(a) * R;
        hubPoint(hx, hy, hz, phi, lx, -sT * ld, cT * ld, tmp);
        var q = project(tmp[0], tmp[1], tmp[2]); if (!q) return;
        if (k === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
      }
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke();
    }
    function drawRing(chars, hx, hy, hz, phi, R, tilt, rot, color, size, cz0) {
      var n = chars.length, ct = Math.cos(tilt), st = Math.sin(tilt);
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = color;
      for (var k = 0; k < n; k++) {
        var a = rot + k / n * Math.PI * 2, lx = Math.sin(a) * R, lz = Math.cos(a) * R;
        // tilt around Z axis
        var tx2 = lx * ct, ty2 = lx * st;
        hubPoint(hx, hy, hz, phi, tx2, ty2, lz, tmp);
        var q = project(tmp[0], tmp[1], tmp[2]); if (!q) continue;
        var front = q[2] < cz0;
        var fs = size * focal / q[2]; if (fs < 5) continue;
        ctx.globalAlpha = (front ? 1 : 0.22) * HUBA;
        ctx.font = "900 " + fs.toFixed(1) + 'px "BTR Display","BTR Hei","PingFang SC",sans-serif';
        ctx.fillText(chars[k], q[0], q[1]);
      }
      ctx.globalAlpha = 1;
    }

    function frame(t, prog, lv) {
      var bass = lv ? lv.bass : (0.12 + 0.08 * Math.sin(t * 5.7)) * 0.6;
      var high = lv ? lv.high : 0.1;
      var p = Math.min(1, Math.max(0, prog));
      var cT2 = cr(CAM, p), lT = cr(LOOK, p);
      for (var e = 0; e < 3; e++) { camS[e] += (cT2[e] - camS[e]) * 0.06; lookS[e] += (lT[e] - lookS[e]) * 0.06; }
      var k = W / H < 1 ? 1 + (1 - W / H) * 0.9 : 1;
      tx = lookS[0]; ty = lookS[1]; tz = lookS[2];
      cx = tx + (camS[0] - tx) * k + px * 3; cy = ty + (camS[1] - ty) * k - py * 2; cz = tz + (camS[2] - tz) * k;
      basis();

      // background
      ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
      ctx.fillStyle = "#0b0a0a"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

      lineMul[0] = 0.75 + bass * 0.9;
      dotMul[1] = 0.45 + bass * 1.6;
      var i;
      for (i = 0; i < S.length; i += 7) seg(S[i], S[i + 1], S[i + 2], S[i + 3], S[i + 4], S[i + 5], S[i + 6]);
      for (i = 0; i < D.length; i += 4) dot(D[i], D[i + 1], D[i + 2], D[i + 3]);
      for (i = 0; i < KERNELS.length; i += 3) dot(1, KERNELS[i], KERNELS[i + 1], KERNELS[i + 2]);

      // Fu tower beacon
      if (Math.sin(t * 3) > 0) { dot(3, 48, 76.5, -78); dot(3, 48, 76.8, -78); }

      // Yellow River ribbon
      var o, xx, prevX, prevY, prevZ;
      function rz2(x2) { return -9 + Math.sin(x2 * 0.024) * 11; }
      for (o = -4; o <= 4; o += 2) {
        prevX = null;
        for (xx = -160; xx <= 160; xx += 4) {
          var yy = 0.25 + Math.sin(xx * 0.12 - t * 1.6) * 0.22 + Math.cos(o * 0.9 + t * 1.1) * 0.1 + bass * 0.4;
          var zz = rz2(xx) + o;
          if (prevX !== null) seg(5, prevX, prevY, prevZ, xx, yy, zz);
          if (o < 4 && ((xx / 4) | 0) % 2 === 0) {
            var y2 = 0.25 + Math.sin(xx * 0.12 - t * 1.6) * 0.22 + Math.cos((o + 2) * 0.9 + t * 1.1) * 0.1 + bass * 0.4;
            seg(5, xx, yy, zz, xx, y2, zz + 2);
          }
          prevX = xx; prevY = yy; prevZ = zz;
        }
      }

      // particles drifting up
      for (i = 0; i < dust.length; i += 3) { dust[i + 1] += 0.015 + high * 0.08; if (dust[i + 1] > 60) dust[i + 1] = 0; dot(2, dust[i], dust[i + 1], dust[i + 2]); }
      for (i = 0; i < embers.length; i += 3) { embers[i + 1] += 0.04 + high * 0.08; if (embers[i + 1] > 60) embers[i + 1] = 0; dot(3, embers[i], embers[i + 1], embers[i + 2]); }

      flush();

      // hub (vinyl) drawn on top
      var hy = 6.5 + Math.sin(t * 1.2) * 0.35, phi = Math.sin(t * 0.3) * 0.25, sc = 1 + bass * 0.12;
      spin += 0.012 + bass * 0.02; r1 += 0.006; r2 -= 0.004;
      toCam(0, hy, 0); var hubZ = P[2];
      var hubA = Math.max(p < 0.12 ? 1 : Math.max(0, 1 - (p - 0.12) * 6), p > 0.86 ? Math.min(1, (p - 0.86) * 7) : 0);
      if (hubZ > NEAR && hubA > 0.01) {
        HUBA = hubA;
        drawRing(RING2, 0, hy, 0, phi, 7.4, -0.22, r2, "#ff3a22", 0.95, hubZ);
        drawDisk(0, hy, 0, phi, 4.2 * sc, "#111010", "#cfcbc5", 1.2, 1);
        for (var g = 3.8; g > 1.6; g -= 0.45) drawDisk(0, hy, 0, phi, g * sc, null, "#3a3634", 1, 0.9);
        ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = HUBA;
        drawArc(0, hy, 0, phi, 3.3 * sc, spin, spin + 0.9, "#ffc61a", 2);
        drawArc(0, hy, 0, phi, 2.6 * sc, spin + 3.1, spin + 3.7, "#ffc61a", 1.5);
        ctx.globalCompositeOperation = "source-over";
        drawDisk(0, hy, 0, phi, 1.45 * sc, "#d7261e", "#ffc61a", 2.5, 1);
        var cq = project(0, hy, 0);
        ctx.globalAlpha = HUBA;
        if (cq) {
          var fs = 0.62 * sc * focal / cq[2];
          ctx.fillStyle = "#f6f2ec"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.font = "900 " + fs.toFixed(1) + 'px "BTR Hei","PingFang SC",sans-serif';
          ctx.fillText("打破陈规", cq[0], cq[1] - fs * 0.15);
          ctx.fillStyle = "#ffc61a";
          ctx.font = "900 " + (fs * 0.38).toFixed(1) + 'px "BTR Display",sans-serif';
          ctx.fillText("BREAK THE RULES", cq[0], cq[1] + fs * 0.6);
        }
        drawRing(RING1, 0, hy, 0, phi, 6.2, 0.28, r1, "#ffc61a", 0.9, hubZ);
        ctx.globalAlpha = 1;
      }
    }
    return { frame: frame };
  }
  window.City = City;
})();
