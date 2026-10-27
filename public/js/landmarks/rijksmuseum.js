// rijksmuseum: hand-built landmark model. Local metres, +z is the front facade, y up.
// Rijksmuseum (Cuypers, 1885): red brick with stone bands, steep slate roofs, two central towers flanking the passage through the middle.
// Plan: a ring of wings around two glazed courtyards, corner pavilions with tall roofs, and the central hall over the
// famous cycle passage, which runs straight through the building from the front (+z, facing the city) to the back.
import * as THREE from 'three';
import { Builder, GOLD } from './builder.js';

const BR = '#9b4431', BR2 = '#843a2b', ST = '#ddd2b4', ST2 = '#c3b590', PL = '#8e8a80', SL = '#3e454e', SL2 = '#33393f';
const GL = '#27313d', FR = '#e7e0cb', DK = '#2a2622', WD = '#5b3a24', IRON = '#3f4952', GLASS = '#a5bccb', GLASS2 = '#bccdd8', TUN = '#b9ab8e';
const RED = '#b23a2e', BLUE = '#2f5592', GREEN = '#4d7c4a', CREAM = '#efe6cf', OCHRE = '#c98f3a';

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


// --- Rijksmuseum pieces ---
// coloured tile tableau: gold frame, blue field, a few standing figures suggested with colour
function tableau(F, u0, u1, y0, y1, o, figs = 3) {
  F.flat(u0, u1, y0, y1, o, GOLD);
  F.flat(u0 + 0.18, u1 - 0.18, y0 + 0.18, y1 - 0.18, o + 0.02, BLUE);
  const w = (u1 - u0 - 0.36) / figs, h = y1 - y0 - 0.36;
  for (let i = 0; i < figs; i++) {
    const c = u0 + 0.18 + w * (i + 0.5), yb = y0 + 0.18 + h * 0.08;
    F.poly([[c - w * 0.22, yb], [c + w * 0.22, yb], [c + w * 0.14, yb + h * 0.62], [c - w * 0.14, yb + h * 0.62]], o + 0.04, [RED, GREEN, CREAM, OCHRE][(i + figs) % 4]);
    F.poly(circ(c, yb + h * 0.72, Math.min(w * 0.12, h * 0.1), 6), o + 0.04, CREAM);
    if (h > 2) F.poly(circ(c, yb + h * 0.72, Math.min(w * 0.2, h * 0.16), 8), o + 0.03, GOLD); // halo
  }
}
// standard bay rhythm of the wings: cross-mullioned ground floor windows, tall arched windows on the main floor,
// buttress-like pilasters, stone banding, a frieze of tile panels and a cornice
function rWing(b, F, u0, u1, nb, ye, cheap = false, panels = true) {
  const bw = (u1 - u0) / nb, wins = [];
  for (let i = 0; i < nb; i++) {
    const c = u0 + bw * (i + 0.5);
    wins.push({ kind: 'rect', cx: c, y0: 2.7, w: 2.0, h: 3.0, d: 0.4, flat: cheap });
    wins.push({ kind: 'arch', cx: c, y0: 8.9, w: 2.5, h: 6.3, d: 0.5, n: 6, flat: cheap });
  }
  F.wall(u0, u1, -0.05, ye, BR, wins);
  F.slab(u0, u1, -0.05, 1.7, 0, 0.35, PL);
  for (const y of [4.0, 5.3]) F.band(u0, u1, y, y + 0.28, 0.04, ST);
  F.slab(u0, u1, 6.7, 7.4, 0, 0.3, ST);
  F.band(u0, u1, 12.4, 12.7, 0.04, ST);
  F.slab(u0, u1, 15.9, 16.4, 0, 0.3, ST);
  F.slab(u0, u1, ye - 0.6, ye, 0, 0.62, ST2, ST);
  for (let i = 0; i <= nb; i++) {
    const u = u0 + bw * i, h = i === 0 || i === nb ? 0.6 : 0.45;
    F.slab(u - h, u + h, 1.7, 6.7, 0, 0.32, BR);
    F.slab(u - h, u + h, 7.4, 15.9, 0, 0.32, BR);
    F.slab(u - h, u + h, 16.4, ye - 0.6, 0, 0.32, ST);
    if (i < nb && panels) { const c = u + bw / 2; tableau(F, c - 1.5, c + 1.5, 16.6, 18.0, 0.02, 2); }
  }
}
function rWingRoof(b, F, x0, x1, zf, zb, ye, yr, d0, d1, nb) {
  roofX(b, x0, x1, zb - 0.4, zf + 0.6, ye, yr);
  const slope = (yr - ye) / (zf + 0.6 - (zf + zb) / 2), bw = (d1 - d0) / nb;
  for (let i = 0; i < nb; i++) dormer(b, F, d0 + bw * (i + 0.5), ye + 1.6 * slope, -1.0, 2.0, 2.2);
  for (let x = d0 + bw; x < d1 - 1; x += bw * 2) ball(b, x, yr + 0.8, (zf + zb) / 2, 0.3);
}
function sideWing(b, F, u0, u1, nb, ye, yr, x0, x1, z0, z1, cheap) {
  rWing(b, F, u0, u1, nb, ye, cheap, !cheap);
  roofZ(b, x0, x1, z0, z1, ye, yr, SL2);
  const slope = (yr - ye) / ((x1 - x0) / 2 + 0.6), bw = (u1 - u0) / nb;
  for (let i = 0; i < nb; i += 2) dormer(b, F, u0 + bw * (i + 0.5), ye + 1.6 * slope, -1.0, 2.0, 2.2);
}
// corner pavilion with a tall truncated-pyramid roof, cresting and gilded finials
function pavilion(b, x0, x1, z0, z1, ye, sx, sz, cheapSide) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hwx = (x1 - x0) / 2, hwz = (z1 - z0) / 2;
  const front = new Fac(b, cx, sz > 0 ? z1 : z0, sz > 0 ? 0 : 2), side = new Fac(b, sx > 0 ? x1 : x0, cz, sx > 0 ? 1 : 3);
  for (const [F, hw, cheap] of [[front, hwx, sz < 0], [side, hwz, cheapSide]]) {
    const wins = [];
    for (const u of [-hw * 0.62, 0, hw * 0.62]) {
      wins.push({ kind: 'rect', cx: u, y0: 2.7, w: 2.0, h: 3.0, d: 0.4, flat: cheap });
      wins.push({ kind: 'arch', cx: u, y0: 8.9, w: 2.5, h: 6.3, d: 0.5, flat: cheap });
      wins.push({ kind: 'rect', cx: u, y0: 17.0, w: 1.8, h: 2.4, d: 0.35, flat: cheap, lintel: false });
    }
    F.wall(-hw, hw, -0.05, ye, BR, wins);
    F.slab(-hw, hw, -0.05, 1.7, 0, 0.35, PL);
    for (const y of [4.0, 5.3, 12.4, 18.9]) F.band(-hw, hw, y, y + 0.28, 0.04, ST);
    F.slab(-hw, hw, 6.7, 7.4, 0, 0.3, ST);
    F.band(-hw, hw, 15.9, 16.4, 0.3, ST);
    F.slab(-hw, hw, ye - 0.6, ye, 0, 0.62, ST2, ST);
    for (const u of [-hw, hw]) F.slab(u - 0.75, u + 0.75, 1.7, ye - 0.6, 0, 0.4, ST2);
    for (const u of [-hw * 0.31, hw * 0.31]) F.slab(u - 0.4, u + 0.4, 1.7, ye - 0.6, 0, 0.3, BR);
  }
  const yr = ye + 12, ins = 4.6, c = [[x0 - 0.5, z0 - 0.5], [x1 + 0.5, z0 - 0.5], [x1 + 0.5, z1 + 0.5], [x0 - 0.5, z1 + 0.5]];
  const t = [[x0 + ins, z0 + ins], [x1 - ins, z0 + ins], [x1 - ins, z1 - ins], [x0 + ins, z1 - ins]];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; b.quad([c[i][0], ye, c[i][1]], [c[j][0], ye, c[j][1]], [t[j][0], yr, t[j][1]], [t[i][0], yr, t[i][1]], i % 2 ? SL2 : SL); }
  b.cap(t, yr, SL2);
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; b.quad([t[i][0], yr, t[i][1]], [t[j][0], yr, t[j][1]], [t[j][0], yr + 0.7, t[j][1]], [t[i][0], yr + 0.7, t[i][1]], IRON); }
  for (const [x, z] of t) { shell(b, x, z, 0.12, 0.12, yr, yr + 1.2, 4, GOLD); ball(b, x, yr + 1.4, z, 0.3); }
  shell(b, cx, cz, 0.6, 0.6, yr, yr + 1.2, 6, SL); shell(b, cx, cz, 0.6, 0.02, yr + 1.2, yr + 4.5, 6, GOLD); ball(b, cx, yr + 2.1, cz, 0.45);
  // a dormer on the two visible roof faces
  dormer(b, front, 0, ye + 1.6 * (12 / (hwz - ins + 0.5)), -1.0, 2.2, 2.4);
  dormer(b, side, 0, ye + 1.6 * (12 / (hwx - ins + 0.5)), -1.0, 2.2, 2.4);
}
function rTower(b, tx, tz, hw) {
  const top = 38.6, F = [[tx, tz + hw], [tx + hw, tz], [tx, tz - hw], [tx - hw, tz]].map(([x, z], d) => new Fac(b, x, z, d));
  F.forEach((f, d) => {
    const all = d === 0;
    f.wall(-hw, hw, -0.05, top, BR, [
      ...(all ? [{ kind: 'rect', cx: 0, y0: 2.7, w: 2.0, h: 3.0 }, { kind: 'arch', cx: 0, y0: 8.9, w: 2.2, h: 6.3 },
        { kind: 'arch', cx: -1.2, y0: 22.4, w: 1.1, h: 4.6, mull: 0, n: 4 }, { kind: 'arch', cx: 1.2, y0: 22.4, w: 1.1, h: 4.6, mull: 0, n: 4 }] : []),
      { kind: 'arch', cx: -1.35, y0: 31.6, w: 1.6, h: 5.6, d: 1.2, glass: DK, mull: 0, n: 5 }, { kind: 'arch', cx: 1.35, y0: 31.6, w: 1.6, h: 5.6, d: 1.2, glass: DK, mull: 0, n: 5 },
    ]);
    f.band(-hw, hw, -0.05, 1.7, 0.35, PL);
    for (const y of [4.0, 5.3, 12.4, 25.2]) f.band(-hw, hw, y, y + 0.28, 0.04, ST);
    f.slab(-hw, hw, 6.7, 7.4, 0, 0.3, ST);
    f.slab(-hw, hw, 15.9, 16.4, 0, 0.3, ST);
    if (all) tableau(f, -2.6, 2.6, 16.9, 21.4, 0.02, 2);
    f.slab(-hw, hw, 29.6, 30.4, 0, 0.4, ST);
    f.band(-hw, hw, 34.8, 35.1, 0.05, ST);
    f.slab(-hw, hw, top - 0.4, top, 0, 0.4, ST);
    f.slab(-hw, hw, top, top + 0.6, 0, 0.7, ST2, ST);
    for (const u of [-hw, hw]) f.slab(u - 0.5, u + 0.5, 1.7, top - 0.4, 0, 0.3, ST2); // corner buttresses
  });
  const t0 = top + 0.6;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = tx + sx * (hw - 0.15), z = tz + sz * (hw - 0.15);
    shell(b, x, z, 0.8, 0.8, t0, t0 + 2.6, 8, ST2);
    shell(b, x, z, 0.85, 0.01, t0 + 2.6, t0 + 6.2, 8, SL);
    ball(b, x, t0 + 6.5, z, 0.25);
  }
  b.cap(b.ring(tx, tz, hw * Math.SQRT2, 4, Math.PI / 4), t0, SL2);
  const r0 = 3.9;
  lathe(b, tx, tz, [[r0, t0], [r0 * 0.62, t0 + 8.4, GOLD], [r0 * 0.6, t0 + 8.9], [0.12, t0 + 22]], 8);
  for (const f of F) dormer(b, f, 0, t0 + 0.6, -0.75, 1.3, 1.5);
  ball(b, tx, t0 + 22.3, tz, 0.4);
  b.quad([tx, t0 + 22.6, tz], [tx + 1.3, t0 + 22.6, tz], [tx + 1.3, t0 + 23.3, tz], [tx, t0 + 23.5, tz], GOLD);
}
// central gateway block with the passage through it, three tall windows, a tile tableau and a stepped gable
function gate(b, zf, dir, w, ye) {
  const F = new Fac(b, 0, zf, dir), back = dir === 2;
  const tun = { kind: 'arch', cx: 0, y0: 0, w: 7, h: 8.6, n: 8, d: Math.abs(zf), glass: null, rev: TUN, vt: 0.8, key: GOLD };
  F.wall(-w, w, -0.05, ye, BR, [
    tun,
    { kind: 'arch', cx: -6.4, y0: 0, w: 2.8, h: 5.6, d: 3, glass: DK, vt: 0.5, mull: 0 }, { kind: 'arch', cx: 6.4, y0: 0, w: 2.8, h: 5.6, d: 3, glass: DK, vt: 0.5, mull: 0 },
    ...[-5, 0, 5].map(cx => ({ kind: 'arch', cx, y0: 10.8, w: 3.0, h: 8.2, d: 0.6, flat: back })),
  ]);
  F.band(-w, w, -0.05, 1.7, 0.4, PL);
  for (const y of [2.6, 4.0]) F.band(-w, w, y, y + 0.28, 0.04, ST);
  F.band(-w, w, 9.8, 10.5, 0.35, ST);
  F.slab(-w, w, 19.7, 20.0, 0, 0.3, ST);
  tableau(F, -w + 1, w - 1, 20.2, 23.0, 0.02, 5);
  F.slab(-w, w, ye - 0.6, ye, 0, 0.6, ST2, ST);
  for (const u of [-w, w]) F.slab(u - 0.7, u + 0.7, 0, ye - 0.6, 0, 0.45, ST);
  stepGable(b, F, [[w, ye], [w, ye + 2.8], [7.2, ye + 2.8], [7.2, ye + 5.8], [5.4, ye + 5.8], [5.4, ye + 8.8], [3.4, ye + 8.8], [3.4, ye + 11.4], [0, ye + 13.3]], 1.0);
  // arched tableau in the gable
  const ap = archPts(0, ye + 1.0, 7.2, ye + 5.6, 8);
  F.poly(ap, 0.18, GOLD);
  F.poly(archPts(0, ye + 1.25, 6.7, ye + 5.6, 8), 0.2, BLUE);
  F.poly([[-0.9, ye + 1.5], [0.9, ye + 1.5], [0.6, ye + 6.2], [-0.6, ye + 6.2]], 0.22, CREAM);
  F.poly(circ(0, ye + 6.9, 0.5, 6), 0.22, CREAM); F.poly(circ(0, ye + 6.9, 0.85, 8), 0.21, GOLD);
  for (const s of [-1, 1]) F.poly([[s * 1.6, ye + 1.5], [s * 2.8, ye + 1.5], [s * 2.6, ye + 4.6], [s * 1.8, ye + 4.6]], 0.22, s < 0 ? RED : GREEN);
  return F;
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
  const W = 66.8, ZF = 38, YE = 18.6, YR = 28.6;
  // central hall (Gallery of Honour) over the passage, with a tall roof and a gilded roof turret
  {
    const hw = 11, z0 = -28, z1 = 28.5, ye = 22;
    for (const s of [-1, 1]) {
      const F = new Fac(b, s * hw, 0, s > 0 ? 1 : 3);
      const wins = [];
      for (let z = -24; z <= 24; z += 6) wins.push({ kind: 'arch', cx: z, y0: 15.6, w: 2.2, h: 5.0, flat: true });
      F.wall(z0, z1, 0, ye, BR, wins);
      F.slab(z0, z1, ye - 0.5, ye, 0, 0.5, ST);
    }
    roofZ(b, -hw - 0.5, hw + 0.5, z0, z1, ye, 36.5, SL2);
    b.box(-1.2, 1.2, -1.2, 1.2, 35, 37.6, SL2, SL2, false);
    shell(b, 0, 0, 1.5, 1.5, 37.6, 37.9, 8, GOLD);
    shell(b, 0, 0, 1.25, 1.25, 37.9, 40.6, 8, DK);
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2; b.box(Math.cos(a) * 1.4 - 0.15, Math.cos(a) * 1.4 + 0.15, Math.sin(a) * 1.4 - 0.15, Math.sin(a) * 1.4 + 0.15, 37.9, 40.6, ST, ST, false); }
    lathe(b, 0, 0, [[1.7, 40.6, GOLD], [1.7, 41.0], [1.4, 41.0], [0.1, 48.5]], 8);
    ball(b, 0, 48.8, 0, 0.35);
    // the passage floor: red cycle path between grey footways
    b.quad([-1.6, 0.03, -39.5], [1.6, 0.03, -39.5], [1.6, 0.03, 39.5], [-1.6, 0.03, 39.5], '#9a4b3d');
    for (const s of [-1, 1]) b.quad([s * 1.6, 0.03, -39.5], [s * 3.5, 0.03, -39.5], [s * 3.5, 0.03, 39.5], [s * 1.6, 0.03, 39.5], '#8f8b84');
  }
  // front gateway between the towers, and the plainer one on the back
  const G = gate(b, 39.2, 0, 9, 24.2);
  roofZ(b, -9.4, 9.4, 28.5, 38.8, 24.2, 37.3, SL2);
  gate(b, -39.2, 2, 9, 24.2);
  roofZ(b, -9.4, 9.4, -38.8, -28, 24.2, 37.3, SL2);
  // towers flanking the gateway
  rTower(b, -13.25, 34.5, 4.25);
  rTower(b, 13.25, 34.5, 4.25);

  for (const s of [-1, 1]) {
    // front and back wings (the back one, towards the Museumplein, is plainer)
    for (const [zf, zb, dir] of [[ZF, 27, 0], [-ZF, -27, 2]]) {
      const F = new Fac(b, 0, zf, dir), back = dir === 2;
      const [f0, f1] = back ? [9, 53] : [17.5, 53], nb = back ? 8 : 7;
      rWing(b, F, s < 0 === !back ? -f1 : f0, s < 0 === !back ? -f0 : f1, nb, YE, back, !back);
      const [x0, x1] = s < 0 ? [-53, -9] : [9, 53];
      if (!back) rWingRoof(b, F, x0, x1, zf, zb, YE, YR, s < 0 ? -f1 : f0, s < 0 ? -f0 : f1, nb);
      else {
        roofX(b, x0, x1, -ZF - 0.6, zb + 0.4, YE, YR, SL, SL2, SL2);
        const bw = (f1 - f0) / nb, u0 = s < 0 === !back ? -f1 : f0;
        for (let i = 1; i < nb; i += 2) dormer(b, F, u0 + bw * (i + 0.5), YE + 1.6 * (YR - YE) / 6.15, -1.0, 2.0, 2.2);
      }
      walls(b, x0, x1, Math.min(zf, zb), Math.max(zf, zb), 0, YE, BR, back ? 'S' : 'N');
    }
    // side wing
    {
      const F = new Fac(b, s * (W - 0.5), 0, s > 0 ? 1 : 3);
      const [x0, x1] = s > 0 ? [55, W - 0.5] : [-W + 0.5, -55];
      sideWing(b, F, -23.6, 23.6, 9, YE, YR - 1, x0 - 0.4, x1 + 0.4, -24, 24, false);
      walls(b, x0, x1, -24, 24, 0, YE, BR, s > 0 ? 'W' : 'E');
    }
    // corner pavilions
    pavilion(b, s < 0 ? -W : 53, s < 0 ? -53 : W, 24, 39.3, 21.4, s, 1, false);
    pavilion(b, s < 0 ? -W : 53, s < 0 ? -53 : W, -39.3, -24, 21.4, s, -1, true);
    // glazed courtyard roofs
    {
      const [x0, x1] = s < 0 ? [-55, -11] : [11, 55];
      roofX(b, x0, x1, -27, 27, 15, 19.5, GLASS, GLASS2, GLASS2);
      for (let x = x0 + 4; x < x1; x += 4) {
        b.quad([x - 0.15, 15.05, 27], [x + 0.15, 15.05, 27], [x + 0.15, 19.55, 0], [x - 0.15, 19.55, 0], IRON);
        b.quad([x - 0.15, 15.05, -27], [x + 0.15, 15.05, -27], [x + 0.15, 19.55, 0], [x - 0.15, 19.55, 0], IRON);
      }
    }
  }
}
