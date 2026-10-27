// paleis: the Royal Palace on the Dam (Jacob van Campen, 1648-1665). Local metres, +z is the Dam facade, y up.
// Dutch Classicism: 23 window axes, a projecting central risalit with pediment and statues, corner pavilions,
// two pilaster orders each with a tall window and a mezzanine window, seven small arched doors, lead roofs
// around two courtyards and the octagonal cupola with its cog-ship weathervane.
import { GOLD } from './builder.js';

const WALL = '#cbb98c', PIL = '#d8c89c', CAP = '#e0d2a8', CORN = '#d3c296', PLINTH = '#a0916d', REVEAL = '#9f9068';
const GLASS = '#29333f', BAR = '#ece7d8', FRAME = '#ddcfa6', DOOR = '#3b2f22', FEST = '#b19c69';
const TYMP = '#a99870', RELIEF = '#ddd0a6', BRONZE = '#6b6246', ROOF = '#646b6f', ROOF2 = '#596064', DECK = '#5b6164';
const COPPER = '#5e9c80', COPPER2 = '#548f74', COURT = '#c2b086', PAVING = '#8b8372';

// darken / lighten a hex colour
const sh = (c, k) => '#' + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(c.slice(i, i + 2), 16) * k))).toString(16).padStart(2, '0')).join('');

// A facade frame: u along the wall, y up, w outwards. Returns local -> world [x, y, z].
const frame = (ox, oz, tx, tz, nx, nz) => (u, y, w) => [ox + tx * u + nx * w, y, oz + tz * u + nz * w];
const sub = (P, u0, y0, w0) => (u, y, w) => P(u0 + u, y0 + y, w0 + w);

function rect(b, P, u0, u1, y0, y1, w, c) { b.quad(P(u0, y0, w), P(u1, y0, w), P(u1, y1, w), P(u0, y1, w), c); }
// box sticking out of the wall: front face at wf, back at wb; f = which faces (front top bottom left right)
function slab(b, P, u0, u1, y0, y1, wb, wf, c, f = 'ftblr') {
  if (f.includes('f')) rect(b, P, u0, u1, y0, y1, wf, c);
  if (f.includes('t')) b.quad(P(u0, y1, wb), P(u1, y1, wb), P(u1, y1, wf), P(u0, y1, wf), sh(c, 1.06));
  if (f.includes('b')) b.quad(P(u0, y0, wb), P(u1, y0, wb), P(u1, y0, wf), P(u0, y0, wf), sh(c, 0.72));
  if (f.includes('l')) b.quad(P(u0, y0, wb), P(u0, y0, wf), P(u0, y1, wf), P(u0, y1, wb), c);
  if (f.includes('r')) b.quad(P(u1, y0, wb), P(u1, y0, wf), P(u1, y1, wf), P(u1, y1, wb), c);
}
// sloped moulding: top edge from (ua, ya) to (ub, yb), t thick, from wb to wf
function rake(b, P, ua, ya, ub, yb, t, wb, wf, c) {
  b.quad(P(ua, ya - t, wf), P(ub, yb - t, wf), P(ub, yb, wf), P(ua, ya, wf), c);
  b.quad(P(ua, ya, wb), P(ub, yb, wb), P(ub, yb, wf), P(ua, ya, wf), sh(c, 1.06));
  b.quad(P(ua, ya - t, wb), P(ub, yb - t, wb), P(ub, yb - t, wf), P(ua, ya - t, wf), sh(c, 0.72));
}
// tapered box centred on (u, w) in frame P
function tbox(b, P, u, w, y0, y1, hu0, hw0, hu1, hw1, c, top = true) {
  const A = [P(u - hu0, y0, w - hw0), P(u + hu0, y0, w - hw0), P(u + hu0, y0, w + hw0), P(u - hu0, y0, w + hw0)];
  const B = [P(u - hu1, y1, w - hw1), P(u + hu1, y1, w - hw1), P(u + hu1, y1, w + hw1), P(u - hu1, y1, w + hw1)];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; b.quad(A[i], A[j], B[j], B[i], c); }
  if (top) b.quad(B[0], B[1], B[2], B[3], sh(c, 1.06));
}
// square beam between two local points
function beam(b, P, a, c2, r, c) {
  const A = P(...a), B = P(...c2), d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
  const L = Math.hypot(...d), n = d.map(v => v / L);
  let e1 = Math.abs(n[1]) < 0.9 ? [n[2], 0, -n[0]] : [1, 0, 0];
  const l1 = Math.hypot(...e1); e1 = e1.map(v => v / l1 * r);
  const e2 = [n[1] * e1[2] - n[2] * e1[1], n[2] * e1[0] - n[0] * e1[2], n[0] * e1[1] - n[1] * e1[0]];
  const off = (p, s1, s2) => [p[0] + e1[0] * s1 + e2[0] * s2, p[1] + e1[1] * s1 + e2[1] * s2, p[2] + e1[2] * s1 + e2[2] * s2];
  const k = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; b.quad(off(A, ...k[i]), off(A, ...k[j]), off(B, ...k[j]), off(B, ...k[i]), c); }
}
function ball(b, p, r, c) {
  const [x, y, z] = p, pts = [[r, 0], [0, r], [-r, 0], [0, -r]];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % 4];
    b.tri([x + ax, y, z + az], [x + bx, y, z + bz], [x, y + r, z], c);
    b.tri([x + ax, y, z + az], [x + bx, y, z + bz], [x, y - r, z], sh(c, 0.8));
  }
}

