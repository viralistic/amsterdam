// Turns OpenStreetMap chunks into OSRS-style terrain: flat-coloured ground texture, extruded buildings,
// low-poly trees and a 1 m collision grid used for click-to-walk pathfinding.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CHUNK } from '/shared/geo.js';

const PX = 2; // ground texture pixels per metre
const COLORS = {
  base: '#77705f', green: '#5e7a22', water: '#3d6690', paved: '#8d8576', bridge: '#8a7a64',
  road: '#5f5d58', foot: '#9a8f7c', cycle: '#94473b', rail: '#4d4339', tram: '#3b3b3b', footprint: '#3a332b',
};
const ROAD_W = { motorway: 12, trunk: 11, primary: 10, secondary: 9, tertiary: 7, unclassified: 6, residential: 6, living_street: 5, service: 4, pedestrian: 5, footway: 2.5, path: 2, cycleway: 2.5, steps: 2.5, track: 3 };
const FOOT = new Set(['footway', 'path', 'pedestrian', 'steps', 'living_street', 'track']);
const WALLS = ['#6e4130', '#5a3528', '#7d5236', '#64554a', '#8a7b66', '#4a3a31', '#8c5a39', '#3f3a36', '#9b8c74', '#734a3a'];
const ROOFS = ['#3c3734', '#4a3a30', '#55473d', '#3a3f45'];

