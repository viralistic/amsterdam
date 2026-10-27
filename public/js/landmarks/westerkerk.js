// westerkerk: hand-built landmark model. Local metres, +z is the front facade (south, the Westermarkt), y up.
// Westerkerk (1631, Hendrick de Keyser): Dutch Renaissance hall church of brick with sandstone dressings, two
// transverse cross-arms with obelisk-topped gables, big round-arched windows with stone tracery, and the 85 m
// Westertoren at the west end (local -x, on the Prinsengracht): square brick stage, sandstone clock stage, octagonal
// stages and open lantern, crowned with the blue-and-gold imperial crown of Maximilian and a weathervane.
import { SANDSTONE, STONE, BRICK, OLDBRICK, SLATE, COPPER, LEAD, GOLD } from './builder.js';

// ---- facade toolkit: a facade frame F runs along u from a to b, v is height, n points outwards ----
// (without a centre the outward side is the left of a -> b in the x-z plane, i.e. walk the plan clockwise seen from above)
function frame(a, b, cx, cz) {
  let dx = b[0] - a[0], dz = b[1] - a[1];
  const len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
  const F = { ax: a[0], az: a[1], ux, uz, nx: -uz, nz: ux, len };
  if (cx === undefined) return F;
  const mx = (a[0] + b[0]) / 2 - cx, mz = (a[1] + b[1]) / 2 - cz;
  return mx * F.nx + mz * F.nz < 0 ? frame(b, a, cx, cz) : F;
}
const P = (F, u, v, n) => [F.ax + F.ux * u + F.nx * n, v, F.az + F.uz * u + F.nz * n];
function fquad(b, F, u0, v0, u1, v1, n, col) { b.quad(P(F, u0, v0, n), P(F, u1, v0, n), P(F, u1, v1, n), P(F, u0, v1, n), col); }
// a box standing proud of the facade between n0 and n1 (no back face unless asked)
function fbox(b, F, u0, u1, v0, v1, n0, n1, col, back = false, bottom = false) {
  const p = (u, v, n) => P(F, u, v, n);
  b.quad(p(u0, v0, n1), p(u1, v0, n1), p(u1, v1, n1), p(u0, v1, n1), col);
  b.quad(p(u0, v1, n0), p(u0, v1, n1), p(u1, v1, n1), p(u1, v1, n0), col);
  if (bottom) b.quad(p(u0, v0, n0), p(u1, v0, n0), p(u1, v0, n1), p(u0, v0, n1), col);
  b.quad(p(u0, v0, n0), p(u0, v0, n1), p(u0, v1, n1), p(u0, v1, n0), col);
  b.quad(p(u1, v0, n0), p(u1, v1, n0), p(u1, v1, n1), p(u1, v0, n1), col);
  if (back) b.quad(p(u0, v0, n0), p(u0, v1, n0), p(u1, v1, n0), p(u1, v0, n0), col);
}
function outline(h, seg = h.seg || 4) {
  if (!h.arch) return [[h.u0, h.v0], [h.u1, h.v0], [h.u1, h.v1], [h.u0, h.v1]];
  const r = (h.u1 - h.u0) / 2, uc = h.u0 + r, vs = h.v1 - r, pts = [[h.u0, h.v0], [h.u1, h.v0]];
  for (let k = 0; k <= seg; k++) { const a = k / seg * Math.PI; pts.push([uc + Math.cos(a) * r, vs + Math.sin(a) * r]); }
  return pts;
}
// a flat wall from u0..u1, v0..v1 with recessed window/door openings (rectangular or round-arched)
function wall(b, F, u0, u1, v0, v1, holes, col, n = 0) {
  const vs = [...new Set([v0, v1, ...holes.flatMap(h => [h.v0, h.v1])])].filter(v => v >= v0 && v <= v1).sort((x, y) => x - y);
  for (let i = 0; i < vs.length - 1; i++) {
    const a = vs[i], c = vs[i + 1];
    let cur = u0;
    for (const h of holes.filter(h => h.v0 < c && h.v1 > a).sort((x, y) => x.u0 - y.u0)) { if (h.u0 > cur) fquad(b, F, cur, a, h.u0, c, n, col); cur = Math.max(cur, h.u1); }
    if (cur < u1) fquad(b, F, cur, a, u1, c, n, col);
  }
  for (const h of holes) {
    const pts = outline(h), d = h.depth ?? 0.3;
    if (h.arch) { // fill the corners above the arch
      const r = (h.u1 - h.u0) / 2, uc = h.u0 + r, vs0 = h.v1 - r, seg = h.seg || 4;
      for (let k = 0; k < seg; k++) {
        const a0 = k / seg * Math.PI, a1 = (k + 1) / seg * Math.PI, cu = k < seg / 2 ? h.u1 : h.u0;
        b.tri(P(F, cu, h.v1, n), P(F, uc + Math.cos(a0) * r, vs0 + Math.sin(a0) * r, n), P(F, uc + Math.cos(a1) * r, vs0 + Math.sin(a1) * r, n), col);
      }
    }
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      b.quad(P(F, p[0], p[1], n), P(F, q[0], q[1], n), P(F, q[0], q[1], n - d), P(F, p[0], p[1], n - d), h.reveal || col);
    }
    for (let i = 1; i < pts.length - 1; i++) b.tri(P(F, pts[0][0], pts[0][1], n - d), P(F, pts[i][0], pts[i][1], n - d), P(F, pts[i + 1][0], pts[i + 1][1], n - d), h.glass || GLASS);
  }
}
// a raised stone arch band (archivolt) around a round arch, with keystone
function archivolt(b, F, uc, vs, r0, r1, n1, col, seg = 4) {
  for (let k = 0; k < seg; k++) {
    const a0 = k / seg * Math.PI, a1 = (k + 1) / seg * Math.PI, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    b.quad(P(F, uc + c0 * r0, vs + s0 * r0, n1), P(F, uc + c0 * r1, vs + s0 * r1, n1), P(F, uc + c1 * r1, vs + s1 * r1, n1), P(F, uc + c1 * r0, vs + s1 * r0, n1), col);
    b.quad(P(F, uc + c0 * r1, vs + s0 * r1, 0), P(F, uc + c1 * r1, vs + s1 * r1, 0), P(F, uc + c1 * r1, vs + s1 * r1, n1), P(F, uc + c0 * r1, vs + s0 * r1, n1), col);
  }
  fbox(b, F, uc - 0.22, uc + 0.22, vs + r0 - 0.05, vs + r1 + 0.12, 0, n1 + 0.06, col);
}

