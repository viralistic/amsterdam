// Faceted low-poly characters in the old-school style: tapered limbs, chunky boots and hands,
// flat shading and no textures.
import * as THREE from 'three';
import { SKIN, HAIR, CLOTH } from '/shared/look.js';
import { ITEMS } from '/shared/items.js';
import { registry } from './registry.js';

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
  if (ent.m && registry.npcModels[ent.m]) {
    const h = registry.npcModels[ent.m](group, mats, parts, THREE, HELPERS);
    if (ent.sc) group.scale.setScalar(ent.sc);
    return finish(group, mats, parts, h * (ent.sc || 1), ent);
  }
  if (ent.m && ANIMALS[ent.m]) {
    const h = ANIMALS[ent.m](group, mats, parts);
    return finish(group, mats, parts, h, ent);
  }
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
  const top = eq.body ? ITEMS[eq.body].color : l.topC || CLOTH[l.top] || CLOTH[0];
  const legs = eq.legs ? ITEMS[eq.legs].color : CLOTH[l.legs] || CLOTH[1];
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
  const dress = eq.body && ITEMS[eq.body].dress;
  if (female || dress) { const skirt = seg(0.25, 0.34, dress ? 0.52 : 0.34, top, mats, { sz: 0.8 }); skirt.position.y = 1.02; group.add(skirt); }
  if (eq.legs && ITEMS[eq.legs].dress) { const robe = seg(0.26, 0.36, 0.95, legs, mats, { sz: 0.85 }); robe.position.y = 1.02; group.add(robe); }

  // torso: broad shoulders tapering to the waist, slightly flattened front to back
  const torso = seg(0.35, 0.25, 0.52, top, mats, { sz: 0.66 }); torso.position.y = 1.54;
  const chest = seg(0.26, 0.21, 0.24, top, mats, { sz: 0.85 }); chest.position.set(0, 1.5, 0.04);
  const neck = seg(0.08, 0.09, 0.1, skin, mats); neck.position.y = 1.62;
  group.add(torso, chest, neck);
  if (eq.body && ITEMS[eq.body].stripes) for (const y of [1.18, 1.3, 1.42]) { const band = seg(0.3, 0.29, 0.045, ITEMS[eq.body].stripes, mats, { sz: 0.68 }); band.position.y = y; group.add(band); }

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
  const wdef = eq.weapon && ITEMS[eq.weapon];
  if (wdef?.style === 'ranged') {
    // bow held upright in the left hand
    const bow = new THREE.Group();
    const half = wdef.long ? 0.7 : 0.52;
    for (const sgn of [-1, 1]) {
      // each limb hangs from the grip and bends back towards the string
      const limb = seg(0.025, 0.018, half, wdef.wood, mats, { sides: 4 });
      limb.rotation.x = sgn > 0 ? Math.PI - 0.35 : 0.35;
      bow.add(limb);
    }
    const str = new THREE.Mesh(new THREE.BoxGeometry(0.008, half * 1.85, 0.008), mat('#e8e2d0', mats));
    str.position.z = -half * 0.33;
    bow.add(str);
    bow.position.set(0, -0.29, 0.02);
    bow.rotation.x = -1.2;
    parts.elbowL.add(bow);
  } else if (wdef?.style === 'magic') {
    const staff = new THREE.Group();
    const stick = seg(0.025, 0.03, 1.5, '#5a3e22', mats, { sides: 5 }); stick.position.y = 0.95;
    const orb = blob(0.06, wdef.orb, mats, 1, 1, 1, 6, 4); orb.position.y = 1.0;
    staff.add(stick, orb);
    staff.position.y = -0.29;
    staff.rotation.x = 0.25;
    parts.elbowR.add(staff);
  } else if (eq.weapon) {
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
  } else if (eq.head && ITEMS[eq.head].hat) {
    const it = ITEMS[eq.head];
    if (it.hat === 'wizard') {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 10), mat(it.color, mats)); brim.position.y = 0.15;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.55, 8), mat(it.color, mats)); cone.position.y = 0.42; cone.rotation.z = -0.12;
      head.add(brim, cone);
    } else if (it.hat === 'cowl') {
      const hood = blob(0.235, it.color, mats, 1, 1.15, 1.12, 7, 5); hood.position.set(0, 0.02, -0.035);
      head.add(hood);
      cap.visible = false;
    } else {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.45).scale(1, it.hat === 'cap' ? 0.7 : 1.15, 1.1), mat(it.color, mats));
      dome.position.y = 0.04;
      head.add(dome);
      if (it.hat === 'beanie') { const pom = blob(0.05, '#f2f2f2', mats); pom.position.y = 0.3; head.add(pom); }
      else { const peak = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.025, 0.14), mat(new THREE.Color(it.color).multiplyScalar(0.75), mats)); peak.position.set(0, 0.07, 0.24); head.add(peak); }
      cap.visible = false;
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

