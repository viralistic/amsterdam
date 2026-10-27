// centraal: hand-built landmark model. Local metres, +z is the front facade, y up.
// Amsterdam Centraal station (Cuypers, 1889): long red-brick neo-Renaissance facade facing the city with two towers (clock + wind vane), central entrance, train sheds behind.
// Layout along x (west = -x): end pavilion | outer wing | gabled pavilion | inner wing | clock tower | central block | wind tower | ... mirrored.
// The arched iron-and-glass train shed fills the back half (z < 0) and rises behind the roofs.
import * as THREE from 'three';
import { Builder, GOLD } from './builder.js';

const BR = '#a24f35', BR2 = '#8a4130', ST = '#e3d6b1', ST2 = '#c8b78f', PL = '#9d9078', SL = '#434b54', SL2 = '#373e46';
const GL = '#27313d', FR = '#ebe4cf', DK = '#2a2622', WD = '#5b3a24', IRON = '#3f4952', GLASS = '#9fb6c4', GLASS2 = '#b9cbd5', ZINC = '#6f7a84';
const RED = '#b8322a', BLUE = '#2d4f86', BLACK = '#1d1d1f', WHITE = '#f1ede2';

const rect = (u0, y0, u1, y1) => [[u0, y0], [u1, y0], [u1, y1], [u0, y1]];
function archPts(cx, y0, w, ys, n) {
  const r = w / 2, p = [[cx - r, y0], [cx + r, y0]];
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI; p.push([cx + r * Math.cos(a), ys + r * Math.sin(a)]); }
  return p;
}
const circ = (cx, cy, r, n, rot = 0) => Array.from({ length: n }, (_, i) => { const a = rot + i / n * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });

// A wall plane: u runs along the wall (to the right seen from outside), y up, o out of the wall.
// dir 0 faces +z, 1 faces +x, 2 faces -z, 3 faces -x.
class Fac {
  constructor(b, ox, oz, dir) {
    this.b = b; this.ox = ox; this.oz = oz;
    this.U = [[1, 0], [0, -1], [-1, 0], [0, 1]][dir]; this.N = [[0, 1], [1, 0], [0, -1], [-1, 0]][dir];
    this.boxes = [];
  }
  P(u, y, o = 0) { return [this.ox + u * this.U[0] + o * this.N[0], y, this.oz + u * this.U[1] + o * this.N[1]]; }
  q(a, b, c, d, color) { this.b.quad(this.P(...a), this.P(...b), this.P(...c), this.P(...d), color); }
  poly(pts, o, color, holes = []) {
    const v = pts.map(p => new THREE.Vector2(p[0], p[1])), hs = holes.map(h => h.map(p => new THREE.Vector2(p[0], p[1])));
    const all = v.concat(...hs);
    for (const [i, j, k] of THREE.ShapeUtils.triangulateShape(v, hs)) this.b.tri(this.P(all[i].x, all[i].y, o), this.P(all[j].x, all[j].y, o), this.P(all[k].x, all[k].y, o), color);
  }
  sides(pts, o0, o1, color) {
    for (let i = 0; i < pts.length; i++) { const a = pts[i], c = pts[(i + 1) % pts.length]; this.q([a[0], a[1], o0], [c[0], c[1], o0], [c[0], c[1], o1], [a[0], a[1], o1], color); }
  }
  ext(pts, o0, o1, color, side = color) { this.poly(pts, o1, color); this.sides(pts, o0, o1, side); }
  // block standing out of the wall: front, top and ends (the underside is never seen from the game camera)
  slab(u0, u1, y0, y1, o0, o1, color, side = color) {
    this.q([u0, y0, o1], [u1, y0, o1], [u1, y1, o1], [u0, y1, o1], color);
    if (o1 - o0 < 0.07) return;
    this.q([u0, y1, o0], [u1, y1, o0], [u1, y1, o1], [u0, y1, o1], side);
    this.q([u0, y0, o0], [u0, y1, o0], [u0, y1, o1], [u0, y0, o1], side);
    this.q([u1, y0, o0], [u1, y1, o0], [u1, y1, o1], [u1, y0, o1], side);
  }
  flat(u0, u1, y0, y1, o, color) { this.q([u0, y0, o], [u1, y0, o], [u1, y1, o], [u0, y1, o], color); }
  // horizontal band from u0 to u1 that is interrupted where it would cross an opening of the last wall()
  band(u0, u1, y0, y1, o, color, side = color) {
    const cuts = this.boxes.filter(b => b[2] < y1 && b[3] > y0).sort((a, b) => a[0] - b[0]);
    let u = u0;
    for (const c of cuts) { if (c[0] > u) this.slab(u, Math.min(c[0], u1), y0, y1, 0, o, color, side); u = Math.max(u, c[1]); }
    if (u < u1) this.slab(u, u1, y0, y1, 0, o, color, side);
  }
  disc(cu, cy, o, r, n, color) { this.poly(circ(cu, cy, r, n), o, color); }
  bar(cu, cy, ang, len, wid, o, color, back = 0) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy * wid / 2, ny = dx * wid / 2;
    const a = [cu - dx * back, cy - dy * back], b = [cu + dx * len, cy + dy * len];
    this.poly([[a[0] + nx, a[1] + ny], [a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny]], o, color);
  }
  shape(w) {
    if (w.kind === 'arch') return archPts(w.cx, w.y0, w.w, w.y0 + w.h - w.w / 2, w.n || 6);
    if (w.kind === 'circle') return circ(w.cx, w.y0 + w.w / 2, w.w / 2, w.n || 10);
    return rect(w.cx - w.w / 2, w.y0, w.cx + w.w / 2, w.y0 + w.h);
  }
  // wall rectangle with recessed windows, doors and arches cut into it
  // (windows with flat: true are painted on instead of cut in, for facades that are rarely seen up close)
  wall(u0, u1, y0, y1, color, wins = []) {
    const cut = wins.filter(w => !w.flat), shapes = cut.map(w => this.shape(w));
    this.poly(rect(u0, y0, u1, y1), 0, color, shapes);
    this.boxes = wins.map(w => [w.cx - w.w / 2 - 0.5, w.cx + w.w / 2 + 0.5, w.y0 - 0.3, w.y0 + (w.kind === 'circle' ? w.w : w.h) + 0.6]);
    cut.forEach((w, i) => this.opening(w, shapes[i]));
    wins.filter(w => w.flat).forEach(w => this.opening(w, this.shape(w)));
  }
  opening(w, pts) {
    const d = w.flat ? -0.03 : w.d ?? 0.45, l = w.cx - w.w / 2, r = w.cx + w.w / 2, top = w.y0 + (w.kind === 'circle' ? w.w : w.h);
    const ys = w.kind === 'arch' ? top - w.w / 2 : top;
    if (!w.flat) this.sides(pts, -d, 0, w.rev || ST2);
    if (w.glass !== null) this.poly(pts, -d, w.glass || GL);
    const ob = -d + 0.02, of = -d + 0.12, fr = w.frame || FR;
    if (w.door) { // panelled double door with a glazed fanlight above
      const dh = Math.min(w.door, ys - w.y0);
      this.slab(l + 0.15, r - 0.15, w.y0, w.y0 + dh, ob, ob + 0.08, WD);
      this.slab(w.cx - 0.06, w.cx + 0.06, w.y0, w.y0 + dh, ob, ob + 0.14, '#3f2818');
      this.slab(l, r, w.y0 + dh, w.y0 + dh + 0.3, ob, of, fr);
      for (let k = 1; k < 4; k++) { const u = l + (r - l) * k / 4; this.slab(u - 0.07, u + 0.07, w.y0 + dh, top - 0.1, ob, of, fr); }
    } else if (w.mull === 'big') {
      for (const f of [-0.25, 0, 0.25]) this.flat(w.cx + f * w.w - 0.1, w.cx + f * w.w + 0.1, w.y0, f ? ys + Math.sqrt(0.25 - f * f) * w.w * 0.98 - 0.1 : top - 0.1, of, fr);
      for (const t of [0.33, 0.66]) this.flat(l, r, w.y0 + (ys - w.y0) * t - 0.1, w.y0 + (ys - w.y0) * t + 0.1, of, fr);
      this.flat(l, r, ys - 0.12, ys + 0.12, of, fr);
    } else if (w.kind === 'circle') {
      this.flat(w.cx - 0.07, w.cx + 0.07, w.y0 + 0.05, top - 0.05, of, fr);
      this.flat(l + 0.05, r - 0.05, w.y0 + w.w / 2 - 0.07, w.y0 + w.w / 2 + 0.07, of, fr);
    } else if (w.mull !== 0) {
      this.flat(w.cx - 0.08, w.cx + 0.08, w.y0, top - 0.05, of, fr);
      const ty = w.kind === 'arch' ? ys : w.y0 + w.h * 0.68;
      this.flat(l, r, ty - 0.08, ty + 0.08, of, fr);
    }
    if (w.sill !== false && !w.door) this.slab(l - 0.18, r + 0.18, w.y0 - 0.26, w.y0, 0, 0.26, ST);
    if (w.kind === 'arch' && w.vous !== false) { // voussoirs, alternating stone and brick
      const n = w.n || 6, rr = w.w / 2, t = w.vt ?? 0.5, s = 0.1;
      for (let i = 0; i < n; i++) {
        const a0 = i / n * Math.PI, a1 = (i + 1) / n * Math.PI, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const p = [[w.cx + rr * c0, ys + rr * s0], [w.cx + (rr + t) * c0, ys + (rr + t) * s0], [w.cx + (rr + t) * c1, ys + (rr + t) * s1], [w.cx + rr * c1, ys + rr * s1]];
        const col = w.vc || (i % 2 ? BR2 : ST);
        this.poly(p, s, col);
        if (t > 0.6) this.q([p[1][0], p[1][1], 0], [p[2][0], p[2][1], 0], [p[2][0], p[2][1], s], [p[1][0], p[1][1], s], col);
      }
      if (w.key !== false) this.slab(w.cx - 0.28, w.cx + 0.28, top - 0.1, top + t + 0.15, 0, 0.18, w.key || ST);
    }
    if (w.kind === 'rect' && w.lintel !== false) this.slab(l - 0.3, r + 0.3, top, top + 0.5, 0, 0.14, ST);
    if (w.kind === 'circle') { const n = w.n || 10, rr = w.w / 2, t = 0.35; for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, cy = w.y0 + rr; this.poly([[w.cx + rr * Math.cos(a0), cy + rr * Math.sin(a0)], [w.cx + (rr + t) * Math.cos(a0), cy + (rr + t) * Math.sin(a0)], [w.cx + (rr + t) * Math.cos(a1), cy + (rr + t) * Math.sin(a1)], [w.cx + rr * Math.cos(a1), cy + rr * Math.sin(a1)]], 0.08, ST); } }
  }
}

