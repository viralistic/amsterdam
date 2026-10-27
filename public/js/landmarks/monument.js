// monument: the Nationaal Monument on the Dam (J.J.P. Oud and John Rädecker, 1956). Local metres, +z faces the palace.
// A 22 m tapering travertine pillar with reliefs (howling dogs, four chained men, a woman with a child, rising doves),
// two statues of men at its foot, two lions at the front steps, a round stepped platform and the curved wall with urns.
const TRAV = '#ebe5d6', TRAV2 = '#ddd5c2', RELIEF = '#d2c6a9', STEP = '#cdc5b3', STEP2 = '#c2baa7', PAVE = '#bdb5a3';
const WALL = '#e2dbca', COPING = '#d2cab7', NICHE = '#6f685b', URN = '#a9a08b', IRON = '#4d4a45', DOVE = '#f7f4ec', LION = '#e4ddcc';

const sh = (c, k) => '#' + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(c.slice(i, i + 2), 16) * k))).toString(16).padStart(2, '0')).join('');

// axis-aligned box without a bottom face
function blk(b, x0, x1, y0, y1, z0, z1, c, back = true) {
  b.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], c);
  if (back) b.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], c);
  b.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], sh(c, 0.94));
  b.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], sh(c, 0.94));
  b.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], sh(c, 1.05));
}
// tapered box: bottom half-sizes (hx0, hz0), top (hx1, hz1), centred on (x, z)
function tbox(b, x, z, y0, y1, hx0, hz0, hx1, hz1, c, top = true) {
  const A = [[x - hx0, y0, z - hz0], [x + hx0, y0, z - hz0], [x + hx0, y0, z + hz0], [x - hx0, y0, z + hz0]];
  const B = [[x - hx1, y1, z - hz1], [x + hx1, y1, z - hz1], [x + hx1, y1, z + hz1], [x - hx1, y1, z + hz1]];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; b.quad(A[i], A[j], B[j], B[i], i % 2 ? sh(c, 0.93) : c); }
  if (top) b.quad(B[0], B[1], B[2], B[3], sh(c, 1.05));
}
// square beam between two points
function beam(b, A, B, r, c) {
  const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(...d), n = d.map(v => v / L);
  let e1 = Math.abs(n[1]) < 0.9 ? [n[2], 0, -n[0]] : [1, 0, 0];
  const l1 = Math.hypot(...e1); e1 = e1.map(v => v / l1 * r);
  const e2 = [n[1] * e1[2] - n[2] * e1[1], n[2] * e1[0] - n[0] * e1[2], n[0] * e1[1] - n[1] * e1[0]];
  const off = (p, s1, s2) => [p[0] + e1[0] * s1 + e2[0] * s2, p[1] + e1[1] * s1 + e2[1] * s2, p[2] + e1[2] * s1 + e2[2] * s2];
  const k = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; b.quad(off(A, ...k[i]), off(A, ...k[j]), off(B, ...k[j]), off(B, ...k[i]), i % 2 ? sh(c, 0.92) : c); }
}

// the pillar: tapering from 4.2 x 3.0 m to 3.0 x 2.3 m
const PY0 = 2.3, PY1 = 22, HX0 = 2.1, HZ0 = 1.5, HX1 = 1.5, HZ1 = 1.15;
const hx = y => HX0 + (HX1 - HX0) * (y - PY0) / (PY1 - PY0);
const fz = y => HZ0 + (HZ1 - HZ0) * (y - PY0) / (PY1 - PY0); // front face z at height y

// a box of relief standing proud of the slanted front (s = 1) or back (s = -1) face
function rel(b, x0, x1, y0, y1, d, c, s = 1) {
  const z = fz((y0 + y1) / 2) - 0.05;
  if (s > 0) blk(b, x0, x1, y0, y1, z, z + d, c, false);
  else blk(b, x0, x1, y0, y1, -z - d, -z, c, false);
}

