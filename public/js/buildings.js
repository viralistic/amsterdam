// Generic Amsterdam buildings from OpenStreetMap footprints (canal houses and everything else).
// buildBuildings(list, x0, z0) receives a chunk's building list: [height, seed, ring, color?] where ring is a flat
// [x, z, x, z, ...] list in chunk-local metres (add x0/z0 for world coordinates); color is set for interior walls.
// It returns a THREE.Object3D for the whole chunk. See docs/LANDMARKS.md.
//
// Narrow footprints become canal houses: the street side is guessed from the open space around the footprint and
// gets a step, neck, bell, spout or cornice gable with real geometry for windows, door, stoop, shop front, awning,
// hoist beam and chimney. Large or irregular footprints become flat-roofed blocks with window bands.
// Everything is merged into a few vertex-coloured BufferGeometries per chunk (4 x 4 tiles for frustum culling)
// sharing one alpha-tested texture atlas (public/js/buildings/atlas.js).
import * as THREE from 'three';
import { atlasTexture, atlasMask, cell, band, C, DARK, WHITE_UV } from './buildings/atlas.js';

const TILE = 64; // metres per geometry tile

// ---------------------------------------------------------------- colours
const colCache = new Map();
const col = hex => { let c = colCache.get(hex); if (!c) { const t = new THREE.Color(hex); c = [t.r, t.g, t.b]; colCache.set(hex, c); } return c; };
const mul = (c, f) => [c[0] * f, c[1] * f, c[2] * f];
const WHITE = [1, 1, 1];
const pick = (rng, list) => { let t = 0; for (const [, w] of list) t += w; let r = rng() * t; for (const [v, w] of list) if ((r -= w) <= 0) return v; return list[0][0]; };

const BRICK = [['#6a3324', 3], ['#5c3a2b', 3], ['#7b3628', 2], ['#342a26', 1.6], ['#3b2a23', 2], ['#874a30', 1.2], ['#e7e2d4', 1.1], ['#d6c9a6', 0.8], ['#bfa77b', 0.6], ['#7a8486', 0.35], ['#33433a', 0.3], ['#5a2622', 0.4]];
const LIGHT = new Set(['#e7e2d4', '#d6c9a6', '#bfa77b', '#7a8486']);
const ROOF = [['#36383d', 3], ['#2b2d31', 2], ['#8a3b26', 1.4], ['#6e3223', 1.2], ['#4a3a30', 0.8]];
const TRIM = [['#f4f2ea', 8], ['#e9dfc4', 2]];
const DOOR = [['#1f3a2c', 3], ['#1b1b1d', 2], ['#4f1d18', 2], ['#1f2c45', 1.5], ['#6a4426', 1.5], ['#47596a', 1]];
const SHOP = [['#1d3328', 3], ['#1a1a1c', 2], ['#5b1f1a', 1.5], ['#24324d', 1.5], ['#f0ece2', 1], ['#7d5a32', 1]];
const STONE = '#8e8a83', STONE_DARK = '#5f5c58', WOOD = '#3a2a1e';
const BLOCK_BRICK = [['#7c3f2c', 3], ['#6a4a37', 2], ['#8d5b3e', 2], ['#5a3a2d', 2], ['#a88458', 1], ['#7a4d3c', 2], ['#b9a07a', 0.8]];
const BLOCK_MODERN = [['#b8b1a4', 2], ['#9e9a94', 2], ['#cbc3b0', 1.5], ['#7f7c78', 1.5], ['#d9d4c7', 1], ['#5f5a55', 1], ['#8a6e5a', 1.2]];

// ---------------------------------------------------------------- geometry sink
class Mesher {
  constructor() { this.nv = 0; this.ni = 0; this.P = new Float32Array(3 * 4096); this.K = new Uint16Array(3 * 4096); this.T = new Float32Array(2 * 4096); this.I = new Uint32Array(6144); }
  grow(nv, ni) {
    if (this.nv + nv > this.P.length / 3) {
      const n = Math.max((this.nv + nv) * 2, this.P.length / 3 * 2);
      const P = new Float32Array(n * 3); P.set(this.P); this.P = P;
      const K = new Uint16Array(n * 3); K.set(this.K); this.K = K;
      const T = new Float32Array(n * 2); T.set(this.T); this.T = T;
    }
    if (this.ni + ni > this.I.length) { const I = new Uint32Array(Math.max((this.ni + ni) * 2, this.I.length * 2)); I.set(this.I); this.I = I; }
  }
  v(p, c, u, w) {
    const i = this.nv++;
    this.P[i * 3] = p[0]; this.P[i * 3 + 1] = p[1]; this.P[i * 3 + 2] = p[2];
    this.K[i * 3] = Math.min(65535, c[0] * 65535); this.K[i * 3 + 1] = Math.min(65535, c[1] * 65535); this.K[i * 3 + 2] = Math.min(65535, c[2] * 65535);
    this.T[i * 2] = u; this.T[i * 2 + 1] = w;
    return i;
  }
  // a (bottom-left) b (bottom-right) c (top-right) d (top-left); uv = [u0, v0, u1, v1]
  quad(a, b, c, d, k, uv) {
    this.grow(4, 6);
    let i;
    if (uv) { i = this.v(a, k, uv[0], uv[1]); this.v(b, k, uv[2], uv[1]); this.v(c, k, uv[2], uv[3]); this.v(d, k, uv[0], uv[3]); }
    else { const [u, w] = WHITE_UV; i = this.v(a, k, u, w); this.v(b, k, u, w); this.v(c, k, u, w); this.v(d, k, u, w); }
    const I = this.I; let n = this.ni;
    I[n++] = i; I[n++] = i + 1; I[n++] = i + 2; I[n++] = i; I[n++] = i + 2; I[n++] = i + 3;
    this.ni = n;
  }
  tri(a, b, c, k, uva, uvb, uvc) {
    this.grow(3, 3);
    const [u, w] = WHITE_UV;
    const i = this.v(a, k, uva ? uva[0] : u, uva ? uva[1] : w); this.v(b, k, uvb ? uvb[0] : u, uvb ? uvb[1] : w); this.v(c, k, uvc ? uvc[0] : u, uvc ? uvc[1] : w);
    this.I[this.ni++] = i; this.I[this.ni++] = i + 1; this.I[this.ni++] = i + 2;
  }
  // planar polygon given as 3D points, triangulated from its 2D projection
  poly(pts3, pts2, k) {
    const tris = THREE.ShapeUtils.triangulateShape(pts2.map(p => new THREE.Vector2(p[0], p[1])), []);
    this.grow(pts3.length, tris.length * 3);
    const [u, w] = WHITE_UV;
    const base = this.nv;
    for (const p of pts3) this.v(p, k, u, w);
    for (const [a, b, c] of tris) { this.I[this.ni++] = base + a; this.I[this.ni++] = base + b; this.I[this.ni++] = base + c; }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.P.slice(0, this.nv * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.K.slice(0, this.nv * 3), 3, true));
    g.setAttribute('uv', new THREE.BufferAttribute(this.T.slice(0, this.nv * 2), 2));
    g.setIndex(new THREE.BufferAttribute(this.I.slice(0, this.ni), 1));
    g.computeBoundingSphere();
    return g;
  }
}