const hash = (x, z) => { let h = (x * 374761393 + z * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export class World {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
    // old-school tree: leaning tapered trunk with two branch stubs, crown built from a few faceted clumps
    this.trunkGeo = mergeGeometries([
      new THREE.CylinderGeometry(0.16, 0.34, 3.2, 6).translate(0, 1.6, 0),
      new THREE.CylinderGeometry(0.05, 0.12, 1.2, 5).translate(0, 0.6, 0).rotateZ(0.9).translate(0.1, 2.2, 0),
      new THREE.CylinderGeometry(0.05, 0.11, 1.0, 5).translate(0, 0.5, 0).rotateX(-0.9).translate(0, 2.5, 0.05),
    ]);
    this.crownGeo = mergeGeometries([
      new THREE.IcosahedronGeometry(1.7, 0).scale(1.1, 0.8, 1.1).translate(0, 3.9, 0),
      new THREE.IcosahedronGeometry(1.2, 0).translate(1.0, 3.4, 0.4),
      new THREE.IcosahedronGeometry(1.1, 0).translate(-0.8, 3.5, -0.6),
      new THREE.IcosahedronGeometry(1.0, 0).translate(0.1, 4.7, -0.2),
    ].map(g => g.toNonIndexed()));
    this.trunkMat = new THREE.MeshLambertMaterial({ color: '#5a3e24', flatShading: true });
    this.crownMat = new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true });
    this.tuftGeo = new THREE.ConeGeometry(0.06, 0.32, 3).translate(0, 0.16, 0);
    this.tuftMat = new THREE.MeshLambertMaterial({ color: '#93a63e', flatShading: true });
    this.buildingMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide, map: facadeTexture() });
  }

  key(cx, cz) { return cx + ',' + cz; }

  update(px, pz) {
    const ccx = Math.floor(px / CHUNK), ccz = Math.floor(pz / CHUNK);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const k = this.key(ccx + dx, ccz + dz);
      const c = this.chunks.get(k);
      if (!c) this.load(ccx + dx, ccz + dz);
      else if (c.failed && performance.now() - c.failed > 30000) { this.unload(k); this.load(ccx + dx, ccz + dz); }
    }
    for (const [k, c] of this.chunks) if (Math.abs(c.cx - ccx) > 2 || Math.abs(c.cz - ccz) > 2) this.unload(k);
  }

  unload(k) {
    const c = this.chunks.get(k);
    if (!c) return;
    c.group.traverse(o => { if (o.geometry && o.geometry !== this.trunkGeo && o.geometry !== this.crownGeo && o.geometry !== this.tuftGeo) o.geometry.dispose(); if (o.material?.map) o.material.map.dispose(); });
    this.scene.remove(c.group);
    this.chunks.delete(k);
  }

  load(cx, cz) {
    const c = { cx, cz, group: new THREE.Group(), coll: null, ground: null, data: null, failed: 0 };
    this.chunks.set(this.key(cx, cz), c);
    this.scene.add(c.group);
    // placeholder ground while loading
    const ph = new THREE.Mesh(new THREE.PlaneGeometry(CHUNK, CHUNK).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: COLORS.base }));
    ph.position.set(cx * CHUNK + CHUNK / 2, -0.01, cz * CHUNK + CHUNK / 2);
    c.group.add(ph);
    fetch(`/api/chunk/${cx}/${cz}`).then(r => r.json()).then(data => {
      if (this.chunks.get(this.key(cx, cz)) !== c) return;
      if (!data.ok) { c.failed = performance.now(); return; }
      c.data = data;
      c.group.remove(ph); ph.geometry.dispose();
      this.build(c, data);
    }).catch(() => { c.failed = performance.now(); });
  }

  build(c, d) {
    const x0 = c.cx * CHUNK, z0 = c.cz * CHUNK;
    // --- ground texture
    const cv = document.createElement('canvas');
    cv.width = cv.height = CHUNK * PX;
    const g = cv.getContext('2d');
    g.scale(PX, PX);
    g.fillStyle = COLORS.base; g.fillRect(0, 0, CHUNK, CHUNK);
    const polys = (list, color) => { g.fillStyle = color; for (const rings of list) { g.beginPath(); for (const r of rings) ringPath(g, r); g.fill('evenodd'); } };
    polys(d.p, COLORS.paved);
    polys(d.g, COLORS.green);
    polys(d.w, COLORS.water);
    polys(d.ba, COLORS.bridge);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const roads = [...d.r].sort((a, b) => (FOOT.has(a[0]) ? 0 : 1) - (FOOT.has(b[0]) ? 0 : 1));
    for (const [kind, bridge, , co] of roads) {
      g.strokeStyle = kind === 'cycleway' ? COLORS.cycle : FOOT.has(kind) ? COLORS.foot : COLORS.road;
      if (bridge && !FOOT.has(kind) && kind !== 'cycleway') g.strokeStyle = COLORS.bridge;
      g.lineWidth = ROAD_W[kind] || 3;
      linePath(g, co); g.stroke();
    }
    for (const [kind, co] of d.rl) {
      g.strokeStyle = kind === 'rail' ? COLORS.rail : COLORS.tram;
      g.lineWidth = kind === 'rail' ? 3 : 0.4;
      linePath(g, co); g.stroke();
      if (kind !== 'rail') { g.save(); g.translate(1.4, 0); linePath(g, co); g.stroke(); g.restore(); }
    }
    g.fillStyle = COLORS.footprint;
    for (const [, , r] of d.b) { g.beginPath(); ringPath(g, r); g.fill(); }
    tileNoise(g, cv.width, x0, z0);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.anisotropy = 4;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(CHUNK, CHUNK).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: tex }));
    ground.position.set(x0 + CHUNK / 2, 0, z0 + CHUNK / 2);
    ground.receiveShadow = false;
    c.group.add(ground);
    c.ground = cv;

    // --- collision (1 px per metre; dark = blocked)
    const cc = document.createElement('canvas');
    cc.width = cc.height = CHUNK;
    const k = cc.getContext('2d', { willReadFrequently: true });
    k.fillStyle = '#fff'; k.fillRect(0, 0, CHUNK, CHUNK);
    k.fillStyle = '#000';
    for (const rings of d.w) { k.beginPath(); for (const r of rings) ringPath(k, r); k.fill('evenodd'); }
    k.fillStyle = '#fff'; k.strokeStyle = '#fff'; k.lineCap = 'round';
    for (const rings of d.ba) { k.beginPath(); for (const r of rings) ringPath(k, r); k.fill('evenodd'); }
    for (const [kind, bridge, , co] of d.r) if (bridge) { k.lineWidth = Math.max(2, ROAD_W[kind] || 3); linePath(k, co); k.stroke(); }
    k.fillStyle = '#000';
    for (const [, , r] of d.b) { k.beginPath(); ringPath(k, r); k.fill(); }
    k.strokeStyle = '#fff';
    for (const [kind, , passage, co] of d.r) if (passage) { k.lineWidth = Math.max(2, ROAD_W[kind] || 3); linePath(k, co); k.stroke(); }
    const px = k.getImageData(0, 0, CHUNK, CHUNK).data;
    c.coll = new Uint8Array(CHUNK * CHUNK);
    for (let i = 0; i < c.coll.length; i++) c.coll[i] = px[i * 4] < 128 ? 1 : 0;

    // --- buildings
    if (d.b.length) c.group.add(new THREE.Mesh(this.buildingGeometry(d.b, x0, z0), this.buildingMat));

    // --- trees
    const nt = d.t.length / 2;
    if (nt) {
      const trunks = new THREE.InstancedMesh(this.trunkGeo, this.trunkMat, nt);
      const crowns = new THREE.InstancedMesh(this.crownGeo, this.crownMat, nt);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
      const col = new THREE.Color();
      for (let i = 0; i < nt; i++) {
        const tx = d.t[i * 2] + x0, tz = d.t[i * 2 + 1] + z0;
        const h = hash(Math.round(tx * 10), Math.round(tz * 10));
        const sc = 0.8 + h * 0.6;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), h * 6.28);
        m.compose(p.set(tx, 0, tz), q, s.set(sc, sc, sc));
        trunks.setMatrixAt(i, m); crowns.setMatrixAt(i, m);
        crowns.setColorAt(i, col.set('#3d5f1a').offsetHSL((h - 0.5) * 0.05, 0, (h - 0.5) * 0.1));
      }
      c.group.add(trunks, crowns);
    }

    // --- grass tufts scattered over parks and lawns
    if (d.g.length) {
      const mk = document.createElement('canvas');
      mk.width = mk.height = 128;
      const mg = mk.getContext('2d', { willReadFrequently: true });
      mg.scale(0.5, 0.5);
      mg.fillStyle = '#fff';
      for (const rings of d.g) { mg.beginPath(); for (const r of rings) ringPath(mg, r); mg.fill('evenodd'); }
      const px = mg.getImageData(0, 0, 128, 128).data;
      const spots = [];
      for (let i = 0; i < 128 * 128 && spots.length < 3000; i++) {
        if (px[i * 4 + 3] < 128) continue;
        const gx = (i % 128) * 2, gz = Math.floor(i / 128) * 2;
        if (hash(gx + x0, gz + z0) < 0.45) spots.push([gx + hash(gz, gx) * 2, gz + hash(gx + 7, gz) * 2]);
      }
      if (spots.length) {
        const tufts = new THREE.InstancedMesh(this.tuftGeo, this.tuftMat, spots.length);
        const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
        spots.forEach(([lx, lz], i) => {
          const h = hash(Math.round(lx * 13), Math.round(lz * 17));
          q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), h * 6.28);
          m.compose(p3.set(lx + x0, 0, lz + z0), q, s3.setScalar(0.7 + h * 0.8));
          tufts.setMatrixAt(i, m);
        });
        c.group.add(tufts);
      }
    }
  }

  buildingGeometry(list, x0, z0) {
    const pos = [], col = [], uv = [];
    const c = new THREE.Color();
    const push = (x, y, z, color, u = 0.01, v = 0.01) => { pos.push(x, y, z); col.push(color.r, color.g, color.b); uv.push(u, v); };
    for (const [h, seed, r] of list) {
      let pts = [];
      for (let i = 0; i < r.length - 2; i += 2) pts.push(new THREE.Vector2(r[i] + x0, r[i + 1] + z0));
      if (pts.length < 3) continue;
      // make winding counter-clockwise when seen from above (x right, z down)
      if (THREE.ShapeUtils.area(pts) < 0) pts.reverse();
      const wall = c.set(WALLS[seed % WALLS.length]).clone();
      const roof = c.set(ROOFS[seed % ROOFS.length]).clone();
      let run = 0;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const shade = wall.clone().multiplyScalar(0.92 + 0.08 * hash(i, seed));
        // facade texture repeats every 4 m along the wall and every 3.2 m (one storey) upwards
        const u0 = run / 4, u1 = (run += a.distanceTo(b)) / 4, vt = h / 3.2;
        push(a.x, 0, a.y, shade, u0, 0); push(b.x, 0, b.y, shade, u1, 0); push(b.x, h, b.y, shade, u1, vt);
        push(a.x, 0, a.y, shade, u0, 0); push(b.x, h, b.y, shade, u1, vt); push(a.x, h, a.y, shade, u0, vt);
      }
      const tris = THREE.ShapeUtils.triangulateShape(pts, []);
      for (const [i, j, k] of tris) { push(pts[i].x, h, pts[i].y, roof); push(pts[k].x, h, pts[k].y, roof); push(pts[j].x, h, pts[j].y, roof); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    return geo;
  }

  blocked(x, z) {
    const c = this.chunks.get(this.key(Math.floor(x / CHUNK), Math.floor(z / CHUNK)));
    if (!c?.coll) return false;
    const lx = x - c.cx * CHUNK, lz = z - c.cz * CHUNK;
    return c.coll[lz * CHUNK + lx] === 1;
  }

  // OSRS-style breadth-first search in a 128x128 window around the start tile.
  findPath(sx, sz, tx, tz, range = 0) {
    const R = 64, W = R * 2 + 1;
    const idx = (x, z) => (z - sz + R) * W + (x - sx + R);
    const prev = new Int32Array(W * W).fill(-1);
    const queue = new Int32Array(W * W);
    let head = 0, tail = 0;
    prev[idx(sx, sz)] = idx(sx, sz);
    queue[tail++] = idx(sx, sz);
    let found = -1;
    const near = (x, z) => Math.max(Math.abs(x - tx), Math.abs(z - tz)) <= range;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    while (head < tail) {
      const cur = queue[head++];
      const cx = (cur % W) + sx - R, cz = Math.floor(cur / W) + sz - R;
      if (near(cx, cz)) { found = cur; break; }
      for (const [dx, dz] of dirs) {
        const nx = cx + dx, nz = cz + dz;
        if (Math.abs(nx - sx) > R || Math.abs(nz - sz) > R) continue;
        const ni = idx(nx, nz);
        if (prev[ni] !== -1 || this.blocked(nx, nz)) continue;
        if (dx && dz && (this.blocked(cx + dx, cz) || this.blocked(cx, cz + dz))) continue;
        prev[ni] = cur;
        queue[tail++] = ni;
      }
    }
    if (found < 0) {
      // unreachable: walk to the closest reachable tile within 10 tiles of the target
      let best = Infinity;
      for (let x = tx - 10; x <= tx + 10; x++) for (let z = tz - 10; z <= tz + 10; z++) {
        if (Math.abs(x - sx) > R || Math.abs(z - sz) > R) continue;
        const i = idx(x, z);
        if (prev[i] === -1) continue;
        const d = (x - tx) ** 2 + (z - tz) ** 2;
        if (d < best) { best = d; found = i; }
      }
      if (found < 0) return [];
    }
    const path = [];
    for (let i = found; i !== idx(sx, sz); i = prev[i]) path.push([(i % W) + sx - R, Math.floor(i / W) + sz - R]);
    return path.reverse();
  }
}