function chainedMan(b, x, y, h, lean) {
  const z = fz(y + h / 2), c = RELIEF;
  rel(b, x - 0.27, x - 0.04, y, y + 0.46 * h, 0.32, c);
  rel(b, x + 0.04, x + 0.27, y, y + 0.46 * h, 0.32, c);
  rel(b, x - 0.31, x + 0.31, y + 0.46 * h, y + 0.8 * h, 0.4, sh(c, 1.03));
  rel(b, x - 0.1, x + 0.1, y + 0.78 * h, y + 0.84 * h, 0.3, c); // neck
  const hx_ = x + lean * 0.06;
  blk(b, hx_ - 0.15, hx_ + 0.15, y + 0.82 * h - 0.08, y + 0.82 * h + 0.3, z + 0.1, z + 0.5, sh(c, 1.04), false); // bowed head
  // arms hanging forward to the bound wrists
  beam(b, [x - 0.33, y + 0.77 * h, z + 0.2], [x - 0.08, y + 0.5 * h, z + 0.55], 0.08, c);
  beam(b, [x + 0.33, y + 0.77 * h, z + 0.2], [x + 0.08, y + 0.5 * h, z + 0.55], 0.08, c);
}

function dog(b, x, y, dir) {
  const c = sh(RELIEF, 0.95);
  rel(b, x - 0.55, x + 0.55, y + 0.45, y + 0.9, 0.4, c); // body
  rel(b, x - 0.5, x - 0.3, y, y + 0.5, 0.3, c); rel(b, x + 0.3, x + 0.5, y, y + 0.5, 0.3, c); // legs
  const z = fz(y + 1) + 0.15;
  beam(b, [x + dir * 0.45, y + 0.8, z], [x + dir * 0.75, y + 1.45, z], 0.18, c); // neck stretched up
  beam(b, [x + dir * 0.75, y + 1.45, z], [x + dir * 0.85, y + 1.95, z + 0.05], 0.11, sh(c, 1.05)); // muzzle, howling
  beam(b, [x - dir * 0.55, y + 0.8, z], [x - dir * 0.8, y + 0.55, z], 0.06, c); // tail
}

function dove(b, x, y, s, flip) {
  const z = fz(y) + 0.2, f = flip ? -1 : 1;
  b.tri([x, y, z + 0.1], [x - 0.6 * s, y + 0.45 * s * f, z + 0.35], [x - 0.15 * s, y - 0.05, z], DOVE);
  b.tri([x, y, z + 0.1], [x + 0.6 * s, y + 0.45 * s * f, z + 0.35], [x + 0.15 * s, y - 0.05, z], sh(DOVE, 0.9));
  b.tri([x, y + 0.25 * s, z + 0.15], [x - 0.08 * s, y - 0.3 * s, z + 0.12], [x + 0.08 * s, y - 0.3 * s, z + 0.12], DOVE);
}

