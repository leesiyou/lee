/* ===== 站点数据：改名称、说明、热点位置都在这里 =====
   u = 横向位置(0 最左 ~ 1 最右)，v = 纵向位置(0 最上 ~ 1 最下)  */
const ZONES = [
  {id:'print',  name:'印花区', en:'Heat Press'},
  {id:'stock',  name:'堆料区', en:'Materials'},
  {id:'dtf',    name:'打印区', en:'DTF Print'},
  {id:'office', name:'办公区', en:'Office'}
];
const STATIONS = [
  {img:'IMG_0033', zone:'print', name:'车间入口', desc:'从这里进入印花车间，左手边就是第一台烫画机。', start:.4, hs:[
    {t:'info',u:.63,v:.33,label:'厂牌',text:'顺兴工艺的厂牌挂在入口砖墙上。'},
    {t:'info',u:.13,v:.6,label:'烫画机',text:'入口处的单工位烫画机，用来压小件和补烫。'},
    {t:'go',u:.27,v:.56,label:'进车间'}]},
  {img:'IMG_0034', zone:'print', name:'烫画机组', desc:'两台双工位烫画机并排，旁边立着车间看板。', start:.45, hs:[
    {t:'info',u:.42,v:.58,label:'双工位烫画机',text:'把打印好的烫画膜压到衣服上。两个工位轮流上下料，一台机器可以连续出货。'},
    {t:'info',u:.25,v:.3,label:'看板',text:'车间看板，显示当天的生产安排。'},
    {t:'go',u:.83,v:.6,label:'往里走'}]},
  {img:'IMG_0035', zone:'print', name:'烫画工位', desc:'烫画区正面，一排烫画机配蓝色周转箱。', start:.5, hs:[
    {t:'info',u:.48,v:.53,label:'烫画机',text:'每台烫画机配一张垫板桌和周转箱，烫好的衣服直接放进箱里流转到下一道。'},
    {t:'info',u:.15,v:.6,label:'工作台',text:'铺衣、对位用的长桌。'},
    {t:'info',u:.83,v:.46,label:'物料柜',text:'收纳烫画膜和辅料。'},
    {t:'go',u:.33,v:.72,label:'往前走'}]},
  {img:'IMG_0036', zone:'print', name:'物料货架', desc:'烫画区尽头的货架，放纸箱、工具和备件。', start:.45, hs:[
    {t:'info',u:.46,v:.45,label:'物料货架',text:'纸箱、包装材料和工具备件集中放在这里。'},
    {t:'info',u:.9,v:.62,label:'烫画机',text:'靠窗的双工位烫画机。'},
    {t:'go',u:.72,v:.63,label:'去堆料区'}]},
  {img:'IMG_0043', zone:'stock', name:'裁剪大厅', desc:'两张长裁剪台贯穿大厅，四周是物料架和样衣。', start:.55, hs:[
    {t:'info',u:.62,v:.58,label:'裁剪台',text:'长条裁剪台，用来铺布、裁片和整理衣服。'},
    {t:'info',u:.47,v:.42,label:'样衣挂架',text:'挂样衣和待处理的成衣。'},
    {t:'info',u:.08,v:.42,label:'物料架',text:'按格存放小件辅料。'},
    {t:'go',u:.42,v:.76,label:'往前走'}]},
  {img:'IMG_0045', zone:'stock', name:'堆料区', desc:'编织袋装的布料和半成品按批次堆在裁剪台旁。', start:.45, hs:[
    {t:'info',u:.5,v:.72,label:'布料堆放',text:'编织袋装的布料和半成品，按批次堆放，方便直接上裁剪台。'},
    {t:'info',u:.22,v:.62,label:'裁剪台',text:'靠墙的拼接裁剪台。'},
    {t:'info',u:.33,v:.42,label:'厂牌',text:'顺兴工艺厂牌。'},
    {t:'go',u:.66,v:.7,label:'往前走'}]},
  {img:'IMG_0048', zone:'stock', name:'周转货架', desc:'红色周转架和储物柜，衣服在这里分拣待烫。', start:.5, hs:[
    {t:'info',u:.5,v:.46,label:'周转货架',text:'红色周转架，衣服在这里分拣，再送去烫画。'},
    {t:'info',u:.12,v:.45,label:'储物柜',text:'放工具、电源和配件。'},
    {t:'info',u:.9,v:.75,label:'原料袋',text:'待用的原料袋。'},
    {t:'go',u:.62,v:.72,label:'往前走'}]},
  {img:'IMG_0050', zone:'stock', name:'布卷仓', desc:'卷帘门边存放布卷和物料，后面的门通往打印区。', start:.55, hs:[
    {t:'info',u:.53,v:.84,label:'布卷',text:'整卷的布料和膜材，靠墙平放。'},
    {t:'info',u:.6,v:.55,label:'卷帘门',text:'货物进出的卷帘门。'},
    {t:'go',u:.87,v:.6,label:'去打印区'}]},
  {img:'IMG_0055', zone:'dtf', name:'打印区入口', desc:'玻璃隔间是办公室，右手边开始就是打印区。', start:.62, hs:[
    {t:'info',u:.77,v:.62,label:'摇粉烘干机',text:'打印后的烫画膜在这里撒粉、烘干，出来就能拿去烫画。'},
    {t:'info',u:.25,v:.42,label:'玻璃办公室',text:'打印区旁边的设计办公室。'},
    {t:'info',u:.67,v:.4,label:'品牌挂板',text:'满福 MyHood 品牌展示挂板。'},
    {t:'go',u:.62,v:.7,label:'往前走'}]},
  {img:'IMG_0061', zone:'dtf', name:'打印机阵列', desc:'一排 DTF 打印机，后面连着摇粉烘干机。', start:.55, hs:[
    {t:'info',u:.57,v:.47,label:'DTF 打印机',text:'把图案打印到烫画膜上，一排机器同时出图。'},
    {t:'info',u:.72,v:.68,label:'摇粉烘干机',text:'接在打印机后面，自动撒粉、烘干。'},
    {t:'info',u:.93,v:.47,label:'耗材柜',text:'墨水、热熔粉等耗材。'},
    {t:'go',u:.3,v:.72,label:'往前走'}]},
  {img:'IMG_0068', zone:'dtf', name:'打印区全景', desc:'从楼梯口看整个打印区，左边是打印机组，中间堆着原料。', start:.4, hs:[
    {t:'info',u:.3,v:.6,label:'打印机组',text:'打印机和摇粉机成组摆放，一组一条线。'},
    {t:'info',u:.6,v:.6,label:'原料堆放',text:'热熔粉等原料成袋堆放。'},
    {t:'info',u:.83,v:.5,label:'楼梯',text:'玻璃隔断后面是上下楼的楼梯。'},
    {t:'go',u:.45,v:.82,label:'往前走'}]},
  {img:'IMG_0057', zone:'dtf', name:'打单发货', desc:'打单发货台在打印区一角，打印好的货在这里出单。', start:.45, hs:[
    {t:'info',u:.16,v:.38,label:'打单发货',text:'打快递单、核对订单，货从这里发出去。'},
    {t:'info',u:.6,v:.68,label:'摇粉机',text:'打印线的摇粉烘干机。'},
    {t:'go',u:.45,v:.76,label:'往前走'}]},
  {img:'IMG_0065', zone:'dtf', name:'排单部门', desc:'排单部门的电脑负责给打印机排版、派单。', start:.55, hs:[
    {t:'info',u:.6,v:.4,label:'排单部门',text:'把订单图案排版、分配到各台打印机。'},
    {t:'info',u:.58,v:.62,label:'排单电脑',text:'排版软件在这台电脑上运行。'},
    {t:'info',u:.17,v:.55,label:'打印线',text:'旁边就是打印机和摇粉机。'},
    {t:'go',u:.3,v:.72,label:'去办公区'}]},
  {img:'IMG_0054', zone:'office', name:'设计办公室', desc:'玻璃隔间里的设计办公室，几个工位对着墙。', start:.4, hs:[
    {t:'info',u:.3,v:.62,label:'设计工位',text:'做图、改稿的电脑工位。'},
    {t:'info',u:.62,v:.53,label:'样品架',text:'墙上搁板放样品和常用物料。'},
    {t:'go',u:.88,v:.75,label:'往前走'}]},
  {img:'IMG_0070', zone:'office', name:'办公室门口', desc:'左边是办公室，右边看出去是打印区。', start:.45, hs:[
    {t:'info',u:.48,v:.48,label:'锦旗',text:'挂在办公室门上的锦旗。'},
    {t:'info',u:.8,v:.55,label:'打印区',text:'从门口看打印区。'},
    {t:'go',u:.3,v:.75,label:'进办公室'}]},
  {img:'IMG_0071', zone:'office', name:'会客室', desc:'办公兼会客，有沙发、茶桌和一块飞镖盘。', start:.45, hs:[
    {t:'info',u:.33,v:.68,label:'会客沙发',text:'接待客户的沙发区。'},
    {t:'info',u:.44,v:.67,label:'茶桌',text:'喝茶谈事的地方。'},
    {t:'info',u:.95,v:.36,label:'飞镖盘',text:'休息时玩两把。'},
    {t:'contact',u:.56,v:.5,label:'联系工厂生产'},
    {t:'go',u:.15,v:.6,label:'回到入口'}]}
];
const DIMS = {"IMG_0033": [4096, 1454], "IMG_0034": [4096, 1348], "IMG_0035": [4096, 1410], "IMG_0036": [4096, 1470], "IMG_0043": [4096, 1452], "IMG_0045": [4096, 1447], "IMG_0048": [4096, 1468], "IMG_0050": [4096, 1493], "IMG_0055": [4096, 1470], "IMG_0061": [4096, 2079], "IMG_0068": [4096, 1715], "IMG_0057": [4096, 1429], "IMG_0065": [4096, 1347], "IMG_0054": [4096, 907], "IMG_0070": [4096, 1429], "IMG_0071": [4096, 1441]};
const PHONE_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>';

