/* 打破陈规 H5 · 主程序（同域外链脚本，兼容 script-src 'self' 的内容安全策略） */
(function () {
  var gate = document.getElementById("gate"), root = document.documentElement;
  function enter(sound, e) {
    if (e) e.preventDefault();
    root.classList.add("entered");
    gate.classList.add("gone");
    if (window.__btr) window.__btr.onEnter(sound); else window.__pendingSound = sound;
  }
  document.getElementById("enter").addEventListener("click", function (e) { enter(true, e); });
  document.getElementById("enterMute").addEventListener("click", function (e) { enter(false, e); });
  if (location.hash === "#go") { root.classList.add("entered"); gate.classList.add("gone"); }
})();

(() => {
"use strict";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = s => document.querySelector(s);
const root = document.documentElement;

/* ---------------- grain texture ---------------- */
(function(){
  const c = document.createElement("canvas"); c.width = c.height = 160;
  const x = c.getContext("2d"), d = x.createImageData(160,160);
  for (let i=0;i<d.data.length;i+=4){ const v = Math.random()*255; d.data[i]=d.data[i+1]=d.data[i+2]=v; d.data[i+3]=255; }
  x.putImageData(d,0,0);
  $("#grain").style.backgroundImage = `url(${c.toDataURL()})`;
})();

/* ================= MUSIC: synthesized jazz hip-hop loop ================= */
const Music = (() => {
  let ctx, master, bus, rev, analyser, noiseBuf, crackleSrc, timer, nextTime = 0, step = 0, playing = false, built = false;
  const BPM = 86, S16 = 60 / BPM / 4;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  // 4-bar progression: Fm9 | Bb13 | Ebmaj9 | Cm9
  const CHORDS = [
    { bass: 41, keys: [56, 60, 63, 67] },
    { bass: 46, keys: [56, 62, 67, 72] },
    { bass: 39, keys: [55, 58, 62, 65] },
    { bass: 36, keys: [58, 62, 63, 67] },
  ];
  // muted-horn lick: [16th index within 2 bars, midi, length in 16ths]
  const LICK = [[2,72,2],[4,75,3],[8,72,1],[10,70,2],[12,68,4],[18,67,2],[20,68,1],[22,70,2],[24,65,6]];

  function build(){
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3.5; comp.attack.value = .005; comp.release.value = .2;
    analyser = ctx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = .7;
    master.connect(comp); comp.connect(analyser); analyser.connect(ctx.destination);
    bus = ctx.createBiquadFilter(); bus.type = "lowpass"; bus.frequency.value = 4800; bus.connect(master);
    // noise buffer
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i=0;i<nd.length;i++) nd[i] = Math.random()*2-1;
    // room reverb
    rev = ctx.createConvolver();
    const len = ctx.sampleRate * 1.8, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch=0; ch<2; ch++){ const d = ir.getChannelData(ch); for (let i=0;i<len;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 3); }
    rev.buffer = ir; const rg = ctx.createGain(); rg.gain.value = .22; rev.connect(rg); rg.connect(master);
    // vinyl crackle bed
    const cb = ctx.createBuffer(1, ctx.sampleRate*2, ctx.sampleRate), cd = cb.getChannelData(0);
    for (let i=0;i<cd.length;i++){ const r = Math.random(); cd[i] = r < .0009 ? (Math.random()*2-1)*.7 : (Math.random()*2-1)*.012; }
    crackleSrc = ctx.createBufferSource(); crackleSrc.buffer = cb; crackleSrc.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1500;
    const cg = ctx.createGain(); cg.gain.value = .35;
    crackleSrc.connect(hp); hp.connect(cg); cg.connect(master); crackleSrc.start();
    built = true;
  }
  function env(g, t, a, peak, d, sus, rel){
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sus,0.0001), t + a + d);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d + rel);
  }
  function kick(t, v=1){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(44, t + .13);
    g.gain.setValueAtTime(1.0*v, t); g.gain.exponentialRampToValueAtTime(0.001, t + .5);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + .55);
  }
  function snare(t, v=1){
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1900; bp.Q.value = .7;
    const g = ctx.createGain(); g.gain.setValueAtTime(.42*v, t); g.gain.exponentialRampToValueAtTime(0.001, t + .22);
    n.connect(bp); bp.connect(g); g.connect(master); g.connect(rev); n.start(t); n.stop(t + .25);
    const o = ctx.createOscillator(), og = ctx.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(150, t+.1);
    og.gain.setValueAtTime(.35*v, t); og.gain.exponentialRampToValueAtTime(0.001, t + .12);
    o.connect(og); og.connect(master); o.start(t); o.stop(t + .14);
  }
  function hat(t, v=1, open=false){
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7200;
    const g = ctx.createGain(); const d = open ? .28 : .045;
    g.gain.setValueAtTime(.13*v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    n.connect(hp); hp.connect(g); g.connect(master); n.start(t, Math.random()*.5); n.stop(t + d + .02);
  }
  function rhodes(t, midi, dur, v=1){
    const f = mtof(midi);
    const o = ctx.createOscillator(); o.frequency.value = f;
    const m = ctx.createOscillator(); m.frequency.value = f;
    const mg = ctx.createGain(); mg.gain.setValueAtTime(f*1.4, t); mg.gain.exponentialRampToValueAtTime(f*.04, t + .35);
    m.connect(mg); mg.connect(o.frequency);
    const trem = ctx.createOscillator(); trem.frequency.value = 4.6; const tg = ctx.createGain(); tg.gain.value = .018;
    const g = ctx.createGain(); env(g, t, .008, .075*v, .5, .03*v, Math.max(.2, dur));
    trem.connect(tg); tg.connect(g.gain);
    o.connect(g); g.connect(bus); g.connect(rev);
    const end = t + .51 + Math.max(.2, dur) + .05;
    [o,m,trem].forEach(x => { x.start(t); x.stop(end); });
  }
  function bass(t, midi, dur){
    const f = mtof(midi);
    const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = f;
    const s = ctx.createOscillator(); s.frequency.value = f;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520;
    const g = ctx.createGain(); env(g, t, .01, .5, .12, .3, dur);
    o.connect(lp); s.connect(lp); lp.connect(g); g.connect(master);
    o.start(t); s.start(t); o.stop(t + dur + .2); s.stop(t + dur + .2);
  }
  function horn(t, midi, dur){
    const f = mtof(midi);
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
    const vib = ctx.createOscillator(); vib.frequency.value = 5.4; const vg = ctx.createGain();
    vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f*.012, t + .25);
    vib.connect(vg); vg.connect(o.frequency);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 3;
    lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1500, t + .08); lp.frequency.linearRampToValueAtTime(900, t + dur);
    const g = ctx.createGain(); env(g, t, .05, .06, .1, .045, dur);
    o.connect(lp); lp.connect(g); g.connect(bus); g.connect(rev);
    o.start(t); vib.start(t); o.stop(t + dur + .4); vib.stop(t + dur + .4);
  }
  function playStep(n, t0){
    const s = n % 16, bar = Math.floor(n / 16) % 8, ch = CHORDS[bar % 4], nextCh = CHORDS[(bar + 1) % 4];
    const t = t0 + (s % 2 ? S16 * .24 : 0); // swing
    // drums
    if (s === 0 || s === 10 || (s === 7 && bar % 2 === 0) || (s === 15 && bar % 4 === 3)) kick(t, s === 0 ? 1 : .8);
    if (s === 4 || s === 12) snare(t, 1);
    if (s === 15 && bar % 2 === 1) snare(t, .25);
    if (bar === 7 && s >= 13) snare(t, .35 + (s-13)*.2);
    hat(t, [1,.35,.65,.35][s % 4], s === 14 && bar % 2 === 1);
    // bass walk
    if (s === 0) bass(t, ch.bass, S16*5);
    if (s === 6) bass(t, ch.bass + 7, S16*3);
    if (s === 10) bass(t, ch.bass + 12, S16*3);
    if (s === 14) bass(t, nextCh.bass - 1 + (nextCh.bass - 1 < 33 ? 12 : 0), S16*1.6);
    // keys
    if (s === 0) ch.keys.forEach((k,i) => rhodes(t + i*.012, k, S16*6, 1));
    if (s === 6 || s === 11) ch.keys.forEach((k,i) => rhodes(t + i*.008, k, S16*1.2, .6));
    // horn lick on bars 4-5 of the 8-bar cycle
    if (bar === 4 || bar === 5){
      const idx = (bar - 4) * 16 + s;
      LICK.forEach(([p, m, l]) => { if (p === idx) horn(t, m, S16 * l); });
    }
  }
  function tick(){
    while (nextTime < ctx.currentTime + .15){ playStep(step, nextTime); nextTime += S16; step++; }
  }
  async function start(){
    if (!built) { try { build(); } catch (e) { return; } }
    if (ctx.state === "suspended") await ctx.resume();
    if (playing) return;
    playing = true;
    nextTime = ctx.currentTime + .08;
    timer = setInterval(tick, 25);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(.85, ctx.currentTime + 1.5);
  }
  function stop(){
    if (!playing) return;
    playing = false; clearInterval(timer);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + .4);
  }
  const fft = new Uint8Array(128);
  function levels(){
    if (!analyser || !playing) return null;
    analyser.getByteFrequencyData(fft);
    let b = 0; for (let i=1;i<6;i++) b += fft[i]; b /= 5*255;
    let m = 0; for (let i=8;i<30;i++) m += fft[i]; m /= 22*255;
    let h = 0; for (let i=40;i<90;i++) h += fft[i]; h /= 50*255;
    return { bass: b, mid: m, high: h };
  }
  return { start, stop, levels, get playing(){ return playing; } };
})();

