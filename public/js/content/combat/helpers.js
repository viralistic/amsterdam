// Small geometry helpers for the combat pack's low-poly models (flat shaded, no textures).
import * as THREE from 'three';

export const M = (color, mats, extra) => {
  const m = new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
  mats?.push(m);
  return m;
};
const at = (mesh, x = 0, y = 0, z = 0) => { mesh.position.set(x, y, z); return mesh; };
export const box = (w, h, d, color, x, y, z, mats) => at(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(color, mats)), x, y, z);
export const cyl = (rt, rb, h, color, x, y, z, mats, n = 7) => at(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), M(color, mats)), x, y, z);
export const cone = (r, h, color, x, y, z, mats, n = 5) => at(new THREE.Mesh(new THREE.ConeGeometry(r, h, n), M(color, mats)), x, y, z);
export const ball = (r, color, x, y, z, mats, sx = 1, sy = 1, sz = 1, w = 6, h = 4) => at(new THREE.Mesh(new THREE.SphereGeometry(r, w, h).scale(sx, sy, sz), M(color, mats)), x, y, z);
export const rock = (r, color, x, y, z, mats, d = 0) => at(new THREE.Mesh(new THREE.DodecahedronGeometry(r, d), M(color, mats)), x, y, z);
export const group = (...kids) => { const g = new THREE.Group(); if (kids.length) g.add(...kids); return g; };
export const piv = (x, y, z, ...kids) => { const g = group(...kids); g.position.set(x, y, z); return g; };
// hanging limb: top at the pivot, hanging down along -y
export const limb = (r0, r1, len, color, mats, n = 6) => new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, n).translate(0, -len / 2, 0), M(color, mats));
export const ghostly = (mats, opacity = 0.6, emissive = '#1a4a40') => { for (const m of mats) { m.transparent = true; m.opacity = opacity; m.depthWrite = false; m.emissive = new THREE.Color(emissive); } };
export const glow = (m, color) => { m.emissive = new THREE.Color(color); return m; };

// Biped with hips, knees and arms, plus a walk/attack animation. Returns { body, head, arms, legs }.
// o: { hip, legLen, legR, legColor, footColor, torsoW, torsoH, torsoD, color, armLen, armR, armColor, handR, handColor, headR, headColor, shoulderW, stoop }
export function biped(g, mats, parts, o) {
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const thigh = limb(o.legR, o.legR * 0.85, o.legLen * 0.5, o.legColor || o.color, mats);
    const shin = limb(o.legR * 0.85, o.legR * 0.7, o.legLen * 0.5, o.legColor || o.color, mats);
    const foot = box(o.legR * 2.2, o.legR * 0.9, o.legR * 3, o.footColor || o.legColor || o.color, 0, -o.legLen * 0.5 + o.legR * 0.3, o.legR * 0.6, mats);
    const knee = piv(0, -o.legLen * 0.5, 0, shin, foot);
    const hip = piv(s * o.torsoW * 0.28, o.hip, 0, thigh, knee);
    g.add(hip); legs.push({ hip, knee });
  }
  const body = box(o.torsoW, o.torsoH, o.torsoD, o.color, 0, o.hip + o.torsoH / 2, 0, mats);
  g.add(body);
  const sw = o.shoulderW ?? o.torsoW * 0.55;
  const sy = o.hip + o.torsoH * 0.92;
  for (const s of [-1, 1]) {
    const upper = limb(o.armR, o.armR * 0.85, o.armLen * 0.5, o.armColor || o.color, mats);
    const fore = limb(o.armR * 0.85, o.armR * 0.75, o.armLen * 0.5, o.armColor || o.color, mats);
    const hand = ball(o.handR || o.armR * 1.2, o.handColor || o.armColor || o.color, 0, -o.armLen * 0.5, 0, mats);
    const elbow = piv(0, -o.armLen * 0.5, 0, fore, hand);
    elbow.rotation.x = -0.3;
    const sh = piv(s * sw, sy, 0, upper, elbow);
    sh.rotation.z = s * 0.12;
    g.add(sh); arms.push({ sh, elbow, hand });
  }
  const head = piv(0, o.hip + o.torsoH + (o.headR || 0.2) * 0.9, (o.stoop || 0));
  if (o.headR) head.add(ball(o.headR, o.headColor || o.color, 0, 0, 0, mats, 1, 1.05, 1, 6, 4));
  g.add(head);
  parts.custom = (phase, amount, now, anim) => {
    const s = Math.sin(phase) * 0.55 * amount;
    legs[0].hip.rotation.x = -s; legs[1].hip.rotation.x = s;
    legs[0].knee.rotation.x = Math.max(0, s) * 1.0; legs[1].knee.rotation.x = Math.max(0, -s) * 1.0;
    arms[0].sh.rotation.x = s * 0.7; arms[1].sh.rotation.x = -s * 0.7;
    if (anim === 'attack' && amount < 0.5) { const t = Math.max(0, Math.sin(now / 1000 * 9)); arms[1].sh.rotation.x = -0.3 - t * 1.7; if (o.twoArm) arms[0].sh.rotation.x = -0.3 - t * 1.7; }
    head.rotation.x = Math.sin(now / 700) * 0.03 * (1 - amount);
    o.extra?.(phase, amount, now, anim);
  };
  parts.head = head;
  return { body, head, arms, legs };
}

// Floating body (wraiths, ghosts): bobs up and down and sways.
export function floater(g, parts, y0 = 0, amp = 0.12, extra) {
  const inner = group(...g.children.splice(0));
  g.add(inner);
  parts.custom = (phase, amount, now, anim) => {
    inner.position.y = y0 + Math.sin(now / 450) * amp;
    inner.rotation.z = Math.sin(now / 800) * 0.06;
    if (anim === 'attack') inner.rotation.x = -Math.max(0, Math.sin(now / 110)) * 0.25;
    else inner.rotation.x = 0;
    extra?.(phase, amount, now, anim, inner);
  };
  return inner;
}
