// Low-poly monster models for the combat pack. Each builder faces +z, stands on y=0 and returns its height.
import * as THREE from 'three';
import { registry } from '../../registry.js';
import { M, box, cyl, cone, ball, rock, piv, limb, ghostly, glow, biped, floater } from './helpers.js';


// ---------------------------------------------------------------- birds and small animals
function bird(g, m, p, { body, size, neck = 0, neckColor, head, beak = '#e0a020', legs = '#d08a4a', comb, tail, chin }) {
  const b = ball(size, body, 0, size * 1.6, 0, m, 0.95, 0.8, 1.35); g.add(b);
  const nk = piv(0, size * 2.0, size * 0.75);
  if (neck) nk.add(new THREE.Mesh(new THREE.CylinderGeometry(size * 0.22, size * 0.3, neck, 5).translate(0, neck / 2, 0), M(neckColor || body, m)));
  const hd = piv(0, neck, 0, ball(size * 0.42, head || body, 0, 0, 0, m, 0.9, 0.9, 1.15));
  hd.add(cone(size * 0.15, size * 0.45, beak, 0, -size * 0.05, size * 0.5, m, 4).rotateX(Math.PI / 2));
  if (comb) hd.add(box(size * 0.08, size * 0.3, size * 0.4, comb, 0, size * 0.42, 0, m));
  if (chin) hd.add(box(size * 0.5, size * 0.22, size * 0.4, chin, 0, -size * 0.12, size * 0.05, m));
  nk.add(hd); nk.rotation.x = 0.25; g.add(nk);
  if (tail) { const t = cone(size * 0.4, size * 0.8, tail, 0, size * 1.8, -size * 1.3, m, 4); t.rotation.x = -2.2; g.add(t); }
  const wings = [-1, 1].map(s => { const w = piv(s * size * 0.85, size * 1.95, 0, box(size * 0.12, size * 0.6, size * 1.3, body, 0, -size * 0.25, 0, m)); g.add(w); return w; });
  const lg = [-1, 1].map(s => { const l = piv(s * size * 0.35, size * 0.95, 0, limb(size * 0.07, size * 0.06, size * 0.95, legs, m, 4), box(size * 0.35, size * 0.06, size * 0.4, legs, 0, -size * 0.95, size * 0.12, m)); g.add(l); return l; });
  p.custom = (ph, amt, now, anim) => {
    lg[0].rotation.x = Math.sin(ph) * 0.5 * amt; lg[1].rotation.x = -Math.sin(ph) * 0.5 * amt;
    nk.rotation.x = 0.25 + Math.sin(ph * 2) * 0.15 * amt + (amt < 0.2 ? Math.max(0, Math.sin(now / 900)) * 0.4 : 0);
    const flap = anim === 'attack' ? Math.sin(now / 60) * 0.9 : 0;
    wings[0].rotation.z = -flap - 0.05; wings[1].rotation.z = flap + 0.05;
  };
  return size * 2 + neck + size * 0.5;
}
registry.npcModels.cb_pigeon = (g, m, p) => { const h = bird(g, m, p, { body: '#8a8f9a', size: 0.14, neck: 0.06, neckColor: '#4a7a6a', head: '#5e6470', beak: '#3a3a3a', legs: '#c86a6a', tail: '#5e6470' }); return h; };
registry.npcModels.cb_goose = (g, m, p) => bird(g, m, p, { body: '#8a7a64', size: 0.26, neck: 0.42, neckColor: '#1e1e1e', head: '#1e1e1e', beak: '#1e1e1e', legs: '#2a2a2a', tail: '#1e1e1e', chin: '#f2f2f2' });
registry.npcModels.cb_chicken = (g, m, p) => bird(g, m, p, { body: '#f2f0e8', size: 0.2, neck: 0.08, head: '#f2f0e8', beak: '#e8b020', legs: '#e8b020', comb: '#d01818', tail: '#e8e4da' });

