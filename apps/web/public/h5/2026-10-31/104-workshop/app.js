
import * as THREE from './vendor/three/build/three.module.js';
import {OrbitControls} from './vendor/three/examples/jsm/controls/OrbitControls.js';
import {RoundedBoxGeometry} from './vendor/three/examples/jsm/geometries/RoundedBoxGeometry.js';

/* ================= roster ================= */
// Looks are placeholders until the real people are matched; edit here.
const ROSTER=[
 {id:'datou', name:'大头', role:'印花', zone:'heat', home:[-4.2,-6.3], face:Math.PI, color:'#e4572e',
  look:{skin:'#f1c9a5',shirt:'#2b2b2e',pants:'#3b4a63',hair:'short',hairC:'#1b1714',head:1.28}},
 {id:'xiaomao', name:'小毛', role:'裁剪', zone:'cut', home:[-1,0.55], face:0, color:'#3d7ce0',
  look:{skin:'#f0c4a0',shirt:'#8b9096',pants:'#22252b',hair:'spiky',hairC:'#2a2019',head:1}},
 {id:'aodebiao', name:'奥德彪', role:'加料·看机', zone:'stock', home:[6.0,4.6], face:-Math.PI/2, color:'#f2a33a',
  look:{skin:'#d9a57c',shirt:'#f08a24',pants:'#3a3f2f',hair:'cap',hairC:'#2f6e3a',head:1,vest:true}},
 {id:'xiaolin', name:'小林', role:'DTF', zone:'dtf', home:[17.2,-4.6], face:Math.PI, color:'#2fb6a3',
  look:{skin:'#f2cdaa',shirt:'#2c4f7c',pants:'#1f2a3a',hair:'short',hairC:'#141210',head:1,glasses:true}},
 {id:'asong', name:'啊松', role:'布卷', zone:'roll', home:[6.6,-4.4], face:Math.PI/2, color:'#6abf4b',
  look:{skin:'#eec29b',shirt:'#3f7a4a',pants:'#3a342c',hair:'bucket',hairC:'#c9b48a',head:1}},
 {id:'xiaosong', name:'小宋', role:'设计', zone:'design', home:[13.6,6.1], face:-Math.PI/2, color:'#9b6cf0',
  look:{skin:'#f3d0b0',shirt:'#f1efe8',pants:'#2d2f3a',hair:'side',hairC:'#3a2a20',head:1,phones:true}},
 {id:'abin', name:'啊彬', role:'打单发货', zone:'dtf', home:[12.6,2.0], face:Math.PI, color:'#e2557e',
  look:{skin:'#efc6a2',shirt:'#22385e',pants:'#2b2b2b',hair:'side',hairC:'#18120e',head:1,glasses:true}},
];
const RBYID=Object.fromEntries(ROSTER.map(r=>[r.id,r]));
const NPC_LINES={
 datou:['印花！','这件压好了','台板好烫！','下一件'],
 xiaomao:['裁片对一下码','这卷布有点歪','剪刀谁拿了？','排板好了'],
 aodebiao:['加料去！','墨水加满','这台我盯着','让一让，料来了'],
 xiaolin:['打印机在跑','白墨要加了','这单走 DTF','粉撒匀了'],
 asong:['米色那卷没了','黑卷补货了','布卷靠墙放','对一下库存'],
 xiaosong:['稿子改好了','客户要换个色','出图了看看','这个字号再大点'],
 abin:['发货！','这单打好了','贴单号','快递来了'],
};

/* ================= zones ================= */
const ZONES=[
 {id:'heat', name:'烫画车间', r:[-14,5.5,-9,-4.2], c:'#e4572e', cam:[[4,9,4],[2,0,-6.5]], ph:'heat', p:'P003'},
 {id:'roll', name:'布卷仓',   r:[5.5,9.9,-9,0.8], c:'#c9b48a', cam:[[-4,9,4],[-11,0,-4]], ph:'roll', p:'P017'},
 {id:'stock',name:'堆料区',   r:[3.8,9.9,0.8,9], c:'#7c9a6e', cam:[[-3,9,14],[-11,0,4.5]], ph:'stock', p:'P012'},
 {id:'rack', name:'周转货架', r:[-14,-7.5,2.5,9], c:'#d9472b', cam:[[12,8,15],[6.5,0,5.5]], ph:'rack', p:'P015'},
 {id:'cut',  name:'裁剪大厅', r:[-14,9.9,-4.2,9], c:'#3d7ce0', cam:[[2,12,13],[-2.5,0,0.5]], ph:'cut', p:'P039'},
 {id:'dtf',  name:'DTF 打印', r:[10,30,-9,2.4], c:'#2fb6a3', cam:[[26,12,10],[19,0,-3.5]], ph:'dtf', p:'P027'},
 {id:'design',name:'设计办公', r:[10,18,2.4,9], c:'#9b6cf0', cam:[[18,8,15],[14,0,5.5]], ph:'design', p:'P062'},
 {id:'stair',name:'楼梯口',   r:[18,22,2.4,9], c:'#8a8f8c', cam:[[24,8,15],[20,0,5.5]], ph:'dtf2', p:'P038', hidden:true},
 {id:'recep',name:'会客厅',   r:[22,30,2.4,9], c:'#e2557e', cam:[[30,9,15],[26,0,5.5]], ph:'recep', p:'P037'},
];
const ZBYID=Object.fromEntries(ZONES.map(z=>[z.id,z]));
function zoneAt(x,z){for(const Z of ZONES){const[a,b,c,d]=Z.r;if(x>=a&&x<=b&&z>=c&&z<=d)return Z}return null}
const BOUNDS=[[-13.6,9.9,-8.6,8.6],[10,29.6,-8.6,8.6]];
function clampXZ(x,z){
  let best=null,bd=1e9;
  for(const[a,b,c,d]of BOUNDS){const cx=Math.min(b,Math.max(a,x)),cz=Math.min(d,Math.max(c,z));const dd=(cx-x)**2+(cz-z)**2;if(dd<bd){bd=dd;best=[cx,cz]}}
  return best;
}

