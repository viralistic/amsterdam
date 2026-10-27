// NPC models for the quest pack: painted militia, ghosts, forest animals, fantasy monsters and a pigeon.
import { registry } from '../../registry.js';

// Simple chunky humanoid with optional hat, ruff collar, sash and weapon. Animates itself through parts.custom.
function humanoid(g, m, p, T, h, o) {
  const { seg, blob, pivot, mat } = h;
  const k = o.k || 1;
  const legs = [], arms = [];
  for (const sx of [-1, 1]) {
    const boot = new T.Mesh(new T.BoxGeometry(0.22, 0.16, 0.36).translate(0, -0.78, 0.05), mat(o.boots || '#2a1a10', m));
    const leg = pivot(sx * 0.13, 0.92, 0, seg(0.14, 0.1, 0.8, o.legs || '#2a2a2a', m), boot);
    if (o.stockings) leg.add(seg(0.1, 0.09, 0.3, o.stockings, m, { y: -0.45 }));
    legs.push(leg); g.add(leg);
    const arm = pivot(sx * 0.38, 1.5, 0, blob(0.12, o.top, m, 1, 0.9, 1, 5, 3), seg(0.1, 0.075, 0.62, o.sleeve || o.top, m), (() => { const hand = blob(0.08, o.skin || '#e0b896', m, 0.9, 1.1, 1, 5, 3); hand.position.y = -0.66; return hand; })());
    arm.rotation.z = sx * 0.08;
    arms.push(arm); g.add(arm);
  }
  const torso = seg(0.36, 0.28, 0.62, o.top, m, { sz: 0.7 }); torso.position.y = 1.58; g.add(torso);
  if (o.coatTail) { const tail = seg(0.3, 0.38, 0.4, o.top, m, { sz: 0.75 }); tail.position.y = 1.02; g.add(tail); }
  if (o.sash) { const s = new T.Mesh(new T.BoxGeometry(0.1, 0.8, 0.5).rotateX(0).rotateZ(0.7), mat(o.sash, m)); s.position.set(0, 1.32, 0); s.scale.z = 1; g.add(s); }
  if (o.ruff) { const r = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 0.08, 10), mat('#f4f0e8', m)); r.position.y = 1.62; g.add(r); }
  const head = new T.Group(); head.position.y = 1.85;
  head.add(blob(0.19, o.skin || '#e0b896', m, 1, 1.12, 1.05, 7, 5));
  const eye = new T.Mesh(new T.BoxGeometry(0.2, 0.03, 0.02), mat(o.eyes || '#1a1410', m)); eye.position.set(0, 0.03, 0.19); head.add(eye);
  if (o.beard) { const b = blob(0.13, o.beard, m, 1, 0.8, 0.6, 5, 3); b.position.set(0, -0.13, 0.12); head.add(b); }
  if (o.hat === 'wide') { const brim = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.03, 12), mat(o.hatC || '#141414', m)); brim.position.y = 0.14; const crown = new T.Mesh(new T.CylinderGeometry(0.17, 0.2, 0.22, 8), mat(o.hatC || '#141414', m)); crown.position.y = 0.26; head.add(brim, crown); if (o.plume) { const pl = blob(0.12, o.plume, m, 0.5, 0.8, 1.6, 5, 3); pl.position.set(0.15, 0.32, -0.05); head.add(pl); } }
  if (o.hat === 'helm') { const hm = blob(0.22, '#8a8a90', m, 1, 0.8, 1.1, 7, 4); hm.position.y = 0.08; const crest = new T.Mesh(new T.BoxGeometry(0.04, 0.12, 0.42), mat('#8a8a90', m)); crest.position.y = 0.24; head.add(hm, crest); }
  if (o.horns) for (const sx of [-1, 1]) { const hn = new T.Mesh(new T.ConeGeometry(0.06, 0.25, 4), mat(o.horns, m)); hn.position.set(sx * 0.14, 0.22, 0); hn.rotation.z = -sx * 0.4; head.add(hn); }
  g.add(head);
  if (o.weapon) {
    const w = new T.Group();
    if (o.weapon === 'musket') { w.add(new T.Mesh(new T.CylinderGeometry(0.025, 0.03, 1.5, 5).translate(0, 0.5, 0), mat('#3a2a1a', m))); const barrel = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 0.9, 5).translate(0, 0.95, 0.03), mat('#5a5a60', m)); w.add(barrel); }
    else if (o.weapon === 'pike') { w.add(new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 2.4, 5).translate(0, 0.9, 0), mat('#5a3a20', m))); const tip = new T.Mesh(new T.ConeGeometry(0.06, 0.3, 4).translate(0, 2.2, 0), mat(o.tip || '#c8c8d0', m)); w.add(tip); }
    else if (o.weapon === 'club') { w.add(new T.Mesh(new T.CylinderGeometry(0.12, 0.05, 0.9, 5).translate(0, 0.35, 0), mat('#3a2a2a', m))); }
    else if (o.weapon === 'cane') { w.add(new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 1.0, 5).translate(0, 0.2, 0), mat('#1a1a1a', m))); const knob = blob(0.05, '#e0b530', m); knob.position.y = 0.7; w.add(knob); }
    w.position.y = -0.62; w.rotation.x = 0.3;
    arms[1].add(w);
  }
  g.scale.setScalar(k);
  p.custom = (phase, amount, now, anim) => {
    const s = Math.sin(phase) * 0.5 * amount;
    legs[0].rotation.x = -s; legs[1].rotation.x = s;
    arms[0].rotation.x = s * 0.8; arms[1].rotation.x = -s * 0.8;
    if (anim === 'attack') arms[1].rotation.x = -0.4 - Math.max(0, Math.sin(now / 110)) * 1.5;
    head.rotation.x = Math.sin(now / 700) * 0.02;
    if (o.float) g.position.y = 0.25 + Math.sin(now / 500) * 0.08;
  };
  return 2.1 * k + (o.hat ? 0.2 : 0);
}