// openings ----------------------------------------------------------------------------------------------------
const archPts = (u0, u1, s, n = 6) => Array.from({ length: n + 1 }, (_, i) => { const a = Math.PI * (1 - i / n), r = (u1 - u0) / 2; return [(u0 + u1) / 2 + Math.cos(a) * r, s + Math.sin(a) * r]; });
function hole(b, P, u0, u1, y0, y1, wf, d, back) {
  const wb = wf - d;
  b.quad(P(u0, y0, wf), P(u0, y0, wb), P(u0, y1, wb), P(u0, y1, wf), REVEAL);
  b.quad(P(u1, y0, wf), P(u1, y0, wb), P(u1, y1, wb), P(u1, y1, wf), REVEAL);
  b.quad(P(u0, y1, wf), P(u1, y1, wf), P(u1, y1, wb), P(u0, y1, wb), sh(REVEAL, 0.7));
  b.quad(P(u0, y0, wf), P(u1, y0, wf), P(u1, y0, wb), P(u0, y0, wb), sh(REVEAL, 1.1));
  rect(b, P, u0, u1, y0, y1, wb, back);
}
function archHole(b, P, u0, u1, y0, y1, wf, d) {
  const wb = wf - d, s = y1 - (u1 - u0) / 2, pts = archPts(u0, u1, s), cu = (u0 + u1) / 2;
  b.quad(P(u0, y0, wf), P(u0, y0, wb), P(u0, s, wb), P(u0, s, wf), REVEAL);
  b.quad(P(u1, y0, wf), P(u1, y0, wb), P(u1, s, wb), P(u1, s, wf), REVEAL);
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, c] = [pts[i], pts[i + 1]];
    b.quad(P(a[0], a[1], wf), P(c[0], c[1], wf), P(c[0], c[1], wb), P(a[0], a[1], wb), sh(REVEAL, 0.75));
    b.tri(P(cu, s, wb), P(a[0], a[1], wb), P(c[0], c[1], wb), GLASS); // fanlight
  }
  // two door leaves with a seam and raised panels
  rect(b, P, u0, u1, y0, s, wb, DOOR);
  rect(b, P, u0, u1, s - 0.12, s, wb + 0.02, sh(DOOR, 1.4));
  rect(b, P, cu - 0.04, cu + 0.04, y0, s, wb + 0.02, sh(DOOR, 0.6));
  for (const [a, c] of [[u0 + 0.18, cu - 0.16], [cu + 0.16, u1 - 0.18]]) for (const [ya, yb] of [[y0 + 0.5, y0 + 2.2], [y0 + 2.6, s - 0.4]]) rect(b, P, a, c, ya, yb, wb + 0.03, sh(DOOR, 1.25));
  // fanlight bars
  for (let i = 1; i < pts.length - 1; i += 2) beamFlat(b, P, cu, s, pts[i][0], pts[i][1], wb + 0.02, 0.05, BAR);
}
function beamFlat(b, P, ua, ya, ub, yb, w, t, c) {
  const dx = ub - ua, dy = yb - ya, L = Math.hypot(dx, dy), nx = -dy / L * t, ny = dx / L * t;
  b.quad(P(ua + nx, ya + ny, w), P(ub + nx, yb + ny, w), P(ub - nx, yb - ny, w), P(ua - nx, ya - ny, w), c);
}

// wall plane between u0..u1, y0..y1 with rows of holes [{y0, y1, holes: [[ua, ub, arch]]}]
function wall(b, P, u0, u1, y0, y1, w, c, rows) {
  let y = y0;
  for (const r of rows) {
    if (r.y0 > y) rect(b, P, u0, u1, y, r.y0, w, c);
    let u = u0;
    for (const [ua, ub, arch] of r.holes) {
      if (ua > u) rect(b, P, u, ua, r.y0, r.y1, w, c);
      if (arch) {
        const pts = archPts(ua, ub, r.y1 - (ub - ua) / 2);
        for (let i = 0; i < pts.length - 1; i++) b.quad(P(pts[i][0], pts[i][1], w), P(pts[i + 1][0], pts[i + 1][1], w), P(pts[i + 1][0], r.y1, w), P(pts[i][0], r.y1, w), c);
      }
      u = ub;
    }
    if (u1 > u) rect(b, P, u, u1, r.y0, r.y1, w, c);
    y = r.y1;
  }
  if (y1 > y) rect(b, P, u0, u1, y, y1, w, c);
}