/* ================= renderer ================= */
const canvas=document.getElementById('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
const MOBILE=matchMedia('(pointer:coarse)').matches||innerWidth<760;
renderer.setPixelRatio(Math.min(devicePixelRatio,MOBILE?1.5:2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const scene=new THREE.Scene();
scene.background=new THREE.Color('#1c2321');
scene.fog=new THREE.Fog('#1c2321',70,140);
const camera=new THREE.PerspectiveCamera(34,1,0.1,400);
camera.position.set(30,34,40);
const controls=new OrbitControls(camera,canvas);
controls.target.set(7,0,0);controls.enableDamping=true;controls.dampingFactor=.08;
controls.maxPolarAngle=1.05;controls.minDistance=6;controls.maxDistance=170;controls.screenSpacePanning=false;

scene.add(new THREE.HemisphereLight('#eef3ff','#7d776c',1.15));
const sun=new THREE.DirectionalLight('#ffffff',1.55);
sun.position.set(18,40,26);sun.castShadow=true;
sun.shadow.mapSize.set(MOBILE?1024:2048,MOBILE?1024:2048);
Object.assign(sun.shadow.camera,{left:-32,right:32,top:24,bottom:-24,near:1,far:120});
sun.target.position.set(8,0,0);scene.add(sun,sun.target);
sun.shadow.bias=-0.0004;sun.shadow.normalBias=0.02;
scene.add(new THREE.AmbientLight('#ffffff',.18));

/* ================= helpers ================= */
const MATS={};
function mat(c,o={}){const k=c+JSON.stringify(o);return MATS[k]||(MATS[k]=new THREE.MeshStandardMaterial({color:c,roughness:.82,metalness:0,...o}))}
const GEO={};
function rbg(w,h,d,r){const k=[w,h,d,r].join('|');return GEO[k]||(GEO[k]=new RoundedBoxGeometry(w,h,d,2,Math.max(0.002,Math.min(r,w/2-.001,h/2-.001,d/2-.001))))}
function box(p,w,h,d,c,x,y,z,r=.035,o){const m=new THREE.Mesh(rbg(w,h,d,r),typeof c==='string'?mat(c,o):c);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
function cyl(p,r1,r2,h,c,x,y,z,seg=18,o){const k='c'+[r1,r2,h,seg].join('|');const g=GEO[k]||(GEO[k]=new THREE.CylinderGeometry(r1,r2,h,seg));const m=new THREE.Mesh(g,typeof c==='string'?mat(c,o):c);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
function sph(p,r,c,x,y,z,sx=1,sy=1,sz=1,o){const k='s'+r;const g=GEO[k]||(GEO[k]=new THREE.SphereGeometry(r,24,16));const m=new THREE.Mesh(g,typeof c==='string'?mat(c,o):c);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
function grp(x,z,ry=0,p=scene){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;p.add(g);return g}
let seed=104;function rnd(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
const pick=a=>a[Math.floor(rnd()*a.length)];
function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...rep)}return t}

/* ================= floors ================= */
// main shed: big terrazzo tiles in light/mid/dark grey, laid irregularly (P010, P039, P087)
const shedFloor=canvasTex(1472,1088,(g,w,h)=>{
  const s=64,cols=23,rows=17;
  const shades=['#c9ccca','#9b9f9d','#e4e5e1','#7f8381','#b4b7b4'];
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
    const v=((i+j)%2===0)?pick(['#c9ccca','#e4e5e1','#d6d8d4']):pick(['#8d918f','#a2a6a3','#7d817f']);
    g.fillStyle=v;g.fillRect(i*s,j*s,s,s);
    for(let k=0;k<70;k++){g.fillStyle=pick(['#2b2d2c','#f7f7f4','#5a5d5b','#ffffff']);g.globalAlpha=.55;g.fillRect(i*s+rnd()*s,j*s+rnd()*s,1.6,1.6)}
    g.globalAlpha=1;
  }
  g.strokeStyle='rgba(60,62,61,.35)';g.lineWidth=1.2;
  for(let i=0;i<=cols;i++){g.beginPath();g.moveTo(i*s,0);g.lineTo(i*s,h);g.stroke()}
  for(let j=0;j<=rows;j++){g.beginPath();g.moveTo(0,j*s);g.lineTo(w,j*s);g.stroke()}
  // scuffs and debris
  for(let k=0;k<160;k++){g.fillStyle='rgba(70,64,58,'+(.05+rnd()*.12)+')';g.beginPath();g.ellipse(rnd()*w,rnd()*h,4+rnd()*22,2+rnd()*8,rnd()*3,0,7);g.fill()}
});
// concrete building: glossy red-brown tiles (P027, P051, P057)
const redFloor=canvasTex(1024,1024,(g,w,h)=>{
  const s=64;for(let i=0;i<16;i++)for(let j=0;j<16;j++){g.fillStyle=pick(['#7b3f30','#83463a','#733a2c','#7f4334']);g.fillRect(i*s,j*s,s,s)}
  g.strokeStyle='#4d2a21';g.lineWidth=2;for(let i=0;i<=16;i++){g.beginPath();g.moveTo(i*s,0);g.lineTo(i*s,h);g.stroke();g.beginPath();g.moveTo(0,i*s);g.lineTo(w,i*s);g.stroke()}
  for(let k=0;k<90;k++){g.fillStyle='rgba(255,230,210,'+(.03+rnd()*.06)+')';g.beginPath();g.ellipse(rnd()*w,rnd()*h,10+rnd()*40,3+rnd()*10,rnd()*3,0,7);g.fill()}
},[2,1.4]);
const darkFloor=canvasTex(512,512,(g,w,h)=>{const s=64;for(let i=0;i<8;i++)for(let j=0;j<8;j++){g.fillStyle=pick(['#3a3d3f','#34373a','#404346']);g.fillRect(i*s,j*s,s,s)}g.strokeStyle='#26282a';g.lineWidth=2;for(let i=0;i<=8;i++){g.beginPath();g.moveTo(i*s,0);g.lineTo(i*s,h);g.stroke();g.beginPath();g.moveTo(0,i*s);g.lineTo(w,i*s);g.stroke()}},[1,1]);
function floor(x1,x2,z1,z2,tex,rough=.8){const m=new THREE.Mesh(new THREE.PlaneGeometry(x2-x1,z2-z1),new THREE.MeshStandardMaterial({map:tex,roughness:rough}));m.rotation.x=-Math.PI/2;m.position.set((x1+x2)/2,0.001,(z1+z2)/2);m.receiveShadow=true;scene.add(m);return m}
// ground outside
const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#2a312e',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-0.02;ground.receiveShadow=true;scene.add(ground);
const apron=new THREE.Mesh(new THREE.PlaneGeometry(50,26),new THREE.MeshStandardMaterial({color:'#4a4f4b',roughness:1}));apron.rotation.x=-Math.PI/2;apron.position.set(8,-0.01,0);apron.receiveShadow=true;scene.add(apron);
floor(-14,10,-9,9,shedFloor,.75);
floor(10,30,-9,2.4,redFloor,.45);
floor(18,30,2.4,9,(()=>{const t=redFloor.clone();t.needsUpdate=true;t.repeat.set(1.2,.7);return t})(),.45);
floor(10,18,2.4,9,darkFloor,.5);

/* ================= walls ================= */
const brick=canvasTex(1024,512,(g,w,h)=>{g.fillStyle='#f2f1ec';g.fillRect(0,0,w,h);g.strokeStyle='#b9b8b2';g.lineWidth=3;const bw=64,bh=24;for(let r=0;r*bh<h;r++){g.beginPath();g.moveTo(0,r*bh);g.lineTo(w,r*bh);g.stroke();for(let c=-1;c*bw<w;c++){const x=c*bw+(r%2?bw/2:0);g.beginPath();g.moveTo(x,r*bh);g.lineTo(x,r*bh+bh);g.stroke()}}},[3,1]);
const panel=canvasTex(512,256,(g,w,h)=>{g.fillStyle='#e9eae7';g.fillRect(0,0,w,h);g.strokeStyle='#cfd1cd';g.lineWidth=2;for(let x=0;x<w;x+=64){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}for(let k=0;k<30;k++){g.fillStyle='rgba(120,110,95,'+(rnd()*.07)+')';g.beginPath();g.ellipse(rnd()*w,h*.6+rnd()*h*.4,6+rnd()*30,3+rnd()*12,0,0,7);g.fill()}},[6,1]);
const concrete=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#9a958c';g.fillRect(0,0,w,h);for(let k=0;k<900;k++){g.fillStyle='rgba('+(pick([60,90,150,180]))+','+(pick([58,85,145,172]))+','+(pick([55,80,140,165]))+','+(.05+rnd()*.12)+')';g.beginPath();g.ellipse(rnd()*w,rnd()*h,2+rnd()*26,2+rnd()*14,rnd()*3,0,7);g.fill()}},[4,1]);
const osb=canvasTex(512,256,(g,w,h)=>{g.fillStyle='#d6ad6b';g.fillRect(0,0,w,h);for(let k=0;k<700;k++){g.fillStyle=pick(['#c39150','#e3c084','#b7834a','#ecd09a']);g.save();g.translate(rnd()*w,rnd()*h);g.rotate(rnd()*3);g.fillRect(-9,-2,18+rnd()*14,4);g.restore()}g.strokeStyle='rgba(90,60,30,.4)';g.lineWidth=2;for(let x=0;x<w;x+=128){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}},[3,1]);
const WALLH=3.3,CUT=0.55;
function wall(x1,z1,x2,z2,h,m,t=.16,y0=0){const L=Math.hypot(x2-x1,z2-z1);const mesh=new THREE.Mesh(new THREE.BoxGeometry(L,h,t),m);mesh.position.set((x1+x2)/2,y0+h/2,(z1+z2)/2);mesh.rotation.y=-Math.atan2(z2-z1,x2-x1);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh}
const mPanel=new THREE.MeshStandardMaterial({map:panel,roughness:.85});
const mBrick=new THREE.MeshStandardMaterial({map:brick,roughness:.9});
const mConc=new THREE.MeshStandardMaterial({map:concrete,roughness:.95});
const mOsb=new THREE.MeshStandardMaterial({map:osb,roughness:.9});
const mWhite=mat('#ecebe6');
const mGlass=new THREE.MeshStandardMaterial({color:'#bfe0e6',transparent:true,opacity:.28,roughness:.1,metalness:.1});
// shed: north wall (windows), west wall (brick + gate), south & east low cut
wall(-14,-9,10,-9,WALLH,mPanel);
wall(-14,-9,-14,9,WALLH,mPanel);
wall(-14,9,3,9,CUT,mPanel);wall(4.6,9,10,9,CUT,mPanel);
// partition between shed and concrete building, with a doorway at z∈[-1.2,1.2]
wall(9.92,-9,9.92,-1.2,WALLH,mBrick,.1);wall(9.92,1.2,9.92,9,WALLH,mBrick,.1);wall(10.06,-9,10.06,-1.2,2.6,mConc,.1);wall(10.06,1.2,10.06,9,2.6,mConc,.1);box(scene,.3,.5,2.5,'#f2f1ec',10,2.85,0,.01);
// concrete building
wall(10,-9,30,-9,WALLH,mConc);
wall(30,-9,30,9,CUT,mConc);
wall(10,9,30,9,CUT,mConc);
// design office: glass partition + OSB back
wall(10,2.4,16.6,2.4,2.5,mGlass,.06);wall(17.6,2.4,18,2.4,2.5,mGlass,.06);
wall(18,2.4,18,9,2.5,mGlass,.06);
// reception: white walls, door gap
wall(22,2.4,26,2.4,2.6,mWhite);wall(27.2,2.4,30,2.4,2.6,mWhite);wall(22,2.4,22,9,2.6,mWhite);
// stair glass (P038, P056)
wall(18,4.2,22,4.2,2.6,mGlass,.06);

// windows on the shed's north wall (outside: trees and road, P085, P088)
function windowAt(x,z,w,h,y,ry=0,glow='#cfe9d9'){const g=grp(x,z,ry);box(g,w+.12,h+.12,.08,'#c9cdd0',0,y,0,.02);const p=box(g,w,h,.04,glow,0,y,.05,.01,{emissive:glow,emissiveIntensity:.55,roughness:.3});box(g,.05,h,.06,'#c9cdd0',0,y,.07,.01);return g}
for(const x of [-8,-1.5,4.5]) windowAt(x,-8.86,2.2,1.2,1.9);
for(const x of [14,20,26]) windowAt(x,-8.86,2.0,1.1,1.95,0,'#dfe9ea');
windowAt(13.9,8.0,1.2,1.0,1.7,Math.PI,'#e6eef0'); // design office end window (approx.)
// brick wall decoration: red banners (P012, P013, P020)
function poster(x,z,ry,w,h,y){const t=canvasTex(256,360,(g,W,H)=>{g.fillStyle='#f4f1ea';g.fillRect(0,0,W,H);g.fillStyle='#c8262c';g.fillRect(14,14,W-28,H*.42);g.fillStyle='#f4f1ea';g.font='bold 64px sans-serif';g.textAlign='center';g.fillText('104',W/2,H*.3);g.fillStyle='#c8262c';g.fillRect(14,H*.5,W-28,14);for(let i=0;i<6;i++){g.fillStyle='#d8d3c8';g.fillRect(30,H*.6+i*20,W-60,8)}});const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.8}));m.position.set(x,y,z);m.rotation.y=ry;scene.add(m)}
poster(9.84,3.2,-Math.PI/2,1.2,1.6,1.9);poster(9.84,5.2,-Math.PI/2,1.2,1.6,1.9);
// rolling metal gate (P016, P017)
const gateTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#b7bcc0';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=10){g.fillStyle=x%20?'#d6dadd':'#8e9397';g.fillRect(x,0,5,h)}});
{const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.5),new THREE.MeshStandardMaterial({map:gateTex,metalness:.5,roughness:.4}));m.position.set(9.84,1.25,-2.6);m.rotation.y=-Math.PI/2;scene.add(m)}

/* roof, beams, columns and light tubes left out on purpose: clear top-down view */
/* ================= props ================= */
const PRESSES=[],FANS=[],CARRIAGES=[],BELTS=[],INKBARS=[];
const C={blue:'#2f6fd6',blueD:'#1f4ea0',red:'#c8503a',white:'#eeeeea',steel:'#b8bec2',wood:'#e1bf78',pink:'#f2a7bf',green:'#7d9a6c',cream:'#e9e2cf',black:'#262829',card:'#b98a5a'};
function crate(p,x,z,y=0,c=C.blue,fill=true){const g=grp(x,z,0,p);g.position.y=y;box(g,.56,.32,.4,c,0,.16,0,.04);box(g,.48,.04,.32,'#183a77',0,.3,0,.01);if(fill){const fc=pick([C.white,C.pink,'#1d1d1f','#d9d6cc']);box(g,.44,.08,.28,fc,0,.32,0,.04)}return g}
function heatPress(x,z,ry){const g=grp(x,z,ry);
  // steel stand with white cabinet (P086, P088)
  for(const[a,b]of[[-.44,-.32],[.44,-.32],[-.44,.32],[.44,.32]]) cyl(g,.025,.025,.78,C.steel,a,.39,b,8,{metalness:.4});
  box(g,.96,.05,.74,'#f3f3ef',0,.8,0,.02);box(g,.9,.03,.68,C.steel,0,.22,0,.01);
  // blue base, red platen, white arm, head
  box(g,.52,.22,.6,C.blue,0,.94,-.02,.05);
  box(g,.66,.06,.52,'#c4513b',0,1.08,.04,.03);
  box(g,.14,.5,.14,'#f0efea',0,1.27,-.3,.03);
  const hd=new THREE.Group();g.add(hd);
  box(hd,.58,.13,.5,'#f2f1ec',0,1.48,.0,.04);box(hd,.58,.04,.5,C.blue,0,1.4,.0,.02);
  cyl(hd,.02,.02,.5,C.steel,.38,1.42,.16,8).rotation.z=Math.PI/2;
  const lamp=sph(g,.03,'#3a3',.3,1.0,.4);
  const shirt=box(g,.42,.02,.36,pick([C.pink,'#18181a','#f4f4f0']),0,1.12,.06,.02);
  PRESSES.push({g,hd,lamp,shirt,t:0,busy:0});
  box(g,.18,.16,.12,'#f0efea',-.3,.92,.33,.03);sph(g,.025,'#e23',-.3,.95,.4);
  crate(g,0,.0,.0);
  return g}
function yellowTable(x,z,ry=0){const g=grp(x,z,ry);box(g,.62,.04,.62,C.wood,0,.76,0,.015);for(const[a,b]of[[-.27,-.27],[.27,-.27],[-.27,.27],[.27,.27]])cyl(g,.02,.02,.74,'#d5d8da',a,.37,b,8);box(g,.56,.02,.56,'#d5d8da',0,.2,0,.01);return g}
function stool(x,z){const g=grp(x,z);cyl(g,.17,.17,.05,'#d8b98e',0,.62,0);for(let i=0;i<3;i++){const a=i*2.1;const l=cyl(g,.018,.018,.62,'#c8a77c',Math.cos(a)*.11,.31,Math.sin(a)*.11,6);l.rotation.z=Math.cos(a)*.12;l.rotation.x=-Math.sin(a)*.12}return g}
function pinkStack(p,x,z,y,n=6){for(let i=0;i<n;i++)box(p,.44,.05,.34,i%3?C.pink:'#f5b9cb',x+(rnd()-.5)*.04,y+.03+i*.05,z+(rnd()-.5)*.04,.02)}
function longTable(x,z,len,ry=0){const g=grp(x,z,ry);box(g,len,.05,1.15,'#f7f7f4',0,.86,0,.02);
  for(const a of[-len/2+.1,len/2-.1])for(const b of[-.5,.5])box(g,.05,.84,.05,'#c3c8cb',a,.42,b,.01);
  box(g,len-.2,.03,1.05,'#c3c8cb',0,.24,0,.01);
  for(let i=-len/2+.5;i<len/2-.3;i+=.62){box(g,.52,.34,.4,pick([C.card,'#c79a68','#a87a4c']),i,.42,.25,.02);}
  for(let k=0;k<4;k++){const t=cyl(g,.06,.06,len*.7,'#d9c6a2',(rnd()-.5)*.6,.32,-.15-k*.11,10);t.rotation.z=Math.PI/2}
  return g}
