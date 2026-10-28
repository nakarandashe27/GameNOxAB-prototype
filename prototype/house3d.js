/*
 * 3D-домик «Дом в соснах» для семи стадий проекта. Нужен three.js r128 (глобальный THREE).
 * Стадии 1–6 — бумажный макет с чёрной обводкой, новый слой подсвечен лаймом (стиль Нейро Отличника).
 * Стадия 7 — «Отделка»: макет проявляется в рендер — планкен, тёплые окна, золотой час, лаймовая дверь.
 *
 * House3D.sprite(w, h)            → canvas 4×2: ячейки 0–6 = стадии 1–7, ячейка 7 = финальный кадр крупнее.
 * House3D.play(cv, L, {build, alive}) → живая анимация стадии L в 2D-canvas; build — слой собирается на глазах;
 *                                    пока alive() истинно, камера медленно ходит вокруг. Возвращает stop().
 */
(function () {
  if (typeof THREE === 'undefined') { window.House3D = { ok: false }; return; }

  const C = { paper: 0xF5F5F0, clay: 0xF7F6F1, board: 0xEAE9E1, ink: 0x2A2A2A, lime: 0xDBFC3B, glassClay: 0xC9D3D2 };
  const H1 = 3.0, SLAB = 0.3, RIDGE = 4.0, LX = 12, LZ = 7, T = 0.3;
  const EAVE = H1 + SLAB, TOP = EAVE + RIDGE;

  // ── текстуры рендера (рисуются один раз) ──
  function tex(w, h, paint, rx, ry) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; paint(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1);
    t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const TEX = {
    planks: tex(256, 256, (g, w, h) => {      // вертикальный планкен, графит
      g.fillStyle = '#34312E'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 32) { g.fillStyle = `rgba(255,240,220,${0.03 + rnd() * 0.05})`; g.fillRect(x, 0, 30, h); g.fillStyle = '#1E1C1A'; g.fillRect(x + 30, 0, 2, h); }
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.12})`; g.fillRect(rnd() * w, rnd() * h, 1, 6 + rnd() * 24); }
    }),
    roof: tex(256, 256, (g, w, h) => {        // фальцевая кровля
      g.fillStyle = '#2B2C2E'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 43) { g.fillStyle = '#3C3D40'; g.fillRect(x, 0, 3, h); g.fillStyle = '#1B1C1D'; g.fillRect(x + 3, 0, 2, h); }
    }),
    deck: tex(256, 256, (g, w, h) => {        // лиственница террасы
      g.fillStyle = '#B98457'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 28) { g.fillStyle = `rgba(90,50,20,${0.15 + rnd() * 0.15})`; g.fillRect(0, y, w, 26); g.fillStyle = '#6B4325'; g.fillRect(0, y + 26, w, 2); }
    }),
    grass: tex(256, 256, (g, w, h) => {
      g.fillStyle = '#7A9455'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { const v = rnd(); g.fillStyle = v > 0.5 ? 'rgba(160,190,100,.35)' : 'rgba(40,70,30,.25)'; g.fillRect(rnd() * w, rnd() * h, 2, 2 + rnd() * 3); }
    }, 6, 5),
    sky: (() => {
      const cv = document.createElement('canvas'); cv.width = 2; cv.height = 256; const g = cv.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#5E86B5'); gr.addColorStop(0.55, '#B9C7CF'); gr.addColorStop(0.82, '#F3CF9C'); gr.addColorStop(1, '#F7B77A');
      g.fillStyle = gr; g.fillRect(0, 0, 2, 256); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t;
    })(),
  };

  // ── геометрия ──
  function wall(len, h, holes) {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(len, 0); s.lineTo(len, h); s.lineTo(0, h); s.lineTo(0, 0);
    holes.forEach(([x0, x1, y0, y1]) => { if (y0 >= h) return; const p = new THREE.Path(); y1 = Math.min(y1, h - 0.001); p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.lineTo(x0, y0); s.holes.push(p); });
    return new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
  }
  function gable(holes) {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(LZ, 0); s.lineTo(LZ / 2, RIDGE); s.lineTo(0, 0);
    holes.forEach(([x0, x1, y0, y1]) => { const p = new THREE.Path(); p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.lineTo(x0, y0); s.holes.push(p); });
    return new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
  }
  // проёмы: [от, до, низ, верх] в координатах стены
  const OPEN = {
    front: [[1.6, 2.7, 0, 2.3], [3.6, 5.2, 0.9, 2.3], [6.8, 11.0, 0, 2.6]],
    back: [[2.0, 3.4, 0.9, 2.3], [7.0, 8.4, 0.9, 2.3], [9.6, 11.0, 0.9, 2.3]],
    right: [[1.0, 6.0, 0, 2.6]],
    left: [[2.8, 4.2, 0.9, 2.3]],
    gableR: [[2.5, 4.5, 0.4, 2.4]],
    gableL: [[3.0, 4.0, 0.6, 1.8]],
  };
  // стены: geometry-фабрика + как поставить
  const WALLS = [
    { k: 'front', len: LX, at: (m) => { m.position.set(-LX / 2, 0, LZ / 2 - T); } },
    { k: 'back', len: LX, at: (m) => { m.position.set(LX / 2, 0, -LZ / 2 + T); m.rotation.y = Math.PI; } },
    { k: 'right', len: LZ, at: (m) => { m.position.set(LX / 2 - T, 0, LZ / 2); m.rotation.y = Math.PI / 2; } },
    { k: 'left', len: LZ, at: (m) => { m.position.set(-LX / 2 + T, 0, -LZ / 2); m.rotation.y = -Math.PI / 2; } },
  ];

  // ── сцена: каждый элемент знает свою стадию, способ появления и материал рендера ──
  const scene = new THREE.Scene();
  const items = [];
  const edgeMat = new THREE.LineBasicMaterial({ color: C.ink, transparent: true });
  function add(geo, o) {
    const mat = new THREE.MeshStandardMaterial({ color: C.clay, roughness: 0.92, metalness: 0, transparent: !!o.glass });
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = !o.flat; mesh.receiveShadow = true;
    const edges = o.noEdges ? null : new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), edgeMat.clone());
    const g = new THREE.Group(); g.add(mesh); if (edges) g.add(edges);
    if (o.at) o.at(g);
    const holder = new THREE.Group(); holder.add(g); scene.add(holder);
    items.push(Object.assign({ holder, mesh, edges, mat, base: g.position.clone() }, o));
    return g;
  }
  const box = (w, h, d) => { const b = new THREE.BoxGeometry(w, h, d); b.translate(0, h / 2, 0); return b; };

  // 1 — участок: макетная доска, деревья, дорожка, контур пятна застройки
  add(box(26, 0.5, 20), { stage: 0, anim: 'none', clayOnly: true, at: (m) => m.position.set(0, -0.5, 0), render: { color: 0xE4E0D6 }, clayColor: C.board });
  // в рендере макетная доска уходит, земля тянется до горизонта и тает в дымке
  add(new THREE.CircleGeometry(220, 48).rotateX(-Math.PI / 2), { stage: 0, anim: 'none', renderOnly: true, flat: true, noEdges: true, noLime: true, at: (m) => m.position.set(0, -0.02, 0), render: { map: tex(256, 256, (g, w, h) => { g.fillStyle = '#6F8B4D'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2200; i++) { g.fillStyle = rnd() > 0.5 ? 'rgba(150,180,95,.3)' : 'rgba(35,60,28,.25)'; g.fillRect(rnd() * w, rnd() * h, 2, 3); } }, 40, 40), color: 0xffffff } });
  add(new THREE.PlaneGeometry(25.6, 19.6).rotateX(-Math.PI / 2), { stage: 1, anim: 'fade', flat: true, noEdges: true, noLime: true, at: (m) => m.position.set(0, 0.01, 0), render: { map: TEX.grass, color: 0xffffff }, clayColor: 0xF0EFE8 });
  const trees = [[-9.5, -6, 1.15, 'pine'], [-11, 1, 0.9, 'pine'], [-8, 6.5, 1.0, 'leaf'], [9.5, -6.5, 1.25, 'pine'], [11, -1.5, 0.85, 'leaf'], [-4, -8, 1.05, 'pine'], [3.5, -8.2, 0.95, 'pine'], [11.4, -4.2, 0.8, 'pine'], [-11.2, -3.5, 0.75, 'leaf']];
  trees.forEach(([x, z, s, kind], i) => {
    if (kind === 'pine') {
      add(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 2.2 * s, 6).translate(0, 1.1 * s, 0), { stage: 1, anim: 'pop', noLime: true, i, at: (m) => m.position.set(x, 0, z), render: { color: 0x5B4535 } });
      [[0, 2.6, 1.5], [1.6, 2.2, 1.15], [2.9, 1.8, 0.8]].forEach(([y, hh, r], j) =>
        add(new THREE.ConeGeometry(r * s * 1.2, hh * s * 1.3, 7).translate(0, (1.6 + y + hh * 0.6) * s, 0), { stage: 1, anim: 'pop', noLime: true, i: i + j * 0.3, at: (m) => m.position.set(x, 0, z), render: { color: [0x35553A, 0x3E6342, 0x4A7049][j] } }));
    } else {
      add(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 2.0 * s, 6).translate(0, 1.0 * s, 0), { stage: 1, anim: 'pop', noLime: true, i, at: (m) => m.position.set(x, 0, z), render: { color: 0x5B4535 } });
      add(new THREE.IcosahedronGeometry(1.7 * s, 0).translate(0, 3.2 * s, 0), { stage: 1, anim: 'pop', noLime: true, i: i + 0.3, at: (m) => m.position.set(x, 0, z), render: { color: 0x7E9A4C } });
    }
  });
  // лес на дальнем плане — только в рендере, не перед камерой
  for (let i = 0; i < 46; i++) {
    const ang = rnd() * Math.PI * 2, rad = 24 + rnd() * 40, x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
    const toCam = Math.acos((x * 0.7 + z * 0.71) / rad);
    if (toCam < 1.0) continue;
    const s = 1.1 + rnd() * 1.1;
    add(new THREE.ConeGeometry(1.7 * s, 6.5 * s, 7).translate(0, 4.4 * s, 0), { stage: 0, anim: 'none', renderOnly: true, noEdges: true, noLime: true, at: (m) => m.position.set(x, 0, z), render: { color: [0x2F4A33, 0x3A5A3C, 0x456A45][i % 3] } });
    add(new THREE.CylinderGeometry(0.2 * s, 0.3 * s, 1.4 * s, 5).translate(0, 0.7 * s, 0), { stage: 0, anim: 'none', renderOnly: true, noEdges: true, noLime: true, at: (m) => m.position.set(x, 0, z), render: { color: 0x4E3B2C } });
  }
  [[-4.15, 4.6], [-4.0, 5.6], [-4.3, 6.6], [-4.1, 7.6], [-4.4, 8.6]].forEach(([x, z], i) =>
    add(box(0.9, 0.06, 0.6), { stage: 1, anim: 'pop', i: i * 0.4, at: (m) => { m.position.set(x, 0, z); m.rotation.y = (i % 2 ? 0.12 : -0.08); }, render: { color: 0xBDB6A8 } }));
  const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints([[-6, -3.5], [6, -3.5], [6, 3.5], [-6, 3.5], [-6, -3.5]].map(([x, z]) => new THREE.Vector3(x, 0.03, z))),
    new THREE.LineDashedMaterial({ color: 0x8FA800, dashSize: 0.5, gapSize: 0.3, transparent: true }));
  outline.computeLineDistances(); scene.add(outline);
  items.push({ holder: outline, stage: 1, until: 2, anim: 'fade', line: true, mat: outline.material });

  // 2 — план: фундаментная плита и стены, «срезанные» на уровне плана
  add(box(LX + 0.4, 0.35, LZ + 0.4), { stage: 2, anim: 'rise', at: (m) => m.position.set(0, -0.2, 0), render: { color: 0xB9B5AC } });
  WALLS.forEach((w, i) => add(wall(w.len, 0.7, OPEN[w.k]).translate(0, 0.15, 0), { stage: 2, until: 3, anim: 'rise', i: i * 0.5, at: w.at }));
  const PART = [[-1.5, 0.15, -3.2, -0.5], [-1.5, 0.15, 0.4, 3.2], [-6, 4.5, -0.5, 0.15]];
  PART.forEach(([x, w, z0, z1], i) => {
    const pw = x === -6 ? 4.5 : 0.15, pd = x === -6 ? 0.15 : z1 - z0;
    add(box(pw, 0.7, pd).translate(0, 0.15, 0), { stage: 2, until: 3, anim: 'rise', i: 2 + i * 0.4, at: (m) => m.position.set(x === -6 ? -6 + T + 2.25 : x, 0, x === -6 ? z0 : (z0 + z1) / 2) });
    add(box(pw, H1, pd).translate(0, 0.15, 0), { stage: 3, anim: 'rise', i: 2 + i * 0.4, at: (m) => m.position.set(x === -6 ? -6 + T + 2.25 : x, 0, x === -6 ? z0 : (z0 + z1) / 2) });
  });

  // 3 — стены первого этажа
  WALLS.forEach((w, i) => add(wall(w.len, H1, OPEN[w.k]).translate(0, 0.15, 0), { stage: 3, anim: 'rise', i: i * 0.5, at: w.at, render: { map: TEX.planks, color: 0xffffff } }));

  // 4 — перекрытие, мансардные фронтоны, терраса
  add(box(LX + 0.2, SLAB, LZ + 0.2), { stage: 4, anim: 'drop', at: (m) => m.position.set(0, H1 + 0.15, 0), render: { color: 0x2E2C2A } });
  add(gable(OPEN.gableR), { stage: 4, anim: 'rise', i: 1, at: (m) => { m.position.set(LX / 2 - T, EAVE + 0.15, LZ / 2); m.rotation.y = Math.PI / 2; }, render: { map: TEX.planks, color: 0xffffff } });
  add(gable(OPEN.gableL), { stage: 4, anim: 'rise', i: 1.5, at: (m) => { m.position.set(-LX / 2, EAVE + 0.15, -LZ / 2 + 0); m.rotation.y = -Math.PI / 2; m.position.x += 0; m.position.z = -LZ / 2; m.translateZ(-T); }, render: { map: TEX.planks, color: 0xffffff } });
  add(box(5.6, 0.25, 3.2), { stage: 4, anim: 'rise', i: 2.2, at: (m) => m.position.set(3.2, -0.05, LZ / 2 + 1.6), render: { map: TEX.deck, color: 0xffffff } });
  add(box(1.6, 0.12, 0.6), { stage: 4, anim: 'rise', i: 2.6, at: (m) => m.position.set(-2.15, 0, LZ / 2 + 0.3), render: { color: 0xA9A59C } });

  // 5 — окна: стекло и рамы во всех проёмах
  function glazing(k, len, at, y0) {
    OPEN[k].forEach(([x0, x1, a, b], i) => {
      const w = x1 - x0, h = b - a, door = k === 'front' && i === 0;
      if (door) {
        add(box(w, h, 0.08).translate(x0 + w / 2, a + 0.15, T / 2), { stage: 5, anim: 'pop', i, at, render: { color: C.lime, emissive: 0x2a3300 } });
        return;
      }
      add(box(w, h, 0.04).translate(x0 + w / 2, a + 0.15 + (y0 || 0), T / 2), { stage: 5, anim: 'glass', i, glass: true, at, render: { color: 0xFFD08A, emissive: 0xFFB45A, emissiveIntensity: 0.9 } });
      const n = Math.max(1, Math.round(w / 1.4));
      for (let j = 1; j < n; j++) add(box(0.07, h, 0.1).translate(x0 + (w * j) / n, a + 0.15 + (y0 || 0), T / 2), { stage: 5, anim: 'pop', i, at, render: { color: 0x1C1C1C } });
      add(box(w + 0.1, 0.07, 0.12).translate(x0 + w / 2, b + 0.15 + (y0 || 0), T / 2), { stage: 5, anim: 'pop', i, at, render: { color: 0x1C1C1C } });
    });
  }
  WALLS.forEach((w) => glazing(w.k, w.len, w.at));
  glazing('gableR', LZ, (m) => { m.position.set(LX / 2 - T, EAVE, LZ / 2); m.rotation.y = Math.PI / 2; });
  glazing('gableL', LZ, (m) => { m.position.set(-LX / 2, EAVE, -LZ / 2); m.rotation.y = -Math.PI / 2; m.translateZ(-T); });

  // 6 — кровля: два ската с выносом
  const slope = Math.atan2(RIDGE, LZ / 2), run = Math.hypot(RIDGE, LZ / 2) + 0.55;
  [1, -1].forEach((sgn, i) => {
    const g = new THREE.BoxGeometry(LX + 0.9, 0.22, run); g.translate(0, 0, sgn * run / 2);
    add(g, { stage: 6, anim: 'drop', i: i * 0.6, at: (m) => { m.position.set(0, TOP + 0.3, 0); m.rotation.x = sgn * slope; }, render: { map: TEX.roof, color: 0xffffff, metalness: 0.35, roughness: 0.55 } });
  });
  add(box(0.6, 1.4, 0.6), { stage: 6, anim: 'rise', i: 1.4, at: (m) => m.position.set(-3.2, TOP - 1.6, -1.2), render: { color: 0x2E2C2A } });

  // 7 — отделка: кусты, подсветка дорожки, кресла на террасе
  [[-5.2, 4.1], [-2.6, 4.2], [-0.4, 4.3], [-6.6, 2.2], [-6.7, -1.6], [6.9, -2.4], [6.8, 1.6]].forEach(([x, z], i) =>
    add(new THREE.IcosahedronGeometry(0.55 + (i % 3) * 0.12, 0).scale(1, 0.75, 1).translate(0, 0.4, 0), { stage: 7, anim: 'pop', i: i * 0.3, at: (m) => m.position.set(x, 0, z), render: { color: [0x5D7F45, 0x6E8E4E, 0x4E6E3E][i % 3] } }));
  [[-3.4, 5.1], [-4.9, 7.1], [-3.4, 9.0]].forEach(([x, z], i) =>
    add(box(0.12, 0.45, 0.12), { stage: 7, anim: 'pop', i, at: (m) => m.position.set(x, 0, z), render: { color: 0xFFE2A8, emissive: 0xFFC46B, emissiveIntensity: 1.2 } }));
  [[2.6, 5.4], [4.0, 5.4]].forEach(([x, z], i) =>
    add(box(0.8, 0.45, 0.8), { stage: 7, anim: 'pop', i, at: (m) => m.position.set(x, 0.2, z), render: { color: 0xDCD6CA } }));

  // ── свет ──
  const hemi = new THREE.HemisphereLight(0xffffff, 0xD9D6CC, 0.95); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.position.set(-14, 22, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 70 });
  sun.shadow.radius = 4; sun.shadow.bias = -0.0005; scene.add(sun);
  const warm = new THREE.PointLight(0xFFB15C, 0, 16, 2); warm.position.set(3, 1.6, 1); scene.add(warm);

  const camera = new THREE.PerspectiveCamera(30, 3 / 4, 1, 200);
  let renderer = null;
  function getRenderer() {
    if (renderer) return renderer;
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
  }

  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
  const lime = new THREE.Color(C.lime), clayCol = new THREE.Color(C.clay);

  // Расставить сцену: L — сколько стадий сдано, t — прогресс сборки стадии L (1 = собрана), mode — 'clay' | 'render'
  function pose(L, t, mode) {
    const R = mode === 'render';
    scene.background = R ? TEX.sky : new THREE.Color(C.paper);
    scene.fog = R ? new THREE.Fog(0xEFD3A8, 60, 190) : null;
    hemi.intensity = R ? 0.55 : 0.95; hemi.color.set(R ? 0xBFD3EA : 0xffffff); hemi.groundColor.set(R ? 0x6B5A44 : 0xD9D6CC);
    sun.color.set(R ? 0xFFC88A : 0xffffff); sun.intensity = R ? 1.25 : 0.75;
    sun.position.set(R ? -20 : -14, R ? 9 : 22, R ? 6 : 12);
    warm.intensity = R ? 1.6 : 0;
    items.forEach((it) => {
      const on = it.stage <= L && !(it.until && it.until <= L) && !(R ? it.clayOnly : it.renderOnly);
      it.holder.visible = on; if (!on) return;
      const fresh = it.stage === L && L < 7 || (it.stage === 7 && L === 7);
      const p = fresh ? ease(t * 1.5 - (it.i || 0) * 0.12) : 1;
      if (it.line) { it.mat.opacity = p; return; }
      const g = it.holder; g.scale.set(1, 1, 1); g.position.set(0, 0, 0);
      if (it.anim === 'rise') g.scale.y = Math.max(0.001, p);
      else if (it.anim === 'pop') g.scale.setScalar(Math.max(0.001, p));
      else if (it.anim === 'drop') g.position.y = (1 - p) * 4;
      const fade = it.anim === 'fade' || it.anim === 'drop' || it.anim === 'glass' ? p : 1;
      // материал по режиму
      const m = it.mat, r = it.render || {};
      if (R) {
        m.map = r.map || null; m.color.set(r.color !== undefined ? r.color : C.clay);
        m.emissive.set(r.emissive || 0); m.emissiveIntensity = r.emissiveIntensity || 1;
        m.roughness = r.roughness !== undefined ? r.roughness : 0.85; m.metalness = r.metalness || 0;
        m.opacity = it.glass ? 0.92 * fade : fade;
      } else {
        m.map = null; m.roughness = 0.92; m.metalness = 0;
        const base = it.clayColor !== undefined ? new THREE.Color(it.clayColor) : clayCol;
        const hot = fresh && it.stage > 0 && !it.noLime;   // новый слой — фирменный лайм, подсвечен, чтобы не выцветал в тени
        m.color.copy(hot ? lime : (it.glass ? new THREE.Color(C.glassClay) : base));
        m.emissive.set(hot ? 0xA4BC1C : 0); m.emissiveIntensity = 1;
        m.opacity = (it.glass ? 0.55 : 1) * fade;
      }
      m.transparent = m.opacity < 1 || it.glass; m.needsUpdate = true;
      if (it.edges) { it.edges.visible = true; it.edges.material.opacity = (R ? 0.18 : 0.9) * fade; }
    });
  }
  function aim(theta, close, R, aspect) {
    const k = aspect > 1.15 ? 0.74 : 1;   // в широкой карточке камера ближе: вертикальный угол обзора тот же, а места по бокам больше
    const r = (close ? 28 : R ? 36 : 40) * k, h = (close ? 7 : R ? 10 : 18) * k;   // в рендере камера ниже — в кадре горизонт и небо
    camera.position.set(Math.sin(theta) * r, h, Math.cos(theta) * r);
    camera.lookAt(close ? 1 : 0.5, close ? 3.4 : 3.6, 0.5);
  }
  function snap(w, h, L, t, mode, theta, close) {
    const rd = getRenderer(); rd.setPixelRatio(1); rd.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    pose(L, t, mode); aim(theta, close, mode === 'render', w / h); rd.render(scene, camera); return rd.domElement;
  }
  const BASE = 0.78;

  function sprite(cw, ch) {
    const out = document.createElement('canvas'); out.width = cw * 4; out.height = ch * 2; const g = out.getContext('2d');
    for (let k = 0; k < 8; k++) {
      const L = Math.min(7, k + 1), R = L === 7;
      g.drawImage(snap(cw, ch, L, 1, R ? 'render' : 'clay', k === 7 ? BASE - 0.32 : BASE, k === 7), (k % 4) * cw, Math.floor(k / 4) * ch);
    }
    return out;
  }

  // Живая анимация в 2D-canvas: сборка слоя, для «Отделки» — переход макета в рендер лаймовой линией.
  function play(cv, L, opts) {
    opts = opts || {}; const ctx = cv.getContext('2d'); const w = cv.width, h = cv.height;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce ? 1 : (L === 7 ? 3200 : 2400); let began = performance.now(), raf = 0, stopped = false;
    const seen = () => !opts.build || (cv.checkVisibility ? cv.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true);
    const clayBuf = document.createElement('canvas'); clayBuf.width = w; clayBuf.height = h;
    function frame(now) {
      if (stopped) return;
      if (opts.build && !seen()) began = now;   // ждём, пока карточка проявится
      const t = opts.build ? Math.min(1, Math.max(0, now - began - 350) / dur) : 1;
      const theta = BASE - (opts.build ? 0.45 * (1 - ease(t)) : 0) + (reduce ? 0 : 0.1 * Math.sin((now - began) / 4200));
      if (L === 7 && opts.build && t < 1) {
        const tb = Math.min(1, t * 1.6);
        clayBuf.getContext('2d').drawImage(snap(w, h, 6, 1, 'clay', theta), 0, 0);
        ctx.drawImage(snap(w, h, 7, tb, 'render', theta), 0, 0);
        const x = w * ease(t);
        ctx.save(); ctx.beginPath(); ctx.rect(x, 0, w - x, h); ctx.clip(); ctx.drawImage(clayBuf, 0, 0); ctx.restore();
        ctx.fillStyle = '#DBFC3B'; ctx.fillRect(x - 3, 0, 6, h);
      } else {
        ctx.drawImage(snap(w, h, L, t, L === 7 ? 'render' : 'clay', theta), 0, 0);
      }
      if ((opts.build && t < 1) || (opts.alive && opts.alive() && !reduce)) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { stopped = true; cancelAnimationFrame(raf); };
  }

  window.House3D = { ok: true, sprite, play };
})();