function pillar(b) {
  // foot and shaft
  blk(b, -2.55, 2.55, 1.05, 1.75, -1.95, 1.95, TRAV2);
  blk(b, -2.35, 2.35, 1.75, PY0, -1.75, 1.75, TRAV);
  tbox(b, 0, 0, PY0, PY1, HX0, HZ0, HX1, HZ1, TRAV, false);
  // stone courses on the shaft: thin bands every 2.2 m
  for (let y = PY0 + 2.2; y < PY1 - 1; y += 2.2) {
    const x = hx(y) + 0.02, z = fz(y) + 0.02;
    for (const s of [-1, 1]) {
      b.quad([-x, y, s * z], [x, y, s * z], [x, y + 0.06, s * z], [-x, y + 0.06, s * z], TRAV2);
      b.quad([s * x, y, -z], [s * x, y, z], [s * x, y + 0.06, z], [s * x, y + 0.06, -z], TRAV2);
    }
  }
  tbox(b, 0, 0, PY1, PY1 + 0.45, HX1 + 0.12, HZ1 + 0.12, HX1 + 0.08, HZ1 + 0.08, TRAV2);

  // front relief, bottom to top
  for (const [x, dir] of [[-0.9, -1], [0.9, 1]]) dog(b, x, PY0 + 0.3, dir);
  rel(b, -1.85, 1.85, 4.5, 9.7, 0.03, '#bdb39c'); // shadowed ground behind the men
  rel(b, -0.95, 0.95, 10.4, 15.5, 0.03, '#c8bfa9');
  const men = [-1.35, -0.45, 0.45, 1.35];
  men.forEach((x, i) => chainedMan(b, x, 4.7, 4.6, i < 2 ? 1 : -1));
  const cz = fz(7) + 0.5;
  for (let i = 0; i < 11; i++) { const x = -1.6 + i * 0.32; blk(b, x - 0.12, x + 0.12, 4.7 + 0.5 * 4.6 - (i % 2 ? 0.05 : 0.08), 4.7 + 0.5 * 4.6 + (i % 2 ? 0.05 : 0.08), cz - (i % 2 ? 0.1 : 0.04), cz + (i % 2 ? 0.1 : 0.04), IRON, false); } // the chain
  // woman holding up a child
  const wy = 10.6, wz = fz(13);
  rel(b, -0.55, 0.55, wy, wy + 2.4, 0.45, RELIEF);
  rel(b, -0.42, 0.42, wy + 2.4, wy + 3.5, 0.48, sh(RELIEF, 1.03));
  blk(b, -0.17, 0.17, wy + 3.55, wy + 3.98, wz + 0.1, wz + 0.48, sh(RELIEF, 1.04), false);
  beam(b, [-0.4, wy + 3.3, wz + 0.3], [-0.55, wy + 4.2, wz + 0.45], 0.09, RELIEF);
  beam(b, [0.4, wy + 3.3, wz + 0.3], [0.5, wy + 4.25, wz + 0.45], 0.09, RELIEF);
  blk(b, -0.45, 0.4, wy + 4.2, wy + 4.6, wz + 0.25, wz + 0.65, sh(RELIEF, 1.06), false); // the child
  blk(b, 0.35, 0.6, wy + 4.25, wy + 4.55, wz + 0.3, wz + 0.6, sh(RELIEF, 1.06), false);
  // a frame of tendrils (flames and wreath) around her
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const y = wy + 0.5 + k * 1.05; beam(b, [s * 0.8, y, fz(y) + 0.1], [s * (1.05 - k * 0.05), y + 0.75, fz(y) + 0.15], 0.07, sh(RELIEF, 0.95)); }
  // doves rising to the top
  for (const [x, y, s] of [[-0.6, 16.4, 1], [0.55, 16.9, 0.9], [-0.1, 17.8, 1], [0.7, 18.6, 0.85], [-0.75, 19.0, 0.9], [0.05, 19.9, 1], [0.6, 20.8, 0.8], [-0.5, 21.2, 0.8]]) dove(b, x, y, s * 1.0, (x * 10 | 0) % 2 === 0);

  // back: inscription panel and a small relief of a wreath
  rel(b, -1.2, 1.2, 3.0, 6.2, 0.06, TRAV2, -1);
  for (let k = 0; k < 6; k++) { const y = 3.4 + k * 0.45, z = -fz(y) - 0.12; b.quad([-0.95, y, z], [0.95 - (k % 3) * 0.2, y, z], [0.95 - (k % 3) * 0.2, y + 0.14, z], [-0.95, y + 0.14, z], '#8d8574'); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, y = 9 + Math.sin(a) * 0.9, x = Math.cos(a) * 0.9; rel(b, x - 0.22, x + 0.22, y - 0.22, y + 0.22, 0.2, RELIEF, -1); }
}

// free-standing man on a plinth beside the pillar, facing +z
function standingMan(b, x, z, pose) {
  const c = sh(TRAV, 0.97);
  blk(b, x - 0.75, x + 0.75, 1.05, 1.7, z - 0.6, z + 0.6, TRAV2);
  const y = 1.7;
  beam(b, [x - 0.22, y, z], [x - 0.2, y + 1.5, z], 0.19, c);
  beam(b, [x + 0.22, y, z + (pose ? 0.3 : 0)], [x + 0.2, y + 1.5, z], 0.19, c);
  tbox(b, x, z, y + 1.4, y + 2.5, 0.36, 0.24, 0.46, 0.26, sh(c, 1.03));
  tbox(b, x, z + 0.03, y + 2.55, y + 3.0, 0.16, 0.17, 0.15, 0.16, sh(c, 1.05));
  b.quad([x - 0.06, y + 2.45, z], [x + 0.06, y + 2.45, z], [x + 0.06, y + 2.52, z], [x - 0.06, y + 2.52, z], c);
  if (pose) { // fist against the chest, other arm down
    beam(b, [x - 0.4, y + 2.35, z], [x - 0.45, y + 1.55, z + 0.1], 0.09, c);
    beam(b, [x + 0.4, y + 2.35, z], [x + 0.25, y + 1.9, z + 0.35], 0.09, c); beam(b, [x + 0.25, y + 1.9, z + 0.35], [x - 0.05, y + 2.2, z + 0.3], 0.08, c);
  } else { // arms crossed behind, head held up
    beam(b, [x - 0.4, y + 2.35, z], [x - 0.3, y + 1.6, z - 0.2], 0.09, c);
    beam(b, [x + 0.4, y + 2.35, z], [x + 0.3, y + 1.6, z - 0.2], 0.09, c);
  }
}

