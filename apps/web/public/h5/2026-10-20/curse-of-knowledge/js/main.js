(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ============================================================
     1. 引导流程（SOP）
     ============================================================ */
  var steps = $$(".step");
  var TOTAL = 7;
  var cur = 0;
  var dock = $("#dock");
  var prevBtn = $("#prevBtn");
  var nextBtn = $("#nextBtn");
  var progress = $$("#progress i");

  var state = { tapped: false, pick: "", wrote: "" };

  function show(i) {
    cur = i;
    steps.forEach(function (s, k) { s.classList.toggle("active", k === i); });
    var gate = i === 0;
    var isRecap = i === TOTAL + 1;
    if (dock) dock.hidden = gate || isRecap;
    var stg = $("#stage");
    if (stg) stg.classList.toggle("recap-mode", isRecap);

    progress.forEach(function (p, k) {
      var n = k + 1;
      p.classList.toggle("now", n === i);
      p.classList.toggle("done", n < i);
    });

    if (!gate && !isRecap) {
      if (prevBtn) prevBtn.style.display = i === 1 ? "none" : "inline-block";
      if (nextBtn) {
        nextBtn.textContent = i === TOTAL ? "看我的复盘" : "完成这一步";
        nextBtn.disabled = !canAdvance(i);
      }
    }
    if (isRecap) buildRecap();
    window.scrollTo(0, 0);
  }

  function canAdvance(i) {
    if (i === 3) return !!state.pick;
    if (i === 7) return state.wrote.trim().length > 0;
    return true;
  }

  if ($("#enterBtn")) $("#enterBtn").addEventListener("click", function () {
    startMusic();
    show(1);
  });

  if (nextBtn) nextBtn.addEventListener("click", function () {
    if (cur === 0) { show(1); return; }
    if (cur <= TOTAL) show(cur + 1);
  });
  if (prevBtn) prevBtn.addEventListener("click", function () {
    if (cur > 1) show(cur - 1);
  });

  /* ---------------- 第 1 步 ---------------- */
  var tappedBtn = $("#tappedBtn");
  if (tappedBtn) tappedBtn.addEventListener("click", function () {
    state.tapped = true;
    tappedBtn.setAttribute("data-done", "1");
    tappedBtn.textContent = "敲过了";
  });

  /* ---------------- 第 3 步：球拍题 ---------------- */
  var quiz = $("#quiz");
  var verdict = $("#verdict");
  var fb = $("#fb");
  if (quiz) {
    $$(".opt", quiz).forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$(".opt", quiz).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        state.pick = btn.getAttribute("data-answer");
        if (verdict) verdict.hidden = false;
        if (fb) {
          fb.hidden = false;
          var bars = $(".bars", fb);
          if (bars) {
            var fill = function () {
              $$(".bar", bars).forEach(function (b) { b.style.setProperty("--w", b.getAttribute("data-w") + "%"); });
              bars.classList.add("in");
            };
            if (reduce) fill(); else window.setTimeout(fill, 120);
          }
        }
        if (nextBtn) nextBtn.disabled = false;
      });
    });
  }

  /* ---------------- 第 4 步：倒出图钉 ---------------- */
  var boxStage = $("#boxStage");
  var pour = $("#pourBtn");
  if (pour) pour.addEventListener("click", function () {
    if (boxStage) boxStage.classList.add("poured");
    var hint = $("#boxHint");
    if (hint) hint.textContent = "盒子倒空了。现在它能是烛台。";
  });

  /* ---------------- 第 5 步：双屏点阵 ---------------- */
  var ds = $("#dotsStudent"), de = $("#dotsExpert");
  if (ds && de) {
    var studentOn = [0, 1, 5, 6, 7, 11, 12, 13, 17, 18, 19, 23];
    var expertOn = [1, 3, 6, 8, 11, 13, 16, 18, 21, 23];
    for (var i = 0; i < 25; i++) {
      var a = document.createElement("i");
      var b = document.createElement("i");
      if (studentOn.indexOf(i) !== -1) a.className = "on";
      if (expertOn.indexOf(i) !== -1) b.className = "on";
      ds.appendChild(a); de.appendChild(b);
    }
  }

  /* ---------------- 第 6 步：531 个格子 ---------------- */
  var schools = $("#schools");
  if (schools) {
    var frag = document.createDocumentFragment();
    for (var k = 0; k < 531; k++) {
      var cell = document.createElement("i");
      if (k % 2 === 0) cell.setAttribute("data-t", "1");
      frag.appendChild(cell);
    }
    schools.appendChild(frag);
    var lit = false;
    var lightUp = function () {
      if (lit) return;
      lit = true;
      $$("i", schools).forEach(function (c, idx) {
        if (c.getAttribute("data-t") !== "1") return;
        window.setTimeout(function () { c.classList.add("on"); }, reduce ? 0 : idx * 1.2);
      });
    };
    lightUp();
  }

  /* ---------------- 第 7 步：三句话 ---------------- */
  var ta = $("#threeLines");
  var count = $("#count");
  if (ta) {
    var upd = function () {
      if (count) count.textContent = ta.value.length + " / 140";
      state.wrote = ta.value;
      if (cur === 7 && nextBtn) nextBtn.disabled = ta.value.trim().length === 0;
    };
    ta.addEventListener("input", upd);
    upd();
  }

  /* ---------------- 复盘 ---------------- */
  function buildRecap() {
    var rcTap = $("#rcTap"), rcPick = $("#rcPick"), rcWrite = $("#rcWrite"), rcV = $("#rcVerdict");
    if (rcTap) rcTap.textContent = state.tapped
      ? "你敲过了。那一敲里，你听见的是歌，对方听见的是桌子。"
      : "没有记录（回第 1 步可以补）";
    if (rcPick) {
      rcPick.textContent = state.pick === "five" ? "5 美分（对）——你回头验算过那 1 美元的差"
        : state.pick === "ten" ? "10 美分（错）——你把自己的第一反应当成了所有人的"
        : "跳过（回第 3 步可以补）";
    }
    if (rcWrite) rcWrite.textContent = state.wrote.trim() || "（空）——这一栏空着，恰好说明「说会懂」和「写出来」是两件事";
    if (rcV) {
      rcV.textContent = state.wrote.trim()
        ? "你刚才那三句，是这一路唯一一个「验证过」的东西：不是你觉得懂了，而是你能用自己的词把它讲出来。知识不是存在脑子里的条目，是那条你走过的路——你现在把它写下来了三行。"
        : "这一路你做完了六步，最后一步留空了。也正常：讲清一件事的成本，比听懂它高得多。";
    }
  }

  var copyBtn = $("#copyBtn");
  if (copyBtn) copyBtn.addEventListener("click", function () {
    var txt = [
      "知识的诅咒 · 我的复盘",
      "1. 敲桌子：" + (state.tapped ? "敲过了" : "没记录"),
      "2. 球拍和球：" + (state.pick === "five" ? "5 美分（对）" : state.pick === "ten" ? "10 美分（错）" : "跳过"),
      "3. 我写的三句话：" + (state.wrote.trim() || "（空）"),
      "带走一件事：别问「懂了吗」，让他写三句话，看他从哪里开始和你分岔。"
    ].join("\n");
    var hint = $("#copyHint");
    var ok = function () { if (hint) hint.textContent = "已复制。粘到备忘录里就是你的复盘卡。"; };
    var bad = function () { if (hint) hint.textContent = "这台浏览器不允许自动复制，长按选中上面的文字即可。"; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(ok, bad);
    } else bad();
  });

  var again = $("#againBtn");
  if (again) again.addEventListener("click", function () {
    state = { tapped: false, pick: "", wrote: "" };
    if (ta) ta.value = "";
    if (count) count.textContent = "0 / 140";
    if (verdict) verdict.hidden = true;
    if (fb) {
      fb.hidden = true;
      var B = $(".bars", fb);
      if (B) { B.classList.remove("in"); $$(".bar", B).forEach(function (x) { x.style.setProperty("--w", "0%"); }); }
    }
    if (boxStage) boxStage.classList.remove("poured");
    if (tappedBtn) { tappedBtn.setAttribute("data-done", "0"); tappedBtn.textContent = "我敲过了"; }
    var hi = $("#boxHint");
    if (hi) hi.textContent = "先自己想 5 秒，再点上面的按钮。";
    if (quiz) $$(".opt", quiz).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    show(1);
  });

  /* ============================================================
     背景音乐：浏览器实时合成，无音频文件
     ============================================================ */
  var AC = window.AudioContext || window.webkitAudioContext;
  var actx = null, master = null, musicOn = false, timer = null, delay = null, feedback = null;
  var soundBtn = $("#soundBtn"), soundText = $("#soundText");
  var SCALE = [196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
  var noteIdx = 0;

  function ensureCtx() {
    if (!AC) return false;
    if (!actx) {
      try { actx = new AC(); } catch (e) { return false; }
      master = actx.createGain();
      master.gain.value = 0;
      master.connect(actx.destination);

      delay = actx.createDelay(0.6);
      delay.delayTime.value = 0.32;
      feedback = actx.createGain();
      feedback.gain.value = 0.24;
      var wet = actx.createGain();
      wet.gain.value = 0.32;
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(master);

      var pad = actx.createGain();
      pad.gain.value = 0.05;
      var lp = actx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 420;
      lp.connect(pad);
      pad.connect(master);
      pad.connect(delay);

      [98.0, 146.83].forEach(function (f, idx) {
        var o = actx.createOscillator();
        o.type = "triangle";
        o.frequency.value = f;
        var g = actx.createGain();
        g.gain.value = idx ? 0.5 : 1;
        o.connect(g); g.connect(lp);
        o.start();
      });
    }
    if (actx.state === "suspended") actx.resume();
    return true;
  }

  function pluck() {
    if (!actx || !musicOn) return;
    var t = actx.currentTime + 0.02;
    var f = SCALE[noteIdx % SCALE.length];
    noteIdx += (Math.random() < 0.5 ? 1 : 2);
    var o = actx.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    var g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.11, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    var lp = actx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(2400, t);
    lp.frequency.exponentialRampToValueAtTime(900, t + 2.4);
    o.connect(g); g.connect(lp); lp.connect(master); lp.connect(delay);
    o.start(t); o.stop(t + 2.8);
  }

  function startMusic() {
    if (!ensureCtx()) { setSoundLabel(false, true); return; }
    musicOn = true;
    master.gain.cancelScheduledValues(actx.currentTime);
    master.gain.setValueAtTime(master.gain.value, actx.currentTime);
    master.gain.linearRampToValueAtTime(0.5, actx.currentTime + 2.4);
    pluck();
    if (timer) window.clearInterval(timer);
    timer = window.setInterval(function () { if (musicOn) pluck(); }, 1900);
    setSoundLabel(true);
  }

  function stopMusic() {
    musicOn = false;
    if (timer) { window.clearInterval(timer); timer = null; }
    if (actx && master) {
      master.gain.cancelScheduledValues(actx.currentTime);
      master.gain.setValueAtTime(master.gain.value, actx.currentTime);
      master.gain.linearRampToValueAtTime(0, actx.currentTime + 0.6);
    }
    setSoundLabel(false);
  }

  function setSoundLabel(on, unsupported) {
    if (!soundBtn) return;
    soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
    if (soundText) soundText.textContent = unsupported ? "无声音" : on ? "声音开" : "声音关";
  }

  if (soundBtn) soundBtn.addEventListener("click", function () {
    if (musicOn) stopMusic(); else startMusic();
  });

  show(0);
})();