// One 4 m x 3.2 m facade bay: brick courses and a white-framed window. Tinted per building by vertex colour.
function facadeTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#e4e4e4';
  for (let y = 4; y < 64; y += 6) g.fillRect(0, y, 64, 1);
  g.fillStyle = '#f4f1ea'; g.fillRect(19, 12, 26, 34);
  g.fillStyle = '#2c3440'; g.fillRect(22, 15, 20, 28);
  g.fillStyle = '#f4f1ea'; g.fillRect(31, 15, 2, 28); g.fillRect(22, 28, 20, 2);
  g.fillStyle = '#fff'; g.fillRect(0, 56, 4, 8);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function ringPath(g, r) {
  g.moveTo(r[0], r[1]);
  for (let i = 2; i < r.length; i += 2) g.lineTo(r[i], r[i + 1]);
  g.closePath();
}

function linePath(g, co) {
  g.beginPath();
  g.moveTo(co[0], co[1]);
  for (let i = 2; i < co.length; i += 2) g.lineTo(co[i], co[i + 1]);
}

// Per-tile brightness jitter gives the ground that chunky old-school tile look.
function tileNoise(g, size, x0, z0) {
  const img = g.getImageData(0, 0, size, size);
  const d = img.data;
  for (let ty = 0; ty < CHUNK; ty++) for (let tx = 0; tx < CHUNK; tx++) {
    const f = 0.94 + hash(x0 + tx, z0 + ty) * 0.12;
    for (let py = 0; py < PX; py++) for (let pxx = 0; pxx < PX; pxx++) {
      const i = ((ty * PX + py) * size + tx * PX + pxx) * 4;
      d[i] *= f; d[i + 1] *= f; d[i + 2] *= f;
    }
  }
  g.putImageData(img, 0, 0);
}

export { COLORS };