/* ===== 引擎 ===== */
const VH = 70*Math.PI/180;        // 全景照片竖向视角（iPhone 全景约 70°）
const R = 1200;                   // 圆柱半径(px)
const HD = 2*R*Math.tan(VH/2);    // 照片显示高度
const $ = s=>document.getElementById(s);
const stage=$('stage'), cam=$('cam'), hsLayer=$('hs');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let cur=-1, th=1, full=false, look=0, pitch=0, fov=1, baseFov=1, P=600, vw=0, vh=0;
let vel=0, lastInput=0, auto=!reduce, autoDir=1, hsEls=[], busy=false, gyro=null;

function src(i,kind){return (kind||'pano')+'/'+STATIONS[i].img+'.jpg'}
function dims(i){return DIMS[STATIONS[i].img]||[4096,1450]}

function resize(){
  vw=stage.clientWidth; vh=stage.clientHeight;
  baseFov = (vw<vh ? 64 : 56)*Math.PI/180;
  if(!fov||fov===1) fov=baseFov;
  applyFov();
}
function applyFov(){
  fov=Math.max(28*Math.PI/180, Math.min(fov, VH*.97));
  P=(vh/2)/Math.tan(fov/2);
  stage.style.perspective=P+'px';
}
function hfov(){return 2*Math.atan(vw/2/P)}
function clamp(){
  if(!full){
    const lim=Math.max(0, th/2-hfov()/2);
    if(look>lim){look=lim; if(auto) autoDir=-1}
    if(look<-lim){look=-lim; if(auto) autoDir=1}
  }else{
    if(look>Math.PI) look-=2*Math.PI; if(look<-Math.PI) look+=2*Math.PI;
  }
  const pl=Math.max(0,(VH*.96-fov)/2);
  pitch=Math.max(-pl,Math.min(pl,pitch));
}
function angleOf(u){return th/2-u*th}

