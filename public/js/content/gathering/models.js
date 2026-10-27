// Low-poly, flat-shaded models for the gathering pack: trees and stumps, ore rocks, fishing spot ripples,
// flax, hunter traps and farming patches. Static parts are merged into one vertex-coloured mesh per object.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { registry } from '../../registry.js';

const col = new THREE.Color();
const rnd = (a, b) => a + Math.random() * (b - a);

// Collects coloured geometry and merges it into a single mesh.
class MB {
  constructor() { this.parts = []; }
  add(geo, color, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, sx = s, sy = s, sz = s } = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo;
    g.scale(sx, sy, sz);
    if (rx || ry || rz) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)));
    g.translate(x, y, z);
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    const n = g.attributes.position.count, c = new Float32Array(n * 3);
    col.set(color);
    for (let i = 0; i < n; i++) { const v = 1 + (Math.random() - 0.5) * 0.06; c[i * 3] = col.r * v; c[i * 3 + 1] = col.g * v; c[i * 3 + 2] = col.b * v; }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    this.parts.push(g);
    return this;
  }
  mesh(extra = {}) {
    const geo = mergeGeometries(this.parts);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, ...extra }));
  }
}

const cyl = (rt, rb, h, n = 6) => new THREE.CylinderGeometry(rt, rb, h, n, 1).translate(0, h / 2, 0);
const ico = (r, d = 0) => new THREE.IcosahedronGeometry(r, d);
const dode = r => new THREE.DodecahedronGeometry(r, 0);
const cone = (r, h, n = 6) => new THREE.ConeGeometry(r, h, n).translate(0, h / 2, 0);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
const group = (...kids) => { const g = new THREE.Group(); g.add(...kids); return g; };

// a branch from (x, y, z) tilted by (tx, tz), length l
function limb(mb, color, x, y, z, l, r0, r1, tx, tz) {
  const g = cyl(r1, r0, l, 5);
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(tx, 0, tz)));
  mb.add(g, color, { x, y, z });
  return { x: x - Math.sin(tz) * l, y: y + Math.cos(tz) * Math.cos(tx) * l, z: z + Math.cos(tz) * Math.sin(tx) * l };
}

