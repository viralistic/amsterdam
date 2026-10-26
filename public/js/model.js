// Faceted low-poly characters in the old-school style: tapered limbs, chunky boots and hands,
// flat shading and no textures.
import * as THREE from 'three';
import { SKIN, HAIR, CLOTH } from '/shared/look.js';
import { ITEMS } from '/shared/items.js';

function mat(color, mats) {
  const m = new THREE.MeshLambertMaterial({ color, flatShading: true });
  mats.push(m);
  return m;
}

// Tapered prism hanging down from its pivot (top at y=0).
function seg(rTop, rBot, h, color, mats, { sides = 6, sz = 1, y = 0 } = {}) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, sides, 1).translate(0, -h / 2 + y, 0).scale(1, 1, sz);
  return new THREE.Mesh(geo, mat(color, mats));
}

function blob(r, color, mats, sx = 1, sy = 1, sz = 1, wseg = 6, hseg = 4) {
  const geo = new THREE.SphereGeometry(r, wseg, hseg).scale(sx, sy, sz);
  return new THREE.Mesh(geo, mat(color, mats));
}

function pivot(x, y, z, ...children) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.add(...children);
  return g;
}

export function buildModel(ent) {
  const group = new THREE.Group();
  const mats = [];
  const parts = {};
  if (ent.m === 'duck') {
    const body = blob(0.24, '#8a7356', mats, 1, 0.7, 1.4); body.position.y = 0.22;
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 4).rotateX(-Math.PI / 2 - 0.5), mat('#5a4a38', mats)); tail.position.set(0, 0.3, -0.33);
    const neck = seg(0.06, 0.07, 0.18, '#2d6a2a', mats); neck.position.set(0, 0.5, 0.2);
    const head = blob(0.11, '#2d6a2a', mats, 1, 1, 1.2); head.position.set(0, 0.52, 0.24);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 4).rotateX(Math.PI / 2), mat('#f0a020', mats)); beak.position.set(0, 0.5, 0.39);
    const ring = seg(0.075, 0.075, 0.03, '#f4f4f4', mats); ring.position.set(0, 0.36, 0.2);
    group.add(body, tail, neck, head, beak, ring);
    parts.duck = body;
    return finish(group, mats, parts, 0.7, ent);
  }

  const l = ent.l || {};
  const eq = ent.eq || {};
  const skin = SKIN[l.skin] || SKIN[0];
  const top = eq.body ? ITEMS[eq.body].color : CLOTH[l.top] || CLOTH[0];
  const legs = CLOTH[l.legs] || CLOTH[1];
  const hair = HAIR[l.hair] || HAIR[0];
  const boots = eq.feet ? ITEMS[eq.feet].color : '#4a3020';
  const female = !!l.g;

  // legs: thigh -> knee -> shin -> boot
  for (const side of [-1, 1]) {
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.15, 0.36).translate(0, -0.06, 0.06), mat(boots, mats));
    const shin = seg(0.115, 0.09, 0.34, legs, mats);
    const knee = pivot(0, -0.42, 0, shin, pivot(0, -0.34, 0, boot));
    const thigh = seg(0.15, 0.115, 0.42, legs, mats, { sz: 1.05 });
    const hip = pivot(side * 0.13, 0.9, 0, thigh, knee);
    parts[side < 0 ? 'legL' : 'legR'] = hip;
    parts[side < 0 ? 'kneeL' : 'kneeR'] = knee;
    group.add(hip);
  }
  const pelvis = seg(0.25, 0.26, 0.18, legs, mats, { sz: 0.72 }); pelvis.position.y = 1.02;
  const belt = seg(0.255, 0.255, 0.045, '#3a2a1a', mats, { sz: 0.74 }); belt.position.y = 1.03;
  group.add(pelvis, belt);
  if (female) { const skirt = seg(0.25, 0.33, 0.34, top, mats, { sz: 0.8 }); skirt.position.y = 1.02; group.add(skirt); }

  // torso: broad shoulders tapering to the waist, slightly flattened front to back
  const torso = seg(0.35, 0.25, 0.52, top, mats, { sz: 0.66 }); torso.position.y = 1.54;
  const chest = seg(0.26, 0.21, 0.24, top, mats, { sz: 0.85 }); chest.position.set(0, 1.5, 0.04);
  const neck = seg(0.08, 0.09, 0.1, skin, mats); neck.position.y = 1.62;
  group.add(torso, chest, neck);

  // arms: shoulder -> upper arm -> elbow -> forearm -> hand
  for (const side of [-1, 1]) {
    const hand = blob(0.085, skin, mats, 0.9, 1.15, 1, 5, 3); hand.position.y = -0.29;
    const fore = seg(0.09, 0.07, 0.27, top, mats);
    const elbow = pivot(0, -0.3, 0, fore, hand);
    elbow.rotation.x = -0.25;
    const upper = seg(0.11, 0.09, 0.31, top, mats);
    const shoulderBall = blob(0.125, top, mats, 1, 0.9, 1, 5, 3);
    const shoulder = pivot(side * 0.37, 1.48, 0, shoulderBall, upper, elbow);
    shoulder.rotation.z = side * 0.07;
    parts[side < 0 ? 'armL' : 'armR'] = shoulder;
    parts[side < 0 ? 'elbowL' : 'elbowR'] = elbow;
    group.add(shoulder);
  }

  // head
  const head = new THREE.Group();
  head.position.y = 1.8;
  const skull = blob(0.19, skin, mats, 1, 1.12, 1.06, 7, 5);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.06), mat(new THREE.Color(skin).multiplyScalar(0.85), mats)); nose.position.set(0, -0.02, 0.205);
  const eyeMat = mat('#1a1410', mats);
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.03, 0.02), eyeMat); eyeL.position.set(-0.07, 0.035, 0.193);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.07;
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.02), mat(hair, mats)); brow.position.set(0, 0.08, 0.19);
  head.add(skull, nose, eyeL, eyeR, brow);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.21, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.4).scale(1, 1.1, 1.1), mat(hair, mats));
  cap.position.set(0, 0.02, -0.01);
  head.add(cap);
  if (female) {
    const long = seg(0.19, 0.15, 0.46, hair, mats, { sz: 0.55 }); long.position.set(0, 0.07, -0.1);
    head.add(long);
  } else {
    const beard = seg(0.12, 0.05, 0.12, hair, mats, { sides: 5, sz: 0.8 }); beard.position.set(0, -0.1, 0.1);
    head.add(beard);
  }
  group.add(head);
  parts.head = head;

  // ---- equipment
  if (eq.weapon) {
    const w = ITEMS[eq.weapon];
    const len = eq.weapon.includes('dagger') ? 0.38 : eq.weapon.includes('longsword') ? 0.95 : 0.75;
    const wpn = new THREE.Group();
    const grip = seg(0.025, 0.025, 0.16, '#4a3018', mats); grip.position.y = 0.08;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.05), mat('#6a5a40', mats)); guard.position.y = 0.0;
    const bladeGeo = new THREE.CylinderGeometry(0.0, 0.045, len, 4).rotateY(Math.PI / 4).scale(1, 1, 0.25).translate(0, len / 2 + 0.02, 0);
    const bl = new THREE.Mesh(bladeGeo, mat(w.metal, mats));
    if (eq.weapon.includes('scimitar')) { bl.rotation.z = -0.25; bl.position.x = -0.05; }
    wpn.add(grip, guard, bl);
    wpn.position.y = -0.29;
    wpn.rotation.x = 1.15;
    parts.elbowR.add(wpn);
  }
  if (eq.shield) {
    const sh = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.04, 8).rotateZ(Math.PI / 2), mat('#5c5c62', mats));
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 8).rotateZ(Math.PI / 2), mat('#8a5a2c', mats));
    const boss = blob(0.06, '#a4a4ac', mats, 0.6, 1, 1, 5, 3); boss.position.x = -0.03;
    sh.add(rim, face, boss);
    sh.position.set(-0.11, -0.15, 0.05);
    parts.elbowL.add(sh);
  }
  if (eq.cape) {
    const capeGeo = new THREE.CylinderGeometry(0.26, 0.38, 0.95, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 0.1).translate(0, -0.475, 0);
    const cape = new THREE.Mesh(capeGeo, mat(ITEMS[eq.cape].color, mats));
    const capePivot = pivot(0, 1.52, -0.2, cape);
    capePivot.rotation.x = -0.12;
    parts.cape = capePivot;
    group.add(capePivot);
    if (eq.cape === 'ajax_cape') { const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.95, 0.02).translate(0, -0.5, -0.025), mat('#f2f2f2', mats)); capePivot.add(stripe); }
  }
  if (eq.head === 'kings_crown') {
    const c = ITEMS.kings_crown.color;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.2, 0.09, 8, 1, true), new THREE.MeshLambertMaterial({ color: c, flatShading: true, side: THREE.DoubleSide }));
    mats.push(band.material);
    band.position.y = 0.19;
    head.add(band);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const pt = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 4), mat(c, mats));
      pt.position.set(Math.sin(a) * 0.2, 0.27, Math.cos(a) * 0.2);
      head.add(pt);
    }
  } else if (eq.head) {
    const m = ITEMS[eq.head].metal;
    const helm = blob(0.23, m, mats, 1, 1.12, 1.1, 7, 5); helm.position.y = 0.02;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.03), mat('#111', mats)); visor.position.set(0, 0.03, 0.245);
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.03), mat('#111', mats)); slit.position.set(0, -0.05, 0.245);
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.3), mat(m, mats)); crest.position.set(0, 0.27, 0);
    head.add(helm, visor, slit, crest);
    cap.visible = false;
  }
  return finish(group, mats, parts, 2.05, ent);
}

