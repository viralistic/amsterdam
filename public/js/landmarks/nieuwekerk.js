// nieuwekerk: hand-built landmark model. Local metres, +z is the front facade (south, towards the palace), y up.
// Late-Gothic cruciform church: west front with a huge window and stair turrets, nave with lean-to aisles,
// transepts with tall gables, a choir with ambulatory ending in a polygonal apse, and a slender crossing turret.
// gothicKit() below is also used by oudekerk.js.
import { GOLD } from './builder.js';

const BR = '#8f5b43', BR2 = '#7f4f3a', SAND = '#d2c59f', SAND2 = '#bdae86', GLASS = '#323f50', DOOR = '#4b3020';
const ROOF = '#4d555d', ROOF2 = '#454c53', RIDGE = '#30353a', LEADC = '#5e6366', LEAD2 = '#4f5457';

// ---------------------------------------------------------------------------------------------------------------
// Gothic kit: faces (local wall frames), recessed pointed windows with tracery, buttresses, roofs, turrets.
// A face maps (s along the wall, y up, d outwards) to model space.
export function gothicKit(b, THREE, textured = []) {
  const tex = new Set(textured);
  // textured colours get horizontal brick / slate courses from the shared facade texture (its plain left strip)
  const uv = (p, col) => tex.has(col) ? [0.15, p[1] / 6.4] : [0.01, 0.01];
  const T = (a, c, d, col) => b.tri(a, c, d, col, [uv(a, col), uv(c, col), uv(d, col)]);
  const Q = (a, c, d, e, col) => { T(a, c, d, col); T(a, d, e, col); };

  const face = (ax, az, bx, bz, cx = 0, cz = 0) => {
    const len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
    let nx = -uz, nz = ux;
    if (((ax + bx) / 2 - cx) * nx + ((az + bz) / 2 - cz) * nz < 0) { nx = -nx; nz = -nz; }
    return { len, nx, nz, ux, uz, P: (s, y, d = 0) => [ax + ux * s + nx * d, y, az + uz * s + nz * d] };
  };
  const poly = (f, contour, d, col, holes = []) => {
    const v = a => a.map(([s, y]) => new THREE.Vector2(s, y));
    const c = v(contour), hs = holes.map(v);
    const tris = THREE.ShapeUtils.triangulateShape(c, hs);
    const all = c.concat(...hs);
    for (const [i, j, k] of tris) T(f.P(all[i].x, all[i].y, d), f.P(all[j].x, all[j].y, d), f.P(all[k].x, all[k].y, d), col);
  };
  // flat strip of width t along a 2D polyline on a face
  const ribbon = (f, pts, t, d, col, closed = false) => {
    const n = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < n; i++) {
      const [s0, y0] = pts[i], [s1, y1] = pts[(i + 1) % pts.length];
      const l = Math.hypot(s1 - s0, y1 - y0) || 1, es = (s1 - s0) / l * t * 0.3, ey = (y1 - y0) / l * t * 0.3;
      const ns = -(y1 - y0) / l * t / 2, ny = (s1 - s0) / l * t / 2;
      Q(f.P(s0 - es - ns, y0 - ey - ny, d), f.P(s1 + es - ns, y1 + ey - ny, d), f.P(s1 + es + ns, y1 + ey + ny, d), f.P(s0 - es + ns, y0 - ey + ny, d), col);
    }
  };
  // pointed arch outline (k = 1 equilateral, 0.5 round), CCW from bottom left; grow offsets it outwards
  const arch = (cx, w, y0, ys, k = 1, n = 5, grow = 0) => {
    const h = w / 2, R = Math.max(w * k, h), Rg = R + grow, a1 = Math.acos((h - R) / Rg);
    const yb = y0 >= 0 ? Math.max(0, y0 - grow * 0.6) : y0 - grow * 0.6, pts = [[cx - h - grow, yb], [cx + h + grow, yb]];
    for (let i = 0; i <= n; i++) { const a = (Math.PI - a1) * i / n; pts.push([cx + h - R + Math.cos(a) * Rg, ys + Math.sin(a) * Rg]); }
    for (let i = 1; i <= n; i++) { const a = a1 + (Math.PI - a1) * i / n; pts.push([cx - h + R + Math.cos(a) * Rg, ys + Math.sin(a) * Rg]); }
    return pts;
  };
  const apexH = (w, k) => { const h = w / 2, R = Math.max(w * k, h); return Math.sqrt(R * R - (R - h) * (R - h)); };
  const circle = (cs, cy, r, n = 10) => Array.from({ length: n }, (_, i) => [cs + Math.cos(i / n * Math.PI * 2) * r, cy + Math.sin(i / n * Math.PI * 2) * r]);

  // mullions, sub-arches and an oculus inside a pointed window head
  const tracery = (f, s, w, y0, ys, k, lights, d, col, t = 0.2) => {
    if (lights < 2) return;
    const Hm = apexH(w, k);
    let ws;
    if (lights === 4) {
      ws = w / 2;
      ribbon(f, [[s, y0], [s, ys]], t * 1.3, d, col);
      for (const sg of [-1, 1]) {
        const cs = s + sg * w / 4;
        ribbon(f, arch(cs, ws, ys, ys, k, 4).slice(2), t, d, col);
        tracery(f, cs, ws, y0, ys, k, 2, d, col, t * 0.75);
      }
    } else {
      ws = w / lights;
      for (let i = 1; i < lights; i++) ribbon(f, [[s - w / 2 + i * ws, y0], [s - w / 2 + i * ws, ys]], t, d, col);
      for (let i = 0; i < lights; i++) ribbon(f, arch(s - w / 2 + (i + 0.5) * ws, ws, ys, ys, k, 3).slice(2), t * 0.8, d, col);
    }
    const Hs = apexH(ws, k), yc = (Hs + Hm) / 2, R = Math.max(w * k, w / 2);
    const half = Math.sqrt(Math.max(0, R * R - yc * yc)) - (R - w / 2);
    const r = Math.min((Hm - Hs) * 0.42, half * 0.8);
    if (r > 0.15) {
      ribbon(f, circle(s, ys + yc, r, lights === 4 ? 12 : 8), t * 0.8, d, col, true);
      if (lights >= 3) { ribbon(f, [[s - r, ys + yc], [s + r, ys + yc]], t * 0.6, d, col); ribbon(f, [[s, ys + yc - r], [s, ys + yc + r]], t * 0.6, d, col); }
    }
    if (ys - y0 > 7) ribbon(f, [[s - w / 2, (y0 + ys) / 2], [s + w / 2, (y0 + ys) / 2]], t, d, col); // transom
  };

  // box on a face: s0..s1 along, d0..d1 out, y0..y1, top may slope up towards the wall
  const fbox = (f, s0, s1, d0, d1, y0, y1, col, top = col, slope = 0) => {
    const A = f.P(s0, y0, d1), B = f.P(s1, y0, d1), C = f.P(s1, y1, d1), D = f.P(s0, y1, d1);
    const Cb = f.P(s1, y1 + slope, d0), Db = f.P(s0, y1 + slope, d0);
    Q(A, B, C, D, col);
    Q(f.P(s0, y0, d0), A, D, Db, col); Q(B, f.P(s1, y0, d0), Cb, C, col);
    Q(D, C, Cb, Db, top);
  };

  // a recessed window; returns its outline to cut out of the wall
  const win = (f, o) => {
    const { s, w, y0, ys, k = 1, n = 5, dp = 0.5, lights = 2, frame = SAND, glass = GLASS, band = 0.3, sill = true, trac = frame } = o;
    const pts = arch(s, w, y0, ys, k, n);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], c = pts[(i + 1) % pts.length];
      Q(f.P(a[0], a[1], 0), f.P(c[0], c[1], 0), f.P(c[0], c[1], -dp), f.P(a[0], a[1], -dp), frame);
    }
    poly(f, pts, -dp, glass);
    tracery(f, s, w, y0, ys, k, lights, -dp + 0.08, trac, Math.min(0.24, w * 0.07));
    if (band) {
      const out = arch(s, w, y0, ys, k, n, band);
      for (let i = 1; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        Q(f.P(pts[i][0], pts[i][1], 0.05), f.P(pts[j][0], pts[j][1], 0.05), f.P(out[j][0], out[j][1], 0.05), f.P(out[i][0], out[i][1], 0.05), frame);
      }
    }
    if (sill) fbox(f, s - w / 2 - band - 0.15, s + w / 2 + band + 0.15, 0, 0.28, y0 - band - 0.3, y0 - band * 0.6, frame);
    return pts;
  };
  // round window (rose)
  const rose = (f, s, y, r, frame = SAND, dp = 0.4) => {
    const pts = circle(s, y, r, 12);
    for (let i = 0; i < 12; i++) { const a = pts[i], c = pts[(i + 1) % 12]; Q(f.P(a[0], a[1], 0), f.P(c[0], c[1], 0), f.P(c[0], c[1], -dp), f.P(a[0], a[1], -dp), frame); }
    poly(f, pts, -dp, GLASS);
    ribbon(f, circle(s, y, r * 0.4, 8), 0.16, -dp + 0.06, frame, true);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ribbon(f, [[s + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4], [s + Math.cos(a) * r, y + Math.sin(a) * r]], 0.14, -dp + 0.06, frame); }
    ribbon(f, circle(s, y, r + 0.18, 12), 0.36, 0.05, frame, true);
    return pts;
  };
  const wall = (f, contour, col, wins = [], roses = []) => {
    const holes = wins.map(o => win(f, o)).concat(roses.map(([s, y, r]) => rose(f, s, y, r)));
    poly(f, contour, 0, col, holes);
  };
  // stepped buttress on a face; stages [[yTop, depth], ...] bottom to top, sandstone weatherings
  const buttress = (f, s, w, stages, col, cap = SAND, y = 0) => {
    for (let i = 0; i < stages.length; i++) {
      const [yt, dp] = stages[i];
      fbox(f, s - w / 2, s + w / 2, 0, dp, y, yt, col, cap, dp * (i === stages.length - 1 ? 1.1 : 0.8));
      y = yt;
    }
  };

  // prisms and spires from rings of [x, z]
  const ring = (cx, cz, r, n, rot = Math.PI / n) => Array.from({ length: n }, (_, i) => { const a = rot + i / n * Math.PI * 2; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; });
  const prism = (rg, y0, y1, col, capCol = null) => {
    for (let i = 0; i < rg.length; i++) { const a = rg[i], c = rg[(i + 1) % rg.length]; Q([a[0], y0, a[1]], [c[0], y0, c[1]], [c[0], y1, c[1]], [a[0], y1, a[1]], col); }
    if (capCol) for (let i = 1; i < rg.length - 1; i++) T([rg[0][0], y1, rg[0][1]], [rg[i][0], y1, rg[i][1]], [rg[i + 1][0], y1, rg[i + 1][1]], capCol);
  };
  const frust = (cx, cz, r0, r1, y0, y1, n, col, cap = true, rot = Math.PI / n) => {
    const a = ring(cx, cz, r0, n, rot), c = ring(cx, cz, Math.max(r1, 0.001), n, rot);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (r1 < 0.01) T([a[i][0], y0, a[i][1]], [a[j][0], y0, a[j][1]], [cx, y1, cz], col);
      else Q([a[i][0], y0, a[i][1]], [a[j][0], y0, a[j][1]], [c[j][0], y1, c[j][1]], [c[i][0], y1, c[i][1]], col);
    }
    if (cap && r1 >= 0.01) for (let i = 1; i < n - 1; i++) T([c[0][0], y1, c[0][1]], [c[i][0], y1, c[i][1]], [c[i + 1][0], y1, c[i + 1][1]], col);
  };
  const pinnacle = (x, z, y, r, h, col = SAND, top = col) => {
    frust(x, z, r, r, y, y + h * 0.4, 4, col, false, Math.PI / 4);
    frust(x, z, r * 1.25, r * 1.25, y + h * 0.4, y + h * 0.47, 4, col, true, Math.PI / 4);
    frust(x, z, r * 1.05, 0, y + h * 0.47, y + h, 4, top, false, Math.PI / 4);
  };

  // pitched roof over a rectangle, ridge along x ('x') or z; eave overhang, verges, slate bands, ridge cap
  const roof = (axis, a0, a1, c0, c1, y, h, o = {}) => {
    const { ov = 0.6, v0 = 0.5, v1 = 0.5, col = ROOF, alt = ROOF2, ridge = RIDGE, bands = 4 } = o;
    const m = axis === 'x' ? (a, yy, c) => [a, yy, c] : (a, yy, c) => [c, yy, a];
    const cm = (c0 + c1) / 2, half = (c1 - c0) / 2, slope = h / half, A0 = a0 - v0, A1 = a1 + v1;
    for (const sg of [-1, 1]) {
      const ce = cm + sg * (half + ov), ye = y - ov * slope;
      for (let i = 0; i < bands; i++) {
        const t0 = i / bands, t1 = (i + 1) / bands;
        const c_0 = ce + (cm - ce) * t0, c_1 = ce + (cm - ce) * t1, y_0 = ye + (y + h - ye) * t0, y_1 = ye + (y + h - ye) * t1;
        Q(m(A0, y_0, c_0), m(A1, y_0, c_0), m(A1, y_1, c_1), m(A0, y_1, c_1), i % 2 ? alt : col);
      }
      Q(m(A0, ye, ce), m(A1, ye, ce), m(A1, ye - 0.35, ce), m(A0, ye - 0.35, ce), ridge);
      // ridge cap
      Q(m(A0, y + h + 0.25, cm), m(A1, y + h + 0.25, cm), m(A1, y + h - 0.2, cm + sg * 0.45), m(A0, y + h - 0.2, cm + sg * 0.45), ridge);
    }
    // verge boards at the gable ends
    for (const [A, sg] of [[A0, 1], [A1, -1]]) {
      if ((sg > 0 ? v0 : v1) <= 0) continue;
      for (const s2 of [-1, 1]) Q(m(A, y - ov * slope, cm + s2 * (half + ov)), m(A, y + h + 0.25, cm), m(A, y + h - 0.15, cm), m(A, y - ov * slope - 0.35, cm + s2 * (half + ov)), ridge);
    }
  };
  // a fan roof from a ring of 3D points to an apex (apse roofs, half spires)
  const fan = (pts, apex, col = ROOF, alt = ROOF2) => { for (let i = 0; i < pts.length - 1; i++) T(pts[i], pts[i + 1], apex, i % 2 ? alt : col); };

  // small slate dormer on a roof whose ridge runs along x: eave line at |z| = half, height y, given slope
  const dormer = (x, sg, half, y, slope, col = ROOF2, cap = RIDGE, glass = GLASS) => {
    const zf = sg * (half - 1.3), yb = y + 1.3 * slope, yt = yb + 1.4, ya = yb + 2.3;
    const ze = sg * (half - (yt - y) / slope), za = sg * (half - (ya - y) / slope);
    const ff = face(x - 0.75, zf, x + 0.75, zf, x, 0);
    poly(ff, [[0, yb], [1.5, yb], [1.5, yt], [0.75, ya], [0, yt]], 0, col);
    poly(ff, [[0.4, yb + 0.25], [1.1, yb + 0.25], [1.1, yt - 0.1], [0.4, yt - 0.1]], 0.03, '#efe9dc');
    poly(ff, [[0.5, yb + 0.35], [1.0, yb + 0.35], [1.0, yt - 0.2], [0.5, yt - 0.2]], 0.05, glass);
    for (const dx of [-0.75, 0.75]) T([x + dx, yb, zf], [x + dx, yt, zf], [x + dx, yt, ze], col);
    for (const dx of [-0.9, 0.9]) Q([x + dx, yt - 0.1, zf + sg * 0.15], [x, ya + 0.1, zf + sg * 0.15], [x, ya + 0.1, za], [x + dx, yt - 0.1, ze], cap);
  };

  return { dormer, T, Q, face, poly, ribbon, arch, circle, fbox, win, rose, wall, buttress, ring, prism, frust, pinnacle, roof, fan, tracery };
}

