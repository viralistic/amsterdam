// Object models for the combat pack: dungeon props, Wilderness signs and entrances, the ArenA, agility obstacles,
// market stalls and farm props. Built facing +z, base on y=0, centred on the tile.
import * as THREE from 'three';
import { registry } from '../../registry.js';
import { M, box, cyl, cone, ball, rock, group, piv, glow } from './helpers.js';

// boxes here stand on their y coordinate (like the core object models)
const bx = (w, h, d, c, x = 0, y = 0, z = 0) => box(w, h, d, c, x, y + h / 2, z);
const BRICK = '#7a3f2b', RUST = '#8a5a2e', IRON = '#5a5e64';

// ---------------------------------------------------------------- Westergasfabriek
registry.objectModels.cb_gas_door = () => {
  const g = group();
  g.add(bx(3.4, 3.4, 0.6, BRICK, 0, 0, -0.1));
  g.add(bx(1.8, 2.4, 0.1, '#3a3e42', 0, 0, 0.22));
  for (const y of [0.5, 1.2, 1.9]) g.add(bx(1.8, 0.08, 0.06, RUST, 0, y, 0.3));
  g.add(cyl(1.0, 1.0, 0.62, BRICK, 0, 2.6, -0.1, null, 10).rotateX(Math.PI / 2));
  g.add(bx(2.4, 0.4, 0.1, '#e8e0c8', 0, 3.0, 0.24));
  g.add(bx(2.0, 0.08, 0.04, '#3a2a1a', 0, 3.17, 0.3));
  return g;
};
registry.objectModels.cb_vent = () => {
  const g = group();
  g.add(bx(0.9, 0.06, 0.9, '#3a3a3a'));
  for (let i = -3; i <= 3; i++) g.add(bx(0.06, 0.08, 0.8, '#1a1a1a', i * 0.11, 0.0, 0));
  g.add(cyl(0.14, 0.18, 0.5, RUST, 0.32, 0, -0.32, null, 6));
  const p = ball(0.25, '#e8e8e8', 0, 0.35, 0, null, 1, 0.6, 1); p.material.transparent = true; p.material.opacity = 0.35; g.add(p);
  return g;
};
registry.objectModels.cb_pipes = () => {
  const g = group();
  for (const [x, y, r, c] of [[-0.2, 0.6, 0.22, '#4e6a5a'], [0.25, 0.9, 0.16, RUST], [0, 1.4, 0.12, IRON]]) { const pp = cyl(r, r, 3, c, x, y, 0, null, 8); pp.rotation.x = Math.PI / 2; pp.position.y = y; g.add(pp); }
  for (const z of [-1.2, 1.2]) g.add(bx(0.8, 1.5, 0.1, '#3a3a3a', 0, 0, z));
  g.add(cyl(0.2, 0.2, 0.06, '#c82020', 0.25, 1.15, 0.6, null, 8));
  return g;
};
registry.objectModels.cb_tank = () => {
  const g = group();
  g.add(cyl(0.9, 0.9, 1.8, '#4e6a5a', 0, 0.9 + 0.1, 0, null, 10));
  g.add(ball(0.9, '#4e6a5a', 0, 1.9, 0, null, 1, 0.35, 1, 10, 4));
  for (const y of [0.3, 1.0, 1.7]) g.add(cyl(0.93, 0.93, 0.06, IRON, 0, y, 0, null, 10));
  g.add(cyl(0.12, 0.12, 0.08, '#f2f2f2', 0, 1.2, 0.92, null, 8).rotateX(Math.PI / 2));
  for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) g.add(bx(0.12, 0.2, 0.12, '#2a2a2a', x, 0, z));
  return g;
};
registry.objectModels.cb_scrap = ({ empty } = {}) => {
  const g = group();
  const bits = empty ? 3 : 10;
  for (let i = 0; i < bits; i++) {
    const a = i * 2.4, r = 0.15 + (i % 3) * 0.12;
    const b = i % 3 === 0 ? bx(0.35, 0.12, 0.25, i % 2 ? RUST : IRON) : i % 3 === 1 ? cyl(0.08, 0.08, 0.5, '#6a6e72') : rock(0.15, '#7a5a3a');
    b.position.set(Math.cos(a) * r, 0.06 + (empty ? 0 : (bits - i) * 0.035), Math.sin(a) * r); b.rotation.set(a, a * 0.7, 0);
    g.add(b);
  }
  if (!empty) g.add(cyl(0.12, 0.12, 0.04, '#c89a3a', 0.1, 0.42, 0.05, null, 8));
  return g;
};
registry.objectModels.cb_bench = () => {
  const g = group();
  g.add(bx(1.8, 0.1, 0.8, '#6a4a2a', 0, 0.85, 0));
  for (const [x, z] of [[-0.8, -0.32], [0.8, -0.32], [-0.8, 0.32], [0.8, 0.32]]) g.add(bx(0.1, 0.85, 0.1, '#4a3018', x, 0, z));
  g.add(bx(0.3, 0.25, 0.3, IRON, 0.6, 0.95, 0.1));
  g.add(cyl(0.1, 0.1, 0.06, '#c89a3a', -0.3, 0.95, 0, null, 8));
  g.add(cyl(0.15, 0.15, 0.06, '#c89a3a', -0.55, 0.95, 0.15, null, 8));
  return g;
};