// framed sash window: recess, glazing bars, stone surround, sill
function windowFull(b, P, u0, u1, y0, y1, w, nh, sill) {
  const p = 0.09, t = 0.17;
  hole(b, P, u0, u1, y0, y1, w + p, 0.42, GLASS);
  const wb = w + p - 0.36, cu = (u0 + u1) / 2;
  rect(b, P, cu - 0.05, cu + 0.05, y0, y1, wb, BAR);
  for (let i = 1; i <= nh; i++) { const y = y0 + (y1 - y0) * i / (nh + 1); rect(b, P, u0, u1, y - 0.05, y + 0.05, wb, BAR); }
  rect(b, P, u0, u1, y0, y0 + 0.1, wb, BAR); rect(b, P, u0, u1, y1 - 0.1, y1, wb, BAR);
  // surround: four bands in front of the wall, with outer edges
  const U0 = u0 - t, U1 = u1 + t, Y0 = y0 - t, Y1 = y1 + t, wf = w + p;
  rect(b, P, U0, U1, y1, Y1, wf, FRAME); rect(b, P, U0, U1, Y0, y0, wf, FRAME);
  rect(b, P, U0, u0, y0, y1, wf, FRAME); rect(b, P, u1, U1, y0, y1, wf, FRAME);
  slab(b, P, U0, U1, Y0, Y1, w, wf, FRAME, 'tlr');
  if (sill) slab(b, P, U0 - 0.12, U1 + 0.12, Y0 - 0.2, Y0, w, w + 0.26, CORN, 'ftblr');
  else slab(b, P, U0, U1, Y0, Y0, w, wf, FRAME, 'b');
}
function windowSimple(b, P, u0, u1, y0, y1, w, sill) {
  hole(b, P, u0, u1, y0, y1, w, 0.35, GLASS);
  const wb = w - 0.3, cu = (u0 + u1) / 2, ym = (y0 + y1) / 2 + (y1 - y0) * 0.12;
  rect(b, P, cu - 0.06, cu + 0.06, y0, y1, wb, BAR); rect(b, P, u0, u1, ym - 0.06, ym + 0.06, wb, BAR);
  if (sill) slab(b, P, u0 - 0.15, u1 + 0.15, y0 - 0.2, y0, w, w + 0.2, CORN, 'ftlr');
}
// hanging garland: a sagging band with two drops
function festoon(b, P, cu, y, w, hw, c) {
  const n = 4, pts = Array.from({ length: n + 1 }, (_, i) => { const t = i / n * 2 - 1; return [cu + t * hw, y - (1 - t * t) * 0.5]; });
  for (let i = 0; i < n; i++) b.quad(P(pts[i][0], pts[i][1], w), P(pts[i + 1][0], pts[i + 1][1], w), P(pts[i + 1][0], pts[i + 1][1] - 0.28, w + 0.08), P(pts[i][0], pts[i][1] - 0.28, w + 0.08), i % 2 ? c : sh(c, 0.9));
  for (const s of [-1, 1]) rect(b, P, cu + s * hw - 0.08, cu + s * hw + 0.08, y - 0.75, y, w + 0.04, sh(c, 0.85));
}
function pilaster(b, P, u, y0, y1, w, full) {
  if (full) {
    slab(b, P, u - 0.45, u + 0.45, y0, y0 + 0.4, w, w + 0.3, PIL, 'flr');
    slab(b, P, u - 0.35, u + 0.35, y0 + 0.4, y1 - 0.95, w, w + 0.22, PIL, 'flr');
    slab(b, P, u - 0.38, u + 0.38, y1 - 0.95, y1 - 0.3, w, w + 0.28, CAP, 'flr');
    rect(b, P, u - 0.3, u + 0.3, y1 - 0.85, y1 - 0.62, w + 0.3, sh(CAP, 0.86)); // acanthus row
    for (const s of [-1, 1]) rect(b, P, u + s * 0.52 - 0.13, u + s * 0.52 + 0.13, y1 - 0.62, y1 - 0.3, w + 0.34, sh(CAP, 1.08)); // volutes
    slab(b, P, u - 0.58, u + 0.58, y1 - 0.3, y1, w, w + 0.42, PIL, 'fblr');
  } else {
    slab(b, P, u - 0.35, u + 0.35, y0, y1 - 0.55, w, w + 0.16, PIL, 'flr');
    slab(b, P, u - 0.48, u + 0.48, y1 - 0.55, y1, w, w + 0.28, CAP, 'fblr');
  }
}
function balustrade(b, P, u0, u1, y, w, posts, full) {
  slab(b, P, u0, u1, y, y + 0.32, w - 0.5, w, CORN, 'ftlr');
  slab(b, P, u0, u1, y + 1.05, y + 1.35, w - 0.55, w + 0.06, CORN, 'ftblr');
  const pw = 0.36;
  for (const p of posts) slab(b, P, p - pw, p + pw, y, y + 1.55, w - 0.6, w + 0.1, PIL, 'ftlr');
  if (!full) { rect(b, P, u0, u1, y + 0.32, y + 1.05, w - 0.35, sh(DECK, 0.9)); return; }
  const all = [u0, ...posts, u1].sort((a, c) => a - c);
  for (let i = 0; i < all.length - 1; i++) {
    const a = all[i] + pw, c = all[i + 1] - pw, n = Math.max(1, Math.round((c - a) / 0.5));
    for (let k = 0; k < n; k++) {
      const u = a + (k + 0.5) * (c - a) / n;
      slab(b, P, u - 0.1, u + 0.1, y + 0.32, y + 1.05, w - 0.35, w - 0.15, PIL, 'flr');
    }
  }
}

// statues -------------------------------------------------------------------------------------------------------
// robed figure about 3.1 m tall standing at the origin of Q, facing +w. kind: peace, prudence, justice
function robed(b, Q, kind, c = BRONZE) {
  tbox(b, Q, 0, 0, 0, 1.7, 0.5, 0.36, 0.3, 0.22, c, false);
  tbox(b, Q, 0, 0, 1.7, 2.45, 0.3, 0.2, 0.34, 0.2, sh(c, 1.08), false);
  tbox(b, Q, 0, 0.02, 2.45, 2.92, 0.15, 0.16, 0.14, 0.15, sh(c, 1.12));
  tbox(b, Q, 0, -0.05, 2.75, 2.98, 0.17, 0.18, 0.12, 0.13, sh(c, 0.85)); // hair
  const sl = [-0.36, 2.35, 0], sr = [0.36, 2.35, 0];
  if (kind === 'peace') {
    beam(b, Q, sr, [0.75, 3.15, 0.15], 0.09, c);
    beam(b, Q, [0.75, 3.1, 0.15], [0.95, 3.9, 0.2], 0.035, '#6b5a35');
    for (const [u, y] of [[0.84, 3.45], [0.92, 3.7], [0.98, 3.95], [0.8, 3.75]]) tbox(b, Q, u, 0.2, y - 0.1, y + 0.1, 0.12, 0.05, 0.06, 0.04, '#5f7d3a');
    beam(b, Q, sl, [-0.5, 1.6, 0.25], 0.09, c);
  } else if (kind === 'prudence') {
    beam(b, Q, sl, [-0.35, 2.55, 0.45], 0.09, c);
    tbox(b, Q, -0.3, 0.5, 2.5, 2.85, 0.16, 0.03, 0.16, 0.03, '#c9c6b0'); // mirror
    beam(b, Q, sr, [0.5, 1.6, 0.2], 0.09, c);
    beam(b, Q, [0.5, 1.6, 0.2], [0.35, 2.1, 0.3], 0.05, '#4f6b3c'); beam(b, Q, [0.35, 2.1, 0.3], [0.55, 2.4, 0.25], 0.05, '#4f6b3c'); // snake
  } else {
    beam(b, Q, sr, [0.6, 3.05, 0.1], 0.09, c);
    beam(b, Q, [0.6, 3.0, 0.1], [0.65, 4.1, 0.1], 0.05, '#d6d3c4'); // sword
    beam(b, Q, [0.45, 3.02, 0.1], [0.75, 3.02, 0.1], 0.04, GOLD);
    beam(b, Q, sl, [-0.75, 2.3, 0.25], 0.09, c);
    beam(b, Q, [-1.15, 2.3, 0.25], [-0.45, 2.3, 0.25], 0.03, GOLD); // scales
    for (const u of [-1.1, -0.5]) { beam(b, Q, [u, 2.3, 0.25], [u, 1.85, 0.25], 0.012, GOLD); tbox(b, Q, u, 0.25, 1.8, 1.86, 0.15, 0.15, 0.12, 0.12, GOLD); }
  }
}
// Atlas, bent under the globe of the heavens
function atlas(b, Q, c = BRONZE) {
  beam(b, Q, [-0.3, 0, 0.1], [-0.3, 0.9, 0.35], 0.16, c); beam(b, Q, [-0.3, 0.9, 0.35], [-0.25, 1.5, 0], 0.17, c);
  beam(b, Q, [0.3, 0, -0.3], [0.32, 0.8, 0.1], 0.16, c); beam(b, Q, [0.32, 0.8, 0.1], [0.25, 1.5, 0], 0.17, c);
  tbox(b, Q, 0, 0.05, 1.4, 2.5, 0.36, 0.22, 0.44, 0.26, sh(c, 1.08), false);
  tbox(b, Q, 0, 0.32, 2.3, 2.7, 0.15, 0.15, 0.14, 0.14, sh(c, 1.12));
  for (const s of [-1, 1]) beam(b, Q, [s * 0.44, 2.4, 0.05], [s * 0.75, 3.3, 0.05], 0.11, c);
  const g = Q(0, 4.2, 0);
  b.frustum(g[0], g[2], 0.9, 1.35, g[1] - 1.1, g[1], 8, c);
  b.frustum(g[0], g[2], 1.35, 0.9, g[1], g[1] + 1.1, 8, sh(c, 1.1));
  b.frustum(g[0], g[2], 1.4, 1.4, g[1] - 0.08, g[1] + 0.08, 8, GOLD);
  b.frustum(g[0], g[2], 0.9, 0.3, g[1] + 1.1, g[1] + 1.35, 8, sh(c, 1.1));
}