function mat_(x,z,w,d,ry=0){const g=grp(x,z,ry);box(g,w,.02,d,'#1c1d1e',0,.01,0,.008);return g}
function bag(x,z,s=1,c=C.green){const g=grp(x,z,rnd()*6);sph(g,.42*s,c,0,.3*s,0,1.1,.75,.9,{roughness:.95});sph(g,.12*s,c,.05,.62*s,0);return g}
function bulkBag(x,z,s=1){const g=grp(x,z,rnd()*.4);box(g,.9*s,.8*s,.9*s,'#eceae3',0,.4*s,0,.25*s,{roughness:1});return g}
function tvStand(x,z,ry){const g=grp(x,z,ry);box(g,.5,.04,.4,'#2a2a2a',0,.02,0,.02);cyl(g,.03,.03,1.5,'#444',0,.78,0,8);box(g,1.0,.6,.05,'#0f1112',0,1.62,.04,.02);return g}
function floorFan(x,z,c='#f1f1ee',s=1){const g=grp(x,z,rnd()*6);cyl(g,.18*s,.2*s,.04,c,0,.02,0);cyl(g,.025,.025,1.0*s,c,0,.52*s,0,8);const h=cyl(g,.26*s,.26*s,.1,c,0,1.08*s,0,20);h.rotation.x=Math.PI/2;h.material=new THREE.MeshStandardMaterial({color:c,transparent:true,opacity:.55});const bl=new THREE.Group();bl.position.set(0,1.08*s,0);g.add(bl);for(let i=0;i<3;i++){const b=box(bl,.06,.2*s,.012,'#6d7275',0,0,0,.01);b.rotation.z=i*2.09;b.position.set(Math.sin(i*2.09)*.1*s,Math.cos(i*2.09)*.1*s,0)}FANS.push(bl);return g}
function shelf(x,z,ry,len=1.8,lv=4,frame='#d1472b',plank='#ece9e1',items=true){const g=grp(x,z,ry);const H=lv*.48+.1;
  for(const a of[-len/2,len/2])for(const b of[-.24,.24])box(g,.05,H,.05,frame,a,H/2,b,.01);
  for(let i=0;i<lv;i++){const y=.12+i*.48;box(g,len,.04,.5,plank,0,y,0,.01);box(g,len,.06,.04,frame,0,y,.25,.01);
    if(items){let px=-len/2+.2;while(px<len/2-.2){const t=rnd();if(t<.35){box(g,.4,.26,.36,pick([C.card,'#c49465']),px+.2,y+.15,0,.02);px+=.45}else if(t<.6){crate(g,px+.28,0,y+.02,pick([C.blue,'#3a86d8']));px+=.6}else if(t<.8){box(g,.38,.12,.34,pick([C.pink,'#2d2d30','#e7e1d4','#d97b3a']),px+.2,y+.08,0,.05);px+=.42}else px+=.3}}}
  return g}
function roll(x,z,r,h,c,lying=false,ry=0){const g=grp(x,z,ry);const m=cyl(g,r,r,h,c,0,lying?r:h/2,0,20,{roughness:.95});if(lying)m.rotation.z=Math.PI/2;cyl(g,r*.25,r*.25,h+.02,'#c9a77a',0,lying?r:h/2,0,10).rotation.z=lying?Math.PI/2:0;return g}
function dtfPrinter(x,z,ry){const g=grp(x,z,ry);for(const a of[-.95,.95])box(g,.12,.7,.5,'#1a1b1d',a,.35,0,.02);box(g,2.2,.5,.6,'#1c1d1f',0,.95,0,.06);box(g,2.0,.08,.4,'#2e3033',0,1.22,-.02,.03);box(g,.3,.14,.06,'#d23a2e',-.85,1.0,.31,.02);box(g,.6,.05,.02,'#e9e9e6',.4,1.05,.31,.01);cyl(g,.07,.07,1.9,'#f2f0ea',0,.6,.28,12).rotation.z=Math.PI/2;
  const car=box(g,.26,.14,.32,'#3b3e42',0,1.3,0,.03);box(car,.08,.03,.05,'#2fd06a',.0,.08,.12,.01);CARRIAGES.push({m:car,ph:rnd()*6});
  for(let i=0;i<4;i++)box(g,.1,.22,.1,['#18c1e6','#e8357f','#f2d22e','#111'][i],-.7+i*.13,1.32,-.18,.02);
  const bar=box(g,.5,.05,.02,'#2fd06a',.4,1.12,.31,.01);INKBARS.push(bar);return g}
const beltTex=canvasTex(128,256,(g,w,h)=>{g.fillStyle='#8a5a3c';g.fillRect(0,0,w,h);for(let i=0;i<4;i++){const y=i*64+8;g.fillStyle='#f4f2ec';g.fillRect(14,y,100,48);const cs=['#e4572e','#3d7ce0','#f2c14e','#2fb6a3','#e2557e'];for(let k=0;k<5;k++){g.fillStyle=cs[(i+k)%5];g.beginPath();g.arc(30+k*18,y+24,7,0,7);g.fill()}}},[1,1]);
function dryer(x,z,ry,len=2.3){const g=grp(x,z,ry);box(g,1.05,.85,len,C.cream,0,.5,0,.1);{const t=beltTex.clone();t.needsUpdate=true;t.repeat.set(1,len/1.2);const m=new THREE.Mesh(new THREE.PlaneGeometry(.86,len-.3),new THREE.MeshStandardMaterial({map:t,roughness:.6}));m.rotation.x=-Math.PI/2;m.position.y=.97;g.add(m);BELTS.push(t)}box(g,1.06,.16,.3,'#d8cfb8',0,1.0,len/2-.2,.06);for(let i=0;i<4;i++){const v=cyl(g,.06,.06,.02,'#5d5a52',.53,.5,-len/2+.4+i*.3,12);v.rotation.z=Math.PI/2}for(const a of[-.4,.4])for(const b of[-len/2+.15,len/2-.15])cyl(g,.04,.04,.08,'#222',a,.04,b,8);return g}
function cabinet(x,z,ry,w=.6,h=1.8,c='#f3f3f0'){const g=grp(x,z,ry);box(g,w,h,.5,c,0,h/2,0,.03);for(let i=1;i<5;i++)box(g,w-.06,.01,.01,'#cfcfc9',0,i*h/5,.255,.003);return g}
function desk(x,z,ry,len=2.4,top='#2c2c2e',mons=2){const g=grp(x,z,ry);box(g,len,.05,.7,top,0,.75,0,.02);for(const a of[-len/2+.06,len/2-.06])box(g,.04,.73,.6,'#333',a,.37,0,.01);for(let i=0;i<mons;i++){const mx=-len/2+len*(i+.5)/mons;box(g,.62,.38,.04,'#0e0f10',mx,1.08,-.2,.02);box(g,.05,.18,.05,'#222',mx,.86,-.22,.01);box(g,.42,.02,.14,'#3a3a3c',mx,.79,.05,.005)}return g}
function chair(x,z,ry,c='#2b2c2f'){const g=grp(x,z,ry);box(g,.46,.08,.44,c,0,.48,0,.04);box(g,.44,.5,.06,c,0,.78,.22,.04);cyl(g,.03,.03,.4,'#555',0,.24,0,8);cyl(g,.24,.24,.03,'#444',0,.03,0,10);return g}
function sofa(x,z,ry){const g=grp(x,z,ry);box(g,2.0,.38,.8,'#e6d8bc',0,.25,0,.12);box(g,2.0,.45,.22,'#e8dcc2',0,.55,-.32,.1);box(g,.2,.32,.8,'#e8dcc2',-.95,.48,0,.08);box(g,.2,.32,.8,'#e8dcc2',.95,.48,0,.08);return g}
function dispenser(x,z){const g=grp(x,z);box(g,.32,.95,.32,'#f2f2ef',0,.48,0,.04);cyl(g,.14,.14,.45,'#7fb4e6',0,1.18,0,16,{transparent:true,opacity:.8,roughness:.2});return g}
function bucket(x,z,c='#d23a2e',s=1){const g=grp(x,z);cyl(g,.18*s,.14*s,.34*s,c,0,.17*s,0,16);return g}

const _n0=scene.children.length;
// --- 烫画车间: presses along the window wall (P084–P089)
const pressX=[-5.6,-3.4,-1.2,1.0,3.2,5.4,7.6];
pressX.forEach((x,i)=>{heatPress(x,-7.85,0);if(i%2===0)yellowTable(x+1.1,-6.6);stool(x+.3,-6.9+(i%2)*.3);
  if(i%3===1)pinkStack(scene,x+1.1,-6.6,.78,7);});
for(const x of[-5.0,-.2,4.2,8.6])crate(scene,x,-6.0,0,C.blue);
for(const x of[-2.4,6.4])pinkStack(scene,x,-8.25,.8,5);
tvStand(-0.2,-8.35,0);tvStand(6.6,-8.35,0);
floorFan(9.2,-7.6,'#e98a2b',1.05);floorFan(-6.6,-6.2);
// black garments on the tables
box(scene,.6,.06,.5,'#18181a',1.1+1.1,0.82,-6.6,.05);

// --- 裁剪大厅: two long white tables (P010, P039, P085, P087)
longTable(-3,-1.6,9.5);longTable(-3,2.6,9.5);
mat_(-3,0.5,7,.8);mat_(-8.6,-1.6,.8,1.2);
for(let i=0;i<7;i++)box(scene,.5,.05,.42,pick(['#18181a','#f2f2ee',C.pink,'#c9c3b4']),-7+i*1.3,.91,-1.6+(rnd()-.5)*.5,.03);
for(let i=0;i<5;i++)box(scene,.5,.05,.42,pick(['#18181a','#f2f2ee','#d8d3c8']),-6.5+i*1.6,.91,2.6+(rnd()-.5)*.5,.03);
stool(-1.2,0.5);stool(-4.6,0.6);stool(0.6,4.0);
for(const[x,z]of[[1.8,4.0],[2.4,-3.0],[-7.6,4.1],[2.8,0.4]])crate(scene,x,z);
bag(2.6,1.6,.8,'#e7b23d'); // orange woven feed-sack (P039, P087)
bag(2.9,2.5,.7,'#d8c39a');

// --- 堆料区: green woven sacks and white bulk bags by the brick wall (P012, P020, P090)
[[-12.6,3.0,1],[-12.0,4.1,1.1],[-12.8,5.2,.95],[-11.6,5.6,1],[-12.4,6.6,1.05],[-11.2,3.4,.9],[-10.9,6.8,.85]].forEach(([x,z,s])=>bag(x,z,s));
bulkBag(-12.7,7.9,1.1);bulkBag(-11.5,8.0,1);bulkBag(-12.9,1.8,.9);
longTable(-9.8,7.9,3,0);
for(const[x,z]of[[-10.2,2.2],[-9.6,6.3],[-12.9,8.6]])crate(scene,x,z);
roll(-9.0,1.6,.12,1.6,'#d8c6a0',true,.5);roll(-8.8,1.9,.12,1.6,'#d8c6a0',true,.6);

// --- 布卷仓: standing and lying rolls, gate corner (P017, P041)
const rollC=['#f1efe8','#d8c7a6','#1c1c1e','#e9e6dd','#b7a283','#2f2f33','#efe7d6'];
for(let i=0;i<9;i++)roll(-13.1+(i%3)*.42,-7.9+Math.floor(i/3)*.45,.18,1.7,rollC[i%rollC.length]);
for(let i=0;i<5;i++)roll(-11.4,-8.2+i*.38,.16,1.6,pick(rollC),true,Math.PI/2);
for(let i=0;i<4;i++)roll(-10.1,-7.6+i*.36,.15,1.5,pick(['#f4f3ef','#e8e4da']),true,0);
shelf(-13.5,-5.4,Math.PI/2,1.8,4,'#d7dbde','#efefea');
shelf(-8.6,-8.5,0,1.6,4,'#d7dbde','#efefea');
floorFan(-9.0,-6.4,'#e98a2b');
crate(scene,-12.3,-4.0);crate(scene,-11.6,-3.4,0,'#d23a2e');

// --- 周转货架: red-orange racks + white shelving with cartons (P015, P039, P046)
shelf(5.0,8.5,Math.PI,2.2,4,'#d9472b','#e9e5dc');
shelf(7.8,8.5,Math.PI,2.2,4,'#d9472b','#e9e5dc');
shelf(9.5,6.2,-Math.PI/2,2.0,4,'#dfe3e6','#efefea');
shelf(9.5,3.8,-Math.PI/2,2.0,4,'#dfe3e6','#efefea');
box(scene,1.2,2.0,.5,'#a77a52',4.4,1.0,5.8,.03); // wooden cabinet
box(scene,.6,1.6,.06,'#cfe0e6',5.3,.9,5.8,.01,{metalness:.6,roughness:.15}); // mirror
floorFan(6.2,4.6);floorFan(8.4,3.0,'#2b2b2b');
crate(scene,6.6,6.3);crate(scene,7.3,6.2,0,'#3a86d8');crate(scene,6.95,6.2,.32);
box(scene,.7,.06,.5,'#e46d2a',6.95,.72,6.2,.08); // orange cloth on crates