// ------------------------------------------------------------------ trees
const TREES = {
  // young street tree with an Amsterdam tree guard around the trunk
  tree_normal() {
    const mb = new MB(), bark = '#6a4a2a', leaf = ['#4f8a2a', '#5e9a32', '#467a24'];
    mb.add(cyl(0.11, 0.17, 2.4, 6), bark);
    limb(mb, bark, 0, 1.6, 0, 0.8, 0.07, 0.04, 0, 0.7);
    limb(mb, bark, 0, 1.8, 0, 0.7, 0.07, 0.04, 0.6, -0.5);
    mb.add(ico(1.0), leaf[0], { y: 2.8, sx: 1.05, sy: 0.95, sz: 1.05 });
    mb.add(ico(0.7), leaf[1], { x: 0.55, y: 2.5, z: 0.25 });
    mb.add(ico(0.65), leaf[2], { x: -0.5, y: 2.55, z: -0.3 });
    mb.add(ico(0.55), leaf[1], { x: 0.05, y: 3.45, z: -0.1 });
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; mb.add(box(0.05, 0.9, 0.05), '#2c3a30', { x: Math.cos(a) * 0.38, z: Math.sin(a) * 0.38 }); }
    for (const y of [0.35, 0.85]) for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; mb.add(box(0.55, 0.04, 0.04), '#2c3a30', { x: Math.cos(a) * 0.38, y, z: Math.sin(a) * 0.38, ry: a + Math.PI / 2 }); }
    mb.add(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 8), '#4a3c2c', { y: 0.02 });
    return mb.mesh();
  },
  // broad, low crown on a thick forked trunk
  tree_oak() {
    const mb = new MB(), bark = '#5e4428', leaf = ['#3d6a22', '#46762a', '#335c1c', '#4e7e2e'];
    mb.add(cyl(0.3, 0.5, 2.2, 7), bark);
    for (const [x, z] of [[0.45, 0], [-0.35, 0.3], [0, -0.45]]) mb.add(cyl(0.02, 0.18, 0.5, 4), bark, { x, z, rz: -x * 0.9, rx: z * 0.9 });
    limb(mb, bark, 0.1, 2.0, 0, 1.6, 0.22, 0.12, 0.2, -0.7);
    limb(mb, bark, -0.1, 2.0, 0, 1.5, 0.22, 0.12, -0.4, 0.6);
    limb(mb, bark, 0, 2.1, 0, 1.4, 0.2, 0.1, 0.7, 0.1);
    const clumps = [[0, 4.0, 0, 1.9], [1.5, 3.5, 0.3, 1.3], [-1.4, 3.6, 0.4, 1.35], [0.2, 3.5, 1.4, 1.2], [-0.2, 3.6, -1.4, 1.25], [0.9, 4.4, -0.7, 1.0], [-0.8, 4.5, 0.6, 1.0]];
    clumps.forEach(([x, y, z, r], i) => mb.add(ico(r * rnd(0.92, 1.08)), leaf[i % 4], { x, y, z, sy: 0.75 }));
    return mb.mesh();
  },
  // leaning trunk with long drooping fronds
  tree_willow() {
    const mb = new MB(), bark = '#6e5a3a', leaf = ['#8aa83a', '#9cb848', '#7a9a30'];
    mb.add(cyl(0.22, 0.38, 2.6, 6), bark, { rz: 0.12 });
    const top = { x: -0.3, y: 2.55, z: 0 };
    mb.add(ico(1.3), leaf[0], { x: top.x, y: top.y + 0.9, z: 0, sy: 0.55 });
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2 + rnd(-0.2, 0.2), r = rnd(0.9, 1.6), h = rnd(2.0, 2.8);
      const g = new THREE.ConeGeometry(rnd(0.3, 0.45), h, 4).rotateX(Math.PI).translate(0, -h / 2, 0);
      mb.add(g, leaf[i % 3], { x: top.x + Math.cos(a) * r, y: top.y + 1.1, z: Math.sin(a) * r, rx: Math.sin(a) * 0.25, rz: -Math.cos(a) * 0.25 });
    }
    return mb.mesh();
  },
  // the Amsterdam elm: tall vase shape, limbs fan upwards into a high wide crown
  tree_elm() {
    const mb = new MB(), bark = '#4e3a2a', leaf = ['#4f7a2c', '#5a8836', '#456e26'];
    mb.add(cyl(0.22, 0.36, 3.0, 7), bark);
    const tips = [];
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2 + 0.3;
      tips.push(limb(mb, bark, 0, 2.9, 0, 2.4, 0.16, 0.07, Math.sin(a) * 0.5, -Math.cos(a) * 0.5));
    }
    tips.forEach((t, i) => mb.add(ico(rnd(1.05, 1.25)), leaf[i % 3], { x: t.x, y: t.y + 0.3, z: t.z, sy: 0.7 }));
    mb.add(ico(1.5), leaf[1], { y: 5.9, sy: 0.6 });
    return mb.mesh();
  },
  // round crown in autumn reds and oranges
  tree_maple() {
    const mb = new MB(), bark = '#5a3a22', leaf = ['#b8401c', '#d8641e', '#a8301a', '#e08a2a'];
    mb.add(cyl(0.18, 0.3, 2.6, 6), bark);
    limb(mb, bark, 0, 2.2, 0, 1.2, 0.13, 0.07, 0.3, -0.6);
    limb(mb, bark, 0, 2.3, 0, 1.1, 0.13, 0.07, -0.5, 0.5);
    const clumps = [[0, 4.1, 0, 1.45], [1.0, 3.6, 0.3, 1.0], [-0.9, 3.7, 0.45, 1.0], [0.25, 3.6, -1.0, 1.0], [-0.3, 3.6, 1.0, 0.95], [0.3, 4.9, 0.1, 0.9]];
    clumps.forEach(([x, y, z, r], i) => mb.add(ico(r * rnd(0.9, 1.1)), leaf[i % 4], { x, y, z }));
    return mb.mesh();
  },
  // dark, dense evergreen with a reddish trunk and berries
  tree_yew() {
    const mb = new MB(), bark = '#6a3424', leaf = ['#24461e', '#2c5224', '#1e3c1a'];
    mb.add(cyl(0.32, 0.55, 1.8, 7), bark);
    mb.add(cyl(0.12, 0.22, 1.0, 5), bark, { x: 0.3, y: 1.2, rz: -0.5 });
    mb.add(new THREE.ConeGeometry(2.3, 2.6, 7).translate(0, 1.3, 0), leaf[0], { y: 1.6 });
    mb.add(new THREE.ConeGeometry(1.8, 2.2, 7).translate(0, 1.1, 0), leaf[1], { y: 2.9, ry: 0.4 });
    mb.add(new THREE.ConeGeometry(1.1, 1.8, 6).translate(0, 0.9, 0), leaf[2], { y: 4.2 });
    for (let i = 0; i < 4; i++) mb.add(ico(rnd(0.7, 0.9)), leaf[i % 3], { x: Math.cos(i * 1.7) * 1.6, y: rnd(2.0, 2.8), z: Math.sin(i * 1.7) * 1.6 });
    for (let i = 0; i < 14; i++) { const a = rnd(0, 6.28), y = rnd(2.0, 4.6), r = (5.6 - y) * 0.45; mb.add(ico(0.07), '#c8202a', { x: Math.cos(a) * r, y, z: Math.sin(a) * r }); }
    return mb.mesh();
  },
  // pale twisting trunk, glowing teal crown with drifting sparkles
  tree_magic() {
    const mb = new MB(), bark = '#7a8a98';
    mb.add(cyl(0.2, 0.42, 2.4, 6), bark, { ry: 0.3 });
    const tips = [];
    for (let i = 0; i < 4; i++) { const a = i * 1.6 + 0.4; tips.push(limb(mb, bark, 0, 2.3, 0, 1.9, 0.14, 0.05, Math.sin(a) * 0.6, -Math.cos(a) * 0.6)); }
    const g = group(mb.mesh());
    const glow = new MB();
    tips.forEach((t, i) => glow.add(new THREE.OctahedronGeometry(rnd(0.9, 1.1)), i % 2 ? '#3ac8b0' : '#5ae0c8', { x: t.x, y: t.y + 0.2, z: t.z }));
    glow.add(new THREE.OctahedronGeometry(1.2), '#48d8c0', { y: 4.6 });
    g.add(glow.mesh({ emissive: new THREE.Color('#1a6a5a') }));
    const sparks = [];
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), new THREE.MeshBasicMaterial({ color: '#d8fff4' }));
      s.userData = { a: rnd(0, 6.28), r: rnd(0.8, 2.2), y: rnd(1.2, 5.2), sp: rnd(0.3, 0.8) };
      sparks.push(s); g.add(s);
    }
    g.userData.tick = now => {
      for (const s of sparks) {
        const u = s.userData, a = u.a + now / 1000 * u.sp;
        s.position.set(Math.cos(a) * u.r, u.y + Math.sin(now / 700 + u.a) * 0.3, Math.sin(a) * u.r);
      }
    };
    return g;
  },
};