// relief figures standing in the tympanum (plane w, protruding 0.35); dir = which way they turn (towards centre)
function reliefFig(b, P, u, y, h, kind, dir, w) {
  const c = RELIEF, f = w + 0.35, s = h;
  if (kind === 'seated') { // the Maid of Amsterdam on her throne
    slab(b, P, u - 0.45 * s, u + 0.45 * s, y, y + 0.9 * s, w, w + 0.2, sh(c, 0.88), 'ftlr');
    slab(b, P, u - 0.3 * s, u + 0.3 * s, y, y + 0.3 * s, w, f, c, 'ftlr');
    slab(b, P, u - 0.22 * s, u + 0.22 * s, y + 0.3 * s, y + 0.5 * s, w, f + 0.1, c, 'ftlr');
    slab(b, P, u - 0.17 * s, u + 0.17 * s, y + 0.5 * s, y + 0.8 * s, w, f, c, 'ftlr');
    slab(b, P, u - 0.08 * s, u + 0.08 * s, y + 0.81 * s, y + 0.97 * s, w, f, c, 'ftlr');
    slab(b, P, u - 0.09 * s, u + 0.09 * s, y + 0.97 * s, y + 1.04 * s, w, f, GOLD, 'ftlr');
    beam(b, P, [u + 0.17 * s, y + 0.75 * s, f - 0.15], [u + 0.4 * s, y + 0.98 * s, f - 0.1], 0.08, c);
  } else if (kind === 'stand') {
    slab(b, P, u - 0.14 * s, u + 0.14 * s, y, y + 0.55 * s, w, f, c, 'ftlr');
    slab(b, P, u - 0.12 * s, u + 0.12 * s, y + 0.55 * s, y + 0.85 * s, w, f, c, 'ftlr');
    slab(b, P, u - 0.06 * s + dir * 0.03 * s, u + 0.06 * s + dir * 0.03 * s, y + 0.86 * s, y + s, w, f, c, 'ftlr');
    beam(b, P, [u + dir * 0.1 * s, y + 0.8 * s, f - 0.15], [u + dir * 0.4 * s, y + 0.7 * s, f - 0.1], 0.07, c);
    slab(b, P, u + dir * 0.42 * s - 0.12, u + dir * 0.42 * s + 0.12, y + 0.6 * s, y + 0.75 * s, w, f + 0.05, sh(c, 0.92), 'ftlr'); // offering
  } else { // reclining sea god / triton with a curled tail
    slab(b, P, Math.min(u, u - dir * 0.9 * s), Math.max(u, u - dir * 0.9 * s), y, y + 0.22 * s, w, f, c, 'ftlr');
    slab(b, P, u - 0.1 * s, u + 0.1 * s, y + 0.22 * s, y + 0.55 * s, w, f, c, 'ftlr');
    slab(b, P, u - 0.07 * s, u + 0.07 * s, y + 0.56 * s, y + 0.72 * s, w, f, c, 'ftlr');
    slab(b, P, u - dir * 0.9 * s - 0.15, u - dir * 0.9 * s + 0.15, y + 0.15 * s, y + 0.38 * s, w, f, sh(c, 0.9), 'ftlr');
    beam(b, P, [u + dir * 0.08 * s, y + 0.5 * s, f - 0.1], [u + dir * 0.4 * s, y + 0.62 * s, f - 0.1], 0.06, c);
  }
}

// one facade -----------------------------------------------------------------------------------------------------
const ROWS = { g: [2.5, 7.4], m1: [8.9, 10.8], t: [15.4, 21.4], m2: [22.8, 24.6] };
const TOP = 28, APEX = 35;