{const shed=new THREE.Group();shed.position.x=-4;shed.scale.x=-1;const moved=scene.children.slice(_n0);for(const o of moved)shed.add(o);scene.add(shed)}
// --- doorway marker
box(scene,.14,2.5,.3,'#f4f4f1',10,1.25,-1.25,.02);box(scene,.14,2.5,.3,'#f4f4f1',10,1.25,1.25,.02);box(scene,.14,.2,2.64,'#f4f4f1',10,2.55,0,.02);
// dark-grey corridor floor just inside the print building (IMG_0027)
{const m=new THREE.Mesh(new THREE.PlaneGeometry(4,3.2),new THREE.MeshStandardMaterial({map:darkFloor,roughness:.5}));m.rotation.x=-Math.PI/2;m.position.set(12.1,.004,0);m.receiveShadow=true;scene.add(m)}

// --- DTF 打印: black printers along the window wall, cream dryers extending forward (P027–P033, P051–P053)
const PRINTER_X=[13.2,17.4,21.6,25.8];
PRINTER_X.forEach(x=>{dtfPrinter(x,-8.2,0);dryer(x,-6.3,0,2.4)});
cabinet(29.3,-6.5,-Math.PI/2);cabinet(29.3,-5.8,-Math.PI/2);cabinet(29.3,-5.1,-Math.PI/2,.6,1.8,'#e7e7e2');
// 排单部门 desk (P031, P033, P055)
desk(27.6,-2.2,-Math.PI/2,2.2,'#f3f3ef',2);chair(26.9,-2.2,Math.PI/2,'#e9e9e6');
{const t=canvasTex(256,96,(g,w,h)=>{g.fillStyle='#2f3e8f';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.font='bold 44px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('排单部门',w/2,h/2)});const m=new THREE.Mesh(new THREE.PlaneGeometry(.9,.34),new THREE.MeshStandardMaterial({map:t}));m.position.set(29.82,1.9,-2.2);m.rotation.y=-Math.PI/2;scene.add(m)}
// 打单发货 corner (P023, P026)
desk(12.6,1.3,0,2.0,'#e1bf78',1);box(scene,.5,.35,.4,'#f0f0ec',12.0,.95,1.15,.03);for(let i=0;i<3;i++)box(scene,.5,.32,.4,C.card,13.4+(i%2)*.1,.16+i*.32,1.25,.02);
{const t=canvasTex(256,96,(g,w,h)=>{g.fillStyle='#2f3e8f';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.font='bold 44px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('打单发货',w/2,h/2)});const m=new THREE.Mesh(new THREE.PlaneGeometry(.9,.34),new THREE.MeshStandardMaterial({map:t}));m.position.set(12.6,1.9,2.32);m.rotation.y=Math.PI;scene.add(m)}
for(const[x,z]of[[25.6,-0.4],[24.6,0.6],[25.4,1.3]])box(scene,.6,.45,.5,C.card,x,.23,z,.02);
box(scene,.6,.45,.5,C.card,25.5,.68,-.3,.02);
dispenser(28.6,0.8);bucket(23.5,-4.4);bucket(27.8,1.6,'#2f6fd6',.9);
bucket(21.2,-0.2,'#eeeeea',1.4);
for(const[x,z]of[[19.6,-4.4],[13.2,-4.6]])crate(scene,x,z);
box(scene,.5,.5,.02,'#5bbf62',29.85,2.4,-4,.02).rotation.y=Math.PI/2; // wall fan (green, P031)

// --- 设计办公: OSB walls, desks along both sides (P062)
{const m=new THREE.Mesh(new THREE.PlaneGeometry(7.8,1.4),mOsb);m.position.set(14,2.0,8.88);m.rotation.y=Math.PI;scene.add(m)}
box(scene,7.8,.03,.25,'#f2f2ee',14,1.6,8.75,.01);
desk(12.2,5.0,Math.PI/2,3.2,'#2b2b2d',2);desk(15.8,5.4,-Math.PI/2,3.2,'#b98a5a',2);
chair(12.9,4.6,-Math.PI/2);chair(12.9,6.0,-Math.PI/2);chair(15.1,5.0,Math.PI/2,'#3a3d40');chair(15.1,6.4,Math.PI/2,'#5bc1b8');
box(scene,1.0,.3,.25,'#f5f5f2',14,2.45,8.7,.04); // AC unit

// --- 楼梯口 (P038, P056)
for(let i=0;i<8;i++)box(scene,3.4,.18,.42,'#7d4537',20,.09+i*.18,8.6-i*.42,.01);
box(scene,.04,1.0,3.2,'#c9cdd0',18.3,1.6,6.6,.01,{metalness:.5});

// --- 会客厅: white room, sofa, TV, desk, dining set, dartboard (P037, P057–P059)
sofa(24.0,8.3,Math.PI);
box(scene,1.3,.75,.05,'#0f1112',22.15,1.5,6.2,.02).rotation.y=Math.PI/2;
desk(23.0,4.4,Math.PI/2,1.6,'#e9e9e5',1);chair(23.7,4.4,-Math.PI/2);
{const g=grp(27.4,6.4);box(g,1.4,.05,.8,'#1c1c1e',0,.74,0,.02);for(const a of[-.62,.62])for(const b of[-.32,.32])box(g,.04,.72,.04,'#222',a,.36,b,.01);for(const[a,b,r]of[[-.4,-.65,0],[.4,-.65,0],[-.4,.65,Math.PI],[.4,.65,Math.PI]])chair(27.4+a,6.4+b,r,'#1d1d1f')}
{const d=cyl(scene,.26,.26,.04,'#1b1b1b',29.88,1.7,4.6,24);d.rotation.z=Math.PI/2;const r=cyl(scene,.18,.18,.045,'#c8303a',29.88,1.7,4.6,24);r.rotation.z=Math.PI/2}
floorFan(28.7,8.2);box(scene,1.0,.3,.25,'#f5f5f2',26,2.45,8.75,.04);
windowAt(27,8.9,1.4,1.1,1.8,Math.PI,'#eef3f4');

// trees outside the north windows (P085, P088: greenery and road)
for(const[x,z,s]of[[-10,-12,1.2],[-4,-13,1.5],[3,-12.4,1.1],[8,-13.5,1.4],[15,-12.5,1.2],[24,-13,1.5],[-15.8,-6,1]]){const g=grp(x,z);cyl(g,.18*s,.22*s,1.6*s,'#6b5440',0,.8*s,0);sph(g,1.2*s,'#4f8a4d',0,2.2*s,0,1,.9,1);sph(g,.9*s,'#5f9a55',.6*s,2.8*s,.2,1,.9,1)}
box(scene,48,.02,3,'#5a5f5c',8,0,-11.2,.01);

/* ================= characters ================= */
function makeChar(look){
  const root=new THREE.Group();const S=new THREE.Group();root.add(S);
  const M=c=>mat(c,{roughness:.7});
  const legL=new THREE.Group(),legR=new THREE.Group();legL.position.set(-.09,.3,0);legR.position.set(.09,.3,0);S.add(legL,legR);
  cyl(legL,.07,.065,.26,look.pants,0,-.14,0,10);box(legL,.12,.07,.17,'#1b1b1b',0,-.28,.03,.03);
  cyl(legR,.07,.065,.26,look.pants,0,-.14,0,10);box(legR,.12,.07,.17,'#1b1b1b',0,-.28,.03,.03);
  box(S,.42,.38,.28,M(look.shirt),0,.48,0,.12);
  if(look.vest){box(S,.44,.3,.3,M('#ffd23f'),0,.5,0,.1);box(S,.45,.04,.31,M('#e8e8e8'),0,.52,0,.01)}
  const armL=new THREE.Group(),armR=new THREE.Group();armL.position.set(-.26,.62,0);armR.position.set(.26,.62,0);S.add(armL,armR);
  for(const a of[armL,armR]){cyl(a,.055,.05,.26,M(look.shirt),0,-.13,0,8);sph(a,.06,look.skin,0,-.28,0)}
  const head=new THREE.Group();head.position.y=.98;head.scale.setScalar(look.head||1);S.add(head);
  sph(head,.3,M(look.skin),0,0,0,1,.95,.95);
  sph(head,.035,'#1a1a1a',-.1,.02,.27);sph(head,.035,'#1a1a1a',.1,.02,.27);
  sph(head,.045,'#f2a2a0',-.17,-.07,.22,1,.6,.4);sph(head,.045,'#f2a2a0',.17,-.07,.22,1,.6,.4);
  box(head,.08,.018,.02,'#7a3d34',0,-.1,.28,.008);
  const H=look.hairC;
  if(look.hair==='short'){sph(head,.31,H,0,.06,-.02,1.02,.8,1.02);}
  if(look.hair==='spiky'){sph(head,.31,H,0,.07,-.02,1.02,.78,1.02);for(let i=0;i<7;i++){const s=sph(head,.07,H,(i-3)*.07,.27,.05-Math.abs(i-3)*.02,1,1.5,1);s.rotation.z=(i-3)*.2}}
  if(look.hair==='side'){sph(head,.31,H,0,.07,-.02,1.03,.8,1.03);sph(head,.14,H,-.12,.2,.17,1.4,.5,.8)}
  if(look.hair==='cap'){sph(head,.31,H,0,.08,0,1.04,.72,1.04);const b=box(head,.34,.03,.2,H,0,.08,.3,.015);b.rotation.x=.1}
  if(look.hair==='bucket'){cyl(head,.27,.32,.2,H,0,.2,0,20);cyl(head,.42,.42,.025,H,0,.11,0,24)}
  if(look.glasses){const g=new THREE.MeshStandardMaterial({color:'#111'});for(const x of[-.1,.1]){const r=new THREE.Mesh(new THREE.TorusGeometry(.06,.012,6,16),g);r.position.set(x,.02,.29);head.add(r)}box(head,.06,.012,.01,'#111',0,.03,.3,.004)}
  if(look.phones){const b=new THREE.Mesh(new THREE.TorusGeometry(.32,.025,6,20,Math.PI),mat('#2b2b2e'));b.position.y=.04;head.add(b);for(const x of[-.31,.31]){const c=cyl(head,.07,.07,.06,'#2b2b2e',x,0,0,14);c.rotation.z=Math.PI/2}}
  root.traverse(o=>{if(o.isMesh)o.castShadow=true});
  return {root,S,legL,legR,armL,armR,head};
}
function guestLook(seedStr){let h=0;for(const ch of seedStr)h=(h*31+ch.charCodeAt(0))>>>0;const sh=['#5a8dee','#f08bb0','#7cc6a8','#f2c14e','#b28dff','#ff8a5b','#59c3e1'];const hr=['short','side','spiky','cap','bucket'];return{skin:['#f1c9a5','#e8bb92','#f3d0b0'][h%3],shirt:sh[h%sh.length],pants:'#33384a',hair:hr[(h>>3)%hr.length],hairC:['#1c1612','#4a3324','#2a2a2a','#7a5a3a'][(h>>5)%4],head:1}}

/* ================= extra detail (world coords) ================= */
// shed exterior door on the south side (IMG_0028: outside entrance opens into the shed)
box(scene,.12,2.4,.16,'#e9e9e6',3.0,1.2,9,.02);box(scene,.12,2.4,.16,'#e9e9e6',4.6,1.2,9,.02);box(scene,1.72,.14,.16,'#e9e9e6',3.8,2.4,9,.02);
box(scene,1.3,.02,.8,'#3e8c6c',3.8,.01,9.7,.01);
// garment rail with hanging plaid / pink cloth (IMG_0013, IMG_0028)
{const g=grp(-6.6,4.6,.3);for(const a of[-.8,.8]){box(g,.05,1.7,.05,'#c9cdd0',a,.85,0,.01);box(g,.5,.04,.05,'#c9cdd0',a,.02,0,.01)}box(g,1.7,.04,.04,'#c9cdd0',0,1.68,0,.01);
 const plaid=canvasTex(64,64,(c,w,h)=>{c.fillStyle='#d9653b';c.fillRect(0,0,w,h);c.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<w;i+=16){c.fillRect(i,0,6,h);c.fillRect(0,i,w,6)}});
 const pinkT=canvasTex(64,64,(c,w,h)=>{c.fillStyle='#f0bfd6';c.fillRect(0,0,w,h);c.fillStyle='#c05a96';for(let i=0;i<9;i++){c.beginPath();c.arc(rnd()*w,rnd()*h,5,0,7);c.fill()}});
 [[plaid,-.45],[pinkT,.05],[plaid,.5]].forEach(([t,x])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(.45,1.0),new THREE.MeshStandardMaterial({map:t,side:THREE.DoubleSide,roughness:1}));m.position.set(x,1.15,0);m.castShadow=true;g.add(m)})}
// buckets, bins, tubes, bottles
for(const[x,z]of[[-3.2,4.3],[4.7,2.9],[-10,-3.2]]){const g=grp(x,z);cyl(g,.2,.17,.42,'#f4f4f0',0,.21,0,16);cyl(g,.21,.21,.04,'#f2c94c',0,.44,0,16)}
for(const[x,z]of[[-8.6,3.0],[2.6,-3.6]])cyl(scene,.2,.17,.6,'#202224',x,.3,z,16);
for(let i=0;i<6;i++){const t=cyl(scene,.05,.05,1.9,'#d4bd94',9.62,.95,-3.9+i*.13,10);t.rotation.x=.12}
// DTF: shelf of white ink bottles, cartons by the window, film rolls, spinning wall fans (P031, P060, IMG_0027)
{const g=grp(29.3,-0.2,-Math.PI/2);for(let l=0;l<3;l++){box(g,1.8,.04,.4,'#e6e6e1',0,.5+l*.55,0,.01);for(let i=0;i<7;i++)cyl(g,.08,.08,.26,'#f6f6f3',-.75+i*.25,.66+l*.55,0,10)}for(const a of[-.9,.9])box(g,.04,1.7,.4,'#bdbdb8',a,.85,0,.01)}
for(let i=0;i<7;i++)box(scene,.6,.4,.45,pick([C.card,'#c49465','#b07e4e']),28.4+(i%3)*.62,.2+Math.floor(i/3)*.4,-8.3,.02);
for(let i=0;i<4;i++){const r=cyl(scene,.12,.12,1.4,'#f4f4f0',19.4+i*.3,.12,-3.9,12);r.rotation.z=Math.PI/2}
for(const z of[-6,-2.6]){const g=grp(29.82,z,-Math.PI/2);box(g,.12,.08,.12,'#3a3a3a',0,2.4,-.04,.02);const h=cyl(g,.3,.3,.08,'#5bbf62',0,2.4,.06,20);h.rotation.x=Math.PI/2;h.material=new THREE.MeshStandardMaterial({color:'#5bbf62',transparent:true,opacity:.55});const bl=new THREE.Group();bl.position.set(0,2.4,.06);g.add(bl);for(let i=0;i<3;i++){const b=box(bl,.08,.24,.012,'#2f7a36',0,0,0,.01);b.rotation.z=i*2.09;b.position.set(Math.sin(i*2.09)*.12,Math.cos(i*2.09)*.12,0)}FANS.push(bl)}
// steam puffs pool for presses
const PUFFS=[];const puffGeo=new THREE.SphereGeometry(.12,10,8);
function puff(x,y,z){const m=new THREE.Mesh(puffGeo,new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.7,depthWrite:false}));m.position.set(x+(Math.random()-.5)*.3,y,z+(Math.random()-.5)*.3);scene.add(m);PUFFS.push({m,t:0})}

/* ================= stations ================= */
const PW=PRESSES.map(p=>{const v=new THREE.Vector3();p.g.getWorldPosition(v);return v});
const STATIONS=[];
PRINTER_X.forEach((x,i)=>STATIONS.push({kind:'printer',i,x:x+1.4,z:-7.55,face:Math.PI,mx:x,mz:-7.6,name:'DTF 打印机 '+(i+1),acts:['ink','print']}));
PW.forEach((v,i)=>STATIONS.push({kind:'press',i,x:v.x,z:-6.95,face:Math.PI,mx:v.x,mz:-7.85,name:'烫画机',acts:['press']}));
for(const x of[-4,-1,2])STATIONS.push({kind:'cut',x,z:1.45,face:0,mx:x,mz:2.6,name:'裁床',acts:['cut']});
STATIONS.push({kind:'ship',x:12.6,z:2.0,face:Math.PI,mx:12.6,mz:1.3,name:'打单发货',acts:['ship']});
STATIONS.push({kind:'tea',x:27.4,z:5.25,face:0,mx:27.4,mz:6.4,name:'会客厅',acts:['tea']});
const ACT={
 ink:{label:'加墨水',key:'E',need:null,give:'ink',pop:'+10 墨水',sfx:'glug'},
 print:{label:'打印出膜',key:'R',need:['ink'],give:'print',pop:'+1 烫画膜',sfx:'beep'},
 cut:{label:'裁片',key:'E',need:null,give:'cut',pop:'+1 衣片',sfx:'snip'},
 press:{label:'压烫画',key:'E',need:['film','cloth'],give:'press',pop:'+1 成衣',sfx:'press'},
 ship:{label:'打包发货',key:'E',need:['garment'],give:'ship',pop:'+1 发货',sfx:'ding'},
 tea:{label:'泡杯茶',key:'E',need:null,give:null,pop:'☕',sfx:'ding'},
};
const NEED_TXT={ink:'没墨水了，先加墨',film:'没烫画膜，去 DTF 打印',cloth:'没衣片，去裁床裁',garment:'没有成衣，去烫画'};

/* ================= routing between rooms ================= */
function roomOf(x,z){if(z>9.05)return'out';if(x<10)return'shed';if(z>2.4&&x<18)return'design';if(z>2.4&&x>22)return'recep';return'dtf'}
const DOORS=[['shed','dtf',[8.8,0],[11.2,0]],['shed','out',[3.8,8.3],[3.8,9.9]],['dtf','design',[17.1,1.7],[17.1,3.1]],['dtf','recep',[26.6,1.7],[26.6,3.1]]];
function route(x0,z0,x1,z1){const a=roomOf(x0,z0),b=roomOf(x1,z1);if(a===b)return[[x1,z1]];
  const prev={[a]:null},q=[a];while(q.length){const r=q.shift();if(r===b)break;for(const[p,qq,w1,w2]of DOORS){let n=null,ws=null;if(p===r){n=qq;ws=[w1,w2]}else if(qq===r){n=p;ws=[w2,w1]}if(n&&!(n in prev)){prev[n]={r,ws};q.push(n)}}}
  if(!(b in prev))return[[x1,z1]];const pts=[];let c=b;while(prev[c]){pts.unshift(...prev[c].ws);c=prev[c].r}pts.push([x1,z1]);return pts}
function clampAny(x,z){if(z>9.05)return[Math.min(6,Math.max(1.5,x)),Math.min(12,z)];return clampXZ(x,z)}

/* ================= actors ================= */
const labels=document.getElementById('labels');
const actors=new Map();
function makeCarry(type){const g=new THREE.Group();
  if(type==='bag')sph(g,.22,C.green,0,0,0,1.2,.8,1);
  if(type==='roll'){const m=cyl(g,.12,.12,1.2,'#e8e2d2',0,0,0,14);m.rotation.z=Math.PI/2}
  if(type==='box')box(g,.42,.3,.32,C.card,0,0,0,.02);
  if(type==='shirt')box(g,.36,.12,.3,C.pink,0,0,0,.04);
  if(type==='paper')box(g,.3,.02,.4,'#ffffff',0,0,0,.005);
  if(type==='jug'){cyl(g,.1,.1,.26,'#f4f4f0',0,0,0,12);cyl(g,.04,.04,.06,'#18c1e6',0,.16,0,8)}
  return g}
function addActor(key,{name,sub,look,x,z,face=0,kind,color}){
  const c=makeChar(look);c.root.position.set(x,0,z);c.root.rotation.y=face;scene.add(c.root);
  const tag=document.createElement('div');tag.className='tag '+kind;
  const bub=document.createElement('div');bub.className='bub'+(kind==='npc'?' npcb':'');
  const nm=document.createElement('div');nm.className='nm';nm.textContent=name;
  if(sub){const s=document.createElement('small');s.textContent=sub;nm.appendChild(s)}
  tag.append(bub,nm);labels.appendChild(tag);
  const a={key,name,kind,color,c,x,z,tx:x,tz:z,face,wantFace:null,path:[],anim:'idle',animUntil:0,carry:null,carryObj:null,t:rnd()*10,tag,bub,sayUntil:0,step:-1,stepUntil:0,arrived:true};
  c.root.userData.actor=a;actors.set(key,a);return a;
}
function removeActor(key){const a=actors.get(key);if(!a)return;scene.remove(a.c.root);a.tag.remove();actors.delete(key)}
function say(a,text,ms=6000){a.bub.textContent=text;a.bub.classList.add('on');a.sayUntil=performance.now()+ms}
function setCarry(a,type){if(a.carry===type)return;if(a.carryObj){a.c.S.remove(a.carryObj);a.carryObj=null}a.carry=type||null;if(type){a.carryObj=makeCarry(type);a.carryObj.position.set(0,type==='bag'?.82:.6,.3);a.c.S.add(a.carryObj)}}
function goto(a,x,z,face=null){a.path=route(a.x,a.z,x,z);a.tx=x;a.tz=z;a.wantFace=face;a.arrived=false}
function play(a,anim,secs){a.anim=anim;a.animUntil=performance.now()+secs*1000}
const SPEED=2.6;
function stepActor(a,dt,now){
  let moving=false;
  if(a.path.length){const[px,pz]=a.path[0];const dx=px-a.x,dz=pz-a.z,d=Math.hypot(dx,dz);
    if(d<.06){a.path.shift();if(!a.path.length)a.arrived=true}
    else{moving=true;const s=Math.min(d,SPEED*(a.carry?.8:1)*dt);a.x+=dx/d*s;a.z+=dz/d*s;const want=Math.atan2(dx,dz);let df=want-a.face;df=Math.atan2(Math.sin(df),Math.cos(df));a.face+=df*Math.min(1,dt*10)}}
  if(!moving&&a.wantFace!=null){let df=a.wantFace-a.face;df=Math.atan2(Math.sin(df),Math.cos(df));a.face+=df*Math.min(1,dt*7)}
  const anim=moving?'walk':(now<a.animUntil?a.anim:'idle');a.state=anim;
  a.t+=dt;const c=a.c;c.root.position.set(a.x,0,a.z);c.root.rotation.y=a.face;
  c.S.rotation.x=0;c.head.rotation.set(0,0,0);c.legL.rotation.x=c.legR.rotation.x=0;c.S.position.y=0;
  const carryArms=()=>{c.armL.rotation.x=c.armR.rotation.x=-1.25};
  if(anim==='walk'){const w=Math.sin(a.t*11);c.legL.rotation.x=w*.6;c.legR.rotation.x=-w*.6;if(a.carry)carryArms();else{c.armL.rotation.x=-w*.5;c.armR.rotation.x=w*.5}c.S.position.y=Math.abs(Math.cos(a.t*11))*.05}
  else if(anim==='work'){const w=Math.sin(a.t*4);c.armL.rotation.x=-1.0+w*.35;c.armR.rotation.x=-1.0-w*.35;c.head.rotation.x=.2}
  else if(anim==='type'){c.armL.rotation.x=-1.1+Math.sin(a.t*18)*.08;c.armR.rotation.x=-1.1+Math.cos(a.t*18)*.08;c.head.rotation.x=.08}
  else if(anim==='pick'){const k=Math.sin(Math.min(1,(a.animUntil-now)/700)*Math.PI);c.S.rotation.x=k*.5;c.armL.rotation.x=c.armR.rotation.x=-1.2*k-.2}
  else if(anim==='feed'){const w=Math.sin(a.t*5);c.armL.rotation.x=-2.3+w*.2;c.armR.rotation.x=-2.0-w*.2;c.head.rotation.x=-.25}
  else if(anim==='watch'){c.head.rotation.y=Math.sin(a.t*.9)*.6;c.armL.rotation.x=c.armR.rotation.x=.1;c.armL.rotation.z=.25;c.armR.rotation.z=-.25}
  else if(anim==='wave'){c.armR.rotation.x=-2.8;c.armR.rotation.z=Math.sin(a.t*12)*.4;c.S.position.y=Math.abs(Math.sin(a.t*6))*.03}
  else if(anim==='jump'){c.S.position.y=Math.abs(Math.sin(a.t*8))*.35;c.armL.rotation.x=c.armR.rotation.x=-2.6}
  else{if(a.carry)carryArms();else{c.armL.rotation.x=c.armR.rotation.x=Math.sin(a.t*1.5)*.05}c.S.position.y=Math.sin(a.t*2)*.012}
  if(anim!=='watch'){c.armL.rotation.z=0;if(anim!=='wave')c.armR.rotation.z=0}
  if(a.sayUntil&&now>a.sayUntil){a.bub.classList.remove('on');a.sayUntil=0}
}

/* ================= NPC jobs ================= */
const ST=k=>STATIONS.filter(s=>s.kind===k);
const pr=ST('printer'),ps=ST('press'),cu=ST('cut'),shipS=ST('ship')[0];
const S=(st,anim,dur,o={})=>({to:[st.x,st.z],face:st.face,anim,dur,...o});
const P=(x,z,face,anim,dur,o={})=>({to:[x,z],face,anim,dur,...o});
const JOBS={
 datou:[S(ps[3],'work',8,{say:'印花！'}),P(-3.9,-5.9,Math.PI,'pick',1.4,{carry:'shirt'}),S(ps[2],'work',8,{carry:null}),P(-1.7,-5.9,Math.PI,'pick',1.4,{carry:'shirt'}),S(ps[3],'work',8,{carry:null,say:'这件压好了'})],
 aodebiao:[P(6.0,4.6,Math.PI/2,'pick',1.6,{carry:'bag',say:'加料去！'}),S(pr[0],'feed',3.2,{carry:null,say:'加料！'}),S(pr[0],'watch',5,{say:'我盯着这台'}),S(pr[1],'watch',4),
   P(6.0,4.6,Math.PI/2,'pick',1.6,{carry:'jug'}),S(pr[2],'feed',3.2,{carry:null,say:'墨水加满'}),S(pr[2],'watch',5),S(pr[3],'watch',4,{say:'机器正常'})],
 xiaolin:[S(pr[1],'work',6),S(pr[1],'watch',3),S(pr[2],'work',6,{say:'打印机在跑'}),S(pr[3],'work',5),S(pr[0],'work',5,{say:'这单走 DTF'})],
 xiaomao:[S(cu[0],'work',6),S(cu[1],'work',6,{say:'裁片对一下码'}),S(cu[2],'work',6),P(2.2,1.45,0,'pick',1.2,{carry:'shirt'}),P(-0.6,-5.9,Math.PI,'pick',1.2,{carry:null,say:'衣片送到'})],
 asong:[P(5.4,-6.8,Math.PI/2,'pick',1.6,{carry:'roll',say:'上布'}),P(4.4,-1.6,-Math.PI/2,'pick',1.4,{carry:null}),P(5.4,-6.8,Math.PI/2,'watch',5),P(7.6,-4.6,Math.PI,'work',5,{say:'对一下库存'})],
 xiaosong:[P(12.95,5.0,-Math.PI/2,'type',12),P(12.95,6.2,-Math.PI/2,'type',8,{say:'稿子改好了'}),P(12.95,5.0,-Math.PI/2,'pick',1,{carry:'paper'}),S(pr[1],'watch',3,{carry:null,say:'出图了看看'})],
 abin:[S(shipS,'type',6),S(shipS,'type',5,{say:'打单'}),P(13.4,1.85,Math.PI,'pick',1.4,{carry:'box'}),P(3.8,10.6,Math.PI,'pick',1.3,{carry:null,say:'发货！'}),P(25.6,4.6,0,'idle',3,{say:'喝口茶'})],
};
function npcThink(a,now){
  const id=a.key.slice(4),job=JOBS[id];if(!job)return;
  if(a.step<0){a.step=Math.floor(rnd()*job.length);const s=job[a.step];goto(a,...s.to,s.face)}
  const s=job[a.step];
  if(!a.arrived)return;
  if(!a.stepUntil){a.stepUntil=now+s.dur*1000;play(a,s.anim,s.dur);if('carry'in s)setCarry(a,s.carry);if(s.say&&rnd()<.7)say(a,s.say,3200);if(s.anim==='feed')inkFlash=2}
  else if(now>a.stepUntil){a.stepUntil=0;a.step=(a.step+1)%job.length;const n=job[a.step];goto(a,...n.to,n.face)}
}
let inkFlash=0;
for(const r of ROSTER){const a=addActor('npc:'+r.id,{name:r.name,sub:r.role,look:r.look,x:r.home[0],z:r.home[1],face:r.face,kind:'npc',color:r.color})}
function respawnNpc(id){const r=RBYID[id];addActor('npc:'+id,{name:r.name,sub:r.role,look:r.look,x:r.home[0],z:r.home[1],face:r.face,kind:'npc',color:r.color})}

/* ================= camera ================= */
let fly=null,follow=null;
function flyTo(pos,tgt,ms=1100){fly={p0:camera.position.clone(),t0:controls.target.clone(),p1:new THREE.Vector3(...pos),t1:new THREE.Vector3(...tgt),s:performance.now(),ms};follow=null;updFollowBtn()}
// phones held upright: look along the workshop's long side so it fills the tall screen
const portrait=()=>innerWidth<innerHeight;
function godCam(x,z,d){if(portrait())return [[x+d*.42,d*1.15,z-d*.1],[x,0,z]];return [[x+d*.12,d,z+d*.42],[x,0,z]]}
function overview(){return portrait()?godCam(8,0.5,78):[[8,58,16],[8,0,0.5]]}

/* ================= input ================= */
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
const pickPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
let down=null;
canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:performance.now()}});
canvas.addEventListener('pointerup',e=>{if(!down)return;const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y);const dt=performance.now()-down.t;down=null;if(moved>6||dt>500)return;onTap(e)});
canvas.addEventListener('dblclick',e=>{const a=hitActor(e);if(a){follow=a;fly=null;updFollowBtn()}});
function setNdc(e){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera)}
function hitActor(e){setNdc(e);const hits=ray.intersectObjects([...actors.values()].map(a=>a.c.root),true);if(!hits.length)return null;let o=hits[0].object;while(o&&!o.userData.actor)o=o.parent;return o?o.userData.actor:null}
function onTap(e){if(!me){ent.hidden=false;return}const a=hitActor(e);if(a&&a!==me){play(a,'wave',1.2);say(a,a.kind==='npc'?pick(NPC_LINES[a.key.slice(4)]):'👋',2500);return}
  setNdc(e);const p=new THREE.Vector3();if(!ray.ray.intersectPlane(pickPlane,p))return;
  let best=null,bd=1.3;for(const s of STATIONS){const d=Math.min(Math.hypot(p.x-s.mx,p.z-s.mz),Math.hypot(p.x-s.x,p.z-s.z));if(d<bd){bd=d;best=s}}
  if(best){moveMe(best.x,best.z,best.face);marker(best.x,best.z);return}
  const[x,z]=clampAny(p.x,p.z);moveMe(x,z);marker(x,z)}