// A vertical facade plane: origin o (left end as seen from outside), u along it to the right, n outward.
// at(s, y, d): s metres along, y up, d outward from the wall.
class Frame {
  constructor(ox, oz, ux, uz) { this.ox = ox; this.oz = oz; this.ux = ux; this.uz = uz; this.nx = -uz; this.nz = ux; }
  at(s, y, d = 0) { return [this.ox + this.ux * s + this.nx * d, y, this.oz + this.uz * s + this.nz * d]; }
}
// frame for the wall from P to Q whose outside is towards normal (nx, nz)
function frameFor(px, pz, qx, qz, nx, nz) {
  const ux = nz, uz = -nx; // right-hand direction when looking at the wall from outside
  const sp = px * ux + pz * uz, sq = qx * ux + qz * uz;
  return sp <= sq ? new Frame(px, pz, ux, uz) : new Frame(qx, qz, ux, uz);
}
const rect = (m, F, s0, s1, y0, y1, d, k, uv) => m.quad(F.at(s0, y0, d), F.at(s1, y0, d), F.at(s1, y1, d), F.at(s0, y1, d), k, uv);
// box in frame coordinates; d0 < d1 (d1 is the outer face). Faces: front, top, sides, optional bottom/back.
function box(m, F, s0, s1, y0, y1, d0, d1, k, bottom = false, back = false) {
  const A = (s, y, d) => F.at(s, y, d);
  m.quad(A(s0, y0, d1), A(s1, y0, d1), A(s1, y1, d1), A(s0, y1, d1), k);
  m.quad(A(s0, y1, d1), A(s1, y1, d1), A(s1, y1, d0), A(s0, y1, d0), mul(k, 1.08));
  m.quad(A(s0, y0, d0), A(s0, y0, d1), A(s0, y1, d1), A(s0, y1, d0), mul(k, 0.9));
  m.quad(A(s1, y0, d1), A(s1, y0, d0), A(s1, y1, d0), A(s1, y1, d1), mul(k, 0.9));
  if (bottom) m.quad(A(s0, y0, d0), A(s1, y0, d0), A(s1, y0, d1), A(s0, y0, d1), mul(k, 0.75));
  if (back) m.quad(A(s1, y0, d0), A(s0, y0, d0), A(s0, y1, d0), A(s1, y1, d0), k);
}

// ---------------------------------------------------------------- footprint helpers
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function signedArea(xs, zs) { let a = 0; for (let i = 0, n = xs.length; i < n; i++) { const j = (i + 1) % n; a += xs[i] * zs[j] - xs[j] * zs[i]; } return a / 2; }
function pip(xs, zs, x, z) {
  let inside = false;
  for (let i = 0, n = xs.length, j = n - 1; i < n; j = i++) {
    if ((zs[i] > z) !== (zs[j] > z) && x < (xs[j] - xs[i]) * (z - zs[i]) / (zs[j] - zs[i]) + xs[i]) inside = !inside;
  }
  return inside;
}
// Douglas-Peucker for a closed ring; returns indices of kept vertices
function simplify(xs, zs, tol) {
  const n = xs.length;
  if (n <= 4) return [...Array(n).keys()];
  let far = 0, fd = -1;
  for (let i = 1; i < n; i++) { const d = (xs[i] - xs[0]) ** 2 + (zs[i] - zs[0]) ** 2; if (d > fd) { fd = d; far = i; } }
  const keep = new Uint8Array(n); keep[0] = keep[far] = 1;
  const rec = (a, b) => { // indices along the ring from a to b (b may wrap)
    const ax = xs[a], az = zs[a], bx = xs[b % n], bz = zs[b % n];
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1;
    let best = -1, bd = tol;
    for (let i = a + 1; i < b; i++) { const k = i % n; const d = Math.abs((xs[k] - ax) * dz - (zs[k] - az) * dx) / L; if (d > bd) { bd = d; best = i; } }
    if (best >= 0) { keep[best % n] = 1; rec(a, best); rec(best, b); }
  };
  rec(0, far); rec(far, n);
  const out = []; for (let i = 0; i < n; i++) if (keep[i]) out.push(i);
  return out;
}
// distance from (px, pz) along (dx, dz) to the ring's boundary (first crossing beyond 0.05 m)
function rayExit(xs, zs, px, pz, dx, dz) {
  let best = Infinity;
  for (let i = 0, n = xs.length; i < n; i++) {
    const j = (i + 1) % n, ex = xs[j] - xs[i], ez = zs[j] - zs[i];
    const den = dx * ez - dz * ex;
    if (Math.abs(den) < 1e-9) continue;
    const wx = xs[i] - px, wz = zs[i] - pz;
    const t = (wx * ez - wz * ex) / den, s = (wx * dz - wz * dx) / den;
    if (t > 0.05 && s >= 0 && s <= 1 && t < best) best = t;
  }
  return best;
}

// ---------------------------------------------------------------- entry points
let material = null;
export function buildBuildings(list, x0, z0) {
  if (!material) {
    material = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide, map: atlasTexture(), alphaTest: 0.5, emissive: 0x000000 });
    // Night lighting (content/atmosphere) drives `emissive`; the glow mask must stay the one that matches this atlas,
    // so a mask written for another texture layout is ignored here.
    const mask = atlasMask();
    Object.defineProperty(material, 'emissiveMap', { get: () => mask, set: () => {}, configurable: true });
  }
  const group = new THREE.Group();
  for (const g of buildGeometries(list, x0, z0)) {
    const mesh = new THREE.Mesh(g, material);
    mesh.matrixAutoUpdate = false;
    group.add(mesh);
  }
  return group;
}