registry.npcModels.cb_rat = (g, m, p) => {
  const body = ball(0.15, '#6a5a4c', 0, 0.16, 0, m, 1, 0.8, 1.9); g.add(body);
  const head = ball(0.09, '#6a5a4c', 0, 0.17, 0.3, m, 0.9, 0.85, 1.4); g.add(head);
  for (const s of [-1, 1]) g.add(ball(0.04, '#d8a0a0', s * 0.06, 0.25, 0.27, m, 1, 1, 0.4));
  g.add(ball(0.02, '#f0a0a0', 0, 0.16, 0.43, m));
  const tail = piv(0, 0.16, -0.27, limb(0.02, 0.008, 0.45, '#d89a9a', m, 4)); tail.rotation.x = -1.9; g.add(tail);
  p.legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => { const l = piv(sx * 0.08, 0.09, sz * 0.15, limb(0.025, 0.02, 0.09, '#5a4a3c', m, 4)); g.add(l); return l; });
  return 0.32;
};
registry.npcModels.cb_squirrel = (g, m, p) => {
  const red = '#a8521e';
  g.add(ball(0.14, red, 0, 0.26, 0, m, 0.9, 1.3, 0.9));
  g.add(ball(0.1, '#f2e2c8', 0, 0.24, 0.07, m, 0.8, 1.1, 0.7));
  const head = piv(0, 0.47, 0.04, ball(0.1, red, 0, 0, 0, m, 0.95, 0.9, 1.1));
  for (const s of [-1, 1]) head.add(cone(0.03, 0.08, red, s * 0.05, 0.1, -0.01, m, 4));
  head.add(ball(0.018, '#111', 0.045, 0.02, 0.08, m)); head.add(ball(0.018, '#111', -0.045, 0.02, 0.08, m));
  g.add(head);
  const t1 = piv(0, 0.14, -0.12, ball(0.11, '#b8622a', 0, 0.18, -0.06, m, 1, 1.9, 0.9), ball(0.12, '#b8622a', 0, 0.45, -0.02, m, 1, 1.2, 1));
  g.add(t1);
  const legs = [-1, 1].map(s => { const l = piv(s * 0.07, 0.13, 0.02, limb(0.035, 0.03, 0.13, red, m, 4)); g.add(l); return l; });
  const arms = [-1, 1].map(s => { const a = piv(s * 0.09, 0.33, 0.08, limb(0.025, 0.02, 0.1, red, m, 4)); a.rotation.x = -0.8; g.add(a); return a; });
  p.custom = (ph, amt, now, anim) => {
    legs[0].rotation.x = Math.sin(ph) * 0.6 * amt; legs[1].rotation.x = -Math.sin(ph) * 0.6 * amt;
    t1.rotation.x = Math.sin(now / 300) * 0.12;
    head.rotation.y = amt < 0.2 ? Math.sin(now / 500) * 0.5 : 0;
    arms.forEach(a => { a.rotation.x = anim === 'attack' ? -1.6 + Math.sin(now / 70) * 0.5 : -0.8; });
  };
  return 0.8;
};

// ---------------------------------------------------------------- farm animals
registry.npcModels.cb_cow = (g, m, p, T, H) => {
  H.quad(g, m, p, { len: 1.5, h: 0.75, w: 0.62, y: 0.95, color: '#f4f2ec', legR: 0.08, hoof: '#2a2a2a' });
  for (const [x, y, z, sx, sz] of [[0.3, 1.05, 0.25, 0.08, 0.5], [-0.31, 0.95, -0.3, 0.08, 0.45], [0, 1.3, -0.1, 0.4, 0.35], [0.3, 0.9, -0.45, 0.08, 0.25]]) g.add(box(sx * (x ? 1 : 1), x ? 0.35 : 0.06, sz, '#1e1e1e', x, y, z, m));
  const { head } = H.neckHead(g, m, { at: [1.05, 0.68], len: 0.25, ang: 1.15, r: 0.17, color: '#f4f2ec', head: 0.24, headColor: '#1e1e1e', snout: [0.13, 0.18, '#e8b0a8'] });
  for (const s of [-1, 1]) { const horn = cone(0.035, 0.18, '#e8e0c8', s * 0.16, 0.16, -0.05, m, 4); horn.rotation.z = -s * 1.1; head.add(horn); head.add(box(0.14, 0.05, 0.07, '#1e1e1e', s * 0.2, 0.05, -0.06, m)); }
  g.add(ball(0.13, '#e8a8a0', 0, 0.6, -0.3, m, 1, 0.7, 1));
  const tail = piv(0, 1.1, -0.75, limb(0.025, 0.02, 0.6, '#1e1e1e', m, 4)); tail.rotation.x = -0.2; g.add(tail);
  return 1.5;
};
const sheep = shorn => (g, m, p, T, H) => {
  const wool = shorn ? '#e8d0c0' : '#ece6d6';
  H.quad(g, m, p, { len: shorn ? 0.85 : 1.0, h: shorn ? 0.48 : 0.7, w: shorn ? 0.42 : 0.66, y: 0.7, color: wool, legR: 0.05, legColor: '#2a2420' });
  if (!shorn) for (const [x, y, z] of [[0.2, 0.95, 0.25], [-0.2, 0.95, 0.2], [0, 1.0, -0.15], [0.22, 0.85, -0.3], [-0.22, 0.85, -0.3], [0, 0.82, 0.4]]) g.add(ball(0.2, '#f2ecdc', x, y, z, m));
  const { head } = H.neckHead(g, m, { at: [0.85, 0.42], len: 0.12, ang: 1.1, r: 0.1, color: '#2a2420', head: 0.15, snout: [0.07, 0.12, '#2a2420'] });
  for (const s of [-1, 1]) { const e = box(0.12, 0.04, 0.06, '#2a2420', s * 0.13, 0.04, -0.02, m); e.rotation.z = s * 0.4; head.add(e); }
  if (!shorn) head.add(ball(0.09, '#f2ecdc', 0, 0.12, -0.03, m));
  return 1.05;
};
registry.npcModels.cb_sheep = sheep(false);
registry.npcModels.cb_sheep_shorn = sheep(true);