const BRK = '#9a4a33', BRK_D = '#843f2c', SAND = '#d9cba4', SAND_D = '#bdae88', SAND_L = '#e6dcc0', ROOF = '#4c5762', RIDGE_C = '#3c444c';
const GLASS = '#33424e', LEADED = '#3e5060', WOOD = '#4a3a2c', DOORC = '#5a3524', DARK = '#262a2e', BLUE = '#2150a8', BLUE_D = '#1a4290';
const EAVE = 14.1, RIDGE = 25.5, NX0 = -19.05, NX1 = 28.3, NZ = 10, TZ = 14.35;
const TX = -23.85, TH = 4.6; // west tower: centre x and half width (on the Prinsengracht)

// pitched roof; a along the ridge, c across; overhang ov at the eaves; gable triangles at both ends
function saddle(b, a0, a1, c0, c1, y, h, ov, roof, wallc, alongZ) {
  const m = (a, yy, c) => alongZ ? [c, yy, a] : [a, yy, c];
  const cm = (c0 + c1) / 2, s = h / ((c1 - c0) / 2), ye = y - ov * s;
  b.quad(m(a0, ye, c0 - ov), m(a1, ye, c0 - ov), m(a1, y + h, cm), m(a0, y + h, cm), roof);
  b.quad(m(a0, ye, c1 + ov), m(a1, ye, c1 + ov), m(a1, y + h, cm), m(a0, y + h, cm), roof);
  if (wallc) { b.tri(m(a0, y, c0), m(a0, y + h, cm), m(a0, y, c1), wallc); b.tri(m(a1, y, c0), m(a1, y + h, cm), m(a1, y, c1), wallc); }
}
function obelisk(b, x, z, y, s, h) {
  b.box(x - s, x + s, z - s, z + s, y, y + s * 1.4, SAND, SAND, false);
  b.frustum(x, z, s * 0.95, 0.04, y + s * 1.4, y + s * 1.4 + h, 4, SAND_L);
}
// alternating long/short stone quoin blocks at a corner, on facade F at u = 0 (end 0) or u = L (end 1)
function quoins(b, F, end, v0, v1, step = 0.9) {
  for (let v = v0, k = 0; v + step * 0.5 < v1; v += step, k++) {
    const w = k % 2 ? 0.55 : 1.0, ua = end ? F.len - w : 0, ub = end ? F.len + 0.08 : w, vb = v + step * 0.5;
    fquad(b, F, ua, v, ub, vb, 0.08, SAND);
    b.quad(P(F, ua, vb, 0), P(F, ub, vb, 0), P(F, ub, vb, 0.08), P(F, ua, vb, 0.08), SAND);
    const ui = end ? ua : ub;
    b.quad(P(F, ui, v, 0), P(F, ui, vb, 0), P(F, ui, vb, 0.08), P(F, ui, v, 0.08), SAND_D);
  }
}
// dress a big round-arched church window: sill, imposts, archivolt with keystone, stone mullion and transoms
function dressWindow(b, F, h, tracery = true) {
  const u = (h.u0 + h.u1) / 2, r = (h.u1 - h.u0) / 2, vs = h.v1 - r, d = -h.depth + 0.06;
  fbox(b, F, h.u0 - 0.3, h.u1 + 0.3, h.v0 - 0.3, h.v0, 0, 0.22, SAND, false, true);
  archivolt(b, F, u, vs, r, r + 0.42, 0.16, SAND, h.seg || 6);
  fbox(b, F, h.u0 - 0.42, h.u0, vs - 0.35, vs, 0, 0.2, SAND);
  fbox(b, F, h.u1, h.u1 + 0.42, vs - 0.35, vs, 0, 0.2, SAND);
  if (!tracery) return;
  fquad(b, F, u - 0.1, h.v0, u + 0.1, vs + r * 0.6, d, SAND_L);
  for (const t of [0.34, 0.68, 1]) { const v = h.v0 + (vs - h.v0) * t; fquad(b, F, h.u0, v - 0.09, h.u1, v + 0.09, d, SAND_L); }
  // round tracery eye in the arch head
  const n = 8, rr = r * 0.42, vc = vs + r * 0.38;
  for (let k = 0; k < n; k++) {
    const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2;
    b.quad(P(F, u + Math.cos(a0) * rr, vc + Math.sin(a0) * rr, d), P(F, u + Math.cos(a0) * (rr + 0.14), vc + Math.sin(a0) * (rr + 0.14), d), P(F, u + Math.cos(a1) * (rr + 0.14), vc + Math.sin(a1) * (rr + 0.14), d), P(F, u + Math.cos(a1) * rr, vc + Math.sin(a1) * rr, d), SAND_L);
  }
}
// arched window laid on a flat (gable) wall without a recess
function flatArchWindow(b, F, u, w, v0, v1) {
  const h = { u0: u - w / 2, u1: u + w / 2, v0, v1, arch: true, seg: 6 }, pts = outline(h);
  for (let i = 1; i < pts.length - 1; i++) b.tri(P(F, pts[0][0], pts[0][1], 0.04), P(F, pts[i][0], pts[i][1], 0.04), P(F, pts[i + 1][0], pts[i + 1][1], 0.04), LEADED);
  dressWindow(b, F, { ...h, depth: -0.04 + 0.02 }, true);
}
function oculus(b, F, u, v, r, n1 = 0.14) {
  const n = 10;
  for (let k = 0; k < n; k++) {
    const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    b.tri(P(F, u, v, 0.04), P(F, u + c0 * r, v + s0 * r, 0.04), P(F, u + c1 * r, v + s1 * r, 0.04), LEADED);
    b.quad(P(F, u + c0 * r, v + s0 * r, n1), P(F, u + c0 * (r + 0.32), v + s0 * (r + 0.32), n1), P(F, u + c1 * (r + 0.32), v + s1 * (r + 0.32), n1), P(F, u + c1 * r, v + s1 * r, n1), SAND);
  }
}