// One BufferGeometry per non-empty 64 m tile of the chunk.
export function buildGeometries(list, x0, z0) {
  const B = [];
  for (const [h, seed, r, color] of list) {
    let xs = [], zs = [];
    for (let i = 0; i + 1 < r.length; i += 2) {
      const x = r[i] + x0, z = r[i + 1] + z0, n = xs.length;
      if (n && Math.abs(x - xs[n - 1]) < 0.05 && Math.abs(z - zs[n - 1]) < 0.05) continue;
      xs.push(x); zs.push(z);
    }
    while (xs.length > 1 && Math.abs(xs[0] - xs[xs.length - 1]) < 0.05 && Math.abs(zs[0] - zs[zs.length - 1]) < 0.05) { xs.pop(); zs.pop(); }
    if (xs.length < 3) continue;
    let area = signedArea(xs, zs);
    if (area < 0) { xs.reverse(); zs.reverse(); area = -area; } // counter-clockwise in (x, z)
    let mnx = Infinity, mxx = -Infinity, mnz = Infinity, mxz = -Infinity, cx = 0, cz = 0;
    for (let i = 0; i < xs.length; i++) { mnx = Math.min(mnx, xs[i]); mxx = Math.max(mxx, xs[i]); mnz = Math.min(mnz, zs[i]); mxz = Math.max(mxz, zs[i]); cx += xs[i]; cz += zs[i]; }
    B.push({ h, seed, color, xs, zs, area, mnx, mxx, mnz, mxz, cx: cx / xs.length, cz: cz / xs.length });
  }
  // spatial grid for "is this point inside some building" queries
  const GS = 16, grid = new Map();
  B.forEach((b, i) => {
    for (let gx = Math.floor(b.mnx / GS); gx <= Math.floor(b.mxx / GS); gx++) for (let gz = Math.floor(b.mnz / GS); gz <= Math.floor(b.mxz / GS); gz++) {
      const k = gx * 65536 + gz; let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i);
    }
  });
  let ex0 = Infinity, ex1 = -Infinity, ez0 = Infinity, ez1 = -Infinity;
  for (const b of B) { ex0 = Math.min(ex0, b.mnx - 4); ex1 = Math.max(ex1, b.mxx + 4); ez0 = Math.min(ez0, b.mnz - 4); ez1 = Math.max(ez1, b.mxz + 4); }
  const ctx = {
    x0, z0, B,
    // index of a building containing (x, z) other than `self`, or -1
    hit(x, z, self) {
      const a = grid.get(Math.floor(x / GS) * 65536 + Math.floor(z / GS));
      if (a) for (const i of a) { if (i === self) continue; const b = B[i]; if (x < b.mnx || x > b.mxx || z < b.mnz || z > b.mxz) continue; if (pip(b.xs, b.zs, x, z)) return i; }
      return -1;
    },
    // outside the footprints' extent we know nothing (the neighbouring chunk's buildings are not here)
    known(x, z) { return x > ex0 && x < ex1 && z > ez0 && z < ez1; },
  };
  const tiles = new Map();
  B.forEach((b, i) => {
    const tk = clamp(Math.floor((b.cx - x0) / TILE), -1, 4) * 16 + clamp(Math.floor((b.cz - z0) / TILE), -1, 4);
    let m = tiles.get(tk); if (!m) tiles.set(tk, m = new Mesher());
    const rng = mulberry(b.seed * 7919 + Math.round(b.cx * 13) * 31 + Math.round(b.cz * 17));
    if (b.color) return plain(m, b, col(b.color));
    if (b.area < 16 || b.h < 4.5) return shed(m, b, rng);
    const front = b.area < 750 ? findFront(ctx, b, i) : null;
    if (front) canalHouse(m, ctx, b, i, front, rng);
    else block(m, b, rng);
  });
  return [...tiles.values()].filter(m => m.ni).map(m => m.geometry());
}

// ---------------------------------------------------------------- street side
// Picks the facade side of a narrow footprint: a 3-13.5 m side that is not a shared wall, whose neighbours' facades
// continue in line with it, and that looks across the shortest open space (a street rather than a back garden).
function findFront(ctx, b, self) {
  const { xs, zs } = b;
  const keep = simplify(xs, zs, 0.35);
  if (keep.length < 3 || keep.length > 10) return null;
  const px = keep.map(i => xs[i]), pz = keep.map(i => zs[i]), n = px.length;
  let best = null;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, dx = px[j] - px[i], dz = pz[j] - pz[i], L = Math.hypot(dx, dz);
    if (L < 3 || L > 13.5) continue;
    const ux = dx / L, uz = dz / L, nx = uz, nz = -ux; // outward normal of a CCW ring
    const mx = (px[i] + px[j]) / 2, mz = (pz[i] + pz[j]) / 2;
    // shared wall?
    let shared = 0;
    for (const f of [0.2, 0.5, 0.8]) if (ctx.hit(px[i] + dx * f + nx * 1.2, pz[i] + dz * f + nz * 1.2, self) >= 0) shared++;
    if (shared >= 2) continue;
    // depth of a rectangle inward from this side
    let D = Infinity;
    for (const f of [0.08, 0.5, 0.92]) D = Math.min(D, rayExit(xs, zs, px[i] + dx * f - nx * 0.02, pz[i] + dz * f - nz * 0.02, -nx, -nz));
    if (!(D >= 4.5)) continue;
    D = Math.min(D, 32);
    if (L * D < b.area * 0.45) continue; // the body would only be a small part of the footprint
    // open space in front
    let clear = 70;
    for (const d of [2.5, 5, 8, 12, 17, 23, 30, 38, 48, 60]) {
      const qx = mx + nx * d, qz = mz + nz * d;
      if (!ctx.known(qx, qz)) { clear = Math.min(clear, 45); break; }
      if (ctx.hit(qx, qz, self) >= 0 || pip(xs, zs, qx, qz)) { clear = d; break; }
    }
    if (clear <= 2.5) continue;
    // neighbours whose facade continues this line
    let aligned = 0;
    for (const sg of [-1, 1]) {
      const ex = mx + ux * sg * (L / 2 + 1.3), ez = mz + uz * sg * (L / 2 + 1.3);
      if (ctx.hit(ex - nx * 1.2, ez - nz * 1.2, self) >= 0 && ctx.hit(ex + nx * 1.2, ez + nz * 1.2, self) < 0) aligned++;
    }
    const score = clear - 11 * aligned - shared * 6 + (L > D * 1.25 ? 7 : 0);
    if (!best || score < best.score) best = { score, i, j, L, D, nx, nz };
  }
  if (!best) return null;
  const { i, j, L, nx, nz } = best;
  let D = best.D;
  const F = frameFor(px[i], pz[i], px[j], pz[j], nx, nz);
  // the body is the whole footprint when that is a convex quadrilateral with near-right angles at the front
  let rear = null, quad = false;
  if (n === 4) {
    const a = (j + 1) % n, c = (j + 2) % n; // corner after j (adjacent to j), corner adjacent to i
    const leftIsI = F.ox === px[i] && F.oz === pz[i];
    const [lx, lz, rx, rz] = leftIsI ? [px[c], pz[c], px[a], pz[a]] : [px[a], pz[a], px[c], pz[c]];
    const okSide = (sx, sz, tx, tz) => { const ex = tx - sx, ez = tz - sz, l = Math.hypot(ex, ez); return l > 3 && -(ex * nx + ez * nz) / l > 0.82; };
    if (okSide(F.ox, F.oz, lx, lz) && okSide(F.ox + F.ux * L, F.oz + F.uz * L, rx, rz)) { rear = [lx, lz, rx, rz]; quad = true; }
  }
  if (!rear) rear = [F.ox - nx * D, F.oz - nz * D, F.ox + F.ux * L - nx * D, F.oz + F.uz * L - nz * D];
  else D = Math.max(-((rear[0] - F.ox) * nx + (rear[1] - F.oz) * nz), -((rear[2] - F.ox) * nx + (rear[3] - F.oz) * nz));
  return { F, w: L, D, rear, quad };
}

