(()=>{
const $=(s,r=document)=>r.querySelector(s);
const stage=$('#stage');

/* ---------- 工序配置（改这里就能改流程） ---------- */
const STAGES=['核对','设计排版','客户确认','打印','裁剪','印花','返单'];
const DEPT  =['核对','设计','设计','打印','裁剪','印花','返单'];
const stageLabel=i=>DEPT[i]===STAGES[i]?STAGES[i]:DEPT[i]+' · '+STAGES[i];
const STATUS={waiting:'等待',doing:'进行中',problem:'有问题',confirm:'待确认',done:'已完成',cancel:'已取消'};
const CHIPS=['全部','我在做的',...STAGES];
const TABS=['进行中','有问题','待确认','已完成','已取消'];
const hhmm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');

const IC={
 sig:'<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>',
 wifi:'<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 4.2a9.5 9.5 0 0 1 13 0M4 7a6 6 0 0 1 8 0"/><circle cx="8" cy="10" r="1.3" fill="currentColor" stroke="none"/></svg>',
 bat:'<svg width="26" height="12" viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/><rect x="23.5" y="4" width="1.8" height="4" rx="1" fill="currentColor" opacity=".45"/></svg>',
 search:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="9" y="3" width="6" height="11.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
 kb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/></svg>',
 list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01" stroke-width="3"/></svg>',
 bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 1.8H4.4z"/><path d="M10 21h4" stroke-linecap="round"/></svg>',
 user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.4-4 4.4-6 8-6s6.6 2 8 6" stroke-linecap="round"/></svg>',
 warn:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.3" stroke-linecap="round"/></svg>',
 ok:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
 info:'<svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
 bang:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M12 6v8M12 18v.5"/></svg>',
 play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
 pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z"/></svg>'
};

/* ---------- 演示数据 ---------- */
function baseModel(){
  const o=x=>Object.assign({status:'waiting',tone:'',hist:[],by:'老板',ship:'送货',size:'',craft:'烫画',raw:''},x);
  return {clock:9*60+41,seq:10,log:[],orders:[
    o({id:'chen',no:'YH260927-004',cust:'陈总',qty:300,color:'红',garment:'文化衫',gsm:160,pos:'后背',size:'A3',stage:5,status:'problem',due:'超期 · 09/26',tone:'red',issue:'烫画膜不够，差 80 张',t:7,
      raw:'陈总的单，红色文化衫 160 克，300 件，后背 A3 烫画，26 号送货。',
      hist:[['09-25 22:50','老板','说一句下单'],['09-25 22:53','阿松','核对完'],['09-26 10:15','春雪','排版完，发客户看图'],['09-26 11:02','春雪','客户确认了'],['09-26 15:30','奥德彪','打印完'],['09-26 16:48','奥德彪','裁剪完'],['09-27 09:12','小宁','报问题：烫画膜不够，差 80 张',1]]}),
    o({id:'wan',no:'YH260928-002',cust:'万先生',qty:60,color:'藏青',garment:'卫衣',gsm:320,pos:'前胸',size:'A4',stage:1,due:'急 · 今天交',tone:'amber',urgent:true,t:6}),
    o({id:'huang',no:'YH260926-011',cust:'黄老板',qty:500,color:'白',garment:'T恤',gsm:180,pos:'前胸',size:'A4',stage:3,status:'doing',doer:'奥德彪',due:'09/30',t:5}),
    o({id:'lin',no:'YH260925-007',cust:'小林',qty:40,color:'卡其',garment:'卫衣',gsm:280,pos:'后背',size:'A3',stage:6,status:'doing',doer:'阿松',due:'09/29 · 自取',t:4,ship:'自取'}),
    o({id:'liu',no:'YH260926-003',cust:'刘总',qty:1000,color:'白',garment:'文化衫',gsm:140,pos:'前胸',size:'A4',stage:4,due:'10/02',t:3}),
    o({id:'qiang',no:'YH260927-009',cust:'阿强',qty:80,color:'黑',garment:'T恤',gsm:200,pos:'左胸',size:'10cm',stage:0,due:'10/03',t:2}),
    o({id:'zhou',no:'YH260927-001',cust:'周姐',qty:150,color:'灰',garment:'卫衣',gsm:300,pos:'后背',size:'A3',stage:2,status:'confirm',due:'10/01',t:1})
  ]};
}
const LI=()=>({id:'li',no:'YH260928-001',cust:'李姐',qty:120,color:'黑',garment:'卫衣',gsm:280,pos:'前胸',size:'A4',craft:'烫画',due:'10/02',tone:'',ship:'送货',hist:[],by:'春雪',
  raw:'李姐的单，黑色卫衣 280 克，120 件，前胸 A4 烫画，10 月 2 号送货。'});

const M={
  get:(m,id)=>m.orders.find(o=>o.id===id),
  log(m,o,who,text,dt,warn){m.clock+=dt;m.log.push({time:hhmm(m.clock),who,text,id:o.id,warn});o.t=++m.seq;},
  add(m,o,who){o.stage=0;o.status='waiting';m.orders.push(o);this.log(m,o,who,`下单：${o.cust}`,1);},
  start(m,id,who){const o=this.get(m,id);o.status='doing';o.doer=who;this.log(m,o,who,`开始：${o.cust} · ${STAGES[o.stage]}`,2);},
  complete(m,id,who){const o=this.get(m,id);const from=STAGES[o.stage];
    if(o.stage<6){o.stage++;o.status=o.stage===2?'confirm':'waiting';}else o.status='done';
    o.doer=null;this.log(m,o,who,`完成：${o.cust} · ${from} → ${STAGES[o.stage]}`,21);},
  problem(m,id,who,text){const o=this.get(m,id);o.prev=o.status;o.status='problem';o.issue=text;this.log(m,o,who,`报问题：${o.cust} · ${text}`,6,1);},
  resolve(m,id,who){const o=this.get(m,id);o.status=(o.prev&&o.prev!=='problem')?o.prev:'doing';o.issue=null;this.log(m,o,who,`问题已处理：${o.cust}`,12);},
  cancel(m,id,who,reason){const o=this.get(m,id);o.status='cancel';o.reason=reason;o.issue=null;this.log(m,o,who,`取消：${o.cust} · ${reason}`,3);}
};
const rank=o=>o.status==='problem'?0:(o.urgent&&o.status!=='cancel'&&o.status!=='done')?1:o.status==='doing'?2:o.status==='waiting'?3:o.status==='confirm'?4:5;
const sortO=(a,b)=>rank(a)-rank(b)||b.t-a.t;
let model=baseModel();

/* ---------- player clock（所有动效都跟它走，暂停/慢放都一致） ---------- */
const ease=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
const P={i:0,t:0,playing:false,speed:1,cues:[],fi:0,tw:[],lt:[],
  tween(dur,fn){const o={t0:this.t,dur,fn};this.tw.push(o);fn(0);},
  later(ms,fn){this.lt.push({t:this.t+ms,fn});},
  step(dt){if(!this.playing)return;this.t+=dt*this.speed;this.flush();
    if(this.t>=SC[this.i].dur){if(this.i<SC.length-1)this.goto(this.i+1,true);else{this.playing=false;UI.sync();}}},
  flush(){
    while(this.fi<this.cues.length&&this.cues[this.fi].t<=this.t){const c=this.cues[this.fi++];try{c.fn()}catch(e){console.error(e)}}
    this.tw=this.tw.filter(o=>{const p=Math.min(1,(this.t-o.t0)/o.dur);o.fn(ease(p));return p<1;});
    const due=this.lt.filter(o=>o.t<=this.t);this.lt=this.lt.filter(o=>o.t>this.t);due.forEach(o=>o.fn());
  },
  goto(i,smooth){i=Math.max(0,Math.min(SC.length-1,i));this.i=i;this.t=0;this.fi=0;this.tw=[];this.lt=[];
    setupScene(i,smooth);const c=[];SC[i].cues&&SC[i].cues(api(c));c.sort((a,b)=>a.t-b.t);this.cues=c;UI.sync();}
};

/* ---------- finger ---------- */
const F={el:$('#finger'),
  to(target){if(!target)return;const p=stageXY(target);this.el.style.transform=`translate(${p.x}px,${p.y}px)`;this.el.classList.add('on');},
  tap(){this.el.classList.remove('tap');void this.el.offsetWidth;this.el.classList.add('tap');},
  down(on){this.el.classList.toggle('down',on);},
  who(n){this.el.querySelector('.f-tag').textContent=n;},
  hide(){this.el.classList.remove('on','down');}
};
let SCALE=1;
function stageXY(el){const r=el.getBoundingClientRect(),s=stage.getBoundingClientRect();return{x:(r.left+r.width/2-s.left)/SCALE,y:(r.top+r.height/2-s.top)/SCALE};}

/* ---------- phone ---------- */
const SAID=[['李姐',0],['的单，'],['黑色卫衣 280 克',1],['，'],['120 件',2],['，'],['前胸 A4 烫画',3],['，'],['10 月 2 号送货',4],['。']];
const DRAFT=[['客户','李姐'],['衣服','黑 卫衣 · 280克'],['数量','120 件'],['印花','前胸 A4 · 烫画'],['交货','10/02 · 送货']];
function phoneHTML(user){
  const bars=Array.from({length:30},(_,i)=>`<i style="--h:${8+Math.round(Math.abs(Math.sin(i*1.7))*22)}px;animation-delay:-${(i*.13%0.9).toFixed(2)}s"></i>`).join('');
  return `<div class="frame"><div class="screen">
  <div class="island"></div>
  <div class="sbar"><span>9:41</span><span class="sb-ic">${IC.sig}${IC.wifi}${IC.bat}</span></div>
  <section class="login">
    <h2>你叫什么？</h2>
    <p>点一个用过的名字就进，也可以填新名字。厂里人人什么都能做，不分工位。</p>
    <div class="lg-names">${['春雪','奥德彪','阿松','小宁'].map(n=>`<span class="lg-name" data-n="${n}">${n}</span>`).join('')}</div>
    <div class="lg-input ph">你的名字，比如春雪</div>
    <div class="btn b-orange lg-go" style="font-size:19px;letter-spacing:.4em;height:54px">进入</div>
  </section>
  <section class="app">
    <header class="hdr"><div class="hdr-in"><b class="brand">灵魂印花</b><span class="who">${user}</span><span class="live"><i></i>实时</span></div></header>
    <div class="views">
      <div class="view v-todo">
        <div class="t-top">
          <div class="search">${IC.search}<span>搜客户、单号、款式、备注</span></div>
          <div class="chips">${CHIPS.map(c=>`<span class="chip" data-chip="${c}">${c}</span>`).join('')}</div>
          <div class="stats"><div class="stat"><small>等待</small><b class="n-wait">0</b></div><div class="stat"><small>进行中</small><b class="n-doing">0</b></div><div class="stat"><small>有问题</small><b class="n-prob">0</b></div></div>
          <div class="tabs">${TABS.map(t=>`<span class="tab" data-tab="${t}">${t}<b></b></span>`).join('')}</div>
        </div>
        <div class="list"></div>
      </div>
      <div class="view v-voice off" data-s="idle">
        <div class="vc-top">
          <div class="vc-seg"><span class="on">${IC.mic}说一句</span><span>${IC.kb}打一句</span></div>
          <h3>说一句，就是一张单</h3>
          <p>像发微信语音一样讲：客户、衣服、件数、印在哪、哪天要。</p>
        </div>
        <div class="vc-said"><label>你说的</label><p class="vc-text"></p></div>
        <div class="vc-draft">
          <div class="dr-h"><b>订单草稿</b><span class="dr-tag">AI 听懂的 · 等你确认</span><span class="dr-think"><i></i><i></i><i></i>正在听懂</span></div>
          <div class="dr-empty">说完，这里出一张草稿</div>
          <dl style="margin:6px 0 0">${DRAFT.map(([k,v],i)=>`<div class="dr-row" data-k="${i}"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        </div>
        <div class="vc-foot">
          <div class="wave">${bars}</div>
          <div class="mic"><span class="mic-ring"></span>${IC.mic}</div>
          <div class="mic-tip">按住说话</div>
          <div class="vc-acts"><div class="btn b-orange ok">确认下单</div><div class="btn ghost">改一下</div></div>
        </div>
      </div>
    </div>
    <nav class="nav">
      <span class="ni" data-nav="voice">${IC.mic}<em>说一句</em></span>
      <span class="ni" data-nav="todo">${IC.list}<em>待办</em><i class="badge b-todo">1</i></span>
      <span class="ni" data-nav="feed">${IC.bell}<em>动态</em></span>
      <span class="ni" data-nav="me">${IC.user}<em>我</em></span>
    </nav>
  </section>
  <div class="toast"><span class="t-ic"></span><span class="t-tx"></span></div>
  <div class="dim d1"></div>
  <div class="sheet sh-detail"><div class="grab"></div><div class="sh-body"></div></div>
  <div class="sheet sh-problem"><div class="grab"></div><div class="sh-pad">
    <h4 class="pb-name"></h4><p class="sh-sub">遇到什么问题？点一个，再补一句。</p>
    <div class="rchips">${['缺膜','缺墨','打印机故障','烫画机故障','衣服有瑕疵','客户改稿'].map(r=>`<span class="rc" data-r="${r}">${r}</span>`).join('')}</div>
    <div class="field pb-input ph">补一句（可以不填）</div>
    <div class="btn b-red pb-ok">报问题</div>
  </div></div>
  <div class="dim d2"></div>
  <div class="sheet sh-cancel"><div class="grab"></div><div class="sh-pad">
    <h4 class="cc-name">取消这张单？</h4><p class="sh-sub">取消不会删掉，单子放进「已取消」，随时查得到。</p>
    <div class="rchips">${['客户不要了','下错单','验收取消','其他'].map(r=>`<span class="rc" data-r="${r}">${r}</span>`).join('')}</div>
    <div class="row2" style="margin-top:20px"><div class="btn ghost" style="margin:0">再想想</div><div class="btn b-red cc-ok" style="margin:0">确认取消</div></div>
  </div></div>
  <div class="spot"><b></b></div>
  <div class="homebar"></div>
</div></div>`;
}
function segClasses(o){return STAGES.map((_,i)=>{
  if(o.status==='done'||i<o.stage)return 'g';
  if(i===o.stage)return o.status==='problem'?'r':o.status==='cancel'?'x':(o.status==='doing'?'b live':'b');
  return '';});}
function actsHTML(o){
  if(o.status==='problem')return '<div class="btn main b-green">问题已处理</div>';
  const m=o.status==='waiting'?['b-blue','开始']:o.status==='doing'?['b-green','完成']:o.status==='confirm'?['b-violet','客户确认了']:null;
  return m?`<div class="btn main ${m[0]}">${m[1]}</div><div class="btn side">有问题</div>`:'';
}
class Phone{
  constructor(root,user){this.root=root;this.user=user;root.innerHTML=phoneHTML(user);
    this.screen=root.querySelector('.screen');this.list=this.q('.list');this.chipsEl=this.q('.chips');this.spotEl=this.q('.spot');
    this.cards=new Map();this.ui={};this.tk=0;
    this.q('.vc-text').innerHTML=SAID.map(([s,k])=>`<span${k!=null?` data-k="${k}"`:''}></span>`).join('')+'<i class="caret"></i>';}
  q(s){return this.screen.querySelector(s)}
  card(id){return this.cards.get(id)}
  mainBtn(id){const c=this.cards.get(id);return c&&c.querySelector('.btn.main')}
  sideBtn(id){const c=this.cards.get(id);return c&&c.querySelector('.btn.side')}
  setScreen(s){this.ui.screen=s;this.screen.classList.toggle('is-login',s==='login');this.screen.classList.toggle('is-app',s!=='login');}
  setView(v){this.ui.view=v;this.q('.v-todo').classList.toggle('off',v!=='todo');this.q('.v-voice').classList.toggle('off',v!=='voice');
    this.screen.querySelectorAll('.ni').forEach(n=>n.classList.toggle('on',n.dataset.nav===v));}
  reset(o={}){const u=this.ui;u.tab=o.tab||'进行中';u.chip=o.chip||'全部';u.scroll=o.scroll??0;
    this.setScreen(o.screen||'app');this.setView(o.view||'todo');
    this.voice('idle');this.typeSaid(0);this.screen.querySelectorAll('.dr-row').forEach(r=>r.classList.remove('show'));
    this.screen.querySelectorAll('.vc-text span').forEach(s=>s.classList.remove('hl'));
    this.q('.mic-tip').textContent='按住说话';this.q('.vc-acts .ok').textContent='确认下单';
    this.screen.querySelectorAll('.lg-name').forEach(n=>n.classList.remove('on'));const li=this.q('.lg-input');li.textContent='你的名字，比如春雪';li.classList.add('ph');
    this.closeSheets();this.unspot();this.toastOff();}
  afterSetup(){const u=this.ui;
    if(typeof u.scroll==='string'){const el=this.cards.get(u.scroll);this.list.scrollTop=el?el.offsetTop-12:0;}else this.list.scrollTop=u.scroll;
    const c=this.q(`[data-chip="${u.chip}"]`);const idx=CHIPS.indexOf(u.chip);this.chipsEl.scrollLeft=idx>3&&c?c.offsetLeft-110:0;}
  voice(s){this.q('.v-voice').dataset.s=s;}
  typeSaid(p){const total=SAID.reduce((a,[s])=>a+s.length,0);let n=Math.round(p*total);
    this.screen.querySelectorAll('.vc-text span').forEach((sp,i)=>{const s=SAID[i][0];const k=Math.max(0,Math.min(s.length,n));sp.textContent=s.slice(0,k);n-=k;});}
  draftRow(k){this.q(`.dr-row[data-k="${k}"]`).classList.add('show');const sp=this.q(`.vc-text span[data-k="${k}"]`);sp&&sp.classList.add('hl');}
  filter(o){const t=this.ui.tab,c=this.ui.chip;
    let ok=t==='进行中'?!['done','cancel'].includes(o.status):t==='有问题'?o.status==='problem':t==='待确认'?o.status==='confirm':t==='已完成'?o.status==='done':o.status==='cancel';
    if(c==='我在做的')ok=ok&&o.status==='doing'&&o.doer===this.user;else if(c!=='全部')ok=ok&&STAGES[o.stage]===c;return ok;}
  render(m,fx,instant){
    const c={wait:0,doing:0,prob:0,act:0,conf:0,done:0,cancel:0};
    m.orders.forEach(o=>{const s=o.status;if(s==='cancel')c.cancel++;else if(s==='done')c.done++;else{c.act++;if(s==='waiting'||s==='confirm')c.wait++;if(s==='doing')c.doing++;if(s==='problem')c.prob++;if(s==='confirm')c.conf++;}});
    const setN=(el,v)=>{if(el.textContent!==String(v)){el.textContent=v;if(!instant){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}}};
    setN(this.q('.n-wait'),c.wait);setN(this.q('.n-doing'),c.doing);setN(this.q('.n-prob'),c.prob);
    const tc={'进行中':c.act,'有问题':c.prob||'','待确认':c.conf||'','已完成':c.done||'','已取消':c.cancel||''};
    this.screen.querySelectorAll('.tab').forEach(t=>{t.classList.toggle('on',t.dataset.tab===this.ui.tab);t.querySelector('b').textContent=tc[t.dataset.tab];});
    this.screen.querySelectorAll('.chip').forEach(ch=>ch.classList.toggle('on',ch.dataset.chip===this.ui.chip));
    const bt=this.q('.b-todo');bt.textContent=c.prob;bt.hidden=!c.prob;
    this.renderList(m,fx,instant);}
  renderList(m,fx,instant){
    const L=this.list;const want=m.orders.filter(o=>this.filter(o)).sort(sortO);
    const first=new Map();this.cards.forEach((el,id)=>first.set(id,el.offsetTop));
    const keep=new Set(want.map(o=>o.id));
    this.cards.forEach((el,id)=>{if(!keep.has(id)){el.remove();this.cards.delete(id);}});
    want.forEach((o,idx)=>{let el=this.cards.get(o.id),isNew=false;
      if(!el){el=makeCard(o);this.cards.set(o.id,el);isNew=true;}
      updateCard(el,o);
      if(L.children[idx]!==el)L.insertBefore(el,L.children[idx]||null);
      if(isNew&&!instant){el.classList.add('enter');}
      if(fx&&fx.id===o.id&&!instant&&(fx.self||fx.who!==this.user)){el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');}
    });
    if(!instant)want.forEach(o=>{const el=this.cards.get(o.id);if(!first.has(o.id))return;const d=first.get(o.id)-el.offsetTop;
      if(Math.abs(d)>1){el.style.transition='none';el.style.transform=`translateY(${d}px)`;void el.offsetWidth;el.style.transition='';el.style.transform='';}});
  }
  scrollTo(y,dur=700){const L=this.list,from=L.scrollTop,max=L.scrollHeight-L.clientHeight,to=Math.max(0,Math.min(max,y));P.tween(dur,p=>L.scrollTop=from+(to-from)*p);}
  scrollToCard(id,dur){const el=this.cards.get(id);if(el)this.scrollTo(el.offsetTop-12,dur);}
  toast(text,kind='ok',ms=2800){const t=this.q('.toast');t.className='toast on '+kind;t.querySelector('.t-ic').innerHTML=IC[kind==='warn'?'bang':kind];t.querySelector('.t-tx').textContent=text;
    const tk=++this.tk;P.later(ms,()=>{if(tk===this.tk)t.classList.remove('on');});}
  toastOff(){this.tk++;this.q('.toast').classList.remove('on');}
  spot(el,n,pad=6){if(!el)return;const s=this.spotEl,sr=this.screen.getBoundingClientRect(),k=sr.width/390,r=el.getBoundingClientRect();
    const box={left:((r.left-sr.left)/k-pad)+'px',top:((r.top-sr.top)/k-pad)+'px',width:(r.width/k+pad*2)+'px',height:(r.height/k+pad*2)+'px'};
    if(!s.classList.contains('on')){s.style.transition='none';Object.assign(s.style,box);void s.offsetWidth;s.style.transition='';}else Object.assign(s.style,box);
    s.querySelector('b').textContent=n;s.classList.add('on');}
  unspot(){this.spotEl.classList.remove('on');}
  openDetail(m,id){const o=M.get(m,id);const hist=[...o.hist,...m.log.filter(l=>l.id===id).map(l=>[l.time,l.who,l.text,l.warn])];
    const body=this.q('.sh-detail .sh-body');body.scrollTop=0;
    body.innerHTML=`<h3 class="dt-name">${o.cust}</h3>
      <p class="dt-sub"><span class="mono">${o.no}</span> · ${DEPT[o.stage]} · ${o.by} 下的单</p>
      <div class="segs big">${segClasses(o).map(c=>`<i class="${c}"></i>`).join('')}</div>
      ${o.status==='problem'?`<div class="dt-alert">${IC.warn}${o.issue}</div>`:''}
      <dl class="dt-f"><dt>衣服</dt><dd>${o.color} ${o.garment} ${o.gsm}克</dd><dt>数量</dt><dd>${o.qty} 件</dd>
        <dt>印花</dt><dd>${o.pos} ${o.size} · ${o.craft}</dd><dt>交货</dt><dd class="${o.tone}">${o.due} · ${o.ship}</dd></dl>
      <dl class="dt-f dt-raw"><dt>原话</dt><dd class="raw">“${o.raw}”</dd></dl>
      <div class="dt-tl"><h5>记录</h5><ol>${hist.map(h=>`<li class="${h[3]?'w':''}"><time>${h[0]}</time><b>${h[1]}</b>${h[2]}</li>`).join('')}</ol></div>
      <div class="dt-acts">${o.status==='problem'?'<div class="btn b-green">问题已处理</div>':''}
        <div class="dt-acts2" style="display:flex;flex-direction:column;gap:12px"><div class="row2"><div class="btn ghost">修改</div><div class="btn ghost">退回上一步</div></div><div class="btn b-red dt-cancel">取消订单</div></div></div>`;
    this.q('.d1').classList.add('on');this.q('.sh-detail').classList.add('on');}
  sheetScrollTo(el,dur=700){const body=this.q('.sh-detail .sh-body');const from=body.scrollTop,max=body.scrollHeight-body.clientHeight;
    const to=el==='end'?max:Math.max(0,Math.min(max,el.offsetTop-14));P.tween(dur,p=>body.scrollTop=from+(to-from)*p);}
  openProblem(m,id){const o=M.get(m,id);this.q('.pb-name').textContent=`${o.cust} · ${STAGES[o.stage]}`;
    this.screen.querySelectorAll('.sh-problem .rc').forEach(r=>r.classList.remove('on'));const f=this.q('.pb-input');f.textContent='补一句（可以不填）';f.classList.add('ph');
    this.q('.d1').classList.add('on');this.q('.sh-problem').classList.add('on');}
  openCancel(m,id){const o=M.get(m,id);this.q('.cc-name').textContent=`取消${o.cust}这张单？`;
    this.screen.querySelectorAll('.sh-cancel .rc').forEach(r=>r.classList.remove('on'));
    this.q('.d2').classList.add('on');this.q('.sh-cancel').classList.add('on');}
  closeSheets(){this.screen.querySelectorAll('.sheet,.dim').forEach(e=>e.classList.remove('on'));}
}
function makeCard(o){const el=document.createElement('div');el.className='card';el.dataset.id=o.id;
  el.innerHTML=`<div class="c-top"><div class="c-name"></div><div class="pill"><i></i><span></span></div></div><div class="c-spec"></div><div class="segs">${'<i></i>'.repeat(7)}</div><div class="c-row"><b class="c-stage"></b><span class="c-due"></span></div><div class="c-issue"><div><div class="box">${IC.warn}<span></span></div></div></div><div class="c-acts"></div>`;
  el.addEventListener('animationend',e=>{if(e.target!==el)return;if(e.animationName==='cin')el.classList.remove('enter');if(e.animationName==='cflash')el.classList.remove('flash');});
  return el;}
function updateCard(el,o){
  const tone=o.status==='problem'?'red':o.tone;el.classList.toggle('tone-red',tone==='red');el.classList.toggle('tone-amber',tone==='amber');el.classList.toggle('is-cancel',o.status==='cancel');
  el.querySelector('.c-name').textContent=o.cust;
  const pill=el.querySelector('.pill');pill.className='pill st-'+o.status;pill.querySelector('span').textContent=STATUS[o.status];
  el.querySelector('.c-spec').textContent=`${o.qty} 件 · ${o.color}${o.garment} · ${o.gsm}克 · ${o.pos} ${o.craft}`;
  const cls=segClasses(o);el.querySelectorAll('.segs i').forEach((s,i)=>s.className=cls[i]);
  el.querySelector('.c-stage').textContent=o.status==='cancel'?`已取消 · ${o.reason}`:(o.status==='doing'&&o.doer?`${stageLabel(o.stage)} · ${o.doer}在做`:stageLabel(o.stage));
  const due=el.querySelector('.c-due');due.textContent=o.due;due.className='c-due '+(o.tone||'');
  const iss=el.querySelector('.c-issue');const on=o.status==='problem'&&!!o.issue;iss.classList.toggle('on',on);if(on)iss.querySelector('.box span').textContent=o.issue;
  const a=el.querySelector('.c-acts'),h=actsHTML(o);if(a.dataset.h!==h){a.innerHTML=h;a.dataset.h=h;}
}

/* ---------- board ---------- */
const Board={cols:[],els:new Map(),
  init(){const wrap=$('#board .bd-cols');wrap.innerHTML=STAGES.map(s=>`<div class="col"><div class="col-h">${s}<b>0</b></div><div class="col-list"></div></div>`).join('');
    this.cols=[...wrap.children].map(c=>({h:c.querySelector('.col-h b'),list:c.querySelector('.col-list')}));},
  reset(){this.cols.forEach(c=>c.list.innerHTML='');this.els.clear();},
  render(m,fx,instant){
    STAGES.forEach((_,ci)=>{const col=this.cols[ci];const want=m.orders.filter(o=>o.stage===ci&&!['done','cancel'].includes(o.status)).sort(sortO);
      col.h.textContent=want.length;
      want.forEach((o,idx)=>{let el=this.els.get(o.id);if(el&&el.parentNode!==col.list){el.remove();el=null;}
        let isNew=false;if(!el){el=document.createElement('div');el.className='mc';el.dataset.id=o.id;this.els.set(o.id,el);isNew=true;
          el.addEventListener('animationend',e=>{if(e.target!==el)return;if(e.animationName==='cin')el.classList.remove('enter');if(e.animationName==='cflash')el.classList.remove('flash');});}
        const tone=o.status==='problem'?'red':o.tone;el.classList.toggle('tone-red',tone==='red');el.classList.toggle('tone-amber',tone==='amber');
        const st=o.status==='doing'&&o.doer?`${o.doer} 在做`:STATUS[o.status];
        const html=`<b class="mc-n">${o.cust}${o.urgent?'<em>急</em>':''}</b><span class="mc-s">${o.qty}件 · ${o.color}${o.garment}</span><span class="mc-st st-${o.status}"><i></i>${st}</span>`;
        if(el.dataset.h!==html){el.innerHTML=html;el.dataset.h=html;}
        if(col.list.children[idx]!==el)col.list.insertBefore(el,col.list.children[idx]||null);
        if(isNew&&!instant)el.classList.add('enter');
        if(fx&&fx.id===o.id&&!instant){el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');
          el.querySelectorAll('.tag').forEach(x=>x.remove());const t=document.createElement('span');t.className='tag';t.textContent=`${fx.who} · 刚刚`;el.appendChild(t);}
      });
      [...col.list.children].forEach(el=>{if(!want.some(o=>o.id===el.dataset.id)){el.remove();if(this.els.get(el.dataset.id)===el)this.els.delete(el.dataset.id);}});
    });}
};

/* ---------- sync pulse ---------- */
const Sync={dot:$('#dot'),lab:$('#slabel'),
  reset(){this.dot.classList.remove('on');this.lab.classList.remove('on');},
  pulse(rev){const a1=$('#arc1'),a2=$('#arc2');const seq=rev?[[a2,1],[a1,1]]:[[a1,0],[a2,0]];
    const run=([a,r])=>{const L=a.getTotalLength();P.tween(520,p=>{const pt=a.getPointAtLength(r?L*(1-p):L*p);this.dot.setAttribute('cx',pt.x);this.dot.setAttribute('cy',pt.y);});};
    this.dot.classList.add('on');this.lab.classList.add('on');run(seq[0]);P.later(540,()=>run(seq[1]));
    P.later(1100,()=>this.dot.classList.remove('on'));P.later(2600,()=>this.lab.classList.remove('on'));}
};

/* ---------- boss notification ---------- */
const Notif={el:$('#notif'),show(t,d){this.el.querySelector('.n-t').textContent=t;this.el.querySelector('.n-d').textContent=d;this.el.classList.add('on');},hide(){this.el.classList.remove('on');}};

/* ---------- caption ---------- */
const Cap={el:$('#cap'),
  render(sc){const c=sc.cap,el=this.el;el.classList.remove('swap');void el.offsetWidth;el.classList.add('swap');
    el.querySelector('.c-eye').innerHTML=sc.step?`<span>${String(sc.step).padStart(2,'0')}</span><small>/ 07 · ${sc.name}</small>`:`<span>${c.eye}</span>`;
    el.querySelector('.c-title').innerHTML=c.title;el.querySelector('.c-lead').innerHTML=c.lead||'';
    el.querySelector('.c-pts').innerHTML=(c.pts||[]).map((p,i)=>`<li><span class="n">${i+1}</span><span>${p}</span></li>`).join('');
    const ex=el.querySelector('.c-extra');ex.innerHTML=c.extra||'';ex.hidden=!c.extra;
    const r=el.querySelector('.c-rule');r.innerHTML=c.rule?`<b>规矩</b><span>${c.rule}</span>`:'';r.hidden=!c.rule;},
  pt(i){[...this.el.querySelector('.c-pts').children].forEach((li,j)=>{li.classList.toggle('on',j===i);li.classList.toggle('past',j<i);});},
  log(m,instant){const ol=this.el.querySelector('.logbox ol');if(!ol){this.lastN=m.log.length;return;}
    const items=m.log.slice(-3);const nNew=instant?0:Math.min(items.length,m.log.length-(this.lastN||0));
    ol.innerHTML=items.map((l,i)=>`<li class="${i>=items.length-nNew?'new':''}"><time>${l.time}</time><span><b>${l.who}</b> ${l.text}</span></li>`).join('');
    this.lastN=m.log.length;}
};
const LEGEND=`<div class="legend"><div class="lg-bar"><i class="g"></i><i class="g"></i><i class="g"></i><i class="g"></i><i class="g"></i><i class="r"></i><i></i></div>
<div class="lg-names">${STAGES.map(s=>`<span>${s}</span>`).join('')}</div>
<div class="lg-keys"><span><i class="g"></i>做完了</span><span><i class="b"></i>正在做</span><span><i class="r"></i>卡住了</span><span><i></i>还没到</span></div></div>`;
const LOGBOX=`<div class="logbox"><h6>系统自动记的</h6><ol></ol></div>`;

/* ---------- chapter bar & outro ---------- */
const Chap={el:$('#chap'),init(){this.el.innerHTML=SC.filter(s=>s.step).map(s=>`<div class="cs"><i></i><span>${s.name}</span></div>`).join('');},
  render(i){const st=SC[i].step||(SC[i].key==='outro'?8:0);[...this.el.children].forEach((c,j)=>{c.classList.toggle('done',j<st-1);c.classList.toggle('cur',j===st-1);});}};
const Outro={init(){$('#outro .o-bar').innerHTML=STAGES.map(s=>`<div class="o-seg"><i></i><span>${s}</span></div>`).join('')+
    `<div class="o-loop"><svg viewBox="0 0 150 56"><path d="M40 4 C40 40 110 40 110 4"/><path d="M103 12 L110 3 L117 12" style="stroke-dasharray:none"/></svg><span>有问题 → 报 → 处理 → 接着走</span></div>`;},
  reset(){document.querySelectorAll('#outro .on,#outro .g,#outro .r').forEach(e=>e.classList.remove('on','g','r'));},
  seg(k,c){const s=document.querySelectorAll('#outro .o-seg')[k];s.classList.remove('g','r');if(c)s.classList.add(c);}};

/* ---------- phones ---------- */
const A=new Phone($('#phA'),'春雪');
const B=new Phone($('#phB'),'奥德彪');
function renderAll(fx,instant){A.render(model,fx,instant);B.render(model,fx,instant);Board.render(model,fx,instant);Cap.log(model,instant);}

/* ---------- cue helpers ---------- */
function api(c){return{
  at:(t,fn)=>c.push({t,fn}),
  tap:(t,get,fn,who)=>{c.push({t,fn:()=>{if(who)F.who(who);F.to(get());}});c.push({t:t+560,fn:()=>{F.tap();fn&&fn();}});},
  move:(t,get)=>c.push({t,fn:()=>F.to(get())}),
  pt:(t,i)=>c.push({t,fn:()=>Cap.pt(i)}),
  spot:(t,ph,get,n,pad)=>c.push({t,fn:()=>ph.spot(get(),n,pad)}),
  unspot:(t,ph)=>c.push({t,fn:()=>ph.unspot()}),
  hide:t=>c.push({t,fn:()=>F.hide()})
};}

/* ---------- scenes ---------- */
const SC=[
 {key:'intro',name:'片头',layout:'intro',dur:7000,
  cap:{eye:'灵魂印花 · 交互演示',title:'一张单，<br>从一句话到出货',
    lead:'厂里人人拿手机干活，电脑只当看板。走一遍：单子怎么下、怎么做、卡住了怎么办、全厂怎么同步。',
    extra:'<div class="intro-meta">演示数据 · 约 2 分半 · 空格暂停，← → 切换</div>'},
  init(){A.reset({screen:'login'});}},
 {key:'login',step:1,name:'进门',layout:'solo',dur:9000,
  cap:{title:'点名字就进',lead:'不用账号密码，也不分工位。厂里人人什么都能做。',
    pts:['点一个用过的名字，直接进','新来的同事，填个名字就行','进来先看「待办」：现在该干的活']},
  init(){A.reset({screen:'login'});},
  cues(a){a.pt(0,0);
    a.tap(900,()=>A.q('.lg-name[data-n="春雪"]'),()=>{A.q('.lg-name[data-n="春雪"]').classList.add('on');const f=A.q('.lg-input');f.classList.remove('ph');P.tween(300,p=>f.textContent='春雪'.slice(0,Math.max(1,Math.round(p*2))));});
    a.pt(2600,1);a.move(2700,()=>A.q('.lg-input'));
    a.tap(3900,()=>A.q('.lg-go'),()=>A.setScreen('app'));
    a.pt(5200,2);a.hide(4900);}},
 {key:'voice',step:2,name:'下单',layout:'solo',dur:21000,
  cap:{title:'说一句，就是一张单',lead:'按住说话，像发微信语音一样。系统把原话拆成客户、衣服、件数、印花、交期，出一张草稿。',
    pts:['按住说话，松开就开始听懂','拆出来的字段，一条条对一遍','点「确认下单」，单子流到第一道「核对」'],
    rule:'AI 只出草稿，人确认了才算单。原话一直留着，随时能翻。'},
  apply(m){M.add(m,LI(),'春雪');},
  init(){A.reset({});},
  cues(a){a.pt(0,0);
    a.tap(700,()=>A.q('[data-nav="voice"]'),()=>A.setView('voice'));
    a.move(2300,()=>A.q('.mic'));
    a.at(2900,()=>{F.down(true);A.voice('listen');A.q('.mic-tip').textContent='松开 结束';P.tween(4200,p=>A.typeSaid(p));});
    a.at(7400,()=>{F.down(false);A.voice('think');Cap.pt(1);});
    a.hide(7900);
    a.at(8700,()=>A.voice('draft'));
    [0,1,2,3,4].forEach(k=>a.at(8900+k*420,()=>A.draftRow(k)));
    a.spot(11200,A,()=>A.q('.vc-draft'),2,4);
    a.unspot(13600,A);
    a.pt(13800,2);
    a.tap(14300,()=>A.q('.vc-acts .ok'),()=>{A.voice('done');A.q('.vc-acts .ok').textContent='已下单';M.add(model,LI(),'春雪');renderAll();A.toast('已下单 YH260928-001 · 流到「核对」');});
    a.at(16300,()=>{A.setView('todo');A.ui.chip='核对';A.list.scrollTop=0;renderAll({id:'li',who:'春雪',self:true});});
    a.hide(17000);}},
 {key:'todo',step:3,name:'看待办',layout:'solo',dur:21000,
  cap:{title:'一张卡，看懂一张单',lead:'打开就是全厂的活。上面能按工序筛、搜客户和单号，每张卡只讲四件事。',
    pts:['顶上三个数：等待、进行中、有问题','进度条：一格一道工序','现在到哪一步、哪天交：超期标红，急单标橙','一个大按钮：下一步该按什么，就只给什么'],
    extra:LEGEND},
  init(){A.reset({chip:'核对'});},
  cues(a){
    a.tap(500,()=>A.q('[data-chip="全部"]'),()=>{A.ui.chip='全部';renderAll();A.list.scrollTop=0;});
    a.hide(1500);
    a.pt(1700,0);a.spot(1700,A,()=>A.q('.stats'),1);
    a.pt(5600,1);a.spot(5600,A,()=>A.card('chen').querySelector('.segs'),2,10);
    a.pt(9600,2);a.spot(9600,A,()=>A.card('chen').querySelector('.c-row'),3,8);
    a.spot(12000,A,()=>A.card('wan').querySelector('.c-row'),3,8);
    a.pt(14400,3);a.spot(14400,A,()=>A.card('chen').querySelector('.c-acts'),4);
    a.unspot(16500,A);a.at(16600,()=>A.scrollToCard('wan',800));
    a.spot(17600,A,()=>A.card('wan').querySelector('.c-acts'),4);
    a.unspot(20400,A);}},
 {key:'do',step:4,name:'做单',layout:'solo',dur:17500,
  cap:{title:'按一下，往下走一格',lead:'拿到活点「开始」，做完点「完成」。单子自动流到下一道工序，不用喊、不用问。',
    pts:['点「开始」：卡片变「进行中」，大家都知道有人在做','点「完成」：这一格变绿，单子流到下一道','每一下都自动记下：谁、几点、做了什么'],
    extra:LOGBOX,rule:'状态只能按顺序一格一格走，谁也不能手动把它改成「做完」。'},
  apply(m){M.start(m,'wan','春雪');M.complete(m,'wan','春雪');},
  init(){A.reset({scroll:'wan'});},
  cues(a){a.pt(0,0);
    a.tap(800,()=>A.mainBtn('wan'),()=>{M.start(model,'wan','春雪');renderAll();A.toast('你开始了：万先生 · 设计排版');});
    a.pt(4600,1);
    a.tap(5400,()=>A.mainBtn('wan'),()=>{M.complete(model,'wan','春雪');renderAll();A.toast('万先生 流到「客户确认」，等客户点头');});
    a.hide(7400);
    a.pt(9200,2);}},
 {key:'problem',step:5,name:'有问题',layout:'solo',dur:18500,
  cap:{title:'卡住了，就点「有问题」',lead:'选个原因，补一句话。卡片变红、排到最前面，老板的手机马上收到。',
    pts:['常见问题点一下就选：缺膜、缺墨、机器故障、客户改稿','卡片变红置顶，老板收到提醒','解决了点「问题已处理」，单子接着往下走']},
  apply(m){M.problem(m,'huang','春雪','打印机故障：喷头堵了，正在清洗');M.resolve(m,'huang','春雪');},
  init(){A.reset({scroll:'wan'});},
  cues(a){a.pt(0,0);
    a.at(400,()=>A.scrollToCard('huang',800));
    a.tap(1600,()=>A.sideBtn('huang'),()=>A.openProblem(model,'huang'));
    a.tap(3000,()=>A.q('.sh-problem [data-r="打印机故障"]'),()=>A.q('.sh-problem [data-r="打印机故障"]').classList.add('on'));
    a.tap(4300,()=>A.q('.pb-input'),()=>{const f=A.q('.pb-input'),s='喷头堵了，正在清洗';f.classList.remove('ph');P.tween(1400,p=>f.textContent=s.slice(0,Math.max(1,Math.ceil(p*s.length))));});
    a.tap(6500,()=>A.q('.pb-ok'),()=>{A.closeSheets();M.problem(model,'huang','春雪','打印机故障：喷头堵了，正在清洗');renderAll();A.scrollTo(0,700);});
    a.hide(7400);
    a.pt(7700,1);
    a.at(8000,()=>Notif.show('黄老板 · 打印 有问题','打印机故障：喷头堵了，正在清洗 · 春雪 报的'));
    a.at(12600,()=>Notif.hide());
    a.pt(12800,2);
    a.tap(13500,()=>A.mainBtn('huang'),()=>{M.resolve(model,'huang','春雪');renderAll();A.toast('黄老板 · 打印 问题已处理，接着做');});
    a.hide(15600);}},
 {key:'detail',step:6,name:'看详情',layout:'solo',dur:24500,
  cap:{title:'点开一张单，前因后果都在',lead:'衣服、件数、印花位置、交期一目了然，还有下单时的原话和每一步的记录。',
    pts:['原话：当时怎么说的，一字不差留着','记录：谁、几点、做了什么','修改、退回上一步、取消订单'],
    rule:'取消不是删除。单子放进「已取消」，随时查得到。'},
  apply(m){M.cancel(m,'chen','春雪','验收取消');},
  init(){A.reset({});},
  cues(a){a.pt(0,0);
    a.tap(700,()=>A.card('chen').querySelector('.c-name'),()=>A.openDetail(model,'chen'));
    a.hide(1600);
    a.spot(2200,A,()=>A.q('.dt-raw'),1);
    a.pt(6000,1);a.at(6000,()=>{A.unspot();A.sheetScrollTo(A.q('.dt-tl'));});
    a.spot(6900,A,()=>A.q('.dt-tl'),2);
    a.pt(10500,2);a.at(10500,()=>{A.unspot();A.sheetScrollTo('end');});
    a.spot(11400,A,()=>A.q('.dt-acts2'),3);
    a.unspot(14000,A);
    a.tap(14300,()=>A.q('.dt-cancel'),()=>A.openCancel(model,'chen'));
    a.tap(15800,()=>A.q('.sh-cancel [data-r="验收取消"]'),()=>A.q('.sh-cancel [data-r="验收取消"]').classList.add('on'));
    a.tap(17100,()=>A.q('.cc-ok'),()=>{A.closeSheets();M.cancel(model,'chen','春雪','验收取消');renderAll();A.toast('陈总这张单已取消，放进「已取消」');});
    a.tap(19100,()=>A.q('[data-tab="已取消"]'),()=>{A.ui.tab='已取消';renderAll();A.list.scrollTop=0;});
    a.tap(22000,()=>A.q('[data-tab="进行中"]'),()=>{A.ui.tab='进行中';renderAll();A.list.scrollTop=0;});
    a.hide(23200);}},
 {key:'sync',step:7,name:'全厂同步',layout:'sync',dur:15000,
  cap:{title:'手机干活，大屏看全局',lead:'谁按了什么，不到 1 秒，所有手机和车间大屏一起更新，还会闪一下，写着是谁按的。',
    pts:['春雪点「客户确认了」，单子流到「打印」','奥德彪的手机马上响：新活来了','他点「开始」，大屏和春雪的手机一起变']},
  apply(m){M.complete(m,'wan','春雪');M.start(m,'wan','奥德彪');},
  init(){A.reset({});},
  cues(a){a.pt(0,0);
    a.tap(1600,()=>A.mainBtn('wan'),()=>{M.complete(model,'wan','春雪');const fx={id:'wan',who:'春雪'};A.render(model,fx);Cap.log(model);A.toast('万先生 流到「打印」');Sync.pulse(false);
      P.later(520,()=>Board.render(model,fx));P.later(1060,()=>{B.render(model,fx);B.toast('新活来了：万先生 · 打印 · 60 件 · 急','info');});},'春雪');
    a.hide(3000);
    a.pt(4200,1);a.spot(4400,B,()=>B.card('wan'),2);a.unspot(6800,B);
    a.pt(7100,2);
    a.tap(7400,()=>B.mainBtn('wan'),()=>{M.start(model,'wan','奥德彪');const fx={id:'wan',who:'奥德彪'};B.render(model,fx);Sync.pulse(true);
      P.later(520,()=>Board.render(model,fx));P.later(1060,()=>{A.render(model,fx);A.toast('奥德彪 开始了：万先生 · 打印','info');});},'奥德彪');
    a.hide(9400);}},
 {key:'outro',name:'总结',layout:'outro',dur:15000,cap:{title:''},
  init(){A.reset({});},
  cues(a){
    a.at(400,()=>$('#outro [data-o="0"]').classList.add('on'));
    a.at(900,()=>$('#outro [data-o="1"]').classList.add('on'));
    [0,1,2,3,4].forEach(k=>a.at(1400+k*480,()=>Outro.seg(k,'g')));
    a.at(3900,()=>Outro.seg(5,'r'));a.at(4200,()=>$('#outro .o-loop').classList.add('on'));
    a.at(5800,()=>Outro.seg(5,'g'));a.at(6300,()=>Outro.seg(6,'g'));
    a.at(6800,()=>$('#outro [data-o="2"]').classList.add('on'));
    document.querySelectorAll('#outro .o-r').forEach((r,k)=>a.at(7500+k*600,()=>r.classList.add('on')));
    a.at(9600,()=>$('#outro .o-brand').classList.add('on'));}}
];

function setupScene(i,smooth){
  const sc=SC[i];
  if(!smooth)stage.classList.add('instant');
  F.hide();Notif.hide();Sync.reset();
  model=baseModel();for(let j=0;j<i;j++)SC[j].apply&&SC[j].apply(model);
  stage.className='L-'+sc.layout+(smooth?'':' instant');
  B.reset({chip:'打印'});
  sc.init&&sc.init();
  if(!smooth)Board.reset();
  Cap.lastN=model.log.length;
  Cap.render(sc);
  renderAll(null,!smooth);
  A.afterSetup();B.afterSetup();
  Chap.render(i);Outro.reset();
  if(!smooth)requestAnimationFrame(()=>requestAnimationFrame(()=>stage.classList.remove('instant')));
}

/* ---------- controls ---------- */
const TOTAL=SC.reduce((a,s)=>a+s.dur,0);
const fmt=ms=>{const s=Math.floor(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
const UI={ctrl:$('#ctrl'),hideT:0,
  init(){const chs=this.ctrl.querySelector('.chs');
    chs.innerHTML=SC.map((s,i)=>`<button data-i="${i}" title="${s.name}">${s.step?s.step+' '+s.name:s.name}</button>`).join('');
    chs.addEventListener('click',e=>{const b=e.target.closest('button');if(b){P.goto(+b.dataset.i);P.playing=true;UI.sync();}});
    $('#c-play').onclick=()=>this.toggle();
    $('#c-prev').onclick=()=>{P.goto(P.t>1500?P.i:P.i-1);P.playing=true;this.sync();};
    $('#c-next').onclick=()=>{P.goto(P.i+1);P.playing=true;this.sync();};
    $('#c-restart').onclick=()=>{P.goto(0);P.playing=true;this.sync();};
    const speeds=[1,1.5,.75];$('#c-speed').onclick=e=>{const k=(speeds.indexOf(P.speed)+1)%speeds.length;P.speed=speeds[k];e.currentTarget.textContent=P.speed+'×';};
    $('#c-hide').onclick=()=>document.body.classList.add('rec');
    addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();this.toggle();}
      else if(e.key==='ArrowRight'){P.goto(P.i+1);P.playing=true;this.sync();}
      else if(e.key==='ArrowLeft'){P.goto(P.t>1500?P.i:P.i-1);P.playing=true;this.sync();}
      else if(e.key==='h'||e.key==='H'){document.body.classList.toggle('rec');}
      else if(e.key==='r'||e.key==='R'){P.goto(0);P.playing=true;this.sync();}
      else if(e.key==='f'||e.key==='F'){const d=document.documentElement;(document.fullscreenElement?document.exitFullscreen():d.requestFullscreen&&d.requestFullscreen())?.catch?.(()=>{});}});
    addEventListener('pointermove',()=>this.wake());this.wake();},
  wake(){this.ctrl.classList.remove('idle');clearTimeout(this.hideT);this.hideT=setTimeout(()=>{if(P.playing)this.ctrl.classList.add('idle');},2600);},
  toggle(){if(!P.playing&&P.i===SC.length-1&&P.t>=SC[P.i].dur)P.goto(0);P.playing=!P.playing;this.sync();this.wake();},
  sync(){$('#c-play').innerHTML=P.playing?IC.pause:IC.play;
    this.ctrl.querySelectorAll('.chs button').forEach(b=>b.classList.toggle('on',+b.dataset.i===P.i));},
  tick(){const el=SC.slice(0,P.i).reduce((a,s)=>a+s.dur,0)+Math.min(P.t,SC[P.i].dur);
    this.ctrl.querySelector('.time').textContent=fmt(el)+' / '+fmt(TOTAL);this.ctrl.querySelector('.prog').style.width=(el/TOTAL*100)+'%';}
};

function fit(){SCALE=Math.min(innerWidth/1920,innerHeight/1080);
  stage.style.transform=`translate(${(innerWidth-1920*SCALE)/2}px,${(innerHeight-1080*SCALE)/2}px) scale(${SCALE})`;}
addEventListener('resize',fit);

let last=performance.now();
function loop(ts){const dt=Math.min(1000,Math.max(0,ts-last));last=ts;P.step(dt);UI.tick();requestAnimationFrame(loop);}

Board.init();Chap.init();Outro.init();UI.init();fit();
if(location.hash==='#rec')document.body.classList.add('rec');
P.goto(0);
window.__demo={P,SC,TOTAL,goto:i=>P.goto(i),play(){P.playing=true;UI.sync();},pause(){P.playing=false;UI.sync();},setSpeed(s){P.speed=s;}};
const start=()=>{if(!window.__manual){P.playing=true;UI.sync();}};
Promise.race([document.fonts?document.fonts.ready:Promise.resolve(),new Promise(r=>setTimeout(r,1500))]).then(()=>setTimeout(start,300));
requestAnimationFrame(loop);
})();