for (const [id, build] of Object.entries(TREES)) {
  registry.objectModels[id] = () => { const m = build(); const g = m.isGroup ? m : group(m); g.rotation.y = rnd(0, 6.28); const out = group(g); out.userData.tick = g.userData.tick; return out; };
}

registry.objectModels.tree_stump = ({ color = '#6a4a2a', r = 0.4 } = {}) => {
  const mb = new MB();
  mb.add(cyl(r * 0.92, r * 1.1, 0.45, 7), color);
  mb.add(new THREE.CylinderGeometry(r * 0.85, r * 0.85, 0.03, 7), '#c8a878', { y: 0.46 });
  mb.add(new THREE.CylinderGeometry(r * 0.45, r * 0.45, 0.035, 7), '#a8885a', { y: 0.47 });
  for (let i = 0; i < 3; i++) { const a = i * 2.1; mb.add(cyl(0.02, r * 0.35, 0.3, 4), color, { x: Math.cos(a) * r, z: Math.sin(a) * r, rz: -Math.cos(a) * 1.2, rx: Math.sin(a) * 1.2 }); }
  for (let i = 0; i < 4; i++) mb.add(box(0.12, 0.05, 0.08), '#b8945e', { x: rnd(-0.8, 0.8), z: rnd(-0.8, 0.8), ry: rnd(0, 3) });
  return group(mb.mesh());
};