// ---------------------------------------------------------------- Wilderness
registry.objectModels.cb_warnsign = () => {
  const g = group();
  g.add(bx(0.1, 1.7, 0.1, '#4a3a2a'));
  g.add(bx(1.0, 0.7, 0.06, '#d81e1e', 0, 1.2, 0));
  g.add(bx(0.86, 0.56, 0.07, '#f2f2f2', 0, 1.27, 0));
  g.add(ball(0.13, '#1a1a1a', 0, 1.6, 0.05, null, 1, 0.9, 0.3));
  g.add(bx(0.2, 0.05, 0.03, '#1a1a1a', 0, 1.36, 0.05));
  for (const s of [-1, 1]) { const x = bx(0.3, 0.05, 0.03, '#1a1a1a', 0, 1.43, 0.05); x.rotation.z = s * 0.6; g.add(x); }
  return g;
};
registry.objectModels.cb_ruin = ({ kind } = {}) => {
  const g = group();
  if (kind === 'wall') {
    for (let i = 0; i < 3; i++) g.add(bx(1, 1.2 + (i % 2) * 0.9 - i * 0.2, 0.6, '#8a8478', i - 1, 0, 0));
    g.add(rock(0.3, '#6a7a4a', 1.1, 0.1, 0.4));
    g.add(bx(1.2, 0.08, 0.66, '#5a7a3a', -0.5, 1.2, 0));
  } else {
    g.add(bx(0.9, 0.3, 0.9, '#7a766c'));
    g.add(cyl(0.3, 0.34, 2.2, '#a8a294', 0, 1.4, 0, null, 8));
    const top = cyl(0.3, 0.3, 0.6, '#a8a294', 0.5, 0.15, 0.5, null, 8); top.rotation.z = Math.PI / 2; g.add(top);
    g.add(bx(0.7, 0.06, 0.7, '#5a7a3a', 0, 2.5, 0));
  }
  return g;
};
registry.objectModels.cb_rubble = () => {
  const g = group();
  for (const [x, z, r, c] of [[0, 0, 0.35, '#7a7266'], [0.3, 0.2, 0.22, '#8a8276'], [-0.25, 0.25, 0.2, '#6a6458'], [0.1, -0.3, 0.18, '#7a7266']]) g.add(rock(r, c, x, r * 0.6, z));
  return g;
};
registry.objectModels.cb_hatch = () => {
  const g = group();
  g.add(bx(1.1, 0.25, 1.1, '#4a4e44'));
  g.add(bx(0.9, 0.06, 0.9, '#2a7a3a', 0, 0.25, 0));
  g.add(bx(0.1, 1.5, 0.1, '#3a3a3a', -0.55, 0, -0.55));
  g.add(bx(0.6, 0.35, 0.06, '#1aa040', -0.25, 1.35, -0.55));
  const man = bx(0.08, 0.2, 0.07, '#f2f2f2', -0.28, 1.42, -0.52); man.rotation.z = 0.4; g.add(man);
  g.add(bx(0.12, 0.05, 0.07, '#f2f2f2', -0.12, 1.45, -0.52));
  return g;
};
registry.objectModels.cb_metro = () => {
  const g = group();
  g.add(bx(2.2, 0.05, 2.2, '#1a1a1a', 0, 0, 0));
  for (let i = 0; i < 5; i++) g.add(bx(1.6, 0.06, 0.3, '#6a6a6a', 0, -0.05 - i * 0.02, -0.6 + i * 0.3));
  for (const x of [-1.0, 1.0]) g.add(bx(0.1, 1.0, 2.1, '#8a8a8e', x, 0, 0));
  for (const x of [-1.0, 1.0]) g.add(bx(0.1, 2.6, 0.1, '#3a3a3a', x, 0, 1.0));
  g.add(bx(2.3, 0.1, 1.4, '#3a3a3a', 0, 2.6, 0.5));
  g.add(bx(0.7, 0.7, 0.08, '#f2f2f2', 0, 2.8, 1.18));
  g.add(bx(0.5, 0.5, 0.1, '#2060c0', 0, 2.9, 1.2));
  return g;
};
registry.objectModels.cb_tunnelmouth = () => {
  const g = group();
  g.add(bx(2.6, 3, 0.4, '#3a3632', 0, 0, -0.1));
  g.add(bx(1.8, 2.4, 0.2, '#050505', 0, 0, 0.05));
  for (const x of [-0.5, 0.5]) g.add(bx(0.12, 0.1, 0.6, '#5a4a3a', x, 0, 0.3));
  const lamp = ball(0.08, '#4af0c0', 0.9, 2.2, 0.2); glow(lamp.material, '#20a080'); g.add(lamp);
  return g;
};
registry.objectModels.cb_bunker = () => {
  const g = group();
  const slab = bx(3.0, 0.6, 3.0, '#8a867a'); slab.rotation.z = 0.08; g.add(slab);
  g.add(bx(2.2, 0.62, 0.35, '#0a0806', 0.2, 0, 0.1));
  g.add(rock(0.6, '#6a665a', -1.2, 0.5, -1.0)); g.add(rock(0.5, '#7a766a', 1.3, 0.4, 1.1)); g.add(rock(0.35, '#6a665a', 1.2, 0.8, -1.2));
  for (const [x, z, r] of [[-0.6, -1.2, 0.5], [0.9, 0.9, -0.4]]) { const rb = cyl(0.04, 0.04, 1.4, '#6a3a1e', x, 0.9, z, null, 4); rb.rotation.z = r; g.add(rb); }
  return g;
};
registry.objectModels.cb_debris_mark = () => {
  const g = group();
  const c = new THREE.Mesh(new THREE.CircleGeometry(1.4, 12).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.45, depthWrite: false }));
  c.position.y = 0.03; g.add(c);
  for (const s of [-1, 1]) { const x = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.18).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e02020' })); x.rotation.y = s * Math.PI / 4; x.position.y = 0.05; g.add(x); }
  const fall = rock(0.5, '#8a867a', 0, 6, 0); fall.userData.cbFall = performance.now(); g.add(fall);
  g.userData.cbAnim = now => { const t = Math.min(1, (now - fall.userData.cbFall) / 1800); fall.position.y = 6 - t * t * 5.5; fall.rotation.x = t * 3; };
  return g;
};
registry.objectModels.cb_flag = () => {
  const g = group();
  g.add(cyl(0.05, 0.06, 3.2, '#6a6a6a', 0, 1.6, 0, null, 6));
  const flag = bx(0.04, 0.7, 1.1, '#c81e2e', 0, 2.75, 0.56); g.add(flag);
  g.add(bx(0.05, 0.24, 1.1, '#f2f2f2', 0, 2.75, 0.56));
  g.add(bx(0.6, 0.2, 0.6, '#5a5a5a'));
  return g;
};