// ---------------------------------------------------------------- forest
registry.npcModels.cb_boar = (g, m, p, T, H) => {
  H.quad(g, m, p, { len: 1.05, h: 0.6, w: 0.5, y: 0.62, color: '#4a3424', legR: 0.06, legColor: '#3a2618', hoof: '#1a1410' });
  for (let i = 0; i < 6; i++) { const c = cone(0.05, 0.16, '#2a1c12', 0, 0.98 - i * 0.015, 0.35 - i * 0.14, m, 4); c.rotation.x = -0.4; g.add(c); }
  const { head } = H.neckHead(g, m, { at: [0.7, 0.45], len: 0.1, ang: 1.35, r: 0.18, color: '#4a3424', head: 0.22, snout: [0.1, 0.26, '#6a4a3a'] });
  for (const s of [-1, 1]) { const t = cone(0.03, 0.16, '#f2ead0', s * 0.08, -0.08, 0.3, m, 4); t.rotation.x = -0.6; t.rotation.z = s * 0.3; head.add(t); head.add(cone(0.05, 0.1, '#3a2618', s * 0.1, 0.17, -0.05, m, 4)); }
  head.add(ball(0.025, '#d02020', 0.09, 0.05, 0.15, m)); head.add(ball(0.025, '#d02020', -0.09, 0.05, 0.15, m));
  return 0.95;
};
registry.npcModels.cb_fox = (g, m, p, T, H) => {
  H.quad(g, m, p, { len: 0.75, h: 0.32, w: 0.26, y: 0.42, color: '#d0601a', legR: 0.035, legColor: '#2a1a12' });
  g.add(ball(0.12, '#f4ece0', 0, 0.36, 0.22, m, 0.9, 0.8, 1.2));
  const { head } = H.neckHead(g, m, { at: [0.5, 0.3], len: 0.14, ang: 0.9, r: 0.08, color: '#d0601a', head: 0.12, snout: [0.05, 0.18, '#f4ece0'] });
  for (const s of [-1, 1]) head.add(cone(0.04, 0.12, '#2a1a12', s * 0.06, 0.12, -0.02, m, 4));
  const tail = piv(0, 0.46, -0.36, ball(0.09, '#d0601a', 0, -0.2, 0, m, 1, 2.6, 1), ball(0.06, '#f4ece0', 0, -0.45, 0, m));
  tail.rotation.x = -1.1; g.add(tail);
  return 0.65;
};