// ------------------------------------------------------------------ rocks
function rockBase(mb, colors) {
  const lumps = [[0, 0.42, 0, 0.6], [0.35, 0.3, 0.2, 0.42], [-0.32, 0.28, 0.15, 0.4], [0.05, 0.3, -0.35, 0.42], [-0.15, 0.7, -0.05, 0.36]];
  lumps.forEach(([x, y, z, r], i) => mb.add(dode(r * rnd(0.9, 1.1)), colors[i % colors.length], { x, y, z, sy: 0.8, rx: rnd(0, 3), ry: rnd(0, 3) }));
  return lumps;
}
registry.objectModels.ore_rock = ({ fleck = '#c8742e', clay = false } = {}) => {
  const mb = new MB();
  const lumps = rockBase(mb, clay ? ['#9a8058', '#8a7048', '#a88a60'] : ['#6e6a62', '#625e57', '#78736a']);
  for (let i = 0; i < 9; i++) {
    const [x, y, z, r] = lumps[i % lumps.length];
    const a = rnd(0, 6.28), b = rnd(-0.6, 0.9);
    mb.add(new THREE.OctahedronGeometry(rnd(0.08, 0.14)), fleck, { x: x + Math.cos(a) * Math.cos(b) * r * 0.85, y: y + Math.sin(b) * r * 0.7, z: z + Math.sin(a) * Math.cos(b) * r * 0.85 });
  }
  return group(mb.mesh());
};
registry.objectModels.ore_rock_empty = () => {
  const mb = new MB();
  rockBase(mb, ['#58544e', '#4e4a45', '#625d56']);
  return group(mb.mesh());
};

