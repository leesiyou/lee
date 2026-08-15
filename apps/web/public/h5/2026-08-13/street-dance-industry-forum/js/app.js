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
    play(name) {
      if (!this.on || !this.ctx) return;
      const now = performance.now();
      if (name === "chime" && now - this.last < 1200) return;
      if (name === "chime") this.last = now;
      if (name === "whoosh") this.tone(170, .38, "sine", .04, 70);
      if (name === "tick") this.tone(1720, .05, "triangle", .03);
      if (name === "hover") this.tone(2360, .04, "sine", .02);
      if (name === "chime") { this.tone(523, .28, "sine", .025); this.tone(659, .26, "sine", .018); }
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
  $$(".btn, .speak, .day, .guide a").forEach((el) => {
    el.addEventListener("mouseenter", () => audio.play("hover"));
    el.addEventListener("click", () => audio.play("tick"));
  });
})();