// ---------------------------------------------------------------- Westergasfabriek machines
registry.npcModels.cb_automaton = (g, m, p) => {
  const rust = '#8a5a2e', brass = '#b88a3a';
  const b = biped(g, m, p, { hip: 0.85, legLen: 0.85, legR: 0.09, legColor: '#5a4a3a', footColor: '#3a3028', torsoW: 0.62, torsoH: 0.7, torsoD: 0.42, color: rust, armLen: 0.8, armR: 0.07, armColor: '#6a5a48', handColor: brass, headR: 0 });
  b.body.add(cyl(0.16, 0.16, 0.05, '#e8e0c0', 0, 0.05, 0.22, m, 10).rotateX(Math.PI / 2));
  b.body.add(box(0.02, 0.12, 0.02, '#1a1a1a', 0, 0.08, 0.25, m));
  for (const y of [-0.25, 0.28]) b.body.add(box(0.66, 0.05, 0.46, brass, 0, y, 0, m));
  const key = piv(0, 0.1, -0.24, box(0.04, 0.04, 0.16, brass, 0, 0, -0.08, m), box(0.25, 0.12, 0.03, brass, 0, 0, -0.17, m));
  b.body.add(key);
  b.head.add(box(0.32, 0.28, 0.3, '#7a5028', 0, 0.04, 0, m));
  const eyes = box(0.2, 0.05, 0.02, '#ffcc40', 0, 0.06, 0.16, m); glow(eyes.material, '#a06010'); b.head.add(eyes);
  b.head.add(cyl(0.02, 0.02, 0.2, '#5a4a3a', 0, 0.28, 0, m, 4)); b.head.add(ball(0.05, '#d04020', 0, 0.4, 0, m));
  const old = p.custom; p.custom = (ph, a, now, anim) => { old(ph, a, now, anim); key.rotation.z = now / 400; };
  return 2.0;
};
registry.npcModels.cb_wraith = (g, m, p) => {
  const c = '#8ad05a';
  g.add(cone(0.42, 1.3, c, 0, 0.75, 0, m, 7).rotateX(Math.PI));
  g.add(ball(0.36, c, 0, 1.45, 0, m, 1, 0.9, 0.9));
  g.add(ball(0.26, '#b8f08a', 0, 1.9, 0.04, m));
  for (const s of [-1, 1]) { g.add(ball(0.06, '#1a2a10', s * 0.09, 1.93, 0.22, m)); const a = piv(s * 0.36, 1.55, 0.05, cone(0.1, 0.7, c, 0, -0.35, 0, m, 5).rotateX(Math.PI)); a.rotation.z = s * 0.5; a.rotation.x = -0.5; g.add(a); }
  g.add(cone(0.12, 0.5, c, 0, 0.0, -0.1, m, 5).rotateX(Math.PI + 0.3));
  ghostly(m, 0.62, '#2a6a10');
  floater(g, p, 0.25, 0.15);
  return 2.3;
};
registry.npcModels.cb_steam_golem = (g, m, p) => {
  const iron = '#4a4e54', dark = '#2e3236';
  const b = biped(g, m, p, { hip: 0.95, legLen: 0.95, legR: 0.17, legColor: iron, footColor: dark, torsoW: 1.15, torsoH: 1.05, torsoD: 0.8, color: iron, armLen: 1.05, armR: 0.15, armColor: dark, handR: 0.22, handColor: iron, headR: 0, shoulderW: 0.72, twoArm: true });
  const furnace = box(0.5, 0.36, 0.06, '#ff7a1a', 0, -0.05, 0.42, m); glow(furnace.material, '#c03a00'); b.body.add(furnace);
  for (const x of [-0.5, 0.5]) for (const y of [-0.42, 0, 0.42]) b.body.add(ball(0.04, '#8a8e94', x, y, 0.41, m));
  b.head.add(box(0.5, 0.36, 0.45, dark, 0, 0, 0, m));
  const eye = box(0.34, 0.07, 0.02, '#ff9a2a', 0, 0.03, 0.23, m); glow(eye.material, '#a03a00'); b.head.add(eye);
  b.body.add(cyl(0.11, 0.13, 0.55, '#3a3e44', 0.32, 0.75, -0.2, m, 6));
  return 2.8;
};
registry.npcModels.cb_gashouder = (g, m, p) => {
  const green = '#3e5a4a', frame = '#6a6e72', rust = '#7a4a2a';
  const b = biped(g, m, p, { hip: 1.6, legLen: 1.6, legR: 0.3, legColor: frame, footColor: '#3a3e42', torsoW: 2.6, torsoH: 2.6, torsoD: 2.6, color: green, armLen: 2.0, armR: 0.28, armColor: frame, handR: 0.42, handColor: rust, headR: 0, shoulderW: 1.55, twoArm: true });
  const tank = cyl(1.45, 1.45, 2.6, green, 0, 0, 0, m, 12); b.body.add(tank);
  b.body.add(cyl(1.5, 1.5, 0.16, frame, 0, 1.3, 0, m, 12)); b.body.add(cyl(1.5, 1.5, 0.16, frame, 0, -0.4, 0, m, 12));
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; b.body.add(box(0.14, 2.9, 0.14, frame, Math.cos(a) * 1.52, 0.1, Math.sin(a) * 1.52, m)); }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.45, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.4, 1), M('#4a6a58', m)); dome.position.y = 1.3; b.body.add(dome);
  const core = ball(0.36, '#ffb040', 0, 0.3, 1.4, m); glow(core.material, '#c06000'); b.body.add(core);
  for (const s of [-1, 1]) { const eye = box(0.4, 0.14, 0.05, '#ffd040', s * 0.45, 0.9, 1.4, m); glow(eye.material, '#a06000'); b.body.add(eye); }
  b.body.add(cyl(0.18, 0.22, 1.2, rust, 0.8, 2.0, -0.5, m, 6)); b.body.add(cyl(0.14, 0.18, 0.9, rust, -0.7, 1.85, -0.6, m, 6));
  b.body.material.visible = false; // the riveted tank replaces the plain torso box
  return 6.0;
};