// ------------------------------------------------------------------ fishing spots (animated)
registry.objectModels.fishing_spot = ({ kind = 'fish_canal' } = {}) => {
  const g = new THREE.Group();
  const big = kind === 'fish_harbour' || kind === 'fish_shark';
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.9, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#dff0ff', transparent: true, opacity: 0.8, depthWrite: false }));
    m.position.y = 0.04 + i * 0.002; rings.push(m); g.add(m);
  }
  const foam = new THREE.Mesh(new THREE.CircleGeometry(0.35, 8).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#b8d8ee', transparent: true, opacity: 0.6, depthWrite: false }));
  foam.position.y = 0.03; g.add(foam);
  const bubbles = [];
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), new THREE.MeshLambertMaterial({ color: '#eaf6ff', flatShading: true }));
    b.userData = { a: rnd(0, 6.28), r: rnd(0.1, 0.5), ph: rnd(0, 1) };
    bubbles.push(b); g.add(b);
  }
  let fin = null, fish = null;
  if (kind === 'fish_shark') {
    fin = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 3).translate(0, 0.25, 0).scale(0.4, 1, 1.2), new THREE.MeshLambertMaterial({ color: '#4a5560', flatShading: true }));
    g.add(fin);
  } else if (kind === 'fish_river' || kind === 'fish_pond') {
    fish = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.36, 4).rotateX(Math.PI / 2), new THREE.MeshLambertMaterial({ color: kind === 'fish_river' ? '#c8a0a0' : '#7a8a5a', flatShading: true }));
    g.add(fish);
  }
  const scale = big ? 1.4 : 1;
  g.scale.setScalar(scale);
  const seed = Math.random() * 10;
  g.userData.tick = now => {
    const t = now / 1000 + seed;
    rings.forEach((m, i) => {
      const k = ((t * 0.45 + i / 3) % 1);
      m.scale.setScalar(0.35 + k * 0.9);
      m.material.opacity = 0.75 * (1 - k);
    });
    foam.material.opacity = 0.45 + Math.sin(t * 3) * 0.15;
    for (const b of bubbles) {
      const u = b.userData, k = (t * 0.8 + u.ph) % 1;
      b.position.set(Math.cos(u.a + t) * u.r, 0.02 + Math.sin(k * Math.PI) * 0.12, Math.sin(u.a + t) * u.r);
      b.visible = k < 0.8;
    }
    if (fin) { const a = t * 0.9; fin.position.set(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9); fin.rotation.y = -a; }
    if (fish) {
      const k = (t * 0.35) % 1;
      fish.visible = k < 0.3;
      const j = k / 0.3;
      fish.position.set(-0.4 + j * 0.8, Math.sin(j * Math.PI) * 0.6, 0.1);
      fish.rotation.z = (j - 0.5) * 2;
    }
  };
  return g;
};

// ------------------------------------------------------------------ flax
registry.objectModels.flax_plant = () => {
  const mb = new MB();
  for (let i = 0; i < 7; i++) {
    const x = rnd(-0.3, 0.3), z = rnd(-0.3, 0.3), h = rnd(0.7, 1.0), tx = rnd(-0.15, 0.15), tz = rnd(-0.15, 0.15);
    mb.add(cyl(0.012, 0.02, h, 3), '#7a9a3a', { x, z, rx: tx, rz: tz });
    const top = { x: x - Math.sin(tz) * h, y: h, z: z + Math.sin(tx) * h };
    mb.add(new THREE.OctahedronGeometry(0.06), i % 3 ? '#5a7ad8' : '#7a98f0', { ...top });
    mb.add(new THREE.ConeGeometry(0.03, 0.2, 3), '#8aaa44', { x: x + 0.04, y: h * 0.5, z, rz: -0.6 });
  }
  return group(mb.mesh());
};
registry.objectModels.flax_picked = () => {
  const mb = new MB();
  for (let i = 0; i < 7; i++) mb.add(cyl(0.012, 0.02, rnd(0.12, 0.22), 3), '#9a8a4a', { x: rnd(-0.3, 0.3), z: rnd(-0.3, 0.3) });
  return group(mb.mesh());
};