function facade(b, P, segs, full) {
  for (let si = 0; si < segs.length; si++) {
    const s = segs[si], { u0, u1, w, n } = s, B = (u1 - u0) / n;
    const first = si === 0, last = si === segs.length - 1;
    const ex = p => [u0 - (first ? p : 0), u1 + (last ? p : 0)];
    const cxs = Array.from({ length: n }, (_, i) => u0 + (i + 0.5) * B);
    const w1 = 1.5, w2 = 1.6, dw = 2.0;
    const span = ww => cxs.map(c => [c - ww / 2, c + ww / 2]);
    const rows = [
      s.doors ? { y0: 0.25, y1: 6.6, holes: cxs.map(c => [c - dw / 2, c + dw / 2, true]) } : { y0: ROWS.g[0], y1: ROWS.g[1], holes: span(w1) },
      { y0: ROWS.m1[0], y1: ROWS.m1[1], holes: span(w1) },
      { y0: ROWS.t[0], y1: ROWS.t[1], holes: span(w2) },
      { y0: ROWS.m2[0], y1: ROWS.m2[1], holes: span(w2) },
    ];
    wall(b, P, u0, u1, 0, TOP, w, WALL, rows);
    // return wall to the next segment
    if (!last && segs[si + 1].w !== w) { const w2_ = segs[si + 1].w; b.quad(P(u1, 0, w), P(u1, 0, w2_), P(u1, TOP, w2_), P(u1, TOP, w), WALL); }

    // plinth (broken by the doors) and its moulding
    const [e0, e1] = ex(0.26);
    const plinthRuns = s.doors ? [[e0, cxs[0] - dw / 2 - 0.28], ...cxs.slice(0, -1).map((c, i) => [c + dw / 2 + 0.28, cxs[i + 1] - dw / 2 - 0.28]), [cxs[n - 1] + dw / 2 + 0.28, e1]] : [[e0, e1]];
    for (const [a, c] of plinthRuns) { slab(b, P, a, c, 0, 1.2, w - 0.3, w + 0.18, PLINTH, 'ftlr'); slab(b, P, a, c, 1.15, 1.38, w - 0.3, w + 0.26, CORN, 'ftblr'); }
    if (s.doors) slab(b, P, u0 - 0.6, u1 + 0.6, 0, 0.25, w, w + 0.95, sh(PLINTH, 1.1), 'ftlr'); // step

    // windows and doors
    for (let i = 0; i < n; i++) {
      const c = cxs[i];
      if (s.doors) {
        archHole(b, P, c - dw / 2, c + dw / 2, 0.25, 6.6, w + 0.1, 0.55);
        const sp = 6.6 - dw / 2, pts = archPts(c - dw / 2 - 0.26, c + dw / 2 + 0.26, sp), inner = archPts(c - dw / 2, c + dw / 2, sp);
        for (let k = 0; k < pts.length - 1; k++) b.quad(P(inner[k][0], inner[k][1], w + 0.1), P(inner[k + 1][0], inner[k + 1][1], w + 0.1), P(pts[k + 1][0], pts[k + 1][1], w + 0.1), P(pts[k][0], pts[k][1], w + 0.1), FRAME);
        for (const sgn of [-1, 1]) slab(b, P, c + sgn * (dw / 2 + 0.13) - 0.13, c + sgn * (dw / 2 + 0.13) + 0.13, 0.25, sp, w, w + 0.1, FRAME, 'flr');
        slab(b, P, c - 0.22, c + 0.22, 6.35, 7.0, w, w + 0.22, CAP, 'ftblr'); // keystone
      } else if (full) windowFull(b, P, c - w1 / 2, c + w1 / 2, ROWS.g[0], ROWS.g[1], w, 2, true);
      else windowSimple(b, P, c - w1 / 2, c + w1 / 2, ROWS.g[0], ROWS.g[1], w, true);
      if (full) {
        windowFull(b, P, c - w1 / 2, c + w1 / 2, ROWS.m1[0], ROWS.m1[1], w, 1, false);
        windowFull(b, P, c - w2 / 2, c + w2 / 2, ROWS.t[0], ROWS.t[1], w, 2, true);
        windowFull(b, P, c - w2 / 2, c + w2 / 2, ROWS.m2[0], ROWS.m2[1], w, 1, false);
        festoon(b, P, c, 8.45, w + 0.05, 0.85, FEST);
        festoon(b, P, c, 22.45, w + 0.05, 0.85, FEST);
      } else {
        windowSimple(b, P, c - w1 / 2, c + w1 / 2, ROWS.m1[0], ROWS.m1[1], w, false);
        windowSimple(b, P, c - w2 / 2, c + w2 / 2, ROWS.t[0], ROWS.t[1], w, true);
        windowSimple(b, P, c - w2 / 2, c + w2 / 2, ROWS.m2[0], ROWS.m2[1], w, false);
      }
    }
    // pilasters of the two orders
    const pils = [u0 + 0.42, ...Array.from({ length: n - 1 }, (_, k) => u0 + (k + 1) * B), u1 - 0.42];
    for (const u of pils) { pilaster(b, P, u, 1.38, 12.6, w, full); pilaster(b, P, u, 14.2, 25.6, w, full); }

    // entablatures
    let [a, c] = ex(0.45); slab(b, P, a, c, 12.6, 13.1, w - 0.3, w + 0.44, CORN, 'ftblr');
    [a, c] = ex(0.55); slab(b, P, a, c, 13.5, 13.8, w - 0.3, w + 0.55, CORN, 'ftblr');
    [a, c] = ex(0.8); slab(b, P, a, c, 13.8, 14.25, w - 0.3, w + 0.8, CORN, 'ftblr');
    [a, c] = ex(0.45); slab(b, P, a, c, 25.6, 26.15, w - 0.3, w + 0.44, CORN, 'ftblr');
    [a, c] = ex(0.55); slab(b, P, a, c, 26.85, 27.15, w - 0.3, w + 0.55, sh(CORN, 0.92), 'ftblr');
    [a, c] = ex(0.8); slab(b, P, a, c, 27.15, 27.55, w - 0.3, w + 0.8, CORN, 'ftblr');
    [a, c] = ex(1.0); slab(b, P, a, c, 27.55, TOP, w - 0.3, w + 1.0, CORN, 'ftblr');
    if (full) for (let x = u0 + 0.3; x < u1 - 0.2; x += 0.7) rect(b, P, x - 0.14, x + 0.14, 26.85 - 0.24, 26.85, w + 0.3, sh(CORN, 0.95)); // dentils

    if (s.ped) pediment(b, P, s, full);
    else { [a, c] = ex(0.25); balustrade(b, P, a, c, TOP, w + 0.25, pils, full || s.balusters); }
  }
}