const ring=new THREE.Mesh(new THREE.RingGeometry(.22,.3,32),new THREE.MeshBasicMaterial({color:'#ff6a3d',transparent:true,opacity:.9}));ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);let ringT=0;
function marker(x,z){ring.position.set(x,.02,z);ring.visible=true;ringT=1}
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const k=e.key.toLowerCase();if(k==='e'||k==='r'){const s=nearStation();if(!s)return;const act=s.acts.find(x=>ACT[x].key.toLowerCase()===k)||(k==='e'?s.acts[0]:null);if(act)doAct(s,act)}});

/* ================= me / presence ================= */
let me=null,myChar=null,myNick='',room=null,db=null,user=null;
const ent=document.getElementById('entry'),rosterEl=document.getElementById('roster'),goBtn=document.getElementById('goBtn'),guestIn=document.getElementById('guestName');
let choice=null;
function avatarSVG(r){const L=r.look;return 'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="34" r="${22*(L.head>1?1.12:1)}" fill="${L.skin}"/><path d="M${L.hair==='bucket'?'8 22 h48 l-6 -12 h-36z':'11 30 q0 -22 21 -22 q21 0 21 22 q-6 -10 -21 -10 q-15 0 -21 10z'}" fill="${L.hairC}"/><circle cx="25" cy="36" r="2.6" fill="#1a1a1a"/><circle cx="39" cy="36" r="2.6" fill="#1a1a1a"/>${L.glasses?'<circle cx="25" cy="36" r="5" fill="none" stroke="#111" stroke-width="1.6"/><circle cx="39" cy="36" r="5" fill="none" stroke="#111" stroke-width="1.6"/>':''}<ellipse cx="20" cy="43" rx="3.5" ry="2" fill="#f2a2a0"/><ellipse cx="44" cy="43" rx="3.5" ry="2" fill="#f2a2a0"/><rect x="28" y="45" width="8" height="2" rx="1" fill="#7a3d34"/></svg>`)}
function drawRoster(){rosterEl.innerHTML='';const taken=takenChars();
  for(const r of ROSTER){const b=document.createElement('button');b.className='pick'+(choice===r.id?' sel':'');b.type='button';
    const img=document.createElement('img');img.src=avatarSVG(r);img.alt='';const nb=document.createElement('b');nb.textContent=r.name;const sm=document.createElement('small');sm.textContent=r.role;
    b.append(img,nb,sm);if(taken.has(r.id)){b.disabled=true;const t=document.createElement('span');t.className='busy';t.textContent='在线';b.appendChild(t)}
    b.onclick=()=>{choice=r.id;guestIn.value='';drawRoster();goBtn.disabled=false};rosterEl.appendChild(b)}}
guestIn.addEventListener('input',()=>{if(guestIn.value.trim()){choice='guest';drawRoster()}goBtn.disabled=!(choice&&(choice!=='guest'||guestIn.value.trim()))});
try{const s=JSON.parse(localStorage.getItem('104me')||'null');if(s){choice=s.c;if(s.c==='guest')guestIn.value=s.n||'';goBtn.disabled=false}}catch(e){}
goBtn.onclick=enter;
function enter(){
  if(!choice)return;const taken=takenChars();if(choice!=='guest'&&taken.has(choice)){drawRoster();return}
  myChar=choice;const r=RBYID[myChar];myNick=r?r.name:guestIn.value.trim().slice(0,10);
  try{localStorage.setItem('104me',JSON.stringify({c:myChar,n:myNick}))}catch(e){}
  if(r){const npc=actors.get('npc:'+r.id);const x=npc?npc.x:r.home[0],z=npc?npc.z:r.home[1];removeActor('npc:'+r.id);me=addActor('me',{name:myNick,look:r.look,x,z,face:r.face,kind:'me',color:r.color})}
  else{me=addActor('me',{name:myNick,sub:'访客',look:guestLook(myNick),x:3.8,z:8.2,face:Math.PI,kind:'me',color:'#ff6a3d'})}
  ent.hidden=true;audioOn();
  flyTo(...godCam(me.x,me.z,18),1300);setTimeout(()=>{follow=me;updFollowBtn()},1350);
  pushPresence();sysMsg(myNick+' 进了车间');updWhere();
  const hint=r&&JOBS[r.id]?{datou:'你负责印花：走到烫画机旁按 E 压烫画',aodebiao:'你负责加料看机：去 DTF 打印机按 E 加墨水',xiaolin:'你负责 DTF：在打印机旁按 R 打印出膜',xiaomao:'你负责裁剪：在裁床旁按 E 裁片',asong:'你管布卷：去裁床帮忙按 E 裁片',xiaosong:'你做设计：去 DTF 打印机按 R 出膜',abin:'你负责发货：在打单发货台按 E 打包'}[r.id]:'点工位走过去，按 E 帮忙干活';
  sysMsg(hint);
}
function takenChars(){const s=new Set();if(room){for(const p of room.peers()){if(p.isMe)continue;const c=p.presence&&p.presence.c;if(c&&c!=='guest')s.add(c)}}return s}
function moveMe(x,z,face=null){goto(me,x,z,face);pushPresence()}
function pushPresence(extra){if(!room||!me)return;room.presence({v:1,c:myChar,n:myNick,x:+me.x.toFixed(2),z:+me.z.toFixed(2),tx:+me.tx.toFixed(2),tz:+me.tz.toFixed(2),f:me.wantFace==null?null:+me.wantFace.toFixed(2),...(extra||{})}).catch(()=>{})}

const peerSeen={};
function syncPeers(list){
  const seen=new Set();
  for(const p of list){if(p.isMe||p.kind!=='viewer')continue;const q=p.presence||{};if(!q.n)continue;
    const key='peer:'+p.peer;seen.add(key);let a=actors.get(key);
    const r=q.c&&q.c!=='guest'?RBYID[q.c]:null;
    if(!a){if(r)removeActor('npc:'+r.id);
      a=addActor(key,{name:String(q.n).slice(0,10),sub:r?null:'访客',look:r?r.look:guestLook(String(q.n)),x:+q.x||0,z:+q.z||0,kind:'peer',color:r?r.color:'#8fa3ff'});a.charId=r?r.id:null}
    const tx=+q.tx,tz=+q.tz;if(Number.isFinite(tx)&&(Math.abs(tx-a.tx)>.01||Math.abs(tz-a.tz)>.01)){if(Math.hypot(a.x-(+q.x),a.z-(+q.z))>5){a.x=+q.x;a.z=+q.z}goto(a,tx,tz,Number.isFinite(q.f)?q.f:null)}
    const ps=peerSeen[key]||(peerSeen[key]={});
    if(q.w&&q.w.t&&q.w.t!==ps.w){ps.w=q.w.t;play(a,q.w.a||'work',1.3);if(q.w.k==='press')pressNear(a,1.3)}
    if(q.e&&q.e.t&&q.e.t!==ps.e){ps.e=q.e.t;emoteOn(a,q.e.k)}
    if(q.s&&q.s.id&&!seenMsg.has(q.s.id)){incoming({id:q.s.id,c:q.c,n:q.n,m:q.s.m,t:q.s.t||Date.now()},true)}
  }
  for(const k of [...actors.keys()])if(k.startsWith('peer:')&&!seen.has(k)){const a=actors.get(k);const cid=a.charId;removeActor(k);if(cid&&myChar!==cid)respawnNpc(cid)}
  renderWho();if(!ent.hidden)drawRoster();
}

/* ================= production economy ================= */
// The workshop runs on a shared clock: every viewer computes the same NPC output for today,
// then adds what real people did (each person's own counters in db: prod/<userId>).
const CYC=12,ORDER=30;
function dayInfo(){const ms=Date.now()+8*3600e3;const day=Math.floor(ms/86400e3);return{day:String(day),t:(ms%86400e3)/1000}}
const kk=(t,o,p)=>t>=o?Math.floor((t-o)/p)+1:0;
function npcTotals(t){return{ink:10*kk(t,0,10*CYC),print:kk(t,2,CYC),cut:kk(t,4,CYC),press:kk(t,6,CYC),ship:kk(t,9,CYC)}}
const mine={ink:0,print:0,cut:0,press:0,ship:0};let others={},prodDocs=[];
function totals(){const t=npcTotals(dayInfo().t);const T={...t};for(const k in T)T[k]+=mine[k]+(others[k]||0);return T}
function buffers(T){return{ink:Math.max(0,T.ink-T.print),film:Math.max(0,T.print-T.press),cloth:Math.max(0,T.cut-T.press),garment:Math.max(0,T.press-T.ship),ship:T.ship}}
let myDocRef=null,dirty=false,writing=false;
async function flushProd(){if(!myDocRef||!dirty||writing)return;dirty=false;writing=true;try{await myDocRef.set({d:dayInfo().day,n:myNick,c:{...mine}})}catch(e){}writing=false}
setInterval(flushProd,1600);
function sumOthers(){const day=dayInfo().day;const o={ink:0,print:0,cut:0,press:0,ship:0};for(const d of prodDocs){if(d.id===myId||d.d!==day||!d.c)continue;for(const k in o)o[k]+=Math.max(0,Math.min(5000,+d.c[k]||0))}others=o}
let myId=null;

/* actions */
const actEl=document.getElementById('act');let lastAct=0;
function nearStation(){if(!me||me.path.length)return null;let best=null,bd=.9;for(const s of STATIONS){const d=Math.hypot(me.x-s.x,me.z-s.z);if(d<bd){bd=d;best=s}}return best}
let shownSt=null;
function updActBar(){const s=nearStation();if(s===shownSt)return;shownSt=s;actEl.innerHTML='';actEl.hidden=!s;if(!s)return;
  const t=document.createElement('span');t.className='st';t.textContent=s.name;actEl.appendChild(t);
  for(const k of s.acts){const b=document.createElement('button');b.type='button';const kb=document.createElement('kbd');kb.textContent=ACT[k].key;b.append(kb,document.createTextNode(ACT[k].label));b.onclick=()=>doAct(s,k);actEl.appendChild(b)}}
function doAct(s,k){const now=performance.now();if(now-lastAct<1100)return;const A=ACT[k];
  if(A.need){const B=buffers(totals());for(const n of A.need)if(B[n]<1){popup(s.mx,1.7,s.mz,NEED_TXT[n],'#ffd166');sfx('nope');lastAct=now;return}}
  lastAct=now;me.wantFace=s.face;const anim=k==='ink'?'feed':k==='ship'?'pick':k==='tea'?'wave':'work';play(me,anim,1.2);
  if(k==='press')pressNear(me,1.2);
  setTimeout(()=>{if(A.give){mine[A.give]+=A.give==='ink'?10:1;dirty=true}popup(s.mx,1.8,s.mz,A.pop,'#7ad39a');sfx(A.sfx);if(k==='ink')inkFlash=2;if(k==='tea')emoteOn(me,'☕');renderHud(true)},900);
  pushPresence({w:{k:s.kind,a:anim,t:Date.now()}})}
function pressNear(a,secs){for(const p of PRESSES){const v=new THREE.Vector3();p.g.getWorldPosition(v);if(Math.hypot(v.x-a.x,(v.z+.9)-a.z)<1.1)p.busy=Math.max(p.busy,secs)}}

/* HUD */
const hudEl=document.getElementById('hud');let lastOrders=-1,lastHud='';
function renderHud(force){const T=totals(),B=buffers(T);const done=Math.floor(B.ship/ORDER),cur=B.ship%ORDER;
  const key=[B.ink,B.film,B.cloth,B.garment,B.ship].join();if(key===lastHud&&!force)return;lastHud=key;
  hudEl.querySelector('#oNo').textContent='第 '+(done+1)+' 单';hudEl.querySelector('#oBar').style.width=(cur/ORDER*100)+'%';hudEl.querySelector('#oTxt').textContent=cur+' / '+ORDER+' 件';
  const set=(id,v)=>hudEl.querySelector(id).textContent=v;set('#bInk',B.ink);set('#bFilm',B.film);set('#bCloth',B.cloth);set('#bGar',B.garment);set('#bShip',B.ship.toLocaleString());
  const myTot=mine.print+mine.cut+mine.press+mine.ship+Math.floor(mine.ink/10);set('#bMine',myTot);
  if(lastOrders>=0&&done>lastOrders){confetti();sysMsg('🎉 第 '+done+' 单 '+ORDER+' 件全部发货！');sfx('win')}lastOrders=done;
  for(const bar of INKBARS){bar.scale.x=Math.max(.05,Math.min(1,B.ink/20));bar.material=mat(B.ink<3?'#e5484d':'#2fd06a')}
}
function renderBoard(){const el=document.getElementById('board');const day=dayInfo().day;const rows=[];
  if(me)rows.push({n:myNick,v:mine.print+mine.cut+mine.press+mine.ship+Math.floor(mine.ink/10)});
  for(const d of prodDocs){if(d.id===myId||d.d!==day||!d.c)continue;const c=d.c;rows.push({n:String(d.n||'某人').slice(0,10),v:(+c.print||0)+(+c.cut||0)+(+c.press||0)+(+c.ship||0)+Math.floor((+c.ink||0)/10)})}
  rows.sort((a,b)=>b.v-a.v);el.textContent=rows.filter(r=>r.v>0).slice(0,3).map((r,i)=>['🥇','🥈','🥉'][i]+r.n+' '+r.v).join('  ')||'今天还没人上榜，去干一件活吧'}

/* NPC economy events -> visible machine activity */
let lastNpc=null;
function npcEvents(){const T=npcTotals(dayInfo().t);if(!lastNpc){lastNpc=T;return}
  if(T.print>lastNpc.print){const i=T.print%4;CARRIAGES[i].boost=2.5;popup(PRINTER_X[i],1.7,-7.6,'+1 膜','#9fd8ff')}
  if(T.press>lastNpc.press){const a=actors.get('npc:datou');const p=a?nearestPress(a):PRESSES[3];p.busy=1.3;const v=new THREE.Vector3();p.g.getWorldPosition(v);setTimeout(()=>popup(v.x,1.8,v.z,'+1 成衣','#ffd0e0'),900)}
  if(T.ship>lastNpc.ship)popup(12.6,1.6,1.3,'+1 发货','#d7ffd9');
  if(T.ink>lastNpc.ink)inkFlash=2;
  lastNpc=T;renderHud()}
function nearestPress(a){let b=PRESSES[0],bd=1e9;for(const p of PRESSES){const v=new THREE.Vector3();p.g.getWorldPosition(v);const d=Math.hypot(v.x-a.x,v.z-a.z);if(d<bd){bd=d;b=p}}return b}

/* popups / emotes / confetti */
const pops=[];
function popup(x,y,z,text,color){const d=document.createElement('div');d.className='pop';d.textContent=text;d.style.color=color;labels.appendChild(d);pops.push({d,x,y,z,t:0})}
function emoteOn(a,k){const d=document.createElement('div');d.className='pop emo';d.textContent=k;labels.appendChild(d);pops.push({d,x:a.x,y:2.0,z:a.z,t:0,a});play(a,k==='💪'?'jump':'wave',1.2)}
for(const b of document.querySelectorAll('#emo button'))b.onclick=()=>{if(!me){ent.hidden=false;return}const k=b.textContent;emoteOn(me,k);pushPresence({e:{k,t:Date.now()}})};
function confetti(){const box=document.getElementById('fx');const cs=['#ff6a3d','#3d7ce0','#f2c14e','#7ad39a','#f08bb0'];for(let i=0;i<70;i++){const p=document.createElement('i');p.style.left=(Math.random()*100)+'%';p.style.background=cs[i%5];p.style.animationDelay=(Math.random()*.4)+'s';p.style.animationDuration=(1.6+Math.random()*1.2)+'s';box.appendChild(p);setTimeout(()=>p.remove(),3400)}}

/* sound: music + tiny synth effects */
const bgm=document.getElementById('bgm');let musicOn=true,actx=null;
try{musicOn=localStorage.getItem('104music')!=='off'}catch(e){}
const mBtn=document.getElementById('musicBtn');function updMusicBtn(){mBtn.textContent=musicOn?'♪ 音乐开':'♪ 音乐关';mBtn.setAttribute('aria-pressed',String(musicOn))}updMusicBtn();
function audioOn(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)()}catch(e){}bgm.volume=.35;if(musicOn)bgm.play().catch(()=>{})}
mBtn.onclick=()=>{musicOn=!musicOn;try{localStorage.setItem('104music',musicOn?'on':'off')}catch(e){}updMusicBtn();if(musicOn){audioOn()}else bgm.pause()};
function sfx(kind){if(!actx)return;const t=actx.currentTime;const g=actx.createGain();g.connect(actx.destination);
  const tone=(f,d,type='sine',v=.12,at=0)=>{const o=actx.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t+at);o.connect(g);g.gain.setValueAtTime(v,t+at);g.gain.exponentialRampToValueAtTime(.001,t+at+d);o.start(t+at);o.stop(t+at+d)};
  if(kind==='press'){const b=actx.createBuffer(1,actx.sampleRate*.5,actx.sampleRate);const ch=b.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=(Math.random()*2-1)*Math.pow(1-i/ch.length,2);const s=actx.createBufferSource();s.buffer=b;const f=actx.createBiquadFilter();f.type='highpass';f.frequency.value=1800;s.connect(f);f.connect(g);g.gain.value=.18;s.start()}
  else if(kind==='beep'){tone(880,.12,'square',.05);tone(1320,.12,'square',.05,.13)}
  else if(kind==='snip'){tone(2400,.05,'triangle',.08);tone(2000,.05,'triangle',.08,.08)}
  else if(kind==='glug'){tone(220,.15,'sine',.15);tone(180,.15,'sine',.15,.15);tone(150,.2,'sine',.15,.3)}
  else if(kind==='ding'){tone(1046,.4,'sine',.12);tone(1568,.5,'sine',.08,.08)}
  else if(kind==='win'){[523,659,784,1046].forEach((f,i)=>tone(f,.3,'triangle',.1,i*.12))}
  else if(kind==='nope'){tone(200,.2,'sawtooth',.06)}}