// ---------------------------------------------------------------- Johan Cruijff ArenA
registry.objectModels.cb_arena_gate = () => {
  const g = group();
  for (const x of [-1.9, 1.9]) g.add(bx(0.8, 4.2, 1.2, '#d8d8dc', x, 0, 0));
  g.add(bx(4.6, 1.0, 1.3, '#c81e2e', 0, 3.6, 0));
  g.add(bx(4.62, 0.3, 1.32, '#f2f2f2', 0, 3.95, 0));
  g.add(bx(3.0, 3.2, 0.1, '#1a1a1a', 0, 0, -0.5));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.2, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), M('#a8acb4'));
  roof.position.set(0, 4.7, -0.4); roof.scale.set(1, 0.35, 1); g.add(roof);
  for (const x of [-1.2, 0, 1.2]) g.add(ball(0.18, '#f2f2f2', x, 3.6, 0.66, null, 1, 1, 0.3));
  return g;
};
registry.objectModels.cb_board = () => {
  const g = group();
  for (const x of [-0.85, 0.85]) g.add(bx(0.12, 2.2, 0.12, '#3a3a3a', x, 0, 0));
  g.add(bx(2.0, 1.3, 0.12, '#1a2a4a', 0, 0.9, 0));
  g.add(bx(1.8, 0.2, 0.13, '#c81e2e', 0, 1.95, 0));
  for (let i = 0; i < 5; i++) { g.add(bx(1.0 - i * 0.12, 0.08, 0.13, '#f2f2f2', -0.3, 1.0 + 0.95 - i * 0.2 - 0.25, 0.01)); g.add(bx(0.2, 0.08, 0.13, '#c9a227', 0.6, 1.95 - i * 0.2 - 0.25, 0.01)); }
  return g;
};

