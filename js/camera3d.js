/*
 * Rotatable 3D model of an X-T30 II–style body with a standard zoom, built from
 * primitives with three.js (no photos, no logos). Units are roughly centimetres.
 * Drag to rotate; it eases back to a front view when left alone.
 */
(function () {
  'use strict';
  const host = document.getElementById('cam3d');
  if (!host || !window.THREE) return;
  const THREE = window.THREE;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    host.classList.add('no-webgl');
    host.textContent = '3D view needs WebGL.';
    return;
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 4 / 3, 1, 200);
  camera.position.set(0, 2.2, 34);
  camera.lookAt(0, 0.6, 0);

  // ---------- studio environment for reflections: dark room, three soft boxes ----------
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x020202);
  const box = (w, h, x, y, z, ry, intensity, tint) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    if (ry) m.rotateZ(ry);
    envScene.add(m);
  };
  box(22, 5, 0, 22, 6, 0, 0.9, 0xffffff);       // overhead strip
  box(5, 20, -24, 4, 10, 0, 0.7, 0xffffff);     // key, left
  box(4, 18, 24, 2, -6, 0, 0.45, 0xffffff);     // rim, right-back
  scene.environment = pmrem.fromScene(envScene, 0.035).texture;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x161616, 0.18));
  const key = new THREE.DirectionalLight(0xffffff, 1.25);
  key.position.set(-10, 14, 16);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.8);
  rim.position.set(12, 6, -14);
  scene.add(rim);

  // ---------- procedural textures ----------
  const canvasTex = (w, h, draw, repeat) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  };
  // pebbled leatherette
  const leather = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 1 + Math.random() * 2.6, v = 90 + Math.random() * 120;
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  }, [0.55, 0.55]);
  // vertical ridges for dial edges and lens rings
  const ridges = (n) => canvasTex(512, 8, (g, w, h) => {
    for (let x = 0; x < w; x++) { const v = 128 + 110 * Math.sin((x / w) * n * Math.PI * 2); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, 0, 1, h); }
  });
  // tick marks on dial tops
  const ticks = (count, label) => canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#1e1e21'; g.fillRect(0, 0, w, h);
    g.translate(w / 2, h / 2);
    for (let i = 0; i < count; i++) {
      g.save(); g.rotate((i / count) * Math.PI * 2);
      g.fillStyle = i % 3 === 0 ? '#e9e7e2' : '#8d8a84';
      g.fillRect(-1.5, -118, 3, i % 3 === 0 ? 22 : 12);
      g.restore();
    }
    if (label) { g.fillStyle = '#e9e7e2'; g.font = '600 28px Geist, sans-serif'; g.textAlign = 'center'; g.fillText(label, 0, 10); }
  });

  // ---------- materials ----------
  const M = {
    body: new THREE.MeshPhysicalMaterial({ color: 0x0d0d0f, roughness: 0.5, metalness: 0.1, clearcoat: 0.1, clearcoatRoughness: 0.5, envMapIntensity: 0.18 }),
    plate: new THREE.MeshPhysicalMaterial({ color: 0x141416, roughness: 0.32, metalness: 0.7, clearcoat: 0.2, clearcoatRoughness: 0.3, envMapIntensity: 0.45 }),
    leather: new THREE.MeshStandardMaterial({ color: 0x080809, roughness: 0.92, metalness: 0, bumpMap: leather, bumpScale: 0.05, envMapIntensity: 0.1 }),
    dialSide: (n) => new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.3, metalness: 0.85, envMapIntensity: 0.5, bumpMap: (() => { const t = ridges(n); t.wrapS = THREE.RepeatWrapping; return t; })(), bumpScale: 0.04 }),
    silver: new THREE.MeshStandardMaterial({ color: 0xd4d4d4, roughness: 0.22, metalness: 1, envMapIntensity: 0.8 }),
    barrel: new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.5, metalness: 0.35, envMapIntensity: 0.22 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x070708, envMapIntensity: 0.1, roughness: 0.85, metalness: 0, bumpMap: (() => { const t = ridges(90); t.wrapS = THREE.RepeatWrapping; return t; })(), bumpScale: 0.08 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x010204, roughness: 0.03, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 0.45, transparent: true, opacity: 0.55 }),
    coating: new THREE.MeshPhysicalMaterial({ color: 0x161616, emissive: 0x0c0c0c, roughness: 0.15, metalness: 0.6, clearcoat: 1, envMapIntensity: 0.7 }),
    black: new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.6, metalness: 0.2 }),
  };

  // ---------- geometry helpers ----------
  const roundedRect = (w, h, r) => {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  };
  // rounded, bevelled slab centred on the origin
  const slab = (shape, d, mat, bevel = 0.1) => {
    const g = new THREE.ExtrudeGeometry(shape, { depth: d - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 14 });
    g.translate(0, 0, -(d - 2 * bevel) / 2);
    return new THREE.Mesh(g, mat);
  };
  // cylinder along the z axis (lens) or y axis (dials)
  const cyl = (rTop, rBot, h, mats, axis) => {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, 96, 1);
    if (axis === 'z') g.rotateX(Math.PI / 2);
    return new THREE.Mesh(g, mats);
  };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };

  // ---------- model ----------
  const cam = new THREE.Group();
  const LENS_X = -0.7, LENS_Y = -0.35;

  // main body, top plate and viewfinder hump
  cam.add(at(slab(roundedRect(11.8, 6.0, 0.55), 3.0, M.body), 0, 0, 0));
  cam.add(at(slab(roundedRect(11.8, 1.05, 0.35), 3.0, M.plate, 0.12), 0, 3.35, 0));
  const hump = new THREE.Shape();
  hump.moveTo(-1.95, 0); hump.lineTo(1.95, 0); hump.lineTo(1.25, 1.55); hump.quadraticCurveTo(1.15, 1.7, 0.95, 1.7);
  hump.lineTo(-0.95, 1.7); hump.quadraticCurveTo(-1.15, 1.7, -1.25, 1.55); hump.lineTo(-1.95, 0);
  cam.add(at(slab(hump, 2.5, M.plate, 0.1), LENS_X, 3.8, -0.15));
  cam.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 1.8), M.silver), LENS_X, 5.56, -0.25)); // hot shoe

  // leatherette front with a hole for the lens mount, and the grip
  const front = roundedRect(11.0, 4.6, 0.35);
  const hole = new THREE.Path(); hole.absarc(LENS_X, LENS_Y + 0.25, 2.72, 0, Math.PI * 2, true);
  front.holes.push(hole);
  const frontMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(front, { depth: 0.07, bevelEnabled: false, curveSegments: 48 }), M.leather);
  cam.add(at(frontMesh, 0, -0.25, 1.5));
  cam.add(at(slab(roundedRect(1.55, 4.4, 0.6), 0.75, M.leather, 0.18), -5.0, -0.45, 1.78));

  // top dials (from the front, the camera's right hand side is on the viewer's left)
  const dial = (r, h, x, z, notches, label) => {
    const d = cyl(r, r, h, [M.dialSide(notches), new THREE.MeshStandardMaterial({ map: ticks(notches > 40 ? 30 : 18, label), roughness: 0.35, metalness: 0.6 }), M.black]);
    return at(d, x, 3.88 + h / 2, z);
  };
  cam.add(dial(0.98, 0.52, -3.75, -0.25, 48, ''));       // shutter speed
  cam.add(dial(0.78, 0.46, -5.25, -0.95, 40, '±'));      // exposure comp
  cam.add(dial(0.88, 0.46, 3.55, -0.25, 44, ''));        // drive
  cam.add(at(cyl(0.38, 0.38, 0.28, M.silver), -4.55, 4.0, 0.95));   // shutter button collar
  cam.add(at(cyl(0.27, 0.27, 0.36, M.black), -4.55, 4.12, 0.95));   // shutter button
  cam.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 2.2), M.plate), 3.55, 3.95, -0.25)); // flash housing
  cam.add(at(cyl(0.42, 0.42, 0.22, [M.dialSide(30), M.black, M.black], 'z'), -5.0, 2.15, 2.05)); // front command dial

  // strap lugs
  [-6.0, 6.0].forEach((x) => {
    const lug = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 12, 24), M.silver);
    lug.rotation.y = Math.PI / 2;
    cam.add(at(lug, x, 2.7, 0.2));
  });

  // lens: mount, aperture ring, zoom ring, front barrel, glass
  const lens = new THREE.Group();
  lens.add(at(cyl(2.7, 2.7, 0.22, M.silver, 'z'), 0, 0, 1.63));
  lens.add(at(cyl(2.48, 2.52, 0.75, M.barrel, 'z'), 0, 0, 2.1));
  lens.add(at(cyl(2.55, 2.55, 0.55, [M.dialSide(120), M.barrel, M.barrel], 'z'), 0, 0, 2.75));
  lens.add(at(cyl(2.62, 2.62, 1.7, [M.rubber, M.barrel, M.barrel], 'z'), 0, 0, 3.9));
  lens.add(at(cyl(2.5, 2.55, 0.8, M.barrel, 'z'), 0, 0, 5.15));
  lens.add(at(cyl(2.25, 2.5, 0.32, M.plate, 'z'), 0, 0, 5.7));
  const capR = 3.4, glassR = 2.05, theta = Math.asin(glassR / capR);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(capR, 64, 24, 0, Math.PI * 2, 0, theta), M.glass);
  dome.rotation.x = Math.PI / 2;
  lens.add(at(dome, 0, 0, 5.75 - capR * Math.cos(theta)));
  lens.add(at(new THREE.Mesh(new THREE.CircleGeometry(1.55, 64), M.coating), 0, 0, 5.62));
  lens.add(at(new THREE.Mesh(new THREE.TorusGeometry(2.08, 0.05, 10, 96), M.silver), 0, 0, 5.84));
  lens.position.set(LENS_X, LENS_Y + 0.25, 0);
  cam.add(lens);

  // model badge on the front plate
  const badge = canvasTex(512, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#d9d6d0';
    g.font = '600 64px Geist, Inter, sans-serif';
    g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillText('X-T30 II', w - 12, h / 2);
  });
  const badgeMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshStandardMaterial({ map: badge, transparent: true, roughness: 0.4, metalness: 0.3 }));
  cam.add(at(badgeMesh, 3.9, 2.35, 1.51));

  // soft contact shadow
  const shadowTex = canvasTex(256, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(0,0,0,.65)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(17, 8), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -3.05, 1.2);
  scene.add(shadow);

  const rig = new THREE.Group();
  rig.add(cam);
  cam.position.set(0, 0, -1.5);   // spin around the body's middle, not the lens tip
  scene.add(rig);

  // ---------- interaction: drag to rotate, ease back to a front view ----------
  const HOME = { yaw: -0.22, pitch: 0.06 };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let yaw = HOME.yaw, pitch = HOME.pitch, vy = 0, vp = 0, drag = null, lastTouch = -1e9;
  host.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY };
    vy = vp = 0;
    host.setPointerCapture(e.pointerId);
    host.classList.add('dragging');
  });
  host.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    vy = dx * 0.012; vp = dy * 0.008;
    yaw += vy; pitch = Math.max(-0.6, Math.min(0.75, pitch + vp));
    lastTouch = performance.now();
  });
  const end = () => { drag = null; host.classList.remove('dragging'); lastTouch = performance.now(); };
  host.addEventListener('pointerup', end);
  host.addEventListener('pointercancel', end);

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  let visible = true, raf = 0;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(host);

  function frame(t) {
    raf = 0;
    if (!visible || !host.offsetParent) return; // hidden page or scrolled away: stop until visible again
    if (!drag) {
      yaw += vy; pitch = Math.max(-0.6, Math.min(0.75, pitch + vp));
      vy *= 0.93; vp *= 0.9;
      if (performance.now() - lastTouch > 2200) {
        // ease back to the front view by the shortest way round
        const d = Math.atan2(Math.sin(HOME.yaw - yaw), Math.cos(HOME.yaw - yaw));
        yaw += d * 0.04;
        pitch += (HOME.pitch - pitch) * 0.04;
      }
    }
    rig.rotation.set(pitch, yaw, 0);
    rig.position.y = reduce ? 0 : Math.sin(t / 1400) * 0.12;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  // resume when the home page becomes visible again
  window.addEventListener('hashchange', () => { if (!raf) raf = requestAnimationFrame(frame); });
})();