/* ================= chat ================= */
const logEl=document.getElementById('log');const seenMsg=new Set();const msgs=[];
function colorFor(c,n){if(c&&RBYID[c])return RBYID[c].color;let h=0;for(const ch of String(n||'?'))h=(h*31+ch.charCodeAt(0))>>>0;return['#5a8dee','#f08bb0','#3fb08a','#d9a23a','#b28dff','#ff8a5b'][h%6]}
function fmtT(t){const d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function renderMsg(m){const row=document.createElement('div');row.className='msg';const av=document.createElement('div');av.className='av';av.style.background=colorFor(m.c,m.n);av.textContent=String(m.n||'?').slice(0,1);
  const b=document.createElement('div');b.className='b';const h=document.createElement('div');h.className='h';const nb=document.createElement('b');nb.textContent=m.n||'某人';const tt=document.createElement('span');tt.textContent=fmtT(m.t);h.append(nb,tt);
  const t=document.createElement('div');t.className='t';t.textContent=m.m;b.append(h,t);row.append(av,b);return row}
function sysMsg(text){const d=document.createElement('div');d.className='sys';d.textContent=text;logEl.appendChild(d);logEl.scrollTop=logEl.scrollHeight}
function incoming(m,live){if(!m||!m.id||seenMsg.has(m.id)||!m.m)return;seenMsg.add(m.id);msgs.push(m);
  const nearBottom=logEl.scrollHeight-logEl.scrollTop-logEl.clientHeight<60;
  // keep order by time
  const row=renderMsg(m);row.dataset.t=m.t;let placed=false;for(const el of logEl.children){if(el.dataset.t&&+el.dataset.t>m.t){logEl.insertBefore(row,el);placed=true;break}}if(!placed)logEl.appendChild(row);
  if(nearBottom||live)logEl.scrollTop=logEl.scrollHeight;
  if(live){danmaku(m);const a=findSpeaker(m);if(a)say(a,m.m)}
}
function findSpeaker(m){if(m.mine)return me;for(const a of actors.values()){if(a.kind==='peer'&&(a.name===m.n))return a}return null}
document.getElementById('send').addEventListener('submit',e=>{e.preventDefault();const inp=document.getElementById('msgIn');const text=inp.value.trim();if(!text)return;if(!me){ent.hidden=false;return}inp.value='';
  const m={id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),c:myChar,n:myNick,m:text.slice(0,120),t:Date.now()};
  incoming({...m,mine:true},true);
  if(room)pushPresence({s:{id:m.id,m:m.m,t:m.t}});
  if(db){db.collection('chat').doc(m.id).set({c:m.c,n:m.n,m:m.m,t:m.t}).catch(()=>{})}
});
/* danmaku lanes */
const dmEl=document.getElementById('dm');const lanes=[0,0,0,0,0,0];
function danmaku(m){const now=performance.now();let li=lanes.indexOf(Math.min(...lanes));for(let i=0;i<lanes.length;i++)if(lanes[i]<now){li=i;break}
  const d=document.createElement('div');d.className='dmi';const b=document.createElement('b');b.textContent=m.n+'：';d.append(b,document.createTextNode(m.m));d.style.top=(li*13+4)+'%';
  const dur=Math.max(7,9-m.m.length*.02);d.style.animationDuration=dur+'s';dmEl.appendChild(d);lanes[li]=now+dur*1000*.45;setTimeout(()=>d.remove(),dur*1000+200)}