// ---------------------------------------------------------------- agility obstacles
registry.objectModels.cb_agi = ({ kind } = {}) => {
  const g = group();
  const wood = '#7a5a34', steel = '#8a8e94';
  switch (kind) {
    case 'ladder':
      for (const x of [-0.3, 0.3]) g.add(bx(0.08, 4, 0.08, steel, x, 0, -0.3));
      for (let y = 0.3; y < 4; y += 0.35) g.add(bx(0.6, 0.05, 0.05, steel, 0, y, -0.3));
      g.add(bx(1.2, 4.5, 0.2, '#2a3a4a', 0, 0, -0.55));
      break;
    case 'beam':
      g.add(bx(0.25, 0.15, 13, steel, 0, 0.7, 6.5));
      g.add(bx(0.15, 0.7, 0.15, '#4a4e54', 0, 0, 0));
      g.add(bx(0.3, 0.3, 0.3, '#c8a020', 0, 0.85, 0));
      break;
    case 'gap':
      g.add(bx(0.9, 0.08, 0.9, '#c8a020', 0, 0.02, 0));
      for (const z of [-0.3, 0, 0.3]) g.add(bx(0.6, 0.02, 0.08, '#1a1a1a', 0, 0.1, z));
      break;
    case 'swing': {
      for (const x of [-0.9, 0.9]) g.add(bx(0.14, 3.4, 0.14, '#c81e2e', x, 0, 0));
      g.add(bx(2, 0.16, 0.16, '#c81e2e', 0, 3.4, 0));
      const seat = piv(0, 3.4, 0);
      for (const x of [-0.45, 0.45]) seat.add(bx(0.03, 2.3, 0.03, '#2a2a2a', x, -2.3, 0));
      seat.add(bx(1.1, 0.12, 0.5, '#1a1a1a', 0, -2.35, 0));
      g.add(seat);
      g.userData.cbAnim = now => { seat.rotation.x = Math.sin(now / 700) * 0.35; };
      break;
    }
    case 'wall':
      g.add(bx(1.4, 0.9, 0.5, '#8a7a6a'));
      g.add(bx(1.5, 0.1, 0.6, '#6a5a4a', 0, 0.9, 0));
      break;
    case 'rope':
      g.add(bx(0.14, 2.6, 0.14, steel, 0, 0, 0));
      { const c = bx(0.03, 0.03, 13, '#2a2a2a', 0, 0, 0); c.position.set(0, 1.5, 6.5); c.rotation.x = 0.12; g.add(c); }
      g.add(bx(0.3, 0.2, 0.3, '#c8a020', 0, 2.5, 0));
      break;
    case 'drop':
      g.add(bx(1, 0.06, 1, '#c8a020', 0, 0.02, 0));
      for (const x of [-0.45, 0.45]) g.add(bx(0.06, 1.0, 0.06, steel, x, 0, 0.45));
      g.add(bx(0.96, 0.06, 0.06, steel, 0, 1.0, 0.45));
      break;
    case 'bikerack':
      for (let i = -1; i <= 1; i++) { const loop = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 4, 10, Math.PI), M(steel)); loop.position.set(i * 0.35, 0, 0); g.add(loop); }
      for (const [x, c] of [[-0.3, '#2a2a2a'], [0.3, '#8a1c1c']]) {
        g.add(bx(0.05, 0.05, 0.75, c, x, 0.55, 0));
        for (const dz of [-0.33, 0.33]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 4, 10), M('#1a1a1a')); w.position.set(x, 0.3, dz); w.rotation.y = Math.PI / 2; g.add(w); }
      }
      break;
    case 'railing':
      g.add(bx(0.08, 0.08, 6, '#2a2a2a', 0, 0.9, 3));
      for (let z = 0; z <= 6; z += 1.5) g.add(bx(0.06, 0.9, 0.06, '#2a2a2a', 0, 0, z));
      break;
    case 'boat':
      g.add(bx(1.8, 0.5, 7.5, '#2a4a6a', 0, -0.2, 3.5));
      g.add(bx(1.5, 1.0, 5.4, '#d8c8a0', 0, 0.3, 3.5));
      g.add(bx(1.6, 0.08, 5.5, '#4a3a2a', 0, 1.3, 3.5));
      for (const z of [1.5, 3, 4.5, 6]) g.add(bx(1.52, 0.4, 0.5, '#5a8ab0', 0, 0.7, z));
      g.add(cyl(0.18, 0.18, 0.3, '#c83a2a', 0.3, 1.5, 1.8, null, 6));
      for (let i = 0; i < 3; i++) g.add(cyl(0.12, 0.14, 0.25, ['#d82020', '#f2c020', '#2a8a3a'][i], -0.4 + i * 0.4, 1.46, 5.5, null, 6));
      break;
    case 'fence':
      for (let x = -1; x <= 1; x++) if (x) g.add(bx(0.08, 1.3, 0.08, '#2a3a2a', x * 0.5, 0, 0));
      g.add(bx(1.2, 0.06, 0.04, '#2a3a2a', 0, 1.2, 0)); g.add(bx(1.2, 0.06, 0.04, '#2a3a2a', 0, 0.3, 0));
      { const bent = bx(0.08, 1.2, 0.08, '#2a3a2a', 0, 0, 0.15); bent.rotation.x = 0.5; g.add(bent); }
      break;
    case 'stones':
      for (let i = 0; i < 4; i++) g.add(cyl(0.35, 0.4, 0.2, '#8a8478', 0, 0.1, i * 1.8 + 0.4, null, 6));
      break;
    case 'pipe': {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.5, 10, 1, true).rotateZ(Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#6a6e64', flatShading: true, side: THREE.DoubleSide }));
      p.position.set(0, 0.45, 1.2); p.rotation.y = Math.PI / 2; g.add(p);
      g.add(bx(0.95, 0.95, 0.05, '#0a0a0a', 0, 0, 0.02));
      break;
    }
    case 'crawl':
      g.add(rock(0.6, '#5a564c', -0.7, 0.4, 0)); g.add(rock(0.6, '#5a564c', 0.7, 0.4, 0)); g.add(rock(0.5, '#6a665a', 0, 1.0, 0));
      g.add(bx(0.7, 0.6, 0.1, '#050505', 0, 0, 0.35));
      break;
    default: g.add(bx(0.8, 0.8, 0.8, '#8a7a5a'));
  }
  return g;
};