const bgm = $("#bgm"), bgmTxt = $("#bgmTxt"), eqBars = [...document.querySelectorAll(".eq i")];
function setBgmUI(on){ bgm.classList.toggle("on", on); bgm.setAttribute("aria-pressed", on); bgmTxt.textContent = on ? "BGM ON" : "BGM OFF"; }
bgm.addEventListener("click", () => { if (Music.playing){ Music.stop(); setBgmUI(false); } else { Music.start(); setBgmUI(true); } });


/* ================= REVEAL ================= */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px 12% 0px" });
function revealVisible(){ document.querySelectorAll(".rv").forEach(el => io.observe(el)); }
window.__btr = {
  onEnter(withSound){
    if (withSound){ Music.start().catch(() => setBgmUI(false)); setBgmUI(true); }
    revealVisible();
  }
};
if (document.documentElement.classList.contains("entered")) revealVisible();
if (window.__pendingSound !== undefined) window.__btr.onEnter(window.__pendingSound);

/* ================= 3D PHOTO RING ================= */
const PHOTOS = [
  { src: "assets/stage.jpg",   cap: "<b>2025</b> · 葱头 ONION · 主舞台", alt: "2025 届打破陈规主舞台大屏" },
  { src: "assets/group.jpg",   cap: "<b>2025</b> · 全家福 · 2V2 冠亚军", alt: "2025 届打破陈规全体大合影" },
  { src: "assets/win1v1.jpg",  cap: "<b>2024</b> · HIPHOP 1V1 冠亚军", alt: "HIPHOP 1V1 冠军和亚军与评委合影" },
  { src: "assets/win2v2.jpg",  cap: "<b>2024</b> · HIPHOP 2V2 冠亚军", alt: "HIPHOP 2V2 冠亚军与评委合影" },
  { src: "assets/judges.jpg",  cap: "<b>2024</b> · 2V2 JUDGES", alt: "三位评委合影" },
  { src: "assets/vol3.jpg",    cap: "<b>2024</b> · VOL.3 COMING SOON", alt: "打破陈规 Vol.3 预告图" },
];
const ring = $("#ring"), ringwrap = $("#ringwrap");
const N = PHOTOS.length, STEP = 360 / N;
let R = 250;
PHOTOS.forEach((p, i) => {
  const slot = document.createElement("div"); slot.className = "slot";
  slot.innerHTML = `<button type="button" aria-label="查看大图：${p.alt}"><img src="${p.src}" alt="${p.alt}" loading="lazy"></button><div class="cap">${p.cap}</div>`;
  slot.querySelector("button").addEventListener("click", () => { if (!dragMoved) openLB(p.src, p.cap.replace(/<[^>]+>/g, "")); });
  ring.appendChild(slot);
});
const slots = [...ring.children];
function layoutRing(){
  const w = ringwrap.clientWidth;
  R = Math.max(200, Math.min(300, w * .62));
  slots.forEach((s, i) => s.style.transform = `rotateY(${i*STEP}deg) translateZ(${R}px)`);
}
layoutRing(); addEventListener("resize", layoutRing);
let ang = 0, vel = reduce ? 0 : -.12, dragging = false, lastX = 0, dragMoved = false, downX = 0;
ringwrap.addEventListener("pointerdown", e => { dragging = true; dragMoved = false; lastX = downX = e.clientX; });
addEventListener("pointermove", e => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; ang += dx * .35; vel = dx * .35; if (Math.abs(e.clientX - downX) > 6) dragMoved = true; });
addEventListener("pointerup", () => { dragging = false; });
addEventListener("pointercancel", () => { dragging = false; });
function spinRing(){
  if (!dragging){ ang += vel; vel += ((reduce ? 0 : -.12) - vel) * .03; }
  ring.style.transform = `translateZ(${-R}px) rotateX(-6deg) rotateY(${ang}deg)`;
  slots.forEach((s, i) => {
    const a = ((i*STEP + ang) % 360 + 360) % 360; const facing = Math.cos(a * Math.PI/180);
    s.style.opacity = (.35 + .65 * Math.max(0, facing)).toFixed(3);
    s.style.filter = facing < 0 ? "grayscale(1) brightness(.5)" : "none";
  });
}