// ---------------------------------------------------------------- Wilderness creatures (fantasy)
registry.npcModels.cb_imp = (g, m, p) => {
  const red = '#a8301e';
  const b = biped(g, m, p, { hip: 0.3, legLen: 0.3, legR: 0.05, legColor: red, torsoW: 0.3, torsoH: 0.32, torsoD: 0.22, color: red, armLen: 0.32, armR: 0.04, headR: 0.15, headColor: '#b8402a' });
  for (const s of [-1, 1]) { const h = cone(0.04, 0.14, '#2a1a10', s * 0.08, 0.14, 0, m, 4); h.rotation.z = -s * 0.4; b.head.add(h); b.head.add(ball(0.025, '#ffe040', s * 0.06, 0.02, 0.13, m)); const w = piv(s * 0.14, 0.55, -0.1, box(0.02, 0.22, 0.3, '#6a1a10', 0, 0, -0.1, m)); w.rotation.y = s * 0.6; g.add(w); }
  const tail = piv(0, 0.32, -0.1, limb(0.025, 0.01, 0.35, red, m, 4)); tail.rotation.x = -2.2; g.add(tail);
  return 0.95;
};
registry.npcModels.cb_goblin = (g, m, p) => {
  const skin = '#7a8a80';
  const b = biped(g, m, p, { hip: 0.5, legLen: 0.5, legR: 0.07, legColor: '#4a3a2a', footColor: '#2a2018', torsoW: 0.42, torsoH: 0.45, torsoD: 0.3, color: '#5a4a32', armLen: 0.5, armR: 0.06, armColor: skin, headR: 0.2, headColor: skin, stoop: 0.06 });
  for (const s of [-1, 1]) { const e = cone(0.05, 0.22, skin, s * 0.2, 0.04, 0, m, 4); e.rotation.z = -s * 1.3; b.head.add(e); b.head.add(ball(0.03, '#e0d020', s * 0.08, 0.03, 0.17, m)); }
  b.head.add(cone(0.04, 0.12, skin, 0, -0.03, 0.22, m, 4).rotateX(Math.PI / 2));
  b.arms[1].hand.add(rock(0.13, '#8a8478', 0, -0.06, 0.04, m));
  return 1.35;
};
registry.npcModels.cb_jackal = (g, m, p, T, H) => {
  H.quad(g, m, p, { len: 0.85, h: 0.34, w: 0.28, y: 0.55, color: '#9a5a2a', legR: 0.04, legColor: '#6a4a32' });
  for (let i = 0; i < 4; i++) g.add(box(0.3, 0.03, 0.08, '#b07040', 0, 0.72, 0.25 - i * 0.16, m));
  const { head } = H.neckHead(g, m, { at: [0.62, 0.34], len: 0.2, ang: 0.8, r: 0.08, color: '#9a5a2a', head: 0.13, snout: [0.05, 0.22, '#6a4a32'] });
  for (const s of [-1, 1]) { head.add(cone(0.05, 0.18, '#7a4a22', s * 0.07, 0.15, -0.03, m, 4)); const e = ball(0.022, '#ff4020', s * 0.06, 0.04, 0.1, m); glow(e.material, '#a02000'); head.add(e); }
  const tail = piv(0, 0.62, -0.42, limb(0.04, 0.015, 0.4, '#7a4a22', m, 4)); tail.rotation.x = -0.9; g.add(tail);
  return 0.9;
};
registry.npcModels.cb_ogre = (g, m, p) => {
  const skin = '#8a8a5a';
  const b = biped(g, m, p, { hip: 1.2, legLen: 1.2, legR: 0.2, legColor: '#5a4a32', footColor: '#3a2a1a', torsoW: 1.2, torsoH: 1.15, torsoD: 0.8, color: skin, armLen: 1.25, armR: 0.17, armColor: skin, handR: 0.2, headR: 0.32, headColor: skin, stoop: 0.15 });
  b.body.add(box(1.25, 0.35, 0.85, '#5a4a32', 0, -0.4, 0, m));
  b.head.add(box(0.36, 0.08, 0.1, '#f0ead0', 0, -0.14, 0.27, m));
  for (const s of [-1, 1]) b.head.add(ball(0.04, '#1a1a1a', s * 0.12, 0.06, 0.28, m));
  const door = box(0.1, 0.9, 1.2, '#2a5aa0', -0.05, -0.55, 0.15, m); door.add(box(0.12, 0.38, 0.5, '#a8c8e0', 0, 0.18, 0, m)); b.arms[0].elbow.add(door);
  b.arms[1].hand.add(box(0.14, 0.14, 1.1, '#6a6e72', 0, 0, 0.45, m));
  return 3.1;
};
registry.npcModels.cb_lurker = (g, m, p) => {
  const c = '#7a7266';
  g.add(rock(0.55, c, 0, 0.45, 0, m), rock(0.32, '#8a8276', 0.4, 0.75, -0.1, m), rock(0.3, '#6a6458', -0.42, 0.62, 0.15, m), rock(0.28, c, 0, 0.95, 0.3, m));
  for (const s of [-1, 1]) { const e = ball(0.05, '#ffcc30', s * 0.12, 0.92, 0.55, m); glow(e.material, '#aa6600'); g.add(e); }
  p.legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => { const l = piv(sx * 0.4, 0.4, sz * 0.3, limb(0.08, 0.06, 0.4, '#5a544a', m, 5)); g.add(l); return l; });
  return 1.3;
};
registry.npcModels.cb_troll = (g, m, p) => {
  const con = '#9a968a';
  const b = biped(g, m, p, { hip: 1.25, legLen: 1.25, legR: 0.24, legColor: '#8a867a', footColor: '#6a665a', torsoW: 1.35, torsoH: 1.3, torsoD: 0.9, color: con, armLen: 1.5, armR: 0.2, armColor: '#8a867a', handR: 0.28, handColor: con, headR: 0.34, headColor: '#a8a498', stoop: 0.3, shoulderW: 0.85 });
  for (const [x, y, z, r] of [[0.4, 0.45, -0.3, 0.6], [-0.3, 0.2, -0.4, -0.5], [0.1, 0.6, 0.1, 0.2]]) { const rb = cyl(0.025, 0.025, 0.8, '#7a4a2a', x, y, z, m, 4); rb.rotation.z = r; rb.rotation.x = r * 0.5; b.body.add(rb); }
  for (const s of [-1, 1]) b.head.add(ball(0.05, '#ff6a20', s * 0.12, 0.05, 0.3, m));
  b.head.add(box(0.4, 0.1, 0.2, '#8a867a', 0, -0.18, 0.22, m));
  return 3.5;
};
registry.npcModels.cb_warg = (g, m, p, T, H) => {
  H.quad(g, m, p, { len: 1.35, h: 0.6, w: 0.5, y: 0.85, color: '#2e2838', legR: 0.08, legColor: '#221e2a' });
  for (let i = 0; i < 5; i++) { const c = cone(0.06, 0.22, '#3e3450', 0, 1.15, 0.45 - i * 0.2, m, 4); c.rotation.x = -0.6; g.add(c); }
  const { head } = H.neckHead(g, m, { at: [0.95, 0.6], len: 0.25, ang: 1.0, r: 0.16, color: '#2e2838', head: 0.24, snout: [0.1, 0.32, '#221e2a'] });
  for (const s of [-1, 1]) { head.add(cone(0.07, 0.2, '#221e2a', s * 0.1, 0.2, -0.04, m, 4)); const e = ball(0.035, '#ffe040', s * 0.1, 0.06, 0.18, m); glow(e.material, '#c0a000'); head.add(e); }
  const tail = piv(0, 0.95, -0.66, limb(0.08, 0.03, 0.6, '#2e2838', m, 5)); tail.rotation.x = -0.7; g.add(tail);
  return 1.5;
};
registry.npcModels.cb_witch = (g, m, p) => {
  const robe = '#4a2a6a';
  g.add(cone(0.42, 1.4, robe, 0, 0.7, 0, m, 8));
  g.add(ball(0.17, '#c8d8c8', 0, 1.55, 0.02, m));
  g.add(cyl(0.38, 0.38, 0.03, '#2a1a3a', 0, 1.66, 0, m, 10));
  const hat = cone(0.2, 0.6, '#2a1a3a', 0, 1.95, -0.04, m, 8); hat.rotation.x = -0.25; g.add(hat);
  for (const s of [-1, 1]) { g.add(ball(0.03, '#b070ff', s * 0.06, 1.57, 0.16, m)); const a = piv(s * 0.28, 1.35, 0, limb(0.06, 0.05, 0.55, robe, m)); a.rotation.z = s * 0.3; a.rotation.x = -0.4; g.add(a); }
  const staff = cyl(0.025, 0.03, 1.8, '#3a2a1a', 0.42, 0.95, 0.15, m, 5); g.add(staff);
  const orb = ball(0.09, '#c090ff', 0.42, 1.9, 0.15, m); glow(orb.material, '#6020a0'); g.add(orb);
  const mist = ball(0.6, '#c8c0d8', 0, 0.12, 0, m, 1.2, 0.25, 1.2); mist.material.transparent = true; mist.material.opacity = 0.35; mist.material.depthWrite = false; g.add(mist);
  floater(g, p, 0.1, 0.08);
  return 2.3;
};
registry.npcModels.cb_leviathan = (g, m, p) => {
  const teal = '#2a6a6a', belly = '#8ac0a0';
  const pool = cyl(2.2, 2.4, 0.08, '#2e5a86', 0, 0.02, 0, m, 12); pool.material.transparent = true; pool.material.opacity = 0.7; g.add(pool);
  const segs = [];
  let parent = g, y = 0.2, z = -1.2;
  for (let i = 0; i < 7; i++) {
    const r = 0.62 - i * 0.04;
    const s = piv(0, y, z, ball(r, teal, 0, 0, 0, m, 1, 1, 1.25));
    s.children[0].add(ball(r * 0.8, belly, 0, -r * 0.2, r * 0.45, m, 0.8, 0.7, 0.6));
    s.children[0].add(cone(0.18, 0.45, '#1a4a4a', 0, r * 0.9, -0.1, m, 4));
    s.rotation.x = -0.32;
    parent.add(s); segs.push(s);
    parent = s; y = 0.7; z = 0.25;
  }
  const head = piv(0, 0.5, 0.4, ball(0.55, teal, 0, 0, 0.1, m, 1, 0.8, 1.4));
  head.add(box(0.7, 0.12, 0.7, '#1a3a3a', 0, -0.28, 0.45, m));
  for (const s of [-1, 1]) { const e = ball(0.08, '#ffe060', s * 0.3, 0.18, 0.6, m); glow(e.material, '#a08000'); head.add(e); const fin = box(0.05, 0.5, 0.6, '#3a8a8a', s * 0.55, 0.15, -0.1, m); fin.rotation.z = s * 0.6; head.add(fin); }
  for (let i = 0; i < 5; i++) head.add(cone(0.04, 0.16, '#f2ead0', -0.24 + i * 0.12, -0.2, 0.85, m, 4).rotateX(Math.PI));
  head.rotation.x = 0.9;
  parent.add(head);
  p.custom = (ph, amt, now, anim) => {
    segs.forEach((s, i) => { s.rotation.x = -0.32 + Math.sin(now / 600 + i * 0.7) * 0.06; s.rotation.y = Math.sin(now / 900 + i) * 0.05; });
    head.rotation.x = 0.9 + (anim === 'attack' ? -Math.max(0, Math.sin(now / 120)) * 0.5 : 0);
  };
  return 5.5;
};