// ---------------------------------------------------------------- canal house
const GABLES_NARROW = [['spout', 3], ['neck', 3], ['step', 2], ['bell', 2], ['point', 1]];
const GABLES_MID = [['step', 3], ['neck', 3.5], ['bell', 2.5], ['spout', 0.6], ['cornice', 2.2], ['point', 0.5]];
const GABLES_WIDE = [['cornice', 5], ['neck', 2], ['bell', 1], ['step', 1.2]];

function canalHouse(m, ctx, b, self, front, rng) {
  const { F, w, rear } = front;
  const nx = F.nx, nz = F.nz;
  // ---- style
  const gable = b.h < 7 ? (w < 7 ? 'point' : 'cornice') : pick(rng, w < 4.8 ? GABLES_NARROW : w < 8.6 ? GABLES_MID : w <= 10.5 ? GABLES_WIDE : [['cornice', 1]]);
  const wallHex = pick(rng, BRICK), light = LIGHT.has(wallHex);
  const wall = mul(col(wallHex), 0.93 + rng() * 0.14);
  const sideWall = mul(wall, 0.86);
  const trim = light && rng() < 0.4 ? col(pick(rng, [['#2f4a3c', 1], ['#3f4448', 1], ['#5a2622', 0.5]])) : col(pick(rng, TRIM));
  const stone = light ? col('#f2efe6') : col(rng() < 0.75 ? '#efebe1' : '#d9ccad');
  const roof = mul(col(pick(rng, ROOF)), 0.9 + rng() * 0.2);
  const doorC = col(pick(rng, DOOR));
  const winCell = pick(rng, [[C.SASH, 4], [C.PANES, 3.5], [C.PLAIN, 2], [C.ARCH, 0.5]]);
  const low = b.h < 7;
  const ground = low ? 'flat' : pick(rng, [['raised', 5.5], ['shop', 2.6], ['flat', 1.6]]);
  const raised = ground === 'raised';
  const shutters = ground !== 'shop' && rng() < 0.22 ? (rng() < 0.6 ? C.SHUT_G : C.SHUT_R) : 0;

  // ---- storeys
  const He = clamp(b.h, 3.2, 40);
  const g0 = raised ? 1.0 : 0;
  let gTop = low ? He : raised ? 4.3 : 3.9;
  if (gTop > He - 2.2) gTop = He;
  const nUp = gTop >= He ? 0 : Math.max(1, Math.round((He - gTop) / 3.1));
  const sH = nUp ? (He - gTop) / nUp : 0;
  const nc = w < 4.3 ? 2 : w < 7.2 ? 3 : w < 9.6 ? 4 : 5, bw = w / nc;
  const ww = clamp(bw * 0.5, 0.75, 1.25);
  const sc = i => (i + 0.5) * bw;
  const glow = rng() * 0.7 + 0.15; // share of this house's windows lit at night
  const win = k => cell(DARK[k] !== undefined && rng() > glow ? DARK[k] : k);

  // ---- body walls (front wall up to the eaves; sides and rear)
  const [rlx, rlz, rrx, rrz] = rear;
  const A0 = F.at(0, 0), B0 = F.at(w, 0), AH = F.at(0, He), BH = F.at(w, He);
  const RL0 = [rlx, 0, rlz], RR0 = [rrx, 0, rrz], RLH = [rlx, He, rlz], RRH = [rrx, He, rrz];
  m.quad(A0, B0, BH, AH, wall);
  m.quad(RL0, A0, AH, RLH, sideWall);
  m.quad(B0, RR0, RRH, BH, sideWall);
  m.quad(RR0, RL0, RLH, RRH, mul(sideWall, 0.95));
  // annex: the rest of an irregular footprint as a lower flat-roofed volume
  if (!front.quad) {
    const bodyArea = w * front.D;
    if (b.area - bodyArea > 6) {
      const hA = clamp(He * 0.55, 3, He - 0.5);
      walls(m, b.xs, b.zs, 0, hA, sideWall);
      flatRoof(m, b.xs, b.zs, hA, mul(col('#4b4844'), 1));
    }
  }

  // ---- ground floor
  let doorBay = rng() < 0.5 ? 0 : nc - 1;
  if (nc >= 3 && (nc % 2 === 1) && (gable === 'cornice' ? rng() < 0.6 : rng() < 0.12)) doorBay = (nc - 1) >> 1;
  if (raised) {
    rect(m, F, 0, w, 0, g0 - 0.02, 0.02, col(STONE_DARK));
    rect(m, F, 0, w, g0 - 0.02, g0 + 0.12, 0.03, stone); // plinth ledge
  } else if (ground !== 'shop') rect(m, F, 0, w, 0, 0.4, 0.02, col(STONE_DARK));
  if (ground === 'shop') {
    const shopC = col(pick(rng, SHOP));
    const ds = sc(doorBay), dw = Math.min(1.1, bw * 0.75);
    rect(m, F, ds - dw / 2, ds + dw / 2, 0, 2.6, 0.05, shopC, cell(C.SHOPDOOR));
    for (let i = 0; i < nc; i++) if (i !== doorBay) rect(m, F, i * bw + 0.08, (i + 1) * bw - 0.08, 0.15, 3.0, 0.05, shopC, win(C.SHOP));
    rect(m, F, 0.12, w - 0.12, 3.05, 3.6, 0.07, col(pick(rng, SHOP)), cell(C.SIGN));
    if (rng() < 0.6) { // awning over the shop windows
      const s0 = doorBay === 0 ? bw + 0.05 : 0.1, s1 = doorBay === nc - 1 ? w - bw - 0.05 : w - 0.1;
      if (s1 - s0 > 0.8) {
        const c = cell(pick(rng, [[C.AWN_R, 1], [C.AWN_G, 1], [C.AWN_B, 0.7], [C.AWN_Y, 0.5]]));
        const vMid = c[1] + (c[3] - c[1]) * 0.12;
        m.quad(F.at(s0, 2.45, 1.45), F.at(s1, 2.45, 1.45), F.at(s1, 3.0, 0.06), F.at(s0, 3.0, 0.06), WHITE, [c[0], vMid, c[2], c[3]]);
        m.quad(F.at(s0, 2.15, 1.45), F.at(s1, 2.15, 1.45), F.at(s1, 2.45, 1.45), F.at(s0, 2.45, 1.45), WHITE, [c[0], c[1], c[2], vMid]);
      }
    }
  } else {
    const ds = sc(doorBay), dw = Math.min(1.15, bw * 0.72), dTop = Math.min(gTop - 0.3, g0 + 2.55);
    rect(m, F, ds - dw / 2 - 0.13, ds + dw / 2 + 0.13, g0, dTop + 0.14, 0.03, trim);
    rect(m, F, ds - dw / 2, ds + dw / 2, g0, dTop, 0.05, doorC, cell(C.DOOR));
    if (raised) { // stoop: landing and a lower step
      const sw = Math.min(bw * 0.95, dw + 0.5) / 2;
      box(m, F, ds - sw, ds + sw, 0, g0, 0, 0.75, col(STONE));
      rect(m, F, ds - sw, ds + sw, 0, g0 * 0.5, 1.35, col(STONE)); // lower step: front and tread only
      m.quad(F.at(ds - sw, g0 * 0.5, 1.35), F.at(ds + sw, g0 * 0.5, 1.35), F.at(ds + sw, g0 * 0.5, 0.75), F.at(ds - sw, g0 * 0.5, 0.75), mul(col(STONE), 1.08));
    }
    const wy0 = g0 + (raised ? 0.45 : 0.85), wy1 = gTop - 0.35;
    for (let i = 0; i < nc; i++) {
      if (i === doorBay) continue;
      if (wy1 - wy0 > 0.8) {
        if (shutters) { const sw2 = Math.min(ww * 2, bw * 0.98) / 2; rect(m, F, sc(i) - sw2, sc(i) + sw2, wy0, wy1, 0.05, WHITE, win(shutters)); }
        else rect(m, F, sc(i) - ww / 2, sc(i) + ww / 2, wy0, wy1, 0.04, trim, win(winCell));
      }
      if (raised) rect(m, F, sc(i) - ww * 0.4, sc(i) + ww * 0.4, 0.15, 0.82, 0.04, WHITE, win(C.BASEMENT));
    }
  }
  if (nUp && rng() < 0.45) rect(m, F, 0, w, gTop - 0.08, gTop + 0.08, 0.04, stone); // string course
  // ---- upper storeys
  for (let k = 0; k < nUp; k++) {
    const base = gTop + k * sH, top = k === nUp - 1 && nUp >= 3;
    const wh = clamp(sH * (top ? 0.52 : 0.6), 1.1, 2.1), y0 = base + Math.max(0.4, (sH - wh) * 0.42);
    const wk = top ? ww * 0.92 : ww;
    for (let i = 0; i < nc; i++) rect(m, F, sc(i) - wk / 2, sc(i) + wk / 2, y0, y0 + wh, 0.04, trim, win(winCell));
  }

  // ---- gable / cornice and roof
  const D = front.D;
  let R, inset, beam = null;
  if (gable === 'cornice') {
    const corn = rng() < 0.75 ? stone : col(pick(rng, [['#3d342c', 1], ['#2a3a31', 1]]));
    box(m, F, -0.05, w + 0.05, He - 0.3, He + 0.32, 0, 0.42, corn, true);
    R = clamp(w * 0.42, 2.2, 5);
    inset = Math.min(R * 0.9, D * 0.45);
    if (w >= 6 && rng() < 0.6) { // raised attic with pediment, hatch and hoist beam
      const aw = clamp(w * 0.36, 2.2, 3.8), y = He + 0.32;
      const out = [[-aw / 2, 0], [-aw / 2, 1.2], [-aw / 2 - 0.12, 1.2], [-aw / 2 - 0.12, 1.36], [0, 2.1], [aw / 2 + 0.12, 1.36], [aw / 2 + 0.12, 1.2], [aw / 2, 1.2], [aw / 2, 0]];
      const ped = [[-aw / 2 - 0.12, 1.2], [aw / 2 + 0.12, 1.2], [aw / 2 + 0.12, 1.36], [0, 2.1], [-aw / 2 - 0.12, 1.36]];
      gablePolys(m, F, w / 2, y, [{ pts: [[-aw / 2, 0], [aw / 2, 0], [aw / 2, 1.2], [-aw / 2, 1.2]], k: wall }, { pts: ped, k: corn }], out, out.map(() => corn), 0.3);
      if (rng() < 0.7) { rect(m, F, w / 2 - 0.5, w / 2 + 0.5, y + 0.1, y + 1.1, 0.04, doorC, cell(C.HATCH)); beam = y + 1.22; }
      else rect(m, F, w / 2 - 0.45, w / 2 + 0.45, y + 0.15, y + 1.05, 0.04, WHITE, cell(C.OCULUS));
    }
  } else {
    const G = gableShape(gable, w, rng);
    const coping = gable === 'step' ? (rng() < 0.7 ? stone : wall) : stone;
    const polys = G.polys.map(p => ({ pts: p.pts, k: p.trim ? stone : wall }));
    gablePolys(m, F, w / 2, He, polys, G.outline, G.edgeTrim.map(t => t === 2 ? coping : t ? stone : wall), 0.32);
    // roof: steep, hidden behind the gable where the outline allows
    let lim = Infinity;
    for (const [x, y] of G.outline) if (Math.abs(x) < w / 2 - 0.02) lim = Math.min(lim, y / (1 - Math.abs(x) / (w / 2)));
    R = clamp(Math.max(lim * 0.97, w * 0.5), 2, G.top - 0.35);
    inset = 0.15;
    // gable windows: rows that fit inside the outline, the top one a hoist hatch
    const rows = [];
    for (let y = 0.45; rows.length < 2;) {
      const gh = rows.length ? 1.25 : clamp(sH * 0.5, 1.2, 1.6), top = y + gh;
      if (top > G.top - 0.45) break;
      const avail = G.halfWidth(y, top + 0.2) - 0.25;
      if (avail < 0.42) break;
      rows.push({ y, top, avail });
      y = top + 0.7;
    }
    const hoist = rng() < 0.8;
    rows.forEach((r, ri) => {
      const last = ri === rows.length - 1 && (rows.length > 1 || r.avail < 1.6);
      if (r.avail >= 2.3 && !(last && hoist)) {
        const gw = Math.min(ww, r.avail * 0.45);
        for (const sg of [-1, 1]) rect(m, F, w / 2 + sg * r.avail * 0.5 - gw / 2, w / 2 + sg * r.avail * 0.5 + gw / 2, He + r.y, He + r.top, 0.04, trim, win(winCell));
      } else if (last && hoist) {
        const gw = Math.min(1.0, r.avail * 2 - 0.1);
        rect(m, F, w / 2 - gw / 2, w / 2 + gw / 2, He + r.y, He + r.top, 0.04, doorC, cell(C.HATCH));
        if (r.top + 0.45 < G.top && G.halfWidth(r.top + 0.12, r.top + 0.4) > 0.25) beam = He + r.top + 0.12;
      } else {
        const gw = Math.min(ww, r.avail * 2 - 0.1);
        rect(m, F, w / 2 - gw / 2, w / 2 + gw / 2, He + r.y, He + r.top, 0.04, trim, win(gable === 'neck' && ri === 1 ? C.OCULUS : winCell));
      }
    });
    if (hoist && !beam && G.top > 2) beam = He + G.top - 0.75;
  }
  if (beam) box(m, F, w / 2 - 0.11, w / 2 + 0.11, beam, beam + 0.24, -0.1, 1.15, col(WOOD), true);

  // roof: ridge from the facade to the rear wall
  const fm = F.at(w / 2, He + R, -inset), rm = [(rlx + rrx) / 2, He + R, (rlz + rrz) / 2];
  const AF = gable === 'cornice' ? AH : F.at(0, He, -inset), BF = gable === 'cornice' ? BH : F.at(w, He, -inset);
  const [rv0, rv1] = band('ROOF');
  const lenL = Math.hypot(rlx - AF[0], rlz - AF[2]) / 24, lenR = Math.hypot(rrx - BF[0], rrz - BF[2]) / 24;
  m.quad(RLH, AF, fm, rm, roof, [lenL, rv0, 0, rv1]);
  m.quad(BF, RRH, rm, fm, mul(roof, 0.92), [0, rv0, lenR, rv1]);
  if (gable === 'cornice') m.tri(AH, BH, fm, mul(roof, 1.05), [0, rv0], [w / 24, rv0], [w / 48, rv1]);
  else m.tri(AF, BF, fm, sideWall);
  m.tri(RRH, RLH, rm, mul(sideWall, 0.95)); // rear gable
  // chimney
  if (rng() < 0.45) {
    const s = rng() < 0.5 ? w * 0.25 : w * 0.75, t = D * (0.5 + rng() * 0.3);
    const yr = He + R * (1 - Math.abs(s - w / 2) / (w / 2));
    box(m, F, s - 0.3, s + 0.3, yr - 0.5, Math.max(yr + 1.1, He + R + 0.5), -t - 0.4, -t + 0.4, col(rng() < 0.5 ? '#5a2e22' : '#3b2f2a'), false, true);
  }

  // ---- rear facade and exposed side walls
  // rear wall normal from its own edge (the rear of a quadrilateral footprint need not be parallel to the front)
  let rnx = -nx, rnz = -nz;
  { const ex = rlx - rrx, ez = rlz - rrz, l = Math.hypot(ex, ez) || 1; rnx = ez / l; rnz = -ex / l; if (rnx * nx + rnz * nz > 0) { rnx = -rnx; rnz = -rnz; } }
  const rearOpen = (() => { const mx = (rlx + rrx) / 2 + rnx * 1.5, mz = (rlz + rrz) / 2 + rnz * 1.5; return ctx.hit(mx, mz, self) < 0 && !pip(b.xs, b.zs, mx, mz); })();
  if (rearOpen) {
    const Fr = frameFor(rrx, rrz, rlx, rlz, rnx, rnz), wr = Math.hypot(rlx - rrx, rlz - rrz);
    const ncr = nc >= 5 ? 3 : 2, bwr = wr / ncr, wwr = clamp(bwr * 0.45, 0.75, 1.2);
    for (let k = nUp ? 1 : 0; k <= nUp; k++) {
      const base = k === 0 ? g0 : gTop + (k - 1) * sH, hh = k === 0 ? gTop - g0 : sH;
      const wh = clamp(hh * 0.55, 1.1, 2.0), y0 = base + Math.max(0.5, (hh - wh) * 0.45);
      for (let i = 0; i < ncr; i++) rect(m, Fr, (i + 0.5) * bwr - wwr / 2, (i + 0.5) * bwr + wwr / 2, y0, y0 + wh, 0.04, trim, win(C.PLAIN));
    }
    if (R > 2.4) rect(m, Fr, wr / 2 - 0.45, wr / 2 + 0.45, He + 0.4, He + Math.min(1.5, R * 0.45), 0.04, trim, win(C.GWIN));
  }
  for (const [sx, sz, tx, tz, sg] of [[F.ox, F.oz, rlx, rlz, -1], [F.ox + F.ux * w, F.oz + F.uz * w, rrx, rrz, 1]]) {
    const ex = tx - sx, ez = tz - sz, L = Math.hypot(ex, ez);
    let onx = ez / L, onz = -ex / L; // outward: towards -u on the left side, +u on the right
    if ((onx * F.ux + onz * F.uz) * sg < 0) { onx = -onx; onz = -onz; }
    let open = 0;
    for (const f of [0.25, 0.5, 0.75]) { const qx = sx + ex * f + onx * 1.3, qz = sz + ez * f + onz * 1.3; if (ctx.hit(qx, qz, self) < 0 && !pip(b.xs, b.zs, qx, qz)) open++; }
    if (open < 3 || L < 4) continue;
    const Fs = frameFor(sx, sz, tx, tz, onx, onz), nw = Math.min(5, Math.floor(L / 3.4)), bws = L / nw;
    for (let k = 1; k <= nUp; k++) {
      const base = gTop + (k - 1) * sH, wh = clamp(sH * 0.55, 1.1, 1.9), y0 = base + Math.max(0.45, (sH - wh) * 0.45);
      for (let i = 0; i < nw; i++) rect(m, Fs, (i + 0.5) * bws - 0.5, (i + 0.5) * bws + 0.5, y0, y0 + wh, 0.04, trim, win(C.PLAIN));
    }
  }
}