/* ================= LIGHTBOX ================= */
const lb = $("#lb");
function openLB(src, cap){ $("#lbImg").src = src; $("#lbImg").alt = cap; $("#lbCap").textContent = cap; lb.classList.add("open"); $("#lbClose").focus(); }
function closeLB(){ lb.classList.remove("open"); }
lb.addEventListener("click", e => { if (e.target === lb || e.target.id === "lbClose") closeLB(); });
addEventListener("keydown", e => { if (e.key === "Escape") closeLB(); });
document.querySelectorAll(".poster").forEach(p => p.addEventListener("click", () => openLB(p.dataset.src, p.dataset.cap)));

/* ================= DAVID TILT ================= */
const dcard = $("#davidCard");
dcard.parentElement.addEventListener("pointermove", e => {
  const r = dcard.getBoundingClientRect(); const x = (e.clientX - r.left)/r.width - .5, y = (e.clientY - r.top)/r.height - .5;
  dcard.style.animation = "none"; dcard.style.transform = `rotateY(${x*30}deg) rotateX(${-y*24}deg)`;
});
dcard.parentElement.addEventListener("pointerleave", () => { dcard.style.transform = ""; dcard.style.animation = ""; });

$("#toTop").addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

/* ================= SCROLL-LINKED 3D (cards, posters) ================= */
const cards = [...document.querySelectorAll(".card")], posters = [...document.querySelectorAll(".poster")];
function scrollFX(){
  const vh = innerHeight;
  cards.forEach((c, i) => {
    const r = c.getBoundingClientRect(); const k = Math.max(-1, Math.min(1, (r.top + r.height/2 - vh/2) / (vh/2)));
    c.style.transform = `rotateX(${k * 16}deg) rotateY(${(i%2 ? -1 : 1) * k * 8}deg) translateZ(${-Math.abs(k)*40}px)`;
  });
  posters.forEach((p, i) => {
    const r = p.getBoundingClientRect(); const k = Math.max(-1, Math.min(1, (r.top + r.height/2 - vh/2) / (vh/2)));
    p.style.transform = `rotateY(${18 - k*26}deg) rotateX(${k*10}deg)`;
  });
}

/* ================= 3D CITY (no external library) ================= */
let three = null;
try { three = window.City ? window.City(document.getElementById("stage")) : null; } catch (err) { three = null; }
if (!three){ const c = document.getElementById("stage"); if (c) c.remove(); const fb = document.createElement("div"); fb.className = "fallback-bg"; document.body.prepend(fb); }

/* ================= MAIN LOOP ================= */
const prog = $("#progress");
let t0 = performance.now();
function loop(now){
  const t = (now - t0) / 1000;
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const p = scrollY / max;
  prog.style.transform = `scaleX(${p})`;
  const lv = Music.levels();
  const beat = lv ? Math.min(1, lv.bass * 1.4) : 0;
  root.style.setProperty("--beat", beat.toFixed(3));
  if (lv){ eqBars.forEach((b, i) => b.style.height = (3 + Math.min(9, [lv.bass, lv.mid, lv.high*2, lv.mid*1.3][i] * 14)) + "px"); }
  else eqBars.forEach(b => b.style.height = "3px");
  if (three) three.frame(t, p, lv);
  spinRing();
  scrollFX();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
})();
