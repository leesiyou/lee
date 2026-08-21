/* ============================================================
   104印花研究所 | 104 PRINT LAB
   3D 沉浸式工厂展厅 - 主逻辑
   基于 Three.js 构建等距视角微型工厂空间
   ============================================================ */

import * as THREE from './lib/three.module.js';

// ==================== DOM 引用 ====================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const loadingScreen = $('#loading-screen');
const loadingBar = $('#loading-bar');
const loadingText = $('#loading-text');
const welcomeScreen = $('#welcome-screen');
const mainScene = $('#main-scene');
const threeContainer = $('#three-container');
const btnExplore = $('#btn-explore');
const modalOverlay = $('#modal-overlay');
const modalSheet = $('#modal-sheet');
const modalClose = $('#modal-close');
const bottomNav = $('#bottom-nav');
const toast = $('#toast');
const sceneHint = $('#scene-hint');

// ==================== 状态管理 ====================
const state = {
  currentScreen: 'loading',
  threeReady: false,
  cameraAngle: 0,
  targetCameraAngle: 0,
  hoveredZone: null,
  currentModal: null,
  posterIndex: 0,
};

// ==================== LOADING ====================
function simulateLoading() {
  let progress = 0;
  const steps = [
    { p: 30, t: '正在加载3D工厂...' },
    { p: 60, t: '正在布置展厅...' },
    { p: 85, t: '正在点亮灯光...' },
    { p: 100, t: '准备就绪' },
  ];
  let stepIdx = 0;

  const tick = () => {
    if (progress < 100) {
      progress += 1.5;
      if (progress > steps[stepIdx]?.p) {
        if (steps[stepIdx]) loadingText.textContent = steps[stepIdx].t;
        stepIdx++;
      }
      loadingBar.style.width = progress + '%';
      requestAnimationFrame(tick);
    } else {
      // 加载完成，进入欢迎页
      setTimeout(() => {
        loadingScreen.classList.remove('active');
        welcomeScreen.classList.add('active');
        state.currentScreen = 'welcome';
        initThreeScene();
      }, 400);
    }
  };
  tick();
}

// ==================== THREE.JS 3D 场景 ====================
let scene, camera, renderer, clock;
let factoryZones = [];
let hotspotMarkers = [];
let particles, gridFloor;
let ambientGlow;

function initThreeScene() {
  const container = threeContainer;
  const W = container.clientWidth || window.innerWidth;
  const H = container.clientHeight || window.innerHeight;

  // --- 渲染器 ---
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // --- 场景 ---
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#08080c');
  scene.fog = new THREE.Fog('#08080c', 8, 30);

  // --- 等距相机 ---
  const aspect = W / H;
  camera = new THREE.PerspectiveCamera(40, aspect, 0.5, 50);
  camera.position.set(6, 7.5, 8);
  camera.lookAt(0, 0, 0);

  // --- 灯光系统 ---
  // 环境光
  const ambient = new THREE.AmbientLight('#223344', 1.2);
  scene.add(ambient);

  // 主方向光（模拟顶光）
  const keyLight = new THREE.DirectionalLight('#ffffff', 2.5);
  keyLight.position.set(5, 12, 3);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 40;
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);

  // 荧光绿补光
  const accentLight = new THREE.PointLight('#4affa0', 15, 20);
  accentLight.position.set(0, 4, 2);
  scene.add(accentLight);

  // 底部蓝色氛围光
  const fillLight = new THREE.PointLight('#3355aa', 6, 15);
  fillLight.position.set(-3, 1, -3);
  scene.add(fillLight);

  // --- 构建场景 ---
  createFloor();
  createFactoryZones();
  createParticles();
  createGridLines();

  // --- 开始渲染 ---
  clock = new THREE.Clock();
  state.threeReady = true;
  animate();

  // --- 事件 ---
  renderer.domElement.addEventListener('click', onSceneClick);
  renderer.domElement.addEventListener('touchstart', onSceneTouch, { passive: false });
  window.addEventListener('resize', onResize);
}