// ---------------------------------------------------------------- market stalls
const GOODS = {
  stroopwafel: (g) => { for (let i = 0; i < 6; i++) g.add(cyl(0.14, 0.14, 0.04, '#c8902e', -0.6 + (i % 3) * 0.6, 0.96 + Math.floor(i / 3) * 0.05, -0.1 + Math.floor(i / 3) * 0.2, null, 8)); },
  cheese: (g) => { for (let i = 0; i < 4; i++) { g.add(cyl(0.2, 0.2, 0.14, '#f2c230', -0.6 + i * 0.4, 1.0, 0, null, 8)); g.add(cyl(0.21, 0.21, 0.03, '#d82020', -0.6 + i * 0.4, 1.08, 0, null, 8)); } },
  fabric: (g) => { ['#d82060', '#2060d8', '#20a040', '#f2c020'].forEach((c, i) => { const r = cyl(0.1, 0.1, 0.7, c, -0.55 + i * 0.36, 1.02, 0, null, 6); r.rotation.x = Math.PI / 2; g.add(r); }); },
  fish: (g) => { g.add(bx(1.6, 0.06, 0.6, '#e8f2f8', 0, 0.94, 0)); for (let i = 0; i < 5; i++) { const f = ball(0.08, i % 2 ? '#8aa0b0' : '#c88a7a', -0.6 + i * 0.3, 1.0, 0, null, 1, 0.5, 2.4); f.rotation.y = 0.3; g.add(f); } },
  gem: (g) => { g.add(bx(1.6, 0.25, 0.6, '#3a2a4a', 0, 0.92, 0)); ['#2a4ad8', '#20b050', '#d82020', '#f2f2f2'].forEach((c, i) => g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.08), M(c)).translateX(-0.5 + i * 0.33).translateY(1.25))); },
  empty: () => {},
};
const AWNING = { stroopwafel: '#c8642a', cheese: '#f2c230', fabric: '#8a2a8a', fish: '#2a6ab0', gem: '#4a2a6a', empty: '#8a8a8a' };
registry.objectModels.cb_stall = ({ goods = 'empty' } = {}) => {
  const g = group();
  g.add(bx(1.9, 0.9, 0.75, '#6a4a2a', 0, 0, 0));
  g.add(bx(1.95, 0.05, 0.8, '#8a6a40', 0, 0.9, 0));
  for (const x of [-0.9, 0.9]) for (const z of [-0.35, 0.35]) g.add(bx(0.07, 2.1, 0.07, '#5a3a1e', x, 0, z));
  const col = AWNING[goods] || AWNING.empty;
  for (let i = 0; i < 4; i++) { const s = bx(0.5, 0.06, 1.1, i % 2 ? '#f2f2f2' : col, -0.75 + i * 0.5, 2.1, 0.1); s.rotation.x = 0.2; g.add(s); }
  (GOODS[goods] || GOODS.empty)(g);
  return g;
};

// ---------------------------------------------------------------- farm
registry.objectModels.cb_hay = () => {
  const g = group();
  g.add(cyl(0.5, 0.5, 0.9, '#d8b84a', 0, 0.5, 0, null, 10).rotateZ(Math.PI / 2));
  g.add(cyl(0.51, 0.51, 0.06, '#a8882a', 0.2, 0.5, 0, null, 10).rotateZ(Math.PI / 2));
  return g;
};
registry.objectModels.cb_trough = () => {
  const g = group();
  g.add(bx(1.8, 0.5, 0.6, '#6a5a4a'));
  g.add(bx(1.6, 0.05, 0.45, '#3a6a9a', 0, 0.42, 0));
  return g;
};
