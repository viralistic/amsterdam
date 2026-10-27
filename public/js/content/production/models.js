// Object models for the production pack: fires, ranges, furnace, anvil, crafting stations, altars and NEMO machines.
// Flat-shaded low-poly, built facing +z, standing on y = 0, centred on the tile.
import * as THREE from 'three';
import { registry } from '../../registry.js';

// fresh materials per model: the renderer disposes them when an object is removed
const mat = (color, extra) => extra?.basic
  ? new THREE.MeshBasicMaterial({ color, transparent: !!extra.opacity, opacity: extra.opacity ?? 1 })
  : new THREE.MeshLambertMaterial({ color, flatShading: true, transparent: !!extra?.opacity, opacity: extra?.opacity ?? 1 });
const mesh = (geo, color, x = 0, y = 0, z = 0, extra) => { const m = new THREE.Mesh(geo, mat(color, extra)); m.position.set(x, y, z); return m; };
const box = (w, h, d, color, x = 0, y = 0, z = 0, extra) => mesh(new THREE.BoxGeometry(w, h, d), color, x, y + h / 2, z, extra);
const cyl = (rt, rb, h, color, x = 0, y = 0, z = 0, sides = 8, extra) => mesh(new THREE.CylinderGeometry(rt, rb, h, sides), color, x, y + h / 2, z, extra);
const glow = (color, opacity) => ({ basic: true, opacity });

function fire() {
  const g = new THREE.Group();
  for (const [a, c] of [[0.4, '#5a3a1e'], [-0.5, '#6a4626'], [1.4, '#4e321a']]) {
    const log = cyl(0.07, 0.08, 0.75, c, 0, 0, 0, 6);
    log.rotation.z = Math.PI / 2; log.rotation.y = a; log.position.y = 0.08;
    g.add(log);
  }
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(box(0.12, 0.08, 0.12, '#6a6a6a', Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42)); }
  const flames = [];
  for (const [x, z, h, r, c] of [[0, 0, 0.75, 0.22, '#ff7a1a'], [0.1, 0.06, 0.5, 0.15, '#ffb030'], [-0.1, -0.05, 0.55, 0.14, '#ff9a20'], [0, 0, 0.32, 0.1, '#fff080']]) {
    const f = mesh(new THREE.ConeGeometry(r, h, 5).translate(0, h / 2, 0), c, x, 0.1, z, glow(c));
    f.userData.h = h; f.userData.ph = Math.random() * 6;
    flames.push(f); g.add(f);
  }
  g.userData.flames = flames;
  return g;
}

function range({ stall } = {}) {
  const g = new THREE.Group();
  g.add(box(1, 0.85, 0.8, '#3a3a40'));
  g.add(box(1.02, 0.06, 0.82, '#1e1e22', 0, 0.85));
  for (const x of [-0.25, 0.25]) g.add(cyl(0.14, 0.14, 0.03, '#5a5a62', x, 0.91, -0.05, 10));
  g.add(box(0.6, 0.35, 0.03, '#2a2a2e', 0, 0.2, 0.41));
  g.add(box(0.5, 0.06, 0.02, '#ff7a1a', 0, 0.3, 0.425, glow('#ff7a1a')));
  g.add(box(0.06, 0.04, 0.06, '#c8c8d0', 0.35, 0.62, 0.42));
  g.add(cyl(0.07, 0.07, 1.1, '#2a2a2e', 0.3, 0.88, -0.3, 6));
  if (stall) {
    for (const [x, z] of [[-0.75, 0.6], [0.75, 0.6], [-0.75, -0.6], [0.75, -0.6]]) g.add(cyl(0.035, 0.035, 2.2, '#c8c8c8', x, 0, z, 5));
    for (let i = 0; i < 6; i++) g.add(box(0.27, 0.06, 1.4, i % 2 ? '#f2f2f2' : '#d82828', -0.675 + i * 0.27, 2.2, 0));
    g.add(box(1.6, 0.12, 0.06, '#d82828', 0, 2.08, 0.72));
  }
  return g;
}