// ------------------------------------------------------------------ hunter traps
registry.objectModels.bird_snare = ({ st = 'set' } = {}) => {
  const mb = new MB(), wood = '#7a5a34', string = '#e0d6b8';
  const g = new THREE.Group();
  if (st === 'failed') {
    mb.add(cyl(0.025, 0.03, 0.7, 4), wood, { y: 0.03, rz: Math.PI / 2 - 0.1 });
    mb.add(new THREE.TorusGeometry(0.12, 0.012, 3, 8), string, { x: 0.25, y: 0.02, rx: Math.PI / 2 });
  } else {
    mb.add(cyl(0.02, 0.03, 0.55, 4), wood, { x: -0.2 });
    mb.add(cyl(0.015, 0.02, 0.9, 4), wood, { x: 0.15, rz: 0.55 }); // bent sapling
    mb.add(cyl(0.004, 0.004, 0.35, 3), string, { x: -0.3, y: 0.55, rz: -0.2 });
    if (st === 'set') mb.add(new THREE.TorusGeometry(0.11, 0.01, 3, 10), string, { y: 0.14, rx: Math.PI / 2 - 0.4 });
    else {
      mb.add(cyl(0.004, 0.004, 0.3, 3), string, { x: -0.33, y: 0.22 });
      const bird = new MB();
      bird.add(ico(0.1), '#3aa83a', { sy: 0.8, sz: 1.3 });
      bird.add(ico(0.065), '#4ac04a', { y: 0.08, z: 0.1 });
      bird.add(new THREE.ConeGeometry(0.025, 0.07, 3).rotateX(Math.PI / 2), '#d82020', { y: 0.07, z: 0.18 });
      bird.add(new THREE.BoxGeometry(0.03, 0.02, 0.18), '#2a7a2a', { y: -0.02, z: -0.15 });
      const b = bird.mesh();
      b.position.set(-0.33, 0.12, 0);
      b.rotation.z = Math.PI;
      g.add(b);
      g.userData.tick = now => { b.rotation.x = Math.sin(now / 160) * 0.35; };
    }
  }
  g.add(mb.mesh());
  return g;
};
registry.objectModels.box_trap = ({ st = 'set' } = {}) => {
  const g = new THREE.Group(), wood = '#8a6238', dark = '#5a3e22';
  const mb = new MB();
  mb.add(box(0.45, 0.04, 0.8), dark);
  for (const x of [-0.22, 0.22]) mb.add(box(0.03, 0.4, 0.8), wood, { x });
  mb.add(box(0.47, 0.03, 0.8), wood, { y: 0.4 });
  mb.add(box(0.45, 0.4, 0.03), wood, { z: -0.4 });
  for (let i = -2; i <= 2; i++) mb.add(box(0.02, 0.36, 0.02), dark, { x: i * 0.08, y: 0.02, z: -0.42 });
  const body = mb.mesh();
  const doorMb = new MB();
  doorMb.add(new THREE.BoxGeometry(0.42, 0.38, 0.03).translate(0, -0.19, 0), wood);
  const door = doorMb.mesh();
  door.position.set(0, 0.4, 0.4);
  door.rotation.x = st === 'set' ? -1.5 : 0;
  const inner = group(body, door);
  if (st === 'failed') { inner.rotation.z = 0.35; inner.position.y = 0.06; }
  g.add(inner);
  if (st === 'caught') {
    const ears = new MB();
    for (const x of [-0.06, 0.06]) ears.add(new THREE.ConeGeometry(0.03, 0.16, 4).translate(0, 0.08, 0), '#b89a78', { x, y: 0.41, z: -0.3 });
    inner.add(ears.mesh());
    g.userData.tick = now => { inner.rotation.z = Math.sin(now / 70) * 0.03 * (Math.sin(now / 900) > 0 ? 1 : 0); };
  }
  return g;
};

// ------------------------------------------------------------------ farming patches
registry.objectModels.farm_patch = ({ kind = 'allotment' } = {}) => {
  const mb = new MB(), plank = '#7a5a34', soil = kind === 'herb' ? '#4a3420' : '#553a22';
  const w = kind === 'herb' ? 2.4 : 2.8;
  mb.add(box(w, 0.12, w), soil);
  for (let i = 0; i < 4; i++) {
    const rows = kind === 'herb' ? 3 : 4;
    if (i < rows) mb.add(box(w - 0.3, 0.06, 0.12), '#3e2a18', { y: 0.1, z: -w / 2 + 0.35 + i * (w - 0.7) / (rows - 1) });
  }
  for (const s of [-1, 1]) {
    mb.add(box(w + 0.2, 0.22, 0.1), plank, { z: s * (w / 2 + 0.05) });
    mb.add(box(0.1, 0.22, w + 0.2), plank, { x: s * (w / 2 + 0.05) });
  }
  if (kind === 'herb') for (const [x, z] of [[-1.25, -1.25], [1.25, 1.25]]) { mb.add(box(0.04, 0.4, 0.04), '#8a6a40', { x, z }); mb.add(box(0.22, 0.12, 0.02), '#e8e2d0', { x, y: 0.34, z: z + 0.03 }); }
  const g = group(mb.mesh());
  g.userData.farmPatch = kind;
  return g;
};