function finish(group, mats, parts, height, ent) {
  if (ent.g) {
    for (const m of mats) {
      m.transparent = true; m.opacity = 0.42; m.depthWrite = false;
      m.color.lerp(new THREE.Color('#cfe8ff'), 0.45);
      m.emissive = new THREE.Color('#1d3b5c');
    }
  }
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.9, height, 0.9), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = height / 2;
  group.add(hit);
  return { group, parts, mats, hit, height };
}

// Walk cycle: legs swing from the hip, knees bend on the back swing, arms counter-swing.
export function animate(model, phase, amount, now) {
  const p = model.parts;
  if (p.duck) { p.duck.rotation.z = Math.sin(phase) * 0.12 * amount; return; }
  const s = Math.sin(phase) * 0.55 * amount;
  p.legL.rotation.x = -s; p.legR.rotation.x = s;
  p.kneeL.rotation.x = Math.max(0, s) * 1.1 + 0.05; p.kneeR.rotation.x = Math.max(0, -s) * 1.1 + 0.05;
  p.armL.rotation.x = s * 0.8; p.armR.rotation.x = -s * 0.8;
  p.elbowL.rotation.x = -0.25 - Math.max(0, -s) * 0.5; p.elbowR.rotation.x = -0.25 - Math.max(0, s) * 0.5;
  const breathe = Math.sin(now / 700) * 0.015 * (1 - amount);
  p.head.rotation.x = breathe;
  if (p.cape) p.cape.rotation.x = -0.12 - amount * 0.25 - Math.abs(Math.sin(phase)) * 0.06 * amount;
}

export function disposeModel(model) {
  model.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
}

// Small turntable preview for the character designer.
let pv = null;
export function drawPreview(canvas, look) {
  if (!pv) {
    const gl = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    gl.setPixelRatio(Math.min(devicePixelRatio, 2));
    gl.setSize(canvas.clientWidth || canvas.width, canvas.clientHeight || canvas.height, false);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#ffffff', '#4a4030', 2.2));
    const sun = new THREE.DirectionalLight('#fff4e0', 1.4); sun.position.set(2, 4, 3); scene.add(sun);
    const cam = new THREE.PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 20);
    cam.position.set(0, 1.25, 4.4); cam.lookAt(0, 1.0, 0);
    pv = { gl, scene, cam, model: null };
    const spin = t => { if (!canvas.isConnected) return; if (pv.model && canvas.offsetParent) { pv.model.group.rotation.y = Math.sin(t / 1400) * 0.7; pv.gl.render(scene, cam); } requestAnimationFrame(spin); };
    requestAnimationFrame(spin);
  }
  if (pv.model) { pv.scene.remove(pv.model.group); disposeModel(pv.model); }
  pv.model = buildModel({ l: look, eq: {} });
  pv.scene.add(pv.model.group);
}