function fryer() {
  const g = new THREE.Group();
  g.add(box(1.2, 0.9, 0.8, '#b8bcc4'));
  g.add(box(1.22, 0.05, 0.82, '#8a8e96', 0, 0.9));
  for (const x of [-0.28, 0.28]) {
    g.add(box(0.42, 0.04, 0.5, '#e8b030', x, 0.9, 0, glow('#e8b030')));
    g.add(box(0.32, 0.18, 0.3, '#6a6a72', x, 0.93, 0.05));
    g.add(box(0.04, 0.04, 0.4, '#2a2a2a', x, 1.05, 0.35));
  }
  g.add(box(1.2, 0.2, 0.04, '#d82020', 0, 0.62, 0.41));
  g.add(box(1.2, 0.06, 0.04, '#f2d020', 0, 0.56, 0.41));
  g.add(box(1.3, 0.5, 0.06, '#d82020', 0, 1.7, -0.38));
  g.add(box(1.1, 0.12, 0.07, '#f2d020', 0, 1.88, -0.38));
  for (const x of [-0.6, 0.6]) g.add(cyl(0.03, 0.03, 1.9, '#8a8e96', x, 0, -0.38, 5));
  return g;
}

function furnace() {
  const g = new THREE.Group();
  g.add(box(1.9, 1.5, 1.8, '#8a4a36'));
  for (let y = 0.25; y < 1.5; y += 0.25) g.add(box(1.92, 0.03, 1.82, '#6a3424', 0, y));
  g.add(box(1.5, 0.15, 1.4, '#5a5048', 0, 1.5));
  g.add(cyl(0.3, 0.38, 1.6, '#6a3424', 0.4, 1.65, -0.4, 6));
  g.add(box(0.8, 0.7, 0.05, '#1a0e08', 0, 0.2, 0.9));
  g.add(box(0.65, 0.5, 0.06, '#ff6a10', 0, 0.28, 0.9, glow('#ff6a10')));
  g.add(box(0.4, 0.25, 0.07, '#ffd040', 0, 0.36, 0.9, glow('#ffd040')));
  g.add(box(1, 0.12, 0.3, '#5a5048', 0, 0.08, 1.05));
  return g;
}

function anvil() {
  const g = new THREE.Group();
  g.add(cyl(0.3, 0.34, 0.45, '#6a4a2a', 0, 0, 0, 8));
  g.add(box(0.3, 0.12, 0.22, '#2e2e34', 0, 0.45));
  g.add(box(0.18, 0.15, 0.16, '#3a3a40', 0, 0.57));
  g.add(box(0.62, 0.14, 0.26, '#46464e', 0, 0.72));
  const horn = mesh(new THREE.ConeGeometry(0.11, 0.32, 6).rotateZ(-Math.PI / 2), '#46464e', 0.46, 0.8, 0);
  g.add(horn);
  g.add(box(0.5, 0.02, 0.2, '#6e6e78', 0, 0.86));
  return g;
}

function spinningWheel({ electro } = {}) {
  const g = new THREE.Group();
  const wood = electro ? '#3a5a8a' : '#8a5a2c';
  g.add(box(1.0, 0.08, 0.3, wood, 0, 0.35));
  for (const [x, z] of [[-0.4, -0.12], [-0.4, 0.12], [0.4, 0], [0.1, 0.12]]) g.add(cyl(0.03, 0.03, 0.4, wood, x, 0, z, 5));
  for (const z of [-0.08, 0.08]) g.add(box(0.05, 0.75, 0.05, wood, 0.15, 0.4, z));
  const wheel = new THREE.Group();
  wheel.add(mesh(new THREE.TorusGeometry(0.38, 0.035, 5, 14), electro ? '#c8c8d0' : '#6a4422'));
  for (let i = 0; i < 6; i++) { const s = box(0.025, 0.74, 0.025, electro ? '#c8c8d0' : '#6a4422', 0, -0.37, 0); s.rotation.z = i * Math.PI / 6; wheel.add(s); }
  wheel.position.set(0.15, 1.05, 0); wheel.rotation.y = Math.PI / 2;
  g.add(wheel);
  g.userData.spin = wheel;
  g.add(cyl(0.05, 0.05, 0.25, '#e8e0c8', -0.35, 0.43, 0, 6));
  if (electro) {
    g.add(box(0.35, 0.3, 0.3, '#2a2a2e', -0.3, 0.43, 0));
    g.add(box(0.08, 0.08, 0.02, '#40ff60', -0.3, 0.6, 0.16, glow('#40ff60')));
    g.add(box(0.08, 0.08, 0.02, '#ff4040', -0.2, 0.6, 0.16, glow('#ff4040')));
  }
  return g;
}

