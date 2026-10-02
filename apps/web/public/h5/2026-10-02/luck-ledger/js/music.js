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