// Gable outlines in facade coordinates (x from -w/2 to w/2, y up from the eaves).
// polys: coloured faces; outline: left-bottom to right-bottom along the top; edgeTrim per outline segment
// (0 wall, 1 sandstone trim, 2 coping); halfWidth(y0, y1): free half-width inside the outline between two heights.
function gableShape(type, w, rng) {
  const hw = w / 2, L = [], trims = [];
  const polys = [];
  let top;
  const P = (x, y, t = 0) => { L.push([x, y]); trims.push(t); };
  if (type === 'step') {
    const k = w < 5 ? 2 : w < 7.5 ? 3 : 4, tw = Math.max(0.9, w * 0.2);
    top = clamp(w * 0.95, 3.4, 7.6);
    const dy = top / (k + 1), dx = (hw - tw / 2) / k;
    let x = -hw, y = 0;
    for (let i = 0; i < k; i++) { P(x, y, 0); y += dy; P(x, y, 2); x += dx; }
    P(x, y, 0); P(x, top, 2);
  } else if (type === 'neck') {
    const elev = w >= 7.2 && rng() < 0.7 ? 2.8 : 0;
    const nw = clamp(w * 0.44, 1.7, 3.1), a = hw - nw / 2;
    const hs = elev + clamp(w * 0.24, 1.1, 1.9), hn = hs + clamp(1.2 + w * 0.16, 1.8, 2.7);
    top = hn + 1.0;
    if (elev) P(-hw, 0, 0);
    for (const th of [0, 30, 62]) { const r = th * Math.PI / 180; P(-nw / 2 - a * Math.cos(r), elev + (hs - elev) * Math.sin(r), 1); }
    P(-nw / 2, hs, 0); P(-nw / 2, hn, 1); P(-nw / 2 - 0.18, hn, 1); P(-nw / 2 - 0.18, hn + 0.22, 1);
    if (elev) polys.push({ pts: [[-hw, 0], [hw, 0], [hw, elev], [-hw, elev]] });
    polys.push({ pts: [[-nw / 2, elev], [nw / 2, elev], [nw / 2, hn], [-nw / 2, hn]] });
    const sh = [[-hw, elev]]; for (const th of [30, 62]) { const r = th * Math.PI / 180; sh.push([-nw / 2 - a * Math.cos(r), elev + (hs - elev) * Math.sin(r)]); }
    sh.push([-nw / 2, hs], [-nw / 2, elev]);
    polys.push({ pts: sh, trim: 1 }, { pts: sh.map(([x, y]) => [-x, y]), trim: 1 });
    polys.push({ pts: [[-nw / 2 - 0.18, hn], [nw / 2 + 0.18, hn], [nw / 2 + 0.18, hn + 0.22], [0, top], [-nw / 2 - 0.18, hn + 0.22]], trim: 1 });
  } else if (type === 'bell') {
    const nw = clamp(w * 0.5, 1.8, 3.4), a = hw - nw / 2;
    top = clamp(w * 0.95, 3.6, 7.2);
    const hb = top * 0.4, hn = top * 0.6, ry = top - 0.3 - hn;
    for (const th of [0, 30, 60]) { const r = th * Math.PI / 180; P(-hw + a * Math.sin(r), hb - hb * Math.cos(r), 1); }
    P(-nw / 2, hb, 1);
    for (const ph of [0, 40, 70]) { const r = ph * Math.PI / 180; P(-nw / 2 * Math.cos(r), hn + ry * Math.sin(r), 1); }
    P(-0.2, top - 0.3, 1); P(-0.2, top, 1);
  } else if (type === 'spout') {
    const sw = clamp(w * 0.36, 1.2, 2.0);
    top = clamp(w * 1.05, 3.6, 6.8);
    const hsp = top * 0.58;
    P(-hw, 0, 1); P(-sw / 2, hsp, 0); P(-sw / 2, top - 0.45, 1); P(-sw * 0.3, top - 0.12, 1);
  } else { // point: plain triangle with white barge boards
    top = clamp(w * 0.85, 2.6, 6.5);
    P(-hw, 0, 1);
  }
  // mirror the left half (step and bell gables end in a flat top, the others in an apex)
  const n = L.length;
  const outline = L.slice(), edgeTrim = trims.slice();
  if (type !== 'step' && type !== 'bell') { outline.push([0, top]); edgeTrim.push(trims[n - 1]); }
  for (let i = n - 1; i >= 0; i--) { outline.push([-L[i][0], L[i][1]]); edgeTrim.push(i > 0 ? trims[i - 1] : 0); }
  if (type !== 'neck') polys.unshift({ pts: outline }); // the neck gable is built from its parts
  // half-width available at heights between y0 and y1 (inner-most left boundary)
  const left = outline.slice(0, n + 1);
  const xAt = y => {
    let x = -Infinity;
    for (let i = 0; i + 1 < left.length; i++) {
      const [ax, ay] = left[i], [bx, by] = left[i + 1];
      if (y < Math.min(ay, by) - 1e-6 || y > Math.max(ay, by) + 1e-6) continue;
      const xx = Math.abs(by - ay) < 1e-6 ? Math.max(ax, bx) : ax + (bx - ax) * (y - ay) / (by - ay);
      x = Math.max(x, xx);
    }
    return x === -Infinity ? 0 : x;
  };
  const halfWidth = (y0, y1) => {
    let h = Math.min(-xAt(y0), -xAt(y1));
    for (const [x, y] of left) if (y > y0 && y < y1) h = Math.min(h, -x);
    return y1 > top ? 0 : h;
  };
  return { polys, outline, edgeTrim, top, halfWidth };
}