/* who's here */
const whoEl=document.getElementById('who');
function renderWho(){whoEl.innerHTML='';const online=new Map();
  if(me)online.set('me',{n:myNick,c:myChar});
  for(const a of actors.values())if(a.kind==='peer')online.set(a.key,{n:a.name,c:a.charId});
  const onlineChars=new Set([...online.values()].map(v=>v.c).filter(Boolean));
  for(const v of online.values()){const c=document.createElement('span');c.className='chip';const av=document.createElement('span');av.className='av';av.style.background=colorFor(v.c,v.n);av.textContent=v.n.slice(0,1);c.append(av,document.createTextNode(v.n));whoEl.appendChild(c)}
  for(const r of ROSTER)if(!onlineChars.has(r.id)){const c=document.createElement('span');c.className='chip off';c.title='不在线，在工位上干活';const av=document.createElement('span');av.className='av';av.style.background=r.color;av.textContent=r.name.slice(0,1);c.append(av,document.createTextNode(r.name));whoEl.appendChild(c)}
  document.getElementById('netTxt').textContent=room?(online.size+' 人在线'):'本地预览';
}

/* ================= UI: zones, photo, chat fold ================= */
const zlist=document.getElementById('zlist');
for(const Z of ZONES){if(Z.hidden)continue;const b=document.createElement('button');b.className='zb';b.dataset.z=Z.id;const sw=document.createElement('span');sw.className='sw';sw.style.background=Z.c;const n=document.createElement('span');n.className='n';b.append(sw,document.createTextNode(Z.name),n);b.onclick=()=>{const[x1,x2,z1,z2]=Z.r;flyTo(...godCam((x1+x2)/2,(z1+z2)/2,Math.max(14,Math.max(x2-x1,z2-z1)*1.6)));showPhoto(Z)};zlist.appendChild(b)}
document.getElementById('btnAll').onclick=()=>flyTo(...overview());
const fBtn=document.getElementById('btnFollow');fBtn.onclick=()=>{if(!me){ent.hidden=false;return}follow=follow===me?null:me;fly=null;updFollowBtn()};
function updFollowBtn(){fBtn.textContent=follow===me&&me?'停止跟随':'跟随我'}
const photo=document.getElementById('photo');let curZone=null;
function showPhoto(Z){if(!Z)return;document.getElementById('photoImg').src=window.PHOTOS[Z.ph];document.getElementById('photoT').textContent=Z.name+' · 实拍';document.getElementById('photoP').textContent=Z.p;photo.hidden=false}
document.getElementById('btnPhoto').onclick=()=>{if(!photo.hidden){photo.hidden=true;return}showPhoto(curZone||ZBYID.cut)};
document.getElementById('photoX').onclick=()=>photo.hidden=true;
const chatEl=document.getElementById('chat'),chatTab=document.getElementById('chatTab');
document.getElementById('fold').onclick=()=>{chatEl.hidden=true;chatTab.hidden=false};chatTab.onclick=()=>{chatEl.hidden=false;chatTab.hidden=true};
if(innerWidth<760){chatEl.hidden=true;chatTab.hidden=false}
function updWhere(){if(!me)return;const Z=zoneAt(me.x,me.z);const id=Z?Z.id:null;if(id===curZone?.id)return;curZone=Z;document.getElementById('where').textContent=Z?'你在：'+Z.name:'';for(const b of zlist.children)b.classList.toggle('on',b.dataset.z===id)}
function updZoneCounts(){const cnt={};for(const a of actors.values()){const Z=zoneAt(a.x,a.z);if(Z)cnt[Z.id]=(cnt[Z.id]||0)+1}for(const b of zlist.children){b.querySelector('.n').textContent=cnt[b.dataset.z]||''}}