// --- small world-space pieces ---
// open-ended prism or cone around (cx, cz), no caps
function shell(b, cx, cz, r0, r1, y0, y1, n, color, rot = Math.PI / n) {
  const a = b.ring(cx, cz, r0, n, rot), c = b.ring(cx, cz, r1, n, rot);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (r1 < 0.01) b.tri([a[i][0], y0, a[i][1]], [a[j][0], y0, a[j][1]], [cx, y1, cz], color); else b.quad([a[i][0], y0, a[i][1]], [a[j][0], y0, a[j][1]], [c[j][0], y1, c[j][1]], [c[i][0], y1, c[i][1]], color); }
}
function ball(b, x, y, z, r, color = GOLD) { shell(b, x, z, 0.001, r, y - r, y, 5, color); shell(b, x, z, r, 0, y, y + r, 5, color); }
function pinnacle(b, x, y, z, r, h, color = ST) {
  shell(b, x, z, r, r, y, y + h * 0.45, 4, color);
  shell(b, x, z, r * 1.15, 0, y + h * 0.45, y + h, 4, color);
  ball(b, x, y + h + 0.15, z, r * 0.5);
}
function lathe(b, cx, cz, prof, n) { for (let i = 0; i + 1 < prof.length; i++) shell(b, cx, cz, prof[i][0], prof[i + 1][0], prof[i][1], prof[i + 1][1], n, prof[i][2] || SL); }
// plain walls on the given sides of a box ('N' = -z, 'E' = +x, 'W' = -x, 'S' = +z)
function walls(b, x0, x1, z0, z1, y0, y1, color, sides) {
  if (sides.includes('S')) b.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], color);
  if (sides.includes('N')) b.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], color);
  if (sides.includes('E')) b.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], color);
  if (sides.includes('W')) b.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], color);
}
// pitched roof, ridge along x, eaves at ye on z0/z1, ridge yr; ends closed with roof-coloured triangles
function roofX(b, x0, x1, z0, z1, ye, yr, color = SL, end = SL2, back = SL2) {
  const zm = (z0 + z1) / 2;
  b.quad([x0, ye, z1], [x1, ye, z1], [x1, yr, zm], [x0, yr, zm], color);
  b.quad([x0, ye, z0], [x1, ye, z0], [x1, yr, zm], [x0, yr, zm], back);
  b.tri([x0, ye, z0], [x0, yr, zm], [x0, ye, z1], end); b.tri([x1, ye, z0], [x1, yr, zm], [x1, ye, z1], end);
  b.quad([x0, yr, zm], [x1, yr, zm], [x1, yr + 0.45, zm], [x0, yr + 0.45, zm], IRON); // iron cresting
}
// pitched roof, ridge along z
function roofZ(b, x0, x1, z0, z1, ye, yr, back = BR) {
  const xm = (x0 + x1) / 2;
  b.quad([x0, ye, z0], [x0, ye, z1], [xm, yr, z1], [xm, yr, z0], SL2);
  b.quad([x1, ye, z0], [x1, ye, z1], [xm, yr, z1], [xm, yr, z0], SL);
  b.tri([x0, ye, z0], [xm, yr, z0], [x1, ye, z0], back);
  b.quad([xm, yr, z0], [xm, yr, z1], [xm, yr + 0.45, z1], [xm, yr + 0.45, z0], IRON);
}
// dormer standing on a roof that slopes up away from facade F; front plane at o = of, base height yb
function dormer(b, F, cu, yb, of, w = 2.2, h = 2.3) {
  const l = cu - w / 2, r = cu + w / 2, gh = w * 0.62, dep = 4;
  const win = { kind: 'arch', cx: cu, y0: yb + 0.35, w: w * 0.52, h: h - 0.2, n: 4, d: 0.3, vous: false, sill: false };
  const hole = F.shape(win);
  F.poly([[l, yb - 0.8], [r, yb - 0.8], [r, yb + h], [cu, yb + h + gh], [l, yb + h]], of, ST, [hole]);
  F.sides(hole, of - 0.3, of, ST2); F.poly(hole, of - 0.3, GL);
  F.slab(cu - 0.06, cu + 0.06, win.y0, win.y0 + win.h - 0.05, of - 0.28, of - 0.2, FR);
  for (const u of [l, r]) F.q([u, yb - 0.8, of], [u, yb - 0.8, of - dep], [u, yb + h, of - dep], [u, yb + h, of], BR);
  const e = 0.22, oo = of + 0.25;
  F.q([l - e, yb + h - e * 0.6, oo], [cu, yb + h + gh + 0.12, oo], [cu, yb + h + gh + 0.12, of - dep], [l - e, yb + h - e * 0.6, of - dep], SL);
  F.q([r + e, yb + h - e * 0.6, oo], [cu, yb + h + gh + 0.12, oo], [cu, yb + h + gh + 0.12, of - dep], [r + e, yb + h - e * 0.6, of - dep], SL2);
  const [x, y, z] = F.P(cu, yb + h + gh + 0.1, of + 0.1);
  shell(b, x, z, 0.12, 0.01, y, y + 0.9, 4, GOLD);
}
// stepped Dutch gable on facade F; R = right half outline from the bottom corner up to the apex [0, y]
function stepGable(b, F, R, thick, holes = [], color = BR) {
  const full = R.concat(R.slice(0, -1).reverse().map(([u, y]) => [-u, y]));
  F.poly(full, 0.15, color, holes);
  F.sides(full, -thick, 0.15, ST);
  F.poly(full, -thick, color);
  for (const h of holes) { F.sides(h, -0.3, 0.15, ST2); F.poly(h, -0.3, GL); }
  // pinnacles on the outer corner of every step
  for (let i = 1; i + 1 < R.length; i++) if (R[i][1] === R[i + 1][1] && R[i][0] > R[i + 1][0]) for (const s of [1, -1]) {
    const [x, y, z] = F.P(s * (R[i][0] - 0.35), R[i][1], -0.3);
    pinnacle(b, x, y, z, 0.28, 1.6);
  }
  const ap = R[R.length - 1], [x, y, z] = F.P(0, ap[1], -0.3);
  pinnacle(b, x, y, z, 0.4, 2.6);
}