// ---------------------------------------------------------------------------------------------------------------
export default function build(b, THREE) {
  const K = gothicKit(b, THREE, [BR, BR2, ROOF, ROOF2]);
  const { face, wall, buttress, fbox, ribbon, roof, fan, frust, pinnacle, prism, ring, Q, T, win } = K;
  const XW = -37, X1 = -4, X2 = 8, XT = 2, CX = 25.85, NW = 6.5, AW = 12, TZ = 14;
  const HA = 11, HL = 14, HN = 20, HR = 32.5;
  const BUT = [[6, 1.1], [HA - 0.8, 0.75]];

  // sandstone plinth, string course and cornice along a straight wall
  const bands = (f, s0, s1, top, course = 2.6) => {
    fbox(f, s0, s1, 0, 0.18, 0, 0.9, SAND2, SAND2);
    if (course) fbox(f, s0, s1, 0, 0.12, course, course + 0.3, SAND);
    fbox(f, s0, s1, 0, 0.3, top - 0.45, top, SAND);
  };
  const aisleWin = s => ({ s, w: 3.3, y0: 3.4, ys: 7, lights: 2 });
  const clerWin = s => ({ s, w: 2.4, y0: 15, ys: 17.1, lights: 2, band: 0.22 });

  // ---- side aisles and clerestories of nave and choir (both sides) ----
  for (const sg of [1, -1]) {
    const z = sg * AW;
    // nave aisle: 6 bays of 5.5 m; on the north side the low houses cover three bays
    const fa = face(XW, z, X1, z);
    const houses = sg < 0 ? [1, 2, 3] : [];
    wall(fa, [[0, 0], [33, 0], [33, HA], [0, HA]], BR, [0, 1, 2, 3, 4, 5].filter(i => !houses.includes(i)).map(i => aisleWin(2.75 + 5.5 * i)));
    bands(fa, 0, 33, HA);
    for (let i = 1; i <= 5; i++) buttress(fa, 5.5 * i, 1.0, BUT, BR2);
    buttress(fa, 0.55, 1.1, BUT, BR2);
    // choir aisle: 3 bays of 6 m
    const fc = face(X2, z, CX, z);
    wall(fc, [[0, 0], [18, 0], [18, HA], [0, HA]], BR, [3, 9, 15].map(aisleWin));
    bands(fc, 0, 18, HA);
    for (const s of [6, 12]) buttress(fc, s, 1.0, BUT, BR2);
    // clerestories
    const fn = face(XW, sg * NW, X1, sg * NW);
    wall(fn, [[0, HL - 1], [33, HL - 1], [33, HN], [0, HN]], BR, [0, 1, 2, 3, 4, 5].map(i => clerWin(2.75 + 5.5 * i)));
    fbox(fn, 0, 33, 0, 0.3, HN - 0.45, HN, SAND);
    const fq = face(X2, sg * NW, CX, sg * NW);
    wall(fq, [[0, HL - 1], [18, HL - 1], [18, HN], [0, HN]], BR, [3, 9, 15].map(clerWin));
    fbox(fq, 0, 18, 0, 0.3, HN - 0.45, HN, SAND);
    // lean-to aisle roofs
    const sl = (HL - HA) / (AW - NW), eo = 0.5;
    for (const [x0, x1, v0] of [[XW - 0.3, X1, 0.3], [X2, CX, 0]]) {
      Q([x0, HA - eo * sl, sg * (AW + eo)], [x1, HA - eo * sl, sg * (AW + eo)], [x1, HL + 0.1, sg * NW], [x0, HL + 0.1, sg * NW], ROOF);
      Q([x0, HA - eo * sl, sg * (AW + eo)], [x1, HA - eo * sl, sg * (AW + eo)], [x1, HA - eo * sl - 0.3, sg * (AW + eo)], [x0, HA - eo * sl - 0.3, sg * (AW + eo)], RIDGE);
    }
  }

  // ---- ambulatory and apse: 5/8 polygons around (CX, 0) ----
  const angs = [90, 45, 0, -45, -90].map(a => a * Math.PI / 180);
  const pv = (r, a) => [CX + Math.cos(a) * r, Math.sin(a) * r];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = pv(AW, angs[i]), [bx, bz] = pv(AW, angs[i + 1]);
    const f = face(ax, az, bx, bz, CX, 0);
    wall(f, [[0, 0], [f.len, 0], [f.len, HA], [0, HA]], BR, [aisleWin(f.len / 2)]);
    bands(f, 0, f.len, HA);
    const [ix, iz] = pv(NW, angs[i]), [jx, jz] = pv(NW, angs[i + 1]);
    const g = face(ix, iz, jx, jz, CX, 0);
    wall(g, [[0, HL - 1], [g.len, HL - 1], [g.len, HN], [0, HN]], BR, [{ s: g.len / 2, w: 2.2, y0: 15, ys: 17.1, lights: 2, band: 0.2 }]);
    fbox(g, 0, g.len, 0, 0.3, HN - 0.45, HN, SAND);
    // ambulatory lean-to
    const sl = (HL - HA) / (AW - NW), eo = 0.5;
    const [ox0, oz0] = pv(AW + eo, angs[i]), [ox1, oz1] = pv(AW + eo, angs[i + 1]);
    Q([ox0, HA - eo * sl, oz0], [ox1, HA - eo * sl, oz1], [jx, HL + 0.1, jz], [ix, HL + 0.1, iz], i % 2 ? ROOF2 : ROOF);
    Q([ox0, HA - eo * sl, oz0], [ox1, HA - eo * sl, oz1], [ox1, HA - eo * sl - 0.3, oz1], [ox0, HA - eo * sl - 0.3, oz0], RIDGE);
  }
  // radial buttresses at the polygon corners, with small pinnacles
  for (let i = 0; i < 5; i++) {
    const a = angs[i], tx = -Math.sin(a), tz = Math.cos(a), [vx, vz] = pv(AW, a);
    const f = face(vx - tx * 0.55, vz - tz * 0.55, vx + tx * 0.55, vz + tz * 0.55, CX, 0);
    buttress(f, 0.55, 1.1, BUT, BR2);
    if (i > 0 && i < 4) { const p = f.P(0.55, 0, 0.5); pinnacle(p[0], p[2], HA + 0.3, 0.32, 3.2); }
    const [ux, uz] = pv(NW, a);
    const g = face(ux - tx * 0.4, uz - tz * 0.4, ux + tx * 0.4, uz + tz * 0.4, CX, 0);
    buttress(g, 0.4, 0.8, [[HN - 1, 0.6]], BR2, SAND, HL - 0.5);
  }
  // nave + choir roof, ending in a polygonal apse roof
  const sl = (HR - HN) / NW, ov = 0.6;
  roof('x', XW, CX, -NW, NW, HN, HR - HN, { ov, v0: 0.5, v1: 0 });
  const er = NW + ov, ey = HN - ov * sl;
  fan(angs.map(a => [CX + Math.cos(a) * er / Math.cos(Math.PI / 8) * (a === angs[0] || a === angs[4] ? Math.cos(Math.PI / 8) : 1), ey, Math.sin(a) * er / Math.cos(Math.PI / 8) * (a === angs[0] || a === angs[4] ? Math.cos(Math.PI / 8) : 1)]), [CX, HR, 0]);
  for (let i = 0; i < 4; i++) { // eave strip
    const m = a => (a === angs[0] || a === angs[4] ? 1 : 1 / Math.cos(Math.PI / 8)) * er;
    const p0 = [CX + Math.cos(angs[i]) * m(angs[i]), ey, Math.sin(angs[i]) * m(angs[i])], p1 = [CX + Math.cos(angs[i + 1]) * m(angs[i + 1]), ey, Math.sin(angs[i + 1]) * m(angs[i + 1])];
    Q(p0, p1, [p1[0], ey - 0.35, p1[2]], [p0[0], ey - 0.35, p0[2]], RIDGE);
  }
  frust(CX, 0, 0.2, 0, HR, HR + 2.2, 4, GOLD); // finial on the apse

  // ---- transepts ----
  roof('z', -TZ, TZ, X1, X2, HN, HR - HN, { ov: 0.6, v0: 0.5, v1: 0.5 });
  for (const sg of [1, -1]) {
    const z = sg * TZ;
    const f = face(X1, z, X2, z);
    const big = { s: 6, w: 7.2, y0: 8, ys: 15, lights: 4, dp: 0.7, band: 0.4 };
    const door = { s: 6, w: 3.4, y0: 0, ys: 3.4, lights: 0, glass: DOOR, dp: 0.9, band: 0.55, sill: false };
    const wins = sg > 0 ? [big, door] : [big, { s: 6, w: 2.2, y0: 0, ys: 2.6, lights: 0, glass: DOOR, dp: 0.6, band: 0.35, sill: false }];
    wall(f, [[0, 0], [12, 0], [12, HN], [6, HR], [0, HN]], BR, wins, [[6, 25.2, 1.7]]);
    // small lancets flanking the rose
    fbox(f, 0, 12, 0, 0.18, 0, 0.9, SAND2, SAND2);
    fbox(f, 0, 12, 0, 0.12, 6.4, 6.7, SAND);
    fbox(f, 0, 1.9, 0, 0.3, HN - 0.45, HN, SAND); fbox(f, 10.1, 12, 0, 0.3, HN - 0.45, HN, SAND);
    // gable coping and finial
    ribbon(f, [[-0.1, HN], [6, HR + 0.3], [12.1, HN]], 0.7, 0.35, SAND);
    const ap = f.P(6, HR, 0.2); pinnacle(ap[0], ap[2], HR - 0.4, 0.3, 3.4, SAND, GOLD);
    // corner buttresses (two per corner) with pinnacles
    for (const s of [0.6, 11.4]) {
      buttress(f, s, 1.2, [[7, 1.0], [HN - 1.5, 0.7]], BR2);
      const p = f.P(s, 0, 0.35); pinnacle(p[0], p[2], HN - 0.4, 0.42, 4.6);
    }
    // the side walls of the arms (above the aisle roofs and the strip beyond the aisles)
    for (const [x, cxs] of [[X1, -1], [X2, 1]]) {
      const fs = face(x, sg * NW, x, z, XT, 0);
      wall(fs, [[0, 0], [7.5, 0], [7.5, HN], [0, HN]], BR, [{ s: 3.2, w: 2.4, y0: 15, ys: 17.1, lights: 2, band: 0.22 }]);
      fbox(fs, 0, 7.5, 0, 0.3, HN - 0.45, HN, SAND);
      fbox(fs, 5.3, 7.5, 0, 0.18, 0, 0.9, SAND2, SAND2);
      buttress(fs, 6.9, 1.1, [[7, 1.0], [HN - 1.5, 0.7]], BR2);
      void cxs;
    }
    // portal steps and porch (south, towards the Dam)
    if (sg > 0) {
      fbox(f, 3.4, 8.6, 0, 0.95, 0, 0.25, SAND2, SAND2);
      fbox(f, 3.8, 8.2, 0, 0.6, 0.25, 0.5, SAND2, SAND2);
      // gabled sandstone frame (wimperg) over the door
      ribbon(f, [[3.6, 6.2], [6, 8.0], [8.4, 6.2]], 0.45, 0.25, SAND);
      for (const s of [3.5, 8.5]) { const p = f.P(s, 0, 0.3); pinnacle(p[0], p[2], 5.6, 0.22, 3.1); }
    }
  }

  // ---- west front ----
  {
    const f = face(XW, AW, XW, -AW);
    wall(f, [[0, 0], [24, 0], [24, HA], [18.5, HL], [18.5, HN], [12, HR], [5.5, HN], [5.5, HL], [0, HA]], BR,
      [{ s: 12, w: 7.6, y0: 7.6, ys: 16, lights: 4, dp: 0.7, band: 0.45 },
       { s: 12, w: 3.4, y0: 0, ys: 3.5, lights: 0, glass: DOOR, dp: 0.9, band: 0.55, sill: false },
       { s: 2.75, w: 3.0, y0: 3.4, ys: 7, lights: 2 }, { s: 21.25, w: 3.0, y0: 3.4, ys: 7, lights: 2 },
       { s: 10.9, w: 1.1, y0: 24, ys: 26.6, lights: 0, band: 0.18 }, { s: 13.1, w: 1.1, y0: 24, ys: 26.6, lights: 0, band: 0.18 }]);
    fbox(f, 0, 24, 0, 0.18, 0, 0.9, SAND2, SAND2);
    fbox(f, 0, 24, 0, 0.12, 2.6, 2.9, SAND);
    fbox(f, 0, 5.2, 0, 0.3, HA - 0.45, HA, SAND); fbox(f, 18.8, 24, 0, 0.3, HA - 0.45, HA, SAND);
    ribbon(f, [[5.4, HN], [12, HR + 0.3], [18.6, HN]], 0.7, 0.35, SAND);
    ribbon(f, [[-0.2, HA], [5.5, HL]], 0.5, 0.3, SAND); ribbon(f, [[18.5, HL], [24.2, HA]], 0.5, 0.3, SAND);
    ribbon(f, [[9.6, 6.6], [12, 7.4], [14.4, 6.6]], 0.4, 0.2, SAND);
    const ap = f.P(12, HR, 0.2); pinnacle(ap[0], ap[2], HR - 0.4, 0.3, 3.4, SAND, GOLD);
    for (const s of [0.55, 23.45]) buttress(f, s, 1.1, BUT, BR2);
    fbox(f, 10.2, 13.8, 0, 0.9, 0, 0.25, SAND2, SAND2);
    // stair turrets at the nave corners
    for (const z of [NW + 0.2, -NW - 0.2]) {
      const cx = XW - 0.35;
      prism(ring(cx, z, 1.4, 8), 0, 24, BR);
      frust(cx, z, 1.55, 1.55, 0, 0.9, 8, SAND2, false);
      for (const y of [HA - 0.4, HN - 0.4]) frust(cx, z, 1.52, 1.52, y, y + 0.4, 8, SAND, false);
      frust(cx, z, 1.62, 1.62, 23.6, 24.4, 8, SAND);
      // small arched openings near the top
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 8 + i * Math.PI / 2 + Math.PI / 4, p0 = [cx + Math.cos(a - 0.3) * 1.42, z + Math.sin(a - 0.3) * 1.42], p1 = [cx + Math.cos(a + 0.3) * 1.42, z + Math.sin(a + 0.3) * 1.42];
        const ft = face(p0[0], p0[1], p1[0], p1[1], cx, z);
        K.poly(ft, K.arch(ft.len / 2, 0.55, 20.6, 22, 1, 3), 0.03, GLASS);
      }
      frust(cx, z, 1.5, 0, 24.4, 31, 8, ROOF);
      frust(cx, z, 0.14, 0.14, 31, 31.8, 4, GOLD); frust(cx, z, 0.28, 0, 31.8, 32.6, 4, GOLD);
    }
  }

  // ---- crossing turret (dakruiter): lead-clad octagon, two open lanterns with balconies, needle spire ----
  {
    const x = XT, z = 0, DARK = '#23272b';
    // base octagon with pointed louvres and little gablets
    frust(x, z, 2.1, 2.1, HR - 2.5, HR + 3.4, 8, LEADC, false);
    const br = ring(x, z, 2.1, 8);
    for (let i = 0; i < 8; i++) {
      const p0 = br[i], p1 = br[(i + 1) % 8], ft = face(p0[0], p0[1], p1[0], p1[1], x, z), m = ft.len / 2;
      K.poly(ft, K.arch(m, 0.75, HR + 0.6, HR + 2.0, 1, 3), 0.03, DARK);
      ribbon(ft, [[m - 0.38, HR + 1.2], [m + 0.38, HR + 1.2]], 0.08, 0.05, LEAD2);
      ribbon(ft, [[m - 0.38, HR + 1.6], [m + 0.38, HR + 1.6]], 0.08, 0.05, LEAD2);
      K.poly(ft, [[0.05, HR + 3.4], [ft.len - 0.05, HR + 3.4], [m, HR + 4.6]], 0.02, LEADC);
      ribbon(ft, [[0.05, HR + 3.4], [m, HR + 4.6], [ft.len - 0.05, HR + 3.4]], 0.12, 0.05, GOLD);
    }
    frust(x, z, 2.25, 2.25, HR + 3.2, HR + 3.45, 8, GOLD, false);
    // lantern stage generator: floor, dark core, posts, top cornice and balustrade
    const lantern = (r, y0, y1, posts) => {
      frust(x, z, r + 0.45, r + 0.45, y0 - 0.25, y0, 8, LEAD2);
      frust(x, z, r * 0.62, r * 0.62, y0, y1, 8, DARK, false);
      const pr = ring(x, z, r, 8), rr = ring(x, z, r + 0.4, 8);
      for (const [px, pz] of pr) frust(px, pz, posts, posts, y0, y1, 4, LEADC, false);
      for (let i = 0; i < 8; i++) {
        const a = rr[i], c = rr[(i + 1) % 8];
        Q([a[0], y0 + 0.75, a[1]], [c[0], y0 + 0.75, c[1]], [c[0], y0 + 0.9, c[1]], [a[0], y0 + 0.9, a[1]], GOLD);
        frust(a[0], a[1], 0.06, 0.06, y0, y0 + 0.75, 4, LEAD2, false);
        // pointed arch heads between the posts
        const p0 = pr[i], p1 = pr[(i + 1) % 8], ft = face(p0[0], p0[1], p1[0], p1[1], x, z), m = ft.len / 2;
        K.poly(ft, [[0, y1 - m * 1.3], [m * 0.25, y1 - m * 0.55], [m, y1 - 0.15], [ft.len - m * 0.25, y1 - m * 0.55], [ft.len, y1 - m * 1.3], [ft.len, y1], [0, y1]], 0, LEADC);
      }
      frust(x, z, r + 0.2, r + 0.2, y1, y1 + 0.45, 8, LEAD2);
      frust(x, z, r + 0.3, r + 0.3, y1 + 0.45, y1 + 0.6, 8, GOLD);
    };
    lantern(1.65, HR + 4.6, HR + 8.4, 0.17);
    frust(x, z, 1.85, 1.15, HR + 9.0, HR + 9.9, 8, LEADC, false);
    lantern(1.05, HR + 9.9, HR + 12.3, 0.12);
    // ogee cap and needle spire with ball and vane
    frust(x, z, 1.25, 0.95, HR + 12.9, HR + 13.5, 8, LEADC, false);
    frust(x, z, 0.95, 0.35, HR + 13.5, HR + 14.6, 8, LEADC, false);
    frust(x, z, 0.4, 0.4, HR + 14.6, HR + 14.8, 8, GOLD);
    frust(x, z, 0.33, 0, HR + 14.8, HR + 22.5, 8, LEADC);
    frust(x, z, 0.26, 0.26, HR + 22.6, HR + 23.1, 6, GOLD);
    frust(x, z, 0.05, 0.05, HR + 23.1, HR + 24.6, 4, GOLD, false);
    Q([x, HR + 23.8, z - 0.04], [x + 0.9, HR + 23.8, z - 0.04], [x + 0.9, HR + 24.3, z - 0.04], [x, HR + 24.3, z - 0.04], GOLD);
  }

  // ---- small dormers in the big roofs ----
  for (const sg of [1, -1]) for (const x of [-31, -20, -9, 14, 20]) K.dormer(x, sg, NW, HN, (HR - HN) / NW);

  // ---- small houses and a sacristy built against the north side ----
  const HB = ['#7a3f2b', '#8d5236', '#6f4a3a'], HROOF = ['#8a4a32', '#4d555d', '#7c3f2c'];
  [[-31.3, -26.2, 7.2], [-25.8, -20.7, 8.4], [-20.3, -15.2, 6.6]].forEach(([x0, x1, h], i) => {
    const z0 = -AW - 0.1, z1 = -14.75;
    const fr = face(x0, z1, x1, z1, (x0 + x1) / 2, 0), w = x1 - x0, gh = 2.6;
    K.poly(fr, [[0, 0], [w, 0], [w, h], [w / 2, h + gh], [0, h]], 0, HB[i]);
    for (const fs of [face(x0, z0, x0, z1, x1, -13.5), face(x1, z0, x1, z1, x0, -13.5)]) K.poly(fs, [[0, 0], [fs.len, 0], [fs.len, h], [0, h]], 0, HB[i]);
    // roof ridge runs into the church wall
    for (const sg of [-1, 1]) {
      const xe = (x0 + x1) / 2 + sg * (w / 2 + 0.25), ye = h - 0.25 * gh / (w / 2);
      Q([xe, ye, z1 - 0.25], [xe, ye, z0], [(x0 + x1) / 2, h + gh, z0], [(x0 + x1) / 2, h + gh, z1 - 0.25], HROOF[i]);
    }
    // windows with white frames, door, cornice
    const wnd = (s, y, ww, hh) => { fbox(fr, s - ww / 2 - 0.12, s + ww / 2 + 0.12, 0, 0.08, y - 0.12, y + hh + 0.12, '#efe9dc'); fbox(fr, s - ww / 2, s + ww / 2, 0, 0.1, y, y + hh, GLASS); };
    wnd(w * 0.3, h - 2.4, 1.0, 1.4); wnd(w * 0.7, h - 2.4, 1.0, 1.4); wnd(w / 2, h + 0.4, 0.6, 0.8);
    fbox(fr, w * 0.62 - 0.55, w * 0.62 + 0.55, 0, 0.1, 0, 2.2, i === 1 ? '#2f4a3a' : DOOR);
    wnd(w * 0.25, 1.1, 1.0, 1.3);
    fbox(fr, -0.05, w + 0.05, 0, 0.2, h - 0.25, h, '#efe9dc');
    const cp = fr.P(w * 0.75, 0, -1); frust(cp[0], cp[2], 0.3, 0.3, h + 0.6, h + gh + 0.6, 4, HB[i]); // chimney
  });
  // sacristy against the north transept / choir corner
  {
    const x0 = X2 + 0.6, x1 = X2 + 7, z0 = -AW, z1 = -14.6, h = 6;
    const fr = face(x0, z1, x1, z1, (x0 + x1) / 2, 0);
    wall(fr, [[0, 0], [6.4, 0], [6.4, h], [3.2, h + 3], [0, h]], BR, [{ s: 3.2, w: 1.8, y0: 2, ys: 4.2, lights: 2, band: 0.2 }]);
    fbox(fr, 0, 6.4, 0, 0.15, 0, 0.8, SAND2, SAND2);
    ribbon(fr, [[-0.1, h], [3.2, h + 3.15], [6.5, h]], 0.45, 0.2, SAND);
    for (const fs of [face(x0, z0, x0, z1, x1, -13), face(x1, z0, x1, z1, x0, -13)]) K.poly(fs, [[0, 0], [fs.len, 0], [fs.len, h], [0, h]], 0, BR);
    for (const sg of [-1, 1]) Q([(x0 + x1) / 2 + sg * 3.45, h - 0.15, z1 - 0.3], [(x0 + x1) / 2 + sg * 3.45, h - 0.15, z0], [(x0 + x1) / 2, h + 3, z0], [(x0 + x1) / 2, h + 3, z1 - 0.3], ROOF);
  }
  void win; void T;
}