/* ================= capabilities ================= */
const netDot=document.getElementById('netDot');
(async()=>{
  const cl=window.claude;
  if(!cl||!cl.use){offline();return}
  const [r,d,u]=await Promise.all([cl.use('room').catch(()=>null),cl.use('db').catch(()=>null),cl.use('user').catch(()=>null)]);
  room=r;db=d;user=u;
  if(db){try{myId=user?await user.id():null}catch(e){myId=null}
    if(myId){myDocRef=db.collection('prod').doc(myId);try{const snap=await myDocRef.get();const v=snap.exists?snap.data():null;if(v&&v.d===dayInfo().day&&v.c)for(const k in mine)mine[k]=Math.max(0,+v.c[k]||0)}catch(e){}}
    db.collection('prod').onSnapshot(snap=>{prodDocs=(snap.docs||[]).map(x=>({id:x.id,...(x.data()||{})}));sumOthers();renderHud(true);renderBoard()},()=>{})}
  if(!room&&!db){offline();return}
  netDot.classList.remove('off');
  if(room){room.onPeers(ch=>syncPeers(ch.peers),()=>{});syncPeers(room.peers());if(room.onConnection)room.onConnection(c=>netDot.classList.toggle('off',!c),()=>{})}
  if(db){db.collection('chat').orderBy('t','desc').limit(80).onSnapshot(snap=>{
      const first=!loadedOnce;loadedOnce=true;
      const docs=snap.docs||[];for(const doc of docs.slice().reverse()){const v=doc.data?doc.data():doc;incoming({id:doc.id,...v},!first)}
      if(first&&!docs.length)sysMsg('还没有人说话，来第一句吧');
    },()=>{})}
  else sysMsg('聊天记录只在大家同时在线时可见');
  renderWho();if(!ent.hidden)drawRoster();
})();
let loadedOnce=false;
function offline(){netDot.classList.add('off');sysMsg('本地预览：发布后的链接里，大家能互相看到和聊天');renderWho()}
drawRoster();renderWho();

/* ================= loop ================= */
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
const clock=new THREE.Clock();const v=new THREE.Vector3();let zc=0,pt=0;renderHud(true);
{const o=overview();camera.position.set(...o[0]);controls.target.set(...o[1])}
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);const now=performance.now();
  for(const a of actors.values()){if(a.kind==='npc')npcThink(a,now);stepActor(a,dt,now)}
  // machines
  const tt=now/1000;
  for(const c of CARRIAGES){c.boost=Math.max(0,(c.boost||0)-dt);c.m.position.x=Math.sin(tt*(1.6+(c.boost?2.5:0))+c.ph)*.8}
  for(const b of BELTS)b.offset.y=(b.offset.y-dt*.18)%1;
  for(const f of FANS)f.rotation.z+=dt*14;
  for(const a of actors.values())if(a.kind==='npc'&&a.state==='work'&&a.key==='npc:datou'){const p=nearestPress(a);p.busy=Math.max(p.busy,.2)}
  for(const p of PRESSES){if(p.busy>0){p.busy-=dt;p.t+=dt}const k=p.busy>0?Math.max(0,Math.sin(p.t*2.6)):0;p.hd.position.y=-.3*k;p.lamp.material=mat(p.busy>0?'#f04a3a':'#3a3');if(p.busy>0&&k>.97&&Math.random()<.3){const v=new THREE.Vector3();p.g.getWorldPosition(v);puff(v.x,1.35,v.z)}}
  for(let i=PUFFS.length-1;i>=0;i--){const q=PUFFS[i];q.t+=dt;q.m.position.y+=dt*.6;q.m.scale.setScalar(1+q.t*2);q.m.material.opacity=Math.max(0,.6-q.t*.6);if(q.t>1){scene.remove(q.m);PUFFS.splice(i,1)}}
  if(inkFlash>0){inkFlash-=dt}
  if(me)updActBar();
  if(me){updWhere();pt+=dt;if(pt>1.5&&Math.hypot(me.x-me.tx,me.z-me.tz)>.05){pt=0;pushPresence()}}
  if(fly){const k=Math.min(1,(now-fly.s)/fly.ms);const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;camera.position.lerpVectors(fly.p0,fly.p1,e);controls.target.lerpVectors(fly.t0,fly.t1,e);if(k>=1)fly=null}
  else if(follow){const d=new THREE.Vector3(follow.x,0,follow.z).sub(controls.target);controls.target.addScaledVector(d,Math.min(1,dt*4));camera.position.addScaledVector(d,Math.min(1,dt*4))}
  if(ringT>0){ringT-=dt*1.4;ring.material.opacity=Math.max(0,ringT);ring.scale.setScalar(1+(1-ringT)*.6);if(ringT<=0)ring.visible=false}
  controls.update();renderer.render(scene,camera);
  // labels
  const W=innerWidth,H=innerHeight;
  for(const a of actors.values()){v.set(a.x,1.42*(a.c.head.scale.x>1?1.08:1)+.05,a.z).project(camera);
    if(v.z>1||v.x<-1.2||v.x>1.2||v.y<-1.2||v.y>1.2){a.tag.style.display='none';continue}
    a.tag.style.display='';a.tag.style.transform=`translate(${(v.x+1)/2*W}px,${(1-v.y)/2*H}px) translate(-50%,-100%)`;
    a.tag.style.zIndex=String(1000-Math.round(v.z*1000))}
  for(let i=pops.length-1;i>=0;i--){const q=pops[i];q.t+=dt;const px=q.a?q.a.x:q.x,pz=q.a?q.a.z:q.z;v.set(px,q.y+q.t*.6,pz).project(camera);q.d.style.transform=`translate(${(v.x+1)/2*W}px,${(1-v.y)/2*H}px) translate(-50%,-50%)`;q.d.style.opacity=String(Math.max(0,1-Math.max(0,q.t-1)));if(q.t>1.9){q.d.remove();pops.splice(i,1)}}
  zc+=dt;if(zc>1){zc=0;updZoneCounts();npcEvents();renderBoard()}
}
loop();
