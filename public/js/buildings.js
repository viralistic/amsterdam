// Generic Amsterdam buildings from OpenStreetMap footprints (canal houses and everything else).
// buildBuildings(list, x0, z0) receives a chunk's building list: [height, seed, ring, color?] where ring is a flat
// [x, z, x, z, ...] list in chunk-local metres (add x0/z0 for world coordinates); color is set for interior walls.
// It returns a THREE.Object3D for the whole chunk. See docs/LANDMARKS.md.
import * as THREE from 'three';

const WALLS = ['#6e4130', '#5a3528', '#7d5236', '#64554a', '#8a7b66', '#4a3a31', '#8c5a39', '#3f3a36', '#9b8c74', '#734a3a'];
const ROOFS = ['#3c3734', '#4a3a30', '#7a3a28', '#3a3f45', '#6e3424', '#45403c'];
const hash = (x, z) => { let h = (x * 374761393 + z * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

let material = null;
export function buildBuildings(list, x0, z0) {
  material ??= new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide, map: facadeTexture() });
  return new THREE.Mesh(buildingGeometry(list, x0, z0), material);
}

function buildingGeometry(list, x0, z0) {
  const pos = [], col = [], uv = [];
  const c = new THREE.Color();
  const push = (x, y, z, color, u = 0.01, v = 0.01) => { pos.push(x, y, z); col.push(color.r, color.g, color.b); uv.push(u, v); };
  for (const [h, seed, r, color] of list) {
    let pts = [];
    for (let i = 0; i < r.length - 2; i += 2) pts.push(new THREE.Vector2(r[i] + x0, r[i + 1] + z0));
    if (pts.length < 3) continue;
    // make winding counter-clockwise when seen from above (x right, z down)
    if (THREE.ShapeUtils.area(pts) < 0) pts.reverse();
    const wall = c.set(color || WALLS[seed % WALLS.length]).clone();
    const roof = color ? wall.clone().multiplyScalar(0.7) : c.set(ROOFS[seed % ROOFS.length]).clone();
    let run = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const shade = wall.clone().multiplyScalar(0.92 + 0.08 * hash(i, seed));
      // facade texture repeats every 4 m along the wall and every 3.2 m (one storey) upwards
      const u0 = run / 4, u1 = (run += a.distanceTo(b)) / 4, vt = h / 3.2;
      if (color) { // plain interior and dungeon walls: no windows
        push(a.x, 0, a.y, shade); push(b.x, 0, b.y, shade); push(b.x, h, b.y, shade);
        push(a.x, 0, a.y, shade); push(b.x, h, b.y, shade); push(a.x, h, a.y, shade);
        continue;
      }
      push(a.x, 0, a.y, shade, u0, 0); push(b.x, 0, b.y, shade, u1, 0); push(b.x, h, b.y, shade, u1, vt);
      push(a.x, 0, a.y, shade, u0, 0); push(b.x, h, b.y, shade, u1, vt); push(a.x, h, a.y, shade, u0, vt);
    }
    const box = color ? null : gableBox(pts);
    if (box) {
      // canal-house roof: ridge along the long side, so the gable faces the street
      const { corner, along, short } = box;
      const rh = Math.min(short * 0.55, 7), uh = h / 3.2;
      const [e1, e2, e3, e4] = along === 'u' ? [corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)] : [corner(0, 0), corner(0, 1), corner(1, 1), corner(1, 0)];
      const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const r1 = mid(e1, e4), r2 = mid(e2, e3);
      const P = (p, y) => [p[0], y, p[1]];
      for (const [a, b2, c2, d2] of [[e1, e2, r2, r1], [e4, e3, r2, r1]]) {
        push(...P(a, h), roof); push(...P(b2, h), roof); push(...P(c2, h + rh), roof);
        push(...P(a, h), roof); push(...P(c2, h + rh), roof); push(...P(d2, h + rh), roof);
      }
      for (const [a, r, b2] of [[e1, r1, e4], [e2, r2, e3]]) {
        const w = Math.hypot(b2[0] - a[0], b2[1] - a[1]) / 4;
        push(...P(a, h), wall, 0, uh); push(...P(r, h + rh), wall, w / 2, uh + rh / 3.2); push(...P(b2, h), wall, w, uh);
      }
    } else {
      const tris = THREE.ShapeUtils.triangulateShape(pts, []);
      for (const [i, j, k] of tris) { push(pts[i].x, h, pts[i].y, roof); push(pts[k].x, h, pts[k].y, roof); push(pts[j].x, h, pts[j].y, roof); }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}
// One 4 m x 3.2 m facade bay: brick courses and a white-framed window. Tinted per building by vertex colour.
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

// Minimum-area bounding rectangle. Returns it when the footprint is a narrow, roughly rectangular house.
function gableBox(pts) {
  let area = Math.abs(THREE.ShapeUtils.area(pts)), best = null;
  if (area > 900) return null;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const len = a.distanceTo(b);
    if (len < 0.5) continue;
    const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
    let mnu = Infinity, mxu = -Infinity, mnv = Infinity, mxv = -Infinity;
    for (const p of pts) {
      const u = p.x * ux + p.y * uy, v = -p.x * uy + p.y * ux;
      mnu = Math.min(mnu, u); mxu = Math.max(mxu, u); mnv = Math.min(mnv, v); mxv = Math.max(mxv, v);
    }
    const ra = (mxu - mnu) * (mxv - mnv);
    if (!best || ra < best.ra) best = { ra, ux, uy, mnu, mxu, mnv, mxv };
  }
  if (!best || area / best.ra < 0.85) return null;
  const lu = best.mxu - best.mnu, lv = best.mxv - best.mnv, short = Math.min(lu, lv);
  if (short < 3 || short > 14) return null;
  const { ux, uy, mnu, mnv } = best;
  // corner(fu, fv) with fu, fv in [0, 1] across the rectangle
  const corner = (fu, fv) => { const u = mnu + fu * lu, v = mnv + fv * lv; return [u * ux - v * uy, u * uy + v * ux]; };
  return { corner, along: lu >= lv ? 'u' : 'v', short };
}