// --- facades ---
// ordinary wing: arched ground-floor windows, square upper windows, pilasters, banding and a cornice
function wingFront(b, F, u0, u1, nb, ye = 15) {
  const bw = (u1 - u0) / nb, wins = [];
  for (let i = 0; i < nb; i++) {
    const c = u0 + bw * (i + 0.5);
    wins.push({ kind: 'arch', cx: c, y0: 1.9, w: 2.6, h: 4.7, n: 6, d: 0.55 });
    wins.push({ kind: 'rect', cx: c, y0: 9.3, w: 2.3, h: 3.9, d: 0.45 });
  }
  F.wall(u0, u1, -0.05, ye, BR, wins);
  F.slab(u0, u1, -0.05, 1.25, 0, 0.3, PL);
  for (const y of [3.1, 4.5]) F.band(u0, u1, y, y + 0.3, 0.04, ST);
  F.band(u0, u1, 5.3, 5.6, 0.12, ST);
  F.slab(u0, u1, 7.7, 8.4, 0, 0.3, ST);
  F.slab(u0, u1, ye - 1.1, ye - 0.6, 0, 0.3, ST);
  F.slab(u0, u1, ye - 0.6, ye, 0, 0.62, ST2, ST);
  for (let i = 0; i <= nb; i++) {
    const u = u0 + bw * i, h = i === 0 || i === nb ? 0.55 : 0.4;
    F.slab(u - h, u + h, 1.25, 7.7, 0, 0.22, BR);
    F.slab(u - h, u + h, 8.4, ye - 1.1, 0, 0.22, BR);
    F.slab(u - h - 0.05, u + h + 0.05, 6.9, 7.7, 0, 0.3, ST);
    if (i < nb) { const c = u + bw / 2; F.poly([[c + bw / 2, 7.05], [c + bw / 2 + 0.32, 7.4], [c + bw / 2, 7.75], [c + bw / 2 - 0.32, 7.4]], 0.32, GOLD); }
  }
}
function wingRoof(b, F, x0, x1, zf, zb, nb, ye = 15, yr = 22) {
  roofX(b, x0, x1, zb - 0.4, zf + 0.6, ye, yr);
  const slope = (yr - ye) / (zf + 0.6 - (zf + zb) / 2), bw = (x1 - x0) / nb;
  for (let i = 0; i < nb; i++) dormer(b, F, x0 + bw * (i + 0.5) - F.ox, ye + 1.6 * slope, -1.0);
  for (let x = x0 + bw; x < x1 - 1; x += bw * 2) ball(b, x, yr + 0.8, (zf + zb) / 2, 0.3);
}

function tower(b, tx, tz, hw, clock) {
  const top = 40;
  const F = [[tx, tz + hw], [tx + hw, tz], [tx, tz - hw], [tx - hw, tz]].map(([x, z], d) => new Fac(b, x, z, d));
  const inner = tx < 0 ? 1 : 3, minY = [0, 16, 16, 16]; minY[inner] = 24;
  F.forEach((f, d) => {
    f.wall(-hw, hw, -0.05, top, BR, [
      d === 0 ? { kind: 'arch', cx: 0, y0: 0, w: 2.6, h: 5.2, d: 0.8, door: 3.4, glass: GL } : { kind: 'arch', cx: 0, y0: 2.2, w: 2.0, h: 4.6 },
      { kind: 'arch', cx: -1.4, y0: 9.6, w: 1.3, h: 3.8, mull: 0, n: 4 }, { kind: 'arch', cx: 1.4, y0: 9.6, w: 1.3, h: 3.8, mull: 0, n: 4 },
      { kind: 'arch', cx: 0, y0: 16.3, w: 2.4, h: 5.8 },
      { kind: 'arch', cx: -1.4, y0: 24.6, w: 1.2, h: 4.4, mull: 0, n: 4 }, { kind: 'arch', cx: 1.4, y0: 24.6, w: 1.2, h: 4.4, mull: 0, n: 4 },
    ].filter(w => w.y0 >= minY[d]));
    f.band(-hw, hw, -0.05, 1.25, 0.3, PL);
    f.slab(-hw, hw, 7.7, 8.4, 0, 0.3, ST);
    f.band(-hw, hw, 14.4, 15.1, 0.3, ST);
    f.slab(-hw, hw, 22.9, 23.5, 0, 0.3, ST);
    f.slab(-hw, hw, 31.0, 31.9, 0, 0.45, ST);
    for (const y of [3.4, 5.0, 11.5, 18.4, 20.2, 26.6]) f.band(-hw, hw, y, y + 0.28, 0.04, ST);
    // dial stage: stone frame, gilded ring, clock face or wind dial
    f.slab(-3.3, 3.3, 32.4, 39.4, 0, 0.14, ST);
    const cy = 35.9, R = 2.75;
    f.disc(0, cy, 0.17, R + 0.25, 16, GOLD);
    f.disc(0, cy, 0.2, R, 16, clock ? WHITE : BLUE);
    if (clock) {
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; f.bar(Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78, a, k % 3 ? 0.35 : 0.55, k % 3 ? 0.14 : 0.24, 0.23, BLACK); }
      f.bar(0, cy, Math.PI / 2 + 0.5 + d, R * 0.75, 0.2, 0.26, BLACK, 0.3);
      f.bar(0, cy, Math.PI / 2 - 1.9 - d * 0.3, R * 0.5, 0.28, 0.27, BLACK, 0.2);
    } else {
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; f.bar(Math.cos(a) * R * 0.7, cy + Math.sin(a) * R * 0.7, a, k % 2 ? 0.4 : 0.7, k % 2 ? 0.16 : 0.3, 0.23, GOLD); }
      f.bar(0, cy, 1.0 + d * 0.15, R * 0.8, 0.22, 0.26, GOLD, R * 0.55);
      f.poly([[Math.cos(1 + d * 0.15) * R * 0.85, cy + Math.sin(1 + d * 0.15) * R * 0.85], ...[2.6, -2.6].map(t => [Math.cos(1 + d * 0.15) * R * 0.55 + Math.cos(1 + d * 0.15 + t) * 0.5, cy + Math.sin(1 + d * 0.15) * R * 0.55 + Math.sin(1 + d * 0.15 + t) * 0.5])], 0.27, GOLD);
    }
    f.disc(0, cy, 0.28, 0.25, 6, GOLD);
    f.slab(-hw, hw, top - 0.5, top, 0, 0.45, ST);
    f.slab(-hw, hw, top, top + 0.7, 0, 0.75, ST2, ST);
  });
  // quoins: stone blocks on every corner
  for (let y = 1.25, k = 0; y < 31; y += 1.1, k++) if (k % 2 === 0) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = tx + sx * hw, cz = tz + sz * hw, a = k % 4 ? 1.0 : 0.6, c = k % 4 ? 0.6 : 1.0;
    const xa = cx + sx * 0.12, xb = cx - sx * a, za = cz + sz * 0.12, zb = cz - sz * c, y1 = y + 1.1;
    b.quad([xa, y, za], [xa, y, zb], [xa, y1, zb], [xa, y1, za], ST); // side face
    b.quad([xa, y, za], [xb, y, za], [xb, y1, za], [xa, y1, za], ST); // front face
    b.quad([xa, y1, za], [xb, y1, za], [xb, y1, zb], [xa, y1, zb], ST); // top
  }
  const t0 = top + 0.7;
  // corner turrets
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = tx + sx * (hw - 0.2), z = tz + sz * (hw - 0.2);
    shell(b, x, z, 0.75, 0.75, t0, t0 + 3.2, 8, BR);
    shell(b, x, z, 0.9, 0.9, t0 + 3.2, t0 + 3.6, 8, ST);
    shell(b, x, z, 0.85, 0.01, t0 + 3.6, t0 + 6.4, 8, SL);
    ball(b, x, t0 + 6.7, z, 0.25);
  }
  // ogee hood, lantern and spire
  const s = Math.SQRT2;
  lathe(b, tx, tz, [[(hw - 0.3) * s, t0], [(hw - 0.5) * s, t0 + 2.2], [(hw - 1.3) * s, t0 + 4.6], [2.1 * s, t0 + 6.4], [1.55 * s, t0 + 7.4, GOLD], [1.55 * s, t0 + 7.7]], 4);
  const ly = t0 + 7.7;
  b.cap(b.ring(tx, tz, 1.55 * s, 4, Math.PI / 4), ly, SL2);
  shell(b, tx, tz, 1.25, 1.25, ly, ly + 3.0, 8, DK);
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2, x = tx + Math.cos(a) * 1.42, z = tz + Math.sin(a) * 1.42; b.box(x - 0.2, x + 0.2, z - 0.2, z + 0.2, ly, ly + 3.0, ST, ST, false); }
  lathe(b, tx, tz, [[1.85, ly + 3.0, GOLD], [1.85, ly + 3.4], [1.65, ly + 3.4], [1.2, ly + 4.6], [0.55, ly + 5.6], [0.3, ly + 6.0, GOLD], [0.3, ly + 6.4], [0.1, ly + 10.4]], 8);
  ball(b, tx, ly + 9.6, tz, 0.4);
  b.quad([tx, ly + 10.4, tz], [tx + 1.2, ly + 10.4, tz], [tx + 1.2, ly + 11.0, tz], [tx, ly + 11.2, tz], GOLD); // vane
}