// one straight wall of the church body. o: { wins: [u], door: u, c0, c1 (convex corners at the ends) }
function churchWall(b, F, o) {
  const L = F.len, x0 = (e) => (o.c0 ? -e : 0), x1 = (e) => (o.c1 ? L + e : L);
  const W = o.w || 3.0, holes = (o.wins || []).map(u => ({ u0: u - W / 2, u1: u + W / 2, v0: 3.2, v1: 12.2, arch: true, seg: 6, depth: 0.5, glass: LEADED, reveal: SAND_D }));
  if (o.door != null) {
    const u = o.door;
    holes.push({ u0: u - 1.15, u1: u + 1.15, v0: 0.9, v1: 4.7, arch: true, seg: 6, depth: 0.6, glass: DOORC, reveal: SAND_D });
    holes.push({ u0: u - 1.3, u1: u + 1.3, v0: 7.4, v1: 12.2, arch: true, seg: 6, depth: 0.5, glass: LEADED, reveal: SAND_D });
  }
  fbox(b, F, x0(0.25), x1(0.25), 0, 0.9, 0, 0.25, SAND_D);
  wall(b, F, 0, L, 0.9, EAVE, holes, BRK);
  fbox(b, F, x0(0.12), x1(0.12), 2.45, 2.75, 0, 0.12, SAND);
  for (const h of holes) {
    if (h.v0 < 1) { // the door: stone portal with pilasters, entablature and pediment
      const u = (h.u0 + h.u1) / 2;
      fbox(b, F, u - 1.75, u - 1.2, 0.9, 5.0, 0, 0.3, SAND_L); fbox(b, F, u + 1.2, u + 1.75, 0.9, 5.0, 0, 0.3, SAND_L);
      fbox(b, F, u - 2.0, u + 2.0, 5.0, 5.55, 0, 0.4, SAND, false, true);
      b.tri(P(F, u - 2.0, 5.55, 0.4), P(F, u + 2.0, 5.55, 0.4), P(F, u, 6.7, 0.4), SAND);
      b.quad(P(F, u - 2.0, 5.55, 0), P(F, u - 2.0, 5.55, 0.4), P(F, u, 6.7, 0.4), P(F, u, 6.7, 0), SAND_L);
      b.quad(P(F, u + 2.0, 5.55, 0), P(F, u + 2.0, 5.55, 0.4), P(F, u, 6.7, 0.4), P(F, u, 6.7, 0), SAND_L);
      archivolt(b, F, u, h.v1 - 1.15, 1.15, 1.45, 0.12, SAND_L, 6);
      fbox(b, F, u - 2.1, u + 2.1, 0, 0.3, 0, 1.1, '#8f887c');
      fquad(b, F, u - 0.05, 0.9, u + 0.05, 3.55, -0.55, '#3a2418');
    } else dressWindow(b, F, h);
  }
  // impost band at the springing of the arches, broken by the windows
  const vs = 12.2 - W / 2, cuts = holes.filter(h => h.v1 > vs && h.v0 < vs).sort((a, c) => a.u0 - c.u0);
  let cur = x0(0.1);
  for (const h of cuts) { if (h.u0 - 0.42 > cur) fbox(b, F, cur, h.u0 - 0.42, vs - 0.3, vs - 0.05, 0, 0.12, SAND); cur = h.u1 + 0.42; }
  if (cur < x1(0.1)) fbox(b, F, cur, x1(0.1), vs - 0.3, vs - 0.05, 0, 0.12, SAND);
  // cornice
  fbox(b, F, x0(0.25), x1(0.25), 13.0, 13.4, 0, 0.25, SAND, false, true);
  fbox(b, F, x0(0.45), x1(0.45), 13.4, 13.75, 0, 0.45, SAND_L, false, true);
  fbox(b, F, x0(0.6), x1(0.6), 13.75, EAVE, 0, 0.6, SAND, false, true);
  if (o.c0) quoins(b, F, 0, 0.9, 13.0);
  if (o.c1) quoins(b, F, 1, 0.9, 13.0);
}

