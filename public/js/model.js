// Blocky low-poly characters in the spirit of 2000s RuneScape models.
import * as THREE from 'three';
import { SKIN, HAIR, CLOTH } from '/shared/look.js';
import { ITEMS } from '/shared/items.js';

const box = (w, h, d, color, mats) => {
  const m = new THREE.MeshLambertMaterial({ color, flatShading: true });
  mats.push(m);
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
};

const limb = (w, h, d, color, mats, x, y) => {
  const pivot = new THREE.Group();
  const mesh = box(w, h, d, color, mats);
  mesh.position.y = -h / 2;
  pivot.add(mesh);
  pivot.position.set(x, y, 0);
  return pivot;
};

export function buildModel(ent) {
  const group = new THREE.Group();
  const mats = [];
  const parts = {};
  if (ent.m === 'duck') {
    const body = box(0.45, 0.3, 0.6, '#e8d24a', mats); body.position.y = 0.25;
    const head = box(0.25, 0.25, 0.25, '#2f6b2a', mats); head.position.set(0, 0.5, 0.25);
    const beak = box(0.12, 0.06, 0.15, '#ff8c1a', mats); beak.position.set(0, 0.47, 0.42);
    group.add(body, head, beak);
    parts.body = body;
    return finish(group, mats, parts, 0.7, ent);
  }
  const l = ent.l || {};
  const eq = ent.eq || {};
  const skin = SKIN[l.skin] || SKIN[0];
  const top = eq.body ? ITEMS[eq.body].color : CLOTH[l.top] || CLOTH[0];
  const legs = CLOTH[l.legs] || CLOTH[1];
  const hair = HAIR[l.hair] || HAIR[0];
  const feet = eq.feet ? ITEMS[eq.feet].color : '#2a2018';

  parts.legL = limb(0.2, 0.8, 0.22, legs, mats, -0.13, 0.85);
  parts.legR = limb(0.2, 0.8, 0.22, legs, mats, 0.13, 0.85);
  for (const leg of [parts.legL, parts.legR]) { const f = box(0.22, 0.1, 0.32, feet, mats); f.position.set(0, -0.8, 0.05); leg.add(f); }
  const torso = box(0.52, 0.62, 0.28, top, mats); torso.position.y = 1.15;
  if (l.g) { const skirt = box(0.56, 0.25, 0.32, top, mats); skirt.position.y = 0.88; group.add(skirt); }
  parts.armL = limb(0.15, 0.62, 0.17, top, mats, -0.34, 1.44);
  parts.armR = limb(0.15, 0.62, 0.17, top, mats, 0.34, 1.44);
  for (const arm of [parts.armL, parts.armR]) { const h = box(0.13, 0.12, 0.13, skin, mats); h.position.y = -0.66; arm.add(h); }
  const head = box(0.32, 0.34, 0.32, skin, mats); head.position.y = 1.64;
  const hairTop = box(0.35, 0.1, 0.35, hair, mats); hairTop.position.y = 1.83;
  const hairBack = box(0.35, l.g ? 0.5 : 0.22, 0.08, hair, mats); hairBack.position.set(0, l.g ? 1.58 : 1.7, -0.15);
  const eyeMat = [];
  const eyeL = box(0.05, 0.05, 0.02, '#111', eyeMat); eyeL.position.set(-0.07, 1.67, 0.165);
  const eyeR = box(0.05, 0.05, 0.02, '#111', eyeMat); eyeR.position.set(0.07, 1.67, 0.165);
  mats.push(...eyeMat);
  group.add(parts.legL, parts.legR, torso, parts.armL, parts.armR, head, hairTop, hairBack, eyeL, eyeR);

  if (eq.weapon) {
    const w = ITEMS[eq.weapon];
    const len = eq.weapon.includes('dagger') ? 0.45 : 0.85;
    const blade = box(0.05, len, 0.1, w.metal, mats); blade.position.set(0, -0.72 - len / 2, 0.08);
    const hilt = box(0.18, 0.05, 0.08, '#3a2a1a', mats); hilt.position.set(0, -0.72, 0.08);
    parts.armR.add(blade, hilt);
  }
  if (eq.shield) { const s = box(0.06, 0.55, 0.45, '#7a5530', mats); s.position.set(-0.1, -0.45, 0.05); parts.armL.add(s); }
  if (eq.cape) { const c = box(0.5, 0.95, 0.04, ITEMS[eq.cape].color, mats); c.position.set(0, 1.0, -0.17); group.add(c); }
  if (eq.head) {
    const it = ITEMS[eq.head];
    if (eq.head === 'kings_crown') {
      const crown = box(0.36, 0.12, 0.36, it.color, mats); crown.position.y = 1.92;
      group.add(crown);
      for (const [x, z] of [[-0.14, 0.14], [0.14, 0.14], [-0.14, -0.14], [0.14, -0.14]]) { const sp = box(0.06, 0.1, 0.06, it.color, mats); sp.position.set(x, 2.02, z); group.add(sp); }
    } else {
      const helm = box(0.38, 0.4, 0.38, it.metal, mats); helm.position.y = 1.68;
      const visor = box(0.2, 0.04, 0.02, '#111', mats); visor.position.set(0, 1.67, 0.2);
      group.add(helm, visor);
    }
  }
  return finish(group, mats, parts, 2.0, ent);
}

function finish(group, mats, parts, height, ent) {
  if (ent.g) {
    for (const m of mats) {
      m.transparent = true; m.opacity = 0.42; m.depthWrite = false;
      m.color.lerp(new THREE.Color('#cfe8ff'), 0.45);
      m.emissive = new THREE.Color('#1d3b5c');
    }
  }
  // invisible pick box
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.9, height, 0.9), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = height / 2;
  group.add(hit);
  return { group, parts, mats, hit, height };
}

export function disposeModel(model) {
  model.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
}

// 2D front-view preview for the character designer.
export function drawPreview(canvas, l) {
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  g.clearRect(0, 0, W, H);
  const s = H / 2.1;
  const cx = W / 2, base = H - 8;
  const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(cx + x * s, base - (y + h) * s, w * s, h * s); g.strokeStyle = 'rgba(0,0,0,.35)'; g.strokeRect(cx + x * s, base - (y + h) * s, w * s, h * s); };
  const skin = SKIN[l.skin], top = CLOTH[l.top], legs = CLOTH[l.legs], hair = HAIR[l.hair];
  rect(-0.23, 0.05, 0.2, 0.8, legs); rect(0.03, 0.05, 0.2, 0.8, legs);
  rect(-0.24, 0, 0.22, 0.1, '#2a2018'); rect(0.02, 0, 0.22, 0.1, '#2a2018');
  if (l.g) rect(-0.28, 0.63, 0.56, 0.25, top);
  rect(-0.26, 0.84, 0.52, 0.62, top);
  rect(-0.42, 0.82, 0.15, 0.62, top); rect(0.27, 0.82, 0.15, 0.62, top);
  rect(-0.41, 0.72, 0.13, 0.12, skin); rect(0.28, 0.72, 0.13, 0.12, skin);
  if (l.g) rect(-0.19, 1.2, 0.38, 0.4, hair);
  rect(-0.16, 1.47, 0.32, 0.34, skin);
  rect(-0.175, 1.78, 0.35, 0.1, hair);
  rect(-0.09, 1.62, 0.05, 0.05, '#111'); rect(0.04, 1.62, 0.05, 0.05, '#111');
}