function shed(b) {
  const x0 = -134, x1 = 134, zc = -4.6, a = 14.5, ys = 4, h = 22, n = 14;
  const P = [];
  for (let i = 0; i <= n; i++) { const t = i / n * Math.PI; P.push([zc + a * Math.cos(t), ys + h * Math.sin(t)]); }
  // vault skin: zinc lower panels, glazing in the middle band
  for (let i = 0; i < n; i++) {
    const [za, ya] = P[i], [zb, yb] = P[i + 1], col = i < 3 || i > n - 4 ? ZINC : (i % 2 ? GLASS : GLASS2);
    b.quad([x0, ya, za], [x1, ya, za], [x1, yb, zb], [x0, yb, zb], col);
  }
  // glazing bars along the vault
  const off = (i, d) => { const t = i / n * Math.PI, nz = Math.cos(t) / a, ny = Math.sin(t) / h, l = Math.hypot(nz, ny); return [P[i][0] + nz / l * d, P[i][1] + ny / l * d]; };
  for (let i = 1; i < n; i++) { const [z, y] = off(i, 0.12), [z2, y2] = off(i, 0.35); b.quad([x0, y, z], [x1, y, z], [x1, y2, z2], [x0, y2, z2], IRON); }
  // arched iron ribs every 8 m, only where they show above the station building
  for (let x = x0; x <= x1 + 0.1; x += 8) for (let i = 3; i < n; i++) {
    const [za, ya] = off(i, 0), [zb, yb] = off(i + 1, 0), [zA, yA] = off(i, 0.55), [zB, yB] = off(i + 1, 0.55);
    b.quad([x - 0.2, yA, zA], [x + 0.2, yA, zA], [x + 0.2, yB, zB], [x - 0.2, yB, zB], IRON);
    b.quad([x, ya, za], [x, yb, zb], [x, yB, zB], [x, yA, zA], IRON);
  }
  // ridge lantern (clerestory) along the crown
  const ty = ys + h;
  b.box(x0 + 4, x1 - 4, zc - 2.2, zc + 2.2, ty - 0.6, ty + 1.4, GLASS2, ZINC, false);
  for (let x = x0 + 4; x <= x1 - 4; x += 4) for (const z of [zc - 2.25, zc + 2.25]) b.quad([x - 0.15, ty - 0.6, z], [x + 0.15, ty - 0.6, z], [x + 0.15, ty + 1.4, z], [x - 0.15, ty + 1.4, z], IRON);
  roofX(b, x0 + 3.5, x1 - 3.5, zc - 2.8, zc + 2.8, ty + 1.4, ty + 2.6, ZINC, ZINC, ZINC);
  // glazed end screens with mullions and a heavy iron rim
  for (const [xe, dir] of [[x0, 3], [x1, 1]]) {
    const F = new Fac(b, xe, 0, dir), sg = dir === 3 ? 1 : -1; // u = z for dir 3, u = -z for dir 1
    const pts = P.map(([z, y]) => [sg * z, y]);
    F.poly(pts.slice().reverse(), 0, GLASS);
    for (let z = zc - a + 2; z < zc + a; z += 2.5) { const c = (z - zc) / a, yt = ys + h * Math.sqrt(Math.max(0, 1 - c * c)); F.slab(sg * z - 0.1, sg * z + 0.1, ys, yt, 0, 0.12, IRON); }
    for (const y of [ys + 6, ys + 13]) { const c = Math.sqrt(1 - ((y - ys) / h) ** 2) * a; F.slab(Math.min(sg * (zc - c), sg * (zc + c)), Math.max(sg * (zc - c), sg * (zc + c)), y - 0.12, y + 0.12, 0, 0.12, IRON); }
    for (let i = 0; i < n; i++) { const [za, ya] = P[i], [zb, yb] = P[i + 1], [zA, yA] = off(i, 0.8), [zB, yB] = off(i + 1, 0.8); F.poly([[sg * za, ya], [sg * zb, yb], [sg * zB, yB], [sg * zA, yA]], 0.3, IRON); }
    F.slab(Math.min(sg * (zc - a), sg * (zc + a)), Math.max(sg * (zc - a), sg * (zc + a)), ys - 0.6, ys, 0, 0.4, IRON);
  }
  // back wall of the shed: low brick wall with arched openings to the tracks, iron columns above
  const B = new Fac(b, 0, zc - a, 2), wins = [];
  for (let x = x0 + 4; x < x1; x += 8) wins.push({ kind: 'arch', cx: -x, y0: 0.6, w: 4.4, h: 3.0, d: 0.3, glass: DK, mull: 0, sill: false, n: 4, vous: false });
  B.wall(x0, x1, -0.05, ys, BR, wins);
  B.slab(x0, x1, ys - 0.5, ys, 0, 0.35, ST);
  // platforms and tracks inside
  for (const [z0, z1] of [[-15, -11], [-4, 0]]) b.box(x0 + 2, x1 - 2, z0, z1, 0, 0.9, '#9a958b', '#b5b0a5', false);
  for (const z of [-17.5, -8.5, -6.5]) b.quad([x0, 0.04, z - 0.8], [x1, 0.04, z - 0.8], [x1, 0.04, z + 0.8], [x0, 0.04, z + 0.8], '#4a4440');
}

