/* 104 GROUP · 轻量 WebGL 引擎（无第三方依赖） */
(function (W) {
  'use strict';
  /* ---------- 矩阵 ---------- */
  var M = {
    id: function () { var m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
    mul: function (a, b) {
      var o = new Float32Array(16);
      for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
      return o;
    },
    chain: function () { var m = arguments[0]; for (var i = 1; i < arguments.length; i++) m = M.mul(m, arguments[i]); return m; },
    persp: function (fov, asp, n, f) {
      var t = 1 / Math.tan(fov / 2), m = new Float32Array(16);
      m[0] = t / asp; m[5] = t; m[10] = (f + n) / (n - f); m[11] = -1; m[14] = 2 * f * n / (n - f); return m;
    },
    look: function (e, c, u) {
      var z = norm([e[0] - c[0], e[1] - c[1], e[2] - c[2]]), x = norm(cross(u, z)), y = cross(z, x), m = M.id();
      m[0] = x[0]; m[4] = x[1]; m[8] = x[2]; m[1] = y[0]; m[5] = y[1]; m[9] = y[2]; m[2] = z[0]; m[6] = z[1]; m[10] = z[2];
      m[12] = -dot(x, e); m[13] = -dot(y, e); m[14] = -dot(z, e); return m;
    },
    T: function (x, y, z) { var m = M.id(); m[12] = x; m[13] = y; m[14] = z; return m; },
    S: function (x, y, z) { var m = M.id(); m[0] = x; m[5] = y === undefined ? x : y; m[10] = z === undefined ? x : z; return m; },
    RX: function (a) { var m = M.id(), c = Math.cos(a), s = Math.sin(a); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; },
    RY: function (a) { var m = M.id(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; },
    RZ: function (a) { var m = M.id(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; },
    xf: function (m, v) { var x = v[0], y = v[1], z = v[2], w = v.length > 3 ? v[3] : 1;
      return [m[0] * x + m[4] * y + m[8] * z + m[12] * w, m[1] * x + m[5] * y + m[9] * z + m[13] * w, m[2] * x + m[6] * y + m[10] * z + m[14] * w, m[3] * x + m[7] * y + m[11] * z + m[15] * w]; }
  };
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

  /* ---------- 着色器 ---------- */
  var VS = [
    'attribute vec3 aP;attribute vec3 aN;attribute vec2 aU;',
    'uniform mat4 uM,uV,uPr;varying vec3 vN,vP,vL;varying vec2 vU;',
    'void main(){vec4 w=uM*vec4(aP,1.);vP=w.xyz;vL=aP;vU=aU;vN=mat3(uM)*aN;gl_Position=uPr*uV*w;}'
  ].join('\n');
  var FS = [
    'precision highp float;',
    'varying vec3 vN,vP,vL;varying vec2 vU;',
    'uniform vec3 uC,uE,uEye;uniform float uMet,uOp,uT,uUT,uUT2,uRev,uLit;uniform int uMode;',
    'uniform sampler2D uTx,uTx2;uniform vec4 uPR,uPR2;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float knit(vec2 q){vec2 c=vec2(q.x,q.y+abs(fract(q.x)-.5)*.9);float v=abs(fract(c.y)-.5);return smoothstep(.05,.42,v);}',
    'void main(){',
    ' vec3 base=uC;float a=uOp;',
    ' if(uMode==1){base*=.72+.32*knit(vec2(vU.x*150.,vU.y*46.*uRev+uT));}',
    ' else if(uMode==2){float s=.85+.15*sin(vL.y*900.+sin(vU.x*40.)*2.);base*=s;if(vU.y>.9)base=vec3(1.,.35,.12);}',
    ' else if(uMode==3){base*=.55+.45*step(.35,fract(vU.x*180.));}',
    ' else if(uMode==4){',
    '  base*=.86+.18*knit(vec2(vL.x*95.,vL.y*70.));',
    '  vec2 q1=(vL.xy-uPR.xy)/abs(uPR.zw);float s1=sign(uPR.z);',
    '  if(s1<0.)q1.x=1.-q1.x;',
    '  if(uUT>.5&&vL.z*s1>0.&&q1.x>0.&&q1.x<1.&&q1.y>0.&&q1.y<1.&&q1.y>1.-uRev){vec4 t=texture2D(uTx,q1);base=mix(base,t.rgb*.95,t.a);}',
    '  vec2 q2=(vL.xy-uPR2.xy)/abs(uPR2.zw);float s2=sign(uPR2.z);',
    '  if(s2<0.)q2.x=1.-q2.x;',
    '  if(uUT2>.5&&vL.z*s2>0.&&q2.x>0.&&q2.x<1.&&q2.y>0.&&q2.y<1.){vec4 t=texture2D(uTx2,q2);base=mix(base,t.rgb,t.a);}',
    ' }',
    ' else if(uMode==5){vec4 t=texture2D(uTx,vU);base=t.rgb;a*=t.a;}',
    ' else if(uMode==6){vec2 g=vU*46.;vec2 f=fract(g)-.5;float r=.16+.12*h(floor(g));a*=smoothstep(r,r-.08,length(f+.2*(vec2(h(floor(g)+3.),h(floor(g)+7.))-.5)));base=vec3(.95);}',
    ' else if(uMode==7){float sh=smoothstep(.0,.05,abs(fract(vU.x*.8+vU.y*.6-uT*.05)-.5)-.38);a*=.12+.25*(1.-sh);base=vec3(1.);}',
    ' else if(uMode==9){float d=length(vU-.5)*2.;a*=pow(max(1.-d,0.),2.2);}',
    ' vec3 col=base;',
    ' if(uLit>.5){',
    '  vec3 N=normalize(vN);vec3 V=normalize(uEye-vP);if(dot(N,V)<0.)N=-N;',
    '  vec3 L1=normalize(vec3(.45,.85,.55));vec3 L2=normalize(vec3(-.8,.15,-.55));',
    '  float d1=max(dot(N,L1),0.),d2=max(dot(N,L2),0.);',
    '  vec3 H=normalize(L1+V);float sp=pow(max(dot(N,H),0.),mix(18.,90.,uMet));',
    '  float fr=pow(1.-max(dot(N,V),0.),3.);',
    '  vec3 R=reflect(-V,N);',
    '  vec3 env=mix(vec3(.03),vec3(1.),smoothstep(-.05,.22,R.y))*(1.-.75*smoothstep(.35,.95,R.y))+vec3(1.,.38,.12)*smoothstep(.4,1.,-R.x)*.7+vec3(.9)*smoothstep(.85,1.,R.z)*.4;',
    '  vec3 dif=base*(.24+.9*d1)+base*vec3(1.,.42,.18)*d2*.55+vec3(.9)*sp*.18;',
    '  vec3 met=base*env*1.25+vec3(1.)*sp*1.4;',
    '  col=mix(dif,met,uMet)+mix(vec3(.75,.78,.85),vec3(1.,.4,.15),.5+.5*N.x)*fr*.42;',
    ' }',
    ' col+=uE;',
    ' gl_FragColor=vec4(col,a);',
    '}'
  ].join('\n');
  var PVS = [
    'attribute vec4 aP;uniform mat4 uV,uPr;uniform float uT,uS;varying float vA;varying float vK;',
    'void main(){vec3 p=aP.xyz;float s=aP.w;p.y=mod(p.y+uT*(.05+.12*s)+3.,6.)-3.;p.x+=sin(uT*.4+s*20.)*.25;p.z+=cos(uT*.3+s*13.)*.25;',
    'vec4 mv=uV*vec4(p,1.);gl_Position=uPr*mv;gl_PointSize=uS*(1.+s*2.)/max(-mv.z,.1);vA=.25+.55*fract(s*7.3);vK=step(.86,fract(s*3.7));}'
  ].join('\n');
  var PFS = 'precision mediump float;varying float vA,vK;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d)*vA;gl_FragColor=vec4(mix(vec3(1.,.97,.9),vec3(1.,.42,.15),vK),a);}';

  function R(canvas) {
    var gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' }) ||
      canvas.getContext('experimental-webgl');
    if (!gl) return null;
    this.gl = gl; this.c = canvas;
    this.p = prog(gl, VS, FS); this.pp = prog(gl, PVS, PFS);
    var p = this.p; this.u = {};
    ['uM', 'uV', 'uPr', 'uC', 'uE', 'uEye', 'uMet', 'uOp', 'uT', 'uUT', 'uUT2', 'uRev', 'uLit', 'uMode', 'uTx', 'uTx2', 'uPR', 'uPR2'].forEach(function (n) { this.u[n] = gl.getUniformLocation(p, n); }, this);
    this.a = { P: gl.getAttribLocation(p, 'aP'), N: gl.getAttribLocation(p, 'aN'), U: gl.getAttribLocation(p, 'aU') };
    this.pu = {}; ['uV', 'uPr', 'uT', 'uS'].forEach(function (n) { this.pu[n] = gl.getUniformLocation(this.pp, n); }, this);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    this.white = this.tex(null);
  }
  function prog(gl, v, f) {
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
    var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, v)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p;
  }
  R.prototype.mesh = function (d, mode) {
    var gl = this.gl, m = { mode: mode === undefined ? gl.TRIANGLES : mode };
    function buf(arr, tgt) { var b = gl.createBuffer(); gl.bindBuffer(tgt || gl.ARRAY_BUFFER, b); gl.bufferData(tgt || gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW); return b; }
    m.p = buf(new Float32Array(d.p)); m.n = buf(new Float32Array(d.n || new Array(d.p.length).fill(0)));
    m.u = buf(new Float32Array(d.u || new Array(d.p.length / 3 * 2).fill(0)));
    if (d.i) { m.i = buf(new Uint16Array(d.i), gl.ELEMENT_ARRAY_BUFFER); m.cnt = d.i.length; } else m.cnt = d.p.length / 3;
    return m;
  };
  R.prototype.tex = function (img) {
    var gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    if (img) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  R.prototype.loadTex = function (src) {
    var self = this, o = { t: null, ok: false }, im = new Image();
    im.onload = function () { o.t = self.tex(im); o.ok = true; o.w = im.width; o.h = im.height; };
    im.src = src; return o;
  };
  /* 视口（以 CSS 像素矩形，canvas 覆盖整个视窗） */
  R.prototype.view = function (rect, dpr) {
    var gl = this.gl, H = this.c.height;
    var x = Math.round(rect.left * dpr), y = Math.round(H - rect.bottom * dpr), w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
    gl.viewport(x, y, w, h); gl.scissor(x, y, w, h); gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.asp = rect.width / rect.height;
  };
  R.prototype.cam = function (eye, tgt, fov) {
    this.V = M.look(eye, tgt, [0, 1, 0]); this.P = M.persp(fov || 0.7, this.asp, 0.05, 80); this.eye = eye;
  };
  R.prototype.draw = function (m, o) {
    var gl = this.gl, u = this.u, a = this.a; gl.useProgram(this.p);
    gl.uniformMatrix4fv(u.uM, false, o.M || M.id()); gl.uniformMatrix4fv(u.uV, false, this.V); gl.uniformMatrix4fv(u.uPr, false, this.P);
    gl.uniform3fv(u.uC, o.c || [1, 1, 1]); gl.uniform3fv(u.uE, o.e || [0, 0, 0]); gl.uniform3fv(u.uEye, this.eye);
    gl.uniform1f(u.uMet, o.met || 0); gl.uniform1f(u.uOp, o.op === undefined ? 1 : o.op); gl.uniform1f(u.uT, o.t || 0);
    gl.uniform1f(u.uLit, o.lit === false ? 0 : 1); gl.uniform1i(u.uMode, o.mode || 0); gl.uniform1f(u.uRev, o.rev === undefined ? 1 : o.rev);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, (o.tx && o.tx.ok) ? o.tx.t : this.white); gl.uniform1i(u.uTx, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, (o.tx2 && o.tx2.ok) ? o.tx2.t : this.white); gl.uniform1i(u.uTx2, 1);
    gl.uniform1f(u.uUT, o.tx && o.tx.ok ? 1 : 0); gl.uniform1f(u.uUT2, o.tx2 && o.tx2.ok ? 1 : 0);
    gl.uniform4fv(u.uPR, o.pr || [0, 0, 1, 1]); gl.uniform4fv(u.uPR2, o.pr2 || [0, 0, 1, 1]);
    gl.depthMask(o.op === undefined || o.op >= 1 ? !o.noDepth : false);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.p); gl.enableVertexAttribArray(a.P); gl.vertexAttribPointer(a.P, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.n); gl.enableVertexAttribArray(a.N); gl.vertexAttribPointer(a.N, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.u); gl.enableVertexAttribArray(a.U); gl.vertexAttribPointer(a.U, 2, gl.FLOAT, false, 0, 0);
    if (m.i) { gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.i); gl.drawElements(m.mode, m.cnt, gl.UNSIGNED_SHORT, 0); }
    else gl.drawArrays(m.mode, 0, m.cnt);
    gl.depthMask(true);
  };
  R.prototype.points = function (pts, n, t, size) {
    var gl = this.gl; gl.useProgram(this.pp);
    if (!pts.b) { pts.b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pts.b); gl.bufferData(gl.ARRAY_BUFFER, pts.d, gl.STATIC_DRAW); pts.loc = gl.getAttribLocation(this.pp, 'aP'); }
    gl.uniformMatrix4fv(this.pu.uV, false, this.V); gl.uniformMatrix4fv(this.pu.uPr, false, this.P);
    gl.uniform1f(this.pu.uT, t); gl.uniform1f(this.pu.uS, size);
    gl.bindBuffer(gl.ARRAY_BUFFER, pts.b); gl.enableVertexAttribArray(pts.loc); gl.vertexAttribPointer(pts.loc, 4, gl.FLOAT, false, 0, 0);
    gl.disableVertexAttribArray(this.a.N); gl.disableVertexAttribArray(this.a.U);
    gl.depthMask(false); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.drawArrays(gl.POINTS, 0, n);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(true);
  };
  R.prototype.project = function (Mm, p, rect) {
    var c = M.xf(M.chain(this.P, this.V, Mm), p);
    return { x: rect.width * (c[0] / c[3] * 0.5 + 0.5), y: rect.height * (0.5 - c[1] / c[3] * 0.5), z: c[2] / c[3] };
  };

  /* ---------- 几何 ---------- */
  var Geo = {};
  Geo.cyl = function (rt, rb, h, seg, cap, open) {
    var p = [], n = [], u = [], i = [], k, a, c, s, sl = (rb - rt) / h;
    for (k = 0; k <= seg; k++) {
      a = k / seg * Math.PI * 2; c = Math.cos(a); s = Math.sin(a);
      var nn = norm([c, sl, s]);
      p.push(rt * c, h / 2, rt * s, rb * c, -h / 2, rb * s); n.push(nn[0], nn[1], nn[2], nn[0], nn[1], nn[2]); u.push(k / seg, 1, k / seg, 0);
    }
    for (k = 0; k < seg; k++) { var b = k * 2; i.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
    if (cap !== false && !open) [[h / 2, rt, 1], [-h / 2, rb, -1]].forEach(function (cc) {
      var o = p.length / 3; p.push(0, cc[0], 0); n.push(0, cc[2], 0); u.push(.5, .5);
      for (var q = 0; q <= seg; q++) { var aa = q / seg * Math.PI * 2; p.push(cc[1] * Math.cos(aa), cc[0], cc[1] * Math.sin(aa)); n.push(0, cc[2], 0); u.push(.5 + .5 * Math.cos(aa), .5 + .5 * Math.sin(aa)); }
      for (q = 0; q < seg; q++) i.push(o, o + 1 + q, o + 2 + q);
    });
    return { p: p, n: n, u: u, i: i };
  };
  Geo.torus = function (R_, r, seg, ts) {
    var p = [], n = [], u = [], i = [];
    for (var a = 0; a <= seg; a++) for (var b = 0; b <= ts; b++) {
      var A = a / seg * Math.PI * 2, B = b / ts * Math.PI * 2, cx = Math.cos(A), sx = Math.sin(A);
      p.push((R_ + r * Math.cos(B)) * cx, r * Math.sin(B), (R_ + r * Math.cos(B)) * sx); n.push(Math.cos(B) * cx, Math.sin(B), Math.cos(B) * sx); u.push(a / seg, b / ts);
    }
    for (a = 0; a < seg; a++) for (b = 0; b < ts; b++) { var q = a * (ts + 1) + b, w = q + ts + 1; i.push(q, w, q + 1, q + 1, w, w + 1); }
    return { p: p, n: n, u: u, i: i };
  };
  Geo.box = function (x, y, z) {
    var p = [], n = [], u = [], i = [], F = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    F.forEach(function (f) {
      var a = f[0] ? [0, 1, 0] : [1, 0, 0], b = cross(f, a), o = p.length / 3;
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (s) {
        var v = [f[0] + a[0] * s[0] + b[0] * s[1], f[1] + a[1] * s[0] + b[1] * s[1], f[2] + a[2] * s[0] + b[2] * s[1]];
        p.push(v[0] * x / 2, v[1] * y / 2, v[2] * z / 2); n.push(f[0], f[1], f[2]); u.push((s[0] + 1) / 2, (s[1] + 1) / 2);
      });
      i.push(o, o + 1, o + 2, o, o + 2, o + 3);
    });
    return { p: p, n: n, u: u, i: i };
  };
  Geo.plane = function (w, d) {
    return { p: [-w / 2, 0, d / 2, w / 2, 0, d / 2, w / 2, 0, -d / 2, -w / 2, 0, -d / 2], n: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], u: [0, 0, 1, 0, 1, 1, 0, 1], i: [0, 1, 2, 0, 2, 3] };
  };
  /* BOXFIT T 恤：轮廓 + 充气曲面 */
  Geo.tee = function () {
    var R_ = [[0, .86], [.1, .875], [.18, .915], [.25, .985], [.42, .96], [.6, .915], [.7, .885], [.86, .78], [1.0, .655], [1.13, .52], [1.135, .49],
      [1.04, .31], [.98, .255], [.84, .33], [.71, .39], [.705, .1], [.712, -.5], [.72, -1.0], [.7, -1.045], [.35, -1.055], [0, -1.055]];
    var poly = R_.slice();
    for (var k = R_.length - 2; k > 0; k--) poly.push([-R_[k][0], R_[k][1]]);
    function inside(x, y) { var c = false; for (var a = 0, b = poly.length - 1; a < poly.length; b = a++) { var A = poly[a], B = poly[b]; if (((A[1] > y) !== (B[1] > y)) && (x < (B[0] - A[0]) * (y - A[1]) / (B[1] - A[1]) + A[0])) c = !c; } return c; }
    function near(x, y) { var bd = 1e9, bp = null; for (var a = 0; a < poly.length; a++) { var A = poly[a], B = poly[(a + 1) % poly.length], dx = B[0] - A[0], dy = B[1] - A[1], t = ((x - A[0]) * dx + (y - A[1]) * dy) / (dx * dx + dy * dy); t = Math.max(0, Math.min(1, t)); var px = A[0] + t * dx, py = A[1] + t * dy, d = Math.hypot(x - px, y - py); if (d < bd) { bd = d; bp = [px, py]; } } return [bd, bp]; }
    var NX = 96, NY = 88, x0 = -1.2, x1 = 1.2, y0 = -1.1, y1 = 1.04, V = [], IN = [];
    for (var j = 0; j <= NY; j++) for (var q = 0; q <= NX; q++) {
      var x = x0 + (x1 - x0) * q / NX, y = y0 + (y1 - y0) * j / NY, ins = inside(x, y), nr = near(x, y);
      IN.push(ins); V.push(ins ? [x, y, nr[0]] : [nr[1][0], nr[1][1], 0]);
    }
    function build(side) {
      var p = [], idx = [], used = {}, map = {};
      function vi(id) {
        if (map[id] !== undefined) return map[id];
        var v = V[id], d = v[2], z = .2 * (1 - Math.pow(1 - Math.min(d / .5, 1), 2.2));
        z += IN[id] ? .008 * Math.sin(v[1] * 11 + v[0] * 3) * Math.sin(v[0] * 6) * Math.min(d * 8, 1) : 0;
        map[id] = p.length / 3; p.push(v[0], v[1], z * side); return map[id];
      }
      for (var j = 0; j < NY; j++) for (var q = 0; q < NX; q++) {
        var a = j * (NX + 1) + q, b = a + 1, c = a + NX + 1, d = c + 1;
        if (!(IN[a] || IN[b] || IN[c] || IN[d])) continue;
        var A = vi(a), B = vi(b), C = vi(c), D = vi(d);
        if (side > 0) idx.push(A, B, D, A, D, C); else idx.push(A, D, B, A, C, D);
      }
      var n = new Array(p.length).fill(0);
      for (var t = 0; t < idx.length; t += 3) {
        var i0 = idx[t] * 3, i1 = idx[t + 1] * 3, i2 = idx[t + 2] * 3;
        var e1 = [p[i1] - p[i0], p[i1 + 1] - p[i0 + 1], p[i1 + 2] - p[i0 + 2]], e2 = [p[i2] - p[i0], p[i2 + 1] - p[i0 + 1], p[i2 + 2] - p[i0 + 2]], f = cross(e1, e2);
        [i0, i1, i2].forEach(function (ii) { n[ii] += f[0]; n[ii + 1] += f[1]; n[ii + 2] += f[2]; });
      }
      for (t = 0; t < n.length; t += 3) { var nn = norm([n[t], n[t + 1], n[t + 2]]); n[t] = nn[0]; n[t + 1] = nn[1]; n[t + 2] = nn[2]; }
      return { p: p, n: n, i: idx };
    }
    return [build(1), build(-1)];
  };
  W.GL104 = { M: M, R: R, Geo: Geo };
})(window);