export const HELPERS = { mat, seg, blob, pivot, quad, neckHead };

// ---- zoo animals. Each builder adds meshes facing +z and returns the model height.

function quad(group, mats, parts, o) {
  const { len, h, w, y, color, legR, legColor = color } = o;
  const leg = y - h * 0.2; // legs reach the ground
  const body = blob(0.5, color, mats, w, h, len, 7, 5); body.position.y = y;
  group.add(body);
  parts.legs = [];
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const l = seg(legR, legR * 0.75, leg, legColor, mats, { sides: 5 });
    const hip = pivot(sx * w * 0.32, y - h * 0.2, sz * len * 0.33, l);
    if (o.hoof) { const hf = new THREE.Mesh(new THREE.BoxGeometry(legR * 2, 0.08, legR * 2.2).translate(0, -leg, 0), mat(o.hoof, mats)); hip.add(hf); }
    parts.legs.push(hip);
    group.add(hip);
  }
  return body;
}

// Neck rising from `at` = [y, z], tilted forward by `ang` from vertical, with the head placed at its tip.
function neckHead(group, mats, { at, len, ang, r, color, head, headColor = color, snout }) {
  const neck = seg(r * 0.8, r, len, color, mats, { sides: 6 });
  const n = pivot(0, at[0], at[1], neck);
  n.rotation.x = ang - Math.PI; // the segment hangs along -y; flip it up and lean it forward
  group.add(n);
  const hd = new THREE.Group();
  hd.position.set(0, at[0] + Math.cos(ang) * len, at[1] + Math.sin(ang) * len);
  hd.add(blob(head, headColor, mats, 0.8, 0.8, 1.1, 6, 4));
  if (snout) {
    const sn = new THREE.Mesh(new THREE.ConeGeometry(snout[0], snout[1], 5).rotateX(Math.PI / 2), mat(snout[2] || headColor, mats));
    sn.position.set(0, -head * 0.25, head * 0.8 + snout[1] * 0.3);
    hd.add(sn);
  }
  group.add(hd);
  return { neck: n, head: hd };
}