function pediment(b, P, s, full) {
  const { u0, u1, w } = s, uc = (u0 + u1) / 2, hw = (u1 - u0) / 2;
  const yAt = u => TOP + (APEX - TOP) * (1 - Math.abs(u - uc) / (hw + 0.6));
  b.tri(P(u0 - 0.6, TOP, w), P(u1 + 0.6, TOP, w), P(uc, APEX, w), TYMP);
  for (const [ua, ub] of [[u0 - 0.6, uc], [u1 + 0.6, uc]]) {
    rake(b, P, ua, TOP + 0.05, ub, APEX + 0.05, 0.55, w - 0.3, w + 0.55, sh(CORN, 0.92));
    rake(b, P, ua + (ua < uc ? -0.3 : 0.3), TOP + 0.6, ub, APEX + 0.6, 0.55, w - 0.3, w + 1.0, CORN);
  }
  // relief: the Maid of Amsterdam enthroned, sea gods and tritons bringing the riches of the sea
  const base = TOP + 0.05;
  reliefFig(b, P, uc, base, 4.3, 'seated', 0, w);
  for (const d of [-1, 1]) {
    reliefFig(b, P, uc + d * 2.4, base, 3.7, 'stand', -d, w);
    reliefFig(b, P, uc + d * 4.2, base, 3.0, 'stand', -d, w);
    reliefFig(b, P, uc + d * 6.3, base, 2.4, 'lie', -d, w);
    reliefFig(b, P, uc + d * 8.9, base, 1.6, 'lie', -d, w);
    // a dolphin in the corner
    slab(b, P, uc + d * 10.6 - 0.5, uc + d * 10.6 + 0.5, base, base + 0.45, w, w + 0.3, RELIEF, 'ftlr');
  }
  // statues on pedestals at the apex and both corners
  const front = s.front;
  slab(b, P, uc - 0.8, uc + 0.8, APEX, APEX + 0.9, w - 0.6, w + 0.6, PIL, 'ftlr');
  if (front) robed(b, sub(P, uc, APEX + 0.9, w - 0.5), 'peace');
  else atlas(b, sub(P, uc, APEX + 0.9, w - 0.9));
  for (const d of [-1, 1]) {
    const u = uc + d * (hw - 0.1);
    slab(b, P, u - 0.8, u + 0.8, TOP, TOP + 1.6, w - 0.6, w + 0.7, PIL, 'ftlr');
    slab(b, P, u - 0.9, u + 0.9, TOP + 1.6, TOP + 1.85, w - 0.7, w + 0.8, CORN, 'ftblr');
    if (front) robed(b, sub(P, u, TOP + 1.85, w - 0.2), d < 0 ? 'prudence' : 'justice');
    else ball(b, P(u, TOP + 2.6, w), 0.6, BRONZE);
  }
  if (front && full) { // the balcony over the middle door
    const c = uc;
    slab(b, P, c - 1.6, c + 1.6, 14.2, 14.45, w, w + 1.05, CORN, 'ftblr');
    for (let k = 0; k < 7; k++) { const u = c - 1.35 + k * 0.45; slab(b, P, u - 0.06, u + 0.06, 14.45, 15.3, w + 0.85, w + 0.97, '#2c2a26', 'flr'); }
    slab(b, P, c - 1.6, c + 1.6, 15.3, 15.42, w, w + 1.05, '#2c2a26', 'ftblr');
  }
}

// roofs, courtyards and the cupola --------------------------------------------------------------------------------
function roofs(b) {
  const eave = TOP, ridge = TOP + 5.5;
  // lead deck behind the balustrade
  b.quad([-38.7, eave - 0.02, 25], [38.7, eave - 0.02, 25], [38.7, eave - 0.02, 27.5], [-38.7, eave - 0.02, 27.5], DECK);
  b.quad([-38.7, eave - 0.02, -25], [38.7, eave - 0.02, -25], [38.7, eave - 0.02, -27.5], [-38.7, eave - 0.02, -27.5], DECK);
  b.quad([36.5, eave - 0.02, -25], [38.7, eave - 0.02, -25], [38.7, eave - 0.02, 25], [36.5, eave - 0.02, 25], DECK);
  b.quad([-36.5, eave - 0.02, -25], [-38.7, eave - 0.02, -25], [-38.7, eave - 0.02, 25], [-36.5, eave - 0.02, 25], DECK);
  // ring of wing roofs around the two courtyards: outer slopes, then inner slopes down to the courtyards
  const O = [36.5, 25], R = [30.5, 19], I = [24.5, 13];
  const ring = (r, y) => [[-r[0], y, r[1]], [r[0], y, r[1]], [r[0], y, -r[1]], [-r[0], y, -r[1]]];
  const o = ring(O, eave), rr = ring(R, ridge), ii = ring(I, eave);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    b.quad(o[i], o[j], rr[j], rr[i], i % 2 ? ROOF : ROOF2);
    b.quad(rr[i], rr[j], ii[j], ii[i], i % 2 ? ROOF2 : ROOF);
  }
  // ridge cappings
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; b.quad(rr[i], rr[j], [rr[j][0], ridge + 0.25, rr[j][2]], [rr[i][0], ridge + 0.25, rr[i][2]], sh(ROOF, 0.8)); }
  // the long roof of the Burgerzaal from pediment to pediment
  const hw = 11.75, z = 27.4;
  for (const s of [-1, 1]) b.quad([s * hw, eave, -z], [s * hw, eave, z], [0, APEX, z], [0, APEX, -z], s < 0 ? ROOF2 : ROOF);
  b.quad([0, APEX, -z], [0, APEX, z], [0, APEX + 0.3, z], [0, APEX + 0.3, -z], sh(ROOF, 0.8));
  // courtyards: walls with rows of windows, paving
  for (const s of [-1, 1]) {
    const x0 = s * hw, x1 = s * I[0];
    const r = [[Math.min(x0, x1), -I[1]], [Math.max(x0, x1), -I[1]], [Math.max(x0, x1), I[1]], [Math.min(x0, x1), I[1]]];
    b.walls(r, 0, eave, COURT, true);
    b.cap(r, 0.03, PAVING);
  }
  // standing seams of the lead sheets
  const seam = (p0, p1, ax) => { const d = ax ? [0, 0, 0.06] : [0.06, 0, 0]; b.quad([p0[0] - d[0], p0[1] + 0.05, p0[2] - d[2]], [p0[0] + d[0], p0[1] + 0.05, p0[2] + d[2]], [p1[0] + d[0], p1[1] + 0.05, p1[2] + d[2]], [p1[0] - d[0], p1[1] + 0.05, p1[2] - d[2]], sh(ROOF, 0.82)); };
  for (const s of [-1, 1]) {
    for (let x = -29.4; x <= 29.5; x += 2.45) if (Math.abs(x) > hw + 0.3) {
      seam([x, eave, s * O[1]], [x, ridge, s * R[1]], false);
      if (Math.abs(x) < I[0] - 0.3) seam([x, ridge, s * R[1]], [x, eave, s * I[1]], false);
    }
    for (let z = -17.2; z <= 17.3; z += 2.45) {
      seam([s * O[0], eave, z], [s * R[0], ridge, z], true);
      if (Math.abs(z) < I[1] - 0.3) seam([s * R[0], ridge, z], [s * I[0], eave, z], true);
    }
    for (let z = -26.2; z <= 26.3; z += 2.45) if (Math.abs(z) > 6.2) seam([s * hw, eave, z], [0, APEX, z], true);
  }
  // little lead dormers on the outer slopes
  const dormer = (P) => {
    const y = eave + 2.2, t = 2.75; // slope position: front 2.4 m up the roof
    for (const s of [-1, 1]) b.tri(P(s * 0.75, y, 0), P(s * 0.75, y + 1.5, 0), P(s * 0.75, y + 1.5, -1.6), sh(ROOF, 0.9));
    rect(b, P, -0.75, 0.75, y, y + 1.5, 0, sh(ROOF, 1.1));
    rect(b, P, -0.45, 0.45, y + 0.2, y + 1.25, 0.02, GLASS);
    rect(b, P, -0.04, 0.04, y + 0.2, y + 1.25, 0.03, BAR);
    for (const s of [-1, 1]) b.quad(P(s * 0.9, y + 1.45, 0.15), P(0, y + 2.1, 0.15), P(0, y + 2.1, -t), P(s * 0.9, y + 1.45, -t), s < 0 ? ROOF : ROOF2);
    b.tri(P(-0.9, y + 1.45, 0.15), P(0.9, y + 1.45, 0.15), P(0, y + 2.1, 0.15), sh(ROOF, 1.1));
  };
  for (const s of [-1, 1]) {
    for (const x of [-26.5, -21.5, -16.5, 16.5, 21.5, 26.5]) dormer(sub(frame(0, 0, s, 0, 0, s), x * s, 0, O[1] - 2.4));
    for (const z of [-13, -5, 5, 13]) dormer(sub(frame(0, 0, 0, -s, s, 0), z * s, 0, O[0] - 2.4));
  }
}

