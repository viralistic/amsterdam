// Low-poly models of Dam square and the old centre: Royal Palace, Nationaal Monument, Nieuwe Kerk, De Bijenkorf, Oude Kerk.
// Built in local metres with +z as the front, then placed and rotated from shared/landmarks.js.
import * as THREE from 'three';
import { LANDMARK_MODELS } from '/shared/landmarks.js';
import { facadeTexture } from './buildings.js';
import { ENCLOSURES, ZOO_BOUNDS_WORLD, ZOO_CENTER, ZOO_ENTRANCE } from '/shared/zoo.js';

import { Builder } from './landmarks/builder.js';
import paleis from './landmarks/paleis.js';
import monument from './landmarks/monument.js';
import nieuwekerk from './landmarks/nieuwekerk.js';
import bijenkorf from './landmarks/bijenkorf.js';
import rangedguild from './landmarks/rangedguild.js';
import oudekerk from './landmarks/oudekerk.js';
import centraal from './landmarks/centraal.js';
import westerkerk from './landmarks/westerkerk.js';
import rijksmuseum from './landmarks/rijksmuseum.js';

export const BUILD = { paleis, monument, nieuwekerk, bijenkorf, rangedguild, oudekerk, centraal, westerkerk, rijksmuseum };

// window bay size (width, storey height) per landmark: palaces and churches have much bigger windows than houses
export const BAYS = { paleis: [5, 5.2], monument: [4, 3.2], nieuwekerk: [7, 10], bijenkorf: [5, 4.2], oudekerk: [7, 9], rangedguild: [5, 4] };


// Fence along a polyline: posts every 2.5 m and two plank rails.
function fence(b, pts, closed, color = '#d6cdb6', post = '#9a8a6a') {
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i], c = pts[(i + 1) % pts.length];
    const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
    for (let t = 0; t < len; t += 2.5) {
      const x = a[0] + (c[0] - a[0]) * t / len, z = a[1] + (c[1] - a[1]) * t / len;
      b.box(x - 0.09, x + 0.09, z - 0.09, z + 0.09, 0, 1.25, post, post, false);
    }
    for (const [y0, y1] of [[0.5, 0.62], [1.0, 1.12]]) b.quad([a[0], y0, a[1]], [c[0], y0, c[1]], [c[0], y1, c[1]], [a[0], y1, a[1]], color);
  }
}

function palm(b, x, z) {
  b.frustum(x, z, 0.28, 0.16, 0, 5.5, 5, '#7a5a34');
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
    b.tri([x, 5.6, z], [x + dx * 2.8 - dz * 0.5, 4.4, z + dz * 2.8 + dx * 0.5], [x + dx * 2.8 + dz * 0.5, 4.4, z + dz * 2.8 - dx * 0.5], i % 2 ? '#3d7a22' : '#4e8a2a');
  }
}

export function buildZoo(scene) {
  const b = new Builder();
  for (const e of ENCLOSURES) {
    fence(b, e.world, true);
    for (const [x, z] of e.palms || []) palm(b, x + ZOO_CENTER.x, z + ZOO_CENTER.z);
    if (e.ground === 'snow') for (const [dx, dz] of [[3, -10], [-4, -4]]) b.frustum(e.cx + dx, e.cz + dz, 2.2, 0.6, 0, 1.6, 6, '#eef2f5'); // ice rocks
    if (e.ground === 'sand' || e.ground === 'dirt') b.frustum(e.cx + 3, e.cz - 2, 1.6, 0.8, 0, 1.1, 5, '#8a8274'); // a rock to sit on
  }
  // outer fence with a gap for the gate on the west side
  const [x0, x1, z0, z1] = ZOO_BOUNDS_WORLD;
  const gz = ZOO_ENTRANCE.z + ZOO_CENTER.z;
  fence(b, [[x0, gz + 4], [x0, z1], [x1, z1], [x1, z0], [x0, z0], [x0, gz - 4]], false, '#3a3a3a', '#2a2a2a');
  // gate: two brick pillars and a lintel with the ARTIS sign
  for (const dz of [-4.5, 3.5]) b.box(x0 - 0.8, x0 + 0.8, gz + dz, gz + dz + 1, 0, 6, '#7a3f2b', '#c9bb9b');
  b.box(x0 - 0.5, x0 + 0.5, gz - 4.5, gz + 4.5, 5, 6.2, '#c9bb9b', '#c9bb9b', false);
  const mesh = new THREE.Mesh(b.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }));
  scene.add(mesh);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#1e3a20'; g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#f2d040'; g.font = 'bold 44px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('ARTIS', 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  sign.position.set(x0 - 0.55, 5.6, gz);
  sign.rotation.y = -Math.PI / 2;
  scene.add(sign);
}

export function buildLandmarks(scene) {
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide, map: facadeTexture() });
  const picks = [];
  for (const l of LANDMARK_MODELS) {
    const b = new Builder(BAYS[l.id]);
    const group = new THREE.Group();
    BUILD[l.id]?.(b, THREE, group, l);
    const mesh = new THREE.Mesh(b.geometry(), mat);
    mesh.userData.pick = { kind: 'scenery', name: l.name, ex: l.ex };
    group.add(mesh);
    group.traverse(o => { if (o.isMesh && o !== mesh) { o.userData.pick = mesh.userData.pick; picks.push(o); } });
    group.position.set(l.x, 0, l.z);
    group.rotation.y = l.rot;
    scene.add(group);
    picks.push(mesh);
  }
  return picks;
}