// ---------------------------------------------------------------- metro revenants and the lair
function revenant(g, m, p, { coat = '#4ac0a8', scale = 1, cap = false, knight = false }) {
  const b = biped(g, m, p, { hip: 0.85, legLen: 0.85, legR: 0.08, legColor: coat, footColor: '#2a6a5a', torsoW: 0.55, torsoH: 0.72, torsoD: 0.34, color: coat, armLen: 0.8, armR: 0.065, armColor: coat, handR: 0.08, handColor: '#c8f0e8', headR: 0.19, headColor: '#c8f0e8' });
  b.body.add(cone(0.42, 0.7, coat, 0, -0.35, 0, m, 6));
  for (const s of [-1, 1]) { const e = ball(0.04, '#1a1a1a', s * 0.07, 0.03, 0.16, m); b.head.add(e); }
  if (cap) { b.head.add(cyl(0.2, 0.2, 0.12, '#1a3a5a', 0, 0.13, 0, m, 8)); b.head.add(box(0.26, 0.03, 0.14, '#1a1a1a', 0, 0.08, 0.17, m)); const lamp = ball(0.09, '#fff0a0', 0, -0.05, 0.05, m); glow(lamp.material, '#a09000'); b.arms[0].hand.add(lamp); }
  if (knight) {
    b.body.add(box(0.62, 0.5, 0.4, '#5a7a74', 0, 0.12, 0, m));
    b.head.add(ball(0.22, '#5a7a74', 0, 0.02, 0, m, 1, 1.1, 1.1)); b.head.add(box(0.2, 0.03, 0.03, '#0a1a18', 0, 0.02, 0.22, m));
    b.arms[1].hand.add(box(0.06, 0.06, 1.1, '#a8e0d8', 0, 0, 0.5, m));
    b.arms[0].elbow.add(box(0.06, 0.6, 0.45, '#4a6a64', -0.08, -0.25, 0.08, m));
  }
  ghostly(m, 0.55, '#105a4a');
  return 2.0 * scale;
}
registry.npcModels.cb_revenant = (g, m, p) => revenant(g, m, p, {});
registry.npcModels.cb_rev_conductor = (g, m, p) => { const h = revenant(g, m, p, { coat: '#3a8ac0', cap: true }); g.scale.setScalar(1.12); return h * 1.12; };
registry.npcModels.cb_rev_knight = (g, m, p) => { const h = revenant(g, m, p, { coat: '#3aa08a', knight: true }); g.scale.setScalar(1.3); return h * 1.3; };

