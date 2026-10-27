// bijenkorf: hand-built landmark model. Local metres, +z is the front facade (the Dam), y up.
// De Bijenkorf (1914): red-brown brick department store with a sandstone ground floor, display windows with awnings,
// stone-framed window rows between brick pilasters, a heavy cornice, a set-back attic and the round domed corner
// tower on the Dam / Damrak corner (local -x, +z). The Damrak facade is local -x.
import { SANDSTONE, STONE, BRICK, OLDBRICK, SLATE, COPPER, LEAD, GOLD } from './builder.js';

const BRK = '#8c4430', BRK_D = '#77372a', SAND = '#d2c3a0', SAND_D = '#b3a27f', SAND_L = '#ddd0b0', GRANITE = '#55524f';
const GLASS = '#2d3945', DISPLAY = '#55646b', FRAME = '#ebe6da', AWNING = '#24282b', ROOF = '#5a5450', DOME = '#5f957b', RIB = '#cfb35a';

// ---- facade toolkit: a facade frame F runs along u from a to b, v is height, n points outwards ----
function frame(a, b, cx = 0, cz = 0) {
  let dx = b[0] - a[0], dz = b[1] - a[1];
  const len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
  const F = { ax: a[0], az: a[1], ux, uz, nx: -uz, nz: ux, len };
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
// a sloping shop awning over an opening, with a pale valance
function awning(b, F, u0, u1, vTop, out, drop) {
  const v1 = vTop - drop;
  b.quad(P(F, u0, vTop, 0.02), P(F, u1, vTop, 0.02), P(F, u1, v1, out), P(F, u0, v1, out), AWNING);
  b.tri(P(F, u0, vTop, 0.02), P(F, u0, v1, out), P(F, u0, v1, 0.02), AWNING);
  b.tri(P(F, u1, vTop, 0.02), P(F, u1, v1, out), P(F, u1, v1, 0.02), AWNING);
  fbox(b, F, u0, u1, v1 - 0.32, v1, out - 0.04, out, '#e9e4d8', true, true);
}
// a flag hanging from a horizontal-ish pole end: stripes top to bottom, slight wave
function flag(b, x, y, z, dir, w, h, stripes, crosses) {
  const [dx, dz] = dir, sh = h / stripes.length;
  const pt = (s, t, wave) => [x + dx * s - dz * wave, y - t, z + dz * s + dx * wave];
  stripes.forEach((c, i) => {
    const t0 = i * sh, t1 = (i + 1) * sh;
    b.quad(pt(0, t0, 0), pt(w / 2, t0, 0.25), pt(w / 2, t1, 0.25), pt(0, t1, 0), c);
    b.quad(pt(w / 2, t0, 0.25), pt(w, t0, -0.05), pt(w, t1, -0.05), pt(w / 2, t1, 0.25), c);
  });
  if (crosses) for (let k = 0; k < 3; k++) { // the three white St Andrew's crosses of Amsterdam on the black band
    const s = w * (0.22 + k * 0.28), t = h / 2, e = sh * 0.36, wv = s < w / 2 ? 0.25 * s / (w / 2) + 0.03 : 0.25 - 0.3 * (s - w / 2) / (w / 2) + 0.03;
    b.quad(pt(s - e, t - e, wv), pt(s - e + 0.1, t - e, wv), pt(s + e, t + e, wv), pt(s + e - 0.1, t + e, wv), '#f2f2f2');
    b.quad(pt(s + e, t - e, wv), pt(s + e - 0.1, t - e, wv), pt(s - e, t + e, wv), pt(s - e + 0.1, t + e, wv), '#f2f2f2');
  }
}
function pole(b, x, z, y0, y1) { b.frustum(x, z, 0.09, 0.06, y0, y1, 5, '#e8e8e8'); b.frustum(x, z, 0.16, 0.16, y1, y1 + 0.3, 6, GOLD); }

// ---- the building ----
const XW = 26, ZF = 33.5;                          // main walls (inset from the 27.5 x 35 footprint for cornices/awnings)
const TC = [-20.9, 28.4], TR = 5.9, TN = 16;        // corner tower
const FLOORS = [6.8, 10.3, 13.8, 17.3], CORN = 23.2, TOP = 24.5;

function bays(L, s0, s1, w = 5) { const nb = Math.max(1, Math.round((L - s0 - s1) / w)), bw = (L - s0 - s1) / nb; return { nb, bw, c: [...Array(nb)].map((_, i) => s0 + bw * (i + 0.5)) }; }

// one straight facade of the main block. s0/s1: margins at both ends; c0/c1: convex corner at that end (extend bands round it)
function facade(b, F, s0, s1, c0, c1, door) {
  const L = F.len, { nb, bw, c } = bays(L, s0, s1);
  const e0 = (o) => (c0 ? -o : 0), e1 = (o) => (c1 ? L + o : L);
  // ground floor: granite plinth, sandstone wall with display windows and one entrance
  fbox(b, F, e0(0.2), e1(0.2), 0, 0.6, 0, 0.2, GRANITE);
  const g = c.map((u, i) => i === door
    ? { u0: u - 1.4, u1: u + 1.4, v0: 0.6, v1: 5.2, arch: true, depth: 0.7, glass: '#3a3f44', reveal: SAND_D }
    : { u0: u - bw / 2 + 0.7, u1: u + bw / 2 - 0.7, v0: 0.95, v1: 4.6, depth: 0.45, glass: DISPLAY, reveal: SAND_D });
  wall(b, F, 0, L, 0.6, 6.0, g, SAND);
  c.forEach((u, i) => {
    const h = g[i];
    if (i === door) {
      archivolt(b, F, u, h.v1 - 1.4, 1.4, 1.95, 0.3, SAND_L);
      fbox(b, F, u - 2.2, u + 2.2, 0, 0.25, 0, 1.0, '#8d877c'); // step
      fquad(b, F, u - 0.07, 0.6, u + 0.07, 3.5, -0.62, FRAME); // door leaves
      fquad(b, F, u - 1.4, 3.4, u + 1.4, 3.56, -0.62, FRAME);
    } else {
      fbox(b, F, h.u0 - 0.1, h.u1 + 0.1, 0.75, 0.95, 0, 0.18, SAND_L); // stall riser
      fquad(b, F, h.u0, 3.7, h.u1, 3.84, -0.4, FRAME); // transom bar
      for (const m of [h.u0 + (h.u1 - h.u0) / 3, h.u0 + 2 * (h.u1 - h.u0) / 3]) fquad(b, F, m - 0.06, 0.95, m + 0.06, 4.6, -0.4, FRAME);
      awning(b, F, h.u0 - 0.15, h.u1 + 0.15, 5.3, 1.25, 0.75);
    }
  });
  // rusticated piers between the shop windows
  for (let i = 0; i <= nb; i++) { const u = s0 + bw * i; for (let v = 1.4; v < 5.6; v += 1.1) fquad(b, F, u - 0.55, v, u + 0.55, v + 0.1, 0.03, SAND_D); }
  // heavy string course over the ground floor
  fbox(b, F, e0(0.35), e1(0.35), 6.0, 6.75, 0, 0.35, SAND, false, true);
  fbox(b, F, e0(0.2), e1(0.2), 6.75, 6.9, 0, 0.2, SAND_L);
  // upper storeys: brick with stone framed windows, round-arched on the top floor
  const holes = [];
  for (const f of FLOORS) for (const u of c) holes.push(f === FLOORS[3]
    ? { u0: u - 1.3, u1: u + 1.3, v0: f + 0.8, v1: f + 3.2, arch: true, depth: 0.32, reveal: SAND_D }
    : { u0: u - 1.4, u1: u + 1.4, v0: f + 0.85, v1: f + 2.85, depth: 0.32, reveal: SAND_D });
  wall(b, F, 0, L, 6.9, CORN, holes, BRK);
  for (const h of holes) {
    const u = (h.u0 + h.u1) / 2;
    fbox(b, F, h.u0 - 0.2, h.u1 + 0.2, h.v0 - 0.22, h.v0, 0, 0.24, SAND); // sill
    if (h.arch) { archivolt(b, F, u, h.v1 - 1.3, 1.3, 1.62, 0.16, SAND); fquad(b, F, u - 0.07, h.v0, u + 0.07, h.v1 - 0.1, -0.24, FRAME); fquad(b, F, h.u0, h.v1 - 1.3, h.u1, h.v1 - 1.2, -0.24, FRAME); }
    else {
      fbox(b, F, h.u0 - 0.2, h.u1 + 0.2, h.v1, h.v1 + 0.3, 0, 0.14, SAND); // lintel
      fquad(b, F, u - 0.07, h.v0, u + 0.07, h.v1, -0.24, FRAME);
      fquad(b, F, h.u0, h.v1 - 0.62, h.u1, h.v1 - 0.5, -0.24, FRAME);
    }
  }
  // brick pilasters between the bays with stone bases and capitals
  for (let i = 0; i <= nb; i++) {
    const u = s0 + bw * i, w = (i === 0 && !c0) || (i === nb && !c1) ? 0.4 : 0.48;
    fbox(b, F, u - w, u + w, 6.9, 20.5, 0, 0.3, BRK_D);
    fbox(b, F, u - w - 0.1, u + w + 0.1, 20.5, 20.95, 0, 0.42, SAND);
    fbox(b, F, u - w - 0.05, u + w + 0.05, 13.65, 13.95, 0, 0.36, SAND);
  }
  fbox(b, F, e0(0.12), e1(0.12), 13.7, 13.9, 0, 0.12, SAND); // thin band at the third floor
  // corner quoins
  for (const [on, u0] of [[c0, 0], [c1, L - 1.1]]) if (on) for (let v = 6.9, k = 0; v < 20.4; v += 0.9, k++) fbox(b, F, u0 + (k % 2 ? 0.25 : 0) * (u0 ? 1 : 0), u0 + 1.1 - (k % 2 ? 0.25 : 0) * (u0 ? 0 : 1), v, v + 0.45, 0, 0.12, SAND_L, false, false);
  // frieze line, modillions and the cornice
  fbox(b, F, e0(0.12), e1(0.12), 20.95, 21.1, 0, 0.12, SAND);
  for (let u = 0.6; u < L - 0.3; u += 1.5) fbox(b, F, u - 0.15, u + 0.15, 22.8, CORN, 0, 0.45, SAND_L);
  fbox(b, F, e0(0.5), e1(0.5), CORN, 23.7, 0, 0.5, SAND, false, true);
  fbox(b, F, e0(1.0), e1(1.0), 23.7, 24.15, 0, 1.0, SAND_L, false, true);
  fbox(b, F, e0(0.6), e1(0.6), 24.15, TOP, 0, 0.6, SAND);
  // brick parapet with stone coping
  fbox(b, F, e0(0), e1(0), TOP, 25.5, -0.45, 0, BRK_D, true, false);
  fbox(b, F, e0(0.05), e1(0.05), 25.5, 25.7, -0.5, 0.05, SAND_L, true);
}

export default function build(b, THREE, group) {
  const [tx, tz] = TC;
  // where the main walls meet the round tower
  const fx = tx + Math.sqrt(TR * TR - (ZF - tz) ** 2), sz = tz - Math.sqrt(TR * TR - (XW + tx) ** 2);
  const ring = [[fx, ZF], [XW, ZF], [XW, -ZF], [-XW, -ZF], [-XW, sz]];
  const front = frame([fx, ZF], [XW, ZF]), east = frame([XW, ZF], [XW, -ZF]), back = frame([XW, -ZF], [-XW, -ZF]), damrak = frame([-XW, -ZF], [-XW, sz]);
  facade(b, front, 1.4, 1.2, false, true, 4);
  facade(b, east, 1.2, 1.2, true, true, 6);
  facade(b, back, 1.2, 1.2, true, true, 5);
  facade(b, damrak, 1.2, 1.4, true, false, 3);
  b.cap(ring, TOP - 0.05, ROOF);

  // set-back attic storey with small windows and a flat roof
  const AX = 23, AZ = 30.5;
  const ax = tx + Math.sqrt(TR * TR - (AZ - tz) ** 2), az = tz - Math.sqrt(TR * TR - (AX + tx) ** 2);
  const aring = [[ax, AZ], [AX, AZ], [AX, -AZ], [-AX, -AZ], [-AX, az]];
  for (let i = 0; i < aring.length; i++) {
    const F = frame(aring[i], aring[(i + 1) % aring.length]), L = F.len, { c } = bays(L, 1, 1, 2.6);
    wall(b, F, 0, L, TOP, 28.2, c.map(u => ({ u0: u - 0.6, u1: u + 0.6, v0: 25.9, v1: 27.4, depth: 0.2, reveal: SAND_D })), BRK_D);
    fbox(b, F, -0.3, L + 0.3, 28.2, 28.6, 0, 0.3, SAND);
  }
  b.cap(aring, 28.6, ROOF);
  for (const [x, z, w, d] of [[10, -24, 7, 5], [12, 14, 5, 4], [-18, -26, 4, 6]]) b.box(x, x + w, z, z + d, 28.6, 30.4, '#6e6a66', '#5a5552', false); // roof plant rooms
  // glazed roof over the central atrium, with white glazing bars
  b.box(-7.4, 7.4, -18.4, 10.4, 28.6, 29.1, SAND, SAND, false);
  b.gable(-7, 7, -18, 10, 29.1, 2.8, '#8fa9b4', '#7d97a2', true);
  for (let z = -18; z <= 10.01; z += 2) for (const sx of [-1, 1]) b.quad([sx * 7, 29.15, z - 0.07], [sx * 7, 29.15, z + 0.07], [0, 31.95, z + 0.07], [0, 31.95, z - 0.07], FRAME);
  b.box(-0.15, 0.15, -18, 10, 31.9, 32.05, FRAME, FRAME, false);

  // ---- round corner tower ----
  const tring = b.ring(tx, tz, TR, TN, Math.PI / TN);
  const inMain = (F) => { const m = P(F, F.len / 2, 0, 0.8); return m[0] > -XW && m[0] < XW && m[2] > -ZF && m[2] < ZF && m[0] - m[2] > fx - ZF; };
  for (let i = 0; i < TN; i++) {
    const F = frame(tring[i], tring[(i + 1) % TN], tx, tz), L = F.len, u = L / 2;
    const hidden = inMain(F);
    const ang = Math.atan2(P(F, u, 0, 1)[2] - tz, P(F, u, 0, 1)[0] - tx), diag = Math.abs(ang - Math.PI * 0.75) < 0.25;
    if (!hidden) {
      fbox(b, F, -0.05, L + 0.05, 0, 0.6, 0, 0.2, GRANITE);
      const g = diag ? { u0: u - 1.0, u1: u + 1.0, v0: 0.6, v1: 4.8, arch: true, depth: 0.6, glass: '#3a3f44', reveal: SAND_D }
        : { u0: u - 0.85, u1: u + 0.85, v0: 0.95, v1: 4.6, depth: 0.4, glass: DISPLAY, reveal: SAND_D };
      wall(b, F, 0, L, 0.6, 6.0, [g], SAND);
      if (diag) { archivolt(b, F, u, 3.8, 1.0, 1.4, 0.25, SAND_L); fbox(b, F, u - 1.4, u + 1.4, 0, 0.25, 0, 0.9, '#8d877c'); }
      else { fbox(b, F, g.u0, g.u1, 3.7, 3.82, -0.4, -0.3, FRAME); awning(b, F, g.u0 - 0.05, g.u1 + 0.05, 5.3, 0.75, 0.55); }
      fbox(b, F, -0.1, L + 0.1, 6.0, 6.75, 0, 0.35, SAND);
      fbox(b, F, -0.05, L + 0.05, 6.75, 6.9, 0, 0.2, SAND_L);
      const holes = FLOORS.map(f => f === FLOORS[3] ? { u0: u - 0.7, u1: u + 0.7, v0: f + 0.8, v1: f + 3.0, arch: true, depth: 0.3, reveal: SAND_D } : { u0: u - 0.7, u1: u + 0.7, v0: f + 0.85, v1: f + 2.85, depth: 0.3, reveal: SAND_D });
      wall(b, F, 0, L, 6.9, CORN, holes, BRK);
      for (const h of holes) { fbox(b, F, h.u0 - 0.15, h.u1 + 0.15, h.v0 - 0.2, h.v0, 0, 0.22, SAND); if (!h.arch) fbox(b, F, h.u0 - 0.15, h.u1 + 0.15, h.v1, h.v1 + 0.28, 0, 0.12, SAND); }
      fbox(b, F, -0.05, 0.25, 6.9, 20.5, 0, 0.18, i % 2 ? SAND : BRK_D); // ribs at the corners of the polygon
      fbox(b, F, -0.05, L + 0.05, 13.7, 13.9, 0, 0.12, SAND);
      fbox(b, F, -0.05, L + 0.05, 20.95, 21.1, 0, 0.12, SAND);
      fbox(b, F, u - 0.15, u + 0.15, 22.8, CORN, 0, 0.45, SAND_L);
    }
    // the tower rises above the main cornice everywhere
    fbox(b, F, -0.12, L + 0.12, CORN, 23.7, 0, 0.5, SAND);
    fbox(b, F, -0.18, L + 0.18, 23.7, 24.15, 0, 0.7, SAND_L, false, true);
    fbox(b, F, -0.15, L + 0.15, 24.15, TOP, 0, 0.6, SAND);
    const hu = { u0: u - 0.6, u1: u + 0.6, v0: 25.8, v1: 30.8, arch: true, depth: 0.3, reveal: SAND_D };
    wall(b, F, 0, L, TOP, 32.5, [hu], BRK);
    archivolt(b, F, u, 30.2, 0.6, 0.85, 0.14, SAND);
    fquad(b, F, hu.u0, 28.0, hu.u1, 28.12, -0.22, FRAME);
    fbox(b, F, hu.u0 - 0.15, hu.u1 + 0.15, 25.4, 25.6, 0, 0.2, SAND);
    fbox(b, F, -0.05, 0.3, TOP, 32.5, 0, 0.16, SAND_L); // stone corner strips on the upper drum
    fbox(b, F, -0.12, L + 0.12, 32.5, 33.0, 0, 0.45, SAND);
    fbox(b, F, -0.15, L + 0.15, 33.0, 33.4, 0, 0.6, SAND_L, false, true);
  }
  b.cap(b.ring(tx, tz, TR + 0.55, TN, Math.PI / TN), 33.4, SAND);
  // balustrade round the foot of the dome
  const br = b.ring(tx, tz, TR + 0.2, TN, Math.PI / TN);
  for (let i = 0; i < TN; i++) {
    const F = frame(br[i], br[(i + 1) % TN], tx, tz), L = F.len;
    for (let u = 0.35; u < L - 0.2; u += 0.58) fbox(b, F, u - 0.1, u + 0.1, 33.4, 34.25, -0.2, 0, SAND_L, true);
    fbox(b, F, -0.05, L + 0.05, 34.25, 34.5, -0.25, 0.05, SAND, true);
  }
  // drum with round windows, then the copper dome with gilded ribs, lantern, finial and flag
  b.frustum(tx, tz, 5.1, 5.1, 33.4, 34.9, TN, SAND_L);
  const dr = b.ring(tx, tz, 5.13, TN, Math.PI / TN);
  for (let i = 0; i < TN; i += 2) { const F = frame(dr[i], dr[(i + 1) % TN], tx, tz); ovalWin(b, F, F.len / 2, 34.15, 0.42); }
  const DB = 34.9, DH = 5.6, DRAD = 5.1, steps = [0, 0.32, 0.64, 0.96, 1.26];
  const pr = steps.map(t => [DRAD * Math.cos(t), DB + DH * Math.sin(t)]);
  for (let k = 0; k < steps.length - 1; k++) b.frustum(tx, tz, pr[k][0], pr[k + 1][0], pr[k][1], pr[k + 1][1], TN, k % 2 ? DOME : '#6aa186');
  for (let i = 0; i < TN; i += 2) { // gilded ribs
    const a = Math.PI / TN + i / TN * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), px = -sa * 0.14, pz = ca * 0.14;
    for (let k = 0; k < steps.length - 1; k++) {
      const [r0, y0] = pr[k], [r1, y1] = pr[k + 1], o = 0.08;
      b.quad([tx + ca * (r0 + o) + px, y0, tz + sa * (r0 + o) + pz], [tx + ca * (r0 + o) - px, y0, tz + sa * (r0 + o) - pz], [tx + ca * (r1 + o) - px, y1, tz + sa * (r1 + o) - pz], [tx + ca * (r1 + o) + px, y1, tz + sa * (r1 + o) + pz], RIB);
    }
  }
  const LB = pr[pr.length - 1][1];
  b.frustum(tx, tz, 1.75, 1.75, LB - 0.3, LB + 0.2, 8, SAND_L);
  b.frustum(tx, tz, 0.95, 0.95, LB + 0.2, LB + 2.5, 8, '#3a3f44'); // lantern core
  for (const [x, z] of b.ring(tx, tz, 1.4, 8, Math.PI / 8)) b.box(x - 0.16, x + 0.16, z - 0.16, z + 0.16, LB + 0.2, LB + 2.5, SAND_L, SAND_L, false);
  b.frustum(tx, tz, 1.7, 1.6, LB + 2.5, LB + 2.85, 8, SAND);
  b.frustum(tx, tz, 1.5, 0.35, LB + 2.85, LB + 4.0, 8, DOME);
  b.frustum(tx, tz, 0.3, 0.3, LB + 4.0, LB + 4.4, 6, GOLD);
  b.frustum(tx, tz, 0.4, 0.01, LB + 4.4, LB + 5.0, 6, GOLD);
  pole(b, tx, tz, LB + 5.0, LB + 11);
  flag(b, tx, LB + 10.9, tz, [Math.SQRT1_2, Math.SQRT1_2], 3.0, 2.0, ['#ae1c28', '#f2f2f2', '#21468b']);

  // flagpoles on the parapet: Amsterdam flags along the Dam front and the Damrak
  for (const x of [-4, 10, 22]) { pole(b, x, ZF - 0.3, 25.7, 32); flag(b, x, 31.9, ZF - 0.3, [1, 0], 2.7, 1.8, ['#c8102e', '#111111', '#c8102e'], true); }
  for (const z of [10, -10]) { pole(b, -XW + 0.3, z, 25.7, 32); flag(b, -XW + 0.3, 31.9, z, [0, -1], 2.7, 1.8, ['#c8102e', '#111111', '#c8102e'], true); }

  // the white "de Bijenkorf" lettering on the frieze under the cornice (Dam front and Damrak side)
  const tex = signTexture(THREE);
  const sm = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.35, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  const sign = (F, u, w) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 8), sm);
    const p = P(F, u, 21.95, 0.04);
    m.position.set(p[0], p[1], p[2]);
    m.rotation.y = Math.atan2(F.nx, F.nz);
    group.add(m);
  };
  sign(front, front.len * 0.55, 19);
  sign(damrak, damrak.len * 0.55, 19);
  sign(east, east.len * 0.5, 19);
}

// small round (oval-ish) window on a facade: stone ring and dark glass
function ovalWin(b, F, u, v, r) {
  const n = 8;
  for (let k = 0; k < n; k++) {
    const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2;
    b.tri(P(F, u, v, 0.04), P(F, u + Math.cos(a0) * r, v + Math.sin(a0) * r, 0.04), P(F, u + Math.cos(a1) * r, v + Math.sin(a1) * r, 0.04), GLASS);
    b.quad(P(F, u + Math.cos(a0) * r, v + Math.sin(a0) * r, 0.1), P(F, u + Math.cos(a0) * (r + 0.18), v + Math.sin(a0) * (r + 0.18), 0.1), P(F, u + Math.cos(a1) * (r + 0.18), v + Math.sin(a1) * (r + 0.18), 0.1), P(F, u + Math.cos(a1) * r, v + Math.sin(a1) * r, 0.1), SAND);
  }
}

// The "de Bijenkorf" lettering: white italic serif on transparent, 8:1.
function signTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f7f3ea';
  g.font = 'italic bold 104px Georgia, "Times New Roman", serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('de Bijenkorf', 512, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