// --- 地面 ---
function createFloor() {
  // 主地面
  const floorGeo = new THREE.PlaneGeometry(20, 20);
  const floorMat = new THREE.MeshStandardMaterial({
    color: '#0d0d14',
    roughness: 0.85,
    metalness: 0.3,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.2;
  floor.receiveShadow = true;
  scene.add(floor);
  gridFloor = floor;
}

// --- 网格线 ---
function createGridLines() {
  const gridHelper = new THREE.PolarGridHelper(10, 40, 24, 64, '#1a1a28', '#1a1a28');
  gridHelper.position.y = -2.19;
  scene.add(gridHelper);
}

// --- 工厂区域建筑块 ---
function createFactoryZones() {
  const baseY = -2.2;

  // 材质工厂
  const darkMetal = new THREE.MeshStandardMaterial({ color: '#1a1d25', roughness: 0.5, metalness: 0.7 });
  const darkPanel = new THREE.MeshStandardMaterial({ color: '#14161c', roughness: 0.6, metalness: 0.5 });
  const accentPanel = new THREE.MeshStandardMaterial({ color: '#1e2520', roughness: 0.4, metalness: 0.3, emissive: '#4affa0', emissiveIntensity: 0.05 });
  const glassPanel = new THREE.MeshStandardMaterial({ color: '#1a2a20', roughness: 0.2, metalness: 0.1, emissive: '#4affa0', emissiveIntensity: 0.15 });

  // 区域定义: { id, x, z, w, d, h, color, label }
  const zones = [
    { id: 'brand',   x: -3.5, z: -3, w: 2.2, d: 1.8, h: 2.8, mat: accentPanel, label: '品牌墙' },
    { id: 'product', x: 1.5,  z: -3, w: 2.4, d: 1.8, h: 2.2, mat: darkMetal, label: 'T恤展示' },
    { id: 'sample',  x: -3.5, z: 0.5, w: 1.6, d: 1.4, h: 2.0, mat: darkPanel, label: '样衣区' },
    { id: 'poster',  x: 2,    z: 0.8, w: 2.6, d: 0.4, h: 2.6, mat: darkMetal, label: '海报墙' },
    { id: 'craft',   x: -1.5, z: -1.2, w: 1.6, d: 1.6, h: 1.8, mat: accentPanel, label: '印花工艺' },
    { id: 'activity', x: -2.5, z: 3.2, w: 2.0, d: 1.4, h: 1.6, mat: glassPanel, label: '活动信息' },
    { id: 'factory', x: 1.5,  z: 3.2, w: 2.4, d: 1.8, h: 2.0, mat: darkMetal, label: '实体工厂' },
    { id: 'order',   x: 3.8,  z: -0.5, w: 1.4, d: 1.4, h: 1.5, mat: darkPanel, label: '咨询下单' },
  ];

  zones.forEach((z, i) => {
    // 主体建筑
    const geo = new THREE.BoxGeometry(z.w, z.h, z.d, 2, 2, 2);
    const mesh = new THREE.Mesh(geo, z.mat);
    mesh.position.set(z.x, baseY + z.h / 2, z.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { zoneId: z.id, isZone: true };
    scene.add(mesh);
    factoryZones.push(mesh);

    // 顶部边框发光条
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeLine = new THREE.LineSegments(
      edgeGeo,
      new THREE.LineBasicMaterial({ color: '#2a3040', transparent: true, opacity: 0.35 })
    );
    edgeLine.position.copy(mesh.position);
    scene.add(edgeLine);

    // 热点标记球
    const markerGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const markerMat = new THREE.MeshStandardMaterial({
      color: '#4affa0',
      roughness: 0.2,
      metalness: 0.1,
      emissive: '#4affa0',
      emissiveIntensity: 0.8,
    });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.set(z.x, baseY + z.h + 0.6, z.z);
    marker.userData = { zoneId: z.id, isHotspot: true };
    scene.add(marker);
    hotspotMarkers.push(marker);

    // 光晕环
    const ringGeo = new THREE.TorusGeometry(0.32, 0.04, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#4affa0', transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(marker.position);
    ring.rotation.x = Math.PI / 2;
    ring.userData = { zoneId: z.id, isHotspotRing: true };
    scene.add(ring);
    marker.userData.ring = ring;
  });
}

// --- 粒子系统 ---
function createParticles() {
  const count = 200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 1] = Math.random() * 8 - 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: '#4affa0',
    size: 0.03,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  particles = new THREE.Points(geo, mat);
  scene.add(particles);
}

// --- 动画循环 ---
function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.1);
  const time = performance.now() * 0.001;

  if (state.currentScreen === 'scene') {
    // 相机缓慢漂移
    state.cameraAngle += dt * 0.08;
    const r = 10;
    const cx = Math.sin(state.cameraAngle * 0.3) * 1.5;
    const cz = Math.cos(state.cameraAngle * 0.3) * 1.5;
    camera.position.x += (cx - camera.position.x) * 0.02;
    camera.position.z += (8 + cz - camera.position.z) * 0.02;
    camera.lookAt(0, -0.5, 0);
  }

  // 热点标记呼吸动画
  hotspotMarkers.forEach((m, i) => {
    const s = 1 + Math.sin(time * 3 + i) * 0.2;
    m.scale.setScalar(s);
    m.material.emissiveIntensity = 0.5 + Math.sin(time * 2.5 + i) * 0.4;

    // 光环旋转
    if (m.userData.ring) {
      m.userData.ring.rotation.z += dt * 1.2;
      m.userData.ring.scale.setScalar(1 + Math.sin(time * 2 + i) * 0.15);
      m.userData.ring.material.opacity = 0.3 + Math.sin(time * 3 + i) * 0.2;
    }
  });

  // 粒子漂移
  if (particles) {
    particles.rotation.y += dt * 0.05;
    particles.position.y += Math.sin(time * 0.5) * dt * 0.15;
  }

  renderer.render(scene, camera);
}

// --- 点击检测 ---
function onSceneClick(e) {
  if (state.currentScreen !== 'scene') return;
  handleSceneInteraction(e.clientX, e.clientY);
}

function onSceneTouch(e) {
  if (state.currentScreen !== 'scene') return;
  e.preventDefault();
  const touch = e.touches[0];
  if (touch) handleSceneInteraction(touch.clientX, touch.clientY);
}

function handleSceneInteraction(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // 检测热点标记
  const hits = raycaster.intersectObjects(hotspotMarkers);
  if (hits.length > 0) {
    const zoneId = hits[0].object.userData.zoneId;
    if (zoneId) openModal(zoneId);
    return;
  }

  // 检测建筑体
  const buildingHits = raycaster.intersectObjects(factoryZones);
  if (buildingHits.length > 0) {
    const zoneId = buildingHits[0].object.userData.zoneId;
    if (zoneId) openModal(zoneId);
  }
}

// --- 响应式 ---
function onResize() {
  if (!renderer || !camera) return;
  const W = threeContainer.clientWidth || window.innerWidth;
  const H = threeContainer.clientHeight || window.innerHeight;
  renderer.setSize(W, H);
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
}

// ==================== 弹层系统 ====================
function openModal(zoneId) {
  // 隐藏所有弹层内容
  $$('.modal-content').forEach(el => el.classList.remove('active'));

  // 显示对应内容
  const contentEl = $(`#modal-${zoneId}`);
  if (contentEl) {
    contentEl.classList.add('active');
    state.currentModal = zoneId;

    // 特殊处理海报轮播
    if (zoneId === 'poster') {
      state.posterIndex = 0;
      updatePosterSlide();
    }

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal() {
  modalOverlay.classList.remove('open');
  state.currentModal = null;
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// 下滑关闭（简单处理）
let touchStartY = 0;
modalSheet.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });
modalSheet.addEventListener('touchmove', (e) => {
  if (modalSheet.scrollTop <= 0) {
    const dy = e.touches[0].clientY - touchStartY;
    if (dy > 60) closeModal();
  }
});

// --- 海报轮播 ---
function updatePosterSlide() {
  const slides = $$('#poster-swiper .poster-slide');
  slides.forEach((s, i) => s.classList.toggle('active', i === state.posterIndex));
  const idxEl = $('#poster-index');
  if (idxEl) idxEl.textContent = `${state.posterIndex + 1} / ${slides.length}`;
}

$('#poster-prev')?.addEventListener('click', () => {
  const total = $$('#poster-swiper .poster-slide').length;
  state.posterIndex = (state.posterIndex - 1 + total) % total;
  updatePosterSlide();
});

$('#poster-next')?.addEventListener('click', () => {
  const total = $$('#poster-swiper .poster-slide').length;
  state.posterIndex = (state.posterIndex + 1) % total;
  updatePosterSlide();
});

// --- 画廊缩略图切换 ---
document.addEventListener('click', (e) => {
  const thumb = e.target.closest('.gallery-thumbs .thumb');
  if (!thumb) return;
  const thumbsContainer = thumb.parentElement;
  const mainImg = thumbsContainer.parentElement.querySelector('.gallery-main img');
  if (!mainImg) return;

  // 切换 active
  thumbsContainer.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');

  // 切换图片
  const newSrc = thumb.dataset.src;
  if (newSrc && mainImg) {
    mainImg.src = newSrc;
  }
});

// ==================== 底部导航 ====================
bottomNav.addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-btn');
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === 'share') {
    handleShare();
    return;
  }

  // 确保在场景页
  if (state.currentScreen !== 'scene') {
    showToast('请先进入工厂展厅');
    return;
  }

  const zoneMap = {
    product: 'product',
    craft: 'craft',
    activity: 'activity',
    order: 'order',
  };

  const zoneId = zoneMap[action];
  if (zoneId) openModal(zoneId);
});