// Draws gable faces (in facade coords centred at s = cx, y from y0) and extrudes the outline backwards by `t`.
function gablePolys(m, F, cx, y0, polys, outline, edgeCols, t) {
  for (const p of polys) {
    if (!p.pts.length) continue;
    m.poly(p.pts.map(([x, y]) => F.at(cx + x, y0 + y, 0)), p.pts, p.k);
  }
  for (let i = 0; i + 1 < outline.length; i++) {
    const [ax, ay] = outline[i], [bx, by] = outline[i + 1];
    if (Math.abs(ax - bx) < 1e-4 && Math.abs(ay - by) < 1e-4) continue;
    const k = edgeCols[i] || edgeCols[0];
    const up = bx - ax > 0.01 && Math.abs(by - ay) < 0.01;
    m.quad(F.at(cx + ax, y0 + ay, 0), F.at(cx + bx, y0 + by, 0), F.at(cx + bx, y0 + by, -t), F.at(cx + ax, y0 + ay, -t), up ? mul(k, 1.06) : mul(k, 0.92));
  }
}

// ---------------------------------------------------------------- other building types
function walls(m, xs, zs, y0, y1, k, jitter = 0) {
  for (let i = 0, n = xs.length; i < n; i++) {
    const j = (i + 1) % n, kk = jitter ? mul(k, 1 - jitter + 2 * jitter * ((i * 7919 % 13) / 13)) : k;
    m.quad([xs[i], y0, zs[i]], [xs[j], y0, zs[j]], [xs[j], y1, zs[j]], [xs[i], y1, zs[i]], kk);
  }
}
function flatRoof(m, xs, zs, y, k) {
  m.poly(xs.map((x, i) => [x, y, zs[i]]), xs.map((x, i) => [x, zs[i]]), k);
}
// mitred offset of a CCW ring (positive d = outward)
function offsetRing(xs, zs, d) {
  const n = xs.length, ox = [], oz = [];
  for (let i = 0; i < n; i++) {
    const p = (i + n - 1) % n, q = (i + 1) % n;
    let ax = xs[i] - xs[p], az = zs[i] - zs[p], bx = xs[q] - xs[i], bz = zs[q] - zs[i];
    const la = Math.hypot(ax, az) || 1, lb = Math.hypot(bx, bz) || 1;
    const n1x = az / la, n1z = -ax / la, n2x = bz / lb, n2z = -bx / lb;
    let mx = n1x + n2x, mz = n1z + n2z; const dot = 1 + n1x * n2x + n1z * n2z;
    const f = d / Math.max(dot, 0.5);
    ox.push(xs[i] + mx * f); oz.push(zs[i] + mz * f);
  }
  return [ox, oz];
}