function potteryWheel() {
  const g = new THREE.Group();
  g.add(box(0.9, 0.55, 0.7, '#7a5a3a'));
  g.add(cyl(0.3, 0.3, 0.06, '#5a5a5a', 0, 0.55, 0, 12));
  g.add(cyl(0.12, 0.16, 0.18, '#a87a5a', 0, 0.61, 0, 8));
  g.add(box(0.9, 0.04, 0.12, '#5a3e22', 0, 0.12, 0.42));
  return g;
}

function kiln({ plasma } = {}) {
  const g = new THREE.Group();
  g.add(cyl(0.65, 0.7, 0.4, plasma ? '#3a3a4a' : '#9a5a3a', 0, 0, 0, 10));
  g.add(mesh(new THREE.SphereGeometry(0.65, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), plasma ? '#4a4a5a' : '#a8664a', 0, 0.4, 0));
  g.add(box(0.5, 0.5, 0.08, '#2a1a10', 0, 0.12, 0.62));
  g.add(box(0.36, 0.3, 0.09, plasma ? '#c060ff' : '#ff7a1a', 0, 0.2, 0.62, glow(plasma ? '#c060ff' : '#ff7a1a')));
  g.add(cyl(0.1, 0.12, 0.6, plasma ? '#2a2a3a' : '#7a4a30', 0.25, 0.9, -0.2, 6));
  if (plasma) {
    const orb = mesh(new THREE.SphereGeometry(0.2, 10, 8), '#d080ff', 0, 1.2, 0, glow('#d080ff', 0.85));
    g.add(orb); g.add(cyl(0.05, 0.08, 0.2, '#8a8a9a', 0, 1.0, 0, 6));
    g.userData.orb = orb;
  }
  return g;
}

function sandpit() {
  const g = new THREE.Group();
  g.add(box(1.9, 0.12, 1.9, '#e8d090'));
  for (const [w, d, x, z] of [[2, 0.1, 0, 0.95], [2, 0.1, 0, -0.95], [0.1, 2, 0.95, 0], [0.1, 2, -0.95, 0]]) g.add(box(w, 0.22, d, '#8a5a2c', x, 0, z));
  g.add(mesh(new THREE.SphereGeometry(0.35, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), '#e0c47a', -0.4, 0.1, -0.3));
  g.add(cyl(0.025, 0.025, 1.9, '#e8e8e8', 0.55, 0, 0.5, 5));
  const umb = mesh(new THREE.ConeGeometry(0.85, 0.35, 8), '#ff7a00', 0.55, 2.05, 0.5);
  g.add(umb);
  const shovel = box(0.06, 0.04, 0.5, '#3a7ad8', 0.2, 0.14, -0.4); shovel.rotation.y = 0.6; g.add(shovel);
  return g;
}