function build(i){
  const st=STATIONS[i], [w,h]=dims(i), A=w/h;
  th=A*2*Math.tan(VH/2); full=th>=2*Math.PI*.96; if(full) th=2*Math.PI;
  const WD=R*th, N=Math.max(24,Math.ceil(th/(Math.PI/48))), d=th/N, aw=WD/N, sw=aw+2;
  const frag=document.createDocumentFragment(), url='url("'+src(i)+'")';
  for(let k=0;k<N;k++){
    const el=document.createElement('div'); el.className='strip';
    const a=th/2-(k+.5)*d;
    el.style.cssText=`width:${sw}px;height:${HD}px;margin:${-HD/2}px 0 0 ${-sw/2}px;background-image:${url};background-size:${WD}px ${HD}px;background-position:${-(k*aw)+1}px 0;transform:rotateY(${a}rad) translateZ(${-R}px)`;
    frag.appendChild(el);
  }
  cam.replaceChildren(frag);
  // hotspots
  hsLayer.replaceChildren(); hsEls=[];
  st.hs.forEach(h=>{
    const b=document.createElement('button');
    b.className='hs hs-'+h.t;
    if(h.t==='contact'){
      b.innerHTML='<span class="ring">'+PHONE_ICON+'</span><span class="lab"></span>';
      b.onclick=e=>{e.stopPropagation(); openContact()};
    }else if(h.t==='go'){
      b.innerHTML='<span class="ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg></span><span class="lab"></span>';
      b.onclick=e=>{e.stopPropagation(); go(i+1>=STATIONS.length?0:i+1, h.u)};
    }else{
      b.innerHTML='<span class="dot">i</span><span class="lab"></span>';
      b.onclick=e=>{e.stopPropagation(); showCard(h)};
    }
    b.querySelector('.lab').textContent=h.label;
    b.setAttribute('aria-label',h.label);
    hsLayer.appendChild(b); hsEls.push([b,h]);
  });
}