// --- brick and slate courses ---
// Triangles in brick or slate colours are diverted from b into a second mesh that carries a small course texture
// (uv in metres on each face's own plane, so courses stay level and line up across neighbouring faces).
let courseTex = null;
function courseTexture() {
  if (courseTex || typeof document === 'undefined') return courseTex;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let row = 0; row < 8; row++) for (let k = -1; k < 4; k++) {
    const x = k * 8 + (row % 2 ? 4 : 0), v = Math.round(255 * (0.9 + rnd() * 0.1));
    g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, row * 4, 8, 4);
    g.fillStyle = '#cdcdcd'; g.fillRect(x, row * 4, 1, 4);
  }
  g.fillStyle = '#d2d2d2';
  for (let row = 0; row < 8; row++) g.fillRect(0, row * 4 + 3, 32, 1);
  courseTex = new THREE.CanvasTexture(c);
  courseTex.wrapS = courseTex.wrapT = THREE.RepeatWrapping;
  courseTex.magFilter = THREE.NearestFilter;
  courseTex.colorSpace = THREE.SRGBColorSpace;
  return courseTex;
}
function textured(b, scales) {
  const T = new Builder(), sc = new Map(Object.entries(scales).map(([k, v]) => [new THREE.Color(k).getHex(), v]));
  const tmp = new THREE.Color(), A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), n = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  b.tri = function (p, q, r, color, uvs) {
    const s = sc.get(tmp.set(color).getHex());
    if (!s) return Builder.prototype.tri.call(this, p, q, r, color, uvs);
    A.fromArray(p); B.fromArray(q); C.fromArray(r);
    n.subVectors(B, A).cross(e1.subVectors(C, A)).normalize();
    if (Math.abs(n.y) > 0.97) { e1.set(1, 0, 0); e2.set(0, 0, 1); } else { e1.set(-n.z, 0, n.x).normalize(); e2.crossVectors(n, e1); if (e2.y < 0) e2.negate(); }
    T.tri(p, q, r, color, [A, B, C].map(v => [v.dot(e1) / s[0], v.dot(e2) / s[1]]));
  };
  return {
    finish(group) {
      delete b.tri;
      group.add(new THREE.Mesh(T.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide, map: courseTexture() })));
    },
  };
}

export default function build(b, THREE_, group) {
  const tex = textured(b, { [BR]: [2.4, 1.6], [SL]: [3.2, 2.4], [SL2]: [3.2, 2.4] });
  model(b);
  tex.finish(group);
}

