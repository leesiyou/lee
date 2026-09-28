(function(){
'use strict';
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function $(s){return document.querySelector(s);}
function clamp(v,a,b){if(a===undefined)a=0;if(b===undefined)b=1;return v<a?a:v>b?b:v;}
function lerp(a,b,x){return a+(b-a)*x;}
function ease(x){return x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;}
function easeOut(x){return 1-(1-x)*(1-x);}
function rng32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function rr(c,x,y,w,h,r){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);}
var TAU=Math.PI*2;

/* ---------- theme colors for canvas ---------- */
var COL={};
var NAMES={surface:'--surface',ink:'--ink',muted:'--muted',rule:'--rule',ruleStrong:'--rule-strong',accent:'--accent',c:'--c',m:'--m',y:'--y',k:'--k',white:'--white-ink',whiteEdge:'--white-edge',film:'--film',filmEdge:'--film-edge',release:'--release',powder:'--powder',powderEdge:'--powder-edge',glue:'--glue',glueEdge:'--glue-edge',fabric:'--fabric',fabricHi:'--fabric-hi',bed:'--bed',metal:'--metal',heat:'--heat'};
function readColors(){var cs=getComputedStyle(document.documentElement);for(var k in NAMES)COL[k]=cs.getPropertyValue(NAMES[k]).trim();}
readColors();

/* ---------- step copy ---------- */
var STEPS=[
 {title:'把图案印到 PET 膜上',
  what:'打印机把图案<strong>镜像</strong>后喷在 PET 膜的吸墨涂层上。先喷 CMYK 彩色，再在彩色上面叠一整层白墨。',
  why:'最后要把膜翻过来贴到衣服上，左右会颠倒，所以先镜像。翻面以后白墨正好夹在彩色和衣服之间，当作底色，深色衣服上颜色才不会发暗。',
  chips:['镜像输出','先彩后白','水性颜料墨'],
  note:'多数 DTF 打印机在同一趟里完成，彩色喷头在前，白墨喷头跟在后面。动画拆成两趟，方便看清顺序。'},
 {title:'趁墨未干撒热熔粉',
  what:'墨还湿的时候，把白色的 TPU 热熔粉均匀撒满整张膜。',
  why:'墨本身粘不住布，真正起粘合作用的是这层胶粉。湿墨表面发黏，粉落上去就被抓住。',
  chips:['TPU 热熔粉','中粉 80–170 μm','墨未干时撒'],
  note:'粉的粗细影响手感。细粉更软、细节更好；粗粉附着更强，适合卫衣、帆布这类厚料。'},
 {title:'抖掉多余的粉',
  what:'振动膜面，没有墨的地方粉挂不住，被抖进下面的回收槽；有墨的地方留下薄薄一层。',
  why:'胶只长在图案上，所以 DTF 不用像刻字膜那样剔掉多余部分，镂空、细线、分散的小字都能直接做。',
  chips:['胶只留在墨上','余粉回收再用'],
  note:'如果空白处还挂着粉，多半是膜受潮或带静电，压到衣服上会留下一圈胶点。'},
 {title:'加热，让粉熔成胶膜',
  what:'把膜送进烘箱或隧道炉，粉粒受热熔化，连成一层薄胶，墨也同时被烘干。',
  why:'烘到位的胶面有一层均匀的细纹，看起来像橘子皮，摸不到颗粒。欠火的话压烫时会掉粉，过火会发黄、变脆。',
  chips:['≈110–150 °C','2–5 min','看到橘皮纹为准'],
  note:'烘好的膜可以叠放保存。先把膜印好备着、接单后再压，是 DTF 很常见的做法。'},
 {title:'翻面，热压到衣服上',
  what:'衣服先预压几秒，去掉潮气、压平褶皱。然后把膜翻面，胶朝下放在衣服上，合上热压机。',
  why:'胶层重新熔化，在压力下流进纱线之间的缝隙。冷却后它变硬，卡在纤维里，墨层就跟着固定在布上。',
  chips:['150–165 °C','10–15 s','中到重压力'],
  note:'压力不够，胶进不了纱线；温度过高，可能烫亮面料，涤纶还会迁色。'},
 {title:'撕掉 PET 膜',
  what:'按膜的类型撕膜。热撕膜压完趁热撕，冷撕膜等凉下来再撕。撕完可以垫一张烤布再压几秒。',
  why:'膜上的离型层让墨只是轻轻贴着膜。加热压实以后，墨和胶的结合比墨和膜的结合牢得多，所以撕的时候整层都留在衣服上。',
  chips:['热撕 · 10 s 内','冷撕 · 约 55 °C 以下','二次压 5–10 s'],
  note:'二次压能让表面更哑光、更耐洗，也能压平撕膜时留下的细纹。'}
];

/* ---------- stage geometry ---------- */
var W=800,H=430;
var cv=$('#stage'),ctx=cv.getContext('2d'),sc=1;
var FILM={x0:100,x1:700},WHITE={x0:206,x1:594},GLUE={x0:203,x1:597};
var Y={glueTop:223,whiteTop:235,colorTop:247,relTop:259,petTop:262,petBot:278};
var SEG=[['c',200,280],['m',280,360],['y',360,450],['k',450,500],['m',500,550],['y',550,600]];
var TRAY=412;
var rnd=rng32(7),STUCK=[],LOOSE=[],i,x;
for(x=WHITE.x0+4;x<WHITE.x1-3;x+=6.4){var sr=2.8+rnd()*1.1;STUCK.push({x:x+rnd()*1.4,r:sr,y:Y.whiteTop-sr,d:rnd()*.5});}
for(i=0;i<150;i++){var lr=2.5+rnd()*1.4;var lx=FILM.x0+8+rnd()*(FILM.x1-FILM.x0-16);var on=lx>200&&lx<600;
  LOOSE.push({x:lx,r:lr,y:on?Y.whiteTop-6.6-lr-rnd()*3.5:Y.relTop-lr,d:rnd()*.55,fd:rnd()*.4,ex:lx<400?84-rnd()*26:716+rnd()*26,st:rnd()*7});}
var ALL=STUCK.concat(LOOSE);
var YARNS=[];for(x=92;x<=708;x+=24)YARNS.push(x);

function particle(px,py,r){ctx.beginPath();ctx.arc(px,py,r,0,TAU);ctx.fillStyle=COL.powder;ctx.fill();ctx.strokeStyle=COL.powderEdge;ctx.lineWidth=.8;ctx.stroke();}
function drawPET(){var w=FILM.x1-FILM.x0;ctx.fillStyle=COL.film;ctx.fillRect(FILM.x0,Y.petTop,w,Y.petBot-Y.petTop);ctx.strokeStyle=COL.filmEdge;ctx.lineWidth=1;ctx.strokeRect(FILM.x0+.5,Y.petTop+.5,w-1,Y.petBot-Y.petTop-1);ctx.fillStyle=COL.release;ctx.fillRect(FILM.x0,Y.relTop,w,Y.petTop-Y.relTop);}
function drawColor(lim){if(lim===undefined)lim=1e9;for(var j=0;j<SEG.length;j++){var s=SEG[j],b=Math.min(s[2],lim);if(b<=s[1])continue;ctx.fillStyle=COL[s[0]];ctx.fillRect(s[1],Y.colorTop,b-s[1],Y.relTop-Y.colorTop);}}
function drawWhite(lim){if(lim===undefined)lim=1e9;var b=Math.min(WHITE.x1,lim);if(b<=WHITE.x0)return;ctx.fillStyle=COL.white;ctx.fillRect(WHITE.x0,Y.whiteTop,b-WHITE.x0,Y.colorTop-Y.whiteTop);ctx.strokeStyle=COL.whiteEdge;ctx.lineWidth=1;ctx.strokeRect(WHITE.x0+.5,Y.whiteTop+.5,b-WHITE.x0-1,Y.colorTop-Y.whiteTop-1);}
function drawGlue(a){if(a<=0)return;ctx.globalAlpha=a;ctx.beginPath();ctx.moveTo(GLUE.x0,Y.whiteTop+1);for(var gx=GLUE.x0;gx<=GLUE.x1;gx+=3){ctx.lineTo(gx,Y.glueTop+2+1.5*Math.sin(gx*.35)+Math.sin(gx*.93+1));}ctx.lineTo(GLUE.x1,Y.whiteTop+1);ctx.closePath();ctx.fillStyle=COL.glue;ctx.fill();ctx.strokeStyle=COL.glueEdge;ctx.lineWidth=1;ctx.stroke();ctx.globalAlpha=1;}

function drawFabric(a){if(a<=0)return;ctx.globalAlpha=a;ctx.fillStyle=COL.bed;rr(ctx,70,356,660,26,4);ctx.fill();
  ctx.lineWidth=3.5;ctx.strokeStyle=COL.fabricHi;
  [0,Math.PI].forEach(function(ph){ctx.beginPath();for(var fx=76;fx<=724;fx+=2){var fy=336-11*Math.cos(Math.PI*(fx-92)/24+ph);if(fx===76)ctx.moveTo(fx,fy);else ctx.lineTo(fx,fy);}ctx.stroke();});
  YARNS.forEach(function(yx){ctx.beginPath();ctx.arc(yx,336,10.5,0,TAU);ctx.fillStyle=COL.fabric;ctx.fill();ctx.strokeStyle=COL.fabricHi;ctx.lineWidth=1.2;ctx.stroke();ctx.fillStyle=COL.fabricHi;[[-4,-3],[3,-4],[-2,3.5],[4,2]].forEach(function(d){ctx.beginPath();ctx.arc(yx+d[0],336+d[1],1.5,0,TAU);ctx.fill();});});
  ctx.globalAlpha=1;}
function drawFingers(f){if(f<=0)return;ctx.fillStyle=COL.glue;ctx.globalAlpha=.95;
  YARNS.forEach(function(x0){var gx=x0+12;if(gx<GLUE.x0+6||gx>GLUE.x1-6)return;var h=3+17*f;ctx.beginPath();ctx.moveTo(gx-7,322);ctx.quadraticCurveTo(gx-5,322+h*.75,gx,322+h);ctx.quadraticCurveTo(gx+5,322+h*.75,gx+7,322);ctx.closePath();ctx.fill();});
  ctx.strokeStyle=COL.glue;ctx.lineWidth=2.6*f;
  YARNS.forEach(function(yx){if(yx<GLUE.x0||yx>GLUE.x1)return;ctx.beginPath();ctx.arc(yx,336,11.6,Math.PI+.35,TAU-.35);ctx.stroke();});
  ctx.globalAlpha=1;}
function drawPlaten(yb,heat){ctx.fillStyle=COL.metal;ctx.fillRect(392,0,16,Math.max(0,yb-44));rr(ctx,80,yb-44,640,40,5);ctx.fill();ctx.globalAlpha=.25+.75*heat;ctx.fillStyle=COL.heat;ctx.fillRect(86,yb-6,628,6);ctx.globalAlpha=1;}
function flipFrame(sy,dy){ctx.translate(0,dy+250);ctx.scale(1,sy);ctx.translate(0,-250);}

/* 01 print */
function head(p){
  if(p<.45)return{x:lerp(150,650,p/.45),mode:'c'};
  if(p<.52)return{x:lerp(650,150,(p-.45)/.07),mode:'idle'};
  if(p<.95)return{x:lerp(150,650,(p-.52)/.43),mode:'w'};
  return{x:650,mode:'idle'};
}
function segAt(px){for(var j=0;j<SEG.length;j++)if(px>=SEG[j][1]&&px<SEG[j][2])return SEG[j][0];return null;}
function s0(p){
  var h=head(p);
  drawPET();
  drawColor(p<.45?h.x:1e9);
  drawWhite(p<.52?-1:p<.95?h.x:1e9);
  ctx.strokeStyle=COL.ruleStrong;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(100,112);ctx.lineTo(700,112);ctx.stroke();
  if(h.mode!=='idle'){
    var ch=h.mode==='c'?segAt(h.x):(h.x>WHITE.x0&&h.x<WHITE.x1?'white':null);
    if(ch){var target=h.mode==='c'?Y.colorTop:Y.whiteTop;
      for(var k=0;k<4;k++){var ph=((p*46)+k/4)%1;ctx.beginPath();ctx.arc(h.x,lerp(170,target-2,ph),2.4,0,TAU);ctx.fillStyle=COL[ch];ctx.fill();if(ch==='white'||ch==='k'){ctx.strokeStyle=COL.whiteEdge;ctx.lineWidth=.8;ctx.stroke();}}}
  }
  ctx.fillStyle=COL.metal;ctx.fillRect(h.x-10,106,20,12);
  rr(ctx,h.x-36,118,72,44,6);ctx.fillStyle=COL.surface;ctx.fill();ctx.strokeStyle=COL.ink;ctx.lineWidth=1.5;ctx.stroke();
  ['c','m','y','k','white'].forEach(function(n,j){var nx=h.x-31+j*12.5;ctx.fillStyle=COL[n];ctx.fillRect(nx,162,10,5);ctx.strokeStyle=COL.whiteEdge;ctx.lineWidth=.6;ctx.strokeRect(nx+.3,162.3,9.4,4.4);
    var act=(h.mode==='c'&&j<4)||(h.mode==='w'&&j===4);ctx.beginPath();ctx.arc(nx+5,148,2.2,0,TAU);ctx.fillStyle=act?COL.accent:COL.rule;ctx.fill();});
}
/* 02 powder */
function drawHopper(p){var j=Math.sin(p*90)*1.2;ctx.save();ctx.translate(j,0);
  ctx.beginPath();ctx.moveTo(108,56);ctx.lineTo(692,56);ctx.lineTo(672,96);ctx.lineTo(128,96);ctx.closePath();ctx.fillStyle=COL.surface;ctx.fill();ctx.strokeStyle=COL.ink;ctx.lineWidth=1.5;ctx.stroke();
  var lv=lerp(64,76,p);ctx.beginPath();ctx.moveTo(114+(lv-60)*.5,lv);ctx.lineTo(686-(lv-60)*.5,lv);ctx.lineTo(670,92);ctx.lineTo(130,92);ctx.closePath();ctx.fillStyle=COL.powder;ctx.fill();ctx.strokeStyle=COL.powderEdge;ctx.lineWidth=.8;ctx.stroke();
  ctx.restore();}
function s1(p){drawHopper(p);drawPET();drawColor();drawWhite();
  for(var j=0;j<ALL.length;j++){var q=ALL[j],f=clamp((p-q.d)/.35);if(f<=0)continue;particle(q.x,lerp(100,q.y,f*f),q.r);}}
/* 03 shake */
function drawTray(){ctx.strokeStyle=COL.ruleStrong;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(48,390);ctx.lineTo(58,TRAY+4);ctx.lineTo(742,TRAY+4);ctx.lineTo(752,390);ctx.stroke();}
function s2(p){var k=1-ease(clamp(p/.75));var ox=Math.sin(p*70)*5*k,oy=-Math.abs(Math.cos(p*70))*2.5*k;
  drawTray();
  ctx.save();ctx.translate(ox,oy);drawPET();drawColor();drawWhite();STUCK.forEach(function(q){particle(q.x,q.y,q.r);});ctx.restore();
  LOOSE.forEach(function(q){var f=clamp((p-.04-q.fd)/.46),px,py,g;
    if(f<=0){px=q.x+ox;py=q.y+oy;}
    else if(f<.55){g=f/.55;px=lerp(q.x,q.ex,easeOut(g))+ox*(1-g);py=q.y-54*Math.sin(Math.PI*g)+oy*(1-g);}
    else{g=(f-.55)/.45;px=q.ex;py=lerp(q.y,TRAY-q.r-q.st,g*g);}
    particle(px,py,q.r);});}
/* 04 cure */
function drawHeater(p){var on=clamp(p/.25);
  ctx.fillStyle=COL.metal;rr(ctx,100,96,600,26,4);ctx.fill();
  ctx.strokeStyle=COL.heat;ctx.globalAlpha=.35+.65*on;ctx.lineWidth=3;ctx.beginPath();
  for(var hx=112,n=0;hx<=688;hx+=8,n++){var hy=n%2?116:104;if(n===0)ctx.moveTo(hx,hy);else ctx.lineTo(hx,hy);}ctx.stroke();
  ctx.lineWidth=1.6;ctx.setLineDash([5,9]);ctx.lineDashOffset=-p*260;ctx.globalAlpha=.6*on;
  for(var wx=150;wx<=650;wx+=50){ctx.beginPath();for(var wy=130;wy<=208;wy+=3){var xx=wx+3*Math.sin(wy*.12+p*20);if(wy===130)ctx.moveTo(xx,wy);else ctx.lineTo(xx,wy);}ctx.stroke();}
  ctx.setLineDash([]);ctx.globalAlpha=1;}
function s3(p){var c=ease(clamp(p/.8));
  ctx.setLineDash([6,6]);ctx.strokeStyle=COL.ruleStrong;ctx.lineWidth=1.2;rr(ctx,70,82,660,232,10);ctx.stroke();ctx.setLineDash([]);
  drawHeater(p);drawPET();drawColor();drawWhite();
  var pa=1-clamp((c-.5)/.4);
  if(pa>0){STUCK.forEach(function(q){var ry=q.r*(1-.5*c),rx=q.r*(1+.55*c);ctx.globalAlpha=pa;ctx.beginPath();ctx.ellipse(q.x,Y.whiteTop-ry,rx,ry,0,0,TAU);ctx.fillStyle=COL.powder;ctx.fill();ctx.globalAlpha=pa*c;ctx.fillStyle=COL.glue;ctx.fill();ctx.globalAlpha=pa;ctx.strokeStyle=COL.powderEdge;ctx.lineWidth=.8;ctx.stroke();});ctx.globalAlpha=1;}
  drawGlue(clamp((c-.4)/.4));}
/* 05 press */
function s4(p){var pf=clamp(p/.22),pd=clamp((p-.22)/.2),pp=clamp((p-.44)/.12),ph=clamp((p-.58)/.34);
  var sy=Math.cos(Math.PI*ease(pf));if(Math.abs(sy)<.02)sy=sy<0?-.02:.02;
  var dy=pf<1?lerp(0,-30,ease(pf)):lerp(-30,47,ease(pd));
  drawFabric(clamp(p/.15));
  drawFingers(ph);
  ctx.save();flipFrame(sy,dy);drawPET();drawColor();drawWhite();drawGlue(1);ctx.restore();
  drawPlaten(lerp(20,269,ease(pp)),pp>=1?.5+.5*Math.sin(p*40)*.5+.25:pp*.4);}
/* 06 peel */
function s5(p){var pr=clamp(p/.18),pl=ease(clamp((p-.22)/.6));
  drawFabric(1);drawFingers(1);
  ctx.save();flipFrame(-1,47);drawColor();drawWhite();drawGlue(1);
    ctx.save();ctx.translate(0,10*pl);ctx.translate(700,259);ctx.rotate(-.36*pl);ctx.translate(-700,-259);drawPET();ctx.restore();
  ctx.restore();
  if(pr<1){ctx.globalAlpha=1-pr*.3;drawPlaten(lerp(269,20,ease(pr)),1-pr);ctx.globalAlpha=1;}}
var DRAW=[s0,s1,s2,s3,s4,s5];
function drawStage(s,p){ctx.setTransform(sc,0,0,sc,0,0);ctx.clearRect(0,0,W,H);DRAW[s](p);}
function fitStage(){var w=cv.clientWidth;if(!w)return;var dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(w*dpr);cv.height=Math.round(w*H/W*dpr);sc=cv.width/W;dirty=true;}

/* ---------- side panels ---------- */
var LD={platen:['上热板','var(--metal)'],pet:['PET 膜','var(--film)'],rel:['离型涂层','var(--release)'],color:['彩色墨 CMYK','cmyk'],white:['白墨','var(--white-ink)'],powderL:['热熔粉','var(--powder)'],powderS:['热熔粉','var(--powder)'],glue:['热熔胶层','var(--glue)'],fabric:['面料','var(--fabric)']};
var LAYERS={
 '0a':[['color','正在喷'],['rel',''],['pet','']],
 '0b':[['white','后喷'],['color','先喷'],['rel',''],['pet','']],
 '1':[['powderL','撒满整张'],['white',''],['color',''],['rel',''],['pet','']],
 '2':[['powderS','只剩图案上'],['white',''],['color',''],['rel',''],['pet','']],
 '3':[['glue','熔成一层'],['white',''],['color',''],['rel',''],['pet','']],
 '4':[['platen','≈160 °C'],['pet','翻面后朝上'],['rel',''],['color',''],['white',''],['glue','朝下贴布'],['fabric','']],
 '5':[['color','朝外'],['white','当底色'],['glue','嵌进纱线'],['fabric',''],['pet','已撕走',1],['rel','随膜带走',1]]
};
function renderLayers(key){$('#layers').innerHTML=LAYERS[key].map(function(e){var d=LD[e[0]];var sw=d[1]==='cmyk'?'<i class="sw cmyk"></i>':'<i class="sw" style="--sw:'+d[1]+'"></i>';return '<li'+(e[2]?' class="gone"':'')+'>'+sw+'<span>'+d[0]+'</span><em>'+(e[1]||'')+'</em></li>';}).join('');}

var READ=[
 ['喷墨顺序','CMYK → W','图像','镜像'],
 ['粉粒','80–170 μm','时机','墨未干'],
 ['余粉','进回收槽','留下','图案上'],
 null,null,
 ['撕膜','热撕 / 冷撕','二次压','5–10 s']
];
var rOut=$('#readout'),rl1=$('#r-l1'),rv1=$('#r-v1'),rl2=$('#r-l2'),rv2=$('#r-v2');
function updReadout(s,p){var a;
  if(s===3){var sec=Math.round(p*150);a=['烘箱温度',Math.round(lerp(28,135,ease(clamp(p/.5))))+' °C','时间',Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')];}
  else if(s===4){a=['热板温度','160 °C','压烫计时',Math.round(clamp((p-.58)/.34)*15)+' s'];}
  else a=READ[s];
  rOut.classList.toggle('hot',s===3||s===4);
  if(rl1.textContent!==a[0])rl1.textContent=a[0];if(rv1.textContent!==a[1])rv1.textContent=a[1];
  if(rl2.textContent!==a[2])rl2.textContent=a[2];if(rv2.textContent!==a[3])rv2.textContent=a[3];}

var pv={film:$('#pv-filmview'),shirt:$('#pv-shirtview'),clip:$('#pv-clip-r'),wclip:$('#pv-wclip-r'),pwAll:$('#pv-pw-all'),pwDes:$('#pv-pw-design'),sheen:$('#pv-sheen'),filmOn:$('#pv-film-on'),cap:$('#pv-cap'),label:$('#pv-label')};
var CAPS=['','粉撒满整张膜，图案上和空白处都有。','抖过之后，粉只留在有墨的地方，空白处干干净净。','粉熔成一层有细纹的胶面，摸起来不再有颗粒感。','膜翻过来压在衣服上。隔着 PET 看，图案已经是正的。','膜撕掉后，白墨托着彩色，黑衣服上颜色依然鲜亮。'];
function setClip(el,frac){var w=160*frac;el.setAttribute('x',(160-w).toFixed(2));el.setAttribute('width',w.toFixed(2));}
function setText(el,t){if(el.textContent!==t)el.textContent=t;}
function updPreview(s,p){
  var filmView=s<4;
  pv.film.setAttribute('visibility',filmView?'visible':'hidden');
  pv.shirt.setAttribute('visibility',filmView?'hidden':'visible');
  if(filmView){
    var cf=1,wf=1,pa=0,pd=0,sh=0,h;
    if(s===0){h=head(p);cf=p<.45?clamp((h.x-200)/400):1;wf=p<.52?0:p<.95?clamp((h.x-206)/388):1;}
    if(s===1){pa=pd=clamp((p-.1)/.6);}
    if(s===2){pa=1-clamp((p-.1)/.6);pd=1;}
    if(s===3){var c=ease(clamp(p/.8));pd=1-c;sh=c;}
    setClip(pv.clip,cf);setClip(pv.wclip,wf);
    pv.pwAll.setAttribute('opacity',pa.toFixed(3));pv.pwDes.setAttribute('opacity',pd.toFixed(3));pv.sheen.setAttribute('opacity',sh.toFixed(3));
    setText(pv.label,'俯视 · 膜的墨面朝上');
    setText(pv.cap,s===0?(p<.5?'彩色先喷上去，图案是反的，注意 DTF 三个字母。':'白墨盖在彩色上面，从墨面看几乎只剩白色轮廓。'):CAPS[s]);
  }else{
    var fo=1,ty=0,rot=0,e;
    if(s===4)fo=clamp((p-.2)/.25);
    if(s===5){e=ease(clamp((p-.22)/.6));fo=1-e;ty=-40*e;rot=-8*e;}
    pv.filmOn.setAttribute('opacity',fo.toFixed(3));pv.filmOn.setAttribute('transform','translate(0 '+ty.toFixed(2)+') rotate('+rot.toFixed(2)+' 214 52)');
    setText(pv.label,'俯视 · 衣服正面');
    setText(pv.cap,CAPS[s]);
  }
}

/* ---------- timeline ---------- */
var STEP_MS=5600,HOLD=.45;
var T=reduce?.999:.25,playing=!reduce,lastTs=null,curStep=-1,curKey='',dirty=true,visible=true;
var tabs=[].slice.call(document.querySelectorAll('.steps button'));
var bars=tabs.map(function(b){return b.querySelector('.bar');});
var playBtn=$('#play'),scrub=$('#scrub'),stepBox=$('#step-text');
var ICON_PAUSE='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor"/></svg>';
var ICON_PLAY='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>';
function setPlaying(v){playing=v;playBtn.setAttribute('aria-label',v?'暂停动画':'播放动画');playBtn.innerHTML=v?ICON_PAUSE:ICON_PLAY;lastTs=null;}
function sp(){var s=Math.min(5,Math.floor(T));var p=T>=6?1:clamp(T-s);return[s,p];}
function renderStepText(s){var d=STEPS[s];
  stepBox.innerHTML='<div class="st-head"><span class="st-num">'+String(s+1).padStart(2,'0')+' / 06</span><h3>'+d.title+'</h3></div><p class="st-what">'+d.what+'</p><p class="st-why"><span class="lbl">原理</span>'+d.why+'</p><ul class="chips">'+d.chips.map(function(c){return '<li>'+c+'</li>';}).join('')+'</ul><p class="st-note">'+d.note+'</p>';
  stepBox.setAttribute('aria-labelledby','tab-'+s);}
function updateUI(s,p){
  if(s!==curStep){curStep=s;tabs.forEach(function(b,j){b.setAttribute('aria-selected',j===s?'true':'false');b.tabIndex=j===s?0:-1;});renderStepText(s);cv.setAttribute('aria-label','侧剖面动画，第 '+(s+1)+' 步：'+STEPS[s].title);}
  var key=s===0?(p<.52?'0a':'0b'):String(s);
  if(key!==curKey){curKey=key;renderLayers(key);}
  bars.forEach(function(b,j){b.style.width=(j<s?100:j===s?p*100:0)+'%';});
  scrub.value=Math.round(Math.min(T,6)*1000);
  updReadout(s,p);updPreview(s,p);
}
function render(){var a=sp();drawStage(a[0],a[1]);updateUI(a[0],a[1]);}
function loop(ts){
  if(playing&&visible){if(lastTs!==null){T+=(ts-lastTs)/STEP_MS;if(T>=6+HOLD)T=0;dirty=true;}lastTs=ts;}else lastTs=null;
  if(dirty){render();dirty=false;}
  requestAnimationFrame(loop);
}
function go(s){s=Math.max(0,Math.min(5,s));T=s+(playing?0:.999);dirty=true;lastTs=null;}
tabs.forEach(function(b,j){
  b.addEventListener('click',function(){go(j);});
  b.addEventListener('keydown',function(e){var n=null;if(e.key==='ArrowRight')n=j+1;else if(e.key==='ArrowLeft')n=j-1;if(n!==null&&n>=0&&n<6){e.preventDefault();go(n);tabs[n].focus();}});
});
$('#prev').addEventListener('click',function(){go(sp()[0]-1);});
$('#next').addEventListener('click',function(){go(sp()[0]+1);});
playBtn.addEventListener('click',function(){if(!playing&&T>=6)T=0;setPlaying(!playing);});
cv.addEventListener('click',function(){if(!playing&&T>=6)T=0;setPlaying(!playing);});
scrub.addEventListener('input',function(){if(playing)setPlaying(false);T=Math.min(5.999,+scrub.value/1000);dirty=true;});
setPlaying(playing);
fitStage();
if(window.ResizeObserver){new ResizeObserver(function(){fitStage();fitMicro();}).observe(document.body);}else window.addEventListener('resize',function(){fitStage();fitMicro();});
if(window.IntersectionObserver){new IntersectionObserver(function(en){visible=en[0].isIntersecting;}).observe(cv);}

/* ---------- white demo ---------- */
var fabBtns=[].slice.call(document.querySelectorAll('[data-fab]'));
var fab=fabBtns[0],whiteOn=true;
var WD_CAP={
 '黑色1':'有白墨打底，彩色印在白色上，和印在白纸上一样鲜亮。',
 '黑色0':'没有白墨，半透明的彩色墨直接叠在黑布上，图案几乎被底色吞掉。',
 '藏青1':'白墨把藏青色挡在后面，黄色还是黄色。',
 '藏青0':'没有白墨，藏青会透上来，黄色变成暗绿，品红发紫发黑。',
 '白色1':'白色衣服上，白墨只是多垫了一层白，看起来差别不大。',
 '白色0':'白色衣服本身就是白底，颜色基本正常。所以浅色衣服可以把白墨印薄一些，省墨，手感也更软。'
};
function updWD(){
  $('#wd-fab').setAttribute('fill',fab.getAttribute('data-fab'));
  $('#wd-white').setAttribute('opacity',whiteOn?1:0);
  $('#wd-color').style.mixBlendMode=whiteOn?'normal':'multiply';
  fabBtns.forEach(function(b){b.setAttribute('aria-pressed',b===fab?'true':'false');});
  $('#w-on').setAttribute('aria-pressed',whiteOn?'true':'false');$('#w-off').setAttribute('aria-pressed',whiteOn?'false':'true');
  $('#wd-cap').textContent=WD_CAP[fab.getAttribute('data-name')+(whiteOn?1:0)];
}
fabBtns.forEach(function(b){b.addEventListener('click',function(){fab=b;updWD();});});
$('#w-on').addEventListener('click',function(){whiteOn=true;updWD();});
$('#w-off').addEventListener('click',function(){whiteOn=false;updWD();});
updWD();

/* ---------- micro ---------- */
var mc=$('#micro'),mx=mc.getContext('2d'),MW=800,MH=240,ms=1;
var MYARN=[115,300,485,670].map(function(cx){return{x:cx,y:140,rx:84,ry:54};});
var mr=rng32(21),FIB=[];
MYARN.forEach(function(y0){for(var j=0;j<66;j++){var u,v;do{u=mr()*2-1;v=mr()*2-1;}while(u*u+v*v>1);FIB.push({x:y0.x+u*(y0.rx-6),y:y0.y+v*(y0.ry-6),r:4+mr()*2.6});}});
var GAPS=[12,207.5,392.5,577.5,788];
var MSEG=[['c',0,230],['m',230,470],['y',470,640],['k',640,800]];
function drawMicro(dv,heat){
  var c=mx;c.setTransform(ms,0,0,ms,0,0);c.clearRect(0,0,MW,MH);
  var D=dv*80,gb=dv>1.2?Math.max(4,18-(dv-1.2)*45):18,gBot=60+gb,soak=78+D*.45,fing=78+D;
  c.strokeStyle=COL.ruleStrong;c.setLineDash([4,6]);c.lineWidth=1.2;c.beginPath();c.moveTo(0,206);c.lineTo(MW,206);c.stroke();c.setLineDash([]);
  MYARN.forEach(function(y){c.beginPath();c.ellipse(y.x,y.y,y.rx,y.ry,0,0,TAU);c.fillStyle=COL.fabric;c.globalAlpha=.3;c.fill();c.globalAlpha=1;});
  FIB.forEach(function(f){c.beginPath();c.arc(f.x,f.y,f.r,0,TAU);c.fillStyle=COL.fabric;c.fill();c.strokeStyle=COL.fabricHi;c.lineWidth=1;c.stroke();});
  if(D>0){
    c.globalAlpha=.62;c.fillStyle=COL.glue;if(soak>gBot)c.fillRect(0,gBot,MW,soak-gBot);
    c.globalAlpha=.9;
    GAPS.forEach(function(g){var wt=44;c.beginPath();c.moveTo(g-wt/2,gBot);c.bezierCurveTo(g-wt/2+6,gBot+(fing-gBot)*.4,g-7,fing-6,g,fing);c.bezierCurveTo(g+7,fing-6,g+wt/2-6,gBot+(fing-gBot)*.4,g+wt/2,gBot);c.closePath();c.fill();});
    c.globalAlpha=.5;c.strokeStyle=COL.fabricHi;c.lineWidth=.9;
    FIB.forEach(function(f){if(f.y-f.r<soak){c.beginPath();c.arc(f.x,f.y,f.r,0,TAU);c.stroke();}});
    c.globalAlpha=1;
  }
  c.fillStyle=COL.glue;c.fillRect(0,60,MW,gb);c.strokeStyle=COL.glueEdge;c.lineWidth=1;c.beginPath();c.moveTo(0,gBot-.5);c.lineTo(MW,gBot-.5);c.stroke();
  c.fillStyle=COL.white;c.fillRect(0,44,MW,16);c.strokeStyle=COL.whiteEdge;c.beginPath();c.moveTo(0,44.5);c.lineTo(MW,44.5);c.moveTo(0,59.5);c.lineTo(MW,59.5);c.stroke();
  MSEG.forEach(function(s){c.fillStyle=COL[s[0]];c.fillRect(s[1],26,s[2]-s[1],18);});
  if(dv>1.25){c.strokeStyle=COL.surface;c.lineWidth=2.4;[150,420,610].forEach(function(cx){c.beginPath();c.moveTo(cx,26);c.lineTo(cx+5,36);c.lineTo(cx-2,47);c.lineTo(cx+4,gBot);c.stroke();});}
  if(heat>0){c.globalAlpha=heat;c.fillStyle=COL.metal;c.fillRect(0,0,MW,18);c.fillStyle=COL.heat;c.fillRect(0,14,MW,5);c.globalAlpha=1;}
}
function fitMicro(){var w=mc.clientWidth;if(!w)return;var dpr=Math.min(2,window.devicePixelRatio||1);mc.width=Math.round(w*dpr);mc.height=Math.round(w*MH/MW*dpr);ms=mc.width/MW;drawMicro(dShow,0);}
var tIn=$('#m-temp'),sIn=$('#m-time'),mAnim=null;
function model(){return clamp(.8+.028*(+tIn.value-155)+.035*(+sIn.value-12.5),.05,1.6);}
var dShow=model();
var MSG={
 under:['没粘牢','胶没有化透，只浮在纱线表面，和布之间还有空隙。刚压完看不出问题，洗几次边缘就会翘起、脱落。'],
 ok:['合适','胶熔化后流进纱线之间的缝隙，冷却变硬后卡住纤维。表面还留着足够的胶托住墨层，耐洗，拉伸也不容易裂。'],
 over:['压过头','胶被压得太稀、渗得太深，表面剩下的胶托不住墨层，拉伸时容易开裂，图案边缘可能出现一圈亮边。涤纶面料在高温下还可能迁色，底色透到白墨上。']
};
function updMicroUI(){
  var d=model();
  $('#o-temp').textContent=tIn.value+' °C';$('#o-time').textContent=sIn.value+' s';
  $('#m-mark').style.left=(d/1.6*100)+'%';
  var st=d<.55?'under':d<=1.2?'ok':'over';
  $('#m-status').innerHTML='<span class="pill '+st+'">'+MSG[st][0]+'</span><span>'+MSG[st][1]+'</span>';
}
function onSlide(){mAnim=null;dShow=model();drawMicro(dShow,0);updMicroUI();}
tIn.addEventListener('input',onSlide);sIn.addEventListener('input',onSlide);
$('#m-press').addEventListener('click',function(){
  var target=model();updMicroUI();
  if(reduce){dShow=target;drawMicro(dShow,0);return;}
  mAnim={t0:performance.now(),target:target};
  requestAnimationFrame(function stepA(ts){if(!mAnim)return;var k=clamp((ts-mAnim.t0)/1600);dShow=mAnim.target*easeOut(k);drawMicro(dShow,k<1?Math.min(1,k*6,(1-k)*6):0);if(k<1)requestAnimationFrame(stepA);else mAnim=null;});
});
fitMicro();updMicroUI();

/* ---------- theme changes ---------- */
function onTheme(){readColors();dirty=true;drawMicro(dShow,0);}
var mq=window.matchMedia('(prefers-color-scheme: dark)');if(mq.addEventListener)mq.addEventListener('change',onTheme);
new MutationObserver(onTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class','style']});

requestAnimationFrame(loop);
})();