// overlay of weeds / crops for one player's view of a patch: v = { kind, w, crop, color, stage, stages, comp }
export function buildPatchOverlay(v) {
  const mb = new MB();
  const w = v.kind === 'herb' ? 2.4 : 2.8;
  let any = false;
  if (v.comp) { mb.add(box(w - 0.1, 0.02, w - 0.1), '#2e2014', { y: 0.12 }); any = true; }
  for (let i = 0; i < v.w * 9; i++) {
    const x = rnd(-w / 2 + 0.2, w / 2 - 0.2), z = rnd(-w / 2 + 0.2, w / 2 - 0.2), h = rnd(0.2, 0.45);
    mb.add(cone(0.08, h, 3), i % 3 ? '#8a9a32' : '#a8a83a', { x, y: 0.1, z, rx: rnd(-0.3, 0.3), rz: rnd(-0.3, 0.3) });
    any = true;
  }
  if (v.crop) {
    const k = Math.min(1, (v.stage + 1) / (v.stages + 1)), ready = v.stage >= v.stages;
    const spots = v.kind === 'herb' ? [[-0.6, -0.6], [0.6, -0.6], [0, 0], [-0.6, 0.6], [0.6, 0.6]] : [-0.9, 0, 0.9].flatMap(x => [-0.9, 0, 0.9].map(z => [x, z]));
    for (const [x, z] of spots) {
      if (v.crop === 'onion_seed') {
        for (let j = 0; j < 4; j++) mb.add(cyl(0.02, 0.03, 0.7 * k, 3), '#6aa83a', { x: x + rnd(-0.06, 0.06), y: 0.1, z: z + rnd(-0.06, 0.06), rx: rnd(-0.2, 0.2), rz: rnd(-0.2, 0.2) });
        if (ready) mb.add(ico(0.11), '#d8b88a', { x, y: 0.14, z });
      } else if (v.crop === 'cabbage_seed') {
        mb.add(ico(0.32 * k, 0), '#6ab05a', { x, y: 0.12 + 0.2 * k, z, sy: 0.8 });
        mb.add(ico(0.2 * k, 0), '#a8d888', { x, y: 0.14 + 0.32 * k, z });
      } else if (v.crop === 'potato_seed') {
        mb.add(ico(0.3 * k), v.color, { x, y: 0.1 + 0.25 * k, z, sy: 0.9 });
        mb.add(ico(0.18 * k), '#5a9a34', { x: x + 0.15, y: 0.15 + 0.4 * k, z: z - 0.1 });
        if (ready) for (let j = 0; j < 3; j++) mb.add(ico(0.05), '#f2f2e8', { x: x + rnd(-0.2, 0.2), y: 0.1 + 0.55 * k, z: z + rnd(-0.2, 0.2) });
      } else { // herbs: bushy clumps with coloured tips
        for (let j = 0; j < 5; j++) { const a = j * 1.26; mb.add(cone(0.07, 0.55 * k, 4), v.color, { x: x + Math.cos(a) * 0.12, y: 0.1, z: z + Math.sin(a) * 0.12, rx: Math.sin(a) * 0.5, rz: -Math.cos(a) * 0.5 }); }
        if (ready) mb.add(ico(0.1), '#d8e870', { x, y: 0.1 + 0.5 * k, z });
      }
    }
    any = true;
  }
  return any ? mb.mesh() : null;
}