const ANIMALS = {
  wolf(g, m, p) {
    quad(g, m, p, { len: 1.0, h: 0.45, w: 0.36, y: 0.62, color: '#7d7d84', leg: 0.45, legR: 0.06 });
    const { head } = neckHead(g, m, { at: [0.72, 0.42], len: 0.22, ang: 0.9, r: 0.12, color: '#7d7d84', head: 0.17, snout: [0.07, 0.24, '#5c5c62'] });
    for (const sx of [-1, 1]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), mat('#5c5c62', m)); ear.position.set(sx * 0.07, 0.14, -0.02); head.add(ear); }
    const tail = seg(0.06, 0.02, 0.45, '#6a6a70', m); const t = pivot(0, 0.72, -0.48, tail); t.rotation.x = -0.6; g.add(t);
    return 1.0;
  },
  lion(g, m, p) {
    quad(g, m, p, { len: 1.5, h: 0.6, w: 0.5, y: 0.82, color: '#c9a052', leg: 0.62, legR: 0.09 });
    const { head } = neckHead(g, m, { at: [1.0, 0.6], len: 0.2, ang: 1.1, r: 0.18, color: '#c9a052', head: 0.24, snout: [0.1, 0.18, '#b48a40'] });
    const mane = blob(0.36, '#7a4a1e', m, 1, 1, 0.8, 7, 5); mane.position.set(0, 0.02, -0.08); head.add(mane);
    const tail = seg(0.03, 0.03, 0.7, '#c9a052', m); const t = pivot(0, 0.95, -0.72, tail); t.rotation.x = -0.4; g.add(t);
    const tuft = blob(0.07, '#5a3414', m); tuft.position.y = -0.7; tail.parent.add(tuft);
    return 1.4;
  },
  elephant(g, m, p) {
    quad(g, m, p, { len: 2.8, h: 1.7, w: 1.6, y: 2.1, color: '#8c8c90', leg: 1.4, legR: 0.3 });
    const head = blob(0.62, '#8c8c90', m, 1, 1.05, 0.9, 7, 5); head.position.set(0, 2.55, 1.5); g.add(head);
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.7), mat('#7a7a7e', m)); ear.position.set(sx * 0.62, 2.5, 1.25); ear.rotation.y = sx * 0.4; g.add(ear);
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.6, 5).rotateX(Math.PI / 2 + 0.6), mat('#f2eee0', m)); tusk.position.set(sx * 0.25, 2.05, 1.95); g.add(tusk);
    }
    let parent = g, y = 2.3, z = 1.95;
    for (let i = 0; i < 3; i++) { const t = seg(0.16 - i * 0.03, 0.13 - i * 0.03, 0.5, '#86868a', m); const pv = pivot(0, y, z, t); pv.rotation.x = 0.15 + i * 0.15; parent.add(pv); parent = pv; y = -0.5; z = 0; }
    const tail = seg(0.05, 0.03, 0.8, '#7a7a7e', m); const tp = pivot(0, 2.3, -1.4, tail); tp.rotation.x = -0.25; g.add(tp);
    return 3.2;
  },
  giraffe(g, m, p) {
    const body = quad(g, m, p, { len: 1.6, h: 0.9, w: 0.7, y: 2.0, color: '#d9a848', leg: 1.75, legR: 0.07, hoof: '#3a2a1a' });
    for (const [x, y, z] of [[0.36, 2.1, 0.3], [-0.36, 1.95, -0.2], [0.35, 1.9, -0.45], [-0.35, 2.15, 0.45], [0, 2.44, 0.1]]) { const spot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.26), mat('#8a5a24', m)); spot.position.set(x, y, z); if (!x) spot.rotation.z = Math.PI / 2; g.add(spot); }
    const { head } = neckHead(g, m, { at: [2.3, 0.62], len: 2.0, ang: 0.35, r: 0.13, color: '#d9a848', head: 0.2, snout: [0.08, 0.24] });
    for (const sx of [-1, 1]) { const oss = seg(0.025, 0.025, 0.16, '#5a3a1a', m); const o = pivot(sx * 0.07, 0.3, 0, oss); o.rotation.x = Math.PI; head.add(o); }
    return 4.6;
  },
  zebra(g, m, p) {
    quad(g, m, p, { len: 1.35, h: 0.7, w: 0.52, y: 1.2, color: '#f2f2f2', leg: 0.95, legR: 0.065, hoof: '#1a1a1a' });
    for (const z of [-0.45, -0.2, 0.05, 0.3, 0.5]) { const band = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.035, 4, 10).scale(0.95, 1.25, 1), mat('#1a1a1a', m)); band.position.set(0, 1.2, z); g.add(band); }
    const { neck } = neckHead(g, m, { at: [1.45, 0.55], len: 0.6, ang: 0.75, r: 0.13, color: '#f2f2f2', head: 0.18, snout: [0.09, 0.32, '#2a2a2a'] });
    const mane = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.1).translate(0, -0.3, -0.12), mat('#1a1a1a', m)); neck.add(mane);
    return 1.9;
  },
  camel(g, m, p) {
    quad(g, m, p, { len: 1.6, h: 0.8, w: 0.6, y: 1.7, color: '#b8925a', leg: 1.4, legR: 0.08 });
    const hump = blob(0.4, '#a8824e', m, 1, 1, 1.2, 6, 4); hump.position.set(0, 2.05, -0.05); g.add(hump);
    neckHead(g, m, { at: [1.8, 0.7], len: 0.9, ang: 0.6, r: 0.13, color: '#b8925a', head: 0.2, snout: [0.1, 0.3] });
    return 2.6;
  },
  penguin(g, m, p) {
    const body = blob(0.24, '#1e1e24', m, 1, 1.6, 0.9, 7, 5); body.position.y = 0.42;
    const belly = blob(0.2, '#f4f4f4', m, 0.9, 1.5, 0.7, 7, 5); belly.position.set(0, 0.4, 0.07);
    const head = blob(0.15, '#1e1e24', m); head.position.y = 0.82;
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 4).rotateX(Math.PI / 2), mat('#f08a1a', m)); beak.position.set(0, 0.8, 0.17);
    g.add(body, belly, head, beak);
    for (const sx of [-1, 1]) {
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.12), mat('#1e1e24', m)); fl.position.set(sx * 0.24, 0.45, 0); fl.rotation.z = sx * 0.3; g.add(fl);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.14), mat('#f08a1a', m)); foot.position.set(sx * 0.08, 0.02, 0.05); g.add(foot);
    }
    p.waddle = g.children[0];
    return 1.0;
  },
  flamingo(g, m, p) {
    const body = blob(0.26, '#f08aa8', m, 0.9, 0.75, 1.3, 6, 4); body.position.y = 1.15;
    g.add(body);
    p.legs = [];
    for (const sx of [-1, 1]) { const l = seg(0.025, 0.02, 0.95, '#e0607a', m, { sides: 4 }); const hip = pivot(sx * 0.06, 1.0, 0, l); p.legs.push(hip); g.add(hip); }
    const n1 = seg(0.05, 0.05, 0.45, '#f08aa8', m); const a = pivot(0, 1.22, 0.25, n1); a.rotation.x = 0.4 - Math.PI; g.add(a);
    const n2 = seg(0.045, 0.045, 0.4, '#f08aa8', m); const b = pivot(0, -0.45, 0, n2); b.rotation.x = 0.9; a.add(b);
    const head = blob(0.08, '#f08aa8', m); head.position.y = -0.42; b.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 4), mat('#1a1a1a', m)); beak.position.set(0, -0.48, 0.06); beak.rotation.x = 2.2; b.add(beak);
    return 1.9;
  },
  parrot(g, m, p) {
    const perch = seg(0.03, 0.03, 1.1, '#6a4a2a', m); perch.position.y = 1.1; g.add(perch);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5).rotateZ(Math.PI / 2), mat('#6a4a2a', m)); bar.position.y = 1.1; g.add(bar);
    const body = blob(0.12, '#d82020', m, 1, 1.5, 1); body.position.y = 1.3; g.add(body);
    const head = blob(0.09, '#d82020', m); head.position.set(0, 1.5, 0.03); g.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 4).rotateX(Math.PI / 2 + 0.5), mat('#f2eee0', m)); beak.position.set(0, 1.47, 0.12); g.add(beak);
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.16), mat('#2a5ad8', m)); w.position.set(sx * 0.12, 1.28, -0.02); g.add(w); }
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.04), mat('#f2c030', m)); tail.position.set(0, 1.05, -0.1); tail.rotation.x = -0.4; g.add(tail);
    p.bob = body;
    return 1.7;
  },
  monkey(g, m, p) { return ape(g, m, p, 0.55, '#7a5030', '#d9b08a'); },
  gorilla(g, m, p) { return ape(g, m, p, 1.0, '#2c2c30', '#4a4a50'); },
};