// translucent tint for ghosts and painted figures
function tint(m, T, color, opacity) { for (const x of m) { x.color.lerp(new T.Color(color), 0.35); if (opacity) { x.transparent = true; x.opacity = opacity; x.depthWrite = false; x.emissive = new T.Color(color).multiplyScalar(0.3); } } }

Object.assign(registry.npcModels, {
  // painted militiamen from the Night Watch: varnished browns and golds
  q_militia: (g, m, p, T, h) => { const r = humanoid(g, m, p, T, h, { top: '#2a2620', legs: '#3a3020', ruff: true, hat: 'wide', hatC: '#1e1a14', weapon: 'musket', beard: '#5a3a1a', stockings: '#6a5a3a' }); tint(m, T, '#c89a40'); return r; },
  q_militia_pike: (g, m, p, T, h) => { const r = humanoid(g, m, p, T, h, { top: '#5a4020', legs: '#3a3020', ruff: true, hat: 'helm', weapon: 'pike', beard: '#3a2a1a' }); tint(m, T, '#c89a40'); return r; },
  q_captain: (g, m, p, T, h) => { const r = humanoid(g, m, p, T, h, { k: 1.25, top: '#121214', legs: '#121214', sash: '#c81e1e', ruff: true, hat: 'wide', hatC: '#0e0e10', weapon: 'cane', beard: '#3a2a1a', boots: '#1a1a1a' }); tint(m, T, '#d0a040'); return r; },
  q_lieutenant: (g, m, p, T, h) => { const r = humanoid(g, m, p, T, h, { k: 1.15, top: '#e8d070', legs: '#e8d070', sash: '#f4f0e0', hat: 'wide', hatC: '#e8d070', plume: '#f4f0e8', weapon: 'pike', tip: '#e0c870', beard: '#8a6a3a', boots: '#c8a870' }); tint(m, T, '#d0a040'); return r; },
  q_shade: (g, m, p, T, h) => { const r = humanoid(g, m, p, T, h, { top: '#8a9ab0', legs: '#8a9ab0', skin: '#c8d8e8', eyes: '#40e0ff', float: true }); tint(m, T, '#a8d8ff', 0.55); return r; },
  q_painter_ghost: (g, m, p, T, h) => { const r = humanoid(g, m, p, T, h, { top: '#4a3a2a', legs: '#3a2a1a', skin: '#e8d0b8', beard: '#c8c8c0', hat: 'wide', hatC: '#3a2a20', ruff: false, float: true }); tint(m, T, '#ffe8b0', 0.6); return r; },
  q_burglar: (g, m, p, T, h) => humanoid(g, m, p, T, h, { top: '#1a1a1a', legs: '#1a1a1a', eyes: '#f4f4f4', weapon: 'club' }),
  q_shadow_troll: (g, m, p, T, h) => { const r = humanoid(g, m, p, T, h, { k: 1.5, top: '#1e1a2a', legs: '#16121e', skin: '#2a2438', eyes: '#c040ff', weapon: 'club', horns: '#4a3a5a', boots: '#100c18' }); tint(m, T, '#6a40a0'); return r; },

  q_pigeon: (g, m, p, T, h) => {
    const { blob, mat } = h;
    const body = blob(0.16, '#8a8f9a', m, 1, 0.8, 1.4, 6, 4); body.position.y = 0.2;
    const neck = blob(0.09, '#5a7a6a', m, 1, 1, 1); neck.position.set(0, 0.32, 0.14);
    const head = blob(0.07, '#7a7f8a', m); head.position.set(0, 0.4, 0.18);
    const beak = new T.Mesh(new T.ConeGeometry(0.02, 0.06, 4).rotateX(Math.PI / 2), mat('#3a3a3a', m)); beak.position.set(0, 0.39, 0.26);
    const tail = new T.Mesh(new T.BoxGeometry(0.14, 0.03, 0.18), mat('#4a4f5a', m)); tail.position.set(0, 0.2, -0.25);
    g.add(body, neck, head, beak, tail);
    p.custom = (phase, amount, now) => { head.position.z = 0.18 + Math.sin(phase * 2) * 0.04 * amount; body.rotation.z = Math.sin(now / 400) * 0.03; };
    return 0.5;
  },
  q_white_stag: (g, m, p, T, h) => {
    h.quad(g, m, p, { len: 1.3, h: 0.6, w: 0.45, y: 1.1, color: '#f4f4f0', leg: 0.9, legR: 0.05 });
    const { head } = h.neckHead(g, m, { at: [1.3, 0.55], len: 0.5, ang: 0.6, r: 0.11, color: '#f4f4f0', head: 0.16, snout: [0.06, 0.22, '#e8e4dc'] });
    for (const sx of [-1, 1]) { const a = h.seg(0.025, 0.02, 0.5, '#f0e0a0', m, { sides: 4 }); const pv = h.pivot(sx * 0.08, 0.12, -0.02, a); pv.rotation.set(Math.PI - 0.4, 0, -sx * 0.5); head.add(pv); const t = h.seg(0.02, 0.015, 0.25, '#f0e0a0', m, { sides: 4 }); const tp = h.pivot(0, -0.3, 0, t); tp.rotation.x = 0.9; a.add(tp); }
    for (const x of m) x.emissive = new T.Color('#3a4a5a');
    return 2.0;
  },
  q_boar: (g, m, p, T, h) => {
    h.quad(g, m, p, { len: 1.1, h: 0.6, w: 0.5, y: 0.55, color: '#3a2a3a', leg: 0.4, legR: 0.07 });
    const { head } = h.neckHead(g, m, { at: [0.65, 0.5], len: 0.15, ang: 1.3, r: 0.18, color: '#3a2a3a', head: 0.22, snout: [0.1, 0.22, '#5a3a4a'] });
    for (const sx of [-1, 1]) { const t = new T.Mesh(new T.ConeGeometry(0.03, 0.18, 4), h.mat('#f0f0e0', m)); t.position.set(sx * 0.1, -0.05, 0.25); t.rotation.x = -0.6; head.add(t); const e = new T.Mesh(new T.BoxGeometry(0.05, 0.03, 0.02), h.mat('#c040ff', m)); e.position.set(sx * 0.08, 0.06, 0.18); head.add(e); }
    const mane = new T.Mesh(new T.BoxGeometry(0.08, 0.15, 0.9), h.mat('#1a101a', m)); mane.position.set(0, 0.88, 0); g.add(mane);
    return 1.0;
  },
  q_swamp_dragon: (g, m, p, T, h) => {
    h.quad(g, m, p, { len: 3.2, h: 1.4, w: 1.4, y: 1.6, color: '#2a4a2a', leg: 1.1, legR: 0.22 });
    const { head } = h.neckHead(g, m, { at: [2.0, 1.4], len: 1.4, ang: 0.7, r: 0.35, color: '#2a4a2a', head: 0.5, snout: [0.25, 0.7, '#3a5a2a'] });
    for (const sx of [-1, 1]) {
      const wing = new T.Mesh(new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(sx * 3, 1.5, -0.5), new T.Vector3(sx * 2.6, -0.2, -1.6), new T.Vector3(0, 0, 0), new T.Vector3(sx * 2.6, -0.2, -1.6), new T.Vector3(sx * 0.4, 0, -1.4)]), h.mat('#4a2a3a', m)); wing.geometry.computeVertexNormals(); wing.material.side = T.DoubleSide; wing.position.set(sx * 0.5, 2.2, 0.4); g.add(wing);
      const eye = new T.Mesh(new T.BoxGeometry(0.1, 0.06, 0.04), h.mat('#ff8a20', m)); eye.position.set(sx * 0.2, 0.15, 0.35); head.add(eye);
      const horn = new T.Mesh(new T.ConeGeometry(0.07, 0.5, 4), h.mat('#d8d0b0', m)); horn.position.set(sx * 0.2, 0.4, -0.2); horn.rotation.x = -0.6; head.add(horn);
    }
    const tail = h.seg(0.4, 0.05, 2.6, '#2a4a2a', m); const tp = h.pivot(0, 1.7, -1.5, tail); tp.rotation.x = -1.9; g.add(tp);
    for (let i = 0; i < 5; i++) { const sp = new T.Mesh(new T.ConeGeometry(0.12, 0.35, 4), h.mat('#6a8a3a', m)); sp.position.set(0, 2.5, 1.2 - i * 0.6); g.add(sp); }
    return 4.2;
  },
  q_giant_eel: (g, m, p, T, h) => {
    const segs = [];
    for (let i = 0; i < 7; i++) { const s = h.blob(0.38 - i * 0.03, i % 2 ? '#3a4a3a' : '#4a5a3a', m, 1, 1, 1.4, 6, 4); s.position.set(0, 0.4 + Math.max(0, 3 - i) * 0.5, -i * 0.5); g.add(s); segs.push(s); }
    const head = h.blob(0.42, '#4a5a3a', m, 0.9, 0.8, 1.3, 6, 4); head.position.set(0, 2.4, 0.4); g.add(head);
    const eye = new T.Mesh(new T.BoxGeometry(0.5, 0.06, 0.06), h.mat('#e8f020', m)); eye.position.set(0, 2.5, 0.8); g.add(eye);
    p.custom = (phase, amount, now) => segs.forEach((s, i) => { s.position.x = Math.sin(now / 300 + i * 0.8) * 0.25; });
    return 3.0;
  },
  q_robot: (g, m, p, T, h) => {
    const body = h.blob(0.3, '#d8dce4', m, 1, 1.2, 0.9, 6, 4); body.position.y = 0.75;
    const head = h.blob(0.22, '#e8ecf0', m, 1.1, 0.9, 1, 6, 4); head.position.y = 1.25;
    const eyes = new T.Mesh(new T.BoxGeometry(0.24, 0.05, 0.02), new T.MeshBasicMaterial({ color: '#30d0ff' })); eyes.position.set(0, 1.27, 0.21); m.push(eyes.material);
    const ant = h.seg(0.01, 0.01, 0.2, '#5a5a60', m); ant.position.y = 1.65;
    const tip = h.blob(0.04, '#ff4a2a', m); tip.position.y = 1.67;
    const wheel = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.15, 10).rotateZ(Math.PI / 2), h.mat('#2a2a2a', m)); wheel.position.y = 0.2;
    g.add(body, head, eyes, ant, tip, wheel);
    p.custom = (phase, amount, now) => { head.rotation.y = Math.sin(now / 900) * 0.4; body.position.y = 0.75 + Math.sin(now / 250) * 0.02; };
    return 1.7;
  },
  q_squirrel: (g, m, p, T, h) => {
    const body = h.blob(0.12, '#a0522d', m, 1, 1.2, 1.2, 6, 4); body.position.y = 0.15;
    const head = h.blob(0.08, '#a0522d', m); head.position.set(0, 0.3, 0.08);
    const tail = h.blob(0.12, '#b8623d', m, 0.8, 1.8, 0.8, 6, 4); tail.position.set(0, 0.3, -0.15);
    g.add(body, head, tail);
    p.custom = (phase, amount, now) => { tail.rotation.x = Math.sin(now / 200) * 0.2; body.position.y = 0.15 + Math.abs(Math.sin(phase)) * 0.08 * amount; };
    return 0.45;
  },
});