function render(){
  clamp();
  cam.style.transform=`translateZ(${P}px) rotateX(${pitch}rad) rotateY(${-look}rad)`;
  const cx=vw/2, cy=vh/2, cp=Math.cos(pitch), sp=Math.sin(pitch);
  for(const [b,h] of hsEls){
    const rel=angleOf(h.u)-look, y3=(h.v-.5)*HD;
    const x3=-R*Math.sin(rel), z3=-R*Math.cos(rel);
    const y4=y3*cp-z3*sp, z4=y3*sp+z3*cp;
    if(-z4<R*.25){b.hidden=true;continue}
    const s=P/(-z4), x=cx+x3*s, y=cy+y4*s;
    if(x<-200||x>vw+200||y<-100||y>vh+100){b.hidden=true;continue}
    b.hidden=false;
    const off=h.t==='go'?29:h.t==='contact'?22:11;
    b.style.transform=`translate(${x-off}px,${y-off}px)`;
  }
}

let lastT=performance.now();
function loop(t){
  const dt=Math.min(50,t-lastT); lastT=t;
  if(!dragging && Math.abs(vel)>1e-5){look+=vel*dt; vel*=Math.pow(.92,dt/16)}
  if(auto && !dragging && !busy && !gyro && t-lastInput>2500 && $('intro').hidden){
    look+=autoDir*0.00007*dt;
  }
  render();
  requestAnimationFrame(loop);
}

/* 交互 */
let dragging=false, px=0, py=0, lastMoveT=0, pinch=null;
const pointers=new Map();
stage.addEventListener('pointerdown',e=>{
  pointers.set(e.pointerId,[e.clientX,e.clientY]);
  stage.setPointerCapture(e.pointerId);
  if(pointers.size===2){const p=[...pointers.values()];pinch={d:Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]),f:fov};return}
  dragging=true; stage.classList.add('drag'); px=e.clientX; py=e.clientY; vel=0; lastMoveT=performance.now(); lastInput=lastMoveT;
  hideCard();
});
stage.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId,[e.clientX,e.clientY]);
  if(pinch && pointers.size===2){const p=[...pointers.values()];const d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);fov=pinch.f*pinch.d/d;applyFov();return}
  if(!dragging) return;
  const dx=e.clientX-px, dy=e.clientY-py, now=performance.now();
  look+=dx/P; pitch+=dy/P;
  vel=(dx/P)/Math.max(8,now-lastMoveT);
  px=e.clientX; py=e.clientY; lastMoveT=now; lastInput=now;
});
function endPtr(e){
  pointers.delete(e.pointerId);
  if(pointers.size<2) pinch=null;
  if(pointers.size===0){dragging=false; stage.classList.remove('drag'); if(performance.now()-lastMoveT>80) vel=0}
}
stage.addEventListener('pointerup',endPtr);
stage.addEventListener('pointercancel',endPtr);
stage.addEventListener('wheel',e=>{e.preventDefault(); fov*=Math.exp(e.deltaY*.0012); applyFov(); lastInput=performance.now()},{passive:false});
addEventListener('keydown',e=>{
  if(!$('intro').hidden && (e.key==='Enter'||e.key===' ')){startTour();e.preventDefault();return}
  const k=e.key; lastInput=performance.now();
  if(k==='ArrowLeft') look+=.08; else if(k==='ArrowRight') look-=.08;
  else if(k==='ArrowUp') pitch+=.06; else if(k==='ArrowDown') pitch-=.06;
  else if(k===' '||k==='Enter'){ if(document.activeElement===document.body){e.preventDefault(); next()} }
  else if(k==='Escape'){hideCard(); $('drawer').hidden=true; $('contact').hidden=true}
});
addEventListener('resize',resize);