// recumbent lion on a pedestal, facing +z
function lion(b, x, z, s) {
  blk(b, x - 0.9, x + 0.9, 0, 2.15, z - 1.75, z + 1.75, TRAV2);
  blk(b, x - 1.0, x + 1.0, 2.15, 2.3, z - 1.85, z + 1.85, sh(TRAV2, 1.04));
  const y = 2.3, c = LION;
  tbox(b, x, z - 0.35, y, y + 0.9, 0.55, 1.1, 0.42, 0.95, c); // body
  tbox(b, x, z - 1.2, y, y + 1.0, 0.58, 0.45, 0.45, 0.35, sh(c, 0.97)); // haunch
  for (const d of [-1, 1]) blk(b, x + d * 0.38 - 0.16, x + d * 0.38 + 0.16, y, y + 0.28, z + 0.4, z + 1.55, c); // front paws
  tbox(b, x, z + 0.75, y + 0.3, y + 1.85, 0.72, 0.5, 0.6, 0.42, sh(c, 0.88)); // mane
  blk(b, x - 0.3, x + 0.3, y + 0.85, y + 1.45, z + 0.9, z + 1.4, sh(c, 1.05)); // face
  blk(b, x - 0.18, x + 0.18, y + 0.85, y + 1.15, z + 1.35, z + 1.55, sh(c, 0.95)); // muzzle
  blk(b, x - 0.08, x + 0.08, y + 1.08, y + 1.18, z + 1.5, z + 1.58, '#8e8676'); // nose
  for (const d of [-1, 1]) blk(b, x + d * 0.3 - 0.09, x + d * 0.3 + 0.09, y + 1.6, y + 1.85, z + 0.85, z + 1.0, c); // ears
  beam(b, [x + s * 0.4, y + 0.2, z - 1.55], [x + s * 0.85, y + 0.1, z - 0.6], 0.07, c); // tail along the side
  b.frustum(x + s * 0.88, z - 0.5, 0.14, 0.04, y + 0.05, y + 0.35, 4, sh(c, 0.85));
}

function urn(b, x, z, y) {
  b.frustum(x, z, 0.22, 0.17, y, y + 0.12, 6, URN);
  b.frustum(x, z, 0.17, 0.34, y + 0.12, y + 0.5, 6, URN);
  b.frustum(x, z, 0.34, 0.22, y + 0.5, y + 0.85, 6, sh(URN, 1.06));
  b.frustum(x, z, 0.25, 0.12, y + 0.85, y + 1.05, 6, sh(URN, 0.9));
}