// stone coping, obelisk pinnacles and a window on a gable end (F: the wall below it, apex over u = L/2)
function dressGable(b, F, win) {
  const L = F.len, H = RIDGE - EAVE, top = (u) => EAVE + H * (1 - Math.abs(u - L / 2) / (L / 2));
  for (const [ua, ub] of [[0, L / 2], [L, L / 2]]) {
    const va = top(ua), vb = top(ub);
    b.quad(P(F, ua, va, 0.15), P(F, ub, vb, 0.15), P(F, ub, vb + 0.5, 0.15), P(F, ua, va + 0.5, 0.15), SAND);
    b.quad(P(F, ua, va + 0.5, 0.15), P(F, ub, vb + 0.5, 0.15), P(F, ub, vb + 0.5, -1.0), P(F, ua, va + 0.5, -1.0), SAND_L);
  }
  const ob = (u, v, s, h) => { const p = P(F, u, v, -0.25); obelisk(b, p[0], p[2], v, s, h); };
  ob(0.2, EAVE + 0.1, 0.5, 2.6); ob(L - 0.2, EAVE + 0.1, 0.5, 2.6);
  ob(L * 0.25, top(L * 0.25) + 0.3, 0.38, 1.9); ob(L * 0.75, top(L * 0.75) + 0.3, 0.38, 1.9);
  ob(L / 2, RIDGE + 0.3, 0.45, 2.9);
  // a stone band across the gable
  const vb = EAVE + H * 0.42, ub = L / 2 * 0.42;
  fbox(b, F, ub, L - ub, vb, vb + 0.28, 0, 0.14, SAND);
  if (win === 'big') { flatArchWindow(b, F, L / 2, Math.min(3.0, L * 0.2), EAVE + 0.8, vb - 0.4); oculus(b, F, L / 2, vb + 2.1, 0.8); }
  else if (win === 'oculus') oculus(b, F, L / 2, vb + 1.8, 0.9);
}

// a blue clock dial with gold ring, hour marks and hands in a stone frame
function clock(b, F, u, v, r, n0 = 0) {
  fbox(b, F, u - r - 0.35, u + r + 0.35, v - r - 0.35, v + r + 0.35, n0, n0 + 0.12, SAND_L);
  const n = 16, z1 = n0 + 0.16, z2 = n0 + 0.2;
  for (let k = 0; k < n; k++) {
    const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    b.tri(P(F, u, v, z1), P(F, u + c0 * r, v + s0 * r, z1), P(F, u + c1 * r, v + s1 * r, z1), BLUE_D);
    b.quad(P(F, u + c0 * r, v + s0 * r, z2), P(F, u + c0 * (r + 0.16), v + s0 * (r + 0.16), z2), P(F, u + c1 * (r + 0.16), v + s1 * (r + 0.16), z2), P(F, u + c1 * r, v + s1 * r, z2), GOLD);
  }
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), t = k % 3 ? 0.05 : 0.09;
    b.quad(P(F, u + c * r * 0.72 - s * t, v + s * r * 0.72 + c * t, z2), P(F, u + c * r * 0.72 + s * t, v + s * r * 0.72 - c * t, z2), P(F, u + c * r * 0.92 + s * t, v + s * r * 0.92 - c * t, z2), P(F, u + c * r * 0.92 - s * t, v + s * r * 0.92 + c * t, z2), GOLD);
  }
  const hand = (a, len, t) => { const c = Math.cos(a), s = Math.sin(a); b.quad(P(F, u - s * t, v + c * t, z2 + 0.03), P(F, u + s * t, v - c * t, z2 + 0.03), P(F, u + c * len + s * t * 0.4, v + s * len - c * t * 0.4, z2 + 0.03), P(F, u + c * len - s * t * 0.4, v + s * len + c * t * 0.4, z2 + 0.03), GOLD); };
  hand(Math.PI * 0.62, r * 0.55, 0.11); hand(Math.PI * 0.1, r * 0.82, 0.08);
}
function louvres(b, F, h) {
  const r = (h.u1 - h.u0) / 2, vs = h.v1 - r;
  for (let v = h.v0 + 0.3; v < vs; v += 0.42) fquad(b, F, h.u0, v, h.u1, v + 0.2, -h.depth + 0.12, '#5e4b3a');
}