// ==================== 进入展厅 ====================
btnExplore.addEventListener('click', () => {
  welcomeScreen.classList.remove('active');
  mainScene.classList.add('active');
  state.currentScreen = 'scene';

  // 延迟显示底部导航
  setTimeout(() => {
    bottomNav.style.opacity = '1';
  }, 600);

  // 隐藏场景提示（动画结束后）
  setTimeout(() => {
    if (sceneHint) sceneHint.style.display = 'none';
  }, 8000);
});

// --- 热点标签点击 ---
document.getElementById('hotspot-labels')?.addEventListener('click', (e) => {
  const label = e.target.closest('.hotspot-label');
  if (!label) return;
  const zoneId = label.dataset.zone;
  if (zoneId) openModal(zoneId);
});

// ==================== 咨询/分享 ====================
$('#btn-consult')?.addEventListener('click', () => {
  showToast('请通过公众号私信联系我们，发送你的图案/需求');
});

$('#btn-quote')?.addEventListener('click', () => {
  showToast('请通过公众号私信获取报价，20件起订');
});

function handleShare() {
  if (navigator.share) {
    navigator.share({
      title: '104印花研究所 | 3D工厂展厅',
      text: '15年专注T恤印花，广州实体工厂，团体定制/小单定制',
      url: window.location.href,
    }).catch(() => {});
  } else {
    // 复制链接
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('链接已复制，去粘贴分享吧');
      });
    } else {
      showToast('请截图分享给朋友');
    }
  }
}

// ==================== Toast ====================
let toastTimer;
function showToast(msg) {
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// ==================== 启动 ====================
simulateLoading();

// 初始化底部导航透明度
bottomNav.style.opacity = '0';
bottomNav.style.transition = 'opacity 0.5s ease';