export default function build(b) {
  // round stepped platform with a paved top
  const steps = [[8.6, 0, 0.35, STEP2], [8.0, 0.35, 0.7, STEP], [7.4, 0.7, 1.05, STEP2]];
  for (const [r, y0, y1, c] of steps) b.frustum(0, 0, r, r, y0, y1, 28, c);
  for (let k = 0; k < 28; k += 2) { // paving joints radiating from the pillar
    const a = (k + 0.5) / 28 * Math.PI * 2;
    b.quad([Math.cos(a) * 3, 1.06, Math.sin(a) * 3], [Math.cos(a + 0.012) * 3, 1.06, Math.sin(a + 0.012) * 3], [Math.cos(a + 0.006) * 7.3, 1.06, Math.sin(a + 0.006) * 7.3], [Math.cos(a - 0.006) * 7.3, 1.06, Math.sin(a - 0.006) * 7.3], PAVE);
  }
  for (const r of [4.6, 6.2]) b.frustum(0, 0, r, r, 1.05, 1.065, 28, sh(STEP, 0.97));

  pillar(b);
  standingMan(b, -3.5, 0.5, true);
  standingMan(b, 3.5, 0.5, false);
  lion(b, -4.1, 5.7, -1);
  lion(b, 4.1, 5.7, 1);

  // the curved wall behind, with urns in niches on its inner face and a coping
  const n = 16, RX = 11.6, RZ = 8.85, T = 0.8, H = 3.2;
  const P = (a, r) => [Math.cos(a) * (RX - r), -Math.sin(a) * (RZ - r)];
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n;
    const [o0, o1, i0, i1] = [P(a0, 0), P(a1, 0), P(a0, T), P(a1, T)];
    b.quad([o0[0], 0, o0[1]], [o1[0], 0, o1[1]], [o1[0], H, o1[1]], [o0[0], H, o0[1]], WALL);
    b.quad([i0[0], 0, i0[1]], [i1[0], 0, i1[1]], [i1[0], H, i1[1]], [i0[0], H, i0[1]], sh(WALL, 0.96));
    const [c0, c1, d0, d1] = [P(a0, -0.15), P(a1, -0.15), P(a0, T + 0.15), P(a1, T + 0.15)];
    b.quad([c0[0], H, c0[1]], [c1[0], H, c1[1]], [d1[0], H, d1[1]], [d0[0], H, d0[1]], COPING);
    b.quad([c0[0], H + 0.25, c0[1]], [c1[0], H + 0.25, c1[1]], [d1[0], H + 0.25, d1[1]], [d0[0], H + 0.25, d0[1]], sh(COPING, 1.05));
    b.quad([c0[0], H, c0[1]], [c1[0], H, c1[1]], [c1[0], H + 0.25, c1[1]], [c0[0], H + 0.25, c0[1]], COPING);
    b.quad([d0[0], H, d0[1]], [d1[0], H, d1[1]], [d1[0], H + 0.25, d1[1]], [d0[0], H + 0.25, d0[1]], COPING);
    // a lettered band under the coping on the inner face
    const [t0, t1] = [P(a0, T + 0.01), P(a1, T + 0.01)];
    if (i % 2 === 0) b.quad([t0[0], 2.55, t0[1]], [t1[0], 2.55, t1[1]], [t1[0], 2.7, t1[1]], [t0[0], 2.7, t0[1]], '#9c9483');
    // the poem carved on the outside, in short lines
    if (i > 3 && i < 12) for (let k = 0; k < 4; k++) {
      const y = 1.2 + k * 0.38, [u0, u1] = [P(a0 + 0.02, -0.01), P(a1 - (k % 2 ? 0.06 : 0.02), -0.01)];
      b.quad([u0[0], y, u0[1]], [u1[0], y, u1[1]], [u1[0], y + 0.12, u1[1]], [u0[0], y + 0.12, u0[1]], '#a39b89');
    }
  }
  for (const s of [-1, 1]) { // wall ends
    const [o, i] = [P(s < 0 ? Math.PI : 0, -0.15), P(s < 0 ? Math.PI : 0, T + 0.15)];
    b.quad([o[0], 0, o[1]], [i[0], 0, i[1]], [i[0], H + 0.25, i[1]], [o[0], H + 0.25, o[1]], sh(COPING, 0.95));
  }
  // twelve urns: one for each province and one for the former Dutch East Indies
  for (let k = 0; k < 12; k++) {
    const a = Math.PI * (0.1 + 0.8 * k / 11), da = 0.05;
    const [n0, n1] = [P(a - da, T + 0.02), P(a + da, T + 0.02)];
    b.quad([n0[0], 0.5, n0[1]], [n1[0], 0.5, n1[1]], [n1[0], 2.3, n1[1]], [n0[0], 2.3, n0[1]], NICHE);
    const c = P(a, T + 0.4);
    b.frustum(c[0], c[1], 0.42, 0.42, 0, 0.75, 4, COPING); // pedestal
    urn(b, c[0], c[1], 0.75);
  }
}