export default function build(b, THREE, group) {
  // ---- church body: a hall with two transverse cross-arms, each ending in a gable to the north and south ----
  const ring = [[NX0, NZ], [-13, NZ], [-13, TZ], [0, TZ], [0, NZ], [8.5, NZ], [8.5, TZ], [21.5, TZ], [21.5, NZ], [NX1, NZ],
    [NX1, -NZ], [21.5, -NZ], [21.5, -TZ], [8.5, -TZ], [8.5, -NZ], [0, -NZ], [0, -TZ], [-13, -TZ], [-13, -NZ], [NX0, -NZ]];
  const walls = ring.map((a, i) => frame(a, ring[(i + 1) % ring.length]));
  const spec = [
    { wins: [3.2], c0: true }, { c1: true }, { wins: [3.5, 9.5], c0: true, c1: true }, { c0: true }, { door: 4.25 }, { c1: true }, { wins: [3.5, 9.5], c0: true, c1: true }, { c0: true }, { wins: [3.55] , c1: true },
    { wins: [4.5, 10, 15.5], c0: true, c1: true },
    { wins: [3.55], c0: true }, { c1: true }, { wins: [3.5, 9.5], c0: true, c1: true }, { c0: true }, { door: 4.25 }, { c1: true }, { wins: [3.5, 9.5], c0: true, c1: true }, { c0: true }, { wins: [3.2], c1: true },
    { wins: [2.8, 17.2], w: 2.4, c0: true, c1: true },
  ];
  walls.forEach((F, i) => churchWall(b, F, spec[i]));
  // roofs: the hall roof east-west and the two cross roofs north-south at the same ridge height
  saddle(b, NX0, NX1, -NZ, NZ, EAVE, RIDGE - EAVE, 0.7, ROOF, BRK, false);
  for (const [x0, x1] of [[-13, 0], [8.5, 21.5]]) saddle(b, -TZ, TZ, x0, x1, EAVE, RIDGE - EAVE, 0.7, ROOF, BRK, true);
  b.box(NX0, NX1, -0.15, 0.15, RIDGE - 0.1, RIDGE + 0.25, RIDGE_C, RIDGE_C, false);
  for (const [x0, x1] of [[-13, 0], [8.5, 21.5]]) b.box((x0 + x1) / 2 - 0.15, (x0 + x1) / 2 + 0.15, -TZ, TZ, RIDGE - 0.1, RIDGE + 0.25, RIDGE_C, RIDGE_C, false);
  // gables
  dressGable(b, walls[2], 'big'); dressGable(b, walls[6], 'big'); dressGable(b, walls[12], 'big'); dressGable(b, walls[16], 'big');
  dressGable(b, walls[9], 'big');
  // roof dormers on the hall roof
  for (const x of [-16.4, 4.25, 25]) for (const s of [-1, 1]) {
    const zf = s * 6.8, yb = EAVE + (NZ - 6.8) * (RIDGE - EAVE) / NZ, hw = 1.1, top = yb + 2.0, back = zf - s * 3.2;
    const F = frame([x - hw * s, zf], [x + hw * s, zf]);
    fquad(b, F, 0, yb - 0.6, hw * 2, top, 0, SAND_L);
    fquad(b, F, 0.45, yb + 0.15, hw * 2 - 0.45, top - 0.45, 0.03, GLASS);
    fquad(b, F, hw - 0.05, yb + 0.15, hw + 0.05, top - 0.45, 0.05, SAND_L);
    for (const xs of [x - hw, x + hw]) b.quad([xs, top, zf], [xs, top, back], [xs, yb - 0.6, back], [xs, yb - 0.6, zf], ROOF);
    saddle(b, Math.min(zf, back) - (s < 0 ? 0.2 : 0), Math.max(zf, back) + (s > 0 ? 0.2 : 0), x - hw, x + hw, top, 1.1, 0.15, ROOF, SAND_L, true);
  }

  // ---- the Westertoren ----
  const sq = (h) => [[TX - h, -h], [TX + h, -h], [TX + h, h], [TX - h, h]];
  const faces = (pts) => pts.map((a, i) => frame(a, pts[(i + 1) % pts.length], TX, 0));
  // stage 1: square brick tower with stone bands, quoins, arched windows and the entrance on the Prinsengracht
  for (const F of faces(sq(TH))) {
    const L = F.len, u = L / 2, west = F.nx < -0.5, east = F.nx > 0.5;
    const holes = [];
    if (!east) {
      holes.push(west ? { u0: u - 1.3, u1: u + 1.3, v0: 1.0, v1: 6.0, arch: true, seg: 6, depth: 0.8, glass: DOORC, reveal: SAND_D } : { u0: u - 0.7, u1: u + 0.7, v0: 3.0, v1: 6.4, arch: true, depth: 0.4, glass: LEADED, reveal: SAND_D });
      holes.push({ u0: u - 0.95, u1: u + 0.95, v0: 9.2, v1: 14.2, arch: true, seg: 6, depth: 0.45, glass: LEADED, reveal: SAND_D });
      holes.push({ u0: u - 1.05, u1: u + 1.05, v0: 16.6, v1: 23.2, arch: true, seg: 6, depth: 0.45, glass: LEADED, reveal: SAND_D });
    }
    const lv = [-1, 1].map(s => ({ u0: u + s * 1.5 - 0.7, u1: u + s * 1.5 + 0.7, v0: 26.6, v1: 31.8, arch: true, seg: 6, depth: 0.55, glass: DARK, reveal: SAND_D }));
    holes.push(...lv);
    fbox(b, F, -0.25, L + 0.25, 0, 1.0, 0, 0.25, SAND_D);
    wall(b, F, 0, L, east ? EAVE : 1.0, 33.0, holes, BRK);
    for (const h of holes) {
      if (h.v0 === 1.0) { // west door portal: columns, entablature and a pediment
        fbox(b, F, u - 2.1, u - 1.55, 1.0, 6.4, 0, 0.35, SAND_L); fbox(b, F, u + 1.55, u + 2.1, 1.0, 6.4, 0, 0.35, SAND_L);
        fbox(b, F, u - 2.4, u + 2.4, 6.4, 7.0, 0, 0.45, SAND, false, true);
        b.tri(P(F, u - 2.4, 7.0, 0.45), P(F, u + 2.4, 7.0, 0.45), P(F, u, 8.3, 0.45), SAND);
        b.quad(P(F, u - 2.4, 7.0, 0), P(F, u - 2.4, 7.0, 0.45), P(F, u, 8.3, 0.45), P(F, u, 8.3, 0), SAND_L);
        b.quad(P(F, u + 2.4, 7.0, 0), P(F, u + 2.4, 7.0, 0.45), P(F, u, 8.3, 0.45), P(F, u, 8.3, 0), SAND_L);
        archivolt(b, F, u, 4.7, 1.3, 1.55, 0.14, SAND_L, 6);
        fbox(b, F, u - 2.6, u + 2.6, 0, 0.3, 0, 0.5, '#8f887c');
        fquad(b, F, u - 0.05, 1.0, u + 0.05, 4.7, -0.75, '#3a2418');
      } else if (h.glass === DARK) { archivolt(b, F, (h.u0 + h.u1) / 2, h.v1 - 0.7, 0.7, 1.0, 0.14, SAND, 6); louvres(b, F, h); fbox(b, F, h.u0 - 0.2, h.u1 + 0.2, h.v0 - 0.25, h.v0, 0, 0.2, SAND); }
      else dressWindow(b, F, h, h.u1 - h.u0 > 1.5);
    }
    for (const v of [8.3, 15.4, 24.9]) if (!east || v > 20) fbox(b, F, -0.12, L + 0.12, v, v + 0.4, 0, 0.12, SAND, false, true);
    // top cornice of the brick stage
    fbox(b, F, -0.3, L + 0.3, 32.2, 32.7, 0, 0.3, SAND, false, true);
    fbox(b, F, -0.55, L + 0.55, 32.7, 33.2, 0, 0.55, SAND_L, false, true);
    quoins(b, F, 0, east ? EAVE : 1.0, 32.2, 1.0); quoins(b, F, 1, east ? EAVE : 1.0, 32.2, 1.0);
    // balustrade round the first gallery
    for (let x = 0.55; x < L - 0.4; x += 0.5) fbox(b, F, x - 0.1, x + 0.1, 33.2, 34.05, -0.2, 0.0, SAND_L, true);
    fbox(b, F, -0.2, L + 0.2, 34.05, 34.35, -0.3, 0.05, SAND, true);
  }
  b.cap(sq(TH + 0.55), 33.2, SAND_D);
  for (const [x, z] of sq(TH - 0.1)) { b.box(x - 0.45, x + 0.45, z - 0.45, z + 0.45, 33.2, 34.6, SAND, SAND, false); b.frustum(x, z, 0.42, 0.25, 34.6, 35.1, 6, SAND_L); b.frustum(x, z, 0.25, 0.01, 35.1, 36.6, 6, SAND_L); b.frustum(x, z, 0.12, 0.12, 36.5, 36.8, 4, GOLD); }

  // stage 2: square sandstone stage with pilasters, louvred arches and the blue clock faces
  const S2 = 3.5;
  b.box(TX - S2 - 0.2, TX + S2 + 0.2, -S2 - 0.2, S2 + 0.2, 33.2, 34.6, SAND_D, SAND_D, false);
  for (const F of faces(sq(S2))) {
    const L = F.len, u = L / 2, h = { u0: u - 1.15, u1: u + 1.15, v0: 35.6, v1: 41.4, arch: true, seg: 6, depth: 0.5, glass: DARK, reveal: SAND_D };
    wall(b, F, 0, L, 34.6, 46.4, [h], SAND);
    archivolt(b, F, u, h.v1 - 1.15, 1.15, 1.45, 0.14, SAND_L, 6); louvres(b, F, h);
    fbox(b, F, h.u0 - 0.2, h.u1 + 0.2, h.v0 - 0.25, h.v0, 0, 0.2, SAND_L);
    clock(b, F, u, 44.0, 1.5);
    fbox(b, F, -0.05, 0.75, 34.6, 45.9, 0, 0.28, SAND_L); fbox(b, F, L - 0.75, L + 0.05, 34.6, 45.9, 0, 0.28, SAND_L);
    fbox(b, F, -0.3, L + 0.3, 46.4, 46.9, 0, 0.35, SAND_L, false, true);
    fbox(b, F, -0.5, L + 0.5, 46.9, 47.5, 0, 0.55, SAND, false, true);
  }
  b.cap(sq(S2 + 0.5), 47.5, SAND_D);
  for (const [x, z] of sq(S2 + 0.05)) { b.box(x - 0.35, x + 0.35, z - 0.35, z + 0.35, 47.5, 48.4, SAND, SAND, false); b.frustum(x, z, 0.3, 0.01, 48.4, 50.2, 4, SAND_L); b.frustum(x, z, 0.1, 0.1, 50.1, 50.4, 4, GOLD); }

  // stage 3: octagon with columns at the corners and arched openings
  const oct = (r) => b.ring(TX, 0, r, 8, Math.PI / 8);
  b.frustum(TX, 0, 3.45, 3.35, 47.5, 48.1, 8, SAND_D);
  for (const F of faces(oct(3.15))) {
    const L = F.len, u = L / 2, h = { u0: u - 0.65, u1: u + 0.65, v0: 48.8, v1: 53.2, arch: true, seg: 6, depth: 0.45, glass: DARK, reveal: SAND_D };
    wall(b, F, 0, L, 48.1, 54.3, [h], SAND);
    archivolt(b, F, u, h.v1 - 0.65, 0.65, 0.88, 0.12, SAND_L, 6); louvres(b, F, h);
  }
  for (const [x, z] of oct(3.3)) { b.frustum(x, z, 0.26, 0.22, 48.1, 53.7, 6, SAND_L); b.box(x - 0.32, x + 0.32, z - 0.32, z + 0.32, 53.7, 54.3, SAND, SAND, false); }
  b.frustum(TX, 0, 3.55, 3.55, 54.3, 54.75, 8, SAND);
  b.frustum(TX, 0, 3.8, 3.75, 54.75, 55.1, 8, SAND_L);
  for (const [x, z] of oct(3.55)) { b.frustum(x, z, 0.22, 0.01, 55.1, 56.5, 4, SAND_L); b.frustum(x, z, 0.08, 0.08, 56.4, 56.7, 4, GOLD); }

  // stage 4: the open octagonal lantern, columns and round arches around a dark core
  b.frustum(TX, 0, 1.5, 1.5, 55.1, 60.4, 8, DARK);
  for (const [x, z] of oct(2.4)) { b.frustum(x, z, 0.24, 0.24, 55.1, 55.5, 6, SAND); b.frustum(x, z, 0.17, 0.15, 55.5, 58.4, 6, SAND_L); }
  for (const F of faces(oct(2.55))) {
    const L = F.len;
    wall(b, F, 0, L, 57.0, 60.4, [{ u0: 0.28, u1: L - 0.28, v0: 57.0, v1: 59.5, arch: true, seg: 6, depth: 0.25, glass: DARK, reveal: SAND_D }], SAND_L);
  }
  b.frustum(TX, 0, 2.8, 2.8, 60.4, 60.8, 8, SAND);
  b.frustum(TX, 0, 3.0, 2.95, 60.8, 61.15, 8, SAND_L);

  // stage 5: small drum with round windows, carrying the crown
  for (const F of faces(oct(1.85))) { const L = F.len; wall(b, F, 0, L, 61.15, 63.4, [], SAND_L); oculus(b, F, L / 2, 62.3, 0.38, 0.08); }
  b.frustum(TX, 0, 2.1, 2.1, 63.4, 63.75, 8, SAND);

  // the imperial crown of Maximilian: gold band with jewels, blue panels with gold edges and points, blue cap, gold arches, orb
  crown(b, TX, 63.75);

  // spire with gilded ball and weathervane
  b.frustum(TX, 0, 0.16, 0.07, 71.4, 79.0, 6, '#59606a');
  b.frustum(TX, 0, 0.05, 0.4, 76.0, 76.4, 8, GOLD); b.frustum(TX, 0, 0.4, 0.05, 76.4, 76.9, 8, GOLD);
  b.frustum(TX, 0, 0.07, 0.03, 79.0, 84.6, 4, GOLD);
  b.frustum(TX, 0, 0.03, 0.22, 79.0, 79.3, 6, GOLD); b.frustum(TX, 0, 0.22, 0.03, 79.3, 79.6, 6, GOLD);
  // the weathervane: a pennant and arrow, gilded
  b.quad([TX, 81.3, 0.04], [TX + 1.7, 81.5, 0.04], [TX + 1.7, 82.4, 0.04], [TX, 82.6, 0.04], GOLD);
  b.tri([TX + 1.7, 81.5, 0.04], [TX + 2.3, 81.95, 0.04], [TX + 1.7, 82.4, 0.04], GOLD);
  b.quad([TX - 1.3, 81.9, 0.04], [TX, 81.9, 0.04], [TX, 82.0, 0.04], [TX - 1.3, 82.0, 0.04], GOLD);
  b.tri([TX - 1.1, 81.95, 0.04], [TX - 1.6, 82.3, 0.04], [TX - 1.6, 81.6, 0.04], GOLD);
}

