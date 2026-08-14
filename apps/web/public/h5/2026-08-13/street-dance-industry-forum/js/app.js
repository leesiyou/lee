(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const audio = {
    on: true, ctx: null, last: 0,
    async unlock() {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = this.ctx || new AC();
      if (this.ctx.state === "suspended") await this.ctx.resume();
    },
    tone(f, d, t, v, s) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = t; o.frequency.setValueAtTime(f, c.currentTime);
      if (s) o.frequency.exponentialRampToValueAtTime(s, c.currentTime + d);
      g.gain.setValueAtTime(v, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d);
      o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + d + 0.02);
    },
    noise(d, v) {
      const c = this.ctx, n = Math.floor(c.sampleRate * d);
      const b = c.createBuffer(1, n, c.sampleRate), data = b.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = 860; src.buffer = b; g.gain.value = v;
      src.connect(f).connect(g).connect(c.destination); src.start();
    },
    play(name) {
      if (!this.on || !this.ctx) return;
      const now = performance.now();
      if (name === "chime" && now - this.last < 1200) return;
      if (name === "chime") this.last = now;
      if (name === "whoosh") { this.noise(.4, .1); this.tone(170, .38, "sine", .045, 70); }
      if (name === "tick") this.tone(1720, .05, "triangle", .035);
      if (name === "hover") this.tone(2360, .04, "sine", .022);
      if (name === "chime") { this.tone(523, .28, "sine", .03); this.tone(659, .26, "sine", .02); }
    }
  };

  $("#enter")?.addEventListener("click", async () => {
    try { await audio.unlock(); } catch (_) {}
    audio.play("whoosh");
    $("#gate").classList.add("out");
    document.body.classList.remove("locked");
  });
  $("#sound")?.addEventListener("click", async () => {
    audio.on = !audio.on;
    $("#sound").classList.toggle("off", !audio.on);
    if (audio.on) { try { await audio.unlock(); } catch (_) {} audio.play("tick"); }
  });

  const bar = $("#progress");
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = ((max > 0 ? scrollY / max : 0) * 100) + "%";
  }, { passive: true });

  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      if (e.target.hasAttribute("data-chime")) audio.play("chime");
    });
  }, { threshold: .16 });
  $$(".reveal, [data-chime]").forEach((el) => io.observe(el));

  $$(".btn, .speak, .day").forEach((el) => {
    el.addEventListener("mouseenter", () => audio.play("hover"));
    el.addEventListener("click", () => audio.play("tick"));
  });
})();