function fountain() {
  const g = new THREE.Group();
  g.add(cyl(0.95, 1.0, 0.45, '#9a9a92', 0, 0, 0, 12));
  g.add(cyl(0.82, 0.82, 0.05, '#3a7ab8', 0, 0.38, 0, 12, { opacity: 0.85 }));
  g.add(cyl(0.12, 0.16, 1.0, '#8a8a82', 0, 0.4, 0, 8));
  g.add(cyl(0.38, 0.22, 0.16, '#9a9a92', 0, 1.3, 0, 10));
  g.add(cyl(0.3, 0.3, 0.04, '#5a9ad8', 0, 1.42, 0, 10, { opacity: 0.85 }));
  const jet = mesh(new THREE.ConeGeometry(0.06, 0.4, 6).translate(0, 0.2, 0), '#bfe4ff', 0, 1.44, 0, glow('#bfe4ff', 0.7));
  g.add(jet);
  g.userData.jet = jet;
  return g;
}

function sink() {
  const g = new THREE.Group();
  g.add(box(0.9, 0.8, 0.6, '#d8d8d0'));
  g.add(box(0.6, 0.06, 0.4, '#5a8ab8', 0, 0.76, 0));
  g.add(box(0.06, 0.3, 0.06, '#b0b0b8', 0, 0.8, -0.22));
  g.add(box(0.06, 0.06, 0.2, '#b0b0b8', 0, 1.07, -0.13));
  return g;
}

function tanningRack() {
  const g = new THREE.Group();
  for (const x of [-0.6, 0.6]) g.add(box(0.08, 1.7, 0.08, '#6a4a2a', x, 0, 0));
  g.add(box(1.4, 0.08, 0.08, '#6a4a2a', 0, 1.6, 0));
  g.add(box(1.4, 0.08, 0.08, '#6a4a2a', 0, 0.3, 0));
  g.add(box(1.0, 1.1, 0.03, '#8a5a34', 0, 0.42, 0));
  g.add(box(0.5, 0.4, 0.035, '#f2f2f2', -0.15, 0.9, 0));
  g.add(box(0.3, 0.3, 0.035, '#2a2a2a', 0.25, 0.6, 0));
  return g;
}

function altar({ royal } = {}) {
  const g = new THREE.Group();
  g.add(box(1.8, 0.2, 0.9, '#9a948a'));
  g.add(box(1.6, 0.85, 0.75, royal ? '#e8e0d0' : '#c8c0b0', 0, 0.2));
  g.add(box(1.7, 0.08, 0.85, royal ? '#d8b040' : '#a8a090', 0, 1.05));
  g.add(box(1.72, 0.04, 0.6, royal ? '#a8141c' : '#f2f2f2', 0, 1.13));
  g.add(box(0.5, 0.6, 0.02, royal ? '#a8141c' : '#f2f2f2', 0, 0.5, 0.39));
  if (royal) g.add(box(0.2, 0.2, 0.025, '#f2c230', 0, 0.75, 0.4));
  for (const x of [-0.65, 0.65]) {
    g.add(cyl(0.05, 0.07, 0.12, '#d8b040', x, 1.13, 0, 6));
    g.add(cyl(0.03, 0.03, 0.28, '#f4f0e0', x, 1.25, 0, 6));
    g.add(mesh(new THREE.ConeGeometry(0.03, 0.08, 4), '#ffd040', x, 1.57, 0, glow('#ffd040')));
  }
  if (royal) {
    g.add(cyl(0.12, 0.14, 0.1, '#f2c230', 0, 1.15, 0, 8));
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.add(mesh(new THREE.ConeGeometry(0.025, 0.08, 4), '#f2c230', Math.sin(a) * 0.12, 1.29, Math.cos(a) * 0.12)); }
  } else {
    g.add(box(0.05, 0.35, 0.05, '#d8b040', 0, 1.15, -0.1));
    g.add(box(0.2, 0.05, 0.05, '#d8b040', 0, 1.38, -0.1));
  }
  return g;
}

function pew() {
  const g = new THREE.Group();
  g.add(box(3.0, 0.08, 0.45, '#6a4422', 0, 0.42));
  g.add(box(3.0, 0.55, 0.06, '#5a3a1c', 0, 0.5, 0.22));
  for (const x of [-1.45, 1.45]) g.add(box(0.08, 1.0, 0.5, '#4e3018', x, 0, 0));
  return g;
}