function cupola(b) {
  // square base rising out of the roofs, with clock faces
  b.box(-5.6, 5.6, -5.6, 5.6, 30, 38.2, WALL, WALL, false);
  b.box(-6.1, 6.1, -6.1, 6.1, 38.2, 38.8, CORN, sh(CORN, 1.05), false);
  b.box(-5.9, 5.9, -5.9, 5.9, 30, 30.6, CORN, CORN, false);
  for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const P = frame(0, 0, nz, -nx, nx, nz);
    for (const u of [-5.3, 5.3]) slab(b, P, u - 0.3, u + 0.3, 30.6, 38.2, 5.6, 5.8, PIL, 'flr');
    const cy = 36.5, n = 12;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      b.tri(P(0, cy, 5.66), P(Math.cos(a0) * 1.5, cy + Math.sin(a0) * 1.5, 5.66), P(Math.cos(a1) * 1.5, cy + Math.sin(a1) * 1.5, 5.66), '#2d3a4a');
      b.tri(P(0, cy, 5.68), P(Math.cos(a0) * 1.27, cy + Math.sin(a0) * 1.27, 5.68), P(Math.cos(a1) * 1.27, cy + Math.sin(a1) * 1.27, 5.68), '#efe9d6');
    }
    for (let k = 0; k < 12; k += 3) { const a = k / 12 * Math.PI * 2; rect(b, P, Math.cos(a) * 1.12 - 0.07, Math.cos(a) * 1.12 + 0.07, cy + Math.sin(a) * 1.12 - 0.07, cy + Math.sin(a) * 1.12 + 0.07, 5.7, '#2d3a4a'); }
    beamFlat(b, P, 0, cy, 0.0, cy + 0.95, 5.72, 0.07, GOLD); beamFlat(b, P, 0, cy, 0.65, cy - 0.35, 5.72, 0.06, GOLD);
  }
  const start = b.pos.length;
  // octagonal drum with arched openings and columns at the corners
  const R = 5.0, ap = R * Math.cos(Math.PI / 8), half = R * Math.sin(Math.PI / 8), y0 = 37.8, y1 = 44.4;
  for (let i = 0; i < 8; i++) {
    const a = (i + 1) * Math.PI / 4, nx = Math.cos(a), nz = Math.sin(a);
    const P = frame(0, 0, -nz, nx, nx, nz);
    wall(b, P, -half, half, y0, y1, ap, WALL, [{ y0: 38.6, y1: 43.3, holes: [[-0.85, 0.85, true]] }]);
    const wb = ap - 0.7, s = 43.3 - 0.85, pts = archPts(-0.85, 0.85, s);
    b.quad(P(-0.85, 38.6, ap), P(-0.85, 38.6, wb), P(-0.85, s, wb), P(-0.85, s, ap), REVEAL);
    b.quad(P(0.85, 38.6, ap), P(0.85, 38.6, wb), P(0.85, s, wb), P(0.85, s, ap), REVEAL);
    rect(b, P, -0.85, 0.85, 38.6, s, wb, '#1f242b');
    for (let k = 0; k < pts.length - 1; k++) {
      b.quad(P(pts[k][0], pts[k][1], ap), P(pts[k + 1][0], pts[k + 1][1], ap), P(pts[k + 1][0], pts[k + 1][1], wb), P(pts[k][0], pts[k][1], wb), sh(REVEAL, 0.75));
      b.tri(P(0, s, wb), P(pts[k][0], pts[k][1], wb), P(pts[k + 1][0], pts[k + 1][1], wb), '#1f242b');
    }
    slab(b, P, -1.2, 1.2, 38.3, 38.6, ap, ap + 0.25, CORN, 'ftblr'); // balustrade sill
    for (let k = 0; k < 4; k++) { const u = -0.65 + k * 0.43; slab(b, P, u - 0.07, u + 0.07, 38.6, 39.5, ap - 0.1, ap + 0.02, PIL, 'flr'); }
    slab(b, P, -0.95, 0.95, 39.5, 39.65, ap - 0.15, ap + 0.08, CORN, 'ftb');
    slab(b, P, -0.15, 0.15, 42.9, 43.55, ap, ap + 0.18, CAP, 'ftblr'); // keystone
  }
  for (let i = 0; i < 8; i++) { // paired columns at every corner of the octagon
    const a = Math.PI / 8 + i * Math.PI / 4;
    for (const d of [-0.11, 0.11]) {
      const x = Math.cos(a + d) * (R + 0.35), z = Math.sin(a + d) * (R + 0.35);
      b.frustum(x, z, 0.24, 0.2, y0, y1 - 0.5, 5, PIL);
      b.box(x - 0.3, x + 0.3, z - 0.3, z + 0.3, y1 - 0.5, y1, CAP, CAP, false);
    }
  }
  b.frustum(0, 0, 5.65, 5.75, y1, y1 + 0.7, 8, CORN);
  b.frustum(0, 0, 5.85, 5.85, y1 + 0.7, y1 + 1.15, 8, sh(CORN, 1.05));
  // copper dome, lantern, ball and weathervane
  const d0 = y1 + 1.15;
  const prof = [[5.35, 0], [5.15, 0.9], [4.55, 2.1], [3.55, 3.2], [2.2, 4.0], [1.15, 4.35]];
  for (let k = 0; k < prof.length - 1; k++) b.frustum(0, 0, prof[k][0], prof[k + 1][0], d0 + prof[k][1], d0 + prof[k + 1][1], 8, k % 2 ? COPPER2 : COPPER);
  for (let i = 0; i < 8; i++) { // ribs
    const a = Math.PI / 8 + i * Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a);
    for (let k = 0; k < prof.length - 1; k++) {
      const P0 = [ca * (prof[k][0] + 0.05), d0 + prof[k][1] + 0.05, sa * (prof[k][0] + 0.05)], P1 = [ca * (prof[k + 1][0] + 0.05), d0 + prof[k + 1][1] + 0.05, sa * (prof[k + 1][0] + 0.05)];
      const tx = -sa * 0.1, tz = ca * 0.1;
      b.quad([P0[0] - tx, P0[1], P0[2] - tz], [P0[0] + tx, P0[1], P0[2] + tz], [P1[0] + tx, P1[1], P1[2] + tz], [P1[0] - tx, P1[1], P1[2] - tz], '#7ab79a');
    }
  }
  const l0 = d0 + 4.35;
  b.frustum(0, 0, 1.15, 1.15, l0, l0 + 1.7, 8, WALL);
  for (let i = 0; i < 8; i++) {
    const a = (i + 1) * Math.PI / 4, nx = Math.cos(a), nz = Math.sin(a), P = frame(0, 0, -nz, nx, nx, nz);
    const ap2 = 1.15 * Math.cos(Math.PI / 8) + 0.01;
    rect(b, P, -0.22, 0.22, l0 + 0.3, l0 + 1.3, ap2, '#1f242b');
    b.tri(P(-0.22, l0 + 1.3, ap2), P(0.22, l0 + 1.3, ap2), P(0, l0 + 1.5, ap2), '#1f242b');
  }
  b.frustum(0, 0, 1.4, 1.4, l0 + 1.7, l0 + 1.95, 8, CORN);
  b.frustum(0, 0, 1.3, 0.75, l0 + 1.95, l0 + 2.6, 8, COPPER);
  b.frustum(0, 0, 0.75, 0.12, l0 + 2.6, l0 + 3.3, 8, COPPER2);
  ball(b, [0, l0 + 3.55, 0], 0.32, GOLD);
  const top = l0 + 3.5;
  b.frustum(0, 0, 0.06, 0.06, top, top + 2.6, 4, GOLD);
  // the cog ship, flat cut-out on the rod
  const V = frame(0, 0, 1, 0, 0, 1), y = top + 1.9;
  b.quad(V(-0.85, y, 0), V(0.85, y, 0), V(0.65, y - 0.35, 0), V(-0.65, y - 0.35, 0), GOLD);
  b.tri(V(-0.85, y, 0), V(-1.0, y + 0.3, 0), V(-0.6, y, 0), GOLD); b.tri(V(0.85, y, 0), V(1.0, y + 0.3, 0), V(0.6, y, 0), GOLD);
  b.quad(V(-0.45, y + 0.2, 0.01), V(0.45, y + 0.2, 0.01), V(0.4, y + 1.0, 0.01), V(-0.4, y + 1.0, 0.01), '#f0cf55');
  b.tri(V(-0.05, y + 1.05, 0.01), V(0.05, y + 1.05, 0.01), V(0.4, y + 1.25, 0.01), '#c43c2c'); // pennant
  // the drum and dome above were laid out from y = 37.8: lift them onto the base and squash them a little
  for (let i = start + 1; i < b.pos.length; i += 3) b.pos[i] = 38.8 + (b.pos[i] - 37.8) * 0.78;
}

