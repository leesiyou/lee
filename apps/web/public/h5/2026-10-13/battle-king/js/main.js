    (function(){
      const officialUrl = 'https://mp.weixin.qq.com/s/VQiO_3iRGppwUXFvNorU8w';
      const gate = document.getElementById('gate');
      const enterBtn = document.getElementById('enterBtn');
      const musicBtn = document.getElementById('musicBtn');
      const musicText = document.getElementById('musicText');
      const progress = document.getElementById('progress');
      const tabs = Array.from(document.querySelectorAll('.tab'));
      const schedules = Array.from(document.querySelectorAll('.schedule'));
      const galleryMain = document.getElementById('galleryMain');
      const galleryTitle = document.getElementById('galleryTitle');
      const galleryText = document.getElementById('galleryText');
      const galleryBtns = Array.from(document.querySelectorAll('.gallery-btn'));
      const stage = document.getElementById('tiltStage');
      const posterCard = document.getElementById('posterCard');
      const canvas = document.getElementById('particles');
      const ctx = canvas.getContext('2d');

      let audioCtx = null;
      let master = null;
      let beatTimer = null;
      let playing = false;
      let muted = false;
      let beatStep = 0;
      let particles = [];
      let autoGalleryIndex = 0;

      function setupAudio(){
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if(!Ctx) return false;
        if(!audioCtx){
          audioCtx = new Ctx();
          master = audioCtx.createGain();
          master.gain.value = 0.32;
          master.connect(audioCtx.destination);
        }
        return true;
      }
      function kick(t){
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(128, t);
        osc.frequency.exponentialRampToValueAtTime(46, t + .16);
        gain.gain.setValueAtTime(.85, t);
        gain.gain.exponentialRampToValueAtTime(.001, t + .18);
        osc.connect(gain); gain.connect(master); osc.start(t); osc.stop(t + .2);
      }
      function snare(t){
        const len = Math.floor(audioCtx.sampleRate * .14);
        const buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0;i<len;i++) data[i] = (Math.random()*2-1) * (1-i/len);
        const src = audioCtx.createBufferSource();
        const gain = audioCtx.createGain();
        src.buffer = buffer;
        gain.gain.setValueAtTime(.32, t);
        gain.gain.exponentialRampToValueAtTime(.001, t + .13);
        src.connect(gain); gain.connect(master); src.start(t); src.stop(t + .15);
      }
      function hat(t){
        const len = Math.floor(audioCtx.sampleRate * .045);
        const buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0;i<len;i++) data[i] = (Math.random()*2-1) * (1-i/len);
        const src = audioCtx.createBufferSource();
        const gain = audioCtx.createGain();
        src.buffer = buffer;
        gain.gain.value = .075;
        src.connect(gain); gain.connect(master); src.start(t); src.stop(t + .05);
      }
      function bass(t, freq){
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(.18, t);
        gain.gain.exponentialRampToValueAtTime(.001, t + .12);
        osc.connect(gain); gain.connect(master); osc.start(t); osc.stop(t + .13);
      }
      function beat(){
        if(!playing || !audioCtx) return;
        const now = audioCtx.currentTime + .02;
        const step = beatStep % 16;
        if([0,3,8,11].includes(step)) kick(now);
        if([4,12].includes(step)) snare(now);
        if(step % 2 === 0) hat(now);
        if([0,6,10,14].includes(step)) bass(now, [55,65.4,73.4,82.4][(beatStep/2|0)%4]);
        beatStep++;
      }
      async function startMusic(){
        if(!setupAudio()){
          musicText.textContent = '当前浏览器不支持网页合成音乐';
          return;
        }
        await audioCtx.resume();
        playing = true;
        muted = false;
        master.gain.value = .32;
        clearInterval(beatTimer);
        beat();
        beatTimer = setInterval(beat, 135);
        musicBtn.textContent = '音乐 ON';
        musicText.textContent = 'Breakbeat 正在播放';
      }
      function toggleMusic(){
        if(!playing){ startMusic(); return; }
        muted = !muted;
        master.gain.value = muted ? 0 : .32;
        musicBtn.textContent = muted ? '音乐 OFF' : '音乐 ON';
        musicText.textContent = muted ? '已静音' : 'Breakbeat 正在播放';
      }
      enterBtn.addEventListener('click', async function(){
        await startMusic();
        gate.classList.add('hide');
      });
      musicBtn.addEventListener('click', toggleMusic);
      document.querySelectorAll('.official-jump').forEach(function(link){
        link.addEventListener('click', function(){
          this.href = officialUrl;
        });
      });

      const reveals = Array.from(document.querySelectorAll('.reveal'));
      if('IntersectionObserver' in window){
        const io = new IntersectionObserver(function(entries){
          entries.forEach(function(entry){
            if(entry.isIntersecting){
              entry.target.classList.add('show');
              io.unobserve(entry.target);
            }
          });
        }, {threshold:.12});
        reveals.forEach(function(el){io.observe(el)});
      }else{
        reveals.forEach(function(el){el.classList.add('show')});
      }

      function updateProgress(){
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        const pct = height > 0 ? Math.min(100, Math.max(0, scrollTop / height * 100)) : 0;
        progress.style.width = pct + '%';
      }
      window.addEventListener('scroll', updateProgress, {passive:true});
      updateProgress();

      tabs.forEach(function(tab){
        tab.addEventListener('click', function(){
          const id = tab.dataset.tab;
          tabs.forEach(function(t){t.classList.toggle('active', t === tab)});
          schedules.forEach(function(s){s.classList.toggle('active', s.id === id)});
        });
      });

      galleryBtns.forEach(function(btn){
        btn.addEventListener('click', function(){
          galleryMain.src = btn.dataset.img;
          galleryTitle.textContent = btn.dataset.title;
          galleryText.textContent = btn.dataset.text;
        });
      });
      function rotateGallery(){
        if(!galleryBtns.length) return;
        const btn = galleryBtns[autoGalleryIndex % galleryBtns.length];
        galleryMain.src = btn.dataset.img;
        galleryTitle.textContent = btn.dataset.title;
        galleryText.textContent = btn.dataset.text;
        autoGalleryIndex++;
      }
      setInterval(rotateGallery, 4200);

      if(stage && posterCard){
        stage.addEventListener('pointermove', function(e){
          const r = stage.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - .5;
          const y = (e.clientY - r.top) / r.height - .5;
          posterCard.style.transform = 'rotateY(' + (-11 + x*10) + 'deg) rotateX(' + (5 - y*8) + 'deg) translateY(-4px)';
        });
        stage.addEventListener('pointerleave', function(){
          posterCard.style.transform = '';
        });
      }

      function resizeCanvas(){
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(dpr,0,0,dpr,0,0);
        const count = Math.min(90, Math.floor(window.innerWidth / 9));
        particles = Array.from({length: count}, function(){
          return {
            x: Math.random()*window.innerWidth,
            y: Math.random()*window.innerHeight,
            vx: (Math.random()-.5)*.35,
            vy: (Math.random()-.5)*.35,
            r: Math.random()*2.2+0.8,
            a: Math.random()*.55+.12,
            c: Math.random()>.72 ? '#e85bff' : (Math.random()>.5 ? '#9cff00' : '#ffe236')
          };
        });
      }
      function drawParticles(){
        ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
        particles.forEach(function(p){
          p.x += p.vx; p.y += p.vy;
          if(p.x < -20) p.x = window.innerWidth + 20;
          if(p.x > window.innerWidth + 20) p.x = -20;
          if(p.y < -20) p.y = window.innerHeight + 20;
          if(p.y > window.innerHeight + 20) p.y = -20;
          ctx.globalAlpha = p.a;
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame(drawParticles);
      }
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas, {passive:true});
      drawParticles();
    })();
  