registry.npcModels.cb_colossus = (g, m, p) => {
  const con = '#a8a498', dark = '#7a766c';
  const b = biped(g, m, p, { hip: 2.6, legLen: 2.6, legR: 0.5, legColor: dark, footColor: '#5a564c', torsoW: 3.2, torsoH: 2.8, torsoD: 2.0, color: con, armLen: 3.0, armR: 0.45, armColor: dark, handR: 0.7, handColor: con, headR: 0, shoulderW: 2.0, twoArm: true, stoop: 0.4 });
  b.head.add(box(1.1, 0.95, 1.0, con, 0, 0.1, 0, m));
  for (const s of [-1, 1]) { const e = box(0.25, 0.1, 0.05, '#ff8a20', s * 0.25, 0.2, 0.52, m); glow(e.material, '#c04000'); b.head.add(e); }
  for (const [x, y, z, w, h] of [[0.8, 0.5, 1.01, 0.08, 1.2], [-0.6, -0.2, 1.01, 0.06, 0.9], [0.1, 0.8, 1.01, 0.9, 0.06]]) { const c = box(w, h, 0.03, '#ff6a10', x, y, z, m); glow(c.material, '#a03000'); b.body.add(c); }
  for (const [x, y, z, rx, rz] of [[1.2, 1.4, -0.6, 0.4, 0.5], [-1.0, 1.5, -0.4, -0.3, -0.6], [0.3, 1.5, -0.8, 0.6, 0.1], [1.5, 0.9, 0.3, 0, 1.2]]) { const r = cyl(0.05, 0.05, 1.6, '#6a3a1e', x, y, z, m, 4); r.rotation.x = rx; r.rotation.z = rz; b.body.add(r); }
  for (const [x, y, z] of [[1.45, 1.3, 0], [-1.45, 1.3, 0]]) b.body.add(box(0.9, 0.7, 1.4, dark, x, y, z, m));
  return 8.5;
};
registry.npcModels.cb_rubble_golem = (g, m, p) => {
  const b = biped(g, m, p, { hip: 0.75, legLen: 0.75, legR: 0.16, legColor: '#7a766c', torsoW: 0.9, torsoH: 0.8, torsoD: 0.6, color: '#8a867a', armLen: 0.85, armR: 0.14, armColor: '#7a766c', handR: 0.22, handColor: '#9a968a', headR: 0, twoArm: true });
  b.head.add(rock(0.28, '#9a968a', 0, 0.05, 0, m));
  for (const s of [-1, 1]) { const e = ball(0.04, '#ff8a20', s * 0.1, 0.08, 0.25, m); glow(e.material, '#c04000'); b.head.add(e); }
  b.body.add(rock(0.35, '#7a766c', 0.25, 0.3, -0.2, m));
  return 2.2;
};