function wondermachine() {
  const g = new THREE.Group();
  g.add(box(1.8, 1.4, 1.4, '#2a8a5a'));
  g.add(box(1.82, 0.08, 1.42, '#1a5a3a', 0, 0.7));
  g.add(box(1.0, 0.5, 0.05, '#101820', 0, 0.75, 0.71));
  const lights = [];
  ['#ff4040', '#40ff60', '#ffd040', '#40a0ff', '#ff60e0'].forEach((c, i) => { const l = box(0.1, 0.1, 0.04, c, -0.4 + i * 0.2, 0.9, 0.735, glow(c)); lights.push(l); g.add(l); });
  g.userData.lights = lights;
  g.add(mesh(new THREE.ConeGeometry(0.25, 0.4, 8).rotateX(Math.PI), '#c8c8d0', 0.5, 1.75, 0.3));
  const gear = mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 8).rotateZ(Math.PI / 2), '#c9a227', 0.93, 0.9, 0);
  g.add(gear); g.userData.gear = gear;
  for (const x of [-0.5, -0.2]) { const t = cyl(0.06, 0.06, 0.7, '#9ad8ff', x, 1.4, -0.3, 6, { opacity: 0.7 }); g.add(t); }
  g.add(box(0.5, 0.15, 0.3, '#3a3a3a', -0.35, 0.15, 0.75));
  return g;
}

function workbench() {
  const g = new THREE.Group();
  g.add(box(1.9, 0.08, 0.8, '#8a6a40', 0, 0.82));
  for (const [x, z] of [[-0.85, -0.32], [0.85, -0.32], [-0.85, 0.32], [0.85, 0.32]]) g.add(box(0.08, 0.82, 0.08, '#5a4228', x, 0, z));
  g.add(box(0.4, 0.25, 0.3, '#2a2a2e', -0.5, 0.9, 0));
  g.add(box(0.3, 0.2, 0.02, '#40c0ff', -0.5, 0.95, 0.16, glow('#40c0ff')));
  g.add(box(0.25, 0.3, 0.25, '#d8d8d8', 0.3, 0.9, 0));
  g.add(mesh(new THREE.SphereGeometry(0.08, 6, 4), '#ff4040', 0.3, 1.28, 0));
  g.add(box(0.5, 0.03, 0.2, '#2a8a3a', 0.6, 0.9, 0.15));
  return g;
}

Object.assign(registry.objectModels, {
  prod_fire: fire, prod_range: range, prod_fryer: fryer, prod_furnace: furnace, prod_anvil: anvil,
  prod_spinning_wheel: spinningWheel, prod_pottery_wheel: potteryWheel, prod_kiln: kiln, prod_sandpit: sandpit,
  prod_fountain: fountain, prod_sink: sink, prod_tanning_rack: tanningRack, prod_altar: altar, prod_pew: pew,
  prod_wondermachine: wondermachine, prod_workbench: workbench,
});

// Flickering flames, a turning electro-spinner, blinking Wondermachine lights.
registry.frameHooks.push((now, ctx) => {
  const r = ctx.renderer;
  if (!r?.objs) return;
  const t = now / 1000;
  for (const o of r.objs.values()) {
    const u = o.root?.userData;
    if (!u) continue;
    if (u.flames) for (const f of u.flames) { const s = 0.8 + 0.25 * Math.sin(t * 9 + f.userData.ph) + 0.1 * Math.sin(t * 23 + f.userData.ph * 2); f.scale.set(1, s, 1); f.rotation.y = t * 1.5 + f.userData.ph; }
    if (u.spin && o.data?.type === 'electro_spinner') u.spin.rotation.z = t * 6;
    if (u.orb) u.orb.scale.setScalar(0.9 + 0.12 * Math.sin(t * 5));
    if (u.jet) u.jet.scale.y = 0.85 + 0.2 * Math.sin(t * 7);
    if (u.lights) u.lights.forEach((l, i) => { l.visible = Math.sin(t * 3 + i * 1.7) > -0.3; });
    if (u.gear) u.gear.rotation.x = t;
  }
});