function model(b) {
  const Z0 = 2.5; // back line of the station building (the train shed is behind it)
  shed(b);

  // ---------- central block ----------
  const cw = 17, cf = 19.2, ce = 25;
  {
    const F = new Fac(b, 0, cf, 0);
    const ent = [-8.5, 0, 8.5].map(cx => ({ kind: 'arch', cx, y0: 0, w: 6, h: 9.5, n: 8, d: 2.6, door: 4.2, glass: '#33404c', vt: 0.85, rev: ST2 }));
    F.wall(-cw, cw, -0.05, ce, BR, [
      ...ent,
      { kind: 'arch', cx: -14.6, y0: 1.9, w: 2.0, h: 4.8 }, { kind: 'arch', cx: 14.6, y0: 1.9, w: 2.0, h: 4.8 },
      { kind: 'arch', cx: 0, y0: 11.8, w: 9.4, h: 10.2, n: 10, d: 0.9, mull: 'big', vt: 0.75 },
      { kind: 'arch', cx: -10.6, y0: 12.2, w: 3.0, h: 7.4 }, { kind: 'arch', cx: 10.6, y0: 12.2, w: 3.0, h: 7.4 },
      { kind: 'circle', cx: -14.8, y0: 15.0, w: 1.6, n: 8 }, { kind: 'circle', cx: 14.8, y0: 15.0, w: 1.6, n: 8 },
    ]);
    F.band(-cw, cw, -0.05, 1.25, 0.35, PL);
    for (const y of [3.1, 4.5]) F.band(-cw, cw, y, y + 0.3, 0.04, ST);
    F.band(-cw, cw, 10.8, 11.4, 0.3, ST);
    F.band(-cw, cw, 17.0, 17.3, 0.04, ST);
    F.slab(-cw, cw, 23.6, 24.2, 0, 0.35, ST);
    F.slab(-cw, cw, 24.2, ce, 0, 0.75, ST2, ST);
    // stone pilasters between the entrance arches, with gilded capitals
    for (const u of [-12.4, -4.25, 4.25, 12.4]) {
      F.slab(u - 0.6, u + 0.6, 0, 10.4, 0, 0.45, ST);
      F.slab(u - 0.75, u + 0.75, 9.6, 10.4, 0, 0.6, GOLD, ST);
      F.slab(u - 0.45, u + 0.45, 11.4, 23.6, 0, 0.25, BR2);
    }
    // frieze of coloured coats of arms under the cornice
    for (let k = 0; k < 9; k++) {
      const u = -12 + k * 3, col = [RED, BLUE, GOLD][k % 3];
      if (Math.abs(u) < 5.5) continue;
      F.poly([[u - 0.55, 22.9], [u + 0.55, 22.9], [u + 0.55, 22.0], [u, 21.5], [u - 0.55, 22.0]], 0.08, col);
    }
    // stepped gable with Amsterdam's arms, two windows and an oculus
    const G = new Fac(b, 0, cf, 0);
    const R = [[15.5, ce], [15.5, 28.2], [12.6, 28.2], [12.6, 31.2], [9.8, 31.2], [9.8, 34.2], [7, 34.2], [7, 37.2], [3.8, 37.2], [3.8, 39.6], [0, 41]];
    const gh = [archPts(-6.2, 27.0, 2.0, 29.2, 5), archPts(6.2, 27.0, 2.0, 29.2, 5), circ(0, 37.9, 1.05, 10)];
    stepGable(b, G, R, 1.0, gh);
    for (const y of [29.6, 32.6]) G.band(-12.6, 12.6, y, y + 0.3, 0.2, ST);
    // the arms: red shield, black pale, three white saltires, gold crown
    G.poly([[-1.9, 33.4], [1.9, 33.4], [1.9, 30.2], [0, 28.4], [-1.9, 30.2]], 0.25, RED);
    G.poly([[-0.65, 33.4], [0.65, 33.4], [0.65, 29.0], [0, 28.6], [-0.65, 29.0]], 0.28, BLACK);
    for (const y of [32.3, 31.0, 29.7]) { G.bar(-0.4, y - 0.4, Math.PI / 4, 1.1, 0.22, 0.31, WHITE); G.bar(0.4, y - 0.4, Math.PI * 3 / 4, 1.1, 0.22, 0.31, WHITE); }
    G.poly([[-1.6, 33.6], [1.6, 33.6], [1.9, 34.6], [1.0, 34.1], [0, 34.9], [-1.0, 34.1], [-1.9, 34.6]], 0.25, GOLD);
    // corner pinnacles of the central block
    for (const s of [-1, 1]) { shell(b, s * (cw - 0.6), cf - 0.6, 0.9, 0.9, ce, ce + 3.5, 8, ST); shell(b, s * (cw - 0.6), cf - 0.6, 1.0, 1.0, ce + 3.5, ce + 3.9, 8, ST2); shell(b, s * (cw - 0.6), cf - 0.6, 0.85, 0.01, ce + 3.9, ce + 8, 8, SL); ball(b, s * (cw - 0.6), ce + 8.3, cf - 0.6, 0.35); }
    // roof with dormers on both flanks
    roofZ(b, -cw - 0.4, cw + 0.4, Z0, cf - 0.6, ce, 38.5);
    walls(b, -cw, cw, Z0, cf, 0, ce, BR, 'N');
    for (const s of [-1, 1]) {
      const S = new Fac(b, s * cw, 0, s > 0 ? 1 : 3);
      for (const z of [7, 13]) { const yb = ce + 2.2 * (13.5 / 17.4); dormer(b, S, s > 0 ? -z : z, yb, -2.2, 2.4, 2.4); }
    }
    ball(b, 0, 39.3, Z0 + 0.4, 0.5);
  }

  // ---------- towers: clock in the west, wind dial in the east ----------
  tower(b, -21.5, 14, 4.5, true);
  tower(b, 21.5, 14, 4.5, false);

  for (const s of [-1, 1]) {
    // ---------- inner wing ----------
    {
      const [x0, x1] = s < 0 ? [-62, -26] : [26, 62], zf = 16;
      const F = new Fac(b, 0, zf, 0);
      wingFront(b, F, x0, x1, 6);
      walls(b, x0, x1, Z0, zf, 0, 15, BR, 'N');
      wingRoof(b, F, x0, x1, zf, Z0, 6);
    }
    // ---------- gabled middle pavilion ----------
    {
      const cx = s * 69, hw = 7, zf = 17.5, ye = 17.2;
      const F = new Fac(b, cx, zf, 0);
      F.wall(-hw, hw, -0.05, ye, BR, [
        { kind: 'arch', cx: 0, y0: 0, w: 3.6, h: 6.8, door: 3.6, d: 1.2, vt: 0.6 },
        { kind: 'arch', cx: -4.4, y0: 1.9, w: 2.0, h: 4.8 }, { kind: 'arch', cx: 4.4, y0: 1.9, w: 2.0, h: 4.8 },
        { kind: 'arch', cx: 0, y0: 9.4, w: 2.6, h: 5.6 }, { kind: 'arch', cx: -4.4, y0: 9.4, w: 2.0, h: 5.0 }, { kind: 'arch', cx: 4.4, y0: 9.4, w: 2.0, h: 5.0 },
      ]);
      F.band(-hw, hw, -0.05, 1.25, 0.3, PL);
      for (const y of [3.1, 4.5]) F.band(-hw, hw, y, y + 0.3, 0.04, ST);
      F.band(-hw, hw, 7.7, 8.4, 0.3, ST);
      F.slab(-hw, hw, ye - 1.1, ye - 0.6, 0, 0.3, ST);
      F.slab(-hw, hw, ye - 0.6, ye, 0, 0.62, ST2, ST);
      for (const u of [-hw, hw]) F.slab(u - 0.6, u + 0.6, 0, ye - 1.1, 0, 0.3, ST2);
      stepGable(b, F, [[7.2, ye], [7.2, 19.6], [5.2, 19.6], [5.2, 22.1], [3.3, 22.1], [3.3, 24.6], [1.5, 24.6], [1.5, 26.2], [0, 27.3]], 0.8, [archPts(0, 18.4, 1.8, 21.0, 5)]);
      F.band(-5.2, 5.2, 21.7, 22.0, 0.2, ST);
      roofZ(b, cx - hw - 0.3, cx + hw + 0.3, Z0 - 0.5, zf - 0.5, ye, 26.6);
      walls(b, cx - hw, cx + hw, Z0 - 0.5, zf, 0, ye, BR, 'NEW');
    }
    // ---------- outer wing ----------
    {
      const [x0, x1] = s < 0 ? [-122, -76] : [76, 122], zf = 16;
      const F = new Fac(b, 0, zf, 0);
      wingFront(b, F, x0, x1, 8);
      walls(b, x0, x1, Z0, zf, 0, 15, BR, 'N');
      wingRoof(b, F, x0, x1, zf, Z0, 8);
    }
    // ---------- end pavilion ----------
    {
      const x0 = s < 0 ? -139.2 : 121.8, x1 = x0 + 17.4, cx = (x0 + x1) / 2, zf = 18, zb = 1, ye = 18.4;
      const bayWins = (us) => us.flatMap(u => [
        { kind: 'arch', cx: u, y0: 1.9, w: 2.6, h: 4.9, d: 0.55 },
        { kind: 'rect', cx: u, y0: 9.4, w: 2.3, h: 4.2 },
        { kind: 'rect', cx: u, y0: 14.8, w: 1.6, h: 1.4, mull: 0, lintel: false },
      ]);
      const front = new Fac(b, cx, zf, 0), side = new Fac(b, s < 0 ? x0 : x1, (zf + zb) / 2, s < 0 ? 3 : 1), back = new Fac(b, cx, zb, 2);
      for (const [F, hw, us] of [[front, 8.7, [-5.4, 0, 5.4]], [side, 8.5, [-5.2, 0, 5.2]]]) {
        F.wall(-hw, hw, -0.05, ye, BR, bayWins(us));
        F.band(-hw, hw, -0.05, 1.25, 0.3, PL);
        for (const y of [3.1, 4.5]) F.band(-hw, hw, y, y + 0.3, 0.04, ST);
        F.band(-hw, hw, 5.5, 5.8, 0.12, ST);
        F.slab(-hw, hw, 7.7, 8.4, 0, 0.3, ST);
        F.band(-hw, hw, 13.9, 14.4, 0.25, ST);
        F.slab(-hw, hw, ye - 1.0, ye - 0.5, 0, 0.3, ST);
        F.slab(-hw, hw, ye - 0.5, ye, 0, 0.65, ST2, ST);
        for (const u of [-hw, hw]) F.slab(u - 0.7, u + 0.7, 0, ye - 1.0, 0, 0.35, ST2);
      }
      walls(b, x0, x1, zb, zf, 0, ye, BR, s < 0 ? 'EN' : 'WN');
      // tall hipped roof with a small gilded crown on top, plus a front dormer gable
      const yr = 29, ix = 3.2, iz = 3.2;
      const c = [[x0 - 0.5, zb - 0.5], [x1 + 0.5, zb - 0.5], [x1 + 0.5, zf + 0.5], [x0 - 0.5, zf + 0.5]], t = [[x0 + ix + 3, zb + iz + 1], [x1 - ix - 3, zb + iz + 1], [x1 - ix - 3, zf - iz - 1], [x0 + ix + 3, zf - iz - 1]];
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; b.quad([c[i][0], ye, c[i][1]], [c[j][0], ye, c[j][1]], [t[j][0], yr, t[j][1]], [t[i][0], yr, t[i][1]], i % 2 ? SL2 : SL); }
      b.cap(t, yr, SL2);
      b.box(t[0][0], t[1][0], t[0][1], t[2][1], yr, yr + 0.5, IRON, IRON, false);
      for (const [x, z] of t) ball(b, x, yr + 0.9, z, 0.3);
      shell(b, cx, (zf + zb) / 2, 0.5, 0.01, yr + 0.5, yr + 4, 4, GOLD);
      const G = new Fac(b, cx, zf, 0);
      stepGable(b, G, [[3.6, ye], [3.6, 20.6], [2.4, 20.6], [2.4, 22.6], [1.2, 22.6], [1.2, 24.3], [0, 25.1]], 4.5, [archPts(0, 19.0, 1.6, 21.4, 5)]);
      roofZ(b, cx - 3.8, cx + 3.8, zf - 9, zf - 0.6, ye, 24.6);
    }
  }
  // the unbroken back wall of the wings faces the platforms
  for (const s of [-1, 1]) for (let x = 30; x < 120; x += 5.75) {
    if (x > 60 && x < 78) continue;
    b.quad([s * x - 1.1, 3, Z0 - 0.02], [s * x + 1.1, 3, Z0 - 0.02], [s * x + 1.1, 6.5, Z0 - 0.02], [s * x - 1.1, 6.5, Z0 - 0.02], GL);
  }
}