function ape(g, m, p, k, fur, face) {
  const body = blob(0.32 * k, fur, m, 1, 1.25, 0.85, 7, 5); body.position.y = 0.95 * k;
  const head = blob(0.2 * k, fur, m); head.position.set(0, 1.42 * k, 0.05 * k);
  const muzzle = blob(0.12 * k, face, m, 1, 0.8, 0.8); muzzle.position.set(0, 1.38 * k, 0.18 * k);
  g.add(body, head, muzzle);
  p.legs = [];
  for (const sx of [-1, 1]) {
    const arm = seg(0.08 * k, 0.07 * k, 0.85 * k, fur, m); const a = pivot(sx * 0.32 * k, 1.25 * k, 0.05 * k, arm); a.rotation.x = -0.25; g.add(a);
    const leg = seg(0.1 * k, 0.08 * k, 0.6 * k, fur, m); const l = pivot(sx * 0.16 * k, 0.62 * k, 0, leg); g.add(l);
    p.legs.push(l, a);
  }
  if (k < 0.8) { const tail = seg(0.04, 0.02, 0.6, fur, m); const t = pivot(0, 0.7 * k, -0.2 * k, tail); t.rotation.x = -2.2; g.add(t); }
  return 1.7 * k;
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
// anim is the action the entity is doing (chop, mine, fish, attack, cook, craft, smith, pray, ...).
export function animate(model, phase, amount, now, anim) {
  const p = model.parts;
  if (p.custom) { p.custom(phase, amount, now, anim); return; }
  if (p.legs) { p.legs.forEach((l, i) => { l.rotation.x = (l.userData.rx ??= l.rotation.x) + Math.sin(phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.45 * amount; }); return; }
  if (p.waddle) { model.group.children.forEach(c => { c.rotation.z = (c.userData.rz ??= c.rotation.z) + Math.sin(phase) * 0.15 * amount; }); return; }
  if (p.bob) { p.bob.position.y = 1.3 + Math.sin(now / 300) * 0.02; return; }
  if (p.duck) { p.duck.rotation.z = Math.sin(phase) * 0.12 * amount; return; }
  const s = Math.sin(phase) * 0.55 * amount;
  p.legL.rotation.x = -s; p.legR.rotation.x = s;
  p.kneeL.rotation.x = Math.max(0, s) * 1.1 + 0.05; p.kneeR.rotation.x = Math.max(0, -s) * 1.1 + 0.05;
  p.armL.rotation.x = s * 0.8; p.armR.rotation.x = -s * 0.8;
  p.elbowL.rotation.x = -0.25 - Math.max(0, -s) * 0.5; p.elbowR.rotation.x = -0.25 - Math.max(0, s) * 0.5;
  const breathe = Math.sin(now / 700) * 0.015 * (1 - amount);
  p.head.rotation.x = breathe;
  if (anim && amount < 0.5) {
    const t = now / 1000;
    if (anim === 'chop' || anim === 'mine' || anim === 'smith') { const sw = Math.sin(t * 7); p.armR.rotation.x = -1.6 - sw * 0.9; p.elbowR.rotation.x = -0.5; p.armL.rotation.x = -1.2 - sw * 0.6; }
    else if (anim === 'attack') { const sw = Math.max(0, Math.sin(t * 9)); p.armR.rotation.x = -0.3 - sw * 1.6; }
    else if (anim === 'fish') { p.armR.rotation.x = -0.9 + Math.sin(t * 2) * 0.1; p.armL.rotation.x = -0.9; p.elbowR.rotation.x = -0.4; }
    else if (anim === 'pray') { p.armR.rotation.x = -2.8; p.armL.rotation.x = -2.8; }
    else if (anim === 'pick' || anim === 'farm') { p.armR.rotation.x = -0.8 + Math.sin(t * 5) * 0.4; p.head.rotation.x = 0.4; }
    else { p.armR.rotation.x = -0.9 + Math.sin(t * 6) * 0.25; p.armL.rotation.x = -0.9 - Math.sin(t * 6) * 0.25; p.elbowR.rotation.x = p.elbowL.rotation.x = -0.6; }
  }
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