export default function build(b) {
  const B = 77.2 / 23; // 23 window axes on the long facades
  const lane = (w0, wp, wr, rDoors, front) => [
    { u0: -38.6, u1: -38.6 + 3 * B, w: wp, n: 3 },
    { u0: -38.6 + 3 * B, u1: -38.6 + 8 * B, w: w0, n: 5 },
    { u0: -38.6 + 8 * B, u1: 38.6 - 8 * B, w: wr, n: 7, doors: rDoors, ped: true, front },
    { u0: 38.6 - 8 * B, u1: 38.6 - 3 * B, w: w0, n: 5 },
    { u0: 38.6 - 3 * B, u1: 38.6, w: wp, n: 3 },
  ];
  // the Dam facade (+z), and the back facade (-z)
  const T = () => b.pos.length / 9, D = globalThis.__DBG ? console.log : () => {}; let t0 = T();
  facade(b, frame(0, 0, 1, 0, 0, 1), lane(26.6, 27.1, 27.4, true, true), true); D('front', T() - t0); t0 = T();
  facade(b, frame(0, 0, -1, 0, 0, -1), lane(26.6, 27.1, 27.4, false, false), false); D('rear', T() - t0); t0 = T();
  // the side facades: corner pavilions and ten plain bays
  const sideB = 10.07 / 3;
  const side = [
    { u0: -27.1, u1: -27.1 + 3 * sideB, w: 38.6, n: 3 },
    { u0: -27.1 + 3 * sideB, u1: 27.1 - 3 * sideB, w: 38.1, n: 10 },
    { u0: 27.1 - 3 * sideB, u1: 27.1, w: 38.6, n: 3 },
  ];
  facade(b, frame(0, 0, 0, -1, 1, 0), side, false);
  facade(b, frame(0, 0, 0, 1, -1, 0), side, false); D('sides', T() - t0); t0 = T();
  roofs(b); D('roofs', T() - t0); t0 = T();
  cupola(b); D('cupola', T() - t0); t0 = T();
}