function plain(m, b, k) { // interior and dungeon walls: plain, windowless
  walls(m, b.xs, b.zs, 0, b.h, k, 0.04);
  flatRoof(m, b.xs, b.zs, b.h, mul(k, 0.7));
}

function shed(m, b, rng) {
  const k = mul(col(pick(rng, [['#6b4a34', 2], ['#5c3a2b', 2], ['#7d746a', 1], ['#3f4a3a', 1]])), 0.95 + rng() * 0.1);
  walls(m, b.xs, b.zs, 0, b.h, k, 0.05);
  flatRoof(m, b.xs, b.zs, b.h, col('#4a4744'));
}

function block(m, b, rng) {
  const { xs, zs, h } = b;
  const modern = rng() < (h > 18 ? 0.65 : 0.4);
  const wall = mul(col(pick(rng, modern ? BLOCK_MODERN : BLOCK_BRICK)), 0.94 + rng() * 0.12);
  const bandName = modern ? 'B' : rng() < 0.7 ? 'A' : 'A2';
  const [bv0, bv1] = band(bandName);
  const shops = h >= 8 && rng() < 0.45;
  const [gv0, gv1] = band(shops ? 'G' : bandName);
  const shopC = shops ? col(pick(rng, SHOP)) : WHITE;
  const trim = modern ? col('#7a7f84') : col(rng() < 0.8 ? '#ece6d8' : '#cdbf9f');
  const H = Math.max(3, h), ground = H >= 7 ? 4 : 0;
  const nUp = Math.max(0, Math.floor((H - ground - 0.7) / 3.2));
  walls(m, xs, zs, 0, H, wall, 0.04);
  const BAY = 3.2;
  for (let i = 0, n = xs.length; i < n; i++) {
    const j = (i + 1) % n, ex = xs[j] - xs[i], ez = zs[j] - zs[i], L = Math.hypot(ex, ez);
    const nb = Math.floor(L / BAY);
    if (nb < 1) continue;
    const F = frameFor(xs[i], zs[i], xs[j], zs[j], ez / L, -ex / L);
    const s0 = (L - nb * BAY) / 2, s1 = s0 + nb * BAY, u1 = nb / 4;
    if (ground) rect(m, F, s0, s1, 0, ground, 0.05, shopC, [0, gv0, u1, gv1]);
    for (let k = 0; k < nUp; k++) rect(m, F, s0, s1, ground + k * 3.2, ground + (k + 1) * 3.2, 0.05, WHITE, [0, bv0, u1, bv1]);
    if (!ground && !nUp) rect(m, F, s0, s1, 0.2, Math.min(H - 0.3, 3.4), 0.05, WHITE, [0, bv0, u1, bv1]);
  }
  // cornice band and parapet coping
  const [ox, oz] = offsetRing(xs, zs, modern ? 0.12 : 0.32);
  const [ix, iz] = offsetRing(xs, zs, -0.3);
  const yc0 = H - (modern ? 0.35 : 0.65), yc1 = H - (modern ? 0.1 : 0.25);
  for (let i = 0, n = xs.length; i < n; i++) {
    const j = (i + 1) % n;
    m.quad([ox[i], yc0, oz[i]], [ox[j], yc0, oz[j]], [ox[j], yc1, oz[j]], [ox[i], yc1, oz[i]], trim);
    m.quad([ox[i], yc1, oz[i]], [ox[j], yc1, oz[j]], [xs[j], yc1, zs[j]], [xs[i], yc1, zs[i]], mul(trim, 1.05));
    m.quad([xs[i], H, zs[i]], [xs[j], H, zs[j]], [ix[j], H, iz[j]], [ix[i], H, iz[i]], mul(trim, 0.9));
  }
  flatRoof(m, xs, zs, H - 0.45, mul(col(modern ? '#5a5853' : '#4b4946'), 0.95 + rng() * 0.1));
  if (modern && b.area > 250 && pip(xs, zs, b.cx, b.cz)) { // lift / stair housing
    const F = new Frame(b.cx - 1.5, b.cz - 1.5, 1, 0);
    box(m, F, 0, 3, H - 0.5, H + 2.2, -3, 0, mul(wall, 0.9), false, true);
  }
}

// One 4 m x 3.2 m facade bay: brick courses and a white-framed window. Tinted per building by vertex colour.
// (Used by the hand-built landmarks in public/js/landmarks.js.)
export function facadeTexture() {
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