function crown(b, cx, y0) {
  const n = 8, r0 = 2.05, rot = Math.PI / n;
  const ring = (r, y) => Array.from({ length: n }, (_, i) => { const a = rot + i / n * Math.PI * 2; return [cx + Math.cos(a) * r, y, Math.sin(a) * r]; });
  // gold band
  b.frustum(cx, 0, r0, r0, y0, y0 + 0.9, n, GOLD);
  const bandF = ring(r0 + 0.02, 0).map((a, i, arr) => frame([a[0], a[2]], [arr[(i + 1) % n][0], arr[(i + 1) % n][2]], cx, 0));
  bandF.forEach((F, i) => {
    const L = F.len;
    fbox(b, F, L / 2 - 0.22, L / 2 + 0.22, y0 + 0.22, y0 + 0.68, 0, 0.1, i % 2 ? '#c0283a' : '#2a8a5a');
    for (const s of [-1, 1]) fbox(b, F, L / 2 + s * 0.55 - 0.08, L / 2 + s * 0.55 + 0.08, y0 + 0.36, y0 + 0.52, 0, 0.08, '#f4f0e0');
  });
  // blue panels flaring out, gold edges
  const y1 = y0 + 0.9, y2 = y1 + 2.4, lo = ring(r0, y1), hi = ring(r0 + 0.35, y2);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    b.quad(lo[i], lo[j], hi[j], hi[i], i % 2 ? BLUE : BLUE_D);
    // gold strip up each corner, and a gold point on top
    const a = rot + i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), t = 0.14;
    b.quad([cx + c * (r0 + 0.04) - s * t, y1, s * (r0 + 0.04) + c * t], [cx + c * (r0 + 0.04) + s * t, y1, s * (r0 + 0.04) - c * t], [cx + c * (r0 + 0.4) + s * t, y2, s * (r0 + 0.4) - c * t], [cx + c * (r0 + 0.4) - s * t, y2, s * (r0 + 0.4) + c * t], GOLD);
    const pr = r0 + 0.38;
    b.tri([cx + c * pr - s * 0.35, y2, s * pr + c * 0.35], [cx + c * pr + s * 0.35, y2, s * pr - c * 0.35], [cx + c * pr, y2 + 0.85, s * pr], GOLD);
    b.tri([cx + c * (pr - 0.25), y2, s * (pr - 0.25)], [cx + c * pr - s * 0.35, y2, s * pr + c * 0.35], [cx + c * pr, y2 + 0.85, s * pr], '#c99d22');
    b.tri([cx + c * (pr - 0.25), y2, s * (pr - 0.25)], [cx + c * pr + s * 0.35, y2, s * pr - c * 0.35], [cx + c * pr, y2 + 0.85, s * pr], '#c99d22');
    // a small gold lily on each panel
    const am = rot + (i + 0.5) / n * Math.PI * 2, cm = Math.cos(am), sm = Math.sin(am), rm = (r0 + 0.2) * Math.cos(Math.PI / n) + 0.03, ym = (y1 + y2) / 2;
    b.quad([cx + cm * rm - sm * 0.12, ym - 0.5, sm * rm + cm * 0.12], [cx + cm * rm + sm * 0.12, ym - 0.5, sm * rm - cm * 0.12], [cx + cm * rm + sm * 0.12, ym + 0.5, sm * rm - cm * 0.12], [cx + cm * rm - sm * 0.12, ym + 0.5, sm * rm + cm * 0.12], GOLD);
    b.quad([cx + cm * rm - sm * 0.4, ym - 0.1, sm * rm + cm * 0.4], [cx + cm * rm + sm * 0.4, ym - 0.1, sm * rm - cm * 0.4], [cx + cm * rm + sm * 0.4, ym + 0.1, sm * rm - cm * 0.4], [cx + cm * rm - sm * 0.4, ym + 0.1, sm * rm + cm * 0.4], GOLD);
  }
  b.cap(hi.map(p => [p[0], p[2]]), y2 - 0.05, BLUE_D);
  // the blue cap (mitre) inside, rising to the orb
  const prof = [[r0 + 0.1, y2 - 0.1], [r0 - 0.05, y2 + 0.9], [1.6, y2 + 1.8], [0.95, y2 + 2.5], [0.3, y2 + 2.85]];
  for (let k = 0; k < prof.length - 1; k++) b.frustum(cx, 0, prof[k][0], prof[k + 1][0], prof[k][1], prof[k + 1][1], n, k % 2 ? BLUE_D : BLUE);
  // two gold arches crossing over the top
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const c = Math.cos(a), s = Math.sin(a), w = 0.2, pts = prof.map(([r, y]) => [r + 0.1, y + 0.08]);
    for (let k = 0; k < pts.length - 1; k++) {
      const [ra, ya] = pts[k], [rb, yb] = pts[k + 1];
      const A = (r, y, o) => [cx + c * r - s * o, y, s * r + c * o];
      b.quad(A(ra, ya, -w), A(ra, ya, w), A(rb, yb, w), A(rb, yb, -w), GOLD);
      b.quad(A(ra, ya, w), A(ra - 0.25, ya, w), A(rb - 0.25, yb, w), A(rb, yb, w), '#c99d22');
      b.quad(A(ra, ya, -w), A(ra - 0.25, ya, -w), A(rb - 0.25, yb, -w), A(rb, yb, -w), '#c99d22');
    }
  }
  // orb and cross
  const yo = y2 + 2.9;
  b.frustum(cx, 0, 0.15, 0.5, yo, yo + 0.4, 8, GOLD);
  b.frustum(cx, 0, 0.5, 0.15, yo + 0.4, yo + 0.85, 8, '#d4a72a');
}