/* 站点切换：往前走 = 朝热点方向推进 + 淡出 */
function preload(i){return new Promise(res=>{const im=new Image();let done=false;const f=()=>{if(!done){done=true;res()}};im.onload=f;im.onerror=f;im.src=src(i);setTimeout(f,6000)})}
async function go(i, towardU){
  if(busy||i===cur||i<0||i>=STATIONS.length) return;
  busy=true; hideCard(); vel=0;
  const first=cur<0;
  const ld=setTimeout(()=>$('loading').classList.add('on'),400);
  const pre=preload(i);
  if(!first){
    const fromLook=look, toLook=towardU!=null?angleOf(towardU):look, f0=fov, dur=reduce?1:420, t0=performance.now();
    $('veil').classList.add('on');
    await new Promise(r=>{(function step(){const k=Math.min(1,(performance.now()-t0)/dur), e=k*k*(3-2*k);
      look=fromLook+(toLook-fromLook)*e; fov=f0*(1-.4*e); applyFov(); if(k<1) requestAnimationFrame(step); else r()})()});
  }
  await pre; clearTimeout(ld); $('loading').classList.remove('on');
  cur=i; build(i); updateUI();
  pitch=0; fov=baseFov*(first?1:.78); applyFov();
  look=angleOf(STATIONS[i].start); render();
  $('veil').classList.remove('on');
  if(!first){const t0=performance.now(), f0=fov, dur=reduce?1:520;
    await new Promise(r=>{(function step(){const k=Math.min(1,(performance.now()-t0)/dur), e=1-Math.pow(1-k,3);
      fov=f0+(baseFov-f0)*e; applyFov(); if(k<1) requestAnimationFrame(step); else r()})()});}
  lastInput=performance.now(); busy=false;
  try{history.replaceState(null,'','#s'+(i+1))}catch(e){}
  if(i+1<STATIONS.length) preload(i+1);
}
function next(){go(cur+1>=STATIONS.length?0:cur+1)}
function prev(){if(cur>0) go(cur-1)}

function updateUI(){
  const st=STATIONS[cur], z=ZONES.find(z=>z.id===st.zone);
  $('zoneEn').textContent=z.name+' · '+z.en;
  $('stName').textContent=st.name; $('stDesc').textContent=st.desc;
  $('count').innerHTML='<b>'+(cur+1)+'</b>/'+STATIONS.length;
  $('prev').disabled=cur===0;
  $('next').firstChild.textContent=cur===STATIONS.length-1?'回到入口 ':'往前走 ';
  $('prog').style.width=((cur+1)/STATIONS.length*100)+'%';
  document.querySelectorAll('#zones button').forEach(b=>b.classList.toggle('on',b.dataset.z===st.zone));
  document.querySelectorAll('.tile').forEach(t=>t.classList.toggle('cur',+t.dataset.i===cur));
}

function showCard(h){
  $('cardK').textContent=ZONES.find(z=>z.id===STATIONS[cur].zone).name+' · '+STATIONS[cur].name;
  $('cardT').textContent=h.label; $('cardP').textContent=h.text||''; $('card').hidden=false;
}
function hideCard(){$('card').hidden=true}
$('cardX').onclick=hideCard;

function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),2200)}

/* 厂区标签 + 站点列表 */
ZONES.forEach(z=>{
  const b=document.createElement('button'); b.textContent=z.name; b.dataset.z=z.id;
  b.onclick=()=>{const i=STATIONS.findIndex(s=>s.zone===z.id); go(i)};
  $('zones').appendChild(b);
  const g=document.createElement('section'); g.className='zgroup';
  g.innerHTML='<h4>'+z.name+' <small>'+z.en.toUpperCase()+'</small></h4><div class="grid"></div>';
  STATIONS.forEach((s,i)=>{ if(s.zone!==z.id) return;
    const t=document.createElement('button'); t.className='tile'; t.dataset.i=i;
    t.innerHTML='<img loading="lazy" alt=""><div class="t"><span class="n">'+String(i+1).padStart(2,'0')+'</span><span></span></div>';
    t.querySelector('img').src=src(i,'thumb'); t.querySelector('.t span:last-child').textContent=s.name;
    t.onclick=()=>{$('drawer').hidden=true; go(i)};
    g.querySelector('.grid').appendChild(t);
  });
  $('dBody').appendChild(g);
});

$('prev').onclick=prev; $('next').onclick=next;
$('bList').onclick=()=>{$('drawer').hidden=false};
$('dClose').onclick=()=>{$('drawer').hidden=true};
$('bAuto').onclick=()=>{auto=!auto; $('bAuto').classList.toggle('on',auto); lastInput=0; toast(auto?'自动环视已开启':'自动环视已关闭')};
$('bAuto').classList.toggle('on',auto);
$('bFull').onclick=()=>{
  const el=document.documentElement;
  if(document.fullscreenElement){document.exitFullscreen?.()}
  else if(el.requestFullscreen){el.requestFullscreen().catch(()=>toast('当前环境不支持全屏'))}
  else toast('当前环境不支持全屏');
};

/* 陀螺仪（手机） */
if('DeviceOrientationEvent' in window && matchMedia('(pointer:coarse)').matches){
  $('bGyro').hidden=false;
  $('bGyro').onclick=async()=>{
    if(gyro){removeEventListener('deviceorientation',gyro.fn); gyro=null; $('bGyro').classList.remove('on'); toast('陀螺仪已关闭'); return}
    try{ if(typeof DeviceOrientationEvent.requestPermission==='function'){
      const r=await DeviceOrientationEvent.requestPermission(); if(r!=='granted'){toast('没有获得陀螺仪权限');return} } }
    catch(e){toast('当前环境不支持陀螺仪');return}
    let got=false;
    const g={a0:null,l0:look,fn:e=>{
      if(e.alpha==null) return; got=true;
      if(g.a0==null){g.a0=e.alpha; g.l0=look}
      let d=e.alpha-g.a0; if(d>180)d-=360; if(d<-180)d+=360;
      look=g.l0+d*Math.PI/180;
      if(e.beta!=null) pitch=(e.beta-90)*Math.PI/180;
      lastInput=performance.now();
    }};
    gyro=g; addEventListener('deviceorientation',g.fn); $('bGyro').classList.add('on'); toast('转动手机看四周');
    setTimeout(()=>{if(gyro===g&&!got){removeEventListener('deviceorientation',g.fn);gyro=null;$('bGyro').classList.remove('on');toast('当前环境读不到陀螺仪')}},1500);
  };
}

function startTour(){$('intro').hidden=true; lastInput=performance.now(); playMusic(true)}
$('startBtn').onclick=startTour;
$('startContact').onclick=()=>{startTour(); openContact()};

/* 背景音乐 */
const bgm=$('bgm'); let musicOn=false, wantMusic=true, fadeT=null;
bgm.volume=0;
function fadeTo(v,ms,done){clearInterval(fadeT); const v0=bgm.volume, t0=performance.now();
  fadeT=setInterval(()=>{const k=Math.min(1,(performance.now()-t0)/ms); bgm.volume=Math.max(0,Math.min(1,v0+(v-v0)*k)); if(k>=1){clearInterval(fadeT); done&&done()}},40)}
function playMusic(user){
  if(user) wantMusic=true;
  const p=bgm.play(); musicOn=true; $('bMusic').classList.add('on'); fadeTo(.55,1500);
  if(p&&p.catch) p.catch(()=>{musicOn=false; $('bMusic').classList.remove('on')});
}
function stopMusic(){wantMusic=false; musicOn=false; $('bMusic').classList.remove('on'); fadeTo(0,500,()=>bgm.pause())}
$('bMusic').onclick=()=>{ if(musicOn) {stopMusic(); toast('音乐已关闭')} else {playMusic(true); toast('音乐已开启')} };
// 通过链接直接进入某一站时，第一次点击画面就开始放音乐
addEventListener('pointerdown',function first(){ if($('intro').hidden && wantMusic && !musicOn) playMusic(); removeEventListener('pointerdown',first)},{once:true});
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ if(musicOn) bgm.pause() } else if(musicOn) bgm.play().catch(()=>{}) });

/* 联系工厂生产 */
function openContact(){hideCard(); $('drawer').hidden=true; $('contact').hidden=false}
$('bContact').onclick=openContact;
$('ctX').onclick=()=>{$('contact').hidden=true};
$('contact').addEventListener('pointerdown',e=>{ if(e.target.id==='contact') $('contact').hidden=true });
$('ctCopy').onclick=async()=>{
  try{ await navigator.clipboard.writeText('19068546281'); toast('微信号已复制：19068546281') }
  catch(e){ const r=document.createRange(); r.selectNodeContents($('ctNum')); const s=getSelection(); s.removeAllRanges(); s.addRange(r); toast('已选中号码，长按复制') }
};

resize();
const m=/^#s(\d+)$/.exec(location.hash), startAt=m?Math.min(STATIONS.length,Math.max(1,+m[1]))-1:0;
if(m) $('intro').hidden=true;
go(startAt);
requestAnimationFrame(loop);
